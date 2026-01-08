import React from 'react';
import Lottie from 'lottie-react';
import loadingAnimation from '../icons/loading.json';
import './SkeletonLoader.css';

function SkeletonLoader() {
    return (
        <div className="skeleton-container">
            <div className="skeleton-video">
                <div className="skeleton-shimmer"></div>
                <div className="skeleton-loading-overlay">
                    <Lottie
                        animationData={loadingAnimation}
                        loop={true}
                        autoplay={true}
                        style={{ width: 80, height: 80 }}
                    />
                    <p className="skeleton-loading-text">正在生成，请稍后...</p>
                </div>
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
