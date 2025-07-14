import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    port: 5173,
    host: true,
    cors: true,
  },
  define: {
    // Allow runtime detection of environment
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development')
  }
});