
export interface OrderItem {
  name: string;
  isUdon: boolean;
}

export interface CafeteriaOrder {
  id: string;
  date: string;
  sender: string;
  subject: string;
  items: OrderItem[];
  fullText: string;
  hasUdon: boolean;
}

export interface Statistics {
  totalOrders: number;
  udonCount: number;
  udonPercentage: number;
  thisMonthCount: number;
}
