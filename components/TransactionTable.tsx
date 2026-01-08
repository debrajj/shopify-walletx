import React from 'react';
import { Transaction } from '../types';
import { Calendar, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface TransactionTableProps {
  transactions: Transaction[];
  showExpiry?: boolean;
}

const TransactionTable: React.FC<TransactionTableProps> = ({ transactions, showExpiry = false }) => {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm ring-1 ring-slate-900/5">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50/50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Order Ref</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Customer</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Type</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Amount</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Date</th>
              {showExpiry && (
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Expiry</th>
              )}
              <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 bg-white">
            {transactions.map((txn) => (
              <tr key={txn.id} className="group hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-emerald-600 group-hover:text-emerald-700">{txn.order_id}</span>
                    {txn.order_amount != null && (
                      <span className="text-xs text-slate-400">Value: ${Number(txn.order_amount).toFixed(2)}</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-900">{txn.customer_name}</span>
                    <span className="text-xs text-slate-500">{txn.customer_phone}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                    txn.type === 'CREDIT' 
                      ? 'bg-blue-50 text-blue-700 ring-blue-600/10' 
                      : 'bg-orange-50 text-orange-700 ring-orange-600/10'
                  }`}>
                    {txn.type === 'CREDIT' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownLeft className="h-3 w-3" />}
                    {txn.type}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-sm font-bold ${
                    txn.type === 'CREDIT' ? 'text-blue-600' : 'text-slate-900'
                  }`}>
                    {txn.type === 'DEBIT' ? '-' : '+'}{txn.coins}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">
                  {new Date(txn.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
                {showExpiry && (
                  <td className="px-6 py-4">
                    {txn.expires_at ? (
                      <div className="flex items-center gap-1.5 text-xs font-medium text-orange-600 bg-orange-50 w-fit px-2 py-1 rounded-md">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(txn.expires_at).toLocaleDateString()}</span>
                      </div>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                )}
                <td className="px-6 py-4 text-right">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                    txn.status === 'COMPLETED' 
                      ? 'bg-emerald-50 text-emerald-700' 
                      : txn.status === 'FAILED' 
                      ? 'bg-red-50 text-red-700' 
                      : 'bg-yellow-50 text-yellow-700'
                  }`}>
                    <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
                      txn.status === 'COMPLETED' ? 'bg-emerald-500' : txn.status === 'FAILED' ? 'bg-red-500' : 'bg-yellow-500'
                    }`}></span>
                    {txn.status.charAt(0) + txn.status.slice(1).toLowerCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {transactions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <p className="text-sm">No transactions found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionTable;