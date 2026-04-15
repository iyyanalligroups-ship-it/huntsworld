import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '@/modules/admin/context/SocketContext';
import { useSelectedUser } from '@/modules/admin/context/SelectedUserContext';
import { useGetPostByRequirementsByLocationQuery } from '@/redux/api/PostByRequirementApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import dayjs from 'dayjs';
import { useSidebar } from '@/modules/admin/hooks/useSidebar';
import { AuthContext } from '@/modules/landing/context/AuthContext';

const SEARequirement = () => {
  const { socketRef } = useSocket();
  const {user}=useContext(AuthContext);
  const { isSidebarOpen } = useSidebar();
  const socket = socketRef?.current?.requirementSocket; // Use requirements namespace
  const { setSelectedUser } = useSelectedUser();
  const navigate = useNavigate();
  const [requirements, setRequirements] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const limit = 10;

  const { data, isFetching } = useGetPostByRequirementsByLocationQuery({user_id:user?.user?._id},
    { page, limit },
    { skip: !socket }
  );

  // Handle real-time requirement updates
  useEffect(() => {
    if (!socket) return;

    socket.emit('join-requirements');

    const handleReceiveRequirement = (requirement) => {
      setRequirements((prev) => {
        // Avoid duplicates
        if (!prev.some((req) => req._id === requirement._id)) {
          return [requirement, ...prev].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
        return prev;
      });
    };

    socket.on('receive-requirement', handleReceiveRequirement);

    return () => socket.off('receive-requirement', handleReceiveRequirement);
  }, [socket]);

  // Update requirements from API
  useEffect(() => {
    if (data?.data) {
      setRequirements((prev) => {
        const existingIds = new Set(prev.map((req) => req._id));
        const newRequirements = data.data.filter((req) => !existingIds.has(req._id));
        return [...prev, ...newRequirements].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      });
      setHasMore(data?.pagination?.pages > page);
    }
  }, [data]);

  // Load more requirements
  const handleLoadMore = () => {
    if (hasMore && !isFetching) {
      setPage((prev) => prev + 1);
    }
  };

  // Navigate to chat
  const handleCardClick = (user) => {
    setSelectedUser(user);
    navigate('/service/chat');
  };

  return (
    <div className={`h-screen flex flex-col ${isSidebarOpen ? 'p-6 lg:ml-56' : 'p-4 lg:ml-16'}`}>
      <h1 className="text-md border-1 border-[#0c1f4d] text-[#0c1f4d] bg-gray-100 p-2 rounded-r-2xl w-28 font-bold">Requirements</h1>
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {requirements.map((req) => (
          <Card
            key={req._id}
            className="cursor-pointer hover:bg-gray-100"
            onClick={() => handleCardClick(req.user_id)}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarFallback>{req.user_id?.name?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                {req.product_or_service}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p><strong>Quantity:</strong> {req.quantity} {req.unit_of_measurement}</p>
              <p><strong>Posted By:</strong> {req.user_id?.name || 'Unknown'}</p>
              <p><strong>Phone:</strong> {req.phone_number}</p>
              <p><strong>Preference:</strong> {req.supplier_preference}</p>
              {/* <p><strong>States:</strong> {req.selected_states.join(', ') || '-'}</p>
              <p><strong>Address:</strong> {req.user_id?.address ? `${req.user_id.address.street}, ${req.user_id.address.city}` : '-'}</p>
              <p><strong>Role:</strong> {req.user_id?.role?.name || '-'}</p> */}
              <p><strong>Date:</strong> {dayjs(req.createdAt).format('DD MMM YYYY, hh:mm A')}</p>
            </CardContent>
          </Card>
        ))}
        {isFetching && <div className="text-center py-2">Loading...</div>}
        {hasMore && !isFetching && (
          <div className="text-center py-4">
            <Button onClick={handleLoadMore}>Load More</Button>
          </div>
        )}
        {!hasMore && requirements.length > 0 && (
          <div className="text-center py-2">No more requirements to load</div>
        )}
      </div>
    </div>
  );
};

export default SEARequirement;