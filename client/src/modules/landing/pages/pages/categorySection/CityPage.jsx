import React, { useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import { ArrowLeft, ArrowRight, MapPin, SearchX, RefreshCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "swiper/css";
import { motion } from 'framer-motion';

const CityPage = ({ cities = [] }) => {
  const swiperRef = useRef(null);
  const navigate = useNavigate();

  const goAll = () => navigate("/all-city");
  const goSuppliers = (cityName) => {
    const safe = encodeURIComponent(cityName.trim());
    navigate(`/suppliers/${safe}`);
  };

  const hasCities = cities && cities.length > 0;

  return (
    <div className="w-full py-8 p-6 ">
      <div className="max-w-8xl mx-auto">

        {/* Header Section */}
        <div className="flex items-center justify-between mb-10">
          <div className="relative flex flex-col items-start px-4">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-[2px] h-[24px] bg-red-600" />
              <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-gray-400">
                Regional Network
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <h2 className="text-xl md:text-3xl font-black text-[#0c1f4d] tracking-tighter leading-tight">
                Suppliers by <span className="text-red-600">City</span>
              </h2>
            </div>
            <div className="h-[4px] w-[80px] bg-[#0c1f4d] mt-4 rounded-full" />
          </div>

          {/* Navigation Controls - Only show if data exists */}
          {hasCities && (
            <div className="flex gap-3">
              <button
                onClick={() => swiperRef.current?.swiper.slidePrev()}
                className="w-10 h-10 cursor-pointer flex items-center justify-center rounded-full border border-[#0c1f4d] text-[#0c1f4d] hover:bg-[#0c1f4d] hover:text-white transition-all shadow-sm"
              >
                <ArrowLeft size={18} />
              </button>
              <button
                onClick={() => swiperRef.current?.swiper.slideNext()}
                className="w-10 h-10 cursor-pointer flex items-center justify-center rounded-full border border-[#0c1f4d] text-[#0c1f4d] hover:bg-[#0c1f4d] hover:text-white transition-all shadow-sm"
              >
                <ArrowRight size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Content Area */}
        {!hasCities ? (
          /* ✨ PREMIUM EMPTY STATE */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full py-12 flex flex-col items-center justify-center bg-white rounded-[24px] border border-dashed border-gray-200 shadow-sm"
          >
            <div className="p-4 bg-gray-50 rounded-full mb-4">
              <SearchX className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-[#0c1f4d]">No Cities Found</h3>
            <p className="text-gray-400 text-sm mb-6 text-center max-w-xs">
              We couldn't find any supplier regions at the moment.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-6 py-2 bg-[#0c1f4d] text-white rounded-full text-xs font-bold hover:bg-red-600 transition-colors"
            >
              <RefreshCcw size={14} /> Refresh Data
            </button>
          </motion.div>
        ) : (
          /* SLIDER VIEW */
          <div className="flex justify-center w-full overflow-hidden">
            <Swiper
              ref={swiperRef}
              modules={[Autoplay]}
              autoplay={{ delay: 3500, disableOnInteraction: false }}
              spaceBetween={16}
              slidesPerView="auto"
              className="city-swiper !overflow-visible w-full"
            >
              {cities.map((city, idx) => (
                <SwiperSlide
                  key={idx}
                  style={{ width: "auto" }}
                  className="py-2"
                >
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => goSuppliers(city.name)}
                    className="flex items-center space-x-3 px-6 h-14 bg-white text-[#0c1f4d] font-bold text-sm rounded-2xl shadow-sm border border-gray-100 hover:border-red-600/30 hover:shadow-md transition-all cursor-pointer whitespace-nowrap group"
                  >
                    <div className="bg-red-50 p-2 rounded-lg group-hover:bg-red-600 group-hover:text-white transition-colors">
                      <MapPin size={16} className="text-inherit" />
                    </div>
                    <div className="flex flex-col items-start leading-none">
                      <span>{city.name}</span>
                      {city.total && (
                        <span className="text-[10px] text-gray-400 font-medium mt-1">
                          {city.total} Suppliers
                        </span>
                      )}
                    </div>
                  </motion.button>
                </SwiperSlide>
              ))}

              {/* See All Slide */}
              <SwiperSlide style={{ width: "auto" }} className="py-2">
                <button
                  onClick={goAll}
                  className="px-8 h-14 bg-[#0c1f4d] text-white font-bold text-sm rounded-2xl shadow-lg hover:bg-red-600 hover:shadow-red-600/20 transition-all cursor-pointer whitespace-nowrap flex items-center"
                >
                  Explore All Regions <ArrowRight size={16} className="ml-2" />
                </button>
              </SwiperSlide>
            </Swiper>
          </div>
        )}
      </div>
    </div>
  );
};

export default CityPage;
