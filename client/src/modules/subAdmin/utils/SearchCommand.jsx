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
  Users,
  Store,
  Car,
  GraduationCap,
  CreditCard,
  Tag,
  Layers,
  ShoppingCart,
  MessageSquare,
  Settings,
  Search,
} from 'lucide-react';

// Route mapping for search
const searchableRoutes = [
  {
    category: 'Main',
    items: [
      { name: 'Dashboard', path: '/subAdmin/dashboard', icon: <Layers size={18} /> },
      { name: 'Profile', path: '/subAdmin/profile', icon: <Users size={18} /> },
      { name: 'Common Users', path: '/subAdmin/common-users', icon: <Users size={18} /> },
      { name: 'Settings', path: '/subAdmin/settings', icon: <Settings size={18} /> },
    ],
  },
  {
    category: 'Merchants',
    items: [
      { name: 'Merchant List', path: '/subAdmin/merchants', icon: <Store size={18} /> },
      { name: 'Merchant Products', path: '/subAdmin/merchants/products', icon: <ShoppingCart size={18} /> },
    ],
  },
  {
    category: 'Service Providers',
    items: [
      { name: 'Service Provider List', path: '/subAdmin/service-providers', icon: <Users size={18} /> },
      { name: 'Vehicles', path: '/subAdmin/service-providers/vehicles', icon: <Car size={18} /> },
    ],
  },
  {
    category: 'Students',
    items: [
      { name: 'Student List', path: '/subAdmin/students', icon: <GraduationCap size={18} /> },
    ],
  },
  {
    category: 'Payments',
    items: [
      { name: 'Subscriptions', path: '/subAdmin/payments/subscriptions', icon: <CreditCard size={18} /> },
      { name: 'E-Books', path: '/subAdmin/payments/ebooks', icon: <CreditCard size={18} /> },
      { name: 'Banners', path: '/subAdmin/payments/banners', icon: <CreditCard size={18} /> },
      { name: 'Coupons', path: '/subAdmin/payments/coupons', icon: <CreditCard size={18} /> },
    ],
  },
  {
    category: 'Plans',
    items: [
      { name: 'Subscriptions', path: '/subAdmin/plans/subscriptions', icon: <Tag size={18} /> },
      { name: 'Banners', path: '/subAdmin/plans/banners', icon: <Tag size={18} /> },
      { name: 'E-Books', path: '/subAdmin/plans/ebooks', icon: <Tag size={18} /> },
    ],
  },
  {
    category: 'Categories',
    items: [
      { name: 'Main Categories', path: '/subAdmin/categories/main', icon: <Layers size={18} /> },
      { name: 'Sub Categories', path: '/subAdmin/categories/sub', icon: <Layers size={18} /> },
      { name: 'Super Sub Categories', path: '/subAdmin/categories/super-sub', icon: <Layers size={18} /> },
      { name: 'Deep Sub Categories', path: '/subAdmin/categories/deep-sub', icon: <Layers size={18} /> },
      { name: 'Products', path: '/subAdmin/categories/products', icon: <ShoppingCart size={18} /> },
    ],
  },
  {
    category: 'Grocery',
    items: [
      { name: 'Grocery Seller List', path: '/subAdmin/grocery-sellers', icon: <Store size={18} /> },
    ],
  },
  {
    category: 'Others',
    items: [
      { name: 'Post Requirement', path: '/subAdmin/others/post-requirement', icon: <MessageSquare size={18} /> },
      { name: 'FAQ', path: '/subAdmin/others/faq', icon: <MessageSquare size={18} /> },
      { name: 'Complaint', path: '/subAdmin/others/complaint', icon: <MessageSquare size={18} /> },
      { name: 'Testimonial', path: '/subAdmin/others/testimonial', icon: <MessageSquare size={18} /> },
    ],
  },
  {
    category: 'Permissions',
    items: [
      { name: 'Permissions', path: '/subAdmin/permissions', icon: <Settings size={18} /> },
      { name: 'Permission Requests', path: '/subAdmin/permission-request', icon: <Settings size={18} /> },
    ],
  },
];

const SearchCommand = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  // Open command menu with keyboard shortcut
  useEffect(() => {
    const down = (e) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (path) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center space-x-2 px-3 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        <Search className="h-4 w-4" />
        <span className="hidden md:inline-flex">Search...</span>
        <kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground">
          <span className="text-xs"></span>K
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

export default SearchCommand;