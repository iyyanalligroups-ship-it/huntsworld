import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '@/modules/landing/context/AuthContext';
import {
  Users,
  Wallet,
  CheckCircle,
  Clock,
  History,
  IndianRupee,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Copy,
  Check,
  Link
} from 'lucide-react';
import showToast from '@/toast/showToast';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from '@/components/ui/pagination';
import { useNavigate } from 'react-router-dom';
import Loader from '@/loader/Loader';

const ReferralDashboard = () => {
  const { token, user } = useContext(AuthContext);
  const [data, setData] = useState({
    referrals: [],
    stats: {},
    commissionHistory: [],
  });
  const [loading, setLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (!user?.user?.referral_code) return;
    const link = `${import.meta.env.VITE_CLIENT_URL}/referral-register/${user.user.referral_code}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      showToast('Referral link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/referral-commissions/my-data`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) setData(result);
    } catch (err) {
      showToast('Failed to load referral data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    setIsClaiming(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/referral-commissions/request-claim`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const result = await res.json();
      if (res.ok && result.success) {
        showToast(result.message || 'Claim submitted!', 'success');
        fetchData();
        return;
      }
      showToast(result.message || 'Unable to process claim', 'error');
    } catch (err) {
      showToast('Network error', 'error');
    } finally {
      setIsClaiming(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      PAID: 'bg-green-100 text-green-800 hover:bg-green-100 border-green-200',
      CLAIM_REQUESTED: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200',
      EARNED: 'bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200',
      REJECTED: 'bg-red-100 text-red-800 hover:bg-red-100 border-red-200',
    };

    return (
      <Badge
        variant="outline"
        className={`text-xs font-bold uppercase tracking-tight px-2.5 py-0.5 ${variants[status] || 'bg-gray-100 text-gray-800'}`}
      >
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentHistory = data.commissionHistory.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(data.commissionHistory.length / itemsPerPage);

  const getPageNumbers = () => {
    const maxPagesToShow = 7;
    const pages = [];

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    pages.push(1);

    if (currentPage > 3) {
      pages.push('...');
    }

    const start = Math.max(2, currentPage - 2);
    const end = Math.min(totalPages - 1, currentPage + 2);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push('...');
    }

    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  if (loading) {
    return <Loader label="Syncing Ledger..." />;
  }

  return (

    <div className="container relative mx-auto space-y-10 lg:p-10 p-2 md:py-10 bg-background min-h-screen">
      {isClaiming && <Loader label="Processing Payout Request..." />}
      <Button
        type="button"
        onClick={() => navigate(-1)}
        variant="outline"
        className="hidden md:flex absolute cursor-pointer  left-2 z-40 gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Button>
      <div className="space-y-6 mt-10">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary p-2 shadow">
              <Wallet className="h-6 w-6 text-primary-foreground" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Referral Dashboard</h2>
          </div>

          {user?.user?.referral_code && (
            <button
              onClick={handleCopyCode}
              title="Click to copy referral link"
              className="cursor-pointer group inline-flex items-center gap-2 bg-primary/5 hover:bg-primary/10 border border-primary/20 hover:border-primary/40 rounded-full px-4 py-1.5 transition-all duration-200 active:scale-95 shadow-sm"
            >
              <Link className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Copy Link</span>
              <span className="font-mono text-sm font-bold text-primary tracking-widest">
                {user?.user?.referral_code}
              </span>
              <span className={`transition-all duration-200 ${
                copied ? 'text-green-500' : 'text-muted-foreground group-hover:text-primary'
              }`}>
                {copied
                  ? <Check className="h-4 w-4" />
                  : <Copy className="h-4 w-4" />
                }
              </span>
            </button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Earned"
            amount={data.stats.total_earned}
            icon={<IndianRupee className="h-5 w-5" />}
            variant="blue"
          />
          <StatCard
            title="Total Claimed"
            amount={data.stats.claimed_amount}
            icon={<CheckCircle className="h-5 w-5" />}
            variant="green"
          />
          <StatCard
            title="Pending Review"
            amount={data.stats.request_pending_amount}
            icon={<Clock className="h-5 w-5" />}
            variant="yellow"
          />

          <Card className="border-primary/30 bg-card shadow-sm">
            <CardContent className="pt-6 flex flex-col h-full justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Withdrawal Ready
                </p>
                <h3 className="text-2xl font-bold mt-1">₹{data.stats.available_to_claim || 0}</h3>
              </div>
              <Button
                onClick={handleClaim}
                disabled={Number(data.stats.available_to_claim) <= 0}
                className="mt-6 w-full font-bold uppercase tracking-wide"
                size="lg"
              >
                Request Payout
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Your Network
              </h3>
            </div>
            <Badge variant="secondary" className="text-xs">
              {data.referrals.length} Verified
            </Badge>
          </div>

          <Card className="shadow-sm">
            <CardContent className="p-0">
              <div className="max-h-[420px] overflow-y-auto divide-y">
                {data.referrals.map((ref) => (
                  <div
                    key={ref._id}
                    className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-semibold text-sm uppercase">
                        {ref.name?.substring(0, 2)}
                      </div>
                      <div>
                        <p className="font-medium">{ref.name}</p>
                        <p className="text-xs text-muted-foreground font-medium">{ref.role?.role}</p>
                      </div>
                    </div>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                ))}

                {data.referrals.length === 0 && (
                  <div className="py-16 text-center text-sm text-muted-foreground">
                    Network is empty.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Earning History
            </h3>
          </div>

          <Card className="shadow-sm">
            <CardContent className="p-0">
              <div className="hidden md:block">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">
                        Source Customer
                      </TableHead>
                      <TableHead className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">
                        Your Cut
                      </TableHead>
                      <TableHead className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">
                        Status
                      </TableHead>
                      <TableHead className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider">
                        Date
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentHistory.map((item) => (
                      <TableRow key={item._id} className="hover:bg-muted/30">
                        <TableCell className="px-6 py-4">
                          <div className="font-medium">{item.referred_user_id?.name || 'Customer'}</div>
                          <div className="text-xs text-muted-foreground">
                            Transaction: ₹{item.plan_amount}
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center font-bold text-lg">
                            ₹{item.commission_amount}
                            <ArrowUpRight className="ml-1.5 h-4 w-4 text-green-600" />
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">{getStatusBadge(item.status)}</TableCell>
                        <TableCell className="px-6 py-4 text-right text-xs text-muted-foreground">
                          {new Date(item.createdAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="md:hidden space-y-4 p-4">
                {currentHistory.map((item) => (
                  <Card key={item._id} className="shadow-sm">
                    <CardContent className="p-5 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            From
                          </p>
                          <p className="font-medium">{item.referred_user_id?.name || 'Customer'}</p>
                        </div>
                        {getStatusBadge(item.status)}
                      </div>
                      <div className="flex justify-between items-end pt-3 border-t">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Commission
                          </p>
                          <p className="text-2xl font-bold">₹{item.commission_amount}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {data.commissionHistory.length === 0 && (
                <div className="py-16 text-center text-sm text-muted-foreground font-medium">
                  No data points recorded yet
                </div>
              )}
            </CardContent>
          </Card>

          {data.commissionHistory.length > itemsPerPage && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
              <div className="text-xs text-muted-foreground order-2 sm:order-1">
                Showing {indexOfFirstItem + 1}–{Math.min(indexOfLastItem, data.commissionHistory.length)} of {data.commissionHistory.length}
              </div>

              <Pagination className="order-1 sm:order-2">
                <PaginationContent>
                  <PaginationItem>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </PaginationItem>

                  {getPageNumbers().map((page, idx) => (
                    <PaginationItem key={idx}>
                      {page === '...' ? (
                        <span className="flex h-9 w-9 items-center justify-center text-sm text-muted-foreground">
                          …
                        </span>
                      ) : (
                        <Button
                          variant={currentPage === page ? 'default' : 'outline'}
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => setCurrentPage(Number(page))}
                        >
                          {page}
                        </Button>
                      )}
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, amount, icon, variant = 'blue' }) => {
  const variants = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    green: 'bg-green-50 text-green-700 border-green-100',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-100',
  };

  return (
    <Card className={`border shadow-sm ${variants[variant]}`}>
      <CardContent className="p-6 flex items-center gap-4">
        <div className="p-3 rounded-lg bg-white/80 shadow-inner">{icon}</div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {title}
          </p>
          <h3 className="text-2xl font-bold mt-1">₹{amount || 0}</h3>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReferralDashboard;
