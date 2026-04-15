import { useState, useContext } from "react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import axios from "axios";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";
import showToast from '@/toast/showToast'; // Import custom showToast

const categories = ["suggestions", "applications", "bug_error_report", "purchase_requirement", "complaint", "intrested_in_services", "others"];

const getRatingColor = (rating) => {
    if (rating >= 4.5) return "bg-green-500 text-white";
    if (rating >= 3) return "bg-yellow-500 text-white";
    if (rating > 0) return "bg-red-500 text-white";
    return "bg-gray-200 text-gray-700";
};

const StarRating = ({ rating, onRate }) => {
    return (
        <div className="space-y-2">
            <Label className="mb-2">Rating</Label>

            <div className="flex items-center space-x-2">
                {/* Star Rating UI */}
                <div className="flex relative group">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <div key={star} className="relative">
                            {/* Left half (0.5) */}
                            <div
                                className="absolute left-0 top-0 w-1/2 h-full z-10 cursor-pointer"
                                onClick={() => onRate(star - 0.5)}
                            />
                            {/* Right half (1.0) */}
                            <div
                                className="absolute right-0 top-0 w-1/2 h-full z-10 cursor-pointer"
                                onClick={() => onRate(star)}
                            />
                            {/* Star display */}
                            <Star
                                size={24}
                                className={`${rating >= star
                                    ? "text-yellow-500"
                                    : rating >= star - 0.5
                                        ? "text-yellow-300"
                                        : "text-gray-300"
                                    }`}
                                fill={
                                    rating >= star
                                        ? "#facc15"
                                        : rating >= star - 0.5
                                            ? "#fde68a"
                                            : "none"
                                }
                            />
                        </div>
                    ))}
                </div>

                {/* Note-style Badge */}
                <div
                    className={cn(
                        "rounded-full px-3 py-1 text-xs font-medium shadow transition",
                        getRatingColor(rating)
                    )}
                >
                    {rating.toFixed(1)} / 5
                </div>
            </div>
        </div>
    );
};

const FeedBack = () => {
    const { user, token } = useContext(AuthContext);
    const [formData, setFormData] = useState({
        feedbackType: "",
        comments: "",
        rating: 0,
    });
    const [errors, setErrors] = useState({});

    const validateForm = () => {
        let newErrors = {};
        if (!formData.feedbackType) newErrors.feedbackType = "Category is required";
        if (!formData.comments || formData.comments.length < 50) newErrors.comments = "Comments must be at least 50 characters";
        if (!formData.rating) newErrors.rating = "Rating is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            showToast("Please log in to submit feedback", "info");
            return;
        }
        if (validateForm()) {
            try {
                const response = await axios.post(
                    `${import.meta.env.VITE_API_URL}/testimonials/create-testimonial`,
                    {
                        feedbackType: formData.feedbackType,
                        comments: formData.comments,
                        rating: formData.rating,
                        user_id: user.user?._id,
                    },
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                console.log("Form submitted:", response.data);
                showToast("Feedback submitted successfully!", "success");
                setFormData({ feedbackType: "", comments: "", rating: 0 });
            } catch (error) {
                console.error("Submission failed:", error);
                showToast("Failed to submit feedback. Please try again.", "error");
            }
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleStarClick = (rating) => {
        setFormData({ ...formData, rating });
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-lg m-6"
        >
            <h2 className="text-2xl font-bold text-center mb-4">
                <span className="text-[#0c1f4d]">Huntsworld</span> Feedback Form
            </h2>
            <p className="text-center text-gray-600 mb-6">Your feedback helps us improve our platform.</p>
            {!user && (
                <p className="text-center text-red-500 mb-4">Please log in to submit your feedback.</p>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Category Dropdown */}
                <Select onValueChange={(value) => setFormData({ ...formData, feedbackType: value })}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                        {categories.map((cat, index) => (
                            <SelectItem key={index} value={cat}>{cat.replace(/_/g, " ").toLowerCase()}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors.feedbackType && <p className="text-red-500 text-sm">{errors.feedbackType}</p>}

                {/* Comments */}
                <Textarea
                    name="comments"
                    placeholder="Write your feedback..."
                    className="w-full"
                    onChange={handleInputChange}
                    value={formData.comments}
                />
                {errors.comments && <p className="text-red-500 text-sm">{errors.comments}</p>}

                {/* Rating Stars */}
                <StarRating rating={formData.rating} onRate={handleStarClick} />
                {errors.rating && <p className="text-red-500 text-sm text-center">{errors.rating}</p>}

                {/* Submit Button */}
                <Button
                    type="submit"
                    className="w-full bg-[#0c1f4d] hover:shadow-lg text-white py-2 rounded-md cursor-pointer"
                    disabled={!user}
                >
                    Submit
                </Button>
            </form>
        </motion.div>
    );
};

export default FeedBack;