const { useState, useEffect, useContext, createContext, useMemo, useCallback, useRef } = React;

// Expose components on the global window object for easy CDN browser usage
window.Icon = ({ name, className = "", size = 24 }) => {
    const icons = {
        home: <><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></>,
        list: <><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></>,
        folder: <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>,
        settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"/></>,
        logOut: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></>,
        plus: <><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></>,
        edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></>,
        trash: <><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></>,
        x: <><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></>,
        chevronDown: <polyline points="6 9 12 15 18 9"/>,
        chevronLeft: <polyline points="15 18 9 12 15 6"/>,
        chevronRight: <polyline points="9 18 15 12 9 6"/>,
        download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></>,
        menu: <><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></>,
        moon: <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>,
        sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></>,
        pieChart: <><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></>,
        alertCircle: <><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></>,
        check: <polyline points="20 6 9 17 4 12"/>,
        arrowUpRight: <><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></>,
        arrowDownLeft: <><line x1="17" y1="7" x2="7" y2="17"/><polyline points="17 17 7 17 7 7"/></>,
        wallet: <><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-3"/><path d="M18 12h.01"/><path d="M16 8h5a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/></>,
        user: <><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
        shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>,
        filter: <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>,
        calendar: <><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></>,
        refresh: <><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></>,
        search: <><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></>,
        fileText: <><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></>,
        wrench: <><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></>,
        clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
        tag: <><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><line x1="7" x2="7.01" y1="7" y2="7"/></>,
        calendarCheck: <><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="m9 16 2 2 4-4"/></>,
        car: <><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></>,
        zap: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>,
        target: <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>
    };
    
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            {icons[name] || icons.pieChart}
        </svg>
    );
};

window.Button = React.forwardRef(({ className = "", variant = "default", size = "default", ...props }, ref) => {
    const variants = {
        default: "bg-indigo-500 hover:bg-indigo-600 text-black border-2 border-black dark:border-white font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] dark:active:shadow-[1.5px_1.5px_0px_0px_rgba(255,255,255,1)]",
        destructive: "bg-rose-400 hover:bg-rose-500 text-black border-2 border-black dark:border-white font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] dark:active:shadow-[1.5px_1.5px_0px_0px_rgba(255,255,255,1)]",
        outline: "border-2 border-black dark:border-white bg-card hover:bg-muted text-foreground font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] dark:active:shadow-[1.5px_1.5px_0px_0px_rgba(255,255,255,1)]",
        secondary: "bg-secondary text-secondary-foreground border-2 border-black dark:border-white font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] dark:active:shadow-[1.5px_1.5px_0px_0px_rgba(255,255,255,1)]",
        ghost: "text-muted-foreground hover:text-foreground font-bold hover:bg-muted/40",
        success: "bg-emerald-400 hover:bg-emerald-500 text-black border-2 border-black dark:border-white font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] dark:active:shadow-[1.5px_1.5px_0px_0px_rgba(255,255,255,1)]",
    };
    const sizes = {
        default: "h-11 px-5 text-sm rounded-lg",
        sm: "h-9 px-3.5 text-xs rounded-md",
        lg: "h-12 px-6 text-base rounded-xl",
        icon: "h-10 w-10 rounded-lg",
    };
    return (
        <button
            ref={ref}
            className={`inline-flex items-center justify-center transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 select-none ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        />
    );
});

window.Input = React.forwardRef(({ className = "", type, ...props }, ref) => {
    return (
        <input
            type={type}
            className={`flex h-11 w-full rounded-lg border-2 border-black dark:border-white bg-white text-black font-extrabold px-3.5 py-2 text-sm transition-all placeholder:text-neutral-500 focus-visible:outline-none focus:ring-0 focus:translate-x-[0.5px] focus:translate-y-[0.5px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
            ref={ref}
            {...props}
        />
    );
});

window.Label = React.forwardRef(({ className = "", ...props }, ref) => (
    <label ref={ref} className={`text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground ${className}`} {...props} />
));

window.Card = React.forwardRef(({ className = "", ...props }, ref) => (
    <div ref={ref} className={`rounded-xl border-2 border-black dark:border-white bg-card text-card-foreground shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] transition-all ${className}`} {...props} />
));

window.CardHeader = React.forwardRef(({ className = "", ...props }, ref) => (
    <div ref={ref} className={`flex flex-col space-y-1.5 p-5 ${className}`} {...props} />
));

window.CardTitle = React.forwardRef(({ className = "", ...props }, ref) => (
    <h3 ref={ref} className={`font-extrabold leading-none tracking-tight ${className}`} {...props} />
));

window.CardContent = React.forwardRef(({ className = "", ...props }, ref) => (
    <div ref={ref} className={`p-5 pt-0 ${className}`} {...props} />
));

window.Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div 
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-in fade-in duration-200"
        >
            <div 
                onClick={(e) => e.stopPropagation()}
                className="bg-[#faf8f5] dark:bg-zinc-950 w-full max-w-md rounded-2xl border-2 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] overflow-hidden animate-in zoom-in-95 duration-200"
            >
                <div className="flex items-center justify-between p-4 border-b-2 border-black dark:border-white">
                    <h3 className="font-black text-base text-foreground uppercase tracking-tight">{title}</h3>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
                        <Icon name="x" size={20} />
                    </button>
                </div>
                <div className="p-5 max-h-[80vh] overflow-y-auto">{children}</div>
            </div>
        </div>
    );
};

