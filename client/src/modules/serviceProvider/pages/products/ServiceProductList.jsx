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
import { useGetAllUserServiceProviderProductsByIdQuery } from "@/redux/api/ProductApi";
import { useGetServiceProviderByUserIdQuery } from "@/redux/api/ServiceProviderApi";
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
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import { toast } from "react-toastify";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import StepperProductForm from "./ServiceProductForm";
import { Eye, Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
import { skipToken } from "@reduxjs/toolkit/query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Custom hook to detect screen size for responsive pagination
const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState("sm");

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) setBreakpoint("xs");
      else if (window.innerWidth < 1024) setBreakpoint("sm");
      else setBreakpoint("lg");
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return breakpoint;
};

const ServiceProviderProductListing = () => {
  const { user, logout } = useContext(AuthContext);
  const userId = user?.user?._id;
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formMode, setFormMode] = useState(null); // 'add' or 'edit'
  const [editingProduct, setEditingProduct] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // Default to 'all'
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [updateProduct] = useUpdateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();
  const [deleteProductImage] = useDeleteProductImageMutation();
  const productDetailsRef = useRef(null);
  const breakpoint = useBreakpoint(); // For responsive pagination
  const { data: serviceProviderResponse, isLoading: isServiceProviderLoading, isError: isServiceProviderError, error: serviceProviderError } = useGetServiceProviderByUserIdQuery(userId || skipToken);
  const serviceProvider = serviceProviderResponse || serviceProviderResponse;

  const { data, isLoading, isError } = useGetAllUserServiceProviderProductsByIdQuery(
    { userId, page, limit: 10, filter: filter === "all" ? "" : filter, search },
    { skip: !userId }
  );

  const [activeImage, setActiveImage] = useState(null);

  useEffect(() => {
    if (selectedProduct?.product_image?.length) {
      setActiveImage(selectedProduct.product_image[0]);
    }
  }, [selectedProduct]);

  useEffect(() => {
    if (data) {
      console.log("API Response:", data);
    }
    if (!isLoading && !isError && (!data?.products || data.products.length === 0)) {
      console.warn("No products found. Check API response or userId:", userId);
    }
  }, [data, isLoading, isError, userId]);

  const handlePaginationChange = (newPage) => {
    setPage(newPage);
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleFilterChange = (value) => {
    setFilter(value);
    setPage(1);
  };

  const handleImageHover = (imgUrl) => {
    setActiveImage(imgUrl);
  };

  const handleView = (product) => {
    setSelectedProduct(product);
    if (productDetailsRef.current) {
      productDetailsRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormMode("edit");
  };

  const handleDelete = (id) => {
    setIsDialogOpen(true);
    setDeleteId(id);
  };

  const handleCreateServiceProvider = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/service-providers/create-minimal-service-provider`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          user_id: userId,
          travels_name: user?.user?.name || 'Default Travels',
          company_email: user?.user?.email || 'default@company.com',
          company_phone_number: user?.user?.phone || '0000000000',
        }),
      });
      const result = await response.json();
      if (result.forceLogout) {
        toast.info("Service provider profile created. Please log in again.");
        logout();
      } else if (result.message.includes('successfully')) {
        toast.success("Service provider profile created successfully!");
      } else {
        toast.error(result.message || "Failed to create service provider profile");
      }
    } catch (error) {
      console.error("Error creating service provider:", error);
      toast.error("Error creating service provider profile: " + error.message);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    const selectedProduct = data?.products?.find((item) => item._id === deleteId);
    try {
      if (Array.isArray(selectedProduct?.product_image) && selectedProduct.product_image.length > 0) {
        const fileNames = selectedProduct.product_image.map((url) => url.split("/").pop());
        await deleteProductImage({
          product_name: selectedProduct.product_name,
          file_names: fileNames,
        }).unwrap();
      }

      const deleteProductResponse = await deleteProduct(deleteId).unwrap();
      if (deleteProductResponse.success === true) {
        toast.success(deleteProductResponse.message || "Product Deleted Successfully");
        if (selectedProduct?._id === deleteId) {
          setSelectedProduct(null);
        }
      } else {
        toast.error(deleteProductResponse.message || "Failed to Delete");
      }
    } catch (err) {
      toast.error(err.data?.message || "Error during deletion");
      console.error("Error during deletion:", err);
    } finally {
      setDeleteId(null);
      setIsDialogOpen(false);
    }
  };

  const handleCloseForm = () => {
    setFormMode(null);
    setEditingProduct(null);
  };

  const isYouTubeUrl = (url) => {
    if (!url) return false;
    try {
      const parsedUrl = new URL(url);
      return (
        parsedUrl.hostname.includes("youtube.com") ||
        parsedUrl.hostname.includes("youtu.be")
      );
    } catch {
      return false;
    }
  };

  const isValidVideoFileUrl = (url) => {
    if (!url) return false;
    const videoExtensions = /\.(mp4|webm|ogg)$/i;
    try {
      new URL(url);
      return videoExtensions.test(url);
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

  if (isServiceProviderLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px] p-4">
        <p className="text-center text-gray-600 text-sm sm:text-base">
          Loading service provider data...
        </p>
      </div>
    );
  }

  if (isServiceProviderError || !serviceProvider._id) {
    return (
      <div className="flex flex-col justify-center items-center p-4 sm:p-6 min-h-[200px] text-center">
        <p className="text-red-600 mb-4 text-sm sm:text-base max-w-md">
          {isServiceProviderError
            ? `Failed to load service provider data: ${serviceProviderError?.data?.message || "Unknown error"}`
            : "No service provider profile found for this user. Please create a service provider profile to manage products."}
        </p>
        <Button
          onClick={handleCreateServiceProvider}
          className="bg-[#0c1f4d] hover:bg-[#0c1f4d]/90 text-white text-sm px-4 sm:px-6 py-2 sm:py-3 w-full sm:w-auto"
        >
          Create Service Provider Profile
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px] p-4">
        <p className="text-center text-gray-600 text-sm sm:text-base">
          Loading products...
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex justify-center items-center min-h-[200px] p-4">
        <p className="text-center text-red-600 text-sm sm:text-base">
          Failed to load products. Please try again.
        </p>
      </div>
    );
  }

  const products = data?.products || [];
  const pagination = data?.pagination || { totalProducts: 0, totalPages: 1 };

  // Responsive maxVisiblePages based on breakpoint
  const maxVisiblePages = breakpoint === "xs" ? 3 : breakpoint === "sm" ? 4 : 5;

  // Generate pagination items
  const renderPaginationItems = () => {
    const totalPages = pagination.totalPages || 1;
    const items = [];
    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            onClick={() => handlePaginationChange(i)}
            isActive={i === page}
            className={`px-2 py-1 text-xs sm:text-sm ${
              i === page ? "bg-[#0c1f4d] text-white" : "text-[#0c1f4d] hover:bg-[#0c1f4d]/10"
            }`}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    if (startPage > 1) {
      items.unshift(<PaginationEllipsis key="start-ellipsis" />);
      items.unshift(
        <PaginationItem key={1}>
          <PaginationLink
            onClick={() => handlePaginationChange(1)}
            className="px-2 py-1 text-xs sm:text-sm text-[#0c1f4d] hover:bg-[#0c1f4d]/10"
          >
            1
          </PaginationLink>
        </PaginationItem>
      );
    }

    if (endPage < totalPages) {
      items.push(<PaginationEllipsis key="end-ellipsis" />);
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            onClick={() => handlePaginationChange(totalPages)}
            className="px-2 py-1 text-xs sm:text-sm text-[#0c1f4d] hover:bg-[#0c1f4d]/10"
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  return (
    <div className="w-full p-2 sm:p-4 md:p-6 space-y-4 sm:space-y-6 min-h-screen">
      <TooltipProvider delayDuration={100}>
        {formMode && (
          <StepperProductForm
            editingProduct={formMode === "edit" ? editingProduct : null}
            onClose={handleCloseForm}
            serviceProviderId={serviceProvider._id}
          />
        )}
        {!formMode && (
          <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
              <h1 className="text-sm sm:text-base md:text-lg border border-[#0c1f4d] text-[#0c1f4d] bg-gray-100 p-2 rounded-r-2xl font-bold">
                Product Details
              </h1>
              <Button
                onClick={() => setFormMode("add")}
                className="bg-[#0c1f4d] hover:bg-[#0c1f4d]/90 text-white text-xs sm:text-sm w-full sm:w-auto px-3 sm:px-4 py-2"
              >
                Add Product
              </Button>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4">
              <Input
                type="text"
                placeholder="Search by product name"
                value={search}
                onChange={handleSearchChange}
                className="w-full text-sm px-3 py-2 border-gray-300 focus:ring-2 focus:ring-[#0c1f4d]"
              />
              <Select onValueChange={handleFilterChange} value={filter}>
                <SelectTrigger className="w-full sm:w-1/3 md:w-1/4 text-sm focus:ring-2 focus:ring-[#0c1f4d]">
                  <SelectValue placeholder="Filter by verification" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="not-verified">Not Verified</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Product List */}
           
              <CardContent className="p-2 sm:p-4">
                {/* Mobile Card Layout (hidden on sm and above) */}
                <div className="block sm:hidden space-y-4">
                  {products.length === 0 ? (
                    <div className="text-center text-xs sm:text-sm text-gray-600">
                      No products found.
                    </div>
                  ) : (
                    products.map((product) => (
                      <Card key={product._id} className="shadow-md">
                        <CardContent className="p-4 flex flex-col gap-3">
                          <div className="flex items-center gap-4">
                            {product.product_image?.[0] ? (
                              <img
                                src={product.product_image[0]}
                                alt="Product"
                                className="w-16 h-16 object-cover rounded"
                                loading="lazy"
                                onError={() => console.error("Failed to load image for product:", product._id)}
                              />
                            ) : (
                              <span className="text-xs text-gray-600">No Image</span>
                            )}
                            <div className="flex-1">
                              <p className="text-sm font-semibold">{product.product_name}</p>
                              <p className="text-xs text-gray-600">
                                Category: {product.category_id?.category_name || "N/A"}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 justify-end">
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
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={`p-2 ${
                                    product.product_verified_by_admin
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
                                {product.product_verified_by_admin ? "Product Verified" : "Product Not Verified"}
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>

                {/* Table Layout (hidden on mobile, shown on sm and above) */}
                <div className="hidden sm:block overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-[#0c1f4d]">
                      <TableRow>
                        <TableHead className="text-left text-xs sm:text-sm text-white py-2 px-1 sm:px-3">Category</TableHead>
                        <TableHead className="text-left text-xs sm:text-sm text-white py-2 px-1 sm:px-3">Product Name</TableHead>
                        <TableHead className="text-left text-xs sm:text-sm text-white py-2 px-1 sm:px-3">Image</TableHead>
                        <TableHead className="text-left text-xs sm:text-sm text-white py-2 px-1 sm:px-3">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-xs sm:text-sm text-gray-600">
                            No products found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        products.map((product, index) => (
                          <TableRow key={product._id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <TableCell className="text-xs sm:text-sm py-2 px-1 sm:px-3">{product.category_id?.category_name || "N/A"}</TableCell>
                            <TableCell className="text-xs sm:text-sm py-2 px-1 sm:px-3">{product.product_name}</TableCell>
                            <TableCell className="py-2 px-1 sm:px-3">
                              {product.product_image?.[0] ? (
                                <img
                                  src={product.product_image[0]}
                                  alt="Product"
                                  className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded"
                                  loading="lazy"
                                  onError={() => console.error("Failed to load image for product:", product._id)}
                                />
                              ) : (
                                <span className="text-xs sm:text-sm text-gray-600">No Image</span>
                              )}
                            </TableCell>
                            <TableCell className="py-2 px-1 sm:px-3">
                              <div className="flex gap-1 sm:gap-2">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleView(product)}
                                      className="text-[#0c1f4d] hover:text-[#0c1f4d]/80 p-1 sm:p-2 h-8 w-8 sm:h-9 sm:w-9"
                                    >
                                      <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
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
                                      className="text-green-500 hover:text-green-700 p-1 sm:p-2 h-8 w-8 sm:h-9 sm:w-9"
                                    >
                                      <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
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
                                      className="text-red-500 hover:text-red-700 p-1 sm:p-2 h-8 w-8 sm:h-9 sm:w-9"
                                    >
                                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
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
                                      className={`p-1 sm:p-2 h-8 w-8 sm:h-9 sm:w-9 ${
                                        product.product_verified_by_admin
                                          ? "text-green-500 hover:text-green-700"
                                          : "text-red-500 hover:text-red-700"
                                      }`}
                                    >
                                      {product.product_verified_by_admin ? (
                                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                                      ) : (
                                        <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent className="bg-[#0c1f4d] text-white border-none p-2 text-xs sm:text-sm">
                                    {product.product_verified_by_admin ? "Product Verified" : "Product Not Verified"}
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
              <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                Total Records: {pagination.totalProducts || 0}
              </div>
              <Pagination className="w-full sm:w-auto">
                <PaginationContent className="flex flex-wrap justify-center sm:justify-normal gap-1 sm:gap-0">
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePaginationChange(page - 1)}
                      className={`px-2 py-1 text-xs sm:text-sm ${
                        page === 1 || pagination.totalProducts === 0
                          ? "pointer-events-none opacity-50"
                          : "text-[#0c1f4d] hover:bg-[#0c1f4d]/10"
                      }`}
                    />
                  </PaginationItem>
                  {renderPaginationItems()}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePaginationChange(page + 1)}
                      className={`px-2 py-1 text-xs sm:text-sm ${
                        page >= (pagination.totalPages || 1) || pagination.totalProducts === 0
                          ? "pointer-events-none opacity-50"
                          : "text-[#0c1f4d] hover:bg-[#0c1f4d]/10"
                      }`}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>

            {/* Product Details */}
            {selectedProduct && (
              <div ref={productDetailsRef}>
                <h1 className="font-bold text-lg sm:text-xl md:text-2xl border-b-2 pb-2 mt-4 sm:mt-6">
                  View Product Details
                </h1>
                <Card className="mt-4 sm:mt-6 p-2 sm:p-4 shadow-lg rounded-2xl w-full">
                  <CardContent className="p-0">
                    <h2 className="text-lg sm:text-xl md:text-2xl font-semibold mb-3 sm:mb-4 text-gray-800">
                      {selectedProduct.product_name}
                    </h2>
                    <div
                      className={`grid gap-4 sm:gap-6 ${
                        selectedProduct.video_url && (isYouTubeUrl(selectedProduct.video_url) || isValidVideoFileUrl(selectedProduct.video_url))
                          ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                          : "grid-cols-1 md:grid-cols-2"
                      }`}
                    >
                      {/* Image Section */}
                      <div className="flex flex-col items-center">
                        {activeImage && (
                          <Zoom>
                            <img
                              src={activeImage}
                              alt="Main Product"
                              className="w-full max-w-[200px] sm:max-w-[250px] md:max-w-[300px] h-auto aspect-square object-cover rounded-lg border"
                              loading="lazy"
                            />
                          </Zoom>
                        )}
                        <div className="flex gap-2 sm:gap-3 mt-3 sm:mt-4 flex-wrap justify-center">
                          {selectedProduct.product_image?.map((imageUrl, index) => (
                            <Tooltip key={index}>
                              <TooltipTrigger asChild>
                                <div
                                  onMouseEnter={() => handleImageHover(imageUrl)}
                                  onClick={() => handleImageHover(imageUrl)}
                                  className="w-[50px] h-[50px] sm:w-[60px] sm:h-[60px] cursor-pointer border rounded-md overflow-hidden"
                                >
                                  <img
                                    src={imageUrl}
                                    alt={`Thumbnail ${index}`}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                  />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="bg-[#0c1f4d] text-white border-none p-2 text-xs sm:text-sm">
                                Tap to view
                              </TooltipContent>
                            </Tooltip>
                          ))}
                        </div>
                      </div>

                      {/* Video Section (if present) */}
                      {selectedProduct.video_url && (
                        <div className="flex flex-col items-center">
                          {isYouTubeUrl(selectedProduct.video_url) ? (
                            <iframe
                              width="100%"
                              height="auto"
                              src={getYouTubeEmbedUrl(selectedProduct.video_url)}
                              title="Product Video"
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              className="w-full max-w-[200px] sm:max-w-[250px] md:max-w-[300px] h-[150px] sm:h-[200px] rounded-lg border"
                              onError={(e) => {
                                console.error("Failed to load YouTube video for product:", selectedProduct._id, e);
                                toast.error("Unable to load YouTube video. Please check the video URL.");
                              }}
                            ></iframe>
                          ) : isValidVideoFileUrl(selectedProduct.video_url) ? (
                            <video
                              src={selectedProduct.video_url}
                              controls
                              className="w-full max-w-[200px] sm:max-w-[250px] md:max-w-[300px] h-[150px] sm:h-[200px] object-cover rounded-lg border"
                              onError={(e) => {
                                console.error("Failed to load video for product:", selectedProduct._id, e);
                                toast.error("Unable to load video. Please check the video URL.");
                              }}
                            >
                              <source src={selectedProduct.video_url} type="video/mp4" />
                              <source src={selectedProduct.video_url} type="video/webm" />
                              <source src={selectedProduct.video_url} type="video/ogg" />
                              Your browser does not support the video tag.
                            </video>
                          ) : (
                            <div className="text-red-600 text-xs sm:text-sm">
                              Invalid or unsupported video format.
                            </div>
                          )}
                        </div>
                      )}

                      {/* Product Details Section */}
                      <div className="flex flex-col space-y-3 sm:space-y-4">
                        <div>
                          <p className="text-xs sm:text-sm md:text-base">
                            <span className="font-semibold">Quantity:</span>{" "}
                            {selectedProduct.stock_quantity}
                          </p>
                          <p className="text-xs sm:text-sm md:text-base">
                            <span className="font-semibold">Price:</span> ₹
                            {parseFloat(selectedProduct.price.$numberDecimal).toFixed(2)}
                          </p>
                          <p className="text-xs sm:text-sm md:text-base">
                            <span className="font-semibold">Verification Status:</span>{" "}
                            {selectedProduct.product_verified_by_admin ? "Verified" : "Not Verified"}
                          </p>
                        </div>
                        <div
                          className="prose max-w-none text-xs sm:text-sm text-gray-700 prose-sm"
                          dangerouslySetInnerHTML={{
                            __html: selectedProduct.description,
                          }}
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 pt-3 sm:pt-4 border-t border-gray-200">
                          {selectedProduct.attributes.map((attribute) => (
                            <div key={attribute._id} className="flex flex-col space-y-1">
                              <span className="text-xs sm:text-sm font-medium text-gray-800">
                                {attribute.attribute_key}
                              </span>
                              <span className="text-xs sm:text-sm text-gray-600">
                                {attribute.attribute_value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

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

export default ServiceProviderProductListing;