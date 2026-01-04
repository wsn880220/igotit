import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// 管理员密钥验证中间件
function requireAdminKey(req, res, next) {
    const adminKey = process.env.ADMIN_SECRET_KEY;
    const providedKey = req.headers['x-admin-key'];

    if (!adminKey) {
        return res.status(500).json({
            error: '未配置管理员密钥',
            hint: '请在环境变量中设置 ADMIN_SECRET_KEY'
        });
    }

    if (providedKey !== adminKey) {
        console.warn(`❌ 管理员密钥验证失败: ${req.ip}`);
        return res.status(403).json({ error: '无效的管理员密钥' });
    }

    console.log(`✅ 管理员认证成功: ${req.ip}`);
    next();
}

// 上传/更新 Cookies
router.post('/update-cookies', requireAdminKey, async (req, res) => {
    try {
        const { cookies } = req.body;

        if (!cookies) {
            return res.status(400).json({
                error: '请提供 cookies 内容',
                example: '{ "cookies": "# Netscape HTTP Cookie File\\n.youtube.com\\t..." }'
            });
        }

        // 验证 cookies 格式
        const lines = cookies.split('\n').filter(l => l.trim() && !l.startsWith('#'));
        if (lines.length === 0) {
            return res.status(400).json({
                error: 'Cookies 内容无效',
                hint: '请确保 cookies.txt 格式正确'
            });
        }

        // 写入临时文件
        const cookiesPath = '/tmp/youtube_cookies.txt';
        fs.writeFileSync(cookiesPath, cookies, 'utf-8');

        // 验证文件
        const stats = fs.statSync(cookiesPath);
        console.log(`📝 Cookies 已更新: ${lines.length} 条记录, ${stats.size} 字节`);

        res.json({
            success: true,
            message: `Cookies 已更新`,
            details: {
                cookieCount: lines.length,
                fileSize: stats.size,
                timestamp: new Date().toISOString(),
                location: cookiesPath
            }
        });

    } catch (error) {
        console.error('❌ 更新 Cookies 失败:', error);
        res.status(500).json({
            error: '更新失败',
            details: error.message
        });
    }
});

// 检查 Cookies 状态
router.get('/cookies-status', requireAdminKey, (req, res) => {
    const cookiesPath = '/tmp/youtube_cookies.txt';

    if (!fs.existsSync(cookiesPath)) {
        return res.json({
            exists: false,
            message: '未找到 cookies 文件',
            hint: '使用 POST /api/admin/update-cookies 上传'
        });
    }

    try {
        const stats = fs.statSync(cookiesPath);
        const content = fs.readFileSync(cookiesPath, 'utf-8');
        const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#'));

        // 检查是否包含关键 cookies
        const hasSecureCookies = content.includes('__Secure-');
        const hasVisitorInfo = content.includes('VISITOR_INFO1_LIVE');
        const hasLoginInfo = content.includes('LOGIN_INFO');

        res.json({
            exists: true,
            fileSize: stats.size,
            modifiedAt: stats.mtime,
            cookieCount: lines.length,
            quality: {
                hasSecureCookies,
                hasVisitorInfo,
                hasLoginInfo,
                score: (hasSecureCookies ? 40 : 0) + (hasVisitorInfo ? 30 : 0) + (hasLoginInfo ? 30 : 0)
            },
            preview: lines.slice(0, 3).map(l => {
                const parts = l.split('\t');
                return parts.length >= 6 ? `${parts[0]} - ${parts[5]} (expires)` : l.substring(0, 50);
            })
        });
    } catch (error) {
        res.status(500).json({
            error: '读取文件失败',
            details: error.message
        });
    }
});

// 删除 Cookies（清理）
router.delete('/delete-cookies', requireAdminKey, (req, res) => {
    const cookiesPath = '/tmp/youtube_cookies.txt';

    if (!fs.existsSync(cookiesPath)) {
        return res.json({
            success: true,
            message: 'Cookies 文件不存在，无需删除'
        });
    }

    try {
        fs.unlinkSync(cookiesPath);
        console.log(`🗑️  Cookies 已删除: ${cookiesPath}`);

        res.json({
            success: true,
            message: 'Cookies 已删除',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ 删除 Cookies 失败:', error);
        res.status(500).json({
            error: '删除失败',
            details: error.message
        });
    }
});

export default router;
