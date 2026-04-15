import { useContext, useRef, useState } from "react";
import {
  useGetUserAddressesQuery,
  useAddUserAddressMutation,
  useUpdateUserAddressMutation,
  useDeleteUserAddressMutation,
} from "@/redux/api/Authapi";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, PlusCircle } from "lucide-react";
import { toast } from "react-toastify";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const initialFormState = {
  entity_type: "",
  address_line_1: "",
  address_line_2: "",
  city: "",
  state: "",
  country: "",
  pincode: "",
  address_type: "",
};

const AddressList = ({ userId }) => {

  const { user } = useContext(AuthContext);
  console.log(user, 'user');

  const { data: addresses, isLoading } = useGetUserAddressesQuery({ user_id: user?.user?._id });
  console.log(addresses, "address");


  const [addAddress] = useAddUserAddressMutation();
  const [updateAddress] = useUpdateUserAddressMutation();
  const [deleteAddress] = useDeleteUserAddressMutation();

  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [formData, setFormData] = useState(initialFormState);



  const handleSelect = (address) => {
    setSelectedAddressId(address._id);
    setFormData(address);
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    try {
      if (selectedAddressId) {
        await updateAddress({
          user_id: user?.user?._id,
          selectedAddressId,
          updatedAddress: formData,
        }).unwrap();
        toast.success("Address updated");
      } else {
        await addAddress({ ...formData, user_id: user, entity_type: user?.user?.role?.role.toLowercase() }).unwrap();
        toast.success("Address added");
      }
      setFormData(initialFormState);
      setSelectedAddressId(null);
    } catch (err) {
      console.error("Save address failed:", err);
      toast.error("Failed to save address");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAddress({ user_id: user?.user?._id, addressId: id }).unwrap();
      toast.success("Address deleted");
      if (selectedAddressId === id) {
        setSelectedAddressId(null);
        setFormData(initialFormState);
      }
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete address");
    }
  };


  if (isLoading) return <p>Loading addresses...</p>;
  return (
    <div className="flex flex-col md:flex-row h-auto md:h-screen">
      {/* Address List Section */}
      <div className="w-full md:w-1/2 md:min-h-screen p-4 space-y-6 border-b md:border-r">
        <ScrollArea className="h-[calc(100vh-32px)] pr-4"> {/* Adjust height if needed */}
          <h2 className="mb-4 p-4 bg-amber-100 rounded-sm text-lg font-semibold">Address Details</h2>

          <div className="relative space-y-4">
            {addresses?.map((address) => (
              <Card
                key={address._id}
                className={`p-4 flex items-start justify-between cursor-pointer transition-all border-2 ${selectedAddressId === address._id ? "border-primary bg-muted" : "border-border"
                  }`}
              >
                <RadioGroup
                  value={selectedAddressId}
                  onValueChange={(value) => handleSelect({ ...address, _id: value })}
                >
                  <div className="flex items-start gap-3 w-full">
                    <RadioGroupItem
                      value={address._id}
                      id={address._id}
                      className="mt-1"
                    />
                    <label htmlFor={address._id} className="flex-1 cursor-pointer">
                      <p className="font-medium">
                        {address.address_type.charAt(0).toUpperCase() + address.address_type.slice(1)} Address
                      </p>
                      <p className="text-sm text-muted-foreground">{address.address_line_1}</p>
                      {address.address_line_2 && (
                        <p className="text-sm text-muted-foreground">{address.address_line_2}</p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {address.city}, {address.state}, {address.country} - {address.pincode}
                      </p>
                    </label>
                  </div>
                </RadioGroup>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(address._id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Form Section */}
      <div className="w-full md:w-1/2 p-4">
        <h2 className="mb-4 p-4 bg-amber-100 rounded-sm text-lg font-semibold">Add New Address</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="mb-2">Address Line 1</Label>
            <Input name="address_line_1" value={formData.address_line_1} onChange={handleChange} />
          </div>
          <div>
            <Label className="mb-2">Address Line 2</Label>
            <Input name="address_line_2" value={formData.address_line_2} onChange={handleChange} />
          </div>
          <div>
            <Label className="mb-2">City</Label>
            <Input name="city" value={formData.city} onChange={handleChange} />
          </div>
          <div>
            <Label className="mb-2">State</Label>
            <Input name="state" value={formData.state} onChange={handleChange} />
          </div>
          <div>
            <Label className="mb-2">Country</Label>
            <Input name="country" value={formData.country} onChange={handleChange} />
          </div>
          <div>
            <Label className="mb-2">Pincode</Label>
            <Input name="pincode" value={formData.pincode} onChange={handleChange} />
          </div>
          <div>
            <Label className="mb-2">Address Type</Label>
            <Select
              value={formData.address_type}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, address_type: value }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="company">Company</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={handleSubmit} className="w-full">
              {selectedAddressId ? "Update Address" : "Add Address"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

};

export default AddressList;
