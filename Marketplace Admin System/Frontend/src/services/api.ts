// ============================================
// API SERVICE - Centralized API Calls
// ============================================

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Types
export interface Order {
    id: string;
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    totalAmount: number;
    status: string;
    statusLabel: string;
    createdAt: string;
    updatedAt: string;
    createdAgo: string;
    updatedAgo: string;
    allowedTransitions: { status: string; label: string }[];
    auditLogs: AuditLog[];
}

export interface AuditLog {
    id: string;
    orderId: string;
    oldStatus: string;
    newStatus: string;
    changedBy: string;
    reason: string;
    createdAt: string;
    order?: { orderNumber: string; customerName: string };
}

export interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    orderId: string | null;
    isRead: boolean;
    createdAt: string;
}

export interface DashboardStats {
    totalOrders: number;
    todayOrders: number;
    totalRevenue: number;
    statusCounts: Record<string, number>;
    unreadNotifications: number;
    totalAuditLogs: number;
}

export interface SalesChartData {
    date: string;
    revenue: number;
    orders: number;
}

export interface StatusDistribution {
    status: string;
    count: number;
    color: string;
    percentage: number;
}

export interface TopCustomer {
    name: string;
    email: string;
    totalSpent: number;
    orderCount: number;
}

export interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    description: string;
    variables: string[];
    html?: string;
}

// Helper function
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'API Error');
    return data;
}

// API Methods
export const api = {
    // Orders
    getOrders: () => fetchApi<{ data: Order[] }>('/orders'),
    getOrder: (id: string) => fetchApi<{ data: Order }>(`/orders/${id}`),
    createOrder: (order: { customerName: string; customerEmail: string; totalAmount: number }) =>
        fetchApi<{ data: Order }>('/orders', { method: 'POST', body: JSON.stringify(order) }),
    updateOrderStatus: (id: string, newStatus: string, reason?: string) =>
        fetchApi<{ success: boolean; data: any; error?: string; message?: string }>(
            `/orders/${id}/status`,
            { method: 'PATCH', body: JSON.stringify({ newStatus, changedBy: 'ADMIN', reason }) }
        ),
    searchOrders: (params: Record<string, string>) =>
        fetchApi<{ data: Order[]; pagination: any }>(`/orders/search?${new URLSearchParams(params)}`),

    // Notifications
    getNotifications: () => fetchApi<{ data: Notification[]; unreadCount: number }>('/notifications'),
    markNotificationRead: (id: string) => fetchApi(`/notifications/${id}/read`, { method: 'PATCH' }),
    markAllNotificationsRead: () => fetchApi('/notifications/read-all', { method: 'PATCH' }),

    // Analytics
    getDashboardStats: () => fetchApi<{ data: DashboardStats }>('/analytics/dashboard'),
    getSalesChart: (days?: number) =>
        fetchApi<{ data: SalesChartData[] }>(`/analytics/sales-chart${days ? `?days=${days}` : ''}`),
    getStatusDistribution: () => fetchApi<{ data: StatusDistribution[]; total: number }>('/analytics/status-distribution'),
    getTopCustomers: (limit?: number) =>
        fetchApi<{ data: TopCustomer[] }>(`/analytics/top-customers${limit ? `?limit=${limit}` : ''}`),
    getRecentActivity: (limit?: number) =>
        fetchApi<{ data: AuditLog[] }>(`/analytics/recent-activity${limit ? `?limit=${limit}` : ''}`),

    // Audit Logs
    getAuditLogs: (params?: Record<string, string>) =>
        fetchApi<{ data: AuditLog[]; pagination: any }>(`/audit-logs${params ? `?${new URLSearchParams(params)}` : ''}`),
    getOrderTimeline: (orderId: string) => fetchApi<{ data: AuditLog[] }>(`/audit-logs/order/${orderId}`),
    exportAuditLogs: () => `${API_URL}/audit-logs/export`,

    // Email Templates
    getEmailTemplates: () => fetchApi<{ data: EmailTemplate[] }>('/email-templates'),
    getEmailTemplate: (id: string) => fetchApi<{ data: EmailTemplate }>(`/email-templates/${id}`),
    previewEmailTemplate: (id: string, data?: Record<string, string>) =>
        fetchApi<{ data: { subject: string; html: string } }>(`/email-templates/${id}/preview`, {
            method: 'POST',
            body: JSON.stringify(data || {}),
        }),
};
