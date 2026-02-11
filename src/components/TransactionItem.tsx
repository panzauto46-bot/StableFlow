import React from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Send, 
  Receipt, 
  Download, 
  Wallet,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { Transaction } from '../models/User';

interface TransactionItemProps {
  transaction: Transaction;
  onClick?: (transaction: Transaction) => void;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, onClick }) => {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Math.abs(amount));
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getTransactionIcon = () => {
    switch (transaction.type) {
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

  const getStatusIcon = () => {
    switch (transaction.status) {
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'FAILED':
      case 'CANCELLED':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getIconBgColor = () => {
    switch (transaction.type) {
      case 'DEPOSIT':
        return 'bg-green-500/10';
      case 'WITHDRAWAL':
        return 'bg-red-500/10';
      case 'TRANSFER':
        return 'bg-blue-500/10';
      case 'PAYMENT':
        return 'bg-orange-500/10';
      case 'REIMBURSEMENT':
        return 'bg-purple-500/10';
      default:
        return 'bg-gray-500/10';
    }
  };

  return (
    <div
      id={`item_transaction_${transaction.id}`}
      onClick={() => onClick?.(transaction)}
      className="glass rounded-2xl p-4 hover:bg-white/10 transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div 
          id={`icon_container_${transaction.id}`}
          className={`w-12 h-12 rounded-xl ${getIconBgColor()} flex items-center justify-center`}
        >
          {getTransactionIcon()}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p 
              id={`text_description_${transaction.id}`}
              className="text-white font-medium text-sm truncate"
            >
              {transaction.description}
            </p>
            <span id={`icon_status_${transaction.id}`}>
              {getStatusIcon()}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <p 
              id={`text_date_${transaction.id}`}
              className="text-white/50 text-xs"
            >
              {formatDate(transaction.timestamp)}
            </p>
            {transaction.txHash && (
              <span className="text-white/30 text-xs truncate max-w-[80px]">
                • {transaction.txHash}
              </span>
            )}
          </div>
        </div>

        {/* Amount */}
        <div id={`container_amount_${transaction.id}`} className="text-right">
          <p 
            id={`text_amount_${transaction.id}`}
            className={`font-bold ${transaction.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}
          >
            {transaction.amount >= 0 ? '+' : '-'}${formatCurrency(transaction.amount)}
          </p>
          <p className="text-white/40 text-xs">USDC</p>
        </div>
      </div>
    </div>
  );
};

export default TransactionItem;
