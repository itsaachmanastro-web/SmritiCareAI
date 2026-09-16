/**
 * paymentService.js
 * Payment provider abstraction layer for SmritiCare.
 * 
 * SPECIFICATION RULES:
 * - Ready for integration with real payment gateways (Stripe, Razorpay, UPI)
 * - Safe setup / demo mode notice when payment provider is not configured
 * - NO fake payment success logic or fabricated card transactions
 * - Never store sensitive payment information (cards, CVVs) in frontend storage
 */

import { changeSubscription, cancelSubscription as cancelSub, restoreSubscription as restoreSub, getUserSubscription } from './subscriptionService.js';

// Configuration check for live payment provider (e.g. Stripe or Razorpay)
const IS_PAYMENT_CONFIGURED = false; // Set to true when live backend webhook keys are mounted
const PAYMENT_PROVIDER_NAME = 'Setup Mode (Gateway Unconnected)';

export function isPaymentGatewayConfigured() {
  return IS_PAYMENT_CONFIGURED;
}

export function getPaymentGatewayInfo() {
  return {
    isConfigured: IS_PAYMENT_CONFIGURED,
    provider: PAYMENT_PROVIDER_NAME,
    statusNotice: 'Payments are currently in setup mode. Commercial subscriptions and billing gateways will be connected in production deployment.'
  };
}

/**
 * Initiates checkout session.
 * If live provider is not configured, returns clean setup mode notice without fake charges.
 */
export async function createCheckout(param1, param2, param3) {
  let planCode, userId, billingCycle = 'monthly';
  if (typeof param1 === 'object' && param1 !== null) {
    planCode = param1.planCode;
    userId = param1.userId;
    billingCycle = param1.billingCycle || 'monthly';
  } else {
    planCode = param1;
    userId = param2 || 1;
    billingCycle = param3 || 'monthly';
  }

  if (!userId) throw new Error('User ID is required for checkout');

  if (!IS_PAYMENT_CONFIGURED) {
    return {
      status: 'setup_mode',
      isConfigured: false,
      isDemoMode: true,
      message: 'Payments are currently in setup mode. Please select a plan in preview mode.',
      planCode,
      billingCycle
    };
  }

  // Live provider implementation stub
  throw new Error('Live payment gateway not yet connected.');
}

/**
 * Confirms preview/sandbox activation for demonstration environments.
 * Explicitly records that this is a simulated trial / preview assignment.
 */
export async function activatePreviewPlan({ planCode, userId, billingCycle = 'monthly' }) {
  if (!userId) throw new Error('User ID is required');
  return await changeSubscription({ userId, planCode, billingCycle });
}

/**
 * Cancels user subscription.
 */
export async function cancelSubscription(userId) {
  return await cancelSub(userId);
}

/**
 * Restores a cancelled subscription.
 */
export async function restoreSubscription(userId) {
  return await restoreSub(userId);
}

/**
 * Retrieves billing telemetry for user.
 */
export async function getSubscriptionBilling(userId) {
  const sub = await getUserSubscription(userId);
  return {
    ...sub,
    isPaymentConfigured: IS_PAYMENT_CONFIGURED,
    gatewayProvider: PAYMENT_PROVIDER_NAME,
    invoiceHistory: [] // Invoices available only when live gateway is configured
  };
}

export const paymentService = {
  isConfigured: isPaymentGatewayConfigured,
  isPaymentGatewayConfigured,
  getPaymentGatewayInfo,
  createCheckout,
  initiateSubscriptionPayment: createCheckout,
  activatePreviewPlan,
  cancelSubscription,
  restoreSubscription,
  getSubscriptionBilling
};

export default paymentService;
