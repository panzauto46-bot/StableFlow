import React from 'react';
import { ChevronRight, Receipt } from 'lucide-react';
import { 
  ExpenseRequest, 
  ExpenseStatusLabels, 
  ExpenseStatusColors, 
  ExpenseCategoryLabels 
} from '../models/ExpenseRequest';

interface ExpenseRequestItemProps {
  expense: ExpenseRequest;
  onClick?: (expense: ExpenseRequest) => void;
}

const ExpenseRequestItem: React.FC<ExpenseRequestItemProps> = ({ expense, onClick }) => {
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

  const statusColor = ExpenseStatusColors[expense.status];

  return (
    <div
      id={`item_expense_${expense.id}`}
      onClick={() => onClick?.(expense)}
      className="glass rounded-2xl p-4 hover:bg-white/10 transition-colors cursor-pointer"
    >
      <div className="flex items-start gap-4">
        {/* Category Icon */}
        <div 
          id={`icon_category_${expense.id}`}
          className="w-12 h-12 rounded-xl bg-[#d4a940]/10 flex items-center justify-center flex-shrink-0"
        >
          <Receipt className="w-6 h-6 text-[#d4a940]" />
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p 
              id={`text_title_${expense.id}`}
              className="text-white font-medium text-sm truncate pr-2"
            >
              {expense.title}
            </p>
            <ChevronRight className="w-4 h-4 text-white/30 flex-shrink-0" />
          </div>
          
          <p 
            id={`text_description_${expense.id}`}
            className="text-white/50 text-xs mb-2 line-clamp-1"
          >
            {expense.description}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span 
                id={`badge_status_${expense.id}`}
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor.bg} ${statusColor.text}`}
              >
                {ExpenseStatusLabels[expense.status]}
              </span>
              <span 
                id={`text_category_${expense.id}`}
                className="text-white/40 text-xs"
              >
                {ExpenseCategoryLabels[expense.category]}
              </span>
            </div>
            <p 
              id={`text_amount_${expense.id}`}
              className="text-[#d4a940] font-bold text-sm"
            >
              ${formatCurrency(expense.amount)}
            </p>
          </div>
          
          <p 
            id={`text_date_${expense.id}`}
            className="text-white/30 text-xs mt-2"
          >
            Diajukan: {formatDate(expense.submittedAt)}
          </p>
          
          {expense.processedAt && (
            <p 
              id={`text_processed_${expense.id}`}
              className="text-white/30 text-xs"
            >
              Diproses: {formatDate(expense.processedAt)}
              {expense.approvedBy && ` oleh ${expense.approvedBy}`}
            </p>
          )}
          
          {expense.rejectionReason && (
            <p 
              id={`text_rejection_${expense.id}`}
              className="text-red-400/70 text-xs mt-1"
            >
              Alasan: {expense.rejectionReason}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpenseRequestItem;
