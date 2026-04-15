import React, { useState, useEffect, useContext } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import { Card, CardContent } from "@/components/ui/card";
import { Quote } from "lucide-react";
import axios from "axios";
import { AuthContext } from "@/modules/landing/context/AuthContext"; // Adjust path as needed
import "swiper/css";
import "swiper/css/pagination";

const TestimonialCard = ({ animate }) => {
  const { message, author, role } = animate;
  return (
    <motion.div
      key={animate.index}
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      <Card className="flex-1 min-w-[300px] max-w-[400px] p-6 h-full">
        <CardContent className="p-0">
          <Quote className="w-8 h-8 text-[#0c1f4d] mb-4" />
          <p className="text-gray-700 text-base mb-4">{message}</p>
          <div>
            <h4 className="text-[#0c1f4d] font-semibold">{author}</h4>
            <p className="text-gray-500 text-sm">{role}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function App() {
  const { token } = useContext(AuthContext);
  const [activeIndex, setActiveIndex] = useState(0);
  const [testimonials, setTestimonials] = useState([]);

  // Fetch testimonials from the testimonialweb endpoint
  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/testimonialweb`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // ✅ Use `response.data.testimonials` (backend sends this)
        setTestimonials(
          Array.isArray(response.data?.testimonials)
            ? response.data.testimonials
            : []
        );
      } catch (error) {
        console.error("Error fetching testimonials:", error);
        setTestimonials([]); // fallback
      }
    };

    if (token) {
      fetchTestimonials();
    }
  }, [token]);

  return (
    <div className="flex flex-col  p-10">
      <h2 className="text-3xl md:text-4xl font-bold text-[#0c1f4d] mb-8 text-center">
        Client Testimonials
      </h2>

      <style>
        {`
          .swiper-container-custom {
            position: relative;
            padding-bottom: 40px;
          }
          .swiper-pagination {
            position: absolute;
            bottom: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            margin-top: 20px;
            padding: 10px;
            border-radius: 50px;
            width: fit-content;
            margin-left: auto;
            margin-right: auto;
          }
          .swiper-pagination-bullet {
            width: 12px;
            height: 12px;
            background: gray !important;
            opacity: 1;
            border-radius: 50%;
            margin: 0 6px;
            transition: all 0.3s ease;
          }
          .swiper-pagination-bullet-active {
            background: #0c1f4d !important;
            border-color: #0c1f4d;
            transform: scale(1.2);
          }
        `}
      </style>

      {Array.isArray(testimonials) && testimonials.length > 0 ? (
        <Swiper
          slidesPerView={3}
          spaceBetween={30}
          pagination={{ clickable: true }}
          autoplay={{
            delay: 3000,
            disableOnInteraction: false,
          }}
          modules={[Autoplay, Pagination]}
          className="swiper-container-custom max-w-5xl w-full"
          breakpoints={{
            0: { slidesPerView: 1, spaceBetween: 10 },
            640: { slidesPerView: 2, spaceBetween: 20 },
            1024: { slidesPerView: 3, spaceBetween: 30 },
          }}
          onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
        >
          {testimonials.map((testimonial, index) => (
            <SwiperSlide key={index} className="flex justify-center">
              <TestimonialCard
                animate={{
                  message: testimonial.message,
                  author: testimonial.user_id?.name || "Anonymous",
                  role: testimonial.user_id?.role?.role || "User",
                  index: `${index}-${activeIndex}`,
                }}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      ) : (
        <p className="text-center text-gray-500">
          No testimonials available
        </p>
      )}
    </div>
  );
}
