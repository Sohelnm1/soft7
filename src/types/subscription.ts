export interface SubscriptionPlan {
  type: "starter" | "professional" | "enterprise";
  name: string;
  price: number;
  validity: number;
  features: string[];
  recommended?: boolean;
}

export interface RazorpayOrderResponse {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  notes: Record<string, any>;
  created_at: number;
}

export interface SubscriptionData {
  id: string;
  userId: number;
  planType: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  status: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentVerificationPayload {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}
