import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import ChatWindow from "../components/ChatWindow";
import { useSidebar } from "@/modules/admin/hooks/useSidebar";
import { cn } from "@/lib/utils";

export default function ChatPage() {
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Sync Sheet open state with sidebar toggle on mobile
  const handleSheetOpenChange = (open) => {
    console.log("Sheet open state:", open);
    setIsSheetOpen(open);
    if (open !== isSidebarOpen) {
      toggleSidebar();
    }
  };

  return (
    <div className={cn("flex h-[85vh]", isSidebarOpen ? "p-6 lg:ml-56" : "p-4 lg:ml-16")}>
      {/* Mobile: Hamburger menu to trigger Sheet */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Sheet open={isSheetOpen} onOpenChange={handleSheetOpenChange}>
          <SheetTrigger asChild>
            <button
              className="p-2 rounded-md bg-white hover:bg-gray-200 focus:outline-none shadow-md"
              aria-label="Toggle Sidebar"
            >
              <Menu className="h-6 w-6 text-gray-800" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <Sidebar />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: Sidebar always visible */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Main content area */}
      <div className="flex flex-col flex-1 mt-0 lg:mt-0">
        <Header />
        <ChatWindow />
      </div>
    </div>
  );
}