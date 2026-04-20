
import React, { useState, useEffect } from "react";
import axios from "axios";
import MultiStepModal from "./addmerchant";
import MerchantDetails from "./MerchantDetails";
import EditMerchantForm from "./EditMerchantModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusCircle, MoreVertical } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock sidebar hook
const useSidebar = () => {
  return { isSidebarOpen: false };
};

// Confirmation Modal Component
const ConfirmationModal = ({ isOpen, onClose, onConfirm, merchantName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Confirm Deletion</h3>
        <p className="mb-6">
          Are you sure you want to delete{" "}
          <span className="font-medium">{merchantName || "this merchant"}</span>?
          This action cannot be undone.
        </p>
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
};

const MerchantList = () => {
  const { isSidebarOpen } = useSidebar();
  const [searchTerm, setSearchTerm] = useState("");
  const [merchants, setMerchants] = useState([]);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [editingMerchant, setEditingMerchant] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [merchantToDelete, setMerchantToDelete] = useState(null);
  const merchantsPerPage = 10;

  const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "/api/v1/merchants",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sessionStorage.getItem("token")}`,
    },
  });

  const fetchMerchants = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/merchants/fetch-all-merchants");
      setMerchants(Array.isArray(response.data) ? response.data : []);
      setError(null);
    } catch (error) {
      console.error("Error fetching merchants:", error);
      setError("Failed to fetch merchants. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMerchants();
  }, []);

  const handleAddMerchant = async (formData) => {
    try {
      const response = await api.post("/merchants/create-merchant", {
        ...formData,
        user_id: formData.user_id,
        address_id: formData.address_id,
      });
      setMerchants((prev) => [...prev, response.data]);
      setError(null);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error adding merchant:", error);
      setError("Failed to add merchant. Please try again.");
    }
  };

  const handleDeleteMerchant = async (merchantId) => {
    try {
      await api.delete(`/merchants/delete-merchant/${merchantId}`);
      setMerchants((prev) => prev.filter((merchant) => merchant._id !== merchantId));
      setError(null);
    } catch (error) {
      console.error("Error deleting merchant:", error);
      setError("Failed to delete merchant. Please try again.");
    } finally {
      setIsDeleteModalOpen(false);
      setMerchantToDelete(null);
    }
  };

  const openDeleteModal = (merchant) => {
    setMerchantToDelete(merchant);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setMerchantToDelete(null);
  };

  const confirmDelete = () => {
    if (merchantToDelete) {
      handleDeleteMerchant(merchantToDelete._id);
    }
  };

  const handleViewDetails = (merchant) => {
    console.log("Selected merchant:", merchant);
    setSelectedMerchant(merchant);
    setEditingMerchant(null);
  };

  const handleEditMerchant = (merchant) => {
    setEditingMerchant(merchant);
    setSelectedMerchant(null);
  };

  const handleSaveEdit = async (updatedMerchant) => {
    try {
      const originalMerchant = merchants.find((m) => m._id === updatedMerchant._id);
      const payload = {
        ...originalMerchant,
        ...updatedMerchant,
      };

      const response = await api.put(`/merchants/update-merchant/${updatedMerchant._id}`, payload);
      setMerchants((prev) =>
        prev.map((m) => (m._id === updatedMerchant._id ? response.data : m))
      );
      setEditingMerchant(null);
      setError(null);
    } catch (error) {
      console.error("Error updating merchant:", error.response?.data || error.message);
      setError("Failed to update merchant. Please check the data and try again.");
    }
  };

  const closeDetails = () => {
    setSelectedMerchant(null);
  };

  const closeEdit = () => {
    setEditingMerchant(null);
  };

  const filteredMerchants = merchants.filter((merchant) =>
    [
      merchant.company_name,
      merchant.company_email,
      merchant.company_phone_number,
    ].some((field) =>
      field?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const indexOfLastMerchant = currentPage * merchantsPerPage;
  const indexOfFirstMerchant = indexOfLastMerchant - merchantsPerPage;
  const currentMerchants = filteredMerchants.slice(indexOfFirstMerchant, indexOfLastMerchant);
  const totalPages = Math.ceil(filteredMerchants.length / merchantsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  if (isLoading) return <div className="p-4">Loading merchants...</div>;
  if (error) {
    return (
      <div className="p-4 text-red-500">
        {error}{" "}
        <button onClick={fetchMerchants} className="underline">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`${isSidebarOpen ? "p-6 lg:ml-56" : "p-4 lg:ml-16"}`}>
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <Button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center bg-[#1c1b20] hover:bg-[#c0302c] text-white"
        >
          <PlusCircle className="w-4 h-4 mr-2" /> Add Merchant
        </Button>
        <Button
          onClick={fetchMerchants}
          className="flex items-center bg-[#1c1b20] hover:bg-[#c0302c] text-white"
        >
          Refresh
        </Button>
        <Input
          type="text"
          placeholder="Search by Name, Email, or Phone..."
          className="w-72"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <MultiStepModal
        onSubmit={handleAddMerchant}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onRefresh={fetchMerchants} 
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        merchantName={merchantToDelete?.company_name}
      />

      <div className="mt-6 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">S.No</TableHead>
              <TableHead>Company Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>GST</TableHead>
              <TableHead>Employees</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentMerchants.length > 0 ? (
              currentMerchants.map((merchant, index) => (
                <TableRow key={merchant._id}>
                  <TableCell>{indexOfFirstMerchant + index + 1}</TableCell>
                  <TableCell>{merchant.company_name || "-"}</TableCell>
                  <TableCell>{merchant.company_email || "-"}</TableCell>
                  <TableCell>{merchant.company_phone_number || "-"}</TableCell>
                  <TableCell>{merchant.company_type || "-"}</TableCell>
                  <TableCell>
                    <span
                      className={
                        merchant.verified_status
                          ? "text-green-600 font-medium"
                          : "text-red-600 font-medium"
                      }
                    >
                      {merchant.verified_status ? "Verified" : "Not Verified"}
                    </span>
                  </TableCell>
                  <TableCell>{merchant.gst_number || "-"}</TableCell>
                  <TableCell>{merchant.number_of_employees || "-"}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <MoreVertical className="w-5 h-5" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleViewDetails(merchant)}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditMerchant(merchant)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openDeleteModal(merchant)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-4">
                  No merchants found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {filteredMerchants.length > 0 && (
          <div className="flex justify-between items-center mt-4">
            <Button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="bg-white border border-gray-300 text-black hover:bg-gray-200"
            >
              Previous
            </Button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <Button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="bg-white border border-gray-300 text-black hover:bg-gray-200"
            >
              Next
            </Button>
          </div>
        )}

        {selectedMerchant && (
          <div className="mt-6">
            <MerchantDetails
              merchant={selectedMerchant}
              onClose={closeDetails}
            />
          </div>
        )}

        {editingMerchant && (
          <div className="mt-6">
            <EditMerchantForm
              merchant={editingMerchant}
              onSave={handleSaveEdit}
              onClose={closeEdit}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MerchantList;
