import React, { useState } from "react";
import { useSidebar } from "../../hooks/useSidebar";
import MerchantList from "./MerchantList";

const Merchants = () => {
  const { isSidebarOpen } = useSidebar();
  return (
    <div className={`${isSidebarOpen ? "p-6 lg:ml-56" : "p-4 lg:ml-16"}`}>

      <MerchantList/>

    </div>
  );
};

export default Merchants;