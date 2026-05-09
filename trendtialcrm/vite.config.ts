import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  envPrefix: 'VITE_',
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api/resend-proxy': {
        target: 'https://api.resend.com',
        changeOrigin: true,
        secure: true,
        rewrite: () => '/emails',
        headers: {
          Authorization: 'Bearer re_e2bEvcQt_HJAUKNzFBRywFL9UgY5aDNhP',
        },
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
