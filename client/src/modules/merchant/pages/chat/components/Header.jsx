import { useSelectedUser } from "@/modules/admin/context/SelectedUserContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { useGetLastMessageBetweenUsersQuery } from "@/redux/api/MessageApi";
import { useGetUserByIdForChatQuery } from "@/redux/api/Authapi";
import { useContext ,useEffect} from "react";
import { motion } from "framer-motion";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useSocket } from "@/modules/admin/context/SocketContext";
import { Ban } from "lucide-react";
import { useLocation } from "react-router-dom";

export default function Header() {
  const { selectedUser, setSelectedUser } = useSelectedUser();
  const location = useLocation();

  useEffect(() => {
    if (
      !location.pathname.startsWith("/merchant/merchant-chat") &&
      selectedUser
    ) {
      setSelectedUser(null);
    }
  }, [location.pathname, selectedUser, setSelectedUser]);
  const { user } = useContext(AuthContext);
  const { onlineUsers, lastSeenMap } = useSocket();
  console.log("selectedUser:", JSON.stringify(selectedUser, null, 2));

  const userIdToFetch = selectedUser?.user_id?._id || selectedUser?._id;

  const {
    data: fetchedUserData,
    isLoading: isUserLoading,
    isError: isUserError,
  } = useGetUserByIdForChatQuery(userIdToFetch, { skip: !userIdToFetch });
  console.log("fetchedUserData:", JSON.stringify(fetchedUserData, null, 2));

  const userInfo = fetchedUserData?.user || selectedUser;
  const addressInfo = fetchedUserData?.address || selectedUser?.address;
  const entityType =
    fetchedUserData?.entityType ||
    (selectedUser?.user_id ? "Merchant/ServiceProvider" : "User");

  const {
    data: lastMsgData,
    isLoading: isMsgLoading,
    isError: isMsgError,
    error: msgError,
  } = useGetLastMessageBetweenUsersQuery(
    {
      userId: user?.user?._id,
      contactId: userIdToFetch,
    },
    { skip: !user?.user?._id || !userIdToFetch }
  );

  const isNotFoundError =
    isMsgError &&
    msgError?.data?.success === false &&
    msgError?.data?.message?.toLowerCase().includes("not found");

  if (!selectedUser) {
    return (
      <div className="h-16 bg-white border-b p-8 flex items-center justify-center">
        <p className="text-gray-500">No user selected</p>
      </div>
    );
  }

  if (!userIdToFetch) {
    console.error("No valid user ID found for fetching:", selectedUser);
    return (
      <div className="h-16 bg-white border-b p-8 flex items-center justify-center">
        <p className="text-red-500">Invalid user ID</p>
      </div>
    );
  }

  const isOnline = onlineUsers?.includes(userIdToFetch?.toString());
  const lastSeen = lastSeenMap?.[userIdToFetch];
  const userName = userInfo?.name || userInfo?.user_id?.name || "Unknown";
  const profilePic = userInfo?.profile_pic || userInfo?.user_id?.profile_pic;

  function formatLastSeen(dateString) {
    if (!dateString) return "last seen recently";

    const date = new Date(dateString);
    const now = new Date();

    const isToday = date.toDateString() === now.toDateString();

    const time = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    if (isNaN(date.getTime())) {
      return "last seen unknown time";
    }

    return isToday
      ? `last seen today at ${time}`
      : `last seen on ${date.toLocaleDateString()} at ${time}`;
  }

  if (isUserLoading) {
    return (
      <div className="h-16 bg-white border-b p-8 flex items-center justify-center">
        <p className="text-gray-500">Loading user data...</p>
      </div>
    );
  }

  if (isUserError) {
    return (
      <div className="h-16 bg-white border-b p-8 flex items-center justify-center">
        <p className="text-red-500">Error loading user data</p>
      </div>
    );
  }

  return (
    <div className="h-16 bg-white border-b p-8 flex items-center gap-3">
      {isMsgLoading ? (
        <p className="text-gray-500">Loading...</p>
      ) : isNotFoundError ? (
        <Card className="max-w-md w-full text-center shadow-md border">
          <CardContent className="flex flex-col items-center justify-center space-y-4 py-4">
            <Ban className="w-12 h-12 text-red-500" />
            <h2 className="text-xl font-semibold text-gray-800">
              Messages Not Found
            </h2>
            <p className="text-gray-500 text-sm">
              No messages found between you and {userName}.
            </p>
          </CardContent>
        </Card>
      ) : isMsgError ? (
        <Card className="max-w-md w-full text-center shadow-md border">
          <CardContent className="flex flex-col items-center justify-center space-y-4 py-4">
            <Ban className="w-12 h-12 text-red-500" />
            <h2 className="text-xl font-semibold text-gray-800">
              Error Loading Messages
            </h2>
            <p className="text-gray-500 text-sm">
              An error occurred while fetching messages. Please try again later.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Avatar className="text-[#f6d32f] bg-[#1C1B1F] relative">
            <AvatarImage src={profilePic} alt={userName} />
            <AvatarFallback className="bg-[#1C1B1F]">
              {userName?.charAt(0) || "?"}
            </AvatarFallback>
          </Avatar>
          <Sheet>
            <SheetTrigger asChild>
              <div className="cursor-pointer">
                <div className="font-semibold text-lg">{userName}</div>
                <div className="flex items-center space-x-2">
                  {isOnline && (
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  {isOnline ? "Online" : formatLastSeen(lastSeen)}
                </p>
              </div>
            </SheetTrigger>

            <SheetContent side="right" className="w-96">
              <SheetHeader>
                <SheetTitle>User Information ({entityType})</SheetTitle>
                <SheetDescription>All available user details</SheetDescription>
              </SheetHeader>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center mt-4"
              >
                <Avatar className="w-24 h-24 mb-4">
                  {profilePic ? (
                    <AvatarImage src={profilePic} alt={userName} />
                  ) : (
                    <AvatarFallback className="text-2xl">
                      {userName?.charAt(0) || "?"}
                    </AvatarFallback>
                  )}
                </Avatar>

                <Card className="w-full">
                  <CardHeader>
                    <CardTitle className="text-center">{userName}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">Referral Code:</span>
                        <Badge variant="outline">
                          {userInfo?.referral_code || "N/A"}
                        </Badge>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="font-medium">Email:</span>
                        <span>{userInfo?.email || "N/A"}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="font-medium">Role:</span>
                        <span>
                          {userInfo?.role?.role || userInfo?.role || "N/A"}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="font-medium">Number Verified:</span>
                        <Badge
                          variant={
                            userInfo?.number_verified
                              ? "default"
                              : "destructive"
                          }
                        >
                          {userInfo?.number_verified ? "Yes" : "No"}
                        </Badge>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="font-medium">Email Verified:</span>
                        <Badge
                          variant={
                            userInfo?.email_verified ? "default" : "destructive"
                          }
                        >
                          {userInfo?.email_verified ? "Yes" : "No"}
                        </Badge>
                      </div>
                      <Separator />
                      <div>
                        <span className="font-medium">Join Date:</span>
                        <div className="text-xs text-gray-500">
                          {userInfo?.created_at
                            ? new Date(userInfo.created_at).toLocaleString()
                            : "N/A"}
                        </div>
                      </div>
                      <Separator />
                      <div className="mt-2">
                        <span className="font-medium">Address:</span>
                        {addressInfo &&
                        Object.keys(addressInfo || {}).length > 0 ? (
                          <div className="text-xs mt-1 text-slate-700">
                            {addressInfo?.address_line_1 && (
                              <>
                                {addressInfo.address_line_1}
                                {addressInfo?.address_line_2 ? "," : ""}{" "}
                              </>
                            )}
                            {addressInfo?.address_line_2 && (
                              <>
                                {addressInfo.address_line_2}, <br />
                              </>
                            )}
                            {addressInfo?.city && <>{addressInfo.city}, </>}
                            {addressInfo?.state && <>{addressInfo.state}, </>}
                            {addressInfo?.country && (
                              <>{addressInfo.country} </>
                            )}
                            {addressInfo?.pincode && (
                              <>- {addressInfo.pincode}</>
                            )}
                          </div>
                        ) : (
                          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 text-red-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17.657 16.657L13.414 12.414m0 0L9.172 8.172m4.242 4.242L9.172 16.657M13.414 12.414l4.243-4.242"
                                />
                              </svg>
                              Address not found
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </SheetContent>
          </Sheet>
        </>
      )}
    </div>
  );
}
