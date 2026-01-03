import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
// 注释：暂时停用 Google 翻译
// import { v2 as translateV2 } from '@google-cloud/translate';
// 注释：暂时停用本地词典
// import { initDictionary, queryWord, formatDictionaryResult } from './dictionary.js';
import ZhipuAI from 'zhipuai-sdk-nodejs-v4';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const execPromise = promisify(exec);

// 获取项目根目录（适配 Zeabur 部署）
const PROJECT_ROOT = process.cwd();
const PARENT_DIR = path.resolve(PROJECT_ROOT, '..');  // 项目根目录（venv 所在位置）
console.log('📁 当前目录 (PROJECT_ROOT):', PROJECT_ROOT);
console.log('📁 父目录 (PARENT_DIR):', PARENT_DIR);

// 注释：暂时停用 Google 翻译
// let googleTranslate = null;
// if (process.env.GOOGLE_TRANSLATE_API_KEY) {
//   googleTranslate = new translateV2.Translate({
//     key: process.env.GOOGLE_TRANSLATE_API_KEY
//   });
//   console.log('✅ Google 翻译 API 已启用');
// } else {
//   console.log('⚠️  未配置 Google 翻译 API Key，将使用备用方案');
// }

// 注释：暂时停用本地词典
// const localDictAvailable = initDictionary();

// 初始化智谱 AI
let zhipuAI = null;
if (process.env.ZHIPU_AI_API_KEY) {
  zhipuAI = new ZhipuAI({
    apiKey: process.env.ZHIPU_AI_API_KEY
  });
  console.log('✅ 智谱 AI 已启用');
} else {
  console.log('⚠️  未配置智谱 AI API Key');
}

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

    // 调用 Python 脚本（自动检测 Python 路径，venv 在父目录）
    const pythonCmd = fs.existsSync(path.join(PARENT_DIR, 'venv', 'bin', 'python3'))
      ? path.join(PARENT_DIR, 'venv', 'bin', 'python3')
      : 'python3';
    const scriptPath = path.join(PARENT_DIR, 'get_subtitles.py');
    const command = `${pythonCmd} "${scriptPath}" "${videoId}"`;

    const { stdout, stderr } = await execPromise(command, {
      cwd: PARENT_DIR,
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

    return {
      subtitles: result.subtitles,
      title: result.title || null
    };
  } catch (error) {
    console.error('yt-dlp 错误:', error.message);
    throw error;
  }
}

// 获取视频标题
async function getVideoTitle(videoId) {
  try {
    const pythonCmd = fs.existsSync(path.join(PARENT_DIR, 'venv', 'bin', 'python3'))
      ? path.join(PARENT_DIR, 'venv', 'bin', 'python3')
      : 'python3';
    const command = `${pythonCmd} -c "import yt_dlp; ydl_opts={'quiet':True,'no_warnings':True}; with yt_dlp.YoutubeDL(ydl_opts) as ydl: info = ydl.extract_info(f'https://www.youtube.com/watch?v=${videoId}', download=False); print(info.get('title', 'Unknown'))"`;

    const { stdout } = await execPromise(command, {
      cwd: PARENT_DIR,
      maxBuffer: 1024 * 1024,
      timeout: 10000
    });

    return stdout.trim();
  } catch (error) {
    console.error('获取视频标题失败:', error.message);
    return `Video ${videoId}`;
  }
}

// 添加到最近视频列表
function addToRecentVideos(videoId, title) {
  // 移除已存在的相同视频（如果有）
  const index = recentVideos.findIndex(v => v.videoId === videoId);
  if (index !== -1) {
    recentVideos.splice(index, 1);
  }

  // 添加到开头
  recentVideos.unshift({
    videoId,
    title,
    timestamp: Date.now()
  });

  // 保持最多 5 个
  if (recentVideos.length > MAX_RECENT_VIDEOS) {
    recentVideos.pop();
  }

  console.log(`📝 最近视频列表更新:`, recentVideos.map(v => `${v.videoId}: ${v.title.substring(0, 30)}...`));
}

// 简单的内存缓存
const subtitleCache = new Map();

