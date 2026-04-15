import { useEffect, useContext, useState } from "react";
import {useSidebar} from "@/modules/admin/hooks/useSidebar";
import { ActiveUserContext } from "@/modules/admin/context/ActiveUserProvider";
import { googleLogout, useGoogleLogin } from "@react-oauth/google";
import axios from "axios";





const Dashboard = () => {
  const { isSidebarOpen } = useSidebar();
  const { points } = useContext(ActiveUserContext) || {}; // Safeguard against undefined context
  const [accessToken, setAccessToken] = useState(null); // Store token
  const [profile, setProfile] = useState(null); // Store user profile

  // Google login setup
  const login = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      console.log("Login Success:", codeResponse);

      const token = codeResponse.access_token;
      setAccessToken(token); // Store access token

      try {
        const response = await fetch(
          `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${token}`
        );
        const decodedData = await response.json();

        console.log("Decoded Token:", decodedData);
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    },
    onError: (error) => console.error("Login Failed:", error),
  });

  // Fetch user info when accessToken is set
  useEffect(() => {
    if (accessToken) {
      axios
        .get("https://www.googleapis.com/oauth2/v1/userinfo", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
          },
        })
        .then((res) => {
          console.log("User Profile:", res.data);
          setProfile(res.data);
        })
        .catch((err) => {
          console.error("Error fetching user info:", err);
        });
    }
  }, [accessToken]);

  // Logout function
  const logOut = () => {
    googleLogout();
    setProfile(null);
    setAccessToken(null);
  };

  return (
    <div className={`${isSidebarOpen ? "p-6 lg:ml-56" : "p-4 lg:ml-16"}`}>
      <h1>Welcome to Dashboard, Points: {points || 0}</h1>
      
  </div>
)}
 export default Dashboard;