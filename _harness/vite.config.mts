import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import path from 'node:path';
export default defineConfig({
    root: path.resolve(import.meta.dirname),
    resolve: { alias: { '@': path.resolve(import.meta.dirname, '../resources/js') } },
    plugins: [react(), tailwindcss()],
    server: { port: 5210, strictPort: true },
});
