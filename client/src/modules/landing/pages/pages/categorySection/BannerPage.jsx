import React, { useContext, useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import { ChevronLeft, ChevronRight, Image as ImageIcon, ArrowLeft, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import 'swiper/css';
import 'swiper/css/autoplay';
import '../../../css/BannerPage.css';
import { useGetRectangleBannersQuery } from '@/redux/api/BannerPaymentApi';
import { AuthContext } from '@/modules/landing/context/AuthContext';
import axios from 'axios';
import noImage from "@/assets/images/no-image.jpg"
import { motion } from 'framer-motion';

const BannerPage = () => {
  const { user } = useContext(AuthContext);
  const user_id = user?.user?._id;
  const userRole = user?.user?.role?.role;
  const navigate = useNavigate();

  const { data: bannerData, isLoading, error } = useGetRectangleBannersQuery(user_id);
  const [hasValidBanner, setHasValidBanner] = useState(null);
  const swiperRef = React.useRef(null);

  const handlePrev = () => swiperRef.current?.swiper.slidePrev();
  const handleNext = () => swiperRef.current?.swiper.slideNext();

  const handleUpdateProfile = () => {
    const roleMap = {
      USER: '/sell-product',
      STUDENT: '/sell-product',
      MERCHANT: '/merchant/plans/banner',
      SERVICE_PROVIDER: '/service/plans/banner',
      GROCERY_SELLER: '/sell-product',
    };
    navigate(roleMap[userRole] || '/user-settings');
  };

  useEffect(() => {
    if (!user_id) {
      setHasValidBanner(false);
      return;
    }

    const checkBanner = async () => {
      try {
        const token = user?.token || sessionStorage.getItem('token');
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/merchants/check-banner-status`,
          { user_id: user_id },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        if (response.data.success) {
          setHasValidBanner(response.data.data.hasValidBanner);
        } else {
          setHasValidBanner(false);
        }
      } catch (err) {
        console.error("Failed to check banner status", err);
        setHasValidBanner(false);
      }
    };

    if (['MERCHANT', 'SERVICE_PROVIDER'].includes(userRole)) {
      checkBanner();
    } else {
      setHasValidBanner(false);
    }
  }, [user_id, userRole]);

  if (isLoading || hasValidBanner === null) {
    return <p className="text-center py-6 text-gray-500">Loading banners...</p>;
  }

  // ✅ UPDATED HERE (changed banners → data)
  const allBanners = bannerData?.data || [];

  const validBanners = allBanners.filter(banner =>
    banner.rectangle_logo &&
    banner.rectangle_logo.trim() !== "" &&
    banner.company_name &&
    banner.company_name.trim() !== ""
  );

  const handleCompany = (companyName) => {
    console.log(companyName,'company');
    
    if (!companyName) return;
    const slug = companyName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    navigate(`/company/${slug}`);
  };

  if (validBanners.length === 0) {
    return (
      <div className="p-4 mt-10">
        <Card className="max-w-md mx-auto shadow-md border">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-[#0c1f4d] flex items-center gap-2">
              <ImageIcon className="w-6 h-6 text-[#0c1f4d]" />
              No Banner Available
            </CardTitle>
            <CardDescription className="text-gray-600">
              {!user_id
                ? "Log in to view and manage your banners."
                : userRole === 'MERCHANT' || userRole === 'SERVICE_PROVIDER'
                  ? "You haven't uploaded a banner yet. Start promoting your brand!"
                  : "Become a merchant today to display your banners here!"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!user_id ? (
              <Button
                onClick={() => navigate('/login')}
                className="w-full bg-[#0c1f4d]"
              >
                Log In
              </Button>
            ) : (
              <Button
                onClick={handleUpdateProfile}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                {/* Dynamic Button Text based on role */}
                {userRole === 'MERCHANT' || userRole === 'SERVICE_PROVIDER'
                  ? "Add My First Banner"
                  : "Become a Merchant"}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }
  const shouldShowNav = validBanners.length > 0;

  return (
    <div className="w-full mt-10 px-4">

      <div className="flex justify-between items-center mb-6">

        <h2 className="text-2xl md:text-3xl font-black text-[#0c1f4d]">
          Popular <span className="text-red-600">Banners</span>
        </h2>

        {shouldShowNav && (
          <div className="flex gap-3">
            <button
              onClick={handlePrev}
              className="w-10 h-10 cursor-pointer flex items-center justify-center rounded-full border border-[#0c1f4d] text-[#0c1f4d] hover:bg-[#0c1f4d] hover:text-white transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <button
              onClick={handleNext}
              className="w-10 h-10 cursor-pointer flex items-center justify-center rounded-full border border-[#0c1f4d] text-[#0c1f4d] hover:bg-[#0c1f4d] hover:text-white transition-all"
            >
              <ArrowRight size={20} />
            </button>
          </div>
        )}
      </div>

      <Swiper
        ref={swiperRef}
        modules={[Autoplay]}
        autoplay={validBanners.length >= 3 ? { delay: 2000, disableOnInteraction: false } : false}
        spaceBetween={16}
        slidesPerView={2.2}
        breakpoints={{
          640: { slidesPerView: 2.5 },
          768: { slidesPerView: 3.5 },
          1024: { slidesPerView: 4.5 },
        }}
      >
        {validBanners.map((banner) => (
          <SwiperSlide key={banner._id}>
            <div
              className="h-32 bg-white border rounded shadow-sm cursor-pointer transition-transform hover:scale-105"
              onClick={() => handleCompany(banner.company_name)}
            >
              <img
                src={banner.rectangle_logo || noImage}
                alt={banner.company_name}
                className="w-full h-full object-contain p-4"
                onError={(e) => {
                  e.target.src = noImage;
                }}
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

    </div>
  );
};

export default BannerPage;
