import { useState } from "react";
import Toast from "../utils/Toast";

export const useToast = () => {
    const [toast, setToast] = useState(null);
  
    const showToast = (message, type = "success") => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3000);
    };
  
    return {
      ToastComponent: toast ? (
        <div className="fixed top-5 right-5 z-50">
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        </div>
      ) : null,
      showToast,
    };
  };