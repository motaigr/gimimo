/* PostCSS Config file: https://postcss.org */
import { fileURLToPath } from 'node:url'

export default {
  plugins: {
    // caminho explícito: funciona mesmo rodando o Vite de outra pasta
    tailwindcss: { config: fileURLToPath(new URL('./tailwind.config.ts', import.meta.url)) },
    autoprefixer: {},
  },
}
