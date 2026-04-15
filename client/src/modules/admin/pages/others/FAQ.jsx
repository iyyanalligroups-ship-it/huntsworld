import React, { useState } from "react";
import { useSidebar } from "../../hooks/useSidebar";
import { FaqTopicForm } from "./forms/FaqTopicForm";
import { FaqTopicList } from "./pages/FaqTopicList";
import { FaqQuestionForm } from "./forms/FaqQuestionsForm";
import { FaqQuestionList } from "./pages/FaqQuestionsList";
import BuyerFAQ from "@/staticPages/BuyerFAQ";
import SellerFAQ from "@/staticPages/SellerFAQ";

const FAQ = () => {
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [selectedQuestions, setSelectedQuestions] = useState(null);

  const handleEdit = (edit) => {
    console.log("Editing topic:", edit);
    setSelectedTopic(edit);
  };

  const handleFaqQuestionsEdit = (edit) => {
    console.log("Editing question:", edit);
    setSelectedQuestions(edit);
  };

  // return (
  //   <div className={`${isSidebarOpen ? "p-6 lg:ml-56" : "p-4 lg:ml-16"}`}>
  //     <div className=" py-10 px-4">
  //       <div className="flex flex-col lg:flex-row gap-5">
  //         {/* Left Column: Topics */}
  //         <div className="flex-1">
  //           <h1 className="text-2xl font-bold mb-6">Manage FAQ Topics</h1>
  //           <FaqTopicForm selectedTopic={selectedTopic} onSuccess={() => setSelectedTopic(null)} />
  //           <FaqTopicList onEdit={handleEdit} />
  //         </div>

  //         {/* Vertical Divider */}
  //         <div className="hidden lg:block w-px bg-gray-300 mx-2.5"></div>

  //         {/* Right Column: Questions */}
  //         <div className="flex-1">
  //           <h1 className="text-2xl font-bold mb-6 mt-10 lg:mt-0">Manage FAQ Questions</h1>
  //           <FaqQuestionForm selectedQuestions={selectedQuestions} onSuccess={() => setSelectedQuestions(null)} />
  //           <div className="mt-4">
  //             <FaqQuestionList onEdit={handleFaqQuestionsEdit} />
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  //   </div>
  // );

  return (
    <div className={`${isSidebarOpen ? "p-6 lg:ml-56" : "p-4 lg:ml-16"}`}>
          <div>
            <BuyerFAQ />
            <SellerFAQ />
          </div>
    </div>
  );
};

export default FAQ;