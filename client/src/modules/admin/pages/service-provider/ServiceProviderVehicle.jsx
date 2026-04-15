import React, { useState } from "react";
import { useSidebar } from "../../hooks/useSidebar";
import ServiceProviderProductForm from "./forms/ServiceProviderProductForm";
import {
  useLazyGetServiceByEmailOrPhoneQuery,

} from "@/redux/api/ServiceProviderApi";
import { useMerchant } from "@/modules/admin/context/MerchantContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ServiceProviderProductList from "./pages/ServiceProviderProductList";
import {toast} from "react-toastify";


const ServiceProviderVehicle = () => {
  const { isSidebarOpen } = useSidebar();
  const [email, setEmail] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [fetchServiceProvider, { isLoading }] = useLazyGetServiceByEmailOrPhoneQuery();
  const [selectedUser,setSelectedUser]=useState({});
  const [selectedProduct,setSelectedProduct]=useState([]);
  const [pagination,setPagination]=useState({});
  const { selectedMerchant, setSelectedMerchant } = useMerchant();
  const [editingProduct, setEditingProduct] = useState(null);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    setError(null);

    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isValidEmail) {
      setSelectedMerchant(null);
      setShowForm(false);
      setError("Please enter a valid email address");
      return;
    }

    try {
      const res = await fetchServiceProvider({email}).unwrap();
      if (res.serviceProvider && res?.serviceProvider) {
        setSelectedMerchant(res?.serviceProvider);
        setSelectedUser(res?.user);
        setSelectedProduct(res?.products);
        setPagination(res?.pagination);
        setShowForm(true);
        setEmail("");
        toast.success("Fetch Service Provider Successfully");
      } else {
        setSelectedMerchant(null);
        setShowForm(false);
        toast.error("Service Provider not found");
        setError("Merchant not found");
      }
    } catch (err) {
      setSelectedMerchant(null);
      setShowForm(false);
      setError("Error fetching merchant");
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    console.log(product, "selected product");
  };
  const handleDelete = (productId) => {
    console.log(productId, "selected product id");
  };

  return (
    <div
      className={`${
        isSidebarOpen ? "p-6 lg:ml-56" : "p-4 lg:ml-16"
      } flex flex-col justify-center items-center  overflow-x-hidden`}
    >
      <div className="flex justify-center items-center mb-4">
        <h2 className="text-xl font-bold">Add Service Provider Product</h2>
      </div>
  
      <div className="flex flex-col lg:flex-row gap-4 w-full max-w-full">
        {/* Left Section: Search + Form */}
        <div className="w-full lg:w-1/2">
          {/* Search Input */}
          <div className="flex flex-col lg:flex-row justify-center items-center gap-6 mb-4">
            {/* Left-side Note */}
            <div className="max-w-sm text-gray-700 text-sm bg-yellow-50 border border-yellow-200 p-4 rounded-md shadow-sm">
              <p className="font-medium text-yellow-800 mb-1">Note:</p>
              <p>
                Do you want to add a service provider product?
                <br />
                First, select the service provider by entering their email.
              </p>
            </div>
  
            {/* Right-side Input + Button */}
            <div className="flex gap-2 items-center justify-center w-full max-w-md">
              <Input
                type="text"
                placeholder="Enter merchant email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="border px-4 py-2 rounded-md w-full"
              />
              <Button onClick={handleSearch}>
                {isLoading ? "Searching..." : "Search"}
              </Button>
            </div>
          </div>
  
          {/* Error */}
          {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
  
          {/* Merchant Card */}
          {showForm && selectedMerchant && (
            <div className="max-w-md mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground font-medium">
                      Selected Service Provider Info
                    </p>
                    <div className="text-lg font-semibold">
                      {selectedUser.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {selectedUser.email}
                    </div>
                    <div className="text-sm text-gray-600">
                      {selectedUser.phone}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
  
          {/* Product Form */}
          {showForm && <ServiceProviderProductForm editingProduct={editingProduct} />}
        </div>
  
        {/* Divider */}
        <div className="hidden lg:block w-[1px] bg-[#1C1B1F]" />
  
        {/* Right Section: Product List */}
        {showForm && (
          <div className="w-full lg:w-1/2 overflow-x-auto">
            <ServiceProviderProductList
              products={selectedProduct}
              pagination={pagination}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
        )}
      </div>
    </div>
  );
  
};

export default ServiceProviderVehicle;


