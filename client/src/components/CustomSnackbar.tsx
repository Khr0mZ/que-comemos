import CloseIcon from '@mui/icons-material/Close'
import { Box, IconButton, Snackbar, SnackbarContent, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import { useCallback, useState } from 'react'
import { SnackbarContext } from '../contexts/SnackbarContext'

interface SnackbarProviderProps {
    children: ReactNode
}

export function SnackbarProvider({ children }: SnackbarProviderProps) {
    const [open, setOpen] = useState(false)
    const [message, setMessage] = useState('')
    const [severity, setSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('info')

    const showSnackbar = useCallback((msg: string, sev: 'success' | 'error' | 'info' | 'warning' = 'info') => {
        setMessage(msg)
        setSeverity(sev)
        setOpen(true)
    }, [])

    const handleClose = () => {
        setOpen(false)
    }

    const getSeverityColor = () => {
        switch (severity) {
            case 'success':
                return '#4caf50'
            case 'error':
                return '#f44336'
            case 'warning':
                return '#ff9800'
            default:
                return '#2196f3'
        }
    }

    const getSeverityIcon = () => {
        switch (severity) {
            case 'success':
                return '✓'
            case 'error':
                return '✕'
            case 'warning':
                return '⚠'
            default:
                return 'ℹ'
        }
    }

    return (
        <SnackbarContext.Provider value={{ showSnackbar }}>
            {children}
            <Snackbar
                open={open}
                autoHideDuration={6000}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                sx={{
                    '& .MuiSnackbar-root': {
                        bottom: '24px',
                    },
                }}
            >
                <SnackbarContent
                    sx={{
                        position: 'relative',
                        overflow: 'hidden',
                        borderRadius: 2,
                        backgroundColor: 'transparent',
                        boxShadow: 'none',
                        minWidth: '300px',
                        maxWidth: '500px',
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundImage: 'url(/dialog.webp)',
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: '100% 100%',
                            backgroundPosition: 'center',
                            zIndex: 0,
                        },
                        '& .MuiSnackbarContent-message': {
                            position: 'relative',
                            zIndex: 1,
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            p: 2,
                        },
                    }}
                    message={
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                width: '100%',
                            }}
                        >
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 24,
                                    height: 24,
                                    borderRadius: '50%',
                                    backgroundColor: getSeverityColor(),
                                    color: 'white',
                                    fontSize: '0.875rem',
                                    fontWeight: 'bold',
                                }}
                            >
                                {getSeverityIcon()}
                            </Box>
                            <Typography
                                variant="body1"
                                sx={{
                                    flex: 1,
                                    whiteSpace: 'pre-line',
                                    color: '#333',
                                    fontWeight: 500,
                                }}
                            >
                                {message}
                            </Typography>
                            <IconButton
                                size="small"
                                onClick={handleClose}
                                sx={{
                                    color: '#666',
                                    '&:hover': {
                                        backgroundColor: 'rgba(0, 0, 0, 0.05)',
                                    },
                                }}
                            >
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </Box>
                    }
                />
            </Snackbar>
        </SnackbarContext.Provider>
    )
}
