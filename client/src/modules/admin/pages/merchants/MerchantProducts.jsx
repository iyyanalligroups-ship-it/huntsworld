
import React, { useState } from "react";
import { useSidebar } from "../../hooks/useSidebar";
import MerchantProductForm from "./forms/MerchantProductForm";
import {
  useLazyGetMerchantByEmailOrPhoneQuery,

} from "@/redux/api/ProductApi";
import { useMerchant } from "@/modules/admin/context/MerchantContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import MerchantProductListing from "./pages/MerchantProductList";
import { toast } from "react-toastify";


const MerchantProducts = () => {
  const { isSidebarOpen } = useSidebar();
  const [email, setEmail] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [fetchMerchant, { isLoading }] =
    useLazyGetMerchantByEmailOrPhoneQuery();
  const [merchantProducts, setMerchantProducts] = useState([]);
  const [selectedUser,setSelectedUser]=useState({});
  const [tablePagination,setTablePagination]=useState({});
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
      const res = await fetchMerchant({email}).unwrap();
        console.log(res,'seeleted');
        
   
      if (res.success && res.merchant) {
        setSelectedMerchant(res?.merchant);
        setMerchantProducts(res?.products || []);
        setTablePagination(res?.pagination);
        setSelectedUser(res?.user)
        setShowForm(true);
        setEmail("");
        toast.success("Fetched merchant successfully");
      } else {
      
        setSelectedMerchant(null);
        setShowForm(false);
        setError(res.message || "Merchant not found");
        toast.error(res.message || "Merchant not found");
      }
    } catch (err) {
      setSelectedMerchant(null);
      setShowForm(false);
      setError(err?.data?.message || "Error fetching merchant");
      toast.error(err?.data?.message || "Error fetching merchant");
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
  className={`min-h-screen ${isSidebarOpen ? "p-6 lg:ml-56" : "p-4 lg:ml-16"
    }`}
>
  <div className="max-w-7xl mx-auto">
    <h2 className="text-xl font-bold text-center mb-4">Add Merchant Product</h2>

    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left Panel */}
      <div className="w-full lg:w-1/2 flex flex-col">
        {/* Search Section */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 mb-4">
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md shadow-sm text-sm text-gray-700">
            <p className="font-medium text-yellow-800 mb-1">Note:</p>
            <p>
              Do you want to add a merchant product?
              <br />
              First, select the merchant by entering their email.
            </p>
          </div>

          <div className="w-full max-w-md flex gap-2">
            <Input
              type="text"
              placeholder="Enter merchant email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full"
            />
            <Button onClick={handleSearch}>
              {isLoading ? "Searching..." : "Search"}
            </Button>
          </div>
        </div>

        {/* Merchant Info */}
        {showForm && selectedMerchant && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground font-medium">
                  Selected Merchant Info
                </p>
                <div className="text-lg font-semibold">{selectedUser.name}</div>
                <div className="text-sm text-gray-600">{selectedUser.email}</div>
                <div className="text-sm text-gray-600">{selectedUser.phone}</div>
              </div>
            </CardContent>
          </Card>
        )}

   
        {showForm && <MerchantProductForm editingProduct={editingProduct} />}
      </div>


      <div className="hidden lg:block w-px bg-gray-300"></div>

      {showForm && (
        <div className="w-full lg:w-1/2">
          <MerchantProductListing
            products={merchantProducts}
            pagination={tablePagination}
            onEdit={handleEdit}
            onDelete={handleDelete}
            userId={selectedUser._id}
          />
        </div>
      )}
    </div>
  </div>
</div>

  );
};


export default MerchantProducts;
