import React, { useState, useRef } from 'react';

const ProductImageZoom = ({ src }) => {
  const [zoomStyle, setZoomStyle] = useState({ display: 'none' });
  const imageRef = useRef(null);

  const handleMouseMove = (e) => {
    const { left, top, width, height } = imageRef.current.getBoundingClientRect();
    const x = e.pageX - left - window.scrollX;
    const y = e.pageY - top - window.scrollY;

    const percentX = x / width;
    const percentY = y / height;

    setZoomStyle({
      display: 'block',
      backgroundImage: `url(${src})`,
      backgroundSize: `${width * 2}px ${height * 2}px`,
      backgroundPosition: `${-percentX * width}px ${-percentY * height}px`,
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({ display: 'none' });
  };

  return (
    <div className="flex items-start gap-4 relative">
      {/* Left zoom box */}
      <div
        className="w-40 h-40 border ab rounded overflow-hidden z-100"
        style={{
          ...zoomStyle,
          backgroundRepeat: 'no-repeat',
          backgroundColor: '#fff',
        }}
      />

      {/* Main image */}
      <img
        ref={imageRef}
        src={src}
        alt="Zoom"
        className="w-[300px] h-[300px] object-contain border rounded"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
};

export default ProductImageZoom;
