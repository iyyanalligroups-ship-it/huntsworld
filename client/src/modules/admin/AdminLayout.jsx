import { Outlet } from "react-router-dom";
import Sidebar from "./layout/Sidebar";
import Header from "./layout/Header";

// Admin-related providers (moved from App.jsx)
import { MerchantProvider } from "./context/MerchantContext";
import { PhoneNotificationProvider } from "./context/PhoneNotificationContext";
import { SidebarProvider } from "./context/SidebarContext";

const AdminLayout = () => {
  return (
    <PhoneNotificationProvider>
      <MerchantProvider>
        <SidebarProvider>
          <div className="admin-layout">
            <Header />
            <div className="content flex">
              <Sidebar />
              <main className="flex-1 p-4 pt-[10px]">
                {/* Show Breadcrumb here */}
                <Outlet />
              </main>
            </div>
          </div>
        </SidebarProvider>
      </MerchantProvider>
    </PhoneNotificationProvider>
  );
};

export default AdminLayout;
