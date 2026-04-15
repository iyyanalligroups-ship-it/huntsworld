// ReviewForm.jsx (unchanged from your provided version)
import React, { useEffect, useState } from "react";
import { useCreateReviewMutation } from "@/redux/api/ReviewApi";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import PropTypes from "prop-types";

const ReviewForm = ({ productId, userId, onClose, onReviewSubmitted, initialRating = 0 }) => {
  const [rating, setRating] = useState(initialRating);
  const [comments, setComments] = useState("");
  const [createReview, { isLoading: submitting, error: mutationError }] = useCreateReviewMutation();

  useEffect(() => {
    console.log("ReviewForm props:", { productId, userId, initialRating, submitting, mutationError });
  }, [productId, userId, initialRating, submitting, mutationError]);

  const handleStarClick = (star) => {
    console.log("Star clicked:", star);
    setRating(star);
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    console.log("handleSubmit called", { userId, productId, rating, comments });

    if (!userId || !productId) {
      console.log("Validation failed: Missing userId or productId", { userId, productId });
      toast({
        title: "Error",
        description: "User or product information is missing. Please log in and try again.",
        variant: "destructive",
      });
      return;
    }

    if (rating < 1 || rating > 5) {
      console.log("Validation failed: Invalid rating", { rating });
      toast({
        title: "Error",
        description: "Please select a rating between 1 and 5 stars.",
        variant: "destructive",
      });
      return;
    }

    if (!comments.trim()) {
      console.log("Validation failed: Missing comments");
      toast({
        title: "Error",
        description: "Please enter a comment for your review.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("Sending createReview request", { userId, productId, rating, comments });
      const response = await createReview({
        userId,
        productId,
        rating,
        comments,
      }).unwrap();
      console.log("Review submitted successfully:", response);
      toast({
        title: "Success",
        description: "Review submitted successfully!",
      });
      setRating(0);
      setComments("");
      onReviewSubmitted();
      onClose();
    } catch (error) {
      console.error("Submission error:", error);
      toast({
        title: "Error",
        description: `Error submitting review: ${
          error?.data?.message || error?.message || "Unknown error"
        }`,
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Write a Review</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="rating">Rating</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={24}
                  className={`cursor-pointer ${
                    star <= rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                  }`}
                  onClick={() => handleStarClick(star)}
                />
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="comments">Comments</Label>
            <Textarea
              id="comments"
              value={comments}
              onChange={(e) => {
                console.log("Textarea changed:", e.target.value);
                setComments(e.target.value);
              }}
              placeholder="Write your review here..."
              className="min-h-[100px]"
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={submitting}
              onClick={() => console.log("Submit button clicked", { submitting })}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                submitting
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-[#0c1f4d] hover:bg-[#0c1f4d] text-white"
              }`}
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                console.log("Cancel button clicked");
                onClose();
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

ReviewForm.propTypes = {
  productId: PropTypes.string.isRequired,
  userId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onReviewSubmitted: PropTypes.func.isRequired,
  initialRating: PropTypes.number,
};

export default ReviewForm;