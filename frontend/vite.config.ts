import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },

  server: {
    host: "0.0.0.0",     // 🔥 IMPORTANT for VPS access
    port: 3001
  }
});