import { useState } from 'react';
import { useGetAllUsersQuery } from '@/redux/api/SubDealerApi';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const UserSelect = ({ nextStep, prevStep, updateFormData, formData }) => {
  const [selected, setSelected] = useState(formData.user_id || '');
  const { data, isLoading, isError } = useGetAllUsersQuery();
  const users = data?.data || [];

  const handleNext = () => {
    if (!selected) return;
    updateFormData({ user_id: selected });
    nextStep();
  };

  return (
    <div className="space-y-4">
      <Label>Select User</Label>
      {isLoading ? (
        <p className="text-sm text-gray-500">Loading users...</p>
      ) : isError ? (
        <p className="text-sm text-red-500">Failed to load users.</p>
      ) : (
        <Select onValueChange={setSelected} value={selected}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="-- Select User --" />
          </SelectTrigger>
          <SelectContent>
            {users.map((u) => (
              <SelectItem key={u._id} value={u._id}>
                {u.name} – {u.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <div className="flex justify-between">
        <Button variant="outline" onClick={prevStep}>
          Back
        </Button>
        <Button variant="outline" onClick={handleNext} disabled={!selected}>
          Next
        </Button>
      </div>
    </div>
  );
};

export default UserSelect;