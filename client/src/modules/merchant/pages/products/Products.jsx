import React from 'react'
import { useSidebar } from '@/modules/admin/hooks/useSidebar';
import ProductImageZoom from './ProductImageZoom';
import MerchantProductForm from './MerchantProductForm';
import MerchantProductList from './MerchantProductList';
import MerchantProductListing from './MerchantProductList';
import ProductListing from './ProductListing';




const Products = () => {
     const { isSidebarOpen } = useSidebar();
  return (
    <div
        className={`${isSidebarOpen ? ' lg:ml-52' : ' lg:ml-16'}`}
    >
       <ProductListing /> 
    </div>
  )
}

export default Products
