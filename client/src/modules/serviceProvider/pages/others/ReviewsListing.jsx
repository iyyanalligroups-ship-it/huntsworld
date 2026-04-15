import React, { useState, useEffect, useContext } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Info, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { AuthContext } from '@/modules/landing/context/AuthContext';

function ReviewsListing() {
  const { user, logout } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [reviews, setReviews] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL;

  // Fetch products for logged-in merchant via service provider
  useEffect(() => {
    console.log('User object:', user);
    console.log('API_URL:', API_URL);
    const token = sessionStorage.getItem('token');
    console.log('Token:', token);

    if (!user || !user.user?._id) {
      setError('Please log in to view your products.');
      return;
    }

    const fetchProducts = async () => {
      setLoadingProducts(true);
      setError(null);
      try {
        console.log('Fetching products for user ID:', user.user._id);
        const productsResponse = await axios.get(
          `${API_URL}/products/fetch-all-products-by-service-provider-user-id/${user.user._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('Products Response:', productsResponse.data);

        const fetchedProducts = Array.isArray(productsResponse.data.products) ? productsResponse.data.products : [];
        setProducts(fetchedProducts);
        if (fetchedProducts.length === 0) {
          setError('No products found for this service provider.');
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        let errorMessage = error.response?.data?.message || error.message;
        if (error.response?.status === 401) {
          errorMessage = 'Session expired. Please log in again.';
          logout();
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
        }
        setError(errorMessage);
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, [user, logout, API_URL]);

  // Automatically select the first product if available
  useEffect(() => {
    if (products.length > 0 && !selectedProduct) {
      setSelectedProduct(products[0]._id);
    }
  }, [products, selectedProduct]);

  // Fetch reviews for selected product
  useEffect(() => {
    if (selectedProduct && selectedProduct !== 'all' && selectedProduct !== 'none') {
      const fetchReviews = async () => {
        setLoadingReviews(true);
        setError(null); // Clear any previous errors
        try {
          console.log('Fetching reviews for product ID:', selectedProduct);
          const token = sessionStorage.getItem('token');
          const response = await axios.get(
            `${API_URL}/reviews/fetch-all-reviews-by-product/${selectedProduct}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          console.log('Reviews Response:', response.data);

          const fetchedReviews = Array.isArray(response.data) ? response.data : [];
          setReviews(fetchedReviews);
        } catch (error) {
          console.error('Error fetching reviews:', error);
          let errorMessage = error.response?.data?.message || error.message;
          if (error.response?.status === 401) {
            errorMessage = 'Session expired. Please log in again.';
            logout();
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');
          }
          setError(errorMessage);
        } finally {
          setLoadingReviews(false);
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

  const isProfileNotFoundError = (errMsg) => {
    return errMsg && (
      errMsg.includes('merchant not found') ||
      errMsg.includes('service provider') ||
      errMsg.includes('not found for this user')
    );
  };

  if (!user || !user.user?._id) {
    return (
      <Alert className="mt-4" variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Not Logged In</AlertTitle>
        <AlertDescription>Please log in to view your products.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className=" max-w-5xl mx-auto">
    <h2 className="text-md border-1 border-[#0c1f4d] text-[#0c1f4d] bg-gray-100 p-2  rounded-r-2xl w-44 font-bold">Product Reviews</h2>

      {/* Product Selector */}
      <div className="mb-6 p-4">
        <Select onValueChange={handleSelectChange} value={selectedProduct} disabled={loadingProducts}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Select a product" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Select a product</SelectItem>
            {products.length > 0 ? (
              products.map((product) => (
                <SelectItem key={product._id} value={product._id}>
                  {product.product_name || 'Unnamed Product'}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="none" disabled>No products available</SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Loading State for Products */}
      {loadingProducts && (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      )}

      {/* Loading State for Reviews */}
      {loadingReviews && (
        <div className="flex items-center justify-center text-gray-500 mt-6">
          <Info className="w-5 h-5 mr-2" />
          Loading reviews...
        </div>
      )}

      {/* Error State */}
      {error && !loadingProducts && !loadingReviews && (
        <Alert variant={isProfileNotFoundError(error) ? "default" : "destructive"} className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{isProfileNotFoundError(error) ? "Profile Setup Required" : "Error"}</AlertTitle>
          <AlertDescription>
            {error}
            {isProfileNotFoundError(error) && (
              <>
                <br />
                Please create your service provider profile to view your products and reviews.
                <div className="mt-2">
                  <Button asChild size="sm">
                    <a href="/create-service-provider">Create Profile</a>
                  </Button>
                </div>
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Reviews List */}
      {!loadingProducts && !loadingReviews && !error && reviews.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => (
            <Card key={review._id} className="shadow-md hover:shadow-lg transition-all">
              <CardHeader>
                <CardTitle className="text-lg">{review.userId?.name || review.userId?._id || 'Anonymous'}</CardTitle>
                <CardDescription>Rating: ⭐ {review.rating} / 5</CardDescription>
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

      {/* Empty State */}
      {!loadingProducts && !loadingReviews && !error && selectedProduct && selectedProduct !== 'all' && selectedProduct !== 'none' && reviews.length === 0 && (
        <div className="flex items-center justify-center text-gray-500 mt-6">
          <Info className="w-5 h-5 mr-2" />
          No reviews found for this product.
        </div>
      )}
    </div>
  );
}

export default ReviewsListing;