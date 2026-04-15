import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { useLocation, Link } from "react-router-dom";
const breadcrumbNameMap = {
    "dashboard": "Dashboard",
    "common-users": "Users",
    "merchants": "Merchants",
    "products": "Products",
    "service-providers": "Service Providers",
    "vehicles": "Vehicles",
    "students": "Students",
    "payments": "Payments",
    "subscriptions": "Subscriptions",
    "ebooks": "Ebooks",
    "banners": "Banners",
    "coupons": "Coupons",
    "plans": "Plans",
    "categories": "Categories",
    "main": "Main",
    "sub": "Sub",
    "super-sub": "Super Sub",
    "deep-sub": "Deep Sub",
    "others": "Others",
    "faq": "FAQ",
    "complaint": "Complaint",
    "testimonial": "Testimonial",
    "grocery-sellers": "Grocery Sellers",
    "permissions": "Permissions",
    "permission-request": "Permission Request"
  };
  
const AdminBreadcrumb = () => {
  const location = useLocation();

  // split current path into parts
  const pathnames = location.pathname.split("/").filter((x) => x);

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/admin/dashboard">Dashboard</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {pathnames.map((name, index) => {
          const routeTo = `/${pathnames.slice(0, index + 1).join("/")}`;
          const isLast = index === pathnames.length - 1;
          return (
            <div key={name} className="flex items-center">
              <BreadcrumbSeparator />
              <BreadcrumbItem>
              {isLast ? (
  <span className="text-muted-foreground capitalize">{breadcrumbNameMap[name] || decodeURIComponent(name)}</span>
) : (
  <BreadcrumbLink asChild>
    <Link to={`/${routeTo}`}>{breadcrumbNameMap[name] || decodeURIComponent(name)}</Link>
  </BreadcrumbLink>
)}

              </BreadcrumbItem>
            </div>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default AdminBreadcrumb;
