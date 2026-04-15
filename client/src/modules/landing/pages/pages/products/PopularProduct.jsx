import { useState, useEffect, useMemo, useContext } from "react";
import ProductCard from "./ProductCard";
import { useGetTopProductsInfiniteQuery } from "@/redux/api/CategoryApi";
import { useGiveTrendingPointMutation } from "@/redux/api/ProductApi";
import { CategoryApi } from "@/redux/api/CategoryApi";
import { useDispatch } from "react-redux";
import { Plus, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import axios from "axios";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { useGetFavoritesByUserQuery } from "@/redux/api/FavoriteApi";
import { ActiveUserContext } from "@/modules/admin/context/ActiveUserProvider";
import { useNavigate } from "react-router-dom";

const PopularProduct = () => {
  const { user } = useContext(AuthContext);
  const { trackProductView } = useContext(ActiveUserContext);
  const navigate = useNavigate();
  const userId = user?.user?._id;
  const dispatch = useDispatch();

  const [giveTrendingPoint, { isLoading: loadingTrendingGlobal }] = useGiveTrendingPointMutation();

  const [productsState, setProductsState] = useState([]);

  const handleTrendingClick = async (productId) => {
    if (!userId) {
      // setShowLoginModal check here if you have it, or just use the card's behavior
      return;
    }
    try {
      // Optimistic Update
      setProductsState((prev) =>
        prev.map((p) => {
          const id = p.productId || p.product?._id;
          if (id === productId) {
             return { ...p, totalTrendingPoints: (Number(p.totalTrendingPoints) || 0) + 1 };
          }
          return p;
        })
      );

      const res = await giveTrendingPoint({ user_id: userId, product_id: productId }).unwrap();

      if (res.success) {
        if (res.pointsAdded !== 1) {
          setProductsState((prev) =>
            prev.map((p) => {
              const id = p.productId || p.product?._id;
              if (id === productId) {
                 return { ...p, totalTrendingPoints: (Number(p.totalTrendingPoints) || 0) - 1 + res.pointsAdded };
              }
              return p;
            })
          );
        }
        // 🔥 Cache invalidation now handled by mutation's onQueryStarted hook (both ProductApi & CategoryApi)
      }
    } catch (err) {
      console.error("Popular Trending Error:", err);
      // Revert
      setProductsState((prev) =>
        prev.map((p) => {
           const id = p.productId || p.product?._id;
           if (id === productId) {
             return { ...p, totalTrendingPoints: Math.max(0, (Number(p.totalTrendingPoints) || 0) - 1) };
           }
           return p;
        })
      );
    }
  };

  const handleProductClick = (e, name, id, trendingHandler) => {
    e.preventDefault();
    e.stopPropagation();
    if (trendingHandler) trendingHandler(e, id);
    if (trackProductView) trackProductView(id);
    navigate(`/product/${id}`);
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isFetching,
  } = useGetTopProductsInfiniteQuery(
    { limit: 10 },
  );

  // Fetch favorites once for the page
  const { data: favoriteData } = useGetFavoritesByUserQuery(userId, { skip: !userId });

  const favoriteIds = useMemo(() => {
    return new Set(favoriteData?.favorites?.map(fav => fav.product?._id.toString()) || []);
  }, [favoriteData]);

  // Flatten and sync with local state
  useEffect(() => {
    const flat = data?.pages?.flatMap((page) => page.data ?? []) ?? [];
    setProductsState(flat);
  }, [data]);

  const sortedProducts = useMemo(() => {
    if (!productsState.length) return [];

    return [...productsState].sort((a, b) => {
      const scoreA = Number(a.totalTrendingPoints) || 0;
      const scoreB = Number(b.totalTrendingPoints) || 0;

      if (scoreB !== scoreA) return scoreB - scoreA;

      const dateA = new Date(a.product?.createdAt || 0);
      const dateB = new Date(b.product?.createdAt || 0);
      return dateB - dateA;
    });
  }, [productsState]);

  const hasMore = hasNextPage ?? false;

  // Verification status (merchant verified via subscription)
  const [verifiedMap, setVerifiedMap] = useState({});
  // Trust seal status
  const [trustSealStatus, setTrustSealStatus] = useState({});

  // Batch fetch verification status
  const fetchVerificationStatus = async (sellerUserId) => {
    if (!sellerUserId || verifiedMap[sellerUserId] !== undefined) return;

    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/user-subscription-plan/verification-expire`,
        { params: { user_id: sellerUserId } }
      );

      const isActive =
        res.data?.success &&
        res.data?.expires_at &&
        new Date(res.data.expires_at) > new Date();

      setVerifiedMap((prev) => ({
        ...prev,
        [sellerUserId]: isActive,
      }));
    } catch {
      setVerifiedMap((prev) => ({
        ...prev,
        [sellerUserId]: false,
      }));
    }
  };

  // Batch fetch trust seal status
  const fetchTrustSealStatus = async (sellerUserId) => {
    if (!sellerUserId || trustSealStatus[sellerUserId] !== undefined) return;

    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/trust-seal/check-status/${sellerUserId}`
      );
      // Store the full response { status, data }
      setTrustSealStatus((prev) => ({
        ...prev,
        [sellerUserId]: res.data,
      }));
    } catch {
      setTrustSealStatus((prev) => ({
        ...prev,
        [sellerUserId]: { status: null, data: null },
      }));
    }
  };

  // Fetch both when products change
  useEffect(() => {
    const uniqueSellerIds = [...new Set(
      productsState
        .map(item =>
          item?.sellerInfo?.companyAddress?.user_id ||
          (typeof item?.sellerInfo?.user_id === 'object' ? item?.sellerInfo?.user_id?._id : item?.sellerInfo?.user_id) ||
          item?.sellerInfo?._id
        )
        .filter(Boolean)
    )];

    uniqueSellerIds.forEach(id => {
      fetchVerificationStatus(id);
      fetchTrustSealStatus(id);
    });
  }, [productsState]);

  if (isLoading) {
    return (
      <div className="p-6 min-h-[800px] flex items-center justify-center text-gray-500">
        Loading popular products...
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* header */}
      <div className="relative mb-12 flex flex-col items-start px-4">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-[2px] h-[24px] bg-red-600" />
          <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-gray-400">
            Top Trending
          </span>
        </div>
        <div className="flex items-baseline gap-3">
          <h2 className="text-1xl md:text-3xl font-black text-[#0c1f4d] tracking-tighter leading-tight">
            Popular <span className="text-red-600">Products</span>
          </h2>
        </div>
        <div className="h-[4px] w-[80px] bg-[#0c1f4d] mt-4 rounded-full" />
      </div>

      <div className="relative">
        {sortedProducts.length === 0 ? (
          <p className="text-gray-500 text-center py-10">
            No popular products found at the moment...
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {sortedProducts.map((product) => (
              <ProductCard
                key={product.productId || product.product?._id}
                product={product}
                isVerified={verifiedMap[
                  product?.sellerInfo?.companyAddress?.user_id ||
                  (typeof product?.sellerInfo?.user_id === 'object' ? product?.sellerInfo?.user_id?._id : product?.sellerInfo?.user_id) ||
                  product?.sellerInfo?._id
                ] ?? false}
                trustSealStatus={trustSealStatus}
                favoriteIds={favoriteIds}
                userId={userId}
                handleTrendingClick={handleTrendingClick}
                loadingTrending={loadingTrendingGlobal}
                handleProductClick={handleProductClick}
              />
            ))}
          </div>
        )}

        {hasMore && (
          <div className="mt-12 mb-8 text-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
              disabled={isFetchingNextPage}
              className={`
                relative overflow-hidden group
                min-w-[200px] h-12 px-10
                bg-[#0c1f4d] hover:bg-[#162d66]
                text-white font-bold uppercase tracking-widest text-xs
                rounded-full shadow-lg shadow-blue-900/20
                transition-all duration-300 cursor-pointer border-none
                flex items-center justify-center mx-auto
              `}
            >
              <div className="flex items-center justify-center gap-2 relative z-10">
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 transition-transform duration-300 group-hover:rotate-90" />
                    <span>Load More Products</span>
                  </>
                )}
              </div>

              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PopularProduct;
