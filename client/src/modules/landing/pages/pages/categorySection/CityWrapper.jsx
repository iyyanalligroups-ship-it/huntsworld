import React, { useMemo } from 'react';
import { useGetCitiesQuery } from '@/redux/api/AddressApi';
import useCitiesWithImages from '../categorySection/helper/UseCitiesWithImages';
import CityPage from './CityPage';

const CityWrapper = () => {
  const { data: citiesData, isLoading, error, isFetching } = useGetCitiesQuery();

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

  if (isLoading || isFetching) {
    return (
      <div className="w-full py-10 px-10 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded mb-6"></div>
        <div className="flex space-x-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 w-[120px] bg-gray-200 rounded-full"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) return null; // Or a subtle error message

  const limitedCities = cities.slice(0, 10);

  return (
    <section className="w-full bg-gray-100">
      <CityPage cities={limitedCities} />
    </section>
  );
};

export default CityWrapper;
