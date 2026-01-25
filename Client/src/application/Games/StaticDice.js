import React from "react";

export default function StaticDice({ targetNumber = 6, bordered = false }) {
  return (
    <div className={`static-dice ${bordered ? "bordered" : ""}`}>
      {renderDots(targetNumber)}
    </div>
  );
}

function renderDots(n) {
  const dots = [];

  switch (n) {
    case 1:
      dots.push(<span className="pip center" key="c" />);
      break;
    case 2:
      dots.push(<span className="pip tl" key="tl" />);
      dots.push(<span className="pip br" key="br" />);
      break;
    case 3:
      dots.push(<span className="pip tl" key="tl" />);
      dots.push(<span className="pip center" key="c" />);
      dots.push(<span className="pip br" key="br" />);
      break;
    case 4:
      dots.push(<span className="pip tl" key="tl" />);
      dots.push(<span className="pip tr" key="tr" />);
      dots.push(<span className="pip bl" key="bl" />);
      dots.push(<span className="pip br" key="br" />);
      break;
    case 5:
      dots.push(<span className="pip tl" key="tl" />);
      dots.push(<span className="pip tr" key="tr" />);
      dots.push(<span className="pip center" key="c" />);
      dots.push(<span className="pip bl" key="bl" />);
      dots.push(<span className="pip br" key="br" />);
      break;
    case 6:
      dots.push(<span className="pip tl" key="tl" />);
      dots.push(<span className="pip tr" key="tr" />);
      dots.push(<span className="pip ml" key="ml" />);
      dots.push(<span className="pip mr" key="mr" />);
      dots.push(<span className="pip bl" key="bl" />);
      dots.push(<span className="pip br" key="br" />);
      break;
    default:
      break;
  }

  return dots;
}
