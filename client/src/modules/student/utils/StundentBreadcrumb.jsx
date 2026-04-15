import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useLocation, Link } from "react-router-dom";

// Map each route segment to a readable name
const breadcrumbNameMap = {
  "dashboard": "Dashboard",
  "favorite":"My Wishes",
  "verification-list": "Verification List",
  "wallet": "Wallet",
  "settings": "Settings",
};

const StudentBreadcrumb = () => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/student/dashboard">Dashboard</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {pathnames.slice(1).map((name, index) => {
          const routeTo = `/student/${pathnames.slice(1, index + 2).join("/")}`;
          const isLast = index === pathnames.length - 2;

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
                    <Link to={routeTo}>
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

export default StudentBreadcrumb;
