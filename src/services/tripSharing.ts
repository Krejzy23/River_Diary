import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { RiverTrip } from "../types/trip";
import { createGpxDocument, createGpxFileName } from "../utils/gpx";

function createTripShareTitle(trip: RiverTrip) {
  return trip.river + " " + trip.from + " - " + trip.to;
}

export async function shareTripImage(imageUri: string) {
  const sharingAvailable = await Sharing.isAvailableAsync();

  if (!sharingAvailable) {
    throw new Error("Native image sharing is not available on this device.");
  }

  await Sharing.shareAsync(imageUri, {
    dialogTitle: "Sdílet výlet",
    mimeType: "image/png",
    UTI: "public.png",
  });
}

export async function shareTripGpx(trip: RiverTrip) {
  const coordinates = trip.routeCoordinates ?? [];

  if (coordinates.length < 2) {
    throw new Error(
      "Trip route does not contain enough points for GPX sharing.",
    );
  }

  const sharingAvailable = await Sharing.isAvailableAsync();

  if (!sharingAvailable) {
    throw new Error("Native file sharing is not available on this device.");
  }

  const exportDirectory =
    FileSystem.cacheDirectory ?? FileSystem.documentDirectory;

  if (!exportDirectory) {
    throw new Error(
      "No writable temporary directory is available for GPX sharing.",
    );
  }

  const name = createTripShareTitle(trip);
  const fileUri = exportDirectory + createGpxFileName(name);
  const gpx = createGpxDocument(coordinates, name);

  await FileSystem.writeAsStringAsync(fileUri, gpx, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  await Sharing.shareAsync(fileUri, {
    dialogTitle: "Sdílet GPX trasu",
    mimeType: "application/gpx+xml",
    UTI: "public.xml",
  });
}
