import React, { useState } from 'react';
import { Search, ShoppingBag, Coins, CreditCard, User, Phone, Plus, X, CheckCircle2 } from 'lucide-react';
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

  // Add Coins Modal
  const [showAddCoinsModal, setShowAddCoinsModal] = useState(false);
  const [addCoinsForm, setAddCoinsForm] = useState({ coins: '', description: '' });
  const [addCoinsStatus, setAddCoinsStatus] = useState<'IDLE' | 'SUBMITTING' | 'SUCCESS'>('IDLE');

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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

  const handleAddCoins = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;

    setAddCoinsStatus('SUBMITTING');
    try {
      await api.addCoins({
        phone: customer.phone,
        coins: parseFloat(addCoinsForm.coins),
        description: addCoinsForm.description || 'Manual addition via Customer Profile'
      });
      setAddCoinsStatus('SUCCESS');
      
      // Refresh customer data
      const updatedCust = await api.searchCustomer(customer.phone);
      if (updatedCust && updatedCust.id) {
        setCustomer(updatedCust);
        const txData = await api.getCustomerTransactions(updatedCust.id);
        setTransactions(txData);
      }

      setTimeout(() => {
        setShowAddCoinsModal(false);
        setAddCoinsStatus('IDLE');
        setAddCoinsForm({ coins: '', description: '' });
      }, 1500);

    } catch (err) {
      console.error(err);
      setAddCoinsStatus('IDLE');
      alert('Failed to add coins.');
    }
  };

  return (
    <div className="space-y-6 relative">
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
            <div className="flex flex-col md:items-end gap-3">
              <div className="text-center md:text-right bg-emerald-50 p-4 rounded-xl border border-emerald-100 min-w-[200px]">
                <p className="text-sm font-medium text-emerald-800 uppercase tracking-wide">Current Balance</p>
                <p className="text-3xl font-bold text-emerald-700 mt-1">{customer.balance} Coins</p>
              </div>
              <button 
                onClick={() => setShowAddCoinsModal(true)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors w-full"
              >
                <Plus className="h-4 w-4" />
                Add Coins
              </button>
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

      {/* Add Coins Modal */}
      {showAddCoinsModal && customer && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in relative">
            {addCoinsStatus === 'SUCCESS' ? (
              <div className="p-8 text-center space-y-4">
                <div className="mx-auto h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Balance Updated!</h3>
                <p className="text-slate-500">Successfully added {addCoinsForm.coins} coins to {customer.name}.</p>
              </div>
            ) : (
              <>
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h2 className="text-lg font-bold text-slate-900">Add Coins Manually</h2>
                  <button 
                    onClick={() => setShowAddCoinsModal(false)} 
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-all"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <form onSubmit={handleAddCoins} className="p-6 space-y-4">
                   <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
                      <p className="text-sm text-slate-500">Adding to wallet of:</p>
                      <p className="font-semibold text-slate-900">{customer.name} <span className="text-slate-400 font-normal">({customer.phone})</span></p>
                   </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Amount (Coins)</label>
                    <input 
                      type="number" 
                      required
                      min="1"
                      placeholder="e.g. 100"
                      value={addCoinsForm.coins}
                      onChange={(e) => setAddCoinsForm({...addCoinsForm, coins: e.target.value})}
                      className="block w-full rounded-lg border-slate-300 focus:ring-emerald-500 focus:border-emerald-500 p-2.5 border text-sm shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Reason / Note</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Refund #1001"
                      value={addCoinsForm.description}
                      onChange={(e) => setAddCoinsForm({...addCoinsForm, description: e.target.value})}
                      className="block w-full rounded-lg border-slate-300 focus:ring-emerald-500 focus:border-emerald-500 p-2.5 border text-sm shadow-sm"
                    />
                  </div>
                  <div className="pt-2 flex justify-end gap-3">
                    <button 
                      type="button"
                      onClick={() => setShowAddCoinsModal(false)}
                      className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-200/50 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={addCoinsStatus === 'SUBMITTING'}
                      className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
                    >
                      {addCoinsStatus === 'SUBMITTING' ? 'Updating...' : 'Add Coins'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;