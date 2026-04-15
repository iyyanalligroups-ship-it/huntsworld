// import React, { useState, useEffect, useCallback } from "react";
// import {
//   Table,
//   TableHeader,
//   TableHead,
//   TableRow,
//   TableBody,
//   TableCell,
// } from "@/components/ui/table";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Card, CardContent } from "@/components/ui/card";
// import { Eye, Edit, Trash } from "lucide-react";
// import DeleteDialog from "@/model/DeleteModel";
// import { useDeleteProductImageMutation } from "@/redux/api/ProductImageApi";
// import {
//   useUpdateProductMutation,
//   useGetProductsQuery,
//   useDeleteProductMutation,
// } from "@/redux/api/ProductApi";
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
// import Zoom from "react-medium-image-zoom";
// import "react-medium-image-zoom/dist/styles.css";
// import { toast } from "react-toastify";

// const MerchantProductListing = ({ pagination, onEdit }) => {
//   const [selectedProduct, setSelectedProduct] = useState(null);
//   const [editProduct, setEditProduct] = useState(null);
//   const [page, setPage] = useState(1);
//   const [filter, setFilter] = useState("");
//   const [search, setSearch] = useState("");
//   const [isDialogOpen, setIsDialogOpen] = useState(false);
//   const [deleteId, setDeleteId] = useState(null);
//   const [deleteProduct] = useDeleteProductMutation();
//   const [deleteProductImage] = useDeleteProductImageMutation();
//   const [updateProduct] = useUpdateProductMutation();
//   const { data, isLoading, isError } = useGetProductsQuery({
//     page,
//     filter,
//     search,
//   });

//   const handlePaginationChange = useCallback((newPage) => {
//     setPage(newPage);
//   }, []);

//   const handleFilterChange = useCallback((newFilter) => {
//     setFilter(newFilter);
//     setPage(1);
//   }, []);

//   const handleSearchChange = useCallback((e) => {
//     setSearch(e.target.value);
//   }, []);

//   const handleImageHover = useCallback((imgUrl) => {
//     setActiveImage(imgUrl);
//   }, []);

//   const handleEdit = useCallback((product) => {
//     setEditProduct(product); // Open edit form
//     console.log(product,"procus");
    
//     onEdit(product); // Call parent handler if needed
//   }, [onEdit]);

//   const handleDelete = useCallback((id) => {
//     setIsDialogOpen(true);
//     setDeleteId(id);
//   }, []);

//   const handleView = useCallback((product) => {
//     setSelectedProduct(product);
//   }, []);

//   const handleUpdateSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       const response = await updateProduct({
//         id: editProduct._id,
//         product_name: editProduct.product_name,
//         price: editProduct.price.toString(), // Adjust for Decimal128
//         stock_quantity: parseInt(editProduct.stock_quantity),
//         // Add other fields as needed
//       }).unwrap();
//       toast.success(response.message || "Product updated successfully");
//       setEditProduct(null);
//     } catch (err) {
//       toast.error(err.data?.message || "Failed to update product");
//       console.error("Update error:", err);
//     }
//   };

//   const [activeImage, setActiveImage] = useState(null);

//   useEffect(() => {
//     if (selectedProduct?.product_image?.length) {
//       setActiveImage(selectedProduct.product_image[0]);
//     }
//   }, [selectedProduct]);

//   const confirmDelete = async () => {
//     if (!deleteId) return;
//     const selectedProduct = products?.find((item) => item._id === deleteId);
//     console.log("Deleting product:", selectedProduct);

//     try {
//       if (Array.isArray(selectedProduct?.product_image) && selectedProduct.product_image.length > 0) {
//         const fileNames = selectedProduct.product_image.map((url) => url.split("/").pop());
//         console.log("Deleting images:", fileNames);
//         const deleteImageResponse = await deleteProductImage({
//           product_name: selectedProduct.product_name,
//           file_names: fileNames,
//         }).unwrap();
//         console.log("Images deleted successfully:", deleteImageResponse);
//       }

