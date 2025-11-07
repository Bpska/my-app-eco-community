import { create } from 'zustand';
import axios from 'axios';
import Constants from 'expo-constants';
import { useAuthStore } from './authStore';

const API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

interface Trip {
  id?: string;
  origin: Location;
  destination: Location;
  departure_time: string;
  mode: string;
  matches?: any[];
}

interface TripState {
  currentTrip: Trip | null;
  availableRides: any[];
  isSearching: boolean;
  searchTrip: (trip: Trip) => Promise<void>;
  getAvailableRides: () => Promise<void>;
  clearTrip: () => void;
}

export const useTripStore = create<TripState>((set, get) => ({
  currentTrip: null,
  availableRides: [],
  isSearching: false,

  searchTrip: async (trip: Trip) => {
    set({ isSearching: true });
    try {
      const token = useAuthStore.getState().token;
      const response = await axios.post(
        `${API_URL}/api/trips/request`,
        trip,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      set({ 
        currentTrip: { ...trip, id: response.data.trip_id, matches: response.data.matches },
        isSearching: false 
      });
    } catch (error) {
      set({ isSearching: false });
      throw error;
    }
  },

  getAvailableRides: async () => {
    try {
      const token = useAuthStore.getState().token;
      const response = await axios.get(`${API_URL}/api/rides/available`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      set({ availableRides: response.data });
    } catch (error) {
      console.error('Failed to fetch rides:', error);
    }
  },

  clearTrip: () => set({ currentTrip: null }),
}));