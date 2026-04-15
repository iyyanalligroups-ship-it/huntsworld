import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Layers,
  ShoppingCart,
  MapPin,
  ClipboardList,
  Users,
  Package,
  Star,
  MessageSquare,
  Wallet,
  Settings,
  Calendar,
  Image,
  Flame,
  BookOpen,
  Search,
  Heart,
  ListChecks,
  Truck,
  UserPlus,
  ShieldCheck,
} from 'lucide-react';

const searchableRoutes = [
  {
    category: 'Main',
    items: [
      { name: 'Dashboard',          path: '/merchant/dashboard',          icon: <Layers size={18} /> },
      { name: 'Products',           path: '/merchant/products',           icon: <ShoppingCart size={18} /> },
      { name: 'My Favorite Products', path: '/merchant/favorite',       icon: <Heart size={18} /> },
      { name: 'My Requirements',    path: '/merchant/my-requirements',    icon: <ListChecks size={18} /> },
      { name: 'Distribution Units', path: '/merchant/distribution-unit',  icon: <Truck size={18} /> },
      { name: 'Referral List',      path: '/merchant/referral-list',      icon: <UserPlus size={18} /> },
      { name: 'Wallet',             path: '/merchant/wallet',             icon: <Wallet size={18} /> },
      { name: 'Payment History',    path: '/merchant/payment-history',    icon: <Wallet size={18} /> },
      { name: 'Redeem History',     path: '/merchant/redeem-history',     icon: <Wallet size={18} /> },
      { name: 'Settings',           path: '/merchant/settings',           icon: <Settings size={18} /> },
    ],
  },
  {
    category: 'Plans',
    items: [
      { name: 'Plan Subscription',  path: '/merchant/plans/subscription',  icon: <Calendar size={18} /> },
      { name: 'Banner',             path: '/merchant/plans/banner',        icon: <Image size={18} /> },
      { name: 'Trending',           path: '/merchant/plans/trending',      icon: <Flame size={18} /> },
      { name: 'Trust Seal',         path: '/merchant/plans/trust-seal',    icon: <ShieldCheck size={18} /> },
      { name: 'E-Book',             path: '/merchant/plans/e-book',        icon: <BookOpen size={18} /> },
      { name: 'Top Listing Plan',   path: '/merchant/plans/top-listing-plan',   icon: <BookOpen size={18} /> },
      { name: 'Top Listing Products', path: '/merchant/plans/top-listing-products', icon: <BookOpen size={18} /> },
    ],
  },
  {
    category: 'Requirement List',
    items: [
      { name: 'Post-by-requirement',     path: '/merchant/sea-requirement',          icon: <Users size={18} /> },
      { name: 'Base Member Requirement', path: '/merchant/grocery-seller-requirement', icon: <Users size={18} /> },
      { name: 'Product Leads',           path: '/merchant/product-leads',           icon: <Package size={18} /> },
      { name: 'Buy leads',               path: '/merchant/buy-leads',               icon: <ShoppingCart size={18} /> },
    ],
  },
  {
    category: 'Others',
    items: [
      { name: 'Reviews', path: '/merchant/reviews',          icon: <Star size={18} /> },
      { name: 'Queries', path: '/merchant/queries',          icon: <MessageSquare size={18} /> },
    ],
  },
];

const MerchantSearchCommand = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSelect = (path) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex cursor-pointer w-full items-center justify-between px-3 py-2 rounded-lg border border-input bg-gray-50/50 hover:bg-accent hover:text-accent-foreground transition-all group"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <Search className="h-4 w-4 text-gray-500 shrink-0" />
          <span className="text-sm text-gray-500 truncate">Search...</span>
        </div>

        <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground ml-auto">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command className="rounded-lg border shadow-md">
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>

            {searchableRoutes.map((group) => (
              <React.Fragment key={group.category}>
                <CommandGroup heading={group.category}>
                  {group.items.map((item) => (
                    <CommandItem
                      key={item.path}
                      onSelect={() => handleSelect(item.path)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      {item.icon}
                      <span>{item.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
              </React.Fragment>
            ))}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
};

export default MerchantSearchCommand;
