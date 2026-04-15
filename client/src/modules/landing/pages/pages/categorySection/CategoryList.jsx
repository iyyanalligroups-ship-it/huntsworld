// pages/pages/categorySection/CategoryList.jsx

import { Link } from "react-router-dom";

const categories = [
  { name: "electronics", displayName: "Electronics" },
  { name: "fashion", displayName: "Fashion" },
];

const CategoryList = () => {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">All Categories</h2>
      <ul className="space-y-2">
        {categories.map((cat) => (
          <li key={cat.name}>
            <Link
              to={`/all-categories/${cat.name}`}
              className="text-blue-600 hover:underline"
            >
              {cat.displayName}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CategoryList;
