import React, { useRef, useEffect } from 'react';
import SubtitleWord from './SubtitleWord';
import './SubtitlePanel.css';

// Force refresh

function SubtitlePanel({
    subtitles,
    currentTime,
    onSeek,
    onWordClick,
    onTranslationClick,

    onSentenceTranslate,
    translations,
    sentenceTranslations,
    videoPlayerRef
}) {
    const panelRef = useRef(null);
    const listRef = useRef(null); // 引用可滚动的列表
    const activeSubRef = useRef(null);

    // 播放控制函数
    const handlePlayPause = () => {
        if (videoPlayerRef && videoPlayerRef.current) {
            const state = videoPlayerRef.current.getPlayerState();
            // 1 = 播放中, 2 = 暂停
            if (state === 1) {
                videoPlayerRef.current.pause();
            } else {
                videoPlayerRef.current.play();
            }
        }
    };

    const handleRewind = () => {
        if (videoPlayerRef && videoPlayerRef.current) {
            const current = videoPlayerRef.current.getCurrentTime();
            videoPlayerRef.current.seekTo(Math.max(0, current - 5));

            // 自动播放：如果当前是暂停状态，跳转后自动播放
            setTimeout(() => {
                const state = videoPlayerRef.current.getPlayerState();
                if (state === 2) { // 2 = YouTube暂停状态
                    videoPlayerRef.current.play();
                }
            }, 100); // 等待seekTo完成
        }
    };

    const handleForward = () => {
        if (videoPlayerRef && videoPlayerRef.current) {
            const current = videoPlayerRef.current.getCurrentTime();
            videoPlayerRef.current.seekTo(current + 10);

            // 自动播放：如果当前是暂停状态，跳转后自动播放
            setTimeout(() => {
                const state = videoPlayerRef.current.getPlayerState();
                if (state === 2) { // 2 = YouTube暂停状态
                    videoPlayerRef.current.play();
                }
            }, 100); // 等待seekTo完成
        }
    };

    // 找到当前应该显示的字幕索引
    const getCurrentSubtitleIndex = () => {
        return subtitles.findIndex(sub => {
            const endTime = sub.start + sub.duration;
            return currentTime >= sub.start && currentTime < endTime;
        });
    };

    const currentIndex = getCurrentSubtitleIndex();

    // 自动滚动到当前字幕 - 匀速向上滚动
    useEffect(() => {
        if (activeSubRef.current && listRef.current) {
            const list = listRef.current;
            const activeSub = activeSubRef.current;

            // 获取当前字幕相对于列表顶部的位置
            const listRect = list.getBoundingClientRect();
            const subRect = activeSub.getBoundingClientRect();
            const relativeTop = subRect.top - listRect.top + list.scrollTop;

            // 目标位置：让当前字幕保持在列表上方20%的位置
            const targetScrollTop = relativeTop - (listRect.height * 0.2);

            // 平滑滚动到目标位置
            list.scrollTo({
                top: targetScrollTop,
                behavior: 'smooth'
            });
        }
    }, [currentIndex]);

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
    const isWordActive = (wordStart, wordEnd) => {
        return currentTime >= wordStart && currentTime < wordEnd;
    };

    return (
        <div className="subtitle-panel glass-effect" ref={panelRef}>
            <div className="playback-controls">
                <button onClick={handleRewind} className="control-button" title="后退 5 秒">
                    ⏪ -5s
                </button>
                <button onClick={handlePlayPause} className="control-button play-pause" title="播放/暂停">
                    ▶️ ⏸
                </button>
                <button onClick={handleForward} className="control-button" title="前进 10 秒">
                    ⏩ +10s
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
                    subtitles.map((subtitle, index) => {
                        const words = splitIntoWords(subtitle.text);
                        const isActive = index === currentIndex;
                        const sentenceTranslation = sentenceTranslations[index];

                        return (
                            <div
                                key={index}
                                ref={isActive ? activeSubRef : null}
                                className={`subtitle-item ${isActive ? 'active' : ''}`}
                                // 移除 onClick，修复点击单词导致重播的 bug
                                style={{
                                    padding: '1.2rem',
                                    marginBottom: '1rem',
                                    borderRadius: '12px',
                                    cursor: 'default', // 既然行本身不可点，改为默认光标
                                    // 统一的区块感背景
                                    background: 'rgba(20, 20, 25, 0.6)', // 更深的背景色，消除"白雾感"
                                    border: 'none',
                                    // 移除激活时的左侧紫条
                                    borderLeft: '4px solid transparent',
                                    // 移除激活时的强阴影
                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                                    // 移除过渡动画
                                    transition: 'none'
                                }}
                            >
                                <div className="subtitle-header-row">
                                    <div className="subtitle-time">
                                        {formatTime(subtitle.start)}
                                    </div>
                                    <button
                                        className="translate-sentence-btn"
                                        onClick={() => onSentenceTranslate(subtitle.text, index)}
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
                                        const isHighlighted = isActive && isWordActive(timing.start, timing.end);
                                        const cleanWord = word.toLowerCase().replace(/[^\w\s]/g, '');

                                        return (
                                            <SubtitleWord
                                                key={wordIndex}
                                                word={word}
                                                isHighlighted={isHighlighted}
                                                onClick={() => onWordClick(word)}
                                                translation={translations[cleanWord]}
                                                onTranslationClick={onTranslationClick}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

// 格式化时间（秒 -> mm:ss）
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} `;
}

export default SubtitlePanel;
