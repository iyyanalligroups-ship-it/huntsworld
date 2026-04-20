
import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from 'react-router-dom';
import { useGetAllActiveSubscriptionsQuery } from '@/redux/api/UserSubscriptionPlanApi';
import { Edit, X, Calendar } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis
} from "@/components/ui/pagination";

const PurchasedSellersTable = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const limit = 5;
  const { data: activeSubscriptions, isLoading, error } = useGetAllActiveSubscriptionsQuery({ page, limit });

  if (isLoading) return <div>Loading purchased sellers...</div>;
  if (error) return <div>Error fetching subscriptions: {error.message}</div>;

  const subscriptions = activeSubscriptions?.data || [];
  const pagination = activeSubscriptions?.pagination || {};
  const { total = 0, totalPages = 1, hasNextPage, hasPrevPage } = pagination;

  const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : "?");

  const priceBadgeVariant = (amount) => {
    const a = Number(amount) || 0;
    if (a >= 100 && a <= 999) return "bg-emerald-100 text-emerald-700";
    if (a >= 1000 && a <= 2999) return "bg-amber-100 text-amber-700";
    if (a >= 3000) return "bg-rose-100 text-rose-700";
    return "bg-slate-100 text-slate-700";
  };

  const randomNameColor = () => {
    const colors = [
      "bg-red-600",
      "bg-[#0c1f4d]",
      "bg-green-600",
      "bg-purple-600",
      "bg-orange-600",
      "bg-pink-600",
      "bg-teal-600",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handleUpgrade = (sellerId, activePlanId, subscriptionId) => {
    navigate('/admin/payments/upgrade', {
      state: {
        activePlanId,
        oldSubscriptionId: subscriptionId,
        selectedSellerId: sellerId,
      },
    });
  };

  const handleCancel = (subscriptionId) => {
    navigate('/admin/payments/cancel', {
      state: { subscriptionId },
    });
  };

  return (
    <div className="mt-8">
      <h3 className="text-2xl font-bold text-[#0c1f4d] mb-4">Purchased Sellers</h3>
      {subscriptions.length > 0 ? (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Seller</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Renewal Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {subscriptions.map((sub) => {
                const seller = sub.user || {};
                const plan = sub.subscription_plan_id || {};
                const renewalDate = new Date(sub.created_at);
                renewalDate.setFullYear(renewalDate.getFullYear() + 1);

                return (
                  <TableRow key={sub._id}>
                    <TableCell className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className={`font-medium text-white ${randomNameColor()}`}>
                          {getInitial(seller.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">{seller.name || "N/A"}</span>
                        <span className="text-xs text-muted-foreground">Seller</span>
                      </div>
                    </TableCell>

                    <TableCell>{seller.email}</TableCell>
                    <TableCell>{seller.phone || "N/A"}</TableCell>

                    <TableCell>
                      <Badge className="px-3 py-1 font-medium">{plan.plan_name || "—"}</Badge>
                    </TableCell>

                    <TableCell>
                      <div className={`inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm ${priceBadgeVariant(plan.price)}`}>
                        <span className="font-semibold">₹{plan.price}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground ছোট করুন">
                        <Calendar className="h-4 w-4" />
                        <span>{renewalDate.toLocaleDateString()}</span>
                      </div>
                    </TableCell>

                    <TableCell className="flex gap-2">
                      <Button
                        onClick={() => handleUpgrade(seller._id, plan._id, sub._id)}
                        variant="ghost"
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Edit className="h-4 w-4" />
                        <span className="hidden sm:inline">Upgrade</span>
                      </Button>

                      <Button
                        onClick={() => handleCancel(sub._id)}
                        variant="destructive"
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                        <span className="hidden sm:inline">Cancel</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {totalPages > 1 && (
            <div className="mt-4 flex justify-end">
              <Pagination>
                <PaginationContent>

                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (hasPrevPage) setPage(page - 1);
                      }}
                      className={!hasPrevPage ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        href="#"
                        isActive={page === pageNum}
                        onClick={(e) => {
                          e.preventDefault();
                          setPage(pageNum);
                        }}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  {totalPages > 5 && page < totalPages - 2 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (hasNextPage) setPage(page + 1);
                      }}
                      className={!hasNextPage ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      ) : (
        <p>No purchased sellers found.</p>
      )}
    </div>
  );
};

export default PurchasedSellersTable;
