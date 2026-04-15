import React from 'react'
import ReviewsListing from './ReviewsListing';

import { useSidebar } from '@/modules/admin/hooks/useSidebar';

const Reviews = () => {
     const { isSidebarOpen } = useSidebar();
  return (
    <div className={`${isSidebarOpen ? "p-6 lg:ml-56" : "p-4 lg:ml-16"}`}>
     <ReviewsListing />
    </div>
  )
}

export default Reviews
