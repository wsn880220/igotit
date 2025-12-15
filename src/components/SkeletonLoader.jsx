import React from 'react';
import './SkeletonLoader.css';

function SkeletonLoader() {
    return (
        <div className="skeleton-container">
            <div className="skeleton-video">
                <div className="skeleton-shimmer"></div>
                <div className="skeleton-play-icon">▶</div>
            </div>
            <div className="skeleton-subtitles">
                <div className="skeleton-subtitle-item">
                    <div className="skeleton-time"></div>
                    <div className="skeleton-text"></div>
                </div>
                <div className="skeleton-subtitle-item">
                    <div className="skeleton-time"></div>
                    <div className="skeleton-text short"></div>
                </div>
                <div className="skeleton-subtitle-item">
                    <div className="skeleton-time"></div>
                    <div className="skeleton-text"></div>
                </div>
                <div className="skeleton-subtitle-item">
                    <div className="skeleton-time"></div>
                    <div className="skeleton-text medium"></div>
                </div>
                <div className="skeleton-subtitle-item">
                    <div className="skeleton-time"></div>
                    <div className="skeleton-text"></div>
                </div>
            </div>
        </div>
    );
}

export default SkeletonLoader;
