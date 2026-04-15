import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/modules/landing/context/AuthContext"; // Adjust path as needed
import axios from "axios";
import { Wallet } from "lucide-react";
import Loader from "@/loader/Loader";

const RedeemHistory = () => {
  const { user, token } = useContext(AuthContext);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    const fetchMyHistory = async () => {
      if (!user?.user?._id) return;

      try {
        setLoading(true);
        // Note: Using your existing history endpoint
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/redeem-points/redeem-history`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          // Filter history to only show records belonging to the logged-in user
          const myData = response.data.data.filter(
            (item) => item.user_id?._id === user.user._id || item.user_id === user.user._id
          );
          setHistory(myData);
        }
      } catch (err) {
        setError(err.message || "Failed to fetch history");
      } finally {
        setLoading(false);
      }
    };

    fetchMyHistory();
  }, [user, token]);

  if (error) return <div className="p-4 text-red-500 text-center">{error}</div>;

  return (
    <div>

      <div className="mb-8">
        <h1 className="text-xl font-bold text-[#0c1f4d] flex items-center gap-2">
          <Wallet className="h-6 w-6" /> Your Redemption History
        </h1>
        <p className="text-sm text-gray-500 mt-1">Manage your points and earnings</p>
      </div>

      {loading ? (
        <div className="flex justify-center flex-col items-center min-h-[40vh] w-full">
          <Loader contained={true} label="Loading history..." />
        </div>
      ) : history.length === 0 ? (
        <div className="bg-gray-100 p-8 text-center rounded-lg text-gray-500">
          No redemption records found.
        </div>
      ) : (
        <div className="overflow-x-auto shadow-md rounded-lg">
          <table className="w-full text-left bg-white">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Date</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Code/Type</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Points</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Amount</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {history.map((item) => (
                <tr key={item._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">
                    {new Date(item.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium">{item.coupon_code}</div>
                    <div className="text-xs text-gray-400">
                      {item.coupon_id?.coupon_name || "Cash Redemption"}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold">
                    {item.redeem_point.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-green-600 font-medium">
                    ₹{item.amount_in_inr}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full font-bold uppercase ${item.status === 'approved' ? 'bg-green-100 text-green-700' :
                        item.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                      }`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};

export default RedeemHistory;
