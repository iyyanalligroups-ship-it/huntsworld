import { useState, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '@/modules/landing/context/AuthContext';
import { useGetActiveBannerQuery, useCheckUserSubscriptionAndPlanQuery } from '@/redux/api/BannerPaymentApi';
import BannerPlanManagement from './BannerPlanManagement';
import BannerDetailsManagement from './BannerDetailsManagement';

const BannerSubscription = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { data: subscriptionData, isLoading: isSubscriptionLoading } = useCheckUserSubscriptionAndPlanQuery(user?.user?._id, {
    skip: !user?.user?._id,
  });
  const {
    data: activeBannerData,
    isLoading: isBannerLoading,
    isFetching,
    error,
    refetch,
  } = useGetActiveBannerQuery(user?.user?._id, {
    skip: !user?.user?._id,
  });

  const handleBannerDataRefresh = async () => {
    try {
      const refetchResponse = await refetch();
      console.log('handleBannerDataRefresh refetch response:', refetchResponse);
      console.log('Active banner data after refetch:', activeBannerData);
    } catch (error) {
      console.error('handleBannerDataRefresh failed:', error);
      toast.error('Failed to refresh banner data');
    }
  };

  console.log('Banner Query States:', { isBannerLoading, isFetching, error, userId: user?.user?._id, data: activeBannerData });
  console.log('Subscription Check:', { hasSubscription: subscriptionData?.hasSubscription, subscriptionId: subscriptionData?.subscriptionId, isRoyal: subscriptionData?.isRoyal, isSubscriptionLoading });
  console.log('User Data:', { userId: user?.user?._id });

  const hasSubscription = subscriptionData?.hasSubscription;
  const subscriptionId = subscriptionData?.subscriptionId;
  const isRoyal = subscriptionData?.isRoyal || false;
  const activeBanner = activeBannerData?.banner;
  const activeBannerPayment = activeBannerData?.bannerPayment;

  if (isBannerLoading || isFetching || isSubscriptionLoading || !user) {
    return (
      <div className="flex justify-center items-center p-6 bg-[#f0f4f6] rounded-xl">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#0c1f4d]"></div>
        <span className="ml-3 text-gray-700 text-lg font-medium">Loading banner subscription...</span>
      </div>
    );
  }

  if (!hasSubscription) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-3xl font-bold text-[#0c1f4d]">Banner Ad Subscription</h2>
        <p className="text-red-600 mt-4">
          No active subscription found. Please subscribe first to purchase a banner ad.
        </p>
        <Button
          className="bg-[#0c1f4d] hover:bg-[#0c1f4dcc] text-white mt-4"
          onClick={() => navigate('/subscribe')}
        >
          Go to Subscription
        </Button>
      </div>
    );
  }

  return (
    <div className="lg:p-6">
      <div className="text-center mb-10">
      <h1 className="text-md border-1 border-[#0c1f4d] text-[#0c1f4d] bg-gray-100 p-2 rounded-r-2xl w-56 font-bold">Banner Adz Subscription</h1>
       
        <p className="text-gray-600 mt-2">Purchase a banner ad to promote your business. Cost: ₹20 per day.</p>
        {!hasSubscription && (
          <p className="text-red-600 mt-2">You need an active subscription to purchase a banner ad.</p>
        )}
        {isRoyal && (
          <p className="text-green-600 mt-2">Royal Plan: You can upload both banner image and rectangle logo for free!</p>
        )}
      </div>
      {!isRoyal && (
        <BannerPlanManagement
          user={user}
          hasSubscription={hasSubscription}
          subscriptionId={subscriptionId}
          activeBannerPayment={activeBannerPayment}
          pendingBannerPayment={activeBannerData?.pendingBannerPayment}
          onRefresh={handleBannerDataRefresh}
          isRoyal={isRoyal}
        />
      )}
      <BannerDetailsManagement
        user={user}
        subscriptionId={subscriptionId}
        activeBanner={activeBanner}
        activeBannerPayment={activeBannerPayment}
        pendingBannerPayment={activeBannerData?.pendingBannerPayment}
        refetch={handleBannerDataRefresh}
        isRoyal={isRoyal}
      />
    </div>
  );
};

export default BannerSubscription;