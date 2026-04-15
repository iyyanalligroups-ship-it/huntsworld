import React, { useContext, useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Upload,

  AlertCircle,
  Building,
  MapPin,
  Globe,
  Building2,
  ArrowLeft,
  User,
  Phone,
  Mail,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Camera,
  Navigation,
  ShieldCheck,
  CreditCard
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import {
  useGetTrustSealRequestsForStudentsQuery,
  usePickTrustSealRequestMutation,
  useUpdateTrustSealImagesMutation,
  useUploadImagesToImageServerMutation,
  useGetMyVerifiedCompaniesQuery,
} from "@/redux/api/TrustSealRequestApi";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import Loader from "@/loader/Loader";
// Simple useMediaQuery hook
const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (e) => setMatches(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
};


// --- SOP Component ---
export const VerificationSOP = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden lg:sticky lg:top-6">
      {/* Header */}
      <div className="bg-[#0c1f4d] p-4 flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-white" />
        <div>
          <h3 className="font-bold text-white text-sm">Verification Guidelines</h3>
          <p className="text-xs text-blue-200">Standard Operating Procedure</p>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Step 1: Pick */}
        <div className="relative pl-8">
          <div className="absolute left-0 top-1 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-700">1</div>
          <h4 className="text-sm font-bold text-[#0c1f4d] mb-1">Pick a Request</h4>
          <p className="text-xs text-gray-600 leading-relaxed">
            Browse the <strong>"Pending"</strong> list and click <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#0c1f4d] text-white"><CheckCircle size={10} className="mr-1" /> Pick</span> to assign the verification task to yourself.
          </p>
        </div>

        {/* Step 2: Visit */}
        <div className="relative pl-8">
          <div className="absolute left-0 top-1 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-xs font-bold text-purple-700">2</div>
          <h4 className="text-sm font-bold text-[#0c1f4d] mb-1">Visit Location</h4>
          <p className="text-xs text-gray-600 leading-relaxed">
            Click <strong>"View Details"</strong> to see the address. Physically visit the shop/company location to verify its existence.
          </p>
          <div className="mt-2 flex items-center gap-1 text-[10px] text-gray-500 bg-gray-50 p-2 rounded border border-gray-100">
            <Navigation size={12} /> Ensure you are at the correct GPS coordinates.
          </div>
        </div>

        {/* Step 3: Upload */}
        <div className="relative pl-8">
          <div className="absolute left-0 top-1 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-xs font-bold text-green-700">3</div>
          <h4 className="text-sm font-bold text-[#0c1f4d] mb-1">Upload Proof</h4>
          <p className="text-xs text-gray-600 leading-relaxed">
            Click <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-600 text-white"><Upload size={10} className="mr-1" /> Upload</span> and attach clear photos of the shop board, entrance, and interior.
          </p>
          <div className="mt-2 flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 p-2 rounded border border-amber-100">
            <Camera size={12} /> <strong>Tip:</strong> Ensure the company name board is clearly visible in at least one photo.
          </div>
        </div>
      </div>
    </div>
  );
};
const VerificationList = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useContext(AuthContext);
  const studentId = user?.user?._id;
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [images, setImages] = useState([]);
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [isExpired, setIsExpired] = useState(false);
  const [isVerified, setIsVerified] = useState(true);
  const [studentLoading, setStudentLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState({});
  const [addressData, setAddressData] = useState({});
  const [addressError, setAddressError] = useState({});
  const navigate = useNavigate();

  // Mobile detection
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Fetch pending/in-process requests
  const {
    data: requests = [],
    isLoading,
    isError,
    error: fetchError,
  } = useGetTrustSealRequestsForStudentsQuery(studentId, {
    refetchOnMountOrArgChange: true,
    skip: !studentId || isExpired,
  });

  // Fetch verified companies by this student
  const {
    data: verifiedCompanies = [],
    isLoading: verifiedLoading,
    isError: verifiedError,
  } = useGetMyVerifiedCompaniesQuery(studentId, {
    skip: !studentId || isExpired,
  });

  // Mutations
  const [pickTrustSealRequest, { isLoading: isPicking }] = usePickTrustSealRequestMutation();
  const [uploadImagesToImageServer, { isLoading: isUploadingServer }] = useUploadImagesToImageServerMutation();
  const [updateTrustSealImages, { isLoading: isUpdatingSeal }] = useUpdateTrustSealImagesMutation();

  // Fetch student data and check expiry
  useEffect(() => {
    if (!studentId) {
      setStudentLoading(false);
      return;
    }

    const fetchStudent = async () => {
      try {
        const token = sessionStorage.getItem("token");

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/students/fetch-student-user-id/${studentId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) throw new Error("Failed to fetch student");

        const data = await response.json();
        setStudentData(data);

        console.log(data, "student data log");

        // ✅ 1️⃣ Check Verification First
        if (!data.verified) {
          setIsVerified(false);
          return; // stop here, no need to check expiry
        }

        setIsVerified(true);

        // ✅ 2️⃣ Expiry Check
        const endDate = new Date(data.college_end_month_year);
        const currentDate = new Date();

        if (currentDate > endDate) {
          setIsExpired(true);
        } else {
          setIsExpired(false);
        }

      } catch (err) {
        console.error(err);
        setError("Failed to load student profile");
      } finally {
        setStudentLoading(false);
      }
    };

    fetchStudent();
  }, [studentId]);
  const handlePickRequest = async (requestId) => {
    try {
      setError(null);
      await pickTrustSealRequest({ requestId, studentId }).unwrap();
    } catch (err) {
      setError("Failed to pick request");
      console.error(err);
    }
  };

  const handleImageChange = (e) => {
    setImages([...e.target.files]);
  };

  const handleImageUpload = async () => {
    if (!companyName || images.length === 0) {
      setError("Company name and at least one image are required");
      return;
    }

    try {
      setError(null);
      const imageUrls = await uploadImagesToImageServer({
        companyName,
        images,
      }).unwrap();

      await updateTrustSealImages({
        requestId: selectedRequest._id,
        imageUrls,
      }).unwrap();

      setIsModalOpen(false);
      setImages([]);
      setCompanyName("");
    } catch (err) {
      setError("Failed to upload images");
      console.error(err);
    }
  };

  const handleFetchAddress = async (requestId, companyName) => {
    try {
      setAddressError((prev) => ({ ...prev, [requestId]: null }));
      setAddressData((prev) => ({ ...prev, [requestId]: null }));

      const token = sessionStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL
        }/merchants/fetch-address-by-company-name?company_name=${encodeURIComponent(
          companyName
        )}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch address");
      }

      setAddressData((prev) => ({ ...prev, [requestId]: data.data }));
      setExpandedRows((prev) => ({ ...prev, [requestId]: true }));
    } catch (err) {
      setAddressError((prev) => ({
        ...prev,
        [requestId]: err.message || "Failed to fetch address",
      }));
      setExpandedRows((prev) => ({ ...prev, [requestId]: true }));
    }
  };

  const toggleRow = (requestId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [requestId]: !prev[requestId],
    }));
  };

  const contactSupport = () => {
    navigate("/contact");
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "in_process":
        return <Badge className="bg-blue-100 text-blue-800">In Process</Badge>;
      case "student_verified":
        return (
          <Badge className="bg-green-100 text-green-800">
            Student Verified
          </Badge>
        );
      case "verified":
        return <Badge className="bg-green-500 text-white">Verified</Badge>;
      case "rejected":
        return <Badge className="bg-red-500 text-white">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Pagination for pending requests
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRequests = requests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(requests.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [requests.length]);

  // Loading & Expired States
  if (studentLoading) {
    return (
      <div className="flex justify-center flex-col items-center min-h-[60vh] w-full">
        <Loader contained={true} label="Loading your profile..." />
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="container mx-auto p-6 flex justify-center items-center min-h-[60vh]">
        <div className="text-center p-8 bg-red-50 border border-red-200 rounded-lg max-w-md">
          <h2 className="text-2xl font-bold text-red-600">
            Student ID Expired
          </h2>

          <div className="text-gray-600 mt-4 leading-relaxed space-y-3">
            <p>Your student account validity has expired.</p>

            <p>
              Please deactivate your student account and create a new one
              from the Settings page.
            </p>
          </div>

          {/* 🔥 Navigate Button */}
          <button
            onClick={() => navigate("/settings")}
            className="mt-6 cursor-pointer px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Go to Settings
          </button>
        </div>
      </div>
    );
  }
  if (!isVerified) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-6 animate-in fade-in duration-500">
        <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          {/* Top accent bar */}
          <div className="h-2 bg-amber-400" />

          <div className="flex flex-col items-center p-8 text-center">
            {/* Icon Placeholder - You can use a Lucide-React ShieldAlert or Clock icon here */}
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
              <svg
                className="h-8 w-8 text-amber-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Verification Pending
            </h2>

            <p className="mt-3 text-sm leading-relaxed text-slate-500">
              Your student account is currently under review. Our admins are working to verify your details as quickly as possible.
            </p>

            <div className="mt-8 w-full space-y-3">
              <button
                onClick={contactSupport}
                className="w-full cursor-pointer rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 active:scale-[0.98]"
              >
                Contact Support
              </button>

              <p className="text-xs text-slate-400">
                Typical verification time: 24-48 hours.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!studentData) {
    return (
      <div className="container mx-auto p-6">
        <div className="p-4 bg-red-100 text-red-700 rounded-lg flex items-center">
          <AlertCircle className="mr-2" />
          {error || "Student profile not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="relative p-4 md:p-6">


      <Button
        type="button"
        onClick={() => navigate(-1)}
        variant="outline"
        className="absolute cursor-pointer top-5 left-8 z-40 hidden md:flex gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Button>
      {/* Trust Seal Requests Section */}
      <h2 className="text-2xl mt-10 font-bold mb-6 text-gray-800">
        Trust Seal Requests
      </h2>
      <div className="mb-4 ">
        <VerificationSOP />
      </div>
      {(error || isError) && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg flex items-center">
          <AlertCircle className="mr-2" />
          {error || fetchError?.data?.message || "Failed to load requests"}
        </div>
      )}

      {/* Mobile View - Requests */}
      {isMobile ? (
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <Loader contained={true} label="Fetching requests..." />
            </div>
          ) : currentRequests.length === 0 ? (
            <div className="text-center py-10 text-gray-500">No trust seal requests found</div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {currentRequests.map((request) => {
                const isExpanded = expandedRows[request._id];
                const seller = request?.seller_user_info;
                const company = request?.seller_company_details;
                const address = addressData[request._id];

                return (
                  <Card
                    key={request._id}
                    className={`overflow-hidden transition-all duration-300 border-t-4 ${request.status === 'pending' ? 'border-t-yellow-500' : 'border-t-[#0c1f4d]'
                      } shadow-md hover:shadow-lg`}
                  >
                    {/* --- Card Header --- */}
                    <CardHeader className="pb-3 border-b border-gray-100 bg-white">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-gray-500" />
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              Company
                            </span>
                          </div>
                          <CardTitle className="text-xl font-bold text-[#0c1f4d]">
                            {company?.company_name || "Unknown Company"}
                          </CardTitle>
                        </div>
                        {getStatusBadge(request?.status)}
                      </div>
                    </CardHeader>

                    <CardContent className="pt-4 space-y-5">
                      {/* --- Main Stats Row --- */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <span className="text-xs text-gray-500 block mb-1">Amount</span>
                          <span className="font-bold text-lg text-gray-800 flex items-center gap-1">
                            ₹{request?.amount.toLocaleString()}
                          </span>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <span className="text-xs text-gray-500 block mb-1">Request Date</span>
                          <span className="font-medium text-sm text-gray-800 flex items-center gap-1">
                            {new Date(request.issueDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* --- Action Buttons --- */}
                      <div className="flex flex-wrap gap-2">
                        {request.status === "pending" && (
                          <Button
                            size="sm"
                            onClick={() => handlePickRequest(request._id)}
                            className="flex-1 bg-[#0c1f4d] hover:bg-blue-900 text-white shadow-sm"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Pick Order
                          </Button>
                        )}

                        {request.status === "in_process" && request.picked_by === studentId && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setCompanyName(company?.company_name || "");
                              setIsModalOpen(true);
                            }}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-sm"
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            Upload
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          className={`border-gray-300 hover:bg-gray-50 ${!request.status === 'pending' ? 'flex-1' : ''}`}
                          onClick={() => {
                            if (!isExpanded) {
                              handleFetchAddress(request._id, company?.company_name);
                            } else {
                              toggleRow(request._id);
                            }
                          }}
                        >
                          {isExpanded ? "Hide Info" : "View Details"}
                          {isExpanded ? (
                            <ChevronUp className="ml-2 h-3 w-3" />
                          ) : (
                            <ChevronDown className="ml-2 h-3 w-3" />
                          )}
                        </Button>
                      </div>

                      {/* --- Expanded Details Section --- */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-dashed border-gray-200 animate-in fade-in slide-in-from-top-2 duration-300">

                          {/* Error Message */}
                          {addressError[request._id] && (
                            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm mb-4 flex items-center gap-2">
                              <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                              {addressError[request._id]}
                            </div>
                          )}

                          <div className="space-y-4">
                            {/* 1. Seller User Info */}
                            <div className="bg-blue-50/50 rounded-lg p-3 border border-blue-100">
                              <h4 className="text-sm font-semibold text-[#0c1f4d] mb-3 flex items-center gap-2">
                                <User className="h-4 w-4" /> Seller Representative
                              </h4>
                              <div className="grid grid-cols-1 gap-y-2 text-sm">
                                <div className="flex items-center gap-3">
                                  <span className="text-gray-500 w-4"><User className="h-3 w-3" /></span>
                                  <span className="font-medium text-gray-900 capitalize">{seller?.name || "N/A"}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-gray-500 w-4"><Mail className="h-3 w-3" /></span>
                                  <span className="text-gray-700 truncate">{seller?.email || "N/A"}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-gray-500 w-4"><Phone className="h-3 w-3" /></span>
                                  <span className="text-gray-700 font-mono">{seller?.phone || "N/A"}</span>
                                </div>
                              </div>
                            </div>

                            {/* 2. Address Info (Only if fetched) */}
                            {address && (
                              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                 <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                  <MapPin className="h-4 w-4" /> {address.address_type === "personal" ? "Personal Location" : "Pick-up Location"}
                                </h4>

                                <div className="text-sm text-gray-600 space-y-1 ml-1 pl-3 border-l-2 border-gray-300">
                                  <p className="font-medium text-gray-900">
                                    {address.company_name}
                                  </p>
                                  <p>{address.address.address_line_1}</p>
                                  {address.address.address_line_2 && (
                                    <p>{address.address.address_line_2}</p>
                                  )}
                                  <p>
                                    {address.address.city}, {address.address.state} <span className="font-mono font-semibold bg-gray-200 px-1 rounded text-xs">{address.address.pincode}</span>
                                  </p>
                                  <p className="text-xs uppercase tracking-wide text-gray-400 mt-1">
                                    {address.address.country}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* 3. Company Contact (Optional extra context) */}
                            <div className="flex gap-4 pt-2">
                              {company?.company_phone_number && (
                                <a href={`tel:${company.company_phone_number}`} className="text-xs flex items-center gap-1 text-gray-500 hover:text-[#0c1f4d] transition-colors">
                                  <Phone className="h-3 w-3" /> Company: {company.company_phone_number}
                                </a>
                              )}
                            </div>

                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {requests.length > itemsPerPage && (
            <Pagination className="mt-6">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className={currentPage === 1 ? "opacity-50 pointer-events-none" : "cursor-pointer"}
                  />
                </PaginationItem>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setCurrentPage(page)}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className={currentPage === totalPages ? "opacity-50 pointer-events-none" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      ) : (
        /* Desktop Table - Requests */
        <Table>
          <TableHeader className="bg-[#0c1f4d]">
            <TableRow>
              <TableHead className="text-white">Company Name</TableHead>
              <TableHead className="text-white">Amount</TableHead>
              <TableHead className="text-white">Status</TableHead>
              <TableHead className="text-white">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12">
                  <Loader contained={true} label="Fetching requests..." />
                </TableCell>
              </TableRow>
            ) : requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-gray-500">
                  No trust seal requests found
                </TableCell>
              </TableRow>
            ) : (
              requests.map((request) => (
                <React.Fragment key={request._id}>
                  {/* --- Main Row (Unchanged) --- */}
                  <TableRow className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      {request?.seller_company_details?.company_name || "Unknown Company"}
                    </TableCell>
                    <TableCell>₹{request?.amount.toLocaleString()}</TableCell>
                    <TableCell>{getStatusBadge(request?.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2 flex-wrap">
                        {request.status === "pending" && (
                          <Button
                            size="sm"
                            onClick={() => handlePickRequest(request._id)}
                            className="bg-[#0c1f4d] hover:bg-blue-700 text-white"
                          >
                            <CheckCircle className="mr-1 h-4 w-4" />
                            Pick
                          </Button>
                        )}
                        {request.status === "in_process" &&
                          request.picked_by === studentId && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request);
                                setCompanyName(
                                  request?.seller_company_details?.company_name || ""
                                );
                                setIsModalOpen(true);
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Upload className="mr-1 h-4 w-4" />
                              Upload
                            </Button>
                          )}
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            expandedRows[request._id]
                              ? toggleRow(request._id)
                              : handleFetchAddress(
                                request._id,
                                request?.seller_company_details?.company_name
                              )
                          }
                        >
                          {expandedRows[request._id] ? "Hide" : "Details"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* --- Expanded Details Row (New Desktop Grid Layout) --- */}
                  {expandedRows[request._id] && (
                    <TableRow>
                      <TableCell colSpan={4} className="bg-gray-50 p-0 border-t-0">
                        <div className="p-6 border-b border-gray-200 shadow-inner">

                          {/* Error Message */}
                          {addressError[request._id] && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                              {addressError[request._id]}
                            </div>
                          )}

                          {/* 3-Column Grid Layout */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                            {/* Column 1: Seller Representative Info */}
                            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2 border-b pb-2">
                                <User className="h-4 w-4 text-blue-600" /> Seller Representative
                              </h4>
                              <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                  <div className="bg-gray-100 p-1.5 rounded-full mt-0.5">
                                    <User className="h-3 w-3 text-gray-600" />
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">Name</p>
                                    <p className="text-sm font-medium text-gray-800 capitalize">
                                      {request.seller_user_info?.name || "N/A"}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-3">
                                  <div className="bg-gray-100 p-1.5 rounded-full mt-0.5">
                                    <Mail className="h-3 w-3 text-gray-600" />
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">Email</p>
                                    <p className="text-sm text-gray-800 break-all">
                                      {request.seller_user_info?.email || "N/A"}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-3">
                                  <div className="bg-gray-100 p-1.5 rounded-full mt-0.5">
                                    <Phone className="h-3 w-3 text-gray-600" />
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">Mobile</p>
                                    <p className="text-sm font-mono text-gray-800">
                                      {request.seller_user_info?.phone || "N/A"}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Column 2: Company Contact Info */}
                            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2 border-b pb-2">
                                <Building className="h-4 w-4 text-blue-600" /> Company Contact
                              </h4>
                              <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                  <div className="bg-gray-100 p-1.5 rounded-full mt-0.5">
                                    <Mail className="h-3 w-3 text-gray-600" />
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">Company Email</p>
                                    <p className="text-sm text-gray-800 break-all">
                                      {request.seller_company_details?.company_email || "N/A"}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-3">
                                  <div className="bg-gray-100 p-1.5 rounded-full mt-0.5">
                                    <Phone className="h-3 w-3 text-gray-600" />
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">Company Phone</p>
                                    <p className="text-sm font-mono text-gray-800">
                                      {request.seller_company_details?.company_phone_number || "N/A"}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Column 3: Pick-up Address (Fetched Data) */}
                            <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 shadow-sm relative overflow-hidden">
                              <div className="absolute top-0 right-0 w-16 h-16 bg-blue-100 rounded-bl-full -mr-8 -mt-8 opacity-50"></div>

                              <h4 className="text-sm font-semibold text-[#0c1f4d] mb-3 flex items-center gap-2 border-b border-blue-200 pb-2 relative z-10">
                                <MapPin className="h-4 w-4" /> {addressData[request._id]?.address_type === "personal" ? "Personal Location" : "Pick-up Location"}
                              </h4>

                              {!addressData[request._id] && !addressError[request._id] && (
                                <div className="text-sm text-gray-500 italic flex items-center gap-2 py-4">
                                  <div className="animate-spin h-3 w-3 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                                  Fetching address details...
                                </div>
                              )}

                              {addressData[request._id] && (
                                <div className="relative z-10 space-y-2">
                                  <p className="text-sm font-bold text-gray-800">
                                    {addressData[request._id].company_name}
                                  </p>
                                  <p className="text-sm text-gray-600 leading-relaxed">
                                    {addressData[request._id].address.address_line_1}
                                    {addressData[request._id].address.address_line_2 && (
                                      <span>, {addressData[request._id].address.address_line_2}</span>
                                    )}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {addressData[request._id].address.city},{" "}
                                    {addressData[request._id].address.state}
                                  </p>
                                  <div className="flex gap-2 mt-2">
                                    <span className="inline-flex items-center rounded-md bg-white px-2 py-1 text-xs font-mono font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 shadow-sm">
                                      {addressData[request._id].address.pincode}
                                    </span>
                                    <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10 shadow-sm">
                                      <Globe className="h-3 w-3" /> {addressData[request._id].address.country}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>

                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      )}

      {/* My Verified Companies Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          My Verified Companies
        </h2>

        {verifiedError && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg flex items-center">
            <AlertCircle className="mr-2" />
            Failed to load verified companies
          </div>
        )}

        {/* Mobile View - Verified Companies */}
        {isMobile ? (
          <div className="space-y-4">
            {verifiedLoading ? (
              <div className="text-center py-8 text-gray-500">
                Loading verified companies...
              </div>
            ) : verifiedCompanies.length === 0 ? (
              <div className="text-center py-10 text-gray-600 bg-gray-50 rounded-lg">
                You haven't verified any companies yet.
                <br />
                <span className="text-sm">Complete verifications to see them here!</span>
              </div>
            ) : (
              verifiedCompanies.map((req) => (
                <Card key={req._id} className="overflow-hidden">
                  <CardHeader className="bg-green-600 text-white">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      {req.company_name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">GSTIN</span>
                      <span className="font-medium">{req.gst_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount Earned</span>
                      <span className="font-bold text-green-700">
                        ₹{req.amount?.toLocaleString() || "0"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Verified On</span>
                      <span>
                        {req.issueDate
                          ? new Date(req.issueDate).toLocaleDateString("en-IN")
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Valid Until</span>
                      <span>
                        {req.expiryDate
                          ? new Date(req.expiryDate).toLocaleDateString("en-IN")
                          : "N/A"}
                      </span>
                    </div>
                    <Badge className="bg-green-100 text-green-800 w-fit">
                      Verified Successfully
                    </Badge>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        ) : (
          /* Desktop Table - Verified Companies */
          <Table>
            <TableHeader className="bg-green-600">
              <TableRow>
                <TableHead className="text-white">Company Name</TableHead>
                <TableHead className="text-white">GSTIN</TableHead>
                <TableHead className="text-white">Amount Earned</TableHead>
                <TableHead className="text-white">Verified Date</TableHead>
                <TableHead className="text-white">Expiry Date</TableHead>
                <TableHead className="text-white">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {verifiedLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : verifiedCompanies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-gray-600">
                    You haven't verified any companies yet.
                  </TableCell>
                </TableRow>
              ) : (
                verifiedCompanies.map((req) => (
                  <TableRow key={req._id} className="hover:bg-green-50">
                    <TableCell className="font-medium">
                      {req.company_name}
                    </TableCell>
                    <TableCell>{req.gst_number}</TableCell>
                    <TableCell className="font-bold text-green-700">
                      ₹{req.amount?.toLocaleString() || "0"}
                    </TableCell>
                    <TableCell>
                      {req.issueDate
                        ? new Date(req.issueDate).toLocaleDateString("en-IN")
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {req.expiryDate
                        ? new Date(req.expiryDate).toLocaleDateString("en-IN")
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800">Verified</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Image Upload Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Verification Images</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {error && (
              <div className="p-3 bg-red-100 text-red-700 rounded flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            <div>
              <Label htmlFor="company">Company Name</Label>
              <Input
                id="company"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Acme Corp"
                className="mt-1 border-2 border-slate-300"
                readOnly
              />
            </div>
            <div>
              <Label htmlFor="images">Select Images</Label>
              <Input
                id="images"
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="mt-1 border-2 border-slate-300"
              />
              {images.length > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  {images.length} image{images.length > 1 ? "s" : ""} selected
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleImageUpload}
              className="bg-[#0c1f4d] hover:bg-blue-700"
            >
              Upload Images
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {(isPicking || isUploadingServer || isUpdatingSeal) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <Loader label={isPicking ? "Assigning request..." : "Uploading proof..."} />
        </div>
      )}
    </div>
  );
};

export default VerificationList;
