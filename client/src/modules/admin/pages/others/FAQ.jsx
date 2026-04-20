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