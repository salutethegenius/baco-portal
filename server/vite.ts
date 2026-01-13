import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      // Get directory - use process.cwd() for bundled code compatibility
      const baseDir = process.cwd();
      
      const clientTemplate = path.resolve(
        baseDir,
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // Build output is in dist/public (from vite.config.ts)
  // Use process.cwd() for Railway and other deployment platforms
  const cwd = process.cwd();
  const possiblePaths: string[] = [
    // Railway/Standard deployment - dist/public (build output)
    path.resolve(cwd, "dist", "public"),
    // Public directory (fallback)
    path.resolve(cwd, "public"),
    // Vercel build output (for Vercel deployments)
    path.resolve(cwd, ".vercel", "output", "static"),
  ];

  console.log('Looking for static files in:', possiblePaths);
  console.log('Current working directory:', cwd);

  let distPath: string | null = null;
  for (const possiblePath of possiblePaths) {
    console.log(`Checking path: ${possiblePath}, exists: ${fs.existsSync(possiblePath)}`);
    if (fs.existsSync(possiblePath)) {
      distPath = possiblePath;
      console.log(`Found static files at: ${distPath}`);
      break;
    }
  }

  if (!distPath) {
    console.warn(
      `Could not find the build directory. Tried: ${possiblePaths.join(", ")}`,
    );
    console.warn('Static file serving disabled - API routes will still work');
    // Don't throw error, just log warning - routes will still work
    return;
  }

  console.log(`Serving static files from: ${distPath}`);
  
  // List files in the directory for debugging
  try {
    const files = fs.readdirSync(distPath);
    console.log(`Static files found: ${files.slice(0, 10).join(", ")}${files.length > 10 ? "..." : ""}`);
  } catch (e) {
    console.warn('Could not list static files:', e);
  }

  app.use(express.static(distPath, { 
    maxAge: '1y',
    etag: true,
    lastModified: true
  }));

  // fall through to index.html if the file doesn't exist (SPA routing)
  app.use("*", (_req, res) => {
    const indexPath = path.resolve(distPath!, "index.html");
    console.log(`Serving index.html from: ${indexPath}`);
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      console.warn(`index.html not found at: ${indexPath}`);
      res.status(404).json({ message: "Not found", path: _req.path });
    }
  });
}
