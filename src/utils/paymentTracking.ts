type PaymentTrackingContext = {
  orderId: string;
  amount?: number | null;
  txnId?: string | null;
  updatedAt: number;
};

const PAYMENT_TRACKING_STORAGE_KEY = "payment_tracking_context";

const isBrowser = () => typeof window !== "undefined";

const readAllPaymentContexts = (): Record<string, PaymentTrackingContext> => {
  if (!isBrowser()) {
    return {};
  }

  try {
    const rawValue = window.localStorage.getItem(PAYMENT_TRACKING_STORAGE_KEY);
    if (!rawValue) {
      return {};
    }

    const parsed = JSON.parse(rawValue);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const writeAllPaymentContexts = (
  contexts: Record<string, PaymentTrackingContext>
) => {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.setItem(
      PAYMENT_TRACKING_STORAGE_KEY,
      JSON.stringify(contexts)
    );
  } catch {
    // Ignore storage write failures so checkout flow is never blocked.
  }
};

export const savePaymentTrackingContext = (context: {
  orderId: string | number;
  amount?: number | null;
  txnId?: string | null;
}) => {
  const orderId = String(context.orderId ?? "").trim();
  if (!orderId) {
    return;
  }

  const existingContext = getPaymentTrackingContext(orderId);
  const nextContext: PaymentTrackingContext = {
    orderId,
    amount:
      typeof context.amount === "number" && Number.isFinite(context.amount)
        ? context.amount
        : existingContext?.amount ?? null,
    txnId: context.txnId?.trim() || existingContext?.txnId || null,
    updatedAt: Date.now(),
  };

  const allContexts = readAllPaymentContexts();
  allContexts[orderId] = nextContext;
  writeAllPaymentContexts(allContexts);
};

export const getPaymentTrackingContext = (
  orderId: string | number
): PaymentTrackingContext | null => {
  const normalizedOrderId = String(orderId ?? "").trim();
  if (!normalizedOrderId) {
    return null;
  }

  const allContexts = readAllPaymentContexts();
  return allContexts[normalizedOrderId] ?? null;
};
