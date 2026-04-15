import { useContext, useState } from "react";
import { useGetUsersQuery, useDeleteUserMutation } from "@/redux/api/Authapi";
import { useGetUserByIdQuery } from "@/redux/api/SubAdminAccessRequestApi";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import UserForm from "./UserForm";
import DeleteDialog from "@/model/DeleteModel";
import AddressForm from "./AddressForm";
import UserDetails from "./UserDetails";
import showToast from "@/toast/showToast";
import { Badge } from "@/components/ui/badge";
import { AuthContext } from "@/modules/landing/context/AuthContext";

const UserTable = () => {
  const { user } = useContext(AuthContext);
  const [isUserDetailsOpen, setIsUserDetailsOpen] = useState(false);
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [deletePopup, setDeletePopup] = useState(false);
  const [addressPopup, setAddressPopup] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchName, setSearchName] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  const userId = user?.user?._id;
  const { data: currentUser, isError: isUserError, error: userError } = useGetUserByIdQuery(userId, { skip: !userId });

  // Log for debugging
  console.log(currentUser, 'currentUser');

  // Check permissions for the current page
  const currentPagePath = "/subAdmin/common-users";
  const pagePermissions = currentUser?.approved_permissions?.find(p => p.page === currentPagePath);
  const canEdit = pagePermissions?.actions.includes("edit") || false;
  const canDelete = pagePermissions?.actions.includes("delete") || false;

  if (isUserError) {
    console.error("Error fetching user permissions:", userError);
    showToast("Failed to load user permissions", "error");
  }
  const { data, isLoading } = useGetUsersQuery({
    name: searchName,
    page: currentPage,
    limit: usersPerPage,
  });

  const users = data?.users || [];
  const totalPages = data?.totalPages || 1;

  const [deleteUser] = useDeleteUserMutation();

  if (isLoading)
    return <p className="text-center text-gray-600">Loading users...</p>;
  if (!users?.length)
    return <p className="text-center text-gray-600">No users found.</p>;

  // Open Modal for Add/Edit
  const handleOpenModal = (user = null) => {
    setSelectedUser(user);
    setIsUserFormOpen(true);
  };

  // Open Delete Popup
  const handleDelete = (user) => {
    setSelectedUser(user);
    setDeletePopup(true);
  };

  // Open Address Popup
  const handleOpenAddressPopup = (user) => {
    setSelectedUser(user);
    setAddressPopup(true);
  };

  // Confirm Delete
  const confirmDelete = async () => {
    const response = await deleteUser(selectedUser._id);
    console.log(response, "delete");
    if (response?.data) {
      showToast(response?.data?.message || "User Deleted Successfully", "success");
    } else {
      showToast(response?.data?.message || "Failed to Delete", "error");
    }
    setDeletePopup(false);
  };

  // View more details
  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setIsUserDetailsOpen(true);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Add User Button */}
      <div className="flex gap-3">
        <Button
          className="mb-4 hover:shadow-lg text-white py-2 rounded-md cursor-pointer"
          onClick={() => handleOpenModal(null)}
          disabled={!canEdit}
          title={!canEdit ? "You do not have permission to add users" : "Add user"}
        >
          + Add User
        </Button>
        <Input
          type="text"
          placeholder="Search by name..."
          className="p-2 border rounded-md w-64 mb-4"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />
      </div>

      {/* User Table */}
      <Table className="border border-gray-200 rounded-lg overflow-hidden">
        <TableHeader>
          <TableRow className="bg-gray-100">
            <TableHead className="p-3 text-left">Name</TableHead>
            <TableHead className="p-3 text-left">Email</TableHead>
            <TableHead className="p-3 text-left">Phone Number</TableHead>
            <TableHead className="p-3 text-left">Role</TableHead>
            <TableHead className="p-3 text-left">Status</TableHead>
            <TableHead className="p-3 text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user._id} className="border-b hover:bg-gray-50">
              <TableCell className="p-3">{user?.name}</TableCell>
              <TableCell className="p-3">{user?.email}</TableCell>
              <TableCell className="p-3">{user?.phone}</TableCell>
              <TableCell className="p-3">{user?.role?.role}</TableCell>
              <TableCell className="p-3">
                <Badge
                  className={`${
                    user?.email_verified == true
                      ? "bg-green-500 rounded-2xl text-white"
                      : "bg-red-500 p-1 rounded-2xl text-white"
                  }`}
                >
                  {user?.email_verified == true ? "Verified" : "Not Verified"}
                </Badge>
              </TableCell>
              <TableCell className="p-3 text-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <span className="cursor-pointer p-2 rounded-full">
                      <MoreVertical className="w-5 h-5" />
                    </span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleViewDetails(user)}>
                      View more
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleOpenModal(user)}
                      disabled={!canEdit}
                      className={!canEdit ? "opacity-50 cursor-not-allowed" : ""}
                    >
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(user)}
                      disabled={!canDelete}
                      className={!canDelete ? "opacity-50 cursor-not-allowed" : ""}
                    >
                      Delete
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleOpenAddressPopup(user)}
                      disabled={!canEdit}
                      className={!canEdit ? "opacity-50 cursor-not-allowed" : ""}
                    >
                      Add Address
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-4">
        <Button
          variant="outline"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
        >
          Previous
        </Button>

        <p className="text-gray-600">
          Page {currentPage} of {totalPages}
        </p>

        <Button
          variant="outline"
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(currentPage + 1)}
        >
          Next
        </Button>
      </div>
      {isUserDetailsOpen && selectedUser && (
        <UserDetails
          user={selectedUser}
          closeModal={() => setIsUserDetailsOpen(false)}
        />
      )}

      {isUserFormOpen && (
        <Dialog open={isUserFormOpen} onOpenChange={setIsUserFormOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedUser ? "Edit User" : "Add User"}</DialogTitle>
            </DialogHeader>
            <UserForm
              user={selectedUser}
              closeModal={() => setIsUserFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}
      {addressPopup && (
        <Dialog open={addressPopup} onOpenChange={setAddressPopup}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Address</DialogTitle>
            </DialogHeader>
            <AddressForm
              user={selectedUser}
              closeModal={() => setAddressPopup(false)}
            />
          </DialogContent>
        </Dialog>
      )}
      {/* Delete Confirmation Modal */}
      {deletePopup && (
        <DeleteDialog
          open={deletePopup}
          onClose={() => setDeletePopup(false)}
          onConfirm={confirmDelete}
          title={`Are you sure you want to delete ${selectedUser?.name}?`}
        />
      )}
    </div>
  );
};

export default UserTable;