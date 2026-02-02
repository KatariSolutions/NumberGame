import React from "react";

export default function Cylinder3D({ animate }) {
  return (
    <div className="scene">
      <div className={`cylinder ${animate ? "animate" : ""}`} />
    </div>
  );
}
