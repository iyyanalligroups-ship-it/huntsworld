// src/components/PrivateRoute.jsx
import { useContext } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { AuthContext } from "@/modules/landing/context/AuthContext";

const PrivateRoute = ({ allowedRoles }) => {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = user?.user?.role?.role;

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};


export default PrivateRoute;
