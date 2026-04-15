import { useContext, useState, useEffect } from "react";
import {
  useGetUserAddressesQuery,
  useAddUserAddressMutation,
  useUpdateUserAddressMutation,
  useDeleteUserAddressMutation,
} from "@/redux/api/Authapi";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Country, State, City } from "country-state-city";
import Loader from "@/loader/Loader";

const initialFormState = {
  entity_type: "",
  address_line_1: "",
  address_line_2: "",
  city: "", // Store as TitleCase to match SelectItem values
  state: "", // isoCode
  country: "", // isoCode
  pincode: "",
  address_type: "",
};

const toTitleCase = (str = "") =>
  str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1));

const AddressList = () => {
  const { user } = useContext(AuthContext);

  const {
    data: addresses,
    isLoading,
    refetch,
  } = useGetUserAddressesQuery({
    user_id: user?.user?._id,
  });

  const [addAddress, { isLoading: isAdding }] = useAddUserAddressMutation();
  const [updateAddress, { isLoading: isUpdating }] = useUpdateUserAddressMutation();
  const [deleteAddress, { isLoading: isDeleting }] = useDeleteUserAddressMutation();

  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [formData, setFormData] = useState(initialFormState);

  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  useEffect(() => {
    setCountries(Country.getAllCountries());
  }, []);

  // Update states when country changes
  useEffect(() => {
    if (formData.country) {
      const sts = State.getStatesOfCountry(formData.country) || [];
      setStates(sts);
      setCities([]); // Reset cities when country changes
    } else {
      setStates([]);
      setCities([]);
    }
  }, [formData.country]);

  // Update cities when state changes
  useEffect(() => {
    if (!formData.country || !formData.state) {
      setCities([]);
      return;
    }

    const base = City.getCitiesOfState(formData.country, formData.state) || [];

    // If current city isn't present, append a synthetic option
    const hasCity = formData.city
      ? base.some((ci) => ci.name === formData.city) // Exact match
      : true;

    let list = hasCity ? base : [...base, { name: formData.city }];

    // Dedupe by name
    const seen = new Set();
    list = list.filter((ci) => {
      const key = (ci?.name || "").toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    setCities(list);
  }, [formData.country, formData.state, formData.city]);

  const handleSelect = (address) => {
    setSelectedAddressId(address._id);

    const countryObj =
      countries.find(
        (c) => c.name.toLowerCase() === (address.country || "").toLowerCase()
      ) || null;

    const stateObj = countryObj
      ? (State.getStatesOfCountry(countryObj.isoCode) || []).find(
          (s) => s.name.toLowerCase() === (address.state || "").toLowerCase()
        ) || null
      : null;

    let canonicalCity = address.city || "";
    if (countryObj?.isoCode && stateObj?.isoCode) {
      const baseCities =
        City.getCitiesOfState(countryObj.isoCode, stateObj.isoCode) || [];
      const match = baseCities.find(
        (ci) => ci.name.toLowerCase() === (address.city || "").toLowerCase()
      );
      canonicalCity = match ? match.name : toTitleCase(address.city); // Use library casing or TitleCase
    }

    setFormData({
      entity_type: address.entity_type || "",
      address_line_1: address.address_line_1 || "",
      address_line_2: address.address_line_2 || "",
      city: canonicalCity, // Store as TitleCase to match SelectItem
      state: stateObj?.isoCode || "",
      country: countryObj?.isoCode || "",
      pincode: address.pincode || "",
      address_type: address.address_type || "",
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const isFormValid = () => {
    return (
      formData.address_line_1.trim() !== "" &&
      formData.city.trim() !== "" &&
      formData.state.trim() !== "" &&
      formData.country.trim() !== "" &&
      formData.pincode.trim() !== "" &&
      formData.address_type.trim() !== ""
    );
  };

const handleSubmit = async () => {
  if (!isFormValid()) {
    toast.error("Please fill all required fields");
    return;
  }

  // Check for existing address of the same type
  const existingAddressOfType = addresses?.find(
    (addr) =>
      addr.address_type.toLowerCase() === formData.address_type.toLowerCase() &&
      addr._id !== selectedAddressId // Exclude current editing address
  );

  if (existingAddressOfType && !selectedAddressId) {
    toast.error(
      `You already have a ${formData.address_type} address. Only one ${formData.address_type} address is allowed. Please edit the existing one.`
    );
    return;
  }

  try {
    const countryObj = countries.find((c) => c.isoCode === formData.country);
    const stateObj = states.find((s) => s.isoCode === formData.state);

    const submitData = {
      ...formData,
      country: countryObj ? countryObj.name : formData.country,
      state: stateObj ? stateObj.name : formData.state,
      city: formData.city || "",
      user_id: user?.user?._id,
      entity_type: user?.user?.role?.role.toLowerCase(),
    };

    if (selectedAddressId) {
      // Updating existing address (allowed even if type matches another, but since only one exists, it's fine)
      await updateAddress({
        user_id: user?.user?._id,
        selectedAddressId: selectedAddressId,
        updatedAddress: submitData,
      }).unwrap();
      toast.success("Address updated successfully");
    } else {
      // Adding new — we already checked no duplicate type exists
      await addAddress(submitData).unwrap();
      toast.success("Address added successfully");
    }

    // Reset form
    setFormData(initialFormState);
    setSelectedAddressId(null);
    refetch();
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
      refetch();
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete address");
    }
  };

  if (isLoading || isAdding || isUpdating || isDeleting) return <Loader />;

  return (
    <div className="flex flex-col md:flex-row h-auto md:h-screen">
      <div className="w-full md:w-1/2 md:min-h-screen p-4 space-y-6 border-b md:border-r">
        <ScrollArea className="h-[calc(100vh-32px)] pr-4">
          <h2 className="mb-4 p-4 bg-amber-100 rounded-sm text-lg font-semibold">
            Address Details
          </h2>

          <div className="relative space-y-4">
            {addresses?.map((address) => (
              <Card
                key={address._id}
                className={`p-4 flex items-start justify-between cursor-pointer transition-all border-2 ${
                  selectedAddressId === address._id
                    ? "border-primary bg-muted"
                    : "border-border"
                }`}
              >
                <RadioGroup
                  value={selectedAddressId}
                  onValueChange={(value) =>
                    handleSelect({ ...address, _id: value })
                  }
                >
                  <div className="flex items-start gap-3 w-full">
                    <RadioGroupItem
                      value={address._id}
                      id={address._id}
                      className="mt-1"
                    />
                    <label
                      htmlFor={address._id}
                      className="flex-1 cursor-pointer"
                    >
                      <p className="font-medium">
                        {address.address_type.charAt(0).toUpperCase() +
                          address.address_type.slice(1)}{" "}
                        Address
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {address.address_line_1}
                      </p>
                      {address.address_line_2 && (
                        <p className="text-sm text-muted-foreground">
                          {address.address_line_2}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {toTitleCase(address.city)},{" "}
                        {toTitleCase(address.state)},{" "}
                        {toTitleCase(address.country)} - {address.pincode}
                      </p>
                    </label>
                  </div>
                </RadioGroup>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(address._id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="w-full md:w-1/2 p-4">
        <h2 className="mb-4 p-4 bg-amber-100 rounded-sm text-lg font-semibold">
          Add New Address
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="mb-2">Address Line 1</Label>
            <Input
              name="address_line_1"
              value={formData.address_line_1}
              placeholder="e.g. 123 Business Park"
              onChange={handleChange}
              className="border-2 border-slate-300"
            />
          </div>
          <div>
            <Label className="mb-2">Address Line 2</Label>
            <Input
              name="address_line_2"
              placeholder="e.g. Near Mall Road"
              value={formData.address_line_2}
              onChange={handleChange}
              className="border-2 border-slate-300"
            />
          </div>

          <div>
            <Label className="mb-2">Country</Label>
            <Select
              value={formData.country}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  country: value,
                  state: "",
                  city: "",
                }))
              }
            >
              <SelectTrigger className="w-full border-2 border-slate-300">
                <SelectValue placeholder="Select Country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((c) => (
                  <SelectItem key={c.isoCode} value={c.isoCode}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-2">State</Label>
            <Select
              value={formData.state}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  state: value,
                  city: "",
                }))
              }
              disabled={!states.length}
            >
              <SelectTrigger className="w-full border-2 border-slate-300">
                <SelectValue placeholder="Select State" />
              </SelectTrigger>
              <SelectContent>
                {states.map((s) => (
                  <SelectItem key={s.isoCode} value={s.isoCode}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-2">City</Label>
            <Select
              value={formData.city}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, city: value }))
              }
              disabled={!cities.length}
            >
              <SelectTrigger className="w-full border-2 border-slate-300">
                <SelectValue placeholder="Select City" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((ci) => (
                  <SelectItem key={ci.name} value={ci.name}>
                    {ci.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-2">Pincode</Label>
            <Input
              name="pincode"
              maxLength={6}
              placeholder="6-digit PIN code"
              value={formData.pincode}
              onChange={handleChange}
              className="border-2 border-slate-300"
            />
          </div>

          <div>
            <Label className="mb-2">Address Type</Label>
            <Select
              value={formData.address_type}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, address_type: value }))
              }
            >
              <SelectTrigger className="w-full border-2 border-slate-300">
                <SelectValue placeholder="Select Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="company">Company</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button onClick={handleSubmit} className="w-full cursor-pointer">
              {selectedAddressId ? "Update Address" : "Add Address"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddressList;
