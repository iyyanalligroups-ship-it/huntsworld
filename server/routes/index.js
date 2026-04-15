module.exports = (app) => {
  // ================== USER & AUTH ==================
  app.use("/api/v1/users", require("./userRoute"));
  app.use("/api/v1/role", require("./roleRoute"));
  app.use("/api/v1/access", require("./accessRoute"));
  app.use("/api/v1/subAdmin-request-access", require("./subadminAccessRequestRoute"));

  // ================== PROFILE & ADDRESS ==================
  app.use("/api/v1/address", require("./addressRoute"));
  app.use("/api/v1/phone-number-access", require("./phoneNumberAccessRoute"));
  app.use("/api/v1/phone-visibility", require("./phoneVisibilityRoute"));
  app.use("/api/v1/ask-price", require("./askPriceRoute"));

  // ================== SELLERS / PROVIDERS ==================
  app.use("/api/v1/merchants", require("./merchantRoute"));
  app.use("/api/v1/service-providers", require("./serviceProviderRoute"));
  app.use("/api/v1/grocery-sellers", require("./grocerySellerRoute"));
  app.use("/api/v1/students", require("./studentRoute"));
  app.use("/api/v1/sellers", require("./sellerRoute"));
  app.use("/api/v1/sub-dealer", require("./subdealerRoutes"));
  app.use("/api/v1/sub-dealers", require("./subdealerRoutes"));
  app.use("/api/v1/contact", require("./contactRoute"));
  // ================== CATEGORY & PRODUCT ==================
  app.use("/api/v1/categories", require("./categoryRoute"));
  app.use("/api/v1/sub-categories", require("./subCategoryRoute"));
  app.use("/api/v1/super-sub-categories", require("./superSubCategoryRoute"));
  app.use("/api/v1/deep-sub-categories", require("./deepSubCategoryRoute"));

  app.use("/api/v1/products", require("./productRoute"));
  app.use("/api/v1/product-quotes", require("./productQuoteRoute"));
  app.use("/api/v1/favorite-products", require("./favoriteProductRoute"));
  app.use("/api/v1/reviews", require("./reviewRoute"));

  // ================== SUBSCRIPTIONS & PLANS ==================
  app.use("/api/v1/subscription-plans", require("./subscriptionPlanRotue"));
  app.use("/api/v1/subscription-plans-elements", require("./subscriptionPlanElementRoute"));
  app.use(
    "/api/v1/subscription-plans-elements-mapping",
    require("./subscriptionPlanElementMappingRoute")
  );
  app.use("/api/v1/user-subscription-plan", require("./userSubscriptionPlanRoute"));
  app.use("/api/v1/common-subscription-plan", require("./commonSubcriptionPlanRoute"));

  // ================== POINTS, COUPONS & PAYMENTS ==================
  app.use("/api/v1/treanding-points", require("./pointsRoute"));
  app.use("/api/v1/trending-point", require("./trendingPointsRoute"));
  app.use("/api/v1/view-points", require("./viewPointsRoute"));
  app.use("/api/v1/trending-points-payment", require("./trendingPointsPaymentRoute"));

  app.use("/api/v1/coupons", require("./couponRoute"));
  app.use("/api/v1/coupons-notification", require("./couponsNotificationRoute"));
  app.use("/api/v1/redeem-points", require("./redeemPointsRoute"));

  app.use("/api/v1/banner-payment", require("./bannerPaymentRoute"));
  app.use("/api/v1/e-book-payment", require("./ebookPaymentRoute"));

  // ================== REQUIREMENTS & LEADS ==================
  app.use("/api/v1/post-by-requirement", require("./postByRequirementRoute"));
  app.use("/api/v1/grocery-seller-requirement", require("./grocerySellerRequirementRoute"));
  app.use("/api/v1/buy-leads", require("./buyLeadsRoute"));


  // ================== SOCIAL MEDIA ==================
  app.use("/api/v1/social-media", require("./socialMediaRoute"));
  app.use("/api/v1/social-media-platform", require("./socialMediaPlatformRoute"));

  // ================== CONTENT & CMS ==================
  app.use("/api/v1/faq-topics", require("./faqTopicRoute"));
  app.use("/api/v1/faq-questions", require("./faqQuestionRoute"));
  app.use("/api/v1/testimonials", require("./testimonialRoute"));
  app.use("/api/v1/testimonialweb", require("./testWebRoute"));
  app.use("/api/v1/news", require("./newsRoute"));
  app.use("/api/v1/brands", require("./brandRoute"));
  app.use("/api/v1/trust-seal", require("./trustSealRequestRoutes"));
  app.use("/api/v1/company-types", require("./companyTypeRoute"));
  app.use("/api/v1/base-member-types", require("./baseMemberTypeRoute"));


  // ================== COMMUNICATION ==================
  app.use("/api/v1/chat", require("./messageRoute"));
  app.use("/api/v1/complaint-form", require("./complaintFormRoute"));
  app.use("/api/v1/help", require("./helpRequestRoute"));

  // ================== DASHBOARD & ADMIN ==================
  app.use("/api/v1/dashboard-data", require("./dashboardRoute"));
  app.use("/api/v1/admin-dashboard", require("./adminDashboardRoute"));

  // ================== FILES & MEDIA ==================
  app.use("/api/v1/images", require("./ImageRoute"));
  app.use("/api/v1/report-file", require("./reportFileRoute"));
  // ================== PAYMENT HISTORY ==================
  app.use("/api/v1/payment-history", require("./paymentHistoryRoute"));
  app.use('/api/v1/distributors', require("./distributorRoutes"));
  app.use("/api/v1/payment-accounts", require("./paymentAccountRoute"));
  // ================== TOP LISTING PLAN ==================
  app.use("/api/v1/top-listing-plan", require("./topListingPlanRoute"));
  app.use("/api/v1/top-listing-plan-payment", require("./topListingPlanPaymentRoute"));
  app.use("/api/v1/referral-commissions", require("./referralRoute"));
  app.use('/api/v1/trust-seal-assignment', require("./trustSealAssignRoute"));
  app.use('/api/v1/webhooks', require("./webhookRoutes"));
  app.use('/api/v1/admin-banner', require("./adminBannerRoute"));
  app.use('/api/v1/top-listing-products', require("./topListingProductRoute"));

};
