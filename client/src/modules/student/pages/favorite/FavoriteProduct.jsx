import { useContext, useState } from "react";
import FavoriteCard from "./ProductCard"; // ← Changed from ProductCard to FavoriteCard
import { HeartOff, Plus, Phone, MessageCircle, Trash2, Heart, ArrowLeft } from "lucide-react";
import { useGetFavoritesUsersQuery } from "@/redux/api/FavoriteApi";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { useSidebar } from "@/modules/admin/hooks/useSidebar";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Loader from "@/loader/Loader";

const FavoriteProduct = () => {
  const { user } = useContext(AuthContext);
  const userId = user?.user?._id;
  const { data: favoriteProducts, isLoading, refetch } = useGetFavoritesUsersQuery(userId);
  const navigate = useNavigate();
  const categoriesData = favoriteProducts?.data || [];
  const { isSidebarOpen } = useSidebar();

  // Load more logic
  const [visibleCount, setVisibleCount] = useState(10);
  const LOAD_COUNT = 10;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + LOAD_COUNT);
  };

  const visibleProducts = categoriesData.slice(0, visibleCount);

  if (isLoading) {
    return (
      <div className="flex justify-center flex-col items-center min-h-[50vh] w-full">
        <Loader contained={true} label="Fetching your favorites..." />
      </div>
    );
  }

  return (
    <div className="p-2 relative">
      <Button
        type="button"
        onClick={() => navigate(-1)}
        variant="outline"
        className="absolute cursor-pointer top-5 left-5 z-40 flex gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Button>
      <h2 className="text-md mb-3 mt-15 border border-[#0c1f4d] text-[#0c1f4d] bg-gray-100 p-2 rounded-r-2xl w-44 font-bold">
        Favorite Products
      </h2>

      <div className="bg-gradient-to-r from-rose-50 to-pink-50 border border-pink-100 rounded-xl p-5 mb-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-2 -mr-2 w-24 h-24 bg-pink-200 rounded-full opacity-20 blur-xl"></div>

        <div className="flex items-start gap-4 relative z-10">
          <div className="bg-white p-2.5 rounded-lg shadow-sm text-rose-500 mt-1">
            <Heart className="w-6 h-6 fill-rose-50" />
          </div>

          <div className="flex-1">
            <h3 className="text-rose-950 font-bold text-lg flex items-center gap-2">
              SOP: Manage Your Shortlist
            </h3>
            <p className="text-sm text-rose-800 mt-1 leading-relaxed max-w-3xl">
              This is your personal workspace for potential procurements. Review your shortlisted products and take the following actions to move forward:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-md border border-pink-100 text-xs text-gray-700 shadow-sm">
                <div className="bg-gray-100 p-1.5 rounded-full">
                  <Trash2 className="w-3.5 h-3.5 text-gray-500" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-gray-900">Refine List</span>
                  <span className="text-[10px] text-gray-500">Remove unwanted items</span>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-md border border-pink-100 text-xs text-gray-700 shadow-sm">
                <div className="bg-blue-100 p-1.5 rounded-full">
                  <MessageCircle className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-gray-900">Get Quotes</span>
                  <span className="text-[10px] text-gray-500">Send enquiry to seller</span>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-md border border-pink-100 text-xs text-gray-700 shadow-sm">
                <div className="bg-green-100 p-1.5 rounded-full">
                  <Phone className="w-3.5 h-3.5 text-green-600" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-gray-900">Connect Direct</span>
                  <span className="text-[10px] text-gray-500">Request phone number</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {categoriesData.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500 bg-gray-50 rounded-2xl shadow-inner">
          <HeartOff className="w-16 h-16 mb-4 text-gray-400" />
          <p className="text-lg font-semibold">No favorite products found.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {visibleProducts.map((favorite) => (
              <FavoriteCard
                key={favorite._id}
                favorite={favorite}   // ← Pass the whole object
              />
            ))}
          </div>

          {visibleCount < categoriesData.length && (
            <div className="mt-10 flex justify-center">
              <button
                onClick={handleLoadMore}
                className="flex items-center gap-2 bg-[#0c1f4d] text-white px-6 py-2 rounded-full font-semibold text-sm hover:bg-[#162d66] transition-all"
              >
                <Plus className="w-4 h-4" />
                Load More
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FavoriteProduct;
