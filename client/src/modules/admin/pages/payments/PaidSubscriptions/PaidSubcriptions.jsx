import React from 'react';
import {useSidebar} from "../../../hooks/useSidebar";
import PaidSubscriptionList  from './PaidSubscriptionList';

const PaidSubcriptions = () => {
  const {isSidebarOpen, toggleSidebar} = useSidebar();

  return (
 <>
   <div
      className={`flex-1 p-4 transition-all duration-300 ${isSidebarOpen
          ? 'ml-1 sm:ml-64'
          : 'ml-1 sm:ml-16'
        }`}
    >
      <PaidSubscriptionList />
    </div>
 </>
  )
}

export default PaidSubcriptions;
