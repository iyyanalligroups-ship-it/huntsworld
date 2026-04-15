import React from 'react'
import {useSidebar} from "../../hooks/useSidebar";
import AddStudent from "./AllStudents";


const StudentList = () => {
      const {isSidebarOpen} = useSidebar()
  return (
   <>
    <div className={`${isSidebarOpen ? 'p-6 lg:ml-56' : 'p-4 lg:ml-16'}`}>


    <AddStudent />

    </div>
   </>
  )
}

export default StudentList;
