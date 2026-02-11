import React, { useState, useEffect } from 'react';
import {
    CheckCircle,
    XCircle,
    Clock,
    DollarSign,
    Users,
    TrendingUp,
    AlertCircle,
    ExternalLink,
    Send,
    RefreshCw,
    Search,
    Filter,
    ChevronDown,
    Wallet,
    CreditCard,
    Building2,
    Receipt,
    ArrowRight,
    X,
} from 'lucide-react';
import { ExpenseWithTx, Employee, firebaseService } from '../services/FirebaseService';
import { solanaService, PaymentRequest } from '../services/SolanaService';
import { ExpenseStatusLabels, ExpenseStatusColors, ExpenseCategoryLabels, ExpenseCategory } from '../models/ExpenseRequest';

interface ManagerDashboardProps {
    userRole: 'MANAGER' | 'ADMIN';
    userName: string;
    onBack?: () => void;
}

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ userRole, userName, onBack }) => {
    const [expenses, setExpenses] = useState<ExpenseWithTx[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedExpense, setSelectedExpense] = useState<ExpenseWithTx | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [stats, setStats] = useState({
        totalPending: 0,
        totalApproved: 0,
        totalPaid: 0,
        totalRejected: 0,
        pendingAmount: 0,
        paidAmount: 0,
    });
    const [treasuryBalance, setTreasuryBalance] = useState({ sol: 0, usdc: 0 });
    const [treasuryAddress, setTreasuryAddress] = useState<string | null>(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    useEffect(() => {
        initializeDashboard();
    }, []);

    const initializeDashboard = async () => {
        setIsLoading(true);

        // Initialize Solana treasury
        await solanaService.initializeTreasury();
        setTreasuryAddress(solanaService.getTreasuryAddress());

        // Subscribe to expenses
        const unsubExpenses = firebaseService.subscribeToExpenses((data) => {
            setExpenses(data);
            calculateStats(data);
        });

        // Subscribe to employees
        const unsubEmployees = firebaseService.subscribeToEmployees((data) => {
            setEmployees(data);
        });

        // Get treasury balance
        const balance = await solanaService.getTreasuryBalance();
        setTreasuryBalance(balance);

        setIsLoading(false);

        return () => {
            unsubExpenses();
            unsubEmployees();
        };
    };

    const calculateStats = (expenseData: ExpenseWithTx[]) => {
        setStats({
            totalPending: expenseData.filter(e => e.status === 'PENDING' || e.status === 'UNDER_REVIEW').length,
            totalApproved: expenseData.filter(e => e.status === 'APPROVED').length,
            totalPaid: expenseData.filter(e => e.status === 'PAID').length,
            totalRejected: expenseData.filter(e => e.status === 'REJECTED').length,
            pendingAmount: expenseData
                .filter(e => e.status === 'PENDING' || e.status === 'UNDER_REVIEW' || e.status === 'APPROVED')
                .reduce((sum, e) => sum + e.amount, 0),
            paidAmount: expenseData
                .filter(e => e.status === 'PAID')
                .reduce((sum, e) => sum + e.amount, 0),
        });
    };

    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 5000);
    };

    const handleApprove = async (expense: ExpenseWithTx) => {
        setIsProcessing(true);

        try {
            // Update status to approved
            const result = await firebaseService.updateExpenseStatus(
                expense.id,
                'APPROVED',
                userName
            );

            if (result.success) {
                showNotification('success', `Klaim "${expense.title}" telah disetujui`);
                setSelectedExpense(null);
            } else {
                showNotification('error', result.error || 'Gagal menyetujui klaim');
            }
        } catch (error: any) {
            showNotification('error', error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!selectedExpense || !rejectionReason.trim()) {
            showNotification('error', 'Alasan penolakan harus diisi');
            return;
        }

        setIsProcessing(true);

        try {
            const result = await firebaseService.updateExpenseStatus(
                selectedExpense.id,
                'REJECTED',
                userName,
                rejectionReason
            );

            if (result.success) {
                showNotification('success', `Klaim "${selectedExpense.title}" telah ditolak`);
                setSelectedExpense(null);
                setShowRejectModal(false);
                setRejectionReason('');
            } else {
                showNotification('error', result.error || 'Gagal menolak klaim');
            }
        } catch (error: any) {
            showNotification('error', error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePayment = async (expense: ExpenseWithTx) => {
        setIsProcessing(true);

        try {
            // Get employee wallet
            const employee = employees.find(e => e.uid === expense.userId);
            const walletAddress = employee?.walletAddress || await firebaseService.getUserWallet(expense.userId);

            if (!walletAddress) {
                showNotification('error', 'Karyawan belum memiliki wallet address');
                setIsProcessing(false);
                return;
            }

            // Process payment
            const paymentRequest: PaymentRequest = {
                employeeId: expense.userId,
                employeeName: employee?.displayName || 'Unknown',
                walletAddress,
                amount: expense.amount,
                reason: expense.title,
                expenseId: expense.id,
            };

            const result = await solanaService.processPayment(paymentRequest);

            if (result.success && result.signature) {
                // Mark expense as paid
                await firebaseService.markExpenseAsPaid(
                    expense.id,
                    result.signature,
                    result.explorerUrl || '',
                    treasuryAddress || ''
                );

                // Record payment
                await firebaseService.recordPayment({
                    expenseId: expense.id,
                    employeeId: expense.userId,
                    employeeName: employee?.displayName || 'Unknown',
                    amount: expense.amount,
                    walletAddress,
                    txSignature: result.signature,
                    txExplorerUrl: result.explorerUrl || '',
                    status: 'SUCCESS',
                    createdAt: new Date().toISOString(),
                    processedBy: userName,
                });

                showNotification('success', `Pembayaran ${expense.amount} USDC berhasil dikirim!`);
                setSelectedExpense(null);

                // Refresh treasury balance
                const balance = await solanaService.getTreasuryBalance();
                setTreasuryBalance(balance);
            } else {
                showNotification('error', result.error || 'Pembayaran gagal');
            }
        } catch (error: any) {
            showNotification('error', error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const filteredExpenses = expenses.filter(expense => {
        const matchesStatus = filterStatus === 'ALL' || expense.status === filterStatus;
        const matchesSearch = expense.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            expense.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#0a1628] via-[#142038] to-[#1e3a5f] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-[#d4a940] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-white/60">Memuat dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0a1628] via-[#142038] to-[#1e3a5f]">
            {/* Notification */}
            {notification && (
                <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3
          ${notification.type === 'success' ? 'bg-green-500/90' : 'bg-red-500/90'}`}>
                    {notification.type === 'success' ? (
                        <CheckCircle className="w-5 h-5 text-white" />
                    ) : (
                        <AlertCircle className="w-5 h-5 text-white" />
                    )}
                    <span className="text-white font-medium">{notification.message}</span>
                    <button onClick={() => setNotification(null)} className="ml-2">
                        <X className="w-4 h-4 text-white/70 hover:text-white" />
                    </button>
                </div>
            )}

            {/* Header */}
            <header className="bg-[#0a1628] border-b border-white/10 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#d4a940] to-[#f5d77e] flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-[#0a1628]" />
                            </div>
                            <div>
                                <h1 className="text-white text-xl font-bold">StableFlow Manager</h1>
                                <p className="text-white/50 text-sm">Dashboard Persetujuan Klaim</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Treasury Balance */}
                            <div className="glass rounded-xl px-4 py-2">
                                <p className="text-white/50 text-xs">Treasury Balance</p>
                                <p className="text-[#d4a940] font-bold">${formatCurrency(treasuryBalance.usdc)} USDC</p>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-white/60 text-sm">{userName}</span>
                                <span className="px-2 py-1 bg-[#d4a940]/20 text-[#d4a940] text-xs font-medium rounded-lg">
                                    {userRole}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="glass rounded-2xl p-6 hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                                <Clock className="w-7 h-7 text-yellow-400" />
                            </div>
                            <div>
                                <p className="text-white/50 text-sm">Menunggu Review</p>
                                <p className="text-white text-3xl font-bold">{stats.totalPending}</p>
                            </div>
                        </div>
                    </div>

                    <div className="glass rounded-2xl p-6 hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl bg-green-500/20 flex items-center justify-center">
                                <CheckCircle className="w-7 h-7 text-green-400" />
                            </div>
                            <div>
                                <p className="text-white/50 text-sm">Disetujui</p>
                                <p className="text-white text-3xl font-bold">{stats.totalApproved}</p>
                            </div>
                        </div>
                    </div>

                    <div className="glass rounded-2xl p-6 hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl bg-[#d4a940]/20 flex items-center justify-center">
                                <DollarSign className="w-7 h-7 text-[#d4a940]" />
                            </div>
                            <div>
                                <p className="text-white/50 text-sm">Total Dibayar</p>
                                <p className="text-white text-3xl font-bold">${formatCurrency(stats.paidAmount)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="glass rounded-2xl p-6 hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                <TrendingUp className="w-7 h-7 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-white/50 text-sm">Pending Amount</p>
                                <p className="text-white text-3xl font-bold">${formatCurrency(stats.pendingAmount)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <input
                            type="text"
                            placeholder="Cari klaim..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full py-3 pl-12 pr-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#d4a940] transition-colors"
                        />
                    </div>

                    <div className="flex gap-2">
                        {['ALL', 'PENDING', 'APPROVED', 'PAID', 'REJECTED'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all
                  ${filterStatus === status
                                        ? 'bg-[#d4a940] text-[#0a1628]'
                                        : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                                    }`}
                            >
                                {status === 'ALL' ? 'Semua' : ExpenseStatusLabels[status as keyof typeof ExpenseStatusLabels]}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Expense List */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Expense Cards */}
                    <div className="space-y-4">
                        <h3 className="text-white font-semibold flex items-center gap-2">
                            <Receipt className="w-5 h-5 text-[#d4a940]" />
                            Daftar Klaim ({filteredExpenses.length})
                        </h3>

                        {filteredExpenses.length === 0 ? (
                            <div className="glass rounded-2xl p-8 text-center">
                                <Receipt className="w-12 h-12 text-white/20 mx-auto mb-3" />
                                <p className="text-white/40">Tidak ada klaim yang ditemukan</p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                                {filteredExpenses.map((expense) => (
                                    <div
                                        key={expense.id}
                                        onClick={() => setSelectedExpense(expense)}
                                        className={`glass rounded-2xl p-4 cursor-pointer transition-all hover:bg-white/10
                      ${selectedExpense?.id === expense.id ? 'ring-2 ring-[#d4a940]' : ''}`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-[#d4a940]/10 flex items-center justify-center flex-shrink-0">
                                                <Receipt className="w-6 h-6 text-[#d4a940]" />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <p className="text-white font-medium truncate pr-2">{expense.title}</p>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium
                            ${ExpenseStatusColors[expense.status].bg} ${ExpenseStatusColors[expense.status].text}`}>
                                                        {ExpenseStatusLabels[expense.status]}
                                                    </span>
                                                </div>
                                                <p className="text-white/50 text-sm line-clamp-1 mb-2">{expense.description}</p>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-white/40 text-xs">
                                                        {formatDate(expense.submittedAt)}
                                                    </span>
                                                    <span className="text-[#d4a940] font-bold">
                                                        ${formatCurrency(expense.amount)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Detail Panel */}
                    <div className="lg:sticky lg:top-24">
                        {selectedExpense ? (
                            <div className="glass rounded-2xl p-6">
                                <h3 className="text-white font-semibold mb-4">Detail Klaim</h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-white/50 text-xs">Judul</label>
                                        <p className="text-white font-medium">{selectedExpense.title}</p>
                                    </div>

                                    <div>
                                        <label className="text-white/50 text-xs">Deskripsi</label>
                                        <p className="text-white/80 text-sm">{selectedExpense.description}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-white/50 text-xs">Jumlah</label>
                                            <p className="text-[#d4a940] font-bold text-xl">${formatCurrency(selectedExpense.amount)} USDC</p>
                                        </div>
                                        <div>
                                            <label className="text-white/50 text-xs">Kategori</label>
                                            <p className="text-white">{ExpenseCategoryLabels[selectedExpense.category]}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-white/50 text-xs">Status</label>
                                            <span className={`inline-block px-2 py-1 rounded-lg text-xs font-medium mt-1
                        ${ExpenseStatusColors[selectedExpense.status].bg} ${ExpenseStatusColors[selectedExpense.status].text}`}>
                                                {ExpenseStatusLabels[selectedExpense.status]}
                                            </span>
                                        </div>
                                        <div>
                                            <label className="text-white/50 text-xs">Tanggal Submit</label>
                                            <p className="text-white/80 text-sm">{formatDate(selectedExpense.submittedAt)}</p>
                                        </div>
                                    </div>

                                    {/* Receipt Image */}
                                    {selectedExpense.receiptUrl && (
                                        <div>
                                            <label className="text-white/50 text-xs">Struk/Bukti</label>
                                            <img
                                                src={selectedExpense.receiptUrl}
                                                alt="Receipt"
                                                className="mt-2 rounded-lg max-h-48 object-cover"
                                            />
                                        </div>
                                    )}

                                    {/* Transaction Info (if paid) */}
                                    {selectedExpense.txSignature && (
                                        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                                            <label className="text-green-400 text-xs font-medium">Transaksi Blockchain</label>
                                            <a
                                                href={selectedExpense.txExplorerUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 text-green-400 hover:underline mt-1"
                                            >
                                                <span className="font-mono text-sm truncate">{selectedExpense.txSignature.slice(0, 20)}...</span>
                                                <ExternalLink className="w-4 h-4 flex-shrink-0" />
                                            </a>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="pt-4 border-t border-white/10 space-y-3">
                                        {(selectedExpense.status === 'PENDING' || selectedExpense.status === 'UNDER_REVIEW') && (
                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    onClick={() => handleApprove(selectedExpense)}
                                                    disabled={isProcessing}
                                                    className="py-3 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                                >
                                                    <CheckCircle className="w-5 h-5" />
                                                    Setujui
                                                </button>
                                                <button
                                                    onClick={() => setShowRejectModal(true)}
                                                    disabled={isProcessing}
                                                    className="py-3 bg-red-500/20 text-red-400 font-semibold rounded-xl hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                                >
                                                    <XCircle className="w-5 h-5" />
                                                    Tolak
                                                </button>
                                            </div>
                                        )}

                                        {selectedExpense.status === 'APPROVED' && (
                                            <button
                                                onClick={() => handlePayment(selectedExpense)}
                                                disabled={isProcessing}
                                                className="w-full py-4 bg-gradient-to-r from-[#d4a940] to-[#f5d77e] text-[#0a1628] font-bold rounded-xl hover:shadow-lg hover:shadow-[#d4a940]/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                            >
                                                {isProcessing ? (
                                                    <>
                                                        <div className="w-5 h-5 border-2 border-[#0a1628]/20 border-t-[#0a1628] rounded-full animate-spin" />
                                                        <span>Memproses Pembayaran...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send className="w-5 h-5" />
                                                        <span>Kirim {formatCurrency(selectedExpense.amount)} USDC</span>
                                                        <ArrowRight className="w-5 h-5" />
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="glass rounded-2xl p-8 text-center">
                                <Wallet className="w-16 h-16 text-white/10 mx-auto mb-4" />
                                <p className="text-white/40">Pilih klaim untuk melihat detail</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass rounded-2xl p-6 max-w-md w-full">
                        <h3 className="text-white font-semibold mb-4">Tolak Klaim</h3>
                        <p className="text-white/60 text-sm mb-4">
                            Berikan alasan penolakan untuk "{selectedExpense?.title}"
                        </p>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Alasan penolakan..."
                            rows={4}
                            className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-red-500 resize-none"
                        />
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setRejectionReason('');
                                }}
                                className="flex-1 py-3 bg-white/5 text-white font-medium rounded-xl hover:bg-white/10 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={isProcessing || !rejectionReason.trim()}
                                className="flex-1 py-3 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
                            >
                                {isProcessing ? 'Memproses...' : 'Tolak Klaim'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagerDashboard;
