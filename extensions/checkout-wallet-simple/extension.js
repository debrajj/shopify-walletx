// Shopify Checkout UI Extension - Wallet Coins
// Copy this entire file into Shopify Partner Dashboard Extension Editor

import {
  reactExtension,
  Banner,
  BlockStack,
  Button,
  Heading,
  Text,
  TextField,
  useApi,
  useApplyDiscountCodeChange,
  useCustomer,
} from '@shopify/ui-extensions-react/checkout';
import { useState, useEffect } from 'react';

export default reactExtension('purchase.checkout.block.render', () => <WalletExtension />);

function WalletExtension() {
  const { shop } = useApi();
  const customer = useCustomer();
  const applyDiscountCode = useApplyDiscountCodeChange();

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSessionId, setOtpSessionId] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);
  const [coinsToUse, setCoinsToUse] = useState('');
  const [step, setStep] = useState('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const API_BASE = 'https://shopify-walletx.onrender.com/api';

  useEffect(() => {
    if (customer && customer.phone) {
      setPhone(customer.phone);
    }
  }, [customer]);

  const sendOTP = async () => {
    if (!phone) {
      setError('Please enter your phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/otp/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-shop-url': shop.myshopifyDomain,
        },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();

      if (data.success) {
        setOtpSessionId(data.otpSessionId);
        setStep('otp');
        setSuccess('OTP sent! Check your phone.');
      } else {
        setError(data.message || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp) {
      setError('Please enter the OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/otp/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-shop-url': shop.myshopifyDomain,
        },
        body: JSON.stringify({ otpSessionId, otp }),
      });

      const data = await response.json();

      if (data.success && data.verified) {
        await fetchWalletBalance();
        setStep('wallet');
        setSuccess('Verified! Your wallet is ready.');
      } else {
        setError('Invalid OTP. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchWalletBalance = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/wallet/balance?phone=${encodeURIComponent(phone)}`,
        {
          headers: {
            'x-shop-url': shop.myshopifyDomain,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setWalletBalance(data.walletCoins || 0);
      }
    } catch (err) {
      console.error('Failed to fetch wallet balance:', err);
    }
  };

  const applyWalletDiscount = async () => {
    const coins = parseFloat(coinsToUse);

    if (!coins || coins <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (coins > walletBalance) {
      setError(`You only have ${walletBalance} coins`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const discountCode = `WALLET-${phone.replace(/\D/g, '')}-${coins}`;

      const result = await applyDiscountCode({
        type: 'addDiscountCode',
        code: discountCode,
      });

      if (result.type === 'success') {
        setSuccess(`${coins} coins applied!`);
        setWalletBalance(walletBalance - coins);
        setCoinsToUse('');
      } else {
        setError('Failed to apply discount');
      }
    } catch (err) {
      setError('Failed to apply discount');
    } finally {
      setLoading(false);
    }
  };

  return (
    <BlockStack spacing="base">
      <Heading level={2}>💰 Use Wallet Coins</Heading>

      {error && (
        <Banner status="critical">
          {error}
        </Banner>
      )}

      {success && (
        <Banner status="success">
          {success}
        </Banner>
      )}

      {step === 'phone' && (
        <BlockStack spacing="base">
          <Text>Enter phone to access wallet</Text>
          <TextField
            label="Phone Number"
            value={phone}
            onChange={setPhone}
            type="tel"
          />
          <Button onPress={sendOTP} loading={loading}>
            Send OTP
          </Button>
        </BlockStack>
      )}

      {step === 'otp' && (
        <BlockStack spacing="base">
          <Text>Enter OTP sent to {phone}</Text>
          <TextField
            label="OTP Code"
            value={otp}
            onChange={setOtp}
            type="number"
          />
          <Button onPress={verifyOTP} loading={loading}>
            Verify
          </Button>
          <Button onPress={() => setStep('phone')} kind="plain">
            Change Phone
          </Button>
        </BlockStack>
      )}

      {step === 'wallet' && (
        <BlockStack spacing="base">
          <Banner status="info">
            Balance: {walletBalance} coins
          </Banner>

          {walletBalance > 0 ? (
            <>
              <TextField
                label="Coins to Use"
                value={coinsToUse}
                onChange={setCoinsToUse}
                type="number"
              />
              <Button onPress={applyWalletDiscount} loading={loading}>
                Apply Coins
              </Button>
            </>
          ) : (
            <Text>No coins available</Text>
          )}

          <Button onPress={() => setStep('phone')} kind="plain">
            Use Different Phone
          </Button>
        </BlockStack>
      )}
    </BlockStack>
  );
}
