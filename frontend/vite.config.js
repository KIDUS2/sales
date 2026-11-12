import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// dev: npm run dev  -> http://localhost:5173 (API calls go to Spring Boot on 8080)
// prod: npm run build -> writes into Spring Boot's static folder, served at http://localhost:8080
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': 'http://localhost:8080' } },
  build: { outDir: '../src/main/resources/static', emptyOutDir: true },
})
