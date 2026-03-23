import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        tailwindcss()
      ],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      // এখানে নতুন অংশটুকু যুক্ত করা হয়েছে যা হলুদ ওয়ার্নিং দূর করবে
      build: {
        chunkSizeWarningLimit: 2000,
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (id.includes('node_modules')) {
                if (id.includes('react')) return 'vendor-react';
                if (id.includes('lucide-react') || id.includes('framer-motion') || id.includes('date-fns')) return 'vendor-utils';
                if (id.includes('jspdf')) return 'vendor-pdf';
                return 'vendor';
              }
            }
          }
        }
      }
    };
});