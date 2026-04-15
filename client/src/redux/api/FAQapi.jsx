import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const FaqApi = createApi({
  reducerPath: "faqApi",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL,
    prepareHeaders: (headers) => {
      const token = sessionStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["FaqTopic", "FaqQuestion"],
  endpoints: (builder) => ({

    // 🟦 FAQ TOPIC QUERIES ----------------------------

    getFaqTopics: builder.query({
      query: () => "/faq-topics/fetch-all-faq-topics",
      providesTags: ["FaqTopic"],
    }),

    createFaqTopic: builder.mutation({
      query: (data) => ({
        url: "/faq-topics/create-faq-topic",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["FaqTopic"],
    }),

    updateFaqTopic: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/faq-topics/update-faq-topic/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["FaqTopic"],
    }),

    deleteFaqTopic: builder.mutation({
      query: (id) => ({
        url: `/faq-topics/delete-faq-topic/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["FaqTopic"],
    }),

    // 🟨 FAQ QUESTION QUERIES ----------------------------

    getFaqQuestions: builder.query({
      query: ({ topicId, role, isPublished } = {}) => {
        const params = new URLSearchParams();
        if (topicId) params.append("topicId", topicId);
        if (role) params.append("role", role);
        if (isPublished !== undefined) params.append("isPublished", isPublished);
        return `/faq-questions/fetch-all-faq-questions?${params.toString()}`;
      },
      providesTags: ["FaqQuestion"],
    }),

    createFaqQuestion: builder.mutation({
      query: (data) => ({
        url: "/faq-questions/create-faq-question",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["FaqQuestion"],
    }),

    updateFaqQuestion: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/faq-questions/update-faq-questions/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["FaqQuestion"],
    }),

    deleteFaqQuestion: builder.mutation({
      query: (id) => ({
        url: `/faq-questions/delete-faq-questions/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["FaqQuestion"],
    }),

    // topic dropdown
    getFaqTopicsForQuestions: builder.query({
      query: ({ type }) => ({
        url: "/faq-topics/fetch-all-faq-topics-for-questions",
        params: type ? { type } : {},
      }),
      providesTags: ["FaqTopic"],
    }),

    // fetch all faq for seller and buyer
    getFaqQuestionsForSeller: builder.query({
      query: () => ({
        url: "/faq-questions/fetch-all-faq-questions-for-seller",

      }),
      providesTags: ["FaqTopic"],
    }),
    getFaqQuestionsForBuyer: builder.query({
      query: () => ({
        url: "/faq-questions/fetch-all-faq-questions-for-buyer",

      }),
      providesTags: ["FaqTopic"],
    }),
    getFaqQuestionsForGeneral: builder.query({
      query: () => ({
        url: "/faq-questions/fetch-all-faq-questions-for-general",

      }),
      providesTags: ["FaqTopic"],
    }),
    getFaqQuestionsForStudent: builder.query({
      query: () => ({
        url: "/faq-questions/fetch-all-faq-questions-for-student",

      }),
      providesTags: ["FaqTopic"],
    }),
    getFaqQuestionsForBaseMember: builder.query({
      query: () => ({
        url: "/faq-questions/fetch-all-faq-questions-for-baseMember",

      }),
      providesTags: ["FaqTopic"],
    }),
  }),
});

export const {
  // Topics
  useGetFaqTopicsQuery,
  useCreateFaqTopicMutation,
  useUpdateFaqTopicMutation,
  useDeleteFaqTopicMutation,

  // Questions
  useGetFaqQuestionsQuery,
  useCreateFaqQuestionMutation,
  useUpdateFaqQuestionMutation,
  useDeleteFaqQuestionMutation,
  useGetFaqTopicsForQuestionsQuery,

  // seller and buyer
  useGetFaqQuestionsForBuyerQuery,
  useGetFaqQuestionsForSellerQuery,
  useGetFaqQuestionsForGeneralQuery,
  useGetFaqQuestionsForStudentQuery,
  useGetFaqQuestionsForBaseMemberQuery
} = FaqApi;
