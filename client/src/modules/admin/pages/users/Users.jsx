import React, { useState } from "react";
import { useSidebar } from "../../hooks/useSidebar";
import UserTable from "./UserTable";


const Users = () => {
  const { isSidebarOpen } = useSidebar();

  return (
    <div className={`${isSidebarOpen ? "p-6 lg:ml-56" : "p-4 lg:ml-16"}`}>
      <UserTable />

    </div>
  );
};

export default Users;
