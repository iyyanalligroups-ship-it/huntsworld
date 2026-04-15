import { useContext, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { isValidPhoneNumber, parsePhoneNumber } from "libphonenumber-js";
import { Clock, ListChecks, ShoppingBag, X, ClipboardList, ArrowLeft } from "lucide-react";
import {
  useCreatePostByRequirementMutation,
  useUpdatePostByRequirementMutation,
  useGetAddressesForPostByRequirementQuery,
} from "@/redux/api/PostByRequirementApi";
import { AuthContext } from "../modules/landing/context/AuthContext";
import { toast } from "react-toastify";
import PostByRequirementList from "./pages/PostByRequirementList";
import { useNavigate } from "react-router-dom";
import { Textarea } from "@/components/ui/textarea";
import ProductNameAutocomplete from "@/modules/merchant/pages/products/ProductNameAutocomplete";

const PostRequirement = () => {
  const { user } = useContext(AuthContext);
  console.log(user, 'user requirem');
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(null);
  const [formData, setFormData] = useState({
    product_or_service: "",
    description: "",
    quantity: "",
    unit_of_measurement: "",
    phone_number: "",
    type: "product",
    supplier_preference: "All India",
    selected_states: [],
    user_id: user?.user?._id || null,
    category_id: null,
    sub_category_id: null,
    super_sub_category_id: null,
    deep_sub_category_id: null,
  });
  const [customUnit, setCustomUnit] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [createPost] = useCreatePostByRequirementMutation();
  const [updatePost] = useUpdatePostByRequirementMutation();
  const { data: states = [], isLoading: statesLoading, error: statesError } = useGetAddressesForPostByRequirementQuery();
  console.log(states, 'states for post by requirement');
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
    if (user?.user?.role?.role === "GROCERY_SELLER") {
      // navigate("/baseMember/requirement");
    }
  }, [user, navigate]);

  useEffect(() => {
    let initialPhone = isEditing ? isEditing.phone_number : user?.user?.phone || "";
    if (initialPhone && !initialPhone.startsWith("+")) {
      initialPhone = `+91${initialPhone}`;
    }
    setFormData((prev) => ({
      ...prev,
      phone_number: initialPhone,
      user_id: user?.user?._id || null,
      product_or_service: isEditing ? isEditing.product_or_service || "" : "",
      description: isEditing ? isEditing.description || "" : "",
      quantity: isEditing ? isEditing.quantity || "" : "",
      unit_of_measurement: isEditing ? isEditing.unit_of_measurement || "" : "",
      type: isEditing ? isEditing.type || "product" : "product",
      supplier_preference: isEditing ? isEditing.supplier_preference || "All India" : "All India",
      selected_states: isEditing ? isEditing.selected_states || [] : [],
      category_id: isEditing ? isEditing.category_id || null : null,
      sub_category_id: isEditing ? isEditing.sub_category_id || null : null,
      super_sub_category_id: isEditing ? isEditing.super_sub_category_id || null : null,
      deep_sub_category_id: isEditing ? isEditing.deep_sub_category_id || null : null,
    }));
    setCustomUnit(
      isEditing && isEditing.unit_of_measurement &&
        !unitOptions.some((option) => option.value === isEditing.unit_of_measurement)
        ? isEditing.unit_of_measurement
        : ""
    );
    if (!user?.user?._id) {
      navigate("/login");
      toast.info("Please log in to submit a requirement.");
    }
    if (!initialPhone || initialPhone.trim() === "") {
      toast.info("Please update your phone number in your profile settings before submitting a requirement.");
    }
  }, [isEditing, user, navigate]);

  const handlePhoneChange = (value) => {
    setFormData((prev) => ({ ...prev, phone_number: value || "" }));
    console.log("Phone number changed:", value);
    if (value) {
      try {
        const phoneNumberParsed = parsePhoneNumber(value);
        console.log("Parsed phone number:", phoneNumberParsed);
        if (!isValidPhoneNumber(value)) {
          setPhoneError("Invalid phone number");
        } else {
          setPhoneError("");
        }
      } catch (error) {
        console.error("Error parsing phone number:", error);
        setPhoneError("Invalid phone number format");
      }
    } else {
      setPhoneError("");
    }
  };

  const removeState = (stateToRemove) => {
    setFormData((prev) => ({
      ...prev,
      selected_states: prev.selected_states.filter((state) => state !== stateToRemove),
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    let errors = {};

    if (!formData?.description?.trim())
      errors.description = "Description is required.";

    if (!formData?.quantity) errors.quantity = "Quantity is required.";

    if (!formData?.unit_of_measurement?.trim())
      errors.unit_of_measurement = "Unit of measurement is required.";

    if (!formData?.type?.trim())
      errors.type = "Type is required.";
    else if (!['product', 'service'].includes(formData.type))
      errors.type = "Type must be either product or service.";

    if (!formData?.phone_number?.trim())
      errors.phone_number = "Phone number is required.";

    if (!isValidPhoneNumber(formData?.phone_number))
      errors.phone_number = "Invalid phone number.";

    if (
      formData?.supplier_preference === "Specific States" &&
      formData?.selected_states.length === 0
    ) {
      errors.selected_states = "Select at least one state.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleStateSelection = (state) => {
    setFormData((prev) => ({
      ...prev,
      selected_states: prev.selected_states.includes(state)
        ? prev.selected_states.filter((s) => s !== state)
        : [...prev.selected_states, state],
    }));
  };

  const handleEdit = (edit) => {
    console.log(edit, "selected");
    setIsEditing(edit);
  };

  const resetForm = () => {
    let initialPhone = user?.user?.phone || "";
    if (initialPhone && !initialPhone.startsWith("+")) {
      initialPhone = `+91${initialPhone}`;
    }
    setFormData({
      description: "",
      quantity: "",
      unit_of_measurement: "",
      product_or_service: "",
      phone_number: initialPhone,
      type: "product",
      supplier_preference: "All India",
      selected_states: [],
      user_id: user?.user?._id || null,
      category_id: null,
      sub_category_id: null,
      super_sub_category_id: null,
      deep_sub_category_id: null,
    });
    setCustomUnit("");
    setPhoneError("");
    setIsEditing(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("⚠️ Please fix the errors in the form.");
      return;
    }
    if (!user?.user?._id) {
      navigate("/login");
      toast.info("Please log in to submit a requirement.");
      return;
    }
    if (!formData.phone_number || formData.phone_number.trim() === "") {
      toast.info("Please update your phone number in your profile settings before submitting a requirement.");
      return;
    }

    try {
      const finalUnit =
        formData.unit_of_measurement === "other"
          ? customUnit.trim().toLowerCase()
          : formData.unit_of_measurement;

      if (formData.unit_of_measurement === "other" && !customUnit.trim()) {
        setFormErrors((prev) => ({
          ...prev,
          unit_of_measurement: "Custom unit is required when 'Other' is selected.",
        }));
        toast.error("⚠️ Please enter a custom unit.");
        return;
      }

      const submitData = { ...formData, unit_of_measurement: finalUnit };

      if (isEditing && isEditing._id) {
        const response = await updatePost({ id: isEditing._id, ...submitData }).unwrap();
        console.log("Updated successfully:", response);
        if (response.success) {
          toast.success(response.message || "Requirement Updated Successfully");
        } else {
          toast.error(response.message || "Failed to Update");
        }
      } else {
        const response = await createPost(submitData).unwrap();
        console.log("Created successfully:", response);
        if (response.success) {
          toast.success(response.message || "Requirement Added Successfully");
        } else {
          toast.error(response.message || "Failed to Add");
        }
      }
      resetForm();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(error.message || "Something went wrong!");
    }
  };

  if (user?.user?.role?.role === "GROCERY_SELLER") {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center px-4">
        <ClipboardList className="w-16 h-16 text-[#0c1f4d] mb-4 animate-bounce" />
        <h2 className="text-2xl font-semibold mb-2">
          Welcome, {user?.user?.name}
        </h2>
        <p className="text-gray-600 mb-4">
          As a Grocery Seller, you can manage your requirements here.
        </p>
        <Button
          onClick={() => navigate("/baseMember/requirement")}
          className="mt-4 px-6 py-2 bg-[#0c1f4d] text-white cursor-pointer rounded-lg shadow hover:bg-[#0c204de2] transition"
        >
          Go to Requirements
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col lg:flex-row justify-center p-4 relative gap-4">
        <Button
          type="button"
          onClick={() => navigate(-1)}
          variant="outline"
          className="absolute cursor-pointer top-5 left-5 z-40 hidden md:flex gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full lg:max-w-3xl bg-white rounded-2xl p-4 sm:p-6"
        >
          <h2 className="text-xl font-bold text-center mb-4 text-[#0c1f4d]">
            Let Us Know <span className="text-black"> What You Need</span>
          </h2>
          <p className="text-center text-gray-500 mb-6">
            Complete these simple steps and get instant quotes from verified
            suppliers.
          </p>

          <Card>
            <CardContent className="p-6">
              <form className="space-y-4">
                <div>
                  <label className="font-medium">
                    {formData.type === "service" ? "Service Name" : "Product Name"} <span className="text-red-500">*</span>
                  </label>
                  <ProductNameAutocomplete
                    value={formData.product_or_service}
                    onChange={(e) => {
                      const { value, product } = e.target;
                      setFormData(prev => ({
                        ...prev,
                        product_or_service: value,
                        category_id: product?.category_id || null,
                        sub_category_id: product?.sub_category_id || null,
                        super_sub_category_id: product?.super_sub_category_id || null,
                        deep_sub_category_id: product?.deep_sub_category_id || null,
                      }));
                      setFormErrors(prev => ({ ...prev, product_or_service: "" }));
                    }}
                  />
                  {formErrors.product_or_service && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.product_or_service}</p>
                  )}

                  {/* Selected Badge */}
                  {formData.product_or_service && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm font-medium text-blue-800">
                        Selected: <span className="font-bold">{formData.product_or_service}</span>
                      </p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="font-medium">Type</label>
                  <Select
                    name="type"
                    value={formData?.type || ""}
                    onValueChange={(value) => handleChange({ target: { name: 'type', value } })}
                    disabled={statesLoading || statesError}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="product">Product</SelectItem>
                      <SelectItem value="service">Service</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.type && (
                    <p className="text-red-500 text-sm">{formErrors.type}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-medium">Quantity</label>
                    <Input
                      name="quantity"
                      placeholder="Enter quantity"
                      value={formData?.quantity}
                      onChange={handleChange}
                    />
                    {formErrors.quantity && (
                      <p className="text-red-500 text-sm">
                        {formErrors.quantity}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="font-medium">Unit of Measurement</label>
                    <Select
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          unit_of_measurement: value,
                        }))
                      }
                      value={formData?.unit_of_measurement}
                    >
                      <SelectTrigger className="w-full">
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
                    {formData.unit_of_measurement === "other" && (
                      <Input
                        type="text"
                        placeholder="Enter custom unit"
                        value={customUnit}
                        onChange={(e) =>
                          setCustomUnit(e.target.value.replace(/[^A-Za-z]/g, ""))
                        }
                        className="mt-2"
                      />
                    )}
                    {formErrors.unit_of_measurement && (
                      <p className="text-red-500 text-sm">{formErrors.unit_of_measurement}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="font-medium">Phone Number</label>
                  <PhoneInput
                    placeholder="Enter phone number"
                    defaultCountry="IN"
                    value={formData?.phone_number}
                    onChange={handlePhoneChange}
                    className="custom-phone-input w-full border-2 rounded-md p-3 mt-2"
                    international
                    countryCallingCodeEditable={false}
                    addInternationalOption={false}
                  />
                  {phoneError && (
                    <p className="text-red-500 text-sm mt-2">{phoneError}</p>
                  )}
                </div>

                <div>
                  <label className="font-medium">Description</label>
                  <Textarea
                    name="description"
                    placeholder="Enter requirement description"
                    value={formData?.description}
                    onChange={handleChange}
                    rows={4}
                  />
                  {formErrors.description && (
                    <p className="text-red-500 text-sm">
                      {formErrors.description}
                    </p>
                  )}
                </div>

                <div>
                  <label className="font-medium">Supplier Preference</label>
                  <div className="flex gap-4 mt-2">
                    {["All India", "Specific States"].map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={`px-4 py-2 rounded-lg border ${formData?.supplier_preference === option
                          ? "border-blue-500 bg-blue-100"
                          : "border-gray-300"
                          }`}
                        onClick={() =>
                          setFormData({
                            ...formData,
                            supplier_preference: option,
                            selected_states:
                              option === "Specific States"
                                ? formData?.selected_states
                                : [],
                          })
                        }
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                {formData?.supplier_preference === "Specific States" && (
                  <div>
                    <label className="font-medium">Choose Multiple States</label>
                    {statesLoading ? (
                      <p className="text-gray-500">Loading states...</p>
                    ) : statesError ? (
                      <p className="text-red-500 text-sm">Error loading states</p>
                    ) : (
                      <Select
                        onValueChange={(value) => handleStateSelection(value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select states" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {states?.map((state) => (
                              <SelectItem key={state} value={state}>
                                {state}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    )}

                    <div className="mt-2 flex flex-wrap gap-2">
                      {formData?.selected_states.map((state) => (
                        <Badge
                          key={state}
                          className="bg-blue-200 text-blue-800 px-2 py-1 flex items-center gap-1"
                        >
                          {state}
                          <button
                            onClick={() => removeState(state)}
                            className="ml-1 p-1 rounded-full hover:bg-blue-300 transition duration-200"
                          >
                            <X className="h-4 w-4 cursor-pointer text-blue-800" />
                          </button>
                        </Badge>
                      ))}
                    </div>

                    {formErrors.selected_states && (
                      <p className="text-red-500 text-sm">
                        {formErrors.selected_states}
                      </p>
                    )}
                  </div>
                )}
                <Button
                  type="submit"
                  onClick={handleSubmit}
                  className="w-full bg-[#0c1f4d] cursor-pointer hover:shadow-lg text-white py-2 rounded-md"
                >
                  {isEditing ? "Update Requirement" : "Submit Requirement"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full lg:max-w-md bg-white shadow-lg rounded-2xl p-4 sm:p-6"
        >
          <h2 className="text-xl font-semibold mb-4 text-[#0c1f4d]">
            Buyers Advantages?
          </h2>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Clock className="text-gray-700 w-10 h-10" />
              <div>
                <h3 className="font-semibold">Immediate Responses</h3>
                <p className="text-sm text-gray-600">
                  Get instant feedback from suppliers.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <ShoppingBag className="text-gray-700 w-10 h-10" />
              <div>
                <h3 className="font-semibold">Genuine Suppliers</h3>
                <p className="text-sm text-gray-600">
                  Accredited suppliers that meet your needs.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <ListChecks className="text-gray-700 w-10 h-10" />
              <div>
                <h3 className="font-semibold">Multiple Choices</h3>
                <p className="text-sm text-gray-600">
                  Get the power to choose the best!
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      {user?.user?.role.role === "ADMIN" && (
        <div className="mt-4">
          <PostByRequirementList onEdit={handleEdit} />
        </div>
      )}
    </div>
  );
};

export default PostRequirement;
