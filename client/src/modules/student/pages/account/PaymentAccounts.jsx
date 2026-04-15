import { Wallet, ShieldCheck, ArrowLeft } from "lucide-react";
import PaymentAccountList from "./PaymentAccountList";
import PaymentSOP from "./PaymentSOPDialog";
import { useContext } from "react";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/modules/admin/hooks/useSidebar";
import Loader from "@/loader/Loader";

export default function PaymentAccounts() {
  const { user, isLoading: isAuthLoading } = useContext(AuthContext);
  const { isSidebarOpen } = useSidebar();
  const navigate = useNavigate();
  const userId = user?.user?._id;

  if (isAuthLoading) {
    return <Loader />;
  }

  return (
    <div className={`min-h-screen bg-transparent py-8 px-4 sm:px-6 lg:px-8 transition-all duration-300 ${isSidebarOpen ? "lg:ml-56" : "lg:ml-16"}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        <Button
          type="button"
          onClick={() => navigate(-1)}
          variant="outline"
          className="w-fit cursor-pointer flex gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Wallet className="h-6 w-6 text-[#0c1f4d]" />
              </div>
              Payment Settings
            </h1>
            <p className="text-sm text-gray-500 ml-12">
              Manage connected bank accounts and UPI details for payouts.
            </p>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* LEFT COLUMN: Account List (Takes 2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-6">
              <PaymentAccountList userId={userId} />
            </div>

            {/* Security Footer */}
            <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
              <ShieldCheck className="h-4 w-4" />
              <span>Your payment details are encrypted and stored securely.</span>
            </div>
          </div>

          {/* RIGHT COLUMN: SOP Guidelines (Takes 1/3 width) */}
          <div className="lg:col-span-1 sticky top-8">
            <PaymentSOP />
          </div>

        </div>
      </div>
    </div>
  );
}
