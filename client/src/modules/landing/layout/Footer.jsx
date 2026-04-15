import { useState, useEffect } from "react";
import axios from "axios";
import {
  Instagram,
  Twitter,
  Linkedin,
  Github,
  Youtube,
  FacebookIcon,
  Smartphone,
  Download,
} from "lucide-react";
import { Link } from "react-router-dom";

// Map platform names (from database) to Lucide icon components
const platformToIcon = {
  Instagram: Instagram,
  Twitter: Twitter,
  Linkedin: Linkedin,
  LinkedIn: Linkedin,
  GitHub: Github,
  Github: Github,
  YouTube: Youtube,
  Youtube: Youtube,
  Facebook: FacebookIcon,
};

const footerDataStatic = [
  {
    title: "Our Services",
    links: [{ name: "Advertise with us", path: "/advertise-with-us" }],
  },
  {
    title: "Buyers",
    links: [
      { name: "Post Your Requirement", path: "/post-requirement" },
      { name: "Browse Suppliers", path: "/all-categories" },
      { name: "Manufacturers Directory", path: "/manufacturing-directory" },
    ],
  },
  {
    title: "Sellers",
    links: [
      { name: "Sell Your Product", path: "/register" },
      { name: "FAQ", path: "/seller-faq" },
    ],
  },
  {
    title: "Quick Links",
    links: [
      { name: "About Us", path: "/about" },
      { name: "Testimonials", path: "/testimonials" },
      { name: "Contact Us", path: "/contact" },
      { name: "Complaint", path: "/complaint" },
      { name: "Disclaimer", path: "/disclaimer" },
    ],
  },
];

const Footer = () => {
  const [socialLinks, setSocialLinks] = useState([]);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert("App is already installed or your browser doesn't support PWA installation.");
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };


  useEffect(() => {
    const fetchSocialLinks = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/social-media`
        );

        console.log("API Response:", response.data);

        if (response.data?.success && Array.isArray(response.data.data)) {
          setSocialLinks(response.data.data); // ✅ Correct array
        } else {
          setSocialLinks([]);
        }
      } catch (error) {
        console.error("Error fetching social media links:", error);
        setSocialLinks([]);
      }
    };

    fetchSocialLinks();
  }, []);

  const footerData = [
    ...footerDataStatic,
    {
      title: "Legal & Social",
      sections: [
        {
          title: "Legal",
          links: [
            { name: "Terms of Service", path: "/terms-condition" },
            { name: "Privacy Policy", path: "/privacy-policy" },
          ],
        },
        {
          title: "Social",
          links: socialLinks,
        },
      ],
    },
  ];

  return (
    <footer className="bg-[#0c1f4d] text-gray-300 mt-auto">
      <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-8">
          {footerData.map((column, index) => (
            <div key={index}>
              <h3 className="text-white font-semibold mb-4">
                {column.title}
              </h3>

              {column.sections ? (
                column.sections.map((section, sectionIndex) => (
                  <div key={sectionIndex} className="mb-6">
                    <h4 className="text-white font-medium mb-3 text-sm">
                      {section.title}
                    </h4>

                    {section.title === "Social" ? (
                      <div className="space-y-4">
                        {/* Social Icons */}
                        <div className="flex flex-wrap gap-4">
                          {Array.isArray(section.links) &&
                            section.links.map((link) => {
                              const platformName = link.platform?.name || link.platform;
                              const IconComponent =
                                platformToIcon[platformName];

                              if (!IconComponent) return null;

                              return (
                                <a
                                  key={link._id || platformName}
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:text-[#e03733] transition-colors"
                                  aria-label={`Follow us on ${platformName}`}
                                >
                                  <IconComponent className="w-6 h-6" />
                                </a>
                              );
                            })}
                        </div>

                        {/* PWA Download Button */}
                        <div className="pt-2">
                          <button
                            onClick={handleInstallClick}
                            className={`h-11 px-5 flex items-center gap-3 bg-gradient-to-r from-[#e03733] to-[#ff5c58] text-white rounded-lg hover:shadow-[0_0_25px_rgba(224,55,51,0.5)] transition-all duration-300 group ${
                              !deferredPrompt
                                ? "opacity-60 cursor-not-allowed"
                                : "cursor-pointer scale-100 hover:scale-105"
                            }`}
                            title={
                              !deferredPrompt
                                ? "App is already installed or not supported"
                                : "Install as App"
                            }
                          >
                            <Smartphone className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
                            <div className="flex flex-col items-start leading-tight">
                              <span className="text-[10px] uppercase font-bold tracking-widest opacity-90">
                                Download
                              </span>
                              <span className="text-sm font-bold whitespace-nowrap">
                                Huntsworld App
                              </span>
                            </div>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <ul className="space-y-2">
                        {section.links.map((link, linkIndex) => (
                          <li key={linkIndex}>
                            <Link
                              to={link.path}
                              className="hover:text-[#e03733] transition-colors text-sm"
                            >
                              {link.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))
              ) : (
                <ul className="space-y-2">
                  {column.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <Link
                        to={link.path}
                        className="hover:text-[#e03733] transition-colors text-sm"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
