import { showToast } from "./toast";

export const openCashfreeCheckout = async (
  paymentSessionId: string,
  orderId: number
) => {
  try {
    let attempts = 0;
    while (!(window as any).Cashfree && attempts < 15) {
      await new Promise((res) => setTimeout(res, 200));
      attempts++;
    }

    if (!(window as any).Cashfree) {
      showToast.error("Payment gateway not loaded. Please refresh and try again.");
      return;
    }

    const cashfree = (window as any).Cashfree({
      mode: "sandbox", 
    });

    cashfree.checkout({
      paymentSessionId,
      redirectTarget: "_self",
      returnUrl: `${window.location.origin}/payment-status?order_id=${orderId}`,
    });

  } catch (err: any) {
    showToast.error("Unable to start payment. Please try again.");
  }
};