//       const deleteProductResponse = await deleteProduct(deleteId).unwrap();
//       if (deleteProductResponse.success) {
//         toast.success(deleteProductResponse.message || "Product Deleted Successfully");
//       } else {
//         toast.error(deleteProductResponse.message || "Failed to Delete");
//       }
//     } catch (err) {
//       toast.error(err.data?.message || "Error during deletion");
//       console.error("Error during deletion:", err);
//     } finally {
//       setDeleteId(null);
//       setIsDialogOpen(false);
//     }
//   };

//   if (isLoading) return <p>Loading...</p>;
//   if (isError) return <p>Failed to load products.</p>;

//   const products = data?.products || [];

//   return (
//     <div className="p-6 space-y-6">
//       <h1 className="font-bold text-xl border-b-2">Product Details:</h1>
//       <Input
//         type="text"
//         placeholder="Search by product name"
//         value={search}
//         onChange={handleSearchChange}
//       />
//       <div className="flex items-start space-x-4">
//         <Button onClick={() => handleFilterChange("today")}>Today</Button>
//         <Button onClick={() => handleFilterChange("last_week")}>Last Week</Button>
//         <Button onClick={() => handleFilterChange("last_month")}>Last Month</Button>
//       </div>
//       <Card style={{ overflow: "visible" }}>
//         <CardContent style={{ overflow: "visible" }}>
//           <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead>Category</TableHead>
//                 <TableHead>Sub Category</TableHead>
//                 <TableHead>Super Sub Category</TableHead>
//                 <TableHead>Deep Sub Category</TableHead>
//                 <TableHead>Image</TableHead>
//                 <TableHead>Actions</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {products?.map((product) => (
//                 <TableRow key={product._id}>
//                   <TableCell>{product.category_id?.category_name}</TableCell>
//                   <TableCell>{product.sub_category_id?.sub_category_name}</TableCell>
//                   <TableCell>{product.super_sub_category_id?.super_sub_category_name}</TableCell>
//                   <TableCell>{product.deep_sub_category_id?.deep_sub_category_name}</TableCell>
//                   <TableCell>
//                     <img
//                       src={product.product_image[0]}
//                       alt="Product"
//                       className="w-12 h-12 object-cover rounded"
//                     />
//                   </TableCell>
//                   <TableCell className="flex gap-2" onClick={(e) => e.stopPropagation()}>
//                     <Button
//                       variant="ghost"
//                       size="icon"
//                       aria-label="View product details"
//                       onClick={() => handleView(product)}
//                     >
//                       <Eye className="h-5 w-5" />
//                     </Button>
//                     <Button
//                       variant="ghost"
//                       size="icon"
//                       aria-label="Edit product"
//                       onClick={() => handleEdit(product)}
//                     >
//                       <Edit className="h-5 w-5" />
//                     </Button>
//                     <Button
//                       variant="ghost"
//                       size="icon"
//                       aria-label="Delete product"
//                       className="text-red-500"
//                       onClick={() => handleDelete(product._id)}
//                     >
//                       <Trash className="h-5 w-5" />
//                     </Button>
//                   </TableCell>
//                 </TableRow>
//               ))}
//             </TableBody>
//           </Table>
//         </CardContent>
//       </Card>
//       <div className="flex flex-wrap justify-between items-center mt-6">
//         <div className="text-sm text-gray-600">
//           Total Records: {pagination?.totalProducts || 0}
//         </div>
//         <div className="flex justify-center gap-4 w-full sm:w-auto mt-2 sm:mt-0">
//           <Button
//             disabled={page === 1 || pagination?.totalProducts === 0}
//             onClick={() => handlePaginationChange(page - 1)}
//             variant="outline"
//           >
//             Previous
//           </Button>
//           <span className="font-semibold text-gray-700">
//             Page {page} of {pagination?.totalPages || 1}
//           </span>
//           <Button
//             disabled={page === pagination?.totalPages || pagination?.totalProducts === 0}
//             onClick={() => handlePaginationChange(page + 1)}
//             variant="outline"
//           >
//             Next
//           </Button>
//         </div>
//       </div>
//       {editProduct && (
//         <Card className="mt-6 p-4">
//           <CardContent>
//             <h2 className="text-xl font-semibold mb-4">Edit Product</h2>
//             <form onSubmit={handleUpdateSubmit}>
//               <Input
//                 value={editProduct.product_name}
//                 onChange={(e) => setEditProduct({ ...editProduct, product_name: e.target.value })}
//                 placeholder="Product Name"
//                 className="mb-4"
//               />
//               <Input
//                 type="number"
//                 value={editProduct.stock_quantity}
//                 onChange={(e) => setEditProduct({ ...editProduct, stock_quantity: e.target.value })}
//                 placeholder="Quantity"
//                 className="mb-4"
//               />
//               <Input
//                 type="number"
//                 value={editProduct.price?.$numberDecimal || editProduct.price}
//                 onChange={(e) => setEditProduct({ ...editProduct, price: e.target.value })}
//                 placeholder="Price"
//                 className="mb-4"
//               />
//               <Button type="submit" disabled={isLoading}>Update Product</Button>
//               <Button variant="outline" onClick={() => setEditProduct(null)} className="ml-2">
//                 Cancel
//               </Button>
//             </form>
//           </CardContent>
//         </Card>
//       )}
//       <h1 className="font-bold text-xl border-b-2">View Product Details:</h1>
//       {selectedProduct && (
//         <Card className="mt-6 p-4 shadow-lg rounded-2xl">
//           <CardContent className="p-0">
//             <h2 className="text-2xl font-semibold mb-4 text-gray-800">
//               {selectedProduct.product_name}
//             </h2>
//             <div className="flex gap-10 flex-wrap md:flex-nowrap">
//               <div className="flex flex-col items-center">
//                 {activeImage && (
//                   <Zoom>
//                     <img
//                       src={activeImage}
//                       alt="Main Product"
//                       className="w-[300px] h-[300px] object-contain rounded-lg border"
//                     />
//                   </Zoom>
//                 )}
//                 <TooltipProvider>
//                   <div className="flex gap-3 mt-4 flex-wrap justify-center">
//                     {selectedProduct.product_image?.map((imageUrl, index) => (
//                       <Tooltip key={index}>
//                         <TooltipTrigger asChild>
//                           <div
//                             onMouseEnter={() => handleImageHover(imageUrl)}
//                             className="w-[60px] h-[60px] cursor-pointer border rounded-md overflow-hidden"
//                           >
//                             <img
//                               src={imageUrl}
//                               alt={`Thumbnail ${index}`}
//                               className="w-full h-full object-cover"
//                             />
//                           </div>
//                         </TooltipTrigger>
//                         <TooltipContent side="top">Hover to view</TooltipContent>
//                       </Tooltip>
//                     ))}
//                   </div>
//                 </TooltipProvider>
//               </div>
//               <div className="flex-1 space-y-4">
//                 <div>
//                   <p className="text-base">
//                     <span className="font-semibold">Quantity:</span>{" "}
//                     {selectedProduct.stock_quantity}
//                   </p>
//                   <p className="text-base">
//                     <span className="font-semibold">Price:</span> ₹
//                     {parseFloat(selectedProduct.price.$numberDecimal).toFixed(2)}
//                   </p>
//                 </div>
//                 <div
//                   className="prose max-w-none text-sm text-gray-700"
//                   dangerouslySetInnerHTML={{
//                     __html: selectedProduct.description,
//                   }}
//                 />
//                 <div className="grid grid-cols-2 gap-4 pt-4 border-t mt-4">
//                   {selectedProduct.attributes.map((attribute) => (
//                     <div key={attribute._id} className="flex flex-col">
//                       <span className="text-sm font-medium text-gray-800">
//                         {attribute.attribute_key}
//                       </span>
//                       <span className="text-sm text-gray-600">
//                         {attribute.attribute_value}
//                       </span>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       )}
//       <DeleteDialog
//         open={isDialogOpen}
//         onClose={() => setIsDialogOpen(false)}
//         onConfirm={confirmDelete}
//         title="Delete Product?"
//         description="This action will permanently remove the product."
//       />
//     </div>
//   );
// };

