// ============================================
// PIE CHART COMPONENT - Status Distribution
// ============================================

import type { StatusDistribution } from '../services/api';

interface PieChartProps {
    data: StatusDistribution[];
    size?: number;
}

const STATUS_LABELS: Record<string, string> = {
    AWAITING_PAYMENT: 'Awaiting Payment',
    PREPARATION: 'Preparation',
    SHIPPED: 'Shipped',
    DELIVERED: 'Delivered',
    COMPLETED: 'Completed',
    RETURNED: 'Returned',
    DISPUTED: 'Disputed',
    CANCELLED: 'Cancelled'
};

export function PieChart({ data, size = 180 }: PieChartProps) {
    const total = data.reduce((sum, item) => sum + item.count, 0);

    // Calculate pie slices
    let currentAngle = -90; // Start from top
    const slices = data.map(item => {
        const angle = (item.count / total) * 360;
        const slice = {
            ...item,
            startAngle: currentAngle,
            endAngle: currentAngle + angle,
            label: STATUS_LABELS[item.status] || item.status
        };
        currentAngle += angle;
        return slice;
    });

    // Convert angle to radians
    const toRad = (deg: number) => (deg * Math.PI) / 180;

    // Generate arc path
    const getArcPath = (startAngle: number, endAngle: number, radius: number, innerRadius: number = 0) => {
        const cx = size / 2;
        const cy = size / 2;

        const startOuter = {
            x: cx + radius * Math.cos(toRad(startAngle)),
            y: cy + radius * Math.sin(toRad(startAngle))
        };
        const endOuter = {
            x: cx + radius * Math.cos(toRad(endAngle)),
            y: cy + radius * Math.sin(toRad(endAngle))
        };
        const startInner = {
            x: cx + innerRadius * Math.cos(toRad(endAngle)),
            y: cy + innerRadius * Math.sin(toRad(endAngle))
        };
        const endInner = {
            x: cx + innerRadius * Math.cos(toRad(startAngle)),
            y: cy + innerRadius * Math.sin(toRad(startAngle))
        };

        const largeArc = endAngle - startAngle > 180 ? 1 : 0;

        if (innerRadius === 0) {
            return `M ${cx} ${cy} L ${startOuter.x} ${startOuter.y} A ${radius} ${radius} 0 ${largeArc} 1 ${endOuter.x} ${endOuter.y} Z`;
        }

        return `M ${startOuter.x} ${startOuter.y} A ${radius} ${radius} 0 ${largeArc} 1 ${endOuter.x} ${endOuter.y} L ${startInner.x} ${startInner.y} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${endInner.x} ${endInner.y} Z`;
    };

    if (data.length === 0) {
        return (
            <div className="chart-empty">
                <p>No data available</p>
            </div>
        );
    }

    const radius = size / 2 - 10;
    const innerRadius = radius * 0.55; // Donut chart

    return (
        <div className="pie-chart-container">
            <svg width={size} height={size} className="pie-chart">
                {slices.map((slice, i) => (
                    <path
                        key={i}
                        d={getArcPath(slice.startAngle, slice.endAngle, radius, innerRadius)}
                        fill={slice.color}
                        className="pie-slice"
                    >
                        <title>{`${slice.label}: ${slice.count} (${slice.percentage}%)`}</title>
                    </path>
                ))}
                {/* Center text */}
                <text x={size / 2} y={size / 2 - 8} textAnchor="middle" fill="#fff" fontSize="24" fontWeight="700">
                    {total}
                </text>
                <text x={size / 2} y={size / 2 + 12} textAnchor="middle" fill="#a1a1aa" fontSize="12">
                    Total Orders
                </text>
            </svg>

            {/* Legend */}
            <div className="pie-legend">
                {slices.filter(s => s.count > 0).map((slice, i) => (
                    <div key={i} className="legend-item">
                        <span className="legend-color" style={{ background: slice.color }} />
                        <span className="legend-label">{slice.label}</span>
                        <span className="legend-value">{slice.count}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
