import React from "react";

const Sidebar = ({ categories = [], selected, onSelect }) => {
  // Defensive fallback if categories is undefined or not an array
  if (!Array.isArray(categories) || categories.length === 0) {
    return (
      <div className="w-full md:w-60 bg-white rounded shadow p-4">
        <h2 className="text-lg font-semibold mb-3">Related Categories</h2>
        <p className="text-gray-500 text-sm">No categories available.</p>
      </div>
    );
  }

  return (
    <div className="w-full md:w-60 bg-white rounded shadow p-4 sticky top-4 self-start max-h-[80vh] overflow-y-auto">
      <h2 className="text-lg font-semibold mb-3">Related Categories</h2>
      <ul className="space-y-2">
        {categories.map((cat, index) => (
          <li
            key={index}
            onClick={() => onSelect(cat.deep_sub_category_name)}
            className={`cursor-pointer p-2 rounded hover:bg-gray-100 flex items-center gap-3 ${
              selected === cat.deep_sub_category_name ? "bg-gray-200 font-semibold" : ""
            }`}
          >
            {cat.deep_sub_category_image ? (
              <img
                src={cat.deep_sub_category_image}
                alt={cat.deep_sub_category_name}
                className="w-10 h-10 object-cover rounded"
              />
            ) : (
              <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                No Img
              </div>
            )}
            <span>{cat.deep_sub_category_name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
