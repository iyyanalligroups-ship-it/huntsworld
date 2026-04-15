import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import ChatWindow from "../components/ChatWindow";
import { useSidebar } from "@/modules/admin/hooks/useSidebar";

export default function ChatPage() {
  const { isSidebarOpen } = useSidebar();

  return (
    <div className={`${isSidebarOpen ? "p-6 lg:ml-56" : "p-4 lg:ml-16"} flex h-[90vh]`}>
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Header />
        <ChatWindow />
      </div>
    </div>
  );
}
