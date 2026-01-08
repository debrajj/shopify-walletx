import React, { useState } from 'react';
import { Search, ShoppingBag, Coins, CreditCard, User, Phone } from 'lucide-react';
import { api } from '../services/api';
import { CustomerSummary, Transaction } from '../types';
import TransactionTable from '../components/TransactionTable';
import StatCard from '../components/StatCard';

const Customers: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState<CustomerSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    setHasSearched(true);
    setCustomer(null);
    setTransactions([]);

    try {
      // 1. Search for customer first
      const custData = await api.searchCustomer(searchTerm);
      setCustomer(custData);

      // 2. If customer exists, fetch their transactions using the real ID
      if (custData && custData.id) {
         const txData = await api.getCustomerTransactions(custData.id);
         setTransactions(txData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Customer Lookup</h1>
        <p className="text-sm text-slate-500 mt-1">Search for a customer to view their wallet balance and activity.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <form onSubmit={handleSearch} className="flex gap-4 max-w-2xl">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Search by phone number or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
        </div>
      )}

      {!loading && customer && (
        <div className="space-y-6 animate-fade-in">
          {/* Customer Profile Header */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700">
                <User className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{customer.name}</h2>
                <div className="flex items-center gap-2 text-slate-500 mt-1">
                  <Phone className="h-4 w-4" />
                  <span>{customer.phone}</span>
                </div>
              </div>
            </div>
            <div className="text-center md:text-right bg-emerald-50 p-4 rounded-xl border border-emerald-100">
              <p className="text-sm font-medium text-emerald-800 uppercase tracking-wide">Current Balance</p>
              <p className="text-3xl font-bold text-emerald-700 mt-1">{customer.balance} Coins</p>
            </div>
          </div>

          {/* Activity Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard 
              title="Total Orders Placed" 
              value={customer.total_orders} 
              icon={ShoppingBag} 
            />
            <StatCard 
              title="Total Order Value" 
              value={`$${customer.total_spent.toLocaleString()}`} 
              icon={CreditCard} 
            />
            <StatCard 
              title="Coins Used" 
              value={customer.total_coins_used} 
              icon={Coins} 
            />
          </div>

          {/* Recent History */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Recent Wallet Activity</h3>
            <TransactionTable transactions={transactions} showExpiry={true} />
          </div>
        </div>
      )}

      {!loading && hasSearched && !customer && (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
          <User className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-900">Customer Not Found</h3>
          <p className="text-slate-500">We couldn't find any wallet associated with that search term.</p>
        </div>
      )}
    </div>
  );
};

export default Customers;