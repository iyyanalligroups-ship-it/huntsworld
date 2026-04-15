// src/components/ui/Badge.jsx
export default function Badge({ count }) {
  if (!count || count <= 0) return null;
  return (
    <span className="ml-auto inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-bold text-white bg-red-600 rounded-full">
      {count > 99 ? "99+" : count}
    </span>
  );
}