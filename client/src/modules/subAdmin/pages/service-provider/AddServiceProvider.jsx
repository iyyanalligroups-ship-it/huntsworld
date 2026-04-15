import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUser, clearUserState } from "@/redux/api/FetchUsers";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Stepper, Step, StepLabel } from "@mui/material";
import ServiceProviderSteps from "./ServiceProviderSteps";
import axios from "axios";

const steps = ["Search User", "Contact Info", "Travel Details", "Verification", "Confirmation"];
const API_BASE_URL = import.meta.env.VITE_API_URL;

const AddServiceProvider = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [formData, setFormData] = useState({
    step2: {
      address_type: "personal",
      address_line_1: "",
      address_line_2: "",
      city: "",
      state: "",
      country: "",
      pincode: "",
    },
    step3: {
      travelName: "",
      travelEmail: "",
      travelPhoneNumber: "",
      licenseNumber: "",
      numberOfVehicles: "",
      vehicleType: "",
      description: "",
    },
    step4: { idNumber: "", verified: false, logoUrl: "", travelImageUrls: [] },
    step5: { confirmationNote: "" },
  });
  const [addressId, setAddressId] = useState(null);

  const dispatch = useDispatch();
  const { users, loading, error } = useSelector((state) => state.fetchuser || {});
  // Attempt to get token from Redux (adjust selector based on your store structure)
  const authToken = useSelector((state) => state.auth?.token || null);

  const handleSearch = () => {
    if (searchQuery.trim() === "") {
      alert("Please enter a name, email, or phone number to search.");
      return;
    }
    setSearchAttempted(true);
    dispatch(fetchUser(searchQuery));
  };

  const validateStep = () => {
    if (step === 0 && !users) return false;
    if (step === 1) {
      const { address_line_1, city, state, country, pincode } = formData.step2;
      return address_line_1 && city && state && country && pincode;
    }
    if (step === 2) {
      const { travelName, travelEmail, travelPhoneNumber, licenseNumber, numberOfVehicles, vehicleType, description } = formData.step3;
      return (
        travelName &&
        travelEmail &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(travelEmail) &&
        travelPhoneNumber &&
        licenseNumber &&
        numberOfVehicles &&
        vehicleType &&
        description &&
        description.trim().split(/\s+/).length >= 30
      );
    }
    if (step === 3) {
      return true; // Validation is handled in Stepper4's handleNext
    }
    return true;
  };

  const nextStep = () => {
    console.log("Current formData.step4:", JSON.stringify(formData.step4, null, 2));
    if (!validateStep()) {
      alert("Please complete all required fields before proceeding.");
      return;
    }
    if (step < steps.length - 1) setStep((prev) => prev + 1);
  };

  const prevStep = () => {
    if (step > 0) setStep((prev) => prev - 1);
  };

  const handleClose = () => {
    dispatch(clearUserState());
    setSearchAttempted(false);
    setSearchQuery("");
    setStep(0);
    setFormData({
      step2: {
        address_type: "personal",
        address_line_1: "",
        address_line_2: "",
        city: "",
        state: "",
        country: "",
        pincode: "",
      },
      step3: {
        travelName: "",
        travelEmail: "",
        travelPhoneNumber: "",
        licenseNumber: "",
        numberOfVehicles: "",
        vehicleType: "",
        description: "",
      },
      step4: { idNumber: "", verified: false, logoUrl: "", travelImageUrls: [] },
      step5: { confirmationNote: "" },
    });
    setAddressId(null);
    onClose();
  };

  const updateFormData = (stepKey, data) => {
    return new Promise((resolve) => {
      setFormData((prev) => {
        const newState = {
          ...prev,
          [stepKey]: { ...prev[stepKey], ...data },
        };
        console.log(`Updated formData for ${stepKey}:`, JSON.stringify(newState[stepKey], null, 2));
        resolve(newState);
        return newState;
      });
    });
  };

  const saveAddress = async (addressData) => {
    try {
      console.log("Saving address with user_id:", users.user_id, "Data:", addressData);
      const response = await axios.post(`${API_BASE_URL}/address/create-address`, {
        user_id: users.user_id,
        entity_type: "service_provider",
        ...addressData,
      });
      console.log("Address saved:", response.data);
      const newAddressId = response.data.address._id;
      setAddressId(newAddressId);
      return newAddressId;
    } catch (error) {
      console.error("Error saving address:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      const errorMessage =
        error.response?.status === 400
          ? error.response?.data?.message || "Invalid user ID or address data"
          : error.response?.data?.message || "Failed to save address";
      throw new Error(errorMessage);
    }
  };

  const handleSubmit = async () => {
    console.log("Submitting form with formData:", JSON.stringify(formData, null, 2));
    try {
      const { step2, step3, step4 } = formData;
      if (!users?.user_id) throw new Error("User ID is missing");
      if (!addressId) throw new Error("Address ID is missing");
      if (!step3.travelName) throw new Error("Travel agency name is required");
      if (!step3.travelPhoneNumber) throw new Error("Travel phone number is required");
      if (!step3.licenseNumber) throw new Error("License number is required");
      if (!step3.numberOfVehicles) throw new Error("Number of vehicles is required");
      if (!step3.vehicleType) throw new Error("Vehicle type is required");
      if (!step3.description) throw new Error("Description is required");
      if (step3.description.trim().split(/\s+/).length < 10) {
        throw new Error("Description must be at least 30 words");
      }
      if (step4.travelImageUrls.length === 0) throw new Error("At least one travel image is required");

      let finalEmail = step3.travelEmail;
      if (!finalEmail || finalEmail.trim() === "") {
        finalEmail = `serviceprovider_${Date.now()}@example.com`;
        updateFormData("step3", { travelEmail: finalEmail });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(finalEmail)) {
        throw new Error("Invalid email format");
      }

      const serviceProviderData = {
        user_id: users.user_id,
        address_id: addressId,
        company_email: finalEmail,
        company_phone_number: step3.travelPhoneNumber,
        travels_name: step3.travelName,
        license_number: step3.licenseNumber,
        number_of_vehicles: Number(step3.numberOfVehicles),
        vehicle_type: step3.vehicleType,
        description: step3.description,
        verified_status: step4.verified || false,
        company_logo: step4.logoUrl || "",
        company_images: step4.travelImageUrls || [],
      };

      console.log("Submitting service provider data:", JSON.stringify(serviceProviderData, null, 2));

      const response = await axios.post(
        `${API_BASE_URL}/service-providers/create-service-providers`,
        serviceProviderData
      );

      console.log("Service provider created successfully:", JSON.stringify(response.data, null, 2));

      // Fetch the SERVICE_PROVIDER role ID
      console.log("Fetching roles from:", `${API_BASE_URL}/role/fetch-all-role`);
      const roleResponse = await axios.get(`${API_BASE_URL}/role/fetch-all-role`);
      console.log("Roles response:", JSON.stringify(roleResponse.data, null, 2));

      const roles = roleResponse.data.data;
      if (!Array.isArray(roles)) {
        throw new Error("Expected roles to be an array, received: " + JSON.stringify(roles));
      }

      const serviceProviderRole = roles.find(
        (role) => role.role === "SERVICE-PROVIDER" || role.role === "SERVICE_PROVIDER"
      );
      if (!serviceProviderRole) {
        console.error("Available roles:", roles.map((r) => r.role));
        throw new Error("SERVICE_PROVIDER role not found in roles: " + JSON.stringify(roles, null, 2));
      }
      const serviceProviderRoleId = serviceProviderRole._id;
      console.log("Found SERVICE_PROVIDER role ID:", serviceProviderRoleId);

      // Get token from multiple sources
      let token = authToken; // From Redux
      if (!token) {
        token = sessionStorage.getItem("authToken") || sessionStorage.getItem("token"); // Try common sessionStorage keys
      }
      console.log("Auth token:", token ? "Token found" : "No token found");

      if (!token) {
        throw new Error("Authentication token is missing. Please log in again.");
      }

      // Update the user's role with the SERVICE_PROVIDER role ID
      console.log("Updating user role for user_id:", users.user_id);
      const updateUserResponse = await axios.put(
        `${API_BASE_URL}/users/update-users-by-id/${users.user_id}`,
        { role: serviceProviderRoleId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("User role updated successfully:", JSON.stringify(updateUserResponse.data, null, 2));

      handleClose();
    } catch (error) {
      console.error("Error in handleSubmit:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        stack: error.stack,
      });
      alert(`Failed to create service provider or update role: ${error.response?.data?.message || error.message}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[600px] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle>Add Service Provider</DialogTitle>
        </DialogHeader>

        <Stepper activeStep={step} alternativeLabel connector={null} className="mb-4">
          {steps.map((label, index) => (
            <Step key={index}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {step === 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-2">Step 1: Search User</h2>
            {!searchAttempted || (!users && !loading && !error) ? (
              <div>
                <input
                  type="text"
                  placeholder="Enter Name, Email, or Phone Number"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full p-2 border rounded mb-2 text-sm"
                />
                <Button onClick={handleSearch} className="bg-[#0c1f4d] text-white w-full">
                  {loading ? "Searching..." : "Search"}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {loading && <p className="text-gray-500 mt-2">Loading...</p>}
                {error && <p className="text-red-500 mt-2">Error: {error}</p>}
                {!loading && !error && !users && (
                  <p className="text-gray-500 mt-2">No user found.</p>
                )}
                {users && !loading && !error && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium mb-1">User ID</label>
                      <input
                        type="text"
                        value={users.user_id || ""}
                        readOnly
                        className="w-full p-2 border rounded bg-gray-100 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Name</label>
                      <input
                        type="text"
                        value={users.name || ""}
                        readOnly
                        className="w-full p-2 border rounded bg-gray-100 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Email</label>
                      <input
                        type="text"
                        value={users.email || "N/A"}
                        readOnly
                        className="w-full p-2 border rounded bg-gray-100 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Phone Number</label>
                      <input
                        type="text"
                        value={users.phone_number || ""}
                        readOnly
                        className="w-full p-2 border rounded bg-gray-100 text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-between mt-4">
              <Button onClick={prevStep} variant="outline" disabled={step === 0}>
                Back
              </Button>
              <Button
                onClick={nextStep}
                className="bg-[#0c1f4d] text-white"
                disabled={step === 0 && !users}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {step > 0 && (
          <ServiceProviderSteps
            step={step}
            nextStep={nextStep}
            prevStep={prevStep}
            handleClose={handleClose}
            stepsLength={steps.length}
            formData={formData}
            updateFormData={updateFormData}
            userData={users}
            addressId={addressId}
            saveAddress={saveAddress}
            submitForm={handleSubmit}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddServiceProvider;