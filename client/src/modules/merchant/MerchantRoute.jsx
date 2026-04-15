import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import MerchantLayout from "./MerchantLayout";
import DistributionUnitPage from "./pages/distributors/DistributionUnitPage";
import Referral from "./pages/referral/Referral";
import TopListingSubscription from "./pages/toplisting/TopListingSubscription";
import RedeemHistory from "./pages/wallet/RedeemHistory";
import TopListingProducts from "./pages/toplisting/TopListingProducts";

const MyRequirement = lazy(() => import('@/staticPages/MyRequirements'));
const PaymentHistory = lazy(() => import("./pages/payment-history/PaymentHistroy"));
const Dashboard = lazy(() => import("./pages/dashboard/Dashboard"));
const Products = lazy(() => import("./pages/products/Products"));
const Branches = lazy(() => import("./pages/branches/SubDealerPage"));
const SEARequirement = lazy(() => import("./pages/sea-requirement/SEARequirement"));
const AskPriceList = lazy(() => import("./pages/askPrice/AskPriceList"));
const ProductLeads = lazy(() => import("./pages/sea-requirement/ProductLeads"));
const GrocerySellerRequirement = lazy(() =>
  import("./pages/sea-requirement/GrocerySellerRequirement")
);
const Reviews = lazy(() => import("./pages/others/Reviews"));
const Queries = lazy(() => import("./pages/others/Queries"));
const BuyLeads = lazy(() => import("./pages/buyleads/BuyLeads"));
const Wallet = lazy(() => import("./pages/wallet/Wallet"));
const Settings = lazy(() => import("./pages/settings/Settings"));
const FavoriteProduct = lazy(() =>
  import("./pages/favorite/favoriteProduct")
);

const PlanSubscription = lazy(() => import("./pages/plans/Subscription"));
const UpgradePlanPage = lazy(() =>
  import("./pages/plans/subcription/UpgradePlanPage")
);
const PlanBanner = lazy(() => import("./pages/plans/Banner"));
const PlanTrending = lazy(() => import("./pages/plans/Trending"));
const PlanEbook = lazy(() => import("./pages/plans/Ebook"));
const TrustSealSubscription = lazy(() =>
  import("./pages/plans/trust-seal/TrustSealSubscription")
);

const ChatPage = lazy(() => import("./pages/chat/pages/ChatPage"));
const GlobalNotificationsPage = lazy(() =>
  import("./pages/globalNotification/GlobalNotificationsPage")
);
const PhoneNumberAccessDetail = lazy(() =>
  import("./pages/globalNotification/PhoneNumberAccessDetail")
);

const PageLoader = () => (
  <div className="p-4 text-sm text-gray-500">Loading...</div>
);

export default function MerchantRoute() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* IMPORTANT: NO path="/merchant" here */}
        <Route element={<MerchantLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="branches" element={<Branches />} />
          <Route path="sea-requirement" element={<SEARequirement />} />
          <Route
            path="grocery-seller-requirement"
            element={<GrocerySellerRequirement />}
          />
          <Route path="product-leads" element={<ProductLeads />} />
          <Route path="ask-price-leads" element={<AskPriceList />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="queries" element={<Queries />} />
          <Route path="buy-leads" element={<BuyLeads />} />
          <Route path="wallet" element={<Wallet />} />
          <Route path="settings" element={<Settings />} />
          <Route path="merchant-chat" element={<ChatPage />} />
          <Route path="favorite" element={<FavoriteProduct />} />
          <Route path="my-requirements" element={<MyRequirement />} />
          <Route path="distribution-unit" element={<DistributionUnitPage />} />
          <Route path="referral-list" element={<Referral />} />
          <Route path="redeem-history" element={<RedeemHistory />} />
          {/* Plans */}
          <Route path="plans/subscription" element={<PlanSubscription />} />
          <Route path="plans/upgrade-plan" element={<UpgradePlanPage />} />
          <Route path="plans/banner" element={<PlanBanner />} />
          <Route path="plans/trending" element={<PlanTrending />} />
          <Route path="plans/e-book" element={<PlanEbook />} />
          <Route path="plans/top-listing-plan" element={<TopListingSubscription />} />
          <Route path="plans/top-listing-products" element={<TopListingProducts />} />
          <Route path="payment-history" element={<PaymentHistory />} />
          <Route
            path="plans/trust-seal/:requestId?"
            element={<TrustSealSubscription />}
          />

          {/* Notifications */}
          <Route
            path="notifications/phone-number-access"
            element={<GlobalNotificationsPage />}
          />
          <Route
            path="notifications/phone-number-access/:id"
            element={<PhoneNumberAccessDetail />}
          />
        </Route>
      </Routes>
    </Suspense>
  );
}
