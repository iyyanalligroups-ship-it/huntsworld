import { useContext, useState, useEffect } from 'react';
import { useGetCouponsQuery } from '@/redux/api/couponsNotificationApi';
import { useGetUserByIdQuery } from '@/redux/api/SubDealerApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Import your two separate form components
import CashRedeemPointsForm from './CashRedeemPointsForm';
import CouponRedeemPointsForm from './CouponRedeemPointsForm';

import { Loader2, Wallet, Info, CheckCircle2, AlertTriangle, Banknote, ShieldAlert, ArrowLeft } from 'lucide-react';
import { useSidebar } from '@/modules/admin/hooks/useSidebar';
import { AuthContext } from '@/modules/landing/context/AuthContext';
import { motion } from "framer-motion";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import RedeemHistory from './RedeemHistory';
import Loader from '@/loader/Loader';

// --- SOP COMPONENT ---
const WalletSOP = () => {
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden lg:sticky lg:top-6">
      <div className="bg-[#0c1f4d] p-5 flex items-center gap-3">
        <div className="bg-white/20 p-2 rounded-lg text-white">
          <Banknote size={24} />
        </div>
        <div>
          <h3 className="text-white font-bold text-lg">Redemption Policy</h3>
          <p className="text-blue-200 text-xs">Standard Operating Procedure</p>
        </div>
      </div>

      <div className="p-5 space-y-6">
        <div className="relative pl-6 border-l-4 border-blue-600">
          <div className="absolute -left-[11px] top-0 bg-white text-blue-600 rounded-full">
            <CheckCircle2 size={20} fill="white" className="stroke-blue-600" />
          </div>
          <h3 className="font-bold text-sm text-[#0c1f4d]">Allowed Redemption Tiers</h3>
          <p className="text-xs text-gray-500 mt-1 mb-2">
            For security reasons, withdrawals are restricted to fixed point blocks only. You can select one of these amounts per request:
          </p>
          <div className="flex flex-wrap gap-2">
            {[2500, 5000, 7500, 10000].map(amt => (
              <span key={amt} className="text-xs font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100">
                {amt} Pts
              </span>
            ))}
          </div>
        </div>

        <div className="relative pl-6 border-l-4 border-green-600">
          <div className="absolute -left-[11px] top-0 bg-white text-green-600 rounded-full">
            <Wallet size={20} fill="white" className="stroke-green-600" />
          </div>
          <h3 className="font-bold text-sm text-[#0c1f4d]">Points to Cash Conversion</h3>
          <p className="text-xs text-gray-500 mt-1">
            Your points will be converted to <strong>INR (₹)</strong> based on the current point value configuration. The equivalent cash amount will be processed by the admin.
          </p>
        </div>

        <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
          <div className="flex items-start gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-amber-800">Pending Request Limit</h4>
              <p className="text-[11px] text-amber-700 mt-1 leading-relaxed">
                You cannot raise a new request if you already have a <strong>"Pending"</strong> status redemption. Please wait for the admin to Approve or Reject your current request first.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400 border-t pt-4">
          <Info size={14} />
          <span>Minimum Wallet Balance required: <strong>2500 Points</strong></span>
        </div>
      </div>
    </div>
  );
};

