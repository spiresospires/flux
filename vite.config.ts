import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Honour an externally assigned port (the Claude Code preview harness sets
    // PORT so its server can run alongside a manually started one on 5173).
    // Without PORT set, Vite keeps its default 5173 — flux-dev.bat unaffected.
    port: Number(process.env.PORT) || 5173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined
          }

          if (id.includes('react') || id.includes('scheduler')) {
            return 'react-vendor'
          }

          if (id.includes('framer-motion')) {
            return 'motion-vendor'
          }

          if (id.includes('lucide-react')) {
            return 'icons-vendor'
          }

          return 'vendor'
        },
      },
    },
  },
})
