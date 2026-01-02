import React, { useState, useEffect } from 'react';
import './RecentVideos.css';

const MAX_RECENT_VIDEOS = 5;
const STORAGE_KEY = 'igotit_recent_videos';

// 从 localStorage 读取最近视频
const getRecentVideos = () => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
};

// 保存到 localStorage
const saveRecentVideos = (videos) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(videos));
    } catch (error) {
        console.error('保存最近视频失败:', error);
    }
};

// 清空最近视频
export const clearRecentVideos = () => {
    try {
        localStorage.removeItem(STORAGE_KEY);
        return true;
    } catch (error) {
        console.error('清空最近视频失败:', error);
        return false;
    }
};

// 添加视频到最近列表
export const addRecentVideo = (videoId, title) => {
    const videos = getRecentVideos();

    // 移除已存在的相同视频
    const filtered = videos.filter(v => v.videoId !== videoId);

    // 添加到开头
    filtered.unshift({
        videoId,
        title,
        timestamp: Date.now()
    });

    // 保持最多5个
    const trimmed = filtered.slice(0, MAX_RECENT_VIDEOS);

    saveRecentVideos(trimmed);
    return trimmed;
};

function RecentVideos({ onVideoSelect }) {
    const [videos, setVideos] = useState([]);

    useEffect(() => {
        setVideos(getRecentVideos());
    }, []);

    const handleClearHistory = () => {
        if (window.confirm('确定要清空所有播放记录吗？')) {
            if (clearRecentVideos()) {
                setVideos([]);
            }
        }
    };

    if (videos.length === 0) {
        return null;
    }

    return (
        <div className="recent-videos">
            <div className="recent-videos-header">
                <h3 className="recent-videos-title">播放记录</h3>
                <button
                    className="clear-history-button"
                    onClick={handleClearHistory}
                    title="清空历史记录"
                >
                    🗑️
                </button>
            </div>
            <div className="recent-videos-list">
                {videos.map((video) => (
                    <div
                        key={video.videoId}
                        className="recent-video-item"
                        onClick={() => onVideoSelect(video.videoId)}
                    >
                        <img
                            src={`https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`}
                            alt={video.title}
                            className="recent-video-thumbnail"
                        />
                        <div className="recent-video-info">
                            <div className="recent-video-title">{video.title}</div>
                            <div className="recent-video-time">
                                {new Date(video.timestamp).toLocaleString('zh-CN')}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default RecentVideos;
