import { useEffect, useState, useContext } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

import {
    useGetCategoryAccessQuery,
    useUpdateCategoryAccessMutation,
} from "@/redux/api/AccessApi"; // Adjust path based on your structure
import showToast from "@/toast/showToast";
import { AuthContext } from "@/modules/landing/context/AuthContext";

const AccessPage = () => {
    const { user } = useContext(AuthContext);
    const { data, isLoading, isFetching } = useGetCategoryAccessQuery(user?.user?._id, {
        skip: !user?.user?._id,
    });

    const [updateAccess, { isLoading: isUpdating }] = useUpdateCategoryAccessMutation();
    const [isCategoryEnabled, setIsCategoryEnabled] = useState(false);

    useEffect(() => {
        if (data?.data?.is_category !== undefined) {
            setIsCategoryEnabled(data.data.is_category);
        }
    }, [data]);

    const handleToggle = async (checked) => {
        setIsCategoryEnabled(checked);
        try {
            await updateAccess({ user_id: user.user._id, is_category: checked }).unwrap();
            showToast(`Category access ${checked ? "enabled" : "disabled"} successfully`, "success");
        } catch (error) {
            showToast(error?.data?.message || "Failed to update access", "error");
        }
    };


    if (isLoading || isFetching) return <div>Loading...</div>;

    return (
        <div className="p-6 bg-white rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Admin Settings</h2>
            <label htmlFor="category-toggle" className="flex items-center space-x-4 cursor-pointer">
                <span className="text-md font-medium">
                    Show Product Category on Homepage
                </span>
                <div className="relative">
                    <input
                        type="checkbox"
                        id="category-toggle"
                        className="sr-only"
                        checked={isCategoryEnabled}
                        onChange={(e) => handleToggle(e.target.checked)}
                        disabled={isUpdating}
                    />
                    <div
                        className={`block w-12 h-7 rounded-full transition-colors duration-300 ${isCategoryEnabled ? "bg-[#0c1f4d]" : "bg-gray-300"
                            }`}
                    ></div>
                    <div
                        className={`absolute left-1 top-1 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${isCategoryEnabled ? "translate-x-5" : ""
                            }`}
                    ></div>
                </div>
            </label>

        </div>
    );
};

export default AccessPage;
