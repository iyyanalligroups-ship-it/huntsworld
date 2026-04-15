import { configureStore } from "@reduxjs/toolkit";
import { Authapi } from "../api/Authapi";
import { MerchantProductApi } from "../api/MerchantProductApi";
import { MerchantProductImageApi } from "../api/MerchantProductImageApi";
import { CategoryApi } from "../api/CategoryApi";
import { CategoryImageApi } from "../api/CategoryImageApi";
import { SubCategoryApi } from "../api/SubCategoryApi";
import { SubCategoryImageApi } from "../api/SubCategoryImageApi";
import { SuperSubCategoryApi } from "../api/SuperSubCategoryApi";
import { DeepSubCategoryApi } from "../api/DeepSubCategoryApi";
import { DeepSubCategoryImageApi } from "../api/DeepSubCategoryImageApi";
import { ProductApi } from "../api/ProductApi";
import { ProductImageApi } from "../api/ProductImageApi";
import { SubscriptionPlansApi } from "../api/SubcriptionPlanApi";
import { SubscriptionPlanElementsApi } from "../api/SubscriptionPlanElementApi";
import { SubscriptionPlanElementMappingApi } from "../api/SubscriptionPlanElementMappingApi";
import { PostByRequirementApi } from "../api/PostByRequirementApi";
import { GrocerySellerRequirementApi } from "../api/GrocerySellerRequirementApi";
import { ComplaintFormApi } from "../api/ComplaintFormApi";
import { ComplaintFormImageApi } from "../api/ComplaintFormImageApi";
import { FaqApi } from "../api/FAQapi";
import { TestimonialApi } from "../api/Testimonialapi";
import { UserProfilePicApi } from "../api/UserprofilePicapi";
import { PointsApi } from "../api/PointApi";
import { CouponApi } from "../api/CouponApi";
import { PermissionApi } from "../api/PermissionApi";
import { PermissionRequestApi } from "../api/PermissionRequestApi";
import { MessageApi } from "../api/MessageApi";
import { MessageImagesApi } from "../api/MessageImagesApi";
import { MerchantAuthApi } from "../api/MerchantAuthapi";
import { MerchantImageApi } from "../api/MerchantImageApi";
import { ServiceProviderApi } from "../api/ServiceProviderApi";
import { GrocerySellerApi } from "../api/GrocerySellerApi";
import { StudentApi } from "../api/Studentapi";
import { ProductQuoteApi } from "../api/ProductQuoteApi";
import { AccessApi } from "../api/AccessApi";
import { viewPointApi } from "../api/ViewPointApi";
import { favoriteApi } from "../api/FavoriteApi";
import { SubDealerApi } from "../api/SubDealerApi";
import { SubDealerImageApi } from "../api/SubDealerImageApi";
import { CouponsNotificationApi } from "../api/couponsNotificationApi";
import { UserSubscriptionPlanApi } from "../api/UserSubscriptionPlanApi";
import { CommonSubscriptionPlanApi } from "../api/CommonSubscriptionPlanApi";
import { BannerPaymentApi } from "../api/BannerPaymentApi";
import { BannerImageApi } from "../api/BannerImageApi";
import { TrendingPointsPaymentApi } from "../api/UserTrendingPointSubscriptionApi";
import { ReviewApi } from "../api/ReviewApi";
import { SellerApi } from "../api/SellerApi";
import { TrustSealRequestApi } from "../api/TrustSealRequestApi"; // Already imported
import { ServiceProviderOnboardingApi } from "../api/ServiceProviderOnboardingApi";
import { GrocerySellerOnboardingApi } from "../api/GrocerySellerOnboardingApi";
import { complaintApi } from "../api/ComplaintApi";
import { AddressApi } from "../api/AddressApi";
import { PhoneNumberAccessApi } from "../api/PhoneNumberAccessApi";
import { SubAdminAccessRequestApi } from "../api/SubAdminAccessRequestApi";
import fetchuserReducer from "@/redux/api/FetchUsers";
import { NewsApi } from "../api/NewsApi";
import { BrandApi } from "../api/BrandApi";
import StudentImageApi from "../api/StudentImageApi";
import { TopListingApi } from "../api/TopListingApi";
import { CompanyTypeApi } from "../api/CompanyTypeApi";

