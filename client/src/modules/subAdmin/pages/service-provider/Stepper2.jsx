import React, { useState } from "react";
import { Button } from "@/components/ui/button";

const Stepper2 = ({ data, onChange, userData, addressId, saveAddress, nextStep, prevStep }) => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleNext = async () => {
    setSaving(true);
    setError(null);
    try {
      await saveAddress(data);
      nextStep();
    } catch (err) {
      setError(
        err.response?.status === 404
          ? "API endpoint not found. Please check the backend server."
          : err.message
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold mb-2">Step 2: Contact Info</h2>
      <div className="max-h-[400px] overflow-y-auto pr-2">
        <div className="grid grid-cols-1 gap-2">
          <div>
            <label className="block text-sm font-medium mb-1">User ID</label>
            <input
              type="text"
              value={userData?.user_id || ""}
              readOnly
              className="w-full p-1 border rounded bg-gray-100 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Entity Type</label>
            <input
              type="text"
              value="service provider"
              readOnly
              className="w-full p-1 border rounded bg-gray-100 text-sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div>
            <label className="block text-sm font-medium mb-1">Address Type</label>
            <select
              value={data.address_type}
              onChange={(e) => onChange({ ...data, address_type: e.target.value })}
              className="w-full p-1 border rounded text-sm"
            >
              <option value="personal">Personal</option>
              <option value="company">Company</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Address Line 2</label>
            <input
              type="text"
              value={data.address_line_2}
              onChange={(e) => onChange({ ...data, address_line_2: e.target.value })}
              className="w-full p-1 border rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Address Line 1</label>
            <input
              type="text"
              value={data.address_line_1}
              onChange={(e) => onChange({ ...data, address_line_1: e.target.value })}
              className="w-full p-1 border rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Country</label>
            <input
              type="text"
              value={data.country}
              onChange={(e) => onChange({ ...data, country: e.target.value })}
              className="w-full p-1 border rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">City</label>
            <input
              type="text"
              value={data.city}
              onChange={(e) => onChange({ ...data, city: e.target.value })}
              className="w-full p-1 border rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Pincode</label>
            <input
              type="text"
              value={data.pincode}
              onChange={(e) => onChange({ ...data, pincode: e.target.value })}
              className="w-full p-1 border rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">State</label>
            <input
              type="text"
              value={data.state}
              onChange={(e) => onChange({ ...data, state: e.target.value })}
              className="w-full p-1 border rounded text-sm"
            />
          </div>
          <div></div>
        </div>
      </div>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      <div className="flex justify-between mt-2">
        <Button
          onClick={prevStep}
          variant="outline"
          className="text-sm"
          disabled={saving}
        >
          Prev
        </Button>
        <Button
          onClick={handleNext}
          className="bg-[#0c1f4d] text-white text-sm"
          disabled={saving || !data.address_line_1 || !data.city || !data.state || !data.country || !data.pincode}
        >
          {saving ? "Saving..." : "Next"}
        </Button>
      </div>
    </div>
  );
};

export default Stepper2;