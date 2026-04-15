import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ 
  title, 
  description, 
  canonicalUrl, 
  ogImage, 
  schema 
}) => {
  const defaultTitle = "Huntsworld — Global B2B Marketplace";
  const defaultDescription = "Huntsworld is a premium B2B marketplace platform connecting manufacturers, wholesalers, and verified bulk buyers worldwide for secure, reliable business sourcing.";
  const defaultOgImage = "https://huntsworld.com/og-image.jpg"; // Placeholder, can be updated later

  const finalTitle = title ? `${title} | Huntsworld B2B` : defaultTitle;
  const finalDescription = description || defaultDescription;

  // Default Organization Schema
  const defaultSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Huntsworld",
    "url": "https://huntsworld.com",
    "description": "Global B2B Marketplace",
    "logo": "https://huntsworld.com/logo.png"
  };

  const finalSchema = schema || defaultSchema;

  return (
    <Helmet>
      {/* Standard Meta Tags */}
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={ogImage || defaultOgImage} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={ogImage || defaultOgImage} />

      {/* Canonical Link */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Schema / JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify(finalSchema)}
      </script>
    </Helmet>
  );
};

export default SEO;
