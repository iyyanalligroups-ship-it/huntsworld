// components/admin/PhoneVisibilityToggle.jsx
import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import showToast from "@/toast/showToast";
import Loader from "@/loader/Loader";

const PhoneVisibilityToggle = () => {
  const { user } = useContext(AuthContext);
  const [isPhoneVisible, setIsPhoneVisible] = useState(true);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Fetch current setting
  useEffect(() => {
    const fetchVisibility = async () => {
      const token = user?.token || sessionStorage.getItem("token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/phone-visibility/phone-visibility`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Backend now always returns the correct per-user value (or default true)
        setIsPhoneVisible(res.data?.data?.is_phone_number_view ?? true);
      } catch (err) {
        console.error("Failed to load phone visibility:", err);
        showToast("Failed to load setting", "error");
        setIsPhoneVisible(true); // optimistic fallback
      } finally {
        setLoading(false);
      }
    };

    fetchVisibility();
  }, [user?.token]); // ← small improvement: re-run if token changes

  const handleToggle = async () => {
    if (updating) return;

    const newValue = !isPhoneVisible;
    setUpdating(true);

    try {
      const token = user?.token || sessionStorage.getItem("token");

      if (!token) {
        showToast("Please login again", "error");
        return;
      }

      // ────────────────────────────────────────────────
      // IMPORTANT CHANGE: No user_id in body anymore
      // Backend uses req.user.userId from token
      // ────────────────────────────────────────────────
      await axios.put(
        `${import.meta.env.VITE_API_URL}/phone-visibility/phone-visibility`,
        {
          is_phone_number_view: newValue,
          // user_id: ...  ← REMOVE THIS LINE
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setIsPhoneVisible(newValue);
      showToast(
        `Phone numbers are now ${newValue ? "visible" : "hidden"} to others`,
        "success"
      );
    } catch (err) {
      console.error("Update visibility failed:", err);
      showToast(
        err.response?.data?.message || "Failed to update setting",
        "error"
      );
      // State remains unchanged on error (good)
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Privacy Settings</h2>

      <div className="flex items-center justify-between p-5 bg-gray-50 rounded-xl border-2 border-slate-300 shadow-sm">
        <div className="flex-1 pr-6">
          <h3 className="text-lg font-semibold text-gray-800">
            Show my phone number
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {isPhoneVisible
              ? "Visible to other users"
              : "Hidden from everyone"}
          </p>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={isPhoneVisible}
            onChange={handleToggle}
            disabled={updating}
          />
          <div className="w-12 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:bg-[#0c1f4d] transition-colors duration-300 ease-in-out"></div>
          <div className="absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform duration-300 ease-in-out peer-checked:translate-x-5 shadow-md"></div>

          {updating && (
            <div className="absolute inset-0 rounded-full bg-black/10 flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </label>
      </div>

      {updating && <Loader />}
    </div>
  );
};

export default PhoneVisibilityToggle;
