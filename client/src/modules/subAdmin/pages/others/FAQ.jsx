import React from "react";
import {useSidebar} from "@/modules/admin/hooks/useSidebar";

import BuyerFAQ from "@/staticPages/BuyerFAQ";
import SellerFAQ from "@/staticPages/SellerFAQ";

const FAQ = () => {
  const { isSidebarOpen, toggleSidebar } = useSidebar();

  return (
    <div className={`${isSidebarOpen ? "p-6 lg:ml-56" : "p-4 lg:ml-16"}`}>
          <div>
            <BuyerFAQ />
            <SellerFAQ />
          </div>
    </div>
  );
};

export default FAQ;