import React, { useEffect, useState } from 'react';
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
  Gauge,
  ShoppingCart,
  MapPin,
  Star,
  MessageSquare,
  Wallet,
  Settings,
  Calendar,
  Image,
  Flame,
  BookOpen,
  Search,
} from 'lucide-react';

const searchableRoutes = [
  {
    category: 'Main',
    items: [
      { name: 'Dashboard', path: '/service/dashboard', icon: <Gauge size={18} /> },
      { name: 'Products', path: '/service/products', icon: <ShoppingCart size={18} /> },
      { name: 'Branches', path: '/service/branches', icon: <MapPin size={18} /> },
    ],
  },
  {
    category: 'Others',
    items: [
      { name: 'Reviews', path: '/service/others/reviews', icon: <Star size={18} /> },
      { name: 'Queries', path: '/service/others/queries', icon: <MessageSquare size={18} /> },
    ],
  },
  {
    category: 'Plans',
    items: [
      { name: 'Plan Subscription', path: '/service/plans/subscription', icon: <Calendar size={18} /> },
      { name: 'Banner', path: '/service/plans/banner', icon: <Image size={18} /> },
      { name: 'Trending', path: '/service/plans/trending', icon: <Flame size={18} /> },
      { name: 'E-Book', path: '/service/plans/ebook', icon: <BookOpen size={18} /> },
    ],
  },
  {
    category: 'Account',
    items: [
      { name: 'Wallet', path: '/service/wallet', icon: <Wallet size={18} /> },
      { name: 'Settings', path: '/service/settings', icon: <Settings size={18} /> },
    ],
  },
];

const ServiceProviderSearchCommand = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
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
          <CommandInput placeholder="Search..." />
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

export default ServiceProviderSearchCommand;
