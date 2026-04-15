import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";

const RegisterContext = createContext();

export function RegisterProvider({ children }) {
  const auth = useContext(AuthContext);
  const user = auth?.user || null;
  const loading = auth?.loading || false;
  console.log(user,'user register context');
  
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (loading) return; // wait for auth check

    if (!user?.user?._id) {
      const timer = setTimeout(() => setIsOpen(true), 2000);
      return () => clearTimeout(timer);
    } else {
      setIsOpen(false);
    }
  }, [user, loading]);

  return (
    <RegisterContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </RegisterContext.Provider>
  );
}

export function useRegisterModal() {
  return useContext(RegisterContext);
}