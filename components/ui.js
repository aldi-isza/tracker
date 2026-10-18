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
        arrowLeft: <><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>,
        arrowRight: <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
        barChart: <><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></>,
        wallet: <><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-3"/><path d="M18 12h.01"/><path d="M16 8h5a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/></>,
        user: <><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
        shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>,
        filter: <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>,
        calendar: <><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></>,
        refresh: <><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></>,
        search: <><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></>,
        fileText: <><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></>,
        wrench: <><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></>,
        eyeOff: <><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></>,
        clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
        tag: <><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><line x1="7" x2="7.01" y1="7" y2="7"/></>,
        calendarCheck: <><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="m9 16 2 2 4-4"/></>,
        car: <><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></>,
        zap: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>,
        target: <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
        sparkles: <><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></>,
        messageSquare: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>,
        bot: <><rect width="18" height="12" x="3" y="6" rx="2"/><path d="M9 13v-2"/><path d="M15 13v-2"/><path d="M12 2v4"/></>,
        send: <><line x1="22" x2="11" y1="2" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>
    };
    
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            {icons[name] || icons.pieChart}
        </svg>
    );
};

window.Button = React.forwardRef(({ className = "", variant = "default", size = "default", ...props }, ref) => {
    const variants = {
        default: "bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm hover:shadow transition-all active:scale-[0.98] border border-transparent",
        destructive: "bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 font-medium border border-rose-200/60 dark:border-rose-800/60 shadow-sm active:scale-[0.98]",
        outline: "border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-medium shadow-sm active:scale-[0.98]",
        secondary: "bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-medium border border-transparent active:scale-[0.98]",
        ghost: "text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-[0.98]",
        success: "bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm active:scale-[0.98] border border-transparent",
    };
    const sizes = {
        default: "h-10 px-4 text-xs rounded-xl",
        sm: "h-8 px-3 text-xs rounded-lg",
        lg: "h-11 px-5 text-sm rounded-xl",
        icon: "h-9 w-9 rounded-xl",
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
            className={`flex h-10 w-full rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium px-3.5 py-2 text-xs transition-all placeholder:text-slate-400 focus-visible:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-xs disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
            ref={ref}
            {...props}
        />
    );
});

window.Label = React.forwardRef(({ className = "", ...props }, ref) => (
    <label ref={ref} className={`text-[11px] font-medium tracking-normal text-slate-500 dark:text-slate-400 ${className}`} {...props} />
));

window.Card = React.forwardRef(({ className = "", ...props }, ref) => (
    <div ref={ref} className={`rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:shadow-none transition-all ${className}`} {...props} />
));

window.CardHeader = React.forwardRef(({ className = "", ...props }, ref) => (
    <div ref={ref} className={`flex flex-col space-y-1.5 p-5 ${className}`} {...props} />
));

window.CardTitle = React.forwardRef(({ className = "", ...props }, ref) => (
    <h3 ref={ref} className={`font-semibold text-sm tracking-tight text-slate-900 dark:text-white ${className}`} {...props} />
));

window.CardContent = React.forwardRef(({ className = "", ...props }, ref) => (
    <div ref={ref} className={`p-5 pt-0 ${className}`} {...props} />
));

window.Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div 
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md animate-fade-in"
        >
            <div 
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden animate-slide-up"
            >
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="font-semibold text-sm text-slate-900 dark:text-white tracking-tight">{title}</h3>
                    <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <Icon name="x" size={18} />
                    </button>
                </div>
                <div className="p-5 max-h-[80vh] overflow-y-auto">{children}</div>
            </div>
        </div>
    );
};

window.Badge = ({ children, variant = "default", className = "" }) => {
    const variants = {
        default: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700",
        success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/80",
        warning: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/80",
        destructive: "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/80",
        primary: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/80"
    };
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${variants[variant] || variants.default} ${className}`}>
            {children}
        </span>
    );
};

window.SegmentedControl = ({ tabs = [], activeTab, onChange, className = "" }) => (
    <div className={`flex p-1 bg-slate-200/70 dark:bg-slate-800/70 rounded-2xl border border-slate-300/40 dark:border-slate-700/50 shadow-xs ${className}`}>
        {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            const activeColor = tab.activeColor || "text-blue-600 dark:text-blue-400";
            return (
                <button
                    key={tab.id}
                    type="button"
                    onClick={() => onChange(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                        isActive
                            ? `bg-white dark:bg-slate-900 ${activeColor} shadow-sm`
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                    {tab.icon && <Icon name={tab.icon} size={15} />}
                    <span>{tab.label}</span>
                    {typeof tab.count === 'number' && tab.count > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                            isActive 
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200' 
                                : 'bg-slate-300/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300'
                        }`}>
                            {tab.count}
                        </span>
                    )}
                </button>
            );
        })}
    </div>
);

window.EmptyState = ({ icon = "folder", title = "No records found", description, actionLabel, onAction, className = "" }) => (
    <div className={`p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 space-y-3 ${className}`}>
        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto">
            <Icon name={icon} size={20} />
        </div>
        <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{title}</h4>
            {description && <p className="text-[11px] text-slate-500 dark:text-slate-400">{description}</p>}
        </div>
        {actionLabel && onAction && (
            <button
                type="button"
                onClick={onAction}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all active:scale-95"
            >
                <Icon name="plus" size={14} />
                <span>{actionLabel}</span>
            </button>
        )}
    </div>
);

window.SkeletonList = ({ count = 4, itemHeight = "h-12", className = "" }) => (
    <div className={`space-y-2 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} className={`${itemHeight} rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 skeleton-shimmer`} />
        ))}
    </div>
);

window.ConfirmModal = ({ isOpen, onClose, onConfirm, title = "Confirm", message = "Are you sure?", confirmText = "Delete", cancelText = "Cancel" }) => {
    if (!isOpen) return null;
    return (
        <div 
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md animate-fade-in"
        >
            <div 
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden animate-slide-up"
            >
                <div className="p-5 space-y-4">
                    <h3 className="font-semibold text-sm text-slate-900 dark:text-white tracking-tight">{title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{message}</p>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" size="sm" onClick={onClose}>{cancelText}</Button>
                        <Button variant="destructive" size="sm" onClick={onConfirm}>{confirmText}</Button>
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
        className={`flex h-10 w-full items-center justify-between rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium px-3.5 py-2 text-xs shadow-xs focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
        <option value="" disabled className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium">{placeholder}</option>
        {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium">{opt.label}</option>
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
                <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-full max-w-sm p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xl space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/60 flex items-center justify-center mx-auto text-rose-500 font-bold text-xl">
                            ⚠️
                        </div>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white">Terjadi Kendala Teknis</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                            Aplikasi mengalami gangguan tampilan sementara. Silakan segarkan halaman untuk memulihkan.
                        </p>
                        <button
                            type="button"
                            onClick={this.handleReload}
                            className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-xs shadow-sm active:scale-95 transition-all"
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

