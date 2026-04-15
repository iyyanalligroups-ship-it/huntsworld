import React from 'react'
import { useSidebar } from '@/modules/admin/hooks/useSidebar';
import Ebooks from './e-books/Ebooks';


const Ebook = () => {
  const { isSidebarOpen } = useSidebar();
  return (
    <div className={`${isSidebarOpen ? 'lg:p-6 lg:ml-56' : 'lg:p-4 lg:ml-16'}`}>
      <Ebooks />
    </div>
  )
}

export default Ebook