import React, { useState, useRef, useEffect } from "react";
import { Plus } from "lucide-react";
import noImage from "@/assets/images/no-image.jpg";

const ProductCarousel = ({ images = [], className = "" }) => {
  const [active, setActive] = useState(noImage);
  const [zoomVisible, setZoomVisible] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [lensPosition, setLensPosition] = useState({ x: 0, y: 0 });

  const imageRef = useRef(null);
  const lensSize = 80;

  useEffect(() => {
    if (images.length > 0) setActive(images[0]);
    else setActive(noImage);
  }, [images]);

  const handleMouseMove = (e) => {
    if (!imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const lensX = Math.max(0, Math.min(x - lensSize / 2, rect.width - lensSize));
    const lensY = Math.max(0, Math.min(y - lensSize / 2, rect.height - lensSize));

    const zoomX = (x / rect.width) * 100;
    const zoomY = (y / rect.height) * 100;

    setLensPosition({ x: lensX, y: lensY });
    setZoomPosition({ x: zoomX, y: zoomY });
  };

  return (
    <div className="relative w-full">
      <div className="flex gap-3">
        {/* MAIN IMAGE */}
        <div
          className={`relative w-full aspect-[4/3] border border-slate-200 rounded-xl bg-white overflow-hidden ${className}`}
          onMouseEnter={() => setZoomVisible(true)}
          onMouseLeave={() => setZoomVisible(false)}
          onMouseMove={handleMouseMove}
        >
          <img
            ref={imageRef}
            src={active}
            alt="product"
            loading="lazy"
            className="w-full h-full object-contain cursor-crosshair"
            onError={(e) => {
              e.currentTarget.src = noImage;
            }}
          />

          {/* ZOOM LENS */}
          {zoomVisible && (
            <div
              className="absolute border border-indigo-500 bg-indigo-500/10 pointer-events-none z-20 shadow-sm"
              style={{
                width: lensSize,
                height: lensSize,
                left: lensPosition.x,
                top: lensPosition.y,
              }}
            >
              <div className="flex items-center justify-center h-full w-full opacity-30">
                <Plus size={16} className="text-indigo-600" />
              </div>
            </div>
          )}
        </div>

        {/* THUMBNAILS */}
        {images.length > 1 && (
          <div className="flex flex-col gap-2 max-h-[240px] overflow-y-auto pr-1 scrollbar-hide">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActive(img)}
                className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                  active === img
                    ? "border-indigo-600 shadow-md scale-105"
                    : "border-slate-200 hover:border-slate-400"
                }`}
              >
                <img
                  src={img}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => (e.currentTarget.src = noImage)}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ZOOM PREVIEW */}
      {zoomVisible && (
        <div
          className="absolute hidden lg:block w-[220px] h-[220px] border-4 border-white rounded-2xl bg-white shadow-2xl pointer-events-none z-[100]"
          style={{
            top: "calc(100% + 12px)",
            left: 0,
            backgroundImage: `url(${active})`,
            backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
            backgroundSize: "250%",
            backgroundRepeat: "no-repeat",
          }}
        />
      )}
    </div>
  );
};

export default ProductCarousel;
