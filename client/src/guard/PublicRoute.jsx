import { Outlet, Navigate } from "react-router-dom";

const PublicRoute = () => {
  return sessionStorage.getItem("token")
    ? <Navigate to="/" replace />
    : <Outlet />;
};

export default PublicRoute;
