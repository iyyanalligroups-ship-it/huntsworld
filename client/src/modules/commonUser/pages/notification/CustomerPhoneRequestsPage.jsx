import { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { Trash2, Store, Calendar, Clock, ChevronRight, User, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import showToast from "@/toast/showToast";

export default function CustomerPhoneRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const token = sessionStorage.getItem("token");
  const observerRef = useRef(null);
  const loaderRef = useRef(null); // reference to the "sentinel" element at bottom

  // Fetch requests for a specific page
  const fetchRequests = useCallback(async (pageNum) => {
    if (!hasMore || loadingMore) return;

    setLoadingMore(true);

    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/phone-number-access/my-phone-requests`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { page: pageNum, limit: 10 },
        }
      );

      const newRequests = res.data.data || [];
      const pagination = res.data.pagination;

      setRequests((prev) => [...prev, ...newRequests]);
      setHasMore(pagination.hasMore);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoadingMore(false);
      if (pageNum === 1) setLoading(false);
    }
  }, [token, hasMore, loadingMore]);

  // Initial load
  useEffect(() => {
    fetchRequests(1);
  }, [fetchRequests]);

  // Load more when page changes (triggered by intersection observer)
  useEffect(() => {
    if (page > 1) {
      fetchRequests(page);
    }
  }, [page, fetchRequests]);

  // Intersection Observer to detect when bottom loader is visible
  useEffect(() => {
    if (!loaderRef.current || !hasMore || loading || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 } // trigger when 10% of loader is visible
    );

    observer.observe(loaderRef.current);
    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loading, loadingMore]);

  // Delete request
  const handleDelete = async (id) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/phone-number-access/phone-request/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Optimistic update: remove from list
      setRequests((prev) => prev.filter((item) => item._id !== id));
    } catch (error) {
      console.error("Error deleting request:", error);
      // Optional: show toast error
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 w-full bg-slate-100 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 font-sans">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Phone Access Requests
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Track and manage your requests to access merchant contact details.
          </p>
        </div>
        <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-sm">
          <Clock size={24} />
        </div>
      </div>

      {requests.length === 0 ? (
        <Card className="border-dashed border-2 bg-slate-50/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
              <AlertCircle size={32} className="text-slate-300" />
            </div>
            <p className="text-slate-600 font-medium">No requests found</p>
            <p className="text-slate-400 text-sm mt-1 max-w-xs">
              You haven't requested any phone number access yet. Your requests will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req._id}
              className="group relative bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 overflow-hidden"
            >
              {/* Status Indicator Bar */}
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                req.status === "approved" ? "bg-emerald-500" : req.status === "rejected" ? "bg-rose-500" : "bg-amber-500"
              }`} />

              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                    <Store size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors cursor-default">
                      {req.merchant_id?.company_name || req.seller_id?.company_name || "Merchant"}
                    </h3>
                    <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-medium uppercase tracking-wider">
                      <Clock size={12} />
                      {new Date(req.request_date || req.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Badge
                    className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest border shadow-none ${
                        req.status === "approved"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : req.status === "rejected"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                  >
                    {req.status}
                  </Badge>

                  {req.expiry_date && req.status === "approved" && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      <Calendar size={12} />
                      Expires: {new Date(req.expiry_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto justify-end border-t md:border-0 pt-3 md:pt-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(req._id)}
                  className="h-10 w-10 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                  title="Delete request"
                >
                  <Trash2 size={18} />
                </Button>
                <div className="hidden md:flex h-10 w-10 items-center justify-center text-slate-300 group-hover:text-blue-500 transition-all">
                   <ChevronRight size={20} />
                </div>
              </div>
            </div>
          ))}

          {/* Loader / trigger element for infinite scroll */}
          {hasMore && (
            <div
              ref={loaderRef}
              className="py-12 flex flex-col items-center justify-center gap-3"
            >
              <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-400 text-xs font-medium animate-pulse">Loading more requests...</p>
            </div>
          )}

          {!hasMore && requests.length > 0 && (
            <div className="py-10 text-center">
              <span className="px-4 py-2 bg-slate-50 text-slate-400 text-[11px] font-bold uppercase tracking-widest rounded-full border border-slate-100 shadow-sm">
                End of list
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
