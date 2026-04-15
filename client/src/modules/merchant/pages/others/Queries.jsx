import React from 'react'

import { useSidebar } from '@/modules/admin/hooks/useSidebar';
import MyQueries from './MyQueries';
import ComplaintSummaryCard from './ComplaintSummary';


const Queries = () => {
     const { isSidebarOpen } = useSidebar();
  return (
    <div  className={`${isSidebarOpen ? "lg:p-6 lg:ml-56" : "lg:p-4 lg:ml-16"}`}>
      <MyQueries />
     {/* <ComplaintSummaryCard /> */}
    </div>
  )
}

export default Queries
