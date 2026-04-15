import React, { useState } from "react";
import settingsMenuItems from "@/modules/student/utils/SettingsMenuItems";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button";

const Settings = () => {
  const [activePage, setActivePage] = useState(settingsMenuItems[0]?.value);
  const activeItem = settingsMenuItems.find((item) => item.value === activePage);
  const navigate = useNavigate();
  return (
    <div
      className={cn(
        "min-h-screen bg-gray-100 p-4 relative"
      )}
    >
      <Button
        type="button"
        onClick={() => navigate(-1)}
        variant="outline"
        className="absolute cursor-pointer top-5 left-8 z-40 hidden md:flex gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Button>
      <div className="flex flex-col mt-12 lg:flex-row bg-white rounded-xl shadow-md overflow-hidden min-h-[80vh]">
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
