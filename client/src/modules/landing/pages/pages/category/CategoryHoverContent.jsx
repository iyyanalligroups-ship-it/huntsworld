
// CategoryHoverContent Component
const CategoryHoverContent = ({ category }) => {
    return (
      <div className="flex-1 p-6">
        <h2 className="text-lg font-semibold mb-4 text-[#0c1f4d]">
          {category?.label || "Explore"}
        </h2>
        <p className="text-gray-600">
          {category
            ? `Explore top deals and offers in ${category.label}.`
            : "Hover a category to see more..."}
        </p>
      </div>
    );
  };
  export default CategoryHoverContent;