import React, { useState, useContext } from "react";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { useGetComplaintsQuery } from "@/redux/api/ComplaintApi";
import ComplaintForm from "./ComplaintForm";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, AlertTriangle, Loader2 } from "lucide-react";

const MyQueries = () => {
  const [selectedOption, setSelectedOption] = useState("");
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const { user } = useContext(AuthContext);

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

  const { data: complaints, isLoading, error } = useGetComplaintsQuery(
    {
      userId: user?.user?._id,
      value: selectedOption || "",
    },
    { skip: !user?.user?._id }
  );

  const handleSelectChange = (value) => setSelectedOption(value);
  const handleAddComplaint = () => setShowComplaintForm(true);
  const handleCancel = () => setShowComplaintForm(false);

  if (!user || !user.user) {
    return (
      <Card className="max-w-4xl mx-auto mt-6 sm:mt-10 border border-gray-200 shadow-sm">
        <CardContent className="p-4 sm:p-6 text-center text-gray-600">
          Please log in to view complaints.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="p-2 sm:p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header Section */}
                              <h2 className="text-md border-1 border-[#0c1f4d] text-[#0c1f4d] bg-gray-100 p-2  rounded-r-2xl w-44 font-bold">My Complaints</h2>

      <div className="flex flex-col gap-4 mb-4 sm:mb-6 p-2">
        {/* Filter Row - Stacked on mobile, side-by-side on desktop */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:gap-4 w-full">
          <div className="w-full sm:w-64 mb-4 sm:mb-0">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Filter Complaints
            </label>
            <Select onValueChange={handleSelectChange} value={selectedOption}>
              <SelectTrigger className="w-full border-gray-300">
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleAddComplaint}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#0c1f4d] hover:bg-[#0c1f4d] text-white px-6 py-2 sm:py-3"
          >
            <PlusCircle className="w-4 h-4" />
            Add Complaint
          </Button>
        </div>
      </div>

      {/* Complaint Form */}
      {showComplaintForm && (
        <div className="mb-4 sm:mb-6">
          <ComplaintForm onCancel={handleCancel} />
        </div>
      )}

      {/* Complaints Card */}
      <Card className="shadow-sm border border-gray-200 w-full">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-base sm:text-lg font-semibold">
            My Complaints
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {isLoading && (
            <div className="flex items-center justify-center py-8 sm:py-10 text-gray-500">
              <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin mr-2" />
              <span className="text-sm sm:text-base">Loading complaints...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="text-sm sm:text-base">
                {error.status === "FETCH_ERROR"
                  ? "Unable to connect to the server."
                  : error.data?.message || "Failed to fetch complaints"}
              </span>
            </div>
          )}

          {!isLoading && !error && complaints?.length > 0 && (
            <div className="overflow-x-auto">
              {/* Mobile Card Layout */}
              <div className="sm:hidden space-y-3">
                {complaints.map((complaint) => (
                  <div
                    key={complaint._id}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-medium text-gray-500">
                        ID: {complaint._id.slice(-6)}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          complaint.details?.status === "Resolved"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {complaint.details?.status || "Pending"}
                      </span>
                    </div>
                    <h4 className="font-semibold text-sm mb-1">
                      {complaint.details?.title ||
                        optionToLabel[complaint.option] ||
                        "Untitled"}
                    </h4>
                    <p className="text-xs text-gray-600 mb-2">
                      Type: <span className="font-medium">{complaint.type}</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(complaint.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>

              {/* Desktop Table Layout */}
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#0c1f4d] hover:bg-[#0c1f4d] text-white ">
                      <TableHead className="w-20 text-white">ID</TableHead>
                      <TableHead className="w-[200px] text-white">Title</TableHead>
                      <TableHead className="text-white">Type</TableHead>
                      <TableHead className="w-24 text-white">Status</TableHead>
                      <TableHead className="w-32 text-white">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {complaints.map((complaint) => (
                      <TableRow key={complaint._id} className="hover:bg-gray-50">
                        <TableCell className="font-mono text-xs">
                          {complaint._id.slice(-6)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {complaint.details?.title ||
                            optionToLabel[complaint.option] ||
                            "Untitled"}
                        </TableCell>
                        <TableCell className="text-sm">{complaint.type}</TableCell>
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
                        <TableCell className="text-sm">
                          {new Date(complaint.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {!isLoading && !error && complaints?.length === 0 && (
            <div className="text-center py-8 sm:py-12">
              <p className="text-sm sm:text-base text-gray-500">
                No complaints found for the selected filter.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MyQueries;