// Vercel serverless function entry point
import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "../server/routes";
import { serveStatic } from "../server/vite";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { formatError, logError } from "../server/errors";

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
}));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Initialize routes - use a promise to ensure routes are ready
let routesPromise: Promise<void> | null = null;

const ensureRoutesInitialized = async (): Promise<void> => {
  if (!routesPromise) {
    routesPromise = (async () => {
      try {
        console.log('Initializing routes...');
        await registerRoutes(app);
        console.log('Routes initialized successfully');
      } catch (error) {
        console.error('Failed to initialize routes:', error);
        throw error;
      }
    })();
  }
  return routesPromise;
};

// Middleware to ensure routes are initialized before handling requests
app.use(async (req, res, next) => {
  try {
    await ensureRoutesInitialized();
    next();
  } catch (error) {
    console.error('Route initialization error:', error);
    res.status(500).json({ message: 'Server initialization error' });
  }
});

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  logError(err, { path: _req.path, method: _req.method });
  const formattedError = formatError(err);
  const statusCode = formattedError.statusCode;
  const errorResponse: any = { message: formattedError.message };
  if (formattedError.errors) {
    errorResponse.errors = formattedError.errors;
  }
  if (process.env.NODE_ENV === 'development' && err.stack) {
    errorResponse.stack = err.stack;
  }
  res.status(statusCode).json(errorResponse);
});

// Serve static files in production
if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
  console.log('Setting up static file serving...');
  serveStatic(app);
}

// Initialize routes immediately (non-blocking)
ensureRoutesInitialized().catch((error) => {
  console.error('Failed to initialize routes on startup:', error);
});

export default app;
