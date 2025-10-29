import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
// FIX: Explicitly import `process` to resolve a TypeScript type error where `process.cwd()` was not found on the global `process` object. This ensures the Node.js `process` module is used.
import process from 'process'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 5000,
      strictPort: true,
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      'process.env.RAPIDAPI_KEY': JSON.stringify(env.RAPIDAPI_KEY),
    },
  }
})
