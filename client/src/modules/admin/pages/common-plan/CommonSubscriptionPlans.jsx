import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    useGetAllPlansQuery,
    useCreatePlanMutation,
    useUpdatePlanMutation,
    useDeletePlanMutation
} from '@/redux/api/CommonSubscriptionPlanApi';
import SubscriptionPlanForm from './SubscriptionPlanForm';
import SubscriptionPlanList from './SubscriptionPlanList';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';
import { useSidebar } from '@/modules/admin/hooks/useSidebar';
import showToast from '@/toast/showToast';

const SubscriptionPlans = () => {
    const { data, isLoading } = useGetAllPlansQuery();
    const { isSidebarOpen } = useSidebar();
    const [createPlan] = useCreatePlanMutation();
    const [updatePlan] = useUpdatePlanMutation();
    const [deletePlan] = useDeletePlanMutation();
    const [deleteInfo, setDeleteInfo] = useState({ id: null, name: '' });

    const [formOpen, setFormOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [editData, setEditData] = useState(null);

    const handleSave = async (form) => {
        try {
            if (editData) {
                const response = await updatePlan({ id: editData._id, ...form }).unwrap();
                showToast(response.message || 'Plan updated successfully', 'success');
            } else {
                const response = await createPlan(form).unwrap();
                showToast(response.message || 'Plan created successfully', 'success');
            }
            setFormOpen(false);
            setEditData(null);
        } catch (error) {
            const message = error?.data?.message || 'Something went wrong';
            showToast(message, 'error');
        }
    };

    const handleDelete = async () => {
        try {
            const response = await deletePlan(deleteInfo.id).unwrap();
            showToast(response.message || 'Plan deleted successfully', 'success');
            setDeleteInfo({ id: null, name: '' });
        } catch (error) {
            const message = error?.data?.message || 'Failed to delete';
            showToast(message, 'error');
        }
    };


    return (
        <div
            className={`flex-1 p-4 transition-all duration-300 ${isSidebarOpen
                ? 'ml-1 sm:ml-64'
                : 'ml-1 sm:ml-16'
                }`}
        >
            <div className="space-y-4 p-4">
                <div className="flex justify-between">
                    <h1 className="text-xl font-semibold text-[#0c1f4d]">Subscription Plans</h1>
                    <Button
                        className="bg-[#0c1f4d] hover:bg-[#0c1f4dcb] cursor-pointer"
                        onClick={() => {
                            setEditData(null); 
                            setFormOpen(true); 
                        }}
                    >
                        + Add Plan
                    </Button>

                </div>

                {isLoading ? (
                    <div className="space-y-4">
                        {Array.from({ length: 5 }).map((_, index) => (
                            <div key={index} className="flex items-center justify-between gap-4 p-4 border rounded-md">
                                <Skeleton className="h-5 w-1/4" />
                                <Skeleton className="h-5 w-1/4" />
                                <Skeleton className="h-5 w-20" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <SubscriptionPlanList
                        data={data}
                        onEdit={(plan) => {
                            setEditData(plan);
                            setFormOpen(true);
                        }}
                        onDelete={(id, name) => setDeleteInfo({ id, name })}

                    />
                )}

                <SubscriptionPlanForm
                    open={formOpen}
                    onClose={() => {
                        setFormOpen(false);
                        setEditData(null);
                    }}
                    onSubmit={handleSave}
                    initialData={editData}
                />

                <ConfirmDeleteDialog
                    open={!!deleteInfo.id}
                    onClose={() => setDeleteInfo({ id: null, name: '' })}
                    onConfirm={handleDelete}
                    name={deleteInfo.name}
                />

            </div>
        </div>
    );
};

export default SubscriptionPlans;
