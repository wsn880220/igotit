# YouTube Cookies 设置指南

由于 YouTube 加强了 bot 检测，`yt-dlp` 需要使用浏览器 cookies 才能正常获取字幕。

## 快速设置步骤

### 方法 1：使用浏览器扩展（推荐）

1. **安装扩展**
   - Chrome/Edge: 安装 [Get cookies.txt LOCALLY](https://chrome.google.com/webstore/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbanldfppne)
   - Firefox: 安装 [Get cookies.txt](https://addons.mozilla.org/en-US/firefox/addon/get-cookiestxt-locally/)
   - Safari: 安装 [Get cookies.txt](https://apps.apple.com/app/cookies-txt/id1559697360)

2. **导出 cookies**
   - 在浏览器中访问 YouTube.com 并登录
   - 点击扩展图标
   - 选择 "Current Site" → "Export" → 下载 cookies.txt 文件
   - 将文件保存到项目根目录：`/Users/wangyoudu/Development/Web/igotit/cookies.txt`

3. **测试**
   - cookies 文件就绪后，系统会自动使用它
   - 重启服务器即可生效

### 方法 2：使用 yt-dlp 内置功能（失败）

macOS 上的 Chrome 和 Safari cookies 都是加密的，`--cookies-from-browser` 功能无法正常工作。

## 验证 cookies 是否有效

运行以下命令测试：

```bash
./venv/bin/yt-dlp --cookies cookies.txt --list-subs "https://www.youtube.com/watch?v=VIDEO_ID"
```

如果显示可用字幕列表，说明 cookies 有效。

## 注意事项

- cookies 会过期，如果字幕获取失败，重新导出 cookies.txt
- cookies 文件包含敏感信息，不要提交到 Git
- 项目根目录的 `.gitignore` 已包含 `cookies.txt`

## 临时解决方案

如果不想设置 cookies，可以：
1. 只使用手动输入 URL 的功能（不使用推荐视频）
2. 选择没有 bot 检测限制的视频
