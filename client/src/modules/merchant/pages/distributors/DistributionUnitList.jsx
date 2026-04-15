import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '@/modules/landing/context/AuthContext';
import {
  Check, X, Clock, Factory, Store, Search,
  Send, Loader2, ShieldCheck, ShieldAlert, Trash2, ArrowRightLeft, MapPin, Mail, Building2, Eye, Phone, ChevronRight
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

const MerchantPartnerships = () => {
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- UI Control States ---
  const [partnershipRole, setPartnershipRole] = useState(null); // 'parent' or 'child'
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sendingId, setSendingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [viewingEntity, setViewingEntity] = useState(null);

  // Default type for NEW search requests
  const [selectedType, setSelectedType] = useState('distributor');

  const userId = user?._id || user?.id || user?.user?._id || user?.user?.id;

  // 1. Resolve Partnership Role (Manufacturer vs Distributor)
  const resolvePartnershipRole = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/distributors/partnership-role/${userId}`);
      const data = await res.json();
      setPartnershipRole(data.role);
    } catch (err) {
      console.error("Failed to resolve role");
      setPartnershipRole('child');
    }
  };

  // 2. Fetch connection requests with enriched details
  const fetchRequests = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/distributors/my-requests/${userId}`);
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Failed to load request history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      resolvePartnershipRole();
      fetchRequests();

      const handleRefresh = () => {
          console.log("Real-time distributor refresh triggered...");
          fetchRequests();
      };

      window.addEventListener('refresh-distributor-requests', handleRefresh);
      return () => window.removeEventListener('refresh-distributor-requests', handleRefresh);
    }
  }, [userId]);

  const isManufacturer = partnershipRole === 'parent';
  const myRoleLabel = isManufacturer ? "Manufacturer (Parent)" : "Distributor/Merchant (Child)";
  const searchTargetType = isManufacturer ? 'child' : 'parent';

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/distributors/search?query=${searchQuery}&type=${searchTargetType}&requesterRole=${partnershipRole}`
      );
      const data = await res.json();
      console.log(data,'data search');
      setSearchResults(data.filter(item => (item.user?._id || item.user) !== userId));
    } catch (err) {
      toast.error("Search failed");
    } finally {
      setIsSearching(false);
    }
  };

  const sendRequest = async (targetId) => {
    setSendingId(targetId);
    try {
      const payload = {
        manufacturerId: isManufacturer ? userId : targetId,
        childIds: [isManufacturer ? targetId : userId],
        adminId: userId,
        partnership_type: selectedType
      };

      const res = await fetch(`${import.meta.env.VITE_API_URL}/distributors/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success(`Request sent as ${selectedType}!`);
        setSearchResults([]);
        setSearchQuery("");
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

  const handleAction = async (requestId, status, updatedType) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/distributors/respond/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          partnership_type: updatedType,
          userId: userId
        })
      });
      if (res.ok) {
        toast.success(`Partnership ${status}`);
        // No need to manually refresh, socket event will trigger it if configured, 
        // but explicit call is safer for immediate feedback
        fetchRequests();
      }
    } catch (err) {
      toast.error("Action failed");
    }
  };

  const handleMarkAsRead = async (requestId) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/distributors/${requestId}/read`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}` // Ensure auth if needed, routes might require it
        }
      });
      if (res.ok) {
          setRequests(prev => prev.map(r => r._id === requestId ? { ...r, isReadByRecipient: true } : r));
      }
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const handleDeleteHistory = async (requestId) => {
    if (!window.confirm("Delete this record from history?")) return;
    setDeletingId(requestId);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/distributors/request/${requestId}`, { method: 'DELETE' });
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

  const pending = requests
    .filter(r => r.status === 'pending')
    .sort((a, b) => {
       // Unread recipient requests first
       const aIsUnread = !a.isReadByRecipient && String(a.initiated_by?._id || a.initiated_by) !== String(userId);
       const bIsUnread = !b.isReadByRecipient && String(b.initiated_by?._id || b.initiated_by) !== String(userId);
       if (aIsUnread && !bIsUnread) return -1;
       if (!aIsUnread && bIsUnread) return 1;
       return new Date(b.createdAt) - new Date(a.createdAt);
    });
  const history = requests.filter(r => r.status !== 'pending');

  if (!partnershipRole && loading) {
    return <Loader />;
  }

  return (
    <div className="p-6 space-y-8">
      <Toaster richColors position="top-right" />

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Partnership Hub</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
            Account Mode: <Badge variant="secondary" className="uppercase font-bold text-[10px] tracking-widest">{myRoleLabel}</Badge>
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder={isManufacturer ? "Search by phone or user code..." : "Search manufacturers..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-[300px] border-2 border-slate-300"
          />
          <Button onClick={handleSearch} disabled={isSearching} className="gap-2 bg-[#0c1f4d] hover:bg-[#0c204ded] cursor-pointer">
            {isSearching ? <Loader2 className="animate-spin h-4 w-4 " /> : <Search className="h-4 w-4" />}
            Search
          </Button>
        </div>
      </header>

      {/* Discovery Results */}
      {searchResults.length > 0 && (
        <section className="bg-primary/5 p-5 rounded-2xl border border-primary/10 shadow-sm animate-in fade-in duration-500">
          <div className="flex justify-between items-center mb-4">
             <h2 className="text-xs font-bold uppercase tracking-widest text-primary">Discovery Results</h2>
             <div className="flex items-center gap-2 bg-white p-1.5 rounded-lg border-2 border-slate-300 shadow-sm">
                <span className="text-[10px] font-bold text-muted-foreground px-2">PARTNER AS:</span>
                <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="text-xs font-bold text-slate-700 border-none focus:ring-0 cursor-pointer outline-none bg-transparent"
                >
                    <option value="distributor">DISTRIBUTOR</option>
                    <option value="supplier">SUPPLIER</option>
                </select>
             </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {searchResults.map((result) => {
              const targetId = result.user?._id || result.user;
              return (
                <Card key={targetId} className="bg-white border-none shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-slate-100 rounded-xl">
                        {result.type?.toLowerCase().includes('manufacturer') ? <Factory className="text-orange-500 w-5 h-5" /> : <Store className="text-blue-500 w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-bold text-sm leading-tight">{result.user?.name || result.name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-medium mt-0.5">
                          {result.type} • {result.user?.user_code || result.user_code}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                       <Button size="sm" variant="ghost" className="rounded-full px-3 h-9 w-9 p-0 cursor-pointer" onClick={() => setViewingEntity(result)}>
                         <Eye className="h-4 w-4 text-slate-500" />
                       </Button>
                       <Button size="sm" variant="outline" className="rounded-full px-4 h-9 cursor-pointer" onClick={() => sendRequest(targetId)} disabled={sendingId === targetId}>
                         {sendingId === targetId ? <Loader2 className="animate-spin h-3 w-3" /> : <Send className="h-3 w-3 mr-1" />}
                         Connect
                       </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Request Management Tabs */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid grid-cols-2 max-w-[400px] bg-slate-100 p-1">
          <TabsTrigger value="pending" className="data-[state=active]:shadow-sm">
            Pending {pending.length > 0 && <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center" variant="destructive">{pending.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="space-y-4 mt-6">
          {pending.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed rounded-2xl bg-slate-50/50">
              <Clock className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">No pending invitations or requests.</p>
            </div>
          ) : (
            pending.map((req) => (
              <RequestCard key={req._id} req={req} userId={userId} onAction={handleAction} onMarkRead={handleMarkAsRead} onViewDetail={setViewingEntity} />
            ))
          )}
        </TabsContent>
 
        <TabsContent value="history" className="space-y-4 mt-6">
          {history.length === 0 ? (
            <div className="text-center py-20 italic text-slate-400">Your network history is currently empty.</div>
          ) : (
            history.map((req) => (
              <RequestCard
                key={req._id}
                req={req}
                userId={userId}
                isHistory
                onDelete={handleDeleteHistory}
                isDeleting={deletingId === req._id}
                onViewDetail={setViewingEntity}
              />
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
                {entity.type?.toLowerCase().includes('manufacturer') ? <Factory className="w-6 h-6" /> : <Store className="w-6 h-6" />}
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
          {/* User & Contact Info */}
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

          {/* Business Details */}
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

          {/* Addresses */}
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

const RequestCard = ({ req, userId, onAction, isHistory, onDelete, isDeleting, onMarkRead }) => {
  const currentUserIdStr = String(userId);
  const manufacturerIdStr = String(req.manufacturer_id?._id || req.manufacturer_id);
  const initiatedByIdStr = String(req.initiated_by?._id || req.initiated_by);

  const isItheParentSide = manufacturerIdStr === currentUserIdStr;
  const partner = isItheParentSide ? req.child_id : req.manufacturer_id;
  const isSentByMe = initiatedByIdStr === currentUserIdStr;
  const partnerIsManufacturer = !isItheParentSide;

  // --- BUSINESS & ADDRESS EXTRACTION ---
  const business = partner?.businessDetails;
  const addr = partner?.addressDetails;

  const businessName = business?.shop_name || business?.company_name || partner?.name || 'Partner';
  const typeLabel = partnerIsManufacturer ? 'Manufacturer' : (business?.company_type?.displayName || 'Distributor');

  // Format Address (City, State - Pincode)
  const locationLabel = addr
    ? `${addr.city}, ${addr.state} ${addr.pincode ? '- ' + addr.pincode : ''}`
    : 'Location not provided';

  const [editedType, setEditedType] = useState(req.partnership_type || 'distributor');

  const handleOpenDetail = () => {
    onViewDetail({
        user: partner,
        details: business,
        addresses: partner.addresses || (addr ? [addr] : []),
        type: typeLabel
    });
  };

  return (
    <Card className="hover:shadow-md transition-all border-l-4 border-l-primary/20 overflow-hidden">
      <div className="flex flex-col md:flex-row items-start p-5 gap-5">

        {/* Profile/Role Icon */}
        <div className={`p-4 rounded-2xl mt-1 hidden sm:block shadow-sm ${partnerIsManufacturer ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
          {partnerIsManufacturer ? <Factory size={28} /> : <Store size={28} />}
        </div>

        {/* Core Information */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="font-extrabold text-xl text-slate-800 leading-tight">
              {businessName}
            </h3>
            <Badge variant="secondary" className="text-[10px] font-mono tracking-tighter bg-slate-100 text-slate-600 px-2">
               ID: {partner?.user_code}
            </Badge>
            <Button 
                size="sm" 
                variant="ghost" 
                className="rounded-full h-8 w-8 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer" 
                onClick={handleOpenDetail}
                title="View Full Profile"
            >
                <Eye size={16} />
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 py-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Mail size={14} className="text-slate-400 shrink-0" />
              <span className="truncate">{partner?.email}</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin size={14} className="text-slate-400 shrink-0" />
              <span className="capitalize truncate">{locationLabel}</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Building2 size={14} className="text-slate-400 shrink-0" />
              <span className="font-semibold text-slate-600">Type:</span>
              <Badge variant="outline" className="text-[10px] uppercase font-bold py-0 h-4 bg-slate-50">
                {req.partnership_type}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Badge variant={isSentByMe ? "outline" : "secondary"} className="text-[9px] uppercase tracking-wider h-5 px-2">
              {isSentByMe ? 'Request Sent' : 'Action Required'}
            </Badge>
            {!isSentByMe && !req.isReadByRecipient && !isHistory && (
               <Badge className="bg-blue-600 text-white text-[9px] uppercase tracking-wider h-5 px-2">New</Badge>
            )}
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex flex-col items-end gap-3 self-center min-w-[150px]">
          {!isHistory && !isSentByMe ? (
            <div className="flex flex-col gap-2 w-full">
              {/* Only the Parent (Manufacturer) can change the partnership type before accepting */}
              {isItheParentSide && (
                <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-lg border border-slate-200">
                    <ArrowRightLeft size={12} className="text-slate-400 ml-1" />
                    <select
                        className="text-[10px] bg-transparent font-bold uppercase outline-none cursor-pointer border-none focus:ring-0 w-full"
                        value={editedType}
                        onChange={(e) => setEditedType(e.target.value)}
                    >
                        <option value="distributor">Distributor</option>
                        <option value="supplier">Supplier</option>
                    </select>
                </div>
              )}

              <div className="flex gap-2 w-full">
                {!isSentByMe && !req.isReadByRecipient && (
                    <Button 
                        size="sm" 
                        variant="ghost" 
                        className="flex-1 text-blue-600 hover:bg-blue-50 text-[10px] font-bold h-9 border border-blue-100"
                        onClick={() => onMarkRead(req._id)}
                    >
                        Mark Read
                    </Button>
                )}
                <Button size="sm" variant="outline" className="flex-1 text-red-600 border-red-200 hover:bg-red-50" onClick={() => onAction(req._id, 'rejected', editedType)}>
                  <X size={16} />
                </Button>
                <Button size="sm" className="flex-[2] bg-[#0c1f4d] hover:bg-[#142c63] shadow-sm text-white" onClick={() => onAction(req._id, 'accepted', editedType)}>
                  <Check size={16} className="mr-1" /> Accept
                </Button>
              </div>
            </div>
          ) : !isHistory && isSentByMe ? (
            <Badge variant="secondary" className="animate-pulse bg-amber-50 text-amber-700 border-amber-200 px-3 py-1">
                Pending Approval
            </Badge>
          ) : (
            <div className="flex items-center gap-3">
              <Badge className={req.status === 'accepted' ? 'bg-green-100 text-green-700 hover:bg-green-100 shadow-none border-green-200' : 'bg-red-100 text-red-700 hover:bg-red-100 shadow-none border-red-200'}>
                <span className="flex items-center gap-1">
                    {req.status === 'accepted' ? <ShieldCheck size={12}/> : <ShieldAlert size={12}/>}
                    {req.status.toUpperCase()}
                </span>
              </Badge>
              {isHistory && (
                <Button
                  variant="ghost" size="icon" className="text-slate-400 hover:text-red-600 hover:bg-red-50 h-9 w-9 rounded-full"
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

      {/* Detail Footer with full address line */}
      <div className="px-5 py-2.5 bg-slate-50/80 text-[10px] text-muted-foreground flex justify-between items-center border-t border-slate-100">
        <div className="flex gap-4">
            {addr && (
              <span className="flex items-center gap-1">
                <Building2 size={10} />
                Full Address: <b className="text-slate-600 font-bold uppercase">
                  {addr.address_line_1}{addr.address_line_2 ? ', ' + addr.address_line_2 : ''}, {addr.city}
                </b>
              </span>
            )}
        </div>
        <span>Requested on: {new Date(req.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
      </div>
    </Card>
  );
};

export default MerchantPartnerships;
