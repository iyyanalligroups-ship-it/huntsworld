import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

// Icons
import {
  Package,
  Scale,
  Phone,
  Clock,
  MapPinOff,
  User,
  ArrowRight,
  SearchX,
  MessageCircle,
  TrendingUp,
  ShoppingCart,
  Stethoscope,
  Tractor,
  Store,  Info

} from "lucide-react";

// Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Context & Hooks
import { useSocket } from "@/modules/admin/context/SocketContext";
import { useSelectedUser } from "@/modules/admin/context/SelectedUserContext";
import { useGetGrocerySellerRequirementsByLocationQuery } from "@/redux/api/GrocerySellerRequirementApi";
import { useSidebar } from "@/modules/admin/hooks/useSidebar";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import Loader from "@/loader/Loader";

// Initialize dayjs plugin
dayjs.extend(relativeTime);

const GrocerySellerRequirement = () => {
  const { socketRef } = useSocket();
  const socket = socketRef?.current?.requirementSocket;
  const { setSelectedUser } = useSelectedUser();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { isSidebarOpen } = useSidebar();

  const [requirements, setRequirements] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const limit = 10;

  const { data, isFetching, isSuccess, isError, error } =
    useGetGrocerySellerRequirementsByLocationQuery(
      {
        user_id: user?.user?._id,
        page: page,   // Ensure this is passed
        limit: limit  // Ensure this is passed
      },
      { skip: !user?.user?._id }
    );

  /* ------------------- Real-time socket ------------------- */
  useEffect(() => {
    if (!socket) return;
    socket.emit("join-requirements");

    const handleReceiveRequirement = (requirement) => {
      setRequirements((prev) => {
        if (!prev.some((r) => r._id === requirement._id)) {
          return [requirement, ...prev].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
        }
        return prev;
      });
    };

    socket.on("receive-requirement", handleReceiveRequirement);
    return () => socket.off("receive-requirement", handleReceiveRequirement);
  }, [socket]);

  /* ------------------- API data merge ------------------- */
  useEffect(() => {
    if (isSuccess && data?.data?.length) {
      setRequirements((prev) => {
        const existing = new Set(prev.map((r) => r._id));
        const fresh = data.data.filter((r) => !existing.has(r._id));
        return [...prev, ...fresh].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
      });
      setHasMore(data.pagination?.hasNext ?? false);
    } else if (isSuccess && data?.data?.length === 0 && page === 1) {
      // If page 1 comes back empty, ensure list is cleared and no more data
      setHasMore(false);
    }
  }, [data, isSuccess, page]);

  /* ------------------- Handlers ------------------- */
  const handleLoadMore = () => {
    if (hasMore && !isFetching) setPage((p) => p + 1);
  };

  const handleCardClick = (userObj) => {
    setSelectedUser(userObj);
    navigate("/chat");
  };

  /* ------------------- Helpers ------------------- */
  const getBadgeStyle = (type) => {
    if (type?.toLowerCase() === "sell") {
      return "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200";
    }
    return "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200";
  };

  const getBadgeIcon = (type) => {
    if (type?.toLowerCase() === "sell") return <TrendingUp className="w-3 h-3 mr-1" />;
    return <ShoppingCart className="w-3 h-3 mr-1" />;
  }

  /* ------------------- Render Sections ------------------- */

  // 1. Loading State (Initial)
  if (isFetching && page === 1 && requirements.length === 0) {
    return <Loader />;
  }

  // 2. Error / Missing Address State
  if (isError) {
    const msg = error?.data?.message?.toLowerCase() || "";
    // Address Missing
    if (msg.includes("address") || msg.includes("location")) {
      return (
        <div className={`h-screen flex flex-col items-center justify-center p-6 ${isSidebarOpen ? "lg:ml-56" : "lg:ml-16"}`}>
          <div className="bg-red-50 p-8 rounded-2xl flex flex-col items-center max-w-md text-center border border-red-100">
            <div className="bg-red-100 p-4 rounded-full mb-4">
              <MapPinOff className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Location Required</h3>
            <p className="text-gray-600 mb-6">
              We need your business address to show you relevant requirements from sellers and buyers in your area.
            </p>
            <Button
              onClick={() => navigate("/merchant/settings")}
              className="bg-[#0c1f4d] hover:bg-[#1a3a82] text-white w-full shadow-lg shadow-blue-900/20"
            >
              Update Address
            </Button>
          </div>
        </div>
      );
    }
    
    // Ignore "No requirements found" errors - let the empty state handle it
    if (msg.includes("no requirements found") || msg.includes("not found")) {
      // Fall through to main content
    } else {
      // General Error for other issues
      return (
        <div className={`h-screen flex items-center justify-center ${isSidebarOpen ? "lg:ml-56" : "lg:ml-16"}`}>
          <div className="text-center">
            <p className="text-red-500 font-medium">Something went wrong.</p>
            <p className="text-gray-500 text-sm">{error?.data?.message}</p>
          </div>
        </div>
      );
    }
  }

  // 3. Main Content
  return (
    <div className={`min-h-screen bg-gray-50/50 flex flex-col transition-all duration-300 ${isSidebarOpen ? "p-6 lg:ml-56" : "p-4 lg:ml-16"}`}>

      {/* Header Section */}
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Marketplace</h2>
          <p className="text-gray-500 text-sm">Real-time requirements from your area</p>
        </div>
      </div>

      {/* SOP / Info Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-5 mb-8 shadow-sm relative overflow-hidden">
        {/* Decorative Background Blur */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-200 rounded-full opacity-20 blur-xl"></div>

        <div className="flex items-start gap-4 relative z-10">
          <div className="bg-white p-2.5 rounded-lg shadow-sm text-blue-600 mt-1">
            <Info className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-blue-900 font-bold text-lg">
              SOP: Base Member Requirements
            </h3>
            <p className="text-sm text-blue-800 mt-1 leading-relaxed max-w-2xl">
              This section displays live procurement requests generated directly from our local base members.
              Connect with them to fulfill their specific inventory or service needs.
            </p>

            {/* Example Tags */}
            <div className="flex flex-wrap gap-3 mt-4">
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-md border border-blue-100 text-xs font-semibold text-gray-700 shadow-sm">
                <Store className="w-3.5 h-3.5 text-orange-500" />
                Small Shops / Retail
              </div>
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-md border border-blue-100 text-xs font-semibold text-gray-700 shadow-sm">
                <Tractor className="w-3.5 h-3.5 text-green-600" />
                Farmers
              </div>
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-md border border-blue-100 text-xs font-semibold text-gray-700 shadow-sm">
                <Stethoscope className="w-3.5 h-3.5 text-red-500" />
                Medical / Pharmacy
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="flex-1">
        {requirements.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <div className="bg-gray-100 p-6 rounded-full mb-4">
              <SearchX className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">No Requirements Found</h3>
            <p className="text-gray-500 max-w-xs mt-2">
              There are currently no active requirements in your location. Check back later!
            </p>
          </div>
        ) : (
          // Cards Grid
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 pb-8">
            {requirements.map((req) => (
              <Card
                key={req._id}
                className="group relative cursor-pointer border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 bg-white overflow-hidden"
                onClick={() => handleCardClick(req.user_id)}
              >
                {/* Decorative top bar */}
                <div className={`h-1 w-full ${req.requirement_type === 'sell' ? 'bg-emerald-500' : 'bg-blue-500'}`} />

                <CardHeader className="pb-3 pt-4">
                  <div className="flex justify-between items-start gap-2">
                    {/* User Info */}
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-gray-100">
                        <AvatarFallback className="bg-gray-100 text-gray-700 font-semibold">
                          {req.user_id?.name?.[0]?.toUpperCase() || <User className="h-4 w-4" />}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-900 leading-tight">
                          {req.user_id?.name || "Unknown User"}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" /> {dayjs(req.createdAt).fromNow()}
                        </span>
                      </div>
                    </div>

                    {/* Badge */}
                    {req.requirement_type && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getBadgeStyle(req.requirement_type)}`}>
                        {getBadgeIcon(req.requirement_type)}
                        {req.requirement_type.toUpperCase()}
                      </span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pb-4">
                  {/* Product Title */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 line-clamp-1 flex items-center gap-2">
                      <Package className="w-5 h-5 text-gray-400" />
                      {req.product_name || "Unspecified Product"}
                    </h3>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                      <span className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                        <Scale className="w-3 h-3" /> Quantity
                      </span>
                      <p className="font-medium text-gray-900 truncate">
                        {req.quantity} <span className="text-gray-500 text-xs">{req.unit_of_measurement}</span>
                      </p>
                    </div>

                    <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                      <span className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                        <Phone className="w-3 h-3" /> Contact
                      </span>
                      <p className="font-medium text-gray-900 truncate">
                        {req.phone_number || "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Preference / Extra Info */}
                  {req.supplier_preference && (
                    <div className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-md italic">
                      "Preference: {req.supplier_preference}"
                    </div>
                  )}
                </CardContent>

                {/* Footer Action */}
                <CardFooter className="pt-0 pb-4">
                  <Button
                    className="w-full bg-white text-[#0c1f4d] border border-[#0c1f4d]/20 hover:bg-[#0c1f4d] hover:text-white transition-colors group-hover:border-[#0c1f4d]"
                    size="sm"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Chat with {req.requirement_type === 'sell' ? 'Seller' : 'Buyer'}
                    <ArrowRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Load More Trigger - HIDDEN IF NO DATA */}
        {hasMore && !isFetching && requirements.length > 0 && (
          <div className="flex justify-center py-6">
            <Button variant="outline" onClick={handleLoadMore} className="min-w-[150px]">
              Load More
            </Button>
          </div>
        )}

        {/* Loading More Indicator */}
        {isFetching && page > 1 && (
          <div className="flex justify-center py-4 text-sm text-gray-500 items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-[#0c1f4d] border-t-transparent rounded-full"></div>
            Loading more...
          </div>
        )}

        {/* End of list */}
        {!hasMore && !isFetching && requirements.length > 0 && (
          <div className="text-center py-6">
            <p className="text-xs text-gray-400 uppercase tracking-widest">End of results</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GrocerySellerRequirement;
