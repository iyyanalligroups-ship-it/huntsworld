import React from "react";
import { Button } from "@/components/ui/button";

const Stepper3 = ({ data, onChange, userData, addressId, nextStep, prevStep }) => {
  const handleInputChange = (field, value) => {
    const updatedData = { ...data, [field]: value };
    onChange(updatedData);
    console.log("Updated data in Stepper3:", updatedData);
  };

  const handleNext = () => {
    if (!data.travelEmail || data.travelEmail.trim() === "") {
      alert("Please enter a valid email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.travelEmail)) {
      alert("Please enter a valid email address.");
      return;
    }
    nextStep();
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Step 3: Travel Details</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Travel Agency Name</label>
          <input
            type="text"
            value={data.travelName}
            onChange={(e) => handleInputChange("travelName", e.target.value)}
            className="w-full p-2 border rounded text-sm"
            placeholder="Enter agency name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Travel Agency Email</label>
          <input
            type="email"
            value={data.travelEmail}
            onChange={(e) => handleInputChange("travelEmail", e.target.value)}
            className="w-full p-2 border rounded text-sm"
            placeholder="Enter agency email"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Travel Agency Phone Number</label>
          <input
            type="tel"
            value={data.travelPhoneNumber}
            onChange={(e) => handleInputChange("travelPhoneNumber", e.target.value)}
            className="w-full p-2 border rounded text-sm"
            placeholder="Enter phone number"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">License Number</label>
          <input
            type="text"
            value={data.licenseNumber}
            onChange={(e) => handleInputChange("licenseNumber", e.target.value)}
            className="w-full p-2 border rounded text-sm"
            placeholder="Enter license number"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Number of Vehicles</label>
          <input
            type="number"
            value={data.numberOfVehicles}
            onChange={(e) => handleInputChange("numberOfVehicles", e.target.value)}
            className="w-full p-2 border rounded text-sm"
            placeholder="Enter number of vehicles"
            min="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Vehicle Type</label>
          <select
            value={data.vehicleType}
            onChange={(e) => handleInputChange("vehicleType", e.target.value)}
            className="w-full p-2 border rounded text-sm"
          >
            <option value="">Select vehicle type</option>
            <option value="2-wheeler">2-wheeler</option>
            <option value="3-wheeler">3-wheeler</option>
            <option value="4-wheeler">4-wheeler</option>
            <option value="8-wheeler">8-wheeler</option>
            <option value="12-wheeler">12-wheeler</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={data.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            className="w-full p-2 border rounded text-sm"
            placeholder="Enter description of services"
            rows="4"
          />
        </div>
      </div>
      <div className="flex justify-between mt-4">
        <Button
          onClick={prevStep}
          variant="outline"
          className="text-sm"
        >
          Prev
        </Button>
        <Button
          onClick={handleNext}
          className="bg-[#0c1f4d] text-white text-sm"
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default Stepper3;