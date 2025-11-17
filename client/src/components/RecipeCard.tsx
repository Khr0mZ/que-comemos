import { Box, Card, CardMedia, Chip, Divider, IconButton, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import type { Recipe } from '../types'

interface RecipeCardProps {
    recipe: Recipe
    onView: (recipe: Recipe) => void
    onEdit?: (recipe: Recipe) => void
    onDelete?: (name: string) => void
    showActions?: boolean
}

export default function RecipeCard({ recipe, onView, onEdit, onDelete, showActions = true }: RecipeCardProps) {
    const { t } = useTranslation()

    return (
        <Card
            sx={{
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
            }}
            onClick={() => onView(recipe)}
        >
            {recipe.imageURL && (
                <CardMedia
                    component="img"
                    height="200"
                    image={recipe.imageURL}
                    alt={recipe.name}
                    sx={{ objectFit: 'cover' }}
                />
            )}
            <Box
                sx={{
                    px: 1,
                    py: 1.5,
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                }}
            >
                <Typography variant="h6" component="div" sx={{ mb: 1 }}>
                    {recipe.name}
                </Typography>
                <Box
                    sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 0.5,
                        mb: 1,
                    }}
                >
                    {recipe.category && (
                        <Chip
                            color="primary"
                            label={t(`categories.${recipe.category}`, { defaultValue: recipe.category })}
                            size="small"
                        />
                    )}
                    {recipe.area && (
                        <Chip
                            color="secondary"
                            label={t(`areas.${recipe.area}`, { defaultValue: recipe.area })}
                            size="small"
                        />
                    )}
                    {recipe.tags &&
                        recipe.tags.length > 0 &&
                        recipe.tags.map((tag) => (
                            <Chip key={tag} color="info" label={t(`tags.${tag}`, { defaultValue: tag })} size="small" />
                        ))}
                </Box>
            </Box>
            {showActions && (onEdit || onDelete) && (
                <Box
                    sx={{
                        mt: 'auto',
                    }}
                >
                    <Divider />
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', p: 1 }}>
                        {onEdit && (
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onEdit(recipe)
                                }}
                                sx={{ fontSize: '1.3rem' }}
                            >
                                ✏️
                            </IconButton>
                        )}
                        {onDelete && (
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onDelete(recipe.name)
                                }}
                                sx={{ fontSize: '1.3rem' }}
                            >
                                🗑️
                            </IconButton>
                        )}
                    </Box>
                </Box>
            )}
        </Card>
    )
}
