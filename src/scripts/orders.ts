// Mock orders store. localStorage only — the mock checkout saves each
// completed order here so /track/ and /account/ can read it back.
// Nothing is sent anywhere; every order is invented demo data.
export interface MockOrderItem {
  slug: string;
  name: string;
  color: string;
  qty: number;
  price: number;
}

export interface MockOrder {
  orderNo: string;
  date: string; // ISO string, when the mock order was placed
  items: MockOrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  email: string;
  name: string;
}

const KEY = 'aura-orders';

export function getOrders(): MockOrder[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MockOrder[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((o) => o && typeof o.orderNo === 'string' && Array.isArray(o.items))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch {
    return [];
  }
}

export function saveOrder(order: MockOrder) {
  try {
    const all = getOrders();
    all.unshift(order);
    localStorage.setItem(KEY, JSON.stringify(all.slice(0, 10)));
  } catch {
    // Private mode / storage full: the order still shows on the success screen.
  }
}

export function findOrder(orderNo: string): MockOrder | undefined {
  const needle = orderNo.trim().toUpperCase();
  return getOrders().find((o) => o.orderNo.toUpperCase() === needle);
}

export function makeOrderNo(): string {
  return `AUR-${Math.floor(100000 + Math.random() * 900000)}`;
}
