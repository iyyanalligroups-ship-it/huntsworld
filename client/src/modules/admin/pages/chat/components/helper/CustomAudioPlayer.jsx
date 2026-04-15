import React, { useState, useRef, useEffect } from "react";
import { Play, Pause,Download  } from "lucide-react"; // Assuming you use lucide-react

const CustomAudioPlayer = ({ src }) => {
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    // Format time (e.g., 125 seconds -> 2:05)
    const formatTime = (time) => {
        if (isNaN(time)) return "0:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    };
    const handleDownload = async (url) => {
        console.log(url,'skdjfnjdsnfj');
        
        try {
            console.log(url, "url sdlkfndf");

            const response = await fetch(url);
            const blob = await response.blob();
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = getFileName(url);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Download failed:", error);
            showToast("Failed to download file", "error");
        }
    };
    const togglePlayPause = () => {
        const audio = audioRef.current;
        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => {
        setCurrentTime(audioRef.current.currentTime);
    };

    const handleLoadedMetadata = () => {
        setDuration(audioRef.current.duration);
    };

    const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
    };

    const handleSeek = (e) => {
        const time = e.target.value;
        audioRef.current.currentTime = time;
        setCurrentTime(time);
    };

    return (
        <div className="flex items-center gap-3 relative w-64 p-2">
            {/* Play/Pause Button */}
            <button
                onClick={togglePlayPause}
                className="flex items-center justify-center w-10 h-10 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors text-gray-600"
            >
                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
            </button>
            <button
                onClick={() =>
                    handleDownload(src)
                }
                className="absolute top-3 right-3 p-2.5 bg-black/70 hover:bg-black/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"
            >
                <Download size={20} />
            </button>
            {/* Progress Bar & Timer */}
            <div className="flex flex-col flex-1 gap-1">
                <input
                    type="range"
                    min="0"
                    max={duration}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-gray-500 [&::-webkit-slider-thumb]:rounded-full"
                />
                <div className="flex justify-between text-[10px] text-gray-500 font-medium">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

            {/* Hidden Native Audio Element */}
            <audio
                ref={audioRef}
                src={src}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleEnded}
            />
        </div>
    );
};

export default CustomAudioPlayer;
