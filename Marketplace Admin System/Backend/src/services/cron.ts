// ============================================
// CRON JOBS SERVICE - Automation Rules
// ============================================

import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { subHours, subDays } from 'date-fns';
import { OrderStatus, NotificationType } from '../constants/orderStatus';
import { broadcastNotification } from './websocket';

const prisma = new PrismaClient();

/**
 * Check for overdue payments (> 24 hours in AWAITING_PAYMENT)
 */
async function checkOverduePayments(): Promise<number> {
    const overdueOrders = await prisma.order.findMany({
        where: {
            status: OrderStatus.AWAITING_PAYMENT,
            createdAt: { lt: subHours(new Date(), 24) }
        }
    });

    let alertCount = 0;

    for (const order of overdueOrders) {
        const existingNotification = await prisma.notification.findFirst({
            where: {
                orderId: order.id,
                type: NotificationType.PAYMENT_OVERDUE,
                createdAt: { gte: subHours(new Date(), 24) }
            }
        });

        if (!existingNotification) {
            const notification = await prisma.notification.create({
                data: {
                    type: NotificationType.PAYMENT_OVERDUE,
                    title: `⚠️ Payment Overdue: ${order.orderNumber}`,
                    message: `Order awaiting payment for >24 hours. Customer: ${order.customerName}, Amount: $${order.totalAmount}`,
                    orderId: order.id
                }
            });

            broadcastNotification({
                id: notification.id,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                orderId: order.id,
                createdAt: notification.createdAt.toISOString()
            });

            alertCount++;
            console.log(`🚨 ALERT: Order ${order.orderNumber} - Payment Overdue`);
        }
    }

    return alertCount;
}

/**
 * Check for delayed shipments (> 3 days in SHIPPED)
 */
async function checkDelayedShipments(): Promise<number> {
    const delayedOrders = await prisma.order.findMany({
        where: {
            status: OrderStatus.SHIPPED,
            updatedAt: { lt: subDays(new Date(), 3) }
        }
    });

    let alertCount = 0;

    for (const order of delayedOrders) {
        const existingNotification = await prisma.notification.findFirst({
            where: {
                orderId: order.id,
                type: NotificationType.SHIPMENT_DELAYED,
                createdAt: { gte: subDays(new Date(), 1) }
            }
        });

        if (!existingNotification) {
            const notification = await prisma.notification.create({
                data: {
                    type: NotificationType.SHIPMENT_DELAYED,
                    title: `🚚 Shipment Delayed: ${order.orderNumber}`,
                    message: `Order in shipping for >3 days. Customer: ${order.customerName}`,
                    orderId: order.id
                }
            });

            broadcastNotification({
                id: notification.id,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                orderId: order.id,
                createdAt: notification.createdAt.toISOString()
            });

            alertCount++;
            console.log(`🚨 ALERT: Order ${order.orderNumber} - Shipment Delayed`);
        }
    }

    return alertCount;
}

/**
 * Run all automation checks
 */
export async function runAutomationChecks(): Promise<void> {
    console.log('\n⏰ Running automation checks...', new Date().toISOString());

    try {
        const [overdueCount, delayedCount] = await Promise.all([
            checkOverduePayments(),
            checkDelayedShipments()
        ]);

        console.log(`✅ Automation check completed. New alerts: ${overdueCount} overdue payments, ${delayedCount} delayed shipments.`);
    } catch (error) {
        console.error('❌ Automation check failed:', error);
    }
}

/**
 * Initialize cron jobs
 */
export function initCronJobs(): void {
    // Run every minute for testing (in production: every hour)
    cron.schedule('* * * * *', runAutomationChecks);
    console.log('⏰ Cron jobs initialized - running every minute');
}
