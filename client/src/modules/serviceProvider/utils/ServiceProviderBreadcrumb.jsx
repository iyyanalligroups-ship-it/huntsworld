import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useLocation, Link } from "react-router-dom";

const breadcrumbNameMap = {
  service: "Service",
  dashboard: "Dashboard",
  products: "Products",
  branches: "Branches",
  "sea-requirement": "SEA Requirement",
  others: "Others",
  reviews: "Reviews",
  queries: "Queries",
  "buy-leads": "Buy Leads",
  wallet: "Wallet",
  settings: "Settings",
  plans: "Plans",
  subscription: "Plan Subscription",
  banner: "Banner",
  trending: "Trending",
  "trust-seal": "Trust Seal",
  ebook: "E-Book",
};

// ✅ helper: find a valid route for parent
const getRouteForParent = (name) => {
  if (name === "plans") {
    return "/service/plans/subscription"; // default to first child
  }
  if (name === "others") {
    return "/service/others/reviews"; // default for others
  }
  return `/service/${name}`;
};

const ServiceProviderBreadcrumb = () => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  // Remove 'service' from pathnames since it's the base route
  const filteredPathnames = pathnames.filter((name) => name !== "service");

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/service">Service</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {filteredPathnames.map((name, index) => {
          const isLast = index === filteredPathnames.length - 1;
          const routeTo = `/service/${filteredPathnames
            .slice(0, index + 1)
            .join("/")}`;

          // ✅ use helper for non-last breadcrumb items
          const finalRoute = !isLast ? getRouteForParent(name) : routeTo;

          return (
            <div key={name} className="flex items-center">
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <span className="text-muted-foreground capitalize">
                    {breadcrumbNameMap[name] || decodeURIComponent(name)}
                  </span>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={finalRoute}>
                      {breadcrumbNameMap[name] || decodeURIComponent(name)}
                    </Link>
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

export default ServiceProviderBreadcrumb;
