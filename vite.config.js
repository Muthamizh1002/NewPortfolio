import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  server: {
    host: true,
    port: 3000,
    open: true,
    fs: {
      allow: ['.']
    }
  },
  plugins: [
    {
      name: 'serve-custom-assets',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && req.url.startsWith('/Background/')) {
            const filePath = path.join(__dirname, req.url);
            if (fs.existsSync(filePath)) {
              res.setHeader('Content-Type', 'image/png');
              return fs.createReadStream(filePath).pipe(res);
            }
          }
          if (req.url && (req.url === '/Muthamizh_S_Resume.pdf' || req.url === '/public/Muthamizh_S_Resume.pdf')) {
            const pdfPath = path.join(__dirname, 'public', 'Muthamizh_S_Resume.pdf');
            if (fs.existsSync(pdfPath)) {
              res.setHeader('Content-Type', 'application/pdf');
              res.setHeader('Content-Disposition', 'inline; filename="Muthamizh_S_Resume.pdf"');
              return fs.createReadStream(pdfPath).pipe(res);
            }
          }
          next();
        });
      }
    }
  ]
});
