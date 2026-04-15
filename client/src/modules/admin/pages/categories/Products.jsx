import React from 'react';
import { useSidebar } from '../../hooks/useSidebar';

import MerchantAllProductsPage from '../merchants/pages/MerchantAllProductsPage';

const Products = () => {
   const {isSidebarOpen, toggleSidebar} = useSidebar()
  return (
  <>
    <div className={`${isSidebarOpen ? 'p-6 lg:ml-56' : 'p-4 lg:ml-16'}`}>
      <MerchantAllProductsPage />
    </div>
  </>
  )
}

export default Products;
