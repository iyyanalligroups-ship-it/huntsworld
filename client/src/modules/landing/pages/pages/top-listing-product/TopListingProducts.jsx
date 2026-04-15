import React, { useEffect, useState, useContext, useMemo, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { useDispatch } from "react-redux";
import { CategoryApi } from "@/redux/api/CategoryApi";
import {
  MapPin,
  CheckCircle,
  Heart,
  MessageSquare,
  Loader2,
  ChevronLeft,
  ChevronRight,
  XCircle,
} from 'lucide-react';

// Redux & API Imports
import {
  useGiveTrendingPointMutation,
  useAddTrendingForFavoriteMutation,
} from "@/redux/api/ProductApi";
import {
  useToggleFavoriteMutation,
  useGetFavoritesByUserQuery,
} from "@/redux/api/FavoriteApi";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import RequestPhoneNumberButton from "../categorySection/ProductsPages/RequestPhoneNumberButton";
import ProductQuoteModel from "../categorySection/ProductsPages/model/ProductQuoteModel";
import LoginModel from "@/modules/landing/modelLogin/Login";
import { Button } from "@/components/ui/button";
import showToast from "@/toast/showToast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import noImage from "@/assets/images/no-image.jpg";
import trustShieldIcon from "@/assets/images/1.png";
import AskPriceModal from "@/modules/landing/pages/pages/products/AskPriceModal";
import { ActiveUserContext } from "@/modules/admin/context/ActiveUserProvider";

// --- NEW IMPORTS FOR CERTIFICATE ---
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
  const found = unitOptions.find(
    (u) => u.value.toLowerCase() === unitValue.toLowerCase()
  );
  return found ? found.label : unitValue;
};

const TruncatedText = ({ text, max = 35, className = "" }) => {
  const safeText = text || "";
  const formattedText = safeText
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

  const short =
    formattedText.length <= max
      ? formattedText
      : formattedText.slice(0, max) + "…";

  if (formattedText.length <= max) {
    return <span className={className}>{formattedText}</span>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`${className} cursor-default`} tabIndex={0}>
            {short}
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

const ProductCard = ({
  product,
  seller,
  companyAddress,
  userId,
  favoriteIds,
  handleToggleFavorite,
  handleOpenQuoteModal,
  handleProductClick,
  isVerified = false,
  trustSealInfo = null,
  onOpenCert,
  setShowLoginModal,
  handleTrendingClick,
  loadingTrending,
}) => {
  const [openCertificateModal, setOpenCertificateModal] = useState(false);
  const productId = product._id;
  const firstImage = product.product_image?.[0] || noImage;
  // 🔥 Use optimistic state if available, otherwise use favoriteIds
  const isFavorited = product._favoriteState !== undefined ? product._favoriteState : ((productId && favoriteIds) ? favoriteIds.has(productId.toString()) : false);
  const [phoneMap, setPhoneMap] = useState({});
  const [openAskPriceModal, setOpenAskPriceModal] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const handleInternalTrending = async (e, id) => {
    if (e) e.stopPropagation();
    if (handleTrendingClick) {
      handleTrendingClick(id);
    }
  };

  // Extract real ID string
  const sellerUserId =
    (typeof seller?.user_id === 'object' ? seller?.user_id?._id : seller?.user_id) ||
    companyAddress?.user_id ||
    seller?._id;

  const formattedAddress = [companyAddress?.city, companyAddress?.state].filter(Boolean).join(", ");

  const hasTrustSeal = trustSealInfo?.status === "verified";
  const trustSealData = trustSealInfo?.data;
  const showTrustSealBadge = hasTrustSeal || seller?.trustshield === true;

  return (
    <div
      onClick={(e) => handleProductClick(e, product.product_name, productId, handleInternalTrending)}
      className="group w-full h-full relative bg-white cursor-pointer rounded-xl border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 ease-out flex flex-col transform-gpu hover:-translate-y-1"
    >
      <div className="relative h-[220px] w-full bg-gray-50 rounded-t-xl overflow-hidden border-b border-gray-100 shrink-0">
        <div className="absolute top-3 left-3 z-20">
          <div 
            onClick={(e) => {
              e.stopPropagation();
              handleInternalTrending(e, productId);
            }}
            className="bg-white/90 backdrop-blur-sm border border-gray-200 text-[#0c1f4d] text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1 hover:bg-white hover:scale-105 transition-all cursor-pointer active:scale-95"
          >
            <span>🔥{product.totalTrendingPoints || 0} pts</span>
          </div>
        </div>

        {userId && (
          <button
            onClick={(e) => handleToggleFavorite(e, productId)}
            className="absolute top-3 right-3 z-20 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-sm border border-gray-200 flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
          >
            <Heart className={`w-4 h-4 ${isFavorited ? "fill-red-500 text-red-500" : "text-gray-400"}`} />
          </button>
        )}

        <div className="relative w-full h-full p-6 flex items-center justify-center">
          <img src={firstImage} alt={product.product_name} loading="lazy" className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500" />
        </div>
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <div className="flex items-center justify-between mb-2">
          {showTrustSealBadge && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                onOpenCert({
                  companyName: seller?.company_name || "Company Name",
                  address: formattedAddress || "Location N/A",
                  director: trustSealData?.director_name || seller?.company_name || "Verified Owner",
                  gstin: seller?.gst_number || "Verified",
                  mobile: seller?.company_phone_number || (typeof seller?.user_id === 'object' ? seller?.user_id?.phone : "N/A"),
                  email: seller?.company_email || (typeof seller?.user_id === 'object' ? seller?.user_id?.email : "N/A"),
                  issueDate: trustSealData?.issueDate || product?.createdAt,
                  expiryDate: trustSealData?.expiryDate
                });
              }}
              className="flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded-md border border-green-100 hover:bg-green-100 cursor-help"
            >
              <img src={trustShieldIcon} className="w-3 h-3 object-contain" alt="Trust Seal" />
              <span className="text-[9px] font-bold text-green-700 uppercase">Trust Seal</span>
            </div>
          )}
        </div>

        <h3
          className="text-sm font-bold text-gray-900 leading-snug min-h-[40px]"
        >
          <TruncatedText text={product.product_name} max={50} />
        </h3>

        <div>
          {product?.askPrice || parseFloat(product.price?.$numberDecimal || 0) === 0 ? (
            <Button onClick={(e) => { e.stopPropagation(); setOpenAskPriceModal(true); }} className="bg-red-600 text-white text-xs h-8 px-4 mt-1 mb-2">Ask Price</Button>
          ) : (
            <div className="mb-2"><span className="text-xl font-extrabold text-[#0c1f4d]">₹{Math.round(parseFloat(product.price?.$numberDecimal || 0)).toLocaleString("en-IN")}/</span><span className="text-gray-400 text-[10px]"> {getUnitLabel(product?.unitOfMeasurement)}</span></div>
          )}
        </div>

        <div className="space-y-1 min-h-[75px]">
          {Array.isArray(product.attributes) && product.attributes.slice(0, 4).map((attr, index) => (
            <div key={index} className="flex text-[11px] text-gray-600 truncate"><span className="font-semibold text-gray-700 mr-1">{attr.attribute_key || attr.key}:</span>{attr.attribute_value || attr.value}</div>
          ))}
        </div>

        <div className="pt-3 border-t border-gray-100 mt-auto flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 overflow-hidden shrink-0">
              {seller?.company_logo && !logoError ? (
                <img
                  src={seller.company_logo}
                  alt="Logo"
                  className="w-full h-full object-cover"
                  onError={() => setLogoError(true)}
                />
              ) : (
                seller?.company_name?.[0] || "S"
              )}
            </div>
            <span className="text-xs font-medium text-gray-700 truncate"><TruncatedText text={seller?.company_name || "Seller Info N/A"} max={20} /></span>
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
          {formattedAddress && <div className="flex items-center gap-1.5 text-gray-500"><MapPin className="w-3 h-3" /><span className="text-[11px] truncate">{formattedAddress}</span></div>}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full mt-3">
          <Button onClick={(e) => { e.stopPropagation(); handleOpenQuoteModal(product); }} className="bg-[#0c1f4d] cursor-pointer hover:bg-red-600 w-full sm:flex-1 text-white text-xs h-9 rounded-lg"><MessageSquare className="w-3.5 h-3.5" /> Enquiry</Button>
          <div className="w-full sm:flex-1">
            {phoneMap[sellerUserId] ? (
              <div className="h-9 w-full flex items-center justify-center border rounded-lg bg-gray-50 text-xs font-semibold">{phoneMap[sellerUserId]}</div>
            ) : (
              <RequestPhoneNumberButton customerId={userId} sellerId={seller?._id} merchantId={seller?._id} className="h-9 w-full" setPhoneNumber={(num) => setPhoneMap(p => ({ ...p, [sellerUserId]: num }))} />
            )}
          </div>
        </div>
      </div>
      {openAskPriceModal && <AskPriceModal isOpen={openAskPriceModal} onClose={() => setOpenAskPriceModal(false)} product={product} />}
    </div>
  );
};

