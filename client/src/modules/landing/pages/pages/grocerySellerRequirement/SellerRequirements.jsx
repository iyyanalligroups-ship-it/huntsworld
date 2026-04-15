import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLazyGetSellerRequirementsByUserIdQuery } from "@/redux/api/GrocerySellerRequirementApi";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton"; // Import Shadcn UI Skeleton
import { MessageCircle, PhoneOutgoing } from "lucide-react";
import { useSelectedUser } from "@/modules/admin/context/SelectedUserContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useModal } from "./ModalContext";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import showToast from "@/toast/showToast";
import { useCheckUserSubscriptionQuery } from '@/redux/api/BannerPaymentApi';
import DescriptionComponent from "./DescriptionComponent";
const TruncatedText = ({ text = "", max = 30, className = "" }) => {
  // ⭐ Convert "-" and "_" to space
  const formattedText = text.replace(/[-_]/g, " ");

  // ⭐ Apply truncation after formatting
  const displayText =
    formattedText.length > max
      ? formattedText.slice(0, max) + "…"
      : formattedText;

  // ⭐ No truncation needed
  if (formattedText.length <= max) {
    return (
      <span
        className={`text-sm font-semibold text-gray-800 tracking-wide`}
      >
        {formattedText}
      </span>
    );
  }


  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`${className} cursor-default`}>
            {displayText}
          </span>
        </TooltipTrigger>

        <TooltipContent
          side="top"
          className="max-w-xs break-words bg-gray-900 text-white"
        >
          {formattedText}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const GrocerySellerRequirements = ({ userId }) => {

  const { closeModal } = useModal();
  const { setSelectedUser } = useSelectedUser();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const user_id = user?.user?._id;
  const [sellerData, setSellerData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const currentUser = user?.user?._id;
  const requirementsPerPage = 5;
  const [triggerGetRequirements, { isLoading, error }] =
    useLazyGetSellerRequirementsByUserIdQuery();

  const { data: subscriptionData } = useCheckUserSubscriptionQuery(user_id);
  useEffect(() => {
    triggerGetRequirements({
      userId,
      page: currentPage,
      limit: requirementsPerPage,
    }).then((res) => {
      if (res.data?.data) {
        console.log(res.data, "base member requirement list");

        setSellerData((prev) => ({
          user: res.data.data.user,
          requirements: prev
            ? [
              ...prev.requirements,
              ...res.data.data.requirements.filter(
                (newReq) =>
                  !prev.requirements.some((r) => r._id === newReq._id)
              ),
            ]
            : res.data.data.requirements,
        }));
        setTotalPages(res.data.pagination.totalPages);
        setHasMore(res.data.pagination.hasMore);
      }
    });
  }, [userId, currentPage, triggerGetRequirements]);

  const handleChat = (req) => {
    const user = {
      _id: userId,
    };
    console.log(currentUser, 'jfjf', userId);

    if (currentUser === userId) {
      showToast("You can't chat with yourself!", "info"); // or "warning"
      return; // Stop here - no navigation, no setSelectedUser
    }
    setSelectedUser(user);
    closeModal();
    setTimeout(() => {
      navigate("/chat");
    }, 350);
  };

  // Pagination logic
  const indexOfLastRequirement = currentPage * requirementsPerPage;
  const indexOfFirstRequirement = indexOfLastRequirement - requirementsPerPage;
  const currentRequirements =
    sellerData?.requirements.slice(
      indexOfFirstRequirement,
      indexOfLastRequirement
    ) || [];

  console.log(currentRequirements, 'current requirement');
  const sellerDetails = sellerData?.user;
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Loading state with Skeleton
  if (isLoading && !sellerData) {
    return (
      <div className="container mx-auto p-4">
        <Skeleton className="h-8 w-1/2 mb-4" /> {/* Skeleton for title */}
        <div className="grid gap-4">
          {[...Array(requirementsPerPage)].map((_, index) => (
            <div
              key={index}
              className="border rounded-lg p-4 shadow-md bg-white"
            >
              <Skeleton className="h-6 w-3/4 mb-2" />{" "}
              {/* Skeleton for product_or_service */}
              <Skeleton className="h-4 w-1/2 mb-2" />{" "}
              {/* Skeleton for quantity */}
              <Skeleton className="h-4 w-1/3 mb-2" /> {/* Skeleton for phone */}
              <Skeleton className="h-4 w-2/3 mb-2" />{" "}
              {/* Skeleton for supplier_preference */}
              <div className="flex gap-2 items-center mt-2">
                <Skeleton className="h-10 w-32" />{" "}
                {/* Skeleton for Call button */}
                <Skeleton className="h-10 w-24" />{" "}
                {/* Skeleton for Chat button */}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error or no data state
  if (error || !sellerData) {
    return (
      <div className="text-center p-4 text-red-500">
        {error
          ? "Failed to load requirements. Please try again."
          : "No active requirements found."}
      </div>
    );
  }

  // Main content
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl text-[#0c1f4d] font-bold mb-4">
        {sellerData.user.shop_name} - Active Requirements
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentRequirements.map((req) => (
          <Card key={req._id} className="rounded-xl shadow-lg bg-white">
            <CardHeader>
              {/* <h2 className="text-xl font-bold text-[#0c1f4d]">
                {req.product_name}
              </h2> */}

              <TruncatedText
                text={req.product_name}
                max={30}
                className="text-sm font-semibold inline-block"
              />
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">
                <span className="font-semibold">Member Type:</span>{" "}
                {sellerDetails.member_type}
              </p>
              <p className="text-sm flex items-center gap-2">
                <span className="font-semibold">Requirement Mode:</span>
                <Badge
                  className={
                    req.requirement_type.toLowerCase() === "buy"
                      ? "bg-blue-500 text-white"
                      : req.requirement_type.toLowerCase() === "sell"
                        ? "bg-green-500 text-white"
                        : ""
                  }
                >
                  {req.requirement_type}
                </Badge>
              </p>
              <p className="text-sm">
                <span className="font-semibold">Quantity:</span> {req.quantity}{" "}
                {req.unit_of_measurement}
              </p>
              {
                subscriptionData?.hasSubscription && (
                  <p className="text-sm">
                    <span className="font-semibold">Phone:</span> {req.phone_number}
                  </p>
                )
              }
              <p className="text-sm">
                <span className="font-semibold">Supplier Preference:</span>{" "}
                {req.supplier_preference}
              </p>
              <DescriptionComponent req={req} />

              {req.supplier_preference === "Specific States" &&
                req.selected_states.length > 0 && (
                  <p className="text-sm">
                    <span className="font-semibold">Selected States:</span>{" "}
                    {req.selected_states.join(", ")}
                  </p>
                )}
              <div className="flex flex-wrap gap-3 mt-3">
                <Button
                  variant="outline"
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <PhoneOutgoing size={16} />
                  <a
                    href={`tel:${req.phone_number}`}
                    className="text-[#0c1f4d]"
                  >
                    Call to Grocery Seller
                  </a>
                </Button>
                <Button
                  onClick={() => handleChat(req)}
                  variant="default"
                  className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-2"
                >
                  <MessageCircle size={16} />
                  Chat
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => paginate(i + 1)}
              className={`mx-1 px-3 py-1 rounded ${currentPage === i + 1
                ? "bg-[#0c1f4d] text-white"
                : "bg-gray-200"
                }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default GrocerySellerRequirements;
