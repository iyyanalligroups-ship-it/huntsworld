import { useState, useEffect, useRef, useContext } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, EffectFade } from "swiper/modules";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useGetPremiumBannersQuery } from "@/redux/api/BannerPaymentApi";

import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/navigation";

import { AuthContext } from "../context/AuthContext";

const BannerCarousel = () => {
  const swiperRef = useRef(null);
  const navigationPrevRef = useRef(null);
  const navigationNextRef = useRef(null);

  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [defaultImage, setDefaultImage] = useState(null);
  const [adminBanners, setAdminBanners] = useState([]);

  // Merchant banners (premium/approved)
  const { data, isLoading } = useGetPremiumBannersQuery();

  // Fetch Default Image (fallback)
  useEffect(() => {
    const fetchDefaultBanner = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/banner-payment/default/active`
        );
        if (res?.data?.success && res.data.data?.image_urls?.[0]) {
          setDefaultImage(res.data.data.image_urls[0]);
        }
      } catch (err) {
        console.error("Default banner fetch failed:", err);
      }
    };
    fetchDefaultBanner();
  }, []);


  useEffect(() => {
    const fetchAdminBanners = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/admin-banners/active`
        );
        if (res?.data?.success) {
          setAdminBanners(res.data.data || []);
        }
      } catch (err) {
        console.error("Admin banners fetch failed:", err);
      }
    };
    fetchAdminBanners();
  }, []);

  // Merchant banners formatting
  const merchantBanners = (data?.data || []).filter(
    (b) => typeof b.banner_image === "string" && b.banner_image.trim().length > 0
  );

  // Admin banners formatting
  const formattedAdminBanners = adminBanners
    .filter((b) => b.image_urls?.length > 0 && b.is_active)
    .map((b) => ({
      _id: b._id,
      banner_image: b.image_urls[0],
      link: b.link || "",
      title: b.title || "Admin Banner",
      company_name: "",
      source: "admin",
      createdAt: b.createdAt,
    }));

  // Combine all banners → newest first
  const allBanners = [...formattedAdminBanners, ...merchantBanners].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );

  // ────────────────────────────────────────────────
  // Render logic
  // ────────────────────────────────────────────────

  if (isLoading && allBanners.length === 0) {
    return null;
  }

  if (allBanners.length === 0 && defaultImage) {
    return (
      <div className="h-full w-full relative overflow-hidden bg-gray-200">
        <img
          src={defaultImage}
          alt="Default Banner"
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  if (allBanners.length === 0) {
    return null;
  }

  return (
    <div className="group relative h-full w-full overflow-hidden bg-gray-900">
      <Swiper
        modules={[Autoplay, Navigation, EffectFade]}
        effect="fade"
        speed={1000}
        autoplay={{
          delay: 3500,
          disableOnInteraction: false,
        }}
        loop={allBanners.length > 1}
        className="h-full w-full"
        navigation={{
          prevEl: navigationPrevRef.current,
          nextEl: navigationNextRef.current,
        }}
        onBeforeInit={(swiper) => {
          swiperRef.current = swiper;
          // Important: attach navigation elements after refs are ready
          if (swiper.params.navigation && navigationPrevRef.current && navigationNextRef.current) {
            swiper.params.navigation.prevEl = navigationPrevRef.current;
            swiper.params.navigation.nextEl = navigationNextRef.current;
            swiper.navigation?.init?.();
            swiper.navigation?.update?.();
          }
        }}
      >
        {allBanners.map((banner, i) => (
          <SwiperSlide key={banner._id || `slide-${i}`}>
            {banner.link && banner.link.trim() ? (
              <a
                href={banner.link.trim()}
                target="_blank"
                rel="noopener noreferrer"
                className="relative h-full w-full cursor-pointer block"
              >
                <img
                  src={banner.banner_image}
                  alt={banner.title || "Banner"}
                  className="h-full w-full object-fill md:object-cover transition-transform duration-[7000ms] md:swiper-slide-active:scale-110"
                  onError={(e) => {
                    e.currentTarget.src = "/fallback-banner.jpg";
                    e.currentTarget.alt = "Image failed to load";
                  }}
                />

                <div className="absolute inset-0 bg-black/20 pointer-events-none" />

                {banner.title && (
                  <div className="banner-title absolute bottom-4 left-4 text-white text-sm md:text-base font-medium bg-black/50 px-3 py-1 rounded opacity-0 transition-opacity duration-400 swiper-slide-active:opacity-100">
                    {banner.title}
                  </div>
                )}
              </a>
            ) : (
              <div
                className="relative h-full w-full cursor-pointer"
                onClick={() => {
                  if (banner.company_name?.trim()) {
                    navigate(
                      `/company/${encodeURIComponent(banner.company_name)}`
                    );
                  }
                }}
              >
                <img
                  src={banner.banner_image}
                  alt={banner.title || "Banner"}
                  className="h-full w-full object-fill md:object-cover transition-transform duration-[7000ms] md:swiper-slide-active:scale-110"
                  onError={(e) => {
                    e.currentTarget.src = "/fallback-banner.jpg";
                    e.currentTarget.alt = "Image failed to load";
                  }}
                />

                <div className="absolute inset-0 bg-black/20 pointer-events-none" />

                {banner.title && (
                  <div className="banner-title absolute bottom-4 left-4 text-white text-sm md:text-base font-medium bg-black/50 px-3 py-1 rounded opacity-0 transition-opacity duration-400 swiper-slide-active:opacity-100">
                    {banner.title}
                  </div>
                )}
              </div>
            )}
          </SwiperSlide>
        ))}

        {/* Custom Navigation Buttons */}
        {allBanners.length > 1 && (
          <div
            className={`
            absolute inset-y-0 inset-x-0 z-30
            pointer-events-none
            flex items-center justify-between
            px-4 md:px-6
            opacity-0 group-hover:opacity-100
            transition-opacity duration-300
          `}
          >
            <button
              ref={navigationPrevRef}
              className="
              pointer-events-auto
              h-10 w-10 md:h-12 md:w-12
              flex items-center justify-center
              rounded-full
              bg-black/50 hover:bg-white/90
              text-white hover:text-black
              border border-white/30
              backdrop-blur-sm
              transition-all duration-300
              active:scale-95
              shadow-xl
            "
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>

            <button
              ref={navigationNextRef}
              className="
              pointer-events-auto
              h-10 w-10 md:h-12 md:w-12
              flex items-center justify-center
              rounded-full
              bg-black/50 hover:bg-white/90
              text-white hover:text-black
              border border-white/30
              backdrop-blur-sm
              transition-all duration-300
              active:scale-95
              shadow-xl
            "
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>
        )}
      </Swiper>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            .swiper-fade .swiper-slide { pointer-events: none; }
            .swiper-fade .swiper-slide-active { pointer-events: auto; }
            .swiper-button-disabled { opacity: 0.4 !important; cursor: not-allowed; }
          `,
        }}
      />
    </div>
  );
};

export default BannerCarousel;
