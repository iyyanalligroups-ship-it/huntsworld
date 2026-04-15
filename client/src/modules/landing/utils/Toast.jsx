import { useState, useEffect } from "react";

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed top-5 right-5 px-4 py-2 rounded shadow-md text-white text-sm 
        ${type === "success" ? "bg-green-500" : "bg-red-500"}`}
    >
      {message}
    </div>
  );
};

export default Toast;