import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../config/firebase";
import { RiverTrip, RiverTripInput } from "../types/trip";
import { normalizeWaterCondition } from "../utils/waterCondition";
import { normalizeRouteCoordinates } from "../utils/geo";
import { sortTripsBySailDateDesc } from "../utils/sortTrips";

export const TRIPS_COLLECTION_NAME = "riverTrips";

function normalizeDate(value: unknown) {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return value.toDate().toISOString();
  }

  return typeof value === "string" ? value : new Date().toISOString();
}

export function subscribeToRiverTrips(
  ownerId: string,
  onTrips: (trips: RiverTrip[]) => void,
) {
  if (!db) {
    onTrips([]);
    return () => undefined;
  }

  const tripsQuery = query(
    collection(db, TRIPS_COLLECTION_NAME),
    where("ownerId", "==", ownerId),
  );

  return onSnapshot(tripsQuery, (snapshot) => {
    const trips = sortTripsBySailDateDesc(
      snapshot.docs.map((document) => {
        const data = document.data();

        return {
          boatType: data.boatType,
          createdAt: normalizeDate(data.createdAt),
          crew: Array.isArray(data.crew) ? data.crew : [],
          difficulty: data.difficulty,
          distanceKm: Number(data.distanceKm) || 0,
          endedAt: normalizeDate(data.endedAt),
          from: data.from ?? "",
          id: document.id,
          notes: data.notes,
          ownerId: data.ownerId ?? ownerId,
          river: data.river ?? "",
          routeCoordinates: normalizeRouteCoordinates(data.routeCoordinates),
          startedAt: normalizeDate(data.startedAt),
          waterCondition: normalizeWaterCondition(data.waterCondition),
          to: data.to ?? "",
        } satisfies RiverTrip;
      }),
    );

    onTrips(trips);
  });
}

export async function createRiverTrip(trip: RiverTripInput, ownerId: string) {
  if (!db) {
    throw new Error("Firebase neni nakonfigurovany.");
  }

  const docRef = await addDoc(collection(db, TRIPS_COLLECTION_NAME), {
    ...trip,
    createdAt: serverTimestamp(),
    ownerId,
  });

  return docRef.id;
}

export async function updateRiverTrip(
  tripId: string,
  trip: RiverTripInput,
  ownerId: string,
) {
  if (!db) {
    throw new Error("Firebase neni nakonfigurovany.");
  }

  await updateDoc(doc(db, TRIPS_COLLECTION_NAME, tripId), {
    ...trip,
    ownerId,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteRiverTrip(tripId: string) {
  if (!db) {
    throw new Error("Firebase neni nakonfigurovany.");
  }

  await deleteDoc(doc(db, TRIPS_COLLECTION_NAME, tripId));
}
