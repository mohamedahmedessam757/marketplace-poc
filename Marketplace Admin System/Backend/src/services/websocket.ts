// ============================================
// WEBSOCKET SERVICE - Real-time Notifications
// ============================================

import { WebSocket, WebSocketServer } from 'ws';
import { Server } from 'http';

let wss: WebSocketServer | null = null;
const clients: Set<WebSocket> = new Set();

export interface WebSocketNotification {
    id: string;
    type: string;
    title: string;
    message: string;
    orderId?: string | null;
    createdAt: string;
}

/**
 * Initialize WebSocket server
 */
export function initWebSocket(server: Server): WebSocketServer {
    wss = new WebSocketServer({ server, path: '/ws' });

    wss.on('connection', (ws: WebSocket) => {
        console.log('🔌 New WebSocket client connected');
        clients.add(ws);

        // Send welcome message
        ws.send(JSON.stringify({
            type: 'CONNECTED',
            message: 'Connected to Marketplace Admin WebSocket',
            timestamp: new Date().toISOString()
        }));

        ws.on('close', () => {
            console.log('🔌 WebSocket client disconnected');
            clients.delete(ws);
        });

        ws.on('error', (error) => {
            console.error('❌ WebSocket error:', error);
            clients.delete(ws);
        });
    });

    console.log('✅ WebSocket server initialized');
    return wss;
}

/**
 * Broadcast notification to all connected clients
 */
export function broadcastNotification(notification: WebSocketNotification): void {
    if (!wss) {
        console.warn('⚠️ WebSocket server not initialized');
        return;
    }

    const message = JSON.stringify({
        type: 'NOTIFICATION',
        data: notification,
        timestamp: new Date().toISOString()
    });

    let sentCount = 0;
    clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
            sentCount++;
        }
    });

    console.log(`📢 Notification broadcast to ${sentCount} clients: ${notification.title}`);
}

/**
 * Broadcast order update to all connected clients
 */
export function broadcastOrderUpdate(order: any): void {
    if (!wss) return;

    const message = JSON.stringify({
        type: 'ORDER_UPDATE',
        data: order,
        timestamp: new Date().toISOString()
    });

    clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

/**
 * Get connected clients count
 */
export function getConnectedClientsCount(): number {
    return clients.size;
}
