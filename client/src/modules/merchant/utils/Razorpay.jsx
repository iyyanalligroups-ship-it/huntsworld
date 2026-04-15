// // utils/loadRazorpay.js
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    // Check if window.Razorpay already exists
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    // Check if script is already in the document
    const scriptExists = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (scriptExists) {
      scriptExists.onload = () => resolve(true);
      scriptExists.onerror = () => resolve(false);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * 🔥 GLOBAL RAZORPAY CONFIGURATION
 * Restricts payment methods to UPI and Card only.
 */
export const RAZORPAY_GLOBAL_CONFIG = {
  display: {
    blocks: {
      other: {
        name: "Pay via UPI or Card",
        instruments: [
          { method: "upi" },
          { method: "card" }
        ],
      },
    },
    sequence: ["block.other"],
    preferences: {
      show_default_blocks: false,
    },
  },
};

// export const loadRazorpayScript = () => {
//   return new Promise((resolve) => {
//     // Already loaded
//     if (window.Razorpay) {
//       resolve(true);
//       return;
//     }
//     // Existing script tag
//     const existingScript = document.querySelector(
//       'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
//     );
//     if (existingScript) {
//       existingScript.addEventListener("load", () => resolve(true));
//       existingScript.addEventListener("error", () => resolve(false));
//       return;
//     }
//     // Create new script
//     const script = document.createElement("script");
//     script.src = "https://checkout.razorpay.com/v1/checkout.js";
//     script.async = true;
//     script.onload = () => resolve(true);
//     script.onerror = () => resolve(false);
//     document.body.appendChild(script);
//   });
// };