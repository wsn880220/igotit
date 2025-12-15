# 词典数据目录

## 使用说明

请将您的词典数据库文件放在此目录下：

**文件名：** `dictionary.db`

**完整路径：** `/Users/wangyoudu/Development/Web/igotit/server/data/dictionary.db`

## 支持的格式

系统会自动检测SQLite数据库文件，并尝试读取以下表结构：

- 英文单词表
- 词性标注
- 中英文释义
- 例句（可选）

## 使用优先级

1. 优先使用本地词典（更快）
2. 本地词典未找到时，使用Free Dictionary API
3. 最后降级到Google Translate

---

**📁 请将 dictionary.db 文件复制到这个目录下**
