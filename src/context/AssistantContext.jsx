import React, { createContext, useContext, useState } from 'react';

const AssistantContext = createContext();

export function AssistantProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [contextData, setContextData] = useState({
    currentGameId: null,
    currentGameName: null,
    currentGameState: null,
    currentScore: undefined
  });

  const openAssistant = (data = {}) => {
    setContextData(prev => ({ ...prev, ...data }));
    setIsOpen(true);
  };

  const closeAssistant = () => {
    setIsOpen(false);
  };

  return (
    <AssistantContext.Provider value={{ isOpen, contextData, openAssistant, closeAssistant }}>
      {children}
    </AssistantContext.Provider>
  );
}

export function useAssistant() {
  const context = useContext(AssistantContext);
  if (!context) {
    throw new Error('useAssistant must be used within an AssistantProvider');
  }
  return context;
}
