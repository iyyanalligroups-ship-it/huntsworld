import { useEffect, useState, useContext } from "react";
import axios from "axios";
import {
    Trash2,
    RefreshCw,
    Plus,
    Check,
    Search,
    AlertCircle,
    Package,
    Tag,
    Loader2, // Imported Loader
    Rocket,
    ExternalLink
} from "lucide-react";
import { 
    useGetActiveTopListingQuery 
} from "@/redux/api/TopListingApi";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import showToast from "@/toast/showToast";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

// Shadcn UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";

import { useSidebar } from "@/modules/admin/hooks/useSidebar";
import DeleteDialog from "@/model/DeleteModel";
import Loader from "@/loader/Loader";

const TopListingProducts = () => {
    const { user } = useContext(AuthContext);
    const userId = user?.user?._id;
    const API = import.meta.env.VITE_API_URL;

    // Data State
    const [myProducts, setMyProducts] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [allTopProductIds, setAllTopProductIds] = useState([]);
    const { isSidebarOpen } = useSidebar();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    // UI State
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [loading, setLoading] = useState(false); // Global Action Loading State
    const [isDataLoading, setIsDataLoading] = useState(true); // Initial Fetch Loading State
    const [deleteId, setDeleteId] = useState(null);
    // Dialog State
    const [isReplaceDialogOpen, setIsReplaceDialogOpen] = useState(false);
    const [itemToReplace, setItemToReplace] = useState(null);

    // Plan Status - Using Redux Query for consistency
    const { 
        data: topData, 
        isLoading: isPlanLoading 
    } = useGetActiveTopListingQuery(userId, { skip: !userId });
    
    const activePlan = topData?.activeTopListing;

    // Pagination State
    const [paginationLimit, setPaginationLimit] = useState(5);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [loadMoreLoading, setLoadMoreLoading] = useState(false);

    // Available Products Pagination
    const [availablePage, setAvailablePage] = useState(1);
    const [availableHasMore, setAvailableHasMore] = useState(false);
    const [isAvailableLoading, setIsAvailableLoading] = useState(false);

    // ===============================
    // FETCH DATA
    // ===============================
    const fetchLimit = async () => {
        try {
            const res = await axios.get(`${API}/common-subscription-plan/fetch-by-name/Top-listing-product-count`);
            if (res.data.success) {
                setPaginationLimit(Number(res.data.data.price) || 5);
            }
        } catch (err) {
            console.error("Failed to fetch limit", err);
        }
    };

    const fetchAvailableProducts = async (page = 1, append = false) => {
        if (!userId) return;
        setIsAvailableLoading(true);

        try {
            const res = await axios.get(`${API}/products/fetch-all-products-by-seller-id/${userId}?page=${page}&limit=5`);
            if (res.data.success) {
                const newProducts = res.data.products || [];
                if (append) {
                    setMyProducts(prev => {
                        // Avoid duplicates if any
                        const existingIds = new Set(prev.map(p => p._id));
                        const uniqueNew = newProducts.filter(p => !existingIds.has(p._id));
                        return [...prev, ...uniqueNew];
                    });
                } else {
                    setMyProducts(newProducts);
                }
                setAvailableHasMore(res.data.pagination?.currentPage < res.data.pagination?.totalPages);
                setAvailablePage(page);
            }
        } catch (err) {
            console.error("Failed to fetch products", err);
        } finally {
            setIsAvailableLoading(false);
        }
    };

    const fetchData = async (page = 1, append = false) => {
        if (!userId) return;
        
        if (!append) {
            if (topProducts.length === 0) setIsDataLoading(true);
        } else {
            setLoadMoreLoading(true);
        }

        try {
            const [topRes, allRes] = await Promise.all([
                axios.get(`${API}/top-listing-products/seller/${userId}?page=${page}&limit=5`),
                axios.get(`${API}/top-listing-products/seller/${userId}?page=1&limit=100`) // Fetch more for filtering
            ]);

            if (topRes.data.success) {
                const newData = topRes.data.data || [];
                if (append) {
                    setTopProducts(prev => [...prev, ...newData]);
                } else {
                    setTopProducts(newData);
                }
                setHasMore(topRes.data.hasMore);
                setCurrentPage(page);
            }

            if (allRes.data.success) {
                const allIds = (allRes.data.data || []).map(item => item.product_id?._id).filter(Boolean);
                setAllTopProductIds(allIds);
            }
        } catch (err) {
            // Only show error if it's not a 404/Empty plan case which we handle separately
            if (err.response?.status !== 400) {
                showToast("Failed to load data", "error");
            }
        } finally {
            setIsDataLoading(false);
            setLoadMoreLoading(false);
        }
    };

    useEffect(() => {
        if (userId) {
            fetchLimit();
            fetchData(1, false);
            fetchAvailableProducts(1, false);
        }
    }, [userId]);

    const handleLoadMoreAvailable = () => {
        if (availableHasMore && !isAvailableLoading) {
            fetchAvailableProducts(availablePage + 1, true);
        }
    };

    const handleLoadMore = () => {
        if (hasMore && !loadMoreLoading) {
            fetchData(currentPage + 1, true);
        }
    };

    // ===============================
    // HANDLERS
    // ===============================

    const toggleSelection = (productId) => {
        setSelectedProducts((prev) => {
            if (prev.includes(productId)) {
                return prev.filter((id) => id !== productId);
            } else {
                if (prev.length >= (paginationLimit - topProducts.length)) {
                    showToast(`You can only add ${paginationLimit - topProducts.length} more product(s)`, "error");
                    return prev;
                }
                return [...prev, productId];
            }
        });
    };

    const handleAddMultiple = async () => {
        if (loading) return; // Prevent double click
        if (selectedProducts.length === 0) return showToast("Select products first", "error");

        setLoading(true);
        try {
            for (let productId of selectedProducts) {
                await axios.post(`${API}/top-listing-products/add`, {
                    user_id: userId,
                    product_id: productId,
                });
            }
            showToast("Products added successfully", "success");
            setSelectedProducts([]);
            await fetchData(1, false);
            await fetchAvailableProducts(1, false);
        } catch (err) {
            showToast(err.response?.data?.message || "Add failed", "error");
        } finally {
            setLoading(false);
        }
    };

    const openReplaceModal = (item) => {
        if (loading) return; // Don't open if busy
        setItemToReplace(item);
        setIsReplaceDialogOpen(true);
    };

    const handleReplace = async (newProductId) => {
        if (loading || !itemToReplace) return; // Prevent double click

        setLoading(true);
        try {
            const res = await axios.put(
                `${API}/top-listing-products/update/${itemToReplace._id}`,
                { new_product_id: newProductId }
            );
            if (res.data.success) {
                showToast("Product replaced successfully", "success");
                setIsReplaceDialogOpen(false);
                setItemToReplace(null);
                await fetchData(1, false);
                await fetchAvailableProducts(1, false);
            }
        } catch (err) {
            showToast(err.response?.data?.message || "Replace failed", "error");
        } finally {
            setLoading(false);
        }
    };
    const deleteModel = (id) => {
        setDeleteId(id)
        setIsDialogOpen(true);
    }
    const handleDelete = async () => {
        if (loading) return; // Prevent double click


        setLoading(true);
        try {
            const res = await axios.delete(`${API}/top-listing-products/delete/${deleteId}`);
            if (res.data.success) {
                showToast("Product removed", "success");
                await fetchData(1, false);
                await fetchAvailableProducts(1, false);
            }
            setIsDialogOpen(false);
        } catch (err) {
            showToast("Delete failed", "error");
        } finally {
            setLoading(false);
        }
    };

    // Helper
    const getCategoryName = (product) => {
        if (!product.category) return "Uncategorized";
        return typeof product.category === "object"
            ? product.category.name || "Uncategorized"
            : product.category;
    };

    const availableProducts = myProducts.filter(
        (p) => !allTopProductIds.includes(p._id)
    );

    const slotsUsed = topProducts.length;
    const slotsTotal = paginationLimit;

    if (isPlanLoading) return <Loader />;

    if (!activePlan) {
        return (
            <div className={`${isSidebarOpen ? ' lg:ml-52' : ' lg:ml-16'} transition-all duration-300 min-h-screen flex items-center justify-center bg-gray-50/50 p-4`}>
                <Card className="max-w-2xl w-full border-2 border-dashed shadow-xl overflow-hidden">
                    <div className="bg-[#0c1933] p-8 text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <Rocket className="h-12 w-12 mb-4 text-orange-400 animate-bounce" />
                            <h2 className="text-3xl font-bold mb-2">Boost Your Visibility!</h2>
                            <p className="text-blue-100 text-lg">
                                Top Listing products appear at the very top of search results, helping you reach more customers instantly.
                            </p>
                        </div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                    </div>
                    
                    <CardContent className="p-8 space-y-6">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="flex gap-3">
                                <div className="bg-green-100 p-2 rounded-lg h-fit">
                                    <Check className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900">Priority Placement</h4>
                                    <p className="text-sm text-gray-500">Stay ahead of your competitors in search.</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="bg-blue-100 p-2 rounded-lg h-fit">
                                    <Check className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900">More Leads</h4>
                                    <p className="text-sm text-gray-500">Increased views lead to more inquiries.</p>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-orange-800">No Active Plan Found</h4>
                                <p className="text-sm text-orange-700">
                                    To start adding products to Top Listing, you first need to subscribe to a Top Listing Plan.
                                </p>
                            </div>
                        </div>
                    </CardContent>

                    <CardFooter className="p-8 bg-gray-50 border-t flex flex-col sm:flex-row gap-4">
                        <Button 
                            className="w-full bg-[#0c1933] hover:bg-[#162a52] text-white py-6 text-lg group"
                            onClick={() => window.location.href = '/merchant/plans/top-listing-plan'}
                        >
                            View Top Listing Plans
                            <ExternalLink className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    if (isDataLoading && topProducts.length === 0) return <Loader />;

    return (
        <div className={`${isSidebarOpen ? ' lg:ml-52' : ' lg:ml-16'} transition-all duration-300`}>
            <div className=" p-4 md:p-8 space-y-8">

                {/* HEADER */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Top Listing</h2>
                        <p className="text-muted-foreground mt-1">
                            Highlight your best products to boost visibility.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 bg-secondary/50 px-4 py-2 rounded-lg border">
                        <span className="text-sm font-medium text-muted-foreground">Slots Used:</span>
                        <Badge variant={slotsUsed === slotsTotal ? "destructive" : "default"} className="text-sm">
                            {slotsUsed} / {slotsTotal}
                        </Badge>
                    </div>
                </div>

                <Separator />

                <div className="grid lg:grid-cols-3 gap-8">

                    {/* LEFT COL: ADD NEW PRODUCTS */}
                    <div className="lg:col-span-1 space-y-4">
                        <Card className="h-full border-dashed border-2 shadow-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Plus className="h-5 w-5 text-primary" /> Add Products
                                </CardTitle>
                                <CardDescription>
                                    Search by name or category.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {slotsUsed >= slotsTotal ? (
                                    <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground bg-muted/30 rounded-lg">
                                        <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
                                        <p>Maximum limit reached.</p>
                                        <p className="text-xs">Remove a product to add a new one.</p>
                                    </div>
                                ) : (
                                    <div className="border rounded-lg overflow-hidden">
                                        <Command className="h-[300px]">
                                            <CommandInput placeholder="Search..." disabled={loading} />
                                            <CommandList>
                                                <CommandEmpty>No products found.</CommandEmpty>
                                                <CommandGroup heading="Available Products">
                                                    {availableProducts.map((product) => {
                                                        const isSelected = selectedProducts.includes(product._id);
                                                        const categoryName = getCategoryName(product);

                                                        return (
                                                            <CommandItem
                                                                key={product._id}
                                                                value={`${product.product_name} ${categoryName}`}
                                                                onSelect={() => toggleSelection(product._id)}
                                                                className={cn("cursor-pointer", loading && "opacity-50 pointer-events-none")}
                                                            >
                                                                <div className={cn(
                                                                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                                    isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"
                                                                )}>
                                                                    <Check className={cn("h-4 w-4")} />
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium truncate">{product.product_name}</span>
                                                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                                        <Tag className="w-3 h-3" /> {categoryName}
                                                                    </span>
                                                                </div>
                                                            </CommandItem>
                                                        );
                                                    })}

                                                    {availableHasMore && (
                                                        <div 
                                                            className="p-2 text-center text-xs text-primary hover:bg-muted cursor-pointer font-medium"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleLoadMoreAvailable();
                                                            }}
                                                        >
                                                            {isAvailableLoading ? "Loading..." : "Load More Products"}
                                                        </div>
                                                    )}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter>
                                <Button
                                    className="w-full"
                                    onClick={handleAddMultiple}
                                    disabled={loading || slotsUsed >= slotsTotal || selectedProducts.length === 0}
                                >
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {loading ? "Adding..." : `Add ${selectedProducts.length} Selected`}
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>

                    {/* RIGHT COL: CURRENT TOP PRODUCTS */}
                    <div className="lg:col-span-2 space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Package className="h-5 w-5" /> Active Listings
                        </h3>

                        {isDataLoading ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
                            </div>
                        ) : topProducts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 border rounded-xl bg-muted/10 text-muted-foreground border-dashed">
                                <Search className="h-10 w-10 mb-3 opacity-20" />
                                <p>No top listing products yet.</p>
                            </div>
                        ) : (
                            <div className="grid sm:grid-cols-2 gap-4">
                                {topProducts.map((item) => (
                                    <Card
                                        key={item._id}
                                        className="group hover:shadow-md transition-all duration-200"
                                    >
                                        <CardHeader className="p-4 pb-2 space-y-0">
                                            <div className="flex justify-between items-start gap-2">
                                                <CardTitle className="text-base font-medium line-clamp-2 leading-tight">
                                                    {item.product_id?.product_name || "Unknown Product"}
                                                </CardTitle>
                                                <Badge variant="secondary" className="text-xs shrink-0">
                                                    Active
                                                </Badge>
                                            </div>
                                        </CardHeader>

                                        <CardContent className="p-4 pt-2">
                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Tag className="w-3 h-3" />
                                                {getCategoryName(item.product_id || {})}
                                            </p>
                                        </CardContent>

                                        <div className="bg-muted/30 p-3 flex gap-2 border-t">

                                            {/* BUTTON: Replace */}
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                disabled={loading}
                                                className="flex-1 h-8 text-xs"
                                                onClick={() => openReplaceModal(item)}
                                            >
                                                <RefreshCw className="mr-2 h-3 w-3" /> Replace
                                            </Button>

                                            {/* BUTTON: Delete */}
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="sm"
                                                disabled={loading}
                                                className="h-8 w-8 p-0 shrink-0"
                                                // onClick={() => handleDelete(item._id)}
                                                onClick={() => deleteModel(item._id)}
                                            >
                                                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                            </Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}

                        {/* Load More Button */}
                        {hasMore && (
                            <div className="flex justify-center pt-4">
                                <Button
                                    variant="outline"
                                    onClick={handleLoadMore}
                                    disabled={loadMoreLoading}
                                    className="gap-2"
                                >
                                    {loadMoreLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <RefreshCw className="h-4 w-4" />
                                    )}
                                    Load More
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* ============================================== */}
                {/* REPLACEMENT DIALOG (MODAL)                     */}
                {/* ============================================== */}
                <Dialog
                    open={isReplaceDialogOpen}
                    onOpenChange={(val) => {
                        if (!loading) setIsReplaceDialogOpen(val); // Prevent closing while loading
                    }}
                >
                    <DialogContent className="p-0 gap-0 max-w-md">
                        <DialogHeader className="px-4 py-3 border-b">
                            <DialogTitle className="text-lg flex items-center justify-between">
                                <span>Replace Product</span>
                                {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                            </DialogTitle>
                            <div className="text-xs text-muted-foreground">
                                Replacing: <span className="font-medium text-foreground">{itemToReplace?.product_id?.product_name}</span>
                            </div>
                        </DialogHeader>

                        <Command className="h-[350px]">
                            <CommandInput placeholder="Search replacement product..." disabled={loading} />
                            <CommandList>
                                <CommandEmpty>No other products available.</CommandEmpty>
                                <CommandGroup heading="Select Replacement">
                                    {availableProducts.map((p) => {
                                        const categoryName = getCategoryName(p);
                                        return (
                                            <CommandItem
                                                key={p._id}
                                                value={`${p.product_name} ${categoryName}`}
                                                // Disable selection while loading
                                                disabled={loading}
                                                onSelect={() => handleReplace(p._id)}
                                                className={cn("cursor-pointer py-3", loading && "opacity-50")}
                                            >
                                                <Check className={cn("mr-2 h-4 w-4 opacity-0")} />
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{p.product_name}</span>
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                        {categoryName}
                                                    </span>
                                                </div>
                                            </CommandItem>
                                        );
                                    })}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </DialogContent>
                </Dialog>
                <DeleteDialog
                    open={isDialogOpen}
                    onClose={() => setIsDialogOpen(false)}
                    onConfirm={handleDelete}
                    title="Delete Category?"
                    description="This action will permanently remove the category."
                />
            </div>
        </div>
    );
};

export default TopListingProducts;
