/**
 * LifeVault AI Server — Backend Entry Point
 *
 * Provides:
 * - Google OAuth URL generation, token exchange, and refresh
 * - JWT-based session security
 * - AI NLP action parsing
 * - Speech-to-Text transcription
 * - Health and configuration diagnostics
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth';
import { aiRouter } from './routes/ai';

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3000;

// Security & Parsing Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health and Status Check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'LifeVault AI Server',
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    features: {
      googleOAuth: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      jwtAuth: Boolean(process.env.JWT_SECRET),
      speechToText: {
        provider: process.env.SPEECH_TO_TEXT_PROVIDER || 'GOOGLE',
        active: Boolean(process.env.SPEECH_TO_TEXT_API_KEY),
      },
      driveFolderName: process.env.GOOGLE_DRIVE_FOLDER_NAME || 'LifeVault AI',
      sheetsSpreadsheetName: process.env.GOOGLE_SHEETS_SHEET_NAME || 'LifeVault AI - Data Records',
    },
  });
});

// Mounted Routes
app.use('/api/auth', authRouter);
app.use('/api/ai', aiRouter);
app.use('/api/speech', aiRouter);

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[LifeVault Server Error]', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err?.message || 'Unexpected server error occurred',
  });
});

app.listen(PORT, () => {
  console.log(`\n🏛️  LifeVault AI Server running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   OAuth callback: ${process.env.GOOGLE_REDIRECT_URI || `http://localhost:${PORT}/api/auth/callback`}\n`);
});

export default app;
