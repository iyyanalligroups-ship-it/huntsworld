import { Outlet } from "react-router-dom";
import Header from "./layout/Header";
import Sidebar from "./layout/Sidebar";
import { SidebarProvider } from "@/modules/admin/context/SidebarContext";

const StudentLayout = () => {
  return (
    <SidebarProvider>
      <div className="admin-layout">
        <Header />
        <div className="content">
          <Sidebar />
          <main>
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default StudentLayout;
