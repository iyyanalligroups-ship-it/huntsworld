import React from 'react';
import {useSidebar} from "@/modules/admin/hooks/useSidebar";
import MerchantProductListing from "../merchants/pages/MerchantProductList";

const Products = () => {
   const {isSidebarOpen, toggleSidebar} = useSidebar()
  return (
  <>
    <div className={`${isSidebarOpen ? 'p-6 lg:ml-56' : 'p-4 lg:ml-16'}`}>
      <MerchantProductListing />
    </div>
  </>
  )
}

export default Products;
