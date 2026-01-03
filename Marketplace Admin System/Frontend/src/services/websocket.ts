// ============================================
// WEBSOCKET SERVICE - Real-time Connection
// ============================================

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001/ws';

type WebSocketListener = (data: any) => void;

class WebSocketService {
    private ws: WebSocket | null = null;
    private listeners: Map<string, Set<WebSocketListener>> = new Map();
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;

    connect(url: string = WS_URL) {
        if (this.ws?.readyState === WebSocket.OPEN) return;

        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
            console.log('🔌 WebSocket connected');
            this.reconnectAttempts = 0;
            this.emit('connected', { connected: true });
        };

        this.ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                console.log('📩 WebSocket message:', message.type);

                if (message.type === 'NOTIFICATION') {
                    this.emit('notification', message.data);
                    // Play notification sound
                    this.playNotificationSound();
                    // Show desktop notification
                    this.showDesktopNotification(message.data);
                } else if (message.type === 'ORDER_UPDATE') {
                    this.emit('orderUpdate', message.data);
                } else {
                    this.emit(message.type.toLowerCase(), message);
                }
            } catch (error) {
                console.error('Failed to parse WebSocket message:', error);
            }
        };

        this.ws.onclose = () => {
            console.log('🔌 WebSocket disconnected');
            this.emit('disconnected', { connected: false });
            this.attemptReconnect(url);
        };

        this.ws.onerror = (error) => {
            console.error('❌ WebSocket error:', error);
        };
    }

    private attemptReconnect(url: string) {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`🔄 Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            setTimeout(() => this.connect(url), 2000 * this.reconnectAttempts);
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    on(event: string, listener: WebSocketListener) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(listener);

        // Return unsubscribe function
        return () => {
            this.listeners.get(event)?.delete(listener);
        };
    }

    private emit(event: string, data: any) {
        this.listeners.get(event)?.forEach(listener => listener(data));
    }

    private playNotificationSound() {
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2Onra3sLW6vc7TzMbBucS/s6+sq6+vubqwqq+3s7CyxM3Mv7fDx8C3vcrH');
            audio.volume = 0.3;
            audio.play().catch(() => { });
        } catch (e) { }
    }

    private showDesktopNotification(data: { title: string; message: string }) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(data.title, {
                body: data.message,
                icon: '🔔',
                tag: 'marketplace-admin'
            });
        }
    }

    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }

    isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }
}

export const wsService = new WebSocketService();
