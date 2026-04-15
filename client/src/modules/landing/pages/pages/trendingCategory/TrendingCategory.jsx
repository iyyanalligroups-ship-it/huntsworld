import React, { useRef } from "react";
import CategoryCard from "./CategoryCard";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { useGetTopSubCategoriesQuery } from "@/redux/api/CategoryApi";
import { ChevronLeft, ChevronRight } from "lucide-react";

const TrendingCategory = () => {
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  const { data: trendingSubCategories } = useGetTopSubCategoriesQuery();
  const subCategories = trendingSubCategories?.data || [];

  return (
    <section className=" px-2 relative w-full max-w-full overflow-hidden">
      {/* Header Section */}
      <div className="relative mb-2 flex flex-col items-start px-4">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-[2px] h-[24px] bg-red-600" />
          <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-gray-400">
            Market Insights
          </span>
        </div>

        <div className="flex items-baseline gap-3">
          <h2 className="text-1xl md:text-3xl font-black text-[#0c1f4d] tracking-tighter leading-tight">
            Trending <span className="text-red-600">Categories</span>
          </h2>
        </div>

        <div className="h-[4px] w-[80px] bg-[#0c1f4d] mt-4 rounded-full" />
      </div>

      {/* Navigation Buttons */}
      {/* FIX: Removed 'hidden md:block' to make them visible on all screens */}
      <button
        ref={prevRef}
        className="absolute cursor-pointer left-2 top-[60%] z-20 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-3 shadow-xl rounded-full border border-[#0c1f4d] text-[#0c1f4d] hover:bg-[#0c1f4d] hover:text-white transition-all duration-300 disabled:opacity-0"
      >
        <ChevronLeft size={24} />
      </button>

      <button
        ref={nextRef}
        className="absolute cursor-pointer right-2 top-[60%] z-20 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-3 shadow-xl rounded-full border border-[#0c1f4d] text-[#0c1f4d] hover:bg-[#0c1f4d] hover:text-white transition-all duration-300 disabled:opacity-0"
      >
        <ChevronRight size={24} />
      </button>

      <Swiper
        modules={[Navigation]}
        onInit={(swiper) => {
          swiper.params.navigation.prevEl = prevRef.current;
          swiper.params.navigation.nextEl = nextRef.current;
          swiper.navigation.init();
          swiper.navigation.update();
        }}
        spaceBetween={16}
        slidesPerView={8}
        breakpoints={{
          0: { slidesPerView: 2, spaceBetween: 8 },
          640: { slidesPerView: 3, spaceBetween: 12 },
          768: { slidesPerView: 4, spaceBetween: 16 },
          1024: { slidesPerView: 6, spaceBetween: 16 },
          1280: { slidesPerView: 8, spaceBetween: 16 },
        }}
        navigation={false}
        pagination={false}
        allowTouchMove={true}
        className="mySwiper px-4 py-6"
      >
        {subCategories?.map((cat, index) => (
          <SwiperSlide key={cat.id || index}>
            <div className="group relative transition-all duration-300 hover:-translate-y-2 cursor-pointer">
              <CategoryCard
                title={cat.subCategoryName}
                imageUrl={cat.subCategoryImage}
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};

export default TrendingCategory;
