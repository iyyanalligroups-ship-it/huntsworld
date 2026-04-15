import React, { useContext } from "react";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { useGetComplaintsBySupplierNumberAndTypeQuery, useGetMerchantByUserIdQuery } from "@/redux/api/ComplaintApi";
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
import { Loader2, AlertTriangle } from "lucide-react";

const ComplaintSummaryCard = () => {
  const { user } = useContext(AuthContext);

  // Log user data for debugging
  console.log("AuthContext user:", user);

  // Fetch merchant by user_id to get company_phone_number
  const { data: merchant, isLoading: isMerchantLoading, error: merchantError } = useGetMerchantByUserIdQuery(
    user?._id,
    { skip: !user?._id }
  );

  // Log merchant data for debugging
  console.log("Merchant data:", merchant);
  console.log("Merchant loading:", isMerchantLoading);
  console.log("Merchant error:", merchantError);

  // Fetch complaints using company_phone_number as supplier_number and type "type3"
  const { data: complaints, isLoading: isComplaintsLoading, error: complaintsError } = useGetComplaintsBySupplierNumberAndTypeQuery(
    {
      supplierNumber: merchant?.company_phone_number,
      type: "type3",
    },
    { skip: !merchant?.company_phone_number }
  );

  // Log complaints data for debugging
  console.log("Complaints data:", complaints);
  console.log("Complaints loading:", isComplaintsLoading);
  console.log("Complaints error:", complaintsError);

  // Define optionToLabel for fallback title
  const options = [
    { label: "Issue with BuyLead/Inquiry", value: "buylead_issue" },
    { label: "Account Activation and Deactivation", value: "account_status" },
    { label: "Account Related", value: "account_related" },
    { label: "IPR Dispute", value: "ipr_dispute" },
    { label: "Complaint of Buyer", value: "buyer_complaint" },
    { label: "Complaint of Supplier", value: "supplier_complaint" },
    { label: "Others", value: "others" },
  ];
  const optionToLabel = Object.fromEntries(
    options.map((opt) => [opt.value, opt.label])
  );

  if (!user || !user._id) {
    console.log("User check failed:", { user });
    return (
      <Card className="max-w-3xl mx-auto mt-6 border border-gray-200 shadow-sm">
        <CardContent className="p-6 text-center text-gray-600">
          Please log in with a valid account to view complaints.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <Card className="shadow-sm border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Complaint Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isMerchantLoading && (
            <div className="flex items-center justify-center py-10 text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading merchant data...
            </div>
          )}

          {merchantError && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <span>
                {merchantError.status === "FETCH_ERROR"
                  ? "Unable to connect to the server."
                  : merchantError.data?.message || "Failed to fetch merchant data"}
              </span>
            </div>
          )}

          {!isMerchantLoading && !merchantError && !merchant && (
            <p className="text-center text-gray-500 py-6">
              No merchant profile found for your account.
            </p>
          )}

          {isComplaintsLoading && merchant && (
            <div className="flex items-center justify-center py-10 text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading complaints...
            </div>
          )}

          {complaintsError && merchant && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <span>
                {complaintsError.status === "FETCH_ERROR"
                  ? "Unable to connect to the server."
                  : complaintsError.data?.message || "Failed to fetch complaints"}
              </span>
            </div>
          )}

          {!isComplaintsLoading && !complaintsError && complaints?.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Complaint ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {complaints.map((complaint) => (
                    <TableRow key={complaint._id}>
                      <TableCell className="font-mono text-sm">
                        {complaint._id}
                      </TableCell>
                      <TableCell>
                        {complaint.details?.title ||
                          optionToLabel[complaint.option] ||
                          "Untitled"}
                      </TableCell>
                      <TableCell>{complaint.type}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            complaint.details?.status === "Resolved"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {complaint.details?.status || "Pending"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Date(complaint.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {!isComplaintsLoading && !complaintsError && complaints?.length === 0 && merchant && (
            <p className="text-center text-gray-500 py-6">
              No complaints found for type3 and your supplier number.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ComplaintSummaryCard;