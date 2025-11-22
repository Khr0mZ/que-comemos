import { Box, Card, CardMedia, Chip, Divider, IconButton, Skeleton, Typography } from '@mui/material'
import { memo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Recipe } from '../types'

interface RecipeCardProps {
    recipe: Recipe
    onView: (recipe: Recipe) => void
    onEdit?: (recipe: Recipe) => void
    onDelete?: (name: string) => void
    showActions?: boolean
}

function RecipeCard({ recipe, onView, onEdit, onDelete, showActions = true }: RecipeCardProps) {
    const { t } = useTranslation()
    const [imageLoading, setImageLoading] = useState(true)
    const [imageError, setImageError] = useState(false)

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
                <Box sx={{ position: 'relative', width: '100%', height: 200 }}>
                    {imageLoading && !imageError && (
                        <Skeleton
                            variant="rectangular"
                            width="100%"
                            height={200}
                            sx={{ position: 'absolute', top: 0, left: 0 }}
                        />
                    )}
                    <CardMedia
                        component="img"
                        height="200"
                        image={recipe.imageURL}
                        alt={recipe.name}
                        loading="lazy"
                        onLoad={() => setImageLoading(false)}
                        onError={() => {
                            setImageLoading(false)
                            setImageError(true)
                        }}
                        sx={{
                            objectFit: 'cover',
                            display: imageError ? 'none' : 'block',
                        }}
                    />
                    {imageError && (
                        <Box
                            sx={{
                                width: '100%',
                                height: 200,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: 'background.default',
                            }}
                        >
                            <Typography variant="body2" color="text.secondary">
                                🍳
                            </Typography>
                        </Box>
                    )}
                </Box>
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

export default memo(RecipeCard)
