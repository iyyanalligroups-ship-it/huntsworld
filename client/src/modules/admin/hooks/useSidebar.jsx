import { useContext } from 'react';
import { SidebarContext } from '../context/SidebarContext'; // Adjust path as necessary

// Custom hook for using the Sidebar context
export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};
