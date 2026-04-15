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
import validatePincode from "@/modules/validation/pincodeValidation";
import Loader from "@/loader/Loader";

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

const toTitleCase = (str = "") =>
  str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());

const StudentAddressList = () => {
  const { user } = useContext(AuthContext);
const getAddressTypeDisplay = (type) => {
  if (type === "company") return "College";
  if (type === "personal") return "Personal";
  return type ? type.charAt(0).toUpperCase() + type.slice(1) : "";
};
  const { data: addresses, isLoading, refetch } = useGetUserAddressesQuery({
    user_id: user?.user?._id,
  });

  const [addAddress] = useAddUserAddressMutation();
  const [updateAddress] = useUpdateUserAddressMutation();
  const [deleteAddress] = useDeleteUserAddressMutation();
  const [isProcessing, setIsProcessing] = useState(false);

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
      setCities([]);
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
    const hasCity = formData.city
      ? base.some((ci) => ci.name === formData.city)
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
      const baseCities = City.getCitiesOfState(countryObj.isoCode, stateObj.isoCode) || [];
      const match = baseCities.find(
        (ci) => ci.name.toLowerCase() === (address.city || "").toLowerCase()
      );
      canonicalCity = match ? match.name : toTitleCase(address.city);
    }

    setFormData({
      entity_type: address.entity_type || "",
      address_line_1: address.address_line_1 || "",
      address_line_2: address.address_line_2 || "",
      city: canonicalCity,
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

const handleSubmit = async () => {
  // Validate pincode
  if (!validatePincode(formData.pincode)) {
    toast.error("Please enter a valid 6-digit pincode");
    return;
  }

  // Check for duplicate address_type
  const isEditing = !!selectedAddressId;
  const currentAddress = isEditing
    ? addresses?.find((addr) => addr._id === selectedAddressId)
    : null;

  // If the user is trying to set an address_type that already exists (and it's not the one they're currently editing)
  const conflictingAddress = addresses?.find(
    (addr) =>
      addr._id !== selectedAddressId && // not the one being edited
      addr.address_type === formData.address_type
  );

  if (conflictingAddress) {
    toast.error(
      `You already have a ${getAddressTypeDisplay(
        formData.address_type
      )} address. Only one address per type is allowed.`
    );
    return;
  }

  try {
    setIsProcessing(true);
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

    if (isEditing) {
      await updateAddress({
        user_id: user?.user?._id,
        selectedAddressId,
        updatedAddress: submitData,
      }).unwrap();
      toast.success("Address updated successfully");
    } else {
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
  } finally {
    setIsProcessing(false);
  }
};
  const handleDelete = async (id) => {
    try {
      setIsProcessing(true);
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
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] w-full bg-white rounded-2xl shadow-sm border border-gray-100">
        <Loader contained={true} label="Loading addresses..." />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Column: Address List */}
      <div className="w-full md:w-1/2 p-4 sm:p-6 border-r border-border">
        <h2 className="mb-4 p-3 bg-amber-100 rounded-sm text-base sm:text-lg font-semibold">
          Address Details
        </h2>
        <ScrollArea className="h-[calc(100vh-120px)] pr-4">
          <div className="space-y-4">
            {addresses?.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm sm:text-base">
                No addresses added yet.
              </p>
            ) : (
              addresses?.map((address) => (
                <Card
                  key={address._id}
                  className={`p-4 flex items-start justify-between cursor-pointer transition-all border-2 ${
                    selectedAddressId === address._id
                      ? "border-primary bg-muted"
                      : "border-border hover:border-muted-foreground"
                  }`}
                  onClick={() => handleSelect(address)}
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
                        aria-label={`Select ${address.address_type} address`}
                      />
                      <label
                        htmlFor={address._id}
                        className="flex-1 cursor-pointer"
                      >
                       <p className="font-medium text-sm sm:text-base">
  {getAddressTypeDisplay(address.address_type)} Address
</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {address.address_line_1}
                        </p>
                        {address.address_line_2 && (
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {address.address_line_2}
                          </p>
                        )}
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {toTitleCase(address.city)}, {toTitleCase(address.state)},{" "}
                          {toTitleCase(address.country)} - {address.pincode}
                        </p>
                      </label>
                    </div>
                  </RadioGroup>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(address._id);
                    }}
                    className="h-10 w-10"
                    aria-label={`Delete ${address.address_type} address`}
                  >
                    <Trash2 className="w-5 h-5 text-destructive" />
                  </Button>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Right Column: Add/Edit Address Form */}
      <div className="w-full md:w-1/2 p-4 sm:p-6">
        <h2 className="mb-4 p-3 bg-amber-100 rounded-sm text-base sm:text-lg font-semibold">
          {selectedAddressId ? "Edit Address" : "Add New Address"}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <Label className="mb-2 text-sm sm:text-base">Address Line 1</Label>
            <Input
              name="address_line_1"
              value={formData.address_line_1}
              onChange={handleChange}
              className="text-sm sm:text-base border-2 border-slate-300"
              placeholder="e.g. House no., Building, Street"
              aria-label="Address Line 1"
            />
          </div>
          <div>
            <Label className="mb-2 text-sm sm:text-base">Address Line 2</Label>
            <Input
              name="address_line_2"
              value={formData.address_line_2}
              onChange={handleChange}
              className="text-sm sm:text-base border-2 border-slate-300"
              placeholder="e.g. Area, Locality (optional)"
              aria-label="Address Line 2"
            />
          </div>

          <div>
            <Label className="mb-2 text-sm sm:text-base">Country</Label>
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
              <SelectTrigger className="w-full text-sm sm:text-base border-2 border-slate-300">
                <SelectValue placeholder="Select Country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((c) => (
                  <SelectItem key={c.isoCode} value={c.isoCode} className="text-sm sm:text-base">
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-2 text-sm sm:text-base">State</Label>
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
              <SelectTrigger className="w-full text-sm sm:text-base border-2 border-slate-300">
                <SelectValue placeholder="Select State" />
              </SelectTrigger>
              <SelectContent>
                {states.map((s) => (
                  <SelectItem key={s.isoCode} value={s.isoCode} className="text-sm sm:text-base">
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-2 text-sm sm:text-base">City</Label>
            <Select
              value={formData.city}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, city: value }))
              }
              disabled={!cities.length}
            >
              <SelectTrigger className="w-full text-sm sm:text-base border-2 border-slate-300">
                <SelectValue placeholder="Select City" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((ci) => (
                  <SelectItem key={ci.name} value={ci.name} className="text-sm sm:text-base">
                    {ci.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-2 text-sm sm:text-base">Pincode</Label>
            <Input
              name="pincode"
              value={formData.pincode}
              onChange={handleChange}
              maxLength={6}
              className="text-sm sm:text-base border-2 border-slate-300"
              placeholder="e.g. 400001"
              aria-label="Pincode"
            />
          </div>

          <div>
            <Label className="mb-2 text-sm sm:text-base">Address Type</Label>
            <Select
              value={formData.address_type}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, address_type: value }))
              }
            >
              <SelectTrigger className="w-full text-sm sm:text-base border-2 border-slate-300">
                <SelectValue placeholder="Select Address Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personal" className="text-sm sm:text-base">
                  Personal
                </SelectItem>
                <SelectItem value="company" className="text-sm sm:text-base">
                  College
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-2">
            <Button
              onClick={handleSubmit}
              className="w-full sm:w-auto px-6 py-2 text-sm sm:text-base cursor-pointer"
            >
              {selectedAddressId ? "Update Address" : "Add Address"}
            </Button>
          </div>
        </div>
      </div>
      {isProcessing && <Loader label="Processing..." />}
    </div>
  );
};

export default StudentAddressList;
