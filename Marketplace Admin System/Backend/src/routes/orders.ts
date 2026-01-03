// ============================================
// ORDERS ROUTES
// ============================================

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import {
    OrderStatus,
    NotificationType,
    isValidTransition,
    getAllowedTransitions,
    getStatusLabel
} from '../constants/orderStatus';
import { generateOrderNumber, enrichOrder } from '../utils/orderUtils';
import { broadcastNotification } from '../services/websocket';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /orders
 * List all orders with audit logs
 */
router.get('/', async (_req: Request, res: Response) => {
    try {
        const orders = await prisma.order.findMany({
            include: {
                auditLogs: {
                    orderBy: { createdAt: 'desc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const enrichedOrders = orders.map(enrichOrder);

        res.json({
            success: true,
            count: enrichedOrders.length,
            data: enrichedOrders
        });
    } catch (error) {
        console.error('❌ Error fetching orders:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch orders' });
    }
});

/**
 * GET /orders/search
 * Search and filter orders
 */
router.get('/search', async (req: Request, res: Response) => {
    try {
        const {
            query,
            status,
            startDate,
            endDate,
            minAmount,
            maxAmount,
            page = '1',
            limit = '10'
        } = req.query;

        const where: any = {};

        // Search by order number or customer name/email
        if (query) {
            where.OR = [
                { orderNumber: { contains: query as string } },
                { customerName: { contains: query as string } },
                { customerEmail: { contains: query as string } }
            ];
        }

        // Filter by status
        if (status && status !== 'ALL') {
            where.status = status as string;
        }

        // Filter by date range
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate as string);
            if (endDate) where.createdAt.lte = new Date(endDate as string);
        }

        // Filter by amount range
        if (minAmount || maxAmount) {
            where.totalAmount = {};
            if (minAmount) where.totalAmount.gte = parseFloat(minAmount as string);
            if (maxAmount) where.totalAmount.lte = parseFloat(maxAmount as string);
        }

        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
        const take = parseInt(limit as string);

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                include: { auditLogs: { orderBy: { createdAt: 'desc' } } },
                orderBy: { createdAt: 'desc' },
                skip,
                take
            }),
            prisma.order.count({ where })
        ]);

        res.json({
            success: true,
            data: orders.map(enrichOrder),
            pagination: {
                page: parseInt(page as string),
                limit: parseInt(limit as string),
                total,
                pages: Math.ceil(total / parseInt(limit as string))
            }
        });
    } catch (error) {
        console.error('❌ Error searching orders:', error);
        res.status(500).json({ success: false, error: 'Failed to search orders' });
    }
});

/**
 * GET /orders/:id
 * Get single order with timeline
 */
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                auditLogs: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!order) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }

        res.json({ success: true, data: enrichOrder(order) });
    } catch (error) {
        console.error('❌ Error fetching order:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch order' });
    }
});

/**
 * POST /orders
 * Create new order
 */
router.post('/', async (req: Request, res: Response) => {
    try {
        const { customerName, customerEmail, totalAmount } = req.body;

        if (!customerName || !customerEmail || !totalAmount) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: customerName, customerEmail, totalAmount'
            });
        }

        const order = await prisma.$transaction(async (tx) => {
            const newOrder = await tx.order.create({
                data: {
                    orderNumber: generateOrderNumber(),
                    customerName,
                    customerEmail,
                    totalAmount: parseFloat(totalAmount),
                    status: OrderStatus.AWAITING_PAYMENT
                }
            });

            await tx.auditLog.create({
                data: {
                    orderId: newOrder.id,
                    oldStatus: 'NEW',
                    newStatus: OrderStatus.AWAITING_PAYMENT,
                    changedBy: 'SYSTEM',
                    reason: 'Order created'
                }
            });

            // Create notification for new order
            const notification = await tx.notification.create({
                data: {
                    type: NotificationType.NEW_ORDER,
                    title: `🆕 New Order: ${newOrder.orderNumber}`,
                    message: `New order from ${customerName} - $${totalAmount}`,
                    orderId: newOrder.id
                }
            });

            // Broadcast via WebSocket
            broadcastNotification({
                id: notification.id,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                orderId: newOrder.id,
                createdAt: notification.createdAt.toISOString()
            });

            return newOrder;
        });

        console.log(`✅ New order created: ${order.orderNumber}`);

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: enrichOrder(order)
        });
    } catch (error) {
        console.error('❌ Error creating order:', error);
        res.status(500).json({ success: false, error: 'Failed to create order' });
    }
});

/**
 * PATCH /orders/:id/status
 * Update order status with FSM validation
 */
router.patch('/:id/status', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { newStatus, changedBy = 'ADMIN', reason } = req.body;

        if (!newStatus) {
            return res.status(400).json({
                success: false,
                error: 'Missing required field: newStatus'
            });
        }

        const validStatuses = Object.values(OrderStatus);
        if (!validStatuses.includes(newStatus)) {
            return res.status(400).json({
                success: false,
                error: `Invalid status. Valid statuses: ${validStatuses.join(', ')}`
            });
        }

        const currentOrder = await prisma.order.findUnique({ where: { id } });

        if (!currentOrder) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }

        const oldStatus = currentOrder.status;

        if (!isValidTransition(oldStatus, newStatus)) {
            const allowedNext = getAllowedTransitions(oldStatus);
            return res.status(400).json({
                success: false,
                error: `Invalid transition: ${oldStatus} → ${newStatus}`,
                message: `From '${getStatusLabel(oldStatus)}' you can only transition to: ${allowedNext.map(s => getStatusLabel(s)).join(', ') || 'None (End State)'}`,
                allowedTransitions: allowedNext
            });
        }

        const updatedOrder = await prisma.$transaction(async (tx) => {
            const order = await tx.order.update({
                where: { id },
                data: { status: newStatus }
            });

            await tx.auditLog.create({
                data: {
                    orderId: id,
                    oldStatus,
                    newStatus,
                    changedBy,
                    reason: reason || `Status changed from ${oldStatus} to ${newStatus}`
                }
            });

            const notification = await tx.notification.create({
                data: {
                    type: NotificationType.STATUS_CHANGE,
                    title: `Order ${currentOrder.orderNumber} Updated`,
                    message: `Status: ${getStatusLabel(oldStatus)} → ${getStatusLabel(newStatus)}`,
                    orderId: id
                }
            });

            broadcastNotification({
                id: notification.id,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                orderId: id,
                createdAt: notification.createdAt.toISOString()
            });

            return order;
        });

        console.log(`🔄 Order ${currentOrder.orderNumber}: ${oldStatus} → ${newStatus}`);

        res.json({
            success: true,
            message: 'Order status updated successfully',
            data: {
                order: enrichOrder(updatedOrder),
                transition: {
                    from: { status: oldStatus, label: getStatusLabel(oldStatus) },
                    to: { status: newStatus, label: getStatusLabel(newStatus) },
                    changedBy,
                    timestamp: new Date().toISOString()
                }
            }
        });
    } catch (error) {
        console.error('❌ Error updating order status:', error);
        res.status(500).json({ success: false, error: 'Failed to update order status' });
    }
});

export default router;
