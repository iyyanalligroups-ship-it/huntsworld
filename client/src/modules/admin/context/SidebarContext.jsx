import React, { createContext, useState,useContext  } from 'react';

// Create the Context
const SidebarContext = createContext();

// Create a Provider Component
export const SidebarProvider = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <SidebarContext.Provider value={{ isSidebarOpen, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
};

// Export the context for use in other parts of the app
export { SidebarContext };

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    return { isSidebarOpen: false, toggleSidebar: () => { } };
  }
  return context;
};
