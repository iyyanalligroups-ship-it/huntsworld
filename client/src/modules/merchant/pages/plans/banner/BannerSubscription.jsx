import { useState, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '@/modules/landing/context/AuthContext';
import { useGetActiveBannerQuery, useCheckUserSubscriptionAndPlanQuery } from '@/redux/api/BannerPaymentApi';
import { toast } from 'react-toastify';
import BannerDetailsManagement from './BannerDetailsManagement'; // This now includes plan management
import Loader from '@/loader/Loader';

const BannerSubscription = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const { data: subscriptionData, isLoading: isSubscriptionLoading } = useCheckUserSubscriptionAndPlanQuery(
    user?.user?._id,
    { skip: !user?.user?._id }
  );

  const {
    data: activeBannerData,
    isLoading: isBannerLoading,
    isFetching,
    refetch,
  } = useGetActiveBannerQuery(user?.user?._id, {
    skip: !user?.user?._id,
  });

  const handleBannerDataRefresh = async () => {
    try {
      await refetch();
    } catch (error) {
      console.error('Refresh failed:', error);
      toast.error('Failed to refresh banner data');
    }
  };

  const hasSubscription = subscriptionData?.hasSubscription;
  const subscriptionId = subscriptionData?.subscriptionId;
  const isRoyal = subscriptionData?.isRoyal || false;
  const features = subscriptionData?.features || {};
  const activeBanner = activeBannerData?.banner;
  const activeBannerPayment = activeBannerData?.bannerPayment;
  const pendingBannerPayment = activeBannerData?.pendingBannerPayment;
  const tracking = activeBannerData?.tracking;
  const purchaseHistory = activeBannerData?.purchaseHistory;

  if (isBannerLoading || isFetching || isSubscriptionLoading || !user) {
    return (
      <Loader />
    );
  }

  // If no active subscription, redirect to subscribe
  if (!hasSubscription) {
    return (
      <div className="p-10 text-center bg-[#f0f4f6] rounded-xl">
        <h1 className="text-md border-1 border-[#0c1f4d] text-[#0c1f4d] bg-gray-100 p-2 rounded-r-2xl w-56 font-bold mb-6">
          Banner Adz Subscription
        </h1>
        <p className="text-red-600 text-lg mb-6">
          You need an active subscription to purchase or manage banner ads.
        </p>
        <Button
          className="bg-[#0c1f4d] hover:bg-[#0c1f4dcc] text-white text-lg px-8 py-6"
          onClick={() => navigate('/merchant/plans/subscription')}
        >
          Go to Subscription Plans
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 lg:px-0">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-md border-1 border-[#0c1f4d] text-[#0c1f4d] bg-gray-100 p-2 rounded-r-2xl w-56 font-bold mb-6">
            Banner Adz Subscription
          </h1>
          <p className="text-gray-700 mt-4 text-lg">
            Promote your business with premium banner ads — ₹20 per day + GST
          </p>

          {isRoyal && (
            <div className="mt-6 inline-block bg-green-100 text-green-800 font-bold px-8 py-4 rounded-full text-lg border-2 border-green-600">
              Royal Plan Active — Free Paid Banner Included!
            </div>
          )}
        </div>

        {/* Unified Banner Management Component */}
        <BannerDetailsManagement
          subscriptionId={subscriptionId}
          planCode={subscriptionData?.planCode}
          activeBanner={activeBanner}
          activeBannerPayment={activeBannerPayment}
          pendingBannerPayment={pendingBannerPayment}
          refetch={handleBannerDataRefresh}
          isRoyal={isRoyal}
          features={features}
          tracking={tracking}
          purchaseHistory={purchaseHistory}
        />

      </div>
    </div>
  );
};

export default BannerSubscription;
