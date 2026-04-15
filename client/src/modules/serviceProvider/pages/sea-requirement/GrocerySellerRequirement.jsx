import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "@/modules/admin/context/SocketContext";
import { useSelectedUser } from "@/modules/admin/context/SelectedUserContext";
import { useGetGrocerySellerRequirementsByLocationQuery } from "@/redux/api/GrocerySellerRequirementApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import dayjs from "dayjs";
import { useSidebar } from "@/modules/admin/hooks/useSidebar";
import { AuthContext } from "@/modules/landing/context/AuthContext";

const GrocerySellerRequirement = () => {
  const { socketRef } = useSocket();
  const socket = socketRef?.current?.requirementSocket; // ✅ Correct namespace
  const { setSelectedUser } = useSelectedUser();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { isSidebarOpen } = useSidebar();

  const [requirements, setRequirements] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const limit = 10;

  // ✅ Correct way to call RTK Query with query object
  const {
    data,
    isFetching,
    isSuccess,
    isError,
    error,
  } = useGetGrocerySellerRequirementsByLocationQuery(
    { user_id: user?.user?._id, page, limit },
    { skip: !user?.user?._id } // only skip if user not ready
  );

  // ✅ Real-time updates from socket
  useEffect(() => {
    if (!socket) return;

    socket.emit("join-requirements");

    const handleReceiveRequirement = (requirement) => {
      setRequirements((prev) => {
        if (!prev.some((req) => req._id === requirement._id)) {
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

  // ✅ Handle API data updates
  useEffect(() => {
    if (isSuccess && data?.data?.length) {
      setRequirements((prev) => {
        const existingIds = new Set(prev.map((req) => req._id));
        const newReqs = data.data.filter((req) => !existingIds.has(req._id));
        return [...prev, ...newReqs].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
      });
      setHasMore(data.pagination?.hasNext || false);
    }
  }, [data, isSuccess]);

  // ✅ Handle load more pagination
  const handleLoadMore = () => {
    if (hasMore && !isFetching) {
      setPage((prev) => prev + 1);
    }
  };

  // ✅ Navigate to chat on card click
  const handleCardClick = (user) => {
    setSelectedUser(user);
    navigate("/merchant/merchant-chat");
  };

  return (
    <div
      className={`h-screen flex flex-col transition-all duration-300 ${
        isSidebarOpen ? "p-6 lg:ml-56" : "p-4 lg:ml-16"
      }`}
    >
      <h1 className="text-md border-1 border-[#0c1f4d] text-[#0c1f4d] bg-gray-100 p-2 rounded-r-2xl w-54 font-bold">Grocery Seller Requirements</h1>

      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {/* 🔄 Render list */}
        {requirements.map((req) => (
          <Card
            key={req._id}
            className="cursor-pointer hover:bg-gray-100 transition-all"
            onClick={() => handleCardClick(req.user_id)}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarFallback>
                    {req.user_id?.name?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="font-semibold">{req.product_or_service}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p>
                <strong>Quantity:</strong> {req.quantity} {req.unit_of_measurement}
              </p>
              <p>
                <strong>Posted By:</strong> {req.user_id?.name || "Unknown"}
              </p>
              <p>
                <strong>Phone:</strong> {req.phone_number || "-"}
              </p>
              <p>
                <strong>Preference:</strong> {req.supplier_preference}
              </p>
              {/* <p>
                <strong>States:</strong>{" "}
                {req.selected_states?.length ? req.selected_states.join(", ") : "-"}
              </p>
              <p>
                <strong>Address:</strong>{" "}
                {req.user_id?.address
                  ? `${req.user_id.address.street || ""}, ${req.user_id.address.city || ""}, ${req.user_id.address.state || ""}`
                  : "-"}
              </p> */}
              {/* <p>
                <strong>Role:</strong> {req.user_id?.role?.role || "-"}
              </p> */}
              <p>
                <strong>Date:</strong>{" "}
                {dayjs(req.createdAt).format("DD MMM YYYY, hh:mm A")}
              </p>
            </CardContent>
          </Card>
        ))}

        {/* 🔁 Loading, pagination & end message */}
        {isFetching && <div className="text-center py-2">Loading...</div>}

        {hasMore && !isFetching && (
          <div className="text-center py-4">
            <Button onClick={handleLoadMore}>Load More</Button>
          </div>
        )}

        {!hasMore && !isFetching && requirements.length > 0 && (
          <div className="text-center py-2 text-gray-500">
            No more requirements to load
          </div>
        )}

        {isError && (
          <div className="text-center py-2 text-red-500">
            Failed to load requirements: {error?.message || "Unknown error"}
          </div>
        )}
      </div>
    </div>
  );
};

export default GrocerySellerRequirement;
