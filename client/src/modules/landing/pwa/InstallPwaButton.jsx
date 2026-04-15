import { useEffect, useState } from "react";

const InstallPWAButton=()=> {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });

    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  if (isInstalled || !deferredPrompt) return null;

  return (
    <button
      onClick={handleInstall}
      className="px-4 py-2 bg-purple-600 text-white rounded"
    >
      📲 Install Huntsworld App
    </button>
  );
}

export default InstallPWAButton;
