import { useEffect, useState } from "react";

const faceRotation = {
  1: "rotateX(0deg) rotateY(0deg)",
  2: "rotateX(90deg) rotateY(0deg)",
  3: "rotateX(0deg) rotateY(-90deg)",
  4: "rotateX(0deg) rotateY(90deg)",
  5: "rotateX(-90deg) rotateY(0deg)",
  6: "rotateX(0deg) rotateY(180deg)",
};

export default function DiceRoll({ targetNumber = 6, trigger = false }) {
  const [rotation, setRotation] = useState(faceRotation[6]);
  const [rolling, setRolling] = useState(false);

  useEffect(() => {
    if (!trigger) return;
    if (targetNumber < 1 || targetNumber > 6) return;

    setRolling(true);
    const randX = 720 + Math.random() * 720;
    const randY = 720 + Math.random() * 720;
    setRotation(`rotateX(${randX}deg) rotateY(${randY}deg)`);

    const timeout = setTimeout(() => {
      setRolling(false);
      setRotation(faceRotation[targetNumber]);
    }, 2000);

    return () => clearTimeout(timeout);
  }, [trigger, targetNumber]);

  return (
    <div className="dice-wrapper">
      <div className={`dice ${rolling ? "rolling" : ""}`} style={{ transform: rotation }}>
        <div className="face front">{renderDots(1)}</div>
        <div className="face back">{renderDots(6)}</div>
        <div className="face right">{renderDots(3)}</div>
        <div className="face left">{renderDots(4)}</div>
        <div className="face top">{renderDots(5)}</div>
        <div className="face bottom">{renderDots(2)}</div>
      </div>
    </div>
  );
}

function renderDots(n) {
  const pip = <span className="pip" />;
  const layout = [];

  switch (n) {
    case 1:
      layout.push(<span className="pip center" key="c" />);
      break;
    case 2:
      layout.push(<span className="pip tl" key="tl" />);
      layout.push(<span className="pip br" key="br" />);
      break;
    case 3:
      layout.push(<span className="pip tl" key="tl" />);
      layout.push(<span className="pip center" key="c" />);
      layout.push(<span className="pip br" key="br" />);
      break;
    case 4:
      layout.push(<span className="pip tl" key="tl" />);
      layout.push(<span className="pip tr" key="tr" />);
      layout.push(<span className="pip bl" key="bl" />);
      layout.push(<span className="pip br" key="br" />);
      break;
    case 5:
      layout.push(<span className="pip tl" key="tl" />);
      layout.push(<span className="pip tr" key="tr" />);
      layout.push(<span className="pip bl" key="bl" />);
      layout.push(<span className="pip br" key="br" />);
      layout.push(<span className="pip center" key="c" />);
      break;
    case 6:
      layout.push(<span className="pip tl" key="tl" />);
      layout.push(<span className="pip tr" key="tr" />);
      layout.push(<span className="pip ml" key="ml" />);
      layout.push(<span className="pip mr" key="mr" />);
      layout.push(<span className="pip bl" key="bl" />);
      layout.push(<span className="pip br" key="br" />);
      break;
    default:
      break;
  }
  return layout;
}
