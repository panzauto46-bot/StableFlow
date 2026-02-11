import React from 'react';
import { Wallet, RefreshCw, Send, Download, QrCode, Receipt } from 'lucide-react';

interface BalanceCardProps {
  balance: number;
  isLoading: boolean;
  isRefreshing: boolean;
  lastUpdated: Date | null;
  onRefresh: () => void;
  onSend?: () => void;
  onReceive?: () => void;
  onScan?: () => void;
  onReimburse?: () => void;
}

const BalanceCard: React.FC<BalanceCardProps> = ({
  balance,
  isLoading,
  isRefreshing,
  lastUpdated,
  onRefresh,
  onSend,
  onReceive,
  onScan,
  onReimburse
}) => {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div 
      id="card_view_balance" 
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#142038] to-[#1e3a5f] border border-white/10 p-6 shadow-2xl"
    >
      {/* Background Pattern */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-[#d4a940]/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#d4a940]/5 rounded-full blur-2xl"></div>
      
      {/* Card Content */}
      <div className="relative z-10">
        {/* Header Row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div 
              id="icon_wallet" 
              className="w-8 h-8 rounded-lg bg-[#d4a940]/20 flex items-center justify-center"
            >
              <Wallet className="w-5 h-5 text-[#d4a940]" />
            </div>
            <span id="label_balance" className="text-white/70 text-sm font-medium">
              Saldo USDC
            </span>
          </div>
          <button
            id="btn_refresh"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors disabled:opacity-50"
            aria-label="Refresh balance"
          >
            <RefreshCw className={`w-4 h-4 text-white/70 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Balance Amount */}
        <div id="container_balance_amount" className="mb-2">
          {isLoading ? (
            <div 
              id="skeleton_balance" 
              className="h-12 w-48 bg-white/10 rounded-lg animate-pulse"
            ></div>
          ) : (
            <div className="flex items-baseline gap-2">
              <span 
                id="text_balance_amount" 
                className="text-4xl font-bold gold-text"
              >
                ${formatCurrency(balance)}
              </span>
              <span 
                id="text_currency_label" 
                className="text-white/50 text-sm"
              >
                USDC
              </span>
            </div>
          )}
        </div>

        {/* Last Updated */}
        {lastUpdated && (
          <p id="text_last_updated" className="text-white/40 text-xs mb-6">
            Terakhir diperbarui: {lastUpdated.toLocaleTimeString('id-ID')}
          </p>
        )}

        {/* Quick Actions */}
        <div id="container_quick_actions" className="grid grid-cols-4 gap-3">
          <button 
            id="btn_send"
            onClick={onSend}
            className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-[#d4a940]/20 flex items-center justify-center">
              <Send className="w-5 h-5 text-[#d4a940]" />
            </div>
            <span className="text-white/70 text-xs">Kirim</span>
          </button>
          
          <button 
            id="btn_receive"
            onClick={onReceive}
            className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Download className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-white/70 text-xs">Terima</span>
          </button>
          
          <button 
            id="btn_scan"
            onClick={onScan}
            className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <QrCode className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-white/70 text-xs">Scan</span>
          </button>
          
          <button 
            id="btn_reimburse"
            onClick={onReimburse}
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
  );
};

export default BalanceCard;
