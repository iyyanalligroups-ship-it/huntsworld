import React from 'react'
import { useSidebar } from '@/modules/admin/hooks/useSidebar';
import DistributionUnitPage from './DistributionUnitList';

const distributorRequest = () => {
  const { isSidebarOpen } = useSidebar();
  return (
    <div className={`${isSidebarOpen ? "p-6 lg:ml-56" : "p-4 lg:ml-16"}`}>
      <DistributionUnitPage />
    </div>
  )
}

export default distributorRequest;
