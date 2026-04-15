import { toast, Bounce } from 'react-toastify';

const showToast = (message, type = "info") => {
  toast(message, {
    type, // 'success', 'error', 'info', etc.
    position: "top-center",
    autoClose: 2000, // ✅ 2 seconds = 2000 milliseconds
    hideProgressBar: false,
    closeOnClick: false,
    pauseOnHover: true,
    draggable: true,
    theme: "light",
    transition: Bounce,
  });
};

export default showToast;
