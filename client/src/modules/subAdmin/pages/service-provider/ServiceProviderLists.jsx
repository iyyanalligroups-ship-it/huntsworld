import React, { useState, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { PlusCircle, MoreVertical } from "lucide-react";
import { useGetServiceProvidersQuery } from "@/redux/api/ServiceProviderApi";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { useGetUserByIdQuery } from "@/redux/api/SubAdminAccessRequestApi";
import AddServiceProvider from "./AddServiceProvider";
import ServiceProviderDetails from "./ServiceProviderDetails";
import EditServiceProviderModal from "./EditServiceProviderModal";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import showToast from "@/toast/showToast";

const useSidebar = () => {
  return { isSidebarOpen: false };
};

const ServiceProviderList = () => {
  const { user } = useContext(AuthContext);
  const { isSidebarOpen } = useSidebar();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedProviderId, setSelectedProviderId] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const pageSize = 10;
  const currentPagePath = "/subAdmin/service-providers";
  
  const userId = user?.user._id;
  const { data: currentUser, isError: isUserError, error: userError } = useGetUserByIdQuery(userId, { skip: !userId });

  // Check permissions for the current page
  const pagePermissions = currentUser?.approved_permissions?.find(p => p.page === currentPagePath);
  const canEdit = pagePermissions?.actions.includes("edit") || false;
  const canDelete = pagePermissions?.actions.includes("delete") || false;

  if (isUserError) {
    console.error("Error fetching user permissions:", userError);
    showToast("Failed to load user permissions", "error");
  }

  const { data: serviceProviders = [], isLoading, error } = useGetServiceProvidersQuery();

  const filteredProviders = serviceProviders.filter((provider) => {
    const email = provider.company_email || "";
    const phoneNumber = provider.company_phone_number || "";
    const travelsName = provider.travels_name || "";
    const licenseNumber = provider.license_number || "";
    return (
      email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phoneNumber.includes(searchQuery) ||
      travelsName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      licenseNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const totalProviders = filteredProviders.length;
  const totalPages = Math.ceil(totalProviders / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const displayedProviders = filteredProviders.slice(startIndex, startIndex + pageSize);

  const handleViewDetails = (provider) => {
    setSelectedProvider(provider);
    setSelectedProviderId(provider._id);
  };

  const handleEdit = (providerId) => {
    setSelectedProviderId(providerId);
    setIsEditModalOpen(true);
  };

  const handleDelete = (providerId) => {
    const provider = serviceProviders.find((p) => p._id === providerId);
    setSelectedProvider(provider);
    setIsDeleteModalOpen(true);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  if (isLoading) return <div className="p-4 text-white">Loading service providers...</div>;

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error fetching service providers: {error.message}{" "}
        <button onClick={() => window.location.reload()} className="underline text-white">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`${isSidebarOpen ? "p-6 lg:ml-56" : "p-4 lg:ml-16"}`}>
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center bg-[#1c1b20] hover:bg-[#c0302c] text-white"
          disabled={!canEdit}
          title={!canEdit ? "You do not have permission to add service providers" : "Add service provider"}
        >
          <PlusCircle className="w-4 h-4 mr-2" /> Add Service Provider
        </Button>
        <Button
          onClick={() => window.location.reload()}
          className="flex items-center bg-[#1c1b20] hover:bg-[#c0302c] text-white"
        >
          Refresh
        </Button>
        <Input
          type="text"
          placeholder="Search by email, phone, travels name, or license..."
          className="w-72"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <AddServiceProvider
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
      <EditServiceProviderModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        providerId={selectedProviderId}
      />
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        provider={selectedProvider}
      />

      <div className="mt-6 overflow-x-auto">
        <Table>
          <TableHeader className="bg-white">
            <TableRow>
              <TableHead className="w-[80px] text-black">S.No</TableHead>
              <TableHead className="text-black">User ID</TableHead>
              <TableHead className="text-black">Travels Name</TableHead>
              <TableHead className="text-black">Email</TableHead>
              <TableHead className="text-black">Phone Number</TableHead>
              <TableHead className="text-black">License Number</TableHead>
              <TableHead className="text-black">Vehicle Type</TableHead>
              <TableHead className="text-black">Number of Vehicles</TableHead>
              <TableHead className="text-black">Verified</TableHead>
              <TableHead className="text-black">Trust Shield</TableHead>
              <TableHead className="text-black">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedProviders.length > 0 ? (
              displayedProviders.map((provider, index) => (
                <TableRow key={provider._id}>
                  <TableCell className="text-black">{startIndex + index + 1}</TableCell>
                  <TableCell className="text-black">{provider.user_id?._id || "-"}</TableCell>
                  <TableCell className="text-black">{provider.travels_name || "-"}</TableCell>
                  <TableCell className="text-black">{provider.company_email || "-"}</TableCell>
                  <TableCell className="text-black">{provider.company_phone_number || "-"}</TableCell>
                  <TableCell className="text-black">{provider.license_number || "-"}</TableCell>
                  <TableCell className="text-black">{provider.vehicle_type || "-"}</TableCell>
                  <TableCell className="text-black">{provider.number_of_vehicles || "-"}</TableCell>
                  <TableCell>
                    <span
                      className={
                        provider.verified_status
                          ? "text-green-600 font-medium"
                          : "text-red-600 font-medium"
                      }
                    >
                      {provider.verified_status ? "Verified" : "Not Verified"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        provider.trust_shield
                          ? "text-green-600 font-medium"
                          : "text-red-600 font-medium"
                      }
                    >
                      {provider.trust_shield ? "Yes" : "No"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <MoreVertical className="w-5 h-5 text-black" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleViewDetails(provider)}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleEdit(provider._id)}
                          disabled={!canEdit}
                          className={!canEdit ? "opacity-50 cursor-not-allowed" : ""}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(provider._id)}
                          disabled={!canDelete}
                          className={!canDelete ? "opacity-50 cursor-not-allowed" : ""}
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
                <TableCell colSpan={11} className="text-center py-4 text-black">
                  No service providers found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {filteredProviders.length > 0 && (
          <div className="flex justify-between items-center mt-4">
            <Button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="bg-white border border-gray-300 text-black hover:bg-gray-200"
            >
              Previous
            </Button>
            <span className="text-black">
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

        {selectedProvider && (
          <div className="mt-6">
            <ServiceProviderDetails
              providerId={selectedProviderId}
              onClose={() => setSelectedProvider(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceProviderList;