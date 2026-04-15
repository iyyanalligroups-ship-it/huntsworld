import React, { useState, useRef, useContext } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, MessageCircle, Phone, User, Package, Search, Info, Heart, Eye, X } from "lucide-react";
import { useGetSellerBySlugQuery } from "@/redux/api/SellerApi";
import { useParams, useNavigate } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { useToggleFavoriteMutation, useGetFavoritesByUserQuery } from "@/redux/api/FavoriteApi";
import { gsap } from "gsap";
import showToast from "@/toast/showToast";
import { useGetTrendingPointsWithProductByUserQuery } from "@/redux/api/UserTrendingPointSubscriptionApi";
import ProductQuoteModel from "./model/ProductQuoteModel";


const CompanyWebsite = () => {
  const { company_name } = useParams();
  const companySlug = company_name
    ?.toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  const { data: sellerData, isLoading, error } = useGetSellerBySlugQuery(companySlug);
  const [activeTab, setActiveTab] = useState("sellerprofile");
  const [showPhone, setShowPhone] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openQuoteModal, setOpenQuoteModal] = useState(false);
  const { user } = useContext(AuthContext);
  const userId = user?.user?._id;
  const isValidUserId = userId && /^[0-9a-fA-F]{24}$/.test(userId); // Validate MongoDB ObjectId
  const [toggleFavorite] = useToggleFavoriteMutation();
  const { data: favoriteData } = useGetFavoritesByUserQuery(userId, { skip: !isValidUserId });
  const { data: trendingPointsData, isLoading: trendingLoading } = useGetTrendingPointsWithProductByUserQuery(
    userId,
    {
      skip: !isValidUserId,
      page: 1,
      limit: 100,  // Adjust based on expected product count
      filter: "all",
    }
  );
  const navigate = useNavigate();

  if (isLoading) return <div className="p-4">Loading...</div>;
  if (error)
    return (
      <div className="p-4 text-red-500">
        Error loading seller details: {error?.data?.message || error.message}
      </div>
    );

  const seller = sellerData?.merchant || sellerData?.serviceProvider;
  const address = sellerData?.address;
  const entityType = sellerData?.entityType || "Seller";
  const name = seller?.company_name || seller?.travels_name;
  const products = sellerData?.products || [];
  const phoneNumber = seller?.company_phone_number || "N/A";

  const handleToggleFavorite = async (e, productId) => {
    e.stopPropagation();
    if (!productId) return;
    try {
      const response = await toggleFavorite({ productId }).unwrap();
      if (response.favorite) {
        showToast("Product added to favorites!", "success");
      } else {
        showToast("Product removed from favorites.", "info");
      }
    } catch (error) {
      showToast("⚠️ Failed to toggle favorite. Try again.", error);
    }
  };

  const isFavorited = (productId) => {
    return favoriteData?.favorites?.some((fav) => fav.product._id === productId);
  };

  const handleViewNumber = () => {
    setShowPhone(!showPhone);
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmitEnquiry = (e) => {
    e.preventDefault();
    showToast("Enquiry sent successfully!", "success");
    handleCloseModal();
  };

  const EnquiryModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md relative">
        <button
          onClick={handleCloseModal}
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
        >
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-semibold mb-4">Send Enquiry</h3>
        <form onSubmit={handleSubmitEnquiry} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              required
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Your Name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Your Email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Message</label>
            <textarea
              required
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              rows="4"
              placeholder="Your Enquiry"
            ></textarea>
          </div>
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
          >
            Submit Enquiry
          </Button>
        </form>
      </div>
    </div>
  );

  const ProductCard = ({ product }) => {
    const cardRef = useRef(null);
    const iconRef = useRef(null);
    const [showProductPhone, setShowProductPhone] = useState(false);

    const productId = product?._id;
    const image = product?.product_image?.[0] || "/assets/fallback-product.jpg";
    const pname = product?.product_name || "Unnamed Product";
    const price = product?.price?.$numberDecimal || "0";
    const sellerInfo = seller
      ? {
        name: seller.contact_name || seller.company_name,
        company_name: seller.company_name,
        companyAddress: address,
      }
      : null;

    // Calculate total trending points for the product
    const totalTrendingPoints = isValidUserId && trendingPointsData?.data
      ? trendingPointsData.data
        .filter((tp) => tp.product._id === productId)
        .reduce((sum, tp) => sum + (tp.trending_points || 0), 0)
      : 0;

    const handleMouseEnter = () => {
      gsap.to(cardRef.current, { scale: 1.05, duration: 0.3, ease: "power3.out" });
      gsap.fromTo(
        iconRef.current,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" }
      );
    };

    const handleMouseLeave = () => {
      gsap.to(cardRef.current, { scale: 1, duration: 0.3, ease: "power3.in" });
      gsap.to(iconRef.current, { y: 50, opacity: 0, duration: 0.5, ease: "power3.in" });
    };

    const handleShowMobile = (e) => {
      e.stopPropagation();
      setShowProductPhone(!showProductPhone);
    };

    return (
      <div
        ref={cardRef}
        onClick={() => navigate(`/product/${pname}`)}
        className="relative flex flex-col p-2 border-r-2 hover:shadow-[1.95px_1.95px_2.6px_rgba(0,0,0,0.15)] hover:border-r-4 hover:border-[#0c6180] hover:rounded-xl transition-shadow cursor-pointer"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Trending Badge */}
        <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-semibold px-2 py-1 rounded shadow z-10">
          🔥 {totalTrendingPoints} pts
        </div>

        <div className="flex justify-center">
          <img src={image} alt={pname} className="w-32 h-32 object-cover mb-2 rounded" />
        </div>
        <p className="text-[#0c6180] font-bold text-xs">MODERN EDITION</p>
        <h3 className="text-sm font-semibold text-center">{pname}</h3>
        <p className="text-gray-600 text-sm">₹{parseFloat(price).toFixed(0)}</p>

        {sellerInfo && (
          <div className="mt-1 text-[11px] text-gray-700 space-y-1 leading-snug">
            <p><strong>Seller:</strong> {sellerInfo.name}</p>
            <p><strong>Company:</strong> {sellerInfo.company_name}</p>
            {sellerInfo.companyAddress && (
              <p>
                <strong>Location:</strong>{" "}
                {[sellerInfo.companyAddress.city, sellerInfo.companyAddress.state, sellerInfo.companyAddress.country]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            )}
            {showProductPhone && (
              <p>
                <strong>Phone:</strong> {phoneNumber}
              </p>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleOpenModal();
            }}
            className="flex-1 bg-[#0c6180] text-white text-sm py-2 rounded hover:bg-[#0c6180d0] transition cursor-pointer"
          >
            Send Enquiry
          </button>
          <button
            onClick={handleShowMobile}
            className="flex-1 bg-[#ea1a24] text-white text-sm py-2 rounded hover:bg-[#ea1a24e0] transition cursor-pointer"
          >
            {showProductPhone ? "Hide Mobile" : "Show Mobile"}
          </button>
        </div>

        <div
          ref={iconRef}
          className="absolute inset-0 flex justify-center items-center gap-4 opacity-0 pointer-events-none"
        >
          <button
            onClick={(e) => handleToggleFavorite(e, productId)}
            className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 cursor-pointer pointer-events-auto"
          >
            <Heart
              className={`w-5 h-5 ${isFavorited(productId) ? "text-red-600 fill-red-600" : "text-gray-400"} transition-all`}
            />
          </button>
          <button className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 cursor-pointer pointer-events-auto">
            <Eye className="w-5 h-5 text-[#1C1B1F]" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-8xl p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col sm:flex-row items-center justify-between bg-white shadow-lg rounded-xl p-6">
        <div className="flex items-center space-x-4">
          <Avatar className="w-14 h-14">
            <AvatarImage src={seller?.company_logo || "/assets/default-logo.png"} alt={name} />
            <AvatarFallback>
              {name?.split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{name || "Unknown Seller"}</h3>
            <p className="text-gray-600 flex items-center text-sm">
              <MapPin className="mr-1 w-4 h-4" />
              {address ? `${address.city}, ${address.state}, ${address.country}` : "Address not available"}
              {seller?.gst_number && ` | GST: ${seller.gst_number}`}
              {seller?.license_number && ` | License: ${seller.license_number}`}
            </p>
            {showPhone && (
              <p className="text-gray-600 flex items-center text-sm mt-1">
                <Phone className="mr-1 w-4 h-4" />
                {phoneNumber}
              </p>
            )}
          </div>
        </div>
        <div className="flex space-x-3 mt-4 sm:mt-0">
          <Button
            onClick={handleOpenModal}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:opacity-90 text-white shadow-md"
          >
            <MessageCircle className="mr-2 w-4 h-4" /> Send Inquiry
          </Button>
          <Button
            variant="outline"
            className="border-blue-500 text-blue-500 hover:bg-blue-50"
            onClick={handleViewNumber}
          >
            <Phone className="mr-2 w-4 h-4" /> {showPhone ? "Hide Number" : "View Number"}
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-4 bg-white shadow-md rounded-xl p-4">
        <div className="flex space-x-3">
          <button
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${activeTab === "sellerprofile"
                ? "bg-orange-500 text-white shadow"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            onClick={() => setActiveTab("sellerprofile")}
          >
            <div className="flex items-center">
              <User className="mr-2 w-4 h-4" /> {entityType} Profile
            </div>
          </button>
          <button
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${activeTab === "products"
                ? "bg-orange-500 text-white shadow"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            onClick={() => setActiveTab("products")}
          >
            <div className="flex items-center">
              <Package className="mr-2 w-4 h-4" /> Products & Services
            </div>
          </button>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search for a product or service"
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white shadow-lg rounded-xl p-6 min-h-[400px]">
            {activeTab === "sellerprofile" && (
              <div>
                <h2 className="text-lg font-semibold mb-4">{entityType} Profile</h2>
                <p className="text-gray-600">{seller?.description || "No description available."}</p>
                <div className="mt-4 space-y-1">
                  <p><strong>Type:</strong> {seller?.company_type || seller?.vehicle_type || "N/A"}</p>
                  <p><strong>Year of Establishment:</strong> {seller?.year_of_establishment || "N/A"}</p>
                  <p>
                    <strong>{entityType === "Merchant" ? "Number of Employees" : "Number of Vehicles"}:</strong>{" "}
                    {seller?.number_of_employees || seller?.number_of_vehicles || "N/A"}
                  </p>
                  {seller?.msme_certificate_number && (
                    <p><strong>MSME Certificate:</strong> {seller.msme_certificate_number}</p>
                  )}
                  {seller?.gst_number && <p><strong>GST Number:</strong> {seller.gst_number}</p>}
                  {seller?.license_number && <p><strong>License Number:</strong> {seller.license_number}</p>}
                </div>
              </div>
            )}

            {activeTab === "products" && (
              <div>
                <h2 className="text-lg font-semibold mb-4">Products & Services</h2>
                {products.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => (
                      <ProductCard key={product._id} product={product} />
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No products available.</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-4 space-y-4">
            <div className="bg-white shadow-lg rounded-xl p-4">
              <h3 className="text-md font-semibold mb-2 flex items-center">
                <Info className="w-4 h-4 mr-2 text-blue-500" /> {entityType} Info
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {seller?.description
                  ? `${seller.description.substring(0, 100)}${seller.description.length > 100 ? "..." : ""}`
                  : "Trusted provider with years of experience."}
              </p>
              {address && (
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Address:</strong></p>
                  <p>{address.address_line_1}</p>
                  {address.address_line_2 && <p>{address.address_line_2}</p>}
                  <p>
                    {address.city}, {address.state}, {address.country} - {address.pincode}
                  </p>
                </div>
              )}
            </div>
            <div className="bg-white shadow-lg rounded-xl p-4">
              <h3 className="text-md font-semibold mb-2">Quick Contact</h3>
              <p className="text-sm text-gray-600 mb-4">
                Reach out to us for more details about products and services.
              </p>
              <Button
                onClick={handleOpenModal}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white"
              >
                <MessageCircle className="mr-2 w-4 h-4" /> Chat Now
              </Button>
            </div>
          </div>
        </div>
      </div>
      {openQuoteModal && (
        <ProductQuoteModel
          product={products}
          open={openQuoteModal}
          setOpen={setOpenQuoteModal}
        />
      )}
      {isModalOpen && <EnquiryModal />}
    </div>
  );
};

export default CompanyWebsite;