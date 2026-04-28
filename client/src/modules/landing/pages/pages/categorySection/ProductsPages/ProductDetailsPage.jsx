// ProductDetailsPage.jsx

import { Link, useParams, useNavigate } from "react-router-dom";
import React, { useState, useRef, useEffect, useContext } from "react";
import {
  Plus,
  CheckCircle,
  XCircle,
  Mails,
  ArrowLeft,
  CircleEllipsis,
  Star,
  MapPinX,
  ShoppingCart,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Eye,
  ExternalLink,
  Share2,
} from "lucide-react";
import showToast from "@/toast/showToast";
import {
  useGetProductByNameQuery,
  useGetReviewsByProductQuery,
  useGiveTrendingPointMutation,
} from "@/redux/api/ProductApi";
import LoginModel from "@/modules/landing/modelLogin/Login";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ProductAttributesPage from "./ProductAttributePage";
import ProductQuoteModel from "./model/ProductQuoteModel";
import RequestPhoneNumberButton from "./RequestPhoneNumberButton";
import TrustSealCertificate from "./TrustSealCertificate";
import { cn } from "@/lib/utils";
import io from "socket.io-client";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import TrustSealImage from "@/assets/images/1.png";
import defaultImage from "@/assets/images/no-image.jpg";
import SEO from "@/components/SEO";

