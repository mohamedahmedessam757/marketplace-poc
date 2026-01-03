# 🛒 Marketplace Admin System POC

A professional Proof of Concept for a Marketplace Admin System demonstrating:
- **FSM (Finite State Machine)** for Order Status Management
- **Cron Jobs** for Automated Alerts
- **Real-time WebSocket** Notifications
- **Audit Log** with Full Traceability
- **Interactive Charts** & Analytics

## 🚀 Features

### Order Management
- 8 Order States with controlled transitions
- FSM validation for all status changes
- Complete audit trail

### Automation
- 24-hour payment overdue alerts
- 3-day shipping delay notifications
- Real-time WebSocket updates

### Admin Dashboard
- Interactive Sales Charts
- Order Status Distribution
- Top Customers Analytics
- Email Template Preview

## 🛠️ Tech Stack

**Backend:**
- Node.js + Express + TypeScript
- Prisma ORM + SQLite
- WebSocket (ws)
- Node-Cron

**Frontend:**
- React + Vite + TypeScript
- Lucide React Icons
- Custom CSS

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/marketplace-admin-system.git
cd marketplace-admin-system

# Install Backend
cd Backend
npm install
npx prisma generate
npx prisma db push
npx prisma db seed
npm run dev

# Install Frontend (new terminal)
cd Frontend
npm install
npm run dev
```

## 🔗 URLs

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001
- **WebSocket:** ws://localhost:3001/ws

## 📋 API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/orders` | List all orders |
| `POST /api/orders` | Create new order |
| `PATCH /api/orders/:id/status` | Update order status (FSM) |
| `GET /api/analytics/dashboard` | Dashboard statistics |
| `GET /api/audit-logs` | Audit log entries |
| `GET /api/notifications` | System notifications |

## 🎯 Order Status Flow

```
AWAITING_PAYMENT → PREPARATION → SHIPPED → DELIVERED → COMPLETED
                        ↓             ↓           ↓
                   CANCELLED     RETURNED     DISPUTED
```

## 📸 Screenshots

*Screenshots will be added after deployment*

## 👤 Author

Mohamed Attar

## 📄 License

MIT
