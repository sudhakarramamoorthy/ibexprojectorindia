/**
 * Extensible E-Commerce & Checkout Domain Contracts
 * Built so shopping cart, Indian GST billing, Razorpay/UPI payment gateways,
 * and checkout workflows can be plugged in with minimal code rework.
 */

export type CommerceItemType = 'projector' | 'screen' | 'mount' | 'ups';

export interface CartItem {
  id: string;
  userId: string;
  skuId: string;
  itemType: CommerceItemType;
  title: string;
  unitPriceInr: number;
  quantity: number;
  preferredRetailer: string;
  createdAtIso: string;
  updatedAtIso: string;
}

export interface GstPriceSummary {
  subtotalExclGstInr: number;
  gstAmountInr: number;
  gstRatePercent: number;
  grandTotalInclGstInr: number;
  itemCount: number;
}

export interface ShippingAddressIndia {
  fullName: string;
  phoneIndia: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
  gstin?: string;
}

export interface OrderDraft {
  draftId: string;
  items: CartItem[];
  pricing: GstPriceSummary;
  shippingAddress?: ShippingAddressIndia;
  currency: 'INR';
  status: 'quote_draft' | 'checkout_ready' | 'payment_pending' | 'confirmed';
}

export interface PaymentGatewayAdapter {
  providerName: 'razorpay' | 'upi_intent' | 'cashfree' | 'stripe_in';
  isConfigured: () => boolean;
  initiatePayment: (draft: OrderDraft) => Promise<{
    redirectUrl?: string;
    orderReference: string;
    status: 'not_enabled' | 'pending' | 'paid';
  }>;
}
