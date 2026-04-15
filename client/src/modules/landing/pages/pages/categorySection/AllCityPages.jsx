// src/components/AllCitiesPage.jsx
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetCitiesQuery } from '@/redux/api/AddressApi';
import useCitiesWithImages from '../categorySection/helper/UseCitiesWithImages';
import { Building2, Navigation, Search, MapPin, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Import your local no-image asset
import noImage from "@/assets/images/no-image.jpg";

const DEFAULT_CITY_IMAGE = noImage;

const AllCitiesPage = () => {
  const navigate = useNavigate();
  const { data: citiesData, isLoading, error } = useGetCitiesQuery();

  const initialCities = useMemo(
    () =>
      citiesData
        ? citiesData.map((item) => ({
          name: item.city.charAt(0).toUpperCase() + item.city.slice(1),
          total: item.total,
        }))
        : [],
    [citiesData]
  );

  const cities = useCitiesWithImages(initialCities);

  const goSuppliers = (cityName) => {
    const safe = encodeURIComponent(cityName.trim());
    navigate(`/suppliers/${safe}`);
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-[#0c1f4d] border-t-red-500 rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-[#0c1f4d] tracking-widest uppercase">Mapping Cities...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center p-8 bg-red-50 rounded-2xl border border-red-100">
        <p className="text-red-600 font-bold">Failed to sync city data.</p>
        <button onClick={() => window.location.reload()} className="mt-4 text-sm underline text-red-500">Retry Connection</button>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen bg-gray-100 py-16 px-4 md:px-10">
      <Button
        type="button"
        onClick={() => navigate(-1)}
        variant="outline"
        className="absolute cursor-pointer top-2 left-1 z-40 flex gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Button>
      {/* Header Section */}
      <div className="max-w-7xl mx-auto mb-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-red-600 font-bold text-[10px] uppercase tracking-[0.4em]">
              <Navigation size={14} fill="currentColor" /> Local Sourcing
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-[#0c1f4d] tracking-tight">
              Major Cities
            </h1>
            <p className="text-slate-500 font-medium max-w-lg leading-relaxed">
              Find wholesale suppliers and manufacturing hubs in the world's most prominent industrial cities.
            </p>
          </div>

          {/* Quick Stats/Search Info */}
          <div className="hidden lg:flex items-center gap-4 bg-white p-2 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex -space-x-2 overflow-hidden p-1">
              {cities.slice(0, 4).map((c, i) => (
                <img key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover" src={c.image || DEFAULT_CITY_IMAGE} alt="" />
              ))}
            </div>
            <div className="pr-4 py-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Active Hubs</p>
              <p className="text-sm font-black text-[#0c1f4d]">{cities.length} Cities Listed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cities Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {cities.map((city, i) => (
          <div
            key={i}
            onClick={() => goSuppliers(city.name)}
            className="group relative h-72 bg-white rounded-[2.5rem] overflow-hidden cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.12)] transition-all duration-500"
          >
            {/* Image Layer */}
            <div className="absolute inset-0">
              <img
                src={city.image || DEFAULT_CITY_IMAGE}
                alt={city.name}
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                onError={(e) => { e.currentTarget.src = DEFAULT_CITY_IMAGE; }}
              />
              {/* Modern Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c1f4d] via-[#0c1f4d]/30 to-transparent" />
            </div>

            {/* Content Layer */}
            <div className="absolute inset-0 p-8 flex flex-col justify-end">
              <div className="flex items-end justify-between">
                <div className="space-y-1 transform group-hover:-translate-y-2 transition-transform duration-500">
                  <div className="flex items-center gap-2 text-white/70 text-[10px] font-bold uppercase tracking-widest">
                    <MapPin size={10} className="text-red-400" /> Global Hub
                  </div>
                  <h3 className="text-2xl font-black text-white tracking-wide">
                    {city.name}
                  </h3>
                </div>

                {/* Supplier Count Badge */}
                <div className="bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-xl flex flex-col items-center min-w-[60px] transform group-hover:scale-110 transition-transform duration-500">
                  <span className="text-white text-xs font-black">{city.total}</span>
                  <span className="text-white/60 text-[8px] font-bold uppercase tracking-tighter">Sellers</span>
                </div>
              </div>

              {/* Hover Reveal Link */}
              <div className="mt-4 flex items-center gap-2 text-white/0 group-hover:text-white/100 transition-all duration-500 text-[10px] font-black uppercase tracking-widest">
                Enter Hub <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Top-Right Decorative Icon */}
            <div className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Building2 size={18} className="text-white" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ArrowRight = ({ size, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M5 12h14m-7-7 7 7-7 7" />
  </svg>
);

export default AllCitiesPage;
