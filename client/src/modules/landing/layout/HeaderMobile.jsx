import { useState, useContext, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { AuthContext } from "@/modules/landing/context/AuthContext"
import { ActiveUserContext } from "@/modules/admin/context/ActiveUserProvider"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import {
  PhoneCall,
  Menu,
  X,
  UserCircle,
  Eye,
  LogOut,
  Gauge,
  MessageCircle,
  Bell,
  Search,
  PlusCircle,
} from "lucide-react"
import * as LucideIcons from "lucide-react"
import { motion } from "framer-motion"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import logo from "@/assets/images/logo.png"
import Badge from "@/modules/admin/pages/chat/components/helper/Badge"
import { useUnreadCount } from "@/modules/admin/context/UnreadCountContext"
import GlobalNotificationBell from "@/modules/merchant/pages/globalNotification/GlobalNotificationBell"
import CustomerNotificationBell from "@/modules/commonUser/pages/notification/CustomerNotificationBell"
import HeaderSearch from "../pages/pages/categorySection/search/HeaderSearch"
import studentMenuItems from "@/modules/student/utils/MenuItem"
import userMenuItems from "@/modules/commonUser/utils/MenuItem"
import axios from "axios"
import { useGetInProgressNewsQuery } from "@/redux/api/NewsApi"
import StoriesButton from "../utils/StoriesButton"

const linkifyText = (text) => {
  if (!text) return null
  const urlRegex = /(https?:\/\/[^\s]+)/g
  return text.split(urlRegex).map((part, i) =>
    part.match(urlRegex) ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="break-all text-blue-600 underline">
        {part}
      </a>
    ) : (part)
  )
}

