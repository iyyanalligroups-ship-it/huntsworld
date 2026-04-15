import { Outlet } from "react-router-dom";
import Header from "./layout/Header";
import Sidebar from "./layout/Sidebar";

// Admin-related providers (moved from App.jsx)
import { MerchantProvider } from "@/modules/admin/context/MerchantContext";
import { PhoneNotificationProvider } from "@/modules/admin/context/PhoneNotificationContext";

const SubAdminLayout = () => {
  return (
    <PhoneNotificationProvider>
      <MerchantProvider>
        <div className="admin-layout">
          <Header />
          <div className="content">
            <Sidebar />
            <main>
              <Outlet />
            </main>
          </div>
        </div>
      </MerchantProvider>
    </PhoneNotificationProvider>
  );
};

export default SubAdminLayout;
