import React, { useState } from 'react';
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
        <div className="url-input-container">
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
                            <span className="loading-spinner">⏳</span>
                        ) : (
                            '加载字幕'
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
        </div>
    );
}

export default UrlInput;
