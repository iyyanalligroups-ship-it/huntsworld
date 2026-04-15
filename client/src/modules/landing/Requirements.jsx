import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, MapPin, Phone, User, Calendar } from 'lucide-react';
import { useSelectedUser } from '../admin/context/SelectedUserContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

function Requirements() {
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { setSelectedUser } = useSelectedUser();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRequirements = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/grocery-seller-requirement/fetch-all-grocery-seller-requirement?sort=-createdAt`
        );
        setRequirements(response.data.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch requirements', err);
        setLoading(false);
      }
    };

    fetchRequirements();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-destructive p-4">
        {error}
      </div>
    );
  }


  const handleChat = (req) => {
    setSelectedUser(req);

  }

  return (
    <div className=" p-4">
      <Button
        type="button"
        onClick={() => navigate(-1)}
        variant="outline"
        className="absolute cursor-pointer top-5 left-5 z-40 flex gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Button>
      <h1 className="text-2xl font-bold mb-6 text-center">All Requirements</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {requirements.map((req) => (
          <Card key={req._id} className="hover:shadow-lg transition-shadow duration-200 cursor-pointer" onClick={() => handleChat(req)}>
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                {req.product_or_service}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-muted-foreground flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  <span className="font-medium">Quantity:</span> {req.quantity} {req.unit_of_measurement}
                </p>
                <p className="text-muted-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span className="font-medium">Phone:</span> {req.phone_number}
                </p>
                <p className="text-muted-foreground flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="font-medium">Supplier Preference:</span> {req.supplier_preference}
                </p>
                {req.supplier_preference === 'Specific States' && req.selected_states?.length > 0 && (
                  <p className="text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span className="font-medium">States:</span> {req.selected_states.join(', ')}
                  </p>
                )}
                <p className="text-muted-foreground flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="font-medium">Posted by:</span> {req.user_id?.name || 'Unknown User'}
                </p>
                {req.user_id?.address && (
                  <p className="text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span className="font-medium">Location:</span> {req.user_id.address.city}, {req.user_id.address.state}
                  </p>
                )}
                <p className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4" />
                  Posted on: {new Date(req.createdAt).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default Requirements;
