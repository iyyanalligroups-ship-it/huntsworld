import { useEffect, useState } from "react";
import axios from "axios";
import Loader from "@/loader/Loader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import showToast from "@/toast/showToast";

const initialState = {
  payment_method: "",
  bank_details: {
    account_holder_name: "",
    account_number: "",
    ifsc_code: "",
  },
  upi_id: "",
  upi_number: "",
  userId:""
};

export default function PaymentAccountForm({
  open,
  setOpen,
  editData,
  refresh,
  userId
}) {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const isEdit = Boolean(editData?._id);

  useEffect(() => {
    if (editData) {
      setForm(editData);
    } else {
      setForm(initialState);
    }
  }, [editData, open]);

  const handleSubmit = async () => {
    // Basic validation
    if (!form.payment_method) {
      showToast("Please select a payment method", "error");
      return;
    }
    form.userId=userId;

    setLoading(true);
    try {
      if (isEdit) {
        await axios.patch(`${import.meta.env.VITE_API_URL}/payment-accounts/${editData._id}`, form);
        showToast("Payment account updated successfully", "success");
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/payment-accounts`, form);
        showToast("Payment account created successfully", "success");
      }

      refresh();
      setOpen(false);
      setForm(initialState);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Something went wrong. Please try again.";
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Payment Account" : "Add New Payment Account"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update your payment details below."
              : "Choose a payment method to receive funds."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Payment Method Selector */}
          <div className="grid gap-2">
            <label className="text-sm font-medium leading-none">
              Payment Method
            </label>
            <Select
              value={form.payment_method}
              onValueChange={(value) =>
                setForm({ ...form, payment_method: value })
              }
            >
              <SelectTrigger className="border-2 border-slate-300">
                <SelectValue placeholder="Choose payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BANK">Bank Transfer</SelectItem>
                <SelectItem value="UPI_ID">UPI ID (VPA)</SelectItem>
                <SelectItem value="UPI_NUMBER">UPI Number</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Conditional Rendering based on Selection */}
          {form.payment_method === "BANK" && (
            <div className="grid gap-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="grid gap-2">
                <label className="text-sm font-medium leading-none">
                  Account Holder Name
                </label>
                <Input
                  placeholder="Enter full name of account holder"
                  maxLength={50}
                  value={form.bank_details?.account_holder_name || ""}
                  className="border-2 border-slate-300"
                  onChange={(e) =>
                    setForm({
                      ...form,
                      bank_details: {
                        ...form.bank_details,
                        account_holder_name: e.target.value,
                      },
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium leading-none">
                    Account Number
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. 123456789012"
                    maxLength={18}
                    className="border-2 border-slate-300"
                    value={form.bank_details?.account_number || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^\d*$/.test(val) && val.length <= 18) {
                        setForm({
                          ...form,
                          bank_details: {
                            ...form.bank_details,
                            account_number: val,
                          },
                        });
                      }
                    }}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium leading-none">
                    IFSC Code
                  </label>
                  <Input
                    placeholder="Enter 11-digit IFSC code"
                    className="uppercase border-2 border-slate-300"
                    maxLength={11}
                    value={form.bank_details?.ifsc_code || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        bank_details: {
                          ...form.bank_details,
                          ifsc_code: e.target.value.toUpperCase(),
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {form.payment_method === "UPI_ID" && (
            <div className="grid gap-2 animate-in fade-in zoom-in-95 duration-200">
              <label className="text-sm font-medium leading-none">UPI ID</label>
              <Input
                placeholder="e.g. merchant@upi"
                maxLength={50}
                className="border-2 border-slate-300"
                value={form.upi_id}
                onChange={(e) =>
                  setForm({ ...form, upi_id: e.target.value })
                }
              />
            </div>
          )}

          {form.payment_method === "UPI_NUMBER" && (
            <div className="grid gap-2 animate-in fade-in zoom-in-95 duration-200">
              <label className="text-sm font-medium leading-none">
                UPI Mobile Number
              </label>
              <Input
                type="text"
                placeholder="e.g. 9876543210"
                maxLength={10}
                className="border-2 border-slate-300"
                value={form.upi_number}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^\d*$/.test(val) && val.length <= 10) {
                    setForm({ ...form, upi_number: val });
                  }
                }}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="cursor-pointer">
            {isEdit ? "Save Changes" : "Create Account"}
          </Button>
        </DialogFooter>
      </DialogContent>
      {loading && <Loader />}
    </Dialog>
  );
}
