// import React, { useContext, useState } from "react";
// import menuItems from "@/modules/subAdmin/utils/Menuitem"; // Adjust path
// import { useRequestAccessMutation } from "@/redux/api/SubAdminAccessRequestApi";
// import showToast from "@/toast/showToast";
// import { Checkbox } from "@/components/ui/checkbox";
// import { Button } from "@/components/ui/button";
// import { Send, RotateCcw, Undo2, Redo2 } from "lucide-react";
// import { AuthContext } from "@/modules/landing/context/AuthContext";

// // Helper to flatten menu items and get unique routes
// const flattenRoutes = (items) => {
//   let routes = [];
//   items.forEach((item) => {
//     if (item.link) routes.push(item.link);
//     if (item.children) routes = [...routes, ...flattenRoutes(item.children)];
//   });
//   return [...new Set(routes)];
// };

// const AccessRequestForm = () => {
//   const {user}=useContext(AuthContext);
//   const [permissions, setPermissions] = useState({});
//   const [history, setHistory] = useState([{}]);
//   const [historyIndex, setHistoryIndex] = useState(0);

//   const [requestAccess] = useRequestAccessMutation();
//   const allPages = flattenRoutes(menuItems);

//   const updatePermissions = (newPermissions) => {
//     const newHistory = history.slice(0, historyIndex + 1);
//     newHistory.push(newPermissions);
//     setHistory(newHistory);
//     setHistoryIndex(newHistory.length - 1);
//     setPermissions(newPermissions);
//   };

//   const handleCheckboxChange = (page, action) => {
//     const prev = { ...permissions };
//     const pagePerms = prev[page] || { page, actions: [] };
//     const newActions = pagePerms.actions.includes(action)
//       ? pagePerms.actions.filter((a) => a !== action)
//       : [...pagePerms.actions, action];
//     const newPermissions = {
//       ...prev,
//       [page]: { page, actions: newActions },
//     };
//     updatePermissions(newPermissions);
//   };

//   const handleReset = () => updatePermissions({});
//   const handleUndo = () => {
//     if (historyIndex > 0) {
//       const prevIndex = historyIndex - 1;
//       setHistoryIndex(prevIndex);
//       setPermissions(history[prevIndex]);
//     }
//   };
//   const handleRedo = () => {
//     if (historyIndex < history.length - 1) {
//       const nextIndex = historyIndex + 1;
//       setHistoryIndex(nextIndex);
//       setPermissions(history[nextIndex]);
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     const permissionList = Object.values(permissions).filter(
//       (p) => p.actions.length > 0
//     );
//     if (permissionList.length === 0) {
//       showToast("Select at least one page and action", "error");
//       return;
//     }
//     try {
//       await requestAccess({
//         requester_id: user?.user?._id,
//         permissions: permissionList,
//       }).unwrap();
//       showToast("Access request sent", "success");
//       setPermissions({});
//       setHistory([{}]);
//       setHistoryIndex(0);
//     } catch (error) {
//       showToast("Failed to send request", error);
//     }
//   };

//   return (
//     <form onSubmit={handleSubmit} className="p-4">
//       <h2 className="text-lg font-bold mb-4">Request Access to Pages</h2>
//       <div className="grid grid-cols-2 gap-4">
//         {allPages.map((page) => (
//           <div key={page} className="border rounded-md p-2">
//             <p className="font-medium mb-2">{page}</p>
//             <label className="flex items-center gap-2 mb-1">
//               <Checkbox
//                 checked={permissions[page]?.actions.includes("edit") || false}
//                 onCheckedChange={() => handleCheckboxChange(page, "edit")}
//               />
//               <span>Edit</span>
//             </label>
//             <label className="flex items-center gap-2">
//               <Checkbox
//                 checked={permissions[page]?.actions.includes("delete") || false}
//                 onCheckedChange={() => handleCheckboxChange(page, "delete")}
//               />
//               <span>Delete</span>
//             </label>
//           </div>
//         ))}
//       </div>

//       {/* Action Buttons */}
//       <div className="flex gap-2 mt-6 flex-wrap">
//         <Button
//           type="submit"
//           className="bg-[#0c1f4d] text-white flex items-center gap-2"
//         >
//           <Send size={16} /> Submit
//         </Button>
//         <Button
//           type="button"
//           variant="outline"
//           onClick={handleReset}
//           className="flex items-center gap-2"
//         >
//           <RotateCcw size={16} /> Reset
//         </Button>
//         <Button
//           type="button"
//           variant="outline"
//           onClick={handleUndo}
//           disabled={historyIndex === 0}
//           className="flex items-center gap-2"
//         >
//           <Undo2 size={16} /> Undo
//         </Button>
//         <Button
//           type="button"
//           variant="outline"
//           onClick={handleRedo}
//           disabled={historyIndex === history.length - 1}
//           className="flex items-center gap-2"
//         >
//           <Redo2 size={16} /> Redo
//         </Button>
//       </div>
//     </form>
//   );
// };


import React, { useContext, useState } from "react";
import menuItems from "@/modules/subAdmin/utils/Menuitem"; // Adjust path
import { useRequestAccessMutation } from "@/redux/api/SubAdminAccessRequestApi";
import { useGetUserByIdQuery } from "@/redux/api/SubAdminAccessRequestApi";
import showToast from "@/toast/showToast";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Send, RotateCcw, Undo2, Redo2 } from "lucide-react";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import { Badge } from "@/components/ui/badge";

