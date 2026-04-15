// import { useContext, useEffect } from "react";
// import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
// import { AuthContext } from "@/modules/landing/context/AuthContext";

// const roleBasedRoutes = {
//   USER: "/user-dashboard",
//   MERCHANT: "/merchant-dashboard",
//   SERVICE_PROVIDER: "/service-provider-dashboard",
//   SUB_DEALER: "/sub-dealer-dashboard",
//   GROCERY_SELLER: "/grocery-seller-dashboard",
//   STUDENT: "/student-dashboard",
//   ADMIN: "/admin-dashboard",
//   SUB_ADMIN: "/sub-admin-dashboard",
// };

// const AuthRoute = ({ allowedRoles }) => {
//   const { user } = useContext(AuthContext);
//   const navigate = useNavigate();
//   const location = useLocation();

//   useEffect(() => {
//     if (user) {
//       // If user is logged in but trying to access the login page, redirect to dashboard
//       if (location.pathname === "/login") {
//         navigate(roleBasedRoutes[user.role.role] || "/");
//       }

//       // If user tries to access unauthorized module, redirect to their own dashboard
//       if (!allowedRoles.includes(user.role.role)) {
//         navigate(roleBasedRoutes[user.role.role] || "/");
//       }
//     }
//   }, [user, navigate, location, allowedRoles]);

//   return user ? <Outlet /> : <Navigate to="/login" state={{ from: location }} />;
// };

// export default AuthRoute;
