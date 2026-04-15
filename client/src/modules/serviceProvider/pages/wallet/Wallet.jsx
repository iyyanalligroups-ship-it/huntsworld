import { useContext, useState } from 'react';
import { useGetCouponsQuery } from '@/redux/api/couponsNotificationApi';
import { useGetUserByIdQuery } from '@/redux/api/SubDealerApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import RedeemPointsForm from './RedeemPointsForm';
import showToast from '@/toast/showToast';
import { Loader2, Wallet, Info } from 'lucide-react';
import { useSidebar } from '@/modules/admin/hooks/useSidebar';
import { AuthContext } from '@/modules/landing/context/AuthContext';

const WalletPage = ({ merchantId }) => {
  const { isSidebarOpen } = useSidebar();
  const [openRedeemDialog, setOpenRedeemDialog] = useState(false);
  const { user } = useContext(AuthContext);

  const { data: merchantData, isLoading, isError } = useGetUserByIdQuery(user?.user?._id);
  const merchant = merchantData?.user || { name: 'N/A', email: 'N/A', phone: 'N/A', wallet_points: 0 };

  const { data: couponsData, isLoading: couponsLoading } = useGetCouponsQuery();

  // === CONFIG: Same as common wallet ===
  const MIN_REDEEM_POINTS = 2500;     // Unlock redeem
  const MIN_WITHDRAWAL = 500;          // Click redeem
  // =====================================

  const hasEnoughToRedeem = merchant.wallet_points >= MIN_REDEEM_POINTS;
  const canClickRedeem = merchant.wallet_points >= MIN_WITHDRAWAL;

  const handleRedeemSuccess = () => {
    setOpenRedeemDialog(false);
    showToast('Points redeemed successfully', 'success');
  };

  return (
    <div className={`${isSidebarOpen ? 'p-6 lg:ml-56' : 'p-4 lg:ml-16'} transition-all duration-300`}>
      {/* Title */}
      <h2 className="text-md border-1 border-[#0c1f4d] text-[#0c1f4d] bg-gray-100 p-2 rounded-r-2xl w-52 font-bold inline-block mb-6">
        Service Provider Wallet
      </h2>

      <div className="max-w-7xl mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="ml-2">Loading wallet details...</p>
          </div>
        ) : isError ? (
          <p className="text-red-500 text-center">Failed to load wallet details</p>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Wallet Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Merchant Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Name</p>
                  <p className="text-sm text-muted-foreground">{merchant.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{merchant.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Phone Number</p>
                  <p className="text-sm text-muted-foreground">{merchant.phone || 'N/A'}</p>
                </div>

                {/* Wallet Points */}
                <div className="flex items-center gap-4 p-4 rounded-2xl shadow-md bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
                  <div className="bg-white/20 p-2 rounded-full">
                    <Wallet className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold tracking-wide uppercase">Wallet Points</p>
                    <p className="text-xl font-bold">{merchant.wallet_points ?? 0}</p>
                  </div>
                </div>
              </div>

              {/* === INFO BANNER === */}
              <div className={`flex items-start gap-2 p-3 rounded-lg border-l-4 text-sm ${
                hasEnoughToRedeem 
                  ? 'bg-green-50 border-green-500 text-green-800' 
                  : 'bg-amber-50 border-amber-500 text-amber-800'
              }`}>
                <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">
                    To redeem points, you must reach at least <strong>{MIN_REDEEM_POINTS} points</strong>.
                  </p>
                  <p className="mt-1">
                    Minimum withdrawal amount is <strong>{MIN_WITHDRAWAL} points</strong>.
                  </p>
                  {!hasEnoughToRedeem && (
                    <p className="mt-2 text-xs">
                      You need <strong>{MIN_REDEEM_POINTS - merchant.wallet_points}</strong> more points to unlock redemption.
                    </p>
                  )}
                </div>
              </div>

              {/* === SMART REDEEM BUTTON === */}
              <Button
                className={`w-full text-sm py-2 rounded transition ${
                  canClickRedeem
                    ? 'bg-[#0c1f4d] hover:bg-[#0c1f4dd0] text-white cursor-pointer'
                    : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                }`}
                onClick={() => setOpenRedeemDialog(true)}
                disabled={!canClickRedeem}
              >
                {canClickRedeem 
                  ? 'Redeem Points' 
                  : `Need ${MIN_WITHDRAWAL} points to redeem`
                }
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Redeem Dialog */}
        <Dialog open={openRedeemDialog} onOpenChange={setOpenRedeemDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Redeem Points</DialogTitle>
            </DialogHeader>
            {couponsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
                <p className="ml-2">Loading coupons...</p>
              </div>
            ) : (
              <RedeemPointsForm
                merchantId={merchantId}
                coupons={couponsData?.data || []}
                walletPoints={merchant.wallet_points}
                onSuccess={handleRedeemSuccess}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default WalletPage;