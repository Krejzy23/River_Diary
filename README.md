# River Diary

Expo + React Native + TypeScript appka pro zaznam vodackych vyletu.

## Stack

- Expo SDK 56
- React Native 0.85
- TypeScript
- NativeWind + Tailwind CSS
- Firebase JS SDK + Firestore
- React Native DateTimePicker

## Spusteni

```sh
npm install
npm start
npm run ios
npm run android
npm run web
```

Pro bezne testovani ted pouzij Expo Go. Pokud CLI prepnes do `--dev-client`, je potreba nainstalovat `expo-dev-client` a postavit development build:

```sh
npx expo install expo-dev-client
npx expo run:ios
```

Kontrola typu:

```sh
npm run typecheck
```

## Firebase

Zkopiruj `.env.example` do `.env.local` a dopln hodnoty z Firebase web app konfigurace.

App uklada zaznamy do Firestore kolekce `riverTrips`. Bez Firebase konfigurace bezi formular v lokalnim rezimu, aby slo rychle testovat UI.

Zakladni tvar zaznamu:

```ts
type RiverTrip = {
  river: string;
  from: string;
  to: string;
  distanceKm: number;
  crew: string[];
  difficulty: "ZW" | "WW I" | "WW II" | "WW III" | "WW IV+";
  startedAt: string;
  endedAt: string;
  notes?: string;
};
```
Project uses Node 22.
NativeWind v5 requires Tailwind v4 tokens in global.css via @theme.
lightningcss is pinned to 1.30.1 because newer versions caused iOS bundling issues.