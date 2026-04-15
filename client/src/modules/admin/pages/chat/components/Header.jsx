// Header.jsx
import { useSelectedUser } from "@/modules/admin/context/SelectedUserContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { useGetLastMessageBetweenUsersQuery } from "@/redux/api/MessageApi";
import { useContext, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import showToast from "@/toast/showToast";
import EntityProfile from "./helper/EntityProfile";
import {useGetUserByIdForChatQuery} from "@/redux/api/Authapi"
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
import { cn } from "@/lib/utils"
import { useSocket } from "@/modules/admin/context/SocketContext";
import { Ban, Menu, MoreVertical, HelpCircle, Flag, ArrowLeft } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Header({ onMenuClick }) {
  const { selectedUser, setSelectedUser } = useSelectedUser();
  const { user } = useContext(AuthContext);
  const { onlineUsers, lastSeenMap } = useSocket();
  const navigate = useNavigate();

  // Consolidated logged-in user ID with fallbacks for flat/nested structures and id/_id naming
  const loggedInUserId = user?.user?._id || user?.user?.id || user?._id || user?.id;

  // === NEW: Custom menu & modal states ===
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [reportDescription, setReportDescription] = useState("");
  const [helpDescription, setHelpDescription] = useState("");
  const [files, setFiles] = useState([]);
  const menuRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  const userIdToFetch = selectedUser?.user_id?._id || selectedUser?.user_id || selectedUser?._id;

  const { data: fetchedUserData, isLoading: isUserLoading, isError: isUserError } = useGetUserByIdForChatQuery(
    userIdToFetch,
    { skip: !userIdToFetch }
  );

  const userInfo = fetchedUserData?.user || selectedUser;
  const addressInfo = fetchedUserData?.address || selectedUser?.address;
  const profileInfo = fetchedUserData?.profile;
  const entityType = fetchedUserData?.entityType || (selectedUser?.user_id ? "Merchant/ServiceProvider" : "User");

  const { isLoading: isMsgLoading } = useGetLastMessageBetweenUsersQuery(
    {
      userId: loggedInUserId,
      contactId: userIdToFetch,
    },
    { skip: !loggedInUserId || !userIdToFetch }
  );


  const handleBack = () => {
    setSelectedUser(null);
    navigate(-1);
  };

  // === NEW: File & Submit Handlers ===
  const handleFileChange = (e) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleReportSubmit = async () => {
    if (!reportDescription.trim() || reportDescription.trim().length < 10) {
      showToast("Please provide a description of at least 10 characters", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      let attachmentUrls = [];

      if (files.length > 0) {
        const formData = new FormData();
        files.forEach((file) => formData.append("attachments", file));
        formData.append("entity_type", "reports");
        formData.append("user_id", loggedInUserId);
        formData.append("reported_by", loggedInUserId);
        formData.append("reported_user_id", userIdToFetch);

        const uploadRes = await axios.post(
          `${import.meta.env.VITE_API_IMAGE_URL}/report-file/upload`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );

        if (!uploadRes.data.success) {
          throw new Error(uploadRes.data.message);
        }

        attachmentUrls = uploadRes.data.files.map((f) =>
          typeof f === "string" ? f : f.fileUrl
        );
      }

      await axios.post(
        `${import.meta.env.VITE_API_URL}/report-file/report-user`,
        {
          reported_by: loggedInUserId,
          reported_user_id: userIdToFetch,
          sender_user_id: loggedInUserId,
          receiver_user_id: userIdToFetch,
          description: reportDescription,
          attachments: attachmentUrls,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token") || ""}`,
          },
        }
      );

      showToast("Report submitted successfully", "success");
      setReportDescription("");
      setFiles([]);
      setIsReportOpen(false);
    } catch (error) {
      const msg = error.response?.data?.message || error.message || "Failed to submit report";
      showToast(msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHelpSubmit = async () => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/help/create`, {
        user_id: loggedInUserId,
        description: helpDescription,
      });
      setHelpDescription("");
      setIsHelpOpen(false);
      showToast(res?.data?.message, 'success');
    } catch (err) {
      const message = err.response?.data?.message || "Something went wrong";
      showToast(message, 'error');
    }
  };

  if (!selectedUser) {
    return (
      <div className="h-16 bg-white border-b px-6 flex items-center shrink-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 mr-2 rounded-md hover:bg-slate-100 text-slate-600 transition-colors"
          aria-label="Open conversation list"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">No user selected</p>
        </div>
      </div>
    );
  }

  if (!userIdToFetch) {
    console.error("No valid user ID found for fetching:", selectedUser);
    return (
      <div className="h-16 bg-white border-b px-6 flex items-center shrink-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 mr-2 rounded-md hover:bg-slate-100 text-slate-600 transition-colors"
          aria-label="Open conversation list"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-red-500">Invalid user ID</p>
        </div>
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
      <div className="h-16 bg-white border-b px-6 flex items-center shrink-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 mr-2 rounded-md hover:bg-slate-100 text-slate-600 transition-colors"
          aria-label="Open conversation list"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Loading user data...</p>
        </div>
      </div>
    );
  }

  if (isUserError) {
    return (
      <div className="h-16 bg-white border-b px-6 flex items-center shrink-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 mr-2 rounded-md hover:bg-slate-100 text-slate-600 transition-colors"
          aria-label="Open conversation list"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-red-500">Error loading user data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-20 bg-white border-b border-slate-100 px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 mr-2 rounded-md hover:bg-slate-100 text-slate-600 transition-colors"
          aria-label="Open conversation list"
        >
          <Menu className="h-6 w-6" />
        </button>

        {isMsgLoading ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 animate-pulse"></div>
            <div className="space-y-2">
              <div className="w-32 h-4 bg-slate-100 animate-pulse rounded"></div>
              <div className="w-24 h-3 bg-slate-100 animate-pulse rounded"></div>
            </div>
          </div>
        ) : (
          <Sheet>
            <SheetTrigger asChild>
              <div className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <Avatar className="h-10 w-10 border border-slate-200">
                    <AvatarImage src={profilePic} alt={userName} />
                    <AvatarFallback className="bg-slate-900 text-[#f6d32f] font-bold">
                      {userName?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  {isOnline && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm"></span>
                  )}
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-base leading-tight group-hover:text-indigo-600 transition-colors">
                    {userName}
                  </div>
                  <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                    {isOnline ? (
                      <span className="text-green-600 font-bold">Online Now</span>
                    ) : (
                      formatLastSeen(lastSeen)
                    )}
                  </p>
                </div>
              </div>
            </SheetTrigger>

            <SheetContent side="right" className="w-[420px] p-0 border-l border-slate-200">
              <div className="h-full flex flex-col">
                <div className="p-8 bg-slate-50 border-b border-slate-100 flex flex-col items-center">
                  <Avatar className="w-24 h-24 mb-4 ring-4 ring-white shadow-xl">
                    <AvatarImage src={profilePic} alt={userName} />
                    <AvatarFallback className="text-3xl bg-slate-900 text-white font-black">
                      {userName?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-2xl font-black text-slate-900 mb-1">{userName}</h2>
                  <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-none px-3 py-0.5 text-xs font-bold uppercase tracking-widest">
                    {entityType}
                  </Badge>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  <section>
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Account Details</h3>
                    <div className="space-y-4">
                      {profileInfo && (
                        <EntityProfile
                          profile={profileInfo}
                          entityType={entityType}
                        />
                      )}
                      
                      <div className="grid grid-cols-1 gap-3">
                        <div className="flex justify-between items-center text-sm p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-slate-500 font-medium">Email Address</span>
                          <span className="text-slate-900 font-bold hover:text-indigo-600 transition-colors">{userInfo?.email || "N/A"}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-slate-500 font-medium">Referral Code</span>
                          <Badge variant="outline" className="font-mono text-[11px] font-bold border-slate-200 bg-white">{userInfo?.referral_code || "N/A"}</Badge>
                        </div>
                        <div className="flex justify-between items-center text-sm p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-slate-500 font-medium">Platform Role</span>
                          <span className="text-slate-900 font-bold capitalize">{userInfo?.role?.role || userInfo?.role || "N/A"}</span>
                        </div>
                      </div>
                    </div>
                  </section>

                  <Separator className="bg-slate-100" />

                  <section>
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Verification Status</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className={cn(
                        "p-3 rounded-xl border flex flex-col gap-1 items-center justify-center text-center",
                        userInfo?.number_verified ? "bg-green-50 border-green-100 text-green-700" : "bg-slate-50 border-slate-100 text-slate-400"
                      )}>
                        <span className="text-[10px] uppercase font-black tracking-widest">Phone</span>
                        <span className="text-xs font-bold">{userInfo?.number_verified ? "Verified" : "Pending"}</span>
                      </div>
                      <div className={cn(
                        "p-3 rounded-xl border flex flex-col gap-1 items-center justify-center text-center",
                        userInfo?.email_verified ? "bg-green-50 border-green-100 text-green-700" : "bg-slate-50 border-slate-100 text-slate-400"
                      )}>
                        <span className="text-[10px] uppercase font-black tracking-widest">Email</span>
                        <span className="text-xs font-bold">{userInfo?.email_verified ? "Verified" : "Pending"}</span>
                      </div>
                    </div>
                  </section>

                  <Separator className="bg-slate-100" />

                  <section>
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Location</h3>
                    {addressInfo && Object.keys(addressInfo || {}).length > 0 ? (
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-slate-600 leading-relaxed text-sm font-medium">
                        {addressInfo?.address_line_1 && <>{addressInfo.address_line_1}<br /></>}
                        {addressInfo?.address_line_2 && <>{addressInfo.address_line_2}<br /></>}
                        {addressInfo?.city && <>{addressInfo.city}, </>}
                        {addressInfo?.state && <>{addressInfo.state}<br /></>}
                        {addressInfo?.country && <>{addressInfo.country} </>}
                        {addressInfo?.pincode && <>- {addressInfo.pincode}</>}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-4 bg-slate-50 rounded-xl border border-slate-100 text-slate-400 italic text-sm">
                        <Ban size={16} /> No address information found
                      </div>
                    )}
                  </section>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100">
                  <p className="text-[10px] text-slate-400 text-center font-bold uppercase tracking-widest">
                    Member since {userInfo?.created_at ? new Date(userInfo.created_at).toLocaleDateString() : "N/A"}
                  </p>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Button
          onClick={handleBack}
          variant="ghost"
          className="flex items-center cursor-pointer gap-2 text-slate-600 hover:bg-slate-100 border border-slate-100 px-3 py-1.5 rounded-lg transition-all"
          aria-label="Go back"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">Back</span>
        </Button>

        {/* === NEW: Custom MoreVertical Menu === */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-all border border-transparent hover:border-slate-200 active:scale-95"
            aria-label="More options"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-12 w-60 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden py-1.5 animate-in fade-in zoom-in duration-200 origin-top-right">
              <div className="px-4 py-2 border-b border-slate-50 mb-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Conversation Options</span>
              </div>
              <button
                onClick={() => {
                  setIsHelpOpen(true);
                  setIsMenuOpen(false);
                }}
                className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50 text-slate-700 text-sm font-bold transition-colors text-left"
              >
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <span>Get Help</span>
              </button>
              <button
                onClick={() => {
                  setIsReportOpen(true);
                  setIsMenuOpen(false);
                }}
                className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-red-50 text-red-600 text-sm font-bold transition-colors text-left"
              >
                <div className="p-1.5 bg-red-100 text-red-600 rounded-lg">
                  <Flag className="w-4 h-4" />
                </div>
                <span>Report User</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-900">Report User</DialogTitle>
            <DialogDescription className="text-slate-500 font-medium">
              We take safety seriously. Please describe the issue and attach evidence if possible.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label className="text-[11px] font-black uppercase tracking-wider text-slate-400">Description <span className="text-red-500">*</span></Label>
              <Textarea
                placeholder="What seems to be the problem?"
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                className="min-h-[120px] rounded-2xl border-slate-200 focus:ring-indigo-500 resize-none font-medium"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-[11px] font-black uppercase tracking-wider text-slate-400">Attachments ({files.length}/5)</Label>
              <Input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileChange}
                disabled={isSubmitting || files.length >= 5}
                className="rounded-xl border-slate-200 file:bg-slate-100 file:border-0 file:rounded-lg file:text-xs file:font-bold file:px-3 file:py-1 cursor-pointer"
              />

              {files.length > 0 && (
                <div className="grid grid-cols-3 gap-2 p-2 bg-slate-50 rounded-2xl border border-slate-100">
                  {files.map((file, index) => (
                    <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border border-white shadow-sm">
                      {file.type.startsWith("video/") ? (
                        <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                          <MoreVertical size={20} className="text-white opacity-50" />
                        </div>
                      ) : (
                        <img
                          src={URL.createObjectURL(file)}
                          alt="preview"
                          className="w-full h-full object-cover"
                        />
                      )}
                      <button
                        onClick={() => removeFile(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg hover:bg-red-600 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => {
                setIsReportOpen(false);
                setFiles([]);
                setReportDescription("");
              }}
              className="rounded-xl font-bold text-slate-500"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReportSubmit}
              disabled={isSubmitting || !reportDescription.trim()}
              className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold px-6"
            >
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-slate-900">Need Assistance?</DialogTitle>
            <DialogDescription className="text-slate-500 font-medium">
              Explain your issue and our team will get back to you shortly.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2 block">Issue Details</Label>
            <Textarea
              placeholder="How can we help you today?"
              value={helpDescription}
              onChange={(e) => setHelpDescription(e.target.value)}
              className="min-h-[150px] rounded-2xl border-slate-200 focus:ring-indigo-500 font-medium"
            />
          </div>
          <DialogFooter>
            <Button
              className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-6 text-lg"
              onClick={handleHelpSubmit}
            >
              Submit & Open Multi-chat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
