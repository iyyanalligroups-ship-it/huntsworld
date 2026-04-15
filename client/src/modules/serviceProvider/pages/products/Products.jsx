import React from 'react'
import { useSidebar } from '@/modules/admin/hooks/useSidebar';
import ProductListing from './ProductListing';
const Products = () => {
     const { isSidebarOpen } = useSidebar();
  return (
    <div
    className={`${isSidebarOpen ? 'lg:p-2 lg:ml-56' : 'lg:p-2 lg:ml-16'}`}
    >
       <ProductListing /> 
    </div>
  )
}

export default Products
