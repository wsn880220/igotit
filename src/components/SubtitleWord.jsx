import React from 'react';
import './SubtitleWord.css';

function SubtitleWord({ word, isHighlighted, onClick, translation, onTranslationClick }) {
    // 判断是否可展开（没有alternatives但hasMore为true）
    const canExpand = translation?.visible && !translation?.alternatives && translation?.hasMore;
    // 判断是否已展开（有alternatives）
    const isExpanded = translation?.visible && translation?.alternatives && translation.alternatives.length > 0;

    return (
        <span className="word-wrapper">
            <span
                className={`subtitle-word ${isHighlighted ? 'highlighted' : ''}`}
                onClick={onClick}
            >
                {word}
            </span>
            {translation && translation.visible && (
                <span
                    className={`word-translation fade-in ${(canExpand || isExpanded) ? 'expandable' : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        // 可展开或已展开时都可以点击
                        if ((canExpand || isExpanded) && onTranslationClick) {
                            onTranslationClick(word);
                        }
                    }}
                >
                    <div className="main-translation">
                        {translation.text}
                        {canExpand && (
                            <span className="expand-icon" title="展开更多释义">▶</span>
                        )}
                        {isExpanded && (
                            <span className="expand-icon expanded" title="点击收起">▼</span>
                        )}
                    </div>
                    {isExpanded && (
                        <div className="alternatives">
                            <div className="alternatives-label">其他含义:</div>
                            {translation.alternatives.map((alt, index) => (
                                <div
                                    key={index}
                                    className="alternative-item"
                                >
                                    <span className="part-of-speech">[{alt.partOfSpeech}]</span>
                                    <span className="alt-translation">{alt.translation}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </span>
            )}
        </span>
    );
}

export default SubtitleWord;
