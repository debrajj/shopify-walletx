/**
 * Shopify Checkout UI Extension - Coin Balance Display
 * 
 * This extension shows customer's coin balance in the checkout
 * and allows them to redeem coins for a discount.
 * 
 * To use:
 * 1. Create a new checkout UI extension in your Shopify app
 * 2. Copy this code to your extension's main file
 * 3. Update BACKEND_URL with your actual backend URL
 * 4. Deploy the extension
 */

import {
  reactExtension,
  Banner,
  BlockStack,
  Button,
  Heading,
  Text,
  useApi,
  useApplyDiscountCodeChange,
  useCustomer,
} from '@shopify/ui-extensions-react/checkout';
import { useState, useEffect } from 'react';

const BACKEND_URL = 'https://your-backend-url.com'; // Update this!

export default reactExtension(
  'purchase.checkout.block.render',
  () => <CoinBalanceExtension />
);

function CoinBalanceExtension() {
  const { shop } = useApi();
  const customer = useCustomer();
  const applyDiscountCode = useApplyDiscountCodeChange();
  
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [error, setError] = useState(null);
  const [redeemAmount, setRedeemAmount] = useState(0);

  // Fetch coin balance on load
  useEffect(() => {
    if (customer?.id) {
      fetchBalance();
    } else {
      setLoading(false);
    }
  }, [customer]);

  const fetchBalance = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${BACKEND_URL}/api/shopify/coins/balance/${customer.id}`,
        {
          headers: {
            'x-shop-url': shop.myshopifyDomain,
          },
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        setBalance(data.balance);
      }
    } catch (err) {
      console.error('Failed to fetch balance:', err);
      setError('Unable to load coin balance');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemCoins = async () => {
    if (redeemAmount <= 0 || redeemAmount > balance) {
      setError('Invalid redemption amount');
      return;
    }

    try {
      setRedeeming(true);
      setError(null);

      // Create discount code
      const discountCode = `COINS-${customer.id}-${Date.now()}`;
      
      // Apply discount in checkout
      await applyDiscountCode({
        type: 'addDiscountCode',
        code: discountCode,
      });

      // Update balance
      setBalance(balance - redeemAmount);
      setRedeemAmount(0);
      
    } catch (err) {
      console.error('Failed to redeem coins:', err);
      setError('Failed to apply discount. Please try again.');
    } finally {
      setRedeeming(false);
    }
  };

  // Don't show if customer not logged in
  if (!customer) {
    return null;
  }

  if (loading) {
    return (
      <BlockStack spacing="base">
        <Text>Loading your rewards...</Text>
      </BlockStack>
    );
  }

  if (balance === 0) {
    return (
      <Banner status="info">
        <BlockStack spacing="tight">
          <Heading level={3}>Earn Rewards!</Heading>
          <Text>
            Complete this purchase to earn coins for your next order.
          </Text>
        </BlockStack>
      </Banner>
    );
  }

  return (
    <BlockStack spacing="base">
      <Banner status="success">
        <BlockStack spacing="base">
          <Heading level={3}>🪙 Your Coin Balance</Heading>
          
          <Text size="large" emphasis="bold">
            {balance} coins available
          </Text>
          
          <Text size="small">
            Use your coins to get a discount on this order!
          </Text>

          {error && (
            <Text appearance="critical">{error}</Text>
          )}

          <BlockStack spacing="tight">
            <Text>Redeem coins:</Text>
            
            <Button
              kind="secondary"
              onPress={() => setRedeemAmount(Math.min(100, balance))}
              disabled={redeeming}
            >
              100 coins ($1 off)
            </Button>
            
            <Button
              kind="secondary"
              onPress={() => setRedeemAmount(Math.min(500, balance))}
              disabled={redeeming}
            >
              500 coins ($5 off)
            </Button>
            
            {balance >= 1000 && (
              <Button
                kind="secondary"
                onPress={() => setRedeemAmount(Math.min(1000, balance))}
                disabled={redeeming}
              >
                1000 coins ($10 off)
              </Button>
            )}
          </BlockStack>

          {redeemAmount > 0 && (
            <Button
              kind="primary"
              onPress={handleRedeemCoins}
              loading={redeeming}
            >
              Apply {redeemAmount} coins discount
            </Button>
          )}
        </BlockStack>
      </Banner>
    </BlockStack>
  );
}
