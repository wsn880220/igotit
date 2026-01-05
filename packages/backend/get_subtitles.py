#!/usr/bin/env python3
"""
使用 yt-dlp 获取 YouTube 字幕并转换为 JSON 格式
"""
import sys
import json
import subprocess
import os
import tempfile
import base64

def get_cookies_file():
    """
    获取 cookies 文件路径
    优先级：
    1. API 上传的临时文件 (/tmp/youtube_cookies.txt)
    2. 本地文件 cookies.txt (开发环境)
    3. 环境变量 YOUTUBE_COOKIES_BASE64
    """
    # 优先级 1: API 上传的文件
    api_cookies = '/tmp/youtube_cookies.txt'
    if os.path.exists(api_cookies):
        print(f"✅ 使用 API 上传的 cookies", file=sys.stderr)
        return api_cookies
    
    # 优先级 2: 本地文件（开发环境）
    script_dir = os.path.dirname(os.path.abspath(__file__))
    local_cookies = os.path.join(os.path.dirname(os.path.dirname(script_dir)), 'cookies.txt')
    if os.path.exists(local_cookies):
        print(f"✅ 使用本地 cookies.txt", file=sys.stderr)
        return local_cookies
    
    # 优先级 3: 环境变量
    cookies_b64 = os.getenv('YOUTUBE_COOKIES_BASE64')
    if cookies_b64:
        try:
            # 解码 base64
            cookies_content = base64.b64decode(cookies_b64).decode('utf-8')
            # 写入临时文件（使用不同的文件名避免冲突）
            temp_cookies = '/tmp/youtube_cookies_env.txt'
            with open(temp_cookies, 'w') as f:
                f.write(cookies_content)
            print(f"✅ 使用环境变量 YOUTUBE_COOKIES_BASE64", file=sys.stderr)
            return temp_cookies
        except Exception as e:
            print(f"❌ 环境变量 cookies 解析失败: {e}", file=sys.stderr)
    
    print(f"⚠️  未找到 cookies（本地或环境变量）", file=sys.stderr)
    return None

