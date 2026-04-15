
// export default BuyerFAQ;
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Sidebar from "./helpers/SellerFAQsidebar";
import FAQContent from "./helpers/SellerFAQcontent";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useGetFaqQuestionsForBuyerQuery } from "@/redux/api/FAQapi";

const BuyerFAQ = () => {
  const { data: response, isLoading, error } = useGetFaqQuestionsForBuyerQuery();
  const faqData = response?.data || {};
  const topics = Object.keys(faqData);
  const [selectedTopic, setSelectedTopic] = useState("");

  useEffect(() => {
    if (topics.length && !selectedTopic) {
      setSelectedTopic(topics[0]);
    }
  }, [topics]);

  return (
    <motion.div className="min-h-screen p-4 sm:p-6 md:p-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>

      {/* Mobile Dropdown */}
      <motion.div className="sm:hidden mb-4" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4 }}>
        <Select value={selectedTopic} onValueChange={setSelectedTopic}>
          <SelectTrigger className="w-full bg-white shadow-md p-3 rounded-md hover:shadow-lg transition-all">
            <SelectValue placeholder="Select a topic" />
          </SelectTrigger>
          <SelectContent>
            {topics.map((topic, index) => (
              <SelectItem key={index} value={topic}>{topic}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* Desktop Layout */}
      <div className="flex flex-col sm:flex-row gap-6">
        <motion.div className="hidden sm:block w-64" initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
          <Sidebar topics={topics} selectedTopic={selectedTopic} setSelectedTopic={setSelectedTopic} />
        </motion.div>

        <motion.div key={selectedTopic} className="flex-1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          {isLoading ? (
            <p>Loading FAQs...</p>
          ) : error ? (
            <p>Failed to load FAQ content.</p>
          ) : (
            <FAQContent selectedTopic={selectedTopic} faqs={faqData[selectedTopic]} />
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default BuyerFAQ;
