import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PackageSearch,
  TrendingUp,
  Eye,
  Star,
  FileWarning,
  FileText,
  BadgeCheck,
  CalendarDays,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useSidebar } from "@/modules/admin/hooks/useSidebar";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import showToast from "@/toast/showToast";
import { Button } from "@/components/ui/button";

const iconMap = {
  PackageSearch: PackageSearch,
  TrendingUp: TrendingUp,
  Eye: Eye,
};

const SubscriptionCard = ({ subscription, isFreePlan }) => {
  const planName = subscription.plan_name || "No Plan";
  const isFree = isFreePlan || planName.toUpperCase() === "FREE" || subscription.price === 0;

  return (
    <Card className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg overflow-hidden">
      <CardContent className="p-6">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-4 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl md:text-3xl font-bold">
                Current Plan: {planName}
              </h2>
              {isFree ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-800/80 text-green-100 backdrop-blur-sm">
                  Free Plan
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-700/80 text-amber-100 backdrop-blur-sm">
                  Premium
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2 text-base">
              <p className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 opacity-90" />
                <span>
                  {subscription.end_date === "N/A"
                    ? "No expiry date set"
                    : `Valid until ${subscription.end_date}`}
                </span>
              </p>

              <p className="font-medium flex flex-wrap items-center gap-2">
                Status:{" "}
                <span
                  className={`font-semibold ${
                    isFree ? "text-green-200" : "text-emerald-200"
                  }`}
                >
                  {subscription.status}
                </span>
                {!isFree && (
                  <>
                    <span className="opacity-80">|</span>
                    <span className="font-bold text-white">
                      ₹{(subscription.price > 0 ? subscription.price - 1 : 0).toFixed(0)}
                    </span>
                    <span className="opacity-90">
                      ({subscription.duration || "N/A"})
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="hidden sm:block">
            <BadgeCheck className="w-14 h-14 md:w-16 md:h-16 text-green-300 opacity-90" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const userId = user?.user?._id;
  const { isSidebarOpen } = useSidebar();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState({
    subscription: {
      plan_name: "Loading...",
      start_date: "N/A",
      end_date: "N/A",
      status: "Inactive",
      price: 0,
      duration: "N/A",
    },
    stats: [],
    trendingProducts: [],
    reviews: [],
    complaints: [],
    requirements: [],
  });

  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    if (!userId) {
      showToast("User not authenticated. Please log in.", "error");
      setLoading(false);
      return;
    }

    const fetchDashboardData = async () => {
      try {
        const token = sessionStorage.getItem("token");
        if (!token) {
          throw new Error("No authentication token found");
        }

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/dashboard-data/dashboard/${userId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Server error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        setDashboardData(data);
        setFetchError(null);
      } catch (error) {
        console.error("Dashboard data fetch failed:", error);
        showToast("Failed to load dashboard data. Please try again later.", "error");
        setFetchError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [userId]);

  const isFreePlan =
    dashboardData.subscription.plan_name?.toUpperCase() === "FREE" ||
    dashboardData.subscription.price === 0 ||
    dashboardData.subscription.status?.toLowerCase() === "free";

  // Reminder message logic (placeholder - integrate your RTK query result if needed)
  let reminderMessage = null;
  // Example: if you had subscriptionStatus from RTK Query
  // if (subscriptionStatus?.isReminderPeriod) {
  //   reminderMessage = `Your ${subscriptionStatus.subscription.subscription_plan_id.plan_name} subscription expires in ${subscriptionStatus.daysUntilExpiry} day(s). Renew now!`;
  // }

  if (loading) {
    return (
      <div className={`${isSidebarOpen ? "lg:ml-56 lg:p-6" : "lg:ml-16 lg:p-4"} p-4`}>
        <div className="space-y-6">
          <Skeleton className="h-48 w-full rounded-xl" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-96 w-full rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className={`${isSidebarOpen ? "lg:ml-56 lg:p-6" : "lg:ml-16 lg:p-4"} p-4`}>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 font-medium mb-4">
              Failed to load dashboard data
            </p>
            <p className="text-sm text-muted-foreground mb-4">{fetchError}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`${isSidebarOpen ? "lg:ml-56 lg:p-6" : "lg:ml-16 lg:p-4"} p-4 min-h-screen`}>
      <div className="space-y-6 max-w-7xl mx-auto">

        {/* Optional Reminder Banner */}
        {reminderMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="p-5 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl shadow-sm"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="font-medium text-amber-800">{reminderMessage}</p>
              <Button
                className="bg-amber-600 hover:bg-amber-700 text-white whitespace-nowrap"
                onClick={() => (window.location.href = "/subscriptions")}
              >
                Renew Subscription
              </Button>
            </div>
          </motion.div>
        )}

        {/* Page Title */}
        <h1 className="text-2xl md:text-3xl font-bold text-[#0c1f4d] border-l-4 border-[#0c1f4d] pl-4 py-1">
          Dashboard Overview
        </h1>

        {/* Subscription Overview Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <SubscriptionCard subscription={dashboardData.subscription} isFreePlan={isFreePlan} />
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {dashboardData.stats?.length > 0 ? (
            dashboardData.stats.map((item, index) => {
              const Icon = iconMap[item.icon];
              const isTotalProducts = item.title === "Total Products";
              return (
                <motion.div
                  key={index}
                  className="h-full"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
                >
                  <Card className="rounded-xl border shadow-sm hover:shadow-md transition-all duration-300 h-full relative">
                    <CardContent className="p-6 flex flex-col justify-center gap-5 h-full">
                      <div className="flex items-center gap-5">
                        <div className={`p-4 rounded-full flex-shrink-0 ${item.bg}`}>
                          <Icon className={`h-8 w-8 ${item.color}`} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground font-medium">
                            {item.title}
                          </p>
                          <p className="text-3xl font-bold mt-1">{item.count}</p>
                        </div>
                      </div>
                      {isTotalProducts && (
                        <button
                          onClick={() => navigate("/merchant/products")}
                          className="absolute bottom-4 right-6 cursor-pointer text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline transition-colors mt-auto self-end"
                        >
                          View Products →
                        </button>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          ) : (
            <div className="col-span-3 text-center py-12 text-muted-foreground">
              No statistics available at the moment
            </div>
          )}
        </div>

        {/* Trending Products Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <Card className="rounded-2xl shadow-xl border">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-3 text-xl md:text-2xl">
                <TrendingUp className="h-7 w-7 text-purple-600 animate-pulse" />
                Trending Products (This Month)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {dashboardData.trendingProducts?.length > 0 ? (
                <div className="h-72 sm:h-80 md:h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboardData.trendingProducts}>
                      <XAxis dataKey="name" angle={-25} textAnchor="end" height={70} />
                      <YAxis />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(255,255,255,0.95)",
                          borderRadius: "8px",
                          border: "1px solid #e2e8f0",
                        }}
                      />
                      <Bar dataKey="points" fill="#6366f1" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-72 flex items-center justify-center text-muted-foreground">
                  No trending products recorded this month
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Latest Activity Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Latest Reviews */}
          <Card className="rounded-xl shadow-sm border">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-3">
                <Star className="h-6 w-6 text-yellow-500" />
                <h3 className="text-lg font-semibold">Latest Reviews</h3>
              </div>
              {dashboardData.reviews?.length > 0 ? (
                dashboardData.reviews.map((r) => (
                  <div
                    key={r.id}
                    className="border-b pb-4 last:border-0 last:pb-0 hover:bg-gray-50/50 transition-colors"
                  >
                    <p className="font-medium text-base">{r.user}</p>
                    <p className="text-sm text-muted-foreground mt-1.5">
                      {r.comment}
                      <span className="ml-2 text-yellow-600 font-medium">
                        ({r.rating}★)
                      </span>
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No recent reviews yet
                </p>
              )}
            </CardContent>
          </Card>

          {/* Latest Complaints */}
          <Card className="rounded-xl shadow-sm border">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-3">
                <FileWarning className="h-6 w-6 text-red-500" />
                <h3 className="text-lg font-semibold">Latest Complaints</h3>
              </div>
              {dashboardData.complaints?.length > 0 ? (
                dashboardData.complaints.map((c) => (
                  <div
                    key={c.id}
                    className="border-b pb-4 last:border-0 last:pb-0 hover:bg-gray-50/50 transition-colors"
                  >
                    <p className="font-medium text-base">{c.user}</p>
                    <p className="text-sm text-muted-foreground mt-1.5">
                      {c.issue}
                      <span className="ml-2 opacity-75 text-xs">
                        ({c.type} - {c.option})
                      </span>
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No recent complaints
                </p>
              )}
            </CardContent>
          </Card>

          {/* Latest Requirements */}
          <Card className="rounded-xl shadow-sm border">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-indigo-600" />
                <h3 className="text-lg font-semibold">Latest Requirements</h3>
              </div>
              {dashboardData.requirements?.length > 0 ? (
                dashboardData.requirements.map((r) => (
                  <div
                    key={r.id}
                    className="border-b pb-4 last:border-0 last:pb-0 hover:bg-gray-50/50 transition-colors"
                  >
                    <p className="font-medium text-base">{r.product}</p>
                    <p className="text-sm text-muted-foreground mt-1.5">
                      Qty: {r.qty}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No recent requirements posted
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
