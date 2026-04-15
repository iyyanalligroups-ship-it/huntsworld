// pages/pages/categorySection/ProductList.jsx

const ProductList = ({ category, subCategory, deepSubCategory }) => {
    // You'd normally fetch from API using deepSubCategory
    const mockProducts = [
      { id: 1, name: "iPhone 14 Pro" },
      { id: 2, name: "Samsung Galaxy S22" },
    ];
  
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">
          Products under "{deepSubCategory}"
        </h2>
        <ul className="grid grid-cols-2 gap-4">
          {mockProducts.map((product) => (
            <li
              key={product.id}
              className="p-4 border rounded shadow hover:shadow-md transition"
            >
              {product.name}
            </li>
          ))}
        </ul>
      </div>
    );
  };
  
  export default ProductList;
  