import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import axios from 'axios';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const API_URL = import.meta.env.VITE_API_URL;

function Subadmins() {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [subAdminUsers, setSubAdminUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRoles, setSelectedRoles] = useState({});
  const [roles, setRoles] = useState({ ADMIN: null, SUB_ADMIN: null, USER: null });

  useEffect(() => {
    const fetchRoleIds = async () => {
      try {
        const roleResponse = await axios.get(`${API_URL}/role/fetch-all-role`);
        const roleData = roleResponse.data?.data || [];
        const roleMap = {
          ADMIN: roleData.find((r) => r.role === 'ADMIN')?._id || null,
          SUB_ADMIN: roleData.find((r) => r.role === 'SUB_ADMIN')?._id || null,
          USER: roleData.find((r) => r.role === 'USER')?._id || null,
        };
        if (!roleMap.ADMIN || !roleMap.SUB_ADMIN || !roleMap.USER) {
          throw new Error('Required roles not found');
        }
        setRoles(roleMap);
      } catch (err) {
        console.error('Fetch role IDs error:', err);
        setError(err.message || 'Failed to fetch roles');
      }
    };

    const fetchAllUsers = async () => {
      try {
        const token = sessionStorage.getItem('token');
        if (!token) throw new Error('No authentication token found');

        const response = await axios.get(`${API_URL}/users/fetch-all-users`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const allUsers = Array.isArray(response.data.users)
          ? response.data.users
          : Array.isArray(response.data.data)
          ? response.data.data
          : Array.isArray(response.data)
          ? response.data
          : [];

        const initialRoles = {};
        allUsers.forEach((user) => {
          if (user._id) {
            initialRoles[user._id] = user.role?.role || 'USER';
          }
        });

        setSelectedRoles(initialRoles);
        setAdminUsers(allUsers.filter((u) => u.role?._id === roles.ADMIN));
        setSubAdminUsers(allUsers.filter((u) => u.role?._id === roles.SUB_ADMIN));
      } catch (err) {
        console.error('Fetch users error:', err);
        setError(err.message || 'Failed to fetch users');
      }
    };

    fetchRoleIds().then(() => {
      if (roles.ADMIN && roles.SUB_ADMIN && roles.USER) fetchAllUsers();
    });
  }, [roles.ADMIN, roles.SUB_ADMIN, roles.USER]);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setUsers([]);
    try {
      const response = await axios.get(`${API_URL}/users/lookup`, {
        params: { name: searchQuery, email: searchQuery, phone: searchQuery },
      });
      const filtered = response.data.users || [];
      console.log('Searched users:', filtered);

      // Validate and normalize user data
      const validUsers = filtered.filter(user => user.user_id && user.role).map(user => ({
        ...user,
        _id: user.user_id, // Add _id for consistency with other tables
      }));

      const newRoles = {};
      validUsers.forEach((user) => {
        if (user.user_id) newRoles[user.user_id] = user.role?.role || 'USER';
      });
      setSelectedRoles((prev) => ({ ...prev, ...newRoles }));
      setUsers(validUsers);
    } catch (err) {
      console.error('Search error:', err);
      setError(err.response?.data?.error || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (userId, newRole) => {
    setSelectedRoles((prev) => ({ ...prev, [userId]: newRole }));
  };

  const handleSaveRoleForUsers = async (userId) => {
    console.log('Saving role for userId:', userId, 'with role:', selectedRoles[userId]);
    if (!userId || typeof userId !== 'string') {
      setError('Invalid or missing user ID');
      return;
    }
    if (!selectedRoles[userId]) {
      setError('No role selected for this user');
      return;
    }

    const selectedRole = selectedRoles[userId];
    const roleId = roles[selectedRole];
    if (!roleId) {
      setError(`Role ID for "${selectedRole}" not found`);
      return;
    }

    try {
      const token = sessionStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      await axios.put(
        `${API_URL}/users/update-users-by-id/${userId}`,
        { role: roleId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Find the user to update
      const userToUpdate = users.find((u) => u.user_id === userId);
      if (!userToUpdate) {
        setError('User not found in searched users');
        return;
      }

      // Normalize user object to match adminUsers/subAdminUsers structure
      const updatedUser = {
        ...userToUpdate,
        _id: userId,
        role: { _id: roleId, role: selectedRole },
      };

      // Update state: Move user to appropriate table and remove from others
      if (selectedRole === 'ADMIN') {
        setAdminUsers((prev) => {
          if (!prev.some((u) => u._id === userId)) {
            return [...prev, updatedUser];
          }
          return prev.map((u) =>
            u._id === userId ? updatedUser : u
          );
        });
        setSubAdminUsers((prev) => prev.filter((u) => u._id !== userId));
      } else if (selectedRole === 'SUB_ADMIN') {
        setSubAdminUsers((prev) => {
          if (!prev.some((u) => u._id === userId)) {
            return [...prev, updatedUser];
          }
          return prev.map((u) =>
            u._id === userId ? updatedUser : u
          );
        });
        setAdminUsers((prev) => prev.filter((u) => u._id !== userId));
      } else {
        // If role is USER, remove from both admin and subadmin tables
        setAdminUsers((prev) => prev.filter((u) => u._id !== userId));
        setSubAdminUsers((prev) => prev.filter((u) => u._id !== userId));
      }

      // Remove user from searched users table
      setUsers((prev) => prev.filter((u) => u.user_id !== userId));

      // Update selectedRoles
      setSelectedRoles((prev) => ({ ...prev, [userId]: selectedRole }));
    } catch (err) {
      console.error('Save role error for Searched Users:', err);
      setError(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleSaveRole = async (userId) => {
    if (!userId || !selectedRoles[userId]) {
      setError('Invalid user ID or no role selected');
      return;
    }

    const selectedRole = selectedRoles[userId];
    const roleId = roles[selectedRole];
    if (!roleId) {
      setError(`Role ID for "${selectedRole}" not found`);
      return;
    }

    try {
      const token = sessionStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      await axios.put(
        `${API_URL}/users/update-users-by-id/${userId}`,
        { role: roleId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updateUser = (u) =>
        u._id === userId
          ? { ...u, role: { ...u.role, _id: roleId, role: selectedRole } }
          : u;

      setAdminUsers((prev) => {
        const updated = prev.map(updateUser);
        if (selectedRole === 'ADMIN') {
          const user = [...users.map(u => ({ ...u, _id: u.user_id })), ...subAdminUsers, ...prev].find((u) => u._id === userId);
          if (user && !prev.some((u) => u._id === userId)) {
            return [...updated, updateUser(user)];
          }
          return updated;
        }
        return updated.filter((u) => u._id !== userId);
      });

      setSubAdminUsers((prev) => {
        const updated = prev.map(updateUser);
        if (selectedRole === 'SUB_ADMIN') {
          const user = [...users.map(u => ({ ...u, _id: u.user_id })), ...adminUsers, ...prev].find((u) => u._id === userId);
          if (user && !prev.some((u) => u._id === userId)) {
            return [...updated, updateUser(user)];
          }
          return updated;
        }
        return updated.filter((u) => u._id !== userId);
      });

      setSelectedRoles((prev) => ({ ...prev, [userId]: selectedRole }));
    } catch (err) {
      console.error('Save role error:', err);
      setError(err.response?.data?.message || 'Failed to update role');
    }
  };

  const renderUserTable = (list, title, isSearchedUsers = false) => (
    <div className="mt-8">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      {list.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow className="bg-black ">
              <TableHead className="text-white">Name</TableHead>
              <TableHead className="text-white">Email</TableHead>
              <TableHead className="text-white">Phone</TableHead>
              <TableHead className="text-white">Role</TableHead>
              <TableHead className="text-white">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((user) => (
              <TableRow key={isSearchedUsers ? user.user_id : user._id} className="bg-white hover:bg-gray-100">
                <TableCell className="text-black">{user.name || 'N/A'}</TableCell>
                <TableCell className="text-black">{user.email || 'N/A'}</TableCell>
                <TableCell className="text-black">{user.phone || user.phone_number || 'N/A'}</TableCell>
                <TableCell className="text-black">
                  <Select
                    value={selectedRoles[isSearchedUsers ? user.user_id : user._id] || 'USER'}
                    onValueChange={(val) => handleRoleChange(isSearchedUsers ? user.user_id : user._id, val)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">User</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="SUB_ADMIN">Subadmin</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-black">
                  <Button
                    size="sm"
                    onClick={() =>
                      isSearchedUsers
                        ? handleSaveRoleForUsers(user.user_id)
                        : handleSaveRole(user._id)
                    }
                    disabled={selectedRoles[isSearchedUsers ? user.user_id : user._id] === user.role?.role}
                  >
                    Save
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-gray-500">No users found for this role.</div>
      )}
    </div>
  );

  return (
    <div className="p-4">
      <div className="flex items-center space-x-2 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            type="text"
            placeholder="Search by name, email, or phone..."
            className="pl-10 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </Button>
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <div>
        {[
          { list: users, title: 'Searched Users', key: 'searched-users', isSearchedUsers: true },
          { list: adminUsers, title: 'Admin ', key: 'admin-users', isSearchedUsers: false },
          {
            list: subAdminUsers,
            title: 'Subadmin ', key: 'subadmin-users', isSearchedUsers: false,
          },
        ].map(({ list, title, key, isSearchedUsers }) => (
          <div key={key}>{renderUserTable(list, title, isSearchedUsers)}</div>
        ))}
      </div>
    </div>
  );
}

export default Subadmins;