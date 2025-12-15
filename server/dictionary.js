// 本地词典查询模块 - 支持 Stardict SQLite 格式
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db = null;

// 初始化数据库连接
export function initDictionary() {
    try {
        const dbPath = path.join(__dirname, 'data', 'stardict.db');
        db = new Database(dbPath, { readonly: true });
        console.log('✅ 本地词典数据库已加载 (stardict.db)');
        return true;
    } catch (error) {
        console.log('⚠️  本地词典数据库未找到，将使用在线API');
        console.error(error.message);
        return false;
    }
}

// 简单的词形还原（处理复数、过去式等）
function simpleStem(word) {
    const cleaned = word.toLowerCase().trim();

    // 尝试多种形式
    const variants = [
        cleaned,                              // 原形
        cleaned.replace(/s$/, ''),            // 去掉s (books -> book)
        cleaned.replace(/es$/, ''),           // 去掉es (boxes -> box)
        cleaned.replace(/ies$/, 'y'),         // ies -> y (stories -> story)
        cleaned.replace(/ed$/, ''),           // 去掉ed (played -> play)
        cleaned.replace(/ing$/, ''),          // 去掉ing (playing -> play)
        cleaned.replace(/er$/, ''),           // 去掉er (bigger -> big)
        cleaned.replace(/est$/, ''),          // 去掉est (biggest -> big)
    ];

    return [...new Set(variants)]; // 去重
}

// 查询单词
export function queryWord(word) {
    if (!db) {
        return null;
    }

    try {
        const variants = simpleStem(word);

        // 依次尝试各种词形
        for (const variant of variants) {
            const stmt = db.prepare(`
        SELECT word, phonetic, definition, translation, pos 
        FROM stardict 
        WHERE word = ? COLLATE NOCASE 
        LIMIT 5
      `);
            const rows = stmt.all(variant);

            if (rows && rows.length > 0) {
                return rows;
            }
        }

        return null;
    } catch (error) {
        console.error('词典查询错误:', error.message);
        return null;
    }
}

// 清理翻译文本，移除标记
function cleanTranslation(text) {
    if (!text) return '';

    // 移除所有方括号标记
    return text
        .replace(/\[[^\]]*\]/g, '')     // 移除所有 [...] 标记（包括 [r:M:99], [机], [C:1] 等）
        .replace(/\{[^}]+\}/g, '')      // 移除 {xxx} 类型标记
        .replace(/\s+/g, ' ')           // 多个空格合并为一个
        .trim();
}

// 提取词性（如果有）
function extractPartOfSpeech(text) {
    // 匹配开头的词性标记：a., v., n., adj., adv. 等
    const match = text.match(/^([a-z]+\.)\s*/);
    if (match) {
        return match[1];
    }
    return '';
}

// 格式化词典结果为标准格式
export function formatDictionaryResult(rows) {
    if (!rows || rows.length === 0) {
        return null;
    }

    const alternatives = [];
    const firstRow = rows[0];

    let mainTranslation = '';
    let mainPos = '';

    if (firstRow.translation) {
        // 先按换行符分割
        const lines = firstRow.translation.split('\n').filter(l => l.trim().length > 0);

        // 遍历每一行
        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            let line = lines[lineIndex].trim();

            // 每行可能又有逗号分隔
            const parts = line.split(',').filter(p => p.trim().length > 0);

            for (let i = 0; i < parts.length; i++) {
                let trans = parts[i].trim();

                // 提取词性
                let pos = extractPartOfSpeech(trans);

                // 移除词性标记
                trans = trans.replace(/^[a-z]+\.\s*/, '');

                // 清理所有标记
                trans = cleanTranslation(trans);

                if (trans && trans.length > 0) {
                    // 第一个作为主翻译
                    if (alternatives.length === 0) {
                        mainTranslation = trans;
                        mainPos = pos;
                    }

                    alternatives.push({
                        partOfSpeech: pos || mainPos || firstRow.pos || '',
                        translation: trans,
                        example: null
                    });

                    // 最多5个
                    if (alternatives.length >= 5) break;
                }
            }

            if (alternatives.length >= 5) break;
        }
    }

    return {
        mainTranslation: mainTranslation || firstRow.translation || '',
        alternatives: alternatives.length > 1 ? alternatives.slice(1) : null
    };
}

export default {
    initDictionary,
    queryWord,
    formatDictionaryResult
};
