import React, { useState } from 'react';
import { useGetRoyalPlanCompaniesQuery, useGetTrendingDeepSubCategoriesQuery } from '@/redux/api/UserSubscriptionPlanApi';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, Plus, AlertTriangle, ChevronDown, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import noImage from '@/assets/images/no-image.jpg'
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
const ManufacturingDirectory = () => {
    const [page, setPage] = useState(1);
    const limit = 5;
    const { data: companiesData, error: companiesError, isLoading: companiesLoading } = useGetRoyalPlanCompaniesQuery({ page, limit });
    const [selectedLetter, setSelectedLetter] = useState('');
    const [visibleTrendCount, setVisibleTrendCount] = useState(12);
    const trendItemsPerLoad = 12;
    const { data: trendingData = [], error: trendingError, isLoading: trendingLoading } = useGetTrendingDeepSubCategoriesQuery({ letter: selectedLetter });
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    // Debug logging
    console.log('Trending Data:', trendingData);
    console.log('Companies Data:', companiesData);
    console.log('Popover open state:', open);

    if (companiesLoading || trendingLoading) return <div className="text-center py-10">Loading...</div>;

    const { merchants = [], serviceProviders = [] } = companiesData || {};
    const companies = [...merchants, ...serviceProviders];

    const handleCompanyName = (companyName) => {
        const formattedName = companyName.toLowerCase().replace(/\s+/g, '-');
        navigate(`/company/${formattedName}`);
    };

    const handleLoadMoreTrend = () => {
        setVisibleTrendCount((prev) => prev + trendItemsPerLoad);
    };

    const visibleTrending = trendingData.slice(0, visibleTrendCount);

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
        hover: { scale: 1.05, transition: { duration: 0.2 } },
    };

    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

    return (
        <div className="company-directory container relative mx-auto p-4">

            <Button
                type="button"
                onClick={() => navigate(-1)}
                variant="outline"
                className="absolute cursor-pointer top-5 left-5 z-40 flex gap-2"
            >
                <ArrowLeft className="w-4 h-4" />
                Back
            </Button>
            {/* Header with subtle animation */}
            <motion.div
                className="bg-[#d2d4d7] p-6 rounded-lg mb-8 text-center"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
            >
                <h1 className="text-3xl font-bold mt-4 text-[#0c1f4d]">Indian Manufacturers Directory</h1>
                <p className="text-gray-600 mb-8">
                    Browse leading Indian Manufacturers Database from various product categories to reach millions of manufacturing companies in India
                </p>
            </motion.div>

            {/* Featured Companies Section */}
            <div className="featured-companies">
                <h2 className="text-2xl font-semibold mb-6">Featured Manufacturing Companies</h2>
                {!companiesError && companies.length > 0 ? (
                    <div className="company-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence>
                            {companies.map((company) => (
                                <motion.div
                                    key={company._id}
                                    custom={company._id}
                                    initial="hidden"
                                    animate="visible"
                                    exit="hidden"
                                    whileHover="hover"
                                    variants={cardVariants}
                                >
                                    <Card
                                        className="hover:shadow-lg transition-shadow duration-200 cursor-pointer border border-gray-200 rounded-lg overflow-hidden"
                                        onClick={() => handleCompanyName(company.company_name || company.travels_name)}
                                    >
                                        <CardContent className="p-4 flex items-center space-x-4">
                                            <motion.img
                                                src={company.company_logo}
                                                alt={`${company.company_name || company.travels_name} logo`}
                                                className="w-[50px] h-[50px] object-contain rounded-full border border-gray-300"
                                                initial={{ scale: 0.9 }}
                                                animate={{ scale: 1 }}
                                                transition={{ duration: 0.3 }}
                                                onError={(e) => {
                                                    e.currentTarget.onerror = null;
                                                    e.currentTarget.src = noImage;
                                                }}
                                            />
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-gray-800">
                                                    {company.company_name || company.travels_name}
                                                </h3>
                                                <p className="text-sm text-gray-500 flex items-center mt-1">
                                                    <Mail className="w-4 h-4 mr-1" />
                                                    {company.company_email || 'Email not available'}
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                ) : (
                    <Alert variant="destructive" className="max-w-md mx-auto">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Not Found</AlertTitle>
                        <AlertDescription>No featured companies available at the moment.</AlertDescription>
                    </Alert>
                )}
            </div>

            {/* Manufacturers Products by Alphabet Section */}
            <div className="mt-12">
                <h2 className="text-2xl font-semibold mb-6">Manufacturers Products by Alphabet</h2>


                <Select
                    value={selectedLetter}
                    onValueChange={(value) => {
                        // Convert "all" → empty string
                        setSelectedLetter(value === "all" ? "" : value);
                    }}
                >
                    <SelectTrigger className="w-[200px] mb-6">
                        <SelectValue placeholder="Select a letter" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                        <SelectItem value="all">All Products</SelectItem>
                        {alphabet.map((char) => (
                            <SelectItem key={char} value={char}>
                                {char}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <AnimatePresence>
                        {trendingError ? (
                            <Alert variant="destructive" className="col-span-full max-w-md mx-auto">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Not Found</AlertTitle>
                                <AlertDescription>Unable to load trending subcategories at the moment.</AlertDescription>
                            </Alert>
                        ) : visibleTrending.length > 0 ? (
                            visibleTrending.map((item) => (
                                <motion.div
                                    key={item._id}
                                    custom={item._id}
                                    initial="hidden"
                                    animate="visible"
                                    exit="hidden"
                                    whileHover="hover"
                                    variants={cardVariants}
                                >
                                    <Card className="hover:shadow-lg transition-shadow duration-200 border border-gray-200 rounded-lg overflow-hidden">
                                        <CardContent className="p-4 flex flex-col items-center text-center">
                                            {item.deep_sub_category_image ? (
                                                <motion.img
                                                    src={item.deep_sub_category_image}
                                                    alt={item.deep_sub_category_name}
                                                    className="w-16 h-16 object-cover rounded-md mb-2"
                                                    initial={{ scale: 0.9 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ duration: 0.3 }}
                                                    onError={(e) => {
                                                        e.currentTarget.onerror = null;
                                                        e.currentTarget.src = noImage;
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center mb-2">
                                                    No Image
                                                </div>
                                            )}
                                            <h3 className="text-lg font-semibold text-gray-800">
                                                {item.deep_sub_category_name}
                                            </h3>
                                            <p className="text-sm text-gray-500 mt-1">Count: {item.count}</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                Points: {item.totalPoints}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                Created: {new Date(item.createdAt).toLocaleDateString()}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))
                        ) : (
                            <Alert variant="destructive" className="col-span-full max-w-md mx-auto">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Not Found</AlertTitle>
                                <AlertDescription>No trending subcategories available for the selected letter.</AlertDescription>
                            </Alert>
                        )}
                    </AnimatePresence>
                </div>

                {!trendingError && visibleTrendCount < trendingData.length && (
                    <div className="text-center mt-6">
                        <button
                            onClick={handleLoadMoreTrend}
                            className="bg-[#0c1f4d] text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-colors flex items-center mx-auto"
                        >
                            View More <Plus className="w-4 h-4 ml-2" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManufacturingDirectory;
