#!/usr/bin/env python3
"""
"""
使用 youtube-transcript-api 获取 YouTube 字幕，返回 JSON 格式
"""
import sys
import json
import os
import subprocess
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound

def get_subtitles(video_id):
    """
    获取 YouTube 视频的英文字幕
    优先使用 youtube-transcript-api，不需要 cookies。
    """
    
    # 1. 配置代理
    proxy_url = os.getenv('PROXY_URL')
    proxies = None
    if proxy_url:
        proxies = {
            "http": proxy_url,
            "https": proxy_url
        }
        print(f"🌐 使用代理: {proxy_url}", file=sys.stderr)

    # 2. 获取视频标题 (仍然使用 yt-dlp，因为它获取 metadata 很方便且不易被封)
    video_title = get_video_title(video_id, proxy_url)
    
    try:
        # 3. 获取字幕 (使用 youtube-transcript-api)
        print(f"📥 正在获取字幕: {video_id}", file=sys.stderr)
        
        # 实例化 API 并配置代理
        api = YouTubeTranscriptApi()
        if proxies:
            api.proxies = proxies

        # 获取字幕列表
        try:
            transcript_list = api.list(video_id)
        except Exception as e:
            # api.list 如果失败可能抛出各种异常
            print(f"❌ 获取字幕列表失败: {e}", file=sys.stderr)
            raise e
        
        # 查找字幕
        languages = ['en-GB', 'en-US', 'en']
        transcript = transcript_list.find_transcript(languages)
        print(f"✅ 找到字幕: {transcript.language_code}", file=sys.stderr)
           
        # 获取数据
        subtitle_data = transcript.fetch()
        
        # 4. 格式化
        formatted_subtitles = []
        for item in subtitle_data:
             # item 可能是对象也可能是字典，安全访问
            text = getattr(item, 'text', None)
            if text is None and hasattr(item, 'get'):
                text = item.get('text')
            
            start = getattr(item, 'start', None)
            if start is None and hasattr(item, 'get'):
                start = item.get('start')
                
            duration = getattr(item, 'duration', None)
            if duration is None and hasattr(item, 'get'):
                duration = item.get('duration')

            if text is not None:
                formatted_subtitles.append({
                    "text": text.replace('\n', ' '), 
                    "start": start,
                    "duration": duration
                })

        print(f"✅ 成功获取 {len(formatted_subtitles)} 条字幕行", file=sys.stderr)

        # 5. 输出结果
        output_data = {
            "videoId": video_id,
            "subtitles": formatted_subtitles
        }
        if video_title:
            output_data["title"] = video_title

        print(json.dumps(output_data))

    except NoTranscriptFound:
        print(json.dumps({"error": "没有找到英文字幕"}))
    except TranscriptsDisabled:
        print(json.dumps({"error": "该视频的字幕已禁用"}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))

def get_video_title(video_id, proxy_url=None):
    """使用 yt-dlp 获取标题 (备用方案)"""
    try:
        # 尝试查找本地 venv 中的 yt-dlp
        script_dir = os.path.dirname(os.path.abspath(__file__))
        venv_ytdlp_path = os.path.join(os.path.dirname(os.path.dirname(script_dir)), 'venv', 'bin', 'yt-dlp')
        ytdlp_cmd = venv_ytdlp_path if os.path.exists(venv_ytdlp_path) else 'yt-dlp'

        cmd = [
            ytdlp_cmd,
            "--get-title",
            "--quiet",
            "--no-warnings",
            f"https://www.youtube.com/watch?v={video_id}"
        ]
        
        if proxy_url:
            cmd.extend(["--proxy", proxy_url])

        result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            return result.stdout.strip()
    except:
        pass
    return None

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(json.dumps({"error": "需要提供视频 ID"}))
        sys.exit(1)
    
    video_id = sys.argv[1]
    get_subtitles(video_id)
