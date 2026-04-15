import { useEffect, useState } from "react";
import axios from "axios";
import {
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Landmark,
  Smartphone,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import showToast from "@/toast/showToast";
import PaymentAccountForm from "./PaymentAccountForm";
import DeleteDialog from "@/model/DeleteModel"; // Import the component above
import Loader from "@/loader/Loader";

export default function PaymentAccountList({ userId }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // State for Edit/Add Modal
  const [open, setOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  // State for Delete Confirmation Modal
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/payment-accounts/user/${userId}`);
      setAccounts(res.data.data || []);
    } catch (error) {
      showToast("Failed to fetch payment accounts", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) fetchAccounts();
  }, [userId]);

  // 1. Triggered when clicking the Trash Icon
  const confirmDelete = (id) => {
    setDeleteId(id);
    setDeleteOpen(true);
  };

  // 2. Triggered when clicking "Delete" inside the Dialog
  const handleFinalDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/payment-accounts/${deleteId}`);
      showToast("Payment account deleted 🗑️", "success");
      fetchAccounts();
    } catch (err) {
      showToast(err.response?.data?.message || "Delete failed", "error");
    } finally {
      setIsDeleting(false);
      setDeleteOpen(false);
      setDeleteId(null);
    }
  };

  const handleSetActive = async (id) => {
    try {
      await axios.patch(`${import.meta.env.VITE_API_URL}/payment-accounts/${id}/set-active`);
      showToast("Account set as active ✅", "success");
      fetchAccounts();
    } catch (err) {
      showToast("Failed to update status", "error");
    }
  };

  const handleAddNew = () => {
    setEditData(null);
    setOpen(true);
  };

  const getMethodIcon = (type) => {
    if (type === "BANK") return <Landmark className="h-5 w-5 text-blue-600" />;
    return <Smartphone className="h-5 w-5 text-purple-600" />;
  };

  const renderAccountDetails = (item) => {
    if (item.payment_method === "BANK") {
      return (
        <div className="space-y-1">
          <p className="font-semibold text-gray-900 truncate">
            {item.bank_details?.account_holder_name}
          </p>
          <p className="text-sm text-gray-500">
            {item.bank_details?.ifsc_code} •• {item.bank_details?.account_number?.slice(-4)}
          </p>
        </div>
      );
    }
    return (
      <div className="space-y-1">
        <p className="font-semibold text-gray-900 truncate">
          {item.upi_id || item.upi_number}
        </p>
        <p className="text-sm text-gray-500 capitalize">
          {item.payment_method?.replace("_", " ").toLowerCase()}
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Payment Methods</h2>
          <p className="text-sm text-gray-500">Manage how you receive payments.</p>
        </div>
        <Button onClick={handleAddNew} className="bg-[#0c1f4d] hover:bg-[#0c1f4de6]">
          <Plus className="mr-2 h-4 w-4" /> Add Method
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center flex-col items-center min-h-[40vh] w-full">
          <Loader contained={true} label="Fetching payment methods..." />
        </div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-xl bg-gray-50">
          <div className="bg-gray-100 p-3 rounded-full w-fit mx-auto mb-3">
            <AlertCircle className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No accounts found</h3>
          <p className="text-sm text-gray-500 mb-4">Add a bank account or UPI ID to get started.</p>
          <Button variant="outline" onClick={handleAddNew}>
            Add First Account
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {accounts.map((item) => (
            <Card
              key={item._id}
              className={`relative transition-all duration-200 hover:shadow-md ${
                item.is_active
                  ? "border-green-500 shadow-sm ring-1 ring-green-500/20 bg-green-50/10"
                  : "border-gray-200"
              }`}
            >
              <CardHeader className="pb-3 pt-5 flex flex-row items-start justify-between space-y-0">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${item.payment_method === 'BANK' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                    {getMethodIcon(item.payment_method)}
                  </div>
                  <div>
                    <CardTitle className="text-sm font-medium text-gray-500">
                      {item.payment_method === "BANK" ? "Bank Transfer" : "UPI"}
                    </CardTitle>
                  </div>
                </div>
                {item.is_active && (
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                    Default
                  </Badge>
                )}
              </CardHeader>

              <CardContent className="pb-3">
                {renderAccountDetails(item)}
              </CardContent>

              <CardFooter className="pt-3 border-t bg-gray-50/50 flex justify-between items-center gap-2">
                {!item.is_active ? (
                   <Button
                   variant="ghost"
                   size="sm"
                   className="text-xs text-gray-600 hover:text-green-700 hover:bg-green-50 px-2 h-8"
                   onClick={() => handleSetActive(item._id)}
                 >
                   <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                   Make Default
                 </Button>
                ) : (
                  <span className="text-xs font-medium text-green-600 flex items-center px-2">
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                    Active Account
                  </span>
                )}

                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 cursor-pointer hover:text-blue-600 hover:bg-blue-50"
                    onClick={() => {
                      setEditData(item);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>

                  {/* UPDATE: Delete button triggers the confirmation dialog */}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 cursor-pointer hover:text-red-600 hover:bg-red-50"
                    onClick={() => confirmDelete(item._id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <PaymentAccountForm
        open={open}
        setOpen={setOpen}
        userId={userId}
        editData={editData}
        refresh={fetchAccounts}
      />

      {/* Delete Confirmation Modal */}
      <DeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleFinalDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}
