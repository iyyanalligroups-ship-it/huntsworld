import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Pencil, Trash2, Save, X } from "lucide-react";

const ProductDetails = ({ product }) => {
  return (
    <div className="p-4 bg-gray-50 border border-gray-200 rounded-md shadow-sm w-full box-border max-w-full">
      <h4 className="text-lg font-semibold mb-2">Additional Product Details</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-w-0 w-full">
        <div className="flex justify-center">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-32 w-32 object-cover rounded-md border border-gray-200"
            />
          ) : (
            <div className="h-32 w-32 flex items-center justify-center bg-gray-200 rounded-md border border-gray-200">
              <span className="text-gray-500">No Image</span>
            </div>
          )}
        </div>
        <div className="md:col-span-2 min-w-0 w-full">
          <div className="grid grid-cols-2 gap-4 min-w-0 w-full">
            <div>
              <p><strong>Product ID:</strong> {product.id}</p>
              <p><strong>Price:</strong> {product.price || "N/A"}</p>
              <p><strong>Category:</strong> {product.category || "N/A"}</p>
              <p><strong>Subcategory:</strong> {product.subcategory || "N/A"}</p>
            </div>
            <div>
              <p><strong>Stock:</strong> {product.stock || "N/A"}</p>
              <p><strong>SKU:</strong> {product.sku || "N/A"}</p>
              <p><strong>Supersubcategory:</strong> {product.supersubcategory || "N/A"}</p>
              <p><strong>Deepsubcategory:</strong> {product.deepsubcategory || "N/A"}</p>
              <p><strong>Last Updated:</strong> {product.lastUpdated || "N/A"}</p>
            </div>
          </div>
          <div className="mt-4 max-w-full w-full min-w-0">
            <p className="text-sm break-words whitespace-normal">
              <strong>Description:</strong>{" "}
              <span className="break-words inline-block w-full">
                {product.description || "No description available"}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};


const ProductEditForm = ({ product, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: product.name,
    description: product.description || "",
    price: product.price || "",
    stock: product.stock || "",
    sku: product.sku || ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(product.id, formData);
  };

  return (
    <div className="p-4 bg-gray-50 border-t border-gray-200">
      <h4 className="text-lg font-semibold mb-2">Edit Product</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex justify-center">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-32 w-32 object-cover rounded-md border border-gray-200"
            />
          ) : (
            <div className="h-32 w-32 flex items-center justify-center bg-gray-200 rounded-md border border-gray-200">
              <span className="text-gray-500">No Image</span>
            </div>
          )}
        </div>
        <div className="md:col-span-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Product Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <label className="block text-sm font-medium mt-2">Price</label>
              <input
                type="text"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Stock</label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <label className="block text-sm font-medium mt-2">SKU</label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div className="mt-4 flex space-x-2">
            <Button
              onClick={handleSubmit}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button
              onClick={onCancel}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};


