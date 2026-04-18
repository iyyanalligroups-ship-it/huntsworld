import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import HomeLayout from "./layout/HomeLayout";
import HomePage from "./HomePage";

// A simple fallback loader for chunk loading
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh] text-sm text-gray-500">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
    Loading...
  </div>
);

// --- LAZY LOADED IMPORTS ---
// auth
const Register = lazy(() => import("./pages/Register"));
const Login = lazy(() => import("./pages/Login"));
const ForgotPasswordPage = lazy(() => import("./pages/pages/forgotpassword/ForgotPasswordPage"));

// static
const SellerFAQ = lazy(() => import("../../staticPages/SellerFAQ"));
const BuyerFAQ = lazy(() => import("../../staticPages/BuyerFAQ"));
const AboutUs = lazy(() => import("@/staticPages/AboutUs"));
const FeedBack = lazy(() => import("@/staticPages/FeedBack"));
const Testimonial = lazy(() => import("@/staticPages/Testimonial"));
const Disclaimer = lazy(() => import("@/staticPages/Disclaimer"));
const ComplaintForm = lazy(() => import("@/staticPages/Complaint"));
const ContactUs = lazy(() => import("@/staticPages/ContactUs"));
const PrivacyPolicy = lazy(() => import("@/staticPages/PrivacyPolicy"));
const TermsConditions = lazy(() => import("@/staticPages/TermsConditions"));
const AdvertiseWithUs = lazy(() => import("@/staticPages/AdvertiseWithUs"));
const DeleteAccount = lazy(() => import("@/staticPages/DeleteAccountPage"));
const ReferralRegister = lazy(() => import("./pages/ReferralRegister"));

// category pages
const AllCountriesPage = lazy(() => import("./pages/pages/categorySection/AllCountriesPage"));
const AllCitiesPage = lazy(() => import("./pages/pages/categorySection/AllCityPages"));
const AllCategoriesPage = lazy(() => import("./pages/pages/categorySection/AllCategoriesPage"));
const SubCategoryList = lazy(() => import("./pages/pages/categorySection/SubCategoryList"));
const SubCategoryDetail = lazy(() => import("./pages/pages/categorySection/SubCategoryDetailsPage"));
const ProductListPage = lazy(() => import("./pages/pages/categorySection/ProductsPages/ProductListPage"));
const ProductDetailsWrapper = lazy(() => import("./pages/pages/categorySection/ProductsPages/ProductDetailsWrapper"));
const MerchantWebsite = lazy(() => import("./pages/pages/categorySection/ProductsPages/MerchantWebsite"));
const ReviewProduct = lazy(() => import("./pages/pages/categorySection/ProductsPages/ReviewProduct"));
const CountryData = lazy(() => import("./pages/pages/categorySection/country/CountryData"));
const ManufacturingDirectory = lazy(() => import("./pages/pages/categorySection/directory/ManufaturingDirectory"));
const SuppliersPage = lazy(() => import("./pages/pages/categorySection/SuplierRegion/SupplireByRegion"));
const SearchResultsPage = lazy(() => import("./pages/pages/categorySection/search/SearchResultsPage"));

// student
const Dashboard = lazy(() => import("../student/pages/dashboard/Dashboard"));
const FavoriteProduct = lazy(() => import("../student/pages/favorite/FavoriteProduct"));
const VerificationList = lazy(() => import("../student/pages/verification/VerificationList"));
const WalletPage = lazy(() => import("../student/pages/wallet/Wallet"));
const Settings = lazy(() => import("../student/pages/settings/Settings"));
const StudentPaymentHistory = lazy(() => import("../student/pages/paymentHistory/StudentPaymentHistory"));

// common user
const UserDashboard = lazy(() => import("../commonUser/pages/dashboard/Dashboard"));
const UserFavorite = lazy(() => import("../commonUser/pages/favorite/favoriteProduct"));
const UserSettings = lazy(() => import("../commonUser/pages/settings/Settings"));
const UserWallet = lazy(() => import("../commonUser/pages/wallet/Wallet"));
const SellProduct = lazy(() => import("../commonUser/pages/Login-as/SellProduct"));
const Student = lazy(() => import("../commonUser/pages/Login-as/StudentLogin"));
const AddRequirement = lazy(() => import("../commonUser/pages/Login-as/AddRequirement"));
const ProvideService = lazy(() => import("../commonUser/pages/Login-as/ProvideService"));

// misc
const Requirements = lazy(() => import("@/modules/landing/Requirements"));
const GrocerySellerRequirement = lazy(() => import("./pages/pages/grocerySellerRequirement/SellerRequirements"));
const ChatPage = lazy(() => import("@/modules/commonUser/pages/chat/pages/ChatPage"));
const PostRequirement = lazy(() => import("@/staticPages/PostByRequirement"));
const MyRequirement = lazy(() => import("@/staticPages/MyRequirements"));
const PaymentAccounts = lazy(() => import("../student/pages/account/PaymentAccounts"));
const Referral = lazy(() => import("../commonUser/pages/referral/Referral"));
const CustomerPhoneRequestsPage = lazy(() => import("../commonUser/pages/notification/CustomerPhoneRequestsPage"));
const UserDeactivateButton = lazy(() => import("../commonUser/pages/settings/deactivate/DeactivateAccount"));


