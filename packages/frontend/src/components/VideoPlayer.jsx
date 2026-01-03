import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import './VideoPlayer.css';

const VideoPlayer = forwardRef(({ videoId, onTimeUpdate }, ref) => {
    const playerRef = useRef(null);
    const intervalRef = useRef(null);

    // 暴露控制方法给父组件
    useImperativeHandle(ref, () => ({
        play: () => {
            if (playerRef.current && playerRef.current.playVideo) {
                playerRef.current.playVideo();
            }
        },
        pause: () => {
            if (playerRef.current && playerRef.current.pauseVideo) {
                playerRef.current.pauseVideo();
            }
        },
        seekTo: (seconds) => {
            if (playerRef.current && playerRef.current.seekTo) {
                playerRef.current.seekTo(seconds, true);
            }
        },
        getCurrentTime: () => {
            if (playerRef.current && playerRef.current.getCurrentTime) {
                return playerRef.current.getCurrentTime();
            }
            return 0;
        },
        getPlayerState: () => {
            if (playerRef.current && playerRef.current.getPlayerState) {
                return playerRef.current.getPlayerState();
            }
            return -1;
        }
    }));

    useEffect(() => {
        // 加载 YouTube IFrame API
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

            window.onYouTubeIframeAPIReady = initPlayer;
        } else {
            initPlayer();
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            if (playerRef.current && playerRef.current.destroy) {
                playerRef.current.destroy();
            }
        };
    }, [videoId]);

    const initPlayer = () => {
        if (playerRef.current && playerRef.current.destroy) {
            playerRef.current.destroy();
        }

        playerRef.current = new window.YT.Player('youtube-player', {
            videoId: videoId,
            playerVars: {
                autoplay: 0,
                controls: 1,
                modestbranding: 1,
                rel: 0,
            },
            events: {
                onStateChange: onPlayerStateChange,
            },
        });
    };

    const onPlayerStateChange = (event) => {
        // 当视频播放时，开始更新时间
        if (event.data === window.YT.PlayerState.PLAYING) {
            startTimeUpdate();
        } else {
            stopTimeUpdate();
        }
    };

    const startTimeUpdate = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        intervalRef.current = setInterval(() => {
            if (playerRef.current && playerRef.current.getCurrentTime) {
                const currentTime = playerRef.current.getCurrentTime();
                onTimeUpdate(currentTime);
            }
        }, 100); // 每100ms更新一次
    };

    const stopTimeUpdate = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    return (
        <div className="video-player-container">
            <div className="video-wrapper">
                <div id="youtube-player"></div>
            </div>
        </div>
    );
});

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;
