import {
  reactExtension,
  useApi,
  useApplyDiscountCodeChange,
  Banner,
  BlockStack,
  Text,
} from '@shopify/ui-extensions-react/checkout';

export default reactExtension(
  'purchase.checkout.block.render',
  () => <WalletDiscountExtension />
);

function WalletDiscountExtension() {
  const { sessionToken } = useApi();
  const applyDiscountCode = useApplyDiscountCodeChange();
  const [applied, setApplied] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    // Check if wallet discount is in session storage
    const walletDiscount = sessionStorage.getItem('walletDiscount');
    
    if (walletDiscount && !applied) {
      try {
        const discount = JSON.parse(walletDiscount);
        console.log('[Wallet Checkout] Applying discount:', discount);
        
        // Apply the discount code
        applyDiscountCode({
          type: 'addDiscountCode',
          code: discount.code,
        })
          .then(() => {
            console.log('[Wallet Checkout] ✅ Discount applied:', discount.code);
            setApplied(true);
            // Clear from session after applying
            sessionStorage.removeItem('walletDiscount');
          })
          .catch((err) => {
            console.error('[Wallet Checkout] ❌ Failed to apply discount:', err);
            setError(err.message);
          });
          
      } catch (err) {
        console.error('[Wallet Checkout] Error parsing discount:', err);
        setError('Invalid discount data');
      }
    }
  }, [applied, applyDiscountCode]);

  if (error) {
    return (
      <Banner status="critical">
        <BlockStack>
          <Text>Failed to apply wallet discount</Text>
          <Text size="small">{error}</Text>
        </BlockStack>
      </Banner>
    );
  }

  if (applied) {
    return (
      <Banner status="success">
        <Text>Wallet discount applied successfully!</Text>
      </Banner>
    );
  }

  return null;
}
