// ============================================
// AUDIT LOGS ROUTES
// ============================================

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /audit-logs
 * List all audit logs
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const { orderId, changedBy, page = '1', limit = '50' } = req.query;

        const where: any = {};
        if (orderId) where.orderId = orderId;
        if (changedBy) where.changedBy = changedBy;

        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
        const take = parseInt(limit as string);

        const [auditLogs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take,
                include: {
                    order: {
                        select: { orderNumber: true, customerName: true }
                    }
                }
            }),
            prisma.auditLog.count({ where })
        ]);

        res.json({
            success: true,
            count: auditLogs.length,
            data: auditLogs,
            pagination: {
                page: parseInt(page as string),
                limit: parseInt(limit as string),
                total,
                pages: Math.ceil(total / parseInt(limit as string))
            }
        });
    } catch (error) {
        console.error('❌ Error fetching audit logs:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch audit logs' });
    }
});

/**
 * GET /audit-logs/order/:orderId
 * Get audit logs for specific order (timeline)
 */
router.get('/order/:orderId', async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;

        const auditLogs = await prisma.auditLog.findMany({
            where: { orderId },
            orderBy: { createdAt: 'asc' },
            include: {
                order: {
                    select: { orderNumber: true, customerName: true, customerEmail: true }
                }
            }
        });

        // Build timeline
        const timeline = auditLogs.map((log, index) => ({
            step: index + 1,
            ...log,
            isFirst: index === 0,
            isLast: index === auditLogs.length - 1
        }));

        res.json({
            success: true,
            data: timeline
        });
    } catch (error) {
        console.error('❌ Error fetching order timeline:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch order timeline' });
    }
});

/**
 * GET /audit-logs/export
 * Export audit logs as CSV
 */
router.get('/export', async (req: Request, res: Response) => {
    try {
        const { startDate, endDate } = req.query;

        const where: any = {};
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate as string);
            if (endDate) where.createdAt.lte = new Date(endDate as string);
        }

        const auditLogs = await prisma.auditLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                order: {
                    select: { orderNumber: true, customerName: true }
                }
            }
        });

        // Generate CSV
        const headers = ['Date', 'Order Number', 'Customer', 'Old Status', 'New Status', 'Changed By', 'Reason'];
        const rows = auditLogs.map(log => [
            new Date(log.createdAt).toISOString(),
            log.order?.orderNumber || 'N/A',
            log.order?.customerName || 'N/A',
            log.oldStatus,
            log.newStatus,
            log.changedBy,
            log.reason || ''
        ]);

        const csv = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
        res.send(csv);
    } catch (error) {
        console.error('❌ Error exporting audit logs:', error);
        res.status(500).json({ success: false, error: 'Failed to export audit logs' });
    }
});

export default router;
