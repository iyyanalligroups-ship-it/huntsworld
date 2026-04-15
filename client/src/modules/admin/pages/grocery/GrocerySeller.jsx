import React, { useState } from "react";
import { useSidebar } from "../../hooks/useSidebar";
import GrocerySellerList from "./GrocerySellerLists";

const Merchants = () => {
  const { isSidebarOpen } = useSidebar();
  return (
    <div className={`${isSidebarOpen ? "p-6 lg:ml-56" : "p-4 lg:ml-16"}`}>

      <GrocerySellerList/>

    </div>
  );
};

export default Merchants;