import React from 'react';
import {useSidebar} from "@/modules/admin/hooks/useSidebar";
import ComplaintForm from "@/staticPages/Complaint";

const Complaint = () => {
  const {isSidebarOpen, toggleSidebar} = useSidebar()
  return (
    <>
    
    <div className={`${isSidebarOpen ? 'p-6 lg:ml-56' : 'p-4 lg:ml-16'}`}>
      <ComplaintForm />
    </div>
    </>
  )
}

export default Complaint;
