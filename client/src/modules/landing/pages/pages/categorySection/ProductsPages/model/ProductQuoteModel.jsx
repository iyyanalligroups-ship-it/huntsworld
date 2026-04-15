import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, Send } from "lucide-react";
import { useState, useEffect } from "react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { isValidPhoneNumber, parsePhoneNumber } from "libphonenumber-js";
import { useAddQuoteMutation } from "@/redux/api/ProductQuoteApi";
import "../../../../../css/ProductQuoteModel.css";
import { useNavigate } from "react-router-dom";
import showToast from "@/toast/showToast";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const ProductQuoteModel = ({ product,productId, open, setOpen, userId, phone }) => {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [quantity, setQuantity] = useState("");
  const [quantityError, setQuantityError] = useState("");
  const [matchQuotes, setMatchQuotes] = useState(true);
  const [customUnit, setCustomUnit] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");

  const [postQuote, { isLoading, error, isSuccess }] = useAddQuoteMutation();

  const unitOptions = [
    { label: "Kilogram", value: "kg" },
    { label: "Gram", value: "g" },
    { label: "Ton", value: "ton" },
    { label: "Piece", value: "pcs" },
    { label: "Liter", value: "ltr" },
    { label: "Meter", value: "m" },
    { label: "Centimeter", value: "cm" },
    { label: "Dozen", value: "dz" },
    { label: "Pack", value: "pk" },
    { label: "Other", value: "other" },
  ];

  useEffect(() => {
    let initialPhone = phone || "";
    if (initialPhone && !initialPhone.startsWith("+")) {
      initialPhone = `+91${initialPhone}`;
    }
    setPhoneNumber(initialPhone);

    if (!userId) {
      navigate("/login");
      showToast("Please log in to submit a quote.", "info");
      return;
    }
    if (!initialPhone || initialPhone.trim() === "") {
      showToast(
        "Please update your phone number in your profile settings before submitting a quote.",
        "info"
      );
    }
  }, [userId, phone, navigate]);
const validateForm = () => {
  if (!quantity || Number(quantity) <= 0) {
    showToast("⚠️ Please enter a valid quantity.", "error");
    return false;
  }

  if (!product?.unit) {
    if (!selectedUnit) {
      showToast("⚠️ Please select a unit.", "error");
      return false;
    }

    if (selectedUnit === "other" && !customUnit.trim()) {
      showToast("⚠️ Please enter a custom unit.", "error");
      return false;
    }
  }

  if (!phoneNumber || phoneNumber.trim() === "") {
    showToast("⚠️ Please enter your phone number.", "error");
    return false;
  }

  if (phoneError) {
    showToast("⚠️ Please enter a valid phone number.", "error");
    return false;
  }

  return true;
};

  const handlePhoneChange = (value) => {
    setPhoneNumber(value || "");
    if (value) {
      try {
        const phoneNumberParsed = parsePhoneNumber(value);
        if (!isValidPhoneNumber(value)) {
          setPhoneError("Invalid phone number");
        } else {
          setPhoneError("");
        }
      } catch (error) {
        setPhoneError("Invalid phone number format");
      }
    } else {
      setPhoneError("");
    }
  };

  const isFormValid = quantity && !quantityError && phoneNumber && !phoneError;

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validateForm()) return;

  if (!userId) {
    showToast("Please log in to submit a quote.", "info");
    navigate("/login");
    return;
  }

  try {
    const finalUnit =
      product?.unit ||
      (selectedUnit === "other"
        ? customUnit.trim().toLowerCase()
        : selectedUnit);

    const quoteData = {
      userId,
      productId,
      quantity,
      unit: finalUnit,
      phoneNumber,
      matchQuotes,
    };

    const res = await postQuote(quoteData).unwrap();

    showToast(res?.message || "✅ Quote submitted successfully!", "success");

    // Reset form
    setOpen(false);
    setQuantity("");
    setSelectedUnit("");
    setCustomUnit("");
    setPhoneNumber("");
  } catch (err) {
    const backendMessage =
      err?.data?.message || "⚠️ Failed to submit quote. Please try again.";
    showToast(backendMessage, "error");
  }
};


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild></DialogTrigger>
      <DialogContent className="max-w-6xl w-full p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-800">
            Request a Quote
          </DialogTitle>
          <DialogClose />
        </DialogHeader>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <Card className="border border-gray-100 rounded-xl">
              <CardContent className="space-y-6 py-8">
                <h3 className="text-lg font-semibold text-gray-800">Get Your Quote</h3>

                {/* Quantity & Unit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity & Unit
                  </label>
                  <div className="flex gap-3">
                    <Input
                      type="number"
                      placeholder="Enter quantity"
                      className="flex-1 rounded-md border-gray-300 focus:ring-[#0c1f4d] focus:border-[#0c1f4d]"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                    {product?.unit ? (
                      <Input
                        value={product.unit}
                        placeholder="Unit"
                        className="w-32 rounded-md border-gray-300 bg-gray-50"
                        readOnly
                      />
                    ) : (
                      <div className="w-32">
                        <Select onValueChange={(val) => setSelectedUnit(val)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Unit" />
                          </SelectTrigger>
                          <SelectContent>
                            {unitOptions.map((unit) => (
                              <SelectItem key={unit.value} value={unit.value}>
                                {unit.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedUnit === "other" && (
                          <Input
                            type="text"
                            placeholder="Enter unit"
                            value={customUnit}
                            onChange={(e) =>
                              setCustomUnit(e.target.value.replace(/[^A-Za-z]/g, ""))
                            }
                            className="mt-2"
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile Number
                  </label>
                  <PhoneInput
                    placeholder="Enter phone number"
                    defaultCountry="IN"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    className="custom-phone-input w-full border-2 rounded-md p-3"
                    international
                    countryCallingCodeEditable={false}
                    addInternationalOption={false}
                  />
                  {phoneError && <p className="text-[#0c1f4d] text-sm mt-2">{phoneError}</p>}
                </div>

                {/* Checkbox */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="matchQuotes"
                    checked={matchQuotes}
                    onChange={(e) => setMatchQuotes(e.target.checked)}
                    className="h-4 w-4 text-[#0c1f4d] focus:ring-[#0c1f4d] border-gray-300 rounded"
                  />
                  <label htmlFor="matchQuotes" className="text-sm text-gray-600">
                    Include quotes from matching suppliers
                  </label>
                </div>

                {/* Submit Button */}
                <Button
                  className={`${
                    isFormValid ? "cursor-pointer" : "cursor-not-allowed"
                  } w-full bg-[#ea1a24] hover:bg-[#c02c2c] text-white font-medium rounded-md py-3 transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed`}
                  onClick={handleSubmit}
                  disabled={!isFormValid || isLoading}
                >
                  {isLoading ? (
                    "Submitting..."
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" /> Submit Quote
                    </>
                  )}
                </Button>

                {error && (
                  <p className="text-red-500 text-sm text-center font-medium bg-red-50 py-2 px-4 rounded-lg border border-red-100">
                    {error.data?.message || "Something went wrong. Please try again."}
                  </p>
                )}
                {isSuccess && (
                  <p className="text-green-500 text-sm text-center">
                    Quote submitted successfully!
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductQuoteModel;
