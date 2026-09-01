import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api/stock': {
        target: 'https://www.xbelievers.com',
        changeOrigin: true,
        secure: true,
        followRedirects: true,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
          Accept: 'application/json,text/plain,*/*',
          Referer: 'https://www.xbelievers.com/',
        },
      },
      '/api/sec': {
        target: 'https://data.sec.gov',
        changeOrigin: true,
        secure: true,
        followRedirects: true,
        timeout: 30000,
        headers: {
          Host: 'data.sec.gov',
          'User-Agent': 'MuskZoom IR research@xmax.com',
          Accept: 'application/json,text/plain,*/*',
          'Accept-Encoding': 'gzip, deflate',
          Referer: 'https://www.sec.gov/',
        },
        rewrite: (p) => p.replace(/^\/api\/sec/, ''),
      },
    },
  },
});
