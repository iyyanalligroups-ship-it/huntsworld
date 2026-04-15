import React from 'react';
import { Route } from 'react-router-dom';
import Dashboard from './pages/dashboard/Dashboard';
import VerificationList from './pages/verification/VerificationList';
import Wallet from './pages/wallet/Wallet';
import Settings from './pages/settings/Settings';
import StudentLayout from './StudentLayout';
import FavoriteProduct from './pages/favorite/FavoriteProduct';
import MyRequirement from '@/staticPages/MyRequirements';
import StudentPaymentHistory from './pages/paymentHistory/StudentPaymentHistory';

const StudentRoute = (
  <Route path="/student" element={<StudentLayout />}>
    <Route index element={<Dashboard />} />
    <Route path="dashboard" element={<Dashboard />} />
    <Route path="verification-list" element={<VerificationList />} />
    <Route path="wallet" element={<Wallet />} />
    <Route path="payment-history" element={<StudentPaymentHistory />} />
    <Route path="favorite" element={<FavoriteProduct />} />
    <Route path="settings" element={<Settings />} />
    <Route path="my-requirements" element={<MyRequirement />} />
  </Route>
);

export default StudentRoute;
