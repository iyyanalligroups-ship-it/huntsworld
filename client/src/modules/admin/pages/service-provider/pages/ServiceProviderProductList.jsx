import React, { useState ,useEffect} from "react";
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
import { Card, CardContent} from "@/components/ui/card";
import { useGetProductsQuery } from "@/redux/api/ProductApi";
import { MoreHorizontal } from "lucide-react";
import DeleteDialog from "@/model/DeleteModel";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useDeleteProductImageMutation } from "@/redux/api/ProductImageApi";
import {
  useUpdateProductMutation,
  useDeleteProductMutation,
} from "@/redux/api/ProductApi";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import {toast} from "react-toastify";

const ServiceProviderList = ({ products,pagination, onEdit, onDelete }) => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [updateproduct] = useUpdateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();

  const [DeleteProductImage] = useDeleteProductImageMutation();
  // Fetch product data with pagination, search, and filter
  // const { data, isLoading, isError } = useGetProductsQuery({
  //   page,
  //   filter,
  //   search,
  // });

  const handlePaginationChange = (newPage) => {
    setPage(newPage);
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPage(1); // Reset to first page when filter changes
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };
  const [activeImage, setActiveImage] = useState(null);

  // ✅ Set the initial image only once
  useEffect(() => {
    if (selectedProduct?.product_image?.length) {
      setActiveImage(selectedProduct.product_image[0]);
    }
  }, [selectedProduct]);

  const handleImageHover = (imgUrl) => {
    setActiveImage(imgUrl);
  };

  // if (isLoading) return <p>Loading...</p>;
  // if (isError) return <p>Failed to load products.</p>;

  // const products = products || [];

  const handleEdit = (product) => {
    onEdit(product);
  };

  const handleDelete = async (id) => {
    setIsDialogOpen(true);
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
  
    // Find the product to delete by ID
    const selectedProduct = products?.find((item) => item._id === deleteId);
    console.log("Deleting product:", selectedProduct);
  
    try {
      // Step 1: Delete associated images (if any)
      if (Array.isArray(selectedProduct?.product_image) && selectedProduct.product_image.length > 0) {
        const fileNames = selectedProduct.product_image.map((url) => url.split("/").pop());
        console.log("Deleting images:", fileNames);
  
        // Bulk delete request
        const deleteImageResponse = await DeleteProductImage({
          product_name: selectedProduct.product_name,
          file_names: fileNames,
        }).unwrap();
  
        console.log("Images deleted successfully:", deleteImageResponse);
      }
  
      // Step 2: Delete the product record from the database
      const deleteProductResponse = await deleteProduct(deleteId).unwrap();
      if (deleteProductResponse.success == true) {
        toast.success(deleteProductResponse.message || "Product Deleted Successfully");
      }else{
        toast.error(deleteProductResponse.message || "Failed to Delete");
      }
  
    } catch (err) {
      toast.error(err.data.message || "Error during deletion:", err)
      console.error("Error during deletion:", err);
    } finally {
      setDeleteId(null);
      setIsDialogOpen(false);
    }
  };
  

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
         <h1 className="font-bold text-xl border-b-2">Product Details  : </h1>
      {/* Search */}
      <Input
        type="text"
        placeholder="Search by product name"
        value={search}
        onChange={handleSearchChange}
        // className="p-2 border rounded"
      />

      {/* Filter Buttons */}
      <div className="flex items-start space-x-4">
        <Button onClick={() => handleFilterChange("today")}>Today</Button>
        <Button onClick={() => handleFilterChange("last_week")}>
          Last Week
        </Button>
        <Button onClick={() => handleFilterChange("last_month")}>
          Last Month
        </Button>
      </div>

      {/* Product Table */}
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
              {products.map((product) => (
                <TableRow key={product._id}>
                  <TableCell>{product.category_id?.category_name}</TableCell>
                  <TableCell>
                    {product.sub_category_id?.sub_category_name}
                  </TableCell>
                  <TableCell>
                    {product.super_sub_category_id?.super_sub_category_name}
                  </TableCell>
                  <TableCell>
                    {product.deep_sub_category_id?.deep_sub_category_name}
                  </TableCell>
                  <TableCell>
                    <img
                      src={product.product_image[0]}
                      alt="Product"
                      className="w-12 h-12 object-cover rounded"
                    />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleEdit(product)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setSelectedProduct(product)}
                        >
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(product._id)}
                          className="text-red-500"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex flex-wrap justify-between items-center mt-6">
        {/* Total Records on the Left */}
        <div className="text-sm text-gray-600">
          Total Records: {pagination?.totalProducts || 0}
        </div>

        {/* Pagination Controls Centered on Small Screens, Right on Larger */}
        <div className="flex justify-center gap-4 w-full sm:w-auto mt-2 sm:mt-0">
          <Button
            disabled={page === 1}
            onClick={() => setPage((prev) => prev - 1)}
            variant="outline"
          >
            Previous
          </Button>
          <span className="font-semibold text-gray-700">
            Page {page} of {pagination?.totalPages || 1}
          </span>
          <Button
            disabled={page === pagination?.totalPages}
            onClick={() => setPage((prev) => prev + 1)}
            variant="outline"
          >
            Next
          </Button>
        </div>
      </div>
      <h1 className="font-bold text-xl border-b-2">View Product Details : </h1>
      {selectedProduct && (
        
     <Card className="mt-6 p-4 shadow-lg rounded-2xl">
     
     <CardContent className="p-0">
       <h2 className="text-2xl font-semibold mb-4 text-gray-800">
         {selectedProduct.product_name}
       </h2>

       <div className="flex gap-10 flex-wrap md:flex-nowrap">
         {/* Main Image with Zoom */}
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

           {/* Thumbnails with Tooltip */}
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

         {/* Product Info */}
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
        title="Delete Category?"
        description="This action will permanently remove the category."
      />
    </div>
  );
};

export default ServiceProviderList;
