import MyProfile from "../pages/settings/pages/Profile";
import MyAddress from "../pages/settings/pages/Address/Address";
import Point from "../pages/settings/pages/point/Point";
import { User, MapPin,Target,Tag ,ShieldCheck,Eye, Shield  } from "lucide-react";
import Coupons from "../pages/settings/pages/coupans/Coupons";
import Permission from "../pages/settings/pages/permissions/Permission";
import AccessPage from "../pages/settings/pages/access/AccessPage";
import AdminAccessManagement from "../pages/settings/pages/subAdminAccess/AdminAccessManagement";

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
      label: "Point Page",
      value: "point",
      icon: Target,
      component: <Point />,
    },
    {
      label: "Coupon Page",  
      value: "coupon",       
      icon: Tag,           
      component: <Coupons />, 
    },
    {
      label: "Permission Page",  
      value: "permission",        
      icon: ShieldCheck,         
      component: <Permission />, 
    },
    {
      label: "Access Page",  
      value: "access",        
      icon: Eye,         
      component: <AccessPage />, 
    },
    
    {
      label: "SubAdmin Access",  
      value: "subadmin-access",        
      icon: Shield,         
      component: <AdminAccessManagement />, 
    }
    

  ];

export default SettingsMenuItems;
