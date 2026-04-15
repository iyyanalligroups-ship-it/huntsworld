import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAddUserAddressMutation } from "@/redux/api/Authapi";

const AddressForm = ({ user, closeModal }) => {
  const [addressFormData, setAddressFormData] = useState({
    user_id: user?._id,
    address_line_1: "",
    address_line_2: "",
    country: "",
    state: "",
    city: "",
    pincode: "",
    entity_type: "",
    address_type: "",
  });

  const [errors, setErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [addUserAddress, { isLoading }] = useAddUserAddressMutation();

  // Function to check if the form is valid
  useEffect(() => {
    const validateForm = () => {
      return (
        addressFormData.address_line_1 &&
        addressFormData.country &&
        addressFormData.state &&
        addressFormData.city &&
        addressFormData.pincode &&
        addressFormData.entity_type &&
        addressFormData.address_type
      );
    };

    setIsFormValid(validateForm());
  }, [addressFormData]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAddressFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" })); // Clear error when user types
  };

  // Handle dropdown changes
  const handleSelectChange = (field, value) => {
    setAddressFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" })); // Clear error when user selects
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return; // Prevent submission if form is invalid
    console.log(addressFormData);

    try {
      const response = await addUserAddress(addressFormData).unwrap();
      console.log("Address added successfully:", response);
      closeModal();
    } catch (error) {
      console.error("Failed to add address:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Input
          name="address_line_1"
          placeholder="Address Line 1"
          value={addressFormData.address_line_1}
          onChange={handleInputChange}
        />
        {errors.address_line_1 && (
          <p className="text-red-500 text-sm">{errors.address_line_1}</p>
        )}
      </div>

      <div>
        <Input
          name="address_line_2"
          placeholder="Address Line 2 (Optional)"
          value={addressFormData.address_line_2}
          onChange={handleInputChange}
        />
      </div>

      <div>
        <Input
          name="country"
          placeholder="Country"
          value={addressFormData.country}
          onChange={handleInputChange}
        />
        {errors.country && (
          <p className="text-red-500 text-sm">{errors.country}</p>
        )}
      </div>

      <div>
        <Input
          name="state"
          placeholder="State"
          value={addressFormData.state}
          onChange={handleInputChange}
        />
        {errors.state && <p className="text-red-500 text-sm">{errors.state}</p>}
      </div>

      <div>
        <Input
          name="city"
          placeholder="City"
          value={addressFormData.city}
          onChange={handleInputChange}
        />
        {errors.city && <p className="text-red-500 text-sm">{errors.city}</p>}
      </div>

      <div>
        <Input
          name="pincode"
          placeholder="Pincode / Zipcode"
          value={addressFormData.pincode}
          onChange={handleInputChange}
        />
        {errors.pincode && (
          <p className="text-red-500 text-sm">{errors.pincode}</p>
        )}
      </div>

      {/* Entity Type Dropdown */}
      <div>
        <Select
          onValueChange={(value) => handleSelectChange("entity_type", value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select Entity Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="merchant">Merchant</SelectItem>
            <SelectItem value="grocery_seller">Grocery Seller</SelectItem>
            <SelectItem value="service_provider">Service Provider</SelectItem>
            <SelectItem value="student">Student</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="sub_admin">Sub Admin</SelectItem>
          </SelectContent>
        </Select>
        {errors.entity_type && (
          <p className="text-red-500 text-sm">{errors.entity_type}</p>
        )}
      </div>

      {/* Address Type Dropdown */}
      <div>
        <Select
          onValueChange={(value) => handleSelectChange("address_type", value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select Address Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="personal">Personal</SelectItem>
            <SelectItem value="company">Company</SelectItem>
          </SelectContent>
        </Select>
        {errors.address_type && (
          <p className="text-red-500 text-sm">{errors.address_type}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full bg-[#e03733] text-white py-2"
        disabled={isLoading || !isFormValid} // 🔹 Fix: Disable if form is invalid
      >
        {isLoading ? "Adding..." : "+ Add Address"}
      </Button>
    </form>
  );
};

export default AddressForm;
