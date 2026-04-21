import { useContext, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { isValidPhoneNumber } from "libphonenumber-js";
import { Clock, ListChecks, ShoppingBag, X, CheckCircle2, Store, AlertTriangle } from "lucide-react";
import {
  useCreateGrocerySellerRequirementMutation,
  useUpdateGrocerySellerRequirementMutation,
} from "@/redux/api/GrocerySellerRequirementApi";
import { useGetAddressesForPostByRequirementQuery } from "@/redux/api/PostByRequirementApi";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { toast } from "react-toastify";
import GrocerySellerRequirementList from "./RequirementList";
import Loader from "@/loader/Loader";
import { useSidebar } from "@/modules/admin/hooks/useSidebar";
import { Textarea } from "@/components/ui/textarea";
import ProductNameAutocomplete from "@/modules/merchant/pages/products/ProductNameAutocomplete";
import { useCheckUserSubscriptionQuery } from '@/redux/api/BannerPaymentApi';
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export default function GrocerySellerRequirement() {
  const { user, token } = useContext(AuthContext);
  const user_id = user?.user?._id;
  const { isSidebarOpen } = useSidebar();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(null);
  const [requirementMode, setRequirementMode] = useState("buy");

  const [formData, setFormData] = useState({
    product_name: "",
    quantity: "",
    unit_of_measurement: "",
    phone_number: "",
    description: "",
    type: "product",
    supplier_preference: "All India",
    selected_states: [],
    category_id: null,
    sub_category_id: null,
    user_id: user?.user?._id || null,
  });

  const [memberType, setMemberType] = useState("");
  const [hasFullAccess, setHasFullAccess] = useState(false);
  const [addressErrorMessage, setAddressErrorMessage] = useState("");
  const [customUnit, setCustomUnit] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [addressBlocked, setAddressBlocked] = useState(false);
  const [verifiedBlocked, setVerifiedBlocked] = useState(false);

  const { data: subscriptionData } = useCheckUserSubscriptionQuery(user_id);
  const [createPost, { isLoading: isCreating }] = useCreateGrocerySellerRequirementMutation();
  const [updatePost, { isLoading: isUpdating }] = useUpdateGrocerySellerRequirementMutation();

  const { data: states = [], isLoading: statesLoading } = useGetAddressesForPostByRequirementQuery();

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

  // ────────────────────────────────────────────────
  //  Effects & Data Fetching
  // ────────────────────────────────────────────────

  useEffect(() => {
    if (subscriptionData?.hasSubscription === false) {
      setAddressBlocked(true);
      setAddressErrorMessage("You need to purchase a subscription plan to post requirements.");
    }
  }, [subscriptionData]);

  useEffect(() => {
    const fetchSellerDetails = async () => {
      if (!user?.user?._id || !token) return;
      try {
        const res = await axios.get(
          `${API_URL}/grocery-sellers/fetch-by-userid-grocery-seller/${user.user._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.success) {
          setMemberType(res.data.data?.member_type?.name || "");
          setHasFullAccess(res.data.data?.member_type?.has_full_access || false);
          setVerifiedBlocked(!res.data.data?.verified_status);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchSellerDetails();
  }, [user, token]);

  useEffect(() => {
    let initialPhone = isEditing?.phone_number || user?.user?.phone || "";
    if (initialPhone && !initialPhone.startsWith("+")) initialPhone = `+91${initialPhone}`;

    setFormData({
      product_name: isEditing?.product_name || "",
      quantity: isEditing?.quantity || "",
      unit_of_measurement: isEditing?.unit_of_measurement || "",
      phone_number: initialPhone,
      description: isEditing?.description || "",
      type: isEditing?.type || "product",
      supplier_preference: isEditing?.supplier_preference || "All India",
      selected_states: isEditing?.selected_states || [],
      category_id: isEditing?.category_id || null,
      sub_category_id: isEditing?.sub_category_id || null,
      user_id: user?.user?._id || null,
    });

    setRequirementMode(isEditing?.requirement_type || "buy");

    setCustomUnit(
      isEditing?.unit_of_measurement &&
        !unitOptions.some(o => o.value === isEditing.unit_of_measurement)
        ? isEditing.unit_of_measurement
        : ""
    );
  }, [isEditing, user]);

  // ────────────────────────────────────────────────
  //  Handlers
  // ────────────────────────────────────────────────

  const handlePhoneChange = (value) => {
    setFormData(prev => ({ ...prev, phone_number: value || "" }));
    if (value) {
      setPhoneError(isValidPhoneNumber(value) ? "" : "Invalid phone number");
    } else {
      setPhoneError("");
    }
  };

  const removeState = (stateToRemove) => {
    setFormData(prev => ({
      ...prev,
      selected_states: prev.selected_states.filter(s => s !== stateToRemove),
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleStateSelection = (value) => {
    setFormData(prev => {
      if (prev.selected_states.includes(value)) {
        return {
          ...prev,
          selected_states: prev.selected_states.filter(s => s !== value),
        };
      }
      return {
        ...prev,
        selected_states: [...prev.selected_states, value],
      };
    });
  };

  const setSupplierPreference = (pref) => {
    setFormData(prev => ({
      ...prev,
      supplier_preference: pref,
      selected_states: pref === "Specific States" ? prev.selected_states : [],
    }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.product_name.trim()) errors.product_name = "Product name is required.";
    if (!formData.quantity) errors.quantity = "Quantity is required.";
    if (!formData.unit_of_measurement) errors.unit_of_measurement = "Unit is required.";
    if (formData.unit_of_measurement === "other" && !customUnit.trim()) {
      errors.unit_of_measurement = "Custom unit is required.";
    }
    if (!formData.description.trim()) errors.description = "Description is required.";
    if (!formData.phone_number) errors.phone_number = "Phone number is required.";
    if (formData.phone_number && !isValidPhoneNumber(formData.phone_number)) {
      errors.phone_number = "Invalid phone number.";
    }
    if (formData.supplier_preference === "Specific States" && formData.selected_states.length === 0) {
      errors.selected_states = "Select at least one state.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix the errors.");
      return;
    }

    const finalUnit = formData.unit_of_measurement === "other" ? customUnit.trim().toLowerCase() : formData.unit_of_measurement;

    const payload = {
      ...formData,
      requirement_type: requirementMode,
      unit_of_measurement: finalUnit,
    };

    try {
      if (isEditing?._id) {
        const res = await updatePost({ id: isEditing._id, ...payload }).unwrap();
        toast.success(res.message || "Updated successfully!");
      } else {
        const res = await createPost(payload).unwrap();
        toast.success(res.message || "Posted successfully!");
      }
      // reset form
      setFormData({
        product_name: "",
        quantity: "",
        unit_of_measurement: "",
        phone_number: user?.user?.phone ? `+91${user.user.phone}` : "",
        description: "",
        type: "product",
        supplier_preference: "All India",
        selected_states: [],
        category_id: null,
        sub_category_id: null,
        user_id: user?.user?._id || null,
      });
      setCustomUnit("");
      setIsEditing(null);
      setRequirementMode("buy");
    } catch (err) {
      toast.error(err?.data?.error || "Something went wrong!");
    }
  };

  // ────────────────────────────────────────────────
  //  JSX
  // ────────────────────────────────────────────────

  return (
    <div className={`flex-1 p-4 transition-all duration-300 ${isSidebarOpen ? "ml-1 sm:ml-64" : "ml-1 sm:ml-16"}`}>

      {(isCreating || isUpdating) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <Loader label={isEditing ? "Updating post..." : "Saving post..."} />
        </div>
      )}

      {/* Blocked overlays */}
      {!hasFullAccess && (
        <>
          {addressBlocked && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-sm border-t-4 border-red-600 p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 bg-red-100 rounded-full p-2">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Action Required</h3>
                    <p className="mt-2 text-sm text-gray-600">{addressErrorMessage}</p>
                  </div>
                </div>
                <Button
                  className="mt-6 w-full bg-red-600 hover:bg-red-700 cursor-pointer"
                  onClick={() => navigate("/baseMember/plans")}
                >
                  Go to Plans
                </Button>
              </div>
            </div>
          )}

          {verifiedBlocked && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-sm border-t-4 border-red-600 p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 bg-red-100 rounded-full p-2">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Action Required</h3>
                    <p className="mt-2 text-sm text-gray-600">
                      Your account needs to be verified to post requirements.
                    </p>
                  </div>
                </div>
                <Button
                  className="mt-6 w-full bg-red-600 hover:bg-red-700"
                  onClick={() => navigate("/baseMember/settings")}
                >
                  Go to Settings
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Guidelines Card */}
      <div className="bg-white rounded-2xl shadow-xl border overflow-hidden mb-8">
        <div className="bg-[#0c1f4d] p-5 flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-lg text-white">
            <ListChecks size={24} />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">Member Guidelines</h3>
            <p className="text-blue-200 text-xs">Standard Operating Procedure</p>
          </div>
        </div>

        <div className="p-6 space-y-8">
          <div className="relative pl-6 border-l-4 border-blue-600">
            <div className="absolute -left-3 top-0 bg-white rounded-full p-1 text-blue-600">
              <ShoppingBag size={20} className="stroke-blue-600" fill="white" />
            </div>
            <h3 className="font-bold text-lg text-[#0c1f4d]">1. Posting a Buy Requirement</h3>
            <p className="text-sm text-gray-500 mt-1 mb-3">Use this when you need stock for your business.</p>
            {/* ... rest of buy guidelines ... */}
          </div>

          <div className="relative pl-6 border-l-4 border-green-600">
            <div className="absolute -left-3 top-0 bg-white rounded-full p-1 text-green-600">
              <Store size={20} className="stroke-green-600" fill="white" />
            </div>
            <h3 className="font-bold text-lg text-[#0c1f4d]">2. Posting a Sell Offer</h3>
            <p className="text-sm text-gray-500 mt-1 mb-3">Use this to list your harvest or inventory for sale.</p>
            {/* ... rest of sell guidelines ... */}
          </div>

          <div className="bg-gray-50 p-5 rounded-xl border">
            <h3 className="font-bold flex items-center gap-2 mb-4">
              <AlertTriangle className="text-amber-500" />
              Essential Rules
            </h3>
            {/* ... rules list ... */}
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:p-4">
        {/* ─── FORM ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full lg:max-w-3xl bg-white rounded-2xl lg:p-6 shadow-lg"
        >
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center bg-gray-100 rounded-full p-2">
              <span className={`px-5 py-2 rounded-full font-medium ${requirementMode === "buy" ? "bg-blue-600 text-white" : "text-gray-600"}`}>
                Buy
              </span>
              <Switch
                checked={requirementMode === "sell"}
                onCheckedChange={checked => setRequirementMode(checked ? "sell" : "buy")}
                className="mx-3"
              />
              <span className={`px-5 py-2 rounded-full font-medium ${requirementMode === "sell" ? "bg-green-600 text-white" : "text-gray-600"}`}>
                Sell
              </span>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-center mb-2 text-[#0c1f4d]">
            {requirementMode === "buy" ? "What do you need?" : "What do you want to sell?"}
          </h2>
          <p className="text-center text-gray-600 mb-8">
            {requirementMode === "buy"
              ? "Get instant quotes from verified suppliers across India"
              : "Connect with buyers looking for your products"}
          </p>

          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Product Name */}
                <div>
                  <label className="block font-medium mb-1.5">
                    {requirementMode === "buy" ? "Product Needed" : "Product Name"}
                  </label>
                  <ProductNameAutocomplete
                    value={formData.product_name}
                    onChange={e => {
                      setFormData(p => ({
                        ...p,
                        product_name: e.target.value,
                        category_id: e.target.product?.category_id || p.category_id,
                        sub_category_id: e.target.product?.sub_category_id || p.sub_category_id
                      }));
                      setFormErrors(p => ({ ...p, product_name: "" }));
                    }}
                  />
                  {formErrors.product_name && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.product_name}</p>
                  )}
                </div>

                {/* Quantity + Unit */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block font-medium mb-1.5">Quantity</label>
                    <Input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleChange}
                      placeholder="e.g. 50"
                      className="border-2 border-slate-300"
                    />
                    {formErrors.quantity && <p className="text-red-500 text-sm mt-1">{formErrors.quantity}</p>}
                  </div>

                  <div>
                    <label className="block font-medium mb-1.5">Unit</label>
                    <Select
                      value={formData.unit_of_measurement}
                      onValueChange={v => setFormData(p => ({ ...p, unit_of_measurement: v }))}
                    >
                      <SelectTrigger className="border-2 border-slate-300">
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {unitOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {formData.unit_of_measurement === "other" && (
                      <Input
                        className="mt-2 border-2 border-slate-300"
                        value={customUnit}
                        onChange={e => setCustomUnit(e.target.value.replace(/[^A-Za-z\s]/g, ""))}
                        placeholder="e.g. sack, bundle"
                      />
                    )}

                    {formErrors.unit_of_measurement && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.unit_of_measurement}</p>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block font-medium mb-1.5">Description</label>
                  <Textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder={
                      requirementMode === "buy"
                        ? "e.g. Need fresh, red tomatoes for restaurant..."
                        : "e.g. Selling farm-fresh eggs, packed in 30-egg trays..."
                    }
                    rows={4}
                    className="border-2 border-slate-300"
                  />
                  {formErrors.description && <p className="text-red-500 text-sm mt-1">{formErrors.description}</p>}
                </div>

                {/* Category */}
                <div>
                  <label className="block font-medium mb-1.5">Category</label>
                  <Select
                    value={formData.type}
                    onValueChange={v => setFormData(p => ({ ...p, type: v }))}
                  >
                    <SelectTrigger className="border-2 border-slate-300">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="product">Merchant (Product)</SelectItem>
                      <SelectItem value="service">Service Provider</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Phone */}
                <div>
                  <label className="block font-medium mb-1.5">Phone Number</label>
                    <PhoneInput
                      international
                      defaultCountry="IN"
                      countryCallingCodeEditable={false}
                      value={formData.phone_number}
                      onChange={handlePhoneChange}
                      className="custom-phone-input border-2 border-slate-300 rounded-md p-3"
                    />
                  {(phoneError || formErrors.phone_number) && (
                    <p className="text-red-500 text-sm mt-1">{phoneError || formErrors.phone_number}</p>
                  )}
                </div>

                {/* Reach */}
                <div>
                  <label className="block font-medium mb-1.5">Reach</label>
                  <div className="flex gap-3">
                    {["All India", "Specific States"].map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setSupplierPreference(opt)}
                        className={`px-6 py-2.5 rounded-lg border font-medium transition ${formData.supplier_preference === opt
                            ? "bg-[#0c1f4d] text-white border-[#0c1f4d]"
                            : "border-gray-300 hover:bg-gray-100"
                          }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* States */}
                {formData.supplier_preference === "Specific States" && (
                  <div>
                    <label className="block font-medium mb-1.5">Select States</label>

                    {statesLoading ? (
                      <p className="text-gray-500 mt-2">Loading states...</p>
                    ) : states.length === 0 ? (
                      <p className="text-gray-500 mt-2">No states available</p>
                    ) : (
                      <Select onValueChange={handleStateSelection}>
                        <SelectTrigger className="mt-1.5 border-2 border-slate-300">
                          <SelectValue placeholder="Choose states" />
                        </SelectTrigger>
                        <SelectContent>
                          {states.map(state => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    <div className="flex flex-wrap gap-2 mt-3">
                      {formData.selected_states.map(state => (
                        <Badge
                          key={state}
                          variant="secondary"
                          className="px-3 py-1 flex items-center gap-1.5"
                        >
                          {state}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              removeState(state);
                            }}
                            className="rounded-full hover:bg-red-100 p-0.5 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </Badge>
                      ))}
                    </div>

                    {formErrors.selected_states && (
                      <p className="text-red-500 text-sm mt-1.5">{formErrors.selected_states}</p>
                    )}
                  </div>
                )}

                {/* Submit */}
                <Button
                  type="submit"
                  className={`w-full py-6 text-lg font-semibold ${requirementMode === "buy"
                      ? "bg-[#0c1f4d] hover:bg-[#0c1f4d]/90"
                      : "bg-green-600 hover:bg-green-700"
                    }`}
                >
                  {isEditing ? "Update Post" : requirementMode === "buy" ? "Post Buy Requirement" : "Post Sell Offer"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Benefits sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full lg:w-96 bg-white rounded-2xl shadow-xl p-6 h-fit"
        >
          <h2 className="text-2xl font-bold mb-6 text-[#0c1f4d]">Why Post Here?</h2>
          <div className="space-y-6">
            <div className="flex gap-4">
              <Clock className="w-10 h-10 text-blue-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold">Instant Reach</h3>
                <p className="text-sm text-gray-600">Your post goes live immediately</p>
              </div>
            </div>
            <div className="flex gap-4">
              <ShoppingBag className="w-10 h-10 text-green-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold">Verified Users</h3>
                <p className="text-sm text-gray-600">Connect with genuine buyers & sellers</p>
              </div>
            </div>
            <div className="flex gap-4">
              <ListChecks className="w-10 h-10 text-purple-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold">Best Deals</h3>
                <p className="text-sm text-gray-600">Compare multiple offers quickly</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Your posts list */}
      <div className="mt-10">
        <GrocerySellerRequirementList onEdit={setIsEditing} />
      </div>
    </div>
  );
}
