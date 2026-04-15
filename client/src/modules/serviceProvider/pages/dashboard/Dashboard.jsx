import { useContext, useEffect, useState } from "react";
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
import axios from "axios";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import showToast from "@/toast/showToast";

const iconMap = {
  PackageSearch: PackageSearch,
  TrendingUp: TrendingUp,
  Eye: Eye,
};

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const userId = user?.user?._id;
  const { isSidebarOpen } = useSidebar();
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

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!userId) {
        showToast("User ID is missing", "error");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/dashboard-data/dashboard/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
          }
        );
        setDashboardData(response.data);
        console.log(response.data, "dashboard");
        setLoading(false);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        showToast("Failed to load dashboard data. Please try again.", "error");
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [userId]);

  if (loading) {
    return (
      <div className={`${isSidebarOpen ? "p-6 lg:ml-56" : "p-4 lg:ml-16"}`}>
        <div className="p-4 space-y-6">
          <Card className="rounded-xl shadow-md">
            <CardContent className="p-5">
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-64 mb-1" />
              <Skeleton className="h-4 w-48" />
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="rounded-xl shadow-sm border">
                <CardContent className="p-4 flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="shadow-xl rounded-2xl p-4">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="rounded-xl">
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-5 w-32" />
                  {[...Array(3)].map((_, j) => (
                    <Skeleton key={j} className="h-4 w-full" />
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const isFreePlan = dashboardData.subscription.plan_name === "FREE" || dashboardData.subscription.price === 0;

  return (
    <div className={`${isSidebarOpen ? "lg:p-6 lg:ml-56" : "lg:p-4 lg:ml-16"}`}>

      <div className="p-4 space-y-6">
      <h1 className="text-md border-1 border-[#0c1f4d] text-[#0c1f4d] bg-gray-100 p-2 rounded-r-2xl w-28 font-bold">Dashboard</h1>
        {/* 📥 Subscription Plan */}
        <motion.div
          className="grid grid-cols-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-md">
            <CardContent className="p-5">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold mb-1">
                    Current Plan: {dashboardData.subscription.plan_name}
                  </h2>
                  <p className="text-sm flex gap-2 items-center">
                    <CalendarDays className="h-4 w-4" /> {dashboardData.subscription.start_date} →{" "}
                    {dashboardData.subscription.end_date}
                  </p>
                  <p>
                    Status: {dashboardData.subscription.status}
                    {!isFreePlan && ` | ₹${dashboardData.subscription.price.toFixed(0)}`} (
                    {dashboardData.subscription.duration})
                  </p>
                </div>
                <BadgeCheck className="w-10 h-10 text-green-300" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 🔢 Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {dashboardData.stats.length > 0 ? (
            dashboardData.stats.map((item, i) => {
              const Icon = iconMap[item.icon];
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="rounded-xl shadow-sm border">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className={`p-2 rounded-full ${item.bg}`}>
                        <Icon className={`h-6 w-6 ${item.color}`} />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{item.title}</p>
                        <h3 className="text-xl font-bold">{item.count}</h3>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground">No stats available</p>
          )}
        </div>

        {/* 📊 Trending Chart */}
        <motion.div
          className="rounded-xl bg-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Card className="shadow-xl rounded-2xl p-4">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xl font-semibold">
                <TrendingUp className="w-6 h-6 text-purple-600 animate-bounce" />
                Trending Products (This Month)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardData.trendingProducts.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dashboardData.trendingProducts}>
                    <XAxis dataKey="name" stroke="#8884d8" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="points" barSize={60} fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground">No trending products available</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Latest 5 Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Reviews */}
          <Card className="rounded-xl">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <h3 className="font-semibold">Latest Reviews</h3>
              </div>
              {dashboardData.reviews.length > 0 ? (
                dashboardData.reviews.map((r) => (
                  <div key={r.id} className="text-sm border-b pb-1">
                    <p className="font-medium">{r.user}</p>
                    <p className="text-muted-foreground">
                      {r.comment} (⭐ {r.rating})
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No reviews available</p>
              )}
            </CardContent>
          </Card>

          {/* Complaints */}
          <Card className="rounded-xl">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <FileWarning className="h-5 w-5 text-red-500" />
                <h3 className="font-semibold">Latest Complaints</h3>
              </div>
              {dashboardData.complaints.length > 0 ? (
                dashboardData.complaints.map((c) => (
                  <div key={c.id} className="text-sm border-b pb-1">
                    <p className="font-medium">{c.user}</p>
                    <p className="text-muted-foreground">
                      {c.issue} ({c.type} - {c.option})
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No complaints available</p>
              )}
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card className="rounded-xl">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                <h3 className="font-semibold">Latest Requirements</h3>
              </div>
              {dashboardData.requirements.length > 0 ? (
                dashboardData.requirements.map((r) => (
                  <div key={r.id} className="text-sm border-b pb-1">
                    <p className="font-medium">{r.product}</p>
                    <p className="text-muted-foreground">Qty: {r.qty}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No requirements available</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;