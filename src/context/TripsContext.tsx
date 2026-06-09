import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { isFirebaseConfigured } from "../config/firebase";
import { createRiverTrip, deleteRiverTrip, subscribeToRiverTrips, updateRiverTrip } from "../services/trips";
import { RiverTrip, RiverTripInput } from "../types/trip";
import { sortTripsBySailDateDesc } from "../utils/sortTrips";

type TripsContextValue = {
  deleteTrip: (tripId: string) => Promise<void>;
  getTripById: (tripId: string) => RiverTrip | undefined;
  isSaving: boolean;
  message: string;
  saveTrip: (trip: RiverTripInput) => Promise<RiverTrip>;
  totalDistance: number;
  trips: RiverTrip[];
  updateTrip: (tripId: string, trip: RiverTripInput) => Promise<RiverTrip>;
};

const TripsContext = createContext<TripsContextValue | undefined>(undefined);

export function TripsProvider({ children, ownerId }: { children: ReactNode; ownerId: string }) {
  const [trips, setTrips] = useState<RiverTrip[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("Pripraveno k zapisu.");

  useEffect(() => {
    if (!isFirebaseConfigured) {
      return;
    }

    return subscribeToRiverTrips(ownerId, (nextTrips) => {
      setTrips(sortTripsBySailDateDesc(nextTrips));
    });
  }, [ownerId]);

  const totalDistance = useMemo(
    () => trips.reduce((sum, trip) => sum + trip.distanceKm, 0),
    [trips],
  );

  const getTripById = useCallback(
    (tripId: string) => trips.find((trip) => trip.id === tripId),
    [trips],
  );

  const saveTrip = useCallback(async (trip: RiverTripInput) => {
    setIsSaving(true);

    try {
      const id = isFirebaseConfigured ? await createRiverTrip(trip, ownerId) : `local-${Date.now()}`;
      const savedTrip: RiverTrip = {
        ...trip,
        id,
        createdAt: new Date().toISOString(),
        ownerId,
      };

      setTrips((current) => sortTripsBySailDateDesc([savedTrip, ...current]));
      setMessage(isFirebaseConfigured ? "Ulozeno do Firebase." : "Ulozeno lokalne. Firebase neni nakonfigurovany.");

      return savedTrip;
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Neznama chyba.";
      setMessage(`Ulozeni selhalo: ${detail}`);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [ownerId]);

  const updateTrip = useCallback(async (tripId: string, trip: RiverTripInput) => {
    setIsSaving(true);

    try {
      if (isFirebaseConfigured) {
        await updateRiverTrip(tripId, trip, ownerId);
      }

      let updatedTrip: RiverTrip | undefined;
      setTrips((current) =>
        sortTripsBySailDateDesc(
          current.map((item) => {
            if (item.id !== tripId) {
              return item;
            }

            updatedTrip = {
              ...item,
              ...trip,
              ownerId,
            };

            return updatedTrip;
          }),
        ),
      );

      if (!updatedTrip) {
        throw new Error("Vylet nenalezen.");
      }

      setMessage(isFirebaseConfigured ? "Zmeny ulozeny do Firebase." : "Zmeny ulozeny lokalne.");
      return updatedTrip;
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Neznama chyba.";
      setMessage(`Uprava selhala: ${detail}`);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [ownerId]);

  const deleteTrip = useCallback(async (tripId: string) => {
    setIsSaving(true);

    try {
      if (isFirebaseConfigured) {
        await deleteRiverTrip(tripId);
      }

      setTrips((current) => current.filter((trip) => trip.id !== tripId));
      setMessage(isFirebaseConfigured ? "Vylet smazan z Firebase." : "Vylet smazan lokalne.");
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Neznama chyba.";
      setMessage(`Smazani selhalo: ${detail}`);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      deleteTrip,
      getTripById,
      isSaving,
      message,
      saveTrip,
      totalDistance,
      trips,
      updateTrip,
    }),
    [deleteTrip, getTripById, isSaving, message, saveTrip, totalDistance, trips, updateTrip],
  );

  return <TripsContext.Provider value={value}>{children}</TripsContext.Provider>;
}

export function useTrips() {
  const context = useContext(TripsContext);

  if (!context) {
    throw new Error("useTrips must be used within TripsProvider.");
  }

  return context;
}
