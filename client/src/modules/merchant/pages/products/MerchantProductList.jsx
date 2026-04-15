import React, { useState, useEffect, useContext, useRef } from "react";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  useGetAllUserSellerProductsByIdQuery,
  useGetMerchantByUserIdQuery,
} from "@/redux/api/ProductApi";
import DeleteDialog from "@/model/DeleteModel";
import { useDeleteProductImageMutation } from "@/redux/api/ProductImageApi";
import {
  useUpdateProductMutation,
  useDeleteProductMutation,
} from "@/redux/api/ProductApi";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import { toast } from "react-toastify";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import StepperProductForm from "./MerchantProductForm";
import { Eye, Edit, Trash2, CheckCircle, XCircle, X } from "lucide-react";
import Loader from "@/loader/Loader";
import noImage from "@/assets/images/no-image.jpg"


// Truncate Component with Tooltip
const Truncate = ({ text }) => {
  // ⭐ Original fallback
  const rawText = text || "N/A";

  // ⭐ 1. Replace hyphens & underscores with spaces
  let formattedText = rawText.replace(/[-_]/g, " ");

  // ⭐ 2. Capitalize each word
  formattedText = formattedText.replace(/\b\w/g, (c) => c.toUpperCase());

  // ⭐ 3. Truncate
  const isLong = formattedText.length > 15;
  const truncated = isLong
    ? `${formattedText.slice(0, 15)}…`
    : formattedText;

  return isLong ? (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-block max-w-[10ch] truncate cursor-default">
            {truncated}
          </span>
        </TooltipTrigger>

        <TooltipContent
          side="top"
          align="center"
          className="max-w-xs break-words p-2 bg-gray-900 text-white"
        >
          {formattedText}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : (
    <span className="inline-block max-w-[10ch] truncate">
      {formattedText}
    </span>
  );
};

const MerchantProductListing = () => {
  /* ----------------------- Auth & Refs ----------------------- */
  const { user, logout } = useContext(AuthContext);
  const userId = user?.user?._id;
  const productDetailsRef = useRef(null); // <-- for scroll-to-view
  const [open, setOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formMode, setFormMode] = useState(null); // 'add' | 'edit'
  const [editingProduct, setEditingProduct] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [verificationFilter, setVerificationFilter] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [activeImage, setActiveImage] = useState(null);

  /* ----------------------- RTK Queries ----------------------- */
  const {
    data: merchantResponse,
    isLoading: isMerchantLoading,
    isError: isMerchantError,
    error: merchantError,
  } = useGetMerchantByUserIdQuery(userId || null);

  const merchant = merchantResponse?.data || merchantResponse;

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch, // <-- NEW: manual refetch after edit
  } = useGetAllUserSellerProductsByIdQuery(
    { userId, page, limit: 10, filter: verificationFilter, search },
    { skip: !userId }
  );

  const [updateProduct] = useUpdateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();
  const [deleteProductImage] = useDeleteProductImageMutation();
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  /* ----------------------- Effects ----------------------- */
  useEffect(() => {
    if (selectedProduct?.product_image?.length) {
      setActiveImage(selectedProduct.product_image[0]);
    }
  }, [selectedProduct]);

  useEffect(() => {
    if (data) console.log("API Response:", data);
  }, [data]);

  /* ----------------------- Handlers ----------------------- */
  const handlePaginationChange = (newPage) => setPage(newPage);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleVerificationFilterChange = (value) => {
    const filterValue = value === "all" ? "" : value;
    setVerificationFilter(filterValue);
    setPage(1);
  };

  const handleImageHover = (imgUrl) => setActiveImage(imgUrl);

  /** VIEW → scroll to details card */
  const handleView = (product) => {
    setSelectedProduct(product);
    setOpen(true); // Open modal
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormMode("edit");
  };

  const handleDelete = (id) => {
    setDeleteId(id);
    setIsDialogOpen(true);
  };

  const handleCreateMerchant = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/merchants/create-minimal`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            user_id: userId,
            company_name: user?.user?.name || "Default Company",
            company_email: user?.user?.email || "default@company.com",
            company_phone_number: user?.user?.phone || "0000000000",
          }),
        }
      );
      const result = await response.json();
      if (result.forceLogout) {
        toast.info("Merchant profile created. Please log in again.");
        logout();
      } else if (result.message?.includes("successfully")) {
        toast.success("Merchant profile created successfully!");
      } else {
        toast.error(result.message || "Failed to create merchant profile");
      }
    } catch (error) {
      console.error("Error creating merchant:", error);
      toast.error("Error creating merchant profile: " + error.message);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    const productToDelete = data?.products?.find((p) => p._id === deleteId);
    try {
      // Delete images first
      if (
        Array.isArray(productToDelete?.product_image) &&
        productToDelete.product_image.length
      ) {
        const fileNames = productToDelete.product_image.map((url) =>
          url.split("/").pop()
        );
        await deleteProductImage({
          product_name: productToDelete.product_name,
          file_names: fileNames,
        }).unwrap();
      }

      const res = await deleteProduct(deleteId).unwrap();
      if (res.success) {
        toast.success(res.message || "Product Deleted Successfully");
        if (selectedProduct?._id === deleteId) setSelectedProduct(null);
        refetch(); // <-- refresh list
      } else {
        toast.error(res.message || "Failed to Delete");
      }
    } catch (err) {
      toast.error(err?.data?.message || "Error during deletion");
    } finally {
      setDeleteId(null);
      setIsDialogOpen(false);
    }
  };

  /** Close form & refresh list after edit */
  const handleCloseForm = (shouldRefetch = false) => {
    setFormMode(null);
    setEditingProduct(null);
    if (shouldRefetch) refetch(); // <-- NEW: refresh after successful edit
  };

  /* ----------------------- Video helpers ----------------------- */
  const isYouTubeUrl = (url) => {
    if (!url) return false;
    try {
      const { hostname } = new URL(url);
      return hostname.includes("youtube.com") || hostname.includes("youtu.be");
    } catch {
      return false;
    }
  };

  const isValidVideoFileUrl = (url) => {
    if (!url) return false;
    const videoExt = /\.(mp4|webm|ogg)$/i;
    try {
      new URL(url);
      return videoExt.test(url);
    } catch {
      return false;
    }
  };

  const getYouTubeEmbedUrl = (url) => {
    try {
      const urlObj = new URL(url);
      let videoId;
      if (urlObj.hostname.includes("youtu.be")) {
        videoId = urlObj.pathname.split("/")[1];
      } else {
        videoId = urlObj.searchParams.get("v");
      }
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    } catch {
      return null;
    }
  };

  /* ----------------------- Render ----------------------- */
  if (isMerchantLoading) return <Loader />;

  if (isMerchantError || !merchant?.merchant?._id) {
    return (
      <div className="text-center">
        <p className="text-red-600 mb-4 text-sm sm:text-base">
          {isMerchantError
            ? `Failed to load merchant data: ${merchantError?.data?.message || "Unknown error"
            }`
            : "No merchant profile found. Please create one to manage products."}
        </p>
        <Button
          onClick={handleCreateMerchant}
          className="bg-[#0c1f4d] hover:bg-[#0c1f4d]/90 text-white text-sm px-4 py-2"
        >
          Create Merchant Profile
        </Button>
      </div>
    );
  }

  const products = data?.products || [];
  console.log(products, "product list");

  // Show loader if strictly loading OR fetching but we don't have products to show yet (like on search change)
  if (isLoading || (isFetching && products.length === 0)) return <Loader />;
  if (isError)
    return (
      <p className="text-center text-red-600 text-sm sm:text-base">
        Failed to load products. Please try again.
      </p>
    );

  const pagination = data?.pagination || { totalProducts: 0, totalPages: 1 };

  const renderPaginationItems = () => {
    const totalPages = pagination.totalPages || 1;
    const items = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);

    for (let i = start; i <= end; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            onClick={() => handlePaginationChange(i)}
            isActive={i === page}
            className={`text-sm ${i === page
              ? "bg-[#0c1f4d] text-white"
              : "text-[#0c1f4d] hover:bg-[#0c1f4d]/10"
              }`}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    if (start > 1) {
      items.unshift(<PaginationEllipsis key="start-ellipsis" />);
      items.unshift(
        <PaginationItem key={1}>
          <PaginationLink
            onClick={() => handlePaginationChange(1)}
            className="text-[#0c1f4d] hover:bg-[#0c1f4d]/10 text-sm"
          >
            1
          </PaginationLink>
        </PaginationItem>
      );
    }

    if (end < totalPages) {
      items.push(<PaginationEllipsis key="end-ellipsis" />);
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            onClick={() => handlePaginationChange(totalPages)}
            className="text-[#0c1f4d] hover:bg-[#0c1f4d]/10 text-sm"
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  return (
    <div className="w-full p-2 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <TooltipProvider delayDuration={100}>
        {/* ------------------- FORM (Add / Edit) ------------------- */}
        {formMode && (
          <StepperProductForm
            editingProduct={formMode === "edit" ? editingProduct : null}
            onClose={(refetchNeeded) => handleCloseForm(refetchNeeded)}
            merchantId={merchant.merchant?._id}
          />
        )}
<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
  <h3 className="text-lg font-semibold text-blue-800 mb-2">How to Manage Your Products (SOP)</h3>
  <ul className="space-y-2 text-sm text-blue-900">
    <li className="flex items-start gap-2">
      <span className="font-bold mt-0.5">1. Add New Product</span>
      <span>→ Click the <strong>"Add Product"</strong> button (top-right corner) to create a new product listing.</span>
    </li>

    <li className="flex items-start gap-2">
      <span className="font-bold mt-0.5">2. View All Products</span>
      <span>→ Below you will see a table listing all your added products with basic details.</span>
    </li>

    <li className="flex items-start gap-2">
      <span className="font-bold mt-0.5">3. View Product Details</span>
      <span>→ Click the <strong>👁️ View</strong> icon on any row to see complete product information.</span>
    </li>

    <li className="flex items-start gap-2">
      <span className="font-bold mt-0.5">4. Edit Product</span>
      <span>→ Click the <strong>✏️ Edit</strong> icon to modify product details (name, price, images, description, etc.).</span>
    </li>

    <li className="flex items-start gap-2">
      <span className="font-bold mt-0.5">5. Delete Product</span>
      <span>→ Click the <strong>🗑️ Delete</strong> icon to remove a product permanently (confirmation will appear).</span>
    </li>

    <li className="flex items-start gap-2">
      <span className="font-bold mt-0.5">6. Filter & Search</span>
      <span>→ Use the search bar and filters (category, status, price range) above the table to quickly find products.</span>
    </li>
  </ul>

  <p className="text-xs text-blue-700 mt-3 italic">
    Note: Deleted products cannot be recovered. Make sure to double-check before deleting.
  </p>
</div>
        {/* ------------------- LISTING ------------------- */}
        {!formMode && (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
              <h1 className="text-md border-1 border-[#0c1f4d] text-[#0c1f4d] bg-gray-100 p-2 rounded-r-2xl w-36 font-bold">
                Product Details
              </h1>
              <Button
                onClick={() => setFormMode("add")}
                className="bg-[#0c1f4d] hover:bg-[#0c1f4d]/90 text-white text-xs sm:text-sm w-full sm:w-auto px-3 sm:px-4 py-2"
              >
                Add Product
              </Button>
            </div>

            {/* Search + Filter */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4">
              <Input
                type="text"
                placeholder="Search by product name"
                value={search}
                onChange={handleSearchChange}
                className="w-full text-sm border-2 border-slate-300"
              />
              <Select
                value={verificationFilter}
                onValueChange={handleVerificationFilterChange}
              >
                <SelectTrigger className="w-full sm:w-1/3 md:w-1/4 text-sm border-2 border-slate-300 focus:ring-2 focus:ring-[#0c1f4d]">
                  <SelectValue placeholder="Filter by verification" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="not_verified">Not Verified</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Inline Fetching Indicator for Pagination/Filters */}
     
            <CardContent className="p-2 sm:p-4 relative">
             {isFetching && products.length > 0 && (
                <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-lg">
                  <div className="bg-white p-3 rounded-full shadow-lg border border-gray-100 flex items-center gap-2">
                    <div className="animate-spin h-5 w-5 border-2 border-[#0c1f4d] border-t-transparent rounded-full" />
                    <span className="text-sm font-medium text-[#0c1f4d]">Updating list...</span>
                  </div>
                </div>
              )}
              {/* Mobile Cards */}
              <div className="block sm:hidden space-y-4">
                {products.length === 0 ? (
                  <div className="text-center text-xs sm:text-sm">
                    No products found.
                  </div>
                ) : (
                  products.map((product) => (
                    <Card key={product._id} className="shadow-md">
                      <CardContent className="p-4 flex flex-col gap-3">
                        {/* ---------- Image + Product Name ---------- */}
                        <div className="flex items-center gap-4">
                          {product.product_image?.[0] ? (
                            <img
                              src={product.product_image[0]}
                              alt="Product"
                              className="w-16 h-16 object-cover rounded"
                              onError={(e) => {
                                if (e.currentTarget.src !== noImage) {
                                  e.currentTarget.src = noImage;
                                }
                              }}
                            />
                          ) : (
                            <span className="text-xs text-gray-600">
                              No Image
                            </span>
                          )}

                          <div className="flex-1">
                            <p className="text-sm font-semibold">
                              <Truncate text={product.product_name} />
                            </p>
                          </div>
                        </div>

                        {/* ---------- Category Hierarchy ---------- */}
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                          <div className="flex flex-col">
                            <span className="text-gray-500">Category</span>
                            <Truncate
                              text={product.category_id?.category_name}
                            />
                          </div>

                          <div className="flex flex-col">
                            <span className="text-gray-500">Sub Category</span>
                            <Truncate
                              text={product.sub_category_id?.sub_category_name}
                            />
                          </div>

                          <div className="flex flex-col">
                            <span className="text-gray-500">Super Sub</span>
                            <Truncate
                              text={
                                product.super_sub_category_id
                                  ?.super_sub_category_name
                              }
                            />
                          </div>

                          <div className="flex flex-col">
                            <span className="text-gray-500">Deep Sub</span>
                            <Truncate
                              text={
                                product.deep_sub_category_id
                                  ?.deep_sub_category_name
                              }
                            />
                          </div>
                        </div>

                        {/* ---------- Action Buttons ---------- */}
                        <div className="flex gap-2 justify-end">
                          {/* View */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleView(product)}
                                className="text-[#0c1f4d] hover:text-[#0c1f4d]/80 p-2"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-[#0c1f4d] text-white border-none p-2 text-xs">
                              View Product Details
                            </TooltipContent>
                          </Tooltip>

                          {/* Edit */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(product)}
                                className="text-green-500 hover:text-green-700 p-2"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-[#0c1f4d] text-white border-none p-2 text-xs">
                              Edit Product
                            </TooltipContent>
                          </Tooltip>

                          {/* Delete */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(product._id)}
                                className="text-red-500 hover:text-red-700 p-2"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-[#0c1f4d] text-white border-none p-2 text-xs">
                              Delete Product
                            </TooltipContent>
                          </Tooltip>

                          {/* Verify Status */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`p-2 ${product.product_verified_by_admin
                                  ? "text-green-500 hover:text-green-700"
                                  : "text-red-500 hover:text-red-700"
                                  }`}
                              >
                                {product.product_verified_by_admin ? (
                                  <CheckCircle className="h-4 w-4" />
                                ) : (
                                  <XCircle className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-[#0c1f4d] text-white border-none p-2 text-xs">
                              {product.product_verified_by_admin
                                ? "Product Verified"
                                : "Product Not Verified"}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader className="bg-[#0c1f4d] hover:bg-[#0e2d75]">
                    <TableRow>
                      <TableHead className="text-left text-xs sm:text-sm text-white">
                        Category
                      </TableHead>
                      <TableHead className="text-left text-xs sm:text-sm text-white">
                        Sub Category
                      </TableHead>
                      <TableHead className="text-left text-xs sm:text-sm text-white">
                        Super Sub
                      </TableHead>
                      <TableHead className="text-left text-xs sm:text-sm text-white">
                        Deep Sub
                      </TableHead>
                      <TableHead className="text-left text-xs sm:text-sm text-white">
                        Product Name
                      </TableHead>
                      <TableHead className="text-left text-xs sm:text-sm text-white">
                        Image
                      </TableHead>
                      <TableHead className="text-left text-xs sm:text-sm text-white">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center text-xs sm:text-sm"
                        >
                          No products found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      products.map((product) => (
                        <TableRow key={product._id}>
                          {/* Category */}
                          <TableCell className="text-xs sm:text-sm">
                            <Truncate
                              text={product.category_id?.category_name}
                            />
                          </TableCell>

                          {/* Sub Category */}
                          <TableCell className="text-xs sm:text-sm">
                            <Truncate
                              text={product.sub_category_id?.sub_category_name}
                            />
                          </TableCell>

                          {/* Super Sub Category */}
                          <TableCell className="text-xs sm:text-sm">
                            <Truncate
                              text={
                                product.super_sub_category_id
                                  ?.super_sub_category_name
                              }
                            />
                          </TableCell>

                          {/* Deep Sub Category */}
                          <TableCell className="text-xs sm:text-sm">
                            <Truncate
                              text={
                                product.deep_sub_category_id
                                  ?.deep_sub_category_name
                              }
                            />
                          </TableCell>

                          {/* Product Name */}
                          <TableCell className="text-xs sm:text-sm">
                            <Truncate text={product.product_name} />
                          </TableCell>

                          {/* Image */}
                          <TableCell>
                            {product.product_image?.[0] ? (
                              <img
                                src={product.product_image[0]}
                                alt="Product"
                                className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded"
                                onError={(e) => {
                                  if (e.currentTarget.src !== noImage) {
                                    e.currentTarget.src = noImage;
                                  }
                                }}
                              />
                            ) : (
                              <span className="text-xs sm:text-sm">
                                No Image
                              </span>
                            )}
                          </TableCell>

                          {/* Actions */}
                          <TableCell>
                            <div className="flex gap-1 sm:gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleView(product)}
                                    className="text-[#0c1f4d] cursor-pointer hover:text-[#0c1f4d]/80 p-1 sm:p-2"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-[#0c1f4d] text-white border-none p-2 text-xs sm:text-sm">
                                  View Product Details
                                </TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEdit(product)}
                                    className="text-green-500 cursor-pointer hover:text-green-700 p-1 sm:p-2"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-[#0c1f4d] text-white border-none p-2 text-xs sm:text-sm">
                                  Edit Product
                                </TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(product._id)}
                                    className="text-red-500 cursor-pointer hover:text-red-700 p-1 sm:p-2"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-[#0c1f4d] text-white border-none p-2 text-xs sm:text-sm">
                                  Delete Product
                                </TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`p-1 sm:p-2  ${product.product_verified_by_admin
                                      ? "text-green-500 hover:text-green-700"
                                      : "text-red-500 hover:text-red-700"
                                      }`}
                                  >
                                    {product.product_verified_by_admin ? (
                                      <CheckCircle className="h-4 w-4" />
                                    ) : (
                                      <XCircle className="h-4 w-4" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-[#0c1f4d] text-white border-none p-2 text-xs sm:text-sm">
                                  {product.product_verified_by_admin
                                    ? "Product Verified"
                                    : "Product Not Verified"}
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4 mt-4 sm:mt-6">
              <div className="text-xs sm:text-sm text-gray-600">
                Total Records: {pagination.totalProducts || 0}
              </div>
              <Pagination className="flex justify-end">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePaginationChange(page - 1)}
                      className={`text-xs sm:text-sm ${page === 1 || pagination.totalProducts === 0
                        ? "pointer-events-none opacity-50"
                        : "text-[#0c1f4d] hover:bg-[#0c1f4d]/10"
                        }`}
                    />
                  </PaginationItem>
                  {renderPaginationItems()}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePaginationChange(page + 1)}
                      className={`text-xs sm:text-sm ${page >= (pagination.totalPages || 1) ||
                        pagination.totalProducts === 0
                        ? "pointer-events-none opacity-50"
                        : "text-[#0c1f4d] hover:bg-[#0c1f4d]/10"
                        }`}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>

            {/* ------------------- PRODUCT DETAILS CARD ------------------- */}
            <Dialog
              open={open}
              onOpenChange={(val) => {
                setOpen(val);
                if (!val) setIsDescExpanded(false); // Resets "See More" when closing
              }}
            >
              <DialogContent
                className="p-0 overflow-hidden bg-white flex flex-col [&>button]:hidden shadow-2xl border-none"
                style={{
                  width: "95vw",
                  maxWidth: "1100px",
                  height: "85vh",
                }}
              >
                {/* 1. HEADER: Professional & Clean */}
                <DialogHeader className="px-6 py-4 border-b bg-white shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-blue-100 text-blue-700">
                          {selectedProduct?.category_id?.category_name || "Product"}
                        </span>
                        {selectedProduct?.product_verified_by_admin && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 uppercase">
                            <CheckCircle className="w-3 h-3" /> Verified by Admin
                          </span>
                        )}
                      </div>
                      <DialogTitle className="text-2xl font-extrabold text-[#0c1f4d] tracking-tight truncate max-w-[300px] sm:max-w-md">
                        {selectedProduct?.product_name}
                      </DialogTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setOpen(false)}
                      className="rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <X className="h-5 w-5 text-gray-500" />
                    </Button>
                  </div>
                </DialogHeader>

                {/* 2. SCROLLABLE BODY */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#fcfcfd]">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">

                    {/* LEFT COLUMN: Visuals (Image + Video) */}
                    <div className="lg:col-span-7 p-6 lg:p-8 space-y-8 bg-white border-r border-gray-100">
                      {/* Main Image View */}
                      <div className="relative aspect-square max-h-[450px] w-full rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center group">
                        {activeImage ? (
                          <Zoom>
                            <img
                              src={activeImage}
                              alt="Product"
                              className="max-w-full max-h-[400px] object-contain transition-transform duration-500 group-hover:scale-105"
                              onError={(e) => {
                                if (e.currentTarget.src !== noImage) e.currentTarget.src = noImage;
                              }}
                            />
                          </Zoom>
                        ) : (
                          <img src={noImage} className="w-32 opacity-20" alt="No Image" />
                        )}
                      </div>

                      {/* Thumbnails */}
                      <div className="flex gap-3 overflow-x-auto pb-2 justify-center lg:justify-start">
                        {selectedProduct?.product_image?.map((img, idx) => (
                          <button
                            key={idx}
                            onMouseEnter={() => setActiveImage(img)}
                            onClick={() => setActiveImage(img)}
                            className={`relative shrink-0 w-20 h-20 rounded-xl overflow-hidden border-1 transition-all ${activeImage === img ? "border-[#0c1f4d] shadow-md scale-105" : "border-transparent opacity-70 hover:opacity-100"
                              }`}
                          >
                            <img src={img} className="w-full h-full object-cover" alt="thumb" />
                          </button>
                        ))}
                      </div>

                      {/* Video Section */}
                      {selectedProduct?.video_url && (
                        <div className="pt-4 border-t border-gray-50">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Product Showcase Video</h4>
                          <div className="rounded-2xl overflow-hidden shadow-xl bg-black aspect-video border-4 border-white">
                            {isYouTubeUrl(selectedProduct.video_url) ? (
                              <iframe
                                src={getYouTubeEmbedUrl(selectedProduct.video_url)}
                                className="w-full h-full"
                                allowFullScreen
                              />
                            ) : (
                              <video controls className="w-full h-full">
                                <source src={selectedProduct.video_url} type="video/mp4" />
                              </video>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* RIGHT COLUMN: Information & Specs */}
                    <div className="lg:col-span-5 p-6 lg:p-8 space-y-8">

                      {/* Pricing Card */}
                      <div className="p-6 rounded-2xl bg-[#0c1f4d] text-white shadow-xl shadow-blue-900/20 relative overflow-hidden">
                        <div className="relative z-10">
                          <span className="text-blue-200 text-[10px] font-bold uppercase tracking-widest">Market Price</span>
                          <div className="text-4xl font-black mt-1">
                            ₹{parseFloat(selectedProduct?.price?.$numberDecimal || 0).toLocaleString('en-IN')}
                          </div>
                          <div className="mt-4 flex items-center gap-2 text-xs text-blue-100">
                            <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                            Verified & Available for Purchase
                          </div>
                        </div>
                        {/* Decorative Background Blob */}
                        <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-3xl" />
                      </div>

                      {/* Description Section with See More */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest">Description</h4>
                        <div className="relative">
                          <div
                            className={`text-gray-600 text-sm leading-relaxed transition-all duration-300 ${!isDescExpanded ? "line-clamp-3" : "line-clamp-none"
                              }`}
                            dangerouslySetInnerHTML={{ __html: selectedProduct?.description || "No description provided." }}
                          />
                          {selectedProduct?.description && (
                            <Button
                              variant="link"
                              onClick={() => setIsDescExpanded(!isDescExpanded)}
                              className="p-0 h-auto text-[#0c1f4d] font-bold text-xs mt-2 hover:no-underline flex items-center gap-1"
                            >
                              {isDescExpanded ? (
                                <><span className="text-orange-500">Show Less</span> <X className="w-3 h-3 text-orange-500" /></>
                              ) : (
                                <><span className="text-orange-500">See More</span> <Eye className="w-3 h-3 text-orange-500" /></>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Specifications Grid */}
                      {selectedProduct?.attributes?.length > 0 && (
                        <div className="space-y-4 pt-4 border-t border-gray-100">
                          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest">Technical Specifications</h4>
                          <div className="grid grid-cols-1 gap-2">
                            {selectedProduct.attributes.map((attr, i) => (
                              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white border border-gray-100 hover:shadow-sm transition-all group">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight group-hover:text-blue-400">
                                  {attr.attribute_key}
                                </span>
                                <span className="text-sm font-semibold text-gray-700">
                                  {attr.attribute_value}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Category Metadata Footer */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <span className="block text-[9px] font-bold text-gray-400 uppercase">Sub-Category</span>
                          <span className="text-xs font-semibold text-gray-700 truncate block">
                            {selectedProduct?.sub_category_id?.sub_category_name || "N/A"}
                          </span>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <span className="block text-[9px] font-bold text-gray-400 uppercase">Verification</span>
                          <span className={`text-xs font-semibold ${selectedProduct?.product_verified_by_admin ? "text-green-600" : "text-amber-600"}`}>
                            {selectedProduct?.product_verified_by_admin ? "Level 1 Verified" : "Pending Review"}
                          </span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </DialogContent>

              {/* CSS Injection for Custom Scrollbar and Line Clamping */}
              <style dangerouslySetInnerHTML={{
                __html: `
    .custom-scrollbar::-webkit-scrollbar {
      width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #0c1f4d;
      border-radius: 10px;
    }
    .line-clamp-3 {
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `}} />
            </Dialog>
            {/* Delete Dialog */}
            <DeleteDialog
              open={isDialogOpen}
              onClose={() => setIsDialogOpen(false)}
              onConfirm={confirmDelete}
              title="Delete Product?"
              description="This action will permanently remove the product."
            />
          </>
        )}
      </TooltipProvider>
    </div>
  );
};

export default MerchantProductListing;
