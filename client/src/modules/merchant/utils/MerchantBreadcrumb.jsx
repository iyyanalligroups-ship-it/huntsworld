// MerchantBreadcrumb.jsx

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useLocation, Link } from "react-router-dom";

const breadcrumbNameMap = {
  merchant: "Merchant",
  dashboard: "Dashboard",
  products: "Products",
  branches: "Branches",
  "sea-requirement": "SEA Requirement",
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
  "e-book": "E-Book",
};

// ✅ put helper here
const getRouteForParent = (name) => {
  if (name === "plans") {
    return "/merchant/plans/subscription";
  }
  if (name === "others") {
    return "/merchant/reviews";
  }
  return `/merchant/${name}`;
};

const MerchantBreadcrumb = () => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);
  const filteredPathnames = pathnames.filter((name) => name !== "merchant");

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/merchant">Merchant</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {filteredPathnames.map((name, index) => {
          const isLast = index === filteredPathnames.length - 1;
          const routeTo = `/merchant/${filteredPathnames
            .slice(0, index + 1)
            .join("/")}`;

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

export default MerchantBreadcrumb;
