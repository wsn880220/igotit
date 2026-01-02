import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true
            }
        }
    },
    define: {
        // 允许在前端代码中使用环境变量
        'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || '')
    }
});
