// ============================================
// SALES CHART COMPONENT - Line Chart
// ============================================

import { useEffect, useRef } from 'react';
import type { SalesChartData } from '../services/api';

interface SalesChartProps {
    data: SalesChartData[];
    height?: number;
}

export function SalesChart({ data, height = 250 }: SalesChartProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current || data.length === 0) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
        canvas.style.height = `${height}px`;

        // Clear canvas
        ctx.clearRect(0, 0, rect.width, height);

        // Calculate bounds
        const padding = { top: 20, right: 20, bottom: 40, left: 60 };
        const chartWidth = rect.width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        const maxRevenue = Math.max(...data.map(d => d.revenue), 1);
        const minRevenue = 0;

        // Draw grid lines
        ctx.strokeStyle = '#3f3f5a';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= 4; i++) {
            const y = padding.top + (chartHeight / 4) * i;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(rect.width - padding.right, y);
            ctx.stroke();

            // Y-axis labels
            const value = maxRevenue - (maxRevenue / 4) * i;
            ctx.fillStyle = '#a1a1aa';
            ctx.font = '11px Inter, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(`$${Math.round(value)}`, padding.left - 10, y + 4);
        }

        // Draw gradient fill
        const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
        gradient.addColorStop(0, 'rgba(99, 102, 241, 0.3)');
        gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');

        // Draw area
        ctx.beginPath();
        ctx.moveTo(padding.left, height - padding.bottom);

        data.forEach((point, i) => {
            const x = padding.left + (chartWidth / (data.length - 1)) * i;
            const y = padding.top + chartHeight - ((point.revenue - minRevenue) / (maxRevenue - minRevenue)) * chartHeight;

            if (i === 0) {
                ctx.lineTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.lineTo(padding.left + chartWidth, height - padding.bottom);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw line
        ctx.beginPath();
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';

        data.forEach((point, i) => {
            const x = padding.left + (chartWidth / (data.length - 1)) * i;
            const y = padding.top + chartHeight - ((point.revenue - minRevenue) / (maxRevenue - minRevenue)) * chartHeight;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();

        // Draw points
        data.forEach((point, i) => {
            const x = padding.left + (chartWidth / (data.length - 1)) * i;
            const y = padding.top + chartHeight - ((point.revenue - minRevenue) / (maxRevenue - minRevenue)) * chartHeight;

            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#1e1e32';
            ctx.fill();
            ctx.strokeStyle = '#6366f1';
            ctx.lineWidth = 2;
            ctx.stroke();
        });

        // Draw X-axis labels (every 5 days)
        ctx.fillStyle = '#a1a1aa';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        data.forEach((point, i) => {
            if (i % 5 === 0 || i === data.length - 1) {
                const x = padding.left + (chartWidth / (data.length - 1)) * i;
                const date = new Date(point.date);
                ctx.fillText(`${date.getDate()}/${date.getMonth() + 1}`, x, height - 15);
            }
        });

    }, [data, height]);

    if (data.length === 0) {
        return (
            <div className="chart-empty">
                <p>No sales data available</p>
            </div>
        );
    }

    return (
        <div className="sales-chart">
            <canvas ref={canvasRef} style={{ width: '100%' }} />
        </div>
    );
}
