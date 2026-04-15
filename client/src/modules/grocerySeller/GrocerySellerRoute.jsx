import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import GrocerySellerLayout from "./GrocerySellerLayout";
import Referral from "./pages/referral/Referral";
import DistributionRequest from "./pages/distributors/distributorRequests";

/* -------------------- Lazy-loaded pages -------------------- */
const Requirement = lazy(() => import("./pages/requirements/Requirement"));
const Wallet = lazy(() => import("./pages/wallet/Wallet"));
const Settings = lazy(() => import("./pages/settings/Settings"));
const ChatPage = lazy(() => import("./pages/chat/pages/ChatPage"));
const Account =lazy(()=>import("./pages/account/PaymentAccounts"))
const FavoriteProduct = lazy(() =>
  import("./pages/favorite/favoriteProduct")
);
const Plan = lazy(() => import("./pages/plan/Subscription"));
/* -------------------- Loader -------------------- */
const PageLoader = () => (
  <div className="p-4 text-sm text-gray-500">Loading...</div>
);

const GrocerySellerRoute = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* ❗ NO path="/grocerySeller" here */}
        <Route element={<GrocerySellerLayout />}>
          <Route index element={<Settings />} />
           <Route path="distributors" element={<DistributionRequest />} />
          <Route path="requirement" element={<Requirement />} />
          <Route path="favorite" element={<FavoriteProduct />} />
                 <Route path="plans" element={<Plan />} />
          <Route path="wallet" element={<Wallet />} />
          <Route path="settings" element={<Settings />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="referral-list" element={<Referral />} />
          <Route path="account" element={<Account />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default GrocerySellerRoute;
