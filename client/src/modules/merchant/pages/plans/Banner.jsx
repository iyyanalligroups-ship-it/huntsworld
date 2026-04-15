import React from 'react'
import BannerSubscription from './banner/BannerSubscription';

import { useSidebar } from '@/modules/admin/hooks/useSidebar';
const Banner = () => {
  const { isSidebarOpen } = useSidebar();
  return (
    <div className={`${isSidebarOpen ? "p-6 lg:ml-56" : "p-4 lg:ml-16"}`}>
      <BannerSubscription />
    </div>
  )
}

export default Banner