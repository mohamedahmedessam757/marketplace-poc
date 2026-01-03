/**
 * Prisma Seed Script
 * Creates sample orders with various statuses for testing
 */

import { PrismaClient } from '@prisma/client';
import { subHours, subDays } from 'date-fns';

const prisma = new PrismaClient();

// Order Status Constants
const OrderStatus = {
    AWAITING_PAYMENT: 'AWAITING_PAYMENT',
    PREPARATION: 'PREPARATION',
    SHIPPED: 'SHIPPED',
    DELIVERED: 'DELIVERED',
    COMPLETED: 'COMPLETED',
    RETURNED: 'RETURNED',
    DISPUTED: 'DISPUTED',
    CANCELLED: 'CANCELLED'
} as const;

const NotificationType = {
    PAYMENT_OVERDUE: 'PAYMENT_OVERDUE',
    SHIPMENT_DELAYED: 'SHIPMENT_DELAYED',
    STATUS_CHANGE: 'STATUS_CHANGE',
    SYSTEM_ALERT: 'SYSTEM_ALERT'
} as const;

async function main() {
    console.log('🌱 Starting database seed...');

    // Clear existing data
    await prisma.notification.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.order.deleteMany();

    console.log('🗑️ Cleared existing data');

    // Create sample orders with different statuses and dates
    const ordersData = [
        // Recent orders - normal flow
        {
            orderNumber: 'ORD-2026-001',
            customerName: 'أحمد محمد',
            customerEmail: 'ahmed@example.com',
            totalAmount: 299.99,
            status: OrderStatus.AWAITING_PAYMENT,
            createdAt: new Date()
        },
        {
            orderNumber: 'ORD-2026-002',
            customerName: 'سارة علي',
            customerEmail: 'sara@example.com',
            totalAmount: 549.50,
            status: OrderStatus.PREPARATION,
            createdAt: subHours(new Date(), 2)
        },
        {
            orderNumber: 'ORD-2026-003',
            customerName: 'محمود خالد',
            customerEmail: 'mahmoud@example.com',
            totalAmount: 125.00,
            status: OrderStatus.SHIPPED,
            createdAt: subDays(new Date(), 1),
            updatedAt: subHours(new Date(), 6)
        },
        {
            orderNumber: 'ORD-2026-004',
            customerName: 'فاطمة يوسف',
            customerEmail: 'fatma@example.com',
            totalAmount: 899.99,
            status: OrderStatus.DELIVERED,
            createdAt: subDays(new Date(), 3)
        },
        {
            orderNumber: 'ORD-2026-005',
            customerName: 'عمر حسن',
            customerEmail: 'omar@example.com',
            totalAmount: 450.00,
            status: OrderStatus.COMPLETED,
            createdAt: subDays(new Date(), 7)
        },

        // Orders that should trigger automation alerts
        {
            orderNumber: 'ORD-2026-006',
            customerName: 'ليلى إبراهيم',
            customerEmail: 'layla@example.com',
            totalAmount: 175.25,
            status: OrderStatus.AWAITING_PAYMENT,
            createdAt: subHours(new Date(), 30) // > 24 hours - should trigger alert
        },
        {
            orderNumber: 'ORD-2026-007',
            customerName: 'يوسف أحمد',
            customerEmail: 'yousef@example.com',
            totalAmount: 650.00,
            status: OrderStatus.SHIPPED,
            createdAt: subDays(new Date(), 5),
            updatedAt: subDays(new Date(), 4) // > 3 days shipped - should trigger alert
        },

        // End state orders
        {
            orderNumber: 'ORD-2026-008',
            customerName: 'نور الدين',
            customerEmail: 'nour@example.com',
            totalAmount: 320.00,
            status: OrderStatus.CANCELLED,
            createdAt: subDays(new Date(), 2)
        },
        {
            orderNumber: 'ORD-2026-009',
            customerName: 'هند سعيد',
            customerEmail: 'hend@example.com',
            totalAmount: 780.00,
            status: OrderStatus.RETURNED,
            createdAt: subDays(new Date(), 4)
        },
        {
            orderNumber: 'ORD-2026-010',
            customerName: 'كريم عبدالله',
            customerEmail: 'karim@example.com',
            totalAmount: 1250.00,
            status: OrderStatus.DISPUTED,
            createdAt: subDays(new Date(), 3)
        }
    ];

    // Create orders
    for (const orderData of ordersData) {
        const order = await prisma.order.create({
            data: orderData
        });

        // Create initial audit log for each order
        await prisma.auditLog.create({
            data: {
                orderId: order.id,
                oldStatus: 'NEW',
                newStatus: order.status,
                changedBy: 'SYSTEM',
                reason: 'Order created (seed data)'
            }
        });

        // Add some status transition history for completed/returned orders
        if (order.status === OrderStatus.COMPLETED ||
            order.status === OrderStatus.RETURNED ||
            order.status === OrderStatus.DELIVERED) {

            const transitions = [
                { oldStatus: OrderStatus.AWAITING_PAYMENT, newStatus: OrderStatus.PREPARATION, by: 'CUSTOMER' },
                { oldStatus: OrderStatus.PREPARATION, newStatus: OrderStatus.SHIPPED, by: 'ADMIN' },
                { oldStatus: OrderStatus.SHIPPED, newStatus: OrderStatus.DELIVERED, by: 'SYSTEM' }
            ];

            for (const t of transitions) {
                await prisma.auditLog.create({
                    data: {
                        orderId: order.id,
                        oldStatus: t.oldStatus,
                        newStatus: t.newStatus,
                        changedBy: t.by,
                        reason: `Transition from ${t.oldStatus} to ${t.newStatus}`
                    }
                });
            }
        }

        console.log(`✅ Created order: ${order.orderNumber} - ${order.status}`);
    }

    // Create some sample notifications
    const order6 = await prisma.order.findFirst({ where: { orderNumber: 'ORD-2026-006' } });
    const order7 = await prisma.order.findFirst({ where: { orderNumber: 'ORD-2026-007' } });

    const notifications = [
        {
            type: NotificationType.SYSTEM_ALERT,
            title: '🎉 System Started',
            message: 'Marketplace Admin System is now online and monitoring orders.',
            isRead: true
        },
        {
            type: NotificationType.PAYMENT_OVERDUE,
            title: '⚠️ Payment Overdue: ORD-2026-006',
            message: 'Order ORD-2026-006 has been awaiting payment for more than 24 hours.',
            orderId: order6?.id
        },
        {
            type: NotificationType.SHIPMENT_DELAYED,
            title: '🚚 Shipment Delayed: ORD-2026-007',
            message: 'Order ORD-2026-007 has been in shipping for more than 3 days.',
            orderId: order7?.id
        }
    ];

    for (const notif of notifications) {
        await prisma.notification.create({ data: notif });
    }

    console.log('\n✅ Seed completed successfully!');
    console.log(`   📦 Created ${ordersData.length} orders`);
    console.log(`   📝 Created audit logs for each order`);
    console.log(`   🔔 Created ${notifications.length} notifications`);
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
