import React from 'react'
import {useSidebar} from "@/modules/admin/hooks/useSidebar";
import PostRequirement from "@/staticPages/PostByRequirement";


const PostRequirementAdminPanel = () => {
  const {isSidebarOpen, toggleSidebar} = useSidebar()
  return (
    <>
    <div className={`${isSidebarOpen ? 'p-6 lg:ml-56' : 'p-4 lg:ml-16'}`}>
    <PostRequirement />
    </div>
    </>
  )
}

export default PostRequirementAdminPanel;
