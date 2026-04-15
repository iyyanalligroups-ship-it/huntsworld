import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import axios from "axios";

const Stepper1 = ({ formData, setFormData, error, setError, loading, setLoading, handleNext, handleCancel }) => {
  const [searchQuery, setSearchQuery] = useState("");

  const validateSearchQuery = (query) => {
    if (!query.trim()) {
      setError("Please enter a name, email, or phone number to search.");
      return null;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[\d\s-]{10,}$/;

    if (emailRegex.test(query)) {
      return { type: "email", value: query };
    } else if (phoneRegex.test(query)) {
      return { type: "phone_number", value: query };
    } else if (query.length >= 3) {
      return { type: "name", value: query };
    } else {
      setError("Name must be at least 3 characters long.");
      return null;
    }
  };

  const handleSearch = async () => {
    const validatedQuery = validateSearchQuery(searchQuery);
    if (!validatedQuery) return;

    setLoading(true);
    setError("");
    setFormData((prev) => ({ ...prev, isSearched: false }));

    try {
      const params = { [validatedQuery.type]: validatedQuery.value };
      console.log("Sending API request with params:", params);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/lookup`, { params });

      console.log("API response:", JSON.stringify(response.data, null, 2));

      if (!response.data || !response.data.success || !Array.isArray(response.data.users)) {
        throw new Error("Invalid API response: no users found or incorrect format.");
      }

      const user = response.data.users[0];

      const missingFields = [];
      if (!user.user_id) missingFields.push("user_id");
      if (!user.name) missingFields.push("name");
      if (!user.phone_number) missingFields.push("phone_number");

      if (missingFields.length > 0) {
        console.warn("Missing fields in response:", missingFields);
        throw new Error(`Incomplete user data: missing ${missingFields.join(", ")}.`);
      }

      const updatedFormData = {
        ...formData,
        user_id: user.user_id,
        name: user.name,
        email: user.email || "",
        phone_number: user.phone_number,
        isSearched: true,
      };
      console.log("Updated formData:", updatedFormData);
      setFormData(updatedFormData);
    } catch (err) {
      console.error("API error:", err.message, err.response?.data);
      if (err.response?.status === 404 || err.message.includes("no users found")) {
        setError(`No user found with the provided ${validatedQuery.type}.`);
      } else if (err.response?.status === 400) {
        setError(err.response.data.error || "Invalid search input.");
      } else if (err.message.includes("Incomplete user data")) {
        setError(err.message);
      } else if (err.message.includes("Invalid API response")) {
        setError("Invalid response from server. Please try again.");
      } else {
        setError("An error occurred while fetching user data. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="search">Search User</Label>
        <div className="flex gap-2">
          <Input
            id="search"
            placeholder="Enter name, email, or phone number"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? "Searching..." : "Search"}
          </Button>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {formData.isSearched && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name || ""}
              readOnly
              className="bg-gray-100 cursor-not-allowed"
              placeholder="Name"
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              value={formData.email || ""}
              readOnly
              className="bg-gray-100 cursor-not-allowed"
              placeholder="Email (optional)"
            />
          </div>
          <div>
            <Label htmlFor="phone_number">Phone Number</Label>
            <Input
              id="phone_number"
              name="phone_number"
              value={formData.phone_number || ""}
              readOnly
              className="bg-gray-100 cursor-not-allowed"
              placeholder="Phone number"
            />
          </div>
        </div>
      )}

      <div className="flex justify-between gap-2 pt-4">
        <Button variant="outline" onClick={handleCancel} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={() => handleNext()} disabled={loading || !formData.isSearched}>
          Next
        </Button>
      </div>
    </div>
  );
};

export default Stepper1;