import React, { useContext } from "react";
import { 
  Receipt, 
  ArrowLeft, 
  Calendar, 
  BadgeIndianRupee, 
  CreditCard, 
  StickyNote, 
  History,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { useState } from "react";
import { useGetStudentPaymentHistoryQuery } from "@/redux/api/TrustSealRequestApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import moment from "moment";

const StudentPaymentHistory = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const userId = user?.user?._id;
  const [page, setPage] = useState(1);

  const { data: historyData, isLoading, isError } = useGetStudentPaymentHistoryQuery(
    { userId, page, limit: 10 },
    { skip: !userId }
  );

  const history = historyData?.data || [];
  const pagination = historyData?.pagination || {};

  const handleBack = () => navigate(-1);

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-20 w-full" />
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:ml-16 transition-all duration-300">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <History className="h-6 w-6 text-emerald-600" />
              </div>
              Payment History
            </h1>
            <p className="text-sm text-gray-500 ml-12">
              Track all verification payments received in your account.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleBack} className="w-fit flex gap-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
        </div>

        {/* Content */}
        {isError || !history || history.length === 0 ? (
          <Card className="border-dashed py-12">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <div className="bg-gray-100 p-4 rounded-full mb-4">
                <Receipt className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">No Payment Records</h3>
              <p className="text-gray-500 max-w-sm mt-2">
                You haven't received any payments for verifications yet. Once the admin records a payout, it will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4">
              {history.map((record) => (
                <Card key={record._id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    
                    {/* Left: Basic Info */}
                    <div className="flex items-start gap-4">
                      <div className="bg-slate-100 p-3 rounded-xl">
                        <BadgeIndianRupee className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Transaction ID</span>
                          <Badge variant="outline" className="text-[11px] font-mono bg-slate-50">
                            {record.transaction_id}
                          </Badge>
                        </div>
                        <h4 className="text-xl font-bold text-gray-900">
                          ₹{record.amount?.toLocaleString()}
                        </h4>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} className="text-gray-400" />
                            {moment(record.paid_at).format("DD MMM YYYY, hh:mm A")}
                          </span>
                          <span className="flex items-center gap-1">
                            <CreditCard size={14} className="text-gray-400" />
                            {record.payment_method}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Notes / Status */}
                    <div className="flex flex-col md:items-end gap-3 min-w-[200px]">
                      <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-100 px-3 py-1">
                        Successfully Paid
                      </Badge>
                      {record.notes && (
                        <div className="bg-amber-50/50 border border-amber-100/50 p-2 rounded-lg flex gap-2 max-w-md">
                          <StickyNote size={14} className="text-amber-500 shrink-0 mt-0.5" />
                          <p className="text-[11px] text-amber-700 line-clamp-2">
                           {record.notes}
                          </p>
                        </div>
                      )}
                    </div>

                  </div>
                </Card>
              ))}
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between py-4 border-t border-slate-100 mt-6">
                <p className="text-sm text-slate-500">
                  Showing page <span className="font-semibold text-slate-900">{pagination.currentPage}</span> of <span className="font-semibold text-slate-900">{pagination.totalPages}</span>
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.currentPage === 1}
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    className="h-9 px-4"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.currentPage === pagination.totalPages}
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    className="h-9 px-4"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Guidelines */}
        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex gap-4">
          <AlertCircle className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h5 className="text-sm font-bold text-blue-900">Payment Process</h5>
            <p className="text-xs text-blue-700 leading-relaxed">
              Payments are processed by the admin team after verifying your trust seal request completion. If you have questions regarding a transaction, please contact support with the Transaction ID.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default StudentPaymentHistory;
