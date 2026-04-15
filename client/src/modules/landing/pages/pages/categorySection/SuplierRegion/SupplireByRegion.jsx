// frontend/src/pages/SuppliersPage.jsx
import { useParams } from "react-router-dom";
import { useGetSuppliersByCityQuery } from "@/redux/api/AddressApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

import noImage from "@/assets/images/no-image.jpg";

/* --------------------------------------------------------------
   SafeImage – always shows `noImage` when src is missing or fails
   -------------------------------------------------------------- */
const SafeImage = ({ src, alt, className, fallbackText = "Image" }) => {
  const handleError = (e) => {
    e.currentTarget.src = noImage;               // <-- use local asset
  };

  return (
    <img
      src={src || noImage}                         // <-- default if src empty
      alt={alt}
      className={className}
      onError={handleError}
    />
  );
};

/* --------------------------------------------------------------
   Animation variants (unchanged)
   -------------------------------------------------------------- */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } },
};

const SuppliersPage = () => {
  const { city } = useParams();
  const { data, isLoading, error } = useGetSuppliersByCityQuery(city);
  const navigate = useNavigate();

  /* ---------- Loading / Error ---------- */
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500">
        Error: {error.message}
      </div>
    );
  }

  if (!data) {
    return <div className="text-center">No data found for {city}</div>;
  }

  const {
    allCategories,
    dynamicCategories,
    nearbyCities,
    recentCompanies,
  } = data;

  /* ---------- Navigation helpers ---------- */
  const handleCategory = (categoryName) => {
    navigate(`/all-categories/${categoryName}`);
  };

  const handleSuppliers = (cityName) => {
    if (!cityName) return;
    const safe = encodeURIComponent(cityName.trim());
    navigate(`/suppliers/${safe}`);
  };

  const handleSubCategory = (subCategoryName) => {
    navigate(`/subcategory-detail/${subCategoryName}`);
  };

  const handleCompany = (company) => {
    const slug = company
      ? company.toLowerCase().replace(/\s+/g, "-")
      : "company";
    navigate(`/company/${slug}`);
  };

  /* --------------------------------------------------------------
     UI
     -------------------------------------------------------------- */
  return (
    <div className="container mx-auto p-4 space-y-12">
      {/* Back Button */}
      <div className="flex items-center mb-4">
        <Button variant="outline" onClick={() => navigate(-1)} className="gap-2 cursor-pointer shadow-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
      </div>

      {/* Hero */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Suppliers in {city}</h1>
        <p className="text-muted-foreground">
          Discover categories, nearby cities, and recent onboard companies.
        </p>
      </div>

      <Separator />

      {/* ==== All Categories ==== */}
      <section className="py-12">
        <h2 className="text-3xl font-bold mb-8 text-center">
          Explore Our Categories
        </h2>

        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {allCategories.map((cat, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
              onClick={() => handleCategory(cat?.category_name)}
              className="cursor-pointer"
            >
              <Card className="relative w-full h-48 overflow-hidden rounded-lg shadow-md border-none group">
                <SafeImage
                  src={cat.category_image}
                  alt={cat.category_name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="relative flex items-center justify-center h-full">
                  <CardTitle className="text-white text-lg font-semibold text-center p-4">
                    {cat?.category_name}
                  </CardTitle>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <Separator />

      {/* ==== Nearby Cities ==== */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Nearby Cities</h2>
        {nearbyCities.length === 0 ? (
          <p className="text-muted-foreground">No nearby cities found.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {nearbyCities.map((c, i) => (
              <Badge
                key={i}
                variant="secondary"
                onClick={() => handleSuppliers(c)}
                className="px-4 py-2 text-sm cursor-pointer hover:bg-primary hover:text-primary-foreground"
              >
                {c}
              </Badge>
            ))}
          </div>
        )}
      </section>

      <Separator />

      {/* ==== Recent Companies ==== */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">
          Recent Onboard Companies
        </h2>
        {recentCompanies.length === 0 ? (
          <p className="text-muted-foreground">No recent companies found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {recentCompanies.map((comp, i) => (
              <Card
                key={i}
                className="overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                onClick={() => handleCompany(comp.company_name)}
              >
                <CardHeader className="flex flex-row items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={comp.company_logo}
                      alt={comp.company_name}
                      onError={(e) => (e.currentTarget.src = noImage)}   // <-- local noImage
                    />
                    <AvatarFallback>
                      {comp.company_name?.[0] || "C"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>{comp.company_name}</CardTitle>
                    <Badge variant="outline" className="mt-1">
                      {comp.type}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {comp.description?.substring(0, 100)}...
                  </p>
                  <p className="text-xs text-gray-500">
                    Onboarded:{" "}
                    {new Date(comp.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Separator />

      {/* ==== Dynamic Categories (sub‑categories) ==== */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">
          Available Suppliers by Category
        </h2>

        {dynamicCategories.length === 0 ? (
          <p className="text-muted-foreground">
            No suppliers found in {city}
          </p>
        ) : (
          dynamicCategories.map((cat, i) => (
            <Card key={i} className="mb-6">
              <CardHeader
                onClick={() => handleCategory(cat?.category_name)}
                className="cursor-pointer"
              >
                <CardTitle>{cat.category_name}</CardTitle>

                {/* Category header image */}
                {cat.category_image && (
                  <SafeImage
                    src={cat.category_image}
                    alt={cat.category_name}
                    className="w-full h-32 object-cover rounded-md mb-4"
                  />
                )}
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
                  {cat.subcategories.slice(0, 5).map((sub, si) => (
                    <div
                      key={si}
                      className="text-center cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSubCategory(sub?.name);
                      }}
                    >
                      {sub.image ? (
                        <SafeImage
                          src={sub.image}
                          alt={sub.name}
                          className="w-20 h-20 mx-auto object-cover rounded-md mb-2"
                        />
                      ) : (
                        <div className="w-20 h-20 mx-auto bg-gray-100 rounded-md flex items-center justify-center mb-2">
                          <span className="text-xs text-gray-500">
                            No Image
                          </span>
                        </div>
                      )}
                      <p className="text-sm font-medium">{sub.name}</p>
                    </div>
                  ))}
                </div>

                {cat.subcategories.length > 5 && (
                  <p className="text-center mt-4 text-gray-500">
                    And {cat.subcategories.length - 5} more...
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </section>
    </div>
  );
};

export default SuppliersPage;