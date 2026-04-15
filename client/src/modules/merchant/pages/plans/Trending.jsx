import React from 'react'
import { useSidebar } from '@/modules/admin/hooks/useSidebar';
import TrendingPointsSubscription from './treanding-point/TrendingPointsSubscription';

const Trending = () => {
  const { isSidebarOpen } = useSidebar();
  return (
    <div className={`${isSidebarOpen ? "p-6 lg:ml-56" : "p-4 lg:ml-16"}`}>
      <TrendingPointsSubscription />
    </div>
  )
}

export default Trending
