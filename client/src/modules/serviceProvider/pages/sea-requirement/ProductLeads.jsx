import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '@/modules/landing/context/AuthContext';
import axios from 'axios';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useSidebar } from '@/modules/admin/hooks/useSidebar';

function ProductLeads() {
  const { isSidebarOpen } = useSidebar();
  const { user, token } = useContext(AuthContext);
  const [serviceProviderId, setServiceProviderId] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(''); // Added for success message
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

  const fetchServiceProviderId = async () => {
    if (!user || !user.user?._id) {
      setError('User not logged in or user ID is missing');
      return;
    }
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/service-providers/fetch-by-user-id/${user.user?._id}`,
        {
          headers: {
            Authorization: `Bearer ${token || sessionStorage.getItem('token')}`,
          },
        }
      );
      if (response.data.success && response.data.data) {
        setServiceProviderId(response.data.data._id);
        setError('');
      } else {
        setError(response.data.message || 'Service provider not found');
      }
    } catch (err) {
      console.error('Error fetching service provider:', err);
      setError(err.response?.data?.message || 'Failed to fetch service provider details');
    } finally {
      setLoading(false);
    }
  };

  const fetchProductQuotes = async () => {
    if (!serviceProviderId) return;
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/product-quotes/fetch-product-quotes-by-owner?ownerId=${serviceProviderId}`,
        {
          headers: {
            Authorization: `Bearer ${token || sessionStorage.getItem('token')}`,
          },
        }
      );
      if (response.data.success) {
        setQuotes(response.data.quote || []);
        setError('');
      } else {
        setError(response.data.message || 'No quotes found');
      }
    } catch (err) {
      console.error('Error fetching quotes:', err);
      setError(err.response?.data?.message || 'Failed to fetch product quotes');
    } finally {
      setLoading(false);
    }
  };

  const handleRespondToQuote = async (quoteId) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const response = await axios.post(
        `${API_BASE_URL}/product-quotes/respond-to-customer`,
        { quoteId },
        {
          headers: {
            Authorization: `Bearer ${token || sessionStorage.getItem('token')}`,
          },
        }
      );
      if (response.data.success) {
        setSuccess(`Response recorded successfully. Points: ${response.data.viewPoints}`);
        // Optionally refresh quotes to reflect updated respondedAt status
        await fetchProductQuotes();
      } else {
        setError(response.data.message || 'Failed to respond to quote');
      }
    } catch (err) {
      console.error('Error responding to quote:', err);
      setError(err.response?.data?.message || 'Failed to respond to quote');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && token) {
      fetchServiceProviderId();
    } else {
      setError('Authentication required. Please log in.');
    }
  }, [user, token]);

  useEffect(() => {
    if (serviceProviderId) {
      fetchProductQuotes();
    }
  }, [serviceProviderId]);

  return (
    <div className={`p-4 ${isSidebarOpen ? "p-6 lg:ml-56" : "p-4 lg:ml-16"}`}>
      <h1 className="text-md border-1 border-[#0c1f4d] text-[#0c1f4d] bg-gray-100 p-2 rounded-r-2xl w-28 font-bold">Product Leads</h1>
      {loading && <p className="text-gray-500">Loading...</p>}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert variant="success" className="mb-4">
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      {!loading && quotes.length === 0 && (
        <p className="text-gray-500">No product quotes found.</p>
      )}
      {!loading && quotes.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quantity</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Phone Number</TableHead>
              <TableHead>User Name</TableHead>
              <TableHead>User Email</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotes.map((quote) => (
              <TableRow
                key={quote._id}
                onClick={() => handleRespondToQuote(quote._id)}
                className="cursor-pointer hover:bg-gray-100"
              >
                <TableCell>{quote.quantity}</TableCell>
                <TableCell>{quote.unit}</TableCell>
                <TableCell>{quote.phoneNumber}</TableCell>
                <TableCell>{quote.userId?.name || 'N/A'}</TableCell>
                <TableCell>{quote.userId?.email || 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

export default ProductLeads;