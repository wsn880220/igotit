import React, { useState, useRef, useEffect } from 'react';
import { useVideoPlayer } from './hooks/useVideoPlayer';
import UrlInput from './components/UrlInput';
import VideoPlayer from './components/VideoPlayer';
import SubtitlePanel from './components/SubtitlePanel';
import SkeletonLoader from './components/SkeletonLoader';
import RecentVideos, { addRecentVideo } from './components/RecentVideos';
import RecommendedVideos from './components/RecommendedVideos';
import './App.css';

function App() {
    const [videoUrl, setVideoUrl] = useState('');
    const [videoId, setVideoId] = useState(null);
    const [subtitles, setSubtitles] = useState([]);

    // Use custom hook for video player logic
    const {
        videoPlayerRef,
        currentTime,
        handleTimeUpdate,
        handleSeek
    } = useVideoPlayer();

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [translations, setTranslations] = useState({});
    const [sentenceTranslations, setSentenceTranslations] = useState({}); // 句子翻译
    const [showVideo, setShowVideo] = useState(true);
    const [pauseOnTranslate, setPauseOnTranslate] = useState(false); // 翻译时是否暂停
    const [autoScroll, setAutoScroll] = useState(true); // 播放时是否自动滚动
    const [isPlaying, setIsPlaying] = useState(false); // 播放状态

    // 从环境变量获取 API 基础地址（用于分离部署），开发环境默认为空（使用代理）
    let API_BASE = import.meta.env.VITE_API_BASE_URL || '';
    // 容错处理：如果用户忘了加 https://，自动补全
    if (API_BASE && !API_BASE.startsWith('http')) {
        API_BASE = `https://${API_BASE}`;
    }

    // 处理 URL 提交
    const handleUrlSubmit = async (url) => {
        setIsLoading(true);
        setError('');
        setVideoUrl(url);

        // 记录开始时间，确保加载提示至少显示800ms
        const startTime = Date.now();
        const minDisplayTime = 800;

        try {
            console.log(`📡 发起请求: ${API_BASE}/api/subtitles`);
            const response = await fetch(`${API_BASE}/api/subtitles`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url }),
            });

            console.log(`⬅️ 响应状态: ${response.status} ${response.statusText}`);

            // 先读取文本，以便调试
            const text = await response.text();
            console.log('📄 响应内容(前100字符):', text.substring(0, 100));

            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('❌ JSON 解析失败，原始响应:', text);
                throw new Error(response.status === 404 ? 'API 地址错误 (404)' : '后端返回了非 JSON 格式的内容');
            }

            if (!response.ok) {
                throw new Error(data.error || `请求失败 (${response.status})`);
            }

            setVideoId(data.videoId);
            setSubtitles(data.subtitles);
            setError('');

            // 如果有标题，直接保存到最近视频列表
            if (data.title) {
                addRecentVideo(data.videoId, data.title);
            } else {
                // 没有标题时，异步获取
                fetchVideoTitleAndSave(data.videoId);
            }
        } catch (err) {
            setError(err.message);
            setVideoId(null);
            setSubtitles([]);
        } finally {
            // 确保加载提示至少显示指定时长
            const elapsedTime = Date.now() - startTime;
            const remainingTime = Math.max(0, minDisplayTime - elapsedTime);
            await new Promise(resolve => setTimeout(resolve, remainingTime));
            setIsLoading(false);
        }
    };

    // 获取视频标题并保存到 localStorage
    const fetchVideoTitleAndSave = async (videoId) => {
        // 备用方案：使用 YouTube oEmbed API（无需 API key）
        try {
            const oembedResponse = await fetch(
                `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
            );
            if (oembedResponse.ok) {
                const oembedData = await oembedResponse.json();
                if (oembedData.title) {
                    addRecentVideo(videoId, oembedData.title);
                    console.log(`✅ 通过 oEmbed API 获取标题: ${oembedData.title}`);
                    return;
                }
            }
        } catch (oembedError) {
            console.log('oEmbed API 失败，尝试后端获取:', oembedError.message);
        }

        // 备用方案2：调用后端 API
        try {
            const response = await fetch(`${API_BASE}/api/video-title?videoId=${videoId}`);
            const data = await response.json();
            if (data.title) {
                addRecentVideo(videoId, data.title);
                return;
            }
        } catch (error) {
            console.error('后端获取标题也失败:', error);
        }

        // 最终备用：使用 videoId 作为标题
        addRecentVideo(videoId, `Video ${videoId}`);
    };

    // 处理从最近视频列表中选择视频
    const handleRecentVideoSelect = async (selectedVideoId) => {
        setIsLoading(true);
        setError('');
        setVideoUrl(`https://www.youtube.com/watch?v=${selectedVideoId}`);

        // 记录开始时间，确保加载提示至少显示800ms
        const startTime = Date.now();
        const minDisplayTime = 800;

        try {
            const response = await fetch(`${API_BASE}/api/subtitles`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: `https://www.youtube.com/watch?v=${selectedVideoId}`
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '字幕获取失败');
            }

            setVideoId(data.videoId);
            setSubtitles(data.subtitles);
            setError('');

            // 如果有标题，直接保存到最近视频列表
            if (data.title) {
                addRecentVideo(data.videoId, data.title);
            } else {
                // 没有标题时，异步获取
                fetchVideoTitleAndSave(data.videoId);
            }
        } catch (err) {
            setError(err.message);
            setVideoId(null);
            setSubtitles([]);
        } finally {
            // 确保加载提示至少显示指定时长
            const elapsedTime = Date.now() - startTime;
            const remainingTime = Math.max(0, minDisplayTime - elapsedTime);
            await new Promise(resolve => setTimeout(resolve, remainingTime));
            setIsLoading(false);
        }
    };

    // 移除 localStorage 缓存逻辑，实现刷新即焚

    // 重置到缺省状态
    const handleReset = () => {
        setVideoId(null);
        setVideoUrl('');
        setSubtitles([]);
        setTranslations({});
        setSentenceTranslations({});
        setError('');
        setShowVideo(true);
    };

    // 清除缓存（测试用）
    const handleClearCache = async () => {
        if (!videoId) {
            alert('请先获取视频字幕');
            return;
        }

        if (!confirm(`确定要清除视频 ${videoId} 的所有缓存吗？`)) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/api/clear-cache`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ videoId }),
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message);
                // 清除前端翻译缓存
                setTranslations({});
                console.log('✅ 缓存已清除');
            } else {
                alert(`清除失败: ${data.error}`);
            }
        } catch (err) {
            console.error('清除缓存失败:', err);
            alert('清除缓存失败');
        }
    };

    // 处理单词翻译（基本翻译）
    const handleWordClick = async (word, sentence) => {
        // 清理单词（去除标点符号）
        const cleanWord = word.toLowerCase().replace(/[^\w\s]/g, '');

        // 使用 word + sentence 作为唯一key，支持同一单词在不同句子中有不同翻译
        const cacheKey = `${cleanWord}|||${sentence}`;

        // 如果已经有翻译，切换显示/隐藏
        if (translations[cacheKey]) {
            const willShow = !translations[cacheKey].visible;

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
                [cacheKey]: {
                    ...prev[cacheKey],
                    visible: willShow
                }
            }));
            return;
        }

        // 暂停播放（如果启用）
        if (pauseOnTranslate && videoPlayerRef.current) {
            videoPlayerRef.current.pause();
        }

        console.log('🔤 翻译单词:', cleanWord, '在句子:', sentence.substring(0, 30) + '...');

        try {
            const response = await fetch(`${API_BASE}/api/translate?simple=true`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    word: cleanWord,
                    sentence: sentence,  // 传入句子作为上下文
                    videoId: videoId     // 传入videoId以使用缓存
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setTranslations(prev => ({
                    ...prev,
                    [cacheKey]: {
                        word: cleanWord,  // 保存原始单词用于显示
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
            const response = await fetch(`${API_BASE}/api/translate?detailed=true`, {
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
            const response = await fetch(`${API_BASE}/api/translate-sentence`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text,
                    videoId // 传入 videoId 以使用缓存
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // 检查是否命中缓存
                if (data.cached) {
                    console.log('⚡️ 翻译缓存命中');
                }

                setSentenceTranslations(prev => ({
                    ...prev,
                    [index]: {
                        text: data.translation,
                        visible: true,
                        cached: data.cached || false
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
                    <h1 className={`app-title ${videoId ? 'clickable' : ''}`} onClick={videoId ? handleReset : undefined}>
                        <img src="/logo.png" alt="磨耳朵 Logo" className="app-title-logo" />
                        <span>磨耳朵</span>
                    </h1>
                    <div className="app-subtitle-row">
                        <p className="app-subtitle">粘贴一个 YouTube 视频链接，即刻开始磨耳朵</p>
                    </div>
                </header>

                <div className="url-input-container">
                    <UrlInput
                        onSubmit={handleUrlSubmit}
                        isLoading={isLoading}
                        error={error}
                    />
                </div>
            </div>

            {!isLoading && !videoId && (
                <>
                    <RecentVideos onVideoSelect={handleRecentVideoSelect} />
                    <RecommendedVideos onVideoSelect={handleRecentVideoSelect} />
                </>
            )}

            {(isLoading || videoId) && (
                <>
                    {isLoading ? (
                        <SkeletonLoader />
                    ) : (
                        <div className={`content-container ${!showVideo ? 'video-hidden' : ''}`}>
                            <div className={`video-section ${!showVideo ? 'hidden' : ''}`}>
                                <VideoPlayer
                                    ref={videoPlayerRef}
                                    videoId={videoId}
                                    onTimeUpdate={handleTimeUpdate}
                                    onStateChange={(state) => setIsPlaying(state === 1)}
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
                                        <label className="pause-toggle">
                                            <input
                                                type="checkbox"
                                                checked={autoScroll}
                                                onChange={(e) => setAutoScroll(e.target.checked)}
                                            />
                                            <span>自动滚动</span>
                                        </label>
                                        <button
                                            className="clear-cache-btn"
                                            onClick={handleClearCache}
                                            disabled={!videoId}
                                            title="清除当前视频的翻译缓存"
                                        >
                                            🗑️ 清除缓存
                                        </button>
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
                                    autoScroll={autoScroll}
                                    isPlaying={isPlaying}
                                />
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default App;
