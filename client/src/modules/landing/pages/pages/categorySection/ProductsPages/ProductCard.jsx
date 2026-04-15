import React, { useRef, useContext, useEffect, useState } from "react";
import { Heart, MapPin, CheckCircle, Mails, MessageSquare } from "lucide-react";
import { gsap } from "gsap";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { ActiveUserContext } from "@/modules/admin/context/ActiveUserProvider";
import { useToggleFavoriteMutation, useGetFavoritesByUserQuery } from "@/redux/api/FavoriteApi";
import showToast from "@/toast/showToast";
import axios from "axios";
import ProductQuoteModel from "./model/ProductQuoteModel";
import LoginModel from "@/modules/landing/modelLogin/Login";
import { Button } from "@/components/ui/button";
import ProductCarousel from "./ProductCarousel";
import RequestPhoneNumberButton from "./RequestPhoneNumberButton";
import trustShield from "@/assets/images/1.png";
import noImage from "@/assets/images/no-image.jpg";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import AskPriceModal from "@/modules/landing/pages/pages/products/AskPriceModal";
const getUnitLabel = (unitValue) => {
  if (!unitValue) return "";

  const found = unitOptions.find(
    (u) => u.value.toLowerCase() === unitValue.toLowerCase()
  );

  return found ? found.label : unitValue;
};

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


const TruncatedText = ({ text, max = 40, className = "" }) => {
  const safeText = text || "";

  // Debug: see what actually comes in
  console.log("Raw input:", safeText);

  const formattedText = safeText
    .replace(/[-_]/g, " ")                             // hyphen & underscore → space
    .replace(/\b\w/g, (match) => match.toUpperCase()); // title case

  console.log("Formatted:", formattedText);

  const shouldTruncate = formattedText.length > max;
  const displayText = shouldTruncate
    ? formattedText.slice(0, max) + "…"
    : formattedText;

  if (!shouldTruncate) {
    return <span className={className}>{displayText}</span>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`${className} cursor-default`} tabIndex={0}>
            {displayText}
          </span>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-xs break-words bg-gray-900 text-white shadow-xl"
        >
          {formattedText}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};


