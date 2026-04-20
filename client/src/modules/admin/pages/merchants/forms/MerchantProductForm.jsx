import { useState, useEffect, forwardRef } from "react";
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
import { useMerchant } from "@/modules/admin/context/MerchantContext";
import { toast } from "react-toastify";

const StepperProductForm = forwardRef(({ editingProduct, onClose }, ref) => {
  const [step, setStep] = useState(1);
  const { selectedMerchant } = useMerchant();
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const [formData, setFormData] = useState({
    seller_id: selectedMerchant?._id || "",
    sellerModel: "Merchant",
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

  const [uploadImage] = useUploadProductImageMutation();
  const [deleteImage] = useDeleteProductImageMutation();
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();

  const { data: categories, isLoading: isCategoriesLoading } = useGetCategoriesQuery();

  const { data: subCategories, isLoading: isSubCategoriesLoading } = useGetSubCategoriesQuery(
    isInitialLoad || !categoryData.category_id ? skipToken : categoryData.category_id
  );

  const { data: superSubCategories, isLoading: isSuperSubCategoriesLoading } = useGetSuperSubCategoriesQuery(
    isInitialLoad || !categoryData.sub_category_id ? skipToken : categoryData.sub_category_id
  );

  const { data: deepSubCategories, isLoading: isDeepSubCategoriesLoading } = useGetDeepSubCategoriesQuery(
    isInitialLoad || !categoryData.super_sub_category_id ? skipToken : categoryData.super_sub_category_id
  );

  useEffect(() => {
    if (!editingProduct) {
      console.log("Resetting categoryData on modal close");
      setCategoryData({
        category_id: "",
        sub_category_id: "",
        super_sub_category_id: "",
        deep_sub_category_id: "",
      });
      setIsInitialLoad(true);
    }
  }, [editingProduct]);


  useEffect(() => {
    console.log("editingProduct:", editingProduct);
    if (editingProduct) {
      const newFormData = {
        seller_id: selectedMerchant?._id || editingProduct.seller_id || "",
        sellerModel: "Merchant",
        product_name: editingProduct.product_name || "",
        price: parseFloat(editingProduct.price?.$numberDecimal || 0),
        stock_quantity: editingProduct.stock_quantity || "",
        description: editingProduct.description || "",
        product_image: Array.isArray(editingProduct.product_image)
          ? editingProduct.product_image
          : [],
      };
      const newCategoryData = {
        category_id: editingProduct.category_id?._id || "",
        sub_category_id: editingProduct.sub_category_id?._id || "",
        super_sub_category_id: editingProduct.super_sub_category_id?._id || "",
        deep_sub_category_id: editingProduct.deep_sub_category_id?._id || "",
      };
      const newAttributes = editingProduct.attributes?.map((attr) => ({
        key: attr.attribute_key,
        value: attr.attribute_value,
      })) || [{ key: "", value: "" }];

      console.log("Setting formData:", newFormData);
      console.log("Setting categoryData:", newCategoryData);
      console.log("Setting attributes:", newAttributes);

      setFormData(newFormData);
      setCategoryData(newCategoryData);
      setAttributes(newAttributes);
      setIsInitialLoad(false); 
    }
  }, [editingProduct, selectedMerchant]);

  useEffect(() => {
    console.log("Current categoryData:", categoryData);
  }, [categoryData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const formDataUpload = new FormData();
    formDataUpload.append("product_name", formData.product_name || "default");

    files.forEach((file) => {
      formDataUpload.append("product_image", file);
    });

    try {
      const res = await uploadImage(formDataUpload).unwrap();
      const newImageUrls = res?.imageUrls || [];

      if (newImageUrls.length > 0) {
        setFormData((prev) => ({
          ...prev,
          product_image: [...(prev.product_image || []), ...newImageUrls],
        }));

        if (editingProduct) {
          const productPayload = {
            ...formData,
            product_image: [...(formData.product_image || []), ...newImageUrls],
            ...categoryData,
            attributes,
          };

          await updateProduct({
            id: editingProduct._id,
            ...productPayload,
          }).unwrap();
          toast.success("Image uploaded and product updated");
        }
      }
    } catch (err) {
      console.error("Image upload failed:", err);
      toast.error(err?.data?.message || "Failed to upload images");
    }

    e.target.value = null;
  };

  const handleImageDelete = async (url) => {
    const fileName = url.split("/").pop();

    try {
      const deleteRes = await deleteImage({
        file_names: [fileName],
        product_name: editingProduct?.product_name || formData.product_name,
      }).unwrap();
      console.log(deleteRes);
      
      const updatedImages = formData.product_image.filter((img) => img !== url);
      setFormData((prev) => ({
        ...prev,
        product_image: updatedImages,
      }));

      if (editingProduct) {
        const productPayload = {
          ...formData,
          product_image: updatedImages,
          ...categoryData,
          attributes,
        };

        await updateProduct({
          id: editingProduct._id,
          ...productPayload,
        }).unwrap();
        toast.success("Image deleted and product updated");
      } else {
        toast.success("Image deleted");
      }
    } catch (error) {
      console.error("Image delete failed:", error);
      toast.error(error?.data?.message || "Failed to delete image");
    }
  };

  const handleAttrChange = (index, field, value) => {
    const updated = [...attributes];
    updated[index][field] = value;
    setAttributes(updated);
  };

  const addAttribute = () => setAttributes([...attributes, { key: "", value: "" }]);
  const removeAttribute = (index) =>
    setAttributes(attributes.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.seller_id) {
      console.error("Merchant not selected");
      toast.error("Merchant not selected");
      return;
    }

    const productPayload = {
      ...formData,
      ...categoryData,
      attributes,
    };

    try {
      if (editingProduct) {
        const res = await updateProduct({
          id: editingProduct._id,
          ...productPayload,
        }).unwrap();
        console.log("Product Updated:", res);
        if (res.success) {
          toast.success(res.message || "Product Updated Successfully");
          onClose?.();
        } else {
          toast.error(res.message || "Failed to Update");
        }
      } else {
        const res = await createProduct(productPayload).unwrap();
        console.log("Product Created:", res);
        if (res.success) {
          toast.success(res.message || "Product Added Successfully");
          onClose?.();
        } else {
          toast.error(res.message || "Failed to Add");
        }
      }

      setStep(1);
      setFormData({
        seller_id: selectedMerchant?._id || "",
        sellerModel: "Merchant",
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
      setIsInitialLoad(true);
    } catch (error) {
      console.error("Create/Update Product Error:", error);
      toast.error(error?.data?.message || "Error processing product");
    }
  };

  return (
    <div ref={ref}>
      <h1 className="font-bold text-xl border-b-2">
        {editingProduct ? "Edit Product" : "Add Product"}
      </h1>
      <form className="p-6 bg-white rounded-2xl shadow-md max-w-2xl mx-auto">
        <div className="flex justify-between mb-6">
          {["Category", "Basic Info", "Attributes"].map((label, index) => (
            <div
              key={index}
              className={`w-full text-center py-2 border-b-2 ${
                step === index + 1 ? "border-blue-600 font-semibold" : "border-gray-300"
              }`}
            >
              Step {index + 1}: {label}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            {isCategoriesLoading ? (
              <p>Loading categories...</p>
            ) : (
              <>
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
                    {categories?.data?.map((cat) => (
                      <SelectItem key={cat._id} value={cat._id}>
                        {cat.category_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}

            {isSubCategoriesLoading ? (
              <p>Loading sub-categories...</p>
            ) : (
              <>
                <Label>Sub Category</Label>
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
                    {subCategories?.data?.map((cat) => (
                      <SelectItem key={cat._id} value={cat._id}>
                        {cat.sub_category_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}

            {isSuperSubCategoriesLoading ? (
              <p>Loading super sub-categories...</p>
            ) : (
              <>
                <Label>Super Sub Category</Label>
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
                    {superSubCategories?.data?.map((cat) => (
                      <SelectItem key={cat._id} value={cat._id}>
                        {cat.super_sub_category_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}

            {isDeepSubCategoriesLoading ? (
              <p>Loading deep sub-categories...</p>
            ) : (
              <>
                <Label>Deep Sub Category</Label>
                <Select
                  value={categoryData.deep_sub_category_id}
                  onValueChange={(value) =>
                    setCategoryData((prev) => ({
                      ...prev,
                      deep_sub_category_id: value,
                    }))
                  }
                  disabled={!categoryData.super_sub_category_id || !deepSubCategories?.data?.length}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Deep Sub Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {deepSubCategories?.data?.map((cat) => (
                      <SelectItem key={cat._id} value={cat._id}>
                        {cat.deep_sub_category_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <Label htmlFor="product_name">Product Name</Label>
            <Input
              id="product_name"
              name="product_name"
              placeholder="Enter product name"
              value={formData.product_name}
              onChange={handleInputChange}
            />

            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              name="price"
              type="number"
              placeholder="Enter price"
              value={formData.price}
              onChange={handleInputChange}
            />

            <Label htmlFor="stock_quantity">Stock Quantity</Label>
            <Input
              id="stock_quantity"
              name="stock_quantity"
              type="number"
              placeholder="Enter stock quantity"
              value={formData.stock_quantity}
              onChange={handleInputChange}
            />

            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              placeholder="Enter product description"
              value={formData.description}
              onChange={handleInputChange}
            />

            <Label htmlFor="product_image">Product Image</Label>
            <Input
              id="product_image"
              type="file"
              multiple
              onChange={handleFileChange}
              accept="image/*"
            />

            {formData.product_image?.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-4">
                {formData.product_image.map((url, index) => (
                  <div key={index} className="relative w-fit">
                    <img
                      src={`${encodeURI(url)}?t=${new Date().getTime()}`}
                      alt={`Preview ${index}`}
                      className="w-24 h-24 rounded-md border object-cover"
                    />
                    <Button
                      type="button"
                      size="icon"
                      onClick={() => handleImageDelete(url)}
                      className="absolute -top-2 -right-2 bg-white p-1 rounded-full shadow hover:bg-red-100"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <AttributeForm
            attributes={attributes}
            handleAttrChange={handleAttrChange}
            addAttribute={addAttribute}
            removeAttribute={removeAttribute}
          />
        )}

        <div className="mt-6 flex justify-between">
          {step > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(step - 1)}
            >
              Back
            </Button>
          )}

          {step === 1 || step === 2 ? (
            <Button type="button" onClick={() => setStep(step + 1)}>
              Next
            </Button>
          ) : step === 3 ? (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isCreating || isUpdating}
            >
              {editingProduct
                ? isUpdating
                  ? "Updating..."
                  : "Update"
                : isCreating
                ? "Creating..."
                : "Submit"}
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
});

export default StepperProductForm;