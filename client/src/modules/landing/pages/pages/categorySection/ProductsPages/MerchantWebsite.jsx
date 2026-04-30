import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Building,
  Calendar,
  MessageCircle,
  ArrowUp,
  Menu,
  X,
  Heart,
  Loader2,
  Factory,
  Building2,
  CheckCircle2,
  Ban,
  Tag,
} from "lucide-react";
import { useGetSellerBySlugQuery } from "@/redux/api/SellerApi";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import axios from "axios";
import io from "socket.io-client";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import RequestPhoneNumberButton from "./RequestPhoneNumberButton";
import ProductQuoteModel from "./model/ProductQuoteModel";
import { useSelectedUser } from "@/modules/admin/context/SelectedUserContext";
import defaultImage from "@/assets/images/no-image.jpg";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { isValidPhoneNumber, parsePhoneNumber } from "libphonenumber-js";
import { X as CloseIcon } from "lucide-react";
import {
  useCreatePostByRequirementMutation,
  useGetAddressesForPostByRequirementQuery,
} from "@/redux/api/PostByRequirementApi";
import { toast } from "react-toastify";
import { Textarea } from "@/components/ui/textarea";
import ProductNameAutocomplete from "@/modules/merchant/pages/products/ProductNameAutocomplete";
import DistributionNetwork from "./DistributionNetwork";
import MySupplierCard from "./MySuppliersCard";
import AskPriceModal from "@/modules/landing/pages/pages/products/AskPriceModal";
import Loader from "@/loader/Loader";

const unitOptions = [
  { label: "Kilogram", value: "kg" },
  { label: "Gram", value: "g" },
  { label: "Ton", value: "ton" },
  { label: "Piece", value: "pcs" },
  { label: "Liter", value: "ltr" },
  { label: "Meter", value: "m" },
  { label: "Centimeter", value: "cm" },
  { label: "Dozen", value: "dz" },
  { label: "Pack", value: "pk" },
  { label: "Other", value: "other" },
];

const getUnitLabel = (unitValue) => {
  if (!unitValue) return "";
  const found = unitOptions.find((u) => u.value.toLowerCase() === unitValue.toLowerCase());
  return found ? found.label : unitValue;
};

const socket = io(import.meta.env.VITE_SOCKET_IO_URL, {
  withCredentials: true,
  transports: ["websocket"],
});

