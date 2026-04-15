import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '@/modules/landing/context/AuthContext';
import axios from 'axios';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useSidebar } from '@/modules/admin/hooks/useSidebar';
import { useSelectedUser } from '@/modules/admin/context/SelectedUserContext';
import { useNavigate } from 'react-router-dom';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip";
import {
  MessageCircle,
  Phone,
  User,
  Mail,
  Package,
  Hash,
  Clock,
  Zap,
  AlertTriangle,
  Info
} from "lucide-react";
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import Loader from '@/loader/Loader';

// Enable dayjs relative time plugin
dayjs.extend(relativeTime);

const formatName = (value) => {
  if (!value) return "";
  return value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

function ProductLeads() {
  const { isSidebarOpen } = useSidebar();
  const { user, token } = useContext(AuthContext);
  const userId = user?.user?._id;
  const navigate = useNavigate();
  const { setSelectedUser } = useSelectedUser();
  const [merchantId, setMerchantId] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
      totalPages: 1,
      totalRecords: 0
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

  const fetchMerchantId = async () => {
    if (!user || !user.user?._id) {
      setError('User not logged in or user ID is missing');
      return;
    }
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/merchants/fetch-merchant-by-user-id?userId=${user.user?._id}`,
        {
          headers: {
            Authorization: `Bearer ${token || sessionStorage.getItem('token')}`,
          },
        }
      );
      if (response.data.message === 'Merchant details retrieved successfully' && response.data.data) {
        setMerchantId(response.data.data._id);
        setError('');
      } else {
        setError(response.data.message || 'Merchant not found');
      }
    } catch (err) {
      console.error('Error fetching merchant:', err);
      setError(err.response?.data?.message || 'Failed to fetch merchant details');
    } finally {
      setLoading(false);
    }
  };

  const fetchProductQuotes = async () => {
    if (!merchantId) return;
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/product-quotes/fetch-product-quotes-by-owner?ownerId=${merchantId}&page=${page}&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${token || sessionStorage.getItem('token')}`,
          },
        }
      );
      if (response.data.success) {
        setQuotes(response.data.quote || []);
        setPagination({
            totalPages: response.data.pagination?.totalPages || 1,
            totalRecords: response.data.pagination?.totalRecords || 0
        });
        setError('');
      } else {
        setError(response.data.message || 'No quotes found');
      }
    } catch (err) {
      console.error('Error fetching quotes:', err);
      setError(err.response?.data?.message || 'Failed to fetch product quotes');
    } finally {
      setLoading(false);
    }
  };

  const handleRespondToQuote = async (quoteId, quoteUserId, createdAt) => {
    try {
      setError('');
      setSuccess('');

      // 🔥 1️⃣ If merchant clicks own quote → open chat only
      if (String(userId) === String(quoteUserId)) {
        handleCardClick(quoteUserId); // open own chat
        return; // ❌ DO NOT call API
      }

      setLoading(true);

      // ⏱ SOP timing check
      const diffHours = dayjs().diff(dayjs(createdAt), 'hour', true);
      const isWithinTime = diffHours <= 2;

      // 🔥 2️⃣ Call API only if different user
      const response = await axios.post(
        `${API_BASE_URL}/product-quotes/respond-to-customer`,
        { quoteId },
        {
          headers: {
            Authorization: `Bearer ${token || sessionStorage.getItem('token')}`,
          },
        }
      );

      if (response.data.success) {
        const pointsMessage = isWithinTime
          ? 'Great job! You responded in time. (+5 Points)'
          : 'Response recorded. Delayed response penalty applied. (-2 Points)';

        setSuccess(pointsMessage);

        await fetchProductQuotes(); // refresh list
        handleCardClick(quoteUserId); // open customer chat
      } else {
        setError(response.data.message || 'Failed to respond to quote');
      }
    } catch (err) {
      console.error('Error responding to quote:', err);
      setError(err.response?.data?.message || 'Failed to respond to quote');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (user && token) {
      fetchMerchantId();
    } else {
      setError('Authentication required. Please log in.');
    }
  }, [user, token]);

  useEffect(() => {
    if (merchantId) {
      fetchProductQuotes();
    }
  }, [merchantId, page]);


  const handleCardClick = (userId) => {
    const obj = { _id: userId }
    setSelectedUser(obj);
    navigate('/chat');
  };

  return (
    <div className={`p-4 ${isSidebarOpen ? 'p-6 lg:ml-56' : 'p-4 lg:ml-16'}`}>
      <h2 className="text-2xl font-bold mb-4">Product Leads</h2>

      {/* SOP Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="bg-blue-100 p-2 rounded-full">
            <Info className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-blue-900 text-lg">SOP: Speed to Lead Protocol </h3>
            <p className="text-sm text-blue-800 mt-1 mb-2">
              Maximize your merchant reputation score by responding quickly to potential customers.
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-full border border-blue-100 text-green-700 font-bold shadow-sm">
                <Zap className="w-4 h-4 fill-current" />
                Reply &lt; 2 Days: +5 Points
              </span>
              <span className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-full border border-blue-100 text-red-600 font-bold shadow-sm">
                <AlertTriangle className="w-4 h-4" />
                Reply &gt; 2 Days: -2 Points
              </span>
            </div>
          </div>
        </div>
      </div>

      {loading && <Loader />}

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
          <Zap className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {!loading && quotes.length === 0 && (
        <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">No active product leads at the moment.</p>
        </div>
      )}

      {!loading && quotes.length > 0 && (
        <TooltipProvider delayDuration={150}>
          <div className="rounded-md border overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-[#0c1f4d]">
                <TableRow>
                  <TableHead className="text-white">Status</TableHead>
                  <TableHead className="text-white">Product / Service</TableHead>
                  <TableHead className="text-white">Time Elapsed</TableHead>
                  <TableHead className="text-white">Quantity</TableHead>
                  <TableHead className="text-white">Contact Info</TableHead>
                  <TableHead className="text-white">Customer</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {quotes.map((quote) => {
                  const fullProductName = quote?.product_name || "Unknown Product";

                  // Calculate Time Status
                  const leadTime = dayjs(quote.createdAt);
                  const now = dayjs();
                  const hoursDiff = now.diff(leadTime, 'hour', true);
                  const isUrgent = hoursDiff < 2;

                  return (
                    <TableRow
                      key={quote._id}
                      onClick={() =>
                        handleRespondToQuote(
                          quote._id,
                          quote.user?._id,
                          quote.createdAt
                        )
                      }

                      className="cursor-pointer hover:bg-blue-50/50 transition-colors border-b last:border-0 group"
                    >
                      {/* Status Indicator */}
                      <TableCell>
                        {isUrgent ? (
                          <div className="flex flex-col items-center justify-center w-8">
                            <div className="relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <Zap className="w-5 h-5 text-green-600 relative z-10 fill-green-100" />
                            </div>
                            <span className="text-[10px] font-bold text-green-700 mt-1 whitespace-nowrap">+5 Pts</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center w-8 opacity-60">
                            <Clock className="w-5 h-5 text-orange-500" />
                            <span className="text-[10px] font-bold text-red-600 mt-1 whitespace-nowrap">-2 Pts</span>
                          </div>
                        )}
                      </TableCell>

                      {/* Product Name */}
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-gray-400" />
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-block max-w-[15ch] lg:max-w-[25ch] truncate text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                                {formatName(fullProductName)}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="bg-gray-900 text-white p-3">
                              <p>{fullProductName}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>

                      {/* Time Elapsed */}
                      <TableCell>
                        <span className={`text-xs font-medium px-2 py-1 rounded-md ${isUrgent ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                          {dayjs(quote.createdAt).fromNow()}
                        </span>
                      </TableCell>

                      {/* Quantity */}
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <span className="font-bold">{quote?.quantity || "-"}</span>
                          <span className="text-gray-500 text-xs">{quote?.unit || ""}</span>
                        </div>
                      </TableCell>

                      {/* Contact Info */}
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-sm">
                            <Phone className="w-3.5 h-3.5 text-gray-500" />
                            <span>{quote?.phoneNumber || "-"}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Mail className="w-3.5 h-3.5" />
                            <span className="truncate max-w-[150px]">{quote?.userId?.email || "-"}</span>
                          </div>
                        </div>
                      </TableCell>

                      {/* User Name + Chat Action */}
                      <TableCell>
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                              {quote?.user?.name?.charAt(0).toUpperCase() || "U"}
                            </div>
                            <span className="text-sm font-medium text-gray-700">
                              {quote?.user?.name || "User"}
                            </span>
                          </div>

                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                          >
                            <MessageCircle className="w-4 h-4 mr-1" />
                            Chat
                          </Button>
                        </div>
                      </TableCell>

                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TooltipProvider>
      )}

      {/* Pagination Controls */}
      {!loading && pagination.totalRecords > 0 && (
        <div className="mt-6 flex items-center justify-between bg-white p-4 rounded-lg border shadow-sm">
          <div className="text-sm text-gray-500">
            Showing <span className="font-semibold text-gray-900">{quotes.length}</span> of{" "}
            <span className="font-semibold text-gray-900">{pagination.totalRecords}</span> leads
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              className="h-8 px-4 text-xs bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40"
            >
              Previous
            </Button>
            <div className="flex items-center justify-center min-w-[3rem] text-xs font-bold text-slate-600 bg-slate-100 h-8 rounded-md border border-slate-200">
              Page {page} of {pagination.totalPages}
            </div>
            <Button
              variant="outline"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage(prev => Math.min(pagination.totalPages, prev + 1))}
              className="h-8 px-4 text-xs bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple button component for the table action
const Button = ({ children, className, variant, ...props }) => (
  <button
    className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 h-9 px-3 ${className}`}
    {...props}
  >
    {children}
  </button>
);

export default ProductLeads;
