import { Route } from "react-router-dom";
import SubAdminLayout from "./SubAdminLayout";
import Dashboard from "./pages/dashboard/Dashboard";
import Profile from "./pages/profile/Profile";
import Users from "./pages/users/Users";
import Merchant from "./pages/merchants/Merchant";
import MerchantProducts from "./pages/merchants/MerchantProducts";
import ServiceProviderList from "./pages/service-provider/ServiceProvider";
import Vehicles from "./pages/service-provider/ServiceProviderVehicle";
import StudentList from "./pages/student/StudentList";
import PaidSubcriptions from "./pages/payments/PaidSubscriptions/PaidSubcriptions";
import PaidRedeem from "./pages/payments/PaidRedeemCoupons";
import PlansBanner from "./pages/plans/Banners";
import PlansEbook from "./pages/plans/EBook";
import PlanSubcriptions from "./pages/plans/Subcriptions";
import MainCategories from "./pages/categories/MainCategory";
import SubCategories from "./pages/categories/SubCategory";
import SuperSubCategories from "./pages/categories/SuperSubCategory";
import DeepSubCategories from "./pages/categories/DeepSubCategory";
import Products from "./pages/categories/Products";
import GrocerySellerList from "./pages/grocery/GrocerySeller";
import PostRequirement from "./pages/others/PostRequirement";
import FAQ from "./pages/others/FAQ";
import Complaint from "./pages/others/Complaint";
import Testimonial from "./pages/others/Testimonial";
import SubAdminLists from "./pages/subadmin/subadminLists";
import Roles from "./pages/subadmin/roles";
import PostRequirementAdminPanel from "./pages/others/PostRequirement";
import Settings from "./pages/settings/Settings";
import Permission from "./pages/settings/pages/permissions/Permission";
import PermissionRequest from "./pages/settings/pages/permissions/PermissionRequest";
import ChatPage from "@/modules/admin/pages/chat/pages/ChatPage";
import MerchantList from "./pages/merchants/MerchantList";
import PaidEbooks from "./pages/payments/PaidEbooks";
import PaidBanner from "./pages/payments/PaidBanner";
import RedeemRequest from "./pages/walletNotification/RedeemRequest";
import CommonSubscriptionPlan from "./pages/common-plan/CommonSubscriptionPlans"
import TrustSealRequestsPage from "./pages/plans/trust-seal/TrustSealRequestsPage";

const AdminRoutes = (
  <Route path="/subAdmin" element={<SubAdminLayout />}>
    <Route index element={<Dashboard />} />
    <Route path="dashboard" element={<Dashboard />} />
    <Route path="profile" element={<Profile />} />
    <Route path="common-users" element={<Users />} />

    
    
    {/* Merchant Routes */}
    <Route path="merchants" element={<Merchant />} />

    <Route path="settings" element={<Settings />} />
    <Route path="chat" element={<ChatPage />} />
    
    
    {/* Merchant Routes */}
    <Route path="merchants" element={<MerchantList />} />

    <Route path="merchants/products" element={<MerchantProducts />} />
    
    {/* Service Provider Routes */}
    <Route path="service-providers" element={<ServiceProviderList />} />
    <Route path="service-providers/vehicles" element={<Vehicles />} />
    
    {/* Student Routes */}
    <Route path="students" element={<StudentList />} />

    {/*SubAdmin Routes */}
    <Route path="subadmin" element={<SubAdminLists/>} />
    <Route path="subadmin/Roles" element={<Roles/>} />



    
    {/* Payment Routes */}
    <Route path="payments/subscriptions" element={<PaidSubcriptions />} />
    <Route path="payments/ebooks" element={<PaidEbooks />} />
    <Route path="payments/banners" element={<PaidBanner />} />
    <Route path="payments/coupons" element={<PaidRedeem />} />
    
    {/* Plans Routes */}
    <Route path="plans/subscriptions" element={<PlanSubcriptions />} />
    <Route path="plans/banners" element={<PlansBanner />} />
    <Route path="plans/ebooks" element={<PlansEbook />} />
    <Route path="plans/trust-seal-requests/:requestId?" element={<TrustSealRequestsPage />} />
    <Route path="plans/common-subscriptions" element={<CommonSubscriptionPlan/>} />
    
    {/* Category Routes */}
    <Route path="categories/main" element={<MainCategories />} />
    <Route path="categories/sub" element={<SubCategories />} />
    <Route path="categories/super-sub" element={<SuperSubCategories />} />
    <Route path="categories/deep-sub" element={<DeepSubCategories />} />
    <Route path="categories/products" element={<Products />} />
    
    {/* grocery seller*/ }
    <Route path="grocery-sellers" element={<GrocerySellerList />} />
    {/* Other Routes */}
    <Route path="others/post-requirement" element={<PostRequirement />} />
    <Route path="others/faq" element={<FAQ />} />
    <Route path="others/complaint" element={<Complaint />} />
    <Route path="others/testimonial" element={<Testimonial />} />

    <Route path="others/post-requirement" element={<PostRequirementAdminPanel />} />
    <Route path="others/faq" element={<FAQ />} />
    <Route path="others/complaint" element={<Complaint />} />
    <Route path="others/testimonial" element={<Testimonial />} />
    <Route path="others/wallet" element={<RedeemRequest />} />

    <Route path="permissions"  element={<Permission />}/>
    <Route path="permission-request"  element={<PermissionRequest />}/>

  </Route>
);

export default AdminRoutes;