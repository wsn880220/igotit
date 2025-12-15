import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';
import { v2 as translateV2 } from '@google-cloud/translate';
import { initDictionary, queryWord, formatDictionaryResult } from './dictionary.js';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = 3000;
const execPromise = promisify(exec);

// 初始化 Google 翻译（v2 - Basic 版本，最便宜）
let googleTranslate = null;
if (process.env.GOOGLE_TRANSLATE_API_KEY) {
  googleTranslate = new translateV2.Translate({
    key: process.env.GOOGLE_TRANSLATE_API_KEY
  });
  console.log('✅ Google 翻译 API 已启用');
} else {
  console.log('⚠️  未配置 Google 翻译 API Key，将使用备用方案');
}

// 初始化本地词典
const localDictAvailable = initDictionary();

// 中间件
app.use(cors());
app.use(express.json());

// 从 YouTube URL 中提取视频 ID
function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

// 使用 yt-dlp (Python 脚本) 获取字幕
async function getSubtitlesWithYtDlp(videoId) {
  try {
    console.log(`正在使用 yt-dlp 获取视频字幕: ${videoId}`);

    // 调用 Python 脚本
    const command = `./venv/bin/python3 get_subtitles.py "${videoId}"`;

    const { stdout, stderr } = await execPromise(command, {
      cwd: '/Users/wangyoudu/Development/Web/igotit',
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      timeout: 30000 // 30 秒超时
    });

    if (stderr) {
      console.log('Python 脚本警告:', stderr);
    }

    // 解析 JSON 输出
    const result = JSON.parse(stdout);

    if (result.error) {
      throw new Error(result.error);
    }

    return result.subtitles;
  } catch (error) {
    console.error('yt-dlp 错误:', error.message);
    throw error;
  }
}

// API 路由：获取字幕
app.post('/api/subtitles', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        error: '请提供 YouTube 视频链接'
      });
    }

    // 提取视频 ID
    const videoId = extractVideoId(url);
    if (!videoId) {
      return res.status(400).json({
        error: '无效的 YouTube 链接格式'
      });
    }

    console.log(`📹 视频 ID: ${videoId}`);

    // 使用 yt-dlp 获取字幕
    const subtitles = await getSubtitlesWithYtDlp(videoId);

    if (!subtitles || subtitles.length === 0) {
      return res.status(404).json({
        error: 'Ops，当前视频没有字幕'
      });
    }

    console.log(`✅ 成功获取 ${subtitles.length} 条字幕`);

    // 返回字幕数据
    res.json({
      videoId,
      subtitles
    });

  } catch (error) {
    console.error('❌ 字幕获取错误:', error.message);

    // 处理特定错误
    if (error.message.includes('没有') ||
      error.message.includes('字幕') ||
      error.message.includes('timeout')) {
      return res.status(404).json({
        error: 'Ops，当前视频没有字幕或请求超时'
      });
    }

    res.status(500).json({
      error: '字幕获取失败，请稍后重试',
      details: error.message
    });
  }
});

