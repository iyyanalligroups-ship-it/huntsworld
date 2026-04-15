import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const UserProfilePicApi = createApi({
  reducerPath: 'userProfilePicApi',
  baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_API_IMAGE_URL }),
  tagTypes: ['UserProfilePic'],
  endpoints: (builder) => ({
    // GET - Fetch profile picture (you may need to include filename and folder in query)
    getUserProfilePic: builder.query({
      query: ({ entity_type, user_id, filename }) =>
        `/user-images/get-file/${entity_type}/${user_id}/${filename}`,
      providesTags: (result, error, { user_id }) => [{ type: 'UserProfilePic', id: user_id }],
    }),

    // POST - Upload new profile picture
    uploadUserProfilePic: builder.mutation({
      query: ({ formData }) => ({
        url: `/user-images/upload-profile-image`,
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: (result, error, { user_id }) => [{ type: 'UserProfilePic', id: user_id }],
    }),

    // PUT - Update existing profile picture
    updateUserProfilePic: builder.mutation({
      query: ({ formData }) => ({
        url: `/user-images/update-profile-image`,
        method: 'PUT',
        body: formData,
      }),
      invalidatesTags: (result, error, { user_id }) => [{ type: 'UserProfilePic', id: user_id }],
    }),

    // DELETE - Delete profile picture (send body in DELETE request)
    deleteUserProfilePic: builder.mutation({
      query: ({ entity_type, user_id, profile_pic }) => ({
        url: `/user-images/delete-profile-image`,
        method: 'DELETE',
        body: { entity_type, user_id, profile_pic },
      }),
      invalidatesTags: (result, error, { user_id }) => [{ type: 'UserProfilePic', id: user_id }],
    }),
  }),
});

export const {
  useGetUserProfilePicQuery,
  useUploadUserProfilePicMutation,
  useUpdateUserProfilePicMutation,
  useDeleteUserProfilePicMutation,
} = UserProfilePicApi;
