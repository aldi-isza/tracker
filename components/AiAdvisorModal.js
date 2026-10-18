// ============================================
// AI ADVISOR MODAL — Resume, Evaluasi & Chat Interaktif
// ============================================

const { useState: _aiUseState, useEffect: _aiUseEffect, useRef: _aiUseRef } = React;

window.AiAdvisorModal = ({ 
    isOpen, 
    onClose, 
    financialData 
}) => {
    if (!isOpen) return null;

    const [activeTab, setActiveTab] = _aiUseState('summary'); // 'summary' | 'chat'
    const [selectedPeriod, setSelectedPeriod] = _aiUseState('1_month'); // '1_month' | 'today' | '7days' | 'all' | 'custom'
    const [customStart, setCustomStart] = _aiUseState('');
    const [customEnd, setCustomEnd] = _aiUseState('');
    const [summaryText, setSummaryText] = _aiUseState('');
    const [isGeneratingSummary, setIsGeneratingSummary] = _aiUseState(false);
    
    // Chat state
    const [chatMessages, setChatMessages] = _aiUseState([
        {
            role: 'assistant',
            text: 'Halo! Saya siap menganalisis data keuangan, anggaran, dan catatan servis keluarga Anda. Silakan tanyakan hal yang ingin Anda ketahui.'
        }
    ]);
    const [inputPrompt, setInputPrompt] = _aiUseState('');
    const [isSendingChat, setIsSendingChat] = _aiUseState(false);
    const chatEndRef = _aiUseRef(null);
    const toast = window.useToast();

    const apiKey = window.geminiService?.getApiKey();

    // Helper untuk memfilter transaksi berdasarkan periode yang dipilih
    const getPeriodTransactionsAndMeta = () => {
        const rawTx = financialData?.transactions || [];
        const now = new Date();
        let start = new Date(0);
        let end = new Date(8640000000000000);
        let label = 'Bulan Ini';
        let rangeText = '';

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

        if (selectedPeriod === '1_month') {
            const currentDay = now.getDate();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            if (currentDay >= 25) {
                start = new Date(currentYear, currentMonth, 25, 0, 0, 0, 0);
                end = new Date(currentYear, currentMonth + 1, 24, 23, 59, 59, 999);
                const nextMonth = (currentMonth + 1) % 12;
                label = 'Bulan Ini (Cut-Off 25)';
                rangeText = `25 ${monthNames[currentMonth]} - 24 ${monthNames[nextMonth]}`;
            } else {
                start = new Date(currentYear, currentMonth - 1, 25, 0, 0, 0, 0);
                end = new Date(currentYear, currentMonth, 24, 23, 59, 59, 999);
                const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
                label = 'Bulan Ini (Cut-Off 25)';
                rangeText = `25 ${monthNames[prevMonth]} - 24 ${monthNames[currentMonth]}`;
            }
        } else if (selectedPeriod === 'today') {
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
            end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            label = 'Hari Ini';
            rangeText = `${now.getDate()} ${monthNames[now.getMonth()]} ${now.getFullYear()}`;
        } else if (selectedPeriod === '7days') {
            start = new Date(now.getTime() - 7 * 86400000);
            start.setHours(0, 0, 0, 0);
            label = '7 Hari Terakhir';
        } else if (selectedPeriod === 'custom') {
            if (customStart) {
                start = new Date(customStart);
                start.setHours(0, 0, 0, 0);
            }
            if (customEnd) {
                end = new Date(customEnd);
                end.setHours(23, 59, 59, 999);
            }
            label = 'Periode Kustom';
            rangeText = `${customStart || '...'} s/d ${customEnd || '...'}`;
        } else if (selectedPeriod === 'all') {
            label = 'Semua Waktu';
            rangeText = 'Seluruh riwayat transaksi';
        }

        const filtered = rawTx.filter(t => {
            const tDate = new Date(t.date);
            return tDate >= start && tDate <= end;
        });

        return {
            filteredTransactions: filtered,
            periodInfo: { label, rangeText, id: selectedPeriod }
        };
    };

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    _aiUseEffect(() => {
        if (activeTab === 'chat') {
            scrollToBottom();
        }
    }, [chatMessages, activeTab]);

    const handleGenerateSummary = async () => {
        if (!apiKey) {
            toast('Masukkan Google AI Studio API Key di menu Settings.', 'error');
            return;
        }

        const { filteredTransactions, periodInfo } = getPeriodTransactionsAndMeta();

        setIsGeneratingSummary(true);
        try {
            const scopedData = {
                ...financialData,
                transactions: filteredTransactions
            };
            const res = await window.geminiService.generateSummaryAndEvaluation(scopedData, periodInfo);
            setSummaryText(res);
            toast('Evaluasi periode berhasil dibuat.', 'success');
        } catch (err) {
            toast(err.message || 'Gagal memproses evaluasi', 'error');
        } finally {
            setIsGeneratingSummary(false);
        }
    };

    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();
        const text = inputPrompt.trim();
        if (!text || isSendingChat) return;

        if (!apiKey) {
            toast('Masukkan Google AI Studio API Key di menu Settings.', 'error');
            return;
        }

        const { filteredTransactions, periodInfo } = getPeriodTransactionsAndMeta();
        const scopedData = {
            ...financialData,
            transactions: financialData?.transactions || []
        };

        const newHistory = [...chatMessages, { role: 'user', text }];
        setChatMessages(newHistory);
        setInputPrompt('');
        setIsSendingChat(true);

        try {
            const reply = await window.geminiService.chatWithAssistant(
                text,
                chatMessages.filter(m => m.role !== 'system'),
                scopedData,
                periodInfo
            );

            setChatMessages([...newHistory, { role: 'assistant', text: reply }]);
        } catch (err) {
            toast(err.message || 'Gagal menghubungi AI', 'error');
            setChatMessages([
                ...newHistory,
                { role: 'assistant', text: `Kendala: ${err.message}` }
            ]);
        } finally {
            setIsSendingChat(false);
        }
    };

    return (
        <div 
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-md animate-fade-in"
        >
            <div 
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xl flex flex-col h-[85vh] max-h-[640px] overflow-hidden animate-slide-up"
            >
                {/* Header Modal */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
                            <Icon name="sparkles" size={16} />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                                AI Advisor Keuangan
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                                    Gemini
                                </span>
                            </h3>
                            <p className="text-[10px] text-slate-400">Asisten cerdas analisis transaksi & anggaran</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <Icon name="x" size={18} />
                    </button>
                </div>

                {/* Sub Tab Buttons */}
                <div className="flex border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-2 gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={() => setActiveTab('summary')}
                        className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all ${
                            activeTab === 'summary'
                                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        <Icon name="fileText" size={14} />
                        Resume & Evaluasi
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('chat')}
                        className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all ${
                            activeTab === 'chat'
                                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        <Icon name="messageSquare" size={14} />
                        Tanya Jawab (Chat)
                    </button>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-4 bg-slate-50/40 dark:bg-slate-950/40">
                    {!apiKey && (
                        <div className="p-3.5 mb-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2.5">
                            <Icon name="alertCircle" size={16} className="shrink-0 mt-0.5 text-amber-600" />
                            <div className="flex-1">
                                <p className="font-bold">Google AI Studio API Key Belum Diisi</p>
                                <p className="text-[11px] mt-0.5 text-amber-700 dark:text-amber-300">
                                    Masukkan API Key Gemini Anda di menu <b>Settings</b> ➡️ <b>Google AI Studio</b> agar fitur Resume, Analisis, dan Chat AI ini aktif.
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'summary' && (
                        <div className="space-y-3.5">
                            {/* Selector Periode Analisis */}
                            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2.5">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        PILIH PERIODE ANALISIS
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                        {getPeriodTransactionsAndMeta().periodInfo.rangeText}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {[
                                        { id: '1_month', label: 'Bulan Ini' },
                                        { id: '7days', label: '7 Hari' },
                                        { id: 'today', label: 'Hari Ini' },
                                        { id: 'all', label: 'Semua' },
                                        { id: 'custom', label: 'Kustom' }
                                    ].map(p => (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => setSelectedPeriod(p.id)}
                                            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                                                selectedPeriod === p.id
                                                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                            }`}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>

                                {selectedPeriod === 'custom' && (
                                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
                                        <input
                                            type="date"
                                            value={customStart}
                                            onChange={(e) => setCustomStart(e.target.value)}
                                            className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-xs"
                                        />
                                        <span className="text-slate-400">s/d</span>
                                        <input
                                            type="date"
                                            value={customEnd}
                                            onChange={(e) => setCustomEnd(e.target.value)}
                                            className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-xs"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between gap-2">
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                    Analisis kas, pos boros, planning & servis.
                                </p>
                                <Button 
                                    size="sm" 
                                    onClick={handleGenerateSummary}
                                    disabled={isGeneratingSummary || !apiKey}
                                    className="gap-1.5 text-xs shadow-xs shrink-0"
                                >
                                    <Icon name={isGeneratingSummary ? "refresh" : "sparkles"} size={13} className={isGeneratingSummary ? "animate-spin" : ""} />
                                    {isGeneratingSummary ? "Menganalisis..." : (summaryText ? "Analisis Ulang" : "Buat Evaluasi")}
                                </Button>
                            </div>

                            {isGeneratingSummary && (
                                <div className="p-8 text-center space-y-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
                                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                                        Menganalisis transaksi periode {getPeriodTransactionsAndMeta().periodInfo.label}...
                                    </p>
                                </div>
                            )}

                            {!isGeneratingSummary && summaryText && (
                                <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                                    {summaryText}
                                </div>
                            )}

                            {!isGeneratingSummary && !summaryText && (
                                <div className="p-7 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 mx-auto flex items-center justify-center">
                                        <Icon name="sparkles" size={20} />
                                    </div>
                                    <p className="font-bold text-xs text-slate-800 dark:text-slate-200">Belum Ada Hasil Evaluasi</p>
                                    <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                                        Pilih periode di atas lalu klik tombol <b>Buat Evaluasi</b>.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'chat' && (
                        <div className="space-y-3 pb-2">
                            {chatMessages.map((msg, idx) => (
                                <div 
                                    key={idx}
                                    className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {msg.role !== 'user' && (
                                        <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs text-xs font-bold mt-0.5">
                                            AI
                                        </div>
                                    )}
                                    <div 
                                        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap shadow-xs ${
                                            msg.role === 'user'
                                                ? 'bg-blue-600 text-white rounded-tr-xs font-medium'
                                                : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-800 rounded-tl-xs'
                                        }`}
                                    >
                                        {msg.text}
                                    </div>
                                </div>
                            ))}

                            {isSendingChat && (
                                <div className="flex gap-2.5 justify-start">
                                    <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs text-xs font-bold">
                                        AI
                                    </div>
                                    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl px-3.5 py-2 text-xs text-slate-500 flex items-center gap-1.5 shadow-xs">
                                        <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                                        <span>Mengetik jawaban...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>
                    )}
                </div>

                {/* Footer Chat Input (Only on Chat Tab) */}
                {activeTab === 'chat' && (
                    <form 
                        onSubmit={handleSendMessage}
                        className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-2 items-center shrink-0"
                    >
                        <Input
                            placeholder="Tanyakan pos pengeluaran, servis motor, atau saran hemat..."
                            value={inputPrompt}
                            onChange={(e) => setInputPrompt(e.target.value)}
                            disabled={isSendingChat || !apiKey}
                            className="flex-1 text-xs"
                        />
                        <Button 
                            type="submit" 
                            disabled={!inputPrompt.trim() || isSendingChat || !apiKey}
                            className="h-10 px-3.5 shrink-0"
                        >
                            <Icon name="send" size={15} />
                        </Button>
                    </form>
                )}
            </div>
        </div>
    );
};
