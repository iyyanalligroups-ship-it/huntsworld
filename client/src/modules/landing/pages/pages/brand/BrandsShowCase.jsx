import { useState, useEffect, useRef } from 'react';
import { useGetBrandsForLandingQuery } from '@/redux/api/BrandApi';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, SearchX, RefreshCcw } from 'lucide-react'; // Added ArrowLeft
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

const BrandsDisplay = () => {
    const [page, setPage] = useState(1);
    const [allBrands, setAllBrands] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const swiperRef = useRef(null);

    const navigate = useNavigate();
    const limit = 10;

    const { data, isLoading, isFetching, isError, refetch } =
        useGetBrandsForLandingQuery({ page, limit });

    useEffect(() => {
        if (!data?.data) return;

        if (page === 1) {
            setAllBrands(data.data);
        } else {
            // ✅ Prevent duplicates 
            setAllBrands((prev) => {
                const combined = [...prev, ...data.data];
                const unique = Array.from(new Map(combined.map(item => [item._id, item])).values());
                return unique;
            });
        }

        setTotalPages(data.pagination?.totalPages || 1);
    }, [data, page]);

    const loadMore = () => {
        if (page < totalPages && !isFetching) {
            setPage((prev) => prev + 1);
        }
    };

    const handleReset = () => {
        setPage(1);
        refetch();
    };

    if (isError) {
        return (
            <div className="text-center py-20 flex flex-col items-center justify-center">
                <div className="bg-red-50 p-4 rounded-full mb-4">
                    <SearchX className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-[#0c1f4d]">Oops! Something went wrong</h3>
                <p className="text-gray-500 mb-6">Unable to load brands at this moment.</p>
                <Button onClick={handleReset} variant="outline" className="rounded-full gap-2">
                    <RefreshCcw className="w-4 h-4" /> Try Again
                </Button>
            </div>
        );
    }

    return (
        <div className="py-16">
            <div className="p-6">

                {/* Header & Nav Controls */}
                <div className="relative mb-12 flex flex-col md:flex-row md:items-end justify-between px-4 gap-6">
                    <div className="flex flex-col items-start">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-[2px] h-[24px] bg-red-600" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-gray-400">
                                Our Network
                            </span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black text-[#0c1f4d] tracking-tighter leading-tight">
                            Associated <span className="text-red-600">Premium Brands</span>
                        </h2>
                        <div className="h-[4px] w-[80px] bg-[#0c1f4d] mt-4 rounded-full" />
                    </div>

                    {/* Navigation Buttons */}
                    {allBrands.length > 10 && (
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

                {/* Brands Grid & Empty State Logic */}
                {!isLoading && allBrands.length === 0 ? (
                    // ✨ IMPROVED NOT FOUND UI
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center bg-gray-50/50 p-10 rounded-[32px] border-2 border-dashed border-gray-100"
                    >
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-blue-100 rounded-full blur-2xl opacity-50 animate-pulse" />
                            <SearchX className="w-16 h-16 text-gray-300 relative z-10" />
                        </div>
                        <h3 className="text-2xl font-bold text-[#0c1f4d] mb-2">No Brands Found</h3>
                        <p className="text-gray-500 text-center max-w-xs mb-8">
                            We couldn't find any associated brands right now. Check back later for our latest updates.
                        </p>
                    </motion.div>
                ) : (
                    <div className="w-full px-4 relative">
                        <Swiper
                            ref={swiperRef}
                            modules={[Autoplay, Navigation]}
                            spaceBetween={20}
                            slidesPerView="auto"
                            loop={allBrands.length > 10}
                            speed={allBrands.length > 10 ? 2000 : 500} 
                            autoplay={allBrands.length > 10 ? {
                                delay: 0, 
                                disableOnInteraction: false,
                                pauseOnMouseEnter: true,
                            } : false}
                            breakpoints={{
                                320: { slidesPerView: 3, spaceBetween: 20 },
                                640: { slidesPerView: 5, spaceBetween: 30 },
                                1024: { slidesPerView: 8, spaceBetween: 40 },
                            }}
                            className="brands-swiper flex items-center"
                        >
                            {allBrands.map((brand) => (
                                <SwiperSlide key={brand._id} className="!w-auto flex justify-center items-center">
                                    <div
                                        onClick={() => {
                                            if (brand.link) {
                                                window.open(brand.link, "_blank", "noopener,noreferrer");
                                            }
                                        }}
                                        className="group cursor-pointer relative h-16 md:h-20 min-w-[80px] md:min-w-[120px] flex justify-center items-center hover:-translate-y-1 transition-all duration-400"
                                    >
                                        <img
                                            src={brand.image_url}
                                            alt={brand.brand_name}
                                            className="max-h-full max-w-full object-contain filter grayscale opacity-70
                                                       group-hover:grayscale-0 group-hover:opacity-100 scale-95 group-hover:scale-105
                                                       transition-all duration-400 relative z-10"
                                        />
                                    </div>
                                </SwiperSlide>
                            ))}
                            
                            {/* Skeleton Loader during fetch inside Swiper */}
                            {(isLoading || isFetching) &&
                                Array.from({ length: 5 }).map((_, idx) => (
                                    <SwiperSlide key={`skeleton-${idx}`} className="!w-auto flex justify-center items-center">
                                        <div className="h-16 md:h-20 min-w-[80px] md:min-w-[120px] flex justify-center items-center">
                                            <Skeleton className="h-8 w-full rounded-md bg-gray-200" />
                                        </div>
                                    </SwiperSlide>
                                ))}
                        </Swiper>
                        
                        {/* Note: The global Swiper CSS for linear smooth scrolling requires tweaking but speed=2000 with delay=0 is close enough. Overriding easing is done in global css typically */}
                    </div>
                )}

                {/* Load More Button */}
                {page < totalPages && allBrands.length > 0 && (
                    <div className="mt-16 flex justify-center">
                        <Button
                            onClick={loadMore}
                            disabled={isFetching}
                            className="h-14 px-10 bg-[#0c1f4d] hover:bg-[#162a5e]
                                       text-white rounded-full font-bold shadow-lg
                                       shadow-blue-900/20 flex items-center gap-2 group"
                        >
                            {isFetching ? (
                                <RefreshCcw className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    Discover More Brands
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BrandsDisplay;