const DeleteConfirmationModal = ({ isOpen, productName, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 pointer-events-auto">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full pointer-events-auto">
        <h3 className="text-lg font-semibold mb-4">Confirm Deletion</h3>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete "<strong>{productName}</strong>"? This action cannot be undone.
        </p>
        <div className="flex justify-end space-x-2">
          <Button
            onClick={onCancel}
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

const ViewProducts = ({ merchant, onBack }) => {
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [editingProductId, setEditingProductId] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [products, setProducts] = useState([
    {
      id: 1,
      name: "Premium Widget",
      category: "Electronics",
      subcategory: "Gadgets",
      supersubcategory: "Smart Devices",
      deepsubcategory: "IoT",
      description:
        "A high-tech smart widget for home automation with advanced features, seamless integration, and a sleek design for modern homes. This description is intentionally long to test wrapping behavior within the table boundaries and ensure it does not overflow outside the designated area. LongUnbrokenStringToTestWrappingBehaviorWithNoSpacesToForceWrappingVeryLongContentToEnsureWrappingWorksCorrectly.",
      price: "$99.99",
      stock: 50,
      sku: "PW-001",
      lastUpdated: "2023-10-01",
      imageUrl: "https://via.placeholder.com/150?text=Premium+Widget"
    },
    {
      id: 2,
      name: "Eco Bottle",
      category: "Home",
      subcategory: "Kitchen",
      supersubcategory: "Drinkware",
      deepsubcategory: "Reusable",
      description:
        "A sustainable, reusable water bottle made from BPA-free materials, designed for eco-conscious consumers with a focus on durability and style.",
      price: "$19.99",
      stock: 200,
      sku: "EB-002",
      lastUpdated: "2023-09-15",
      imageUrl: "https://via.placeholder.com/150?text=Eco+Bottle"
    }
  ]);

  const handleViewClick = (productId) => {
    setSelectedProductId((prevId) => (prevId === productId ? null : productId));
    setEditingProductId(null);
  };

  const handleEditClick = (productId) => {
    setEditingProductId(productId);
    setSelectedProductId(null);
  };

  const handleSaveEdit = (productId, updatedData) => {
    setProducts((prevProducts) =>
      prevProducts.map((product) =>
        product.id === productId
          ? { ...product, ...updatedData, lastUpdated: new Date().toISOString().split("T")[0] }
          : product
      )
    );
    setEditingProductId(null);
  };

  const handleCancelEdit = () => {
    setEditingProductId(null);
  };

  const handleDeleteClick = (productId, productName) => {
    setProductToDelete({ id: productId, name: productName });
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (productToDelete) {
      setProducts((prevProducts) =>
        prevProducts.filter((product) => product.id !== productToDelete.id)
      );
      setSelectedProductId(null);
      setEditingProductId(null);
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
    }
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setProductToDelete(null);
  };

  const selectedProduct = products.find((product) => product.id === selectedProductId);

  return (
    <div className="flex flex-col flex-grow">
      <h3 className="text-xl font-semibold mb-4">Product Details</h3>

      {products.length > 0 ? (
        <div className="rounded-md border bg-white shadow-sm max-w-full overflow-x-auto">
          <Table className="table-fixed w-full">
            <TableHeader>
              <TableRow className="bg-black hover:bg-black">
                <TableHead className="text-white w-[20%] whitespace-nowrap text-ellipsis overflow-hidden">
                  Product Name
                </TableHead>
                <TableHead className="text-white w-[20%] whitespace-nowrap text-ellipsis overflow-hidden">
                  Category
                </TableHead>
                <TableHead className="text-white w-[20%] whitespace-nowrap text-ellipsis overflow-hidden">
                  Subcategory
                </TableHead>
                <TableHead className="text-white w-[20%] whitespace-nowrap text-ellipsis overflow-hidden">
                  Supersubcategory
                </TableHead>
                <TableHead className="text-white w-[20%] whitespace-nowrap text-ellipsis overflow-hidden">
                  Deepsubcategory
                </TableHead>
                <TableHead className="text-white w-[20%] whitespace-nowrap text-ellipsis overflow-hidden">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <React.Fragment key={product.id}>
                  <TableRow className="hover:bg-gray-100">
                    <TableCell className="whitespace-nowrap text-ellipsis overflow-hidden min-w-0 max-w-full">
                      {product.name}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-ellipsis overflow-hidden min-w-0 max-w-full">
                      {product.category}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-ellipsis overflow-hidden min-w-0 max-w-full">
                      {product.subcategory}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-ellipsis overflow-hidden min-w-0 max-w-full">
                      {product.supersubcategory}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-ellipsis overflow-hidden min-w-0 max-w-full">
                      {product.deepsubcategory}
                    </TableCell>
                    <TableCell className="min-w-0">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          title={selectedProductId === product.id ? "Close" : "View"}
                          onClick={() => handleViewClick(product.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          title="Edit"
                          onClick={() => handleEditClick(product.id)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          title="Delete"
                          onClick={() => handleDeleteClick(product.id, product.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {editingProductId === product.id && (
                    <TableRow>
                      <TableCell colSpan={6} className="p-0">
                        <ProductEditForm
                          product={product}
                          onSave={handleSaveEdit}
                          onCancel={handleCancelEdit}
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="flex-grow">
          No product details available for {merchant.company_name || "this merchant"}.
        </p>
      )}

      {selectedProduct && (
        <div className="mt-4 max-w-4xl mx-auto">
          <ProductDetails product={selectedProduct} />
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        productName={productToDelete?.name}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      <div className="flex justify-end mt-4">
        <Button
          onClick={onBack}
          className="bg-[#1c1b20] hover:bg-[#c0302c] text-white"
        >
          Back to Company Details
        </Button>
      </div>
    </div>
  );
};

export default ViewProducts;