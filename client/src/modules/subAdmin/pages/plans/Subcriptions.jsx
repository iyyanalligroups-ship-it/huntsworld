
import React from "react";
import {useSidebar} from "@/modules/admin/hooks/useSidebar";
import SubcriptionPlanList from "./pages/SubcriptionPlanList";
import SubscriptionPlanElementList from "./pages/SubcriptionPlanElementList";
import SubscriptionPlanElementMappingList from "./pages/SubscriptionPlanElementMappingList";

const Subcriptions = () => {
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  return (
    <>
      <div className={`${isSidebarOpen ? "p-6 lg:ml-56" : "p-4 lg:ml-16"}`}>
        <div className="max-w-6xl w-full mx-auto mt-10">
          <SubcriptionPlanList />
          <SubscriptionPlanElementList />
          <SubscriptionPlanElementMappingList />
        </div>
      </div>
    </>
  );
};


export default Subcriptions;
