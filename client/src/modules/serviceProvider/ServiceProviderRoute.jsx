import React from 'react';
import { Route } from 'react-router-dom';
import Dashboard from './pages/dashboard/Dashboard';
import Products from './pages/products/Products';

import Reviews from './pages/others/Reviews';
import Queries from './pages/others/Queries';
import Wallet from './pages/wallet/Wallet';
import Settings from './pages/settings/Settings';
import PlanSubscription from './pages/plans/PlanSubscription';
import Banner from './pages/plans/Banner';
import Trending from './pages/plans/Trending';
import Ebook from './pages/plans/Ebook';
import ServiceProviderLayout from './ServiceProviderLayout';
import ChatPage from './pages/chat/pages/ChatPage';
import SubDealerPage from './pages/branches/SubDealerPage';
import TrustSealSubscription from './pages/plans/trust-seal/TrustSealSubscription';
import SEARequirement from './pages/sea-requirement/SEARequirement';
import BuyLeads from './pages/buyleads/BuyLeads';
import ProductLeads from './pages/sea-requirement/ProductLeads';
import UpgradePlanPage from './pages/plans/subcription/UpgradePlanPage';
import GlobalNotificationBell from './pages/globalNotification/GlobalNotificationBell';
import PhoneNumberAccessDetail from './pages/globalNotification/PhoneNumberAccessDetail';
import GrocerySellerRequirement from './pages/sea-requirement/GrocerySellerRequirement';

const ServiceProviderRoute = (
  <Route path="/service" element={<ServiceProviderLayout />}>
    <Route index element={<Dashboard />} />
    <Route path="dashboard" element={<Dashboard />} />
    <Route path="products" element={<Products />} />
    <Route path="branches" element={<SubDealerPage />} />
    <Route path="others/reviews" element={<Reviews />} />
    <Route path="others/queries" element={<Queries />} />
    <Route path="others/buy-leads" element={<BuyLeads />} />
    <Route path="wallet" element={<Wallet />} />
    <Route path="settings" element={<Settings />} />
    <Route path="plans/subscription" element={<PlanSubscription />} />
    <Route path="plans/banner" element={<Banner />} />
    <Route path="plans/trending" element={<Trending />} />
    <Route path="plans/ebook" element={<Ebook />} />
    <Route path="plans/upgrade-plan" element={<UpgradePlanPage />} />
    <Route path="service-chat" element={<ChatPage />} />
    <Route path="sea-requirement" element={< SEARequirement />} />
    <Route path="grocery-seller-requirement" element={< GrocerySellerRequirement />} />
    <Route path="plans/trust-seal/:requestId?" element={<TrustSealSubscription />} />
    <Route path="product-leads" element={<ProductLeads />} />
    <Route path="notifications/phone-number-access" element={<GlobalNotificationBell  />} />
    <Route path="notifications/phone-number-access/:id" element={<PhoneNumberAccessDetail />} />
  </Route>
);

export default ServiceProviderRoute;
