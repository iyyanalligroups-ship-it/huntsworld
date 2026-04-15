import MyProfile from "../pages/settings/profile/Profile";
import MyAddress from "../pages/settings/address/AddressList";
import CollegeProfile from "../pages/settings/CollegeProfile";
import { User, MapPin, School, UserX, Users2 } from "lucide-react";
import StudentDeactivateButton from "../pages/settings/deactivate/Deactivate";
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
      label: "My College Profile",
      value: "college",
      icon: School,
      component: <CollegeProfile />,
    },
    {
      label: "Deactivate Account",
      value: "account ",
      icon: UserX,
      component: <StudentDeactivateButton />,
    },
    {
      label: "Who Referred Me",
      value: "who-referred",
      icon: Users2,
      component: <WhoReferred />,
    }
  ];

export default SettingsMenuItems;