const WalletPage = ({ merchantId }) => {
  const { isSidebarOpen } = useSidebar();
  const [openRedeemDialog, setOpenRedeemDialog] = useState(false);
  const { user } = useContext(AuthContext);
  const [paymentBlocked, setPaymentBlocked] = useState(false);
  const [paymentErrorMessage, setPaymentErrorMessage] = useState("");
  const navigate = useNavigate();

  // Choice state: 'choice', 'cash', or 'coupon'
  const [selectionMode, setSelectionMode] = useState('choice');

  const { data: merchantData, isLoading, isError } = useGetUserByIdQuery(user?.user?._id);
  const merchant = merchantData?.user || { name: 'N/A', email: 'N/A', phone: 'N/A', wallet_points: 0 };

  const { data: couponsData, isLoading: couponsLoading } = useGetCouponsQuery();

  const MIN_REDEEM_POINTS = 2500;
  const EFFECTIVE_MIN_WITHDRAWAL = 2500;

  const hasEnoughToRedeem = merchant.wallet_points >= MIN_REDEEM_POINTS;
  const canClickRedeem = merchant.wallet_points >= EFFECTIVE_MIN_WITHDRAWAL;

  const handleRedeemSuccess = () => {
    setOpenRedeemDialog(false);
    setSelectionMode('choice'); // Reset mode for next time
  };

  const handleDialogChange = (open) => {
    setOpenRedeemDialog(open);
    if (!open) setSelectionMode('choice'); // Reset when closed
  };

  const checkStudentPaymentAccount = async (userId) => {
    return axios.get(
      `${import.meta.env.VITE_API_URL}/payment-accounts/check-student/${userId}`
    );
  };

  useEffect(() => {
    const checkPaymentOnLoad = async () => {
      const userId = user?.user?._id;
      if (!userId) return;

      try {
        await checkStudentPaymentAccount(userId);
      } catch (err) {
        const message = err?.response?.data?.message || "Please add payment details before redeeming coupons";
        setPaymentErrorMessage(message);
        setPaymentBlocked(true);
      }
    };
    checkPaymentOnLoad();
  }, [user]);

  return (
    <div className='relative'>
      <Button
        type="button"
        onClick={() => navigate(-1)}
        variant="outline"
        className="absolute cursor-pointer top-4 left-2 z-40 hidden md:flex gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Button>

      <div className='p-20'>
        {paymentBlocked && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm border-t-4 border-red-600">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 bg-red-100 rounded-full p-2">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">Payment Details Required</h3>
                    <p className="mt-2 text-sm text-gray-600">{paymentErrorMessage}</p>
                  </div>
                </div>
                <div className="mt-6">
                  <button
                    onClick={() => navigate("/account")}
                    className="w-full cursor-pointer inline-flex justify-center items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 transition-colors"
                  >
                    Add Payment Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-xl font-bold text-[#0c1f4d] flex items-center gap-2">
            <Wallet className="h-6 w-6" /> Merchant Wallet
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage your points and earnings</p>
        </div>

        {isLoading || !merchantData ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] w-full bg-white rounded-2xl shadow-sm border border-gray-100">
            <Loader contained={true} label="Loading wallet details..." />
          </div>
        ) : isError ? (
          <div className="bg-red-50 p-6 rounded-xl border border-red-200 text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-700 font-medium">Failed to load wallet data</p>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full lg:flex-1"
            >
              <Card className="border-0 shadow-lg overflow-hidden">
                <CardHeader className="bg-gray-50 border-b border-gray-100 pb-4">
                  <CardTitle className="text-lg text-[#0c1f4d]">Account Overview</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Account Name</p>
                      <p className="text-base font-medium text-gray-800 mt-1">{merchant.name}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Registered Email</p>
                      <p className="text-base font-medium text-gray-800 mt-1">{merchant.email}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Mobile Contact</p>
                      <p className="text-base font-medium text-gray-800 mt-1">{merchant.phone || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-[#0c1f4d] to-indigo-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden group">
                    <div className="absolute right-0 top-0 opacity-10 transform translate-x-10 -translate-y-10">
                      <Wallet size={150} />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                          <Wallet className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-medium text-blue-100">Total Balance</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold tracking-tight">{merchant.wallet_points?.toLocaleString() ?? 0}</span>
                        <span className="text-lg text-blue-200 font-medium">Points</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className={`p-4 rounded-xl border flex gap-3 ${hasEnoughToRedeem ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className={`mt-0.5 ${hasEnoughToRedeem ? 'text-green-600' : 'text-gray-400'}`}>
                        {hasEnoughToRedeem ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
                      </div>
                      <div className="flex-1">
                        <h4 className={`text-sm font-bold ${hasEnoughToRedeem ? 'text-green-800' : 'text-gray-700'}`}>
                          {hasEnoughToRedeem ? "You are eligible to redeem!" : "Redemption Locked"}
                        </h4>
                        {!hasEnoughToRedeem && (
                          <p className="text-xs text-gray-500 mt-1">
                            You need <strong>{MIN_REDEEM_POINTS - merchant.wallet_points}</strong> more points to reach the minimum requirement of {MIN_REDEEM_POINTS}.
                          </p>
                        )}
                        {hasEnoughToRedeem && (
                          <p className="text-xs text-green-700 mt-1">
                            You can redeem 2500, 5000, 7500, or 10000 points.
                          </p>
                        )}
                      </div>
                    </div>

                    <Button
                      className={`w-full py-6 text-base font-semibold shadow-md transition-all ${canClickRedeem ? 'bg-[#0c1f4d] hover:bg-[#0c204d] hover:shadow-lg' : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'}`}
                      onClick={() => setOpenRedeemDialog(true)}
                      disabled={!canClickRedeem}
                    >
                      {canClickRedeem ? 'Request Redemption' : 'Insufficient Balance'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="w-full lg:w-[350px] flex-shrink-0"
            >
              <WalletSOP />
            </motion.div>
          </div>
        )}
      </div>

      <Dialog open={openRedeemDialog} onOpenChange={handleDialogChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#0c1f4d]">
              {selectionMode === 'choice' ? 'Choose Redemption Method' : 'Redeem Wallet Points'}
            </DialogTitle>
          </DialogHeader>

          {selectionMode === 'choice' ? (
            <div className="grid grid-cols-2 gap-4 py-4">
              <Button
                variant="outline"
                className="h-32 flex flex-col gap-2 border-2 hover:border-[#0c1f4d] hover:bg-blue-50 transition-all"
                onClick={() => setSelectionMode('cash')}
              >
                <Banknote className="h-8 w-8 text-green-600" />
                <span className="font-bold">Redeem as Cash</span>
                <span className="text-[10px] text-gray-500 text-center">Direct Bank Transfer</span>
              </Button>

              <Button
                variant="outline"
                className="h-32 flex flex-col gap-2 border-2 hover:border-[#0c1f4d] hover:bg-blue-50 transition-all"
                onClick={() => setSelectionMode('coupon')}
              >
                <ShieldAlert className="h-8 w-8 text-blue-600" />
                <span className="font-bold">Redeem Coupon</span>
                <span className="text-[10px] text-gray-500 text-center">Merchant Vouchers</span>
              </Button>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectionMode('choice')}
                className="mb-4 text-gray-500 flex gap-1 items-center"
              >
                <ArrowLeft size={14} /> Back to choices
              </Button>

              {selectionMode === 'coupon' ? (
                <CouponRedeemPointsForm
                  merchantId={merchantId}
                  coupons={couponsData?.data || []}
                  walletPoints={merchant.wallet_points}
                  onSuccess={handleRedeemSuccess}
                />
              ) : (
                <CashRedeemPointsForm
                  merchantId={merchantId}
                  walletPoints={merchant.wallet_points}
                  onSuccess={handleRedeemSuccess}
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className='mt-4 p-20'>
        <RedeemHistory />
      </div>
    </div>
  );
};

export default WalletPage;