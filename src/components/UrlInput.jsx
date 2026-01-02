import React, { useState } from 'react';
import Lottie from 'lottie-react';
import loadingAnimation from '../icons/loading.json';
import './UrlInput.css';

function UrlInput({ onSubmit, isLoading, error }) {
    const [url, setUrl] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (url.trim()) {
            onSubmit(url.trim());
        }
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="url-form">
                <div className="input-wrapper">
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="粘贴 YouTube 视频链接..."
                        className="url-input"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        className="submit-button"
                        disabled={isLoading || !url.trim()}
                    >
                        {isLoading ? (
                            <Lottie
                                animationData={loadingAnimation}
                                className="loading-spinner"
                                loop={true}
                                autoplay={true}
                                style={{ width: 24, height: 24 }}
                            />
                        ) : (
                            '开始磨'
                        )}
                    </button>
                </div>
            </form>

            {error && (
                <div className="error-message fade-in">
                    <span className="error-icon">⚠️</span>
                    {error}
                </div>
            )}
        </>
    );
}

export default UrlInput;
