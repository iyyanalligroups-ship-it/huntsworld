import { useState, useEffect, useContext, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, ArrowLeft, Plus, Image as ImageIcon } from "lucide-react";
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
import { useCheckUserSubscriptionQuery } from "@/redux/api/BannerPaymentApi";
import { skipToken } from "@reduxjs/toolkit/query";
import showToast from "@/toast/showToast";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import ProductNameAutocomplete from "./ProductNameAutocomplete";
import axios from "axios";
import Loader from "@/loader/Loader";

const unitOptions = [
  { label: "Kilogram", value: "kg" },
  { label: "Gram", value: "g" },
  { label: "Ton", value: "ton" },
  { label: "Piece", value: "pcs" },
  { label: "Liter", value: "ltr" },
  { label: "Meter", value: "m" },
  { label: "Centimeter", value: "cm" },
  { label: "Dozen", value: "dz" },
  { label: "Pack", value: "pk" },
  { label: "Other", value: "other" },
];

const StepperProductForm = ({ editingProduct: initialEditingProduct, onClose, merchantId }) => {
  const [step, setStep] = useState(1);
  const { user } = useContext(AuthContext);
  const user_id = user?.user?._id || "67de5caffcfb7c166a0b8f4d";
  const [tagInput, setTagInput] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    seller_id: merchantId || "",
    sellerModel: "Merchant",
    product_name: "",
    price: "",
    product_image: [],
    video_url: "",
    unitOfMeasurement: "",
    askPrice: false,
    search_tags: [],
    stock_quantity: 0
  });
  const [selectedUnit, setSelectedUnit] = useState("");
  const [customUnit, setCustomUnit] = useState("");
  const [categoryData, setCategoryData] = useState({
    category_id: "",
    sub_category_id: "",
    super_sub_category_id: "",
    deep_sub_category_id: "",
  });
  const [attributes, setAttributes] = useState([{ key: "", value: "" }]);
  const [globalOthersIds, setGlobalOthersIds] = useState(null);

  const { data: categories, isLoading: catLoading } = useGetCategoriesQuery();
  const { data: subCategories, isLoading: subCatLoading } = useGetSubCategoriesQuery(
    categoryData.category_id || editingProduct?.category_id?._id || skipToken
  );
  const { data: superSubCategories, isLoading: supCatLoading } = useGetSuperSubCategoriesQuery(
    categoryData.sub_category_id || editingProduct?.sub_category_id?._id || skipToken
  );
  const { data: deepSubCategories, isLoading: deepCatLoading } = useGetDeepSubCategoriesQuery(
    categoryData.super_sub_category_id || editingProduct?.super_sub_category_id?._id || skipToken
  );
  const { data: subscriptionData, isLoading: subLoading } = useCheckUserSubscriptionQuery(user_id);
  const [uploadImage] = useUploadProductImageMutation();
  const [deleteImage] = useDeleteProductImageMutation();
  const [createProduct, { isLoading: creating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: updating }] = useUpdateProductMutation();
  const [productVideoEnabled, setProductVideoEnabled] = useState(false);

  useEffect(() => {
    const checkVideoAccess = async () => {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/products/product-video-access`, {
        user_id: user_id,
      });

      setProductVideoEnabled(res.data.product_video);
    };

    if (user_id) checkVideoAccess();
  }, [user_id]);



  const resizeImageTo500 = (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (event) => {
        img.src = event.target.result;
      };

      reader.onerror = () => reject("Failed to read image");

      img.onload = () => {
        const SIZE = 500;
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = SIZE;
        canvas.height = SIZE;

        // Maintain aspect ratio (center crop)
        const scale = Math.max(SIZE / img.width, SIZE / img.height);
        const x = (SIZE - img.width * scale) / 2;
        const y = (SIZE - img.height * scale) / 2;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        ctx.drawImage(
          img,
          x,
          y,
          img.width * scale,
          img.height * scale
        );

        canvas.toBlob(
          (blob) => {
            if (!blob) return reject("Image processing failed");

            const resizedFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, "") + ".jpg",
              { type: "image/jpeg" }
            );

            resolve(resizedFile);
          },
          "image/jpeg",
          0.9 // 90% quality
        );
      };

      img.onerror = () => reject("Invalid image file");

      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    try {
      const userId = user?.user?._id;
      if (!userId) {
        showToast("User not found", "error");
        return;
      }

      // 1️⃣ Get limit from backend
      const limit = await getProductPhotoLimit(userId);

      if (!limit) {
        showToast("Unable to verify photo upload limit", "error");
        e.target.value = null;
        return;
      }

      const existingImages = formData.product_image || [];

      // 🔥 FRONTEND TRACKING LOGIC
      const currentFormImageCount = existingImages.length; // images selected in current form
      const backendUsed = limit.used || 0; // images already stored in DB
      const totalUsed = backendUsed + currentFormImageCount;

      const remaining = limit.is_unlimited
        ? Infinity
        : Math.max(limit.total - totalUsed, 0);

      // 🚫 Block if limit reached
      if (!limit.is_unlimited && remaining <= 0) {
        showToast(`You have reached your total product photo limit of ${limit.total}`, "error");
        e.target.value = null;
        return;
      }

      // 2️⃣ Decide how many files allowed
      const allowedNewCount = limit.is_unlimited
        ? files.length
        : Math.min(files.length, remaining);

      if (!limit.is_unlimited && files.length > remaining) {
        showToast(
          `You can upload only ${remaining} more image(s) based on your plan`,
          "warning"
        );
      }

      const filesToProcess = files.slice(0, allowedNewCount);

      const resizedFiles = [];

      // 3️⃣ Resize to 500x500
      for (const file of filesToProcess) {
        try {
          const resized = await resizeImageTo500(file);
          resizedFiles.push(resized);
        } catch (err) {
          showToast(`Failed to process ${file.name}`, "error");
        }
      }

      if (!resizedFiles.length) {
        e.target.value = null;
        return;
      }

      // 4️⃣ Upload images
      const uploadData = new FormData();
      uploadData.append(
        "product_name",
        formData.product_name || "default"
      );

      resizedFiles.forEach((file) => {
        uploadData.append("product_image", file);
      });

      const res = await uploadImage(uploadData).unwrap();
      const newImageUrls = res?.imageUrls || [];

      if (!newImageUrls.length) {
        e.target.value = null;
        return;
      }

      // 5️⃣ Merge into local state
      const updatedImages = [...existingImages, ...newImageUrls];

      setFormData((prev) => ({
        ...prev,
        product_image: updatedImages,
      }));

      showToast("Image uploaded successfully", "success");

    } catch (err) {
      console.error("Image upload failed:", err);

      const message =
        err?.response?.data?.message ||
        err?.data?.message ||
        "Failed to upload images";

      showToast(message, "error");
    }

    e.target.value = null;
  };




  // api/subscription.js
  const getProductPhotoLimit = async (user_id) => {
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/products/product-photo-limit`,
        { user_id }
      );

      const limitData = res?.data?.product_photo_limit;

      if (!limitData) return null;

      const total = limitData.total || 0;
      const used = limitData.used || 0;
      const is_unlimited = limitData.is_unlimited || false;

      return {
        total,
        used,
        is_unlimited,
        remaining: is_unlimited ? Infinity : Math.max(total - used, 0),
      };
    } catch (error) {
      console.error("Failed to fetch product photo limit:", error);
      return null;
    }
  };





  // Fetch global others IDs once
  useEffect(() => {
    const fetchGlobalOthers = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/categories/global-others-ids`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.success && data.data) {
          setGlobalOthersIds(data.data);
        }
      } catch (err) {
        setTimeout(fetchGlobalOthers, 2000);
      }
    };
    fetchGlobalOthers();
  }, []);

  // Load full product when editing
  useEffect(() => {
    if (initialEditingProduct?._id && !editingProduct) {
      setLoadingProduct(true);
      fetch(`${import.meta.env.VITE_API_URL}/products/edit/${initialEditingProduct._id}`, {
        credentials: "include",
      })
        .then(res => res.json())
        .then(result => {
          if (result.success && result.product) setEditingProduct(result.product);
        })
        .finally(() => setLoadingProduct(false));
    }
  }, [initialEditingProduct]);

  // Fill form when product is loaded
  useEffect(() => {
    if (editingProduct) {
      setFormData({
        seller_id: merchantId || editingProduct.seller_id || "",
        sellerModel: "Merchant",
        product_name: editingProduct.product_name || "",
        stock_quantity: editingProduct.stock_quantity,
        price: editingProduct.price ? parseFloat(editingProduct.price.$numberDecimal || editingProduct.price).toString() : "",
        description: editingProduct.description || "",
        video_url: editingProduct.video_url || "",
        unitOfMeasurement: editingProduct.unitOfMeasurement || "",
        askPrice: editingProduct.askPrice || false,
        product_image: Array.isArray(editingProduct.product_image) ? editingProduct.product_image : [],
        search_tags: Array.isArray(editingProduct.search_tags) ? editingProduct.search_tags : [],
      });
      const unit = editingProduct.unitOfMeasurement || "";
      const known = unitOptions.some(o => o.value === unit);
      setSelectedUnit(known ? unit : "other");
      setCustomUnit(known ? "" : unit);
      setCategoryData({
        category_id: editingProduct.category_id?._id || "",
        sub_category_id: editingProduct.sub_category_id?._id || "",
        super_sub_category_id: editingProduct.super_sub_category_id?._id || "",
        deep_sub_category_id: editingProduct.deep_sub_category_id?._id || "",
      });
      const attrs = Array.isArray(editingProduct.attributes) ? editingProduct.attributes : [];
      setAttributes(attrs.length > 0 ? attrs : [{ key: "", value: "" }]);
    } else if (!initialEditingProduct) {
      setFormData({
        seller_id: merchantId || "",
        sellerModel: "Merchant",
        product_name: "",
        price: "",
        description: "",
        video_url: "",
        stock_quantity: 0,
        unitOfMeasurement: "",
        askPrice: false,
        product_image: [],
        search_tags: [],
      });
      setSelectedUnit("");
      setCustomUnit("");
      setCategoryData({ category_id: "", sub_category_id: "", super_sub_category_id: "", deep_sub_category_id: "" });
      setAttributes([{ key: "", value: "" }]);
    }
  }, [editingProduct, merchantId, initialEditingProduct]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleUnitChange = (value) => {
    setSelectedUnit(value);
    if (value !== "other") {
      setCustomUnit("");
      setFormData(p => ({ ...p, unitOfMeasurement: value }));
    } else {
      setFormData(p => ({ ...p, unitOfMeasurement: customUnit.trim() }));
    }
  };

  const handleCustomUnitChange = (e) => {
    const raw = e.target.value.replace(/[^A-Za-z]/g, "");
    setCustomUnit(raw);
    setFormData(p => ({ ...p, unitOfMeasurement: raw.trim() }));
  };



  const handleImageDelete = async (url) => {
    const fileName = url.split("/").pop();
    try {
      await deleteImage({ file_names: [fileName], product_name: editingProduct?.product_name || formData.product_name }).unwrap();
      setFormData(p => ({ ...p, product_image: p.product_image.filter(u => u !== url) }));
    } catch {
      toast.error("Failed to delete image");
    }
  };

  const handleAttrChange = (idx, field, val) => {
    const copy = [...attributes];
    copy[idx][field] = val;
    setAttributes(copy);
  };

  const addAttribute = () => setAttributes([...attributes, { key: "", value: "" }]);
  const removeAttribute = (idx) => setAttributes(attributes.filter((_, i) => i !== idx));

  const isStep2Valid = () => {
    const unitOk = selectedUnit === "other" ? !!customUnit.trim() : !!formData.unitOfMeasurement;
    const priceOk = formData.askPrice ? true : !!formData.price;
    return !!formData.product_name.trim() && priceOk && formData.product_image.length > 0 && unitOk;
  };

  const isCategoryStepComplete = () => !!categoryData.category_id;

  const isAttributesValid = () => attributes.some(attr => attr.key.trim() && attr.value.trim());

  const handleNext = () => {
    if (step === 1 && !isCategoryStepComplete()) return toast.error("Please select a category");
    if (step === 2 && !isStep2Valid()) return toast.error("Please fill product name, price, at least one image, and unit");
    setStep(prev => prev + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!globalOthersIds) return toast.error("Category system is loading... Please wait a moment.");
    if (subLoading) return toast.error("Checking subscription, please wait...");
    if (!subscriptionData?.hasSubscription) return toast.error("Subscription required to add products");

    const cleanAttributes = attributes
      .filter(attr => attr.key?.trim() && attr.value?.trim())
      .map(attr => ({ key: attr.key.trim(), value: attr.value.trim() }));

    let finalPayload = {
      ...formData,
      ...categoryData,
      attributes: cleanAttributes,
      price: formData.askPrice ? 0 : (parseFloat(formData.price) || 0),
      askPrice: formData.askPrice,
      search_tags: formData.search_tags || [],
    };

    // ────── This is the magic you wanted ──────
    // If user did not select subcategory → use global others
    if (!categoryData.sub_category_id && categoryData.category_id) {
      finalPayload.sub_category_id = globalOthersIds.subCategoryId;
      finalPayload.super_sub_category_id = globalOthersIds.superSubCategoryId;
      finalPayload.deep_sub_category_id = globalOthersIds.deepSubCategoryId;
    }
    // If selected subcategory but not super → use others for super & deep
    else if (categoryData.sub_category_id && !categoryData.super_sub_category_id) {
      finalPayload.super_sub_category_id = globalOthersIds.superSubCategoryId;
      finalPayload.deep_sub_category_id = globalOthersIds.deepSubCategoryId;
    }
    // If selected super but not deep → use others for deep only
    else if (categoryData.super_sub_category_id && !categoryData.deep_sub_category_id) {
      finalPayload.deep_sub_category_id = globalOthersIds.deepSubCategoryId;
    }
    // ───────────────────────────────────────────────

    try {
      if (editingProduct) {
        const res = await updateProduct({ id: editingProduct._id, ...finalPayload }).unwrap();
        showToast(res.message || "Product updated successfully", 'success');
      } else {
        const res = await createProduct(finalPayload).unwrap();
        showToast(res.message || "Product created successfully", 'success');
      }
      onClose();
    } catch (err) {
      showToast(err?.data?.message || err || "Failed to save product", 'error');
    }
  };

  if (catLoading || subLoading || loadingProduct) return <Loader />;

  return (
    <div className=" relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate(-1)}
        className="hidden md:flex items-center cursor-pointer top-1 left-44 absolute gap-2 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Button>
      <h1 className="text-md border-1 border-[#0c1f4d] text-[#0c1f4d] bg-gray-100 p-2 rounded-r-2xl w-36 font-bold inline-block mb-6">
        {editingProduct ? "Edit Product" : "Add Product"}
      </h1>

      <form className="p-4 sm:p-6 bg-white rounded-2xl shadow-md w-full max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between mb-6 gap-2 relative">

          {["Category", "Basic Info", "Attributes"].map((label, index) => (
            <div key={index} className={`flex-1 text-center py-2 border-b-2 text-sm sm:text-base ${step === index + 1 ? "border-blue-600 font-semibold" : "border-gray-300"}`}>
              Step {index + 1}: {label}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label>Category <span className="text-red-500">*</span></Label>
              <Select value={categoryData.category_id} onValueChange={v => setCategoryData({ category_id: v, sub_category_id: "", super_sub_category_id: "", deep_sub_category_id: "" })}>
                <SelectTrigger className="w-full border-2 border-slate-300"><SelectValue placeholder="Select Category" /></SelectTrigger>
                <SelectContent>
                  {categories?.data?.map(cat => <SelectItem key={cat._id} value={cat._id}>{cat.category_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Sub Category {subCategories?.data?.length > 0 && <span className="text-red-500">*</span>}</Label>
              {subCatLoading ? <p>Loading...</p> : (
                <Select value={categoryData.sub_category_id} onValueChange={v => setCategoryData(p => ({ ...p, sub_category_id: v, super_sub_category_id: "", deep_sub_category_id: "" }))} disabled={!categoryData.category_id}>
                  <SelectTrigger className="w-full border-2 border-slate-300"><SelectValue placeholder="Select Sub Category" /></SelectTrigger>
                  <SelectContent>
                    {subCategories?.data?.map(cat => <SelectItem key={cat._id} value={cat._id}>{cat.sub_category_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div>
              <Label>Super Sub Category {superSubCategories?.data?.length > 0 && <span className="text-red-500">*</span>}</Label>
              {supCatLoading ? <p>Loading...</p> : (
                <Select value={categoryData.super_sub_category_id} onValueChange={v => setCategoryData(p => ({ ...p, super_sub_category_id: v, deep_sub_category_id: "" }))} disabled={!categoryData.sub_category_id}>
                  <SelectTrigger className="w-full border-2 border-slate-300"><SelectValue placeholder="Select Super Sub Category" /></SelectTrigger>
                  <SelectContent>
                    {superSubCategories?.data?.map(cat => <SelectItem key={cat._id} value={cat._id}>{cat.super_sub_category_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div>
              <Label>Deep Sub Category {deepSubCategories?.data?.length > 0 && <span className="text-red-500">*</span>}</Label>
              {deepCatLoading ? <p>Loading...</p> : (
                <Select value={categoryData.deep_sub_category_id} onValueChange={v => setCategoryData(p => ({ ...p, deep_sub_category_id: v }))} disabled={!categoryData.super_sub_category_id}>
                  <SelectTrigger className="w-full border-2 border-slate-300"><SelectValue placeholder="Select Deep Sub Category" /></SelectTrigger>
                  <SelectContent>
                    {deepSubCategories?.data?.map(cat => <SelectItem key={cat._id} value={cat._id}>{cat.deep_sub_category_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div><Label>Product Name</Label><ProductNameAutocomplete value={formData.product_name} onChange={handleInputChange} /></div>
            <div><Label>Video URL (optional)</Label><Input
              name="video_url"
              value={formData.video_url}
              onChange={handleInputChange}
              disabled={!productVideoEnabled}
              className={cn(
          "flex h-10 w-full rounded-md border-2 border-slate-300 bg-background px-3 py-2 text-sm",
          "ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2",
          "focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        )}
      /></div>
            {/* <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><Label>Price</Label><Input name="price" type="number" value={formData.price} onChange={handleInputChange} /></div></div> */}
            <div><Label>Description</Label><Input placeholder='Describe your product features and details' name="description" value={formData.description} onChange={handleInputChange} className="mt-1 border-2 border-slate-300" /></div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">

              {/* 1️⃣ Unit of Measurement */}
              <div>
                <Label>
                  Unit of Measurement <span className="text-red-500">*</span>
                </Label>
                <Select value={selectedUnit} onValueChange={handleUnitChange}>
                  <SelectTrigger className="border-2 border-slate-300">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {unitOptions.map((u) => (
                      <SelectItem key={u.value} value={u.value}>
                        {u.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 2️⃣ Stock Quantity */}
              <div>
                <Label>
                  Quantity <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  name="stock_quantity"
                  placeholder="e.g. 100"
                  min="0"
                  value={formData.stock_quantity ?? ""}
                  onChange={handleInputChange}
                  className="border-2 border-slate-300"
                />
              </div>

              {/* 3️⃣ Custom Unit (Only if Other Selected) */}
              {selectedUnit === "other" && (
                <div>
                  <Label>Custom Unit</Label>
                  <Input
                    value={customUnit}
                    onChange={handleCustomUnitChange}
                    placeholder="e.g. pack, tray"
                    className="border-2 border-slate-300"
                  />
                </div>
              )}

              {/* 4️⃣ Price */}
              <div>
                <Label>
                  Price {!formData.askPrice && <span className="text-red-500">*</span>}
                </Label>
                <div className="flex flex-col gap-2">
                  <Input
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={handleInputChange}
                    disabled={formData.askPrice}
                    className={`border-2 border-slate-300 ${formData.askPrice ? "opacity-50 cursor-not-allowed hidden" : ""}`}
                  />
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="checkbox"
                      id="askPrice"
                      name="askPrice"
                      checked={formData.askPrice}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor="askPrice" className="text-sm text-gray-700 cursor-pointer select-none">
                      Ask Price from User
                    </label>
                  </div>
                </div>
              </div>

            </div>

            <div>
              <Label>Search Tags (Optional)</Label>
              <div className="flex flex-wrap items-center gap-2 p-3 border-2 border-slate-300 rounded-lg min-h-12 bg-gray-50">
                {formData.search_tags?.map((tag, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
                    {tag}
                    <button type="button" onClick={() => setFormData(p => ({ ...p, search_tags: p.search_tags.filter((_, idx) => idx !== i) }))} className="ml-2 hover:bg-blue-200 rounded-full w-5 h-5 flex items-center justify-center text-lg">×</button>
                  </span>
                ))}
                <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    const val = tagInput.trim().toLowerCase();
                    if (val && !formData.search_tags.includes(val)) {
                      setFormData(p => ({ ...p, search_tags: [...p.search_tags, val] }));
                      setTagInput("");
                    }
                  }
                }} placeholder="Type keyword (e.g. organic) and press Enter..." className="flex-1 min-w-64 outline-none bg-transparent text-sm placeholder-gray-500" />
              </div>
            </div>
            <div>
              <Label>Product Image (at least 1)</Label>

              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>

            {/* Container */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Images
              </label>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">

                {/* Existing Images */}
                {formData.product_image?.map((url, idx) => (
                  <div
                    key={idx}
                    className="group relative aspect-square bg-gray-100 rounded-xl overflow-hidden border border-gray-200"
                  >
                    <img
                      src={`${encodeURI(url)}?t=${Date.now()}`}
                      alt={`Product ${idx}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />

                    {/* Hover Delete Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => handleImageDelete(url)}
                        className="h-9 w-9 bg-white/20 hover:bg-red-500 text-white backdrop-blur-sm transition-all rounded-full"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Add New Image Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors group"
                >
                  <div className="p-2 bg-gray-100 rounded-full group-hover:bg-blue-100 transition-colors">
                    <Plus className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-500 mt-2 group-hover:text-blue-600">
                    Add Image
                  </span>
                </button>

              </div>
            </div>

          </div>
        )}

        {step === 3 && (
          <>
            <AttributeForm attributes={attributes} handleAttrChange={handleAttrChange} addAttribute={addAttribute} removeAttribute={removeAttribute} />
            {!isAttributesValid() && <p className="text-red-600 text-center mt-6">Please add at least one attribute (e.g., Color: Red)</p>}
          </>
        )}

        <div className="mt-6 flex flex-col sm:flex-row justify-between gap-3">
          <Button type="button" variant="outline" className="cursor-pointer" onClick={step === 1 ? onClose : () => setStep(s => s - 1)}>
            {step === 1 ? "Cancel" : "Back"}
          </Button>
          {step < 3 ? (
            <Button type="button" className="bg-[#0c1f4d] cursor-pointer text-white" onClick={handleNext} disabled={(step === 1 && !isCategoryStepComplete()) || (step === 2 && !isStep2Valid()) || creating || updating}>
              {creating || updating ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading...</> : "Next"}
            </Button>
          ) : (
            <Button type="button" className="bg-green-500 text-white" onClick={handleSubmit} disabled={creating || updating || !isAttributesValid()}>
              {editingProduct ? (updating ? "Updating..." : "Update") : (creating ? "Creating..." : "Submit")}
            </Button>
          )}
        </div>
      </form>
      {(creating || updating) && <Loader />}
    </div>
  );
};

export default StepperProductForm;
