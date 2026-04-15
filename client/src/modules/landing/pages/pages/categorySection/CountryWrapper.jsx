// src/components/CountryWrapper.jsx
import React, { useMemo } from 'react';
import { useGetCountriesQuery } from '@/redux/api/AddressApi';
import useCountriesWithFlags from '../categorySection/helper/UseCountryWithFlag';
import CountryPage from './CountryPage';

const CountryWrapper = () => {
  const { data: countriesData, isLoading, error } = useGetCountriesQuery();

  // Memoize initialCountries to ensure stable reference
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

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error fetching countries: {error.message}</div>;

  // Limit to 5 countries
  const limitedCountries = countries.slice(0, 5);

  return <CountryPage countries={limitedCountries} />;
};

export default CountryWrapper;