const ProductCard = ({ product, viewType = "grid", currentUserId }) => {
  const cardRef = useRef(null);
  const iconRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { trackProductView } = useContext(ActiveUserContext);
  console.log(product, 'search rresult product card')
  const userId = currentUserId || user?.user?._id;
  const productId = product?._id;
  const [trustSealStatus, setTrustSealStatus] = useState({});
  // ROBUST SELLER ID EXTRACTION WITH MULTIPLE FALLBACKS
  const sellerId =
    product?.sellerInfo?._id ||
    product?.seller?._id ||
    product?.seller_id ||
    product?.merchantInfo?._id ||
    product?.user_id ||
    null;

  const merchantId = sellerId; // Usually the same as sellerId
  const price = product.price?.$numberDecimal || 0;

  // DEBUG: Warn if sellerId is missing (remove in production if not needed)
  useEffect(() => {
    if (!sellerId) {
      console.warn("⚠️ Missing sellerId for product:", product?.product_name || product?.title, product);
    }
  }, [sellerId, product]);

  const [openQuoteModal, setOpenQuoteModal] = useState(false);
  const [openAskPriceModal, setOpenAskPriceModal] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isFavoritedLocal, setIsFavoritedLocal] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const [given, setGiven] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeImage, setActiveImage] = useState(product?.product_image?.[0] || noImage);

  // State for revealed phone number
  const [phoneNumber, setPhoneNumber] = useState(null);

  const { data: favoriteData, refetch: refetchFavorites, isLoading: isFavoritesLoading } =
    useGetFavoritesByUserQuery(userId, { skip: !userId });

  useEffect(() => {
    if (userId && productId && favoriteData && !isFavoritesLoading) {
      const favorited =
        favoriteData.favorites?.some(
          (fav) => fav.product?._id.toString() === productId.toString()
        ) || false;
      setIsFavoritedLocal(favorited);
    }
  }, [favoriteData, productId, userId, isFavoritesLoading]);

  const handleMouseEnter = () => {
    gsap.to(cardRef.current, { scale: 1.05, duration: 0.3, ease: "power3.out" });
    gsap.fromTo(
      iconRef.current,
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" }
    );
  };


  const fetchTrustSealStatus = async (sellerUserId) => {
    if (!sellerUserId || trustSealStatus[sellerUserId] !== undefined) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/trust-seal/check-status/${sellerUserId}`
      );

      if (!res.ok) {
        throw new Error("Trust seal check failed");
      }

      const data = await res.json();

      setTrustSealStatus((prev) => ({
        ...prev,
        [sellerUserId]: data.status === "verified",
      }));
    } catch (err) {
      console.error("Trust seal fetch error:", err);
      setTrustSealStatus((prev) => ({
        ...prev,
        [sellerUserId]: false,
      }));
    }
  };
  useEffect(() => {
    // Try different possible paths where user_id might be
    const sellerUserId =
      product?.seller_id?.user_id ||
      product?.sellerInfo?.user_id ||
      product?.sellerInfo?.companyAddress?.user_id ||
      product?.seller?.user_id ||
      null;

    if (sellerUserId && trustSealStatus[sellerUserId] === undefined) {
      fetchTrustSealStatus(sellerUserId);
    }
  }, [product, trustSealStatus]);


  const sellerUserId =
    product?.seller_id?.user_id ||
    product?.sellerInfo?.user_id ||
    product?.sellerInfo?.companyAddress?.user_id ||
    null;

  const hasTrustShield = sellerUserId ? trustSealStatus[sellerUserId] === true : false;

  const trustShieldFromPlan =
    product?.seller_id?.trustshield === true ||
    product?.sellerInfo?.trustshield === true ||
    false;

  const showTrustBadge = hasTrustShield || trustShieldFromPlan;
  const handleMouseLeave = () => {
    gsap.to(cardRef.current, { scale: 1, duration: 0.3, ease: "power3.in" });
    gsap.to(iconRef.current, { y: 50, opacity: 0, duration: 0.5, ease: "power3.in" });
  };

  const handleProduct = (productName, id) => {
    trackProductView(id);
    const formattedName = productName
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-");
    navigate(`/product/${id}`);
  };

  const [toggleFavorite, { isLoading: isToggling }] = useToggleFavoriteMutation();

  const handleToggleFavorite = async (e) => {
    e.stopPropagation();
    if (!productId) {
      showToast("⚠️ No product ID available", "error");
      return;
    }
    if (!userId) {
      setIsOpen(true);
      return;
    }

    if (isToggling) return;

    try {
      const response = await toggleFavorite({ productId }).unwrap();
      const newFavoritedState = response.favorite === true;
      setIsFavoritedLocal(newFavoritedState);

      await axios.post(`${import.meta.env.VITE_API_URL}/favorite-products/track-favorite/${userId}/${productId}`, {
        action: newFavoritedState ? "add" : "remove",
      });

      if (newFavoritedState) {
        showToast("✅ Product added to favorites!", "success");
        try {
          await axios.post(
            `${import.meta.env.VITE_API_URL}/trending-point/create-trending-points-for-favorite`,
            {
              user_id: userId,
              product_id: productId,
              trending_points: 2,
              date: new Date().toISOString().split("T")[0],
            }
          );
        } catch (trendingError) {
          console.error("Trending point error:", trendingError);
        }
      } else {
        showToast("ℹ️ Product removed from favorites.", "info");
      }

      await refetchFavorites();
    } catch (error) {
      showToast("⚠️ Failed to toggle favorite. Try again.", "error");
      console.error("Toggle favorite error:", error);
      setIsFavoritedLocal((prev) => !prev);
    }
  };

  const handleGiveTrendingPoint = async (e) => {
    // Removed e.stopPropagation() here as it's now wrapped by handleCardClick
    if (loading || given) return;

    setLoading(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/trending-point/create-trending-points`,
        {
          user_id: userId,
          product_id: productId,
          trending_points: 1,
          date: new Date().toISOString().split("T")[0],
        }
      );

      if (response.status === 200 || response.status === 201) {
        setGiven(true);
      } else {
        navigate("/login");
      }
    } catch (error) {
      navigate("/login");
      console.error("Trending point error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (e) => {
    // If clicking a button or specific action, don't trigger card navigation
    if (e.target.closest('button')) return;

    handleGiveTrendingPoint(e);
    handleProduct(product.product_name || product.title, productId);
  };

  const handleOpenModal = (e) => {
    e.stopPropagation();
    setOpenQuoteModal(true);
  };

  const handleLogoError = () => {
    setLogoFailed(true);
  };

  const handleImageClick = (image) => {
    setActiveImage(image);
  };

  const renderImages = () => {
    const images = product.product_image || [];
    if (!images.length) {
      return (
        <div className="w-32 h-32 bg-gray-200 rounded flex items-center justify-center">
          <img src={noImage} alt="No Image" className="w-full h-full object-cover rounded" />
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-2">
        <div className="w-32 h-32">
          <img
            src={activeImage}
            alt={product.product_name || "Product"}
            className="w-full h-full object-cover rounded"
            onError={(e) => {
              e.currentTarget.src = noImage;
            }}
          />
        </div>
        {images.length > 1 && (
          <div className="flex gap-1 overflow-x-auto z-1">
            {images.map((img, index) => (
              <img
                key={index}
                src={img}
                alt={`Thumbnail ${index + 1}`}
                className={`w-8 h-8 object-cover rounded cursor-pointer ${img === activeImage ? 'border-2 border-blue-500' : 'border border-gray-300'}`}
                onClick={() => handleImageClick(img)}
                onError={(e) => {
                  e.currentTarget.src = noImage;
                }}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      ref={cardRef}
      className={`relative p-2 cursor-pointer ${viewType === "list" ? "flex flex-row gap-4" : "flex flex-col"
        }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleCardClick}
    >
      {viewType === "list" ? (
        <div className="group relative bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 p-4">

          {/* --- TOP BADGE (Trending) --- */}
          <div className="absolute top-4 right-4 z-20">
            <div className="flex items-center gap-1.5 bg-amber-500/90 backdrop-blur-sm text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-lg border border-white/20">
              <span>🔥</span>
              {Math.round(product?.trending_points || product?.totalTrendingPoints || 0)} PTS
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6">

            {/* --- LEFT: IMAGE SECTION --- */}
            <div className="relative w-full md:w-48 h-48 flex-shrink-0 bg-slate-50 rounded-xl overflow-hidden border border-slate-100">
              {renderImages()}

              {/* Floating Favorite Button */}
              <button
                onClick={(e) => handleToggleFavorite(e)}
                className={`absolute bottom-3 right-3 p-2.5 rounded-full shadow-md backdrop-blur-md transition-all active:scale-90 z-10 border ${isFavoritedLocal
                  ? "bg-red-500 border-red-600 text-white"
                  : "bg-white/80 border-slate-200 text-slate-400 hover:text-red-500"
                  }`}
              >
                <Heart size={18} fill={isFavoritedLocal ? "currentColor" : "none"} />
              </button>
            </div>

            {/* --- RIGHT: CONTENT SECTION --- */}
            <div className="flex-1 flex flex-col justify-between">
              <div>
                {/* Title & Price */}
                <div className="flex flex-col mb-3">
                  <h3 className="text-lg font-bold text-slate-900 leading-tight mb-1 group-hover:text-blue-600 transition-colors">
                    <TruncatedText text={product.product_name || product.title || "Unnamed Product"} max={40} />
                  </h3>
                  <div className="flex items-baseline gap-1.5 min-h-[32px]">
                    {product?.askPrice || parseFloat(price) === 0 ? (
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
                      <>
                        <span className="text-xl font-black text-slate-900">
                          ₹{parseFloat(price).toLocaleString()}
                        </span>
                        <span className="text-sm text-slate-500 font-medium">
                          / {product.unit || "Piece"}
                        </span>
                        {product?.unitOfMeasurement && (
                          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                            ({getUnitLabel(product.unitOfMeasurement)})
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Attributes Grid (Limit to 4 for clean UI) */}
                {product.attributes?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {product.attributes.slice(0, 4).map((attr) => (
                      <div key={attr._id} className="flex items-center gap-1 bg-slate-50 border border-slate-100 px-2 py-1 rounded-md">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                          {attr.attribute_key || attr?.key}:
                        </span>
                        <span className="text-[11px] font-semibold text-slate-600">
                          {String(attr.attribute_value || attr?.value).slice(0, 15)}
                        </span>
                      </div>
                    ))}
                    {product.attributes.length > 4 && (
                      <span className="text-[11px] font-bold text-blue-600">
                        +{product.attributes.length - 4} More
                      </span>
                    )}
                  </div>
                )}

                {/* --- SELLER MINI-CARD --- */}
                {product.sellerInfo && (
                  <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3 flex items-center gap-3">
                    <div className="relative">
                      {logoFailed ? (
                        <div className="w-10 h-10 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center text-[12px] font-bold text-slate-600 border border-white shadow-sm">
                          {product.sellerInfo.company_name?.slice(0, 2).toUpperCase()}
                        </div>
                      ) : (
                        <img
                          src={product.sellerInfo.company_logo || "/fallback-logo.png"}
                          alt="Logo"
                          className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                        />
                      )}
                      {product.sellerInfo?.verified_status && (
                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                          <CheckCircle className="w-3.5 h-3.5 text-blue-500" fill="white" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold text-slate-700 truncate">
                          {product.sellerInfo.company_name}
                        </p>
                        {showTrustBadge && (
                          <div className="flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded-md border border-green-100 shrink-0">
                            <img
                              src={trustShield}
                              className="w-3 h-3 object-contain"
                              alt="Trust Shield Verified"
                            />
                            <span className="text-[9px] font-bold text-green-700 uppercase">
                              Verified
                            </span>
                          </div>
                        )}
                      </div>
                      {product.primaryAddress && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-500">
                          <MapPin size={12} />
                          <span className="truncate">{product.primaryAddress.city}, {product.primaryAddress.state}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {/* Seller + Address Block – using seller_id & primaryAddress */}
              {(product.seller_id || product.sellerInfo) && (
                <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-3 flex items-center gap-3 hover:bg-white transition-all shadow-sm">
                  <div className="relative shrink-0">
                    <img
                      src={
                        product.seller_id?.company_logo ||
                        product.sellerInfo?.company_logo ||
                        noImage
                      }
                      className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm bg-white"
                      onError={(e) => { e.currentTarget.src = noImage; }}
                      alt="Company Logo"
                    />
                    {(product.seller_id?.verified_status || product.sellerInfo?.verified_status) && (
                      <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5 shadow-sm">
                        <CheckCircle className="w-3.5 h-3.5 text-blue-500" fill="currentColor" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-slate-800 truncate leading-none">
                      {product.seller_id?.company_name || product.sellerInfo?.company_name || "Seller"}
                    </p>

                    {product.primaryAddress && (
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1 leading-none">
                        <MapPin size={10} />
                        <span className="truncate">
                          {product.primaryAddress.city}
                          {product.primaryAddress.state ? `, ${product.primaryAddress.state}` : ""}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {/* --- FOOTER ACTIONS --- */}
              <div className="flex items-center gap-3 mt-5">
                <Button
                  className="flex-1 h-11 bg-[#0c1f4d] hover:bg-[#152e6d] text-sm font-bold rounded-xl shadow-lg shadow-blue-900/10 transition-all active:scale-95"
                  onClick={handleOpenModal}
                >
                  Send Enquiry <Mails size={16} className="ml-2" />
                </Button>

                <div className="shrink-0">
                  {phoneNumber ? (
                    <div className="h-11 flex items-center px-4 bg-green-50 text-green-700 border border-green-200 rounded-xl font-bold text-sm shadow-sm">
                      <Phone size={14} className="mr-2" /> {phoneNumber}
                    </div>
                  ) : (
                    <RequestPhoneNumberButton
                      className="h-11 rounded-xl border-slate-200 hover:bg-slate-50 px-4"
                      customerId={userId}
                      sellerId={sellerId?._id}
                      merchantId={merchantId?._id}
                      setPhoneNumber={setPhoneNumber}
                    />
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      ) : (
        <div
          className={`
    relative bg-white border border-slate-200 rounded-xl
    transition-all duration-300 hover:shadow-xl group
    flex flex-col overflow-hidden
    h-[520px]               // ← this is the fixed height for ALL cards — tune this value
  `}
        >
          {/* Image + Badges Section */}
          <div className="relative shrink-0">
            <div className="absolute top-2 left-2 z-20">
              <div className="bg-amber-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1 border border-white/30">
                🔥 {Math.round(product?.trending_points || product?.totalTrendingPoints || 0)} pts
              </div>
            </div>

            <button
              onClick={(e) => handleToggleFavorite(e)}
              disabled={isToggling}
              className={`absolute top-2 right-2 z-20 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-sm border flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${isFavoritedLocal ? "text-red-500 border-red-200" : "text-gray-400 hover:text-red-500 border-gray-200"
                }`}
            >
              <Heart className={`w-4 h-4 ${isFavoritedLocal ? "fill-red-500" : ""}`} />
            </button>

            <div className="w-full aspect-[4/3] md:aspect-[5/4] bg-slate-50 flex items-center justify-center border-b border-slate-100 overflow-hidden">
              <img
                src={product.product_image?.[0] || noImage}
                alt={product.product_name || "Product"}
                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                onError={(e) => { e.currentTarget.src = noImage; }}
              />
            </div>
          </div>

          {/* Content area – takes all remaining space */}
          <div className="flex-1 flex flex-col px-3 pt-3 pb-4">
            {/* Title + Verified */}
            <div className="mb-2">
              <h3 className="text-base font-bold text-slate-900 leading-tight line-clamp-2 min-h-[2.8rem] group-hover:text-blue-700 transition-colors">
                <TruncatedText text={product.product_name || product.title || "Unnamed Product"} max={45} />
              </h3>

              {showTrustBadge && (
                <div className="mt-1.5 inline-flex items-center gap-1 bg-green-50 px-2 rounded-md border border-green-100">
                  <img src={trustShield} className="w-3.5 h-3.5 object-contain" alt="Verified" />
                  <span className="text-[10px] font-bold text-green-700 uppercase">VERIFIED</span>
                </div>
              )}
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-1.5 min-h-[32px]">
              {product?.askPrice || parseFloat(price) === 0 ? (
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
                <>
                  <span className="text-xl font-black text-slate-900">
                    ₹{parseFloat(price).toLocaleString()}
                  </span>
                  <span className="text-sm text-slate-500 font-medium">
                    / {product.unit || "Piece"}
                  </span>
                  {product?.unitOfMeasurement && (
                    <span className="text-[10px] text-slate-400 uppercase font-bold">
                      ({getUnitLabel(product.unitOfMeasurement)})
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Attributes – always reserve space for up to 4, show max 4 */}
            <div className="min-h-[4.5rem]">  {/* ← fixed space reservation */}
              {product.attributes?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {product.attributes.slice(0, 4).map((attr) => (
                    <div
                      key={attr._id}
                      className="bg-slate-100 px-2.5  rounded text-[11px] text-slate-700 flex items-center gap-1"
                    >
                      <span className="font-semibold text-slate-500">
                        {attr.attribute_key || attr.key}:
                      </span>
                      <span className="truncate max-w-[100px]">
                        {String(attr.attribute_value || attr.value)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Seller Info */}
            {(product.seller_id || product.sellerInfo) && (
              <div className="flex items-center gap-2  text-sm min-h-[3rem]">
                <div className="w-6 h-6 rounded-full bg-slate-200 flex-shrink-0 overflow-hidden border border-slate-300">
                  <img
                    src={
                      product.seller_id?.company_logo ||
                      product.sellerInfo?.company_logo ||
                      noImage
                    }
                    alt="Seller"
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.src = noImage; }}
                  />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-slate-800 truncate">
                    {product.seller_id?.company_name || product.sellerInfo?.company_name || "Seller"}
                  </p>
                  {product.primaryAddress && (
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                      <MapPin size={12} className="shrink-0" />
                      <span className="truncate">
                        {product.primaryAddress.city}, {product.primaryAddress.state}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* This spacer pushes the buttons to the bottom consistently */}
            <div className="flex-1" />

            {/* Action Buttons – always at the very bottom */}
            <div className="flex flex-col sm:flex-row gap-2 ">
              <Button
                onClick={handleOpenModal}
                className="flex-1 h-10 bg-[#0c1f4d] cursor-pointer hover:bg-[#152e6d] text-sm font-semibold rounded-lg shadow-md transition-all"
              >
                <MessageSquare size={14} className="mr-1.5" />
                Enquiry
              </Button>

              {phoneNumber ? (
                <div className="h-10 flex items-center justify-center px-4 bg-green-50 text-green-700 border border-green-200 rounded-lg font-medium text-sm">
                  📞 {phoneNumber}
                </div>
              ) : (
                <RequestPhoneNumberButton
                  className="h-10 flex-1 rounded-lg border-slate-200 text-sm"
                  customerId={userId}
                  sellerId={sellerId?._id}
                  merchantId={merchantId?._id}
                  setPhoneNumber={setPhoneNumber}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Updated: Now passing userId and phone like in ProductDetailsPage */}
      {openQuoteModal && (
        <ProductQuoteModel
          product={product}
          productId={productId}
          userId={userId}
          phone={user?.user?.phone}
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

      {isOpen && <LoginModel isOpen={isOpen} setIsOpen={setIsOpen} />}
    </div>
  );
};

export default ProductCard;
