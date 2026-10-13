import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'
export default defineConfig({
  plugins: [vue(), cssInjectedByJsPlugin()],
  build: {
    outDir: 'resources', emptyOutDir: true,
    lib: { entry: 'ui/index.js', name: 'ui-speed-dial', formats: ['umd'], fileName: () => 'ui-speed-dial.umd.js' },
    rollupOptions: { external: ['vue', 'vuex'], output: { globals: { vue: 'Vue', vuex: 'vuex' } } }
  }
})
