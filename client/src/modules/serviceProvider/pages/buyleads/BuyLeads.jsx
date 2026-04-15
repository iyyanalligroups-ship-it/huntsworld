
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, User, Phone, Search, MapPin, Calendar } from 'lucide-react';
import { useGetBuyLeadsQuery } from '@/redux/api/ProductApi';
import { useSidebar } from '@/modules/admin/hooks/useSidebar';
import { useSelectedUser } from '@/modules/admin/context/SelectedUserContext';
import { useNavigate } from 'react-router-dom';

const BuyLeads = () => {
  const { isSidebarOpen } = useSidebar();
  const { setSelectedUser } = useSelectedUser();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [buyLeads, setBuyLeads] = useState([]);
  const [hasMore, setHasMore] = useState(true);

  // Fetch BuyLeads
  const { data, isLoading, isFetching, isError, error } = useGetBuyLeadsQuery({ page, limit: 10 });

  // Update BuyLeads when new data is fetched
  useEffect(() => {
    if (data?.data) {
      setBuyLeads((prev) => (page === 1 ? data.data : [...prev, ...data.data]));
      setHasMore(page < data.totalPages);
    }
  }, [data, page]);

  // Handle infinite scroll
  const handleScroll = useCallback(() => {
    if (
      window.innerHeight + document.documentElement.scrollTop >=
      document.documentElement.offsetHeight - 100 &&
      hasMore &&
      !isFetching
    ) {
      setPage((prev) => prev + 1);
    }
  }, [hasMore, isFetching]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Reset page on error or initial load
  const handleRetry = () => {
    setPage(1);
    setBuyLeads([]);
    setHasMore(true);
  };

  // Handle card click to navigate to chat
  const handleCardClick = (user) => {
    setSelectedUser(user);
    navigate('/service/chat');
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Capitalize type for display
  const formatType = (type) => {
    return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
  };

  if (isError) {
    return (
      <div className={`container mx-auto max-w-7xl p-4 ${isSidebarOpen ? 'p-6 lg:ml-56' : 'p-4 lg:ml-16'}`}>
        <p className="text-red-500 mb-4">{error?.data?.error || 'Failed to load BuyLeads'}</p>
        <Button onClick={handleRetry} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className={`container mx-auto max-w-7xl ${isSidebarOpen ? 'p-6 lg:ml-56' : 'p-4 lg:ml-16'}`}>
    <h2 className="text-md border-1 border-[#0c1f4d] text-[#0c1f4d] bg-gray-100 p-2 rounded-r-2xl w-34 font-bold">Buy Leads</h2>


      {isLoading && page === 1 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="h-64 ">
              <CardContent className="p-4">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : buyLeads.length === 0 ? (
        <div className="text-center py-10">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6">
              <p className="text-gray-500">No BuyLeads found.</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {buyLeads.map((lead) => (
            <Card
              key={lead._id}
              className="shadow-md hover:shadow-lg transition-shadow cursor-pointer hover:bg-gray-100"
              onClick={() => handleCardClick(lead.user_id)}
            >
              <CardHeader>
                <CardTitle className="text-lg truncate">{lead.searchTerm}</CardTitle>
                <CardDescription className="flex items-center gap-2 text-sm">
                  <Search className="w-4 h-4" />
                  Type: {formatType(lead.type)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4" />
                  Name: {lead.user_id?.name || 'N/A'}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4" />
                  Phone: {lead.user_id?.phone || 'N/A'}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4" />
                  City: {lead.city || 'N/A'}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4" />
                  Created: {formatDate(lead.createdAt)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isFetching && page > 1 && (
        <div className="flex justify-center mt-4">
          <Loader2 className="w-6 h-6 animate-spin text-yellow-500" />
        </div>
      )}
    </div>
  );
};

export default BuyLeads;
