// ============================================
// GEMINI AI SERVICE — Resume, Evaluasi & Chat Keuangan
// ============================================

window.GEMINI_STORAGE_KEY = 'isza_gemini_api_key';
window.GEMINI_MODEL_STORAGE_KEY = 'isza_gemini_active_model';

// Model Gemini resmi & tercepat (gemini-2.5-flash diprioritaskan utama)
const CANDIDATE_MODELS = [
    'gemini-2.5-flash',
    'gemini-flash-latest',
    'gemini-2.5-pro'
];

window.geminiService = {
    getApiKey() {
        return localStorage.getItem(window.GEMINI_STORAGE_KEY) || '';
    },

    setApiKey(key) {
        if (!key) {
            localStorage.removeItem(window.GEMINI_STORAGE_KEY);
        } else {
            localStorage.setItem(window.GEMINI_STORAGE_KEY, key.trim());
        }
    },

    getActiveModel() {
        return localStorage.getItem(window.GEMINI_MODEL_STORAGE_KEY) || 'gemini-2.5-flash';
    },

    setActiveModel(model) {
        localStorage.setItem(window.GEMINI_MODEL_STORAGE_KEY, model);
    },

    buildFinancialContext(data = {}, periodInfo = null) {
        const {
            transactions = [],
            categories = [],
            planning = [],
            familyNotes = [],
            user = {}
        } = data;

        const periodLabel = periodInfo?.label || 'Semua Waktu';
        const periodNote = periodInfo?.rangeText ? `(${periodInfo.rangeText})` : '';

        // Hitung total pemasukan & pengeluaran untuk transaksi yang dievaluasi
        let totalIncome = 0;
        let totalExpense = 0;
        const categoryMap = {};
        categories.forEach(c => { categoryMap[c.id] = c.name; });

        const expenseByCategory = {};

        transactions.forEach(t => {
            const amt = Math.abs(parseFloat(t.amount) || 0);
            const catName = categoryMap[t.category_id] || t.category || 'Lainnya';
            if (t.type === 'income') {
                totalIncome += amt;
            } else {
                totalExpense += amt;
                expenseByCategory[catName] = (expenseByCategory[catName] || 0) + amt;
            }
        });

        const netBalance = totalIncome - totalExpense;

        // Urutkan transaksi dari tanggal terbaru ke terlama secara pasti
        const sortedTx = [...transactions].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

        // Masukkan SEMUA transaksi jika di bawah 60, atau batasi 40 jika banyak
        const txSlice = sortedTx.slice(0, 50);
        const recentTx = txSlice.map(t => {
            const catName = categoryMap[t.category_id] || t.category || '-';
            return `- [${t.date}] (${t.type.toUpperCase()}) ${catName}: Rp${Number(t.amount).toLocaleString('id-ID')} | Ket: ${t.note || '-'}`;
        }).join('\n');

        // Ringkasan Pengeluaran per Kategori
        const sortedCats = Object.entries(expenseByCategory)
            .sort((a, b) => b[1] - a[1])
            .map(([cat, amt]) => `- ${cat}: Rp${amt.toLocaleString('id-ID')}`)
            .join('\n');

        // Rencana Anggaran (Planning)
        const activePlans = planning.filter(p => !p.is_realized).map(p => {
            return `- ${p.title} (Target: ${p.target_date || '-'}): Rp${Number(p.amount || p.planned_amount || 0).toLocaleString('id-ID')} [${p.type}] | Catatan: ${p.notes || '-'}`;
        }).join('\n');

        // Catatan Servis & Perawatan Keluarga (Maintenance / Family Notes)
        const notesList = familyNotes.map(n => {
            return `- ${n.title} (${n.category || 'Umum'}): Terakhir ${n.last_date || '-'}, Jatuh Tempo: ${n.next_due_date || '-'}, Biaya: Rp${Number(n.cost || 0).toLocaleString('id-ID')} | Status: ${n.status || '-'}`;
        }).join('\n');

        return `
KONTEKS DATA EXPENSE TRACKER ISZA FAMILY:
User: ${user.email || 'Keluarga Isza'}
Mata Uang: IDR (Rupiah)
PERIODE ANALISIS: ${periodLabel} ${periodNote}

RINGKASAN METRIK PERIODE INI:
- Total Pemasukan: Rp${totalIncome.toLocaleString('id-ID')}
- Total Pengeluaran: Rp${totalExpense.toLocaleString('id-ID')}
- Saldo Bersih Periode: Rp${netBalance.toLocaleString('id-ID')}
- Jumlah Transaksi di Periode Ini: ${transactions.length}

PENGELUARAN TERBESAR PER KATEGORI (PERIODE INI):
${sortedCats || '(Belum ada data pengeluaran di periode ini)'}

TRANSAKSI DALAM PERIODE INI (Total ${txSlice.length} baris):
${recentTx || '(Belum ada transaksi di periode ini)'}

RENCANA ANGGARAN MENDATANG (PLANNING):
${activePlans || '(Tidak ada rencana aktif)'}

LOGBOOK PERAWATAN & SERVIS KELUARGA (MAINTENANCE / FAMILY NOTES):
${notesList || '(Belum ada catatan servis)'}
`.trim();
    },

    async callGemini({ prompt, systemInstruction = '', history = [] }) {
        const apiKey = this.getApiKey();
        if (!apiKey) {
            throw new Error('API Key Google AI Studio belum diisi di Pengaturan.');
        }

        // Format Gemini Multi-Turn Contents
        const contents = [];
        if (history && history.length > 0) {
            history.forEach(msg => {
                contents.push({
                    role: msg.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: msg.text }]
                });
            });
        }
        if (prompt) {
            contents.push({
                role: 'user',
                parts: [{ text: prompt }]
            });
        }

        const bodyPayload = {
            contents,
            systemInstruction: systemInstruction ? {
                parts: [{ text: systemInstruction }]
            } : undefined,
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2048
            }
        };

        // Otomatis coba model aktif (default: gemini-3.8-flash) & fallback ke candidate lain jika 404/deprecated
        const currentModel = this.getActiveModel();
        const modelsToTry = [currentModel, ...CANDIDATE_MODELS.filter(m => m !== currentModel)];

        let lastError = null;

        for (const model of modelsToTry) {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(bodyPayload)
                });

                if (response.ok) {
                    const data = await response.json();
                    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (text) {
                        this.setActiveModel(model);
                        return text;
                    }
                }

                const errJson = await response.json().catch(() => ({}));
                const errMsg = errJson?.error?.message || `HTTP Error ${response.status}`;

                // Jika model 404 / no longer available, coba model berikutnya
                if (response.status === 404 || errMsg.toLowerCase().includes('not found') || errMsg.toLowerCase().includes('no longer available')) {
                    console.warn(`[Gemini] Model ${model} tidak aktif (${errMsg}). Beralih otomatis ke model berikutnya...`);
                    lastError = new Error(errMsg);
                    continue;
                }

                // Error kredensial/kuota langsung dilempar
                throw new Error(errMsg);
            } catch (err) {
                lastError = err;
                if (err.message && (err.message.includes('404') || err.message.toLowerCase().includes('no longer available'))) {
                    continue;
                }
                throw err;
            }
        }

        throw lastError || new Error('Gagal memanggil Gemini AI dengan model yang tersedia.');
    },

    cleanMarkdownSymbols(text) {
        if (!text) return '';
        return text
            // Hapus markdown bold, italic, strikethrough (bintang & underscore)
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/__(.*?)__/g, '$1')
            .replace(/_(.*?)_/g, '$1')
            // Hapus markdown headers (tanda pagar di awal baris)
            .replace(/^#+\s*/gm, '')
            // Bersihkan sisa tanda bintang atau pagar liar
            .replace(/[*#]/g, '')
            .trim();
    },

    async generateSummaryAndEvaluation(financialData, periodInfo = null) {
        const contextText = this.buildFinancialContext(financialData, periodInfo);

        const systemInstruction = `
Kamu adalah "Isza AI Financial Advisor", asisten keuangan keluarga untuk Expense Tracker ISZA FAMILY.
ATURAN FORMAT & GAYA BAHASA (WAJIB DIIKUTI TANPA KECUALI):
1. DILARANG KERAS menggunakan simbol markdown bintang (*) atau pagar (#). Jangan membuat teks tebal dengan bintang atau judul dengan pagar. Tuliskan teks polos yang bersih.
2. Gaya bicara TEGAS, RINGKAS, PADAT, dan LANGSUNG PADA INTI ANGKA. Hindari basa-basi pembuka dan penutup.
3. Jawab hanya berdasarkan data keuangan dan catatan yang ada di konteks. Gunakan penomoran angka biasa (1., 2., 3.) atau strip (-) jika membuat daftar.
4. Tolak semua pertanyaan di luar data keuangan dan tracker ini dengan satu kalimat singkat: "Maaf, saya hanya menjawab seputar data keuangan dan catatan Expense Tracker ISZA FAMILY."
`.trim();

        const prompt = `
Berikut data Expense Tracker terkini:

${contextText}

Buat evaluasi ringkas dan tegas dalam 4 poin (DILARANG PAKAI BINTANG DAN PAGAR):
1. Resume Arus Kas: Saldo bersih dan kesehatan cashflow saat ini.
2. Pos Kritis & Boros: Pos pengeluaran terbesar yang perlu dipangkas.
3. Rencana & Servis: Pengingat planning terdekat atau jadwal servis kendaraan/rumah.
4. Tindakan Konkrit: 2 saran tindakan nyata untuk dieksekusi sekarang.
`.trim();

        const rawResult = await this.callGemini({ prompt, systemInstruction });
        return this.cleanMarkdownSymbols(rawResult);
    },

    async chatWithAssistant(userMessage, history, financialData, periodInfo = null) {
        const contextText = this.buildFinancialContext(financialData, periodInfo);

        const systemInstruction = `
Kamu adalah "Isza AI Financial Advisor" untuk Expense Tracker ISZA FAMILY.
ATURAN MUTLAK (WAJIB DIPATUHI):
1. JANGAN PERNAH MENGGUNAKAN SIMBOL BINTANG (*) ATAU PAGAR (#). Tulis teks polos tanpa formatting markdown bintang atau pagar.
2. Jawab secara TEGAS, RINGKAS, dan LANGSUNG MENJAWAB PERTANYAAN SAJA. Jangan bertele-tele, jangan mengulang sapaan, jangan memberi ceramah panjang.
3. AKURASI TANGGAL & RANGE WAKTU:
   - Jika pengguna menanyakan transaksi dalam rentang tanggal tertentu (misal: "tanggal 9 sampai 17"), telusuri SELURUH daftar transaksi di bawah yang memiliki tanggal dalam rentang tersebut (dari 2026-10-09 s/d 2026-10-17). Jangan melompati atau memotong tanggal 9, 10, 11 hanya karena letaknya di bawah.
4. BATASAN TOPIK (STRICT OUT-OF-CONTEXT REJECTION):
   - Kamu HANYA merespon pertanyaan tentang: data mutasi, saldo, pos pengeluaran/pemasukan, planning anggaran, logbook servis aset (kendaraan/rumah), serta strategi hemat uang keluarga.
   - JIKA PERTANYAAN DI LUAR DATA/TOPIK TRACKER INI (misal: tanya coding umum, resep masakan, pengetahuan umum, cuaca, politik, cerita, obrolan santai tanpa konteks keuangan): JANGAN DIJAWAB! LANGSUNG TOLAK DENGAN SATU KALIMAT TEGAS INI SAJA: "Maaf, saya hanya menjawab seputar data keuangan dan catatan Expense Tracker ISZA FAMILY."
5. Selalu rujuk fakta angka riil dari data tracker berikut:

${contextText}
`.trim();

        const reply = await this.callGemini({
            prompt: userMessage,
            systemInstruction,
            history
        });
        return this.cleanMarkdownSymbols(reply);
    }
};
