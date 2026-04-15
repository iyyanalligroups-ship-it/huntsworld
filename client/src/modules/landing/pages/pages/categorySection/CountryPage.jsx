// src/components/CountryPage.jsx
import React, { useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, FreeMode } from 'swiper/modules';
import { ChevronLeft, ChevronRight, Globe2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import 'swiper/css';
import 'swiper/css/free-mode';

// Import your local no-image
import noImage from '@/assets/images/no-image.jpg';

const CountryPage = ({ countries }) => {
  const swiperRef = useRef(null);
  const navigate = useNavigate();

  const goAll = () => navigate('/all-countries');
  const goCountry = (name) => {
    if (!name) return;
    navigate(`/country/${encodeURIComponent(name.trim())}`);
  };

  return (
    <div className="group relative w-full py-10 px-4 md:px-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#0c1f4d] md:text-3xl">
            Suppliers by Country
          </h2>
          <div className="mt-1 h-1 w-20 rounded-full bg-gradient-to-r from-red-500 to-orange-400" />
        </div>

        {/* Improved Navigation Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => swiperRef.current?.swiper.slidePrev()}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-sm transition-all hover:bg-[#0c1f4d] hover:text-white active:scale-95"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => swiperRef.current?.swiper.slideNext()}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-sm transition-all hover:bg-[#0c1f4d] hover:text-white active:scale-95"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <Swiper
        ref={swiperRef}
        modules={[Autoplay, FreeMode]}
        autoplay={{ delay: 4000, disableOnInteraction: false }}
        freeMode={true}
        spaceBetween={20}
        slidesPerView="auto"
        grabCursor={true}
        className="!overflow-visible"
      >
        {countries.map((country, i) => (
          <SwiperSlide key={i} className="!w-[140px]">
            <div
              onClick={() => goCountry(country.name)}
              className="group/card relative flex h-40 w-full cursor-pointer flex-col items-center justify-end rounded-2xl bg-white p-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.15)]"
            >
              {/* Flag Container - Animated */}
              <div className="absolute -top-6 left-1/2 h-20 w-20 -translate-x-1/2 overflow-hidden rounded-2xl border-4 border-white bg-gray-50 shadow-md transition-transform duration-500 group-hover/card:rotate-6 group-hover/card:scale-110">
                <img
                  src={country.image || noImage}
                  alt={country.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  onError={(e) => { e.currentTarget.src = noImage; }}
                />
              </div>

              {/* Country Name */}
              <div className="w-full text-center">
                <p className="line-clamp-2 text-sm font-bold text-[#0c1f4d] transition-colors group-hover/card:text-red-600">
                  {country.name}
                </p>
                <span className="mt-1 inline-block h-1 w-0 rounded-full bg-red-500 transition-all duration-300 group-hover/card:w-8" />
              </div>
            </div>
          </SwiperSlide>
        ))}

        {/* "See All" Card with unique Gradient UI */}
        <SwiperSlide className="!w-[140px]">
          <div
            onClick={goAll}
            className="group/all relative flex h-40 w-full cursor-pointer flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-[#0c1f4d] to-[#1a3a8a] p-4 text-white shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-blue-900/20"
          >
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 ring-4 ring-white/5 transition-transform duration-500 group-hover/all:rotate-[360deg]">
              <Globe2 size={24} />
            </div>
            <p className="text-sm font-bold">See All</p>
            <p className="text-[10px] opacity-60">Global Source</p>
          </div>
        </SwiperSlide>
      </Swiper>
    </div>
  );
};

export default CountryPage;
