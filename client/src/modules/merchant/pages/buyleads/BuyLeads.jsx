import React, { useState, useEffect, useCallback, useContext } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  User,
  Phone,
  Search,
  MapPin,
  Calendar,
  Info,
  MessageCircle,
  TrendingUp,
  Clock,
  Lock
} from 'lucide-react';
import { useGetBuyLeadsQuery } from '@/redux/api/ProductApi';
import { useSidebar } from '@/modules/admin/hooks/useSidebar';
import { useSelectedUser } from '@/modules/admin/context/SelectedUserContext';
import { AuthContext } from '@/modules/landing/context/AuthContext'; // Ensure this path is correct
import { useNavigate } from 'react-router-dom';
import { debounce } from 'lodash';
import Loader from '@/loader/Loader';

const BuyLeads = () => {
  const { isSidebarOpen } = useSidebar();
  const { setSelectedUser } = useSelectedUser();
  const { user } = useContext(AuthContext); // Access logged in user details
  const navigate = useNavigate();

  // Extract User ID - adjust based on your exact AuthProvider structure
  const userId = user?.user?._id || user?._id;

  const [page, setPage] = useState(1);
  const [buyLeads, setBuyLeads] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadedPages, setLoadedPages] = useState(new Set());

 // Inside BuyLeads.jsx
