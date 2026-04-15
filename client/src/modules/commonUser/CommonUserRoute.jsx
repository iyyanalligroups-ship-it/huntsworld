import React from 'react';
import { Route } from 'react-router-dom';
import CommonUserLayout from './CommonUserLayout';
import Dashboard from './pages/dashboard/Dashboard';
import Wallet from './pages/wallet/Wallet';
import Settings from './pages/settings/Settings';
import FavoriteProduct from './pages/favorite/favoriteProduct'
import MyRequirement from '@/staticPages/MyRequirements';



const CommonUserRoute = (
  <Route path="/user" element={<CommonUserLayout />}>
    <Route index element={<Dashboard />} />
    <Route path="dashboard" element={<Dashboard />} />
    <Route path="favorite" element={<FavoriteProduct />} />
    <Route path="wallet" element={<Wallet />} />
    <Route path="settings" element={<Settings />} />
    <Route path="my-requirements" element={<MyRequirement />} />


  </Route>
);

export default CommonUserRoute;
