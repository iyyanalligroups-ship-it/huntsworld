import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, LayoutGrid, Layers } from "lucide-react";

const formatName = (v) =>
  v ? v.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "";

const slug = (v) => v?.toLowerCase().replace(/\s+/g, "-");

const CategorySidebar = ({ categories = [] }) => {
  const [openCategory, setOpenCategory] = useState(null);
  const navigate = useNavigate();

  return (
    /* Increased width to w-80 and removed h-screen to prevent double scrollbars */
    <div className="w-70 bg-white border-r border-gray-200 shadow-sm">
      <div className="px-6 py-5 border-b border-gray-50">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">
          All Categories
        </h3>
      </div>

      <nav className="py-2">
        {categories.map((cat) => {
          const isOpen = openCategory === cat.categoryId;
          const hasSubs = cat.subCategories?.length > 0;

          return (
            <div key={cat.categoryId} className="relative">
              {/* --- MAIN CATEGORY ITEM --- */}
              <button
                onClick={() => setOpenCategory(isOpen ? null : cat.categoryId)}
                className={`w-full flex items-center justify-between px-5 py-4 transition-colors ${
                  isOpen
                    ? "bg-blue-50/50 text-blue-700"
                    : "text-slate-600 hover:bg-gray-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-4">
                  <LayoutGrid
                    size={20}
                    className={isOpen ? "text-blue-600" : "text-slate-400"}
                  />
                  {/* Text alignment: left-aligned to prevent the "centered" look in your screenshot */}
                  <span className="font-medium text-[15px] text-left leading-tight">
                    {formatName(cat.categoryName)}
                  </span>
                </div>
                {hasSubs && (
                  <ChevronRight
                    size={18}
                    className={`transition-transform duration-300 opacity-60 ${isOpen ? "rotate-90" : ""}`}
                  />
                )}
              </button>

              {/* --- SUBMENU --- */}
              <div
                className={`overflow-hidden transition-all duration-500 ease-in-out ${
                  isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="bg-gray-50/50 pb-3">
                  {cat.subCategories?.map((sub) => (
                    <div key={sub.subCategoryName} className="pl-14 pr-4 py-2">
                      <div
                        className="text-sm font-semibold text-slate-700 cursor-pointer hover:text-blue-600 transition-colors"
                        onClick={() => navigate(`/subcategory-detail/${slug(sub.subCategoryName)}`)}
                      >
                        {formatName(sub.subCategoryName)}
                      </div>

                      <ul className="mt-2 space-y-2 border-l border-gray-200 ml-1 pl-4">
                        {sub.superSubCategories?.map((ss) => (
                          <li
                            key={ss.name}
                            className="text-[13px] text-slate-500 cursor-pointer hover:text-blue-500 transition-all"
                            onClick={() => navigate(`/products/super/${slug(ss.name)}`)}
                          >
                            {formatName(ss.name)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </nav>
    </div>
  );
};

export default CategorySidebar;
