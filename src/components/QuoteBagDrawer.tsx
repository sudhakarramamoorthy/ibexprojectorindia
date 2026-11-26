import React, { useMemo } from 'react';
import { FileText, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { computeIndiaGstSummary, createOrderDraft, defaultPaymentAdapter } from '../commerce/commerceService';
import { INDIA_ACCESSORY_BUNDLES } from '../data/projectorsIndia';
import { formatInr } from '../utils/optics';

export const QuoteBagDrawer: React.FC = () => {
  const {
    cartOpen,
    setCartOpen,
    cartItems,
    addToCart,
    updateCartQuantity,
    removeCartItem,
    setActiveView,
    showToast,
  } = useApp();

  const summary = useMemo(() => computeIndiaGstSummary(cartItems), [cartItems]);

  if (!cartOpen) return null;

  const handleCheckoutPreview = async () => {
    const draft = createOrderDraft(cartItems);
    const result = await defaultPaymentAdapter.initiatePayment(draft);
    if (result.status === 'not_enabled') {
      showToast(
        `Quote ${result.orderReference} prepared. Direct checkout gateway ready for Razorpay/UPI plug-in — exporting BOQ in Installer PDF.`,
        'info'
      );
      setCartOpen(false);
      setActiveView('report');
    }
  };

  return (
    <div className="no-print fixed inset-0 z-50 flex justify-end bg-slate-900/40">
      <div className="w-full max-w-md bg-white h-full border-l border-slate-200 shadow-2xl flex flex-col">
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Project Quote Bag</h2>
            <p className="text-xs text-slate-500">
              E-commerce ready cart with 18% India GST breakdown
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCartOpen(false)}
            aria-label="Close quote bag"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cart Items + Recommended India Accessories */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {cartItems.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <ShoppingBag className="w-6 h-6 text-slate-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-800">Your quote bag is empty</p>
              <p className="text-xs text-slate-500">
                Add projectors or India installation accessories to calculate a complete GST Bill of Quantities.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl">
              {cartItems.map((item) => (
                <div key={item.id} className="p-3.5 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900">{item.title}</div>
                      <div className="text-[11px] text-slate-500">
                        {item.itemType.toUpperCase()} · {item.preferredRetailer}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCartItem(item.id)}
                      aria-label={`Remove ${item.title}`}
                      className="p-1 text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center border border-slate-200 rounded-lg">
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(item.id, -1)}
                        aria-label="Decrease quantity"
                        className="px-2 py-1 text-slate-600 hover:bg-slate-50"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2.5 text-xs font-mono tabular-nums font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(item.id, 1)}
                        aria-label="Increase quantity"
                        className="px-2 py-1 text-slate-600 hover:bg-slate-50"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-sm font-bold font-mono tabular-nums text-slate-900">
                      {formatInr(item.unitPriceInr * item.quantity)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* India Installation Accessories Quick-Add */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-semibold text-slate-500">
              India Installation Essentials (Quick Add)
            </h3>
            <div className="space-y-2">
              {INDIA_ACCESSORY_BUNDLES.map((acc) => (
                <div
                  key={acc.skuId}
                  className="p-3 border border-slate-200 rounded-lg flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-slate-900 line-clamp-1">{acc.title}</div>
                    <div className="text-[11px] font-mono tabular-nums text-slate-500">
                      {formatInr(acc.unitPriceInr)} · {acc.preferredRetailer}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => addToCart(acc)}
                    className="px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md whitespace-nowrap shrink-0"
                  >
                    + Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* GST Breakdown & Extensible Checkout Footer */}
        <div className="p-5 border-t border-slate-200 bg-slate-50 space-y-3">
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Taxable Value (Excl. GST)</span>
              <span className="font-mono tabular-nums">{formatInr(summary.subtotalExclGstInr)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>India GST ({summary.gstRatePercent}%)</span>
              <span className="font-mono tabular-nums">{formatInr(summary.gstAmountInr)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
              <span>Total Estimate ({summary.itemCount} items)</span>
              <span className="font-mono tabular-nums">{formatInr(summary.grandTotalInclGstInr)}</span>
            </div>
          </div>

          <button
            type="button"
            disabled={cartItems.length === 0}
            onClick={handleCheckoutPreview}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>Export BOQ to Installer PDF</span>
          </button>
          <p className="text-[11px] text-slate-500 text-center">
            Cart &amp; GST schema pre-structured for direct Razorpay / UPI checkout activation.
          </p>
        </div>
      </div>
    </div>
  );
};
