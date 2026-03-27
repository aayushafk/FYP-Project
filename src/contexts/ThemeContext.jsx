import React, { createContext, useContext, useState, useCallback } from 'react'

// Create Theme Context
const ThemeContext = createContext()

// Theme Provider Component
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const storedTheme = localStorage.getItem('theme')
    return storedTheme || 'light'
  })

  const [isDark, setIsDark] = useState(theme === 'dark')

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const newTheme = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem('theme', newTheme)
      document.documentElement.classList.toggle('dark')
      setIsDark(newTheme === 'dark')
      return newTheme
    })
  }, [])

  const setCustomTheme = useCallback((themeName) => {
    setTheme(themeName)
    localStorage.setItem('theme', themeName)
    if (themeName === 'dark') {
      document.documentElement.classList.add('dark')
      setIsDark(true)
    } else {
      document.documentElement.classList.remove('dark')
      setIsDark(false)
    }
  }, [])

  const value = {
    theme,
    isDark,
    toggleTheme,
    setCustomTheme
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

// Custom hook to use Theme Context
export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export default ThemeContext