// 翻译缓存：{ videoId: { sentences: Map(), words: Map() } }
const translationCache = new Map();

// 最近解析的视频列表（最多存储 5 个）
const recentVideos = [];
const MAX_RECENT_VIDEOS = 5;

// 智能分批函数
function splitSubtitlesIntoBatches(subtitles, maxBatchSize = 50) {
  const batches = [];
  for (let i = 0; i < subtitles.length; i += maxBatchSize) {
    batches.push(subtitles.slice(i, i + maxBatchSize));
  }
  return batches;
}

// JSON 解析容错
function parseAIResponse(content) {
  // 1. 直接尝试解析
  try {
    return JSON.parse(content);
  } catch { }

  // 2. 移除 markdown 代码块标记
  let cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  try {
    return JSON.parse(cleaned);
  } catch { }

  // 3. 提取 JSON 数组
  const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch { }
  }

  // 4. 查找第一个 [ 到最后一个 ]
  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');
  if (start !== -1 && end !== -1 && end > start) {
    try {
      return JSON.parse(cleaned.substring(start, end + 1));
    } catch { }
  }

  console.error('❌ JSON 解析完全失败，AI 返回内容:', content.substring(0, 200));
  return null;
}

// 常见英语虚词列表（冠词、介词、连词、助动词等）
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'because', 'as', 'until', 'while',
  'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through',
  'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in',
  'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once',
  'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must',
  'can', 'shall', 'ought', 's', 've', 'd', 'll', 't', 're', 'm'
]);