window.ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;
    return (
        <div 
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-in fade-in duration-200"
        >
            <div 
                onClick={(e) => e.stopPropagation()}
                className="bg-[#faf8f5] dark:bg-zinc-950 w-full max-w-sm rounded-2xl border-2 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] overflow-hidden animate-in zoom-in-95 duration-200"
            >
                <div className="p-5 space-y-4">
                    <h3 className="font-black text-base text-foreground uppercase tracking-tight">{title}</h3>
                    <p className="text-xs font-semibold text-muted-foreground leading-relaxed">{message}</p>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" size="sm" onClick={onClose}>Batal</Button>
                        <Button variant="destructive" size="sm" onClick={onConfirm}>Hapus</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

window.Select = ({ value, onChange, options, className = "", placeholder = "Pilih..." }) => (
    <select
        value={value}
        onChange={onChange}
        className={`flex h-11 w-full items-center justify-between rounded-lg border-2 border-black dark:border-white bg-white text-black font-extrabold px-3.5 py-2 text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
        <option value="" disabled className="bg-white text-black font-bold">{placeholder}</option>
        {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-white text-black font-bold">{opt.label}</option>
        ))}
    </select>
);

window.ChartComponent = React.memo(({ type = 'bar', data, options, height = "220px" }) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        if (!chartRef.current) return;
        
        if (chartInstance.current) {
            chartInstance.current.data = data;
            if (options) {
                chartInstance.current.options = { ...chartInstance.current.options, ...options };
            }
            chartInstance.current.update('none');
            return;
        }
        
        try {
            const ctx = chartRef.current.getContext('2d');
            const isDark = document.documentElement.classList.contains('dark');
            const textColor = isDark ? '#94a3b8' : '#64748b';
            const gridColor = isDark ? '#1e293b' : '#f1f5f9';

            const shadowPlugin = {
                id: 'shadowPlugin',
                beforeDraw: (chart) => {
                    if (chart.config.type !== 'doughnut' && chart.config.type !== 'pie') return;
                    const chartCtx = chart.ctx;
                    chartCtx.save();
                    chartCtx.shadowColor = 'rgba(0, 0, 0, 0.15)';
                    chartCtx.shadowBlur = 10;
                    chartCtx.shadowOffsetX = 3;
                    chartCtx.shadowOffsetY = 4;
                },
                afterDraw: (chart) => {
                    if (chart.config.type !== 'doughnut' && chart.config.type !== 'pie') return;
                    chart.ctx.restore();
                }
            };

            const centerTextPlugin = {
                id: 'centerText',
                beforeDraw: (chart) => {
                    if (chart.config.type !== 'doughnut') return;
                    const { width, height: chartHeight, ctx: chartCtx } = chart;
                    chartCtx.restore();
                    
                    const valText = chart.config.options.plugins?.centerText?.text || '';
                    const subText = chart.config.options.plugins?.centerText?.subtext || 'Total Belanja';
                    
                    chartCtx.textBaseline = 'middle';
                    chartCtx.textAlign = 'center';
                    
                    chartCtx.font = 'bold 15px "Plus Jakarta Sans"';
                    chartCtx.fillStyle = isDark ? '#ffffff' : '#0f172a';
                    chartCtx.fillText(valText, width / 2, chartHeight / 2 - 8);
                    
                    chartCtx.font = '500 10px "Plus Jakarta Sans"';
                    chartCtx.fillStyle = '#94a3b8';
                    chartCtx.fillText(subText, width / 2, chartHeight / 2 + 10);
                    
                    chartCtx.save();
                }
            };

            const defaultOptions = {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                plugins: {
                    legend: { 
                        labels: { 
                            color: textColor,
                            font: { family: 'Plus Jakarta Sans', size: 10, weight: '600' },
                            boxWidth: 10,
                            usePointStyle: true
                        } 
                    }
                },
                scales: type !== 'pie' && type !== 'doughnut' ? {
                    x: { 
                        ticks: { color: textColor, font: { family: 'Plus Jakarta Sans', size: 10 } }, 
                        grid: { color: gridColor, drawBorder: false } 
                    },
                    y: { 
                        ticks: { color: textColor, font: { family: 'Plus Jakarta Sans', size: 10 } }, 
                        grid: { color: gridColor, drawBorder: false } 
                    }
                } : {}
            };

            const mergedOptions = { ...defaultOptions, ...options };
            if (options?.scales) {
                mergedOptions.scales = {
                    ...defaultOptions.scales,
                    ...options.scales
                }
            }

            chartInstance.current = new Chart(ctx, {
                type,
                data,
                options: mergedOptions,
                plugins: type === 'doughnut' ? [shadowPlugin, centerTextPlugin] : (type === 'pie' ? [shadowPlugin] : [])
            });
        } catch (e) {
            console.error('[Chart Error]', e);
        }
    }, [data, options, type]);

    useEffect(() => {
        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
                chartInstance.current = null;
            }
        };
    }, []);

    return (
        <div style={{ height, width: '100%' }} className="relative">
            <canvas ref={chartRef}></canvas>
        </div>
    );
});

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('[React Error Boundary]', error, errorInfo);
    }

    handleReload = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#faf8f5] dark:bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-full max-w-sm p-6 bg-card border-2 border-black dark:border-white rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] space-y-4">
                        <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/50 border-2 border-black dark:border-white flex items-center justify-center mx-auto text-rose-500 font-black text-xl">
                            ⚠️
                        </div>
                        <h2 className="text-lg font-black text-foreground">Terjadi Kendala Teknis</h2>
                        <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
                            Aplikasi mengalami gangguan tampilan sementara. Silakan segarkan halaman untuk memulihkan.
                        </p>
                        <button
                            type="button"
                            onClick={this.handleReload}
                            className="w-full h-11 bg-indigo-500 hover:bg-indigo-600 text-black border-2 border-black dark:border-white font-black rounded-lg text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] active:scale-95 transition-all"
                        >
                            Segarkan Halaman
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}
window.ErrorBoundary = ErrorBoundary;

