import type { Recipe } from '../types'

const DEFAULT_OLLAMA_URL = 'http://localhost:11434'

export class OllamaService {
    private baseUrl: string

    constructor(baseUrl: string = DEFAULT_OLLAMA_URL) {
        this.baseUrl = baseUrl
    }

    /**
     * Generar receta usando IA local con streaming
     * @param ingredients Lista de ingredientes
     * @param language Idioma (siempre español ahora, mantenido para compatibilidad de API)
     * @param onProgress Callback que se llama con cada chunk de texto recibido
     * @returns La receta completa parseada
     */
    async generateRecipe(
        ingredients: string[],
        language: string = 'es',
        onProgress?: (text: string) => void
    ): Promise<Recipe | null> {
        // language se mantiene para compatibilidad de API pero siempre genera en español
        void language
        try {
            const prompt = this.buildPrompt(ingredients)

            const ollamaPayload = {
                model: 'gpt-oss:20b',
                prompt,
                stream: true, // Habilitar streaming
                options: {
                    temperature: 0.7,
                    top_p: 0.9,
                    num_predict: -1, // -1 significa sin límite de tokens
                    repeat_penalty: 1.05,
                },
            }

            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(ollamaPayload),
                // Sin timeout para streaming, ya que recibimos datos continuamente
            })

            if (!response.ok) {
                const errorText = await response.text().catch(() => response.statusText)
                throw new Error(`Ollama API error (${response.status}): ${errorText}`)
            }

            if (!response.body) {
                throw new Error('No se recibió respuesta del servidor')
            }

            // Leer el stream
            const reader = response.body.getReader()
            const decoder = new TextDecoder()
            let fullText = ''
            let buffer = ''

            try {
                while (true) {
                    const { done, value } = await reader.read()

                    if (done) {
                        break
                    }

                    // Decodificar el chunk
                    buffer += decoder.decode(value, { stream: true })

                    // Procesar líneas completas (Ollama envía JSON por línea)
                    const lines = buffer.split('\n')
                    buffer = lines.pop() || '' // Guardar la línea incompleta

                    for (const line of lines) {
                        if (!line.trim()) continue

                        try {
                            const chunk = JSON.parse(line)

                            // Acumular el texto de respuesta
                            if (chunk.response) {
                                fullText += chunk.response

                                // Llamar al callback de progreso si existe
                                if (onProgress) {
                                    onProgress(fullText)
                                }
                            }

                            // Si hay error en el chunk, lanzarlo
                            if (chunk.error) {
                                throw new Error(chunk.error)
                            }

                            // Si el chunk indica que terminó (done: true)
                            if (chunk.done) {
                                break
                            }
                        } catch (parseError) {
                            // Ignorar errores de parseo de líneas incompletas
                            console.warn('Error parsing chunk:', parseError, 'Line:', line)
                        }
                    }
                }

                // Procesar cualquier buffer restante
                if (buffer.trim()) {
                    try {
                        const chunk = JSON.parse(buffer)
                        if (chunk.response) {
                            fullText += chunk.response
                            if (onProgress) {
                                onProgress(fullText)
                            }
                        }
                    } catch {
                        // Ignorar errores del buffer final
                    }
                }
            } finally {
                reader.releaseLock()
            }

            if (!fullText) {
                throw new Error('Ollama no devolvió ninguna respuesta')
            }

