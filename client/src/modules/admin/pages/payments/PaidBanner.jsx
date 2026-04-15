import React from 'react';
import {useSidebar} from "../../hooks/useSidebar";
import BannerSubscription from './banner/BannerSubscription';

const PaidBanner = () => {
  const {isSidebarOpen, toggleSidebar} = useSidebar()
  return (
 <>
    <div className={`${isSidebarOpen ? 'p-6 lg:ml-56' : 'p-4 lg:ml-16'}`}>
    <BannerSubscription />
    </div>
 </>
  )
}

export default PaidBanner;
