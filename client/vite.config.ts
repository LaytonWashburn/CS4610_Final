import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(),  tailwindcss()],
  base: "/static",
  build: {
    outDir: "../server/dist/static",
    manifest: true,
    rollupOptions: {
      input: "./src/main.tsx"
    }
  },
  server: {
    cors: {
      origin: "*"
    }
  }
})
