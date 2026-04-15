import { useState } from "react";
import { MoveRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Removed framer-motion import

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import noImage from "@/assets/images/no-image.jpg";

/* ------------------ Helpers ------------------ */
const formatTitle = (text) => {
  if (!text) return "";
  const cleaned = text.replace(/[-_]/g, " ");
  return cleaned.replace(/\b\w/g, (c) => c.toUpperCase());
};

/* ------------------ Component ------------------ */
const CategoryCard = ({ title, imageUrl }) => {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);

  const handleSubcategory = (subCategoryName) => {
    navigate(`/subcategory-detail/${subCategoryName}`);
  };

  const formattedTitle = formatTitle(title);

  const truncatedTitle =
    formattedTitle.length > 20
      ? formattedTitle.slice(0, 20) + "..."
      : formattedTitle;

  const tooltipText = formattedTitle;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {/* Main Container - Added 'group' for hover tracking */}
          <div
            className="flex flex-col items-center group cursor-pointer"
            onClick={() =>
              handleSubcategory(
                title
                  ?.toLowerCase()
                  ?.replace(/ & /g, "-")
                  ?.replace(/ /g, "-")
              )
            }
          >
            <div className="relative">
              {/* ================= Image Circle ================= */}
              <div className="relative w-32 h-32 rounded-full overflow-hidden shadow-lg z-10 bg-gray-100 flex items-center justify-center">

                {/* Image / Fallback */}
                {!imageUrl || imgError ? (
                  <img
                    src={noImage}
                    alt="No Category"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={imageUrl}
                    alt={formattedTitle}
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                    loading="lazy"
                  />
                )}

                {/* Dark Hover Overlay */}
                <div className="absolute inset-0 bg-[#0c1f4d]/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20"></div>

                {/* ================= CSS Vector Animations ================= */}
                {/* Replaced Framer Motion with CSS Transitions:
                   - initial: opacity-0 scale-0 rotate-0
                   - hover: group-hover:opacity-60 group-hover:scale-100 group-hover:rotate-X
                   - delay: delay-100, delay-200, etc.
                */}
                <div className="absolute inset-0 z-25 pointer-events-none overflow-hidden">

                  {/* Shape 1: Circle (Delay 100ms, Rotate 90) */}
                  <svg
                    className="absolute top-2 left-4 w-12 h-12 text-white/30 opacity-0 scale-0 rotate-0 group-hover:opacity-60 group-hover:scale-100 group-hover:rotate-90 transition-all duration-500 ease-out delay-100"
                    viewBox="0 0 100 100"
                  >
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                  </svg>

                  {/* Shape 2: Square (Delay 200ms, Rotate 180) */}
                  <svg
                    className="absolute bottom-4 right-2 w-10 h-10 text-red-500/40 opacity-0 scale-0 rotate-0 group-hover:opacity-60 group-hover:scale-100 group-hover:rotate-180 transition-all duration-500 ease-out delay-200"
                    viewBox="0 0 100 100"
                  >
                    <rect
                      x="20"
                      y="20"
                      width="60"
                      height="60"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                  </svg>

                  {/* Shape 3: Triangle (Delay 300ms, Rotate -45 or 270) */}
                  <svg
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 text-white/10 opacity-0 scale-0 rotate-0 group-hover:opacity-60 group-hover:scale-100 group-hover:rotate-[270deg] transition-all duration-500 ease-out delay-300"
                    viewBox="0 0 100 100"
                  >
                    <path
                      d="M50 15 L85 85 L15 85 Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                    />
                  </svg>
                </div>

                {/* ================= Center Arrow ================= */}
                <div className="absolute inset-0 flex items-center justify-center z-30">
                  <div className="opacity-0 group-hover:opacity-100 transform -translate-x-10 group-hover:translate-x-0 transition-all duration-500 ease-in-out">
                    <MoveRight className="text-white w-10 h-10" />
                  </div>
                </div>
              </div>

              {/* ================= Outer Glow Ring ================= */}
              {/* Kept the scale animation here using CSS */}
              <div className="absolute inset-0 rounded-full border-2 border-transparent group-hover:border-red-600 group-hover:scale-110 transition-all duration-500 z-0"></div>
            </div>

            {/* ================= Title ================= */}
            <div className="mt-4 text-center">
              <h3 className="text-sm font-bold text-gray-800 group-hover:text-[#0c1f4d] transition-colors duration-300 tracking-wide">
                {truncatedTitle}
              </h3>

              {/* Underline Animation: w-0 to w-full on group hover */}
              <div className="h-[2px] bg-red-600 mx-auto mt-1 w-0 group-hover:w-full transition-all duration-300 ease-out" />
            </div>
          </div>
        </TooltipTrigger>

        {/* ================= Tooltip ================= */}
        {tooltipText?.length > 20 && (
          <TooltipContent
            side="top"
            className="bg-gray-800 text-white text-xs rounded-md px-2 py-1 shadow-lg"
          >
            {tooltipText}
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};

export default CategoryCard;
