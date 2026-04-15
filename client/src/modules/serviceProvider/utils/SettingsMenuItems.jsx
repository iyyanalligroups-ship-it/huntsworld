import MyProfile from "../pages/settings/profile/Profile";
import MyAddress from "../pages/settings/address/AddressList";
import CompanyDetails from "@/modules/serviceProvider/pages/settings/company/CompanyDetails";
import { User, MapPin, Building2Icon } from "lucide-react";

const SettingsMenuItems = [
    {
      label: "My Profile",
      value: "profile",
      icon: User,
      component: <MyProfile />,
    },
    {
      label: "My Address",
      value: "address",
      icon: MapPin,
      component: <MyAddress />,
    },
     {
      label: "Company Details",
      value: "Company",
      icon: Building2Icon,
      component: <CompanyDetails />,
    }
  ];

export default SettingsMenuItems;
