import React, { useEffect, useState } from 'react';
import { Filter, Download, Calendar, ArrowRight } from 'lucide-react';
import TransactionTable from '../components/TransactionTable';
import { api } from '../services/api';
import { Transaction } from '../types';

const Reports: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'CREDIT' | 'DEBIT'>('ALL');
  const [dateRange, setDateRange] = useState('30_DAYS');
  const [showExpiringOnly, setShowExpiringOnly] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await api.getAllTransactions();
        setTransactions(data);
        setFilteredTransactions(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    let result = [...transactions];

    if (typeFilter !== 'ALL') {
      result = result.filter(t => t.type === typeFilter);
    }

    if (showExpiringOnly) {
      result = result.filter(t => t.type === 'CREDIT' && t.expires_at);
    }

    // Date Filtering
    // In a real app, we'd compare dates properly
    
    setFilteredTransactions(result);
  }, [typeFilter, dateRange, showExpiringOnly, transactions]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Deep dive into wallet usage and expiry reports.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm">
          <Download className="h-4 w-4" />
          Export Report
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-slate-900">
          <Filter className="h-4 w-4 text-emerald-600" />
          Filter Data
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
             <label className="block text-xs font-medium text-slate-500 mb-1.5">Transaction Type</label>
             <select 
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="block w-full rounded-lg border-slate-300 text-sm focus:ring-emerald-500 focus:border-emerald-500 p-2.5 bg-slate-50"
             >
                <option value="ALL">All Transactions</option>
                <option value="CREDIT">Credits Only</option>
                <option value="DEBIT">Usage (Debits) Only</option>
             </select>
          </div>
          <div>
             <label className="block text-xs font-medium text-slate-500 mb-1.5">Time Period</label>
             <select 
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="block w-full rounded-lg border-slate-300 text-sm focus:ring-emerald-500 focus:border-emerald-500 p-2.5 bg-slate-50"
             >
                <option value="7_DAYS">Last 7 Days</option>
                <option value="30_DAYS">Last 30 Days</option>
                <option value="90_DAYS">Last 3 Months</option>
                <option value="ALL">All Time</option>
             </select>
          </div>
          <div className="md:col-span-2 flex items-end">
             <label className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-200 w-full hover:bg-slate-50 cursor-pointer bg-white transition-colors">
                <input 
                  type="checkbox" 
                  checked={showExpiringOnly}
                  onChange={(e) => {
                    setShowExpiringOnly(e.target.checked);
                    if (e.target.checked) setTypeFilter('CREDIT');
                  }}
                  className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 border-slate-300" 
                />
                <span className="text-sm font-medium text-slate-700">Show only expiring credits</span>
             </label>
          </div>
        </div>
      </div>

      {/* Summary Chips */}
      <div className="flex flex-wrap gap-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-medium border border-blue-100">
           Total Credited: {filteredTransactions.filter(t => t.type === 'CREDIT').reduce((acc, curr) => acc + Number(curr.coins), 0).toFixed(2)} Coins
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 text-orange-700 text-sm font-medium border border-orange-100">
           Total Redeemed: {filteredTransactions.filter(t => t.type === 'DEBIT').reduce((acc, curr) => acc + Number(curr.coins), 0).toFixed(2)} Coins
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      ) : (
        <TransactionTable transactions={filteredTransactions} showExpiry={true} />
      )}
    </div>
  );
};

export default Reports;