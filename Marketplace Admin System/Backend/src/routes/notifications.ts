// ============================================
// NOTIFICATIONS ROUTES
// ============================================

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /notifications
 * List all notifications
 */
router.get('/', async (_req: Request, res: Response) => {
    try {
        const notifications = await prisma.notification.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        res.json({
            success: true,
            count: notifications.length,
            unreadCount: notifications.filter(n => !n.isRead).length,
            data: notifications
        });
    } catch (error) {
        console.error('❌ Error fetching notifications:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
    }
});

/**
 * PATCH /notifications/:id/read
 * Mark notification as read
 */
router.patch('/:id/read', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const notification = await prisma.notification.update({
            where: { id },
            data: { isRead: true }
        });

        res.json({ success: true, data: notification });
    } catch (error) {
        console.error('❌ Error marking notification as read:', error);
        res.status(500).json({ success: false, error: 'Failed to update notification' });
    }
});

/**
 * PATCH /notifications/read-all
 * Mark all notifications as read
 */
router.patch('/read-all', async (_req: Request, res: Response) => {
    try {
        await prisma.notification.updateMany({
            where: { isRead: false },
            data: { isRead: true }
        });

        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        console.error('❌ Error marking all notifications as read:', error);
        res.status(500).json({ success: false, error: 'Failed to update notifications' });
    }
});

/**
 * DELETE /notifications/:id
 * Delete a notification
 */
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.notification.delete({ where: { id } });

        res.json({ success: true, message: 'Notification deleted' });
    } catch (error) {
        console.error('❌ Error deleting notification:', error);
        res.status(500).json({ success: false, error: 'Failed to delete notification' });
    }
});

export default router;