const formatName = (value) => {
  if (!value) return "";

  return value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const PartnerCard = ({ partner, type }) => {
  const biz = partner.businessDetails;
  const addr = partner.addressDetails;
  const isSupplier = type === 'supplier';

  return (
    <Card className={`group hover:shadow-2xl transition-all duration-500 border-none bg-white shadow-lg rounded-3xl overflow-hidden ${isSupplier ? 'border-t-4 border-red-500' : 'border-t-4 border-[#0c1f4d]'}`}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-4 rounded-2xl ${isSupplier ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-[#0c1f4d]'}`}>
            {isSupplier ? <Factory size={28} /> : <Building2 size={28} />}
          </div>
          <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">
            <ShieldCheck size={14} /> Verified
          </div>
        </div>

        <div className="space-y-1.5">
          <h4 className="font-black text-xl text-slate-800 leading-tight line-clamp-1 uppercase">
            {biz?.shop_name || biz?.company_name || partner.name}
          </h4>
          <p className="text-[10px] text-muted-foreground font-mono font-bold tracking-widest uppercase">Partner ID: {partner.user_code}</p>
        </div>

        <div className="space-y-3 pt-5">
          <div className="flex items-start gap-3 text-sm text-slate-600">
            <MapPin size={18} className="text-red-500 shrink-0 mt-0.5" />
            <span className="capitalize font-medium leading-snug">
              {addr ? `${addr.city}, ${addr.state} ${addr.pincode || ''}` : 'Location hidden'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <Mail size={18} className="text-blue-500 shrink-0" />
            <span className="truncate font-medium">{partner.email}</span>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-slate-100 flex justify-between items-center">
          <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1">
            {isSupplier ? 'Verified Supplier' : 'Official Distributor'}
          </Badge>
          <div className={`h-2.5 w-2.5 rounded-full ${isSupplier ? 'bg-red-500' : 'bg-[#0c1f4d]'} animate-pulse`} />
        </div>
      </CardContent>
    </Card>
  );
};

const ProductCard = ({
  product,
  viewType = "grid",
  currentUserId,
  sellerId,
  onPhoneNumberUpdate,
  socket,
}) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [given, setGiven] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(null);
  const [openQuoteModal, setOpenQuoteModal] = useState(false);
  const [openAskPriceModal, setOpenAskPriceModal] = useState(false);

  if (!product) {
    return (
      <Card className="w-full max-w-sm text-center shadow-sm border border-red-100 bg-red-50/50 rounded-2xl">
        <CardContent className="flex flex-col items-center justify-center py-10 space-y-3">
          <Ban className="w-10 h-10 text-red-400" />
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Not Found</h2>
            <p className="text-gray-500 text-xs mt-1">
              Product data unavailable.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  useEffect(() => {
    if (!socket) return;

    const handleApproved = (data) => {
      if (data.seller_id === sellerId) {
        setPhoneNumber(data.phone_number);
        onPhoneNumberUpdate?.(data.phone_number);
      }
    };

    const handleRejected = (data) => {
      if (data.seller_id === sellerId) {
        setPhoneNumber(null);
        onPhoneNumberUpdate?.(null);
      }
    };

    socket.on("phoneNumberRequestApproved", handleApproved);
    socket.on("phoneNumberRequestRejected", handleRejected);

    return () => {
      socket.off("phoneNumberRequestApproved", handleApproved);
      socket.off("phoneNumberRequestRejected", handleRejected);
    };
  }, [sellerId, onPhoneNumberUpdate, socket]);

  const handleGiveTrendingPoint = async (e) => {
    e.stopPropagation();
    if (loading || given) return;

    setLoading(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/trending-point/create-trending-points`,
        {
          user_id: user?.user?._id,
          product_id: product?._id,
          trending_points: 1,
          date: new Date().toISOString().split("T")[0],
        }
      );

      if (response.status === 200 || response.status === 201) {
        setGiven(true);
      }
    } catch (error) {
      console.error("Trending point error", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReadMoreClick = () => {
    const formattedName = (product._id || product._id || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-");
    navigate(`/product/${formattedName}`);
  };

  const displayName = product.product_name || product.name || "Unnamed Product";
  const displayPrice = product.price?.$numberDecimal || product.price || "N/A";
  const unit = product.unitOfMeasurement || product.unit || "unit";
  const stock = product.stock_quantity || 0;
  const description = product.description || "";
  const categoryName = product.category_id?.category_name || "Uncategorized";
  const attributes = product.attributes || [];
  const searchTags = product.search_tags || [];

  // Get only the first image or default fallback
  const displayImage = product?.product_image?.[0] || defaultImage;

  const isList = viewType === "list";
  const containerClasses = isList
    ? "flex flex-col md:flex-row w-full"
    : "flex flex-col w-full h-full max-w-sm";

  const imageContainerClasses = isList
    ? "w-full md:w-56 h-56 md:h-auto shrink-0 border-b md:border-b-0 md:border-r border-slate-100"
    : "w-full aspect-[4/3] border-b border-slate-100";

  return (
    <>
      <div
        className={`group relative bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-[#e91a24]/30 transition-all duration-300 overflow-hidden flex flex-col ${containerClasses}`}
      >
        {/* Category Badge - Floating Top Left */}
        <div className="absolute top-3 left-3 z-10 pointer-events-none">
          <Badge className="bg-[#0c1f4d]/90 text-white backdrop-blur-md shadow-md capitalize text-[10px] tracking-wider px-2 py-1">
            {categoryName.replace(/-/g, " ")}
          </Badge>
        </div>



        {/* Single Image Section */}
        <div
          className={`relative bg-slate-50 flex items-center justify-center overflow-hidden cursor-pointer ${imageContainerClasses}`}
          onClick={handleReadMoreClick}
          title="Click to view full details"
        >
          <div className="w-full h-full transform group-hover:scale-105 transition-transform duration-500">
            <img
              src={displayImage}
              alt={displayName}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = defaultImage;
              }}
            />
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 flex flex-col p-5">
          {/* Header, Price & Stock */}
          <div className="mb-3">
            <h3
              onClick={handleReadMoreClick}
              className="font-bold text-slate-800 text-lg leading-tight mb-2 line-clamp-2 cursor-pointer group-hover:text-[#e91a24] transition-colors capitalize"
              title={displayName}
            >
              {displayName.replace(/-/g, " ")}
            </h3>

            <div>
              {product?.askPrice || parseFloat(displayPrice || 0) === 0 ? (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenAskPriceModal(true);
                  }}
                  className="bg-red-600 hover:bg-[#0c1f4d] text-white text-xs h-8 px-4 rounded-md shadow-sm transition-colors mt-1 mb-2"
                >
                  Ask Price
                </Button>
              ) : (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-[#0c1f4d]">
                    ₹{parseFloat(displayPrice || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    / {getUnitLabel(unit)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}


          {/* Attributes Array Mapping (Max 3) */}
        {attributes && attributes.length > 0 && (
  <div className="flex flex-col space-y-1.5 mb-4 mt-2">
    {attributes.slice(0, 3).map((attr, idx) => (
      <div key={idx} className="text-[13px] leading-tight flex items-baseline">
        <span className="font-bold text-[#1e293b] mr-1.5 lowercase">
          {attr.attribute_key}:
        </span>
        <span className="text-slate-500 font-medium capitalize">
          {attr.attribute_value}
        </span>
      </div>
    ))}
    {attributes.length > 3 && (
      <div className="text-[12px] text-slate-400 font-medium pt-1">
        +{attributes.length - 3} more
      </div>
    )}
  </div>
)}

          {/* Search Tags */}


          <div className="flex-grow" />

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex flex-col xs:flex-row gap-3">
            {/* Phone Logic */}
            {phoneNumber ? (
              <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-50 text-green-700 rounded-xl text-sm font-bold border border-green-200 shadow-sm">
                <Phone size={16} />
                <span>{phoneNumber}</span>
              </div>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex-1">
                      <RequestPhoneNumberButton
                        customerId={currentUserId}
                        sellerId={sellerId}
                        merchantId={sellerId}
                        className="w-full h-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 text-[#0c1f4d] border border-slate-200 hover:bg-[#0c1f4d] hover:text-white hover:border-[#0c1f4d] rounded-xl text-sm font-bold transition-all shadow-sm group/phone"
                      >
                        <Phone size={16} className="transition-transform group-hover/phone:rotate-12" />
                        <span>Contact</span>
                      </RequestPhoneNumberButton>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Request seller's number</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Enquiry Button */}
            <Button
              onClick={() => setOpenQuoteModal(true)}
              className="flex-1 bg-[#e91a24] cursor-pointer hover:bg-[#c4121b] text-white rounded-xl text-sm font-bold px-4 py-2.5 h-auto shadow-sm shadow-red-200 flex items-center justify-center gap-2 transition-all hover:shadow-md"
            >
              <Mail size={16} />
              <span>Enquiry</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Quote Modal */}
      {openQuoteModal && (
        <ProductQuoteModel
          product={product}
          productId={product._id}
          userId={user?.user?._id}
          open={openQuoteModal}
          setOpen={setOpenQuoteModal}
        />
      )}

      {openAskPriceModal && (
        <AskPriceModal
          isOpen={openAskPriceModal}
          onClose={() => setOpenAskPriceModal(false)}
          product={product}
        />
      )}
    </>
  );
};

function MerchantWebsite() {
  const { company_name } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { setSelectedUser } = useSelectedUser();
  const { data, isLoading, isError, error } =
    useGetSellerBySlugQuery(company_name);

  const [year, setYear] = useState(0);
  const [showFullStory, setShowFullStory] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(null);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    product_or_service: "",
    description: "",
    quantity: "",
    unit_of_measurement: "",
    phone_number: "",
    type: "product",
    supplier_preference: "All India",
    selected_states: [],
    user_id: user?.user?._id || null,
  });
  const [customUnit, setCustomUnit] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [createPost] = useCreatePostByRequirementMutation();
  const { data: states = [], isLoading: statesLoading, error: statesError } = useGetAddressesForPostByRequirementQuery();

  const unitOptions = [
    { label: "Kilogram", value: "kg" },
    { label: "Gram", value: "g" },
    { label: "Ton", value: "ton" },
    { label: "Piece", value: "pcs" },
    { label: "Liter", value: "ltr" },
    { label: "Meter", value: "m" },
    { label: "Centimeter", value: "cm" },
    { label: "Dozen", value: "dz" },
    { label: "Pack", value: "pk" },
    { label: "Other", value: "other" },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const isAtBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 50;
      setShowScrollToTop(isAtBottom);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    let initialPhone = user?.user?.phone || "";
    if (initialPhone && !initialPhone.startsWith("+")) {
      initialPhone = `+91${initialPhone}`;
    }
    setFormData((prev) => ({
      ...prev,
      phone_number: initialPhone,
      user_id: user?.user?._id || null,
      product_or_service: "",
      description: "",
      quantity: "",
      unit_of_measurement: "",
      type: "product",
      supplier_preference: "All India",
      selected_states: [],
    }));
    setCustomUnit("");
    if (!user?.user?._id) {
      navigate("/login");
      toast.info("Please log in to submit a requirement.");
    }
    if (!initialPhone || initialPhone.trim() === "") {
      toast.info("Please update your phone number in your profile settings before submitting a requirement.");
    }
  }, [user, navigate]);

  const handlePhoneChange = (value) => {
    setFormData((prev) => ({ ...prev, phone_number: value || "" }));
    if (value) {
      try {
        const phoneNumberParsed = parsePhoneNumber(value);
        if (!isValidPhoneNumber(value)) {
          setPhoneError("Invalid phone number");
        } else {
          setPhoneError("");
        }
      } catch (error) {
        setPhoneError("Invalid phone number format");
      }
    } else {
      setPhoneError("");
    }
  };

  const removeState = (stateToRemove) => {
    setFormData((prev) => ({
      ...prev,
      selected_states: prev.selected_states.filter((state) => state !== stateToRemove),
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    let errors = {};

    if (!formData?.description?.trim())
      errors.description = "Description is required.";

    if (!formData?.quantity) errors.quantity = "Quantity is required.";

    if (!formData?.unit_of_measurement?.trim())
      errors.unit_of_measurement = "Unit of measurement is required.";

    if (!formData?.type?.trim())
      errors.type = "Type is required.";
    else if (!['product', 'service'].includes(formData.type))
      errors.type = "Type must be either product or service.";

    if (!formData?.phone_number?.trim())
      errors.phone_number = "Phone number is required.";

    if (!isValidPhoneNumber(formData?.phone_number))
      errors.phone_number = "Invalid phone number.";

    if (
      formData?.supplier_preference === "Specific States" &&
      formData?.selected_states.length === 0
    ) {
      errors.selected_states = "Select at least one state.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleStateSelection = (state) => {
    setFormData((prev) => ({
      ...prev,
      selected_states: prev.selected_states.includes(state)
        ? prev.selected_states.filter((s) => s !== state)
        : [...prev.selected_states, state],
    }));
  };

  const resetForm = () => {
    let initialPhone = user?.user?.phone || "";
    if (initialPhone && !initialPhone.startsWith("+")) {
      initialPhone = `+91${initialPhone}`;
    }
    setFormData({
      description: "",
      quantity: "",
      unit_of_measurement: "",
      product_or_service: "",
      phone_number: initialPhone,
      type: "product",
      supplier_preference: "All India",
      selected_states: [],
      user_id: user?.user?._id || null,
    });
    setCustomUnit("");
    setPhoneError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("⚠️ Please fix the errors in the form.");
      return;
    }
    if (!user?.user?._id) {
      navigate("/login");
      toast.info("Please log in to submit a requirement.");
      return;
    }
    if (!formData.phone_number || formData.phone_number.trim() === "") {
      toast.info("Please update your phone number in your profile settings before submitting a requirement.");
      return;
    }

    try {
      const finalUnit =
        formData.unit_of_measurement === "other"
          ? customUnit.trim().toLowerCase()
          : formData.unit_of_measurement;

      if (formData.unit_of_measurement === "other" && !customUnit.trim()) {
        setFormErrors((prev) => ({
          ...prev,
          unit_of_measurement: "Custom unit is required when 'Other' is selected.",
        }));
        toast.error("⚠️ Please enter a custom unit.");
        return;
      }

      const submitData = { ...formData, unit_of_measurement: finalUnit };

      const response = await createPost(submitData).unwrap();
      if (response.success) {
        toast.success(response.message || "Requirement Added Successfully");
      } else {
        toast.error(response.message || "Failed to Add");
      }
      resetForm();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(error.message || "Something went wrong!");
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!company_name) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Error: No company name provided in the URL</p>
      </div>
    );
  }

  const seller = data?.merchant || data?.serviceProvider;
  const userData = data?.user;
  const merchantUserId = data?.merchant?.user_id?._id;
  const address = data?.address;
  const products = data?.products || [];

  const entityType = data?.entityType;
  const logo = seller?.company_logo || "/default-logo.png";

  useEffect(() => {
    const establishmentYear = seller?.year_of_establishment || (seller?.createdAt ? new Date(seller.createdAt).getFullYear() : 0);
    
    if (establishmentYear) {
      let start = 0;
      const end = establishmentYear;
      const duration = 2000;
      const increment = end / (duration / 10);

      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setYear(end);
          clearInterval(timer);
        } else {
          setYear(Math.floor(start));
        }
      }, 10);

      return () => clearInterval(timer);
    }
  }, [seller]);

  const handlePhoneNumberUpdate = (number) => {
    setPhoneNumber(number);
  };

  const [network, setNetwork] = useState({ distributors: [], suppliers: [] });
  const [networkLoading, setNetworkLoading] = useState(true);

  useEffect(() => {
    const fetchNetworkData = async () => {
      if (!merchantUserId) return;
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/distributors/website-network/${merchantUserId}`);
        setNetwork(res.data);
      } catch (err) {
        console.error("Network Fetch Error:", err);
      } finally {
        setNetworkLoading(false);
      }
    };
    fetchNetworkData();
  }, [merchantUserId]);

  const carouselImages =
    seller?.company_images?.length > 0
      ? seller.company_images
      : products.length > 0
        ? products
          .slice(0, 4)
          .map((product) => product.image_url || null)
          .filter((url) => url)
        : [];

  if (isLoading) {
    return (
      <Loader />
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Error: {error?.data?.message || "Failed to load seller data"}</p>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>No seller found</p>
      </div>
    );
  }

  const handleCardClick = (seller) => {
    setSelectedUser(seller);
    navigate("/chat");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Card
        id="home"
        className="shadow-lg mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 border-none rounded-b-3xl"
      >
        <CardContent className="flex justify-between items-center relative p-2">
          {/* LEFT: LOGO + NAME */}
          <div className="flex items-center gap-4">
            <img
              src={logo}
              alt={`${entityType === "Merchant"
                ? seller.company_name
                : seller.travels_name
                } logo`}
              className="h-12 w-12 sm:h-16 sm:w-16 object-contain rounded-full shadow-sm border border-gray-100"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = defaultImage;
                e.target.className =
                  "h-12 w-12 sm:h-16 sm:w-16 object-contain rounded-full shadow-sm";
              }}
            />

            <div className="text-xl sm:text-3xl font-bold text-[#0c1f4d]">
              {formatName(
                entityType === "Merchant"
                  ? seller.company_name
                  : seller.travels_name
              )}
            </div>
          </div>

          {/* DESKTOP NAV */}
          <nav className="hidden md:flex space-x-6 items-center">
            <a
              href="#home"
              className="text-gray-600 font-medium hover:text-[#e91a24] transition-colors text-[15px]"
            >
              Home
            </a>
            <a
              href="#about"
              className="text-gray-600 font-medium hover:text-[#e91a24] transition-colors text-[15px]"
            >
              About
            </a>
            <a
              href="#products"
              className="text-gray-600 font-medium hover:text-[#e91a24] transition-colors text-[15px]"
            >
              Products
            </a>
            <a
              href="#contact"
              className="text-gray-600 font-medium hover:text-[#e91a24] transition-colors text-[15px]"
            >
              Contact
            </a>
          </nav>

          {/* MOBILE MENU BUTTON */}
          <button
            className="md:hidden text-gray-700 p-2 bg-gray-50 rounded-lg hover:bg-gray-100"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* MOBILE NAV MENU */}
          {menuOpen && (
            <div className="absolute top-full left-0 w-full bg-white shadow-xl md:hidden z-50 rounded-b-2xl border-t border-gray-100">
              <nav className="flex flex-col py-4 px-6 space-y-4">
                <a
                  href="#home"
                  onClick={() => setMenuOpen(false)}
                  className="text-gray-700 font-medium hover:text-[#e91a24] transition-colors text-base"
                >
                  Home
                </a>
                <a
                  href="#about"
                  onClick={() => setMenuOpen(false)}
                  className="text-gray-700 font-medium hover:text-[#e91a24] transition-colors text-base"
                >
                  About
                </a>
                <a
                  href="#products"
                  onClick={() => setMenuOpen(false)}
                  className="text-gray-700 font-medium hover:text-[#e91a24] transition-colors text-base"
                >
                  Products
                </a>
                <a
                  href="#contact"
                  onClick={() => setMenuOpen(false)}
                  className="text-gray-700 font-medium hover:text-[#e91a24] transition-colors text-base"
                >
                  Contact
                </a>
              </nav>
            </div>
          )}
        </CardContent>
      </Card>

      {carouselImages.length > 0 && (
        <section className="py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-8 lg:gap-12">
            <div className="w-full lg:w-1/2">
              <Carousel className="w-full rounded-2xl overflow-hidden shadow-xl border border-gray-100">
                <CarouselContent>
                  {carouselImages.map((src, index) => (
                    <CarouselItem key={index}>
                      <img
                        src={src}
                        alt={`Company image ${index + 1}`}
                        className="w-full h-[350px] sm:h-[450px] object-cover"
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white border-none shadow-md" />
                <CarouselNext className="right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white border-none shadow-md" />
              </Carousel>
            </div>
            <div className="w-full lg:w-1/2">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-8"
              >
                <div className="mb-8">
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#0c1f4d]">
                    Let Us Know <span className="text-[#e91a24]">What You Need</span>
                  </h2>
                  <p className="text-gray-500 mt-2 text-sm">
                    Complete these simple steps and get instant quotes from verified suppliers.
                  </p>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                      {formData.type === "service" ? "Service Name" : "Product Name"} <span className="text-red-500">*</span>
                    </label>
                    <ProductNameAutocomplete
                      value={formData.product_or_service}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData(prev => ({ ...prev, product_or_service: val }));
                        setFormErrors(prev => ({ ...prev, product_or_service: "" }));
                      }}
                    />
                    {formErrors.product_or_service && (
                      <p className="text-red-500 text-xs mt-1.5">{formErrors.product_or_service}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Type</label>
                    <Select
                      name="type"
                      value={formData?.type || ""}
                      onValueChange={(value) => handleChange({ target: { name: 'type', value } })}
                      disabled={statesLoading || statesError}
                    >
                      <SelectTrigger className="w-full rounded-xl border-gray-200">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="product">Product</SelectItem>
                        <SelectItem value="service">Service</SelectItem>
                      </SelectContent>
                    </Select>
                    {formErrors.type && (
                      <p className="text-red-500 text-xs mt-1.5">{formErrors.type}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Quantity</label>
                      <Input
                        name="quantity"
                        placeholder="e.g. 100"
                        className="rounded-xl border-gray-200"
                        value={formData?.quantity}
                        onChange={handleChange}
                      />
                      {formErrors.quantity && (
                        <p className="text-red-500 text-xs mt-1.5">
                          {formErrors.quantity}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Unit</label>
                      <Select
                        onValueChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            unit_of_measurement: value,
                          }))
                        }
                        value={formData?.unit_of_measurement}
                      >
                        <SelectTrigger className="w-full rounded-xl border-gray-200">
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {unitOptions.map((unit) => (
                            <SelectItem key={unit.value} value={unit.value}>
                              {unit.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formData.unit_of_measurement === "other" && (
                        <Input
                          type="text"
                          placeholder="Enter custom unit"
                          value={customUnit}
                          onChange={(e) =>
                            setCustomUnit(e.target.value.replace(/[^A-Za-z]/g, ""))
                          }
                          className="mt-3 rounded-xl border-gray-200"
                        />
                      )}
                      {formErrors.unit_of_measurement && (
                        <p className="text-red-500 text-xs mt-1.5">{formErrors.unit_of_measurement}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Phone Number</label>
                    <PhoneInput
                      placeholder="Enter phone number"
                      defaultCountry="IN"
                      value={formData?.phone_number}
                      onChange={handlePhoneChange}
                      className="custom-phone-input w-full border border-gray-200 rounded-xl p-3 bg-white"
                      international
                      countryCallingCodeEditable={false}
                      addInternationalOption={false}
                    />
                    {phoneError && (
                      <p className="text-red-500 text-xs mt-1.5">{phoneError}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Description</label>
                    <Textarea
                      name="description"
                      placeholder="Give us details about your requirement..."
                      value={formData?.description}
                      onChange={handleChange}
                      className="rounded-xl border-gray-200 resize-none"
                      rows={3}
                    />
                    {formErrors.description && (
                      <p className="text-red-500 text-xs mt-1.5">
                        {formErrors.description}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Supplier Preference</label>
                    <div className="flex gap-3">
                      {["All India", "Specific States"].map((option) => (
                        <button
                          key={option}
                          type="button"
                          className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors ${formData?.supplier_preference === option
                            ? "border-[#0c1f4d] bg-[#0c1f4d]/5 text-[#0c1f4d]"
                            : "border-gray-200 text-gray-600 hover:bg-gray-50"
                            }`}
                          onClick={() =>
                            setFormData({
                              ...formData,
                              supplier_preference: option,
                              selected_states:
                                option === "Specific States"
                                  ? formData?.selected_states
                                  : [],
                            })
                          }
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  {formData?.supplier_preference === "Specific States" && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                      <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Choose Multiple States</label>
                      {statesLoading ? (
                        <p className="text-gray-500 text-sm">Loading states...</p>
                      ) : statesError ? (
                        <p className="text-red-500 text-sm">Error loading states</p>
                      ) : (
                        <Select
                          onValueChange={(value) => handleStateSelection(value)}
                        >
                          <SelectTrigger className="w-full rounded-xl border-gray-200">
                            <SelectValue placeholder="Select states" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {states?.map((state) => (
                                <SelectItem key={state} value={state}>
                                  {state}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2">
                        {formData?.selected_states.map((state) => (
                          <Badge
                            key={state}
                            className="bg-blue-50 text-[#0c1f4d] border border-blue-100 px-3 py-1 flex items-center gap-1.5 rounded-lg text-xs font-medium"
                          >
                            {state}
                            <button
                              onClick={() => removeState(state)}
                              className="bg-white rounded-full p-0.5 hover:bg-red-50 hover:text-red-500 transition-colors"
                            >
                              <CloseIcon className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>

                      {formErrors.selected_states && (
                        <p className="text-red-500 text-xs mt-1.5">
                          {formErrors.selected_states}
                        </p>
                      )}
                    </motion.div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-[#e91a24] hover:bg-[#c4121b] text-white py-6 rounded-xl text-base font-bold shadow-lg shadow-red-500/20 transition-all hover:shadow-xl mt-4"
                  >
                    Submit Requirement
                  </Button>
                </form>
              </motion.div>
            </div>
          </div>
        </section>
      )}

      <section id="about" className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-[#0c1f4d] mb-4">About Our Company</h2>
            <div className="h-1.5 w-20 bg-[#e91a24] mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <Card className="shadow-lg border-none bg-slate-50 rounded-3xl overflow-hidden">
              <CardHeader className="bg-[#0c1f4d] text-white p-6">
                <CardTitle className="flex items-center text-xl sm:text-2xl font-bold">
                  <Building className="mr-3 h-6 w-6 text-white" /> Company Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6 sm:p-8">
                {seller?.company_type && (
                  <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                    <span className="text-gray-500 font-medium">Nature of Business</span>
                    <span className="font-bold text-gray-800">{seller.company_type.displayName || seller.company_type.name || "N/A"}</span>
                  </div>
                )}
                {(seller.msme_certificate_number || seller.msme) && (
                  <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                    <span className="text-gray-500 font-medium">MSME</span>
                    <span className="font-bold text-gray-800">{seller.msme_certificate_number || seller.msme}</span>
                  </div>
                )}
                {(seller.gst_number || seller.gst) && (
                  <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                    <span className="text-gray-500 font-medium">GST</span>
                    <span className="font-bold text-gray-800">{seller.gst_number || seller.gst}</span>
                  </div>
                )}
                {seller.pan && (
                  <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                    <span className="text-gray-500 font-medium">PAN</span>
                    <span className="font-bold text-gray-800">{seller.pan}</span>
                  </div>
                )}
                {seller.number_of_employees && (
                  <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                    <span className="text-gray-500 font-medium">Employees</span>
                    <span className="font-bold text-gray-800">{seller.number_of_employees}</span>
                  </div>
                )}
                {seller.domain_name && (
                  <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                    <span className="text-gray-500 font-medium">Website</span>
                    <a href={`https://${seller.domain_name}`} target="_blank" rel="noopener noreferrer" className="font-bold text-blue-600 hover:underline">
                      {seller.domain_name}
                    </a>
                  </div>
                )}
                {seller?.company_email && (
                  <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                    <span className="text-gray-500 font-medium">Email</span>
                    <span className="font-bold text-gray-800">{seller.company_email}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-gray-500 font-medium">Phone</span>
                  {phoneNumber ? (
                    <span className="font-bold text-gray-800">{phoneNumber}</span>
                  ) : (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <RequestPhoneNumberButton
                              customerId={user?.user?._id}
                              sellerId={seller._id}
                              merchantId={seller._id}
                              className="text-[#e91a24] font-bold hover:underline flex items-center gap-1.5"
                            >
                              <Phone size={14} /> View Number
                            </RequestPhoneNumberButton>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Request seller's phone number</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-none rounded-3xl h-full">
              <CardHeader className="p-6 sm:p-8 pb-4">
                <CardTitle className="text-2xl sm:text-3xl font-bold text-[#0c1f4d]">
                  Our Story
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 sm:p-8 pt-0">
                <p className={`text-base sm:text-lg text-gray-600 leading-relaxed ${!showFullStory ? "line-clamp-4" : ""}`}>
                  {seller?.description ||
                    `We are a leading ${entityType === "Merchant" ? "merchant" : "service provider"} committed to excellence and customer satisfaction. Our journey is defined by quality, trust, and the long-lasting relationships we build with our clients.`}
                </p>
                {!showFullStory && (
                  <Button
                    variant="link"
                    className="p-0 h-auto text-[#e91a24] font-bold mt-4 hover:text-[#c4121b]"
                    onClick={() => setShowFullStory(true)}
                  >
                    Read Full Story &rarr;
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-12 bg-slate-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card className="shadow-sm border-none bg-white rounded-2xl hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center flex flex-col items-center">
              <div className="bg-blue-50 p-4 rounded-full mb-4">
                <Building className="h-8 w-8 text-[#0c1f4d]" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-800 mb-1">
                {entityType}
              </CardTitle>
              <CardDescription className="text-sm font-medium">
                Business Profile
              </CardDescription>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-none bg-white rounded-2xl hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center flex flex-col items-center">
              <div className="bg-red-50 p-4 rounded-full mb-4">
                <Calendar className="h-8 w-8 text-[#e91a24]" />
              </div>
              <CardTitle className="text-2xl font-black text-gray-800 mb-1">
                {year}
              </CardTitle>
              <CardDescription className="text-sm font-medium">
                Established Year
              </CardDescription>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-none bg-white rounded-2xl hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center flex flex-col items-center">
              <div className="bg-green-50 p-4 rounded-full mb-4">
                <ShieldCheck className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-800 mb-1">
                Verified
              </CardTitle>
              <CardDescription className="text-sm font-medium">
                Trusted Partner
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="products" className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-[#0c1f4d] mb-4">Featured Products</h2>
            <div className="h-1.5 w-20 bg-[#e91a24] mx-auto rounded-full" />
            <p className="text-gray-500 mt-4 max-w-2xl mx-auto">Explore our high-quality inventory. Request quotes and view contact details to connect directly with us.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 xl:gap-10 justify-items-center">
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                viewType="grid"
                currentUserId={user?.user?._id}
                sellerId={seller._id}
                onPhoneNumberUpdate={handlePhoneNumberUpdate}
                socket={socket}
              />
            ))}
          </div>
        </div>
      </section>

      {/* --- AUTHORIZED DISTRIBUTORS SECTION --- */}
      {network.distributors.length > 0 && (
        <section id="distributors" className="py-24 px-4 sm:px-6 bg-slate-50 border-t border-gray-100">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 space-y-4">
              <div className="inline-block px-4 py-1.5 rounded-full bg-[#0c1f4d]/5 text-[#0c1f4d] text-[10px] font-black uppercase tracking-widest">Global Network</div>
              <h2 className="text-3xl sm:text-5xl font-black text-[#0c1f4d] uppercase tracking-tight">Authorized <span className="text-[#e91a24]">Distributors</span></h2>
              <div className="h-1.5 w-24 bg-[#e91a24] mx-auto rounded-full mt-4" />
            </div>

            {networkLoading ? (
              <div className="flex flex-col items-center py-20 gap-4">
                <Loader2 className="animate-spin text-[#0c1f4d]" size={40} />
                <p className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">Syncing Network...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 xl:gap-10">
                {network.distributors.map((partner) => (
                  <PartnerCard key={partner._id} partner={partner} type="distributor" />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* --- TRUSTED SUPPLIERS SECTION --- */}
      {network.suppliers.length > 0 && (
        <section id="suppliers" className="py-24 px-4 sm:px-6 bg-white border-t border-gray-100">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 space-y-4">
              <div className="inline-block px-4 py-1.5 rounded-full bg-red-50 text-red-500 text-[10px] font-black uppercase tracking-widest">Supply Chain</div>
              <h2 className="text-3xl sm:text-5xl font-black text-[#0c1f4d] uppercase tracking-tight">Certified <span className="text-[#e91a24]">Suppliers</span></h2>
              <div className="h-1.5 w-24 bg-[#0c1f4d] mx-auto rounded-full mt-4" />
            </div>

            {networkLoading ? (
              <div className="flex flex-col items-center py-20 gap-4">
                <Loader2 className="animate-spin text-red-500" size={40} />
                <p className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">Syncing Partners...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 xl:gap-10">
                {network.suppliers.map((partner) => (
                  <PartnerCard key={partner._id} partner={partner} type="supplier" />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

    <section id="contact" className="py-16 sm:py-24 bg-grey">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-[#0c1f4d] mb-4">Contact Information</h2>
            <div className="h-1.5 w-20 bg-[#e91a24] mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Call Us Card */}
            <Card className="bg-white border border-slate-100 shadow-xl shadow-slate-200/40 rounded-3xl hover:-translate-y-1 transition-transform duration-300">
              <CardHeader className="text-center pb-2 pt-8">
                <div className="bg-blue-50 text-[#0c1f4d] p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Phone className="h-8 w-8" />
                </div>
                <CardTitle className="text-xl font-bold text-[#0c1f4d]">Call Us</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-3 pb-8">
                {phoneNumber ? (
                  <p className="font-bold text-lg text-slate-800 tracking-wider">{phoneNumber}</p>
                ) : (
                  <div className="flex justify-center">
                    <RequestPhoneNumberButton
                      customerId={user?.user?._id}
                      sellerId={seller._id}
                      merchantId={seller._id}
                      className="bg-[#0c1f4d] hover:bg-blue-900 text-white px-6 py-2 rounded-full font-bold text-sm transition-colors shadow-md"
                    >
                      View Number
                    </RequestPhoneNumberButton>
                  </div>
                )}
                <p className="text-sm font-medium text-slate-500">Available Mon-Sat, 9AM-6PM</p>
              </CardContent>
            </Card>

            {/* Location Card */}
            <Card className="bg-white border border-slate-100 shadow-xl shadow-slate-200/40 rounded-3xl hover:-translate-y-1 transition-transform duration-300">
              <CardHeader className="text-center pb-2 pt-8">
                <div className="bg-red-50 text-[#e91a24] p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <MapPin className="h-8 w-8" />
                </div>
                <CardTitle className="text-xl font-bold text-[#0c1f4d]">Location</CardTitle>
              </CardHeader>
              <CardContent className="text-center pb-8">
                {address ? (
                  <p className="text-sm leading-relaxed text-slate-600 font-medium">
                    {address.street}<br />
                    {address.city}, {address.state} {address.postal_code}<br />
                    {address.country}
                  </p>
                ) : (
                  <p className="text-sm text-slate-500">Address not available</p>
                )}
              </CardContent>
            </Card>

            {/* Direct Message Card */}
            <Card className="bg-gradient-to-br from-[#0c1f4d] to-[#16306b] border-none rounded-3xl text-white shadow-xl shadow-blue-900/20 hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden">
              {/* Subtle background glow effect */}
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

              <CardHeader className="text-center pb-2 pt-8 relative z-10">
                <div className="bg-white/10 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center backdrop-blur-md">
                  <MessageCircle className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold">Direct Message</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4 pb-8 relative z-10">
                <p className="text-sm text-blue-100 font-medium px-2">
                  Have a quick question? Message us directly on our platform.
                </p>
                <Button
                  onClick={() => handleCardClick(seller)}
                  className="w-full bg-[#e91a24] hover:bg-[#c4121b] text-white rounded-xl py-6 font-black text-base transition-colors shadow-lg shadow-red-500/30"
                >
                  Start Chat Now
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {showScrollToTop && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={scrollToTop}
                className="fixed bottom-6 right-6 bg-[#0c1f4d] border-none rounded-full p-4 shadow-2xl hover:-translate-y-2 hover:bg-[#e91a24] transition-all duration-300 z-50 text-white"
              >
                <ArrowUp size={24} />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Back to Top</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

export default MerchantWebsite;