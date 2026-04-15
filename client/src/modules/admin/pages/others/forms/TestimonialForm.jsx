
// import { useSubmitMutation } from "@/redux/api/Testimonialapi";
// import { useTestimonialForm } from "../hooks/UseTestimonialForm";
// import { Label } from "@/components/ui/label";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { Switch } from "@/components/ui/switch";
// import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
// import { Star, UploadCloud, Video, Loader2 } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Skeleton } from "@/components/ui/skeleton";
// import {
//     Tooltip,
//     TooltipTrigger,
//     TooltipContent,
// } from "@/components/ui/tooltip"
// import React, { useState } from "react";

// const TestimonialForm = () => {
//     const { form, updateField, isVideo, setIsVideo, getFormData } = useTestimonialForm();
//     const [submitTestimonial, { isLoading }] = useSubmitTestimonialMutation();

//     const handleSubmit = async () => {
//         try {
//             const payload = getFormData();
//             console.log(payload);

//             // await submitTestimonial(payload).unwrap();
//             // alert("Testimonial submitted!");
//         } catch (error) {
//             // alert("Submission failed!");
//             // console.error(error);
//         }
//     };
//     const [videoFile, setVideoFile] = useState(null);
//     const [loading, setLoading] = useState(false);

//     const handleVideoChange = (e) => {
//         const file = e.target.files?.[0];
//         if (file) {
//             setLoading(true);
//             setVideoFile(file);
//             updateField("video", file);

//             // simulate loading for preview
//             setTimeout(() => setLoading(false), 1000);
//         }
//     };

//     return (
//         <div className="max-w-xl mx-auto p-6 bg-white rounded-xl shadow space-y-6">
//             <div className="flex items-center justify-between">
//                 <Label className="text-lg font-semibold">Use Video Testimonial</Label>
//                 <Tooltip>
//                     <TooltipTrigger asChild>
//                         <div className="flex items-center gap-2">
//                             <Switch checked={isVideo} onCheckedChange={setIsVideo} />
//                             <span className="text-sm text-muted-foreground">Use Video Testimonial</span>
//                         </div>
//                     </TooltipTrigger>
//                     <TooltipContent side="top">
//                         <p>Toggle to enable video-based testimonial</p>
//                     </TooltipContent>
//                 </Tooltip>
//             </div>

//             {!isVideo ? (
//                 <>
//                     <div>
//                         <Label className="mb-2">Feedback Type</Label>
//                         <Select onValueChange={(v) => updateField("feedbackType", v)}>
//                             <SelectTrigger className="w-full">
//                                 <SelectValue placeholder="Select type" />
//                             </SelectTrigger>
//                             <SelectContent>
//                                 <SelectItem value="suggestions">Suggestions</SelectItem>
//                                 <SelectItem value="applications">Applications</SelectItem>
//                                 <SelectItem value="bug_error_report">Bug / Error Report</SelectItem>
//                                 <SelectItem value="purchase_requirement">Purchase Requirement</SelectItem>
//                                 <SelectItem value="complaint">Complaint</SelectItem>
//                                 <SelectItem value="intrested_in_services">Intrested in Services</SelectItem>
//                                 <SelectItem value="others">Others</SelectItem>
//                             </SelectContent>
//                         </Select>
//                     </div>

//                     <div>
//                         <Label className="mb-2">Comments</Label>
//                         <Textarea
//                             placeholder="Write your feedback..."
//                             value={form.comments}
//                             onChange={(e) => updateField("comments", e.target.value)}
//                             className="min-h-[100px]"
//                         />
//                     </div>

//                     <div>
//                         <Label className="mb-2">Rating</Label>
//                         <div className="flex space-x-1">
//                             {[1, 2, 3, 4, 5].map((star) => (
//                                 <Star
//                                     key={star}
//                                     size={24}
//                                     className={`cursor-pointer ${form.rating >= star ? "text-yellow-500" : "text-gray-300"}`}
//                                     onClick={() => updateField("rating", star)}
//                                     fill={form.rating >= star ? "#facc15" : "none"}
//                                 />
//                             ))}
//                         </div>
//                     </div>
//                 </>
//             ) : (
//                 <div className="space-y-2">
//                     <Label className="block text-sm font-medium">Upload Video</Label>

//                     <div className="relative border-2 border-dashed border-gray-300 p-4 rounded-lg flex items-center justify-between">
//                         <div className="flex items-center gap-3">
//                             <Video className="text-gray-500" size={20} />
//                             <span className="text-sm text-muted-foreground">
//                                 {videoFile ? videoFile.name : "No file selected"}
//                             </span>
//                         </div>

//                         <label htmlFor="video-upload">
//                             <input
//                                 id="video-upload"
//                                 type="file"
//                                 accept="video/*"
//                                 onChange={handleVideoChange}
//                                 className="hidden"
//                             />
//                             <Button size="sm" variant="outline" asChild>
//                                 <span className="flex items-center gap-2">
//                                     <UploadCloud size={16} />
//                                     Upload
//                                 </span>
//                             </Button>
//                         </label>
//                     </div>

//                     {/* Skeleton or Success Preview */}
//                     {loading ? (
//                         <Skeleton className="h-40 w-full rounded-lg" />
//                     ) : (
//                         videoFile && (
//                             <video
//                                 controls
//                                 className="w-full mt-2 rounded-lg border shadow"
//                                 height={200}
//                             >
//                                 <source src={URL.createObjectURL(videoFile)} type={videoFile.type} />
//                                 Your browser does not support the video tag.
//                             </video>
//                         )
//                     )}
//                 </div>
//             )}

//             <Button onClick={handleSubmit} disabled={isLoading}>
//                 {isLoading ? "Submitting..." : "Submit"}
//             </Button>
//         </div>
//     );
// };

// export default TestimonialForm;



// components/forms/TestimonialForm.jsx

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

            resetFormData(); // Reset form after submission
            onSuccess?.(); // <- trigger parent to refresh
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
                    value={form.feedbackType} // Bind to form feedbackType state
                    onValueChange={(v) => updateField("feedbackType", v)} // Update state on selection
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
}
