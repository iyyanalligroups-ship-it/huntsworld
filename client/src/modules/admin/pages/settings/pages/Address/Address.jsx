import React from 'react';
import { useSidebar } from "../../../../hooks/useSidebar";
import AddressList from './AddressList';

const Address = () => {
  const { isSidebarOpen, toggleSidebar } = useSidebar()
  return (
    <>
      <div >
        <AddressList />
      </div>
    </>
  )
}

export default Address;