// export default React.memo(MerchantProductListing);



import React, { useState, useEffect, useCallback } from "react";
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
import { Eye, Edit, Trash } from "lucide-react";
import DeleteDialog from "@/model/DeleteModel";
import { useDeleteProductImageMutation } from "@/redux/api/ProductImageApi";
import { useGetProductsQuery, useDeleteProductMutation } from "@/redux/api/ProductApi";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import { toast } from "react-toastify";

const MerchantProductListing = ({ pagination, onEdit, onDelete }) => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteProduct] = useDeleteProductMutation();
  const [deleteProductImage] = useDeleteProductImageMutation();
  const { data, isLoading, isError } = useGetProductsQuery({
    page,
    filter,
    search,
  });

  const handlePaginationChange = useCallback((newPage) => {
    setPage(newPage);
  }, []);

  const handleFilterChange = useCallback((newFilter) => {
    setFilter(newFilter);
    setPage(1);
  }, []);

  const handleSearchChange = useCallback((e) => {
    setSearch(e.target.value);
  }, []);

  const handleImageHover = useCallback((imgUrl) => {
    setActiveImage(imgUrl);
  }, []);

  const handleEdit = useCallback((product) => {
    console.log("Edit product:", product);
    onEdit(product);
  }, [onEdit]);

  const handleDelete = useCallback((id) => {
    setIsDialogOpen(true);
    setDeleteId(id);
    onDelete(id);
  }, [onDelete]);

  const handleView = useCallback((product) => {
    setSelectedProduct(product);
  }, []);

  const [activeImage, setActiveImage] = useState(null);

  useEffect(() => {
    if (selectedProduct?.product_image?.length) {
      setActiveImage(selectedProduct.product_image[0]);
    }
  }, [selectedProduct]);

  const confirmDelete = async () => {
    if (!deleteId) return;
    const selectedProduct = products?.find((item) => item._id === deleteId);
    console.log("Deleting product:", selectedProduct);

    try {
      if (Array.isArray(selectedProduct?.product_image) && selectedProduct.product_image.length > 0) {
        const fileNames = selectedProduct.product_image.map((url) => url.split("/").pop());
        console.log("Deleting images:", fileNames);
        const deleteImageResponse = await deleteProductImage({
          product_name: selectedProduct.product_name,
          file_names: fileNames,
        }).unwrap();
        console.log("Images deleted successfully:", deleteImageResponse);
      }

      const deleteProductResponse = await deleteProduct(deleteId).unwrap();
      if (deleteProductResponse.success) {
        toast.success(deleteProductResponse.message || "Product Deleted Successfully");
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

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Failed to load products.</p>;

  const products = data?.products || [];

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
      <Card style={{ overflow: "visible" }}>
        <CardContent style={{ overflow: "visible" }}>
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
                  <TableCell className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="View product details"
                      onClick={() => handleView(product)}
                    >
                      <Eye className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Edit product"
                      onClick={() => handleEdit(product)}
                    >
                      <Edit className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Delete product"
                      className="text-red-500"
                      onClick={() => handleDelete(product._id)}
                    >
                      <Trash className="h-5 w-5" />
                    </Button>
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
            onClick={() => handlePaginationChange(page - 1)}
            variant="outline"
          >
            Previous
          </Button>
          <span className="font-semibold text-gray-700">
            Page {page} of {pagination?.totalPages || 1}
          </span>
          <Button
            disabled={page === pagination?.totalPages || pagination?.totalProducts === 0}
            onClick={() => handlePaginationChange(page + 1)}
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

export default React.memo(MerchantProductListing);