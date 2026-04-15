import { useState, useEffect, useContext } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AttributeForm from "@/modules/admin/pages/merchants/reusable/AttributeForm";
import {
  useUploadProductImageMutation,
  useDeleteProductImageMutation,
} from "@/redux/api/ProductImageApi";
import {
  useCreateProductMutation,
  useUpdateProductMutation,
  useGetCategoriesQuery,
  useGetSubCategoriesQuery,
  useGetSuperSubCategoriesQuery,
  useGetDeepSubCategoriesQuery,
} from "@/redux/api/ProductApi";
import { skipToken } from "@reduxjs/toolkit/query";
import { toast } from "react-toastify";
import { AuthContext } from "@/modules/landing/context/AuthContext";

const StepperProductForm = ({ editingProduct, onClose, serviceProviderId }) => {
  const [step, setStep] = useState(1);
  useContext(AuthContext);

  const [formData, setFormData] = useState({
    seller_id: serviceProviderId || "", // Use serviceProviderId prop
    sellerModel: "ServiceProvider",
    product_name: "",
    price: "",
    stock_quantity: "",
    description: "",
    product_image: [],
  });

  const [categoryData, setCategoryData] = useState({
    category_id: "",
    sub_category_id: "",
    super_sub_category_id: "",
    deep_sub_category_id: "",
  });

  const [attributes, setAttributes] = useState([{ key: "", value: "" }]);

  const { data: categories, isLoading: isCategoriesLoading, isError: isCategoriesError } = useGetCategoriesQuery();
  const { data: subCategories, isLoading: isSubCategoriesLoading } = useGetSubCategoriesQuery(
    editingProduct?.category_id?._id || editingProduct?.category_id || categoryData.category_id
      ? editingProduct?.category_id?._id || editingProduct?.category_id || categoryData.category_id
      : skipToken
  );
  const { data: superSubCategories, isLoading: isSuperSubCategoriesLoading } =
    useGetSuperSubCategoriesQuery(
      editingProduct?.sub_category_id?._id ||
      editingProduct?.sub_category_id ||
      categoryData.sub_category_id
        ? editingProduct?.sub_category_id?._id ||
          editingProduct?.sub_category_id ||
          categoryData.sub_category_id
        : skipToken
    );
  const { data: deepSubCategories, isLoading: isDeepSubCategoriesLoading } =
    useGetDeepSubCategoriesQuery(
      editingProduct?.super_sub_category_id?._id ||
      editingProduct?.super_sub_category_id ||
      categoryData.super_sub_category_id
        ? editingProduct?.super_sub_category_id?._id ||
          editingProduct?.super_sub_category_id ||
          categoryData.super_sub_category_id
        : skipToken
    );

  useEffect(() => {
    if (editingProduct) {
      console.log("Editing Product Data:", editingProduct);
      setFormData({
        seller_id: serviceProviderId || editingProduct.seller_id || "", // Prefer serviceProviderId, fallback to editingProduct.seller_id
        sellerModel: "ServiceProvider",
        product_name: editingProduct.product_name || "",
        price: editingProduct.price
          ? parseFloat(editingProduct.price.$numberDecimal || editingProduct.price || 0).toString()
          : "",
        stock_quantity: editingProduct.stock_quantity || "",
        description: editingProduct.description || "",
        product_image: Array.isArray(editingProduct.product_image) ? editingProduct.product_image : [],
      });

      setCategoryData({
        category_id: editingProduct.category_id?._id || editingProduct.category_id || "",
        sub_category_id: editingProduct.sub_category_id?._id || editingProduct.sub_category_id || "",
        super_sub_category_id:
          editingProduct.super_sub_category_id?._id || editingProduct.super_sub_category_id || "",
        deep_sub_category_id:
          editingProduct.deep_sub_category_id?._id || editingProduct.deep_sub_category_id || "",
      });

      setAttributes(
        Array.isArray(editingProduct.attributes) && editingProduct.attributes.length > 0
          ? editingProduct.attributes.map((attr) => ({
              key: attr.attribute_key || "",
              value: attr.attribute_value || "",
            }))
          : [{ key: "", value: "" }]
      );
    } else {
      // For new products, use serviceProviderId prop
      setFormData({
        seller_id: serviceProviderId || "",
        sellerModel: "ServiceProvider",
        product_name: "",
        price: "",
        stock_quantity: "",
        description: "",
        product_image: [],
      });
      setCategoryData({
        category_id: "",
        sub_category_id: "",
        super_sub_category_id: "",
        deep_sub_category_id: "",
      });
      setAttributes([{ key: "", value: "" }]);
    }
  }, [editingProduct, serviceProviderId]);

  const [uploadImage] = useUploadProductImageMutation();
  const [deleteImage] = useDeleteProductImageMutation();
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const formDataUpload = new FormData();
    formDataUpload.append("product_name", formData.product_name || "default");
    files.forEach((file) => formDataUpload.append("product_image", file));

    try {
      const res = await uploadImage(formDataUpload).unwrap();
      const newImageUrls = res?.imageUrls || [];
      setFormData((prev) => ({
        ...prev,
        product_image: [...(prev.product_image || []), ...newImageUrls],
      }));
    } catch (err) {
      console.error("Image upload failed:", err);
      toast.error("Failed to upload images");
    }

    e.target.value = null;
  };

  const handleImageDelete = async (url) => {
    const fileName = url.split("/").pop();
    try {
      await deleteImage({
        file_names: [fileName],
        product_name: editingProduct?.product_name || formData.product_name,
      }).unwrap();
      setFormData((prev) => ({
        ...prev,
        product_image: prev.product_image.filter((img) => img !== url),
      }));
    } catch (error) {
      console.error("Image delete failed:", error);
      toast.error("Failed to delete image");
    }
  };

  const handleAttrChange = (index, field, value) => {
    const updated = [...attributes];
    updated[index][field] = value;
    setAttributes(updated);
  };

  const addAttribute = () => setAttributes([...attributes, { key: "", value: "" }]);
  const removeAttribute = (index) => setAttributes(attributes.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.seller_id) {
      toast.error("Service provider not selected. Please ensure you have a service provider profile.");
      return;
    }

    const productPayload = {
      ...formData,
      ...categoryData,
      attributes,
      seller_id: formData.seller_id, // Ensure seller_id is included
      sellerModel: "ServiceProvider",
    };

    try {
      if (editingProduct) {
        const res = await updateProduct({
          id: editingProduct._id,
          ...productPayload,
        }).unwrap();
        if (res.success) {
          toast.success(res.message || "Product updated successfully");
          onClose();
        } else {
          toast.error(res.message || "Failed to update product");
        }
      } else {
        const res = await createProduct(productPayload).unwrap();
        if (res.success) {
          toast.success(res.message || "Product created successfully");
          onClose();
        } else {
          toast.error(res.message || "Failed to create product");
        }
      }

      setStep(1);
      setFormData({
        seller_id: serviceProviderId || "", // Reset with serviceProviderId
        sellerModel: "ServiceProvider",
        product_name: "",
        price: "",
        stock_quantity: "",
        description: "",
        product_image: [],
      });
      setCategoryData({
        category_id: "",
        sub_category_id: "",
        super_sub_category_id: "",
        deep_sub_category_id: "",
      });
      setAttributes([{ key: "", value: "" }]);
    } catch (error) {
      console.error("Create/Update Product Error:", error);
      toast.error(error.data?.message || "Failed to save product");
    }
  };

  const validateStep2 = () => {
    if (!formData.product_name) {
      toast.error("Product name is required");
      return false;
    }
    if (!formData.price) {
      toast.error("Price is required");
      return false;
    }
    if (!formData.stock_quantity) {
      toast.error("Stock quantity is required");
      return false;
    }
    if (!formData.product_image.length) {
      toast.error("At least one product image is required");
      return false;
    }
    return true;
  };

  if (isCategoriesLoading) {
    return <p className="text-center text-gray-600">Loading categories...</p>;
  }

  if (isCategoriesError || !categories?.data?.length) {
    return (
      <p className="text-center text-red-600">
        No categories available. Please try again later.
      </p>
    );
  }

  console.log("Submit Button Disabled Check:", {
    isCreating,
    isUpdating,
    seller_id: formData.seller_id,
    product_name: formData.product_name,
    price: formData.price,
    stock_quantity: formData.stock_quantity,
  });

  return (
    <>
      <h1 className="font-bold text-xl border-b-2 mb-4 text-center sm:text-left ">
        {editingProduct ? "Edit Product" : "Add Product"}
      </h1>
      <form className="p-4 sm:p-6 bg-white rounded-2xl shadow-md w-full max-w-5xl mx-auto">
        {/* Stepper */}
        <div className="flex flex-col sm:flex-row justify-between mb-6 gap-2">
          {["Category", "Basic Info", "Attributes"].map((label, index) => (
            <div
              key={index}
              className={`flex-1 text-center py-2 border-b-2 text-sm sm:text-base ${
                step === index + 1 ? "border-[#0c1f4d] font-semibold" : "border-gray-300"
              }`}
            >
              Step {index + 1}: {label}
            </div>
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label>Category</Label>
              <Select
                value={categoryData.category_id}
                onValueChange={(value) =>
                  setCategoryData((prev) => ({
                    ...prev,
                    category_id: value,
                    sub_category_id: "",
                    super_sub_category_id: "",
                    deep_sub_category_id: "",
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.data?.length > 0 ? (
                    categories.data.map((cat) => (
                      <SelectItem key={cat._id} value={cat._id}>
                        {cat.category_name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1 text-gray-500">No categories available</div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Sub Category</Label>
              {isSubCategoriesLoading ? (
                <p className="text-gray-600">Loading subcategories...</p>
              ) : (
                <Select
                  value={categoryData.sub_category_id}
                  onValueChange={(value) =>
                    setCategoryData((prev) => ({
                      ...prev,
                      sub_category_id: value,
                      super_sub_category_id: "",
                      deep_sub_category_id: "",
                    }))
                  }
                  disabled={!categoryData.category_id || !subCategories?.data?.length}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Sub Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {subCategories?.data?.length > 0 ? (
                      subCategories.data.map((cat) => (
                        <SelectItem key={cat._id} value={cat._id}>
                          {cat.sub_category_name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1 text-gray-500">No subcategories available</div>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div>
              <Label>Super Sub Category</Label>
              {isSuperSubCategoriesLoading ? (
                <p className="text-gray-600">Loading super subcategories...</p>
              ) : (
                <Select
                  value={categoryData.super_sub_category_id}
                  onValueChange={(value) =>
                    setCategoryData((prev) => ({
                      ...prev,
                      super_sub_category_id: value,
                      deep_sub_category_id: "",
                    }))
                  }
                  disabled={!categoryData.sub_category_id || !superSubCategories?.data?.length}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Super Sub Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {superSubCategories?.data?.length > 0 ? (
                      superSubCategories.data.map((cat) => (
                        <SelectItem key={cat._id} value={cat._id}>
                          {cat.super_sub_category_name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1 text-gray-500">No super subcategories available</div>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div>
              <Label>Deep Sub Category</Label>
              {isDeepSubCategoriesLoading ? (
                <p className="text-gray-600">Loading deep subcategories...</p>
              ) : (
                <Select
                  value={categoryData.deep_sub_category_id}
                  onValueChange={(value) =>
                    setCategoryData((prev) => ({ ...prev, deep_sub_category_id: value }))
                  }
                  disabled={!categoryData.super_sub_category_id || !deepSubCategories?.data?.length}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Deep Sub Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {deepSubCategories?.data?.length > 0 ? (
                      deepSubCategories.data.map((cat) => (
                        <SelectItem key={cat._id} value={cat._id}>
                          {cat.deep_sub_category_name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1 text-gray-500">No deep subcategories available</div>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="product_name">Product Name</Label>
              <Input
                id="product_name"
                name="product_name"
                placeholder="Enter product name"
                value={formData.product_name}
                onChange={handleInputChange}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  placeholder="Enter price"
                  value={formData.price}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="stock_quantity">Stock Quantity</Label>
                <Input
                  id="stock_quantity"
                  name="stock_quantity"
                  type="number"
                  placeholder="Enter stock quantity"
                  value={formData.stock_quantity}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                placeholder="Enter product description"
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label htmlFor="product_image">Product Image</Label>
              <Input
                id="product_image"
                type="file"
                multiple
                onChange={handleFileChange}
                accept="image/*"
              />
            </div>

            {formData.product_image?.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-4">
                {formData.product_image.map((url, index) => (
                  <div key={index} className="relative w-fit">
                    <img
                      src={`${encodeURI(url)}?t=${new Date().getTime()}`}
                      alt={`Preview ${index}`}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-md border object-cover"
                    />
                    <Button
                      type="button"
                      size="icon"
                      onClick={() => handleImageDelete(url)}
                      className="absolute -top-2 -right-2 bg-red-500 p-1 rounded-full shadow hover:bg-red-600"
                    >
                      <Trash2 className="w-4 h-4 text-white" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <AttributeForm
            attributes={attributes}
            handleAttrChange={handleAttrChange}
            addAttribute={addAttribute}
            removeAttribute={removeAttribute}
          />
        )}

        {/* Navigation */}
        <div className="mt-6 flex flex-col sm:flex-row justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 w-full sm:w-auto"
            onClick={step === 1 ? onClose : () => setStep(step - 1)}
          >
            {step === 1 ? "Cancel" : "Back"}
          </Button>

          {step < 3 ? (
            <Button
              type="button"
              onClick={() => {
                if (step === 1 && !categoryData.category_id) {
                  toast.error("Please select a category");
                  return;
                }
                if (step === 2 && !validateStep2()) {
                  return;
                }
                setStep(step + 1);
              }}
              className="bg-[#0c1f4d] hover:bg-[#0c1f4d] text-white w-full sm:w-auto"
              disabled={step === 1 && !categoryData.category_id}
            >
              Next
            </Button>
          ) : (
            <Button
              type="button"
              className="bg-green-500 hover:bg-green-600 text-white w-full sm:w-auto"
              onClick={handleSubmit}
              disabled={isCreating || isUpdating || !formData.seller_id || !formData.product_name || !formData.price || !formData.stock_quantity}
            >
              {editingProduct
                ? isUpdating
                  ? "Updating..."
                  : "Update"
                : isCreating
                ? "Creating..."
                : "Submit"}
            </Button>
          )}
        </div>
      </form>
    </>
  );
};

export default StepperProductForm;