// ============================================
// ORDER TIMELINE COMPONENT
// ============================================

import type { AuditLog } from '../services/api';

interface OrderTimelineProps {
    timeline: AuditLog[];
    orderNumber: string;
}

const STATUS_ICONS: Record<string, string> = {
    NEW: '📝',
    AWAITING_PAYMENT: '⏳',
    PREPARATION: '📦',
    SHIPPED: '🚚',
    DELIVERED: '📬',
    COMPLETED: '✅',
    RETURNED: '↩️',
    DISPUTED: '⚠️',
    CANCELLED: '❌'
};

const STATUS_COLORS: Record<string, string> = {
    NEW: '#6b7280',
    AWAITING_PAYMENT: '#f59e0b',
    PREPARATION: '#8b5cf6',
    SHIPPED: '#3b82f6',
    DELIVERED: '#10b981',
    COMPLETED: '#22c55e',
    RETURNED: '#f97316',
    DISPUTED: '#ef4444',
    CANCELLED: '#6b7280'
};

export function OrderTimeline({ timeline, orderNumber }: OrderTimelineProps) {
    if (timeline.length === 0) {
        return (
            <div className="timeline-empty">
                <p>No timeline data available</p>
            </div>
        );
    }

    return (
        <div className="order-timeline">
            <div className="timeline-header">
                <h3>📍 Order Timeline</h3>
                <span className="order-number">{orderNumber}</span>
            </div>

            <div className="timeline-track">
                {timeline.map((item, index) => (
                    <div
                        key={item.id}
                        className={`timeline-item ${index === timeline.length - 1 ? 'current' : 'completed'}`}
                    >
                        {/* Connector Line */}
                        {index < timeline.length - 1 && (
                            <div
                                className="timeline-connector"
                                style={{ background: STATUS_COLORS[item.newStatus] }}
                            />
                        )}

                        {/* Node */}
                        <div
                            className="timeline-node"
                            style={{
                                background: STATUS_COLORS[item.newStatus],
                                boxShadow: index === timeline.length - 1
                                    ? `0 0 20px ${STATUS_COLORS[item.newStatus]}50`
                                    : 'none'
                            }}
                        >
                            <span className="node-icon">{STATUS_ICONS[item.newStatus]}</span>
                        </div>

                        {/* Content */}
                        <div className="timeline-content">
                            <div className="timeline-status">
                                <span className="status-from">{item.oldStatus}</span>
                                <span className="status-arrow">→</span>
                                <span className="status-to" style={{ color: STATUS_COLORS[item.newStatus] }}>
                                    {item.newStatus}
                                </span>
                            </div>

                            <div className="timeline-meta">
                                <span className="changed-by">
                                    {item.changedBy === 'SYSTEM' ? '🤖' : item.changedBy === 'ADMIN' ? '👤' : '🙋'}
                                    {item.changedBy}
                                </span>
                                <span className="timestamp">
                                    {new Date(item.createdAt).toLocaleString()}
                                </span>
                            </div>

                            {item.reason && (
                                <p className="timeline-reason">{item.reason}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
