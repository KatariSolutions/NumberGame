import React, { useEffect, useRef, useState } from "react";
import { MdMusicNote , MdMusicOff } from "react-icons/md";

const GameMusicPlayer = () => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    const audio = audioRef.current;

    // Some browsers block autoplay, so handle promise
    const playMusic = async () => {
      try {
        await audio.play();
      } catch (err) {
        console.log("Autoplay blocked, waiting for user interaction.");
      }
    };

    if (isPlaying) {
        audioRef.current.volume = 0.15;
      playMusic();
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  return (
    <div className="audio-box">
      <audio ref={audioRef} src="/sounds/bgm-audio.mp3" loop />

      <button
        onClick={() => setIsPlaying(!isPlaying)}
        className="audio-button"
      >
        {isPlaying ? <MdMusicNote size={16} /> : <MdMusicOff size={16} />}
      </button>
    </div>
  );
};

export default GameMusicPlayer;
