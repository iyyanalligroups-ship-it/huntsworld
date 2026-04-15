import "./App.css";
import { BrowserRouter as Router } from "react-router-dom";
import AppRoutes from "./AppRoute";
import { ToastContainer, Bounce } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider, AuthContext } from "./modules/landing/context/AuthContext";
import { useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import RegisterModal from "@/modules/landing/modelLogin/Login";
import MandatoryPhoneModal from "@/modules/landing/modelLogin/MandatoryPhoneModal";

// ✅ NEW: Import ModalProvider
import { ModalProvider } from "./modules/landing/pages/pages/grocerySellerRequirement/ModalContext"; // Adjust path if needed
import { CustomerPhoneNotificationProvider } from "./modules/admin/context/CustomerPhoneNotificationContext";
import { PhoneNotificationProvider } from "./modules/admin/context/PhoneNotificationContext";
import { SidebarProvider } from "./modules/admin/context/SidebarContext";

// Chat Providers
import { SelectedUserProvider } from "./modules/admin/context/SelectedUserContext";
import { SocketProvider } from "./modules/admin/context/SocketContext";
import { UnreadCountProvider } from "./modules/admin/context/UnreadCountContext";
import { ChatSidebarProvider } from "./modules/admin/context/ChatSidebarContext";
import { ActiveUserProvider } from "./modules/admin/context/ActiveUserProvider";

function AppContent() {
  const { user, isLoading } = useContext(AuthContext);
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [hasRendered, setHasRendered] = useState(false);

  // 1️⃣ Mark first render completion
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setHasRendered(true);
    });

    return () => cancelAnimationFrame(raf);
  }, []);

  // 2️⃣ Modal logic (FIXED)
  useEffect(() => {
    if (isLoading || !hasRendered) return;

    // 🚫 Routes where login modal should NOT open
    const disableModalRoutes = [
      "/login",
      "/register",
      "/referral-register",
      "/baseMember", // Important: prevents modal on seller pages
      "/forgot-password",
    ];

    const isModalDisabled = disableModalRoutes.some((path) =>
      location.pathname.startsWith(path)
    );

    // Case A: User Not Logged In -> Show Login Modal
    if (!user?.user?._id && !isModalDisabled) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        setIsPhoneModalOpen(false);
      }, 1200);

      return () => clearTimeout(timer);
    }

    // Case B: User Logged In but Phone Missing -> Show Mandatory Phone Modal
    if (user?.user?._id && !user?.user?.phone && !isModalDisabled) {
      setIsOpen(false);
      setIsPhoneModalOpen(true);
      return;
    }

    setIsOpen(false);
    setIsPhoneModalOpen(false);
  }, [isLoading, hasRendered, user?.user?._id, user?.user?.phone, location.pathname]);

  // 3️⃣ Allow app to render after auth check
  if (isLoading) return null;

  return (
    <>
      <AppRoutes />
      {isOpen && (
        <RegisterModal isOpen={isOpen} setIsOpen={setIsOpen} />
      )}
      {isPhoneModalOpen && (
        <MandatoryPhoneModal isOpen={isPhoneModalOpen} />
      )}
    </>
  );
}

function App() {
  return (
    <Router>
      {/* 🌍 Global Toast Notifications */}
      <ToastContainer
        position="top-center"
        autoClose={2000}
        theme="light"
        transition={Bounce}
      />

      {/* 🔐 Auth Provider - Must be highest */}
      <AuthProvider>
        <CustomerPhoneNotificationProvider>
          <PhoneNotificationProvider>
            <SidebarProvider>
            <SelectedUserProvider>
              <SocketProvider>
                <UnreadCountProvider>
                  <ChatSidebarProvider>
                    <ModalProvider>
                      <ActiveUserProvider>
                        <AppContent />
                      </ActiveUserProvider>
                    </ModalProvider>
                  </ChatSidebarProvider>
                </UnreadCountProvider>
              </SocketProvider>
            </SelectedUserProvider>
          </SidebarProvider>
          </PhoneNotificationProvider>
        </CustomerPhoneNotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
