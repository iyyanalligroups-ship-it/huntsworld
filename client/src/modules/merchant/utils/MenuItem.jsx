const menuItems = [
  { title: "Dashboard", icon: "Gauge", link: "/merchant/dashboard" },
  {
    title: "Products",
    icon: "ShoppingCart",
    link: "/merchant/products",
  },
  {
    title: "My Favorite Products",
    icon: "Heart",
    link: "/merchant/favorite",
  },
  {
    title: "My Requirements",
    icon: "ListChecks",
    link: "/merchant/my-requirements",
  },
  {
    title: "Distribution Units",
    icon: "Truck",
    link: "/merchant/distribution-unit",
  },
  {
    title: "Referral List",
    icon: "UserPlus",
    link: "/merchant/referral-list",
  },
  {
    title: "Plans",
    icon: "Notepad",
    children: [
      {
        title: "Plan Subscription",
        icon: "Calendar",
        link: "/merchant/plans/subscription",
      },
      { title: "Pay for Banner", icon: "Image", link: "/merchant/plans/banner" },
      { title: "Buy Trend Points", icon: "Flame", link: "/merchant/plans/trending" },
      {
        title: "Buy Trust Seal",
        icon: "ShieldCheck",
        link: "/merchant/plans/trust-seal",
      },
      { title: "Buy E-Book", icon: "BookOpen", link: "/merchant/plans/e-book" },
      { title: "Buy Top Listing Plan", icon: "BookOpen", link: "/merchant/plans/top-listing-plan" },
      { title: "Top Listing Products", icon: "BookOpen", link: "/merchant/plans/top-listing-products" },
    ],
  },
  {
    title: "Requirement List",
    icon: "ClipboardText",
    children: [
      {
        title: "Post-by-requirement",
        icon: "Users",
        link: "/merchant/sea-requirement",
      },
      {
        title: "Base Member Requirement",
        icon: "Users",
        link: "/merchant/grocery-seller-requirement",
      },
      {
        title: "Product Leads",
        icon: "Package",
        link: "/merchant/product-leads",
      },
      { title: "Search leads", icon: "ShoppingCart", link: "/merchant/buy-leads" },
      { title: "Ask Price leads", icon: "ShoppingCart", link: "/merchant/ask-price-leads" },
    ],
  },
  {
    title: "Others",
    icon: "DotsThreeCircle",
    children: [
      { title: "Reviews", icon: "Star", link: "/merchant/reviews" },
      { title: "Queries", icon: "ChatTeardropText", link: "/merchant/queries" },
    ],
  },
  {
    title: "Wallet",
    icon: "Wallet",
    link: "/merchant/wallet",
  },
  {
    title: "Payment History",
    icon: "Wallet",
    link: "/merchant/payment-history",
  },
  // {
  //   title: "Redeem History",
  //   icon: "Wallet",
  //   link: "/merchant/redeem-history",
  // },
  {
    title: "Settings",
    icon: "Gear",
    link: "/merchant/settings",
  },
];

export default menuItems;
