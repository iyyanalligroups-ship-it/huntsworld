import React, { useContext } from "react";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import {
  useGetComplaintsBySupplierNumberAndTypeQuery,
  useGetMerchantByUserIdQuery,
} from "@/redux/api/ComplaintApi";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, AlertTriangle, UserCheck, FileX, Building2 } from "lucide-react";

const ComplaintSummaryCard = () => {
  const { user } = useContext(AuthContext);

  // CORRECT FIX: Pass as object with key 'user_id' to match backend req.query.user_id
  const {
    data: merchant,
    isLoading: isMerchantLoading,
    error: merchantError,
  } = useGetMerchantByUserIdQuery(
    { user_id: user?.user?._id }, // ← This matches const { user_id } = req.query
    {
      skip: !user?.user?._id, // Skip query if no user ID
    }
  );

  const {
    data: complaints,
    isLoading: isComplaintsLoading,
    error: complaintsError,
  } = useGetComplaintsBySupplierNumberAndTypeQuery(
    {
      supplierNumber: merchant?.company_phone_number,
      type: "type3",
    },
    { skip: !merchant?.company_phone_number }
  );

  const options = [
    { label: "Issue with BuyLead/Inquiry", value: "buylead_issue" },
    { label: "Account Activation and Deactivation", value: "account_status" },
    { label: "Account Related", value: "account_related" },
    { label: "IPR Dispute", value: "ipr_dispute" },
    { label: "Complaint of Buyer", value: "buyer_complaint" },
    { label: "Complaint of Supplier", value: "supplier_complaint" },
    { label: "Others", value: "others" },
  ];
  const optionToLabel = Object.fromEntries(options.map((opt) => [opt.value, opt.label]));

  if (!user || !user?.user?._id) {
    return (
      <div className="p-4 max-w-7xl mx-auto">
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="py-16 text-center">
            <div className="bg-gray-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <AlertTriangle className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Not Logged In</h3>
            <p className="text-gray-600">Please log in to view complaint summary.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <Card className="shadow-sm border border-gray-200">
        <CardHeader className="border-b bg-gray-50/50">
          <CardTitle className="text-xl font-bold flex items-center gap-3">
            <Building2 className="w-6 h-6 text-[#0c1f4d]" />
            Complaint Summary (Supplier View)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Loading Merchant */}
          {isMerchantLoading && (
            <div className="text-center py-16">
              <Loader2 className="w-10 h-10 animate-spin text-[#0c1f4d] mx-auto mb-4" />
              <p className="text-gray-600">Loading your merchant profile...</p>
            </div>
          )}

          {/* Merchant Error */}
          {merchantError && (
            <div className="text-center py-12">
              <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md mx-auto">
                <AlertTriangle className="w-14 h-14 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-800 mb-2">Merchant Profile Error</h3>
                <p className="text-red-700 text-sm">
                  {merchantError.status === 404
                    ? "No merchant profile found for your account."
                    : merchantError.status === "FETCH_ERROR"
                    ? "Unable to connect to server."
                    : merchantError.data?.message || "Failed to load merchant data"}
                </p>
              </div>
            </div>
          )}

          {/* No Merchant Profile */}
          {!isMerchantLoading && !merchantError && !merchant && (
            <div className="text-center py-16">
              <div className="bg-gray-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <UserCheck className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Merchant Profile</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Your account is not linked to a supplier/merchant profile. Complaints cannot be fetched.
              </p>
            </div>
          )}

          {/* Loading Complaints */}
          {isComplaintsLoading && merchant && (
            <div className="text-center py-16">
              <Loader2 className="w-10 h-10 animate-spin text-[#0c1f4d] mx-auto mb-4" />
              <p className="text-gray-600">Fetching complaints against your business...</p>
            </div>
          )}

          {/* Complaints Error */}
          {complaintsError && merchant && (
            <div className="text-center py-12">
              <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md mx-auto">
                <AlertTriangle className="w-14 h-14 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-800 mb-2">Failed to Load Complaints</h3>
                <p className="text-red-700 text-sm">
                  {complaintsError.data?.message || "An error occurred while fetching complaints."}
                </p>
              </div>
            </div>
          )}

          {/* No Complaints Found */}
          {!isComplaintsLoading && !complaintsError && complaints?.length === 0 && merchant && (
            <div className="text-center py-16 px-6">
              <div className="bg-green-50 border-2 border-green-200 rounded-full w-28 h-28 mx-auto mb-6 flex items-center justify-center">
                <FileX className="w-14 h-14 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                No Complaints Received
              </h3>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Great job! No customers have raised any complaints against your business (Type 3).
                Keep up the excellent service!
              </p>
            </div>
          )}

          {/* Complaints Table */}
          {!isComplaintsLoading && !complaintsError && complaints?.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-bold">ID</TableHead>
                    <TableHead className="font-bold">Title</TableHead>
                    <TableHead className="font-bold">Type</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                    <TableHead className="font-bold">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {complaints.map((complaint) => (
                    <TableRow key={complaint._id} className="hover:bg-gray-50 transition-colors">
                      <TableCell className="font-mono text-xs text-gray-600">
                        {complaint._id.slice(-8).toUpperCase()}
                      </TableCell>
                      <TableCell className="font-medium">
                        {complaint.details?.title || optionToLabel[complaint.option] || "No Title"}
                      </TableCell>
                      <TableCell className="capitalize">
                        {complaint.type?.replace(/_/g, " ") || "N/A"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            complaint.details?.status === "Resolved"
                              ? "bg-green-100 text-green-800"
                              : complaint.details?.status === "In Progress"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {complaint.details?.status || "Pending"}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {new Date(complaint.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ComplaintSummaryCard;