const formatName = (value) => {
  if (!value) return "";

  return value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const socket = io(import.meta.env.VITE_SOCKET_IO_URL, {
  withCredentials: true,
  transports: ["websocket"],
});

const ProductDetailsPage = () => {
  const { productId } = useParams();
  const { user } = useContext(AuthContext);
  const userId = user?.user?._id;
  const phone = user?.user?.phone;
  const navigate = useNavigate();

  const {
    data: productData,
    isLoading,
    error,
    refetch,
  } = useGetProductByNameQuery(
    { productId },
    { refetchOnMountOrArgChange: true }
  );
  const { data: reviewData } = useGetReviewsByProductQuery(
    productData?.product?._id,
    { skip: !productData?.product?._id }
  );
  const productAttributesRef = useRef(null);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showAllAttributes, setShowAllAttributes] = useState(true);
  const [activeAttributesTab, setActiveAttributesTab] = useState("product");
  const [zoomVisible, setZoomVisible] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [lensPosition, setLensPosition] = useState({ x: 0, y: 0 });
  const [openQuoteModal, setOpenQuoteModal] = useState(false);
  const [openCertificateModal, setOpenCertificateModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(null);
  const [trustSealStatus, setTrustSealStatus] = useState(null);
  const [trustSealData, setTrustSealData] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const trackedRef = useRef(false);
  const [giveTrendingPoint] = useGiveTrendingPointMutation();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isShared = urlParams.get('ref') === 'share';

    if (isShared && !trackedRef.current && productData?.product?._id) {
      if (!userId) {
        setShowLoginModal(true);
      } else {
        trackedRef.current = true;
        giveTrendingPoint({ user_id: userId, product_id: productData.product._id })
          .unwrap()
          .then((res) => console.log("Shared link trending point added", res))
          .catch((err) => {
            console.error("Shared link trending error", err);
            trackedRef.current = false; // allow retry if failed
          });
      }
    }
  }, [userId, productData?.product?._id, giveTrendingPoint]);
  const imageRef = useRef(null);
  const lensSize = 100;
  const [thumbStartIndex, setThumbStartIndex] = useState(0);
  const visibleThumbCount = 4;

  useEffect(() => {
    setActiveImageIndex(0);
    setShowAllAttributes(true);
    setActiveAttributesTab("product");
    setZoomVisible(false);
    setZoomPosition({ x: 0, y: 0 });
    setLensPosition({ x: 0, y: 0 });
    setOpenQuoteModal(false);
    setOpenCertificateModal(false);
    setPhoneNumber(null);
    setTrustSealStatus(null);
    setTrustSealData(null);
    setIsVerified(false);
    window.scrollTo(0, 0);
    if (typeof refetch === "function") refetch();
  }, [productId]);

  const handlePrevThumb = () => {
    if (thumbStartIndex > 0) {
      setThumbStartIndex((prev) => prev - 1);
    }
  };

  const handleNextThumb = () => {
    if (
      thumbStartIndex + visibleThumbCount <
      (product?.product_image?.length || 0)
    ) {
      setThumbStartIndex((prev) => prev + 1);
    }
  };

  useEffect(() => {
    socket.on("phoneNumberRequestApproved", (data) => {
      // Check both seller_id (User ID) and merchant_id (Merchant ID) for robustness
      if (data.seller_id === productData?.seller?.user_id || data.merchant_id === productData?.seller?._id) {
        setPhoneNumber(data.phone_number);
      }
    });
    socket.on("phoneNumberRequestRejected", (data) => {
      if (data.seller_id === productData?.seller?.user_id || data.merchant_id === productData?.seller?._id) {
        setPhoneNumber(null);
      }
    });
    return () => {
      socket.off("phoneNumberRequestApproved");
      socket.off("phoneNumberRequestRejected");
    };
  }, [productData?.seller?._id]);

  useEffect(() => {
    if (productData?.seller?.user_id) {
      fetch(
        `${import.meta.env.VITE_API_URL}/trust-seal/check-status/${productData.seller.user_id}`
      )
        .then((response) => {
          if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
          return response.json();
        })
        .then((data) => {
          setTrustSealStatus(data.status);
          setTrustSealData(data.data);
        })
        .catch(() => {
          setTrustSealStatus(null);
          setTrustSealData(null);
        });

      fetch(
        `${import.meta.env.VITE_API_URL}/user-subscription-plan/verification-expire?user_id=${productData.seller.user_id}`
      )
        .then((response) => response.json())
        .then((data) => {
          const active = data?.success && data?.expires_at && new Date(data.expires_at) > new Date();
          setIsVerified(active);
        })
        .catch(() => {
          setIsVerified(false);
        });
    } else {
      setTrustSealStatus(null);
      setTrustSealData(null);
      setIsVerified(false);
    }
  }, [productData?.seller?.user_id]);

  const product = productData?.product;
  const productAttributes = productData?.productAttributes || [];
  const seller = productData?.seller || {};
  const address = productData?.address || {};
  const relatedProducts = productData?.relatedProducts || [];

  const companySlug = (seller?.company_name || seller?.travels_name || "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  const handleScroll = () => {
    productAttributesRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleOpenModel = () => setOpenQuoteModal(true);

  const handleMouseMove = (e) => {
    if (!imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();

    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    const minX = lensSize / 2;
    const maxX = rect.width - lensSize / 2;
    const minY = lensSize / 2;
    const maxY = rect.height - lensSize / 2;

    let lensX = x;
    let lensY = y;

    if (x < minX) lensX = minX;
    if (x > maxX) lensX = maxX;
    if (y < minY) lensY = minY;
    if (y > maxY) lensY = maxY;

    const percentX = (lensX / rect.width) * 100;
    const percentY = (lensY / rect.height) * 100;

    setLensPosition({
      x: lensX - lensSize / 2,
      y: lensY - lensSize / 2,
    });

    setZoomPosition({
      x: percentX,
      y: percentY,
    });
  };

  const handleViewMoreClick = () => {
    setActiveAttributesTab("company");
    handleScroll();
  };

  const memberSinceYears = seller?.createdAt
    ? new Date().getFullYear() - new Date(seller.createdAt).getFullYear()
    : "N/A";

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return "bg-green-500 text-white";
    if (rating >= 3) return "bg-yellow-500 text-white";
    if (rating > 0) return "bg-red-500 text-white";
    return "bg-gray-200 text-gray-700";
  };

  const RelatedProductCard = ({ relatedProduct }) => {
    const productNameSlug = relatedProduct._id
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    const handleCardClick = (e) => {
      e.preventDefault();
      window.scrollTo(0, 0);
      navigate(`/product/${productNameSlug}`);
    };

    const displayName = relatedProduct.product_name.replace(/-/g, " ");

    return (
      <div onClick={handleCardClick} className="cursor-pointer group relative flex flex-col bg-white rounded-xl overflow-hidden transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-100">
        <div className="relative aspect-[4/5] overflow-hidden bg-gray-50">
          <img
            src={relatedProduct?.product_image?.[0] || defaultImage}
            alt={displayName}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = defaultImage;
            }}
          />
          <div className="absolute top-4 left-4 backdrop-blur-md bg-white/80 border border-white/20 px-3 py-1.5 rounded-full shadow-sm">
            <p className="text-sm font-bold text-gray-900">
              ₹ {relatedProduct.price?.$numberDecimal || "Request"}
            </p>
          </div>
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <button
              onClick={handleCardClick}
              className="bg-white p-3 rounded-full shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300"
            >
              <Eye className="w-5 h-5 text-[#0c6180]" />
            </button>
          </div>
        </div>
        <div className="p-5 flex flex-col flex-grow">
          <div className="mb-auto">
            <h3 className="text-md font-semibold text-gray-800 line-clamp-2 leading-snug group-hover:text-[#0c6180] transition-colors duration-300">
              {displayName}
            </h3>
            <p className="text-xs text-gray-400 mt-2 uppercase tracking-wider font-medium">
              Verified Supplier
            </p>
          </div>
          <button
            onClick={handleCardClick}
            className="mt-4 cursor-pointer w-full bg-[#0c6180] text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-[#084a63] transition-all active:scale-[0.98]"
          >
            View Details
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    );
  };

  const StarRating = ({ productId }) => {
    const averageRating = reviewData?.averageRating || 0;
    const handleRate = (newRating) => {
      navigate(`/review/${productId}`, { state: { rating: newRating } });
    };
    return (
      <div className="space-y-2">
        <Label className="mb-2">Rating</Label>
        <div className="flex items-center space-x-2">
          <div className="flex relative group">
            {[1, 2, 3, 4, 5].map((star) => (
              <div key={star} className="relative">
                <div
                  className="absolute left-0 top-0 w-1/2 h-full z-10 cursor-pointer"
                  onClick={() => handleRate(star - 0.5)}
                />
                <div
                  className="absolute right-0 top-0 w-1/2 h-full z-10 cursor-pointer"
                  onClick={() => handleRate(star)}
                />
                <Star
                  size={16}
                  className={
                    averageRating >= star
                      ? "text-yellow-500"
                      : averageRating >= star - 0.5
                        ? "text-yellow-300"
                        : "text-gray-300"
                  }
                  fill={
                    averageRating >= star
                      ? "#facc15"
                      : averageRating >= star - 0.5
                        ? "#fde68a"
                        : "none"
                  }
                />
              </div>
            ))}
          </div>
          <div
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium shadow transition",
              getRatingColor(averageRating)
            )}
          >
            {averageRating.toFixed(1)} / 5
          </div>
        </div>
      </div>
    );
  };

  const addressParts = [
    address?.address_line_1,
    address?.address_line_2,
    address?.city,
    address?.state,
    address?.country,
    address?.pincode,
  ].filter(Boolean);

  if (isLoading) return <div className="p-4">Loading...</div>;
  if (error)
    return <div className="p-4 text-red-500">Error loading product.</div>;

  const rawName = product?.product_name || "Product";
  const getCleanProductName = (raw) => {
    if (typeof raw === 'object') {
      if (raw.buffer && (typeof raw.buffer === 'string' || Array.isArray(raw.buffer))) {
        return raw.buffer.toString() || "Product";
      }
      return raw.product_name || raw.name || "Product";
    }
    return String(raw).replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
  };
  const cleanProductName = getCleanProductName(rawName);

  return (
    <div className="bg-gray-100 relative" key={productId}>
      <SEO 
        title={`${cleanProductName} B2B Wholesale Suppliers`}
        description={`Buy bulk ${cleanProductName} from verified B2B wholesale suppliers on Huntsworld.`}
        canonicalUrl={`https://huntsworld.com/product/${productId}`}
        ogImage={product?.product_image?.[0] || defaultImage}
      />
      <Button
        type="button"
        onClick={() => navigate(-1)}
        variant="outline"
        className="hidden md:flex absolute cursor-pointer top-2 left-10 z-40 gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Button>

      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row p-4 gap-4 mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row gap-4 bg-white rounded-lg p-4 w-full">
            <div className="relative">
              <div
                className="relative w-full md:w-96 aspect-square md:aspect-auto border rounded-xl overflow-hidden"
                onMouseEnter={() => setZoomVisible(true)}
                onMouseLeave={() => setZoomVisible(false)}
                onMouseMove={handleMouseMove}
              >
                <img
                  src={product?.product_image[activeImageIndex] || defaultImage}
                  alt={product?.productId}
                  ref={imageRef}
                  className="max-w-full max-h-full object-cover cursor-crosshair"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = defaultImage;
                  }}
                />

                {zoomVisible && (
                  <div
                    className="absolute border-2 border-[#0c6180] bg-[#0c6180]/10 pointer-events-none z-10 shadow-sm"
                    style={{
                      width: `${lensSize}px`,
                      height: `${lensSize}px`,
                      left: `${lensPosition.x}px`,
                      top: `${lensPosition.y}px`,
                    }}
                  >
                    <div className="flex items-center justify-center h-full w-full opacity-30">
                      <Plus size={24} className="text-[#0c6180]" />
                    </div>
                  </div>
                )}
              </div>

              {zoomVisible && (
                <div
                  className="absolute w-[400px] h-[400px] border-4 border-white rounded-2xl hidden lg:block z-[100] bg-white shadow-2xl pointer-events-none"
                  style={{
                    top: 0,
                    left: "calc(100% + 20px)",
                    backgroundImage: `url(${product?.product_image[activeImageIndex] || defaultImage})`,
                    backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                    backgroundSize: "250%",
                    backgroundRepeat: "no-repeat",
                  }}
                />
              )}

              {product?.product_image?.length > 1 && (
                <div className="relative w-full mt-4 flex items-center justify-center gap-3 px-2">
                  <button
                    onClick={handlePrevThumb}
                    disabled={thumbStartIndex === 0}
                    className={cn(
                      "p-2 rounded-full shadow transition-all duration-200 flex items-center justify-center min-w-10 min-h-10",
                      "bg-white border border-gray-200 text-gray-700",
                      "hover:bg-gray-50 hover:border-gray-300 hover:text-[#0c6180] hover:shadow-md",
                      "disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200 disabled:shadow-none disabled:cursor-not-allowed disabled:opacity-70"
                    )}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <div className="flex gap-3 overflow-hidden">
                    {product?.product_image
                      ?.slice(thumbStartIndex, thumbStartIndex + visibleThumbCount)
                      .map((image, index) => {
                        const realIndex = thumbStartIndex + index;

                        return (
                          <img
                            key={realIndex}
                            src={image}
                            alt={`Thumbnail ${realIndex + 1}`}
                            onClick={() => setActiveImageIndex(realIndex)}
                            className={cn(
                              "w-20 h-20 object-cover rounded-lg cursor-pointer transition-all border-2",
                              activeImageIndex === realIndex
                                ? "border-[#e03733] scale-105 shadow-md"
                                : "border-transparent opacity-60 hover:opacity-100"
                            )}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = defaultImage;
                            }}
                          />
                        );
                      })}
                  </div>

                  <button
                    onClick={handleNextThumb}
                    disabled={
                      thumbStartIndex + visibleThumbCount >=
                      (product?.product_image?.length || 0)
                    }
                    className={cn(
                      "p-2 rounded-full shadow transition-all duration-200 flex items-center justify-center min-w-10 min-h-10",
                      "bg-white border border-gray-200 text-gray-700",
                      "hover:bg-gray-50 hover:border-gray-300 hover:text-[#0c6180] hover:shadow-md",
                      "disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200 disabled:shadow-none disabled:cursor-not-allowed disabled:opacity-70"
                    )}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <div className="mt-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <h1 className="text-xl font-bold">
                    {(() => {
                      const raw = product?.product_name;
                      if (!raw) return <span className="text-gray-400">Product Name</span>;
                      let name = "";
                      if (typeof raw === 'object') {
                        if (raw.buffer && (raw.buffer instanceof ArrayBuffer || Array.isArray(raw.buffer) || typeof raw.buffer === 'string')) {
                          try {
                            name = new TextDecoder().decode(new Uint8Array(raw.buffer));
                          } catch (e) {
                            name = String(raw.isActive || "");
                          }
                        } else {
                          name = raw.product_name || raw.name || JSON.stringify(raw);
                        }
                      } else {
                        name = String(raw);
                      }
                      const cleaned = name.replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
                      if (!cleaned || cleaned === "{}") return <span className="text-gray-400">Unnamed Product</span>;
                      const words = cleaned.toUpperCase().split(' ');
                      const firstTwo = words.slice(0, 2).join(' ');
                      const rest = words.slice(2).join(' ');
                      return (
                        <>
                          <span className="text-[#0c6180]">{firstTwo}</span>
                          {rest && ` ${rest}`}
                        </>
                      );
                    })()}
                  </h1>
                  <StarRating productId={product?._id} />
                  <Button
                    onClick={() => {
                      const currentUrl = new URL(window.location.href);
                      if (!currentUrl.searchParams.has('ref')) {
                        currentUrl.searchParams.set('ref', 'share');
                      }
                      const shareUrl = currentUrl.toString();
                      
                      if (navigator.share) {
                        navigator.share({
                          title: cleanProductName,
                          text: `Check out ${cleanProductName} on Huntsworld`,
                          url: shareUrl,
                        }).catch(console.error);
                      } else {
                        navigator.clipboard.writeText(shareUrl);
                        showToast('Link copied to clipboard!', 'success');
                      }
                    }}
                    variant="outline"
                    className="h-8 px-3 rounded-full flex items-center gap-2 ml-auto text-gray-600 hover:text-[#0c6180] hover:border-[#0c6180] transition-colors cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </Button>
                </div>
                <p className="text-lg text-gray-700 mt-2">
                  ₹ {product?.price?.$numberDecimal}
                </p>
              </div>
              <div className="mt-4">
                {productAttributes.slice(0, 4).map((attr, index) => (
                  <div key={index} className="flex flex-col sm:flex-row sm:justify-between py-1 text-sm">
                    <span className="font-semibold">{attr?.attribute_key}</span>
                    <span>{attr?.attribute_value}</span>
                  </div>
                ))}
                <div className="flex flex-col md:flex-row gap-3 w-full mt-4">
                  <div className="w-full  md:w-1/2">
                    {phoneNumber ? (
                      <div className="flex flex-col py-1 w-full">
                        <span className="font-semibold">Phone Number</span>
                        <span className="text-gray-700">{phoneNumber}</span>
                      </div>
                    ) : (
                      <RequestPhoneNumberButton
                        customerId={user?.user?._id}
                        sellerId={seller?._id}
                        merchantId={seller?._id}
                        className="w-full"
                        setPhoneNumber={setPhoneNumber}
                      />
                    )}
                  </div>

                  <div className="w-full md:w-1/2">
                    <Button
                      onClick={handleOpenModel}
                      variant="destructive"
                      className="w-full cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Mails className="w-4 h-4" /> Send Enquiry
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full md:w-1/3 p-4 border bg-white rounded-lg mt-4 md:mt-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <Avatar className="w-12 h-12">
                <AvatarImage
                  src={seller?.company_logo}
                  alt={seller?.company_name}
                />
                <AvatarFallback>
                  {seller?.company_name?.split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold">
                <Link to={`/company/${companySlug}`} className="hover:underline">
                  {formatName(seller?.company_name || seller?.travels_name)}
                </Link>
              </h2>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      {isVerified ? (
                        <CheckCircle className="text-green-500 w-5 h-5 cursor-pointer" />
                      ) : (
                        <XCircle className="text-red-500 w-5 h-5 cursor-pointer" />
                      )}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>{isVerified ? "Verified" : "Not Verified"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {addressParts.length > 0 ? (
              <p className="text-gray-600 mt-2">{addressParts.join(", ")}</p>
            ) : (
              <div className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-2 rounded-md mt-2 border border-red-200">
                <MapPinX className="w-5 h-5" />
                <span>No address found</span>
              </div>
            )}

            <div className="mt-4">
              {trustSealStatus === "verified" && (
                <Dialog open={openCertificateModal} onOpenChange={setOpenCertificateModal}>
                  <DialogTrigger asChild>
                    <div className="mb-2 flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                      <img
                        src={TrustSealImage}
                        alt="Trust Seal"
                        className="w-10 h-10 object-contain"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = defaultImage;
                        }}
                      />
                      <span className="text-green-500 font-semibold">
                        Trust Seal
                      </span>
                    </div>
                  </DialogTrigger>

                  <DialogContent className="max-w-[95vw] sm:max-w-[700px] w-full max-h-[90vh] overflow-y-auto overflow-x-hidden p-0 border-none bg-white rounded-xl shadow-2xl">
                    <DialogHeader className="sr-only">
                      <DialogTitle>Trust Seal Certificate</DialogTitle>
                    </DialogHeader>
                    <div className="w-full h-full p-4 sm:p-8 bg-gray-100/50">
                      <TrustSealCertificate
                        // 1. Company Name from Merchant Schema
                        companyName={seller?.company_name || seller?.travels_name}

                        // 2. Formatted Address from Address parts
                        address={addressParts.join(", ")}

                        // 3. Director/Owner Name (Fallback to company name if specific director not found)
                        director={trustSealData?.director_name || seller?.company_name || "Verified Owner"}

                        // 4. GST Number from Merchant Schema
                        gstin={seller?.gst_number || "N/A"}

                        // 5. Contact Info from Merchant Schema
                        mobile={seller?.company_phone_number || "N/A"}
                        email={seller?.company_email || "N/A"}

                        // 6. Dates (Using current date as fallback)
                        issueDate={trustSealData?.issueDate || seller?.createdAt}
                        expiryDate={trustSealData?.expiryDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1))}
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              <div className="flex flex-col py-1">
                <span className="font-semibold">Member Since</span>
                <span>
                  {memberSinceYears} Year{memberSinceYears !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex flex-col py-1">
                <span className="font-semibold">Nature of Business</span>
                <span>{seller?.company_type?.displayName}</span>
              </div>
              <div className="flex flex-col py-1">
                <span className="font-semibold">Year of Establishment</span>
                <span>{seller.year_of_establishment}</span>
                {seller?.domain_name && (
                  <div className="mt-2">
                    <a
                      href={`https://${seller.domain_name}`}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-[#0c1f4d] border border-blue-100 rounded-lg text-xs font-bold hover:bg-[#0c1f4d] hover:text-white hover:shadow-md transition-all duration-300 group"
                    >
                      <ExternalLink className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
                      Visit Website: {seller.domain_name}
                    </a>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-around items-center">
              <div className="flex gap-3 mt-3 w-full">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild className="w-full">
                      <Button
                        variant="destructive"
                        className="cursor-pointer"
                        onClick={handleViewMoreClick}
                      >
                        <CircleEllipsis /> View Company Details
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Switches to Company Details tab</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </div>

        {showAllAttributes && (
          <div ref={productAttributesRef}>
            <ProductAttributesPage
              data={productData}
              activeTab={activeAttributesTab}
              setActiveTab={setActiveAttributesTab}
            />
          </div>
        )}

        {showAllAttributes && relatedProducts.length > 0 && (
          <section className="py-16 mt-12 bg-[#f8fafc]">
            <div className="mx-auto max-w-6xl px-4">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                <div className="space-y-2">
                  <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                    More to Explore
                  </h3>
                  <p className="text-gray-500 font-medium">
                    Handpicked alternatives from our trusted network
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm font-bold text-[#0c6180] bg-[#0c6180]/10 px-4 py-2 rounded-full">
                  <ShoppingCart className="w-4 h-4" />
                  {relatedProducts.length} PRODUCTS FOUND
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map((relatedProduct) => (
                  <RelatedProductCard
                    key={relatedProduct._id}
                    relatedProduct={relatedProduct}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {openQuoteModal && (
          <ProductQuoteModel
            product={product}
            productId={product._id}
            userId={userId}
            open={openQuoteModal}
            phone={phone}
            setOpen={setOpenQuoteModal}
          />
        )}
        <LoginModel isOpen={showLoginModal} setIsOpen={setShowLoginModal} redirectOnLogin={false} />
      </div>
    </div>
  );
};

export default ProductDetailsPage;
