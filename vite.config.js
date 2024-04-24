import mkcert from 'vite-plugin-mkcert';


export default {
  root: 'src/',
  publicDir: '../static/',
  base: './',
  server: {
    host: true,
    https: true,
    open: !('SANDBOX_URL' in process.env || 'CODESANDBOX_HOST' in process.env)
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: true
  },
  plugins: [mkcert()]
}
