import React, { useState, useEffect } from 'react';
import {
  LogOut,
  RefreshCw,
  Send,
  Download,
  QrCode,
  Receipt,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  Bell,
  Settings,
  Wallet,
  PieChart,
  FileText,
  Plus,
  ExternalLink,
  Copy,
  Eye,
  EyeOff,
  Building2,
} from 'lucide-react';
import { UserData, Transaction, mockTransactions } from '../models/User';
import { ExpenseRequest, ExpenseStatusLabels, ExpenseStatusColors, ExpenseCategoryLabels, ExpenseWithTx } from '../models/ExpenseRequest';
import { firebaseService } from '../services/FirebaseService';
import { solanaService } from '../services/SolanaService';
import useBalance from '../hooks/useBalance';
import SubmitExpenseModal from '../components/SubmitExpenseModal';

interface DashboardActivityProps {
  userData: UserData;
  onLogout: () => void;
  onSwitchToManager?: () => void;
}

const DashboardActivity: React.FC<DashboardActivityProps> = ({ userData, onLogout, onSwitchToManager }) => {
  const { balance, isLoading: balanceLoading, refreshBalance, lastUpdated } = useBalance(userData?.uid);
  const [transactions] = useState<Transaction[]>(mockTransactions);
  const [expenseRequests, setExpenseRequests] = useState<ExpenseWithTx[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'expenses'>('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSubmitExpense, setShowSubmitExpense] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [showWalletAddress, setShowWalletAddress] = useState(false);
  const [usdcBalance, setUsdcBalance] = useState<number>(0);
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(true);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [stats, setStats] = useState({
    totalIncome: 5780.00,
    totalExpense: 2250.50,
    pendingClaims: 0,
    approvedClaims: 0,
  });

  useEffect(() => {
    loadInitialData();

    // Subscribe to expenses
    const unsubscribe = firebaseService.subscribeToExpenses((expenses) => {
      const userExpenses = expenses.filter(e => e.userId === userData.uid);
      setExpenseRequests(userExpenses);

      // Update stats
      setStats(prev => ({
        ...prev,
        pendingClaims: userExpenses.filter(e => e.status === 'PENDING' || e.status === 'UNDER_REVIEW').length,
        approvedClaims: userExpenses.filter(e => e.status === 'APPROVED' || e.status === 'PAID').length,
      }));

      setIsLoadingExpenses(false);
    });

    return () => unsubscribe();
  }, [userData.uid]);

  const loadInitialData = async () => {
    // Load user wallet
    const wallet = await firebaseService.getUserWallet(userData.uid);
    setWalletAddress(wallet);

    // Load USDC balance if wallet exists
    if (wallet) {
      const walletInfo = await solanaService.getWalletInfo(wallet);
      setUsdcBalance(walletInfo.usdcBalance);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshBalance();

    if (walletAddress) {
      const walletInfo = await solanaService.getWalletInfo(walletAddress);
      setUsdcBalance(walletInfo.usdcBalance);
    }

    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const copyWalletAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
        return <ArrowDownLeft className="w-5 h-5 text-green-400" />;
      case 'WITHDRAWAL':
        return <ArrowUpRight className="w-5 h-5 text-red-400" />;
      case 'TRANSFER':
        return <Send className="w-5 h-5 text-blue-400" />;
      case 'PAYMENT':
        return <Receipt className="w-5 h-5 text-orange-400" />;
      case 'REIMBURSEMENT':
        return <Download className="w-5 h-5 text-purple-400" />;
      default:
        return <Wallet className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'APPROVED':
      case 'PAID':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'PENDING':
      case 'UNDER_REVIEW':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'FAILED':
      case 'REJECTED':
      case 'CANCELLED':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1628] via-[#142038] to-[#1e3a5f]">
      {/* Header - Navy Blue */}
      <header id="header_dashboard" className="bg-[#0a1628] border-b border-white/10 sticky top-0 z-50">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo & User Info */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#d4a940] to-[#f5d77e] flex items-center justify-center shadow-lg">
                <span className="text-[#0a1628] font-bold text-lg">
                  {userData.displayName?.charAt(0) || userData.email.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-white font-semibold text-sm">
                  {userData.displayName || 'User'}
                </h2>
                <p className="text-white/50 text-xs truncate max-w-[150px]">
                  {userData.email}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {/* Manager Dashboard Button (if applicable) */}
              {onSwitchToManager && (
                <button
                  id="btn_manager"
                  onClick={onSwitchToManager}
                  className="w-10 h-10 rounded-xl bg-[#d4a940]/20 flex items-center justify-center hover:bg-[#d4a940]/30 transition-colors"
                  title="Manager Dashboard"
                >
                  <Building2 className="w-5 h-5 text-[#d4a940]" />
                </button>
              )}
              <button
                id="btn_notifications"
                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors relative"
              >
                <Bell className="w-5 h-5 text-white/70" />
                {stats.pendingClaims > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#d4a940] rounded-full text-[10px] font-bold text-[#0a1628] flex items-center justify-center">
                    {stats.pendingClaims}
                  </span>
                )}
              </button>
              <button
                id="btn_settings"
                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <Settings className="w-5 h-5 text-white/70" />
              </button>
              <button
                id="btn_logout"
                onClick={onLogout}
                className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-colors"
              >
                <LogOut className="w-5 h-5 text-red-400" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 pb-24">
        {/* Balance Card - CardView Style */}
        <div id="card_balance" className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#142038] to-[#1e3a5f] border border-white/10 p-6 mb-6 shadow-2xl">
          {/* Background Pattern */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#d4a940]/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#d4a940]/5 rounded-full blur-2xl"></div>

          {/* Card Content */}
          <div className="relative z-10">
            {/* Header Row */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#d4a940]/20 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-[#d4a940]" />
                </div>
                <span className="text-white/70 text-sm font-medium">Saldo USDC</span>
              </div>
              <button
                id="btn_refresh_balance"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 text-white/70 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Balance Amount */}
            <div id="text_balance" className="mb-2">
              {balanceLoading ? (
                <div className="h-12 w-48 bg-white/10 rounded-lg animate-pulse"></div>
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold gold-text">
                    ${formatCurrency(balance + usdcBalance)}
                  </span>
                  <span className="text-white/50 text-sm">USDC</span>
                </div>
              )}
            </div>

            {/* Wallet Address */}
            {walletAddress && (
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => setShowWalletAddress(!showWalletAddress)}
                  className="text-white/40 hover:text-white/60"
                >
                  {showWalletAddress ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <span className="text-white/40 text-xs font-mono">
                  {showWalletAddress ? walletAddress : `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
                </span>
                <button
                  onClick={copyWalletAddress}
                  className="text-white/40 hover:text-white/60"
                >
                  <Copy className="w-4 h-4" />
                </button>
                {copiedAddress && (
                  <span className="text-green-400 text-xs">Copied!</span>
                )}
              </div>
            )}

            {/* Last Updated */}
            {lastUpdated && (
              <p className="text-white/40 text-xs mb-6">
                Terakhir diperbarui: {lastUpdated.toLocaleTimeString('id-ID')}
              </p>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-4 gap-3">
              <button className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-[#d4a940]/20 flex items-center justify-center">
                  <Send className="w-5 h-5 text-[#d4a940]" />
                </div>
                <span className="text-white/70 text-xs">Kirim</span>
              </button>
              <button className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <Download className="w-5 h-5 text-green-400" />
                </div>
                <span className="text-white/70 text-xs">Terima</span>
              </button>
              <button className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <QrCode className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-white/70 text-xs">Scan</span>
              </button>
              <button
                onClick={() => setShowSubmitExpense(true)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-purple-400" />
                </div>
                <span className="text-white/70 text-xs">Reimburse</span>
              </button>
            </div>
          </div>

          {/* Shimmer Effect */}
          <div className="absolute inset-0 shimmer pointer-events-none"></div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <span className="text-white/60 text-xs">Pemasukan</span>
            </div>
            <p className="text-white font-bold text-lg">+${formatCurrency(stats.totalIncome)}</p>
            <p className="text-green-400 text-xs mt-1">↑ 12.5% dari bulan lalu</p>
          </div>
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-5 h-5 text-red-400" />
              <span className="text-white/60 text-xs">Pengeluaran</span>
            </div>
            <p className="text-white font-bold text-lg">-${formatCurrency(stats.totalExpense)}</p>
            <p className="text-red-400 text-xs mt-1">↓ 8.2% dari bulan lalu</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 p-1 bg-white/5 rounded-xl mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'overview'
                ? 'bg-[#d4a940] text-[#0a1628]'
                : 'text-white/60 hover:text-white'
              }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'transactions'
                ? 'bg-[#d4a940] text-[#0a1628]'
                : 'text-white/60 hover:text-white'
              }`}
          >
            Transaksi
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all relative ${activeTab === 'expenses'
                ? 'bg-[#d4a940] text-[#0a1628]'
                : 'text-white/60 hover:text-white'
              }`}
          >
            Klaim
            {stats.pendingClaims > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                {stats.pendingClaims}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Portfolio Card */}
            <div className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">Portfolio</h3>
                <PieChart className="w-5 h-5 text-[#d4a940]" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <span className="text-blue-400 text-xs font-bold">U</span>
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">USDC</p>
                      <p className="text-white/50 text-xs">USD Coin</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white text-sm font-medium">${formatCurrency(balance + usdcBalance)}</p>
                    <p className="text-green-400 text-xs">100%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">Ringkasan Bulan Ini</h3>
                <FileText className="w-5 h-5 text-[#d4a940]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-white/50 text-xs mb-1">Total Transaksi</p>
                  <p className="text-white font-bold text-xl">{transactions.length + expenseRequests.length}</p>
                </div>
                <div>
                  <p className="text-white/50 text-xs mb-1">Klaim Pending</p>
                  <p className="text-[#d4a940] font-bold text-xl">{stats.pendingClaims}</p>
                </div>
              </div>
            </div>

            {/* Recent Expenses */}
            {expenseRequests.length > 0 && (
              <div className="glass rounded-2xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold">Klaim Terbaru</h3>
                  <button
                    onClick={() => setActiveTab('expenses')}
                    className="text-[#d4a940] text-xs font-medium flex items-center gap-1"
                  >
                    Lihat Semua <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  {expenseRequests.slice(0, 3).map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                      <div className="flex items-center gap-3">
                        <Receipt className="w-5 h-5 text-[#d4a940]" />
                        <div>
                          <p className="text-white text-sm">{expense.title}</p>
                          <span className={`text-xs ${ExpenseStatusColors[expense.status].text}`}>
                            {ExpenseStatusLabels[expense.status]}
                          </span>
                        </div>
                      </div>
                      <span className="text-white font-medium">${formatCurrency(expense.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'transactions' && (
          <div id="recycler_transactions" className="space-y-3">
            {transactions.map((txn) => (
              <div
                key={txn.id}
                className="glass rounded-2xl p-4 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                    {getTransactionIcon(txn.type)}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium text-sm truncate">
                        {txn.description}
                      </p>
                      {getStatusIcon(txn.status)}
                    </div>
                    <p className="text-white/50 text-xs mt-1">
                      {formatDate(txn.timestamp)}
                    </p>
                  </div>

                  {/* Amount */}
                  <div className="text-right">
                    <p className={`font-bold ${txn.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {txn.amount >= 0 ? '+' : ''}{formatCurrency(txn.amount)} USDC
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'expenses' && (
          <div id="recycler_expenses" className="space-y-3">
            {/* Add New Expense Button */}
            <button
              onClick={() => setShowSubmitExpense(true)}
              className="w-full glass rounded-2xl p-4 flex items-center justify-center gap-3 hover:bg-white/10 transition-colors border-2 border-dashed border-[#d4a940]/30"
            >
              <div className="w-10 h-10 rounded-xl bg-[#d4a940]/20 flex items-center justify-center">
                <Plus className="w-5 h-5 text-[#d4a940]" />
              </div>
              <span className="text-[#d4a940] font-medium">Ajukan Klaim Baru</span>
            </button>

            {/* Loading State */}
            {isLoadingExpenses ? (
              <div className="glass rounded-2xl p-8 text-center">
                <div className="w-8 h-8 border-2 border-[#d4a940] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-white/40">Memuat klaim...</p>
              </div>
            ) : expenseRequests.length === 0 ? (
              <div className="glass rounded-2xl p-8 text-center">
                <Receipt className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/40">Belum ada klaim yang diajukan</p>
                <p className="text-white/30 text-sm mt-1">Klik tombol di atas untuk mengajukan klaim</p>
              </div>
            ) : (
              /* Expense List */
              expenseRequests.map((expense) => (
                <div
                  key={expense.id}
                  className="glass rounded-2xl p-4 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    {/* Category Icon */}
                    <div className="w-12 h-12 rounded-xl bg-[#d4a940]/10 flex items-center justify-center flex-shrink-0">
                      <Receipt className="w-6 h-6 text-[#d4a940]" />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-white font-medium text-sm truncate pr-2">
                          {expense.title}
                        </p>
                        <ChevronRight className="w-4 h-4 text-white/30 flex-shrink-0" />
                      </div>
                      <p className="text-white/50 text-xs mb-2 line-clamp-1">
                        {expense.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ExpenseStatusColors[expense.status].bg} ${ExpenseStatusColors[expense.status].text}`}>
                            {ExpenseStatusLabels[expense.status]}
                          </span>
                          <span className="text-white/40 text-xs">
                            {ExpenseCategoryLabels[expense.category]}
                          </span>
                        </div>
                        <p className="text-[#d4a940] font-bold text-sm">
                          ${formatCurrency(expense.amount)}
                        </p>
                      </div>

                      {/* Transaction Link if Paid */}
                      {expense.status === 'PAID' && expense.txExplorerUrl && (
                        <a
                          href={expense.txExplorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 mt-2 text-green-400 text-xs hover:underline"
                        >
                          <CheckCircle className="w-3 h-3" />
                          <span>Lihat transaksi di Solana Explorer</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}

                      <p className="text-white/30 text-xs mt-2">
                        Diajukan: {formatDate(expense.submittedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0a1628] border-t border-white/10 px-6 py-4">
        <div className="flex items-center justify-around max-w-md mx-auto">
          <button className="flex flex-col items-center gap-1">
            <Wallet className="w-6 h-6 text-[#d4a940]" />
            <span className="text-[#d4a940] text-xs font-medium">Wallet</span>
          </button>
          <button className="flex flex-col items-center gap-1">
            <PieChart className="w-6 h-6 text-white/40" />
            <span className="text-white/40 text-xs">Analitik</span>
          </button>
          <button
            onClick={() => setShowSubmitExpense(true)}
            className="flex flex-col items-center gap-1 -mt-6"
          >
            <div className="w-14 h-14 rounded-full bg-gradient-to-r from-[#d4a940] to-[#f5d77e] flex items-center justify-center shadow-lg shadow-[#d4a940]/30">
              <Plus className="w-7 h-7 text-[#0a1628]" />
            </div>
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className="flex flex-col items-center gap-1 relative"
          >
            <Receipt className="w-6 h-6 text-white/40" />
            <span className="text-white/40 text-xs">Klaim</span>
            {stats.pendingClaims > 0 && (
              <span className="absolute -top-1 -right-2 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                {stats.pendingClaims}
              </span>
            )}
          </button>
          <button className="flex flex-col items-center gap-1">
            <Settings className="w-6 h-6 text-white/40" />
            <span className="text-white/40 text-xs">Pengaturan</span>
          </button>
        </div>
      </nav>

      {/* Submit Expense Modal */}
      <SubmitExpenseModal
        userId={userData.uid}
        isOpen={showSubmitExpense}
        onClose={() => setShowSubmitExpense(false)}
        onSuccess={() => {
          setActiveTab('expenses');
        }}
      />
    </div>
  );
};

export default DashboardActivity;
