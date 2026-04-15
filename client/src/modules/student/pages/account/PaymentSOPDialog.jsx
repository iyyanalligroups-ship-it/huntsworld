import { AlertTriangle, CheckCircle2, Wallet, Landmark, Smartphone } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const PaymentSOP=()=> {
  return (
    <Card className="bg-gray-50/50 border-gray-200">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2 text-[#0c1f4d]">
          <Wallet className="h-5 w-5" />
          Payment & Payout Guidelines
        </CardTitle>
        <CardDescription>
          Standard Operating Procedure (SOP) for payouts.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 text-sm text-gray-700">

        {/* Critical Alert Box */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 items-start">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-amber-800">Critical Information</h4>
            <p className="text-amber-700 mt-1 text-xs sm:text-sm">
              The account set as <strong>"Default"</strong> is where <strong>Coupon Redemption</strong> amounts will be transferred. Ensure details are 100% correct.
            </p>
          </div>
        </div>

        {/* Step 1: Purpose */}
        <section className="space-y-2">
          <h3 className="font-semibold text-gray-900 border-b pb-1">1. Purpose</h3>
          <p>
            Link your Bank Account or UPI ID to receive payouts. When you redeem a customer's coupon, the amount is processed to these details.
          </p>
        </section>

        {/* Step 2: Adding Details */}
        <section className="space-y-3">
          <h3 className="font-semibold text-gray-900 border-b pb-1">2. Payment Methods</h3>
          <div className="space-y-3">
            <div className="bg-white p-3 rounded border shadow-sm">
              <div className="flex items-center gap-2 font-semibold mb-1 text-blue-700 text-xs uppercase">
                <Landmark className="h-3.5 w-3.5" /> Bank Transfer
              </div>
              <ul className="list-disc pl-4 space-y-1 text-gray-600 text-xs">
                <li>Account Holder Name</li>
                <li>Account Number</li>
                <li>IFSC Code</li>
              </ul>
            </div>
            <div className="bg-white p-3 rounded border shadow-sm">
              <div className="flex items-center gap-2 font-semibold mb-1 text-purple-700 text-xs uppercase">
                <Smartphone className="h-3.5 w-3.5" /> UPI Transfer
              </div>
              <ul className="list-disc pl-4 space-y-1 text-gray-600 text-xs">
                <li>UPI ID (e.g., user@okicici)</li>
                <li>UPI Mobile Number</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Step 3: Setting Default */}
        <section className="space-y-2">
          <h3 className="font-semibold text-gray-900 border-b pb-1">3. Active Account</h3>
          <div className="flex items-start gap-3 mt-3 bg-blue-50 p-3 rounded-md border border-blue-100">
            <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-blue-800 text-xs sm:text-sm">
              You must click <strong>"Make Default"</strong> on your preferred card. The system only transfers funds to the account with the green <strong>Active</strong> badge.
            </p>
          </div>
        </section>

        {/* Step 4: Timeline */}
        <section className="space-y-2">
          <h3 className="font-semibold text-gray-900 border-b pb-1">4. Timeline</h3>
          <p>
            Payouts are usually processed within <strong>24-48 business hours</strong> after redemption.
          </p>
        </section>

      </CardContent>
    </Card>
  );
}

export default PaymentSOP;
