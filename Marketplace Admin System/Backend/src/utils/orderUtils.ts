// ============================================
// ORDER HELPER UTILITIES
// ============================================

import { formatDistanceToNow } from 'date-fns';
import { getAllowedTransitions, getStatusLabel } from '../constants/orderStatus';

/**
 * Generate a unique order number
 */
export function generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${timestamp}-${random}`;
}

/**
 * Enrich order with computed fields for API response
 */
export function enrichOrder(order: any) {
    return {
        ...order,
        statusLabel: getStatusLabel(order.status),
        allowedTransitions: getAllowedTransitions(order.status).map(status => ({
            status,
            label: getStatusLabel(status)
        })),
        createdAgo: formatDistanceToNow(new Date(order.createdAt), { addSuffix: true }),
        updatedAgo: formatDistanceToNow(new Date(order.updatedAt), { addSuffix: true })
    };
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency
    }).format(amount);
}

/**
 * Calculate order timeline steps
 */
export function getOrderTimeline(order: any) {
    const steps = [
        { status: 'AWAITING_PAYMENT', label: 'Order Created', icon: '📝' },
        { status: 'PREPARATION', label: 'Payment Received', icon: '💳' },
        { status: 'SHIPPED', label: 'Order Shipped', icon: '🚚' },
        { status: 'DELIVERED', label: 'Delivered', icon: '📦' },
        { status: 'COMPLETED', label: 'Completed', icon: '✅' }
    ];

    const currentIndex = steps.findIndex(s => s.status === order.status);

    return steps.map((step, index) => ({
        ...step,
        completed: index < currentIndex,
        current: index === currentIndex,
        pending: index > currentIndex
    }));
}