// 翻译API - 支持简单翻译和详细翻译两种模式
app.post('/api/translate', async (req, res) => {
  try {
    const { word } = req.body;
    const isSimple = req.query.simple === 'true';
    const isDetailed = req.query.detailed === 'true';

    if (!word) {
      return res.status(400).json({ error: '请提供要翻译的单词' });
    }

    console.log(`🔤 翻译单词: ${word} (${isDetailed ? '详细模式' : '简单模式'})`);

    const cleanWord = word.toLowerCase().trim();
    const alternatives = [];
    let mainTranslation = '';
    let mainPos = '';
    let localResultFormatted = null;

    // 1. 查询本地词典（无论是否详细模式，都查一下，用于判断 hasMore）
    if (localDictAvailable) {
      try {
        const localResult = queryWord(cleanWord);
        if (localResult) {
          localResultFormatted = formatDictionaryResult(localResult);
        }
      } catch (localError) {
        console.log(`📚 本地词典查询失败:`, localError.message);
      }
    }

    // 2. 详细模式：直接返回本地词典的 alternatives
    if (isDetailed) {
      if (localResultFormatted && localResultFormatted.alternatives) {
        console.log(`📚 本地词典命中（详细）: ${cleanWord}`);
        alternatives.push(...localResultFormatted.alternatives);
      }

      return res.json({
        word: cleanWord,
        alternatives: alternatives.length > 0 ? alternatives : null
      });
    }

    // 3. 简单模式：优先获取 Google 翻译作为主翻译
    if (googleTranslate) {
      try {
        const [translation] = await googleTranslate.translate(cleanWord, 'zh-CN');
        mainTranslation = translation;
        console.log(`✅ Google 翻译: ${cleanWord} -> ${mainTranslation}`);
      } catch (error) {
        console.error(`Google 翻译失败:`, error.message);
      }
    }

    // 4. 如果 Google 翻译失败，使用本地词典的主翻译
    if (!mainTranslation && localResultFormatted) {
      mainTranslation = localResultFormatted.mainTranslation;
      console.log(`📚 Google 失败，回退到本地词典: ${cleanWord}`);
    }

    // 5. 如果都失败，使用备用 Mock 字典
    if (!mainTranslation) {
      const mockTranslations = {
        'hello': '你好', 'welcome': '欢迎', 'goodbye': '再见',
        'thank': '感谢', 'thanks': '谢谢', 'please': '请',
        'sorry': '对不起', 'yes': '是', 'no': '不',
        'elephants': '大象', 'elephant': '大象',
        'cat': '猫', 'dog': '狗', 'bird': '鸟',
        'learning': '学习', 'study': '学习', 'practice': '练习',
        'tutorial': '教程', 'lesson': '课程',
        'amazing': '惊人的', 'exciting': '令人兴奋的',
        'interesting': '有趣的', 'beautiful': '美丽的',
        'easy': '简单的', 'difficult': '困难的',
        'important': '重要的', 'there': '那里',
        'say': '说', 'much': '多', 'pretty': '相当',
        'here': '这里', 'about': '关于', 'so': '所以'
      };
      if (mockTranslations[cleanWord]) {
        mainTranslation = mockTranslations[cleanWord];
        console.log(`📖 使用备用翻译字典`);
      }
    }

    // 6. 如果最终还是没有翻译，返回原文
    if (!mainTranslation) {
      mainTranslation = cleanWord;
    }

    // 7. 计算 hasMore：如果本地词典有 alternatives，则可以展开
    const hasMore = localResultFormatted && localResultFormatted.alternatives && localResultFormatted.alternatives.length > 0;

    res.json({
      word: cleanWord,
      translation: mainTranslation,
      alternatives: null,
      hasMore: hasMore // 告知前端是否有更多释义可查询（本地词典数据）
    });

  } catch (error) {
    console.error('翻译错误:', error);
    res.status(500).json({ error: '翻译服务出错' });
  }
});

// 翻译句子 API
app.post('/api/translate-sentence', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: '请提供要翻译的句子' });
    }

    console.log(`📝 翻译句子: ${text.substring(0, 50)}...`);

    if (googleTranslate) {
      try {
        const [translation] = await googleTranslate.translate(text, 'zh-CN');
        console.log(`✅ 句子翻译完成`);
        return res.json({
          original: text,
          translation: translation
        });
      } catch (error) {
        console.error(`Google 翻译失败:`, error.message);
        return res.status(500).json({ error: '翻译失败' });
      }
    } else {
      return res.status(503).json({ error: 'Google 翻译服务未配置' });
    }
  } catch (error) {
    console.error('句子翻译错误:', error);
    res.status(500).json({ error: '翻译服务出错' });
  }
});


// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: '服务器运行正常 (使用 yt-dlp)' });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`\n🚀 服务器已启动在 http://localhost:${PORT}`);
  console.log(`📝 字幕 API (yt-dlp): POST http://localhost:${PORT}/api/subtitles`);
  console.log(`🎬 演示 API: POST http://localhost:${PORT}/api/subtitles/demo`);
  console.log(`🔤 翻译 API: POST http://localhost:${PORT}/api/translate\n`);
});
