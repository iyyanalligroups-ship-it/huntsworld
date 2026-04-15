import React, { useState } from 'react';
import { useSidebar } from "../../hooks/useSidebar";
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2 } from 'lucide-react';

// Create a QueryClient instance
const queryClient = new QueryClient();

const fetchRoles = async () => {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/role/fetch-all-role`);
  if (!response.ok) {
    throw new Error('Failed to fetch roles');
  }
  return response.json();
};

const RoleListContent = () => {
  const { isSidebarOpen } = useSidebar();
  const [searchTerm, setSearchTerm] = useState('');
  const [newRole, setNewRole] = useState('');
  const [editRole, setEditRole] = useState({ id: null, role: '' });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['roles'],
    queryFn: fetchRoles,
  });

  const handleSearch = () => {

  };

  const handleAddRole = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/role/create-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole.toUpperCase() }),
      });
      if (response.ok) {
        setIsDialogOpen(false);
        setNewRole('');
        refetch();
      } else {
        console.error('Failed to add role');
      }
    } catch (error) {
      console.error('Error adding role:', error);
    }
  };

  const handleEditRole = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/role/update-role-by-id/${editRole.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: editRole.role.toUpperCase() }),
      });
      if (response.ok) {
        setIsEditDialogOpen(false);
        setEditRole({ id: null, role: '' });
        refetch();
      } else {
        console.error('Failed to update role');
      }
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  const handleDeleteRole = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/role/delete-role-by-id/${roleToDelete}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setIsDeleteDialogOpen(false);
        setRoleToDelete(null);
        refetch();
      } else {
        console.error('Failed to delete role');
      }
    } catch (error) {
      console.error('Error deleting role:', error);
    }
  };

  const filteredRoles = data?.data?.filter((role) =>
    role.role.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className={`${isSidebarOpen ? 'p-6 lg:ml-56' : 'p-4 lg:ml-16'} min-h-screen bg-gray-50`}>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Role Management</h1>
        
        {/* Search and Add Role Controls */}
        <div className="flex gap-4 mb-6">
          <Input
            placeholder="Search roles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Button onClick={handleSearch}>Search</Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>Add Role</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Role</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    placeholder="Enter role name"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={handleAddRole} disabled={!newRole}>
                Create Role
              </Button>
            </DialogContent>
          </Dialog>
        </div>

        {/* Roles Table */}
        {isLoading ? (
          <div>Loading...</div>
        ) : error ? (
          <div>Error: {error.message}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-black hover:bg-gray-700">
                <TableHead className="text-white">ID</TableHead>
                <TableHead className="text-white">Role</TableHead>
                <TableHead className="text-white">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoles.length > 0 ? (
                filteredRoles.map((role) => (
                  <TableRow key={role.id} className="bg-white hover:bg-gray-100 text-black">
                    <TableCell>{role.id}</TableCell>
                    <TableCell>{role.role}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditRole({ id: role.id, role: role.role });
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setRoleToDelete(role.id);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow className="bg-white text-black">
                  <TableCell colSpan={3} className="text-center">
                    No roles found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}

        {/* Edit Role Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Role</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-role">Role</Label>
                <Input
                  id="edit-role"
                  placeholder="Enter role name"
                  value={editRole.role}
                  onChange={(e) => setEditRole({ ...editRole, role: e.target.value })}
                />
              </div>
            </div>
            <Button onClick={handleEditRole} disabled={!editRole.role}>
              Update Role
            </Button>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Delete</DialogTitle>
            </DialogHeader>
            <p>Are you sure you want to delete this role?</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteRole}>
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

const RoleList = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <RoleListContent />
    </QueryClientProvider>
  );
};

export default RoleList;