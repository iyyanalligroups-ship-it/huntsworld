import React from 'react';
import {useSidebar} from "@/modules/admin/hooks/useSidebar";
import ServiceProviderList from './ServiceProviderLists';


const ServiceProvider = () => {
  const {isSidebarOpen, toggleSidebar} = useSidebar()
  return (
   <>
    <div className={`${isSidebarOpen ? 'p-6 lg:ml-56' : 'p-4 lg:ml-16'}`}>
    <ServiceProviderList />
    </div>
   </>
  )
}

export default ServiceProvider;
