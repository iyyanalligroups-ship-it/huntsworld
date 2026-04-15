import { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation } from "swiper/modules"; // Removed Autoplay
import "@/modules/landing/css/GrocerySeller.css";
import DefaultBanner from "@/assets/images/HUNTSWORLD.png";
import { useLazyGetAllGrocerySellerDetailsQuery } from "@/redux/api/GrocerySellerRequirementApi";
import { motion } from "framer-motion";
import { useModal } from "./ModalContext";
import GrocerySellerRequirements from "./SellerRequirements";
import noImage from "@/assets/images/no-image.jpg";

const BannerCarouselGrocerrySeller = () => {
  const [sellers, setSellers] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const { openModal } = useModal();
  const [triggerGetSellers] = useLazyGetAllGrocerySellerDetailsQuery();

  useEffect(() => {
    setIsLoading(true);
    triggerGetSellers({ page, limit: 10 }).then((res) => {
      if (res.data?.data) {
        setSellers((prev) => [
          ...prev,
          ...res.data.data.filter(
            (newSeller) => !prev.some((s) => s.user._id === newSeller.user._id)
          ),
        ]);
        setHasMore(res.data.pagination.hasMore);
      } else if (res.error) {
        setError(res.error);
      }
      setIsLoading(false);
    });
  }, [page, triggerGetSellers]);

  const loadMore = () => {
    if (hasMore && !isLoading) {
      setPage((prev) => prev + 1);
    }
  };

  const handleOpenRequirements = (userId, shopName) => {
    openModal({
      component: <GrocerySellerRequirements userId={userId} />,
    });
  };

  if (!isLoading && sellers.length === 0) {
    return null;
  }

  if (isLoading && sellers.length === 0) {
    return null;
  }

  if (error && sellers.length === 0) {
    return (
      <div className="h-full w-full relative overflow-hidden">
        <img
          src={DefaultBanner}
          alt="Default Banner"
          className="w-full h-full object-cover rounded-md"
          loading="lazy"
        />
        <div className="absolute top-0 left-0 w-full text-center text-white bg-red-500 bg-opacity-75 p-2">
          Failed to load sellers. Please try again later.
        </div>
      </div>
    );
  }

  // CASE: One seller → static (clickable)
  if (sellers.length === 1) {
    return (
      <div className="h-full w-full flex flex-col relative overflow-hidden p-5">
        {sellers.length > 0 && (
          <div className="relative mb-8 flex flex-col items-start container  px-4">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-[2px] h-[24px] bg-red-600" />
              <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-gray-400">
                Requirements
              </span>
            </div>
            <div className="flex items-baseline gap-3">
              <h2 className="text-xl md:text-2xl font-black text-[#0c1f4d] tracking-tighter leading-tight">
                Base Member <span className="text-red-600">Requirements</span>
              </h2>
            </div>
            <div className="h-[4px] w-[80px] bg-[#0c1f4d] mt-4 rounded-full" />
          </div>
        )}
        <div
          onClick={() =>
            handleOpenRequirements(
              sellers[0].user._id,
              sellers[0].user.shop_name
            )
          }
          className="cursor-pointer flex flex-col items-center"
        >
          <motion.div
            className="w-28 h-28 rounded-full overflow-hidden border-2 border-gray-300 shadow-md"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <img
              src={sellers[0].user.company_logo || noImage}
              alt={sellers[0].user.shop_name}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = noImage;
              }}
            />
          </motion.div>
          <motion.p
            className="text-center text-[#0c1f4d] mt-3 font-semibold text-base"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {sellers[0].user.shop_name}
          </motion.p>
        </div>
      </div>
    );
  }

  // CASE: Multiple sellers → carousel
  return (
    <div className="h-full w-full relative overflow-hidden p-5">
      {/* --- Title Section --- */}
      {sellers.length > 0 && (
        <div className="relative mb-8">
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-4 mb-2">
              <motion.div
                initial={{ height: 0 }}
                whileInView={{ height: "24px" }}
                transition={{ duration: 0.8 }}
                className="w-[2px] bg-red-600"
              />
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-[10px] font-bold uppercase tracking-[0.5em] text-gray-400"
              >
                Guidelines & Criteria
              </motion.span>
            </div>

            <div className="flex items-baseline gap-3">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                viewport={{ once: true }}
                className="text-1xl md:text-3xl font-black text-[#0c1f4d] tracking-tighter leading-tight"
              >
                Base Member <span className="text-red-600">Requirements</span>
              </motion.h2>
            </div>

            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: "80px" }}
              transition={{ duration: 1, delay: 0.5 }}
              className="h-[4px] bg-[#0c1f4d] mt-4 rounded-full"
            />
          </div>
        </div>
      )}

      {/* --- Swiper Section --- */}
      <div className="relative w-full px-12">
        {/* Left Arrow */}
        <button className="swiper-button-prev-custom absolute left-0 top-14 -translate-y-1/2 w-10 h-10 rounded-full bg-[#0c1f4d] hover:bg-red-600 text-white flex items-center justify-center transition-all shadow-lg z-10 cursor-pointer [&.swiper-button-disabled]:opacity-0 [&.swiper-button-disabled]:pointer-events-none">
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <Swiper
          spaceBetween={30}
          slidesPerView={6}
          breakpoints={{
            320: { slidesPerView: 2, spaceBetween: 10 },
            640: { slidesPerView: 3, spaceBetween: 15 },
            1024: { slidesPerView: 4, spaceBetween: 20 },
            1280: { slidesPerView: 6, spaceBetween: 30 },
          }}
          navigation={{
            nextEl: ".swiper-button-next-custom",
            prevEl: ".swiper-button-prev-custom",
          }}
          modules={[Navigation]}
          className="h-full rounded-md w-full py-4"
        >
          {sellers.map((seller, i) => (
            <SwiperSlide key={seller.user._id || i}>
              <div
                onClick={() =>
                  handleOpenRequirements(
                    seller.user._id,
                    seller.user.shop_name
                  )
                }
                className="cursor-pointer flex flex-col items-center group"
              >
                <motion.div
                  className="w-28 h-28 rounded-full overflow-hidden border-2 border-gray-300 shadow-md group-hover:border-[#0c1f4d] transition-colors duration-300"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.6 }}
                >
                  <img
                    src={seller?.user?.company_logo || noImage}
                    alt={seller?.user?.shop_name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = noImage;
                    }}
                  />
                </motion.div>

                <motion.p
                  className="text-center text-[#0c1f4d] mt-3 font-semibold text-base"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  {seller.user.shop_name}
                </motion.p>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
        {/* Right Arrow */}
        <button className="swiper-button-next-custom absolute right-0 top-14 -translate-y-1/2 w-10 h-10 rounded-full bg-[#0c1f4d] hover:bg-red-600 text-white flex items-center justify-center transition-all shadow-lg z-10 cursor-pointer [&.swiper-button-disabled]:opacity-0 [&.swiper-button-disabled]:pointer-events-none">
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      {hasMore && (
        <div className="text-center mt-8">
          <button
            onClick={loadMore}
            disabled={isLoading}
            className={`px-6 py-2 rounded-full text-sm font-medium text-white transition-all ${isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#0c1f4d] hover:bg-red-600 shadow-md"
              }`}
          >
            {isLoading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
};

export default BannerCarouselGrocerrySeller;
