import { useEffect, useState } from "react";

const useAuth = () => {
  const [role, setRole] = useState(null);

  useEffect(() => {
    // Fetch role from sessionStorage or API
    const userRole = sessionStorage.getItem("userRole") || "common-user";
    setRole(userRole);
  }, []);

  return { role };
};

export default useAuth;
