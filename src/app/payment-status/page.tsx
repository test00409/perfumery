import { Suspense } from "react";
import PaymentStatusClient from "./PaymentStatusClient";

export default function PaymentStatusPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading payment status...</div>}>
      <PaymentStatusClient />
    </Suspense>
  );
}
