import { createContext } from 'react'

interface SnackbarContextType {
    showSnackbar: (message: string, severity?: 'success' | 'error' | 'info' | 'warning') => void
}

export const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined)

