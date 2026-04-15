import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

// Icons
import {
  Package,
  MapPin,
  Phone,
  Clock,
  User,
  SearchX,
  MessageCircle,
  ArrowRight,
  Calendar,
  Layers,
  Globe,
  Users,
  ArrowLeftRight,
  Store
} from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge'; // Optional, or use a div

// Context & Hooks
import { useSocket } from '@/modules/admin/context/SocketContext';
import { useSelectedUser } from '@/modules/admin/context/SelectedUserContext';
import { useGetPostByRequirementsByLocationQuery } from '@/redux/api/PostByRequirementApi';
import { useSidebar } from '@/modules/admin/hooks/useSidebar';
import { AuthContext } from '@/modules/landing/context/AuthContext';
import Loader from '@/loader/Loader';

dayjs.extend(relativeTime);

const Truncate = ({ text }) => {
  const rawText = text || "N/A";
  let formattedText = rawText.replace(/[-_]/g, " ");
  formattedText = formattedText.replace(/\b\w/g, (c) => c.toUpperCase());

  return <span className="inline-block">{formattedText}</span>;
};

const SEARequirement = () => {
  const { socketRef } = useSocket();
  const { user } = useContext(AuthContext);
  const { isSidebarOpen } = useSidebar();
  const socket = socketRef?.current?.requirementSocket;
  const { setSelectedUser } = useSelectedUser();
  const navigate = useNavigate();

  const [requirements, setRequirements] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const limit = 10;

  // ✅ FIX: Pass page and limit inside the first argument object so RTK Query sends them
  const { data, isFetching } = useGetPostByRequirementsByLocationQuery(
    { user_id: user?.user?._id, page, limit },
    { skip: !user?.user?._id }
  );

  // Handle real-time requirement updates (Logic Untouched)
  useEffect(() => {
    if (!socket) return;
    socket.emit('join-requirements');

    const handleReceiveRequirement = (requirement) => {
      setRequirements((prev) => {
        if (!prev.some((req) => req._id === requirement._id)) {
          return [requirement, ...prev].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
        return prev;
      });
    };

    socket.on('receive-requirement', handleReceiveRequirement);
    return () => socket.off('receive-requirement', handleReceiveRequirement);
  }, [socket]);

  // Update requirements from API (Logic Untouched)
  useEffect(() => {
    if (data?.data) {
      setRequirements((prev) => {
        const existingIds = new Set(prev.map((req) => req._id));
        const newRequirements = data.data.filter((req) => !existingIds.has(req._id));
        return [...prev, ...newRequirements].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      });
      // Ensure safe access to pagination data
      if (data.pagination) {
        setHasMore(data.pagination.hasNext);
      }
    }
  }, [data]);

  // Load more requirements (Logic Untouched)
  const handleLoadMore = () => {
    if (hasMore && !isFetching) {
      setPage((prev) => prev + 1);
    }
  };

  // Navigate to chat (Logic Untouched)
  const handleCardClick = (user) => {
    setSelectedUser(user);
    navigate('/chat');
  };

  return (
    <div className={`min-h-screen bg-gray-50/50 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'p-6 lg:ml-56' : 'p-4 lg:ml-16'}`}>

      {/* Header */}
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Layers className="h-6 w-6 text-[#0c1f4d]" />
            Requirements
          </h1>
          <p className="text-sm text-gray-500 mt-1">Real-time requests in your area</p>
        </div>
      </div>

      {/* SOP Banner: Unified Marketplace */}
      <div className="bg-gradient-to-r from-gray-50 to-slate-100 border border-gray-200 rounded-xl p-5 mb-8 shadow-sm relative overflow-hidden">
        {/* Decorative Background Element */}
        <div className="absolute top-0 right-0 -mt-2 -mr-2 w-20 h-20 bg-gray-200 rounded-full opacity-30 blur-xl"></div>

        <div className="flex items-start gap-4 relative z-10">
          <div className="bg-white p-2.5 rounded-lg shadow-sm text-gray-700 mt-1">
            <Globe className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-gray-900 font-bold text-lg flex items-center gap-2">
              SOP: Open Market Stream
            </h3>
            <p className="text-sm text-gray-600 mt-1 leading-relaxed max-w-3xl">
              This is the centralized feed for <span className="font-semibold text-gray-900">all open requirements</span> in your vicinity.
              It aggregates demands from two key sources to maximize your business opportunities:
            </p>

            {/* Source Tags */}
            <div className="flex flex-wrap gap-3 mt-4">

              {/* 1. Common Users */}
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-md border border-gray-200 text-xs font-semibold text-gray-700 shadow-sm">
                <div className="bg-green-100 p-1 rounded-full">
                  <Users className="w-3 h-3 text-green-600" />
                </div>
                <div>
                  <span className="block text-gray-900">Common Users</span>
                  <span className="font-normal text-gray-500">Daily household needs</span>
                </div>
              </div>

              {/* Separator Icon */}
              <ArrowLeftRight className="w-4 h-4 text-gray-300 mt-2" />

              {/* 2. Merchants */}
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-md border border-gray-200 text-xs font-semibold text-gray-700 shadow-sm">
                <div className="bg-purple-100 p-1 rounded-full">
                  <Store className="w-3 h-3 text-purple-600" />
                </div>
                <div>
                  <span className="block text-gray-900">Other Merchants</span>
                  <span className="font-normal text-gray-500">B2B / Bulk Stock</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      <div className="flex-1">
        {requirements.length === 0 && !isFetching ? (
          // Empty State
          <div className="flex flex-col items-center justify-center h-[50vh] text-center">
            <div className="bg-white p-6 rounded-full shadow-sm mb-4">
              <SearchX className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">No Requirements Found</h3>
            <p className="text-gray-500 max-w-xs mt-2">
              There are no active requirements matching your location right now.
            </p>
          </div>
        ) : (
          // Grid Layout
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 pb-8">
            {requirements.map((req) => (
              <Card
                key={req._id}
                className="group cursor-pointer border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 bg-white overflow-hidden"
                onClick={() => handleCardClick(req.user_id)}
              >
                {/* Card Header: User Info */}
                <CardHeader className="pb-3 pt-4 border-b border-gray-50 bg-gray-50/30">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-gray-200 bg-white">
                        <AvatarFallback className="bg-blue-50 text-[#0c1f4d] font-bold text-sm">
                          {req.user_id?.name?.[0]?.toUpperCase() || <User className="h-4 w-4" />}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 leading-tight">
                          {req.user_id?.name || 'Unknown User'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {dayjs(req.createdAt).fromNow()}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                {/* Card Content: Details */}
                <CardContent className="space-y-4 pt-4 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-[#0c1f4d] line-clamp-1 flex items-center gap-2">
                      <Package className="h-5 w-5 text-gray-400" />
                      <Truncate text={req.product_or_service} />
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">Quantity</p>
                      <p className="font-medium text-gray-900">
                        {req.quantity} <span className="text-xs text-gray-500">{req.unit_of_measurement}</span>
                      </p>
                    </div>
                    <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">Contact</p>
                      <p className="font-medium text-gray-900 flex items-center gap-1 truncate">
                        <Phone className="h-3 w-3 text-gray-400" />
                        {req.phone_number || "N/A"}
                      </p>
                    </div>
                  </div>

                  {req.supplier_preference && (
                    <div className="flex items-center gap-2 text-xs text-gray-600 bg-blue-50 px-3 py-2 rounded-md border border-blue-100">
                      <MapPin className="h-3 w-3 text-blue-600" />
                      <span className="font-medium">Prefers:</span> {req.supplier_preference}
                    </div>
                  )}
                </CardContent>

                {/* Card Footer: Action */}
                <CardFooter className="pt-0 pb-4">
                  <Button
                    className="w-full bg-white text-[#0c1f4d] border border-[#0c1f4d]/20 hover:bg-[#0c1f4d] hover:text-white group-hover:border-[#0c1f4d] transition-all duration-200"
                    size="sm"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Chat Now
                    <ArrowRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-all" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Load More Button - Only shows if there IS data and MORE is available */}
        {hasMore && !isFetching && requirements.length > 0 && (
          <div className="flex justify-center py-6">
            <Button variant="outline" onClick={handleLoadMore} className="min-w-[150px] shadow-sm">
              Load More
            </Button>
          </div>
        )}

        {/* Loading Spinner */}
        {isFetching && (
          <div className="flex justify-center py-6">
            {page === 1 ? <Loader /> : (
              <div className="text-sm text-gray-500 flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-[#0c1f4d] border-t-transparent rounded-full" />
                Loading more...
              </div>
            )}
          </div>
        )}

        {/* End of Results */}
        {!hasMore && requirements.length > 0 && (
          <div className="text-center py-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-gray-400"></span>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">End of results</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SEARequirement;
