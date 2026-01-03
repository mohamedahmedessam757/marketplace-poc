/**
 * ============================================
 * MARKETPLACE ADMIN SYSTEM - FRONTEND v2.0
 * ============================================
 * 
 * Professional Admin Dashboard with:
 * - Real-time WebSocket Notifications
 * - Interactive Charts (Sales & Status)
 * - Order Timeline Visualization
 * - Advanced Search & Filters
 * - Email Template Preview
 */

import { useState, useEffect, useCallback } from 'react';
import {
    api,
    type Order,
    type AuditLog,
    type Notification,
    type DashboardStats,
    type SalesChartData,
    type StatusDistribution,
    type TopCustomer
} from './services/api';
import { wsService } from './services/websocket';
import {
    SalesChart,
    PieChart,
    OrderTimeline,
    SearchFilters,
    EmailTemplatesList,
    EmailPreview,
    type SearchFiltersType
} from './components';
import {
    LayoutDashboard,
    Package,
    ClipboardList,
    Bell,
    Mail,
    ShoppingCart,
    DollarSign,
    Clock,
    AlertTriangle,
    TrendingUp,
    PieChart as PieChartIcon,
    Trophy,
    MapPin,
    Download,
    Plus,
    Check,
    AlertCircle,
    Truck,
    RefreshCw,
    Megaphone,
    X
} from 'lucide-react';
import './App.css';

// ============================================
// STATUS HELPERS
// ============================================
const getStatusClass = (status: string): string => status.toLowerCase().replace(/_/g, '-');

const NotificationIcon = ({ type }: { type: string }) => {
    switch (type) {
        case 'PAYMENT_OVERDUE': return <AlertTriangle size={20} />;
        case 'SHIPMENT_DELAYED': return <Truck size={20} />;
        case 'STATUS_CHANGE': return <RefreshCw size={20} />;
        case 'NEW_ORDER': return <Plus size={20} />;
        default: return <Megaphone size={20} />;
    }
};

