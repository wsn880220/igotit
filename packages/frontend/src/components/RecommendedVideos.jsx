import React, { useState, useEffect } from 'react';
import './RecentVideos.css';

const STORAGE_KEY = 'igotit_recommended_videos';
const CACHE_DURATION = 60 * 60 * 1000; // 1小时缓存

// 从 localStorage 读取缓存的推荐视频
const getCachedVideos = () => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) return null;

        const { timestamp, channels } = JSON.parse(data);
        const now = Date.now();

        // 检查缓存是否过期
        if (now - timestamp > CACHE_DURATION) {
            return null;
        }

        return channels;
    } catch {
        return null;
    }
};

// 保存到 localStorage
const saveCachedVideos = (channels) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            timestamp: Date.now(),
            channels
        }));
    } catch (error) {
        console.error('保存推荐视频缓存失败:', error);
    }
};

function RecommendedVideos({ onVideoSelect }) {
    const [channels, setChannels] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 先尝试从缓存读取
        const cached = getCachedVideos();
        if (cached) {
            setChannels(cached);
            setLoading(false);
        }

        // 然后从服务器获取最新数据
        fetchRecommendedVideos();
    }, []);

    const fetchRecommendedVideos = async () => {
        try {
            const response = await fetch('/api/recommended-videos');
            const data = await response.json();
            const newChannels = data.channels || [];

            setChannels(newChannels);
            saveCachedVideos(newChannels);
        } catch (error) {
            console.error('获取推荐视频失败:', error);
            // 如果失败且没有缓存，显示空状态
            if (!getCachedVideos()) {
                setChannels([]);
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="recent-videos-loading">加载推荐内容...</div>;
    }

    if (channels.length === 0) {
        return null;
    }

    // 计算总视频数
    const totalVideos = channels.reduce((sum, channel) => sum + channel.videos.length, 0);

    if (totalVideos === 0) {
        return null;
    }

    return (
        <div className="recent-videos">
            <div className="recent-videos-header">
                <h3 className="recent-videos-title">推荐内容</h3>
            </div>
            <div className="recommended-channels">
                {channels.map((channel) => (
                    channel.videos.length > 0 && (
                        <div key={channel.name} className="recommended-channel">
                            <div className="channel-name">{channel.name}</div>
                            <div className="recent-videos-list">
                                {channel.videos.map((video) => (
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
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                ))}
            </div>
        </div>
    );
}

export default RecommendedVideos;
