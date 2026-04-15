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
  Heart,
  ClipboardList,
  Notebook,       // ← replaced Notepad
  UserPlus,
  CreditCard,
  Wallet,
  Settings,       // ← replaced GearSix
  Search,
} from 'lucide-react';

const searchableRoutes = [
  {
    category: 'Main',
    items: [
      { name: 'Dashboard',         path: '/baseMember/dashboard',     icon: <Gauge size={18} /> },
      { name: 'My Favorite Products', path: '/baseMember/favorite',  icon: <Heart size={18} /> },
      { name: 'Requirement',       path: '/baseMember/requirement',   icon: <ClipboardList size={18} /> },
      { name: 'Plans',             path: '/baseMember/plans',         icon: <Notebook size={18} /> },          // ← updated
      { name: 'Referral List',     path: '/baseMember/referral-list', icon: <UserPlus size={18} /> },
      { name: 'Account Detail',    path: '/baseMember/account',       icon: <CreditCard size={18} /> },
      { name: 'Wallet',            path: '/baseMember/wallet',        icon: <Wallet size={18} /> },
      { name: 'Settings',          path: '/baseMember/settings',      icon: <Settings size={18} /> },          // ← updated
    ],
  },
];

const GrocerySearchCommand = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
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

export default GrocerySearchCommand;