// ============================================
// MAIN APP COMPONENT
// ============================================
function App() {
    // Navigation state
    const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'audit' | 'notifications' | 'emails'>('dashboard');

    // Data state
    const [orders, setOrders] = useState<Order[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [salesData, setSalesData] = useState<SalesChartData[]>([]);
    const [statusDistribution, setStatusDistribution] = useState<StatusDistribution[]>([]);
    const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);

    // UI state
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showTimelineModal, setShowTimelineModal] = useState(false);
    const [orderTimeline, setOrderTimeline] = useState<AuditLog[]>([]);
    const [wsConnected, setWsConnected] = useState(false);
    const [emailPreviewId, setEmailPreviewId] = useState<string | null>(null);

    // ============================================
    // DATA FETCHING
    // ============================================
    const fetchData = useCallback(async () => {
        try {
            const [ordersRes, auditRes, notifRes, statsRes, salesRes, statusRes, customersRes] = await Promise.all([
                api.getOrders(),
                api.getAuditLogs(),
                api.getNotifications(),
                api.getDashboardStats(),
                api.getSalesChart(30),
                api.getStatusDistribution(),
                api.getTopCustomers(5)
            ]);

            setOrders(ordersRes.data);
            setAuditLogs(auditRes.data);
            setNotifications(notifRes.data);
            setStats(statsRes.data);
            setSalesData(salesRes.data);
            setStatusDistribution(statusRes.data);
            setTopCustomers(customersRes.data);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // ============================================
    // WEBSOCKET SETUP
    // ============================================
    useEffect(() => {
        // Request notification permission
        wsService.requestNotificationPermission();

        // Connect to WebSocket
        wsService.connect();

        // Listen for events
        const unsubConnected = wsService.on('connected', () => setWsConnected(true));
        const unsubDisconnected = wsService.on('disconnected', () => setWsConnected(false));
        const unsubNotification = wsService.on('notification', (data) => {
            setNotifications(prev => [data, ...prev]);
            if (stats) {
                setStats({ ...stats, unreadNotifications: stats.unreadNotifications + 1 });
            }
        });
        const unsubOrderUpdate = wsService.on('orderUpdate', () => fetchData());

        return () => {
            unsubConnected();
            unsubDisconnected();
            unsubNotification();
            unsubOrderUpdate();
            wsService.disconnect();
        };
    }, [fetchData, stats]);

    // Initial data fetch
    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 60000); // Refresh every minute
        return () => clearInterval(interval);
    }, [fetchData]);

    // ============================================
    // HANDLERS
    // ============================================
    const handleStatusChange = async (orderId: string, newStatus: string) => {
        try {
            const result = await api.updateOrderStatus(orderId, newStatus);
            if (result.success) {
                await fetchData();
                setShowStatusModal(false);
                setSelectedOrder(null);
            } else {
                alert(result.message || result.error);
            }
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    const handleCreateOrder = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);

        try {
            await api.createOrder({
                customerName: formData.get('customerName') as string,
                customerEmail: formData.get('customerEmail') as string,
                totalAmount: parseFloat(formData.get('totalAmount') as string),
            });
            await fetchData();
            setShowCreateModal(false);
            form.reset();
        } catch (error) {
            console.error('Failed to create order:', error);
        }
    };

    const handleViewTimeline = async (order: Order) => {
        try {
            const res = await api.getOrderTimeline(order.id);
            setOrderTimeline(res.data);
            setSelectedOrder(order);
            setShowTimelineModal(true);
        } catch (error) {
            console.error('Failed to fetch timeline:', error);
        }
    };

    const handleSearch = async (filters: SearchFiltersType) => {
        try {
            setLoading(true);
            const params: Record<string, string> = {};
            if (filters.query) params.query = filters.query;
            if (filters.status !== 'ALL') params.status = filters.status;
            if (filters.startDate) params.startDate = filters.startDate;
            if (filters.endDate) params.endDate = filters.endDate;
            if (filters.minAmount) params.minAmount = filters.minAmount;
            if (filters.maxAmount) params.maxAmount = filters.maxAmount;

            const res = await api.searchOrders(params);
            setOrders(res.data);
        } catch (error) {
            console.error('Failed to search:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExportCSV = () => {
        window.open(api.exportAuditLogs(), '_blank');
    };

    // Loading screen
    if (loading && orders.length === 0) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner"></div>
                <p>Loading Dashboard...</p>
            </div>
        );
    }

    return (
        <div className="app-container">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <ShoppingCart size={28} className="logo-icon-svg" />
                    <h1>Admin System</h1>
                </div>

                <nav className="sidebar-nav">
                    <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
                        <LayoutDashboard size={20} /><span>Dashboard</span>
                    </div>
                    <div className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
                        <Package size={20} /><span>Orders</span>
                    </div>
                    <div className={`nav-item ${activeTab === 'audit' ? 'active' : ''}`} onClick={() => setActiveTab('audit')}>
                        <ClipboardList size={20} /><span>Audit Log</span>
                    </div>
                    <div className={`nav-item ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>
                        <Bell size={20} /><span>Notifications</span>
                        {stats && stats.unreadNotifications > 0 && <span className="badge">{stats.unreadNotifications}</span>}
                    </div>
                    <div className={`nav-item ${activeTab === 'emails' ? 'active' : ''}`} onClick={() => setActiveTab('emails')}>
                        <Mail size={20} /><span>Email Templates</span>
                    </div>
                </nav>

                <div className="sidebar-footer">
                    <div className={`server-status ${wsConnected ? 'connected' : ''}`}>
                        <span className={`status-dot ${wsConnected ? 'active' : ''}`}></span>
                        <span>{wsConnected ? 'Live Connected' : 'Connecting...'}</span>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">

                {/* ============== DASHBOARD TAB ============== */}
                {activeTab === 'dashboard' && (
                    <>
                        {/* Stats Cards */}
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon primary"><Package size={24} /></div>
                                <div className="stat-content">
                                    <h3>{stats?.totalOrders || 0}</h3>
                                    <p>Total Orders</p>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon success"><DollarSign size={24} /></div>
                                <div className="stat-content">
                                    <h3>${(stats?.totalRevenue || 0).toLocaleString()}</h3>
                                    <p>Total Revenue</p>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon warning"><Clock size={24} /></div>
                                <div className="stat-content">
                                    <h3>{stats?.statusCounts?.AWAITING_PAYMENT || 0}</h3>
                                    <p>Awaiting Payment</p>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon danger"><AlertCircle size={24} /></div>
                                <div className="stat-content">
                                    <h3>{stats?.unreadNotifications || 0}</h3>
                                    <p>Alerts</p>
                                </div>
                            </div>
                        </div>

                        {/* Charts Row */}
                        <div className="charts-row">
                            <div className="card chart-card sales-chart-card">
                                <div className="card-header">
                                    <h3 className="card-title"><TrendingUp size={20} /> Sales Performance (30 Days)</h3>
                                </div>
                                <SalesChart data={salesData} height={280} />
                            </div>

                            <div className="card chart-card pie-chart-card">
                                <div className="card-header">
                                    <h3 className="card-title"><PieChartIcon size={20} /> Order Status Distribution</h3>
                                </div>
                                <PieChart data={statusDistribution} size={200} />
                            </div>
                        </div>

                        {/* Top Customers */}
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title"><Trophy size={20} /> Top Customers</h3>
                            </div>
                            <table>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Customer</th>
                                        <th>Orders</th>
                                        <th>Total Spent</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topCustomers.map((customer, i) => (
                                        <tr key={customer.email}>
                                            <td><span className="rank-badge">{i + 1}</span></td>
                                            <td>
                                                <strong>{customer.name}</strong>
                                                <br /><small className="text-muted">{customer.email}</small>
                                            </td>
                                            <td>{customer.orderCount}</td>
                                            <td className="text-success">${customer.totalSpent.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* ============== ORDERS TAB ============== */}
                {activeTab === 'orders' && (
                    <>
                        <SearchFilters onSearch={handleSearch} />

                        <div className="table-container">
                            <div className="table-header">
                                <h2 className="table-title"><Package size={22} /> Orders Management</h2>
                                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                                    <Plus size={16} /> New Order
                                </button>
                            </div>

                            <table>
                                <thead>
                                    <tr>
                                        <th>Order #</th>
                                        <th>Customer</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                        <th>Created</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map((order) => (
                                        <tr key={order.id}>
                                            <td><strong>{order.orderNumber}</strong></td>
                                            <td>
                                                <div>{order.customerName}</div>
                                                <small className="text-muted">{order.customerEmail}</small>
                                            </td>
                                            <td>${order.totalAmount.toFixed(2)}</td>
                                            <td>
                                                <span className={`status-badge ${getStatusClass(order.status)}`}>
                                                    {order.statusLabel}
                                                </span>
                                            </td>
                                            <td><small className="text-muted">{order.createdAgo}</small></td>
                                            <td>
                                                <div className="btn-group">
                                                    <button
                                                        className="btn btn-secondary btn-sm"
                                                        onClick={() => handleViewTimeline(order)}
                                                    >
                                                        <MapPin size={14} /> Timeline
                                                    </button>
                                                    {order.allowedTransitions.length > 0 && (
                                                        <button
                                                            className="btn btn-primary btn-sm"
                                                            onClick={() => { setSelectedOrder(order); setShowStatusModal(true); }}
                                                        >
                                                            Change Status
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* ============== AUDIT LOG TAB ============== */}
                {activeTab === 'audit' && (
                    <div className="card">
                        <div className="card-header">
                            <h2 className="card-title"><ClipboardList size={22} /> Audit Log</h2>
                            <button className="btn btn-secondary" onClick={handleExportCSV}>
                                <Download size={16} /> Export CSV
                            </button>
                        </div>

                        <div className="audit-log">
                            {auditLogs.map((log, index) => (
                                <div key={log.id} className="audit-item">
                                    <div className="audit-timeline">
                                        <div className="audit-dot"></div>
                                        {index < auditLogs.length - 1 && <div className="audit-line"></div>}
                                    </div>
                                    <div className="audit-content">
                                        <div className="audit-transition">
                                            <span className={`status-badge ${getStatusClass(log.oldStatus)}`}>{log.oldStatus}</span>
                                            <span className="audit-arrow">→</span>
                                            <span className={`status-badge ${getStatusClass(log.newStatus)}`}>{log.newStatus}</span>
                                        </div>
                                        <div className="audit-meta">
                                            <strong>{log.order?.orderNumber || 'Order'}</strong> • Changed by <strong>{log.changedBy}</strong> • {new Date(log.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ============== NOTIFICATIONS TAB ============== */}
                {activeTab === 'notifications' && (
                    <div className="card">
                        <div className="card-header">
                            <h2 className="card-title"><Bell size={22} /> Notifications</h2>
                            <button
                                className="btn btn-secondary"
                                onClick={async () => {
                                    await api.markAllNotificationsRead();
                                    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
                                    if (stats) setStats({ ...stats, unreadNotifications: 0 });
                                }}
                            >
                                <Check size={16} /> Mark All Read
                            </button>
                        </div>

                        <div className="notifications-panel">
                            {notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    className={`notification-item ${!notif.isRead ? 'unread' : ''}`}
                                    onClick={async () => {
                                        if (!notif.isRead) {
                                            await api.markNotificationRead(notif.id);
                                            setNotifications(notifications.map(n =>
                                                n.id === notif.id ? { ...n, isRead: true } : n
                                            ));
                                            if (stats) setStats({ ...stats, unreadNotifications: Math.max(0, stats.unreadNotifications - 1) });
                                        }
                                    }}
                                >
                                    <div className={`notification-icon ${notif.type.includes('OVERDUE') ? 'warning' : 'info'}`}>
                                        <NotificationIcon type={notif.type} />
                                    </div>
                                    <div className="notification-content">
                                        <h4>{notif.title}</h4>
                                        <p>{notif.message}</p>
                                        <span className="notification-time">{new Date(notif.createdAt).toLocaleString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ============== EMAIL TEMPLATES TAB ============== */}
                {activeTab === 'emails' && (
                    <div className="card">
                        <div className="card-header">
                            <h2 className="card-title"><Mail size={22} /> Email Templates</h2>
                        </div>
                        <EmailTemplatesList onPreview={setEmailPreviewId} />
                    </div>
                )}
            </main>

            {/* ============== MODALS ============== */}

            {/* Create Order Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title"><Plus size={20} /> Create New Order</h3>
                            <button className="modal-close" onClick={() => setShowCreateModal(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleCreateOrder}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Customer Name</label>
                                    <input type="text" name="customerName" className="form-input" required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Customer Email</label>
                                    <input type="email" name="customerEmail" className="form-input" required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Total Amount ($)</label>
                                    <input type="number" name="totalAmount" className="form-input" step="0.01" min="0" required />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Create Order</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Status Change Modal */}
            {showStatusModal && selectedOrder && (
                <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Change Order Status</h3>
                            <button className="modal-close" onClick={() => setShowStatusModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <p><strong>Order:</strong> {selectedOrder.orderNumber}</p>
                            <p><strong>Current:</strong> <span className={`status-badge ${getStatusClass(selectedOrder.status)}`}>{selectedOrder.statusLabel}</span></p>
                            <div className="form-group">
                                <label className="form-label">Select New Status</label>
                                <div className="status-buttons">
                                    {selectedOrder.allowedTransitions.map((t) => (
                                        <button
                                            key={t.status}
                                            className={`btn btn-secondary status-btn`}
                                            onClick={() => handleStatusChange(selectedOrder.id, t.status)}
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Timeline Modal */}
            {showTimelineModal && selectedOrder && (
                <div className="modal-overlay" onClick={() => setShowTimelineModal(false)}>
                    <div className="modal large" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Order Timeline</h3>
                            <button className="modal-close" onClick={() => setShowTimelineModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <OrderTimeline timeline={orderTimeline} orderNumber={selectedOrder.orderNumber} />
                        </div>
                    </div>
                </div>
            )}

            {/* Email Preview Modal */}
            {emailPreviewId && (
                <EmailPreview templateId={emailPreviewId} onClose={() => setEmailPreviewId(null)} />
            )}
        </div>
    );
}

export default App;
