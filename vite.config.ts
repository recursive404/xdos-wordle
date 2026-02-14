import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // GitHub Pages for `recursive404/xdos-wordle` serves at `/xdos-wordle/`
  const base = env.VITE_BASE?.trim() || '/xdos-wordle/'

  return {
    base,
    plugins: [react()],
  }
})
