const serviceProviderMenuItems = [
  {
    title: "Dashboard",
    icon: "Gauge",
    link: "/service/dashboard",
  },
  {
    title: "Products",
    icon: "ShoppingCart",
    link: "/service/products",
  },
  {
    title: "Branches",
    icon: "MapPin",
    link: "/service/branches",
  },
    {

    title: "SEA Requirement",
    icon: "ClipboardText",

    children: [
      { title: "Post by Requirement", icon: "Users", link: "/service/sea-requirement" },
      { title: "Grocery Seller Requirement", icon: "Users", link: "/service/grocery-seller-requirement" },
      { title: "Product-leads", icon: "Package", link: "/service/product-leads" }
    ]

  },
   {
    title: "Plans",
    icon: "Notebook",
    children: [
      { title: "Plan Subscription", icon: "Calendar", link: "/service/plans/subscription" },
      { title: "Banner", icon: "Image", link: "/service/plans/banner" },
      { title: "Trending", icon: "Flame", link: "/service/plans/trending" },
      { title: "Trust Seal", icon: "ShieldCheck", link: "/service/plans/trust-seal" },
      { title: "E-Book", icon: "BookOpen", link: "/service/plans/ebook" },
    ],
  },
  {
    title: "Others",
    icon: "DotsThreeCircle",
    children: [
      { title: "Reviews", icon: "Star", link: "/service/others/reviews" },
      { title: "Queries", icon: "ChatTeardropText", link: "/service/others/queries" },
      { title: "Buy Leads", icon: "ShoppingCart", link: "/service/others/buy-leads" },
    ],
  },
  {
    title: "Wallet",
    icon: "Wallet",
    link: "/service/wallet",
  },
  {
    title: "Settings",
    icon: "Gear",
    link: "/service/settings",
  },
 
];

export default serviceProviderMenuItems;
