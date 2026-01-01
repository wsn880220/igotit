import { useState, useRef, useCallback } from 'react';

/**
 * Custom hook to manage YouTube Video Player logic
 */
export function useVideoPlayer() {
    const videoPlayerRef = useRef(null);
    const [currentTime, setCurrentTime] = useState(0);

    // Handles time updates from the video player
    const handleTimeUpdate = useCallback((time) => {
        setCurrentTime(time);
    }, []);

    // Seeks to a specific time
    const handleSeek = useCallback((time) => {
        if (videoPlayerRef.current) {
            videoPlayerRef.current.seekTo(time, true);
        }
    }, []);

    // Play helper
    const play = useCallback(() => {
        if (videoPlayerRef.current) {
            videoPlayerRef.current.play();
        }
    }, []);

    // Pause helper
    const pause = useCallback(() => {
        if (videoPlayerRef.current) {
            videoPlayerRef.current.pause();
        }
    }, []);

    return {
        videoPlayerRef,
        currentTime,
        handleTimeUpdate,
        handleSeek,
        play,
        pause
    };
}
