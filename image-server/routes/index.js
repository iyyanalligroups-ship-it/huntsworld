module.exports = (app) => {
  // ================== USER / PROFILE ==================
  app.use("/api/v1/user-images", require("./userRoute"));
  app.use("/api/v1/merchant-images", require("./merchantRoute"));
  app.use("/api/v1/service-provider-images", require("./serviceProviderRoute"));
  app.use("/api/v1/grocery-seller-images", require("./groceryRoutes"));
  app.use("/api/v1/student-images", require("./studentRoute"));
//   app.use("/api/v1/sellers", require("./sellerRoute"));

  // ================== CATEGORY / PRODUCT ==================
  app.use("/api/v1/category-images", require("./categoryRoute"));
  app.use("/api/v1/subCategory-images", require("./subCategoryRoute"));
  app.use("/api/v1/deepSubCategory-images", require("./deepSubCategoryRoute"));
  app.use("/api/v1/product-images", require("./productRoute"));
  app.use("/api/v1/brand-images", require("./brandImageRoute"));

  // ================== CONTENT / COMMUNICATION ==================
  app.use("/api/v1/chat-message-images", require("./chatMessageRoute"));
  app.use("/api/v1/complaint-forms", require("./complaintRoute"));
  app.use("/api/v1/trust-seal-images", require("./trustSealRoute"));

  // ================== PAYMENTS / DOCUMENTS ==================
  app.use("/api/v1/banner-image", require("./bannerImageRoute"));
  app.use("/api/v1/redeem-letter", require("./redeemLetterRoute"));
  app.use("/api/v1/report-file", require("./reportFileRoute"));
  app.use("/api/v1/admin-banner-image", require("./adminBannerRoutes"));
};
