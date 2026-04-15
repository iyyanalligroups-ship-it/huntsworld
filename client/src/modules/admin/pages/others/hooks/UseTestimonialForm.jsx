// // hooks/useTestimonialForm.js
// import { useState } from 'react';

// export const useTestimonialForm = () => {
//   const [isVideo, setIsVideo] = useState(false);
//   const [form, setForm] = useState({
//     feedbackType: '',
//     comments: '',
//     rating: 0,
//     video: null,
//   });

//   const updateField = (field, value) => {
//     setForm((prev) => ({ ...prev, [field]: value }));
//   };

//   const getFormData = () => {
//     const formData = new FormData();
//     formData.append('type', isVideo ? 'video' : 'text');

//     if (isVideo) {
//       formData.append('video', form.video);
//     } else {
//       formData.append('feedbackType', form.feedbackType);
//       formData.append('comments', form.comments);
//       formData.append('rating', form.rating.toString());
//     }

//     return formData;
//   };

//   return { form, updateField, isVideo, setIsVideo, getFormData };
// };





// hooks/useTestimonialForm.js
import { useState ,useContext} from 'react';
import { AuthContext } from "@/modules/landing/context/AuthContext";
export const useTestimonialForm = () => {
      const { user } = useContext(AuthContext);
  const [form, setForm] = useState({
    feedbackType: '',
    comments: '',
    rating: 0,
    user_id:user?.user?._id
  });

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const getFormData = () => {
    return {

      feedbackType: form.feedbackType,
      comments: form.comments,
      rating: form.rating,
      user_id:user?.user?._id
    };
  };
  const resetFormData = () => {
    setForm({
      feedbackType: '',
      comments: '',
      rating: 0,
      user_id: user?.user?._id
    });
  };
  
  return { form, updateField, getFormData,resetFormData };
};
