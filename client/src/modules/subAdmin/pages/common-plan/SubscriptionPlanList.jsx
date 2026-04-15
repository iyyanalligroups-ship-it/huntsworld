import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGetUserByIdQuery } from '@/redux/api/SubAdminAccessRequestApi';
import showToast from '@/toast/showToast';

const SubscriptionPlanList = ({ data, onEdit, onDelete, userId, currentPage = '/subAdmin/plans/banners' }) => {
  const { data: user, isError, error } = useGetUserByIdQuery(userId, { skip: !userId });

  // Check if user has specific actions for the current page
  const pagePermissions = user?.permissions?.find(p => p.page === currentPage);
  const canEdit = pagePermissions?.actions.includes('edit');
  const canDelete = pagePermissions?.actions.includes('delete');

  if (isError) {
    console.error('Error fetching user permissions:', error);
    showToast('Failed to load user permissions', 'error');
  }

  return (
    <div className="w-full overflow-x-scroll rounded-md border">
      <table className="min-w-[200px] w-full text-sm text-left text-gray-700">
        <caption className="p-4 text-left text-gray-900 font-semibold bg-gray-100">
          All available subscription plans
        </caption>
        <thead className="bg-gray-200 text-gray-700 uppercase text-xs">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3">Duration Type</th>
            <th className="px-4 py-3">Value</th>
            <th className="px-4 py-3">Price</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data?.data?.map((plan) => (
            <tr key={plan._id} className="border-t">
              <td className="px-4 py-2">{plan.name}</td>
              <td className="px-4 py-2">{plan.category}</td>
              <td className="px-4 py-2">{plan.durationType}</td>
              <td className="px-4 py-2">
                <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                  {plan.durationValue}
                </span>
              </td>
              <td className="px-4 py-2">
                <span className="inline-block bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                  ₹{plan.price}
                </span>
              </td>
              <td className="px-4 py-2 text-right flex gap-2 justify-end">
                <Button
                  size="sm"
                  className="bg-[#0c1f4d] hover:bg-[#0c1f4dcb]"
                  onClick={() => onEdit(plan)}
                  disabled={!canEdit}
                  title={!canEdit ? 'You do not have permission to edit plans' : 'Edit plan'}
                >
                  <Pencil size={16} />
                </Button>
                <Button
                  size="sm"
                  className="bg-red-600 hover:bg-red-500"
                  onClick={() => onDelete(plan._id, plan.name)}
                  disabled={!canDelete}
                  title={!canDelete ? 'You do not have permission to delete plans' : 'Delete plan'}
                >
                  <Trash2 size={16} />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SubscriptionPlanList;