import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  full_name: string;
  phone: string;
  password: string;
}

export interface User {
  email: string;
  full_name: string;
  phone: string;
  id: number;
  loyalty_tier: string;
  created_at: string;
  user_type: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface FlightSearchRequest {
  origin: string;
  destination: string;
  departure_date: string;
  return_date?: string;
  passengers: number;
  cabin_class: 'economy' | 'business' | 'first';
  trip_type: 'one_way' | 'round_trip';
}

export interface Flight {
  id: number;
  airline: string;
  flight_number: string;
  origin: string;
  destination: string;
  departure_time: string;
  arrival_time: string;
  duration: number;
  price: number;
  available_seats: number;
  cabin_class: string;
  fare_family: string;
}

export interface Ancillary {
  id: number;
  name: string;
  type: 'seat' | 'baggage' | 'meal' | 'other';
  price: number;
  description: string;
}

export interface PaymentOffer {
  id: number;
  name: string;
  description: string;
  discount_type: string;
  discount_value: number;
  payment_methods: ('credit_card' | 'debit_card' | 'wallet')[];
  eligibility_rules: Record<string, any>;
}

export interface BookingRequest {
  flight_id: number;
  passengers: number;
  total_fare: number;
  ancillary_items: number[];
  payment_method: 'credit_card' | 'debit_card' | 'wallet';
}

export interface Booking {
  flight_id: number;
  passengers: number;
  total_fare: number;
  ancillary_items: number[];
  id: number;
  user_id: number;
  pnr: string;
  status: string;
  created_at: string;
  payment_status: string;
  ancillary_total: number;
  payment_method: string;
}

// Auth API
export const authAPI = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },
  
  signup: async (data: SignupRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/signup', data);
    return response.data;
  },
};

// Flights API
export const flightsAPI = {
  search: async (data: FlightSearchRequest, token: string): Promise<Flight[]> => {
    const response = await api.post(`/flights/search?token=${token}`, data);
    return response.data;
  },
  
  getById: async (flightId: number, token: string): Promise<Flight> => {
    const response = await api.get(`/flights/${flightId}?token=${token}`);
    return response.data;
  },
  
  getAncillaries: async (token: string): Promise<Ancillary[]> => {
    const response = await api.get(`/flights/ancillaries/all?token=${token}`);
    return response.data;
  },
  
  getPaymentOffers: async (token: string): Promise<PaymentOffer[]> => {
    const response = await api.get(`/flights/payment-offers/all?token=${token}`);
    return response.data;
  },
};

// Bookings API
export const bookingsAPI = {
  create: async (data: BookingRequest, token: string): Promise<Booking> => {
    const response = await api.post(`/bookings/create?token=${token}`, data);
    return response.data;
  },
  
  getMyBookings: async (token: string): Promise<Booking[]> => {
    const response = await api.get(`/bookings/my-bookings?token=${token}`);
    return response.data;
  },
};

// AI Personalization API
export const aiAPI = {
  getWidget: async (page: string, token: string): Promise<string> => {
    const response = await api.post(`/ai/widget/${page}?token=${token}`);
    return response.data;
  },
};
