// // utils/loadRazorpay.js
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      return resolve(true);
    }
    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      existingScript.onload = () => resolve(true);
      existingScript.onerror = () => resolve(false);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const RAZORPAY_GLOBAL_CONFIG = {
  display: {
    blocks: {
      other: {
        name: "Other Payment Methods",
        instruments: [
          {
            method: "upi",
          },
          {
            method: "card",
          },
        ],
      },
    },
    sequence: ["block.other"],
  },
};