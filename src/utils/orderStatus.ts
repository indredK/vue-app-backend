export type OrderStatus = 
  | 'pending'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus = 
  | 'unpaid'
  | 'paid'
  | 'refunded'
  | 'partial_refunded';

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['paid', 'cancelled'],
  paid: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
  refunded: []
};

export const PAYMENT_STATUS_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  unpaid: ['paid'],
  paid: ['refunded', 'partial_refunded'],
  refunded: [],
  partial_refunded: ['refunded']
};

export const canTransitionOrderStatus = (from: OrderStatus, to: OrderStatus): boolean => {
  return ORDER_STATUS_TRANSITIONS[from].includes(to);
};

export const canTransitionPaymentStatus = (from: PaymentStatus, to: PaymentStatus): boolean => {
  return PAYMENT_STATUS_TRANSITIONS[from].includes(to);
};

export const getNextOrderStatuses = (current: OrderStatus): OrderStatus[] => {
  return ORDER_STATUS_TRANSITIONS[current];
};

export const getNextPaymentStatuses = (current: PaymentStatus): PaymentStatus[] => {
  return PAYMENT_STATUS_TRANSITIONS[current];
};

export const getOrderStatusLabel = (status: OrderStatus): string => {
  const labels: Record<OrderStatus, string> = {
    pending: '待支付',
    paid: '已支付',
    processing: '处理中',
    shipped: '已发货',
    delivered: '已送达',
    completed: '已完成',
    cancelled: '已取消',
    refunded: '已退款'
  };
  return labels[status];
};

export const getPaymentStatusLabel = (status: PaymentStatus): string => {
  const labels: Record<PaymentStatus, string> = {
    unpaid: '未支付',
    paid: '已支付',
    refunded: '已退款',
    partial_refunded: '部分退款'
  };
  return labels[status];
};
