import React, { useState, useEffect, useContext } from "react";
import { PhoneOutgoing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRequestPhoneNumberAccessMutation } from "@/redux/api/PhoneNumberAccessApi";
import showToast from "@/toast/showToast";
import io from "socket.io-client";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import RegisterModal from "@/modules/landing/modelLogin/Login";

const socket = io(import.meta.env.VITE_SOCKET_IO_URL, {
  withCredentials: true,
  transports: ["websocket"],
});

const RequestPhoneNumberButton = ({ customerId, sellerId, merchantId, setPhoneNumber, className = "", }) => {

  const { user } = useContext(AuthContext);
  const [requestPhoneNumberAccess, { isLoading }] = useRequestPhoneNumberAccessMutation();
  // const [phoneNumber, setPhoneNumber] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    socket.on("phoneNumberRequestApproved", (data) => {
      if (data.seller_id === sellerId) {
        setPhoneNumber(data.phone_number);
        showToast(data.message, "success");
      }
    });

    socket.on("phoneNumberRequestRejected", (data) => {
      if (data.seller_id === sellerId) {
        showToast(data.message, "error");
      }
    });

    return () => {
      socket.off("phoneNumberRequestApproved");
      socket.off("phoneNumberRequestRejected");
    };
  }, [sellerId]);

  const handleRequest = async () => {
    if (!user?.user?._id) {
      setIsOpen(true);
      return;
    }

    try {
      const response = await requestPhoneNumberAccess({
        customer_id: customerId,
        seller_id: sellerId,
        merchant_id: merchantId,
      }).unwrap();

      // 🔥 CASE 1: Backend returned phone number (public or approved)
      if (response.phone_number) {
        setPhoneNumber(response.phone_number);
        // showToast(response.message || "Phone number retrieved", "success");
        return;
      }

      // 🔥 CASE 2: Merchant has NO active subscription
      if (response.message === "Merchant does not have an active subscription.") {
        showToast(response.message, "error");
        return;
      }

      // 🔥 CASE 3: Merchant allows public visibility but no phone_number returned (edge case)
      if (response.message === "Merchant allowed public phone visibility. No request required.") {
        setPhoneNumber(response.phone_number);
        // showToast(response.message, "success");
        return;
      }

      // 🔥 CASE 4: Normal request flow
      showToast(response.message || "Phone number access request sent", "success");

    } catch (error) {
      showToast(error?.data?.message || "Failed to request phone number access", "error");
    }
  };



  return (
    <>
      <Button
        variant="outline"
        onClick={(e) => {
          e.stopPropagation();
          handleRequest();
        }}
        disabled={isLoading}
        className={`
    cursor-pointer
    flex flex-col sm:flex-row
    items-center justify-center
    gap-1 sm:gap-2
    text-xs
    leading-tight
    ${className}
  `}
      >
        <PhoneOutgoing className="w-4 h-4 shrink-0" />
        <span className="text-center whitespace-normal">
          {isLoading ? "Requesting..." : "View Number"}
        </span>
      </Button>



      {isOpen && <RegisterModal isOpen={isOpen} setIsOpen={setIsOpen} />}
    </>
  );
};

export default RequestPhoneNumberButton;
