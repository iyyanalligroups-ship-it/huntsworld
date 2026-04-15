import { useSelectedUser } from "@/modules/admin/context/SelectedUserContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { useGetLastMessageBetweenUsersQuery } from "@/redux/api/MessageApi";
import { useContext } from "react";
import { motion } from "framer-motion";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useSocket } from "@/modules/admin/context/SocketContext";
import { Ban } from "lucide-react";

export default function Header() {
  const { selectedUser } = useSelectedUser();
  const { user } = useContext(AuthContext);
  const { onlineUsers, lastSeenMap } = useSocket();

  // Move hook to top level
  const { data: lastMsgData, isLoading, isError, error } = useGetLastMessageBetweenUsersQuery(
    {
      userId: user?.user?._id,
      contactId: selectedUser?._id,
    },
    {
      skip: !user?.user?._id || !selectedUser?._id,
    }
  );

  // Determine if the error is a "not found" error
  const isNotFoundError =
    isError &&
    error?.data?.success === false &&
    error?.data?.message?.toLowerCase().includes("not found");

  if (!selectedUser) {
    return (
      <div className="h-16 bg-white border-b p-8 flex items-center justify-center">
        <p className="text-gray-500">No user selected</p>
      </div>
    );
  }
  console.log('user compoent chat');
  
  const isOnline = onlineUsers.includes(selectedUser?._id?.toString());
  const lastSeen = lastSeenMap[selectedUser?._id];
  const userName = selectedUser?.name || "";
  const profilePic = selectedUser?.profile_pic;

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

  return (
    <div className="h-16 bg-white border-b p-8 flex items-center gap-3">
      {isLoading ? (
        <p className="text-gray-500">Loading...</p>
      ) : isNotFoundError ? (
        <Card className="max-w-md w-full text-center shadow-md border">
          <CardContent className="flex flex-col items-center justify-center space-y-4 py-4">
            <Ban className="w-12 h-12 text-red-500" />
            <h2 className="text-xl font-semibold text-gray-800">Messages Not Found</h2>
            <p className="text-gray-500 text-sm">
              No messages found between you and {userName}.
            </p>
          </CardContent>
        </Card>
      ) : isError ? (
        <Card className="max-w-md w-full text-center shadow-md border">
          <CardContent className="flex flex-col items-center justify-center space-y-4 py-4">
            <Ban className="w-12 h-12 text-red-500" />
            <h2 className="text-xl font-semibold text-gray-800">Error Loading Messages</h2>
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
              {userName?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <Sheet>
            <SheetTrigger asChild>
              <div className="cursor-pointer">
                <div className="font-semibold text-lg">{selectedUser.name}</div>
                <div className="flex items-center space-x-2">
                  {isOnline && <span className="w-2 h-2 bg-green-500 rounded-full"></span>}
                </div>
                <p className="text-sm text-gray-500">
                  {isOnline ? "Online" : formatLastSeen(lastSeenMap[selectedUser?._id])}
                </p>
              </div>
            </SheetTrigger>

            <SheetContent side="right" className="w-96">
              <SheetHeader>
                <SheetTitle>User Information</SheetTitle>
                <SheetDescription>All available user details hdffid98uf8frijr</SheetDescription>
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
                      {userName.charAt(0)}
                    </AvatarFallback>
                  )}
                </Avatar>

                <Card className="w-full">
                  <CardHeader>
                    <CardTitle className="text-center">{selectedUser?.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">Referral Code:</span>
                        <Badge variant="outline">{selectedUser?.referral_code}</Badge>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="font-medium">Email:</span>
                        <span>{selectedUser?.email}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="font-medium">Phone:</span>
                        <span>{selectedUser?.phone}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="font-medium">Role:</span>
                        <span>{selectedUser?.role?.role}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="font-medium">Number Verified:</span>
                        <Badge variant={selectedUser?.number_verified ? "default" : "destructive"}>
                          {selectedUser?.number_verified ? "Yes" : "No"}
                        </Badge>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="font-medium">Email Verified:</span>
                        <Badge variant={selectedUser?.email_verified ? "default" : "destructive"}>
                          {selectedUser?.email_verified ? "Yes" : "No"}
                        </Badge>
                      </div>
                      <Separator />
                      <div>
                        <span className="font-medium">Created At:</span>
                        <div className="text-xs text-gray-500">
                          {new Date(selectedUser?.created_at).toLocaleString()}
                        </div>
                      </div>
                      <Separator />
                      <div>
                        <span className="font-medium">Updated At:</span>
                        <div className="text-xs text-gray-500">
                          {new Date(selectedUser?.updated_at).toLocaleString()}
                        </div>
                      </div>
                      <Separator />
                      <div className="mt-2">
                        <span className="font-medium">Address:</span>
                        <div className="text-xs">
                          {selectedUser?.address?.address_line_1}, {selectedUser?.address?.address_line_2},<br />
                          {selectedUser?.address?.city}, {selectedUser?.address.state}, {selectedUser?.address?.country} - {selectedUser?.address?.pincode}
                        </div>
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