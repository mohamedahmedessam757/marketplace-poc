/**
 * ============================================
 * MARKETPLACE ADMIN SYSTEM - BACKEND API
 * ============================================
 * 
 * Professional modular structure with:
 * - FSM (Finite State Machine) for Order Status
 * - WebSocket for Real-time Notifications
 * - Cron Jobs for Automation
 * - RESTful API Endpoints
 * - Analytics & Charts Data
 * - Email Templates
 * 
 * Author: Mohamed Attar
 * Version: 2.0.0
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Import services
import { initWebSocket, getConnectedClientsCount } from './services/websocket';
import { initCronJobs, runAutomationChecks } from './services/cron';

// Import routes
import ordersRouter from './routes/orders';
import notificationsRouter from './routes/notifications';
import analyticsRouter from './routes/analytics';
import auditLogsRouter from './routes/auditLogs';
import emailTemplatesRouter from './routes/emailTemplates';

// Load environment variables
dotenv.config();

// Initialize Express and Prisma
const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Create HTTP server for WebSocket
const server = createServer(app);

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
    credentials: true
}));
app.use(express.json());

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`📥 ${new Date().toISOString()} | ${req.method} ${req.path}`);
    next();
});

// ============================================
// API ROUTES
// ============================================
app.use('/api/orders', ordersRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/audit-logs', auditLogsRouter);
app.use('/api/email-templates', emailTemplatesRouter);

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
        status: 'healthy',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        websocketClients: getConnectedClientsCount()
    });
});

// ============================================
// ERROR HANDLING
// ============================================
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('❌ Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: err.message
    });
});

// 404 handler
app.use((_req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});

// ============================================
// SERVER STARTUP
// ============================================
async function startServer() {
    try {
        // Connect to database
        await prisma.$connect();
        console.log('✅ Connected to database');

        // Initialize WebSocket
        initWebSocket(server);

        // Initialize Cron Jobs
        initCronJobs();

        // Start server
        server.listen(PORT, () => {
            console.log(`
╔════════════════════════════════════════════════════════════════════╗
║                                                                    ║
║   🚀 MARKETPLACE ADMIN SYSTEM - BACKEND API v2.0                  ║
║                                                                    ║
║   Server: http://localhost:${PORT}                                    ║
║   WebSocket: ws://localhost:${PORT}/ws                                ║
║   Environment: ${process.env.NODE_ENV || 'development'}                                         ║
║                                                                    ║
║   API Endpoints:                                                   ║
║   ├─ /api/orders          CRUD + Search + FSM                      ║
║   ├─ /api/notifications   Real-time alerts                         ║
║   ├─ /api/analytics       Dashboard & Charts                       ║
║   ├─ /api/audit-logs      Timeline & Export                        ║
║   ├─ /api/email-templates Template Preview                         ║
║   └─ /api/health          Server status                            ║
║                                                                    ║
║   ⏰ Cron Jobs: Active                                              ║
║   🔌 WebSocket: Ready                                               ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
      `);

            // Run automation checks on startup
            runAutomationChecks();
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
});

// Start the server
startServer();
