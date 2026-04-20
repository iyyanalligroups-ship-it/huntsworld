import React, { useEffect } from "react";
import { useTestimonialForm } from "../hooks/UseTestimonialForm";
import { useSubmitTestimonialMutation ,useUpdateTestimonialMutation} from "@/redux/api/Testimonialapi";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils"
import { toast } from "react-toastify";

const TestimonialForm = ({ isEditing ,onSuccess  }) => {
    const { form, updateField, getFormData, resetFormData } = useTestimonialForm();
    const [submitTestimonial, { isLoading }] = useSubmitTestimonialMutation();
    const [updateTestimonial, { isUpdating }] = useUpdateTestimonialMutation();

    console.log(isEditing, "form");

    useEffect(() => {
        if (isEditing) {
            updateField('feedbackType', isEditing.feedbackType);
            updateField('comments', isEditing.comments);
            updateField('rating', isEditing.rating);
        } else {
            resetFormData();

        }
    }, [isEditing]);

    const handleSubmit = async () => {
        try {
            const data = getFormData();
            console.log(data, "form");

            let response;
            if (isEditing) {

                response = await updateTestimonial({id:isEditing._id,data}).unwrap();
                toast.success(response.message || "Testimonial Updated Successfully");
            } else {

                response = await submitTestimonial(data).unwrap();
                toast.success(response.message || "Testimonial Submitted Successfully");
            }

            resetFormData();
            onSuccess?.(); 
        } catch (error) {
            resetFormData();
            toast.error(error.message || "Failed to submit/update testimonial");
            console.error(error);
        }
    };


    return (
        <div className="max-w-xl mx-auto p-6 bg-white rounded-xl shadow space-y-6">
              <h2 className="text-xl font-bold mb-4 border-b-2">Add Feedback</h2>
            <div>
                <Label className="mb-2">Feedback Type</Label>
                <Select
                    value={form.feedbackType} 
                    onValueChange={(v) => updateField("feedbackType", v)}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="suggestions">Suggestions</SelectItem>
                        <SelectItem value="applications">Applications</SelectItem>
                        <SelectItem value="bug_error_report">Bug / Error Report</SelectItem>
                        <SelectItem value="purchase_requirement">Purchase Requirement</SelectItem>
                        <SelectItem value="complaint">Complaint</SelectItem>
                        <SelectItem value="intrested_in_services">Interested in Services</SelectItem>
                        <SelectItem value="others">Others</SelectItem>
                    </SelectContent>
                </Select>

            </div>

            <div>
                <Label className="mb-2">Comments</Label>
                <Textarea
                    placeholder="Write your feedback..."
                    value={form.comments}
                    onChange={(e) => updateField("comments", e.target.value)}
                    className="min-h-[100px]"
                />
            </div>

            <StarRating rating={form.rating} onRate={(value) => updateField("rating", value)} />


            <Button onClick={handleSubmit} disabled={isLoading || isUpdating}>
                {isEditing ? (isUpdating ? "Updating..." : "Update") : (isLoading ? "Submitting..." : "Submit")}
            </Button>
        </div>
    );
};

export default TestimonialForm;




const getRatingColor = (rating) => {
    if (rating >= 4.5) return "bg-green-500 text-white";
    if (rating >= 3) return "bg-yellow-500 text-white";
    if (rating > 0) return "bg-red-500 text-white";
    return "bg-gray-200 text-gray-700";
};

export function StarRating({ rating, onRate }) {
    return (
        <div className="space-y-2">
            <Label className="mb-2">Rating</Label>

            <div className="flex items-center space-x-2">
            
                <div className="flex relative group">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <div key={star} className="relative">
                       
                            <div
                                className="absolute left-0 top-0 w-1/2 h-full z-10 cursor-pointer"
                                onClick={() => onRate(star - 0.5)}
                            />
                     
                            <div
                                className="absolute right-0 top-0 w-1/2 h-full z-10 cursor-pointer"
                                onClick={() => onRate(star)}
                            />
                           
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
}
