import React, { useState, useContext } from "react";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { useGetComplaintsQuery } from "@/redux/api/ComplaintApi";
import Loader from "@/loader/Loader";
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
import {
  PlusCircle,
  AlertTriangle,
  Loader2,
  FileText,
  Search,
  ChevronDown,
  ChevronUp,
  Info
} from "lucide-react";

const MyQueries = () => {
  const [selectedOption, setSelectedOption] = useState("");
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
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

  const {
    data: complaints,
    isLoading,
    error,
  } = useGetComplaintsQuery(
    {
      userId: user?.user?._id,
      value: selectedOption || "",
    },
    { skip: !user?.user?._id }
  );

  const handleSelectChange = (value) => {
    setSelectedOption(value === "all" ? "" : value);
  };

  const handleAddComplaint = () => setShowComplaintForm(true);
  const handleCancel = () => setShowComplaintForm(false);

  const toggleExpand = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const getStatusDisplay = (status) => {
    switch (status) {
      case "solved":
        return { label: "Resolved", color: "bg-green-100 text-green-800" };
      case "in_process":
        return { label: "In Progress", color: "bg-blue-100 text-blue-800" };
      default:
        return { label: "Pending", color: "bg-yellow-100 text-yellow-800" };
    }
  };

  if (!user || !user.user) {
    return (
      <Card className="max-w-3xl mx-auto mt-10 border border-gray-200 shadow-sm">
        <CardContent className="p-10 text-center">
          <div className="bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-gray-600 text-lg">
            Please log in to view your complaints.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="text-md border-1 border-[#0c1f4d] text-[#0c1f4d] bg-gray-100 p-2 rounded-r-2xl w-56 font-bold mb-6">
        Queries & Complaints
      </h1>
      <p className="text-sm text-muted-foreground">
        Submit and track your product inquiries or service requirements.
      </p>
      {/* --- SOP SECTION START --- */}
      <div className="bg-[#f8faff] border border-blue-100 rounded-xl p-4 flex gap-4 max-w-2xl shadow-sm">
        <div className="bg-blue-100 p-2 rounded-full h-fit">
          <Info className="w-5 h-5 text-[#0c1f4d]" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-[#0c1f4d]">SOP: Managing Your Requests</h4>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[12px] text-gray-600">
            <li className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
              Click a row to expand full details & attachments.
            </li>
            <li className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
              Check "Status" for real-time progress updates.
            </li>
            <li className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
              Use "Filter" to categorize service vs products.
            </li>
            <li className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
              Standard response time: 24-48 business hours.
            </li>
          </ul>
        </div>
      </div>
      {/* --- SOP SECTION END --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="w-full sm:w-64">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Type
          </label>
          <Select onValueChange={handleSelectChange} value={selectedOption}>
            <SelectTrigger className="w-full border-2 border-slate-300">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
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
          className="flex items-center gap-2 bg-[#0c1f4d] cursor-pointer hover:bg-[#0c204df3] text-white"
        >
          <PlusCircle className="w-5 h-5" />
          Raise New Complaint
        </Button>
      </div>

      {showComplaintForm && (
        <div className="mb-8">
          <ComplaintForm onCancel={handleCancel} />
        </div>
      )}

      {isLoading && <Loader contained={true} />}

      <Card className="shadow-sm border border-gray-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#0c1f4d]" />
            My Complaints
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="text-center py-12">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                <p className="text-red-700 font-medium">
                  {error.status === "FETCH_ERROR"
                    ? "Unable to connect to server"
                    : error.data?.message || "Failed to load complaints"}
                </p>
              </div>
            </div>
          )}

          {!isLoading && !error && complaints?.length === 0 && (
            <div className="text-center py-16 px-6">
              <div className="bg-gray-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <Search className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {selectedOption ? "No Complaints Found" : "No Complaints Yet"}
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                {selectedOption
                  ? `You haven't raised any "${optionToLabel[selectedOption] || selectedOption}" complaints.`
                  : "Great! You have no active complaints. Your account is running smoothly."}
              </p>
              {!selectedOption && (
                <Button
                  onClick={handleAddComplaint}
                  className="mt-6 bg-[#0c1f4d] hover:bg-[#0c1f4d]/90"
                >
                  <PlusCircle className="w-5 h-5 mr-2" />
                  Raise Your First Complaint
                </Button>
              )}
            </div>
          )}

          {!isLoading && !error && complaints?.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">Complaint ID</TableHead>
                    {/* <TableHead>Title</TableHead> */}
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {complaints.map((complaint) => {
                    const isExpanded = expandedRow === complaint._id;
                    const statusInfo = getStatusDisplay(complaint.status || "not_seen");

                    return (
                      <React.Fragment key={complaint._id}>
                        <TableRow
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => toggleExpand(complaint._id)}
                        >
                          <TableCell className="font-mono text-xs text-gray-600">
                            {complaint._id.slice(-8)}
                          </TableCell>
                          {/* <TableCell className="font-medium">
                            {complaint.details?.title || "No Title Provided"}
                          </TableCell> */}
                          <TableCell className="capitalize">
                            {optionToLabel[complaint.option] ||
                              complaint.option.replace(/_/g, " ")}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}
                            >
                              {statusInfo.label}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {new Date(complaint.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-gray-500" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-gray-500" />
                            )}
                          </TableCell>
                        </TableRow>

                        {isExpanded && (
                          <TableRow>
                            <TableCell colSpan={6} className="bg-gray-50">
                              <div className="p-6 space-y-6">
                                <h4 className="font-bold text-lg text-gray-800">
                                  Full Complaint Details
                                </h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                                  <div>
                                    <span className="font-medium text-gray-700">Complaint Type:</span>{" "}
                                    <span className="capitalize">
                                      {optionToLabel[complaint.option] ||
                                        complaint.option.replace(/_/g, " ")}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-700">Current Status:</span>{" "}
                                    <span className={`font-semibold px-3 py-1 rounded-full ${statusInfo.color}`}>
                                      {statusInfo.label}
                                    </span>
                                  </div>

                                  {complaint.details?.title && (
                                    <div className="md:col-span-2">
                                      <span className="font-medium text-gray-700">Title:</span>
                                      <p className="mt-1 text-gray-900 font-medium">
                                        {complaint.details.title}
                                      </p>
                                    </div>
                                  )}

                                  {complaint.details?.description && (
                                    <div className="md:col-span-2">
                                      <span className="font-medium text-gray-700">Description:</span>
                                      <p className="mt-2 text-gray-700 bg-white p-4 rounded-lg border whitespace-pre-wrap shadow-sm">
                                        {complaint.details.description}
                                      </p>
                                    </div>
                                  )}

                                  {complaint.details?.supplier_number && (
                                    <div>
                                      <span className="font-medium text-gray-700">Supplier Number:</span>{" "}
                                      {complaint.details.supplier_number}
                                    </div>
                                  )}

                                  {complaint.details?.order_id && (
                                    <div>
                                      <span className="font-medium text-gray-700">Order ID:</span>{" "}
                                      {complaint.details.order_id}
                                    </div>
                                  )}

                                  {complaint.details?.inquiry_id && (
                                    <div>
                                      <span className="font-medium text-gray-700">Inquiry ID:</span>{" "}
                                      {complaint.details.inquiry_id}
                                    </div>
                                  )}

                                  {/* Dynamic fields (excluding known ones including attachments) */}
                                  {Object.entries(complaint.details || {})
                                    .filter(
                                      ([key]) =>
                                        ![
                                          "title",
                                          "description",
                                          "supplier_number",
                                          "order_id",
                                          "inquiry_id",
                                          "status",
                                          "attachments",
                                        ].includes(key)
                                    )
                                    .map(([key, value]) => (
                                      <div key={key}>
                                        <span className="font-medium text-gray-700 capitalize">
                                          {key.replace(/_/g, " ")}:
                                        </span>{" "}
                                        <span className="text-gray-900">
                                          {typeof value === "object"
                                            ? JSON.stringify(value, null, 2)
                                            : String(value)}
                                        </span>
                                      </div>
                                    ))}

                                  {/* === ATTACHMENTS THUMBNAIL GRID === */}
                                  {Array.isArray(complaint.details?.attachments) &&
                                    complaint.details.attachments.length > 0 && (
                                      <div className="md:col-span-2">
                                        <span className="font-medium text-gray-700 block mb-4 text-base">
                                          Attachments ({complaint.details.attachments.length})
                                        </span>

                                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                                          {complaint.details.attachments.map((item, index) => {
                                            let parsedItem = item;

                                            // ✅ Parse JSON string safely
                                            if (typeof item === "string") {
                                              try {
                                                parsedItem = JSON.parse(item);
                                              } catch {
                                                parsedItem = { fileUrl: item };
                                              }
                                            }

                                            const url =
                                              parsedItem?.fileUrl ||
                                              parsedItem?.url ||
                                              "";

                                            if (!url) return null;

                                            const fileName = url.split("/").pop();
                                            const isImage = /\.(jpg|jpeg|png|gif|webp|svg|avif)$/i.test(fileName);

                                            return (
                                              <div
                                                key={index}
                                                className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-md transition"
                                                onClick={(e) => e.stopPropagation()}
                                              >
                                                <a
                                                  href={url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="block w-full h-full"
                                                >
                                                  {isImage ? (
                                                    <img
                                                      src={url}
                                                      alt={fileName}
                                                      className="w-full h-full object-cover"
                                                      loading="lazy"
                                                      onError={(e) => {
                                                        e.currentTarget.style.display = "none";
                                                        e.currentTarget.nextElementSibling.style.display = "flex";
                                                      }}
                                                    />
                                                  ) : null}

                                                  {/* Fallback for non-images */}
                                                  <div
                                                    className={`${isImage ? "hidden" : "flex"
                                                      } w-full h-full items-center justify-center flex-col bg-gray-50`}
                                                  >
                                                    <FileText className="w-10 h-10 text-gray-400 mb-1" />
                                                    <span className="text-[10px] text-gray-600 text-center px-2 line-clamp-2">
                                                      {fileName}
                                                    </span>
                                                  </div>

                                                  {/* Hover overlay */}
                                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-end p-2">
                                                    <p className="text-white text-xs line-clamp-2">
                                                      {fileName}
                                                    </p>
                                                  </div>
                                                </a>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}

                                </div>

                                <div className="text-xs text-gray-500 pt-6 border-t">
                                  Submitted on:{" "}
                                  {new Date(complaint.createdAt).toLocaleString("en-IN", {
                                    day: "2-digit",
                                    month: "long",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MyQueries;
