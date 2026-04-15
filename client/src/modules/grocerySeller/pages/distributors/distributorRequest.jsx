import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '@/modules/landing/context/AuthContext';
import {
  Check, X, Clock, Factory, ShieldCheck, ShieldAlert,
  Search, Send, Loader2, Trash2, MapPin, Mail, Building2, Phone, Eye, ChevronRight
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { toast, Toaster } from "sonner";
import Loader from "@/loader/Loader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ChildRequests = () => {
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Search & Discovery State ---
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sendingId, setSendingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewingEntity, setViewingEntity] = useState(null);

  const userId = user?._id || user?.id || user?.user?._id || user?.user?.id;

  const fetchRequests = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/distributors/my-requests/${userId}`);
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch Error:", err);
      toast.error("Failed to load invitations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => { fetchRequests(); }, 500);
    return () => clearTimeout(timer);
  }, [userId]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      // Grocery Sellers always search for 'parent' (Manufacturers)
      const res = await fetch(`${import.meta.env.VITE_API_URL}/distributors/search?query=${searchQuery}&type=parent`);
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      toast.error("Search failed");
    } finally {
      setIsSearching(false);
    }
  };

  const sendRequest = async (manufacturerId) => {
    setSendingId(manufacturerId);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/distributors/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manufacturerId,
          childIds: [userId],
          adminId: userId,
          partnership_type: 'distributor' // Default for Grocery Sellers
        })
      });

      if (res.ok) {
        toast.success("Partnership request sent successfully!");
        setSearchQuery("");
        setSearchResults([]);
        fetchRequests();
      } else {
        const errData = await res.json();
        toast.error(errData.message || "Failed to send request");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setSendingId(null);
    }
  };

  const handleAction = async (requestId, status) => {
    try {
      setIsProcessing(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/distributors/respond/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, userId })
      });

      if (res.ok) {
        toast.success(`Request ${status} successfully`);
        fetchRequests();
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (requestId) => {
    if (!window.confirm("Delete this record from your history?")) return;
    setDeletingId(requestId);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/distributors/request/${requestId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success("Record deleted");
        setRequests(prev => prev.filter(r => r._id !== requestId));
      }
    } catch (err) {
      toast.error("Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  const pending = requests.filter(r => r.status === 'pending');
  const history = requests.filter(r => r.status !== 'pending');

  if (loading) {
    return (
      <div className="flex justify-center flex-col items-center min-h-[60vh] w-full relative">
        <Loader contained={true} label="Loading invitations..." />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {isProcessing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <Loader label="Processing..." />
        </div>
      )}
      <Toaster richColors position="top-right" />

      <header className="border-b pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Supply Management</h1>
        <p className="text-sm text-muted-foreground">Find manufacturers to stock your inventory</p>
      </header>

      {/* Search Section */}
      <section className="space-y-4 bg-white p-6 rounded-2xl border shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
          <Search size={16} /> Discovery
        </h2>
        <div className="flex gap-2">
          <Input
            placeholder="Search manufacturers by name, email, or brand..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 border-2 border-slate-300"
          />
          <Button className="bg-[#0c1f4d] hover:bg-[#142c63] px-8" onClick={handleSearch} disabled={isSearching}>
            {isSearching ? <Loader2 className="animate-spin" size={18} /> : "Search"}
          </Button>
        </div>

        {searchResults.length > 0 && (
          <div className="grid gap-3 mt-4 animate-in fade-in slide-in-from-top-2">
            {searchResults.map((result) => (
              <div key={result.user._id} className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white rounded-lg border shadow-sm">
                    <Factory className="text-orange-500" size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{result.details?.company_name || result.user.name}</p>
                    <p className="text-xs text-muted-foreground uppercase font-medium">
                      {result.user.user_code} • {result.details?.company_type?.displayName || 'Manufacturer'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-full px-3 h-9 w-9 p-0 cursor-pointer"
                    onClick={() => setViewingEntity(result)}
                  >
                    <Eye className="h-4 w-4 text-slate-500" />
                  </Button>
                  <Button
                    size="sm"
                    className="rounded-full px-6 bg-[#0c1f4d]"
                    disabled={sendingId === result.user._id}
                    onClick={() => sendRequest(result.user._id)}
                  >
                    {sendingId === result.user._id ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} className="mr-2" />}
                    Connect
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Tabs Section */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="pending" className="rounded-lg">
            Invitations {pending.length > 0 && <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center" variant="destructive">{pending.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg">History</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6 space-y-4">
          {pending.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed rounded-3xl bg-slate-50/50">
              <Clock className="mx-auto mb-3 text-slate-300" size={48} />
              <p className="text-slate-500 font-medium">No pending invitations from manufacturers.</p>
            </div>
          ) : (
            pending.map((req) => (
              <RequestCard key={req._id} req={req} onAction={handleAction} currentUserId={userId} isPending onViewDetail={setViewingEntity} />
            ))
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-6 space-y-4">
          {history.length === 0 ? (
            <div className="text-center py-20 text-slate-400 italic">No network history yet.</div>
          ) : (
            history.map((req) => (
              <RequestCard key={req._id} req={req} currentUserId={userId} isPending={false} onDelete={handleDelete} isDeleting={deletingId === req._id} onViewDetail={setViewingEntity} />
            ))
          )}
        </TabsContent>
      </Tabs>

      <EntityDetailModal
        entity={viewingEntity}
        isOpen={!!viewingEntity}
        onClose={() => setViewingEntity(null)}
      />
    </div>
  );
};

const RequestCard = ({ req, onAction, currentUserId, isPending, onDelete, isDeleting, onViewDetail }) => {
  const isSentByMe = String(req.initiated_by?._id || req.initiated_by) === String(currentUserId);
  const manufacturer = req.manufacturer_id;
  const business = manufacturer?.businessDetails;
  const addr = manufacturer?.addressDetails;

  const businessName = business?.company_name || business?.shop_name || manufacturer?.name || 'Manufacturer';
  const locationLabel = addr ? `${addr.city}, ${addr.state} ${addr.pincode}` : 'Address not available';

  return (
    <Card className="hover:shadow-md transition-all border-l-4 border-l-primary/20 overflow-hidden">
      <div className="flex flex-col md:flex-row items-start p-5 gap-5">

        {/* Brand/Role Icon */}
        <div className="p-4 rounded-2xl bg-orange-50 text-orange-600 shadow-sm hidden sm:block">
          <Factory size={28} />
        </div>

        {/* Content Section */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="font-extrabold text-xl text-slate-800 leading-tight">
              {businessName}
            </h3>
            <Badge variant="secondary" className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2">
               ID: {manufacturer?.user_code}
            </Badge>
            <Button 
                size="sm" 
                variant="ghost" 
                className="rounded-full h-8 w-8 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer" 
                onClick={() => onViewDetail({
                    user: manufacturer,
                    details: business,
                    addresses: manufacturer.addresses || (addr ? [addr] : []),
                    type: business?.company_type?.displayName || 'Manufacturer'
                })}
                title="View Full Profile"
            >
                <Eye size={16} />
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 py-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Mail size={14} className="text-slate-400 shrink-0" />
              <span className="truncate">{manufacturer?.email}</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin size={14} className="text-slate-400 shrink-0" />
              <span className="capitalize truncate">{locationLabel}</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Building2 size={14} className="text-slate-400 shrink-0" />
              <span className="font-semibold text-slate-600">Join as:</span>
              <Badge variant="outline" className="text-[10px] uppercase font-bold py-0 h-4 bg-slate-50">
                {req.partnership_type || 'Distributor'}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Badge variant={isSentByMe ? "outline" : "secondary"} className="text-[9px] uppercase tracking-wider h-5 px-2">
              {isSentByMe ? 'Request Sent' : 'Incoming Invitation'}
            </Badge>
          </div>
        </div>

        {/* Action Buttons Section */}
        <div className="flex items-center self-center gap-3 min-w-[150px] justify-end">
          {isPending ? (
            isSentByMe ? (
              <Badge variant="secondary" className="animate-pulse bg-amber-50 text-amber-700 border-amber-200 px-4 py-1">
                Waiting for response
              </Badge>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => onAction(req._id, 'rejected')}>
                  <X size={16} />
                </Button>
                <Button size="sm" className="bg-[#0c1f4d] hover:bg-[#142c63] shadow-sm text-white" onClick={() => onAction(req._id, 'accepted')}>
                  <Check size={16} className="mr-1" /> Accept
                </Button>
              </div>
            )
          ) : (
            <div className="flex items-center gap-3">
              <Badge className={req.status === 'accepted' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'} variant="secondary">
                <span className="flex items-center gap-1">
                    {req.status === 'accepted' ? <ShieldCheck size={12}/> : <ShieldAlert size={12}/>}
                    {req.status.toUpperCase()}
                </span>
              </Badge>
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-slate-400 hover:text-red-600 hover:bg-red-50 h-9 w-9 rounded-full"
                  onClick={() => onDelete(req._id)}
                  disabled={isDeleting}
                >
                  {isDeleting ? <Loader2 className="animate-spin h-4 w-4" /> : <Trash2 size={16} />}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="px-5 py-2.5 bg-slate-50/80 text-[10px] text-muted-foreground flex justify-between items-center border-t border-slate-100">
        <div className="flex gap-4">
            {addr && (
              <span className="flex items-center gap-1">
                Full Address: <b className="text-slate-600 font-bold uppercase">{addr.address_line_1}, {addr.city}</b>
              </span>
            )}
            {business?.phone && (
              <span className="flex items-center gap-1">
                <Phone size={10} />
                Contact: <b className="text-slate-600 font-bold">{business.phone}</b>
              </span>
            )}
        </div>
        <span>Date: {new Date(req.createdAt).toLocaleDateString()}</span>
      </div>
    </Card>
  );
};

const EntityDetailModal = ({ entity, isOpen, onClose }) => {
  if (!entity) return null;

  const user = entity.user;
  const details = entity.details;
  const addresses = entity.addresses || [];

  const businessName = details?.shop_name || details?.company_name || user?.name;
  const businessEmail = details?.shop_email || details?.company_email || user?.email;
  const businessPhone = details?.shop_phone_number || details?.company_phone_number || user?.phone;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 border-none bg-slate-50">
        <DialogHeader className="p-6 bg-[#0c1f4d] text-white">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                {entity.type?.toLowerCase().includes('manufacturer') ? <Factory className="w-6 h-6" /> : <Building2 className="w-6 h-6" />}
             </div>
             <div>
                <DialogTitle className="text-xl font-bold">{businessName}</DialogTitle>
                <p className="text-sm text-blue-200 uppercase tracking-widest font-bold mt-0.5">
                  {entity.type} • {user?.user_code}
                </p>
             </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          <section className="bg-white p-5 rounded-2xl shadow-sm border space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
               <ShieldCheck size={14} className="text-blue-500" /> Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                 <div className="p-2.5 bg-slate-50 rounded-lg text-slate-400"><Mail size={16} /></div>
                 <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Email Address</p>
                    <p className="text-sm font-semibold text-slate-700">{businessEmail}</p>
                 </div>
              </div>
              <div className="flex items-center gap-3">
                 <div className="p-2.5 bg-slate-50 rounded-lg text-slate-400"><Phone size={16} /></div>
                 <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Contact Number</p>
                    <p className="text-sm font-semibold text-slate-700">{businessPhone}</p>
                 </div>
              </div>
            </div>
          </section>

          {details && (
             <section className="bg-white p-5 rounded-2xl shadow-sm border space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <Building2 size={14} className="text-blue-500" /> Business Profile
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                       <p className="text-[10px] uppercase font-bold text-muted-foreground">Legal Name</p>
                       <p className="text-sm font-semibold text-slate-700">{details.company_name || details.shop_name}</p>
                   </div>
                   {details.gstin && (
                      <div>
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">GSTIN</p>
                          <Badge variant="secondary" className="font-mono text-blue-600 bg-blue-50 mt-1">{details.gstin}</Badge>
                      </div>
                   )}
                   {details.company_type?.displayName && (
                      <div>
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Entity Type</p>
                          <p className="text-sm font-semibold text-slate-700">{details.company_type.displayName}</p>
                       </div>
                   )}
                </div>
             </section>
          )}

          <section className="space-y-4 pb-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
               <MapPin size={14} className="text-blue-500" /> Registered Locations ({addresses.length})
            </h3>
            <div className="space-y-3">
              {addresses.length === 0 ? (
                <div className="text-center p-8 bg-slate-100/50 rounded-2xl border-2 border-dashed text-slate-400 text-sm">
                   No addresses found for this entity.
                </div>
              ) : (
                addresses.map((addr, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border flex items-start gap-4 hover:border-blue-200 transition-colors">
                     <div className="mt-1 p-2 bg-slate-50 rounded-lg text-slate-300">
                        <MapPin size={18} />
                     </div>
                     <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                           <Badge className="text-[9px] uppercase font-bold px-2 h-5 bg-slate-100 text-slate-600 border-none">
                              {addr.address_type}
                           </Badge>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed font-medium capitalize">
                           {addr.address_line_1}{addr.address_line_2 ? ', ' + addr.address_line_2 : ''}
                           <br />
                           <span className="text-slate-400">{addr.city}, {addr.state} - {addr.pincode}</span>
                        </p>
                     </div>
                     <ChevronRight className="text-slate-200 mt-5" size={16} />
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChildRequests;
