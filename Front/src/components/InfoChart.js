import React, { useState } from "react";
import { FiInfo } from "react-icons/fi";

const InfoChart = ({ description }) => {
  const [showFullDescription, setShowFullDescription] = useState(false);

  return (
    <div className="info-icon-container">
      <span
        className={`info-icon ${showFullDescription ? "icon-active" : ""}`}
        onMouseEnter={() => setShowFullDescription(true)}
        onMouseLeave={() => setShowFullDescription(false)}
      >
        <FiInfo />
      </span>
      {showFullDescription && (
        <div className="full-description">
          <h5>Descripción completa:</h5>
          <p>{description}</p>
        </div>
      )}
    </div>
  );
};

export default InfoChart;
