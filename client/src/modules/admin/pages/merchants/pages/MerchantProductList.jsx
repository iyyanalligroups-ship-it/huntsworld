import React, { useState, useEffect } from "react";
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
import { useGetUserSellerProductsByIdQuery } from "@/redux/api/ProductApi";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { useDeleteProductImageMutation } from "@/redux/api/ProductImageApi";
import {
  useUpdateProductMutation,
  useDeleteProductMutation,
} from "@/redux/api/ProductApi";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import { toast } from "react-toastify";
import DeleteDialog from "@/model/DeleteModel";

const MerchantProductListing = ({ pagination, onEdit, onDelete,userId }) => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [updateproduct] = useUpdateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();
  const [DeleteProductImage] = useDeleteProductImageMutation();

  const { data, isLoading, isError } = useGetUserSellerProductsByIdQuery(
  { page, filter, search, userId },
  {
    skip: !userId, // ✅ will skip API call if userId is not present
  }
);


  const handlePaginationChange = (newPage) => {
    setPage(newPage);
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPage(1);
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const [activeImage, setActiveImage] = useState(null);

  useEffect(() => {
    if (selectedProduct?.product_image?.length) {
      setActiveImage(selectedProduct.product_image[0]);
    }
  }, [selectedProduct]);

  const handleImageHover = (imgUrl) => {
    setActiveImage(imgUrl);
  };

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Failed to load products.</p>;

  const products = data?.products || [];

  const handleEdit = (product) => {
    onEdit(product);
  };

  const handleDelete = async (id) => {
    setIsDialogOpen(true);
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    const selectedProduct = products?.find((item) => item._id === deleteId);
    console.log("Deleting product:", selectedProduct);

    try {
      if (Array.isArray(selectedProduct?.product_image) && selectedProduct.product_image.length > 0) {
        const fileNames = selectedProduct.product_image.map((url) => url.split("/").pop());
        console.log("Deleting images:", fileNames);

        const deleteImageResponse = await DeleteProductImage({
          product_name: selectedProduct.product_name,
          file_names: fileNames,
        }).unwrap();

        console.log("Images deleted successfully:", deleteImageResponse);
      }

      const deleteProductResponse = await deleteProduct(deleteId).unwrap();
      if (deleteProductResponse.success == true) {
        toast.success(deleteProductResponse.message || "Product Deleted Successfully");
      } else {
        toast.error(deleteProductResponse.message || "Failed to Delete");
      }
    } catch (err) {
      toast.error(err.data.message || "Error during deletion:", err);
      console.error("Error during deletion:", err);
    } finally {
      setDeleteId(null);
      setIsDialogOpen(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="font-bold text-xl border-b-2">Product Details:</h1>
      <Input
        type="text"
        placeholder="Search by product name"
        value={search}
        onChange={handleSearchChange}
      />
      <div className="flex items-start space-x-4">
        <Button onClick={() => handleFilterChange("today")}>Today</Button>
        <Button onClick={() => handleFilterChange("last_week")}>Last Week</Button>
        <Button onClick={() => handleFilterChange("last_month")}>Last Month</Button>
      </div>
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Sub Category</TableHead>
                <TableHead>Super Sub Category</TableHead>
                <TableHead>Deep Sub Category</TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products?.map((product) => (
                <TableRow key={product._id}>
                  <TableCell>{product.category_id?.category_name}</TableCell>
                  <TableCell>{product.sub_category_id?.sub_category_name}</TableCell>
                  <TableCell>{product.super_sub_category_id?.super_sub_category_name}</TableCell>
                  <TableCell>{product.deep_sub_category_id?.deep_sub_category_name}</TableCell>
                  <TableCell>
                    <img
                      src={product.product_image[0]}
                      alt="Product"
                      className="w-12 h-12 object-cover rounded"
                    />
                  </TableCell>
                  <TableCell className="flex gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedProduct(product)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>View Details</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(product)}
                            className="text-green-600 hover:text-green-800"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(product._id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <div className="flex flex-wrap justify-between items-center mt-6">
        <div className="text-sm text-gray-600">
          Total Records: {pagination?.totalProducts || 0}
        </div>
        <div className="flex justify-center gap-4 w-full sm:w-auto mt-2 sm:mt-0">
          <Button
            disabled={page === 1 || pagination?.totalProducts === 0}
            onClick={() => setPage((prev) => prev - 1)}
            variant="outline"
          >
            Previous
          </Button>
          <span className="font-semibold text-gray-700">
            Page {page} of {pagination?.totalPages || 1}
          </span>
          <Button
            disabled={page === pagination?.totalPages || pagination?.totalProducts === 0}
            onClick={() => setPage((prev) => prev + 1)}
            variant="outline"
          >
            Next
          </Button>
        </div>
      </div>
      <h1 className="font-bold text-xl border-b-2">View Product Details:</h1>
      {selectedProduct && (
        <Card className="mt-6 p-4 shadow-lg rounded-2xl">
          <CardContent className="p-0">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">
              {selectedProduct.product_name}
            </h2>
            <div className="flex gap-10 flex-wrap md:flex-nowrap">
              <div className="flex flex-col items-center">
                {activeImage && (
                  <Zoom>
                    <img
                      src={activeImage}
                      alt="Main Product"
                      className="w-[300px] h-[300px] object-contain rounded-lg border"
                    />
                  </Zoom>
                )}
                <TooltipProvider>
                  <div className="flex gap-3 mt-4 flex-wrap justify-center">
                    {selectedProduct.product_image?.map((imageUrl, index) => (
                      <Tooltip key={index}>
                        <TooltipTrigger asChild>
                          <div
                            onMouseEnter={() => handleImageHover(imageUrl)}
                            className="w-[60px] h-[60px] cursor-pointer border rounded-md overflow-hidden"
                          >
                            <img
                              src={imageUrl}
                              alt={`Thumbnail ${index}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top">Hover to view</TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </TooltipProvider>
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <p className="text-base">
                    <span className="font-semibold">Quantity:</span>{" "}
                    {selectedProduct.stock_quantity}
                  </p>
                  <p className="text-base">
                    <span className="font-semibold">Price:</span> ₹
                    {parseFloat(selectedProduct.price.$numberDecimal).toFixed(2)}
                  </p>
                </div>
                <div
                  className="prose max-w-none text-sm text-gray-700"
                  dangerouslySetInnerHTML={{
                    __html: selectedProduct.description,
                  }}
                />
                <div className="grid grid-cols-2 gap-4 pt-4 border-t mt-4">
                  {selectedProduct.attributes.map((attribute) => (
                    <div key={attribute._id} className="flex flex-col">
                      <span className="text-sm font-medium text-gray-800">
                        {attribute.attribute_key}
                      </span>
                      <span className="text-sm text-gray-600">
                        {attribute.attribute_value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      <DeleteDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Product?"
        description="This action will permanently remove the product."
      />
    </div>
  );
};

export default MerchantProductListing;