def get_subtitles(video_id):
    """获取 YouTube 视频的英文字幕"""
    url = f"https://www.youtube.com/watch?v={video_id}"

    # 获取脚本所在目录
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # 尝试查找本地 venv 中的 yt-dlp
    venv_ytdlp_path = os.path.join(os.path.dirname(os.path.dirname(script_dir)), 'venv', 'bin', 'yt-dlp')
    if os.path.exists(venv_ytdlp_path):
        venv_ytdlp = venv_ytdlp_path
    else:
        # 否则使用系统路径的 yt-dlp (Docker 环境)
        venv_ytdlp = 'yt-dlp'

    # 获取 cookies 文件（支持本地文件或环境变量）
    cookies_file = get_cookies_file()
    cookies_args = ['--cookies', cookies_file] if cookies_file else []
    
    # 调试：输出 cookies 信息
    if cookies_file:
        print(f"🍪 Cookies 文件路径: {cookies_file}", file=sys.stderr)
        print(f"🍪 文件存在: {os.path.exists(cookies_file)}", file=sys.stderr)
        if os.path.exists(cookies_file):
            print(f"🍪 文件大小: {os.path.getsize(cookies_file)} bytes", file=sys.stderr)
            print(f"🍪 文件权限: {oct(os.stat(cookies_file).st_mode)[-3:]}", file=sys.stderr)
    else:
        print(f"⚠️  未找到 cookies 文件！", file=sys.stderr)

    # 创建临时目录
    temp_dir = tempfile.mkdtemp()
    output_template = os.path.join(temp_dir, "subtitle")

    # 先获取视频标题
    video_title = None
    try:
        cmd_title = [
            venv_ytdlp,
            "--get-title",
            "--quiet",
            "--no-warnings",
            *cookies_args,
            url
        ]
        result = subprocess.run(
            cmd_title,
            capture_output=True,
            text=True,
            timeout=30  # 增加到30秒
        )
        if result.returncode == 0 and result.stdout:
            video_title = result.stdout.strip()
            print(f"获取到视频标题: {video_title}", file=sys.stderr)
        else:
            print(f"获取标题失败: returncode={result.returncode}, stderr={result.stderr}", file=sys.stderr)
    except Exception as e:
        print(f"获取标题异常: {e}", file=sys.stderr)

    try:
        # 使用 yt-dlp 下载字幕
        # 支持手动上传的字幕和自动字幕
        cmd = [
            venv_ytdlp,
            "--write-subs",          # 下载手动上传的字幕
            "--write-auto-subs",     # 下载自动生成的字幕
            "--sub-langs", "en-GB,en-US,en",  # 支持多种英语变体
            "--skip-download",       # 跳过视频下载
            "--sub-format", "vtt",   # 字幕格式
            "--no-check-certificate",  # 跳过证书检查
            # 反机器人检测配置
            # 反机器人检测配置
            "--user-agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "--sleep-requests", "1",  # 每个请求间隔1秒
        ]

        # 检查是否配置了代理
        proxy_url = os.getenv('PROXY_URL')
        if proxy_url:
            print(f"🌐 使用代理服务: {proxy_url}", file=sys.stderr)
            cmd.extend(["--proxy", proxy_url])

        cmd.extend([
            "-o", output_template,
            *cookies_args,
            url
        ])

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=30
        )
        
        # 调试：打印 yt-dlp 输出
        if result.stdout:
            print(f"yt-dlp stdout: {result.stdout[:500]}", file=sys.stderr)
        if result.stderr:
            print(f"yt-dlp stderr: {result.stderr[:500]}", file=sys.stderr)
        
        # 查找生成的 VTT 文件（优先查找手动字幕，然后是自动字幕）
        vtt_file = None
        
        # 根据 output_template 构建可能的文件名
        base_name = os.path.basename(output_template)
        
        # 调试：列出临时目录中的所有文件
        print(f"临时目录文件列表: {os.listdir(temp_dir)}", file=sys.stderr)
        
        # 优先级1: en-GB (英国英语)
        for variant in [f"{base_name}.en-GB.vtt", f"{base_name}.en.en-GB.vtt"]:
            test_path = os.path.join(temp_dir, variant)
            if os.path.exists(test_path):
                vtt_file = test_path
                print(f"✅ 找到英国英语字幕: {variant}", file=sys.stderr)
                break
        
        # 优先级2: en-US (美国英语)
        if not vtt_file:
            for variant in [f"{base_name}.en-US.vtt", f"{base_name}.en.en-US.vtt"]:
                test_path = os.path.join(temp_dir, variant)
                if os.path.exists(test_path):
                    vtt_file = test_path
                    print(f"✅ 找到美国英语字幕: {variant}", file=sys.stderr)
                    break
        
        # 优先级3: en (通用英语)
        if not vtt_file:
            for variant in [f"{base_name}.en.vtt"]:
                test_path = os.path.join(temp_dir, variant)
                if os.path.exists(test_path):
                    vtt_file = test_path
                    print(f"✅ 找到英语字幕: {variant}", file=sys.stderr)
                    break
        
        # 优先级4: 搜索所有包含 en 的 vtt 文件
        if not vtt_file:
            for file in os.listdir(temp_dir):
                if file.endswith(".vtt") and "en" in file.lower():
                    vtt_file = os.path.join(temp_dir, file)
                    print(f"✅ 找到英语字幕: {file}", file=sys.stderr)
                    break

        if not vtt_file:
            print(f"❌ 未找到字幕文件，临时目录: {temp_dir}", file=sys.stderr)
            print(json.dumps({"error": "没有找到英文字幕"}))
            return

        # 解析 VTT 文件
        subtitles = parse_vtt(vtt_file)

        # 输出 JSON (包含标题)
        output_data = {
            "videoId": video_id,
            "subtitles": subtitles
        }
        if video_title:
            output_data["title"] = video_title

        print(json.dumps(output_data))

    except subprocess.TimeoutExpired:
        print(json.dumps({"error": "请求超时"}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
    finally:
        # 清理临时文件
        try:
            for file in os.listdir(temp_dir):
                os.remove(os.path.join(temp_dir, file))
            os.rmdir(temp_dir)
        except:
            pass

def parse_vtt(vtt_file):
    """解析 VTT 字幕文件"""
    subtitles = []
    
    with open(vtt_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        
        # 跳过 WEBVTT 头和空行
        if line.startswith('WEBVTT') or line.startswith('NOTE') or not line:
            i += 1
            continue
        
        # 检查是否是时间戳行
        if '-->' in line:
            # 解析时间戳
            time_parts = line.split('-->')
            start_time = parse_timestamp(time_parts[0].strip())
            end_time = parse_timestamp(time_parts[1].strip().split()[0])
            
            # 获取字幕文本（可能有多行）
            text_lines = []
            i += 1
            while i < len(lines) and lines[i].strip() and '-->' not in lines[i]:
                text_lines.append(lines[i].strip())
                i += 1
            
            if text_lines:
                text = ' '.join(text_lines)
                # 移除 VTT 标签
                text = remove_vtt_tags(text)
                
                subtitles.append({
                    "text": text,
                    "start": start_time,
                    "duration": end_time - start_time
                })
        else:
            i += 1
    
    return subtitles

def parse_timestamp(timestamp):
    """将 VTT 时间戳转换为秒"""
    # 格式: HH:MM:SS.mmm 或 MM:SS.mmm
    parts = timestamp.strip().split(':')
    
    if len(parts) == 3:
        hours, minutes, seconds = parts
        total = float(hours) * 3600 + float(minutes) * 60 + float(seconds)
    elif len(parts) == 2:
        minutes, seconds = parts
        total = float(minutes) * 60 + float(seconds)
    else:
        total = float(parts[0])
    
    return round(total, 3)

def remove_vtt_tags(text):
    """移除 VTT 格式标签"""
    import re
    # 移除 <c>, <v>, <i>, <b>, <u> 等标签
    text = re.sub(r'<[^>]+>', '', text)
    # 移除 &nbsp; 等 HTML 实体
    text = text.replace('&nbsp;', ' ')
    text = text.replace('&amp;', '&')
    text = text.replace('&lt;', '<')
    text = text.replace('&gt;', '>')
    return text.strip()

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(json.dumps({"error": "需要提供视频 ID"}))
        sys.exit(1)
    
    video_id = sys.argv[1]
    get_subtitles(video_id)
