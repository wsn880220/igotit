import React, { useState, useRef, useEffect } from 'react';
import UrlInput from './components/UrlInput';
import VideoPlayer from './components/VideoPlayer';
import SubtitlePanel from './components/SubtitlePanel';
import SkeletonLoader from './components/SkeletonLoader';
import './App.css';

function App() {
    const [videoUrl, setVideoUrl] = useState('');
    const [videoId, setVideoId] = useState(null);
    const [subtitles, setSubtitles] = useState([]);
    const [currentTime, setCurrentTime] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [translations, setTranslations] = useState({});
    const [sentenceTranslations, setSentenceTranslations] = useState({}); // 句子翻译
    const [showVideo, setShowVideo] = useState(true);
    const [pauseOnTranslate, setPauseOnTranslate] = useState(true); // 翻译时是否暂停

    const videoPlayerRef = useRef(null); // 视频播放器引用

    // 处理 URL 提交
    const handleUrlSubmit = async (url) => {
        setIsLoading(true);
        setError('');
        setVideoUrl(url);

        try {
            const response = await fetch('/api/subtitles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '字幕获取失败');
            }

            setVideoId(data.videoId);
            setSubtitles(data.subtitles);
            setError('');
        } catch (err) {
            setError(err.message);
            setVideoId(null);
            setSubtitles([]);
        } finally {
            setIsLoading(false);
        }
    };

    // 处理视频时间更新
    const handleTimeUpdate = (time) => {
        setCurrentTime(time);
    };

    // 处理视频跳转
    const handleSeek = (time) => {
        if (videoPlayerRef.current) {
            videoPlayerRef.current.seekTo(time, true);
        }
    };

    // 移除 localStorage 缓存逻辑，实现刷新即焚


    // 处理单词翻译（基本翻译）
    const handleWordClick = async (word) => {
        // 清理单词（去除标点符号）
        const cleanWord = word.toLowerCase().replace(/[^\w\s]/g, '');

        // 如果已经有翻译，切换显示/隐藏
        if (translations[cleanWord]) {
            const willShow = !translations[cleanWord].visible;

            // 显示翻译时暂停
            if (willShow && pauseOnTranslate && videoPlayerRef.current) {
                videoPlayerRef.current.pause();
            }

            // 隐藏翻译时恢复播放
            if (!willShow && pauseOnTranslate && videoPlayerRef.current) {
                videoPlayerRef.current.play();
            }

            setTranslations(prev => ({
                ...prev,
                [cleanWord]: {
                    ...prev[cleanWord],
                    visible: willShow
                }
            }));
            return;
        }

        // 暂停播放（如果启用）
        if (pauseOnTranslate && videoPlayerRef.current) {
            videoPlayerRef.current.pause();
        }

        console.log('🔤 翻译单词:', cleanWord);

        try {
            const response = await fetch('/api/translate?simple=true', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ word: cleanWord }),
            });

            const data = await response.json();

            if (response.ok) {
                setTranslations(prev => ({
                    ...prev,
                    [cleanWord]: {
                        text: data.translation,
                        alternatives: null,
                        hasMore: data.hasMore || false, // 是否有更多释义
                        visible: true
                    }
                }));
            }
        } catch (err) {
            console.error('翻译失败:', err);
            // 翻译失败时恢复播放
            if (pauseOnTranslate && videoPlayerRef.current) {
                videoPlayerRef.current.play();
            }
        }
    };

    // 处理翻译点击（获取详细语义或收起）
    const handleTranslationClick = async (word) => {
        const cleanWord = word.toLowerCase().replace(/[^\w\s]/g, '');

        // 如果已经有alternatives，点击则收起
        if (translations[cleanWord]?.alternatives) {
            setTranslations(prev => ({
                ...prev,
                [cleanWord]: {
                    ...prev[cleanWord],
                    alternatives: null // 清除alternatives，回到简单模式
                }
            }));
            return;
        }

        console.log('📖 查询详细语义:', cleanWord);

        try {
            const response = await fetch('/api/translate?detailed=true', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ word: cleanWord }),
            });

            const data = await response.json();

            if (response.ok && data.alternatives) {
                setTranslations(prev => ({
                    ...prev,
                    [cleanWord]: {
                        ...prev[cleanWord],
                        alternatives: data.alternatives
                    }
                }));
            }
        } catch (err) {
            console.error('获取详细语义失败:', err);
        }
    };



    // 处理句子翻译
    const handleSentenceTranslate = async (text, index) => {
        // 如果已经翻译过，切换显示/隐藏
        if (sentenceTranslations[index]) {
            setSentenceTranslations(prev => ({
                ...prev,
                [index]: {
                    ...prev[index],
                    visible: !prev[index].visible
                }
            }));
            return;
        }

        console.log('📝 翻译句子:', text.substring(0, 30) + '...');

        try {
            const response = await fetch('/api/translate-sentence', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text }),
            });

            const data = await response.json();

            if (response.ok) {
                setSentenceTranslations(prev => ({
                    ...prev,
                    [index]: {
                        text: data.translation,
                        visible: true
                    }
                }));
            }
        } catch (err) {
            console.error('句子翻译失败:', err);
        }
    };

    // 移除 localStorage 句子翻译缓存逻辑


    return (
        <div className="app">
            {/* 标题和搜索框统一结构 */}
            <div className={`header-search-wrapper ${isLoading || videoId ? 'compact' : ''}`}>
                <header className="app-header">
                    <h1 className="app-title">
                        <span className="gradient-text">IgotIt</span>
                    </h1>
                    <p className="app-subtitle">通过 YouTube 学习英语</p>
                </header>

                <div className="url-input-container">
                    <UrlInput
                        onSubmit={handleUrlSubmit}
                        isLoading={isLoading}
                        error={error}
                    />
                </div>
            </div>

            {(isLoading || videoId) && (
                <>
                    {isLoading ? (
                        <SkeletonLoader />
                    ) : (
                        <div className="content-container">
                            <div className={`video-section ${!showVideo ? 'hidden' : ''}`}>
                                <VideoPlayer
                                    ref={videoPlayerRef}
                                    videoId={videoId}
                                    onTimeUpdate={handleTimeUpdate}
                                />
                            </div>

                            <div className="subtitle-section">
                                <div className="subtitle-header">
                                    <h3>字幕</h3>
                                    <div className="subtitle-controls">
                                        <label className="pause-toggle">
                                            <input
                                                type="checkbox"
                                                checked={pauseOnTranslate}
                                                onChange={(e) => setPauseOnTranslate(e.target.checked)}
                                            />
                                            <span>翻译时暂停</span>
                                        </label>
                                        <button
                                            className="toggle-video-button"
                                            onClick={() => setShowVideo(!showVideo)}
                                            title={showVideo ? '隐藏视频' : '显示视频'}
                                        >
                                            {showVideo ? '📺 隐藏视频' : '📺 显示视频'}
                                        </button>
                                    </div>
                                </div>
                                <SubtitlePanel
                                    subtitles={subtitles}
                                    currentTime={currentTime}
                                    onSeek={handleSeek}
                                    onWordClick={handleWordClick}
                                    onTranslationClick={handleTranslationClick}

                                    onSentenceTranslate={handleSentenceTranslate}
                                    translations={translations}
                                    sentenceTranslations={sentenceTranslations}
                                    videoPlayerRef={videoPlayerRef}
                                />
                            </div>
                        </div>
                    )}
                </>
            )}

            {!videoId && !isLoading && !error && (
                <div className="empty-state">
                    <div className="empty-icon">📺</div>
                    <h2>开始你的学习之旅</h2>
                    <p>粘贴一个 YouTube 视频链接，即刻开始</p>
                </div>
            )}
        </div>
    );
}

export default App;
