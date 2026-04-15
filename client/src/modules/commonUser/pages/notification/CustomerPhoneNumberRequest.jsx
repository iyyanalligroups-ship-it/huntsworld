// Inside a top-level customer component or layout
import { useCustomerPhoneNotifications } from "@/modules/admin/context/CustomerPhoneNotificationContext";
import { useEffect } from "react";
import showToast from "@/toast/showToast";

const CustomerNotificationListener = () => {
  const { notifications } = useCustomerPhoneNotifications();

  useEffect(() => {
    if (notifications.length === 0) return;
    const latest = notifications[0];

    if (latest.type === "approved") {
      showToast(
        `Access to merchant phone approved! (expires ${new Date(latest.expiry_date).toLocaleDateString()})`,
        "success"
      );
    } else if (latest.type === "rejected") {
      showToast("Your phone number access request was rejected.", "error");
    }
  }, [notifications]);

  return null;
};

export default CustomerNotificationListener;
