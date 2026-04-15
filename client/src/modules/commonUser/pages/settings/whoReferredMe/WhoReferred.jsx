import { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import {
  User,
  Building2,
  GraduationCap,
  ShoppingBag,
  Truck,
  MapPin,
  Phone,
  Mail,
  BadgeCheck,
  Users,
  Loader2,
  AlertCircle,
  Star,
  Search,
  Pencil,
  Check,
  X,
  ChevronRight,
  Trash2
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import showToast from "@/toast/showToast";

const ROLE_CONFIG = {
  MERCHANT: {
    label: "Merchant",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    icon: Building2,
    iconBg: "bg-blue-100 text-blue-600",
    gradient: "from-blue-600 to-blue-800",
  },
  STUDENT: {
    label: "Student",
    color: "bg-purple-50 text-purple-700 border-purple-200",
    icon: GraduationCap,
    iconBg: "bg-purple-100 text-purple-600",
    gradient: "from-purple-600 to-purple-800",
  },
  GROCERY_SELLER: {
    label: "Grocery Seller",
    color: "bg-green-50 text-green-700 border-green-200",
    icon: ShoppingBag,
    iconBg: "bg-green-100 text-green-600",
    gradient: "from-green-600 to-green-800",
  },
  BASE_MEMBER: {
    label: "Base Member",
    color: "bg-green-50 text-green-700 border-green-200",
    icon: ShoppingBag,
    iconBg: "bg-green-100 text-green-600",
    gradient: "from-green-600 to-green-800",
  },
  SERVICE_PROVIDER: {
    label: "Service Provider",
    color: "bg-orange-50 text-orange-700 border-orange-200",
    icon: Truck,
    iconBg: "bg-orange-100 text-orange-600",
    gradient: "from-orange-600 to-orange-800",
  },
  USER: {
    label: "User",
    color: "bg-slate-50 text-slate-700 border-slate-200",
    icon: User,
    iconBg: "bg-slate-100 text-slate-600",
    gradient: "from-slate-600 to-slate-800",
  },
};

const InfoRow = ({ icon: Icon, label, value }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0">
      <div className="mt-0.5 p-1.5 rounded-lg bg-slate-50 text-slate-400 flex-shrink-0">
        <Icon size={13} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-semibold text-slate-800 break-words">{value}</p>
      </div>
    </div>
  );
};

const WhoReferred = () => {
  const { token } = useContext(AuthContext);
  const [state, setState] = useState({ loading: true, data: null, referred: false, error: null });

  const [isDeleting, setIsDeleting] = useState(false);

  // Edit States
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedReferrer, setSelectedReferrer] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const fetchReferrer = async () => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const res = await window.fetch(
        `${import.meta.env.VITE_API_URL}/users/who-referred-me`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const result = await res.json();
      if (result.success) {
        setState({ loading: false, data: result.data, referred: result.referred, error: null });
      } else {
        setState({ loading: false, data: null, referred: false, error: result.message });
      }
    } catch (err) {
      setState({ loading: false, data: null, referred: false, error: "Failed to fetch referrer info" });
    }
  };

  useEffect(() => {
    if (token) fetchReferrer();
  }, [token]);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery || searchQuery.length < 3) {
      showToast("Please enter at least 3 characters", "error");
      return;
    }
    setIsSearching(true);
    setSearchResults([]);
    setSelectedReferrer(null);
    try {
      const res = await window.fetch(
        `${import.meta.env.VITE_API_URL}/users/search-referrer?q=${encodeURIComponent(searchQuery.trim())}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const result = await res.json();
      if (result.success) {
        if (result.data.length === 0) {
          showToast("No matching users found", "error");
        } else {
          setSearchResults(result.data);
        }
      } else {
        showToast(result.message || "Failed to search", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error during search", "error");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSave = async () => {
    if (!selectedReferrer) return;
    setIsSaving(true);
    try {
      const res = await window.fetch(`${import.meta.env.VITE_API_URL}/users/update-referrer`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ referrer_id: selectedReferrer._id }),
      });
      const result = await res.json();
      if (result.success) {
        showToast(result.message, "success");
        setIsEditing(false);
        setSearchQuery("");
        setSearchResults([]);
        setSelectedReferrer(null);
        fetchReferrer(); // Refresh data!
      } else {
        showToast(result.message || "Failed to update", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to save referral update", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteReferrer = async () => {
    setIsDeleting(true);
    try {
      const res = await window.fetch(`${import.meta.env.VITE_API_URL}/users/delete-referrer`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await res.json();
      if (result.success) {
        showToast(result.message, "success");
        setIsDeleteDialogOpen(false); // Close modal
        fetchReferrer(); // Refresh data
      } else {
        showToast(result.message || "Failed to remove referrer", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to remove referrer", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  if (state.loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium">Loading referrer details...</p>
      </div>
    );
  }

  if (!state.referred || !state.data) {
    if (isEditing) {
      return (
        <div className="max-w-2xl mx-auto space-y-6">
          <EditView
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            handleSearch={handleSearch}
            isSearching={isSearching}
            searchResults={searchResults}
            selectedReferrer={selectedReferrer}
            setSelectedReferrer={setSelectedReferrer}
            handleSave={handleSave}
            isSaving={isSaving}
            setIsEditing={setIsEditing}
          />
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 text-center p-8 relative max-w-2xl mx-auto">
        <div className="absolute top-0 right-0 p-2">
           <button
            onClick={() => setIsEditing(true)}
            className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#0c1f4d] hover:bg-[#0c1f4d]/90 border border-transparent rounded-full shadow-sm transition-all active:scale-95"
          >
            <Pencil className="h-3 w-3" /> Add Referrer
          </button>
        </div>
        <div className="p-5 rounded-full bg-slate-100">
          <Users className="h-10 w-10 text-slate-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-700">No Referrer Found</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-sm">
            You joined Huntsworld directly. Nobody referred you to the platform.
          </p>
        </div>
      </div>
    );
  }

  const { user, profile, addresses } = state.data;
  const roleKey = user?.role?.toUpperCase().replace(/\s+/g, "_");
  const roleCfg = ROLE_CONFIG[roleKey] || ROLE_CONFIG.USER;
  const RoleIcon = roleCfg.icon;

  // Build profile display name
  const profileName =
    profile?.company_name ||
    profile?.shop_name ||
    profile?.travels_name ||
    profile?.college_name ||
    null;

  // Helper: format a single address object into a readable string
  const formatAddress = (addr) =>
    [
      addr.address_line_1,
      addr.address_line_2,
      addr.city ? addr.city.charAt(0).toUpperCase() + addr.city.slice(1) : null,
      addr.state ? addr.state.charAt(0).toUpperCase() + addr.state.slice(1) : null,
      addr.country ? addr.country.charAt(0).toUpperCase() + addr.country.slice(1) : null,
    ]
      .filter(Boolean)
      .join(", ");

  // Human-readable label for entity_type
  const entityLabel = (type) =>
    ({
      user: "Personal",
      merchant: "Merchant",
      student: "Student",
      grocery_seller: "Grocery Shop",
      "sub-dealer": "Sub-Dealer",
      service_provider: "Service Provider",
      admin: "Admin",
      sub_admin: "Sub-Admin",
    }[type] || type);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Settings Action Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-800">Who Referred Me</h3>
        <div className="flex items-center gap-2">
          {state.referred && (
            <button
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={isDeleting}
              className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-sm transition-all active:scale-95 rounded-full disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <Trash2 className="h-3 w-3" />
              Remove
            </button>
          )}

          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`cursor-pointer flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all active:scale-95 rounded-full ${isEditing ? "bg-slate-400 hover:bg-slate-500" : "bg-[#0c1f4d] hover:bg-[#0c1f4d]/90"
              }`}
          >
            {isEditing ? (
              <>
                <X className="h-3 w-3" /> Cancel
              </>
            ) : (
              <>
                <Pencil className="h-3 w-3" /> {state.referred ? "Edit Referrer" : "Add Referrer"}
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mt-6">
        {isEditing ? (
          <EditView
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            handleSearch={handleSearch}
            isSearching={isSearching}
            searchResults={searchResults}
            selectedReferrer={selectedReferrer}
            setSelectedReferrer={setSelectedReferrer}
            handleSave={handleSave}
            isSaving={isSaving}
            setIsEditing={setIsEditing}
          />
        ) : (
          <>
          {/* Header Section */}
          <div className="relative overflow-hidden rounded-3xl">
        {/* Gradient Banner */}
        <div className={`h-24 bg-gradient-to-r ${roleCfg.gradient}`} />

        {/* Avatar overlapping banner */}
        <div className="px-6 pb-6 bg-white border border-slate-100 rounded-b-3xl shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
            <div className="relative flex-shrink-0 -mt-10 self-start">
              <div className="h-20 w-20 rounded-2xl bg-white shadow-lg border-4 border-white flex items-center justify-center">
                <RoleIcon className={`h-9 w-9 ${roleCfg.iconBg.split(" ")[1]}`} />
              </div>
              {(profile?.verified_status || profile?.verified) && (
                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5 shadow">
                  <BadgeCheck className="h-4 w-4 text-white" />
                </div>
              )}
            </div>

            <div className="pb-1 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 truncate">{user.name}</h2>
                <Badge
                  variant="outline"
                  className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 ${roleCfg.color}`}
                >
                  {roleCfg.label}
                </Badge>
              </div>
              {profileName && (
                <p className="text-sm font-semibold text-slate-500 mt-0.5 truncate">{profileName}</p>
              )}
              {user.referral_code && (
                <div className="inline-flex items-center gap-1.5 mt-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-3 py-0.5">
                  <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Code: {user.referral_code}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contact Info Card */}
      <Card className="shadow-sm border-slate-100">
        <CardContent className="p-5">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <User size={12} className="text-primary" />
            Contact Information
          </p>
          <InfoRow icon={Mail} label="Email" value={user.email} />
          <InfoRow icon={Phone} label="Phone" value={user.phone} />
          <InfoRow
            icon={Mail}
            label="Company / Shop Email"
            value={profile?.company_email || profile?.shop_email || null}
          />
          <InfoRow
            icon={Phone}
            label="Company / Shop Phone"
            value={profile?.company_phone_number || profile?.shop_phone_number || null}
          />
        </CardContent>
      </Card>

      {/* Role-Specific Details */}
      {profile && (
        <Card className="shadow-sm border-slate-100">
          <CardContent className="p-5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <RoleIcon size={12} className="text-primary" />
              {roleCfg.label} Details
            </p>

            {/* Merchant */}
            {roleKey === "MERCHANT" && (
              <>
                <InfoRow icon={Building2} label="Company Name" value={profile.company_name} />
                <InfoRow icon={BadgeCheck} label="Merchant Code" value={profile.merchant_code} />
              </>
            )}

            {/* Student */}
            {roleKey === "STUDENT" && (
              <>
                <InfoRow icon={GraduationCap} label="College" value={profile.college_name} />
                <InfoRow icon={GraduationCap} label="University" value={profile.university_name} />
                <InfoRow icon={Mail} label="College Email" value={profile.college_email} />
                <InfoRow icon={BadgeCheck} label="Student Code" value={profile.student_code} />
              </>
            )}

            {/* Grocery Seller / Base Member */}
            {(roleKey === "GROCERY_SELLER" || roleKey === "BASE_MEMBER") && (
              <>
                <InfoRow icon={ShoppingBag} label="Shop Name" value={profile.shop_name} />
                <InfoRow
                  icon={BadgeCheck}
                  label="Member Type"
                  value={profile.member_type?.name || null}
                />
                <InfoRow icon={BadgeCheck} label="Grocery Code" value={profile.grocery_code} />
              </>
            )}

            {/* Service Provider */}
            {roleKey === "SERVICE_PROVIDER" && (
              <>
                <InfoRow icon={Truck} label="Business Name" value={profile.travels_name} />
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Addresses — one card per address */}
      {addresses && addresses.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
            <MapPin size={12} className="text-primary" />
            Registered Addresses ({addresses.length})
          </p>

          {addresses.map((addr, idx) => {
            const addrStr = formatAddress(addr);
            const typeLabel = entityLabel(addr.entity_type);
            const typeVariant =
              addr.address_type === "company"
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "bg-slate-50 text-slate-600 border-slate-200";

            return (
              <Card key={idx} className="shadow-sm border-slate-100">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-lg bg-slate-50 text-slate-400">
                      <MapPin size={12} />
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      <span
                        className={`text-[10px] font-black uppercase tracking-widest border rounded-full px-2.5 py-0.5 ${typeVariant}`}
                      >
                        {typeLabel}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-widest bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2.5 py-0.5">
                        {addr.address_type}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm font-semibold text-slate-700 leading-relaxed pl-1">
                    {addrStr}
                  </p>

                  {addr.pincode && (
                    <div className="mt-2 inline-flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-full px-3 py-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PIN</span>
                      <span className="text-xs font-black text-slate-700">{addr.pincode}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {addresses && addresses.length === 0 && (
        <Card className="shadow-sm border-slate-100">
          <CardContent className="p-5 flex items-center gap-3 text-slate-400">
            <MapPin size={16} />
            <p className="text-sm font-semibold">No addresses registered.</p>
          </CardContent>
        </Card>
      )}

          {/* Joined Date */}
          {user.joined && (
            <p className="text-center text-xs text-slate-400 font-medium italic">
              Joined Huntsworld on{" "}
              {new Date(user.joined).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
        </>
      )}
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" /> Confirm Removal
            </DialogTitle>
            <DialogDescription className="py-2">
              Are you sure you want to remove your referrer? This action cannot be easily undone, and your referral linkage will be severed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteReferrer}
              disabled={isDeleting}
              className="rounded-full flex items-center gap-2 bg-red-600 hover:bg-red-700 transition-all font-bold"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Removing...
                </>
              ) : (
                "Yes, Remove Referrer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Extracted EditView Component internally to reuse logic
const EditView = ({
  searchQuery,
  setSearchQuery,
  handleSearch,
  isSearching,
  searchResults,
  selectedReferrer,
  setSelectedReferrer,
  handleSave,
  isSaving,
  setIsEditing,
}) => {
  return (
    <Card className="border-0 shadow-sm border border-slate-100 overflow-hidden bg-white/50">
      <CardContent className="p-6">
        <div className="mb-6">
          <h4 className="text-sm font-black uppercase tracking-widest text-primary mb-1">
            {selectedReferrer ? "Assign Referrer" : "Search Referrer"}
          </h4>
          <p className="text-sm text-slate-500">
            Search for a person by email, phone, or code to assign as your referrer.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 max-w-md mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Email, Phone, or Referral Code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="cursor-pointer px-5 py-2.5 bg-[#0c1f4d] hover:bg-[#0c1f4d]/90 text-white font-semibold text-sm rounded-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
          >
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
          </button>
        </form>

        {/* Results List */}
        {searchResults.length > 0 && (
          <div className="space-y-3 mb-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
              Select Referrer
            </p>
            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
              {searchResults.map((user) => (
                <div
                  key={user._id}
                  onClick={() => setSelectedReferrer(user)}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-xl cursor-pointer transition-all ${selectedReferrer?._id === user._id
                    ? "bg-primary/5 border-primary/40 ring-1 ring-primary/20"
                    : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-slate-800">{user.name}</p>
                      {user.role?.role && (
                        <Badge variant="outline" className="text-[9px] uppercase">
                          {user.role.role}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {user.email || "N/A"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {user.phone || "N/A"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center self-start sm:self-center">
                    <div
                      className={`h-6 w-6 flex items-center justify-center rounded-full border ${selectedReferrer?._id === user._id
                        ? "bg-primary border-primary text-white"
                        : "bg-slate-100 border-slate-200 text-transparent"
                        }`}
                    >
                      <Check className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Save Actions */}
        {selectedReferrer && (
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            <div className="hidden sm:block text-sm text-slate-500">
              Ready to assign <span className="font-bold text-slate-800">{selectedReferrer.name}</span>?
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 sm:flex-none px-4 py-2 bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 font-semibold text-sm rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="cursor-pointer flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-[#0c1f4d] hover:bg-[#0c1f4d]/90 text-white shadow-sm font-semibold text-sm rounded-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Change"}
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WhoReferred;
