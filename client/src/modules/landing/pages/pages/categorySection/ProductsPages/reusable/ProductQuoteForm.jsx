import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Send } from "lucide-react";
import { useState, useContext, useEffect } from "react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { isValidPhoneNumber, parsePhoneNumber } from "libphonenumber-js";
import { useAddQuoteMutation } from "@/redux/api/ProductQuoteApi";
import "../../../../../css/ProductQuoteModel.css";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import showToast from "@/toast/showToast";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const ProductQuoteForm = ({ product }) => {
  const { user } = useContext(AuthContext);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [quantity, setQuantity] = useState("");
  const [matchQuotes, setMatchQuotes] = useState(true);
  const [customUnit, setCustomUnit] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");

  const [postQuote, { isLoading }] = useAddQuoteMutation();

  // Pre-fill phone number from user profile ONLY on component mount
  useEffect(() => {
    if (user?.user?.phone) {
      let normalizedPhone = user.user.phone;
      if (!normalizedPhone.startsWith("+")) {
        normalizedPhone = `+91${normalizedPhone}`;
      }
      setPhoneNumber(normalizedPhone);
    }
  }, []); // Empty dependency array → runs only once on mount

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

  const handlePhoneChange = (value) => {
    setPhoneNumber(value || "");
    if (value) {
      try {
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

  // Unit is valid if: product has unit OR user selected one (and provided custom if "other")
  const hasValidUnit =
    !!product.unit ||
    (selectedUnit &&
      (selectedUnit !== "other" || (selectedUnit === "other" && customUnit.trim())));

  const isFormValid =
    !!quantity &&
    !!phoneNumber &&
    !phoneError &&
    hasValidUnit;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isFormValid) {
      showToast("Please fill all required fields correctly.", "error");
      return;
    }

    try {
      const finalUnit =
        product.unit ||
        (selectedUnit === "other" ? customUnit.trim().toLowerCase() : selectedUnit);

      const quoteData = {
        userId: user?.user?._id,
        productId: product._id,
        quantity,
        unit: finalUnit,
        phoneNumber,
        matchQuotes,
      };

      const res = await postQuote(quoteData).unwrap();
      showToast(res.message || "Quote Sent Successfully", "success");

      // Fully reset the form after successful submission
      setQuantity("");
      setSelectedUnit("");
      setCustomUnit("");
      setPhoneNumber(""); // Clear phone number completely
      setMatchQuotes(true); // Reset checkbox to default

    } catch (err) {
      showToast(
        err?.data?.message || err.message || "Something went wrong",
        "error"
      );
      console.error("Failed to submit quote:", err);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <div className="flex-1">
        <Card className="shadow-lg border border-gray-100 rounded-xl">
          <CardContent className="space-y-6 py-8">
            <h3 className="text-lg font-semibold text-gray-800">
              Get Your Quote
            </h3>

            {/* Quantity & Unit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity & Unit{" "}
                {!product.unit && <span className="text-red-500">*</span>}
              </label>
              <div className="flex gap-3">
                <Input
                  type="number"
                  placeholder="Enter quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="flex-1 rounded-md border-gray-300 focus:ring-[#0c1f4d] focus:border-[#0c1f4d]"
                />

                {product.unit ? (
                  <Input
                    value={product.unit}
                    readOnly
                    className="w-32 rounded-md border-gray-300 bg-gray-50"
                  />
                ) : (
                  <div className="w-32">
                    <Select
                      value={selectedUnit}
                      onValueChange={(val) => setSelectedUnit(val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
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
                      <div className="mt-2">
                        <Input
                          type="text"
                          placeholder="Enter custom unit"
                          value={customUnit}
                          onChange={(e) =>
                            setCustomUnit(
                              e.target.value.replace(/[^A-Za-z]/g, "")
                            )
                          }
                          className={`w-full ${
                            selectedUnit === "other" && !customUnit.trim()
                              ? "border-red-400 focus:border-red-500"
                              : "border-gray-300 focus:border-[#0c1f4d]"
                          }`}
                        />
                        {selectedUnit === "other" && !customUnit.trim() && (
                          <p className="text-xs text-red-500 mt-1">
                            Custom unit is required
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <PhoneInput
                international
                defaultCountry="IN"
                countryCallingCodeEditable={false}
                addInternationalOption={false}
                placeholder="Enter phone number"
                value={phoneNumber}
                onChange={handlePhoneChange}
                className="custom-phone-input w-full border-2 rounded-md p-3"
              />
              {phoneError && (
                <p className="text-red-500 text-sm mt-2">{phoneError}</p>
              )}
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
              onClick={handleSubmit}
              disabled={!isFormValid || isLoading}
              className="w-full bg-[#ea1a24] hover:bg-[#c02c2c] text-white font-medium rounded-md py-3 transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                "Submitting..."
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" /> Submit Quote
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProductQuoteForm;
