// src/components/AllCountriesPage.jsx
import React, { useMemo } from 'react';
import { useGetCountriesQuery } from '@/redux/api/AddressApi';
import useCountriesWithFlags from '../categorySection/helper/UseCountryWithFlag';
import { useNavigate } from 'react-router-dom';
import { Globe, ArrowRight, MapPin } from 'lucide-react';

// Import your local no-image asset
import noImage from '@/assets/images/no-image.jpg';

const AllCountriesPage = () => {
  const { data: countriesData, isLoading, error } = useGetCountriesQuery();
  const navigate = useNavigate();

  const initialCountries = useMemo(
    () =>
      countriesData
        ? countriesData.map((item) => ({
            name: item.country.charAt(0).toUpperCase() + item.country.slice(1),
            total: item.total,
          }))
        : [],
    [countriesData]
  );

  const countries = useCountriesWithFlags(initialCountries);

  const handleCountry = (countryName) => {
    const formattedCountry = countryName.toLowerCase().replace(/\s+/g, '-');
    navigate(`/country/${formattedCountry}`);
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#0c1f4d] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[#0c1f4d] font-bold animate-pulse">Loading Global Network...</p>
      </div>
    </div>
  );

  if (error) return <div className="p-10 text-center text-red-600 font-bold">Error: {error.message || 'Failed to load'}</div>;

  return (
    <div className="min-h-screen bg-gray-100 py-16 px-4 md:px-10">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[#0c1f4d] font-bold text-xs uppercase tracking-[0.3em] opacity-70">
              <Globe size={16} /> Global Sourcing Hub
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-[#0c1f4d] tracking-tight">
              All Countries
            </h1>
            <p className="text-slate-500 font-medium max-w-xl">
              Connect with verified manufacturers and professional suppliers from across the globe.
            </p>
          </div>
          <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-gray-200 text-sm font-bold text-[#0c1f4d]">
            Total Markets: <span className="text-red-600">{countries.length}</span>
          </div>
        </div>
      </div>

      {/* Grid Section */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {countries.map((country, i) => (
          <div
            key={i}
            onClick={() => handleCountry(country?.name)}
            className="group relative bg-white rounded-[2rem] p-6 border border-transparent hover:border-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)] transition-all duration-500 cursor-pointer overflow-hidden flex flex-col items-center"
          >
            {/* Background Accent Gradient */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#0c1f4d] to-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Flag Badge */}
            <div className="relative w-24 h-24 mb-4">
              <div className="absolute inset-0 bg-[#0c1f4d]/5 rounded-[1.5rem] rotate-6 group-hover:rotate-12 transition-transform duration-500"></div>
              <img
                src={country.image || noImage}
                alt={country.name}
                onError={(e) => { e.currentTarget.src = noImage; }}
                className="relative w-full h-full rounded-[1.5rem] object-cover border-4 border-white shadow-md transform transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute -bottom-2 -right-2 bg-white p-1.5 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                <ArrowRight size={14} className="text-[#0c1f4d]" />
              </div>
            </div>

            {/* Country Info */}
            <div className="text-center space-y-1">
              <h3 className="text-lg font-extrabold text-[#0c1f4d] group-hover:text-red-600 transition-colors">
                {country.name}
              </h3>
              <div className="flex items-center justify-center gap-1.5 text-slate-400 font-bold text-[11px] uppercase tracking-wider">
                <MapPin size={12} className="text-red-400" />
                {country.total.toLocaleString()} Suppliers
              </div>
            </div>

            {/* Subtle Hover Decoration */}
            <div className="mt-4 h-1 w-0 group-hover:w-12 bg-red-600 rounded-full transition-all duration-500" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllCountriesPage;
