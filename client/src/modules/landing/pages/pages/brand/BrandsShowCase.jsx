import { useState, useEffect } from 'react';
import { useGetBrandsForLandingQuery } from '@/redux/api/BrandApi';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, SearchX, RefreshCcw } from 'lucide-react'; // Added icons

const BrandsDisplay = () => {
    const [page, setPage] = useState(1);
    const [allBrands, setAllBrands] = useState([]);
    const [totalPages, setTotalPages] = useState(1);

    const navigate = useNavigate();
    const limit = 10;

    const { data, isLoading, isFetching, isError, refetch } =
        useGetBrandsForLandingQuery({ page, limit });

    useEffect(() => {
        if (!data?.data) return;

        if (page === 1) {
            setAllBrands(data.data);
        } else {
            // ✅ Improved: Prevent duplicates using a Map if API returns overlapping data
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
            <div className="p-6 ">

                {/* Header */}
                <div className="relative mb-12 flex flex-col items-start px-4">
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

                {/* Brands Grid & Empty State Logic */}
                {!isLoading && allBrands.length === 0 ? (
                    // ✨ IMPROVED NOT FOUND UI
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center  bg-gray-50/50 rounded-[32px] border-2 border-dashed border-gray-100"
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
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        <AnimatePresence mode='popLayout'>
                            {allBrands.map((brand, idx) => (
                                <motion.div
                                    key={brand._id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    onClick={() => {
                                        if (brand.link) {
                                            window.open(brand.link, "_blank", "noopener,noreferrer");
                                        }
                                    }}
                                    transition={{ duration: 0.3, delay: (idx % 10) * 0.05 }}

                                    className="group cursor-pointer relative bg-white border border-gray-100 rounded-2xl p-6 h-32 flex justify-center items-center
                                               shadow-[0_2px_10px_rgba(0,0,0,0.02)]
                                               hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)]
                                               hover:-translate-y-2 transition-all duration-500 overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent
                                                   opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                    <img
                                        src={brand.image_url}
                                        alt={brand.brand_name}
                                        className="max-h-full max-w-full object-contain filter grayscale
                                                   group-hover:grayscale-0 scale-90 group-hover:scale-110
                                                   transition-all duration-500 relative z-10"
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* Skeleton Loader during fetch */}
                        {(isLoading || isFetching) &&
                            Array.from({ length: 5 }).map((_, idx) => (
                                <div
                                    key={`skeleton-${idx}`}
                                    className="h-32 w-full bg-white border border-gray-100 rounded-2xl p-6
                                               flex justify-center items-center shadow-sm"
                                >
                                    <Skeleton className="h-12 w-3/4 rounded-lg bg-gray-100" />
                                </div>
                            ))}
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
