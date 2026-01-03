// ============================================
// SEARCH & FILTER COMPONENT
// ============================================

import { useState } from 'react';

interface SearchFiltersProps {
    onSearch: (filters: SearchFilters) => void;
    onExport?: () => void;
}

export interface SearchFilters {
    query: string;
    status: string;
    startDate: string;
    endDate: string;
    minAmount: string;
    maxAmount: string;
}

const STATUS_OPTIONS = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'AWAITING_PAYMENT', label: '⏳ Awaiting Payment' },
    { value: 'PREPARATION', label: '📦 Preparation' },
    { value: 'SHIPPED', label: '🚚 Shipped' },
    { value: 'DELIVERED', label: '✅ Delivered' },
    { value: 'COMPLETED', label: '🎉 Completed' },
    { value: 'RETURNED', label: '↩️ Returned' },
    { value: 'DISPUTED', label: '⚠️ Disputed' },
    { value: 'CANCELLED', label: '❌ Cancelled' }
];

export function SearchFilters({ onSearch, onExport }: SearchFiltersProps) {
    const [filters, setFilters] = useState<SearchFilters>({
        query: '',
        status: 'ALL',
        startDate: '',
        endDate: '',
        minAmount: '',
        maxAmount: ''
    });
    const [showAdvanced, setShowAdvanced] = useState(false);

    const handleChange = (field: keyof SearchFilters, value: string) => {
        const newFilters = { ...filters, [field]: value };
        setFilters(newFilters);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(filters);
    };

    const handleReset = () => {
        const resetFilters: SearchFilters = {
            query: '',
            status: 'ALL',
            startDate: '',
            endDate: '',
            minAmount: '',
            maxAmount: ''
        };
        setFilters(resetFilters);
        onSearch(resetFilters);
    };

    return (
        <div className="search-filters">
            <form onSubmit={handleSubmit}>
                {/* Main Search Bar */}
                <div className="search-main">
                    <div className="search-input-wrapper">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search by order number, customer name or email..."
                            value={filters.query}
                            onChange={(e) => handleChange('query', e.target.value)}
                        />
                    </div>

                    <select
                        className="status-select"
                        value={filters.status}
                        onChange={(e) => handleChange('status', e.target.value)}
                    >
                        {STATUS_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>

                    <button type="submit" className="btn btn-primary">
                        Search
                    </button>

                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                    >
                        {showAdvanced ? '▲ Less' : '▼ More'}
                    </button>

                    {onExport && (
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onExport}
                        >
                            📥 Export CSV
                        </button>
                    )}
                </div>

                {/* Advanced Filters */}
                {showAdvanced && (
                    <div className="search-advanced">
                        <div className="filter-group">
                            <label>Date Range</label>
                            <div className="date-range">
                                <input
                                    type="date"
                                    className="form-input"
                                    value={filters.startDate}
                                    onChange={(e) => handleChange('startDate', e.target.value)}
                                />
                                <span>to</span>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={filters.endDate}
                                    onChange={(e) => handleChange('endDate', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="filter-group">
                            <label>Amount Range ($)</label>
                            <div className="amount-range">
                                <input
                                    type="number"
                                    className="form-input"
                                    placeholder="Min"
                                    value={filters.minAmount}
                                    onChange={(e) => handleChange('minAmount', e.target.value)}
                                />
                                <span>to</span>
                                <input
                                    type="number"
                                    className="form-input"
                                    placeholder="Max"
                                    value={filters.maxAmount}
                                    onChange={(e) => handleChange('maxAmount', e.target.value)}
                                />
                            </div>
                        </div>

                        <button type="button" className="btn btn-secondary" onClick={handleReset}>
                            🔄 Reset Filters
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
}
