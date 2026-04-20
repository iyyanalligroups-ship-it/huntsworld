import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import ChatWindow from "../components/ChatWindow";
import { useSidebar } from "@/modules/admin/context/SidebarContext";
import { cn } from "@/lib/utils";
import { useSelectedUser } from "@/modules/admin/context/SelectedUserContext";

export default function ChatPage() {
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const [selectedUser, setSelectedUser] = useState(null);
  const { setSelectedUser: setGlobalSelectedUser } = useSelectedUser();

  useEffect(() => {
    const userIdFromQuery = searchParams.get("userId");
    if (userIdFromQuery) {
      const userObj = { _id: userIdFromQuery };
      setSelectedUser(userObj);
      setGlobalSelectedUser(userObj);
    }
  }, [searchParams, setGlobalSelectedUser]);

  const handleSheetOpenChange = (open) => {
    console.log("Sheet open state:", open);
    setIsSheetOpen(open);
    if (open !== isSidebarOpen) {
      toggleSidebar();
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setGlobalSelectedUser(user);
    if (isSheetOpen) {
      setIsSheetOpen(false);
      toggleSidebar();
    }
    console.log("ChatPage: User selected:", user);
  };

  return (
    <div
      className={cn(
        "flex relative h-screen overflow-hidden transition-all duration-300 bg-slate-50/10",
        isSidebarOpen ? "lg:pl-0" : "lg:pl-0"
      )}
    >
      <Sheet open={isSheetOpen} onOpenChange={handleSheetOpenChange}>
        <SheetContent side="left" className="w-[300px] p-0 border-r-0">
          <Sidebar selectedUser={selectedUser} setSelectedUser={handleUserSelect} />
        </SheetContent>
      </Sheet>

      <div className="hidden lg:block w-[400px] h-full bg-white border-r-[6px] border-[#f8fafc] z-10">
        <Sidebar selectedUser={selectedUser} setSelectedUser={handleUserSelect} />
      </div>

      <div className="flex flex-col flex-1 bg-white overflow-hidden">
        <Header onMenuClick={() => setIsSheetOpen(true)} />
        <ChatWindow selectedUser={selectedUser} />
      </div>
    </div>
  );
}
