import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useUpdateUserAddressMutation,
  useDeleteUserAddressMutation,
} from "@/redux/api/Authapi";
import { Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import DeleteDialog from "@/model/DeleteModel";

const UserDetails = ({ user, closeModal }) => {
  const [isEdit, setIsEdit] = useState(false);
  const [addressForm, setAddressForm] = useState(user.address || {});
  const [selectedUser, setSelectedUser] = useState({});
  const [deletePopup, setDeletePopup] = useState(false);
  const [updateUserAddress, { isLoading: isUpdating }] =
    useUpdateUserAddressMutation();
  const [DeleteUserAddress] =
    useDeleteUserAddressMutation();

  // Handle address form changes
  const handleChange = (e) => {
    setAddressForm({ ...addressForm, [e.target.name]: e.target.value });
  };

  // Handle update address
  const handleUpdate = async () => {
    try {
      const response = await updateUserAddress({
        userId: selectedUser._id,
        updatedAddress: addressForm,
      }).unwrap();
      //   toast.success("Address updated successfully!");
      //   setEditModalOpen(false);

      if (response.success) {
        closeModal();
      }
    } catch (error) {
      toast.error("Failed to update address");
    }
  };
  const handleDeletePopup = (user) => {
    setSelectedUser(user);
    setDeletePopup(true);
  };

  // Handle delete address
  const handleDelete = async () => {
    try {
      console.log(selectedUser.address);

      const response = await DeleteUserAddress({
        userId: selectedUser?.address?._id,
      }).unwrap();
      if (response.success) {
        closeModal();
      }
      //   toast.success("Address deleted successfully!");
      //   setDeleteConfirmOpen(false);
    } catch (error) {
      toast.error("Failed to delete address");
    }
  };

  return (
    <Dialog open={true} onOpenChange={closeModal}>
      {/* Delete Confirmation Modal */}
      {deletePopup && (
        <DeleteDialog
          open={deletePopup}
          onClose={() => setDeletePopup(false)}
          onConfirm={handleDelete}
          title={`Are you sure you want to delete Address of ${selectedUser?.name}?`}
        />
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p>
            <strong>Name:</strong> {user?.name}
          </p>
          <p>
            <strong>Email:</strong> {user?.email}
          </p>
          <p>
            <strong>Phone:</strong> {user?.phone}
          </p>
          <p>
            <strong>Role:</strong> {user?.role?.role}
          </p>

          {/* Address Section */}
          <div className="mt-4 p-4 bg-gray-100 rounded-md">
            <h3 className="font-semibold">Address</h3>
            {user.address ? (
              <div className="mt-2 space-y-2">
                {isEdit ? (
                  <>
                    <Input
                      name="address_line_1"
                      placeholder="Address Line 1"
                      value={addressForm.address_line_1}
                      onChange={handleChange}
                    />
                    <Input
                      name="address_line_2"
                      placeholder="Address Line 2"
                      value={addressForm.address_line_2}
                      onChange={handleChange}
                    />
                    <Input
                      name="city"
                      placeholder="City"
                      value={addressForm.city}
                      onChange={handleChange}
                    />
                    <Input
                      name="state"
                      placeholder="State"
                      value={addressForm.state}
                      onChange={handleChange}
                    />
                    <Input
                      name="country"
                      placeholder="Country"
                      value={addressForm.country}
                      onChange={handleChange}
                    />
                    <Input
                      name="pincode"
                      placeholder="Pincode"
                      value={addressForm.pincode}
                      onChange={handleChange}
                    />
                    <Button
                      className="w-full bg-[#0c1f4d] text-white"
                      onClick={handleUpdate}
                    >
                      {isUpdating ? "Updating..." : "Update Address"}
                    </Button>
                  </>
                ) : (
                  <>
                    {user.address && Object.keys(user.address).length > 0 ? (
                      <>
                        <p>
                          <strong>Line 1:</strong> {user.address.address_line_1}
                        </p>
                        <p>
                          <strong>Line 2:</strong> {user.address.address_line_2}
                        </p>
                        <p>
                          <strong>City:</strong> {user.address.city}
                        </p>
                        <p>
                          <strong>State:</strong> {user.address.state}
                        </p>
                        <p>
                          <strong>Country:</strong> {user.address.country}
                        </p>
                        <p>
                          <strong>Pincode:</strong> {user.address.pincode}
                        </p>
                      </>
                    ) : (
                      <p>
                        <strong>Address Not Found</strong>
                      </p>
                    )}
                  </>
                )}
                <div className="flex gap-2 mt-3">
                  {isEdit ? (
                    <Button variant="outline" onClick={() => setIsEdit(false)}>
                      Cancel
                    </Button>
                  ) : (
                    <>
                     {user.address && Object.keys(user.address).length > 0 ? (
                      <>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedUser(user); // Ensure selectedUser is set
                          setIsEdit(true);
                        }}
                      >
                        <Pencil className="w-4 h-4 mr-1" /> Edit
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleDeletePopup(user)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" /> Delete
                      </Button>
                    </>
                    ):(null)}</>
                   
                    
                  )}
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No address available</p>
            )}
          </div>
        </div>

        <Button className="w-full mt-4" onClick={closeModal}>
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetails;
