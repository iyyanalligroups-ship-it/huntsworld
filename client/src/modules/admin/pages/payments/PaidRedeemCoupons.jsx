import React from 'react';
import { useSidebar } from "../../hooks/useSidebar";
import WalletPage from './wallet/WalletPage';

const PaidRedeemCoupons = () => {
  const { isSidebarOpen, toggleSidebar } = useSidebar()
  return (
    <>
      <div className={`${isSidebarOpen ? 'p-6 lg:ml-56' : 'p-4 lg:ml-16'}`}>
        <WalletPage />
      </div>
    </>
  )
}

export default PaidRedeemCoupons;
