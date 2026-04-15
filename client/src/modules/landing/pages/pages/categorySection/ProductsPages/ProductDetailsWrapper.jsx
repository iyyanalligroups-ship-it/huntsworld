// src/pages/ProductDetailsWrapper.jsx
import { useParams } from "react-router-dom";
import ProductDetailsPage from "./ProductDetailsPage";

const ProductDetailsWrapper = () => {
  const { productId } = useParams();
  return <ProductDetailsPage  />;
};

export default ProductDetailsWrapper;
