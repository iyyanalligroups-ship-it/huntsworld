import React, { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useGetServiceProviderByIdQuery,
  useUpdateServiceProviderMutation,
} from "@/redux/api/ServiceProviderApi";

const EditServiceProviderModal = ({ isOpen, onClose, providerId }) => {
  const { data: provider, isLoading, error } = useGetServiceProviderByIdQuery(providerId, {
    skip: !providerId || !isOpen, // Skip if no providerId or modal is closed
  });
  const [updateServiceProvider, { isLoading: isUpdating }] = useUpdateServiceProviderMutation();

  const [formData, setFormData] = React.useState({
    address_id: "",
    email: "",
    phone_number: "",
    travels_name: "",
    license_number: "",
    verified_status: false,
    trust_shield: false,
    number_of_travels: "",
    vehicle_type: "",
  });

  useEffect(() => {
    if (provider) {
      setFormData({
        address_id: provider.address_id || "",
        email: provider.email || "",
        phone_number: provider.phone_number || "",
        travels_name: provider.travels_name || "",
        license_number: provider.license_number || "",
        verified_status: !!provider.verified_status, // Ensure boolean
        trust_shield: !!provider.trust_shield, // Ensure boolean
        number_of_travels: provider.number_of_travels || "",
        vehicle_type: provider.vehicle_type || "",
      });
    }
  }, [provider]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleVehicleTypeChange = (value) => {
    setFormData((prev) => ({ ...prev, vehicle_type: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await updateServiceProvider({
        userId: providerId,
        updatedProvider: formData,
      }).unwrap();
      console.log("Update successful:", response);
      onClose();
    } catch (error) {
      console.error("Update failed:", error);
      alert(`Failed to update: ${error?.data?.message || "An unexpected error occurred"}`);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading provider data: {error.message}</div>;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Service Provider</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address_id" className="text-right">Address ID</Label>
              <Input
                id="address_id"
                name="address_id"
                value={formData.address_id}
                onChange={handleChange}
                className="col-span-3"
                placeholder="Address ID"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="col-span-3"
                placeholder="Email"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone_number" className="text-right">Phone Number</Label>
              <Input
                id="phone_number"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                className="col-span-3"
                placeholder="Phone Number"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="travels_name" className="text-right">Travels Name</Label>
              <Input
                id="travels_name"
                name="travels_name"
                value={formData.travels_name}
                onChange={handleChange}
                className="col-span-3"
                placeholder="Travels Name"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="license_number" className="text-right">License Number</Label>
              <Input
                id="license_number"
                name="license_number"
                value={formData.license_number}
                onChange={handleChange}
                className="col-span-3"
                placeholder="License Number"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="verified_status" className="text-right">Verified Status</Label>
              <div className="col-span-3 flex items-center">
                <input
                  type="checkbox"
                  id="verified_status"
                  name="verified_status"
                  checked={formData.verified_status}
                  onChange={handleChange}
                  className="w-4 h-4"
                />
                <Label htmlFor="verified_status" className="ml-2">Verified</Label>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="trust_shield" className="text-right">Trust Shield</Label>
              <div className="col-span-3 flex items-center">
                <input
                  type="checkbox"
                  id="trust_shield"
                  name="trust_shield"
                  checked={formData.trust_shield}
                  onChange={handleChange}
                  className="w-4 h-4"
                />
                <Label htmlFor="trust_shield" className="ml-2">Enabled</Label>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="number_of_travels" className="text-right">Number of Travels</Label>
              <Input
                id="number_of_travels"
                name="number_of_travels"
                type="number"
                value={formData.number_of_travels}
                onChange={handleChange}
                className="col-span-3"
                placeholder="Number of Travels"
                min="0"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="vehicle_type" className="text-right">Vehicle Type</Label>
              <Select
                value={formData.vehicle_type}
                onValueChange={handleVehicleTypeChange}
                className="col-span-3"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2-wheeler">2-Wheeler</SelectItem>
                  <SelectItem value="3-wheeler">3-Wheeler</SelectItem>
                  <SelectItem value="4-wheeler">4-Wheeler</SelectItem>
                  <SelectItem value="8-wheeler">8-Wheeler</SelectItem>
                  <SelectItem value="12-wheeler">12-Wheeler</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isUpdating}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditServiceProviderModal;