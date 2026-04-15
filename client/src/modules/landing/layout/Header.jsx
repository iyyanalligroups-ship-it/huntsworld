import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Link, useNavigate } from "react-router-dom";
import { useState, useContext, useEffect } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  PhoneCall,
  LogIn,
  UserPlus,
  UserCircle,
  Search,
  Mic,
  Eye,
  LogOut,
  Bell,
  Menu,
  X,
  ChevronDown,
  Info,
  MessageCircle,
  Loader2,
  Calendar
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import * as LucideIcons from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useGetViewPointsByUserQuery } from "@/redux/api/ViewPointApi";
import logo from "@/assets/images/logo.png";
import { AuthContext } from "@/modules/landing/context/AuthContext";
import studentMenuItems from "@/modules/student/utils/MenuItem";
import userMenuItems from "@/modules/commonUser/utils/MenuItem";
import { motion } from "framer-motion";
import { useGetInProgressNewsQuery } from "@/redux/api/NewsApi";
import HeaderSearch from "../pages/pages/categorySection/search/HeaderSearch";
import { useSelectedUser } from "@/modules/admin/context/SelectedUserContext";
import { useUnreadCount } from "@/modules/admin/context/UnreadCountContext";
import Badge from "@/modules/admin/pages/chat/components/helper/Badge";
import GlobalNotificationBell from "@/modules/merchant/pages/globalNotification/GlobalNotificationBell";
import axios from "axios";
import StoriesButton from "../utils/StoriesButton";
import CustomerNotificationListener from "@/modules/commonUser/pages/notification/CustomerPhoneNumberRequest";
import CustomerNotificationBell from "@/modules/commonUser/pages/notification/CustomerNotificationBell";

const linkifyText = (text) => {
  if (!text) return null;

  const urlRegex = /(https?:\/\/[^\s]+)/g;

  return text.split(urlRegex).map((part, i) =>
    part.match(urlRegex) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all text-blue-600 hover:text-blue-500 underline"
      >
        {part}
      </a>
    ) : (
      part
    )
  );
};
const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const { setSelectedUser } = useSelectedUser();
  const navigate = useNavigate();
  const authUser = user?.user;
  const role = authUser?.role?.role;
  const { data: news = [], isLoading } = useGetInProgressNewsQuery();
  const { data } = useGetViewPointsByUserQuery(authUser?._id, {
    skip: !authUser?._id,
  });
  const [displayName, setDisplayName] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchDisplayName = async () => {
      if (!authUser?._id || !role) return;

      try {
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}/users/get-user-name`,
          {
            user_id: authUser._id,
            role: role,
          }
        );

        if (res.data.success) {
          setDisplayName(res.data.name);
        }
      } catch (error) {
        console.error("Failed to fetch display name", error);
      }
    };

    fetchDisplayName();
  }, [authUser?._id, role]);
  const points = data?.data?.view_points || 0;

  const handleNavigate = (type) => {
    navigate(type === "login" ? "/login" : "/register");
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setSelectedUser(null);
    navigate("/");
    setIsMobileMenuOpen(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return "Invalid Date";
    }
  };
  const getDashboardLink = () => {
    if (!role) return null;
    const roleRoutes = {
      ADMIN: "/admin",
      MERCHANT: "/merchant",
      SERVICE_PROVIDER: "/service",
      SUB_DEALER: "/sub-dealer-dashboard",
      GROCERY_SELLER: "/baseMember",
      STUDENT: "/student",
      USER: "/user",
      SUB_ADMIN: "/subAdmin",
    };
    return roleRoutes[role] || null;
  };

  const buyerOptions = [
    {
      label: "Post buy Requirement",
      path: "post-requirement",
      icon: "ShoppingCart",
    },
    { label: "Browse Suppliers", path: "all-categories", icon: "BookOpen" },
    {
      label: "Manufactures Directory",
      path: "manufacturing-directory",
      icon: "ShieldCheck",
    },
    { label: "FAQ", path: "seller-faq", icon: "HelpCircle" },
  ];

  const sellerOptions = [
    { label: "Sell your Products", path: "register", icon: "Store" },
    { label: "FAQ", path: "seller-faq", icon: "Book" },
  ];

  const helpOptions = [
    { label: "Testimonial", path: "testimonials", icon: "MessageSquare" },
    { label: "Send Complaint", path: "complaint", icon: "AlertTriangle" },
    {
      label: "Advertise with us",
      path: "advertise-with-us",
      icon: "Megaphone",
    },
    { label: "Contact Us", path: "contact", icon: "Mail" },
  ];

  const contactNumbers = [
    { number: "+91 9944355114", href: "tel:+919944355114" },
    { number: "+91 9944810225", href: "tel:+919944810225" },
  ];


  const renderMobileMenuItems = (items) => (
    <ul className="grid gap-2">
      {items.map((option, index) => {
        const Icon = LucideIcons[option.icon] || LucideIcons.CircleHelp;
        return (
          <li key={index}>
            <Button
              variant="ghost"
              className="w-full justify-start cursor-pointer text-sm text-white hover:bg-[#1a2f6b] rounded-md py-2 px-3"
              asChild
            >
              <Link
                to={`/${option.path}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Icon className="w-4 h-4 mr-2 text-white" />
                <span>{option.label}</span>
              </Link>
            </Button>
          </li>
        );
      })}
    </ul>
  );

  const renderMobileUserMenu = () => {
    const menuItems =
      role === "STUDENT" ? studentMenuItems : userMenuItems;
    return (
      <ul className="grid gap-2">
        {["STUDENT", "USER"].includes(role) ? (
          menuItems.map((item, index) => {
            const Icon = LucideIcons[item.icon] || LucideIcons.CircleHelp;
            return (
              <li key={index}>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm cursor-pointer text-white hover:bg-[#1a2f6b] rounded-md py-2 px-3"
                  asChild
                >
                  <Link
                    to={item.link}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className="w-4 h-4 mr-2 text-white" />
                    <span>{item.title}</span>
                  </Link>
                </Button>
              </li>
            );
          })
        ) : (
          <li>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm cursor-pointer text-white hover:bg-[#1a2f6b] rounded-md py-2 px-3"
              asChild
            >
              <Link
                to={getDashboardLink()}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <LucideIcons.Gauge className="w-4 h-4 mr-2 text-white" />
                <span>Dashboard</span>
              </Link>
            </Button>
          </li>
        )}
        <li>
          <Button
            variant="ghost"
            className="w-full justify-start text-sm cursor-pointer text-white hover:bg-[#1a2f6b] rounded-md py-2 px-3"
            onClick={handleLogout}
          >
            <LucideIcons.LogOut className="w-4 h-4 mr-2 text-white" />
            <span>Logout</span>
          </Button>
        </li>
      </ul>
    );
  };

  return (
    <header className="flex flex-col w-full z-50 bg-white shadow-md shrink-0">
      <div className={`text-white bg-white flex ${user?.user?._id ? 'justify-center':'justify-evenly'} gap-5 items-center p-1 border-b`}>
        {/* Left: Welcome User / Login & Join Free */}
        <div className="flex items-center gap-10">
          {user ? (
            <>
              {/* ============ LARGE SCREENS (lg+) – Keep original style ============ */}
              <NavigationMenu className="hidden lg:block">
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="flex items-center gap-2 bg-white text-black">
                      <Avatar className="text-[#e03733]">
                        <AvatarImage
                          src={user.avatar || "https://via.placeholder.com/40"}
                          alt="User avatar"
                        />
                        <AvatarFallback>
                          <UserCircle className="w-8 h-8" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">
                        Welcome, {displayName || "User"}
                        {role && (
                          <span className="ml-1 text-gray-500">
                            (
                            {role.toLowerCase() === "grocery_seller"
                              ? "Base_member"
                              : role.charAt(0).toUpperCase() +
                              role.slice(1).toLowerCase()}
                            )
                          </span>
                        )}
                      </span>

                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      {/* Existing dropdown menu – unchanged */}
                      <ul className="grid gap-2 w-[200px] p-4">
                        {["STUDENT", "USER"].includes(role) ? (
                          (role === "STUDENT"
                            ? studentMenuItems
                            : userMenuItems
                          ).map((item, index) => {
                            const Icon =
                              LucideIcons[item.icon] || LucideIcons.CircleHelp;
                            return (
                              <NavigationMenuLink asChild key={index}>
                                <Link
                                  to={item.link}
                                  className="flex items-center gap-2 px-2 py-1 hover:bg-gray-100"
                                >
                                  <div className="flex gap-5 w-full">
                                    <Icon className="w-4 h-4 text-gray-600" />
                                    <span>{item.title}</span>
                                  </div>
                                </Link>
                              </NavigationMenuLink>
                            );
                          })
                        ) : (
                          <NavigationMenuLink asChild>
                            <Link
                              to={getDashboardLink()}
                              className="flex items-center gap-2 px-2 py-1 hover:bg-gray-100"
                            >
                              <div className="flex w-full gap-5">
                                <LucideIcons.Gauge className="w-4 h-4 text-gray-600" />
                                <span>Dashboard</span>
                              </div>
                            </Link>
                          </NavigationMenuLink>
                        )}
                        <NavigationMenuLink asChild>
                          <button
                            className="flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-gray-100 w-full text-left"
                            onClick={handleLogout}
                          >
                            <div className="flex gap-5 w-full">
                              <LucideIcons.LogOut className="w-4 h-4 text-gray-600" />
                              <span>Logout</span>
                            </div>
                          </button>
                        </NavigationMenuLink>
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>

              {/* Separate Views display for large screens only */}
              <div className="hidden lg:flex items-center gap-1 text-sm text-muted-foreground">
                <Eye className="w-4 h-4 text-[#e03733]" />
                <span>{points} Views</span>
              </div>
                <div>
                      <CustomerNotificationBell />
                      </div>

              {/* ============ MOBILE / TABLET (below lg) – Responsive compact view ============ */}
              <div className="flex  lg:hidden">
                <div className="flex flex-col leading-tight">
                  {/* Name + Role */}
                  <span className="text-sm font-medium text-black">
                    {user?.user?.name || "User"}
                    {role && (
                      <span className="ml-1 text-gray-500">
                        ({role.charAt(0).toUpperCase() +
                          role.slice(1).toLowerCase()})
                      </span>
                    )}
                  </span>

                  {/* Eye icon + points only (no "Views" text) */}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <Eye className="w-4 h-4 text-[#e03733]" />
                    <span>{points} Views</span>
                  </div>
                    <div>
                      <CustomerNotificationBell />
                      </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <Button
                className="bg-[#e03733] hover:shadow-lg cursor-pointer hover:bg-[#e03633da] text-white py-2 rounded-md"
                onClick={() => handleNavigate("login")}
              >
                <LogIn className="w-4 h-4 mr-1" /> Login
              </Button>
              <Button
                className="bg-yellow-500 hover:bg-yellow-600 text-white cursor-pointer flex items-center gap-1"
                onClick={() => handleNavigate("register")}
              >
                <UserPlus className="w-4 h-4 mr-1" /> Join Free
              </Button>
            </>
          )}
        </div>

        {/* Center: Phone Numbers */}
        <div className="hidden lg:flex items-center gap-2 ">
          <div className="hidden lg:flex items-center gap-2 text-center bg-gray-100 p-2 rounded-2xl">
            <PhoneCall className="w-5 h-5 text-yellow-400" />
            <p className="text-sm text-[#1C1B1F]">
              {contactNumbers.map((contact, index) => (
                <span key={index}>
                  <a href={contact.href} className="hover:underline">
                    {contact.number}
                  </a>
                  {index < contactNumbers.length - 1 && " | "}
                </span>
              ))}
            </p>
          </div>
          <div>
            <StoriesButton />
          </div>
        </div>


        {/* Right: Navigation Menus */}
        <div className="flex items-center ">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="lg:hidden p-2 cursor-pointer text-black"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[300px] sm:w-[400px] bg-[#0c1f4d]"
            >
              <SheetHeader>
                <a
                  href="/"
                  title="Go to homepage"
                  className="flex justify-center"
                >
                  <img src={logo} alt="Company Logo" className="h-20" />
                </a>
              </SheetHeader>
              <motion.div
                className="flex flex-col gap-4 py-4"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div
                  className="flex items-center gap-2 text-[#1C1B1F] bg-gray-50 rounded-md p-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <PhoneCall className="w-5 h-5 text-yellow-400" />
                  <p className="text-sm font-medium text-[#1C1B1F]">
                    {contactNumbers.map((contact, index) => (
                      <span key={index}>
                        <a href={contact.href} className="hover:underline">
                          {contact.number}
                        </a>
                        {index < contactNumbers.length - 1 && " | "}
                      </span>
                    ))}
                  </p>
                </motion.div>
                <Accordion type="single" collapsible className="w-full">
                  {user && (
                    <AccordionItem value="account">
                      <AccordionTrigger className="text-sm font-semibold text-white hover:bg-[#1a2f6b] rounded-md px-3 py-2">
                        <div className="flex items-center gap-2">
                          <UserCircle className="w-5 h-5 text-white" />
                          Account
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="p-3">
                        {renderMobileUserMenu()}
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {role === "USER" ||
                    role === "MERCHANT" ||
                    (role === "" && (
                      <AccordionItem value="buyer">
                        <AccordionTrigger className="text-sm font-semibold text-white hover:bg-[#1a2f6b] rounded-md px-3 py-2">
                          <div className="flex items-center gap-2">
                            <LucideIcons.ShoppingCart className="w-5 h-5 text-white" />
                            For Buyer
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="p-3">
                          {renderMobileMenuItems(buyerOptions)}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  {(role === "USER" || role === "MERCHANT" || role === "GROCERY_SELLER" ||
                    role === "STUDENT") && (
                      <>
                        <AccordionItem value="chat">
                          <AccordionTrigger className="text-sm font-semibold text-white hover:bg-[#1a2f6b] rounded-md px-3 py-2">
                            <Link
                              to="/chat"
                              className="flex relative  items-center gap-2 w-full"
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              <MessageCircle className="w-5 h-5 text-white" />
                              <span>Chat</span>
                              <Badge count={useUnreadCount().totalUnread} />
                            </Link>
                          </AccordionTrigger>
                        </AccordionItem>
                        <AccordionItem value="notification">
                          <AccordionTrigger className="text-sm font-semibold text-white hover:bg-[#1a2f6b] rounded-md px-3 py-2">

                            {role === "MERCHANT" &&
                              <GlobalNotificationBell />
                            }

                          </AccordionTrigger>
                        </AccordionItem>
                      </>
                    )}
                  {(role === "MERCHANT" ||
                    role === "USER" ||
                    role === "SERVICE_PROVIDER") && (
                      <AccordionItem value="seller">
                        <AccordionTrigger className="text-sm font-semibold text-white hover:bg-[#1a2f6b] rounded-md px-3 py-2">
                          <div className="flex items-center gap-2">
                            <LucideIcons.Store className="w-5 h-5 text-white" />
                            For Seller
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="p-3">
                          {renderMobileMenuItems(sellerOptions)}
                        </AccordionContent>
                      </AccordionItem>
                    )}
                  <>
                    {/* 🔔 Icon Button */}
                    <Button
                      variant="outline"
                      className="group relative gap-2 rounded-full border-gray-200 pl-3 pr-4 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all duration-300"
                      onClick={() => setOpen(true)}
                    >
                      <Bell className="h-4 w-4 text-gray-600 group-hover:text-indigo-600 group-hover:rotate-12 transition-transform" />

                      {/* Gradient Text */}
                      <span className="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text font-bold text-transparent">
                        News
                      </span>

                      {news.length > 0 && (
                        <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 px-1.5 text-[10px] font-bold text-white shadow-sm">
                          {news.length}
                        </span>
                      )}
                    </Button>

                    {/* 📢 Modal Popup */}
                    <Dialog open={open} onOpenChange={setOpen}>
                      <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] p-0 overflow-hidden flex flex-col">

                        {/* Header */}
                        <DialogHeader className="p-4 border-b">
                          <DialogTitle className="text-lg font-semibold">
                            News & Announcements
                          </DialogTitle>
                        </DialogHeader>

                        {/* Scrollable Content */}
                        <ScrollArea className="flex-1 px-4 py-4">

                          {isLoading ? (
                            <p className="text-center text-gray-600 py-6">
                              Loading...
                            </p>
                          ) : news.length > 0 ? (
                            <ul className="space-y-4">
                              {news.map((item) => (
                                <li
                                  key={item._id}
                                  className="p-4 rounded-xl border bg-background overflow-hidden"
                                >
                                  {/* Title */}
                                  <h4 className="font-semibold text-sm break-words">
                                    {item.title}
                                  </h4>

                                  {/* Description */}
                                  {item.description && (
                                    <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap break-all">
                                      {linkifyText(item.description)}
                                    </p>
                                  )}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-center text-gray-600 py-6">
                              Coming Soon
                            </p>
                          )}

                        </ScrollArea>

                      </DialogContent>
                    </Dialog>

                  </>
                  <AccordionItem value="help">
                    <AccordionTrigger className="text-sm font-semibold text-white hover:bg-[#1a2f6b] rounded-md px-3 py-2">
                      <div className="flex items-center gap-2">
                        <LucideIcons.HelpCircle className="w-5 h-5 text-white" />
                        Help
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-3">
                      {renderMobileMenuItems(helpOptions)}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </motion.div>
            </SheetContent>
          </Sheet>
          <div className="hidden lg:flex items-center gap-4 text-[#1C1B1F]">
            {role === "USER" && (
              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="bg-white text-[#1C1B1F]">
                      For Buyer
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid gap-2 w-[200px] p-4">
                        {buyerOptions.map((option, index) => {
                          const Icon =
                            LucideIcons[option.icon] || LucideIcons.CircleHelp;
                          return (
                            <NavigationMenuLink asChild key={index}>
                              <Link
                                to={`/${option.path}`}
                                className="flex items-center gap-2 px-2 py-1 hover:bg-gray-100"
                              >
                                <div className="flex gap-5 w-full">
                                  <Icon className="w-4 h-4 text-gray-600" />
                                  <span>{option.label}</span>
                                </div>
                              </Link>
                            </NavigationMenuLink>
                          );
                        })}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            )}
            {(role === "USER" || role === "MERCHANT" || role === "GROCERY_SELLER" ||
              role === "STUDENT") && (
                <>
                  <NavigationMenu>
                    <NavigationMenuList>
                      <NavigationMenuItem>
                        <Link
                          to="/chat"
                          className="flex items-center relative  px-2 py-1 bg-white text-[#1C1B1F] hover:bg-gray-100"
                        >
                          <MessageCircle className="w-6 h-6" />
                          {/* <span>Chat</span> */}
                          <Badge count={useUnreadCount().totalUnread} />
                        </Link>
                      </NavigationMenuItem>
                    </NavigationMenuList>
                  </NavigationMenu>
                  <NavigationMenu>
                    <NavigationMenuList>
                      <NavigationMenuItem>
                        {
                          role === "MERCHANT" &&
                          <GlobalNotificationBell />
                        }
                      </NavigationMenuItem>
                    </NavigationMenuList>
                  </NavigationMenu>
                </>
              )}
            {(role === "MERCHANT" ||
              role === "USER" ||
              role === "SERVICE_PROVIDER") && (
                <NavigationMenu>
                  <NavigationMenuList>
                    <NavigationMenuItem>
                      <NavigationMenuTrigger className="bg-white text-[#1C1B1F]">
                        For Seller
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="grid gap-2 w-[200px] p-4">
                          {sellerOptions.map((option, index) => {
                            const Icon =
                              LucideIcons[option.icon] || LucideIcons.CircleHelp;
                            return (
                              <NavigationMenuLink asChild key={index}>
                                <Link
                                  to={`/${option.path}`}
                                  className="flex items-center gap-2 px-2 py-1 hover:bg-gray-100"
                                >
                                  <div className="flex gap-5 w-full">
                                    <Icon className="w-4 h-4 text-gray-600" />
                                    <span>{option.label}</span>
                                  </div>
                                </Link>
                              </NavigationMenuLink>
                            );
                          })}
                        </ul>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  </NavigationMenuList>
                </NavigationMenu>
              )}
            <>
              {/* 🔔 Icon Button */}
              <Button
                variant="outline"
                className="group cursor-pointer relative gap-2 rounded-full border-gray-200 pl-3 pr-4 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all duration-300"
                onClick={() => setOpen(true)}
              >
                <Bell className="h-4 w-4 text-gray-600 group-hover:text-indigo-600 group-hover:rotate-12 transition-transform" />

                {/* Gradient Text */}
                <span className="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text font-bold text-transparent">
                  News
                </span>

                {news.length > 0 && (
                  <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 px-1.5 text-[10px] font-bold text-white shadow-sm">
                    {news.length}
                  </span>
                )}
              </Button>

              {/* 📢 Modal Popup */}
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-xl p-0 overflow-hidden rounded-lg">

                  {/* === 1. ENHANCED HEADER (Stays static but visually strong) === */}
                  <DialogHeader className="p-6 pb-4 border-b bg-muted/30 dark:bg-card">
                    <DialogTitle className="flex items-center text-xl font-bold tracking-tight text-foreground">
                      <Bell className="w-5 h-5 mr-3 text-primary" />
                      News & Announcements
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground mt-1">
                      Stay up-to-date with our latest updates, features, and scheduled maintenance.
                    </DialogDescription>
                  </DialogHeader>

                  {/* === 2. SCROLLABLE CONTENT AREA === */}
                  <ScrollArea className="max-h-[450px] p-6 pt-0">

                    {/* --- LOADING STATE --- */}
                    {isLoading ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        <p className="mt-4 text-sm font-medium text-foreground">
                          Fetching the latest updates...
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Please wait a moment.
                        </p>
                      </div>

                    ) : news.length > 0 ? (

                      /* --- DYNAMIC NEWS LIST --- */
                      <ul className="space-y-6 pt-4">
                        {news.map((item) => (
                          // === NEWS ITEM CARD (Robust Dynamic Design) ===
                          <li
                            key={item._id}
                            className="p-4 rounded-xl border transition-all hover:shadow-md hover:bg-accent/30 dark:hover:bg-accent/20 bg-background"
                          >

                            {/* Title and Description */}
                            <div className="mb-3">
                              {/* Title: Use `item.title` but check for existence */}
                              <h4 className="font-extrabold text-base text-foreground leading-snug">
                                {item.title || "Untitled Announcement"}
                              </h4>

                              {/* Description: Use `item.description` but check for existence */}
                              {item.description && (
                                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                                  {linkifyText(item.description)}
                                </p>
                              )}
                            </div>



                            {/* Fallback if no dates are provided */}
                            {(!item.startDate && !item.endDate) && (
                              <p className="text-xs italic text-gray-400 mt-2">
                                No schedule provided.
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (

                      /* --- EMPTY STATE --- */
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <Info className="w-8 h-8 text-muted-foreground" />
                        <p className="mt-4 text-lg font-semibold text-foreground">
                          All Caught Up!
                        </p>
                        <p className="text-sm text-muted-foreground">
                          No new announcements or news at the moment. Check back later!
                        </p>
                      </div>
                    )}
                  </ScrollArea>

                </DialogContent>
              </Dialog>
            </>
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-white text-[#1C1B1F]">
                    Help
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="mr-6">
                    <ul className="grid gap-2 w-[200px] p-4 ">
                      {helpOptions.map((option, index) => {
                        const Icon =
                          LucideIcons[option.icon] || LucideIcons.CircleHelp;
                        return (
                          <NavigationMenuLink asChild key={index}>
                            <Link
                              to={`/${option.path}`}
                              className="flex items-center gap-2 py-1 hover:bg-gray-100"
                            >
                              <div className="flex gap-5 w-full ">
                                <Icon className="w-4 h-4 text-gray-600" />
                                <span>{option.label}</span>
                              </div>
                            </Link>
                          </NavigationMenuLink>
                        );
                      })}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>
      </div>
      <motion.div
        className="flex items-center justify-between bg-[#0c1f4d] py-4 px-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center space-x-2 cursor-pointer flex-shrink-0">
          <a href="/" title="Go to homepage">
            <img src={logo} alt="Company Logo" className="h-10" />
          </a>
        </div>
        <div className="flex-1 max-w-3xl mx-4 relative">
          <HeaderSearch />
        </div>
        <motion.div whileHover={{ scale: 1.1 }} className="flex-shrink-0">
          <Button
            className="px-5 py-2 bg-red-600 cursor-pointer hover:text-white hidden md:block lg:block text-white font-semibold rounded-full"
            onClick={() => navigate("/post-requirement")}
          >
            Post Buy Requirement
          </Button>
        </motion.div>
      </motion.div>
    </header>
  );
};

export default Header;
