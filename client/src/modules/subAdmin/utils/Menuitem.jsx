const menuItems = [
    { title: "Dashboard", icon: "Gauge", link: "/subAdmin/dashboard" },
 

    {
        title: "End Users",
        icon: "UsersThree",
        children: [
            {
                title: "Merchant",
                icon: "Storefront",
                children: [
                    { title: "Merchant List", icon: "List", link: "/subAdmin/merchants" },
                    { title: "Merchant Product List", icon: "ShoppingCart", link: "/subAdmin/merchants/products" }
                ]
            },
            {
                title: "Service Provider",
                icon: "GearSix",
                children: [
                    { title: "Service Provider List", icon: "List", link: "/subAdmin/service-providers" },
                    { title: "Vehicle List", icon: "Car", link: "/subAdmin/service-providers/vehicles" }
                ]
            },
            {
                title: "Grocery Seller",
                icon: "ShoppingBag",
                children: [{ title: "Grocery Seller List", icon: "List", link: "/subAdmin/grocery-sellers" }]
            },
            {
                title: "Students",
                icon: "GraduationCap",
                children: [{ title: "Student List", icon: "List", link: "/subAdmin/students" }]
            },
            {
                title: "Common Users",
                icon: "UsersThree",
                children: [{ title: "Users List", icon: "List", link: "/subAdmin/common-users" }]
            },
            {
                title: "Admin",
                icon: "User",
                children: [{ title: "Sub Admin", icon: "List", link: "/subAdmin/subadmin" },
                    { title: "Roles", icon: "Crown", link: "/subAdmin/subadmin/roles" }
                ]
            }
        ]
    },

    {
        title: "Payments",
        icon: "CreditCard",
        children: [
            { title: "Paid Subscriptions", icon: "CurrencyDollar", link: "/subAdmin/payments/subscriptions" },
            { title: "Paid E-Book", icon: "Book", link: "/subAdmin/payments/ebooks" },
            { title: "Paid Banners", icon: "Image", link: "/subAdmin/payments/banners" },
            { title: "Redeem Coupons", icon: "Ticket", link: "/subAdmin/payments/coupons" }
        ]
    },

    {
        title: "Plans",
        icon: "Notepad",
        children: [
            { title: "Subscriptions", icon: "Calendar", link: "/subAdmin/plans/subscriptions" },
            { title: "Banner", icon: "Flag", link: "/subAdmin/plans/banners" },
            { title: "E-Book", icon: "BookOpen", link: "/subAdmin/plans/ebooks" },
            { title: "Trust-seal", icon: "Award", link: "/subAdmin/plans/trust-seal-requests" },
            { title: "Common Subscriptions", icon: "Crown", link: "/subAdmin/plans/common-subscriptions" }
        ]
    },

    {
        title: "Categories",
        icon: "SquaresFour",
        children: [
            { title: "Main Categories", icon: "Folder", link: "/subAdmin/categories/main" },
            { title: "Sub Categories", icon: "FolderSimple", link: "/subAdmin/categories/sub" },
            { title: "Super Sub Categories", icon: "Stack", link: "/subAdmin/categories/super-sub" },
            { title: "Deep Sub Categories", icon: "ArchiveBox", link: "/subAdmin/categories/deep-sub" },
            { title: "Products", icon: "Package", link: "/subAdmin/categories/products" }
        ]
    },

    {
        title: "Others",
        icon: "DotsThreeCircle",
        children: [
            { title: "Post By Requirement", icon: "NotePencil", link: "/subAdmin/others/post-requirement" },
            { title: "Buyer & Seller FAQ", icon: "Question", link: "/subAdmin/others/faq" },
            { title: "Complaint", icon: "Warning", link: "/subAdmin/others/complaint" },
            { title: "Testimonial", icon: "ChatText", link: "/subAdmin/others/testimonial" },
            { title: "Wallet", icon: "Wallet", link: "/subAdmin/others/wallet" }
        ]
    },
    { title: "Settings", icon: "Gear", link: "/subAdmin/settings" }

];

export default menuItems;



