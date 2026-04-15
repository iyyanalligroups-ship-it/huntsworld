import { useRef, useContext, useState } from 'react';
import { Eye, Trash2, Phone } from 'lucide-react';
import { gsap } from 'gsap';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '@/modules/landing/context/AuthContext';
import { useRemoveFavoriteMutation } from '@/redux/api/FavoriteApi';
import showToast from '@/toast/showToast';
import RequestPhoneNumberButton from '@/modules/landing/pages/pages/categorySection/ProductsPages/RequestPhoneNumberButton';
import ProductQuoteModel from '@/modules/landing/pages/pages/categorySection/ProductsPages/model/ProductQuoteModel';
import noImage from "@/assets/images/no-image.jpg";
import Loader from "@/loader/Loader";
import { Loader2 } from 'lucide-react';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const TruncatedText = ({ text = "", max = 30, className = "" }) => {
  const formattedText = text.replace(/[-_]/g, " ");
  const displayText = formattedText.length > max ? formattedText.slice(0, max) + "…" : formattedText;

  if (formattedText.length <= max) {
    return <span className={className}>{formattedText}</span>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`${className} cursor-default`}>{displayText}</span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs break-words bg-gray-900 text-white">
          {formattedText}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const FavoriteCard = ({ favorite }) => {
  const cardRef = useRef(null);
  const iconRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const userId = user?.user?._id;
  const phone = user?.user?.phone;

  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);

  const {
    product_name,
    price,
    product_image,
    sellerInfo,
    totalTrendingPoints = 0,
    productId,
    favoriteId,
    _id: favoriteDocumentId,
  } = favorite || {};

  console.log(favorite,'favorite sdfjkdhf');
  

  const image = product_image?.[0] || noImage;
  const name = product_name || 'Unnamed Product';
  const priceValue = price?.$numberDecimal || price || '0';
  const [phoneNumber, setPhoneNumber] = useState(null);
  const removeId = favoriteId || favoriteDocumentId;

  const [removeFavorite, { isLoading: isRemoving }] = useRemoveFavoriteMutation();

  // Updated: Removed border and scale GSAP logic
  const handleMouseEnter = () => {
    gsap.fromTo(iconRef.current, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' });
  };

  const handleMouseLeave = () => {
    gsap.to(iconRef.current, { y: 50, opacity: 0, duration: 0.5, ease: 'power3.in' });
  };

  const goToProduct = () => {
    navigate(`/product/${encodeURIComponent(productId)}`);
  };

  const handleRemoveFavorite = async (e) => {
    e.stopPropagation();

    if (!removeId) {
      showToast("Missing favorite ID", "error");
      return;
    }

    try {
      await removeFavorite(removeId).unwrap();
      showToast("Removed from favorites", "success");
    } catch (error) {
      console.error("Remove favorite failed:", error);
      const msg = error?.data?.message || "Failed to remove favorite";
      showToast(msg, "error");
    }
  };

  const openQuoteModal = (e) => {
    e.stopPropagation();
    setIsQuoteModalOpen(true);
  };

  return (
    <>
      {/* Full-page overlay loader while removing */}
      {isRemoving && <Loader />}
      <div
        ref={cardRef}
        // Updated: Removed 'hover:border-r-4' and 'hover:border-[#0c1f4d]' classes
        className="relative flex flex-col bg-white p-2 border"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-semibold px-2 py-1 rounded shadow z-10">
          {Math.round(totalTrendingPoints)} pts
        </div>

        <div onClick={goToProduct} className="cursor-pointer">
          <div className="flex justify-center">
            <img
              src={image}
              alt={name}
              className="w-full h-40 md:h-48 lg:h-56 object-cover rounded mb-2"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = noImage;
              }}
            />
          </div>

          <p className="text-[#0c1f4d] font-bold text-xs">MODERN EDITION</p>

          <div>
            <TruncatedText text={name} max={30} className="text-sm font-semibold inline-block" />
          </div>

          <p className="text-gray-600 text-sm">₹{parseFloat(priceValue).toFixed(0)}</p>
        </div>

        {sellerInfo && (
          <div className="mt-1 text-[11px] text-gray-700 space-y-1 leading-snug">
            <p><strong>Seller:</strong> {sellerInfo.name || "Unknown"}</p>
            {sellerInfo.company_name && <p>{sellerInfo.company_name}</p>}
            {sellerInfo.companyAddress && (
              <p className="text-[10px] text-gray-500">
                {[sellerInfo.companyAddress.city, sellerInfo.companyAddress.state]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-3 mt-auto w-full">
          {/* Left Button: Send Enquiry */}
          <button
            onClick={openQuoteModal}
            className="flex-1 bg-[#0c1f4d] cursor-pointer text-white text-sm font-medium h-[42px] rounded-md hover:bg-[#162a5e] transition-colors shadow-sm text-center"
          >
            Send Enquiry
          </button>

          {/* Right Button Container: View Number */}
          <div className="flex-1 min-w-0">
            {phoneNumber ? (
              /* Tooltip logic for truncated Phone Number */
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setPhoneNumber(null)}
                      className="h-[42px] w-full flex items-center justify-center px-4 border border-[#0c1f4d] text-[#0c1f4d] hover:bg-slate-50 rounded-md font-bold text-sm shadow-sm transition-all cursor-pointer overflow-hidden"
                      title="Click to hide number"
                    >
                      <Phone size={14} className="mr-2 shrink-0" />
                      <span className="truncate">{phoneNumber}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-gray-900 text-white">
                    {phoneNumber}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              /* View Number Button */
              <div className="w-full">
                <RequestPhoneNumberButton
                  customerId={userId}
                  sellerId={sellerInfo?._id}
                  merchantId={sellerInfo?._id}
                  setPhoneNumber={setPhoneNumber}
                  className="w-full h-[42px] border-[#0c1f4d] text-[#0c1f4d] hover:bg-slate-50 font-medium rounded-md"
                />
              </div>
            )}
          </div>
        </div>

        <div
          ref={iconRef}
          className="absolute inset-0 flex justify-center items-center gap-4 opacity-0 z-20 pointer-events-none"
        >
          <button
            onClick={goToProduct}
            className="p-3 bg-white rounded-full shadow-lg hover:bg-gray-100 pointer-events-auto border"
          >
            <Eye className="w-5 h-5 text-[#1C1B1F]" />
          </button>

          <button
            onClick={handleRemoveFavorite}
            disabled={isRemoving}
            className={`p-3 bg-white rounded-full shadow-lg pointer-events-auto border border-red-200 transition-all ${
              isRemoving ? "opacity-60 cursor-not-allowed" : "hover:bg-red-50"
            }`}
          >
            {isRemoving ? (
              <Loader2 className="w-5 h-5 text-red-600 animate-spin" />
            ) : (
              <Trash2 className="w-5 h-5 text-red-600" />
            )}
          </button>
        </div>
      </div>

      {isQuoteModalOpen && (
        <ProductQuoteModel
          product={{ product: favorite, sellerInfo }}
          productId={productId}
          userId={userId}
          phone={phone}
          open={isQuoteModalOpen}
          setOpen={setIsQuoteModalOpen}
        />
      )}
    </>
  );
};

export default FavoriteCard;
