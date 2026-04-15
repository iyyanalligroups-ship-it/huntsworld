import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ArrowLeft,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetFaqQuestionsForGeneralQuery,
  useGetFaqQuestionsForSellerQuery,
  useGetFaqQuestionsForBuyerQuery,
  useGetFaqQuestionsForBaseMemberQuery,
  useGetFaqQuestionsForStudentQuery,
} from "@/redux/api/FAQapi";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";


// Helper: Formats 'snake_case_topic' into 'Snake Case Topic'
const normalizeTopicName = (topic) => {
  if (!topic) return "";
  return topic
    .toLowerCase()
    .split(/[\s-_]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Component: Individual FAQ Item with Accordion Animation
const FaqAccordionItem = ({ question, answer, isOpen, onToggle }) => {
  return (
    <div className="group border border-gray-200 rounded-xl overflow-hidden bg-white hover:border-indigo-300 transition-all duration-300">
      <button
        onClick={onToggle}
        className="w-full px-6 py-5 flex justify-between items-center text-left transition-colors group-hover:bg-indigo-50/30"
      >
        <span className="font-semibold text-gray-900 pr-4 leading-tight">{question}</span>
        <div className={`p-1 rounded-full transition-transform duration-300 ${isOpen ? "bg-indigo-100 rotate-180" : "bg-gray-100"}`}>
          <ChevronDown className={`w-4 h-4 ${isOpen ? "text-indigo-600" : "text-gray-500"}`} />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="px-6 pb-6 pt-0">
              <div className="h-px w-full bg-gray-100 mb-4" />
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                {answer}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Component: A specific Role section (e.g., Seller, Buyer)
const RoleFaqSection = ({ title, queryResult }) => {
  const { data: response, isLoading, error } = queryResult;
  const topics = response?.data ? Object.keys(response.data) : [];

  const [selectedTopic, setSelectedTopic] = useState("");
  const [openIndex, setOpenIndex] = useState(null);

  // Auto-set the first topic as active when data loads
  useEffect(() => {
    if (topics.length > 0 && !selectedTopic) {
      setSelectedTopic(topics[0]);
    }
  }, [topics, selectedTopic]);

  if (isLoading) return <Skeleton className="h-[300px] w-full rounded-2xl mb-12" />;
  if (error || topics.length === 0) return null; // Clean UI: Hide section if no data

  const currentFaqs = response?.data?.[selectedTopic] || [];

  return (
    <section className="mb-20 scroll-mt-10">
      <div className="flex items-baseline justify-between mb-8 border-b border-gray-100 pb-4">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{title}</h2>
        <span className="text-sm font-medium text-gray-400">{topics.length} Categories</span>
      </div>

      {/* Topic Selection Chips */}
      <div className="flex flex-wrap gap-2 mb-8">
        {topics.map((topic) => (
          <button
            key={topic}
            onClick={() => {
              setSelectedTopic(topic);
              setOpenIndex(null);
            }}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${selectedTopic === topic
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 scale-105"
              : "bg-white text-gray-500 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
              }`}
          >
            {normalizeTopicName(topic)}
          </button>
        ))}
      </div>

      {/* Questions List */}
      <div className="space-y-3">
        {currentFaqs.map((faq, idx) => (
          <FaqAccordionItem
            key={`${selectedTopic}-${idx}`}
            question={faq.question}
            answer={faq.answer}
            isOpen={openIndex === idx}
            onToggle={() => setOpenIndex(openIndex === idx ? null : idx)}
          />
        ))}
      </div>
    </section>
  );
};

const AllFaqsPage = () => {
  const navigate = useNavigate();
  // RTK Query Hooks
  const queries = {
    general: useGetFaqQuestionsForGeneralQuery(),
    seller: useGetFaqQuestionsForSellerQuery(),
    buyer: useGetFaqQuestionsForBuyerQuery(),
    base: useGetFaqQuestionsForBaseMemberQuery(),
    student: useGetFaqQuestionsForStudentQuery(),
  };

  return (
    <div className="min-h-screen bg-gray-50/50 py-16 px-4">
      <div className="max-w-4xl mx-auto relative">
        <Button
          type="button"
          onClick={() => navigate(-1)}
          variant="outline"
          className="absolute cursor-pointer top-5 left-5 z-40 hidden md:flex gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        {/* Header */}
        <header className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block px-4 py-1.5 mb-6 text-sm font-bold tracking-widest text-indigo-600 uppercase bg-indigo-50 rounded-full"
          >
            Support Center
          </motion.div>
          <h1 className="text-5xl font-black text-gray-900 mb-6 tracking-tight">
            How can we help?
          </h1>
          <p className="text-xl text-gray-500">
            Select a category below to find detailed answers and guides.
          </p>
        </header>

        {/* Dynamic Sections */}
        <RoleFaqSection title="General Help" queryResult={queries.general} />
        <RoleFaqSection title="Seller Portal" queryResult={queries.seller} />
        <RoleFaqSection title="Buyer Protection" queryResult={queries.buyer} />
        <RoleFaqSection title="Member Benefits" queryResult={queries.base} />
        <RoleFaqSection title="Student Program" queryResult={queries.student} />

        {/* IN-PAGE SOP CONTENT (Footer Documentation) */}

      </div>
    </div>
  );
};

export default AllFaqsPage;
