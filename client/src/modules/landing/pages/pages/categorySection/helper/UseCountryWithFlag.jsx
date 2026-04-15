// src/helper/UseCountryWithFlag.js
import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';

const aliasMap = {
  USA: 'United States',
  UK: 'United Kingdom',
  'South Korea': 'Korea (Republic of)',
  Russia: 'Russian Federation',
  Iran: 'Iran (Islamic Republic of)',
};

const useCountriesWithFlags = (initialCountries) => {
  const [countries, setCountries] = useState(initialCountries);
  const [fetched, setFetched] = useState(false); // Track if flags have been fetched

  // Memoize initialCountries to prevent unnecessary re-renders
  const memoizedCountries = useMemo(() => initialCountries, [JSON.stringify(initialCountries)]);

  useEffect(() => {
    // Skip fetching if already fetched or no countries
    if (fetched || memoizedCountries.length === 0) return;

    const fetchFlags = async () => {
      try {
        const updated = await Promise.all(
          memoizedCountries.map(async (c) => {
            const matchName = aliasMap[c.name] || c.name;
            try {
              const res = await axios.get(
                `https://restcountries.com/v3.1/name/${encodeURIComponent(matchName)}?fields=flags,name`
              );
              const countryData = res.data?.[0];
              return {
                ...c,
                image: countryData?.flags?.svg || '',
              };
            } catch (err) {
              console.warn(`Flag not found for: ${c.name}`, err);
              return { ...c, image: '' };
            }
          })
        );
        setCountries(updated);
        setFetched(true); // Mark as fetched to prevent re-fetching
      } catch (err) {
        console.error('Error fetching country flags:', err);
      }
    };

    fetchFlags();
  }, [memoizedCountries, fetched]);

  return countries;
};

export default useCountriesWithFlags;