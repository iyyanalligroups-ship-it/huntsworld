
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import axios from 'axios';

const Stepper1 = ({ onUserSelected, formData, isEditMode }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  const handleSearch = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/lookup?name=${searchQuery}`);
      setSearchResults(response.data.users || []);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    }
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    onUserSelected(user.user_id);
  };

  useEffect(() => {
    if (isEditMode && formData.user_id) {
      const fetchUser = async () => {
        try {
          const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/lookup?user_id=${formData.user_id}`);
          const user = response.data.users[0];
          if (user) {
            setSelectedUser(user);
            onUserSelected(user.user_id);
          }
        } catch (error) {
          console.error('Error fetching user for edit:', error);
        }
      };
      fetchUser();
    }
  }, [formData.user_id, onUserSelected, isEditMode]);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Search User</label>
        <div className="flex space-x-2">
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter name, email, or phone number"
            className="w-full"
            disabled={isEditMode}
          />
          <Button onClick={handleSearch} disabled={isEditMode}>
            Search
          </Button>
        </div>
      </div>
      {searchResults.length > 0 && !isEditMode && (
        <div>
          <h3 className="text-sm font-medium">Search Results</h3>
          <ul className="space-y-2 mt-2">
            {searchResults.map((user) => (
              <li
                key={user.user_id}
                className={`p-2 border rounded cursor-pointer ${selectedUser?.user_id === user.user_id ? 'bg-blue-100' : ''}`}
                onClick={() => handleSelectUser(user)}
              >
                <p><strong>Name:</strong> {user.name}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Phone:</strong> {user.phone_number}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
      {selectedUser && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Selected User Details</h3>
          <div>
            <label className="block text-sm font-medium">Name</label>
            <Input
              type="text"
              value={selectedUser.name}
              readOnly
              disabled
              className="w-full bg-gray-100 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Email</label>
            <Input
              type="email"
              value={selectedUser.email}
              readOnly
              disabled
              className="w-full bg-gray-100 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Phone Number</label>
            <Input
              type="text"
              value={selectedUser.phone_number}
              readOnly
              disabled
              className="w-full bg-gray-100 cursor-not-allowed"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Stepper1;