export default function HeaderMobile() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { user, logout } = useContext(AuthContext)
  const navigate = useNavigate()
  const authUser = user?.user
  const role = authUser?.role?.role

  const { data: news = [], isLoading } = useGetInProgressNewsQuery()
  const { points } = useContext(ActiveUserContext)

  const [displayName, setDisplayName] = useState("")
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const fetchDisplayName = async () => {
      if (!authUser?._id || !role) return
      try {
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/users/get-user-name`, {
          user_id: authUser._id,
          role: role,
        })
        if (res.data.success) setDisplayName(res.data.name)
      } catch (error) {
        console.error("Failed to fetch display name", error)
      }
    }
    fetchDisplayName()
  }, [authUser?._id, role])

  const handleLogout = () => {
    logout()
    navigate("/")
    setIsMobileMenuOpen(false)
  }

  const getDashboardLink = () => {
    if (!role) return null
    const roleRoutes = {
      ADMIN: "/admin",
      MERCHANT: "/merchant",
      SERVICE_PROVIDER: "/service",
      SUB_DEALER: "/sub-dealer-dashboard",
      GROCERY_SELLER: "/baseMember",
      STUDENT: "/student",
      USER: "/user",
      SUB_ADMIN: "/subAdmin",
    }
    return roleRoutes[role] || null
  }

  const buyerOptions = [
    { label: "Post buy Requirement", path: "post-requirement", icon: "ShoppingCart" },
    { label: "Browse Suppliers", path: "all-categories", icon: "BookOpen" },
    { label: "Manufactures Directory", path: "manufacturing-directory", icon: "ShieldCheck" },
    { label: "FAQ", path: "seller-faq", icon: "HelpCircle" },
  ]

  const sellerOptions = [
    { label: "Sell your Products", path: "register", icon: "Store" },
    { label: "FAQ", path: "seller-faq", icon: "Book" },
  ]

  const helpOptions = [
    { label: "Testimonial", path: "testimonials", icon: "MessageSquare" },
    { label: "Send Complaint", path: "complaint", icon: "AlertTriangle" },
    { label: "Advertise with us", path: "advertise-with-us", icon: "Megaphone" },
    { label: "Contact Us", path: "contact", icon: "Mail" },
  ]

  const renderMobileMenuItems = (items) => (
    <ul className="grid gap-2">
      {items.map((option, index) => {
        const Icon = LucideIcons[option.icon] || LucideIcons.CircleHelp
        return (
          <li key={index}>
            <Link to={`/${option.path}`} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center w-full text-sm text-white hover:bg-[#1a2f6b] rounded-md py-2.5 px-3 transition-colors">
              <Icon className="w-4 h-4 mr-3 text-yellow-400" />
              <span>{option.label}</span>
            </Link>
          </li>
        )
      })}
    </ul>
  )

  const renderMobileUserMenu = () => {
    const menuItems = role === "STUDENT" ? studentMenuItems : userMenuItems
    return (
      <ul className="grid gap-2">
        {["STUDENT", "USER"].includes(role ?? "") ? (
          menuItems.map((item, index) => {
            const Icon = LucideIcons[item.icon] || LucideIcons.CircleHelp
            return (
              <li key={index}>
                <Link to={item.link} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center w-full text-sm text-white hover:bg-[#1a2f6b] rounded-md py-2.5 px-3">
                  <Icon className="w-4 h-4 mr-3 text-yellow-400" />
                  <span>{item.title}</span>
                </Link>
              </li>
            )
          })
        ) : (
          <li>
            <Link to={getDashboardLink() ?? "#"} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center w-full text-sm text-white hover:bg-[#1a2f6b] rounded-md py-2.5 px-3">
              <Gauge className="w-4 h-4 mr-3 text-yellow-400" />
              <span>Dashboard</span>
            </Link>
          </li>
        )}
        <li>
          <button onClick={handleLogout} className="flex items-center w-full text-sm text-red-400 hover:bg-[#1a2f6b] rounded-md py-2.5 px-3 mt-2 border-t border-white/10">
            <LogOut className="w-4 h-4 mr-3" />
            <span>Logout</span>
          </button>
        </li>
      </ul>
    )
  }

  return (
    <header className="flex flex-col w-full z-50 bg-white shadow-sm shrink-0">
      {/* ROW 1: USER CONTEXT BAR */}
      <div className="bg-gray-50 px-4 py-2 flex justify-between items-center border-b">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[13px] font-bold text-slate-800 leading-none">
                {displayName || authUser?.name || "User"}
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="bg-red-100 text-[#e03733] px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                  {role?.replace('_', ' ')}
                </span>
                <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium ml-1">
                  <Eye className="w-3 h-3 text-[#e03733]" />
                  <span>{points} Views</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" className="bg-[#e03733] hover:shadow-lg cursor-pointer hover:bg-[#e03633da] text-white py-2 rounded-md" onClick={() => navigate("/login")}>Login</Button>
            <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-white cursor-pointer flex items-center gap-1 font-bold " onClick={() => navigate("/register")}>Join Now</Button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <CustomerNotificationBell />
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-700">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85%] bg-[#0c1f4d] border-none p-0 overflow-y-auto">
              <div className="p-6">
                <SheetHeader className="mb-6">
                  <img src={logo} alt="Logo" className="h-12 w-fit mx-auto" />
                </SheetHeader>

                <div className="flex items-center gap-3 bg-white/10 p-3 rounded-lg mb-6">
                  <PhoneCall className="w-5 h-5 text-yellow-400" />
                  <div className="text-xs text-white">
                    {["+91 9944355114", "+91 9944810225"].map((num, i) => (
                      <a key={i} href={`tel:${num}`} className="block hover:text-yellow-400">{num}</a>
                    ))}
                  </div>
                </div>

                <Accordion type="single" collapsible className="space-y-2">
                  {user && (
                    <AccordionItem value="account" className="border-none">
                      <AccordionTrigger className="text-white hover:no-underline py-2 px-3 rounded-md hover:bg-white/5">
                        <div className="flex items-center gap-3"><UserCircle className="w-5 h-5 text-yellow-400" /> Account</div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2">{renderMobileUserMenu()}</AccordionContent>
                    </AccordionItem>
                  )}
                  {/* ... Rest of Accordion Items styled similarly ... */}
                  <AccordionItem value="buyer" className="border-none">
                    <AccordionTrigger className="text-white hover:no-underline py-2 px-3 rounded-md hover:bg-white/5">
                      <div className="flex items-center gap-3"><LucideIcons.ShoppingCart className="w-5 h-5 text-yellow-400" /> For Buyer</div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2">{renderMobileMenuItems(buyerOptions)}</AccordionContent>
                  </AccordionItem>

                  {(role === "MERCHANT" || role === "USER" || role === "SERVICE_PROVIDER") && (
                    <AccordionItem value="seller" className="border-none">
                      <AccordionTrigger className="text-white hover:no-underline py-2 px-3 rounded-md hover:bg-white/5">
                        <div className="flex items-center gap-3"><LucideIcons.Store className="w-5 h-5 text-yellow-400" /> For Seller</div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2">{renderMobileMenuItems(sellerOptions)}</AccordionContent>
                    </AccordionItem>
                  )}

                  <Link to="/chat" className="flex items-center justify-between text-white py-3 px-3 rounded-md hover:bg-white/5" onClick={() => setIsMobileMenuOpen(false)}>
                    <div className="flex items-center gap-3"><MessageCircle className="w-5 h-5 text-yellow-400" /> Chat</div>
                    <Badge count={useUnreadCount().totalUnread} />
                  </Link>

                  <AccordionItem value="news" className="border-none">
                    <AccordionTrigger className="text-white hover:no-underline py-2 px-3 rounded-md hover:bg-white/5">
                      <div className="flex items-center gap-3"><Bell className="w-5 h-5 text-yellow-400" /> News ({news.length})</div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2">
                      <Button variant="secondary" className="w-full text-xs" onClick={() => { setOpen(true); setIsMobileMenuOpen(false); }}>Open Announcements</Button>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="help" className="border-none">
                    <AccordionTrigger className="text-white hover:no-underline py-2 px-3 rounded-md hover:bg-white/5">
                      <div className="flex items-center gap-3"><LucideIcons.HelpCircle className="w-5 h-5 text-yellow-400" /> Help</div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2">{renderMobileMenuItems(helpOptions)}</AccordionContent>
                  </AccordionItem>
                </Accordion>
                <div className="mt-6"><StoriesButton /></div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* ROW 2: BRANDING & SEARCH */}
      <div className="bg-[#0c1f4d] px-4 py-3">
        <div className="flex items-center justify-between gap-4 mb-3">
          <Link to="/" className="shrink-0">
            <img src={logo} alt="HuntsWorld" className="h-8 w-auto" />
          </Link>
          <Button
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold h-8 px-3 rounded-full shadow-lg flex gap-1.5 items-center"
            onClick={() => navigate("/post-requirement")}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            POST REQUIREMENT
          </Button>
        </div>

        {/* SEARCH BOX */}
        <div className="relative w-full shadow-2xl">
          <HeaderSearch />
        </div>
      </div>

      {/* News Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[92vw] rounded-2xl p-0 overflow-hidden">
          <DialogHeader className="p-4 bg-gray-50 border-b">
            <DialogTitle className="text-md">News & Announcements</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh] p-4">
            {isLoading ? (
              <p className="text-center py-10 text-sm">Loading...</p>
            ) : news.length > 0 ? (
              <div className="space-y-3">
                {news.map((item) => (
                  <div key={item._id} className="p-3 rounded-lg border bg-white shadow-sm">
                    <h4 className="font-bold text-sm text-[#0c1f4d]">{item.title}</h4>
                    {item.description && (
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {linkifyText(item.description)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-10 text-slate-400">No updates today.</p>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </header>
  )
}
