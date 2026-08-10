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
    // Auto-open the browser once the server is actually listening, at
    // whichever port Vite resolved to (if 5173 is already held by a leftover
    // process from a previous run, Vite falls back to 5174+ — opening here
    // instead of hardcoding the URL in flux-dev.bat means the browser always
    // lands on the right one). Skipped when PORT is externally assigned,
    // since that's the preview harness managing its own browser tab.
    open: !process.env.PORT,
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
