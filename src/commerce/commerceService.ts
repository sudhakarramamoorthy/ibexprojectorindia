import { CartItem, GstPriceSummary, OrderDraft, PaymentGatewayAdapter } from './commerceTypes';

export const INDIA_ELECTRONICS_GST_RATE = 18;

/**
 * Computes Indian GST-inclusive pricing breakdown.
 * Projector MRP/retailer prices in India are GST-inclusive (18%).
 */
export function computeIndiaGstSummary(items: CartItem[]): GstPriceSummary {
  const grandTotalInclGstInr = items.reduce(
    (sum, item) => sum + item.unitPriceInr * item.quantity,
    0
  );
  const divisor = 1 + INDIA_ELECTRONICS_GST_RATE / 100;
  const subtotalExclGstInr = Math.round(grandTotalInclGstInr / divisor);
  const gstAmountInr = grandTotalInclGstInr - subtotalExclGstInr;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    subtotalExclGstInr,
    gstAmountInr,
    gstRatePercent: INDIA_ELECTRONICS_GST_RATE,
    grandTotalInclGstInr,
    itemCount,
  };
}

export function createOrderDraft(items: CartItem[]): OrderDraft {
  return {
    draftId: `PGI-${Date.now().toString(36).toUpperCase()}`,
    items,
    pricing: computeIndiaGstSummary(items),
    currency: 'INR',
    status: 'quote_draft',
  };
}

/**
 * Default pluggable payment adapter stub.
 * Swap with Razorpay / Cashfree / UPI SDK implementation when direct checkout is enabled.
 */
export const defaultPaymentAdapter: PaymentGatewayAdapter = {
  providerName: 'razorpay',
  isConfigured: () => false,
  initiatePayment: async (draft: OrderDraft) => ({
    orderReference: draft.draftId,
    status: 'not_enabled',
  }),
};
