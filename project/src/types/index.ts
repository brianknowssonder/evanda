export interface User {
  id: number;
  name: string;
  email: string;
  role: 'customer' | 'organizer' | 'admin';
  phone_number?: string;
  profile_picture_url?: string;
  created_at: string;
  last_login?: string;
}

export interface Event {
  id: number;
  title: string;
  description: string;
  location: string;
  start_time: string;
  end_time: string;
  organizer_id: number;
  organizer_name: string;
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  id: number;
  event_id: number;
  name: string;
  price: number;
  quantity_available: number;
  quantity_sold: number;
  status: 'active' | 'inactive';
  expiry_date?: string;
  created_at: string;
  updated_at: string;
  event_name?: string;
  event_location?: string;
}

export interface Order {
  id: number;
  order_id: number;
  user_id: number;
  total_amount: number;
  order_status: 'pending' | 'paid' | 'cancelled';
  created_at: string;
  updated_at: string;
  item_count: number;
  user_name?: string;
  user_email?: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: number;
  order_id: number;
  ticket_id: number;
  quantity: number;
  price_at_purchase: number;
  subtotal: number;
  status: 'active' | 'cancelled';
  ticket_name?: string;
  event_name?: string;
}

export interface Scanner {
  id: number;
  username: string;
  location: string;
  role: string;
  scan_count: number;
  created_at: string;
}

export interface PaymentData {
  amount: number;
  phone: string;
  order_id: number;
}

export interface ValidationResult {
  valid: boolean;
  status?: string;
  event?: string;
  user?: string;
  event_id?: number;
  scanned_at?: string;
  scanner_id?: string;
  reason?: string;
}