// Helper to wrap lazy components in Suspense boundary
const withSuspense = (Component) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

export default function HomePageRoute() {
  return (
    <Routes>
      <Route path="/*" element={<HomeLayout />}>
        {/* HomePage is loaded SYNCHRONOUSLY for instant rendering */}
        <Route index element={<HomePage />} />
        <Route path="home" element={<HomePage />} />

        {/* --- ALL OTHER ROUTES BELOW ARE LAZY LOADED --- */}

        {/* auth */}
        <Route path="login" element={withSuspense(Login)} />
        <Route path="register" element={withSuspense(Register)} />
        <Route path="forgot-password" element={withSuspense(ForgotPasswordPage)} />

        {/* static */}
        <Route path="seller-faq" element={withSuspense(SellerFAQ)} />
        <Route path="buyer-faq" element={withSuspense(BuyerFAQ)} />
        <Route path="about" element={withSuspense(AboutUs)} />
        <Route path="feedback" element={withSuspense(FeedBack)} />
        <Route path="testimonials" element={withSuspense(Testimonial)} />
        <Route path="disclaimer" element={withSuspense(Disclaimer)} />
        <Route path="complaint" element={withSuspense(ComplaintForm)} />
        <Route path="contact" element={withSuspense(ContactUs)} />
        <Route path="privacy-policy" element={withSuspense(PrivacyPolicy)} />
        <Route path="terms-condition" element={withSuspense(TermsConditions)} />
        <Route path="advertise-with-us" element={withSuspense(AdvertiseWithUs)} />
        <Route path="delete-account" element={withSuspense(DeleteAccount)} />
        <Route path="referral-register" element={withSuspense(ReferralRegister)} />
        <Route path="referral-register/:referralCode" element={withSuspense(ReferralRegister)} />

        {/* category */}
        <Route path="all-countries" element={withSuspense(AllCountriesPage)} />
        <Route path="all-city" element={withSuspense(AllCitiesPage)} />
        <Route path="all-categories" element={withSuspense(AllCategoriesPage)} />
        <Route path="all-categories/:category" element={withSuspense(SubCategoryList)} />
        <Route path="all-categories/:country/:category" element={withSuspense(SubCategoryList)} />
        <Route path="all-categories/:category/:subCategory" element={withSuspense(SubCategoryList)} />
        <Route path="subcategory-detail/:subcategoryName" element={withSuspense(SubCategoryDetail)} />
        <Route path="subcategory-detail/:country/:subcategoryName" element={withSuspense(SubCategoryDetail)} />
        <Route path="products/:type/:deepSubCategory" element={withSuspense(ProductListPage)} />
        <Route path="product/:productId" element={withSuspense(ProductDetailsWrapper)} />
        <Route path="company/:company_name" element={withSuspense(MerchantWebsite)} />
        <Route path="review/:productId" element={withSuspense(ReviewProduct)} />
        <Route path="country/:country" element={withSuspense(CountryData)} />
        <Route path="suppliers/:city" element={withSuspense(SuppliersPage)} />
        <Route path="manufacturing-directory" element={withSuspense(ManufacturingDirectory)} />
        <Route path="search/:category/:searchTerm" element={withSuspense(SearchResultsPage)} />
        <Route path="search/:category/:searchTerm/:city" element={withSuspense(SearchResultsPage)} />

        {/* student */}
        <Route path="dashboard" element={withSuspense(Dashboard)} />
        <Route path="favorite" element={withSuspense(FavoriteProduct)} />
        <Route path="verification-list" element={withSuspense(VerificationList)} />
        <Route path="wallet" element={withSuspense(WalletPage)} />
        <Route path="settings" element={withSuspense(Settings)} />
        <Route path="my-requirements" element={withSuspense(MyRequirement)} />
        <Route path="payment-history" element={withSuspense(StudentPaymentHistory)} />

        {/* common user */}
        <Route path="user-dashboard" element={withSuspense(UserDashboard)} />
        <Route path="user-favorite" element={withSuspense(UserFavorite)} />
        <Route path="user-wallet" element={withSuspense(UserWallet)} />
        <Route path="user-settings" element={withSuspense(UserSettings)} />
        <Route path="sell-product" element={withSuspense(SellProduct)} />
        <Route path="provide-service" element={withSuspense(ProvideService)} />
        <Route path="student-login" element={withSuspense(Student)} />
        <Route path="add-requirement" element={withSuspense(AddRequirement)} />
        <Route path="referral-list" element={withSuspense(Referral)} />
        <Route path="user-deactivate" element={withSuspense(UserDeactivateButton)} />

        {/* misc */}
        <Route path="post-requirement" element={withSuspense(PostRequirement)} />
        <Route path="requirements" element={withSuspense(Requirements)} />
        <Route path="groceryseller/:user_id" element={withSuspense(GrocerySellerRequirement)} />
        <Route path="chat" element={withSuspense(ChatPage)} />
        <Route path="account" element={withSuspense(PaymentAccounts)} />
        <Route path="customer-notification-page" element={withSuspense(CustomerPhoneRequestsPage)} />
      </Route>
    </Routes>
  );
}
