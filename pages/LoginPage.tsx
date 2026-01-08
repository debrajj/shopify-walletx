import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, Store, ArrowRight, Loader2, Lock, Mail, User, Key } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LoginPage: React.FC = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    storeUrl: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (isLoginMode) {
        await login(formData.email, formData.password);
      } else {
        await signup({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          storeName: formData.storeUrl.split('.')[0] || 'My Store',
          storeUrl: formData.storeUrl
        });
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please check your details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
            <Wallet className="h-6 w-6" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-900">
          {isLoginMode ? 'Sign in to ShopWallet' : 'Create your account'}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          {isLoginMode ? "Don't have an account?" : "Already have an account?"}{' '}
          <button 
            onClick={() => {
              setIsLoginMode(!isLoginMode);
              setError('');
              setFormData({ name: '', email: '', password: '', storeUrl: '' });
            }}
            className="font-medium text-emerald-600 hover:text-emerald-500"
          >
            {isLoginMode ? 'Sign up free' : 'Log in here'}
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-xl sm:px-10 border border-slate-100">
          
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm font-medium border border-red-200">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            
            {!isLoginMode && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Full Name</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <User className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      name="name"
                      type="text"
                      required={!isLoginMode}
                      className="block w-full rounded-lg border-slate-300 pl-10 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2.5"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Shopify Store URL</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Store className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      name="storeUrl"
                      type="text"
                      required={!isLoginMode}
                      className="block w-full rounded-lg border-slate-300 pl-10 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2.5"
                      placeholder="store.myshopify.com"
                      value={formData.storeUrl}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700">Email Address</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  name="email"
                  type="email"
                  required
                  className="block w-full rounded-lg border-slate-300 pl-10 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2.5"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Key className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  className="block w-full rounded-lg border-slate-300 pl-10 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2.5"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full justify-center items-center gap-2 rounded-lg border border-transparent bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-70 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isLoginMode ? 'Signing In...' : 'Creating Account...'}
                </>
              ) : (
                <>
                  {isLoginMode ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-slate-500">Secured by Industry Standards</span>
              </div>
            </div>
            <div className="mt-4 flex justify-center gap-4">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Lock className="h-3 w-3" />
                    <span>SSL Encrypted</span>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;