/**
 * Wallet Widget - Script Tag Version
 * 
 * This can be injected via Shopify Script Tag API
 * No theme editing required!
 * 
 * Installation:
 * 1. Add this script via Shopify Admin API
 * 2. Or add manually: Settings → Checkout → Additional scripts
 */

(function() {
  'use strict';

  const CONFIG = {
    API_BASE: 'https://shopify-walletx.onrender.com/api',
    SHOP_DOMAIN: window.Shopify?.shop || '',
  };

  // Only run on cart or checkout pages
  const isCartPage = window.location.pathname.includes('/cart');
  const isCheckoutPage = window.location.pathname.includes('/checkout');
  
  if (!isCartPage && !isCheckoutPage) return;

  // Create widget HTML
  const widgetHTML = `
    <div id="wallet-widget-container" style="margin: 20px 0; padding: 20px; border: 2px solid #e0e0e0; border-radius: 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <h3 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; text-align: center;">💰 Use Your Wallet Coins</h3>
      
      <!-- Step 1: Phone Input -->
      <div id="wallet-step-phone" style="display: block;">
        <p style="margin: 0 0 12px 0; font-size: 14px; opacity: 0.9;">Enter your phone number</p>
        <input 
          type="tel" 
          id="wallet-phone-input" 
          placeholder="+1234567890"
          style="width: 100%; padding: 12px; border: 2px solid rgba(255,255,255,0.3); border-radius: 8px; font-size: 16px; background: rgba(255,255,255,0.1); color: white; margin-bottom: 12px; box-sizing: border-box;"
        />
        <button 
          id="wallet-send-otp-btn" 
          style="width: 100%; padding: 14px; background: white; color: #667eea; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.2s;"
        >
          Send OTP
        </button>
      </div>

      <!-- Step 2: OTP Verification -->
      <div id="wallet-step-otp" style="display: none;">
        <p style="margin: 0 0 12px 0; font-size: 14px; opacity: 0.9;">Enter OTP sent to <span id="wallet-phone-display"></span></p>
        <input 
          type="number" 
          id="wallet-otp-input" 
          placeholder="123456"
          style="width: 100%; padding: 12px; border: 2px solid rgba(255,255,255,0.3); border-radius: 8px; font-size: 16px; background: rgba(255,255,255,0.1); color: white; margin-bottom: 12px; box-sizing: border-box;"
        />
        <button 
          id="wallet-verify-otp-btn" 
          style="width: 100%; padding: 14px; background: white; color: #667eea; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; margin-bottom: 10px;"
        >
          Verify OTP
        </button>
        <button 
          id="wallet-change-phone-btn" 
          style="width: 100%; padding: 12px; background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3); border-radius: 8px; font-size: 14px; cursor: pointer;"
        >
          Change Phone Number
        </button>
      </div>

      <!-- Step 3: Wallet Balance -->
      <div id="wallet-step-balance" style="display: none;">
        <div style="background: rgba(255,255,255,0.15); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 16px; backdrop-filter: blur(10px);">
          <p style="margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.8;">Available Balance</p>
          <p id="wallet-balance-amount" style="margin: 0; font-size: 48px; font-weight: 700; line-height: 1;">0</p>
          <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.8;">Coins</p>
        </div>
        
        <div id="wallet-has-balance" style="display: none;">
          <input 
            type="number" 
            id="wallet-coins-input" 
            placeholder="Enter coins to use"
            style="width: 100%; padding: 12px; border: 2px solid rgba(255,255,255,0.3); border-radius: 8px; font-size: 16px; background: rgba(255,255,255,0.1); color: white; margin-bottom: 12px; box-sizing: border-box;"
          />
          <button 
            id="wallet-apply-coins-btn" 
            style="width: 100%; padding: 14px; background: white; color: #667eea; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; margin-bottom: 10px;"
          >
            Apply Coins
          </button>
        </div>
        
        <div id="wallet-no-balance" style="display: none;">
          <p style="margin: 0 0 12px 0; font-size: 14px; opacity: 0.8;">You don't have any coins yet.</p>
        </div>
        
        <button 
          id="wallet-use-different-phone-btn" 
          style="width: 100%; padding: 12px; background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3); border-radius: 8px; font-size: 14px; cursor: pointer;"
        >
          Use Different Phone
        </button>
      </div>

      <!-- Messages -->
      <div id="wallet-message" style="margin-top: 12px; padding: 12px; border-radius: 8px; font-size: 14px; text-align: center; display: none;"></div>
      
      <!-- Loading -->
      <div id="wallet-loading" style="display: none; text-align: center; padding: 20px;">
        <div style="border: 3px solid rgba(255,255,255,0.3); border-top: 3px solid white; border-radius: 50%; width: 40px; height: 40px; animation: wallet-spin 1s linear infinite; margin: 0 auto;"></div>
      </div>
    </div>

    <style>
      @keyframes wallet-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      #wallet-widget-container input::placeholder {
        color: rgba(255,255,255,0.6);
      }
      
      #wallet-widget-container input:focus {
        outline: none;
        border-color: rgba(255,255,255,0.6);
        background: rgba(255,255,255,0.15);
      }
      
      #wallet-widget-container button:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      }
      
      #wallet-widget-container button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    </style>
  `;

  // State
  let state = {
    phone: '',
    otpSessionId: '',
    balance: 0,
  };

  // Initialize widget
  function initWidget() {
    // Find cart form or checkout container
    const cartForm = document.querySelector('form[action="/cart"]') || 
                     document.querySelector('.cart') ||
                     document.querySelector('#cart') ||
                     document.querySelector('main');
    
    if (!cartForm) {
      console.warn('Wallet Widget: Could not find cart container');
      return;
    }

    // Insert widget
    const widgetDiv = document.createElement('div');
    widgetDiv.innerHTML = widgetHTML;
    cartForm.insertBefore(widgetDiv.firstElementChild, cartForm.firstChild);

    // Attach event listeners
    attachEventListeners();

    // Auto-fill phone if customer is logged in
    if (window.Shopify?.customer?.phone) {
      document.getElementById('wallet-phone-input').value = window.Shopify.customer.phone;
    }
  }

  // Attach event listeners
  function attachEventListeners() {
    document.getElementById('wallet-send-otp-btn').addEventListener('click', sendOTP);
    document.getElementById('wallet-verify-otp-btn').addEventListener('click', verifyOTP);
    document.getElementById('wallet-change-phone-btn').addEventListener('click', () => showStep('phone'));
    document.getElementById('wallet-apply-coins-btn').addEventListener('click', applyCoins);
    document.getElementById('wallet-use-different-phone-btn').addEventListener('click', () => showStep('phone'));

    // Enter key support
    document.getElementById('wallet-phone-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendOTP();
    });
    document.getElementById('wallet-otp-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') verifyOTP();
    });
  }

  // Show step
  function showStep(step) {
    document.getElementById('wallet-step-phone').style.display = step === 'phone' ? 'block' : 'none';
    document.getElementById('wallet-step-otp').style.display = step === 'otp' ? 'block' : 'none';
    document.getElementById('wallet-step-balance').style.display = step === 'balance' ? 'block' : 'none';
    hideMessage();
  }

  // Show message
  function showMessage(text, type) {
    const msgEl = document.getElementById('wallet-message');
    msgEl.textContent = text;
    msgEl.style.display = 'block';
    msgEl.style.background = type === 'error' ? 'rgba(244, 67, 54, 0.3)' : 
                             type === 'success' ? 'rgba(76, 175, 80, 0.3)' : 
                             'rgba(255, 152, 0, 0.3)';
    msgEl.style.border = `1px solid ${type === 'error' ? 'rgba(244, 67, 54, 0.5)' : 
                                      type === 'success' ? 'rgba(76, 175, 80, 0.5)' : 
                                      'rgba(255, 152, 0, 0.5)'}`;
  }

  function hideMessage() {
    document.getElementById('wallet-message').style.display = 'none';
  }

  // Show loading
  function showLoading(show) {
    document.getElementById('wallet-loading').style.display = show ? 'block' : 'none';
    const buttons = document.querySelectorAll('#wallet-widget-container button');
    buttons.forEach(btn => btn.disabled = show);
  }

  // Send OTP
  async function sendOTP() {
    const phone = document.getElementById('wallet-phone-input').value.trim();
    
    if (!phone) {
      showMessage('Please enter your phone number', 'error');
      return;
    }

    state.phone = phone;
    showLoading(true);
    hideMessage();

    try {
      const response = await fetch(`${CONFIG.API_BASE}/otp/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-shop-url': CONFIG.SHOP_DOMAIN,
        },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();

      if (data.success) {
        state.otpSessionId = data.otpSessionId;
        document.getElementById('wallet-phone-display').textContent = phone;
        showStep('otp');
        showMessage('OTP sent to your phone!', 'success');
      } else {
        showMessage(data.message || 'Failed to send OTP', 'error');
      }
    } catch (error) {
      showMessage('Network error. Please try again.', 'error');
    } finally {
      showLoading(false);
    }
  }

  // Verify OTP
  async function verifyOTP() {
    const otp = document.getElementById('wallet-otp-input').value.trim();
    
    if (!otp) {
      showMessage('Please enter the OTP', 'error');
      return;
    }

    showLoading(true);
    hideMessage();

    try {
      const response = await fetch(`${CONFIG.API_BASE}/otp/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-shop-url': CONFIG.SHOP_DOMAIN,
        },
        body: JSON.stringify({
          otpSessionId: state.otpSessionId,
          otp: otp,
        }),
      });

      const data = await response.json();

      if (data.success && data.verified) {
        await fetchBalance();
        showStep('balance');
        showMessage('Verified successfully!', 'success');
      } else {
        showMessage('Invalid OTP. Please try again.', 'error');
      }
    } catch (error) {
      showMessage('Network error. Please try again.', 'error');
    } finally {
      showLoading(false);
    }
  }

  // Fetch balance
  async function fetchBalance() {
    try {
      const response = await fetch(
        `${CONFIG.API_BASE}/wallet/balance?phone=${encodeURIComponent(state.phone)}`,
        {
          headers: {
            'x-shop-url': CONFIG.SHOP_DOMAIN,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        state.balance = data.walletCoins || 0;
        document.getElementById('wallet-balance-amount').textContent = state.balance;
        
        if (state.balance > 0) {
          document.getElementById('wallet-has-balance').style.display = 'block';
          document.getElementById('wallet-no-balance').style.display = 'none';
        } else {
          document.getElementById('wallet-has-balance').style.display = 'none';
          document.getElementById('wallet-no-balance').style.display = 'block';
        }
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  }

  // Apply coins
  async function applyCoins() {
    const coinsInput = document.getElementById('wallet-coins-input').value;
    const coins = parseFloat(coinsInput);

    if (!coins || coins <= 0) {
      showMessage('Please enter a valid amount', 'error');
      return;
    }

    if (coins > state.balance) {
      showMessage(`You only have ${state.balance} coins available`, 'error');
      return;
    }

    showLoading(true);
    hideMessage();

    try {
      // Generate discount code
      const phoneDigits = state.phone.replace(/\D/g, '');
      const discountCode = `WALLET-${phoneDigits}-${coins}`;

      // Redirect to apply discount
      showMessage(`Applying ${coins} coins...`, 'success');
      
      setTimeout(() => {
        window.location.href = `/discount/${discountCode}?redirect=/checkout`;
      }, 1000);
    } catch (error) {
      showMessage('Failed to apply discount', 'error');
      showLoading(false);
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }
})();
