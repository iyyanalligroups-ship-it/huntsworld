import { useState, useContext, useEffect } from "react";
import {
  Heart,
  Eye,
  MapPin,
  CheckCircle,
  Share2,
  Star,
  MessageSquare,
  Phone,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import {
  useToggleFavoriteMutation,
  useGetFavoritesByUserQuery,
} from "@/redux/api/FavoriteApi";
import showToast from "@/toast/showToast";
import axios from "axios";
import { ActiveUserContext } from "@/modules/admin/context/ActiveUserProvider";
import RequestPhoneNumberButton from "../categorySection/ProductsPages/RequestPhoneNumberButton";
import ProductQuoteModel from "../categorySection/ProductsPages/model/ProductQuoteModel";
import LoginModel from "@/modules/landing/modelLogin/Login";
import AskPriceModal from "@/modules/landing/pages/pages/products/AskPriceModal";
import { Button } from "@/components/ui/button";
import { useDispatch } from "react-redux";
import { CategoryApi } from "@/redux/api/CategoryApi";
import trustShield from "@/assets/images/1.png";
import noImage from "@/assets/images/no-image.jpg";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useGiveTrendingPointMutation, useAddTrendingForFavoriteMutation } from "@/redux/api/ProductApi";

// --- MODAL IMPORTS ---
import { Dialog, DialogContent } from "@/components/ui/dialog";
import TrustSealCertificate from "../categorySection/ProductsPages/TrustSealCertificate";

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