// Helper to flatten menu items and get unique routes
const flattenRoutes = (items) => {
  let routes = [];
  items.forEach((item) => {
    if (item.link) routes.push(item.link);
    if (item.children) routes = [...routes, ...flattenRoutes(item.children)];
  });
  return [...new Set(routes)];
};

const AccessRequestForm = () => {
  const { user } = useContext(AuthContext);
  const userId = user?.user?._id;
  const { data: currentUser, isError: isUserError, error: userError, isLoading } = useGetUserByIdQuery(userId, { skip: !userId });

  const [permissions, setPermissions] = useState({});
  const [history, setHistory] = useState([{}]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [requestAccess] = useRequestAccessMutation();
  const allPages = flattenRoutes(menuItems);

  // Map approved permissions for easy lookup
  const approvedPermissions = currentUser?.approved_permissions?.reduce((acc, perm) => {
    acc[perm.page] = perm.actions;
    return acc;
  }, {}) || {};

  if (isLoading) {
    return <p className="text-center text-gray-600">Loading permissions...</p>;
  }

  if (isUserError) {
    console.error("Error fetching user permissions:", userError);
    showToast("Failed to load user permissions", "error");
  }

  const updatePermissions = (newPermissions) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newPermissions);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setPermissions(newPermissions);
  };

  const handleCheckboxChange = (page, action) => {
    if (approvedPermissions[page]?.includes(action)) {
      return;
    }
    const prev = { ...permissions };
    const pagePerms = prev[page] || { page, actions: [] };
    const newActions = pagePerms.actions.includes(action)
      ? pagePerms.actions.filter((a) => a !== action)
      : [...pagePerms.actions, action];
    const newPermissions = {
      ...prev,
      [page]: { page, actions: newActions },
    };
    updatePermissions(newPermissions);
  };

  const handleReset = () => updatePermissions({});
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setPermissions(history[prevIndex]);
    }
  };
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setPermissions(history[nextIndex]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const permissionList = Object.values(permissions)
      .filter((p) => p.actions.length > 0)
      .map((p) => ({
        page: p.page,
        actions: p.actions.filter((action) => !approvedPermissions[p.page]?.includes(action)),
      }))
      .filter((p) => p.actions.length > 0);
    if (permissionList.length === 0) {
      showToast("Select at least one non-approved action for a page", "error");
      return;
    }
    try {
      await requestAccess({
        requester_id: userId,
        permissions: permissionList,
      }).unwrap();
      showToast("Access request sent successfully", "success");
      setPermissions({});
      setHistory([{}]);
      setHistoryIndex(0);
    } catch (error) {
      showToast("Failed to send access request", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 max-w-6xl mx-auto">
      <h2 className="text-lg font-bold mb-4">Request Access to Pages</h2>
      {allPages.length === 0 && (
        <p className="text-gray-600">No pages available to request access for.</p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {allPages.map((page) => (
          <div key={page} className="border rounded-md p-3 bg-white shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium text-gray-800">{page}</p>
              {approvedPermissions[page]?.length > 0 && (
                <Badge className="bg-green-500 text-white">
                  Approved: {approvedPermissions[page].join(", ")}
                </Badge>
              )}
            </div>
            <label className="flex items-center gap-2 mb-2">
              <Checkbox
                checked={permissions[page]?.actions.includes("edit") || approvedPermissions[page]?.includes("edit") || false}
                onCheckedChange={() => handleCheckboxChange(page, "edit")}
                disabled={approvedPermissions[page]?.includes("edit")}
                className={approvedPermissions[page]?.includes("edit") ? "opacity-50" : ""}
              />
              <span>Edit</span>
            </label>
            <label className="flex items-center gap-2">
              <Checkbox
                checked={permissions[page]?.actions.includes("delete") || approvedPermissions[page]?.includes("delete") || false}
                onCheckedChange={() => handleCheckboxChange(page, "delete")}
                disabled={approvedPermissions[page]?.includes("delete")}
                className={approvedPermissions[page]?.includes("delete") ? "opacity-50" : ""}
              />
              <span>Delete</span>
            </label>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-6 flex-wrap justify-center">
        <Button
          type="submit"
          className="bg-[#0c1f4d] text-white flex items-center gap-2 hover:bg-[#0c1f4d]"
        >
          <Send size={16} /> Submit Request
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          className="flex items-center gap-2"
        >
          <RotateCcw size={16} /> Reset
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleUndo}
          disabled={historyIndex === 0}
          className="flex items-center gap-2"
        >
          <Undo2 size="16" /> Undo
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleRedo}
          disabled={historyIndex === history.length - 1}
          className="flex items-center gap-2"
        >
          <Redo2 size={16} /> Redo
        </Button>
      </div>
    </form>
  );
};

export default AccessRequestForm;