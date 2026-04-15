import React, { useState, useRef } from "react";
import { useSidebar } from "../../hooks/useSidebar";
import TestimonialPage from "@/staticPages/Testimonial";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import TestimonialForm from "./forms/TestimonialForm";
import TestimonialList from "./pages/TestimonialList";

const Testimonial = () => {
  const { isSidebarOpen } = useSidebar();
  const [isFeedback, setIsFeedback] = useState(false);
  const feedbackRef = useRef(null);
  const [isEditing, setIsEditing] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0); // <- trigger to refetch

  const handleAddFeedback = () => {
    setIsFeedback(true);
    setTimeout(() => {
      feedbackRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100); // wait briefly for component to render
  };
  const handleEdit = (edit) => {
    setIsEditing(edit);
    // console.log(edit,'selected');

  }
  return (
    <>
      {/* Floating Button */}
      <div className="fixed top-4 right-4 z-50">
        <Button onClick={handleAddFeedback} className="flex gap-2 items-center">
          <Plus size={18} />
          Add Feedback
        </Button>
      </div>

      {/* Main Content */}
      <div className={`${isSidebarOpen ? "p-6 lg:ml-56" : "p-4 lg:ml-16"}`}>
        <TestimonialPage />
        {/* Feedback Form Section */}
        <div ref={feedbackRef} className="mt-5 mb-5 px-4 max-w-7xl mx-auto">
          <div className="w-full flex flex-col md:flex-row items-start justify-between gap-6">

            {/* Left Side - Testimonial List */}
            <div className="w-full md:w-1/2 min-w-0 overflow-x-auto">
              <TestimonialList onEdit={handleEdit} refreshKey={refreshKey}  onRefresh={() => setRefreshKey(prev => prev + 1)} />
            </div>
            <div className="w-1 rounded-r-sm bg-[#1C1B1F]"></div>
            {/* Right Side - Testimonial Form */}
            <div className="w-full md:w-1/2 min-w-0">
              <TestimonialForm isEditing={isEditing} onSuccess={() => setRefreshKey(prev => prev + 1)} />
            </div>
          </div>
        </div>
      </div>




    </>
  );
};

export default Testimonial;
