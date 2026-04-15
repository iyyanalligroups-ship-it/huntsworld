import React from 'react';
import {useSidebar} from "@/modules/admin/hooks/useSidebar";

const PaidRedeemCoupons = () => {
  const {isSidebarOpen, toggleSidebar} = useSidebar()
  return (
 <>
    <div className={`${isSidebarOpen ? 'p-6 lg:ml-56' : 'p-4 lg:ml-16'}`}>
      welcome to paid redeem coupons
    </div>
    </>
  )
}

export default PaidRedeemCoupons;
