// ============================================
// ANALYTICS ROUTES - Dashboard Charts & Stats
// ============================================

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { subDays, format, startOfDay, endOfDay } from 'date-fns';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /analytics/dashboard
 * Main dashboard statistics
 */
router.get('/dashboard', async (_req: Request, res: Response) => {
    try {
        const [
            totalOrders,
            ordersByStatus,
            totalRevenue,
            todayOrders,
            unreadNotifications,
            totalAuditLogs
        ] = await Promise.all([
            prisma.order.count(),
            prisma.order.groupBy({
                by: ['status'],
                _count: true
            }),
            prisma.order.aggregate({
                _sum: { totalAmount: true }
            }),
            prisma.order.count({
                where: {
                    createdAt: {
                        gte: startOfDay(new Date()),
                        lte: endOfDay(new Date())
                    }
                }
            }),
            prisma.notification.count({ where: { isRead: false } }),
            prisma.auditLog.count()
        ]);

        const statusCounts = ordersByStatus.reduce((acc, item) => {
            acc[item.status] = item._count;
            return acc;
        }, {} as Record<string, number>);

        res.json({
            success: true,
            data: {
                totalOrders,
                todayOrders,
                totalRevenue: totalRevenue._sum.totalAmount || 0,
                statusCounts,
                unreadNotifications,
                totalAuditLogs
            }
        });
    } catch (error) {
        console.error('❌ Error fetching dashboard stats:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch dashboard stats' });
    }
});

/**
 * GET /analytics/sales-chart
 * Sales data for line chart (last 30 days)
 */
router.get('/sales-chart', async (req: Request, res: Response) => {
    try {
        const days = parseInt(req.query.days as string) || 30;
        const startDate = subDays(new Date(), days);

        const orders = await prisma.order.findMany({
            where: {
                createdAt: { gte: startDate },
                status: {
                    notIn: ['CANCELLED', 'RETURNED', 'DISPUTED']
                }
            },
            select: {
                totalAmount: true,
                createdAt: true
            },
            orderBy: { createdAt: 'asc' }
        });

        // Group by date
        const salesByDate: Record<string, { date: string; revenue: number; orders: number }> = {};

        for (let i = 0; i < days; i++) {
            const date = format(subDays(new Date(), days - 1 - i), 'yyyy-MM-dd');
            salesByDate[date] = { date, revenue: 0, orders: 0 };
        }

        orders.forEach(order => {
            const date = format(new Date(order.createdAt), 'yyyy-MM-dd');
            if (salesByDate[date]) {
                salesByDate[date].revenue += order.totalAmount;
                salesByDate[date].orders += 1;
            }
        });

        res.json({
            success: true,
            data: Object.values(salesByDate)
        });
    } catch (error) {
        console.error('❌ Error fetching sales chart:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch sales chart' });
    }
});

/**
 * GET /analytics/status-distribution
 * Order status distribution for pie chart
 */
router.get('/status-distribution', async (_req: Request, res: Response) => {
    try {
        const distribution = await prisma.order.groupBy({
            by: ['status'],
            _count: true
        });

        const colors: Record<string, string> = {
            AWAITING_PAYMENT: '#f59e0b',
            PREPARATION: '#8b5cf6',
            SHIPPED: '#3b82f6',
            DELIVERED: '#10b981',
            COMPLETED: '#22c55e',
            RETURNED: '#f97316',
            DISPUTED: '#ef4444',
            CANCELLED: '#6b7280'
        };

        const data = distribution.map(item => ({
            status: item.status,
            count: item._count,
            color: colors[item.status] || '#6b7280',
            percentage: 0
        }));

        const total = data.reduce((sum, item) => sum + item.count, 0);
        data.forEach(item => {
            item.percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
        });

        res.json({
            success: true,
            data,
            total
        });
    } catch (error) {
        console.error('❌ Error fetching status distribution:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch status distribution' });
    }
});

/**
 * GET /analytics/top-customers
 * Top customers by order value
 */
router.get('/top-customers', async (req: Request, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string) || 5;

        const orders = await prisma.order.findMany({
            where: {
                status: { notIn: ['CANCELLED', 'RETURNED', 'DISPUTED'] }
            },
            select: {
                customerName: true,
                customerEmail: true,
                totalAmount: true
            }
        });

        // Aggregate by customer
        const customerStats: Record<string, {
            name: string;
            email: string;
            totalSpent: number;
            orderCount: number
        }> = {};

        orders.forEach(order => {
            const key = order.customerEmail;
            if (!customerStats[key]) {
                customerStats[key] = {
                    name: order.customerName,
                    email: order.customerEmail,
                    totalSpent: 0,
                    orderCount: 0
                };
            }
            customerStats[key].totalSpent += order.totalAmount;
            customerStats[key].orderCount += 1;
        });

        const topCustomers = Object.values(customerStats)
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .slice(0, limit);

        res.json({
            success: true,
            data: topCustomers
        });
    } catch (error) {
        console.error('❌ Error fetching top customers:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch top customers' });
    }
});

/**
 * GET /analytics/recent-activity
 * Recent audit log activity
 */
router.get('/recent-activity', async (req: Request, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string) || 10;

        const activities = await prisma.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
                order: {
                    select: { orderNumber: true, customerName: true }
                }
            }
        });

        res.json({
            success: true,
            data: activities
        });
    } catch (error) {
        console.error('❌ Error fetching recent activity:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch recent activity' });
    }
});

export default router;
