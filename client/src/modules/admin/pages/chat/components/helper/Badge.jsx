
import { useEffect, useState } from "react";


export default function Badge({ count }) {
  const [prevCount, setPrevCount] = useState(count);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (count > prevCount && count > 0) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 600);
      return () => clearTimeout(timer);
    }
    setPrevCount(count);
  }, [count, prevCount]);

  if (!count || count <= 0) return null;

  return (
    <span
      className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