const store = configureStore({
  reducer: {
    [Authapi.reducerPath]: Authapi.reducer,
    [MerchantProductApi.reducerPath]: MerchantProductApi.reducer,
    [MerchantProductImageApi.reducerPath]: MerchantProductImageApi.reducer,
    [CategoryApi.reducerPath]: CategoryApi.reducer,
    [CategoryImageApi.reducerPath]: CategoryImageApi.reducer,
    [SubCategoryApi.reducerPath]: SubCategoryApi.reducer,
    [SubCategoryImageApi.reducerPath]: SubCategoryImageApi.reducer,
    [SuperSubCategoryApi.reducerPath]: SuperSubCategoryApi.reducer,
    [DeepSubCategoryApi.reducerPath]: DeepSubCategoryApi.reducer,
    [DeepSubCategoryImageApi.reducerPath]: DeepSubCategoryImageApi.reducer,
    [ProductApi.reducerPath]: ProductApi.reducer,
    [ProductImageApi.reducerPath]: ProductImageApi.reducer,
    [SubscriptionPlansApi.reducerPath]: SubscriptionPlansApi.reducer,
    [SubscriptionPlanElementsApi.reducerPath]: SubscriptionPlanElementsApi.reducer,
    [SubscriptionPlanElementMappingApi.reducerPath]: SubscriptionPlanElementMappingApi.reducer,
    [PostByRequirementApi.reducerPath]: PostByRequirementApi.reducer,
    [GrocerySellerRequirementApi.reducerPath]: GrocerySellerRequirementApi.reducer,
    [ComplaintFormApi.reducerPath]: ComplaintFormApi.reducer,
    [ComplaintFormImageApi.reducerPath]: ComplaintFormImageApi.reducer,
    [FaqApi.reducerPath]: FaqApi.reducer,
    [TestimonialApi.reducerPath]: TestimonialApi.reducer,
    [UserProfilePicApi.reducerPath]: UserProfilePicApi.reducer,
    [PointsApi.reducerPath]: PointsApi.reducer,
    [CouponApi.reducerPath]: CouponApi.reducer,
    [PermissionApi.reducerPath]: PermissionApi.reducer,
    [PermissionRequestApi.reducerPath]: PermissionRequestApi.reducer,
    [MessageApi.reducerPath]: MessageApi.reducer,
    [MessageImagesApi.reducerPath]: MessageImagesApi.reducer,
    [MerchantAuthApi.reducerPath]: MerchantAuthApi.reducer,
    [MerchantImageApi.reducerPath]: MerchantImageApi.reducer,
    [ServiceProviderApi.reducerPath]: ServiceProviderApi.reducer,
    [GrocerySellerApi.reducerPath]: GrocerySellerApi.reducer,
    [StudentApi.reducerPath]: StudentApi.reducer,
    [ProductQuoteApi.reducerPath]: ProductQuoteApi.reducer,
    [AccessApi.reducerPath]: AccessApi.reducer,
    [viewPointApi.reducerPath]: viewPointApi.reducer,
    [favoriteApi.reducerPath]: favoriteApi.reducer,
    [SubDealerApi.reducerPath]: SubDealerApi.reducer,
    [SubDealerImageApi.reducerPath]: SubDealerImageApi.reducer,
    [CouponsNotificationApi.reducerPath]: CouponsNotificationApi.reducer,
    [UserSubscriptionPlanApi.reducerPath]: UserSubscriptionPlanApi.reducer,
    [CommonSubscriptionPlanApi.reducerPath]: CommonSubscriptionPlanApi.reducer,
    [BannerPaymentApi.reducerPath]: BannerPaymentApi.reducer,
    [BannerImageApi.reducerPath]: BannerImageApi.reducer,
    [TrendingPointsPaymentApi.reducerPath]: TrendingPointsPaymentApi.reducer,
    [ReviewApi.reducerPath]: ReviewApi.reducer,
    [SellerApi.reducerPath]: SellerApi.reducer,
    [TrustSealRequestApi.reducerPath]: TrustSealRequestApi.reducer, // Already included
    [ServiceProviderOnboardingApi.reducerPath]: ServiceProviderOnboardingApi.reducer,
    [GrocerySellerOnboardingApi.reducerPath]: GrocerySellerOnboardingApi.reducer,
    [complaintApi.reducerPath]: complaintApi.reducer,
    [AddressApi.reducerPath]: AddressApi.reducer,
    [PhoneNumberAccessApi.reducerPath]: PhoneNumberAccessApi.reducer,
    [SubAdminAccessRequestApi.reducerPath]: SubAdminAccessRequestApi.reducer,
    fetchuser: fetchuserReducer,
    [NewsApi.reducerPath]: NewsApi.reducer,
    [BrandApi.reducerPath]: BrandApi.reducer,
    [StudentImageApi.reducerPath]: StudentImageApi.reducer,
    [TopListingApi.reducerPath]: TopListingApi.reducer,
    [CompanyTypeApi.reducerPath]: CompanyTypeApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      Authapi.middleware,
      MerchantProductApi.middleware,
      MerchantProductImageApi.middleware,
      CategoryApi.middleware,
      CategoryImageApi.middleware,
      SubCategoryApi.middleware,
      SubCategoryImageApi.middleware,
      SuperSubCategoryApi.middleware,
      DeepSubCategoryApi.middleware,
      DeepSubCategoryImageApi.middleware,
      ProductApi.middleware,
      ProductImageApi.middleware,
      SubscriptionPlansApi.middleware,
      SubscriptionPlanElementsApi.middleware,
      SubscriptionPlanElementMappingApi.middleware,
      PostByRequirementApi.middleware,
      GrocerySellerRequirementApi.middleware,
      ComplaintFormApi.middleware,
      ComplaintFormImageApi.middleware,
      FaqApi.middleware,
      TestimonialApi.middleware,
      UserProfilePicApi.middleware,
      PointsApi.middleware,
      CouponApi.middleware,
      PermissionApi.middleware,
      PermissionRequestApi.middleware,
      MessageApi.middleware,
      MessageImagesApi.middleware,
      MerchantAuthApi.middleware,
      MerchantImageApi.middleware,
      ServiceProviderApi.middleware,
      GrocerySellerApi.middleware,
      StudentApi.middleware,
      ProductQuoteApi.middleware,
      AccessApi.middleware,
      viewPointApi.middleware,
      favoriteApi.middleware,
      SubDealerApi.middleware,
      SubDealerImageApi.middleware,
      CouponsNotificationApi.middleware,
      UserSubscriptionPlanApi.middleware,
      CommonSubscriptionPlanApi.middleware,
      BannerPaymentApi.middleware,
      BannerImageApi.middleware,
      TrendingPointsPaymentApi.middleware,
      ReviewApi.middleware,
      SellerApi.middleware,
      TrustSealRequestApi.middleware, // Already included
      ServiceProviderOnboardingApi.middleware,
      GrocerySellerOnboardingApi.middleware,
      complaintApi.middleware,
      AddressApi.middleware,
      PhoneNumberAccessApi.middleware,
      SubAdminAccessRequestApi.middleware,
      NewsApi.middleware,
      BrandApi.middleware,
      StudentImageApi.middleware,
      TopListingApi.middleware,
      CompanyTypeApi.middleware
    ),
});

export default store;
