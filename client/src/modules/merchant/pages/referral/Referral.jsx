import React from 'react'
import { useSidebar } from '@/modules/admin/hooks/useSidebar';
import ReferralList from './ReferralList';

const Referral = () => {
  const { isSidebarOpen } = useSidebar();
  return (
    <div className={`${isSidebarOpen ? "p-6 lg:ml-56" : "p-4 lg:ml-16"}`}>
      <ReferralList />
    </div>
  )
}

export default Referral