// 从句子中提取所有实词（去除虚词和标点）
function extractWords(sentence) {
  // 1. 转小写并分词
  const words = sentence.toLowerCase()
    .replace(/[^\w\s'-]/g, ' ')  // 保留连字符和撇号
    .split(/\s+/)
    .filter(w => w.length > 0);

  // 2. 去除虚词，保留实词
  const contentWords = words.filter(word => {
    // 去除纯数字
    if (/^\d+$/.test(word)) return false;
    // 去除虚词
    if (STOP_WORDS.has(word)) return false;
    // 去除单字母（除了 'I'，但已在虚词中）
    if (word.length === 1) return false;
    return true;
  });

  // 3. 去重
  return [...new Set(contentWords)];
}

// 规范化句子文本（处理缩写、空格等差异）
function normalizeSentence(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')  // 多个空格合并为一个
    .replace(/['']s\b/g, ' is')  // 's → is
    .replace(/['']re\b/g, ' are')  // 're → are
    .replace(/['']m\b/g, ' am')  // 'm → am
    .replace(/['']ve\b/g, ' have')  // 've → have
    .replace(/['']ll\b/g, ' will')  // 'll → will
    .replace(/['']d\b/g, ' would')  // 'd → would
    .replace(/n['']t\b/g, ' not')  // n't → not
    .replace(/['']/g, '')  // 移除其他撇号
    .replace(/\s+/g, ' ')  // 再次合并空格
    .trim();
}

// 批量翻译所有字幕（后台任务）- 包括句子和单词
async function batchTranslateSubtitles(videoId, subtitles) {
  const startTime = Date.now();
  console.log(`🔄 开始批量翻译: ${videoId} (${subtitles.length} 条字幕)`);

  // 减小批次大小，提高并行效率
  const batches = splitSubtitlesIntoBatches(subtitles, 20);
  const sentencesMap = new Map();

  // 定义单批次处理函数
  const processBatch = async (batch, batchIndex) => {
    const batchStartTime = Date.now();
    console.log(`📦 开始处理批次 ${batchIndex + 1}/${batches.length} (${batch.length} 条)`);

    try {
      const prompt = `你是JSON翻译工具。将英文字幕翻译成中文。

字幕列表：
${batch.map((s, i) => `${i}. "${s.text}"`).join('\n')}

严格返回此JSON格式（纯JSON，无其他文字）：
[{"index":0,"text":"原句","translation":"译文"}]

要求：
1. 只返回JSON数组
2. index对应字幕索引
3. text是原英文句子
4. translation是中文翻译`;

      const apiStartTime = Date.now();
      // console.log(`⏱️  (批次 ${batchIndex + 1}) 调用 AI API...`);
      const completion = await zhipuAI.createCompletions({
        model: "GLM-4-Flash-250414",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 4000, // 减小 token 限制
        stream: false
      });
      const apiDuration = Date.now() - apiStartTime;

      const responseText = completion.choices[0].message.content.trim();
      const translations = parseAIResponse(responseText);

      if (translations && Array.isArray(translations)) {
        translations.forEach(item => {
          const subtitle = batch[item.index];
          if (subtitle && item.translation && item.text) {
            const sentenceText = normalizeSentence(item.text);
            sentencesMap.set(sentenceText, {
              translation: item.translation
            });
          }
        });
        const batchDuration = Date.now() - batchStartTime;
        console.log(`✅ 批次 ${batchIndex + 1} 完成: ${translations.length} 句 (耗时: ${batchDuration}ms, API: ${apiDuration}ms)`);
      } else {
        console.error(`❌ 批次 ${batchIndex + 1} JSON 解析失败，跳过`);
      }

    } catch (error) {
      console.error(`批次 ${batchIndex + 1} 失败:`, error.message);
    }
  };

  // 并发处理批次（限制并发数）
  const CONCURRENCY_LIMIT = 5;
  for (let i = 0; i < batches.length; i += CONCURRENCY_LIMIT) {
    const chunk = batches.slice(i, i + CONCURRENCY_LIMIT);
    console.log(`🚀 启动并发批次: ${i + 1} - ${Math.min(i + chunk.length, batches.length)} (总共 ${batches.length})`);

    await Promise.all(chunk.map((batch, idx) => processBatch(batch, i + idx)));
  }

  // 保存到缓存
  translationCache.set(videoId, {
    sentences: sentencesMap
  });

  const totalDuration = Date.now() - startTime;
  console.log(`✅ 批量翻译完成: ${videoId} (${sentencesMap.size} 句, 总耗时: ${totalDuration}ms = ${(totalDuration / 1000).toFixed(2)}s)`);
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

    console.log(`\n🔍 请求处理: /api/subtitles`);
    console.log(`   URL: ${url}`);
    console.log(`   解析得到 VideoID: ${videoId}`);

    // 1. 检查缓存
    if (subtitleCache.has(videoId)) {
      console.log(`⚡️ 字幕缓存命中: ${videoId}`);
      const cached = subtitleCache.get(videoId);
      // 如果缓存的是对象（包含标题），提取字幕
      const subtitles = cached.subtitles || cached;
      const title = cached.title || null;
      return res.json({
        videoId,
        subtitles,
        title
      });
    }

    // 使用 yt-dlp 获取字幕
    const result = await getSubtitlesWithYtDlp(videoId);
    const subtitles = result.subtitles;
    const videoTitle = result.title;

    if (!subtitles || subtitles.length === 0) {
      return res.status(404).json({
        error: 'Ops，当前视频没有字幕'
      });
    }

    console.log(`✅ 成功获取 ${subtitles.length} 条字幕`);

    // 2. 存入缓存（存储完整对象，包含标题）
    subtitleCache.set(videoId, {
      subtitles,
      title: videoTitle
    });

    // 返回字幕数据（包含标题）
    res.json({
      videoId,
      subtitles,
      title: videoTitle
    });

    // 3. 启动后台翻译任务（不等待完成）
    if (zhipuAI) {
      // 触发后台批量翻译（已禁用）
      // batchTranslateSubtitles(videoId, subtitles).catch(err => {
      //   console.error(`❌ 后台翻译任务失败: ${videoId}`, err);
      // });
      console.log(`ℹ️ 批量翻译已禁用，仅支持实时单词翻译`);
    }

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

// 翻译API - 使用智谱 AI 根据上下文翻译单词
app.post('/api/translate', async (req, res) => {
  try {
    const { word, sentence, videoId } = req.body;

    if (!word) {
      return res.status(400).json({ error: '请提供要翻译的单词' });
    }

    const cleanWord = word.toLowerCase().trim();
    console.log(`🔤 翻译单词: ${cleanWord}${sentence ? ` (句子: ${sentence.substring(0, 30)}...)` : ''}`);

    // 检查智谱 AI 是否可用
    if (!zhipuAI) {
      return res.status(503).json({ error: '智谱 AI 服务未配置，请在 .env 中设置 ZHIPU_AI_API_KEY' });
    }

    // 实时翻译单词（带句子上下文）
    console.log(`📝 实时翻译单词: ${cleanWord}`);

    try {
      // 构建提示词：如果有句子上下文，就根据上下文翻译；否则就单纯翻译单词
      // 构建提示词：优化 Prompt 以获取更准确的上下文含义
      const prompt = sentence
        ? `请分析英文单词 "${cleanWord}" 在句子 "${sentence}" 中的具体含义。
请给出一个最贴切的中文翻译（仅输出中文词义）。
注意：
1. 如果是常用动词（如 have, take, get），尽量保留其基本含义（如"有"、"拿"、"获取"），除非在上下文中完全改变了意思。
2. 如果是代词或不定代词（如 one, it, that），请翻译这个词本身（如"一个"、"它"、"那个"），不要直接翻译它指代的对象（例如不要把 one 翻译成 dog）。
3. 不要过度意译整个短语，用户想知道这个单词本身的意思。`
        : `请将英文单词 "${cleanWord}" 翻译成中文。只需要给出简洁的中文翻译，不需要解释或其他内容。`;

      const completion = await zhipuAI.createCompletions({
        model: "GLM-4-Flash-250414",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,  // 降低随机性，使翻译更稳定
        max_tokens: 50,    // 限制输出长度
        stream: false
      });

      const translation = completion.choices[0].message.content.trim();
      console.log(`✅ 智谱 AI 翻译: ${cleanWord} -> ${translation}`);

      res.json({
        word: cleanWord,
        translation: translation,
        alternatives: null,
        hasMore: false,
        cached: false
      });

    } catch (error) {
      console.error('翻译错误:', error);
      res.status(500).json({ error: '翻译服务出错' });
    }

  } catch (error) {
    console.error('翻译错误:', error);
    res.status(500).json({ error: '翻译服务出错' });
  }
});

// 翻译句子 API - 使用智谱 AI（优先使用缓存）
app.post('/api/translate-sentence', async (req, res) => {
  try {
    const { text, videoId } = req.body;

    if (!text) {
      return res.status(400).json({ error: '请提供要翻译的句子' });
    }

    // 1. 优先查询缓存
    if (videoId && translationCache.has(videoId)) {
      const cache = translationCache.get(videoId);
      // 使用规范化后的句子查询缓存
      const normalizedText = normalizeSentence(text);
      if (cache.sentences && cache.sentences.has(normalizedText)) {
        const data = cache.sentences.get(normalizedText);
        console.log(`⚡️ 句子缓存命中: ${text.substring(0, 30)}...`);
        return res.json({
          original: text,
          translation: data.translation,
          cached: true
        });
      }
    }

    // 2. 缓存未命中，实时翻译
    console.log(`📝 实时翻译句子: ${text.substring(0, 50)}...`);

    // 检查智谱 AI 是否可用
    if (!zhipuAI) {
      return res.status(503).json({ error: '智谱 AI 服务未配置，请在 .env 中设置 ZHIPU_AI_API_KEY' });
    }

    try {
      const completion = await zhipuAI.createCompletions({
        model: "GLM-4-Flash-250414",
        messages: [
          {
            role: "user",
            content: `请将以下英文句子翻译成中文。只需要给出翻译结果，不需要解释或其他内容。\n\n英文：${text}\n\n中文翻译：`
          }
        ],
        temperature: 0.3,
        max_tokens: 200,
        stream: false
      });

      const translation = completion.choices[0].message.content.trim();
      console.log(`✅ 句子翻译完成`);

      return res.json({
        original: text,
        translation: translation,
        cached: false
      });
    } catch (aiError) {
      console.error(`智谱 AI 翻译失败:`, aiError.message);
      return res.status(500).json({ error: '翻译失败，请稍后重试' });
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

// 获取最近视频列表
app.get('/api/recent-videos', (req, res) => {
  res.json({
    videos: recentVideos.map(v => ({
      videoId: v.videoId,
      title: v.title,
      timestamp: v.timestamp
    }))
  });
});

// 获取视频标题
app.get('/api/video-title', async (req, res) => {
  try {
    const { videoId } = req.query;

    if (!videoId) {
      return res.status(400).json({ error: '请提供 videoId' });
    }

    const title = await getVideoTitle(videoId);
    res.json({ videoId, title });
  } catch (error) {
    console.error('获取视频标题失败:', error);
    res.status(500).json({ error: '获取标题失败' });
  }
});

// 获取推荐视频（从配置的频道）
app.get('/api/recommended-videos', async (req, res) => {
  try {
    // 使用相对路径（适配 Zeabur）
    const channelsConfigPath = path.join(PROJECT_ROOT, 'channels.json');

    if (!fs.existsSync(channelsConfigPath)) {
      console.error('频道配置文件不存在:', channelsConfigPath);
      return res.json({ channels: [] });
    }

    console.log('读取频道配置文件:', channelsConfigPath);
    const channelsConfig = JSON.parse(fs.readFileSync(channelsConfigPath, 'utf-8'));
    console.log('频道配置:', channelsConfig);
    const MAX_VIDEOS_PER_CHANNEL = 5;

    const channels = await Promise.all(
      channelsConfig.map(async (channel) => {
        try {
          const ytdlpCmd = fs.existsSync(path.join(PARENT_DIR, 'venv', 'bin', 'yt-dlp'))
            ? path.join(PARENT_DIR, 'venv', 'bin', 'yt-dlp')
            : 'yt-dlp';
          const command = `${ytdlpCmd} --flat-playlist --print "%(id)s|||%(title)s" "${channel.url}" --playlist-end ${MAX_VIDEOS_PER_CHANNEL}`;

          const { stdout } = await execPromise(command, {
            cwd: PARENT_DIR,
            maxBuffer: 1024 * 1024,
            timeout: 30000
          });

          const videos = stdout
            .trim()
            .split('\n')
            .filter(line => line.includes('|||'))
            .slice(0, MAX_VIDEOS_PER_CHANNEL)
            .map(line => {
              const [videoId, title] = line.split('|||');
              return { videoId, title };
            });

          return {
            name: channel.name,
            videos
          };
        } catch (error) {
          console.error(`获取频道 ${channel.name} 视频失败:`, error.message);
          return {
            name: channel.name,
            videos: []
          };
        }
      })
    );

    res.json({ channels });
  } catch (error) {
    console.error('获取推荐视频失败:', error);
    res.status(500).json({ error: '获取推荐视频失败' });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`\n🚀 服务器已启动在 http://localhost:${PORT}`);
  console.log(`📝 字幕 API (yt-dlp): POST http://localhost:${PORT}/api/subtitles`);
  console.log(`🎬 演示 API: POST http://localhost:${PORT}/api/subtitles/demo`);
  console.log(`🔤 翻译 API: POST http://localhost:${PORT}/api/translate\n`);
});

// 清除缓存 API（测试用）
app.post('/api/clear-cache', (req, res) => {
  try {
    const { videoId } = req.body;

    if (!videoId) {
      return res.status(400).json({ error: '请提供 videoId' });
    }

    // 清除字幕缓存
    if (subtitleCache.has(videoId)) {
      subtitleCache.delete(videoId);
      console.log(`🗑️  已清除字幕缓存: ${videoId}`);
    }

    // 清除翻译缓存
    if (translationCache.has(videoId)) {
      translationCache.delete(videoId);
      console.log(`🗑️  已清除翻译缓存: ${videoId}`);
    }

    res.json({
      success: true,
      message: `缓存已清除: ${videoId}`
    });
  } catch (error) {
    console.error('清除缓存错误:', error);
    res.status(500).json({ error: '清除缓存失败' });
  }
});
