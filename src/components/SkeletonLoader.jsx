import React from 'react';
import Lottie from 'lottie-react';
import loadingAnimation from '../icons/loading.json';
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
                <div className="skeleton-loading">
                    <Lottie
                        animationData={loadingAnimation}
                        loop={true}
                        autoplay={true}
                        style={{ width: 60, height: 60 }}
                    />
                </div>
            </div>
        </div>
    );
}

export default SkeletonLoader;
