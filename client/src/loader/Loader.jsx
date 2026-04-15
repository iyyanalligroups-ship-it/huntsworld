import React from 'react';
import { createPortal } from 'react-dom';
import './Loader.css';

const Loader = ({ contained = false, label = "Loading data..." }) => {
  const content = (
    <div className={`loader-container ${contained ? 'contained' : ''}`}>
      <div className="loader-wrapper">
        <div className="loader-ring"></div>
        <div className="loader-ring-inner"></div>
        <div className="loader-text">HW</div>
      </div>
      {label && <p className="loader-label">{label}</p>}
    </div>
  );

  return contained ? content : createPortal(content, document.body);
};

export default Loader;
