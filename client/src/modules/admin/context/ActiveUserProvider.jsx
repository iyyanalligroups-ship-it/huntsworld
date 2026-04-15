
import React, {
  createContext,
  useEffect,
  useState,
  useRef,
  useContext,
} from "react";
import { debounce } from "lodash";
import { useInterval } from "react-use";
import {
  useUpsertViewPointMutation,
  useGetViewPointsByUserQuery,
} from "@/redux/api/ViewPointApi";
import { useGetViewPointConfigQuery } from "@/redux/api/PointApi";
import { AuthContext } from "@/modules/landing/context/AuthContext";

export const ActiveUserContext = createContext({ points: 0, trackProductView: () => { } });

export const ActiveUserProvider = ({ children }) => {
  const { user, isLoading } = useContext(AuthContext);
  const userId = user?.user?._id;

  /* ================== STATE & REFS ================== */

  const [points, setPoints] = useState(() =>
    Number(sessionStorage.getItem("userPoints") || 0)
  );

  const activeSecondsRef = useRef(0);
  const lastActivityRef = useRef(Date.now());
  const isTabActive = useRef(true);

  const productViewsRef = useRef(new Set());
  const isRewardingRef = useRef(false); // ✅ Guard against concurrent reward calls

  /* ================== RESTORE SESSION ONCE ================== */

  useEffect(() => {
    activeSecondsRef.current = Number(
      sessionStorage.getItem("activeSeconds") || 0
    );

    productViewsRef.current = new Set(
      JSON.parse(sessionStorage.getItem("productViews") || "[]")
    );
  }, []);

  /* ================== API HOOKS ================== */

  const [upsertViewPoint] = useUpsertViewPointMutation();

  const { data: userPointsData, refetch, error: pointsError } = useGetViewPointsByUserQuery(userId, {
    skip: !userId,
  });

  // 🔹 Eager refetch on login to ensure immediate reflection
  useEffect(() => {
    if (userId) {
      refetch();
    }
  }, [userId, refetch]);

  const { data: configData } = useGetViewPointConfigQuery(undefined, {
    skip: !userId,
  });

  const rewardTime = configData?.data?.rewardTime ?? 3600;
  const rewardPoints = configData?.data?.rewardPoints ?? 10;

  /* ================== LOGOUT HANDLING (FIXED) ================== */

  useEffect(() => {
    if (isLoading) return; // ⛔ wait for auth restore

    if (!userId) {
      activeSecondsRef.current = 0;
      setPoints(0);
      productViewsRef.current = new Set();

      sessionStorage.removeItem("activeSeconds");
      sessionStorage.removeItem("userPoints");
      sessionStorage.removeItem("productViews");

      console.log("Logout detected → cleared activity tracking");
    }
  }, [userId, isLoading]);

  /* ================== SYNC POINTS FROM API ================== */

  useEffect(() => {
    if (!userId) return;

    if (userPointsData?.data?.view_points != null) {
      setPoints(userPointsData.data.view_points);
      sessionStorage.setItem(
        "userPoints",
        userPointsData.data.view_points.toString()
      );
    } else if (pointsError) {
      // If API returns an error (like 404 Not Found), reset points to 0 for the current user
      setPoints(0);
      sessionStorage.setItem("userPoints", "0");
      console.log("No view points found for user or API error → defaulting to 0");
    }
  }, [userPointsData, userId, pointsError]);

  /* ================== STORAGE SYNC ================== */

  const updateSessionStorage = (currentPoints) => {
    sessionStorage.setItem("activeSeconds", activeSecondsRef.current.toString());
    // Use the passed value to avoid stale closure on `points` state
    if (currentPoints !== undefined) {
      sessionStorage.setItem("userPoints", currentPoints.toString());
    }
    sessionStorage.setItem(
      "productViews",
      JSON.stringify([...productViewsRef.current])
    );
  };

  /* ================== ACTIVITY TRACKING ================== */

  const handleUserActivity = debounce(() => {
    if (!userId) return;
    // Only update lastActivityRef so the interval knows the user is active.
    // Do NOT accumulate time here — the interval handles it to prevent double-counting.
    if (isTabActive.current) {
      lastActivityRef.current = Date.now();
    }
  }, 200);

  const handleVisibilityChange = () => {
    if (!userId) return;
    isTabActive.current = !document.hidden;
  };

  useEffect(() => {
    if (!userId) return;

    const events = [
      "mousemove",
      "click",
      "mousedown",
      "mouseup",
      "wheel",
      "keydown",
      "keyup",
      "touchstart",
      "touchmove",
      "scroll",
      "pointerdown",
      "pointermove",
    ];

    events.forEach((e) =>
      document.addEventListener(e, handleUserActivity)
    );
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      events.forEach((e) =>
        document.removeEventListener(e, handleUserActivity)
      );
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [userId]);

  /* ================== PRODUCT VIEW TRACKING ================== */

  const trackProductView = (productId) => {
    if (!userId || !productId) return;

    productViewsRef.current.add(productId);
    updateSessionStorage();
  };

  /* ================== SERVER SYNC ================== */

  const sendViewPointToServer = async (pointsToAward) => {
    if (!userId) return;
    if (isRewardingRef.current) {
      console.log("⚠️ Reward already in progress, skipping duplicate call");
      return;
    }
    isRewardingRef.current = true;

    try {
      const res = await upsertViewPoint({
        user_id: userId,
        view_points: pointsToAward,
      }).unwrap();

      const newPoints = res?.data?.view_points ?? (points + pointsToAward);

      setPoints(newPoints);
      sessionStorage.setItem("userPoints", newPoints.toString());
      await refetch();
      console.log(`✅ Awarded ${pointsToAward} points → Total: ${newPoints}`);
    } catch (err) {
      console.error("Failed to update points:", err);
    } finally {
      isRewardingRef.current = false;
    }
  };

  /* ================== REWARD CHECK ================== */

  const checkAndRewardPoints = (currentRewardTime, currentRewardPoints) => {
    if (!userId) return;

    console.log(
      `Checking reward: ${activeSecondsRef.current}/${currentRewardTime}s active, ${productViewsRef.current.size}/5 products viewed`
    );

    if (
      activeSecondsRef.current >= currentRewardTime &&
      productViewsRef.current.size >= 5
    ) {
      console.log("Reward conditions met! Awarding points...");

      // ✅ Reset FIRST to prevent double-trigger before async call completes
      activeSecondsRef.current = 0;
      productViewsRef.current = new Set();
      updateSessionStorage();

      sendViewPointToServer(currentRewardPoints);
    }
  };

  /* ================== INTERVAL ================== */

  useInterval(() => {
    if (!userId) return;

    const now = Date.now();
    const isActive =
      isTabActive.current && now - lastActivityRef.current < 60000;

    if (isActive) {
      activeSecondsRef.current += 60;
      updateSessionStorage();
      console.log(`Interval +60s → Total: ${activeSecondsRef.current}s`);
    }

    // Pass current config values directly to avoid stale closure on rewardTime/rewardPoints
    checkAndRewardPoints(rewardTime, rewardPoints);
  }, 60000);

  /* ================== PROVIDER ================== */

  return (
    <ActiveUserContext.Provider value={{ points, trackProductView }}>
      {children}
    </ActiveUserContext.Provider>
  );
};
