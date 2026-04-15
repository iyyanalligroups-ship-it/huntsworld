// modules/admin/hooks/useChatSidebar.js
import { createContext, useContext, useState, useEffect } from 'react';

const ChatSidebarContext = createContext();

export const ChatSidebarProvider = ({ children }) => {
  const [isChatSidebarOpen, setIsChatSidebarOpen] = useState(() => {
    return window.innerWidth >= 768;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsChatSidebarOpen(window.innerWidth >= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    console.log('Toggle sidebar called, current state:', isChatSidebarOpen);
    setIsChatSidebarOpen((prev) => {
      console.log('New state will be:', !prev);
      return !prev;
    });
  };

  const closeSidebar = () => {
    console.log('Close sidebar called');
    setIsChatSidebarOpen(false);
  };

  return (
    <ChatSidebarContext.Provider value={{ isChatSidebarOpen, toggleSidebar, closeSidebar }}>
      {children}
    </ChatSidebarContext.Provider>
  );
};

export const useChatSidebar = () => {
  const context = useContext(ChatSidebarContext);
  if (!context) {
    return { isChatSidebarOpen: false, toggleSidebar: () => { }, closeSidebar: () => { } };
  }
  return context;
};