            return this.parseRecipeResponse(fullText)
        } catch (error) {
            console.error('Error generating recipe with Ollama:', error)
            if (error instanceof Error) {
                // Mejorar mensajes de error
                if (error.message.includes('fetch')) {
                    throw new Error(
                        `No se puede conectar a Ollama en ${this.baseUrl}. Verifica que Ollama esté corriendo.`
                    )
                }
                if (error.message.includes('timeout')) {
                    throw new Error('La generación tardó demasiado. Intenta de nuevo.')
                }
            }
            throw error
        }
    }

    private buildPrompt(ingredients: string[]): string {
        // The system instructions handle language automatically
        const ingredientsList = ingredients.length > 0 ? ingredients.join(', ') : ''

        const systemInstructions = `Eres un chef AI de nivel estrella Michelin.

Generas recetas de cocina de alta calidad basadas en la solicitud del usuario y la lista (opcional) de ingredientes o restricciones que proporcionen.

IMPORTANTE: SOLO usa ingredientes que existan en nuestra base de datos local de ingredientes. Si un ingrediente no está en esa base de datos, usa el ingrediente más similar que sí esté disponible. Los nombres de ingredientes deben ser exactamente como aparecen en nuestra base de datos.

Sigue el formato de salida exacto a continuación. No agregues secciones, prefacios, explicaciones, comentarios o notas fuera de este formato.

Usa instrucciones de cocina claras, precisas y prácticas.
Prefiere unidades métricas (g, kg, ml, L).

FORMATO A SEGUIR (DEBE COINCIDIR EXACTAMENTE):

**Recipe:** <título de la receta>

**Portions:** <número de porciones>

**Difficulty:** <Fácil | Medio | Difícil>

---

### **Ingredients**

- <cantidad> <unidad> - <nombre del ingrediente>
- <cantidad> <unidad> - <nombre del ingrediente>
- ...

---

### **Instructions (Spanish)**

1. <paso 1 en español>
2. <paso 2 en español>
3. <paso 3 en español>
...

---

### **Instructions (English)**

1. <step 1 in English>
2. <step 2 in English>
3. <step 3 in English>
...

---

### **Tags**

- <etiqueta 1>
- <etiqueta 2>
- ...

---

### **Estimated Time**

<tiempo total en minutos>.`

        const userRequest = ingredientsList
            ? `Crea una receta creativa y original que incluya estos ingredientes: ${ingredientsList}`
            : 'Crea una receta creativa y original'

        return `${systemInstructions}\n\n${userRequest}`
    }

    private parseRecipeResponse(responseText: string): Recipe | null {
        try {
            const text = responseText.trim()

            // Extraer título: **Recipe:** <title>
            const titleMatch = text.match(/\*\*Recipe:\*\*\s*(.+?)(?=\n|$)/i)
            const title = titleMatch ? titleMatch[1].trim() : 'Receta Generada'

            // Extraer ingredientes: ### **Ingredients** seguido de lista con - <amount> <unit> - <name>
            const ingredients: Array<{
                name: string
                measure: string
            }> = []
            const ingredientsSectionMatch = text.match(/###\s*\*\*Ingredients\*\*\s*\n([\s\S]*?)(?=---|###|$)/i)

            if (ingredientsSectionMatch) {
                const ingredientsText = ingredientsSectionMatch[1]
                // Buscar líneas que empiecen con - y tengan el formato: - <amount> <unit> - <name>
                const ingredientLines = ingredientsText.match(/^-\s*(.+)$/gm) || []

                for (const line of ingredientLines) {
                    // Formato: - <amount> <unit> - <ingredient name>
                    const match = line.match(/^-\s*(\d+(?:\.\d+)?)\s*([a-zA-Z]+)\s*-\s*(.+)$/)
                    if (match) {
                        ingredients.push({
                            name: match[3].trim(),
                            measure: `${match[1].trim()} ${match[2].trim()}`.trim(),
                        })
                    } else {
                        // Formato alternativo: - <ingredient name> (sin cantidad)
                        const simpleMatch = line.match(/^-\s*(.+)$/)
                        if (simpleMatch) {
                            ingredients.push({
                                name: simpleMatch[1].trim(),
                                measure: '',
                            })
                        }
                    }
                }
            }

            // Extraer instrucciones en español: ### **Instructions (Spanish)** seguido de pasos numerados
            let instructionsES = ''
            const instructionsESSectionMatch = text.match(/###\s*\*\*Instructions\s*\(Spanish\)\*\*\s*\n([\s\S]*?)(?=---|###|$)/i)

            if (instructionsESSectionMatch) {
                const instructionsText = instructionsESSectionMatch[1]
                // Extraer pasos numerados (1., 2., etc.)
                const steps = instructionsText.match(/^\d+\.\s*(.+)$/gm) || []
                if (steps.length > 0) {
                    instructionsES = steps.map((step) => step.replace(/^\d+\.\s*/, '')).join('\n\n')
                } else {
                    // Si no hay pasos numerados, usar todo el texto
                    instructionsES = instructionsText.trim()
                }
            }

            // Extraer instrucciones en inglés: ### **Instructions (English)** seguido de pasos numerados
            let instructionsEN = ''
            const instructionsENSectionMatch = text.match(/###\s*\*\*Instructions\s*\(English\)\*\*\s*\n([\s\S]*?)(?=---|###|$)/i)

            if (instructionsENSectionMatch) {
                const instructionsText = instructionsENSectionMatch[1]
                // Extraer pasos numerados (1., 2., etc.)
                const steps = instructionsText.match(/^\d+\.\s*(.+)$/gm) || []
                if (steps.length > 0) {
                    instructionsEN = steps.map((step) => step.replace(/^\d+\.\s*/, '')).join('\n\n')
                } else {
                    // Si no hay pasos numerados, usar todo el texto
                    instructionsEN = instructionsText.trim()
                }
            }

            // Fallback: si no se encontraron instrucciones separadas, buscar formato antiguo
            if (!instructionsES && !instructionsEN) {
                const instructionsSectionMatch = text.match(/###\s*\*\*Instructions\*\*\s*\n([\s\S]*?)(?=---|###|$)/i)
                if (instructionsSectionMatch) {
                    const instructionsText = instructionsSectionMatch[1]
                    const steps = instructionsText.match(/^\d+\.\s*(.+)$/gm) || []
                    if (steps.length > 0) {
                        instructionsES = steps.map((step) => step.replace(/^\d+\.\s*/, '')).join('\n\n')
                    } else {
                        instructionsES = instructionsText.trim()
                    }
                }
            }

            // Extraer tags: ### **Tags** seguido de lista con - <tag>
            const tags: string[] = []
            const tagsSectionMatch = text.match(/###\s*\*\*Tags\*\*\s*\n([\s\S]*?)(?=---|###|$)/i)

            if (tagsSectionMatch) {
                const tagsText = tagsSectionMatch[1]
                const tagLines = tagsText.match(/^-\s*(.+)$/gm) || []
                tags.push(...tagLines.map((line) => line.replace(/^-\s*/, '').trim()).filter(Boolean))
            }

            // Extraer dificultad y porciones para agregar como tags adicionales
            const portionsMatch = text.match(/\*\*Portions:\*\*\s*(\d+)/i)
            const difficultyMatch = text.match(/\*\*Difficulty:\*\*\s*(Easy|Medium|Hard)/i)
            const timeMatch = text.match(/\*\*Estimated Time:\*\*\s*(\d+)/i)

            if (portionsMatch) {
                tags.push(`${portionsMatch[1]} porciones`)
            }
            if (difficultyMatch) {
                tags.push(difficultyMatch[1])
            }
            if (timeMatch) {
                tags.push(`${timeMatch[1]} minutos`)
            }

            // Si no se encontraron ingredientes, intentar extraer de otra forma
            if (ingredients.length === 0) {
                // Buscar cualquier lista con formato de ingredientes
                const fallbackIngredients = text.match(/^-\s*(\d+(?:\.\d+)?)?\s*([a-zA-Z]+)?\s*-?\s*(.+)$/gm)
                if (fallbackIngredients) {
                    for (const line of fallbackIngredients) {
                        const match = line.match(/^-\s*(\d+(?:\.\d+)?)?\s*([a-zA-Z]+)?\s*-?\s*(.+)$/)
                        if (match && match[3]) {
                            ingredients.push({
                                name: match[3].trim(),
                                measure: match[1] && match[2] ? `${match[1]} ${match[2]}`.trim() : '',
                            })
                        }
                    }
                }
            }

            // Si aún no se encontraron instrucciones, usar el texto completo como fallback
            if (!instructionsES && !instructionsEN) {
                instructionsES = text
            }

            // Extraer URLs opcionales: **Image URL:**, **Video URL:**, **Source URL:**
            const imageURLMatch = text.match(/\*\*Image URL:\*\*\s*(.+?)(?=\n|$)/i)
            const videoURLMatch = text.match(/\*\*Video URL:\*\*\s*(.+?)(?=\n|$)/i)
            const sourceURLMatch = text.match(/\*\*Source URL:\*\*\s*(.+?)(?=\n|$)/i)

            // Extraer categoría y área si están presentes
            const categoryMatch = text.match(/\*\*Category:\*\*\s*(.+?)(?=\n|$)/i)
            const areaMatch = text.match(/\*\*Area:\*\*\s*(.+?)(?=\n|$)/i)

            return {
                name: title,
                ingredients: ingredients.length > 0 ? ingredients : [],
                instructionsES: instructionsES || text,
                instructionsEN: instructionsEN || undefined,
                tags: tags.length > 0 ? tags : undefined,
                category: categoryMatch ? categoryMatch[1].trim() : '',
                area: areaMatch ? areaMatch[1].trim() : '',
                imageURL: imageURLMatch ? imageURLMatch[1].trim() : undefined,
                videoURL: videoURLMatch ? videoURLMatch[1].trim() : undefined,
                sourceURL: sourceURLMatch ? sourceURLMatch[1].trim() : undefined,
                source: 'ai',
            }
        } catch (error) {
            console.error('Error parsing AI response:', error)
            console.error('Response text:', responseText)

            // Fallback: crear receta básica con el texto recibido
            return {
                name: 'Receta Generada por IA',
                ingredients: [],
                instructionsES: responseText,
                instructionsEN: undefined,
                tags: ['ai-generated'],
                category: '',
                area: '',
                source: 'ai',
            }
        }
    }

    /**
     * Verificar si Ollama está disponible y si el modelo está instalado
     */
    async checkAvailability(): Promise<{
        available: boolean
        error?: string
        modelFound?: boolean
    }> {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000), // 5 segundos timeout
            })

            if (!response.ok) {
                return {
                    available: false,
                    error: `HTTP ${response.status}: ${response.statusText}`,
                    modelFound: false,
                }
            }

            const data = await response.json()
            const models = data.models || []
            const modelNames = models.map((m: { name: string }) => m.name)

            // Buscar el modelo gpt-oss:20b o variantes
            const hasModel = modelNames.some(
                (name: string) => name === 'gpt-oss:20b' || (name.includes('gpt-oss') && name.includes('20b'))
            )

            if (!hasModel) {
                return {
                    available: true, // Ollama está corriendo
                    error: `Modelo 'gpt-oss:20b' no encontrado. Modelos disponibles: ${
                        modelNames.join(', ') || 'ninguno'
                    }. Ejecuta: ollama pull gpt-oss:20b`,
                    modelFound: false,
                }
            }

            return {
                available: true,
                modelFound: true,
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido'

            if (errorMessage.includes('timeout') || errorMessage.includes('fetch')) {
                return {
                    available: false,
                    error: `No se puede conectar a Ollama en ${this.baseUrl}. Verifica que Ollama esté corriendo.`,
                    modelFound: false,
                }
            }

            return {
                available: false,
                error: `Error de conexión: ${errorMessage}`,
                modelFound: false,
            }
        }
    }
}

export const ollamaService = new OllamaService()
