import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';

const UNSPLASH_ACCESS_KEY = "dA3DnnJl8iNqguwsJalNEyGKE2qnshevtWZpbRtBang"; // Replace with your actual key

const useCitiesWithImages = (initialCities) => {
  const [cities, setCities] = useState(initialCities);
  const [fetched, setFetched] = useState(false);

  // Memoize initialCities to prevent unnecessary re-renders
  const memoizedCities = useMemo(() => initialCities, [JSON.stringify(initialCities)]);

  useEffect(() => {
    if (fetched || memoizedCities.length === 0) return;

    const fetchImages = async () => {
      try {
        const updated = await Promise.all(
          memoizedCities.map(async (city) => {
            try {
              const response = await axios.get(
                `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
                  city.name
                )}&orientation=squarish&per_page=1&client_id=${UNSPLASH_ACCESS_KEY}`
              );
              const imageUrl = response.data?.results?.[0]?.urls?.regular || '';
              return { ...city, image: imageUrl };
            } catch (err) {
              console.warn(`Image not found for city: ${city.name}`, err);
              return { ...city, image: '' };
            }
          })
        );
        setCities(updated);
        setFetched(true);
      } catch (err) {
        console.error('Error fetching city images:', err);
      }
    };

    fetchImages();
  }, [memoizedCities, fetched]);

  return cities;
};

export default useCitiesWithImages;