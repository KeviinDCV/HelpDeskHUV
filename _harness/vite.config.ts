import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const raiz = resolve(import.meta.dirname, '..');

export default defineConfig({
    root: raiz,
    plugins: [react(), tailwindcss()],
    resolve: { alias: { '@': resolve(raiz, 'resources/js'), 'ziggy-js': resolve(raiz, 'vendor/tightenco/ziggy') } },
    server: { port: 5240, strictPort: true, open: false },
});
