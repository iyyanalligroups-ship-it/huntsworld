import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGetReviewsByProductQuery } from "@/redux/api/ReviewApi";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Star, MessageSquare, ArrowLeft } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import ReviewForm from "./ReviewForm";

const ReviewProduct = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user, token, isLoading } = useContext(AuthContext);
  const {
    data: reviews,
    isLoading: reviewsLoading,
    error,
    refetch,
  } = useGetReviewsByProductQuery(productId);
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    // Safely access user._id, accounting for possible nested structure
    const userId = user?.user?._id || user?._id;
    console.log("ReviewProduct rendered", {
      productId,
      user,
      userId,
      token,
      reviews,
      showReviewForm,
      isLoading,
    });
    if (!isLoading && !user && token) {
      console.log("User is null but token exists, redirecting to login");
      navigate("/login");
    }
  }, [productId, user, token, reviews, showReviewForm, isLoading, navigate]);

  if (isLoading || reviewsLoading)
    return <div className="p-4 text-center">Loading...</div>;
  if (error)
    return (
      <div className="p-4 text-red-500 text-center">
        Error loading reviews: {error.message}
      </div>
    );

  const handleWriteReview = () => {
    // Safely access user._id
    const userId = user?.user?._id || user?._id;
    console.log("Write Review button clicked", {
      user,
      userId,
      token,
      isLoading,
    });
    if (isLoading) {
      console.log("Auth still loading, waiting...");
      toast({
        title: "Please Wait",
        description:
          "Authentication is still loading. Please try again in a moment.",
        variant: "warning",
      });
      return;
    }
    if (!user || !userId) {
      console.log("Redirecting to login due to missing user or userId", {
        user,
        token,
      });
      toast({
        title: "Authentication Required",
        description: "Please log in to write a review.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }
    setShowReviewForm(true);
  };

  return (
    <div className="mx-auto relative max-w-6xl p-4">
      <Button
        type="button"
        onClick={() => navigate(-1)}
        variant="outline"
        className="absolute cursor-pointer top-6 left-9 z-40 flex gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Button>
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between  p-4">
          <CardTitle className="text-xl font-bold">Product Reviews</CardTitle>
          <Button
            onClick={handleWriteReview}
            variant="default"
            className="flex items-center gap-2 bg-[#0c1f4d] hover:bg-[#0c1f4d] text-white font-medium py-2 px-4 rounded-md"
          >
            <MessageSquare size={16} />
            Write a Review
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          {showReviewForm && (user?.user?._id || user?._id) && (
            <ReviewForm
              productId={productId}
              userId={user?.user?._id || user?._id}
              onClose={() => setShowReviewForm(false)}
              onReviewSubmitted={refetch}
              initialRating={0}
            />
          )}
          {reviews && reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review._id} className="border-b pb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage
                        src={
                          review.userId?.profile_pic ||
                          "/default-profile-pic.png"
                        } // Fallback image
                        alt={review.userId?.name || "User"}
                      />
                      <AvatarFallback>
                        {review.userId?.name
                          ?.split(" ")
                          .map((word) => word[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">
                        {review.userId?.name || "Anonymous"}
                      </p>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, index) => (
                          <Star
                            key={index}
                            size={16}
                            className={
                              index + 1 <= review.rating
                                ? "text-yellow-500 fill-yellow-500"
                                : "text-gray-300"
                            }
                          />
                        ))}
                        <span className="ml-2 text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 text-gray-700">{review.comments}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              It's empty here... Be the first to leave a review!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReviewProduct;
