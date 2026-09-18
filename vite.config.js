import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        wizard: resolve(__dirname, 'wizard.html'),
        workspace: resolve(__dirname, 'workspace.html'),
      },
    },
  },
});
