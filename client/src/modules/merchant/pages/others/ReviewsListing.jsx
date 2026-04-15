import React, { useState, useEffect, useContext } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, AlertCircle,Star } from "lucide-react";
import axios from "axios";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import Loader from "@/loader/Loader";

function ReviewsListing() {
  const { user, logout } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const effectiveUser = user?.user;
    if (!effectiveUser) {
      setError("Please log in to view your products.");
      return;
    }

    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(
          `${API_URL}/products/fetch-all-products-for-seller/${effectiveUser._id}`,
          {
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
          }
        );
        const fetchedProducts = Array.isArray(response.data)
          ? response.data
          : [];
        setProducts(fetchedProducts);
        if (fetchedProducts.length === 0) {
          // setError("No products found for this seller.");
        }
      } catch (error) {
        let errorMessage = error.response?.data?.message || error.message;
        if (error.response?.status === 401) {
          errorMessage = "Session expired. Please log in again.";
          logout();
          sessionStorage.removeItem("token");
          sessionStorage.removeItem("user");
        }
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [user, logout, API_URL]);

  useEffect(() => {
    if (selectedProduct && selectedProduct !== "all") {
      const fetchReviews = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await axios.get(
            `${API_URL}/reviews/fetch-all-reviews-by-product/${selectedProduct}`,
            {
              headers: {
                Authorization: `Bearer ${sessionStorage.getItem("token")}`,
              },
            }
          );
          const fetchedReviews = Array.isArray(response.data)
            ? response.data
            : [];
          setReviews(fetchedReviews);
          if (fetchedReviews.length === 0) {
            // setError("No reviews found for this product.");
          }
        } catch (error) {
          let errorMessage = error.response?.data?.message || error.message;
          if (error.response?.status === 401) {
            errorMessage = "Session expired. Please log in again.";
            logout();
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("user");
          }
          setError(errorMessage);
        } finally {
          setLoading(false);
        }
      };
      fetchReviews();
    } else {
      setReviews([]);
    }
  }, [selectedProduct, logout, API_URL]);

  const handleSelectChange = (value) => {
    setSelectedProduct(value);
  };

  if (!user?.user) {
    return (
      <Alert className="mt-4" variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Not Logged In</AlertTitle>
        <AlertDescription>
          Please log in to view your products.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="p-2">
      <h1 className="text-md border-1 border-[#0c1f4d] text-[#0c1f4d] bg-gray-100 p-2 rounded-r-2xl w-36 font-bold">
        Product Reviews
      </h1>
      <div className="bg-white border mt-3 border-gray-200 rounded-xl p-4 shadow-sm max-w-xl flex gap-4">
        <div className="bg-amber-50 p-2 rounded-lg h-fit">
          <Star className="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-[#0c1f4d] mb-1">SOP: Review Management</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-[11px] text-gray-500 uppercase tracking-tight font-medium">
            <p>• Select product to load verified feedback.</p>
            <p>• Use ratings to assess supplier reliability.</p>
            <p>• Review comments for technical specifications.</p>
            <p>• Filter results for latest market sentiment.</p>
          </div>
        </div>
      </div>
      {/* Product Selector */}
      <div className="mb-6 mt-2">
        <Select
          onValueChange={handleSelectChange}
          value={selectedProduct}
          disabled={loading}
        >
          <SelectTrigger className="w-[300px] border-2 border-slate-300">
            <SelectValue placeholder="Select a product" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              Select the products in the below list
            </SelectItem>
            {products.length > 0 ? (
              products.map((product) => (
                <SelectItem key={product._id} value={product._id}>
                  {product.product_name || "Unnamed Product"}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="none" disabled>
                No products available
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Loading State */}
      {loading && <Loader contained={true} />}

      {/* Error State */}
      {error && !loading && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Reviews List */}
      {!loading && !error && reviews.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => (
            <Card
              key={review._id}
              className="shadow-md hover:shadow-lg transition-all"
            >
              <CardHeader>
                <CardTitle className="text-lg">
                  {review.userId?.name || "Anonymous"}
                </CardTitle>
                <CardDescription>
                  Rating: ⭐ {review.rating} / 5
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{review.comments}</p>
                <p className="mt-2 text-xs text-gray-400">
                  {new Date(review.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {!loading &&
        !error &&
        selectedProduct &&
        selectedProduct !== "all" &&
        reviews.length === 0 && (
          <div className="text-center py-16 px-6">
            <div className="bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-3.5m-9 0H4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No Reviews Yet
            </h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              This product hasn't received any reviews yet. Be the first one to
              share your experience!
            </p>
          </div>
        )}

      {/* Initial State - No Product Selected */}
      {!loading &&
        !error &&
        (!selectedProduct || selectedProduct === "all") && (
          <div className="text-center py-16 px-6">
            <div className="bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Select a Product
            </h3>
            <p className="text-gray-500 text-sm">
              Choose a product from the dropdown to view its reviews.
            </p>
          </div>
        )}
    </div>
  );
}

export default ReviewsListing;
