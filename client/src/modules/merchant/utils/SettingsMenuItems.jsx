import MyProfile from "../pages/settings/profile/Profile";
import MyAddress from "../pages/settings/address/AddressList";
import CompanyDetails from "../pages/settings/shopdetails/CompanyDetails";
import { User, MapPin, Building2Icon, UserX, PhoneOff, Accessibility, Users2 } from "lucide-react";
import PhoneVisibilityToggle from "../pages/settings/phone-number-access/PhoneVisibilityToggle";
import DeleteButton from "../pages/settings/deactivate/Deactivate";
import PaymentAccountList from "../pages/settings/account/PaymentAccounts";
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
    component: <CompanyDetails />,
  },
  {
    label: "Account Details",
    value: "account",
    icon: Accessibility,
    component: <PaymentAccountList />,
  },
  {
    label: "Phone Number Visibility",
    value: "phone",
    icon: PhoneOff,
    component: <PhoneVisibilityToggle />,
  },
  {
    label: "Deactivate Account",
    value: "deactivate",
    icon: UserX,
    component: <DeleteButton />,
  },
  {
    label: "Who Referred Me",
    value: "who-referred",
    icon: Users2,
    component: <WhoReferred />,
  },
];

export default SettingsMenuItems;
