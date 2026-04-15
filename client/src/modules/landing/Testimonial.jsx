import React, { useState, useEffect, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import { Star, User, ArrowLeft, ArrowRight, MessageSquareOff, RefreshCcw } from 'lucide-react';
import { motion } from 'framer-motion';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

const TestimonialCard = ({ animate }) => {
  const { message, author, rating, index } = animate;

  return (
    <motion.div
      key={index}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="relative w-full max-w-[380px] mx-auto my-10"
    >
      <div className="relative bg-white px-8 py-10 text-center shadow-xl rounded-[30px] border border-gray-100 flex flex-col items-center">
        {/* Profile Icon */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2">
          <div className="w-20 h-20 rounded-full border-4 border-white bg-gray-50 flex items-center justify-center shadow-md">
            <User size={40} className="text-gray-400" />
          </div>
        </div>

        {/* Author Name */}
        <h2 className="text-xl font-bold text-gray-800 tracking-tight uppercase mt-4 mb-2">
          {author}
        </h2>

        {/* Rating Stars */}
        <div className="flex justify-center gap-1 mb-4">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={18}
              className={`${i < rating ? 'fill-orange-400 text-orange-400' : 'fill-gray-200 text-gray-200'
                }`}
            />
          ))}
        </div>

        {/* Testimonial Message */}
        <p className="text-gray-600 text-sm leading-relaxed mb-6 font-medium italic">
          "{message}"
        </p>

        {/* Role/Badge */}
        <div className="text-gray-400 font-bold text-[10px] tracking-widest uppercase">
          Verified Client
        </div>

        {/* Speech Bubble Tail */}
        <div
          className="absolute -bottom-6 left-10 w-0 h-0
                     border-t-[25px] border-t-white
                     border-r-[25px] border-r-transparent"
        />
      </div>
    </motion.div>
  );
};

export default function Testimonial() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const swiperRef = useRef(null);

  const fetchTestimonials = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/testimonialweb`);
      const data = await response.json();
      if (response.ok) {
        setTestimonials(data.testimonials || []);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>;

  return (
    <div className="py-20 p-6 ">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <div className="relative mb-10 flex flex-col items-start px-4">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-[2px] h-[24px] bg-red-600" />
            <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-gray-400">
              Customer Feedback
            </span>
          </div>

          <div className="flex items-baseline gap-3">
            <h2 className="text-xl md:text-3xl font-black text-[#0c1f4d] tracking-tighter leading-tight">
              What Our <span className="text-red-600">Clients Say</span>
            </h2>
          </div>

          <div className="h-[4px] w-[80px] bg-[#0c1f4d] mt-4 rounded-full" />
        </div>

        {/* Navigation - Only visible if testimonials exist */}
        {testimonials.length > 0 && (
          <div className="flex gap-3">
            <button
              onClick={() => swiperRef.current?.swiper.slidePrev()}
              className="w-10 h-10 cursor-pointer flex items-center justify-center rounded-full border border-[#0c1f4d] text-[#0c1f4d] hover:bg-[#0c1f4d] hover:text-white transition-all shadow-sm"
              aria-label="Previous testimonial"
            >
              <ArrowLeft size={20} />
            </button>
            <button
              onClick={() => swiperRef.current?.swiper.slideNext()}
              className="w-10 h-10 cursor-pointer flex items-center justify-center rounded-full border border-[#0c1f4d] text-[#0c1f4d] hover:bg-[#0c1f4d] hover:text-white transition-all shadow-sm"
              aria-label="Next testimonial"
            >
              <ArrowRight size={20} />
            </button>
          </div>
        )}
      </div>

      {/* Logic for Swiper vs Empty State */}
      {testimonials.length > 0 ? (
        <Swiper
          ref={swiperRef}
          slidesPerView={1}
          spaceBetween={30}
          pagination={{
            clickable: true,
            dynamicBullets: true
          }}
          autoplay={{ delay: 4000, disableOnInteraction: false }}
          modules={[Autoplay, Pagination, Navigation]}
          breakpoints={{
            768: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
          }}
          className="!pb-20"
        >
          {testimonials.map((t) => (
            <SwiperSlide key={t._id}>
              <TestimonialCard
                animate={{
                  message: t.message,
                  author: t.user_id?.name || 'Anonymous',
                  rating: t.rating || 5,
                  index: t._id,
                }}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      ) : (
        /* ✨ ENHANCED NOT FOUND UI */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full flex flex-col items-center justify-center px-4  rounded-[40px] "
        >
          <div className="relative mb-6">
            <div className="absolute inset-0  rounded-full blur-2xl opacity-40 animate-pulse" />
            <div className="relative bg-white p-6 rounded-full shadow-sm border border-gray-100">
               <MessageSquareOff size={48} className="text-gray-300" />
            </div>
          </div>

          <h3 className="text-2xl font-bold text-[#0c1f4d] mb-2 text-center">
            No Testimonials Yet
          </h3>
          <p className="text-gray-500 text-center max-w-sm mb-8 leading-relaxed">
            We haven't received any client feedback for this category yet. Be the first to share your experience with us!
          </p>


        </motion.div>
      )}

      <style jsx>{`
        :global(.swiper-pagination-bullet) {
          background: #0c1f4d !important;
          width: 10px;
          height: 10px;
          opacity: 0.3;
        }
        :global(.swiper-pagination-bullet-active) {
          opacity: 1;
          transform: scale(1.2);
          width: 25px;
          border-radius: 5px;
        }
      `}</style>
    </div>
  );
}
