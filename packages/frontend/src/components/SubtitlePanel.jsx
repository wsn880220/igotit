import React, { useRef, useEffect, memo, useCallback, useState } from 'react';
import SubtitleWord from './SubtitleWord';
import './SubtitlePanel.css';

// 格式化时间（秒 -> mm:ss）
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} `;
}

// 将字幕文本拆分成单词
const splitIntoWords = (text) => {
    return text.split(/(\s+)/).filter(part => part.trim().length > 0);
};

// 计算单词的时间范围
const getWordTiming = (subtitle, wordIndex, totalWords) => {
    const wordDuration = subtitle.duration / totalWords;
    const wordStart = subtitle.start + (wordIndex * wordDuration);
    const wordEnd = wordStart + wordDuration;
    return { start: wordStart, end: wordEnd };
};

// 判断单词是否为当前播放
const isWordActive = (currentTime, wordStart, wordEnd) => {
    return currentTime >= wordStart && currentTime < wordEnd;
};

// Memoized Subtitle Item Component
const SubtitleItem = memo(({
    subtitle,
    index,
    isActive,
    currentTime,
    sentenceTranslation,
    translations, // 需要传递整个translations对象，或者只传递相关的翻译？为了性能，最好只传相关的，但在列表渲染中这很难。
    // 为了简单且不破坏功能，我们传递 translations，但要注意这可能会影响 memo 的效果，如果 translations 经常变。
    // 更好的做法是让 SubtitleWord 自己去订阅或连接状态，或者是 context。
    // 这里我们先假设 translations 更新不频繁，或者接受这个开销。
    onSentenceTranslate,
    onWordClick,
    onTranslationClick,
    activeSubRef
}) => {
    const words = splitIntoWords(subtitle.text);

    return (
        <div
            ref={isActive ? activeSubRef : null}
            className={`subtitle-item ${isActive ? 'active' : ''}`}
        >
            <div className="subtitle-header-row">
                <div className="subtitle-time">
                    {formatTime(subtitle.start)}
                </div>
                <button
                    className="translate-sentence-btn"
                    onClick={(e) => { e.stopPropagation(); onSentenceTranslate(subtitle.text, index); }}
                    title={sentenceTranslation ? "隐藏翻译" : "翻译整句"}
                >
                    {sentenceTranslation?.visible ? '🔼' : '🌐'}
                </button>
            </div>
            {sentenceTranslation && sentenceTranslation.visible && (
                <div className="sentence-translation">
                    {sentenceTranslation.text}
                </div>
            )}
            <div className="subtitle-text">
                {words.map((word, wordIndex) => {
                    const timing = getWordTiming(subtitle, wordIndex, words.length);
                    // 只有当这一行是 active 的时候，才需要计算单词的高亮
                    const isHighlighted = isActive && isWordActive(currentTime, timing.start, timing.end);
                    const cleanWord = word.toLowerCase().replace(/[^\w\s]/g, '');
                    // 使用与App.jsx一致的缓存key
                    const cacheKey = `${cleanWord}|||${subtitle.text}`;

                    return (
                        <SubtitleWord
                            key={wordIndex}
                            word={word}
                            isHighlighted={isHighlighted}
                            onClick={() => onWordClick(word, subtitle.text)}
                            translation={translations[cacheKey]}
                            onTranslationClick={onTranslationClick}
                        />
                    );
                })}
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    // Custom comparison function for React.memo
    // Returns true if props are equal (do not re-render), false otherwise

    // 1. Check if active state changed
    if (prevProps.isActive !== nextProps.isActive) return false;

    // 2. If it is active, we MUST re-render because words highlight depends on currentTime
    if (nextProps.isActive) return false;

    // 3. If it became inactive or stays inactive, check other props
    // Check sentence translations
    if (prevProps.sentenceTranslation !== nextProps.sentenceTranslation) return false;

    // Check words translations (this is the expensive part, checking deep equality or just ref equality)
    // Assuming ref equality for translations object changes means we should update.
    if (prevProps.translations !== nextProps.translations) return false;

    return true;
});

SubtitleItem.displayName = 'SubtitleItem';


function SubtitlePanel({
    subtitles,
    currentTime,
    onSeek, // Used in parent/controls but not passed to items
    onWordClick,
    onTranslationClick,
    onSentenceTranslate,
    translations, // Object
    sentenceTranslations, // Object
    videoPlayerRef,
    autoScroll = true, // 默认为 true
    isPlaying = false  // 添加播放状态
}) {
    const panelRef = useRef(null);
    const listRef = useRef(null);
    const activeSubRef = useRef(null);
    const [feedback, setFeedback] = useState({ type: null, id: 0 });

    // 播放控制函数
    const handlePlayPause = useCallback(() => {
        if (videoPlayerRef && videoPlayerRef.current) {
            const state = videoPlayerRef.current.getPlayerState();
            if (state === 1) videoPlayerRef.current.pause();
            else videoPlayerRef.current.play();
        }
    }, [videoPlayerRef]);

    const handleRewind = useCallback(() => {
        setFeedback({ type: 'rewind', id: Date.now() });
        if (videoPlayerRef && videoPlayerRef.current) {
            const current = videoPlayerRef.current.getCurrentTime();
            videoPlayerRef.current.seekTo(Math.max(0, current - 5));
            setTimeout(() => {
                const state = videoPlayerRef.current.getPlayerState();
                if (state === 2) videoPlayerRef.current.play();
            }, 100);
        }
    }, [videoPlayerRef]);

    const handleForward = useCallback(() => {
        setFeedback({ type: 'forward', id: Date.now() });
        if (videoPlayerRef && videoPlayerRef.current) {
            const current = videoPlayerRef.current.getCurrentTime();
            videoPlayerRef.current.seekTo(current + 10);
            setTimeout(() => {
                const state = videoPlayerRef.current.getPlayerState();
                if (state === 2) videoPlayerRef.current.play();
            }, 100);
        }
    }, [videoPlayerRef]);

    // 找到当前应该显示的字幕索引
    const currentIndex = subtitles.findIndex(sub => {
        const endTime = sub.start + sub.duration;
        return currentTime >= sub.start && currentTime < endTime;
    });

    // 自动滚动 (Optimized)
    // 自动滚动 (Optimized for both container and window scrolling)
    useEffect(() => {
        if (autoScroll && activeSubRef.current && listRef.current) {
            const container = listRef.current;
            const element = activeSubRef.current;

            // Calculate center position
            // element.offsetTop is relative to the container (because container is positioned relative)
            const newScrollTop = element.offsetTop - (container.clientHeight / 2) + (element.offsetHeight / 2);

            container.scrollTo({
                top: newScrollTop,
                behavior: 'smooth'
            });
        }
    }, [currentIndex, autoScroll]);

    return (
        <div className="subtitle-panel glass-effect" ref={panelRef}>
            <div className="playback-controls">
                <button onClick={handleRewind} className="control-button round-btn" title="后退 5 秒">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" />
                    </svg>
                    {feedback.type === 'rewind' && <span key={feedback.id} className="feedback-text">-5s</span>}
                </button>

                <button onClick={handlePlayPause} className={`control-button play-pause-btn ${isPlaying ? 'playing' : ''}`} title={isPlaying ? "暂停" : "播放"}>
                    {isPlaying ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <rect x="6" y="4" width="4" height="16" rx="1" />
                            <rect x="14" y="4" width="4" height="16" rx="1" />
                        </svg>
                    ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5.14v14.72a.5.5 0 0 0 .757.429l11-7.36a.5.5 0 0 0 0-.858l-11-7.36A.5.5 0 0 0 8 5.14z" />
                        </svg>
                    )}
                </button>

                <button onClick={handleForward} className="control-button round-btn" title="前进 10 秒">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M13 17l5-5-5-5M6 17l5-5-5-5" />
                    </svg>
                    {feedback.type === 'forward' && <span key={feedback.id} className="feedback-text">+10s</span>}
                </button>
            </div>

            <div className="subtitle-count-badge">
                {subtitles.length} 条字幕
            </div>

            <div className="subtitle-list" ref={listRef}>
                {subtitles.length === 0 ? (
                    <div className="empty-subtitles">
                        <p>暂无字幕</p>
                    </div>
                ) : (
                    subtitles.map((subtitle, index) => (
                        <SubtitleItem
                            key={index}
                            index={index}
                            subtitle={subtitle}
                            isActive={index === currentIndex}
                            currentTime={currentTime}
                            sentenceTranslation={sentenceTranslations[index]}
                            translations={translations}
                            onSentenceTranslate={onSentenceTranslate}
                            onWordClick={onWordClick}
                            onTranslationClick={onTranslationClick}
                            activeSubRef={activeSubRef}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

export default SubtitlePanel;