const { data, isLoading, isFetching, isError, error, refetch } = useGetBuyLeadsQuery(
  { page, limit: 10 },
  { skip: !user || (!hasMore && page > 1) } // Skip if no user session
);

  // --- LOGIC FOR DATA SYNC ---
  useEffect(() => {
    if (!data?.data || data.data.length === 0) return;
    if (loadedPages.has(page)) return;

    const newLeads = data.data.filter(
      (lead) => !buyLeads.some((existing) => existing._id === lead._id)
    );

    if (newLeads.length === 0) return;

    setBuyLeads((prev) => [...prev, ...newLeads]);
    setLoadedPages((prev) => new Set(prev).add(page));
    setHasMore(page < (data.totalPages || 0));
  }, [data, page, buyLeads, loadedPages]);

  const handleScroll = useCallback(
    debounce(() => {
      if (
        window.innerHeight + document.documentElement.scrollTop + 100 >=
          document.documentElement.offsetHeight &&
        hasMore &&
        !isFetching &&
        !isLoading
      ) {
        setPage((prev) => prev + 1);
      }
    }, 300),
    [hasMore, isFetching, isLoading]
  );

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      handleScroll.cancel();
    };
  }, [handleScroll]);

  const handleRetry = () => {
    setPage(1);
    setBuyLeads([]);
    setHasMore(true);
    setLoadedPages(new Set());
    refetch();
  };

  const handleCardClick = (user) => {
    if (user) {
      setSelectedUser(user);
      navigate('/chat');
    }
  };

  // Formatting helpers
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }).format(date);
  };

  const formatType = (type) => {
    return type ? type.replace(/_/g, ' ') : 'N/A';
  };

  // --- ERROR STATE (INCLUDING PLAN VALIDATION) ---
  if (isError) {
    const isRestricted = error?.status === 403;

    return (
      <div className={`container mx-auto max-w-7xl p-4 ${isSidebarOpen ? 'p-6 lg:ml-56' : 'p-4 lg:ml-16'}`}>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <div className={`p-6 rounded-full mb-6 ${isRestricted ? 'bg-amber-50' : 'bg-red-50'}`}>
            {isRestricted ? (
              <Lock className="w-10 h-10 text-amber-500" />
            ) : (
              <Info className="w-10 h-10 text-red-500" />
            )}
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {isRestricted ? 'Feature Restricted' : 'Failed to load leads'}
          </h3>
          <p className="text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">
            {error?.data?.error || 'An unexpected error occurred while verifying your access.'}
          </p>

          {isRestricted ? (
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={() => navigate('/merchant/plans/subscription')} className="bg-[#0c1f4d] hover:bg-[#152c63] px-8">
                View Subscription Plans
              </Button>
              {/* <Button variant="outline" onClick={() => navigate(-1)}>
                Go Back
              </Button> */}
            </div>
          ) : (
            <Button onClick={handleRetry} variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
              Try Again
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50/30 ${isSidebarOpen ? 'p-6 lg:ml-56' : 'p-4 lg:ml-16'}`}>

      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0c1f4d] flex items-center gap-2">
          <TrendingUp className="h-6 w-6" />
          Buy Leads
        </h1>
        <p className="text-gray-500 text-sm mt-1">Real-time purchase intent from marketplace searches</p>
      </div>

      {/* SOP Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-5 mb-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-blue-200 rounded-full opacity-20 blur-xl"></div>
        <div className="flex items-start gap-4 relative z-10">
          <div className="bg-white p-2 rounded-full shadow-sm text-blue-600">
            <Info className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-blue-900 text-lg">How Buy Leads Work (SOP)</h3>
            <p className="text-sm text-blue-800 mt-1 leading-relaxed max-w-3xl">
              These leads are generated automatically when a user searches for a specific product or service on the platform.
              <span className="font-semibold"> Example:</span> If a user searches for "Organic Rice", that search intent is captured and displayed here immediately so you can connect with them.
            </p>
          </div>
        </div>
      </div>

      {/* Loading First Page Loader */}
      {isLoading && page === 1 && <Loader contained={true} />}

      {/* No Leads State */}
      {!isLoading && buyLeads.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-gray-300 shadow-sm">
          <div className="bg-gray-50 p-6 rounded-full mb-4">
            <Search className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">No Buy Leads Yet</h3>
          <p className="text-gray-500 mt-2 text-center max-w-sm">
            When users search for products you sell, they will appear here. Check back later!
          </p>
        </div>
      )}

      {/* Leads Grid */}
      {buyLeads.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-10">
          {buyLeads.map((lead) => (
            <Card
              key={lead._id}
              className="group relative hover:shadow-lg transition-all duration-300 cursor-pointer bg-white border-gray-200 overflow-hidden"
              onClick={() => handleCardClick(lead.user_id)}
            >
              {/* Colored Top Accent */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>

              <CardContent className="p-5 pt-7">
                {/* Header: Type & Search Term */}
                <div className="flex justify-between items-start mb-4">
                   <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm ${
                     lead.type === 'product' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'
                   }`}>
                     {formatType(lead.type)}
                   </span>
                   <span className="text-xs text-gray-400 flex items-center gap-1">
                     <Clock className="w-3 h-3" /> {formatDate(lead.createdAt)}
                   </span>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-6 line-clamp-2 leading-tight group-hover:text-blue-700 transition-colors">
                  "{lead.searchTerm || 'Untitled Lead'}"
                </h3>

                {/* User Details */}
                <div className="space-y-3 border-t border-dashed border-gray-100 pt-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{lead.user_id?.name || 'Unknown User'}</p>
                      <p className="text-xs text-gray-500">Potential Buyer</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                    <div className="flex items-center gap-2 text-gray-600 bg-gray-50 p-2 rounded">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      <span className="truncate">{lead.user_id?.phone || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 bg-gray-50 p-2 rounded">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      <span className="truncate">{lead.city || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </CardContent>

              {/* Action Footer */}
              <CardFooter className="p-4 pt-0">
                <Button className="w-full bg-[#0c1f4d] hover:bg-[#152c63] text-white group-hover:translate-y-0 transition-all">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Chat Now
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Loading More Spinner */}
      {isFetching && page > 1 && (
        <div className="flex flex-col items-center justify-center py-6">
          <Loader2 className="w-8 h-8 animate-spin text-[#0c1f4d]" />
          <span className="mt-2 text-sm text-gray-500 font-medium">Fetching more leads...</span>
        </div>
      )}
    </div>
  );
};

export default BuyLeads;
