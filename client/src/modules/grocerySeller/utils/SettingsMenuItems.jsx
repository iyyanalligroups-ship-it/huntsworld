import MyProfile from "../pages/settings/profile/Profile";
import MyAddress from "../pages/settings/address/AddressList";
import ShopDetails from "../pages/settings/shopdetails/CompanyDetails";
import { User, MapPin, Building2Icon, UserX, Users2 } from "lucide-react";
import GrocerySellerDeactivateButton from "../pages/settings/deactivate/Deactivate";
import WhoReferred from "../pages/settings/whoReferredMe/WhoReferred";

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
      value: "company",
      icon: Building2Icon,
      component: <ShopDetails />,
    },
     {
      label: "Deactivate Account",
      value: "account",
      icon: UserX,
      component: <GrocerySellerDeactivateButton />,
    },
    {
      label: "Who Referred Me",
      value: "who-referred",
      icon: Users2,
      component: <WhoReferred />,
    }
  ];

export default SettingsMenuItems;
