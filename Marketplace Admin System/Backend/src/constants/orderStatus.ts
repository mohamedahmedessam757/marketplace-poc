// ============================================
// ORDER STATUS CONSTANTS & FSM
// ============================================

export const OrderStatus = {
    AWAITING_PAYMENT: 'AWAITING_PAYMENT',
    PREPARATION: 'PREPARATION',
    SHIPPED: 'SHIPPED',
    DELIVERED: 'DELIVERED',
    COMPLETED: 'COMPLETED',
    RETURNED: 'RETURNED',
    DISPUTED: 'DISPUTED',
    CANCELLED: 'CANCELLED'
} as const;

export type OrderStatusType = typeof OrderStatus[keyof typeof OrderStatus];

export const NotificationType = {
    PAYMENT_OVERDUE: 'PAYMENT_OVERDUE',
    SHIPMENT_DELAYED: 'SHIPMENT_DELAYED',
    STATUS_CHANGE: 'STATUS_CHANGE',
    SYSTEM_ALERT: 'SYSTEM_ALERT',
    NEW_ORDER: 'NEW_ORDER'
} as const;

export type NotificationTypeValue = typeof NotificationType[keyof typeof NotificationType];

// FSM Valid Transitions
type TransitionMap = {
    [key in OrderStatusType]?: OrderStatusType[];
};

export const VALID_TRANSITIONS: TransitionMap = {
    AWAITING_PAYMENT: [OrderStatus.PREPARATION, OrderStatus.CANCELLED],
    PREPARATION: [OrderStatus.SHIPPED, OrderStatus.CANCELLED, OrderStatus.RETURNED],
    SHIPPED: [OrderStatus.DELIVERED, OrderStatus.RETURNED, OrderStatus.DISPUTED],
    DELIVERED: [OrderStatus.COMPLETED, OrderStatus.RETURNED, OrderStatus.DISPUTED],
    COMPLETED: [],
    RETURNED: [],
    DISPUTED: [],
    CANCELLED: []
};

// Status display labels with emojis
export const STATUS_LABELS: Record<OrderStatusType, string> = {
    AWAITING_PAYMENT: '⏳ Awaiting Payment',
    PREPARATION: '📦 Preparation',
    SHIPPED: '🚚 Shipped',
    DELIVERED: '✅ Delivered',
    COMPLETED: '🎉 Completed',
    RETURNED: '↩️ Returned',
    DISPUTED: '⚠️ Disputed',
    CANCELLED: '❌ Cancelled'
};

// Status colors for UI
export const STATUS_COLORS: Record<OrderStatusType, string> = {
    AWAITING_PAYMENT: '#f59e0b',
    PREPARATION: '#8b5cf6',
    SHIPPED: '#3b82f6',
    DELIVERED: '#10b981',
    COMPLETED: '#22c55e',
    RETURNED: '#f97316',
    DISPUTED: '#ef4444',
    CANCELLED: '#6b7280'
};

// Helper functions
export function isValidTransition(currentStatus: string, newStatus: string): boolean {
    const allowedTransitions = VALID_TRANSITIONS[currentStatus as OrderStatusType];
    return allowedTransitions ? allowedTransitions.includes(newStatus as OrderStatusType) : false;
}

export function getAllowedTransitions(currentStatus: string): OrderStatusType[] {
    return VALID_TRANSITIONS[currentStatus as OrderStatusType] || [];
}

export function getStatusLabel(status: string): string {
    return STATUS_LABELS[status as OrderStatusType] || status;
}

export function getStatusColor(status: string): string {
    return STATUS_COLORS[status as OrderStatusType] || '#6b7280';
}
