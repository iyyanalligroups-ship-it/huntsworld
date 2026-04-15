import React from "react";
import { MapPin, Phone, Mail, ArrowLeft } from "lucide-react";
import ContactForm from "@/staticPages/ContactForm";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const contactUsData = [
  {
    type: "breadcrumb",
    content: (
      <div className="text-sm text-gray-500 mb-4">
        <a href="/" className="text-grey-600">Home</a> / <a href="/" className="text-[#E33831]">Contact Us</a>
      </div>
    ),
  },
  {
    type: "heading",
    content: (
      <>
        <h1 className="text-3xl font-bold mb-4">Contact us</h1>
        <p className="text-gray-600 mb-6">
          Having Questions? Tell us about your Business. Our experts will check all the aspects and call you back to explain how <span className="font-bold text-[#E33831]">huntsworld.com</span> would help you to get quotes for your Business.
        </p>
      </>
    ),
  },
  {
    type: "company-info",
    content: (
      <>
        <a href="#" className="text-xl text-[#E33831] mb-2">Huntsworld Private Limited</a>
      </>
    ),
  },
  {
    type: "address",
    content: (
      <div className="flex items-start gap-2 my-4">
        <MapPin className="w-5 h-5 text-[#E33831]" />
        <p className="text-gray-700">
          No.157, Thendral Street, Nainarmandabam, puducherry, 605004.
        </p>
      </div>
    ),
  },
  {
    type: "support-info",
    content: (
      <>
        <hr className="my-4" />
        <p className="text-gray-600">
          <strong>For any assistance call us at</strong> <br />
          ( Monday to Friday, 9:00 AM to 6:00 PM IST)
        </p>
      </>
    ),
  },
  {
    type: "contact-details",
    content: (
      <div className="mt-4">
        <div className="flex items-center gap-2">
          <Phone className="w-5 h-5 text-[#E33831]" />
          <p><strong>Sales:</strong> +91-9944810225</p>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Phone className="w-5 h-5 text-[#E33831]" />
          <p><strong>Support:</strong> +91-9944355114</p>
        </div>
      </div>
    ),
  },
  {
    type: "email",
    content: (
      <div className="mt-4">
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-[#E33831]" />
          <a href="mailto:contact@huntsworld.com" className="text-[#E33831] underline">
            contact@huntsworld.com
          </a>
        </div>
      </div>
    ),
  },
  // {
  //   type: "google-map",
  //   content: (
  //     <div className="mt-6">
  //       <iframe
  //         title="Google Map"
  //         className="w-full h-80 rounded-lg shadow-lg"
  //         src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14012.953462649814!2d77.1304638!3d28.6554608!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390d04b6ef3e2f5d%3A0xe33b33ea01945b2d!2sExportersIndia!5e0!3m2!1sen!2sin!4v1713131725416!5m2!1sen!2sin"
  //         allowFullScreen
  //       ></iframe>
  //     </div>
  //   ),
  // },
];

const ContactUs = () => {
  const navigate = useNavigate();
  return (
    <div className="container relative mx-auto p-8">
      <Button
        type="button"
        onClick={() => navigate(-1)}
        variant="outline"
        className="absolute cursor-pointer top-5 left-5 z-40 flex gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Button>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
        {/* Left Column: Contact Information */}
        <div className="space-y-6">
          {contactUsData.map((item, index) => (
            <div key={index} className="mb-6">{item.content}</div>
          ))}
        </div>
        {/* Right Column: Contact Form */}
        <div className="sticky top-8">
          <ContactForm />
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
