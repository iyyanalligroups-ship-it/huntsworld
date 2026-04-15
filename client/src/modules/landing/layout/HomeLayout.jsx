import { Outlet, useLocation, useNavigationType } from "react-router-dom";
import { useEffect, useContext, useRef } from "react";
import Header from "./HeaderLayout";
import Footer from "./Footer";
import { AuthContext } from "../context/AuthContext";

import { SidebarProvider } from "@/modules/admin/context/SidebarContext";

const HomeLayout = () => {
  const { pathname } = useLocation();
  const navType = useNavigationType();
  const { user } = useContext(AuthContext);

  const role = user?.user?.role?.role;
  const mainRef = useRef(null);

  // 1. Listen to scrolling and save the position ONLY when on the homepage
  useEffect(() => {
    const handleScroll = (e) => {
      if (pathname === "/") {
        sessionStorage.setItem("homeScrollPosition", e.target.scrollTop);
        sessionStorage.setItem("homeScrollHeight", e.target.scrollHeight);
      }
    };

    const mainElement = mainRef.current;
    if (mainElement) {
      mainElement.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (mainElement) {
        mainElement.removeEventListener("scroll", handleScroll);
      }
    };
  }, [pathname]);

  // 2. When the URL changes, decide whether to restore scroll or go to top
  useEffect(() => {
    const mainElement = mainRef.current;

    if (mainElement) {
      if (pathname === "/") {
        const savedScroll = sessionStorage.getItem("homeScrollPosition");
        const savedHeight = sessionStorage.getItem("homeScrollHeight");
        
        // ONLY restore if the user clicked the "Back" or "Forward" button (navType === "POP")
        if (savedScroll && savedHeight && navType === "POP") {
          const target = parseInt(savedScroll, 10);
          const expectedHeight = parseInt(savedHeight, 10);
          
          // Initial optimistic set (in case page is already constructed from cache)
          mainElement.scrollTo({ top: target, behavior: "instant" });

          // Because child components (like TopSellers) load asynchronously, 
          // the DOM might not have fully expanded above the target yet.
          let timeoutId;
          const observer = new ResizeObserver(() => {
            // Wait until the page regains approximately the same total height it had before
            if (mainElement.scrollHeight >= expectedHeight - 300) {
              mainElement.scrollTo({ top: target, behavior: "instant" });
              observer.disconnect();
              clearTimeout(timeoutId);
            }
          });

          // Observe the scrolling container for layout shifts
          observer.observe(mainElement.children[0] || mainElement);
          
          // Fallback: disconnect after 2 seconds to prevent hanging
          timeoutId = setTimeout(() => {
             observer.disconnect();
             mainElement.scrollTo({ top: target, behavior: "instant" });
          }, 2000);
          
        } else {
          // If they explicitly clicked "Home" (PUSH) or are visiting fresh, start at the top
          mainElement.scrollTo({ top: 0, behavior: "instant" });
        }
      } else {
        // If going to any other page (like product details), snap to the very top
        mainElement.scrollTo({ top: 0, behavior: "instant" });
      }
    }
  }, [pathname]);

  return (
    <SidebarProvider>
      <div className="flex flex-col h-screen overflow-hidden bg-white">
        {/* 🔥 Header REMOUNTS when role changes */}
        <Header key={role || "guest"} />

        <main
          id="main-content"
          ref={mainRef}
          // NOTE: I removed 'scroll-smooth' from here.
          // Having 'scroll-smooth' forces the page to visually slide up to the top
          // when changing routes, which looks glitchy. It's better to snap instantly!
          className="flex-grow overflow-y-auto modern-scrollbar"
        >
          <div className="min-h-full flex flex-col">
            <div className="flex-grow">
              <Outlet />
            </div>
            <Footer />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default HomeLayout;
