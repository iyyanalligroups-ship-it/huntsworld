// New RTK Query API slice: src/redux/api/imageApi.js (adjust path as needed)
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const StudentImageApi = createApi({
    reducerPath: 'StudentImageApi',
   baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_API_IMAGE_URL }),
    endpoints: (builder) => ({
        uploadRedeemLetter: builder.mutation({
            query: (body) => ({
                url: '/student-images/redeem-letter/upload-redeem-letter',
                method: 'POST',
                body,
            }),
        }),
        deleteRedeemLetter: builder.mutation({
            query: (body) => ({
                url: '/student-images/redeem-letter/delete-redeem-letter',
                method: 'POST',
                body,
            }),
        }),
    }),
});

export const { useUploadRedeemLetterMutation, useDeleteRedeemLetterMutation } = StudentImageApi;
export default StudentImageApi;