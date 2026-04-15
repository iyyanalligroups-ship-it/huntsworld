import React, { useState } from "react";
import settingsMenuItems from "@/modules/merchant/utils/SettingsMenuItems";
import { useSidebar } from "@/modules/admin/hooks/useSidebar";
import { cn } from "@/lib/utils"; // ShadCN utility for className merge

const Settings = () => {
  const { isSidebarOpen } = useSidebar();
  const [activePage, setActivePage] = useState(settingsMenuItems[0]?.value);
  const activeItem = settingsMenuItems.find((item) => item.value === activePage);

  return (
    <div
      className={cn(
        `${isSidebarOpen ? "lg:ml-56" : "lg:ml-16"}`,
        "min-h-screen bg-gray-100 p-4"
      )}
    >
      <div className="flex flex-col lg:flex-row bg-white rounded-xl shadow-md overflow-hidden min-h-[80vh]">
        {/* Sidebar / Top Tabs */}
        <aside className="w-full lg:w-[220px] border-b lg:border-b-0 lg:border-r bg-gray-50 p-2 lg:p-4 flex lg:block overflow-x-auto space-x-2 lg:space-x-0 lg:space-y-2">
          {settingsMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.value;

            return (
              <button
                key={item.value}
                onClick={() => setActivePage(item.value)}
                className={cn(
                  "flex-shrink-0 flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer whitespace-nowrap",
                  isActive
                    ? "bg-yellow-100 text-yellow-900"
                    : "hover:bg-gray-200 text-gray-800"
                )}
              >
                {Icon && <Icon className="w-4 h-4 mr-2" />}
                {item.label}
              </button>
            );
          })}
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4">{activeItem?.component}</main>
      </div>
    </div>
  );
};

export default Settings;
