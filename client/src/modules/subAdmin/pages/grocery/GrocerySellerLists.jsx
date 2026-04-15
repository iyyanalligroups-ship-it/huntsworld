import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, PlusCircle, RefreshCw } from 'lucide-react';
import MultiStepModalGrocery from './MultiStepModalGrocery';
import SellerDetails from './SellerDetails';

function GrocerySellerList() {
  const [sellers, setSellers] = useState([]);
  const [filteredSellers, setFilteredSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [sellerToDelete, setSellerToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const itemsPerPage = 10;
  const dropdownRef = useRef(null);

  // Fetch sellers
  useEffect(() => {
    const fetchSellers = async () => {
      try {
        const token = sessionStorage.getItem("token");
        if (!token) throw new Error("Authentication token missing");
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/grocery-sellers/fetch-all-grocery-seller`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const sellerData = Array.isArray(response.data.data) ? response.data.data : [];
        setSellers(sellerData);
        setFilteredSellers(sellerData);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchSellers();
  }, []);

  // Filter sellers based on search term
  useEffect(() => {
    if (!Array.isArray(sellers)) {
      setFilteredSellers([]);
      return;
    }

    const filtered = sellers.filter(seller => {
      const shopName = seller.shop_name || '';
      const shopEmail = seller.shop_email || '';
      const shopPhone = seller.shop_phone_number || '';
      const searchLower = searchTerm.toLowerCase();

      return (
        shopName.toLowerCase().includes(searchLower) ||
        shopEmail.toLowerCase().includes(searchLower) ||
        shopPhone.includes(searchLower)
      );
    });

    setFilteredSellers(filtered);
    setCurrentPage(1);
  }, [searchTerm, sellers]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Delete seller
  const handleDelete = async (id) => {
    try {
      const token = sessionStorage.getItem("token");
      await axios.delete(`${import.meta.env.VITE_API_URL}/grocery-sellers/delete-grocery-seller/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSellers(sellers.filter(seller => seller._id !== id));
      setFilteredSellers(filteredSellers.filter(seller => seller._id !== id));
      setShowConfirmDialog(false);
      setSellerToDelete(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const confirmDelete = (id) => {
    setSellerToDelete(id);
    setShowConfirmDialog(true);
    setDropdownOpen(null);
  };

  const cancelDelete = () => {
    setShowConfirmDialog(false);
    setSellerToDelete(null);
  };

  const toggleDropdown = (id) => {
    setDropdownOpen(dropdownOpen === id ? null : id);
  };

  const viewDetails = (seller) => {
    setSelectedSeller(seller);
    setDropdownOpen(null);
  };

  // Refresh seller list
  const handleRefresh = async () => {
    setLoading(true);
    setSearchTerm('');
    try {
      const token = sessionStorage.getItem("token");
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/grocery-sellers/fetch-all-grocery-seller`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const sellerData = Array.isArray(response.data.data) ? response.data.data : [];
      setSellers(sellerData);
      setFilteredSellers(sellerData);
      setCurrentPage(1);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSellers = filteredSellers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSellers.length / itemsPerPage);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  if (loading) return <div className="text-center py-4 text-gray-600">Loading...</div>;
  if (error) return <div className="text-center py-4 text-red-500">Error: {error}</div>;

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">Grocery Sellers List</h2>

      <div className="flex items-center space-x-4 mb-6">
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center bg-[#1c1b20] hover:bg-[#c0302c] text-white"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Grocery Seller
        </Button>
        <div className="flex items-center space-x-2">
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-64"
          />
          <Button
            onClick={handleRefresh}
            className="flex items-center bg-[#1c1b20] hover:bg-[#c0302c] text-white"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-center">S.No</TableHead>
            <TableHead className="text-center">Shop Name</TableHead>
            <TableHead className="text-center">Shop Email</TableHead>
            <TableHead className="text-center">Shop Phone</TableHead>
            <TableHead className="text-center">Verified</TableHead>
            <TableHead className="text-center">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentSellers.map((seller, index) => (
            <TableRow key={seller._id}>
              <TableCell className="text-center">{indexOfFirstItem + index + 1}</TableCell>
              <TableCell className="text-center">{seller.shop_name || 'N/A'}</TableCell>
              <TableCell className="text-center">{seller.shop_email || 'N/A'}</TableCell>
              <TableCell className="text-center">{seller.shop_phone_number || 'N/A'}</TableCell>
              <TableCell className="text-center">
                <Badge
                  variant="default"
                  className={`${
                    seller.verified_status
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-red-500 hover:bg-red-600'
                  } text-white text-xs`}
                >
                  {seller.verified_status ? 'Verified' : 'Not Verified'}
                </Badge>
              </TableCell>
              <TableCell className="text-center relative">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleDropdown(seller._id)}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  {dropdownOpen === seller._id && (
                    <DropdownMenuContent ref={dropdownRef} align="end">
                      <DropdownMenuItem onClick={() => viewDetails(seller)}>
                        View More Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDropdownOpen(null)}
                      >
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => confirmDelete(seller._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  )}
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex justify-between items-center mt-6">
        <Button
          onClick={handlePrevPage}
          disabled={currentPage === 1}
          variant="outline"
          className="border-gray-300 hover:bg-gray-100 disabled:opacity-50"
        >
          Previous
        </Button>
        <span className="text-gray-600">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          variant="outline"
          className="border-gray-300 hover:bg-gray-100 disabled:opacity-50"
        >
          Next
        </Button>
      </div>

      {selectedSeller && (
        <SellerDetails
          seller={selectedSeller}
          onClose={() => setSelectedSeller(null)}
        />
      )}

      {showConfirmDialog && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-gray-800/60">
          <div className="bg-white p-6 rounded-xl shadow-md max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Confirm Deletion</h3>
            <p className="mb-4 text-gray-600">Are you sure you want to delete this seller?</p>
            <div className="flex justify-end space-x-2">
              <Button
                onClick={cancelDelete}
                variant="outline"
                className="border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleDelete(sellerToDelete)}
                className="bg-red-600 hover:bg-red-700"
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}

      <MultiStepModalGrocery
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onRefresh={handleRefresh}
      />
    </div>
  );
}

export default GrocerySellerList;