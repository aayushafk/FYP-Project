import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

// Create Modal Context
const ModalContext = createContext()

// Modal Provider Component
export const ModalProvider = ({ children }) => {
  const [modals, setModals] = useState({})

  const openModal = useCallback((modalName, data = {}) => {
    setModals(prev => ({
      ...prev,
      [modalName]: {
        isOpen: true,
        data
      }
    }))
  }, [])

  const closeModal = useCallback((modalName) => {
    setModals(prev => ({
      ...prev,
      [modalName]: {
        isOpen: false,
        data: {}
      }
    }))
  }, [])

  const closeAllModals = useCallback(() => {
    const newModals = {}
    Object.keys(modals).forEach(key => {
      newModals[key] = { isOpen: false, data: {} }
    })
    setModals(newModals)
  }, [modals])

  const isModalOpen = useCallback((modalName) => {
    return modals[modalName]?.isOpen || false
  }, [modals])

  const getModalData = useCallback((modalName) => {
    return modals[modalName]?.data || {}
  }, [modals])

  const value = {
    modals,
    openModal,
    closeModal,
    closeAllModals,
    isModalOpen,
    getModalData
  }

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>
}

// Custom hook to use Modal Context
export const useModal = () => {
  const context = useContext(ModalContext)
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider')
  }
  return context
}

export default ModalContext
