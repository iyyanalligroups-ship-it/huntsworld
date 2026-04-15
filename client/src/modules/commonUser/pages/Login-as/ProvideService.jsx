import React, { useState, useContext } from 'react';
import { AuthContext } from '@/modules/landing/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { validateEmail } from '@/modules/validation/emailvalidation';
import { validatePhoneNumber } from '@/modules/validation/phoneValidation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, Mail, Phone, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import showToast from '@/toast/showToast';
import Loader from '@/loader/Loader';

function ProvideService() {
  const { user, logout, isLoading: isAuthLoading } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    travelsName: '',
    companyEmail: '',
    companyPhoneNumber: '',
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // 🔹 Validation function similar to merchant/seller
  const validateField = (name, value) => {
    if (name === 'travelsName') {
      if (!value.trim()) return 'Travels name is required';
    }

    if (name === 'companyEmail') {
      const { isValid, errorMessage } = validateEmail(value);
      if (!isValid) return errorMessage;
    }

    if (name === 'companyPhoneNumber') {
      // allow + at start, then digits
      if (!/^\+?\d*$/.test(value)) return 'Only numbers and + at start allowed';
      if (value.length < 6 || value.length > 15) return 'Phone number must be 6 to 15 digits';
      const { isValid, errorMessage } = validatePhoneNumber(value);
      if (!isValid) return errorMessage;
    }

    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // For phone: allow + at start and digits only
    if (name === 'companyPhoneNumber' && !/^\+?\d*$/.test(value)) return;

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (touched[name]) {
      const errorMessage = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: errorMessage }));
    }
  };

  const handleBlur = (name, value) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const errorMessage = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: errorMessage }));
  };

  const isFormValid = () => {
    return Object.values(formData).every((val, idx) => {
      const fieldName = Object.keys(formData)[idx];
      return validateField(fieldName, val) === '';
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // validate all fields
    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      newErrors[key] = validateField(key, formData[key]);
    });
    setErrors(newErrors);
    setTouched({
      travelsName: true,
      companyEmail: true,
      companyPhoneNumber: true,
    });

    if (Object.values(newErrors).some((err) => err)) {
      showToast(
        <div className="flex items-center">
          Please fix the validation errors before submitting
        </div>,
        'error'
      );
      setLoading(false);
      return;
    }

    if (!user || !user.user) {
      showToast(
        <div className="flex items-center">
          You must be logged in to create a service provider
        </div>,
        'error'
      );
      setLoading(false);
      return;
    }

    try {
      const token = sessionStorage.getItem('token');
      if (!token) throw new Error('Authentication token missing');

      const response = await axios.post(
        `${API_URL}/service-providers/create-minimal-service-provider`,
        {
          travels_name: formData.travelsName.trim(),
          company_email: formData.companyEmail.trim(),
          company_phone_number: formData.companyPhoneNumber.trim(),
          user_id: user.user._id,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      showToast(
        <div className="flex items-center">
          Service provider created successfully! Redirecting to login...
        </div>,
        'success'
      );

      setFormData({ travelsName: '', companyEmail: '', companyPhoneNumber: '' });
      setErrors({});
      setTouched({});

      setTimeout(() => {
        logout();
        navigate('/login');
      }, 3000);
    } catch (err) {
      showToast(
        <div className="flex items-center">
          {err.response?.data?.message || err.message || 'Failed to create service provider.'}
        </div>,
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  if (isAuthLoading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 relative">
      {loading && <Loader label="Creating Service Provider Profile..." />}
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
            <Building2 className="h-6 w-6" />
            Create Service Provider
          </CardTitle>
          <CardDescription className="text-center">
            Enter your company details to register as a service provider.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Travels Name */}
            <div className="space-y-2">
              <Label htmlFor="travelsName" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Travels Name
              </Label>
              <Input
                id="travelsName"
                type="text"
                name="travelsName"
                placeholder="e.g. Sri Ganesh Travels"
                value={formData.travelsName}
                onChange={handleChange}
                onBlur={() => handleBlur('travelsName', formData.travelsName)}
                required
                className={`border-2 border-slate-300 ${errors.travelsName ? 'border-red-500' : ''}`}
              />
              {touched.travelsName && errors.travelsName && (
                <p className="text-red-500 text-xs">{errors.travelsName}</p>
              )}
            </div>

            {/* Company Email */}
            <div className="space-y-2">
              <Label htmlFor="companyEmail" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Company Email
              </Label>
              <Input
                id="companyEmail"
                type="email"
                name="companyEmail"
                placeholder="e.g. contact@business.com"
                value={formData.companyEmail}
                onChange={handleChange}
                onBlur={() => handleBlur('companyEmail', formData.companyEmail)}
                required
                className={`border-2 border-slate-300 ${errors.companyEmail ? 'border-red-500' : ''}`}
              />
              {touched.companyEmail && errors.companyEmail && (
                <p className="text-red-500 text-xs">{errors.companyEmail}</p>
              )}
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="companyPhoneNumber" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Company Phone Number
              </Label>
              <Input
                id="companyPhoneNumber"
                type="tel"
                name="companyPhoneNumber"
                placeholder="e.g. +91 98765 43210"
                value={formData.companyPhoneNumber}
                onChange={handleChange}
                onBlur={() => handleBlur('companyPhoneNumber', formData.companyPhoneNumber)}
                required
                className={`border-2 border-slate-300 ${errors.companyPhoneNumber ? 'border-red-500' : ''}`}
              />
              {touched.companyPhoneNumber && errors.companyPhoneNumber && (
                <p className="text-red-500 text-xs">{errors.companyPhoneNumber}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full flex cursor-pointer items-center justify-center gap-2"
              style={{ backgroundColor: '#0c1f4d', '--hover-bg': '#0c1f4d' }}
              disabled={loading || !isFormValid()}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Service Provider'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center text-sm text-gray-500">
          Ensure all details are accurate before submitting.
        </CardFooter>
      </Card>
    </div>
  );
}

export default ProvideService;
