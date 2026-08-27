import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  envDir: '../',
  server: {
    port: 5173
  },
  build: {
    target: 'esnext',
    cssMinify: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react';
            }
            if (id.includes('socket.io-client') || id.includes('axios')) {
              return 'vendor-network';
            }
            if (id.includes('emoji-picker-react')) {
              return 'vendor-emoji';
            }
            return 'vendor-misc';
          }
        }
      }
    }
  }
})