const TruncatedText = ({ text, max = 20, className = "" }) => {
  const safeText = text || "";
  const formattedText = safeText.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  const short = formattedText.length <= max ? formattedText : formattedText.slice(0, max) + "…";

  if (formattedText.length <= max) return <span className={className}>{formattedText}</span>;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`${className} cursor-default`} tabIndex={0}>{short}</span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs break-words bg-gray-900 text-white shadow-xl">
          {formattedText}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const ProductCard = ({
  product,
  isInitiallyFavorited = false,
  onFavoriteToggle,
  isVerified = false,
  trustSealStatus = {},
  favoriteIds,
  userId: externalUserId,
  handleTrendingClick,
  loadingTrending,
  handleProductClick,
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useContext(AuthContext);
  const { trackProductView } = useContext(ActiveUserContext);

  const loggedInUserId = externalUserId || user?.user?._id || user?.user?.id || user?._id || user?.id;
  const phone = user?.user?.phone;

  // Extract Data
  const { product: productData, sellerInfo, totalTrendingPoints = 0 } = product;
  const productId = productData?._id || product?._id;
  const merchantId = sellerInfo?._id;
  const sellerId = sellerInfo?._id;
  const image = productData?.product_image?.[0] || noImage;
  const name = productData?.product_name || "Unnamed Product";
  const price = productData?.price?.$numberDecimal || "0";
  const trustShieldFromPlan = sellerInfo?.trustshield;

  // --- MODEL MAPPING LOGIC ---
  // If your backend populates the Merchant's user_id, this is where the Name/Phone lives.
  const sellerUserAccount = sellerInfo?.user_id;

  // State
  const [openQuoteModal, setOpenQuoteModal] = useState(false);
  const [openAskPriceModal, setOpenAskPriceModal] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isFavoritedLocal, setIsFavoritedLocal] = useState(isInitiallyFavorited);
  const [phoneMap, setPhoneMap] = useState({});
  const [showCertificate, setShowCertificate] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const handleGiveTrendingPointInternal = async (e, productId) => {
    e.stopPropagation();
    if (handleTrendingClick) {
      handleTrendingClick(productId);
    }
  };

  // Only fetch favorites if they aren't provided by parent
  const { data: favoriteData, refetch: refetchFavorites, isLoading: favoritesLoading } =
    useGetFavoritesByUserQuery(loggedInUserId, { skip: !loggedInUserId || !!favoriteIds });

  useEffect(() => {
    if (favoriteIds && productId) {
      setIsFavoritedLocal(favoriteIds.has(productId.toString()));
    } else if (loggedInUserId && productId && favoriteData && !favoritesLoading) {
      const favorited = favoriteData.favorites?.some(
        (fav) => fav.product?._id.toString() === productId.toString()
      ) || false;
      setIsFavoritedLocal(favorited || isInitiallyFavorited);
    }
  }, [favoriteData, productId, loggedInUserId, favoritesLoading, isInitiallyFavorited, favoriteIds]);

  const [toggleFavorite, { isLoading: isToggling }] = useToggleFavoriteMutation();
  const [addTrendingForFavorite] = useAddTrendingForFavoriteMutation();

  const handleToggleFavorite = async (e) => {
    e.stopPropagation();
    if (!productId) return;
    if (!loggedInUserId) {
      setIsOpen(true);
      return;
    }
    if (isToggling) return;

    const wasFavorited = isFavoritedLocal;
    const isNowFavorited = !wasFavorited;

    // 🔥 IMMEDIATE optimistic UI update - heart changes instantly
    setIsFavoritedLocal(isNowFavorited);

    try {
      const response = await toggleFavorite({ productId }).unwrap();

      if (!response.success) {
        throw new Error(response.message || 'Failed to toggle favorite');
      }

      // Tracking (async, doesn't block)
      axios.post(`${import.meta.env.VITE_API_URL}/favorite-products/track-favorite/${loggedInUserId}/${productId}`, {
        action: isNowFavorited ? 'add' : 'remove'
      }).catch(err => console.error('Tracking Error:', err));

      if (isNowFavorited) {
        showToast('Product added to favorites!', 'success');
        
        // 🔥 Also add a trending point when favorited
        try {
          await addTrendingForFavorite({
            user_id: loggedInUserId,
            product_id: productId,
          }).unwrap();
          
          if (handleTrendingClick) {
            handleTrendingClick(productId);
          }
        } catch (err) {
          console.error('Add Trending Error:', err);
        }

        if (onFavoriteToggle) onFavoriteToggle();
      } else {
        showToast('Product removed from favorites.', 'info');
      }

      if (!favoriteIds) {
        await refetchFavorites();
      }
    } catch (error) {
      console.error('Favorite Toggle Error:', error);
      // 🔥 Revert optimistic update on error
      setIsFavoritedLocal(wasFavorited);
      showToast('Failed to toggle favorite.', 'error');
    }
  };

  const sellerUserId =
    sellerInfo?.companyAddress?.user_id ||
    (typeof sellerInfo?.user_id === 'object' ? sellerInfo?.user_id?._id : sellerInfo?.user_id) ||
    sellerInfo?._id;
  const trustSealInfo = sellerUserId ? trustSealStatus[sellerUserId] : null;
  const hasTrustSeal = trustSealInfo?.status === "verified";
  const trustSealData = trustSealInfo?.data;
  const showTrustSealBadge = hasTrustSeal || trustShieldFromPlan;

  const address = [
    sellerInfo?.companyAddress?.city,
    sellerInfo?.companyAddress?.state
  ].filter(Boolean).join(", ") || "Location N/A";

  return (
    <>
      <div
        onClick={(e) => handleProductClick(e, name, productId, handleGiveTrendingPointInternal)}
        className="group w-full h-full relative bg-white cursor-pointer rounded-xl border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 ease-out flex flex-col transform-gpu hover:-translate-y-1"
      >
        <div className="relative h-[220px] w-full bg-gray-50 rounded-t-xl overflow-hidden border-b border-gray-100">
          <div className="absolute top-3 left-3 z-20">
            <div 
              onClick={(e) => {
                e.stopPropagation();
                handleGiveTrendingPointInternal(e, productId);
              }}
              className="bg-white/90 backdrop-blur-sm border border-gray-200 text-[#0c1f4d] text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1 hover:bg-white hover:scale-105 transition-all cursor-pointer active:scale-95"
            >
              <span>🔥 {totalTrendingPoints} pts</span>
            </div>
          </div>

          <button
            onClick={handleToggleFavorite}
            disabled={isToggling}
            className={`absolute top-3 right-3 z-20 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-sm border border-gray-200 flex items-center justify-center hover:scale-110 transition-transform active:scale-95 ${isFavoritedLocal ? "text-red-500 border-red-100" : "text-gray-400 hover:text-red-500"
              }`}
          >
            <Heart className={`w-4 h-4 ${isFavoritedLocal ? "fill-red-500" : ""}`} />
          </button>

          <div className="relative w-full h-full p-6 flex items-center justify-center cursor-pointer">
            <img
              src={image}
              alt={name}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500 ease-out"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = noImage;
              }}
            />
          </div>
        </div>

        <div className="p-2 flex flex-col flex-grow">
          <div className="flex items-center justify-between mb-2">
            {showTrustSealBadge && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCertificate(true);
                }}
                className="flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded-md border border-green-100 hover:bg-green-100 transition-colors cursor-help"
              >
                <img src={trustShield} className="w-3 h-3 object-contain" alt="Trust Seal" />
                <span className="text-[9px] font-bold text-green-700 uppercase">Trust Seal</span>
              </div>
            )}
          </div>

          <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2 min-h-[40px] cursor-pointer hover:text-[#0c1f4d]">
            <TruncatedText text={name} max={50} />
          </h3>

          <div>
            {productData?.askPrice || parseFloat(price || 0) === 0 ? (
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
                <span className="text-xl font-extrabold text-[#0c1f4d]">
                  ₹{Math.round(parseFloat(price || 0)).toLocaleString("en-IN")} /
                </span>
                <span className="text-gray-400 text-[10px]"> {getUnitLabel(product?.unitOfMeasurement)}</span>
              </>
            )}
          </div>

          {Array.isArray(product.attributes) && product.attributes.length > 0 && (
            <div className="space-y-1">
              {product.attributes.slice(0, 3).map((attr, index) => (
                <div key={index} className="flex text-[11px] text-gray-600 leading-snug">
                  <span className="font-semibold text-gray-700 mr-1">{attr.key}:</span>
                  <span className="truncate">{attr.value}</span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-auto"></div>

          {sellerInfo && (
            <div className="flex items-center gap-2 mb-3 pt-3 border-t border-gray-100 cursor-pointer" onClick={(e) => handleProductClick(e, name, productId)}>
              <div className="w-6 h-6 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                {sellerInfo.company_logo && !logoError ? (
                  <img
                    src={sellerInfo.company_logo}
                    alt={sellerInfo.company_name}
                    className="w-full h-full object-cover"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-gray-500">
                    {sellerInfo.company_name?.[0] || "S"}
                  </div>
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <span className="text-xs font-medium text-gray-700 truncate">
                    <TruncatedText text={sellerInfo.company_name || "Seller"} max={20} />
                  </span>
                  <TooltipProvider>
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger asChild>
                        <span className="shrink-0 flex items-center">
                          {isVerified ? (
                            <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-red-500" />
                          )}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-[10px] px-2 py-1">
                        {isVerified ? "Verified Supplier" : "Not Verified"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <span className="text-[10px] text-gray-400 truncate flex items-center gap-0.5">
                  <MapPin className="w-2.5 h-2.5" /> {address}
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <Button
              onClick={(e) => { e.stopPropagation(); setOpenQuoteModal(true); }}
              className="bg-[#0c1f4d] w-full cursor-pointer sm:flex-1 hover:bg-red-600 text-white text-xs h-9 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-3.5 h-3.5" /> Enquiry
            </Button>

            <div onClick={(e) => e.stopPropagation()} className="w-full sm:flex-1">
              {phoneMap[sellerUserId] ? (
                <div className="h-9 w-full flex items-center justify-center border rounded-lg bg-gray-50 text-xs font-semibold">
                  {phoneMap[sellerUserId]}
                </div>
              ) : (
                <RequestPhoneNumberButton
                  customerId={loggedInUserId}
                  sellerId={sellerId}
                  merchantId={merchantId}
                  className="h-9 w-full"
                  setPhoneNumber={(num) => setPhoneMap((p) => ({ ...p, [sellerUserId]: num }))}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- CERTIFICATE MODAL --- */}
      <Dialog open={showCertificate} onOpenChange={setShowCertificate}>
        <DialogContent className="max-w-[90vw] md:max-w-[700px] p-0 bg-transparent border-none shadow-none overflow-y-auto overflow-x-hidden max-h-[95vh]">
          {console.log("ProductCard passing to Certificate:", {
            email: sellerInfo?.company_email || sellerUserAccount?.email,
            sellerInfo,
            sellerUserAccount
          })}
          <TrustSealCertificate
            companyName={sellerInfo?.company_name}
            address={address}

            // DYNAMIC DATA FIXES:
            director={trustSealData?.director_name || sellerInfo?.company_name || "Verified Owner"}

            gstin={sellerInfo?.gst_number || "Verified"}

            // mobile: merchant phone number preferred, fallback to personal phone
            mobile={sellerInfo?.company_phone_number || sellerUserAccount?.phone || "Contact via Portal"}

            // email: merchant email preferred, fallback to account email
            email={sellerInfo?.email || sellerUserAccount?.email || "N/A"}

            issueDate={trustSealData?.issueDate || sellerInfo?.createdAt}
            expiryDate={trustSealData?.expiryDate || sellerInfo?.plan_expiry}
          />
        </DialogContent>
      </Dialog>

      {/* Existing Modals */}
      {openQuoteModal && (
        <ProductQuoteModel
          product={product}
          productId={productId}
          userId={loggedInUserId}
          phone={phone}
          open={openQuoteModal}
          setOpen={setOpenQuoteModal}
        />
      )}
      {isOpen && <LoginModel isOpen={isOpen} setIsOpen={setIsOpen} />}
      {openAskPriceModal && (
        <AskPriceModal
          isOpen={openAskPriceModal}
          onClose={() => setOpenAskPriceModal(false)}
          product={productData}
        />
      )}
    </>
  );
};

export default ProductCard;
