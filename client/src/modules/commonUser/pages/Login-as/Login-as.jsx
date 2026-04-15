import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Store, Briefcase, GraduationCap, ShoppingBag } from "lucide-react";
import MerchantModal from "./MerchantModel";
import ServiceProviderModal from "./ServiceProviderModal";
import GrocerySellerModal from "./GrocerySellerModal";
import AddStudentModal from "@/modules/admin/pages/student/AddStudent";

const UserTypeCards = () => {
  const navigate = useNavigate();
  const [isMerchantModalOpen, setIsMerchantModalOpen] = useState(false);
  const [isServiceProviderModalOpen, setIsServiceProviderModalOpen] = useState(false);
  const [isGrocerySellerModalOpen, setIsGrocerySellerModalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);

  // Initial form data and errors for AddStudentModal
  const [formData, setFormData] = useState({
    user_id: "",
    college_email: "",
    id_card: "",
    address_id: "",
    college_name: "",
    university_name: "",
    expiry_date: "",
    address_type: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    state: "",
    country: "",
    pincode: "",
  });

  const [formErrors, setFormErrors] = useState({
    submit: "",
  });

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleResetForm = () => {
    setFormData({
      user_id: "",
      college_email: "",
      id_card: "",
      address_id: "",
      college_name: "",
      university_name: "",
      expiry_date: "",
      address_type: "",
      address_line_1: "",
      address_line_2: "",
      city: "",
      state: "",
      country: "",
      pincode: "",
    });
    setFormErrors({ submit: "" });
  };

  const cards = [
    { title: "Merchant", icon: <Store size={64} />, path: "/merchant-login" },
    { title: "Service Provider", icon: <Briefcase size={64} />, path: "/service-provider-login" },
    { title: "Student", icon: <GraduationCap size={64} />, path: "/student" },
    { title: "Grocery Seller", icon: <ShoppingBag size={64} />, path: "/grocery-seller" },
  ];

  const handleCardClick = (title) => {
    if (title === "Merchant") {
      setIsMerchantModalOpen(true);
    } else if (title === "Service Provider") {
      setIsServiceProviderModalOpen(true);
    } else if (title === "Grocery Seller") {
      setIsGrocerySellerModalOpen(true);
    } else if (title === "Student") {
      setIsStudentModalOpen(true);
    } else {
      navigate(cards.find((card) => card.title === title).path);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen p-6 bg-gray-100">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {cards.map((card, index) => (
          <div
            key={index}
            onClick={() => handleCardClick(card.title)}
            className="bg-gradient-to-br from-[#0c1f4d] to-[#e7000c] rounded-2xl p-10 flex flex-col items-center text-center shadow-xl hover:scale-105 hover:shadow-[0_10px_40px_rgba(231,0,12,0.6)] transition-all duration-300 ease-in-out w-64 h-64 cursor-pointer"
            role="button"
            aria-label={`Select ${card.title}`}
          >
            <div className="text-white mb-6">{card.icon}</div>
            <h3 className="text-2xl font-bold text-white">{card.title}</h3>
          </div>
        ))}
      </div>

      <MerchantModal isOpen={isMerchantModalOpen} onClose={() => setIsMerchantModalOpen(false)} />
      <ServiceProviderModal isOpen={isServiceProviderModalOpen} onClose={() => setIsServiceProviderModalOpen(false)} />
      <GrocerySellerModal isOpen={isGrocerySellerModalOpen} onClose={() => setIsGrocerySellerModalOpen(false)} />
      <AddStudentModal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        onResetForm={handleResetForm}
        formData={formData}
        formErrors={formErrors}
        onInputChange={handleInputChange}
        isEditMode={false} // Set to true if editing an existing student
      />
    </div>
  );
};

export default UserTypeCards;