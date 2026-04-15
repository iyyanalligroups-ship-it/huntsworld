import MyProfile from "@/modules/commonUser/pages/settings/profile/Profile";
import MyAddress from "../pages/settings/address/AddressList";
import StudentLogin from "../pages/Login-as/StudentLogin";
import { User, MapPin, GraduationCap, UserX, Users2 } from "lucide-react";
import UserDeactivateButton from "../pages/settings/deactivate/DeactivateAccount";
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
      label: "Become a Student",
      value: "student",
      icon: GraduationCap,
      component: <StudentLogin />,
    },
     {
      label: "Deactivate Account",
      value: "account",
      icon: UserX,
      component: <UserDeactivateButton />,
    },
    {
      label: "Who Referred Me",
      value: "who-referred",
      icon: Users2,
      component: <WhoReferred />,
    }
  ];

export default SettingsMenuItems;
