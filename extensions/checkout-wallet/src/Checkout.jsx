import React, { useState, useEffect } from 'react';
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
  useExtensionCapability,
} from '@shopify/ui-extensions-react/checkout';

export default reactExtension(
  'purchase.checkout.block.render',
  () => <WalletExtension />
);

function WalletExtension() {
  const { shop } = useApi();
  const customer = useCustomer();
  const applyDiscountCode = useApplyDiscountCodeChange();
  const canApplyDiscount = useExtensionCapability('api_access');

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSessionId, setOtpSessionId] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);
  const [coinsToUse, setCoinsToUse] = useState('');
  const [step, setStep] = useState('phone'); // phone, otp, wallet
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const API_BASE = 'https://shopify-walletx.onrender.com/api';

  // Auto-fill phone if customer is logged in
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
        setSuccess('OTP sent to your phone!');
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
        // Fetch wallet balance
        await fetchWalletBalance();
        setStep('wallet');
        setSuccess('OTP verified! Your wallet is ready.');
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
      setError(`You only have ${walletBalance} coins available`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Generate discount code
      const discountCode = `WALLET-${phone}-${coins}`;

      // Apply discount code to checkout
      if (canApplyDiscount) {
        const result = await applyDiscountCode({
          type: 'addDiscountCode',
          code: discountCode,
        });

        if (result.type === 'success') {
          setSuccess(`${coins} coins applied as discount!`);
          setWalletBalance(walletBalance - coins);
          setCoinsToUse('');
        } else {
          setError('Failed to apply discount. Please try again.');
        }
      } else {
        setError('Discount application not available');
      }
    } catch (err) {
      setError('Failed to apply discount');
    } finally {
      setLoading(false);
    }
  };

  return (
    <BlockStack spacing="base">
      <Heading level={2}>💰 Use Your Wallet Coins</Heading>

      {error && (
        <Banner status="critical" title="Error">
          {error}
        </Banner>
      )}

      {success && (
        <Banner status="success" title="Success">
          {success}
        </Banner>
      )}

      {step === 'phone' && (
        <BlockStack spacing="base">
          <Text>Enter your phone number to access your wallet</Text>
          <TextField
            label="Phone Number"
            value={phone}
            onChange={setPhone}
            type="tel"
            placeholder="+1234567890"
          />
          <Button
            onPress={sendOTP}
            loading={loading}
            disabled={!phone}
          >
            Send OTP
          </Button>
        </BlockStack>
      )}

      {step === 'otp' && (
        <BlockStack spacing="base">
          <Text>Enter the OTP sent to {phone}</Text>
          <TextField
            label="OTP Code"
            value={otp}
            onChange={setOtp}
            type="number"
            placeholder="123456"
          />
          <Button
            onPress={verifyOTP}
            loading={loading}
            disabled={!otp}
          >
            Verify OTP
          </Button>
          <Button
            onPress={() => setStep('phone')}
            kind="plain"
          >
            Change Phone Number
          </Button>
        </BlockStack>
      )}

      {step === 'wallet' && (
        <BlockStack spacing="base">
          <Banner status="info">
            <Text>Available Balance: {walletBalance} coins</Text>
          </Banner>

          {walletBalance > 0 ? (
            <>
              <TextField
                label="Coins to Use"
                value={coinsToUse}
                onChange={setCoinsToUse}
                type="number"
                placeholder={`Max: ${walletBalance}`}
              />
              <Button
                onPress={applyWalletDiscount}
                loading={loading}
                disabled={!coinsToUse || parseFloat(coinsToUse) <= 0}
              >
                Apply {coinsToUse || 0} Coins
              </Button>
            </>
          ) : (
            <Text>You don't have any coins in your wallet yet.</Text>
          )}

          <Button
            onPress={() => {
              setStep('phone');
              setOtp('');
              setOtpSessionId('');
              setSuccess('');
            }}
            kind="plain"
          >
            Use Different Phone
          </Button>
        </BlockStack>
      )}
    </BlockStack>
  );
}
