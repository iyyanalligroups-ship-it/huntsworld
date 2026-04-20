import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import axios from "axios";

const Stepper2 = ({ formData, setFormData, error, setError, handleNext, handleBack }) => {
  const [saving, setSaving] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value) => {
    setFormData((prev) => ({ ...prev, address_type: value }));
  };

  const handleSaveAddress = async () => {

    if (
      !formData.user_id ||
      !formData.address_type ||
      !formData.address_line_1 ||
      !formData.city ||
      !formData.state ||
      !formData.country ||
      !formData.pincode
    ) {
      setError("All address fields except Address Line 2 are required.");
      return false;
    }

    setSaving(true);
    setError("");

    try {
      const addressData = {
        user_id: formData.user_id,
        entity_type: formData.entity_type,
        address_type: formData.address_type,
        address_line_1: formData.address_line_1,
        address_line_2: formData.address_line_2 || "",
        city: formData.city,
        state: formData.state,
        country: formData.country,
        pincode: formData.pincode,
      };

      console.log("Sending address data:", addressData);

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/address/create-address`, addressData, {
        headers: { "Content-Type": "application/json" },
      });

      if (!response.data.address?._id) {
        throw new Error("Address ID not returned in response");
      }

      const addressId = response.data.address._id;
      setFormData((prev) => ({ ...prev, addressId }));
      setSaving(false);
      return true;
    } catch (err) {
      console.error("Address save error:", err);
      setError(err.response?.data?.message || "Failed to save address. Please try again.");
      setSaving(false);
      return false;
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="user_id">User ID</Label>
          <Input
            id="user_id"
            name="user_id"
            value={formData.user_id || ""}
            disabled
            placeholder="User ID"
          />
        </div>
        <div>
          <Label htmlFor="entity_type">Entity Type</Label>
          <Input
            id="entity_type"
            name="entity_type"
            value={formData.entity_type || ""}
            disabled
            placeholder="Entity Type"
          />
        </div>
        <div>
          <Label htmlFor="address_type">Address Type</Label>
          <Select
            onValueChange={handleSelectChange}
            value={formData.address_type || ""}
            disabled={saving}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select address type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="company">Company</SelectItem>
              <SelectItem value="personal">Personal</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="address_line_1">Address Line 1</Label>
          <Input
            id="address_line_1"
            name="address_line_1"
            value={formData.address_line_1 || ""}
            onChange={handleInputChange}
            placeholder="Enter address line 1"
            disabled={saving}
          />
        </div>
        <div>
          <Label htmlFor="address_line_2">Address Line 2</Label>
          <Input
            id="address_line_2"
            name="address_line_2"
            value={formData.address_line_2 || ""}
            onChange={handleInputChange}
            placeholder="Enter address line 2 (optional)"
            disabled={saving}
          />
        </div>
        <div>
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            name="city"
            value={formData.city || ""}
            onChange={handleInputChange}
            placeholder="Enter city"
            disabled={saving}
          />
        </div>
        <div>
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            name="state"
            value={formData.state || ""}
            onChange={handleInputChange}
            placeholder="Enter state"
            disabled={saving}
          />
        </div>
        <div>
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            name="country"
            value={formData.country || ""}
            onChange={handleInputChange}
            placeholder="Enter country"
            disabled={saving}
          />
        </div>
        <div>
          <Label htmlFor="pincode">Pincode</Label>
          <Input
            id="pincode"
            name="pincode"
            value={formData.pincode || ""}
            onChange={handleInputChange}
            placeholder="Enter pincode"
            disabled={saving}
          />
        </div>
        {error && (
          <div className="col-span-2">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}
      </div>
      <div className="flex justify-between gap-2 pt-4">
        <Button variant="outline" onClick={handleBack} disabled={saving}>
          Previous
        </Button>
        <Button
          onClick={() => handleNext(handleSaveAddress)}
          disabled={saving}
          className="bg-[#0c1f4d] hover:bg-[#0c1f4d] text-white"
        >
          {saving ? "Saving..." : "Next"}
        </Button>
      </div>
    </div>
  );
};

export default Stepper2;