const TopSellers = () => {
  const [rawProducts, setRawProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const [openQuoteModal, setOpenQuoteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // --- STATE FOR VERIFICATION & TRUST SEAL ---
  const [verifiedMap, setVerifiedMap] = useState({});
  const [trustSealStatus, setTrustSealStatus] = useState({});
  const [showCertificate, setShowCertificate] = useState(false);
  const [certData, setCertData] = useState(null);

  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { trackProductView } = useContext(ActiveUserContext);

  const loggedInUserId = user?.user?._id || user?.user?.id || user?._id || user?.id;
  const dispatch = useDispatch();
  const phone = user?.user?.phone;
  const token = sessionStorage.getItem('token');
  const API_URL = `${import.meta.env.VITE_API_URL}/top-listing-plan-payment/seller-products`;

  const [giveTrendingPoint, { isLoading: loadingTrendingGlobal }] = useGiveTrendingPointMutation();

  const handleTrendingClick = async (productId) => {
    if (!loggedInUserId) {
      setShowLoginModal(true);
      return;
    }
    try {
      // 1. Optimistic Update in rawProducts
      setRawProducts((prev) =>
        prev.map(p =>
          p._id === productId
            ? { ...p, totalTrendingPoints: (Number(p.totalTrendingPoints) || 0) + 1 }
            : p
        )
      );

      const res = await giveTrendingPoint({ user_id: loggedInUserId, product_id: productId }).unwrap();

      if (res.success) {
        // Sync with backend if result is different from +1
        if (res.pointsAdded !== 1) {
          setRawProducts((prev) =>
            prev.map(p =>
              p._id === productId
                ? { ...p, totalTrendingPoints: (Number(p.totalTrendingPoints) || 0) - 1 + res.pointsAdded }
                : p
            )
          );
        }
        // 🔥 Cache invalidation now handled by mutation's onQueryStarted hook (both ProductApi & CategoryApi)
      } else {
        // Revert
        setRawProducts((prev) =>
          prev.map(p =>
            p._id === productId
              ? { ...p, totalTrendingPoints: Math.max(0, (Number(p.totalTrendingPoints) || 0) - 1) }
              : p
          )
        );
      }
    } catch (err) {
      console.error("Top Sellers Trending Error:", err);
      // Revert
      setRawProducts((prev) =>
        prev.map(p =>
          p._id === productId
            ? { ...p, totalTrendingPoints: Math.max(0, (Number(p.totalTrendingPoints) || 0) - 1) }
            : p
        )
      );
    }
  };

  const { data: favoriteData, refetch: refetchFavorites } = useGetFavoritesByUserQuery(loggedInUserId, { skip: !loggedInUserId });
  const [toggleFavorite, { isLoading: isToggling }] = useToggleFavoriteMutation();
  const [addTrendingForFavorite] = useAddTrendingForFavoriteMutation();

  const favoriteIds = useMemo(() => {
    return new Set(
      favoriteData?.favorites?.map((fav) => fav.product?._id.toString()) || []
    );
  }, [favoriteData]);

  const fetchProducts = useCallback(async (pageNum) => {
    const isInitial = pageNum === 1;
    if (isInitial) setLoading(true);
    else setLoadingMore(true);

    setError(null);

    try {
      const res = await axios.get(`${API_URL}?page=${pageNum}&limit=20`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.data.success) {
        const newSellers = res.data.data || [];
        const newProducts = newSellers.flatMap((sellerGroup) =>
          sellerGroup.products.map((p) => ({
            ...p,
            // We attach the user object inside the seller object to match populate structure
            seller: {
              ...sellerGroup.seller,
              user_id: sellerGroup.user // This injects the User Model (Name, Phone, Email)
            },
            companyAddress: sellerGroup.companyAddress,
            user: sellerGroup.user,
          }))
        );

        setRawProducts((prev) => {
          if (pageNum === 1) return newProducts;

          const productMapById = new Map();
          prev.forEach(p => productMapById.set(p._id, p));
          newProducts.forEach(p => productMapById.set(p._id, p));

          return Array.from(productMapById.values());
        });

        setHasMore(res.data.pagination?.hasNextPage || false);
        if (pageNum > 1) setPage(pageNum);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load premium catalog");
    } finally {
      if (isInitial) setLoading(false);
      setLoadingMore(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProducts(1);
  }, [fetchProducts]);

  const handleLoadMore = () => {
    if (hasMore && !loadingMore) {
      fetchProducts(page + 1);
    }
  };

  const sortedProducts = useMemo(() => {
    return [...rawProducts].sort((a, b) => {
      const scoreA = Number(a.totalTrendingPoints) || 0;
      const scoreB = Number(b.totalTrendingPoints) || 0;
      if (scoreB !== scoreA) return scoreB - scoreA;
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
  }, [rawProducts]);

  const row1Products = sortedProducts.slice(0, 10);
  const row2Products = sortedProducts.slice(10, 20);

  const handleProductClick = (e, name, id, trendingHandler) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (trendingHandler) trendingHandler(e, id);
    if (trackProductView) trackProductView(id); 
    navigate(`/product/${id}`);
  };

  const handleToggleFavorite = async (e, productId) => {
    e.stopPropagation();
    if (!productId || !loggedInUserId) { setShowLoginModal(true); return; }
    if (isToggling) return;

    const wasFavorited = favoriteIds.has(productId.toString());
    const isNowFavorited = !wasFavorited;

    // 🔥 IMMEDIATE optimistic UI update
    setRawProducts((prev) =>
      prev.map(p =>
        p._id === productId
          ? { ...p, _favoriteState: isNowFavorited }
          : p
      )
    );

    try {
      const response = await toggleFavorite({ productId }).unwrap();
      if (!response.success) {
        throw new Error(response.message || 'Failed to toggle favorite');
      }

      if (isNowFavorited) {
        showToast('Product added to favorites!', 'success');
        try {
          const favRes = await addTrendingForFavorite({ user_id: loggedInUserId, product_id: productId }).unwrap();
          const pointsToAdd = Number(favRes.pointsAdded) || 0;

          if (favRes.success && pointsToAdd > 0) {
            setRawProducts((prev) =>
              prev.map(p =>
                p._id === productId
                  ? { ...p, totalTrendingPoints: (Number(p.totalTrendingPoints) || 0) + pointsToAdd, _favoriteState: true }
                  : p
              )
            );
          }
          // 🔥 Cache invalidation now handled by mutation's onQueryStarted hook (both ProductApi & CategoryApi)
        } catch (err) {
          console.error('Add Trending Error:', err);
        }
      } else {
        showToast('Product removed from favorites.', 'info');
        setRawProducts((prev) =>
          prev.map(p =>
            p._id === productId
              ? { ...p, _favoriteState: false }
              : p
          )
        );
      }
      await refetchFavorites();
    } catch (error) {
      console.error('Favorite Toggle Error:', error);
      // 🔥 Revert optimistic update on error
      setRawProducts((prev) =>
        prev.map(p =>
          p._id === productId
            ? { ...p, _favoriteState: wasFavorited }
            : p
        )
      );
      showToast('Failed to update favorite.', 'error');
    }
  };

  const fetchVerificationStatus = async (sellerUserId) => {
    if (!sellerUserId || verifiedMap[sellerUserId] !== undefined) return;
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/user-subscription-plan/verification-expire`, { params: { user_id: sellerUserId } });
      const isActive = res.data?.success && res.data?.expires_at && new Date(res.data.expires_at) > new Date();
      setVerifiedMap((prev) => ({ ...prev, [sellerUserId]: isActive }));
    } catch (err) { setVerifiedMap((prev) => ({ ...prev, [sellerUserId]: false })); }
  };

  const fetchTrustSealStatus = async (sellerUserId) => {
    if (!sellerUserId || trustSealStatus[sellerUserId] !== undefined) return;
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/trust-seal/check-status/${sellerUserId}`
      );
      setTrustSealStatus((prev) => ({
        ...prev,
        [sellerUserId]: res.data,
      }));
    } catch {
      setTrustSealStatus((prev) => ({
        ...prev,
        [sellerUserId]: { status: null, data: null },
      }));
    }
  };

  useEffect(() => {
    sortedProducts.forEach((product) => {
      const sellerUserId = (typeof product?.seller?.user_id === 'object' ? product?.seller?.user_id?._id : product?.seller?.user_id) || product?.user?._id;
      if (sellerUserId) {
        fetchVerificationStatus(sellerUserId);
        fetchTrustSealStatus(sellerUserId);
      }
    });
  }, [sortedProducts]);

  // Carousels
  const [emblaRefLtr, emblaApiLtr] = useEmblaCarousel({ loop: true, dragFree: true, direction: 'ltr' }, [Autoplay({ delay: 3000, stopOnInteraction: false })]);
  const [emblaRefRtl, emblaApiRtl] = useEmblaCarousel({ loop: true, dragFree: true, direction: 'rtl' }, [Autoplay({ delay: 3000, stopOnInteraction: false })]);

  const scrollPrevLtr = useCallback(() => emblaApiLtr?.scrollPrev(), [emblaApiLtr]);
  const scrollNextLtr = useCallback(() => emblaApiLtr?.scrollNext(), [emblaApiLtr]);
  const scrollPrevRtl = useCallback(() => emblaApiRtl?.scrollPrev(), [emblaApiRtl]);
  const scrollNextRtl = useCallback(() => emblaApiRtl?.scrollNext(), [emblaApiRtl]);

  const [prevEnabledLtr, setPrevEnabledLtr] = useState(false);
  const [nextEnabledLtr, setNextEnabledLtr] = useState(false);
  const [prevEnabledRtl, setPrevEnabledRtl] = useState(false);
  const [nextEnabledRtl, setNextEnabledRtl] = useState(false);

  useEffect(() => {
    if (!emblaApiLtr) return;
    const onSelect = () => { setPrevEnabledLtr(emblaApiLtr.canScrollPrev()); setNextEnabledLtr(emblaApiLtr.canScrollNext()); };
    emblaApiLtr.on('select', onSelect).on('init', onSelect);
  }, [emblaApiLtr]);

  useEffect(() => {
    if (!emblaApiRtl) return;
    const onSelect = () => { setPrevEnabledRtl(emblaApiRtl.canScrollPrev()); setNextEnabledRtl(emblaApiRtl.canScrollNext()); };
    emblaApiRtl.on('select', onSelect).on('init', onSelect);
  }, [emblaApiRtl]);

  // --- HANDLER FOR CERTIFICATE ---
  const handleOpenCertificate = (data) => {
    setCertData(data);
    setShowCertificate(true);
  };

  if (loading) return <div className="flex h-64 flex-col items-center justify-center gap-3 p-8"><Loader2 className="animate-spin text-blue-600 w-10 h-10" /><p className="text-gray-600">Loading premium catalog...</p></div>;
  if (error) return <div className="text-center text-red-500 mt-10 p-8">{error}</div>;

  return (
    <div className="p-4 md:p-8 font-sans">
      <div className="relative mb-12 flex flex-col items-start">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-[2px] h-[24px] bg-red-600" />
          <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-gray-400">Premium Catalog</span>
        </div>
        <h2 className="text-1xl md:text-3xl font-black text-[#0c1f4d] tracking-tighter leading-tight">Top Verified <span className="text-red-600">Sellers</span></h2>
        <div className="h-[4px] w-[80px] bg-[#0c1f4d] mt-4 rounded-full" />
      </div>

      {/* Row 1 */}
      {row1Products.length > 0 && (
        <div className="mb-16 relative">
          <div className="overflow-hidden" ref={emblaRefLtr}>
            <div className="flex touch-pan-y items-stretch">
              {row1Products.map((product) => (
                <div key={product._id} className="flex-[0_0_100%] sm:flex-[0_0_50%] md:flex-[0_0_33.333%] lg:flex-[0_0_25%] xl:flex-[0_0_20%] px-3 py-2">
                  <ProductCard
                    product={product}
                    seller={product.seller}
                    companyAddress={product.companyAddress}
                    userId={loggedInUserId}
                    favoriteIds={favoriteIds}
                    handleToggleFavorite={handleToggleFavorite}
                    handleOpenQuoteModal={setSelectedProduct}
                    handleProductClick={handleProductClick}
                    isVerified={verifiedMap[(typeof product?.seller?.user_id === 'object' ? product?.seller?.user_id?._id : product?.seller?.user_id) || product?.user?._id]}
                    trustSealInfo={trustSealStatus[(typeof product?.seller?.user_id === 'object' ? product?.seller?.user_id?._id : product?.seller?.user_id) || product?.user?._id]}
                    onOpenCert={handleOpenCertificate}
                    setShowLoginModal={setShowLoginModal}
                    handleTrendingClick={handleTrendingClick}
                    loadingTrending={loadingTrendingGlobal}
                  />
                </div>
              ))}
            </div>
          </div>
          <button className="absolute -left-4 md:-left-8 top-1/2 -translate-y-1/2 z-20 h-12 w-12 flex items-center justify-center rounded-full bg-black/60 text-white disabled:opacity-40" onClick={scrollPrevLtr} disabled={!prevEnabledLtr}><ChevronLeft /></button>
          <button className="absolute -right-4 md:-right-8 top-1/2 -translate-y-1/2 z-20 h-12 w-12 flex items-center justify-center rounded-full bg-black/60 text-white disabled:opacity-40" onClick={scrollNextLtr} disabled={!nextEnabledLtr}><ChevronRight /></button>
        </div>
      )}

      {/* Row 2 */}
      {row2Products.length > 0 && (
        <div className="mb-16 relative">
          <div className="overflow-hidden" ref={emblaRefRtl} dir="rtl">
            <div className="flex touch-pan-y items-stretch" dir="ltr">
              {row2Products.map((product) => (
                <div key={product._id} className="flex-[0_0_100%] sm:flex-[0_0_50%] md:flex-[0_0_33.333%] lg:flex-[0_0_25%] xl:flex-[0_0_20%] px-3 py-2">
                  <ProductCard
                    product={product}
                    seller={product.seller}
                    companyAddress={product.companyAddress}
                    userId={loggedInUserId}
                    favoriteIds={favoriteIds}
                    handleToggleFavorite={handleToggleFavorite}
                    handleOpenQuoteModal={setSelectedProduct}
                    handleProductClick={handleProductClick}
                    isVerified={verifiedMap[(typeof product?.seller?.user_id === 'object' ? product?.seller?.user_id?._id : product?.seller?.user_id) || product?.user?._id]}
                    trustSealInfo={trustSealStatus[(typeof product?.seller?.user_id === 'object' ? product?.seller?.user_id?._id : product?.seller?.user_id) || product?.user?._id]}
                    onOpenCert={handleOpenCertificate}
                    setShowLoginModal={setShowLoginModal}
                    handleTrendingClick={handleTrendingClick}
                    loadingTrending={loadingTrendingGlobal}
                  />
                </div>
              ))}
            </div>
          </div>
          <button className="absolute -left-4 md:-left-8 top-1/2 -translate-y-1/2 z-20 h-12 w-12 flex items-center justify-center rounded-full border-[#0c1f4d] text-[#0c1f4d] disabled:opacity-40" onClick={scrollPrevRtl} disabled={!prevEnabledRtl}><ChevronLeft /></button>
          <button className="absolute -right-4 md:-right-8 top-1/2 -translate-y-1/2 z-20 h-12 w-12 flex items-center justify-center rounded-full border-[#0c1f4d] text-[#0c1f4d] disabled:opacity-40" onClick={scrollNextRtl} disabled={!nextEnabledRtl}><ChevronRight /></button>
        </div>
      )}

      {/* --- CERTIFICATE MODAL --- */}
      <Dialog open={showCertificate} onOpenChange={setShowCertificate}>
        <DialogContent className="max-w-[90vw] md:max-w-[700px] p-0 bg-transparent border-none shadow-none overflow-y-auto overflow-x-hidden max-h-[95vh]">
          {certData && (
            <TrustSealCertificate
              companyName={certData.companyName}
              address={certData.address}
              director={certData.director}
              gstin={certData.gstin}
              mobile={certData.mobile}
              email={certData.email}
              issueDate={certData.issueDate}
              expiryDate={certData.expiryDate}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Other Modals */}
      {selectedProduct && <ProductQuoteModel product={selectedProduct} productId={selectedProduct._id} open={!!selectedProduct} setOpen={() => setSelectedProduct(null)} userId={loggedInUserId} phone={phone} />}
      {showLoginModal && <LoginModel isOpen={showLoginModal} setIsOpen={setShowLoginModal} />}
    </div>
  );
};



export default TopSellers;
