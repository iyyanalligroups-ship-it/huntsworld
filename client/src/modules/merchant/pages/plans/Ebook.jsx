import React from 'react'

import { useSidebar } from '@/modules/admin/hooks/useSidebar';
import EBook from './e-books/Ebooks';
const Ebook = () => {
  const { isSidebarOpen } = useSidebar();
  return (
    <div className={`${isSidebarOpen ? "p-6 lg:ml-56" : "p-4 lg:ml-16"}`}>
      <EBook />
    </div>
  )
}

export default Ebook