import React, { useEffect, useState, useContext } from 'react';
import { useSidebar } from "@/modules/admin/hooks/useSidebar";
import axios from 'axios';
import { Pencil, Trash2, Package, FileQuestion, RefreshCcw, Info, ArrowLeft, CheckCircle2, AlertCircle, ShoppingBag } from 'lucide-react';
import { AuthContext } from '@/modules/landing/context/AuthContext';
import { motion } from "framer-motion";
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Loader from "@/loader/Loader";

// --- SOP Component ---
const ManagementSOP = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden lg:sticky lg:top-6">
      {/* Header */}
      <div className="bg-[#0c1f4d] p-4 flex items-center gap-2">
        <Info className="w-5 h-5 text-white" />
        <div>
          <h3 className="font-bold text-white text-sm">Managing Your Posts</h3>
          <p className="text-xs text-blue-200">Standard Operating Procedure</p>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Tip 1 */}
        <div className="relative pl-4 border-l-2 border-blue-500">
          <h4 className="text-xs font-bold text-[#0c1f4d] uppercase tracking-wide mb-1">1. Keep it Fresh</h4>
          <p className="text-xs text-gray-600 leading-relaxed">
            Regularly review your active requirements. If you have already found a supplier or buyer, please remove the post to stop receiving calls.
          </p>
        </div>

        {/* Tip 2 */}
        <div className="relative pl-4 border-l-2 border-green-500">
          <h4 className="text-xs font-bold text-[#0c1f4d] uppercase tracking-wide mb-1">2. Verification</h4>
          <p className="text-xs text-gray-600 leading-relaxed">
            All posts are visible to verified users only. Ensure your contact details in your profile are up to date so interested parties can reach you.
          </p>
        </div>

        {/* Tip 3 */}
        <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 flex gap-2 items-start">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-800 leading-snug">
            <strong>Note:</strong> You cannot edit a post once published. If details are incorrect, delete the post and create a new one.
          </p>
        </div>

        {/* Legend */}
        <div className="pt-4 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-500 mb-2">Icon Legend:</p>
          <div className="flex gap-4">
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <div className="p-1 bg-red-100 rounded text-red-600"><Trash2 size={12} /></div>
              <span>Delete Post</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MyRequirement = () => {
  const { isSidebarOpen } = useSidebar();
  const { user } = useContext(AuthContext);
  console.log(user.user, 'ro');

  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate()
  // Function to fetch requirements
  const fetchMyRequirements = async () => {
    if (!user?.user?._id) {
      setLoading(false);
      setError("User not logged in");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/post-by-requirement/fetch-all-post-requirement-user-id/${user?.user?._id}`
      );

      if (response.data.success) {
        setRequirements(response.data.data || []);
      } else {
        setError(response.data.message || "Failed to load requirements");
      }
    } catch (err) {
      console.error("Axios Error:", err);
      if (err.response && err.response.status === 404) {
        setError("NOT_FOUND");
      } else {
        setError(
          err.response?.data?.message ||
          err.message ||
          "Network error – check console"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.user?._id) {
      fetchMyRequirements();
    }
  }, [user]);

  // Delete handler
  const handleDelete = async (requirementId) => {
    if (!window.confirm("Are you sure you want to delete this requirement?")) return;

    try {
      setDeleting(true);
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/post-by-requirement/delete-post-requirement/${requirementId}`,
        {
          data: { user_id: user?.user?._id }
        }
      );
      setRequirements(prev => prev.filter(r => r._id !== requirementId));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to delete requirement");
    } finally {
      setDeleting(false);
    }
  };

  if (loading || deleting) return <Loader />;

  return (
    <div
      className={`min-h-screen flex flex-col transition-all relative duration-300 p-2`}
    >
      {
        user?.role?.role != "MERCHANT" || user?.role?.role != "GROCERY_SELLER" &&
        <Button
          type="button"
          onClick={() => navigate(-1)}
          variant="outline"
          className="absolute cursor-pointer top-5 left-2 z-40 hidden md:flex gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

      }

      <div className={`${isSidebarOpen ? "p-6 lg:ml-56" : "p-4 lg:ml-16"}`}>

        <div className=" w-full">
          {/* Header */}
          <div className="flex  justify-between mt-14  items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[#0c1f4d]">My Requirements</h1>
              <p className="text-gray-500 text-sm mt-1">Manage all your buying and selling requests</p>
            </div>
            <button
              onClick={fetchMyRequirements}
              className="p-2 bg-white rounded-full shadow hover:bg-gray-100 transition text-[#0c1f4d]"
              title="Refresh"
            >
              <RefreshCcw className="w-5 h-5" />
            </button>
          </div>

          {/* --- MAIN LAYOUT: Cards Left, SOP Right --- */}
          <div className="flex flex-col lg:flex-row gap-8 items-start">

            {/* LEFT CONTENT: REQUIREMENTS LIST (Flex-1) */}
            <div className="w-full lg:flex-1">

              {!loading && error === "NOT_FOUND" && (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg shadow-sm border border-gray-100 text-center">
                  <div className="bg-orange-50 p-4 rounded-full mb-4">
                    <FileQuestion className="w-12 h-12 text-orange-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">No Records Found</h2>
                  <p className="text-gray-500 max-w-md mx-auto mb-6 text-sm">
                    We couldn't find any requirements posted by you yet.
                  </p>
                  <button
                    onClick={fetchMyRequirements}
                    className="px-6 py-2 bg-[#0c1f4d] text-white rounded-md hover:bg-[#0c1f4d]/90 transition flex items-center gap-2 text-sm"
                  >
                    <RefreshCcw className="w-4 h-4" />
                    Try Again
                  </button>
                </div>
              )}

              {!loading && error && error !== "NOT_FOUND" && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                  <p className="text-red-600 font-medium text-lg mb-2">Something went wrong</p>
                  <p className="text-red-500 text-sm mb-4">{error}</p>
                  <button
                    onClick={fetchMyRequirements}
                    className="text-red-700 hover:text-red-800 underline text-sm"
                  >
                    Click here to retry
                  </button>
                </div>
              )}

              {!loading && !error && requirements.length === 0 && (
                <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-gray-100">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-lg text-gray-600 font-medium">No requirements posted yet.</p>
                  <p className="text-gray-500 mt-1 text-sm">Post your first requirement to get quotes from suppliers!</p>
                </div>
              )}

              {!loading && !error && requirements.length > 0 && (
                <div className="grid gap-6 md:grid-cols-2">
                  {requirements.map((req) => (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={req._id}
                      className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all p-5 relative group"
                    >
                      {/* Delete Icons */}
                      <div className="absolute top-4 right-4 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleDelete(req._id)}
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition border border-red-100"
                          title="Delete Post"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="mb-3 pr-10">
                        <div className="flex items-start justify-between">
                          <h3 className="text-lg font-bold text-gray-800 line-clamp-1" title={req.product_or_service}>
                            {req.product_or_service}
                          </h3>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${req.type === 'product' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                          }`}>
                          {req.type === 'product' ? 'Product' : 'Service'}
                        </span>
                      </div>

                      <div className="space-y-3 text-sm text-gray-600">
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                          <p className="line-clamp-2 text-xs leading-relaxed" title={req.description}>
                            <span className="font-semibold text-gray-900">Description:</span> {req.description}
                          </p>
                        </div>

                        <div className="flex justify-between items-center py-1 border-b border-gray-100 border-dashed">
                          <span>Quantity: <span className="font-semibold text-gray-900">{req.quantity}</span></span>
                          <span>Unit: <span className="font-semibold text-gray-900 uppercase">{req.unit_of_measurement}</span></span>
                        </div>

                        <div className="flex justify-between items-center py-1">
                          <span>Phone: <span className="font-mono text-gray-900">{req.phone_number}</span></span>
                        </div>

                        <div className="text-xs bg-blue-50/50 p-2 rounded border border-blue-50">
                          <span className="font-semibold text-[#0c1f4d]">Preferences:</span> {req.supplier_preference}
                          {req.supplier_preference === 'Specific States' && req.selected_states?.length > 0 && (
                            <span className="text-gray-500 block mt-0.5 truncate" title={req.selected_states.join(', ')}>
                              ({req.selected_states.join(', ')})
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                        <span className="text-[10px] text-gray-400">Posted: {new Date(req.createdAt).toLocaleDateString()}</span>
                        <span className="text-[10px] bg-gray-100 px-2 py-1 rounded text-gray-500 font-mono">ID: ...{req._id.slice(-4)}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT CONTENT: SOP SIDEBAR (Fixed Width) */}
            <div className="w-full lg:w-[320px] flex-shrink-0">
              <ManagementSOP />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default MyRequirement;
