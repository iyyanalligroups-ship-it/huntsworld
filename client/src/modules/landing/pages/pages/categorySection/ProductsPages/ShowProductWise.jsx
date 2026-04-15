import { useContext, useState, useEffect, useMemo } from "react";
import { useGetAllProductsQuery, useGiveTrendingPointMutation, useAddTrendingForFavoriteMutation } from "@/redux/api/ProductApi";
import {
  useToggleFavoriteMutation,
  useGetFavoritesByUserQuery,
} from "@/redux/api/FavoriteApi";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { CategoryApi } from "@/redux/api/CategoryApi";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import axios from "axios";
import {
  Heart,
  MessageSquare,
  MapPin,
  Loader2,
  Plus,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import TrustSealCertificate from "./TrustSealCertificate";
import showToast from "@/toast/showToast";
import RequestPhoneNumberButton from "./RequestPhoneNumberButton";
import ProductQuoteModel from "./model/ProductQuoteModel";
import AskPriceModal from "@/modules/landing/pages/pages/products/AskPriceModal";
import { ActiveUserContext } from "@/modules/admin/context/ActiveUserProvider";
import noImage from "@/assets/images/no-image.jpg";
import trustShield from "@/assets/images/1.png";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import LoginModel from "@/modules/landing/modelLogin/Login";
import { motion } from 'framer-motion';

const LIMIT = 10;

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
  userId,
  favoriteIds,
  handleProductClick,
  handleToggleFavorite,
  handleOpenQuoteModal,
  verifiedMap,
  trustSealStatus,
  noImage,
  trustShield,
  TruncatedText,
  getUnitLabel,
  setOpenAskPriceModal,
  setShowLoginModal,
  handleTrendingClick,
  loadingTrending,
}) => {
  const [openCertificateModal, setOpenCertificateModal] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const productData = product.product || product;
  const productId = productData?._id || product?._id;

  // 🔥 Trending Points Logic (Internal to Card for visual speed)
  const [localTrendingPoints, setLocalTrendingPoints] = useState(product.totalTrendingPoints || 0);
  const dispatch = useDispatch();

  useEffect(() => {
    setLocalTrendingPoints(product.totalTrendingPoints || 0);
  }, [product.totalTrendingPoints]);

  const handleInternalTrending = async (e, id) => {
    e.stopPropagation();
    if (loadingTrending) return;
    if (handleTrendingClick) {
      handleTrendingClick(id);
    }
  };

  const onCardClick = (e, name, id) => {
    // Only trigger if clicking the card body, not buttons (buttons should stopPropagation)
    handleInternalTrending(e, id);
    handleProductClick(e, name, id);
  };

  console.log("product show products", product);
  // 🔥 Use optimistic state if available, otherwise use favoriteIds
  const isFavorited = product._favoriteState !== undefined ? product._favoriteState : (productId ? favoriteIds.has(productId.toString()) : false);

  const merchantId = product.sellerInfo?._id;
  const sellerId = product.sellerInfo?._id;

  // Mapping paths based on backend aggregation
  const sellerUserId =
    product.sellerInfo?.companyAddress?.user_id ||
    (typeof product.sellerInfo?.user_id === 'object' ? product.sellerInfo?.user_id?._id : product.sellerInfo?.user_id) ||
    product.sellerInfo?._id;

  // Verification Logic:
  const trustSealInfo = sellerUserId ? trustSealStatus[sellerUserId] : null;
  const hasTrustSeal = trustSealInfo?.status === "verified";
  const trustSealData = trustSealInfo?.data;
  const isVerified = verifiedMap[sellerUserId] === true;
  const showTrustSealBadge = hasTrustSeal || product.sellerInfo?.trustshield === true;

  const address = [
    product.sellerInfo?.companyAddress?.city,
    product.sellerInfo?.companyAddress?.state,
  ].filter(Boolean).join(", ");

  const directorName = product.sellerInfo?.user_id?.name || "Verified Owner";

  const fullAddress = [
    product.sellerInfo?.companyAddress?.address_line_1,
    product.sellerInfo?.companyAddress?.city,
    product.sellerInfo?.companyAddress?.state,
    product.sellerInfo?.companyAddress?.pincode
  ].filter(Boolean).join(", ");

  const [revealedPhone, setRevealedPhone] = useState(null);

  return (
    <div
      onClick={(e) => handleProductClick(e, product.product_name, productId, handleInternalTrending)}
      className="
        group relative bg-white cursor-pointer
        rounded-xl border border-gray-200
        shadow-sm hover:shadow-xl
        transition-all duration-300
        flex flex-col h-full
      "
    >
      <div
        className="
          relative w-full
          aspect-[4/3]
          max-h-[220px]
          bg-gray-50
          rounded-t-xl
          overflow-hidden
          border-b
        "
      >
        <div className="absolute top-3 left-3 z-20">
          <div className="bg-white/90 backdrop-blur-sm border border-gray-200 text-[#0c1f4d] text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
            <span>🔥 {Math.round(localTrendingPoints)} pts</span>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation(); // 🔥 Stop bubbling to card onClick
            handleToggleFavorite(e, productId);
          }}
          className="absolute top-3 right-3 z-20 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-sm border border-gray-200 flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
        >
          <Heart className={`w-4 h-4 ${isFavorited ? "fill-red-500 text-red-500" : "text-gray-400"}`} />
        </button>

        {/* Removed redundant onClick here */}
        <div
          className="relative w-full h-full p-6 flex items-center justify-center pointer-events-none"
        >
          <img
            src={product.product_image?.[0] || noImage}
            alt={product.product_name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500 ease-out"
            onError={(e) => (e.currentTarget.src = noImage)}
          />
        </div>
      </div>

      <div className="p-3 flex flex-col flex-1 min-h-0">
        <div className="flex items-center justify-between mb-2">
          {showTrustSealBadge && (
            <Dialog open={openCertificateModal} onOpenChange={setOpenCertificateModal}>
              <DialogTrigger asChild>
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded-md border border-green-100 cursor-help hover:bg-green-100 transition-colors"
                >
                  <img src={trustShield} className="w-3 h-3 object-contain" alt="Trust Seal" />
                  <span className="text-[9px] font-bold text-green-700 uppercase">Trust Seal</span>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-[700px] w-full max-h-[90vh] overflow-y-auto overflow-x-hidden p-0 border-none bg-white rounded-xl shadow-2xl">
                <DialogHeader className="sr-only">
                  <DialogTitle>Trust Seal Certificate</DialogTitle>
                </DialogHeader>
                <div className="w-full h-full p-4 sm:p-8 bg-gray-100/50">
                  <TrustSealCertificate
                    companyName={product.sellerInfo?.company_name || product.sellerInfo?.travels_name}
                    address={fullAddress || "Address not provided"}
                    director={trustSealData?.director_name || product.sellerInfo?.company_name || "Verified Owner"}
                    gstin={product.sellerInfo?.gst_number || "Verified"}
                    mobile={product.sellerInfo?.company_phone_number || product.sellerInfo?.user_id?.phone || "N/A"}
                    email={product.sellerInfo?.company_email || product.sellerInfo?.user_id?.email || "N/A"}
                    issueDate={trustSealData?.issueDate || product.sellerInfo?.createdAt}
                    expiryDate={trustSealData?.expiryDate}
                  />
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Removed redundant onClick here */}
        <h3
          className="text-sm font-bold text-gray-900 leading-snug line-clamp-2 min-h-[40px] hover:text-[#0c1f4d] transition-colors"
        >
          <TruncatedText text={product.product_name} max={50} />
        </h3>

        <div>
          {product?.askPrice || parseFloat(product.price?.$numberDecimal || product.price || 0) === 0 ? (
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
                ₹{Math.round(parseFloat(product.price?.$numberDecimal || 0)).toLocaleString("en-IN")}{" / "}
              </span>
              <span className="text-gray-400 text-[10px]">
                {getUnitLabel(product?.unitOfMeasurement)}
              </span>
            </>
          )}
        </div>

        {Array.isArray(product?.attributes) && product?.attributes.length > 0 && (
          <div className="space-y-1">
            {product.attributes.slice(0, 3).map((attr, index) => (
              <div key={index} className="flex text-[11px] text-gray-600 leading-snug">
                <span className="font-semibold text-gray-700 mr-1">{attr.key}:</span>
                <span className="truncate">{attr.value}</span>
              </div>
            ))}
          </div>
        )}

        <div
          className="pt-3 border-t border-gray-100 mt-auto flex flex-col gap-1.5 mb-4"
          onClick={(e) => onCardClick(e, product.product_name, productId)}
        >
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 overflow-hidden shrink-0">
              {product.sellerInfo?.company_logo && !logoError ? (
                <img
                  src={product.sellerInfo.company_logo}
                  className="w-full h-full object-cover"
                  alt="logo"
                  onError={() => setLogoError(true)}
                />
              ) : (
                product.sellerInfo?.company_name?.[0] || "S"
              )}
            </div>
            <span className="text-xs font-medium text-gray-700 truncate">
              <TruncatedText text={product.sellerInfo?.company_name || "Seller Info N/A"} max={20} />
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

          {address && (
            <div className="flex items-center gap-1.5 text-gray-500">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="text-[11px] truncate">{address}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleOpenQuoteModal(product);
            }}
            className="bg-[#0c1f4d] w-full cursor-pointer sm:flex-1 hover:bg-red-600 text-white text-xs h-9 rounded-lg"
          >
            <MessageSquare className="w-3.5 h-3.5 mr-2" />
            Enquiry
          </Button>

          {revealedPhone ? (
            <div className="h-9 w-full sm:flex-1 flex items-center justify-center border rounded-lg bg-gray-50 text-xs font-semibold">
              {revealedPhone}
            </div>
          ) : (
            <RequestPhoneNumberButton
              customerId={userId}
              sellerId={sellerId}
              merchantId={merchantId}
              className="h-9 w-full sm:flex-1"
              setPhoneNumber={setRevealedPhone}
            />
          )}
        </div>
      </div>
    </div>
  );
};

const AllProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = Number(searchParams.get('page') || '1');
  const safePage = isNaN(currentPage) || currentPage < 1 ? 1 : currentPage;

  const [products, setProducts] = useState([]);
  const [hasReachedEnd, setHasReachedEnd] = useState(false);

  const [openQuoteModal, setOpenQuoteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [openAskPriceModal, setOpenAskPriceModal] = useState(false);

  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { trackProductView } = useContext(ActiveUserContext);
  const loggedInUserId = user?.user?._id || user?.user?.id || user?._id || user?.id;
  const dispatch = useDispatch();
  const phone = user?.user?.phone;

  const [giveTrendingPoint, { isLoading: loadingTrendingGlobal }] = useGiveTrendingPointMutation();

  const handleTrendingClick = async (productId) => {
    if (!loggedInUserId) {
      setShowLoginModal(true);
      return;
    }
    try {
      // 1. Optimistic update in parent state
      setProducts((prev) =>
        prev.map((p) =>
          p._id === productId
            ? { ...p, totalTrendingPoints: (Number(p.totalTrendingPoints) || 0) + 1 }
            : p
        )
      );

      const res = await giveTrendingPoint({ user_id: loggedInUserId, product_id: productId }).unwrap();

      if (res.success) {
        if (res.pointsAdded !== 1) {
          setProducts((prev) =>
             prev.map((p) =>
               p._id === productId
                 ? { ...p, totalTrendingPoints: (Number(p.totalTrendingPoints) || 0) - 1 + res.pointsAdded }
                 : p
             )
          );
        }
        // 🔥 Cache invalidation now handled by mutation's onQueryStarted hook (both ProductApi & CategoryApi)
      } else {
        setProducts((prev) =>
          prev.map((p) =>
            p._id === productId
              ? { ...p, totalTrendingPoints: Math.max(0, (Number(p.totalTrendingPoints) || 0) - 1) }
              : p
          )
        );
      }
    } catch (err) {
      console.error("Explore Trending Error:", err);
      setProducts((prev) =>
        prev.map((p) =>
          p._id === productId
            ? { ...p, totalTrendingPoints: Math.max(0, (Number(p.totalTrendingPoints) || 0) - 1) }
            : p
        )
      );
    }
  };

  const handleProductClick = (e, name, id, trendingHandler) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (trendingHandler) trendingHandler(e, id);
    if (trackProductView) trackProductView(id);
    navigate(`/product/${id}`);
  };

  // Restore from sessionStorage
  useEffect(() => {
    try {
      const savedProducts = sessionStorage.getItem('allProductsList');
      if (savedProducts) {
        setProducts(JSON.parse(savedProducts));
      }

      const savedEnd = sessionStorage.getItem('allProductsReachedEnd');
      if (savedEnd !== null) {
        setHasReachedEnd(JSON.parse(savedEnd));
      }

      const savedPageStr = sessionStorage.getItem('allProductsCurrentPage');
      if (savedPageStr && Number(savedPageStr) > safePage) {
        setProducts([]);
        setHasReachedEnd(false);
        sessionStorage.removeItem('allProductsList');
        sessionStorage.removeItem('allProductsReachedEnd');
        sessionStorage.removeItem('allProductsCurrentPage');
      }
    } catch (err) {
      console.warn("Could not restore products from sessionStorage", err);
    }
  }, []);

  // Save to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('allProductsList', JSON.stringify(products));
      sessionStorage.setItem('allProductsCurrentPage', safePage.toString());
      sessionStorage.setItem('allProductsReachedEnd', JSON.stringify(hasReachedEnd));
    } catch (err) {
      console.warn("Could not save products to sessionStorage", err);
    }
  }, [products, safePage, hasReachedEnd]);

  const {
    data,
    isFetching,
    isLoading: productsLoading,
  } = useGetAllProductsQuery(
    {
      skip: (safePage - 1) * LIMIT,
      limit: LIMIT,
    }
  );

  const { data: favoriteData, refetch: refetchFavorites } =
    useGetFavoritesByUserQuery(loggedInUserId, { skip: !loggedInUserId });

  const [toggleFavorite, { isLoading: isToggling }] =
    useToggleFavoriteMutation();

  const [addTrendingForFavorite] = useAddTrendingForFavoriteMutation();

  const [trustSealStatus, setTrustSealStatus] = useState({});

  const favoriteIds = useMemo(() => {
    return new Set(
      favoriteData?.favorites?.map((fav) => fav.product?._id.toString()) || []
    );
  }, [favoriteData]);

  // 🔥 When API data refetches (cache invalidated), clear sessionStorage to prevent stale data
  useEffect(() => {
    if (data?.data) {
      try {
        // Fresh data from API - clear old sessionStorage cache
        sessionStorage.removeItem('allProductsList');
        sessionStorage.removeItem('allProductsCurrentPage');
        sessionStorage.removeItem('allProductsReachedEnd');
      } catch (err) {
        console.warn("Could not clear sessionStorage", err);
      }
    }
  }, [data?.data]);

  useEffect(() => {
    if (!data?.data) return;

    if (data.data.length === 0) {
      setHasReachedEnd(true);
      return;
    }

    setProducts((prev) => {
      let allProducts;

      if (safePage === 1) {
        allProducts = [...data.data];
      } else {
        const productMapById = new Map();
        // 1. Load existing products into map
        prev.forEach(p => productMapById.set(p._id, p));
        // 2. Overwrite with new data (ensures latest counts are used)
        data.data.forEach(p => productMapById.set(p._id, p));

        allProducts = Array.from(productMapById.values());
      }

      return allProducts;
    });

    if (data.pagination && data.pagination.hasMore !== undefined) {
      if (!data.pagination.hasMore) {
        setHasReachedEnd(true);
      } else {
        // Reset if we somehow paginate to an earlier page that has more
        setHasReachedEnd(false);
      }
    } else if (data.data.length < LIMIT) {
      setHasReachedEnd(true);
    }
  }, [data?.data, safePage]);






  const handleToggleFavorite = async (e, productId) => {
    e.stopPropagation();
    if (!productId) return;
    if (!loggedInUserId) {
      setShowLoginModal(true);
      return;
    }
    if (isToggling) return;

    const wasFavorited = favoriteIds.has(productId.toString());
    const isNowFavorited = !wasFavorited;

    // 🔥 IMMEDIATE optimistic update - heart icon changes instantly, no wait
    setProducts((prev) =>
      prev.map((p) => {
        if (p._id === productId) {
          return { ...p, _favoriteState: isNowFavorited };
        }
        return p;
      })
    );

    try {
      const response = await toggleFavorite({ productId }).unwrap();

      if (!response.success) {
        throw new Error(response.message || 'Failed to toggle favorite');
      }

      if (isNowFavorited) {
        showToast('Product added to favorites!', 'success');
        try {
          const res = await addTrendingForFavorite({
            user_id: loggedInUserId,
            product_id: productId,
          }).unwrap();

          if (res.success && res.pointsAdded > 0) {
            setProducts((prev) =>
              prev.map((p) =>
                p._id === productId
                  ? { ...p, totalTrendingPoints: (Number(p.totalTrendingPoints) || 0) + res.pointsAdded, _favoriteState: true }
                  : p
              )
            );
            // 🔥 Cache invalidation now handled by mutation's onQueryStarted hook (both ProductApi & CategoryApi)
          }
        } catch (err) {
          console.error('Add Trending Error:', err);
        }
      } else {
        showToast('Product removed from favorites.', 'info');
        setProducts((prev) =>
          prev.map((p) =>
            p._id === productId ? { ...p, _favoriteState: false } : p
          )
        );
      }

      axios.post(
        `${import.meta.env.VITE_API_URL}/favorite-products/track-favorite/${loggedInUserId}/${productId}`,
        { action: isNowFavorited ? 'add' : 'remove' }
      ).catch(err => console.error('Tracking Error:', err));

      await refetchFavorites();
    } catch (error) {
      console.error('Favorite Toggle Error:', error);
      setProducts((prev) =>
        prev.map((p) =>
          p._id === productId ? { ...p, _favoriteState: wasFavorited } : p
        )
      );
      showToast('Failed to update favorite.', 'error');
    }
  };

  const hasMore = data?.pagination ? data.pagination.hasMore : (!hasReachedEnd && data?.data?.length === LIMIT);

  const handleOpenQuoteModal = (product) => {
    setSelectedProduct(product);
    setOpenQuoteModal(true);
  };

  const [verifiedMap, setVerifiedMap] = useState({});

  const fetchStatus = async (sellerUserId) => {
    if (!sellerUserId || verifiedMap[sellerUserId] !== undefined) return;

    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/user-subscription-plan/verification-expire`,
        { params: { user_id: sellerUserId } }
      );

      const isActive =
        res.data?.success &&
        res.data?.expires_at &&
        new Date(res.data.expires_at) > new Date();

      setVerifiedMap((prev) => ({
        ...prev,
        [sellerUserId]: isActive,
      }));
    } catch (err) {
      setVerifiedMap((prev) => ({
        ...prev,
        [sellerUserId]: false,
      }));
    }
  };

  useEffect(() => {
    products?.forEach((product) => {
      const sellerUserId =
        product.sellerInfo?.companyAddress?.user_id ||
        (typeof product.sellerInfo?.user_id === 'object' ? product.sellerInfo?.user_id?._id : product.sellerInfo?.user_id) ||
        product.sellerInfo?._id;
      if (sellerUserId) {
        fetchStatus(sellerUserId);
      }
    });
  }, [products]);

  const fetchTrustSealStatus = async (sellerUserId) => {
    if (!sellerUserId || trustSealStatus[sellerUserId] !== undefined) return;
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/trust-seal/check-status/${sellerUserId}`
      );
      if (!res.ok) throw new Error();
      const result = await res.json();
      setTrustSealStatus((prev) => ({
        ...prev,
        [sellerUserId]: result,
      }));
    } catch (err) {
      setTrustSealStatus((prev) => ({ ...prev, [sellerUserId]: { status: null, data: null } }));
    }
  };

  useEffect(() => {
    products.forEach((product) => {
      const sellerUserId =
        product.sellerInfo?.companyAddress?.user_id ||
        (typeof product.sellerInfo?.user_id === 'object' ? product.sellerInfo?.user_id?._id : product.sellerInfo?.user_id) ||
        product.sellerInfo?._id;
      if (sellerUserId) {
        fetchTrustSealStatus(sellerUserId);
      }
    });
  }, [products]);

  const handleLoadMore = () => {
    if (isFetching || hasReachedEnd) return;
    setSearchParams({ page: (safePage + 1).toString() });
  };

  return (
    <div className="p-4 md:p-8 font-sans">
      <div className="">
        <div className="relative mb-12 flex flex-col items-start">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-[2px] h-[24px] bg-red-600" />
            <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-gray-400">
              Premium Catalog
            </span>
          </div>

          <div className="flex items-baseline gap-3">
            <h2 className="text-1xl md:text-3xl font-black text-[#0c1f4d] tracking-tighter">
              Explore <span className="text-red-600">Products</span>
            </h2>
          </div>

          <div className="h-[4px] w-[80px] bg-[#0c1f4d] mt-4 rounded-full" />
        </div>

        {products.length === 0 && !productsLoading && !isFetching && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-xl">No products available right now.</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              userId={loggedInUserId}
              favoriteIds={favoriteIds}
              handleProductClick={handleProductClick}
              handleToggleFavorite={handleToggleFavorite}
              handleTrendingClick={handleTrendingClick}
              loadingTrending={loadingTrendingGlobal}
              handleOpenQuoteModal={handleOpenQuoteModal}
              verifiedMap={verifiedMap}
              trustSealStatus={trustSealStatus}
              noImage={noImage}
              trustShield={trustShield}
              TruncatedText={TruncatedText}
              getUnitLabel={getUnitLabel}
              setOpenAskPriceModal={(open) => {
                setSelectedProduct(product);
                setOpenAskPriceModal(open);
              }}
              setShowLoginModal={setShowLoginModal}
            />
          ))}
        </div>

        {hasMore && (
          <div className="mt-12 mb-8 text-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLoadMore}
              disabled={isFetching}
              className={`
                relative overflow-hidden group
                min-w-[220px] h-12 px-10
                bg-[#0c1f4d] hover:bg-[#162d66]
                text-white font-bold uppercase tracking-widest text-xs
                rounded-full shadow-lg shadow-blue-900/20
                transition-all duration-300
                cursor-pointer border-none flex items-center justify-center mx-auto
                disabled:opacity-70 disabled:cursor-not-allowed
              `}
            >
              <div className="flex items-center justify-center gap-2 relative z-10">
                {isFetching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Fetching...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 transition-transform duration-300 group-hover:rotate-90" />
                    <span>Load More Products</span>
                  </>
                )}
              </div>

              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </motion.button>
          </div>
        )}

        {openQuoteModal && selectedProduct && (
          <ProductQuoteModel
            product={selectedProduct}
            productId={selectedProduct._id}
            open={openQuoteModal}
            setOpen={setOpenQuoteModal}
            userId={loggedInUserId}
            phone={phone}
          />
        )}

        {showLoginModal && (
          <LoginModel isOpen={showLoginModal} setIsOpen={setShowLoginModal} />
        )}
      </div>

      {openAskPriceModal && (
        <AskPriceModal
          isOpen={openAskPriceModal}
          onClose={() => setOpenAskPriceModal(false)}
          product={selectedProduct}
        />
      )}
    </div>
  );
};

export default AllProductsPage;
