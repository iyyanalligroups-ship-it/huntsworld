import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import PrivateRoute from "@/guard/PrivateRoute";
import HomePageRoute from "./modules/landing/HomePageRoute";
const MerchantRoutes = lazy(() => import("./modules/merchant/MerchantRoute"));
const UserRoutes = lazy(() => import("./modules/commonUser/CommonUserRoute"));
const GrocerySellerRoutes = lazy(() => import("./modules/grocerySeller/GrocerySellerRoute"));
const StudentRoute = lazy(() => import("./modules/student/StudentRoute"));
const ServiceProviderRoute = lazy(() => import("./modules/serviceProvider/ServiceProviderRoute"));

const ChatPage = lazy(() => import("./modules/admin/pages/chat/pages/ChatPage"));
const Unauthorized = lazy(() => import("./staticPages/Unauthorized"));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen text-sm text-gray-500">
    Loading...
  </div>
);

const AppRoutes = () => {
  return (
    <Routes>
      {/* ------------------------------------------------
        PROTECTED ROUTES
        Wrapped in Suspense individually so they don't block the initial app load.
        ------------------------------------------------
      */}
      <Route
        element={
          <PrivateRoute
            allowedRoles={[
              "ADMIN",
              "SUB_ADMIN",
              "MERCHANT",
              "USER",
              "SERVICE_PROVIDER",
              "GROCERY_SELLER",
              "STUDENT",
            ]}
          />
        }
      >
        <Route
          path="/merchant/*"
          element={
            <Suspense fallback={<PageLoader />}>
              <MerchantRoutes />
            </Suspense>
          }
        />
        <Route
          path="/user/*"
          element={
            <Suspense fallback={<PageLoader />}>
              <UserRoutes />
            </Suspense>
          }
        />
        <Route
          path="/baseMember/*"
          element={
            <Suspense fallback={<PageLoader />}>
              <GrocerySellerRoutes />
            </Suspense>
          }
        />
        <Route
          path="/student/*"
          element={
            <Suspense fallback={<PageLoader />}>
              <StudentRoute />
            </Suspense>
          }
        />
        <Route
          path="/service-provider/*"
          element={
            <Suspense fallback={<PageLoader />}>
              <ServiceProviderRoute />
            </Suspense>
          }
        />
        <Route
          path="/chat"
          element={
            <Suspense fallback={<PageLoader />}>
              <ChatPage />
            </Suspense>
          }
        />
      </Route>

      {/* ------------------------------------------------
        PUBLIC ROUTES
        No Suspense here. These render immediately.
        ------------------------------------------------
      */}

      {/* Keep Unauthorized lazy because it's rarely visited */}
      <Route
        path="/unauthorized"
        element={
          <Suspense fallback={<PageLoader />}>
            <Unauthorized />
          </Suspense>
        }
      />

      {/* HomePageRoute catches all other paths ("/*").
         Since it is NOT lazy, it appears in milliseconds.
      */}
      <Route path="/*" element={<HomePageRoute />} />
    </Routes>
  );
};

export default AppRoutes;
