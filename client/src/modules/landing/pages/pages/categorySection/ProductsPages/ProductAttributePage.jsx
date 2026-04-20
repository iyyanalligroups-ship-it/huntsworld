import React, { useState, useRef, useEffect, useContext } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Package,
  Building2,
  Briefcase,
  Info,
  Mail,
  Phone,
  Building,
  Users,
  Calendar,
  Tag,
  IndianRupee,
  MapPin,
  User,
  MessageCircle,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import gsap from "gsap";
import ProductQuoteForm from "./reusable/ProductQuoteForm";
import AskPriceModal from "@/modules/landing/pages/pages/products/AskPriceModal";
import { useNavigate } from "react-router-dom";
import { useSelectedUser } from "@/modules/admin/context/SelectedUserContext";
import { AuthContext } from "@/modules/landing/context/AuthContext";

const ProductAttributesPage = ({
  data,
  activeTab: controlledActiveTab,
  setActiveTab: setControlledActiveTab,
}) => {
  const product = data?.product;
  const { setSelectedUser } = useSelectedUser();
  const navigate = useNavigate();
  const productAttributes = data?.productAttributes;
  const seller = data?.seller;
  const address = data?.address;
  const userData = data?.user;
  const { user } = useContext(AuthContext);
  const [openAskPriceModal, setOpenAskPriceModal] = useState(false);

  const productRef = useRef(null);
  const companyRef = useRef(null);

  // Controlled tab logic
  const [internalActiveTab, setInternalActiveTab] = useState("product");
  const activeTab =
    controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab;
  const setActiveTab =
    setControlledActiveTab || setInternalActiveTab;

  if (!product)
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        <p>No product data found</p>
      </div>
    );

  useEffect(() => {
    const tabContent =
      activeTab === "product" ? productRef.current : companyRef.current;

    gsap.fromTo(
      tabContent,
      { opacity: 0, y: 50, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "power3.out" }
    );
  }, [activeTab]);

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
    const found = unitOptions.find((u) => u.value?.toLowerCase() === unitValue?.toLowerCase());
    return found ? found.label : unitValue;
  };

  // Function to format key names
  const formatKey = (key) => {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // Function to determine if a key-value pair should be displayed
  const shouldDisplayKey = (key, value) => {
    const ignoredKeys = [
      "updatedAt",
      "createdAt",
      "seller_id",
      "_id",
      "__v",
      "company_logo",
      "address_id",
      "user_id",
      "ask_price",
      "mark_as_read",
      "seller_model",
      "askPrice",
      "markAsRead",
      "sellerModel",
      "category_id",
      "sub_category_id",
      "super_sub_category_id",
      "deep_sub_category_id",
      "product_image",
      "image",
      "productVerifiedAt",
      "product_verified_at",
      "isVerified",
      "verified_status",
      "verified_by_admin",
      "product_id",
      "product_verified_by_admin"
    ];
    if (ignoredKeys.includes(key)) return false;

    if (value === null || value === undefined || value === "") return false;

    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      return true;
    }
    if (key === "category_id" && value?.category_name) return true;
    if (key === "sub_category_id" && value?.sub_category_name) return true;
    if (key === "price" && value?.$numberDecimal) return true;
    return false;
  };

  // Function to get displayable value
  const getDisplayValue = (key, value) => {
    if (key === "price" && value?.$numberDecimal) {
      return `₹${Math.round(parseFloat(value.$numberDecimal)).toLocaleString("en-IN")}`;
    }
    if (key === "category_id" && value?.category_name) {
      return value.category_name;
    }
    if (key === "sub_category_id" && value?.sub_category_name) {
      return value.sub_category_name;
    }
    if (key === "video_url" || key === "company_email") {
      return (
        <a
          href={key === "video_url" ? value : `mailto:${value}`}
          target={key === "video_url" ? "_blank" : undefined}
          rel={key === "video_url" ? "noopener noreferrer" : undefined}
          className="text-blue-600 hover:underline break-all"
        >
          {value}
        </a>
      );
    }
    if (typeof value === "object" && value !== null) {
      return JSON.stringify(value);
    }
    return value;
  };

  // Function to get address as a single string
  const getFullAddress = (addressObj) => {
    if (!addressObj) return "";
    const addressFields = Object.entries(addressObj)
      .filter(
        ([key, value]) =>
          typeof value === "string" &&
          [
            "address_line_1",
            "address_line_2",
            "city",
            "state",
            "country",
            "pincode",
          ].includes(key) &&
          value !== ""
      )
      .map(([_, value]) => value)
      .filter(Boolean);
    return addressFields.join(", ");
  };

  const handleCardClick = (seller) => {
    console.log(seller, "seller chat info");
    const obj = {
      _id: seller?.user_id,
    };
    setSelectedUser(obj);
    navigate("/chat");
  };

  return (
    <div className="container mx-auto p-6 min-h-screen">
      {/* Main Responsive Flex Container */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Side: Tabs for Product and Company Details */}
        <div className="w-full lg:w-2/3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white rounded-lg shadow-sm">
              <TabsTrigger value="product" className="cursor-pointer">
                <Package className="w-5 h-5 text-[#0c1f4d]" /> Product Details
              </TabsTrigger>
              <TabsTrigger value="company" className="cursor-pointer">
                <Building2 className="w-5 h-5 text-[#0c1f4d]" /> Company Details
              </TabsTrigger>
            </TabsList>

            <TabsContent value="product" ref={productRef}>
              <Card className="mt-4 shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Package className="w-6 h-6 text-[#0c1f4d]" /> Product Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Name and Description (Full Width) */}
                    {Object.entries(product).map(
                      ([key, value]) =>
                        shouldDisplayKey(key, value) &&
                        (key === "name" || key === "description") && (
                          <div
                            key={`${key}-${uuidv4()}`}
                            className="w-full p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center gap-3 mb-2">
                              {key === "name" && (
                                <Package className="w-5 h-5 text-[#0c1f4d]" />
                              )}
                              {key === "description" && (
                                <Info className="w-5 h-5 text-[#0c1f4d]" />
                              )}
                              <p className="text-sm font-semibold text-gray-700">
                                {formatKey(key)}
                              </p>
                            </div>
                            <p
                              className={`text-sm text-gray-600 ${key === "description" ? "h-fit" : ""
                                }`}
                            >
                              {getDisplayValue(key, value)}
                            </p>
                          </div>
                        )
                    )}

                    {/* Other Details (Responsive Grid) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {Object.entries(product).map(
                        ([key, value]) =>
                          shouldDisplayKey(key, value) &&
                          key !== "name" &&
                          key !== "description" && (
                            <div
                              key={`${key}-${uuidv4()}`}
                              className="flex flex-col p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                {key === "price" && (
                                  <IndianRupee className="w-4 h-4 text-[#0c1f4d]" />
                                )}
                                <span className="font-semibold text-gray-700 text-sm">
                                  {formatKey(key)}
                                </span>
                              </div>
                              <span className="text-gray-600 text-sm break-all">
                                {key === "price" ? (
                                  product?.askPrice || parseFloat(value?.$numberDecimal || 0) === 0 ? (
                                    <Button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenAskPriceModal(true);
                                      }}
                                      className="bg-red-600 cursor-pointer hover:bg-[#0c1f4d] text-white text-[10px] h-7 px-3 rounded-md shadow-sm transition-colors mt-0.5"
                                    >
                                      Ask Price
                                    </Button>
                                  ) : (
                                    <>
                                      <span className="text-sm font-extrabold text-[#0c1f4d]">
                                        ₹{Math.round(value?.$numberDecimal || 0).toLocaleString("en-IN")} /
                                      </span>
                                      <span className="text-gray-400 text-[10px]"> {getUnitLabel(product?.unitOfMeasurement)}</span>
                                    </>
                                  )
                                ) : (
                                  getDisplayValue(key, value)
                                )}
                              </span>
                            </div>
                          )
                      )}
                    </div>

                    {/* Attributes */}
                    <h3 className="text-lg font-semibold mt-6 text-gray-800">
                      Attributes
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
                      {productAttributes?.map(
                        (attr, index) =>
                          attr.attribute_value && (
                            <div
                              key={`${attr.attribute_key}-${index}`}
                              className="flex flex-col p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                            >
                              <span className="font-semibold text-gray-700 text-sm mb-1">
                                {attr.attribute_key}
                              </span>
                              <span className="text-gray-600 text-sm break-all">
                                {attr.attribute_value}
                              </span>
                            </div>
                          )
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="company" ref={companyRef}>
              <Card className="mt-4 shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Building2 className="w-6 h-6 text-[#0c1f4d]" /> Company Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Company Name and Description (Full Width) */}
                    {Object.entries(seller).map(
                      ([key, value]) =>
                        shouldDisplayKey(key, value) &&
                        (key === "company_name" || key === "description") && (
                          <div
                            key={`${key}-${uuidv4()}`}
                            className="w-full p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center gap-3 mb-2">
                              {key === "company_name" && (
                                <Briefcase className="w-5 h-5 text-[#0c1f4d]" />
                              )}
                              {key === "description" && (
                                <Info className="w-5 h-5 text-[#0c1f4d]" />
                              )}
                              <p className="text-sm font-semibold text-gray-700">
                                {formatKey(key)}
                              </p>
                            </div>
                            <p
                              className={`text-sm text-gray-600 ${key === "description" ? "h-fit" : ""
                                }`}
                            >
                              {getDisplayValue(key, value)}
                            </p>
                          </div>
                        )
                    )}

                    {/* Other Company Details (Responsive Grid) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(seller).map(
                        ([key, value]) =>
                          shouldDisplayKey(key, value) &&
                          key !== "company_name" &&
                          key !== "description" &&
                          key !== "company_phone_number" &&          // ← add this line
                          (
                            <div
                              key={`${key}-${uuidv4()}`}
                              className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                            >
                              <div className="flex-shrink-0">
                                {key === "company_email" && (
                                  <Mail className="w-5 h-5 text-[#0c1f4d]" />
                                )}
                                {/* No need for this anymore – can safely delete or leave commented */}

                                {key === "company_type" && (
                                  <Building className="w-5 h-5 text-[#0c1f4d]" />
                                )}
                                {key === "number_of_employees" && (
                                  <Users className="w-5 h-5 text-[#0c1f4d]" />
                                )}
                                {key === "year_of_establishment" && (
                                  <Calendar className="w-5 h-5 text-[#0c1f4d]" />
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-700">
                                  {formatKey(key)}
                                </p>
                                <p className="text-sm text-gray-600 break-all">
                                  {getDisplayValue(key, value)}
                                </p>
                              </div>
                            </div>
                          )
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Side: Quote Form + Seller Details */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          {/* Quote Form */}
          <div className="mb-6 lg:mb-0">
            <ProductQuoteForm product={product} />
          </div>

          {/* Seller Details Card */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#0c1f4d]" /> Seller Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userData?.name && (
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <User className="w-5 h-5 text-[#0c1f4d]" />
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Name</p>
                      <p className="text-sm text-gray-600">{userData.name}</p>
                    </div>
                  </div>
                )}

                {(seller?.company_name || seller?.travels_name) && (
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <Briefcase className="w-5 h-5 text-[#0c1f4d]" />
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Company Name</p>
                      <p className="text-sm text-gray-600">
                        {seller.company_name || seller?.travels_name}
                      </p>
                    </div>
                  </div>
                )}

                {address && getFullAddress(address) && (
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <MapPin className="w-5 h-5 text-[#0c1f4d]" />
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Address</p>
                      <p className="text-sm text-gray-600">{getFullAddress(address)}</p>
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => handleCardClick(seller)}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-base py-6"
                >
                  <MessageCircle className="mr-2 w-5 h-5" /> Chat Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {openAskPriceModal && (
        <AskPriceModal
          isOpen={openAskPriceModal}
          onClose={() => setOpenAskPriceModal(false)}
          product={product}
        />
      )}
    </div>
  );
};

export default ProductAttributesPage;
