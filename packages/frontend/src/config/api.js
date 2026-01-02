// API 配置
// 开发环境使用代理，生产环境使用环境变量中的完整 URL

const getApiUrl = () => {
    // 如果设置了 VITE_API_URL 环境变量，使用它（Zeabur 生产环境）
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }
    // 否则使用相对路径（开发环境代理）
    return '';
};

export const API_BASE_URL = getApiUrl();

// API 请求辅助函数
export const fetchFromAPI = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    return fetch(url, options);
};
