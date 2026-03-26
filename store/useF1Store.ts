import { create } from 'zustand';

type F1StoreState = {
  favoriteDrivers: number[];
  selectedRace: number | null;
  toggleFavoriteDriver: (driverId: number) => void;
  setSelectedRace: (raceId: number | null) => void;
};

export const useF1Store = create<F1StoreState>((set) => ({
  favoriteDrivers: [],
  selectedRace: null,
  toggleFavoriteDriver: (driverId) =>
    set((state) => ({
      favoriteDrivers: state.favoriteDrivers.includes(driverId)
        ? state.favoriteDrivers.filter((id) => id !== driverId)
        : [...state.favoriteDrivers, driverId],
    })),
  setSelectedRace: (raceId) => set({ selectedRace: raceId }),
}));