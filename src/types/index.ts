export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'organizer' | 'customer';
  profile_picture_url?: string;
  created_at: string;
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
  status?: string; // Added optional status
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
}

export interface Order {
  id: number; // Changed from order_id to id to match your usage
  user_id: number;
  total_amount: number;
  order_status: 'pending' | 'paid' | 'cancelled';
  created_at: string;
  items?: OrderItem[];
  item_count?: number; // Added optional item_count
}

export interface OrderItem {
  id: number;
  order_id: number;
  ticket_id: number;
  quantity: number;
  price_at_purchase: number;
  subtotal: number;
  status: 'active' | 'cancelled';
  ticket_name: string;
  event_name: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiResponse<T> {
  message?: string;
  error?: string;
  data?: T;
}