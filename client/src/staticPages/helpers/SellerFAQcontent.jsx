
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

const FAQContent = ({ selectedTopic, faqs }) => {
  return (
    <div className="flex-1 p-6">
      <h2 className="text-2xl font-semibold mb-6 text-[#1C1B1F] bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">
        {selectedTopic}
      </h2>
      <Accordion type="single" collapsible className="space-y-3">
        {faqs?.map((faq, index) => (
          <AccordionItem
            key={index}
            value={`faq-${index}`}
            className="border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition duration-300"
          >
            <AccordionTrigger className="p-4 text-lg font-medium cursor-pointer flex justify-between items-center hover:text-blue-600 transition-all duration-300">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="p-4 text-gray-600 bg-gray-50 rounded-b-lg">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default FAQContent;
