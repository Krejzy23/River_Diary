import { TripDifficulty, WaterConditionStatus } from "../types/trip";
import { getWaterConditionStatusLabel } from "../utils/waterCondition";

const CHMI_NOW_METADATA_URL =
  "https://opendata.chmi.cz/hydrology/now/metadata/meta1.json";
const CHMI_NOW_DATA_URL = "https://opendata.chmi.cz/hydrology/now/data/";
const CHMI_RECENT_DATA_URL = "https://opendata.chmi.cz/hydrology/recent/data/";
const RIVER_FLOW_SERIES_DAYS = 21;

export type RiverSectionPart = "Horní tok" | "Střední tok" | "Dolní tok";

export type NavigabilityTone =
  | "danger"
  | "warning"
  | "good"
  | "strong"
  | "unknown";

export type NavigabilityAlert = {
  description: string;
  label: string;
  tone: NavigabilityTone;
};

export type PaddlingLevelLimits = {
  goodFromCm: number;
  goodToCm: number;
  minLevelCm: number;
  note: string;
  sourceLabel: string;
  tooHighCm: number;
};

export type PaddlingLimitOverride = Partial<
  Pick<
    PaddlingLevelLimits,
    "goodFromCm" | "goodToCm" | "minLevelCm" | "note" | "sourceLabel" | "tooHighCm"
  >
> & {
  difficulty?: TripDifficulty;
  sectionLabel: string;
};

export type RiverFlowSectionPreset = {
  gaugeId: string;
  part: RiverSectionPart;
  river: string;
  sectionDescription: string;
  sectionHint: string;
};

export type RiverFlowSeriesPoint = {
  flowM3s?: number;
  levelCm?: number;
  measuredAt: string;
};

export type RiverFlowSnapshot = RiverFlowSectionPreset & {
  alert: NavigabilityAlert;
  dryFlowM3s?: number;
  dryLevelCm?: number;
  flowM3s?: number;
  highFlowM3s?: number;
  highLevelCm?: number;
  latitude?: number;
  levelCm?: number;
  longitude?: number;
  measuredAt?: string;
  difficulty: TripDifficulty;
  paddlingLimits: PaddlingLevelLimits;
  paddlingSectionName: string;
  sourceUrl: string;
  stationName: string;
  status: WaterConditionStatus;
  statusLabel: string;
};

export type RiverFlowOverview = {
  latestMeasuredAt?: string;
  navigableSections: RiverFlowSnapshot[];
  river: string;
  riverDescription: string;
  sections: RiverFlowSnapshot[];
};

type StationMetadata = {
  dryFlowM3s?: number;
  dryLevelCm?: number;
  gaugeId: string;
  highFlowM3s?: number;
  highLevelCm?: number;
  latitude?: number;
  longitude?: number;
  stationName: string;
  streamName: string;
};

type MetadataResponse = {
  data?: {
    data?: {
      header?: string;
      values?: unknown[][];
    };
  };
};

type MeasurementResponse = {
  objList?: Array<{
    objID?: string;
    tsList?: Array<{
      tsConID?: string;
      tsData?: Array<{ dt?: string; value?: number | null }>;
      unit?: string;
    }>;
  }>;
};

const riverFlowDescriptions: Record<string, string> = {
  Berounka: "Plzeňsko, Křivoklátsko a dolní tok k Praze.",
  Blanice: "Šumavské podhůří, Husinecko a dolní tok k Otavě.",
  "Divoká Orlice": "Orlické hory, Klášterec a údolí ke Kostelci.",
  Dyje: "Podyjí, Znojemsko, Novomlýnské nádrže a dolní tok k Břeclavi.",
  Jizera: "Jizerské hory, Podkrkonoší a dolní tok k Polabí.",
  Kamenice: "Severní Čechy, skalnatější úseky a soutěsky kolem Hřenska.",
  Lužnice: "Třeboňsko, Veselsko, Tábor a dolní tok k Bechyni.",
  Malše: "Novohradské podhůří, Kaplicko a České Budějovice.",
  Morava: "Jeseníky, Litovelské Pomoraví, Haná a dolní tok ke Slovácku.",
  Nežárka: "Jindřichohradecko, Lásenicko a klidnější jihočeský tok k Lužnici.",
  Ohře: "Západní Čechy, Karlovarsko a dolní tok k Lounům.",
  Oslava: "Vysočina a údolní úseky pod Mostištěm směrem k Oslavanům.",
  Otava: "Šumava, Sušicko, Strakonicko a Písecko.",
  Ploučnice: "Ralsko, Česká Lípa a dolní tok k Děčínu.",
  Sázava: "Vysočina, Posázaví, Kácovsko a dolní peřejnatější úseky.",
  Svratka: "Žďárské vrchy, Vír a vodácká orientace u Brněnska.",
  "Tichá Orlice": "Orlické hory, Ústeckoorlicko a soutokové úseky k Orlici.",
  Vltava: "Šumava, Českokrumlovsko a hlavní letní vodácká osa.",
};

export const levelGuide = [
  {
    description: "Pod minimem čekej drhnutí, přenášení a špatnou čitelnost.",
    label: "Nesjízdné",
    tone: "danger",
  },
  {
    description: "Mezi minimem a dobrou vodou počítej spíš s plastem.",
    label: "Nízká voda",
    tone: "warning",
  },
  {
    description: "Rozumné rozmezí pro běžné lodě na daném úseku.",
    label: "Ideální voda",
    tone: "good",
  },
  {
    description: "Více vody, rychlejší proud a vyšší nároky na posádku.",
    label: "Vydatná voda",
    tone: "strong",
  },
  {
    description: "Nad horním limitem raději nejezdi bez lokální znalosti.",
    label: "Moc vody",
    tone: "danger",
  },
] satisfies NavigabilityAlert[];

const riverLimitScales: Record<
  string,
  "calm" | "large" | "medium" | "small" | "technical"
> = {
  Berounka: "medium",
  Blanice: "small",
  "Divoká Orlice": "technical",
  Dyje: "large",
  Jizera: "technical",
  Kamenice: "technical",
  Lužnice: "calm",
  Malše: "small",
  Morava: "large",
  Nežárka: "calm",
  Ohře: "medium",
  Oslava: "technical",
  Otava: "medium",
  Ploučnice: "calm",
  Sázava: "medium",
  Svratka: "technical",
  "Tichá Orlice": "small",
  Vltava: "large",
};

const starterLimitsByScale: Record<
  RiverSectionPart,
  Record<NonNullable<(typeof riverLimitScales)[string]>, Omit<PaddlingLevelLimits, "note" | "sourceLabel">>
> = {
  "Horní tok": {
    calm: { goodFromCm: 50, goodToCm: 95, minLevelCm: 38, tooHighCm: 135 },
    large: { goodFromCm: 70, goodToCm: 135, minLevelCm: 55, tooHighCm: 195 },
    medium: { goodFromCm: 60, goodToCm: 115, minLevelCm: 45, tooHighCm: 165 },
    small: { goodFromCm: 55, goodToCm: 100, minLevelCm: 42, tooHighCm: 145 },
    technical: { goodFromCm: 65, goodToCm: 110, minLevelCm: 50, tooHighCm: 155 },
  },
  "Střední tok": {
    calm: { goodFromCm: 55, goodToCm: 105, minLevelCm: 42, tooHighCm: 150 },
    large: { goodFromCm: 80, goodToCm: 155, minLevelCm: 62, tooHighCm: 230 },
    medium: { goodFromCm: 65, goodToCm: 125, minLevelCm: 50, tooHighCm: 180 },
    small: { goodFromCm: 60, goodToCm: 110, minLevelCm: 45, tooHighCm: 160 },
    technical: { goodFromCm: 70, goodToCm: 125, minLevelCm: 55, tooHighCm: 175 },
  },
  "Dolní tok": {
    calm: { goodFromCm: 60, goodToCm: 115, minLevelCm: 45, tooHighCm: 165 },
    large: { goodFromCm: 90, goodToCm: 175, minLevelCm: 70, tooHighCm: 260 },
    medium: { goodFromCm: 75, goodToCm: 140, minLevelCm: 58, tooHighCm: 205 },
    small: { goodFromCm: 65, goodToCm: 120, minLevelCm: 50, tooHighCm: 175 },
    technical: { goodFromCm: 75, goodToCm: 135, minLevelCm: 58, tooHighCm: 190 },
  },
};

const starterDifficultyByScale: Record<
  RiverSectionPart,
  Record<NonNullable<(typeof riverLimitScales)[string]>, TripDifficulty>
> = {
  "Horní tok": {
    calm: "ZWA",
    large: "ZWA",
    medium: "WWI",
    small: "WWI",
    technical: "WWII",
  },
  "Střední tok": {
    calm: "ZWA",
    large: "ZWA",
    medium: "ZWC",
    small: "WWI",
    technical: "WWI",
  },
  "Dolní tok": {
    calm: "ZWA",
    large: "ZWA",
    medium: "ZWC",
    small: "ZWC",
    technical: "WWI",
  },
};

export const riverFlowSections: RiverFlowSectionPreset[] = [
  {
    gaugeId: "0-203-1-109500",
    part: "Horní tok",
    river: "Vltava",
    sectionDescription: "Lenora a vodácký horní úsek pouze s povolením splutí od NP Šumava.",
    sectionHint: "Zátoň",
  },
  {
    gaugeId: "0-203-1-109000",
    part: "Střední tok",
    river: "Vltava",
    sectionDescription: "Vyšší Brod a vodácky nejčastější úsek.",
    sectionHint: "Vyšší Brod",
  },
  {
    gaugeId: "0-203-1-169000",
    part: "Dolní tok",
    river: "Vltava",
    sectionDescription: "Dolní Vltava pod Prahou a širší orientace průtoku.",
    sectionHint: "Zbraslav",
  },

  {
    gaugeId: "0-203-1-155000",
    part: "Horní tok",
    river: "Sázava",
    sectionDescription: "Ždár nad Sázavou až Havlíčkobrodsko.",
    sectionHint: "Sázava",
  },
  {
    gaugeId: "0-203-1-161000",
    part: "Střední tok",
    river: "Sázava",
    sectionDescription: "Střední úsek kolem Zruče a Kácova.",
    sectionHint: "Zruč nad Sázavou",
  },
  {
    gaugeId: "0-203-1-167200",
    part: "Dolní tok",
    river: "Sázava",
    sectionDescription: "Dolní Sázava směrem k Pikovicím.",
    sectionHint: "Nespeky",
  },

  {
    gaugeId: "0-203-1-122000",
    part: "Horní tok",
    river: "Lužnice",
    sectionDescription: "Hornější vodácký úsek po stará řece.",
    sectionHint: "Kazdovna",
  },
  {
    gaugeId: "0-203-1-123000",
    part: "Střední tok",
    river: "Lužnice",
    sectionDescription: "Střední Lužnice z Rožmberka na Veselí.",
    sectionHint: "Frahelž",
  },
  {
    gaugeId: "0-203-1-131000",
    part: "Dolní tok",
    river: "Lužnice",
    sectionDescription: "Dolní Lužnice z Veselí do Tábora.",
    sectionHint: "Tábor",
  },

  {
    gaugeId: "0-203-1-207300",
    part: "Horní tok",
    river: "Ohře",
    sectionDescription: "Hornější Ohře mezi Chebskem a Sokolovskem.",
    sectionHint: "Citice",
  },
  {
    gaugeId: "0-203-1-214000",
    part: "Střední tok",
    river: "Ohře",
    sectionDescription: "Vodácky oblíbený úsek kolem Karlových Varů.",
    sectionHint: "Karlovy Vary",
  },
  {
    gaugeId: "0-203-1-219000",
    part: "Dolní tok",
    river: "Ohře",
    sectionDescription: "Dolní Ohře směrem k Lounům a Litoměřicím.",
    sectionHint: "Louny",
  },

  {
    gaugeId: "0-203-1-186000",
    part: "Horní tok",
    river: "Berounka",
    sectionDescription: "Hornější Berounka z Plzně na Chrást.",
    sectionHint: "0-203-1-186000",
  },
  {
    gaugeId: "0-203-1-194500",
    part: "Střední tok",
    river: "Berounka",
    sectionDescription: "Střední Berounka kolem Křivoklátska.",
    sectionHint: "Zbečno",
  },
  {
    gaugeId: "0-203-1-198000",
    part: "Dolní tok",
    river: "Berounka",
    sectionDescription: "Od Berouna směrem k Třebáni a Praze.",
    sectionHint: "Beroun",
  },

  {
    gaugeId: "0-203-1-137000",
    part: "Horní tok",
    river: "Otava",
    sectionDescription: "Horní Otava pod soutokem šumavských zdrojnic.",
    sectionHint: "Rejštejn",
  },
  {
    gaugeId: "0-203-1-138000",
    part: "Střední tok",
    river: "Otava",
    sectionDescription: "Oblíbený úsek Sušice a okolí.",
    sectionHint: "Sušice",
  },
  {
    gaugeId: "0-203-1-151000",
    part: "Dolní tok",
    river: "Otava",
    sectionDescription: "Dolní Otava směrem k Písku.",
    sectionHint: "Písek",
  },

  {
    gaugeId: "0-203-1-084500",
    part: "Horní tok",
    river: "Jizera",
    sectionDescription: "Horní Jizera v podkrkonošském úseku.",
    sectionHint: "Jablonec nad Jizerou",
  },
  {
    gaugeId: "0-203-1-091000",
    part: "Střední tok",
    river: "Jizera",
    sectionDescription: "Střední Jizera kolem Železného Brodu.",
    sectionHint: "Železný Brod",
  },
  {
    gaugeId: "0-203-1-098000",
    part: "Dolní tok",
    river: "Jizera",
    sectionDescription: "Dolní Jizera směrem k Mladé Boleslavi.",
    sectionHint: "Bakov nad Jizerou",
  },

  {
    gaugeId: "0-203-1-231000",
    part: "Horní tok",
    river: "Ploučnice",
    sectionDescription: "Hornější Ploučnice kolem Stráže pod Ralskem.",
    sectionHint: "Stráž pod Ralskem",
  },
  {
    gaugeId: "0-203-1-235000",
    part: "Střední tok",
    river: "Ploučnice",
    sectionDescription: "Střední Ploučnice kolem České Lípy.",
    sectionHint: "Česká Lípa",
  },
  {
    gaugeId: "0-203-1-239000",
    part: "Dolní tok",
    river: "Ploučnice",
    sectionDescription: "Dolní Ploučnice směrem k Děčínu.",
    sectionHint: "Benešov nad Ploučnicí",
  },

  {
    gaugeId: "0-203-1-090000",
    part: "Horní tok",
    river: "Kamenice",
    sectionDescription:
      "Hornější Kamenice v jizerském/podkrkonošském charakteru.",
    sectionHint: "Bohuňovsko-Jesenný",
  },
  {
    gaugeId: "0-203-1-241000",
    part: "Střední tok",
    river: "Kamenice",
    sectionDescription: "Střední Kamenice kolem Srbské Kamenice.",
    sectionHint: "Srbská Kamenice",
  },
  {
    gaugeId: "0-203-1-244000",
    part: "Dolní tok",
    river: "Kamenice",
    sectionDescription: "Dolní Kamenice u Hřenska.",
    sectionHint: "Hřensko",
  },

  {
    gaugeId: "0-203-1-023500",
    part: "Horní tok",
    river: "Divoká Orlice",
    sectionDescription: "Horní Divoká Orlice u Orlického Záhoří.",
    sectionHint: "Orlické Záhoří",
  },
  {
    gaugeId: "0-203-1-024000",
    part: "Střední tok",
    river: "Divoká Orlice",
    sectionDescription: "Střední část kolem Klášterce nad Orlicí.",
    sectionHint: "Klášterec nad Orlicí",
  },
  {
    gaugeId: "0-203-1-028000",
    part: "Dolní tok",
    river: "Divoká Orlice",
    sectionDescription: "Dolní Divoká Orlice před soutokem.",
    sectionHint: "Kostelec nad Orlicí",
  },

  {
    gaugeId: "0-203-1-032000",
    part: "Horní tok",
    river: "Tichá Orlice",
    sectionDescription: "Hornější Tichá Orlice pod Lichkovem a Sobkovicemi.",
    sectionHint: "Sobkovice",
  },
  {
    gaugeId: "0-203-1-034000",
    part: "Střední tok",
    river: "Tichá Orlice",
    sectionDescription: "Střední tok kolem Ústí nad Orlicí a Brandýsa.",
    sectionHint: "Dolní Libchavy",
  },
  {
    gaugeId: "0-203-1-036000",
    part: "Dolní tok",
    river: "Tichá Orlice",
    sectionDescription: "Dolní Tichá Orlice směrem k soutoku s Divokou Orlicí.",
    sectionHint: "Čermná nad Orlicí",
  },

  {
    gaugeId: "0-203-1-471000",
    part: "Horní tok",
    river: "Oslava",
    sectionDescription: "Horní úsek pod Mostištěm.",
    sectionHint: "Mostiště pod přehradou",
  },
  {
    gaugeId: "0-203-1-473000",
    part: "Střední tok",
    river: "Oslava",
    sectionDescription: "Střední Oslava kolem Nesměře.",
    sectionHint: "Nesměř",
  },
  {
    gaugeId: "0-203-1-474000",
    part: "Dolní tok",
    river: "Oslava",
    sectionDescription: "Dolní Oslava směrem k Oslavanům.",
    sectionHint: "Oslavany",
  },

  {
    gaugeId: "0-203-1-442000",
    part: "Horní tok",
    river: "Svratka",
    sectionDescription: "Horní Svratka v úseku kolem Dalečína.",
    sectionHint: "Dalečín",
  },
  {
    gaugeId: "0-203-1-445000",
    part: "Střední tok",
    river: "Svratka",
    sectionDescription: "Střední úsek pod Vírem.",
    sectionHint: "Vír",
  },
  {
    gaugeId: "0-203-1-448000",
    part: "Dolní tok",
    river: "Svratka",
    sectionDescription: "Dolní vodácká orientace kolem Veverské Bítýšky.",
    sectionHint: "Veverská Bítýška",
  },

  {
    gaugeId: "0-203-1-112000",
    part: "Horní tok",
    river: "Malše",
    sectionDescription: "Horní Malše kolem Kaplice.",
    sectionHint: "Kaplice",
  },
  {
    gaugeId: "0-203-1-112600",
    part: "Střední tok",
    river: "Malše",
    sectionDescription: "Střední Malše kolem Pořešína.",
    sectionHint: "Pořešín",
  },
  {
    gaugeId: "0-203-1-115000",
    part: "Dolní tok",
    river: "Malše",
    sectionDescription: "Dolní Malše před Českými Budějovicemi.",
    sectionHint: "Roudné",
  },

  {
    gaugeId: "0-203-1-145000",
    part: "Horní tok",
    river: "Blanice",
    sectionDescription: "Horní Blanice kolem Blanického mlýna.",
    sectionHint: "Blanický mlýn",
  },
  {
    gaugeId: "0-203-1-148000",
    part: "Střední tok",
    river: "Blanice",
    sectionDescription: "Střední Blanice pod Husincem.",
    sectionHint: "Husinec",
  },
  {
    gaugeId: "0-203-1-150000",
    part: "Dolní tok",
    river: "Blanice",
    sectionDescription: "Dolní Blanice směrem k Heřmani.",
    sectionHint: "Heřmaň",
  },

  {
    gaugeId: "0-203-1-341000",
    part: "Horní tok",
    river: "Morava",
    sectionDescription: "Horní Morava pod Jeseníky a Králickým Sněžníkem.",
    sectionHint: "Vlaské",
  },
  {
    gaugeId: "0-203-1-355000",
    part: "Střední tok",
    river: "Morava",
    sectionDescription: "Střední Morava kolem Litovelského Pomoraví.",
    sectionHint: "Moravičany",
  },
  {
    gaugeId: "0-203-1-367000",
    part: "Dolní tok",
    river: "Morava",
    sectionDescription: "Dolní Morava od Hynkova do Olomouce .",
    sectionHint: "Olomouc",
  },

  {
    gaugeId: "0-203-1-430000",
    part: "Horní tok",
    river: "Dyje",
    sectionDescription: "Hornější Dyje v úseku kolem Podhradí nad Dyjí.",
    sectionHint: "Podhradí nad Dyjí",
  },
  {
    gaugeId: "0-203-1-435000",
    part: "Střední tok",
    river: "Dyje",
    sectionDescription: "Střední Dyje kolem Znojma a Podyjí.",
    sectionHint: "Znojmo",
  },
  {
    gaugeId: "0-203-1-480500",
    part: "Dolní tok",
    river: "Dyje",
    sectionDescription: "Dolní Dyje pod Novými Mlýny směrem k Břeclavi.",
    sectionHint: "Břeclav-Ladná",
  },

  {
    gaugeId: "0-203-1-124000",
    part: "Horní tok",
    river: "Nežárka",
    sectionDescription: "Horní Nežárka v okolí Jindřichohradecka.",
    sectionHint: "Rodvínov",
  },
  {
    gaugeId: "0-203-1-127000",
    part: "Střední tok",
    river: "Nežárka",
    sectionDescription: "Střední Nežárka kolem Lásenice a Stráže nad Nežárkou.",
    sectionHint: "Lásenice",
  },
  {
    gaugeId: "0-203-1-129000",
    part: "Dolní tok",
    river: "Nežárka",
    sectionDescription: "Dolní Nežárka před soutokem s Lužnicí.",
    sectionHint: "Hamr",
  },
];

export const paddlingLimitOverridesByGaugeId: Record<
  string,
  PaddlingLimitOverride
> = {
  // Pro ruční obtížnost doplň k profilu například: difficulty: "WWI",
  "0-203-1-109500": {
    sectionLabel: "Vltava / Horní tok / Zátoň",
    minLevelCm: 45,
    goodFromCm: 55,
    goodToCm: 100,
    tooHighCm: 130,
    difficulty: "ZWC",
    note: "K splutí pouze na jaře nebo při vydatných deštích.",
    sourceLabel: "Ruční vodácký limit",
  },
  "0-203-1-109000": {
    sectionLabel: "Vltava / Střední tok / Vyšší Brod",
    minLevelCm: 58,
    goodFromCm: 65,
    goodToCm: 110,
    tooHighCm: 150,
    difficulty: "WWI-",
    note: "K splutí většinou celoročně.",
    sourceLabel: "Ruční vodácký limit",
  },
  "0-203-1-169000": {
    sectionLabel: "Vltava / Dolní tok / Zbraslav",
    minLevelCm: 800,
    goodFromCm: 900,
    goodToCm: 1000,
    tooHighCm: 1200,
    difficulty: "ZWA",
    note: "Celoroční splutí, vodácky nezajímavé.",
    sourceLabel: "Ruční vodácký limit",
  },

  "0-203-1-155000": {
    sectionLabel: "Sázava / Horní tok / Sázava",
    minLevelCm: 85,
    goodFromCm: 100,
    goodToCm: 130,
    tooHighCm: 160,
    difficulty: "WWI+",
    note: "K splutí pouze na jaře nebo při vydatných deštích.",
    sourceLabel: "Ruční vodácký limit",
  },
  "0-203-1-161000": {
    sectionLabel: "Sázava / Střední tok / Zruč nad Sázavou",
    minLevelCm: 40,
    goodFromCm: 100,
    goodToCm: 160,
    tooHighCm: 200,
    difficulty: "ZWC",
    note: "K splutí většinou celoročně.",
    sourceLabel: "Ruční vodácký limit",
  },
  "0-203-1-167200": {
    sectionLabel: "Sázava / Dolní tok / Nespeky",
    minLevelCm: 50,
    goodFromCm: 120,
    goodToCm: 160,
    tooHighCm: 180,
    difficulty: "WWII",
    note: "K splutí většinou celoročně nebo po deštích.",
    sourceLabel: "Ruční vodácký limit",
  },

  "0-203-1-122000": {
    sectionLabel: "Lužnice / Horní tok / Kazdovna",
    minLevelCm: 40,
    goodFromCm: 60,
    goodToCm: 160,
    tooHighCm: 190,
    difficulty: "ZWC",
    note: "K splutí většinou celoročně nebo po deštích.",
    sourceLabel: "Ruční vodácký limit",
  },
  "0-203-1-123000": {
    sectionLabel: "Lužnice / Střední tok / Frahelž",
    minLevelCm: 40,
    goodFromCm: 70,
    goodToCm: 140,
    tooHighCm: 170,
    difficulty: "ZWC",
    note: "K splutí většinou celoročně nebo po deštích.",
    sourceLabel: "Ruční vodácký limit",
  },
  "0-203-1-131000": {
    sectionLabel: "Lužnice / Dolní tok / Tábor",
    minLevelCm: 53,
    goodFromCm: 85,
    goodToCm: 160,
    tooHighCm: 190,
    difficulty: "ZWC+",
    note: "K splutí většinou celoročně.",
    sourceLabel: "Ruční vodácký limit",
  },

  "0-203-1-207300": {
    sectionLabel: "Ohře / Horní tok / Citice",
    minLevelCm: 62,
    goodFromCm: 90,
    goodToCm: 130,
    tooHighCm: 160,
    difficulty: "ZWC",
    note: "K splutí většinou celoročně nebo po deštích.",
    sourceLabel: "Ruční vodácký limit",
  },
  "0-203-1-214000": {
    sectionLabel: "Ohře / Střední tok / Karlovy Vary",
    minLevelCm: 37,
    goodFromCm: 67,
    goodToCm: 150,
    tooHighCm: 190,
    difficulty: "WWI+",
    note: "K splutí většinou celoročně nebo po deštích.",
    sourceLabel: "Ruční vodácký limit",
  },
  "0-203-1-219000": {
    sectionLabel: "Ohře / Dolní tok / Louny",
    minLevelCm: 165,
    goodFromCm: 200,
    goodToCm: 300,
    tooHighCm: 400,
    difficulty: "ZWB",
    note: "K splutí celoročně.",
    sourceLabel: "Ruční vodácký limit",
  },

  "0-203-1-186000": {
    sectionLabel: "Berounka / Horní tok / Plzeň-Bílá Hora",
    minLevelCm: 89,
    goodFromCm: 120,
    goodToCm: 200,
    tooHighCm: 250,
    difficulty: "ZWC+",
    note: "K splutí celoročně.",
    sourceLabel: "Ruční vodácký limit",

  },
  "0-203-1-194500": {
    sectionLabel: "Berounka / Střední tok / Zbečno",
    minLevelCm: 154,
    goodFromCm: 180,
    goodToCm: 220,
    tooHighCm: 240,
    difficulty: "ZWC",
    note: "K splutí celoročně.",
    sourceLabel: "Ruční vodácký limit",
  },
  "0-203-1-198000": {
    sectionLabel: "Berounka / Dolní tok / Beroun",
    minLevelCm: 92,
    goodFromCm: 110,
    goodToCm: 180,
    tooHighCm: 260,
    difficulty: "ZWC",
    note: "K splutí celoročně.",
    sourceLabel: "Ruční vodácký limit",
  },

  "0-203-1-137000": {
    sectionLabel: "Otava / Horní tok / Rejštejn",
    minLevelCm: 52,
    goodFromCm: 80,
    goodToCm: 110,
    tooHighCm: 140,
    difficulty: "WWIII-",
    note: "K splutí celoročně.",
    sourceLabel: "Ruční vodácký limit",
  },
  "0-203-1-138000": {
    sectionLabel: "Otava / Střední tok / Sušice",
    minLevelCm: 25,
    goodFromCm: 55,
    goodToCm: 85,
    tooHighCm: 120,
    difficulty: "WWI",
    note: "K splutí celoročně.",
    sourceLabel: "Ruční vodácký limit",
  },
  "0-203-1-151000": {
    sectionLabel: "Otava / Dolní tok / Písek",
    minLevelCm: 47,
    goodFromCm: 70,
    goodToCm: 200,
    tooHighCm: 250,
    difficulty: "ZWB",
    note: "K splutí celoročně.",
    sourceLabel: "Ruční vodácký limit",
  },

  "0-203-1-084500": {
    sectionLabel: "Jizera / Horní tok / Jablonec nad Jizerou",
    minLevelCm: 35,
    goodFromCm: 70,
    goodToCm: 120,
    tooHighCm: 150,
    difficulty: "WWII",
    note: "K splutí pouze na jaře nebo při vydatných deštích.",
    sourceLabel: "Ruční vodácký limit",
  },
  "0-203-1-091000": {
    sectionLabel: "Jizera / Střední tok / Železný Brod",
    minLevelCm: 100,
    goodFromCm: 130,
    goodToCm: 190,
    tooHighCm: 220,
    difficulty: "WWI-",
    note: "K splutí pouze na jaře nebo při vydatných deštích.",
    sourceLabel: "Ruční vodácký limit",
  },
  "0-203-1-098000": {
    sectionLabel: "Jizera / Dolní tok / Bakov nad Jizerou",
    minLevelCm: 124,
    goodFromCm: 150,
    goodToCm: 400,
    tooHighCm: 480,
    difficulty: "ZWC",
    note: "K splutí pouze na jaře nebo při vydatných deštích.",
    sourceLabel: "Ruční vodácký limit",
  },
  "0-203-1-231000": {
    sectionLabel: "Ploučnice / Horní tok / Stráž pod Ralskem",
    minLevelCm: 35,
    goodFromCm: 50,
    goodToCm: 100,
    tooHighCm: 120,
    difficulty: "ZWC",
    note: "K splutí pouze na jaře nebo při vydatných deštích.",
    sourceLabel: "Ruční vodácký limit",
  },
  "0-203-1-235000": {
    sectionLabel: "Ploučnice / Střední tok / Česká Lípa",
    minLevelCm: 35,
    goodFromCm: 50,
    goodToCm: 100,
    tooHighCm: 120,
    difficulty: "ZWC",
    note: "K splutí pouze na jaře nebo při vydatných deštích.",
    sourceLabel: "Ruční vodácký limit",
  },
  "0-203-1-239000": {
    sectionLabel: "Ploučnice / Dolní tok / Benešov nad Ploučnicí",
    minLevelCm: 85,
    goodFromCm: 110,
    goodToCm: 130,
    tooHighCm: 150,
    difficulty: "WWI",
    note: "K splutí pouze na jaře nebo při vydatných deštích.",
    sourceLabel: "Ruční vodácký limit",
  },

  "0-203-1-090000": {
    sectionLabel: "Kamenice / Horní tok / Bohuňovsko-Jesenný",
    minLevelCm: 35,
    goodFromCm: 60,
    goodToCm: 100,
    tooHighCm: 120,
    difficulty: "WWII",
    note: "K splutí pouze na jaře nebo při vydatných deštích.",
    sourceLabel: "Ruční vodácký limit",
  },
  "0-203-1-241000": {
    sectionLabel: "Kamenice / Střední tok / Srbská Kamenice",
    minLevelCm: 40,
    goodFromCm: 60,
    goodToCm: 100,
    tooHighCm: 130,
    difficulty: "WWII",
    note: "K splutí pouze na jaře nebo při vydatných deštích.",
    sourceLabel: "Ruční vodácký limit",
  },
  "0-203-1-244000": {
    sectionLabel: "Kamenice / Dolní tok / Hřensko",
    minLevelCm: 40,
    goodFromCm: 60,
    goodToCm: 90,
    tooHighCm: 110,
    difficulty: "WWII",
    note: "K splutí pouze na jaře nebo při vydatných deštích.",
    sourceLabel: "Ruční vodácký limit",
  },

  "0-203-1-023500": {
    sectionLabel: "Divoká Orlice / Horní tok / Orlické Záhoří",
    minLevelCm: 35,
    goodFromCm: 60,
    goodToCm: 100,
    tooHighCm: 130,
    difficulty: "WWII",
    note: "K splutí pouze na jaře nebo při vydatných deštích.",
    sourceLabel: "Ruční vodácký limit",
  },
  "0-203-1-024000": {
    sectionLabel: "Divoká Orlice / Střední tok / Klášterec nad Orlicí",
    minLevelCm: 35,
    goodFromCm: 60,
    goodToCm: 100,
    tooHighCm: 130,
    difficulty: "WWII+",
    note: "K splutí pouze na jaře nebo při vydatných deštích.",
    sourceLabel: "Ruční vodácký limit",
  },
  "0-203-1-028000": {
    sectionLabel: "Divoká Orlice / Dolní tok / Kostelec nad Orlicí",
    minLevelCm: 35,
    goodFromCm: 55,
    goodToCm: 150,
    tooHighCm: 180,
    difficulty: "ZWA",
    note: "K splutí pouze na jaře nebo při vydatných deštích.",
    sourceLabel: "Ruční vodácký limit",
  },

  "0-203-1-032000": {
    sectionLabel: "Tichá Orlice / Horní tok / Sobkovice",
    minLevelCm: 35,
    goodFromCm: 50,
    goodToCm: 120,
    tooHighCm: 150,
    difficulty: "WWI-WWII",
    note: "K splutí pouze na jaře nebo při vydatných deštích.",
    sourceLabel: "Ruční vodácký limit",
  },
  "0-203-1-034000": {
    sectionLabel: "Tichá Orlice / Střední tok / Dolní Libchavy",
    minLevelCm: 35,
    goodFromCm: 50,
    goodToCm: 200,
    tooHighCm: 230,
    difficulty: "WWI",
    note: "K splutí pouze na jaře nebo při vydatných deštích.",
    sourceLabel: "Ruční vodácký limit",
  },
  "0-203-1-036000": {
    sectionLabel: "Tichá Orlice / Dolní tok / Čermná nad Orlicí",
    minLevelCm: 32,
    goodFromCm: 45,
    goodToCm: 150,
    tooHighCm: 180,
    difficulty: "ZWC",
    note: "K splutí pouze na jaře nebo při vydatných deštích.",
    sourceLabel: "Ruční vodácký limit",
  },

  "0-203-1-471000": {
    sectionLabel: "Oslava / Horní tok / Mostiště pod přehradou",
    minLevelCm: 25,
    goodFromCm: 40,
    goodToCm: 70,
    tooHighCm: 90,
    difficulty: "WWII-",
    note: "K splutí při vypouštění přehrady Mostiště!",
    sourceLabel: "Ruční vodácký limit",
  },
  "0-203-1-473000": {
    sectionLabel: "Oslava / Střední tok / Nesměř",
    minLevelCm: 65,
    goodFromCm: 90,
    goodToCm: 180,
    tooHighCm: 220,
    difficulty: "WWI",
    note: "K splutí při vypouštění přehrady Mostiště!",
    sourceLabel: "Ruční vodácký limit",
  },
  "0-203-1-474000": {
    sectionLabel: "Oslava / Dolní tok / Oslavany",
    minLevelCm: 65,
    goodFromCm: 90,
    goodToCm: 170,
    tooHighCm: 200,
    difficulty: "WWI-",
    note: "K splutí při vypouštění přehrady Mostiště!",
    sourceLabel: "Ruční vodácký limit",
  },

  "0-203-1-442000": {
    sectionLabel: "Svratka / Horní tok / Dalečín",
    minLevelCm: 45,
    goodFromCm: 75,
    goodToCm: 110,
    tooHighCm: 130,
    difficulty: "WWI-WWII",
    note: "K splutí pouze na jaře nebo při vydatných deštích.",
    sourceLabel: "Ruční vodácký limit",
  },
  "0-203-1-445000": {
    sectionLabel: "Svratka / Střední tok / Vír",
    minLevelCm: 45,
    goodFromCm: 75,
    goodToCm: 110,
    tooHighCm: 130,
    difficulty: "WWI",
    note: "K splutí pouze při vypouštění Vírské přehrady!",
    sourceLabel: "Ruční vodácký limit",
  },
  "0-203-1-448000": {
    sectionLabel: "Svratka / Dolní tok / Veverská Bítýška",
    minLevelCm: 115,
    goodFromCm: 130,
    goodToCm: 190,
    tooHighCm: 220,
    difficulty: "ZWA",
    note: "K splutí pouze při vypouštění Vírské přehrady!",
    sourceLabel: "Ruční vodácký limit",
  },
  "0-203-1-112000": {
    sectionLabel: "Malše / Horní tok / Kaplice",
    minLevelCm: 40,
    goodFromCm: 70,
    goodToCm: 110,
    tooHighCm: 130,
    difficulty: "WWI",
    note: "K splutí pouze na jaře nebo při vydatných deštích.",
    sourceLabel: "Ruční vodácký limit",
  },
  "0-203-1-112600": {
    sectionLabel: "Malše / Střední tok / Pořešín",
    minLevelCm: 65,
    goodFromCm: 95,
    goodToCm: 125,
    tooHighCm: 155,
    difficulty: "ZWC",
    note: "K splutí pouze při vypouštění z přehrady Římov!",
    sourceLabel: "Ruční vodácký limit",
  },
  "0-203-1-115000": {
    sectionLabel: "Malše / Dolní tok / Roudné",
    minLevelCm: 40,
    goodFromCm: 70,
    goodToCm: 130,
    tooHighCm: 160,
    difficulty: "ZWC",
    note: "K splutí pouze při vypouštění z přehrady Římov!",
    sourceLabel: "Ruční vodácký limit",
  },

  "0-203-1-145000": {
    sectionLabel: "Blanice / Horní tok / Blanický mlýn",
    minLevelCm: 35,
    goodFromCm: 50,
    goodToCm: 100,
    tooHighCm: 120,
    difficulty: "ZWC",
    note: "K splutí pouze na jaře nebo při vydatných deštích.",
    sourceLabel: "Ruční vodácký limit",
  },
  "0-203-1-148000": {
    sectionLabel: "Blanice / Střední tok / Husinec",
    minLevelCm: 35,
    goodFromCm: 50,
    goodToCm: 80,
    tooHighCm: 100,
    difficulty: "WWII-",
    note: "K splutí pouze při vypouštění z přehrady Husinec!",
    sourceLabel: "Ruční vodácký limit",
  },
  "0-203-1-150000": {
    sectionLabel: "Blanice / Dolní tok / Heřmaň",
    minLevelCm: 35,
    goodFromCm: 50,
    goodToCm: 100,
    tooHighCm: 120,
    difficulty: "WWI",
    note: "K splutí pouze na jaře nebo při vypouštění z přehrady Husinec!",
    sourceLabel: "Ruční vodácký limit",
  },

  "0-203-1-341000": {
    sectionLabel: "Morava / Horní tok / Vlaské",
    minLevelCm: 125,
    goodFromCm: 150,
    goodToCm: 170,
    tooHighCm: 190,
    difficulty: "WWIII-",
    note: "K splutí pouze na jaře nebo při vydatných deštích.",
    sourceLabel: "Ruční vodácký limit",
  },
  "0-203-1-355000": {
    sectionLabel: "Morava / Střední tok / Moravičany",
    minLevelCm: 72,
    goodFromCm: 100,
    goodToCm: 200,
    tooHighCm: 230,
    difficulty: "WWI-",  
    note: "K splutí většinou celoročně.",
    sourceLabel: "Ruční vodácký limit",
  },
  "0-203-1-367000": {
    sectionLabel: "Morava / Dolní tok / Olomouc",
    minLevelCm: 70,
    goodFromCm: 100,
    goodToCm: 200,
    tooHighCm: 360,
    difficulty: "ZWC",
    note: "K splutí většinou celoročně.",
    sourceLabel: "Ruční vodácký limit",
  },
  "0-203-1-430000": {
    sectionLabel: "Dyje / Horní tok / Podhradí nad Dyjí",
    minLevelCm: 29,
    goodFromCm: 60,
    goodToCm: 150,
    tooHighCm: 180,
    difficulty: "ZWA",
    note: "K splutí většinou celoročně.",
    sourceLabel: "Ruční vodácký limit",
  },
  "0-203-1-435000": {
    sectionLabel: "Dyje / Střední tok / Znojmo",
    minLevelCm: 86,
    goodFromCm: 110,
    goodToCm: 170,
    tooHighCm: 200,
    difficulty: "ZWC",
    note: "K splutí většinou celoročně.",
    sourceLabel: "Ruční vodácký limit",
  },
  "0-203-1-480500": {
    sectionLabel: "Dyje / Dolní tok / Břeclav-Ladná",
    minLevelCm: 12,
    goodFromCm: 40,
    goodToCm: 120,
    tooHighCm: 155,
    difficulty: "ZWA",
    note: "K splutí většinou celoročně.",
    sourceLabel: "Ruční vodácký limit",
  },
  "0-203-1-124000": {
    sectionLabel: "Nežárka / Horní tok / Rodvínov",
    minLevelCm: 13,
    goodFromCm: 35,
    goodToCm: 70,
    tooHighCm: 100,
    difficulty: "ZWB",
    note: "K splutí na jaře nebo po vydatných deštích.",
    sourceLabel: "Ruční vodácký limit",
  },
  "0-203-1-127000": {
    sectionLabel: "Nežárka / Střední tok / Lásenice",
    minLevelCm: 27,
    goodFromCm: 60,
    goodToCm: 120,
    tooHighCm: 150,
    difficulty: "ZWB",
    note: "K splutí většinou celoročně.",
    sourceLabel: "Ruční vodácký limit",
  },
  "0-203-1-129000": {
    sectionLabel: "Nežárka / Dolní tok / Hamr",
    minLevelCm: 83,
    goodFromCm: 120,
    goodToCm: 240,
    tooHighCm: 290,
    difficulty: "ZWB",
    note: "K splutí většinou celoročně.",
    sourceLabel: "Ruční vodácký limit",
  },
};

let stationMetadataCache: StationMetadata[] | null = null;
let stationMetadataPromise: Promise<StationMetadata[]> | null = null;

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function formatLevelLimit(value: number) {
  return value.toFixed(0) + " cm";
}

function createPaddlingSectionName(preset: RiverFlowSectionPreset) {
  return preset.part + " / " + preset.sectionHint;
}

function createStarterPaddlingLimits(
  preset: RiverFlowSectionPreset,
  station?: StationMetadata,
): PaddlingLevelLimits {
  const scale = riverLimitScales[preset.river] ?? "medium";
  const starter = starterLimitsByScale[preset.part][scale];
  const minFromDry =
    station?.dryLevelCm !== undefined
      ? Math.round(station.dryLevelCm * 1.15)
      : starter.minLevelCm;
  const minLevelCm = Math.max(starter.minLevelCm, minFromDry);
  const hydrologyTooHigh = station?.highLevelCm;
  const tooHighCm =
    hydrologyTooHigh !== undefined
      ? Math.max(minLevelCm + 35, Math.min(starter.tooHighCm, hydrologyTooHigh))
      : starter.tooHighCm;
  const goodFromCm = clamp(
    Math.max(starter.goodFromCm, minLevelCm + 8),
    minLevelCm + 5,
    tooHighCm - 20,
  );
  const goodToCm = clamp(
    starter.goodToCm,
    goodFromCm + 10,
    tooHighCm - 8,
  );

  return {
    goodFromCm,
    goodToCm,
    minLevelCm,
    note:
      "Startovní vodácká kalibrace pro " +
      createPaddlingSectionName(preset).toLowerCase() +
      ". Ber ji jako návrh k doladění podle lokální zkušenosti.",
    sourceLabel:
      station?.dryLevelCm !== undefined || station?.highLevelCm !== undefined
        ? "Start + ČHMÚ limity"
        : "Startovní odhad",
    tooHighCm,
  };
}

function hasPaddlingLimitOverrideValues(override?: PaddlingLimitOverride) {
  return Boolean(
    override &&
    (override.minLevelCm !== undefined ||
      override.goodFromCm !== undefined ||
      override.goodToCm !== undefined ||
      override.tooHighCm !== undefined ||
      override.note ||
      override.sourceLabel),
  );
}

function applyPaddlingLimitOverride(
  preset: RiverFlowSectionPreset,
  limits: PaddlingLevelLimits,
) {
  const override = paddlingLimitOverridesByGaugeId[preset.gaugeId];

  if (!hasPaddlingLimitOverrideValues(override)) {
    return limits;
  }

  const minLevelCm = override.minLevelCm ?? limits.minLevelCm;
  const goodFromCm = Math.max(
    override.goodFromCm ?? limits.goodFromCm,
    minLevelCm,
  );
  const goodToCm = Math.max(override.goodToCm ?? limits.goodToCm, goodFromCm);
  const tooHighCm = Math.max(
    override.tooHighCm ?? limits.tooHighCm,
    goodToCm,
  );

  return {
    goodFromCm,
    goodToCm,
    minLevelCm,
    note:
      override.note ??
      "Ruční vodácká kalibrace pro " +
      (override.sectionLabel || createPaddlingSectionName(preset)) +
      ".",
    sourceLabel: override.sourceLabel ?? "Ruční vodácký limit",
    tooHighCm,
  };
}

function createPaddlingLimits(
  preset: RiverFlowSectionPreset,
  station?: StationMetadata,
) {
  return applyPaddlingLimitOverride(
    preset,
    createStarterPaddlingLimits(preset, station),
  );
}

function createPaddlingDifficulty(preset: RiverFlowSectionPreset) {
  const override = paddlingLimitOverridesByGaugeId[preset.gaugeId];
  const scale = riverLimitScales[preset.river] ?? "medium";
  return override?.difficulty ?? starterDifficultyByScale[preset.part][scale];
}

export function getPaddlingDifficultyForGaugeId(gaugeId?: string) {
  if (!gaugeId) {
    return undefined;
  }

  const override = paddlingLimitOverridesByGaugeId[gaugeId];

  if (override?.difficulty) {
    return override.difficulty;
  }

  const preset = riverFlowSections.find((section) => section.gaugeId === gaugeId);

  return preset ? createPaddlingDifficulty(preset) : undefined;
}

export function createPaddlingGuide(limits: PaddlingLevelLimits) {
  return [
    {
      description:
        "Pod " +
        formatLevelLimit(limits.minLevelCm) +
        " čekej drhnutí a časté přenášení.",
      label: "Pod minimem",
      tone: "danger",
    },
    {
      description:
        formatLevelLimit(limits.minLevelCm) +
        " - " +
        formatLevelLimit(limits.goodFromCm) +
        ": sjízdné spíš opatrně a pro odolnější lodě.",
      label: "Nízká voda",
      tone: "warning",
    },
    {
      description:
        formatLevelLimit(limits.goodFromCm) +
        " - " +
        formatLevelLimit(limits.goodToCm) +
        ": nejlepší pracovní rozmezí pro tenhle úsek.",
      label: "Ideální voda",
      tone: "good",
    },
    {
      description:
        formatLevelLimit(limits.goodToCm) +
        " - " +
        formatLevelLimit(limits.tooHighCm) +
        ": rychlejší proud, větší síla vody.",
      label: "Vydatná voda",
      tone: "strong",
    },
    {
      description:
        "Nad " +
        formatLevelLimit(limits.tooHighCm) +
        " ber úsek jako rizikový bez lokální znalosti.",
      label: "Moc vody",
      tone: "danger",
    },
  ] satisfies NavigabilityAlert[];
}

function formatChmiDatePrefix(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return String(year) + month + day;
}

function getLocalDayStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameLocalDay(first: Date, second: Date) {
  return (
    getLocalDayStart(first).getTime() === getLocalDayStart(second).getTime()
  );
}

async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      throw new Error("ČHMÚ vrátilo HTTP " + response.status + ".");
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

function createStationRecord(header: string[], row: unknown[]) {
  return header.reduce<Record<string, unknown>>((record, key, index) => {
    record[key] = row[index];
    return record;
  }, {});
}

function createStationMetadata(
  record: Record<string, unknown>,
): StationMetadata | null {
  const gaugeId = readString(record.objID);
  const stationName = readString(record.STATION_NAME);
  const streamName = readString(record.STREAM_NAME);

  if (!gaugeId || !stationName || !streamName) {
    return null;
  }

  return {
    dryFlowM3s: readNumber(record.DRYQ),
    dryLevelCm: readNumber(record.DRYH),
    gaugeId,
    highFlowM3s: readNumber(record.SPA1Q),
    highLevelCm: readNumber(record.SPA1H),
    latitude: readNumber(record.GEOGR1),
    longitude: readNumber(record.GEOGR2),
    stationName,
    streamName,
  };
}

function parseStationMetadata(response: MetadataResponse) {
  const header =
    response.data?.data?.header?.split(",").map((key) => key.trim()) ?? [];
  const values = response.data?.data?.values ?? [];

  return values
    .map((row) => createStationMetadata(createStationRecord(header, row)))
    .filter((station): station is StationMetadata => station !== null);
}

async function fetchStationMetadata() {
  if (stationMetadataCache) {
    return stationMetadataCache;
  }

  stationMetadataPromise ??= fetchJson<MetadataResponse>(CHMI_NOW_METADATA_URL)
    .then((response) => {
      stationMetadataCache = parseStationMetadata(response);
      return stationMetadataCache;
    })
    .catch((error) => {
      stationMetadataPromise = null;
      throw error;
    });

  return stationMetadataPromise;
}

function getMeasurementSeries(
  response: MeasurementResponse,
  tsConID: "H" | "Q",
) {
  const series = response.objList?.[0]?.tsList?.find(
    (item) => item.tsConID === tsConID,
  );

  return (series?.tsData ?? []).filter(
    (item): item is { dt: string; value: number } =>
      typeof item.value === "number" &&
      Number.isFinite(item.value) &&
      typeof item.dt === "string",
  );
}

function getLatestMeasurement(
  response: MeasurementResponse,
  tsConID: "H" | "Q",
) {
  const latest = [...getMeasurementSeries(response, tsConID)].reverse()[0];

  return latest ? { measuredAt: latest.dt, value: latest.value } : undefined;
}

async function fetchCurrentGaugeMeasurement(gaugeId: string) {
  const sourceUrl = CHMI_NOW_DATA_URL + gaugeId + ".json";
  const response = await fetchJson<MeasurementResponse>(sourceUrl);
  const level = getLatestMeasurement(response, "H");
  const flow = getLatestMeasurement(response, "Q");

  return {
    flowM3s: flow?.value,
    levelCm: level?.value,
    measuredAt: level?.measuredAt ?? flow?.measuredAt,
    sourceUrl,
  };
}

function resolveStatus(
  station: StationMetadata | undefined,
  levelCm?: number,
  flowM3s?: number,
): WaterConditionStatus {
  if (flowM3s !== undefined) {
    if (station?.highFlowM3s !== undefined && flowM3s >= station.highFlowM3s) {
      return "high";
    }

    if (station?.dryFlowM3s !== undefined && flowM3s <= station.dryFlowM3s) {
      return "dry";
    }

    if (
      station?.dryFlowM3s !== undefined &&
      flowM3s <= station.dryFlowM3s * 1.15
    ) {
      return "low";
    }

    return "good";
  }

  if (levelCm !== undefined) {
    if (station?.highLevelCm !== undefined && levelCm >= station.highLevelCm) {
      return "high";
    }

    if (station?.dryLevelCm !== undefined && levelCm <= station.dryLevelCm) {
      return "dry";
    }

    if (
      station?.dryLevelCm !== undefined &&
      levelCm <= station.dryLevelCm * 1.15
    ) {
      return "low";
    }

    return "good";
  }

  return "unknown";
}

export function resolveNavigabilityAlert(
  levelCm: number | undefined,
  limits: PaddlingLevelLimits,
  status: WaterConditionStatus,
): NavigabilityAlert {
  if (levelCm === undefined) {
    return {
      description: "ČHMÚ nevrátilo aktuální hladinu pro orientační posouzení.",
      label: "Bez hladiny",
      tone: "unknown",
    };
  }

  if (status === "high" || status === "flood" || levelCm >= limits.tooHighCm) {
    return {
      description:
        "Hladina " +
        formatLevelLimit(levelCm) +
        " je nad horním vodáckým limitem " +
        formatLevelLimit(limits.tooHighCm) +
        ". Bez lokální znalosti raději nejezdit.",
      label: "Moc vody",
      tone: "danger",
    };
  }

  if (levelCm < limits.minLevelCm) {
    return {
      description:
        "Hladina " +
        formatLevelLimit(levelCm) +
        " je pod minimem " +
        formatLevelLimit(limits.minLevelCm) +
        " pro tenhle úsek.",
      label: "Pod minimem",
      tone: "danger",
    };
  }

  if (levelCm < limits.goodFromCm) {
    return {
      description:
        "Hladina " +
        formatLevelLimit(levelCm) +
        " je nad minimem, ale pod dobrou vodou " +
        formatLevelLimit(limits.goodFromCm) +
        ". Čekej škrábání a opatrnější jízdu.",
      label: "Nízká voda",
      tone: "warning",
    };
  }

  if (levelCm <= limits.goodToCm) {
    return {
      description:
        "Hladina " +
        formatLevelLimit(levelCm) +
        " je v dobrém pásmu " +
        formatLevelLimit(limits.goodFromCm) +
        " - " +
        formatLevelLimit(limits.goodToCm) +
        ".",
      label: "Ideální voda",
      tone: "good",
    };
  }

  return {
    description:
      "Hladina " +
      formatLevelLimit(levelCm) +
      " je nad dobrým pásmem. Proud bude rychlejší a úsek chce víc jistoty.",
    label: "Vydatná voda",
    tone: "strong",
  };
}

async function createSnapshot(
  preset: RiverFlowSectionPreset,
  metadataByGaugeId: Map<string, StationMetadata>,
): Promise<RiverFlowSnapshot> {
  const station = metadataByGaugeId.get(preset.gaugeId);
  const measurement = await fetchCurrentGaugeMeasurement(preset.gaugeId).catch(
    () => ({
      flowM3s: undefined,
      levelCm: undefined,
      measuredAt: undefined,
      sourceUrl: CHMI_NOW_DATA_URL + preset.gaugeId + ".json",
    }),
  );
  const status = resolveStatus(
    station,
    measurement.levelCm,
    measurement.flowM3s,
  );

  const paddlingLimits = createPaddlingLimits(preset, station);

  return {
    ...preset,
    alert: resolveNavigabilityAlert(
      measurement.levelCm,
      paddlingLimits,
      status,
    ),
    difficulty: createPaddlingDifficulty(preset),
    dryFlowM3s: station?.dryFlowM3s,
    dryLevelCm: station?.dryLevelCm,
    flowM3s: measurement.flowM3s,
    highFlowM3s: station?.highFlowM3s,
    highLevelCm: station?.highLevelCm,
    latitude: station?.latitude,
    levelCm: measurement.levelCm,
    longitude: station?.longitude,
    measuredAt: measurement.measuredAt,
    paddlingLimits,
    paddlingSectionName: createPaddlingSectionName(preset),
    sourceUrl: measurement.sourceUrl,
    stationName: station?.stationName ?? preset.sectionHint,
    status,
    statusLabel: getWaterConditionStatusLabel(status),
  };
}

function isNavigableSection(section: RiverFlowSnapshot) {
  return (
    section.levelCm !== undefined &&
    section.alert.tone !== "danger" &&
    section.alert.tone !== "unknown"
  );
}

function getLatestMeasuredAt(sections: RiverFlowSnapshot[]) {
  return sections
    .map((section) => section.measuredAt)
    .filter((value): value is string => Boolean(value))
    .sort(
      (left, right) => new Date(right).getTime() - new Date(left).getTime(),
    )[0];
}

export function getRiverFlowNames() {
  return Array.from(new Set(riverFlowSections.map((section) => section.river)));
}

function getSeriesMeasurementUrl(gaugeId: string, date: Date) {
  if (isSameLocalDay(date, new Date())) {
    return CHMI_NOW_DATA_URL + gaugeId + ".json";
  }

  return (
    CHMI_RECENT_DATA_URL + formatChmiDatePrefix(date) + "_" + gaugeId + ".json"
  );
}

function createRecentSeriesDates() {
  const today = getLocalDayStart(new Date());

  return Array.from({ length: RIVER_FLOW_SERIES_DAYS }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (RIVER_FLOW_SERIES_DAYS - 1 - index));
    return date;
  });
}

function averageMeasurement(values: Array<{ value: number }>) {
  if (values.length === 0) {
    return undefined;
  }

  return values.reduce((sum, item) => sum + item.value, 0) / values.length;
}

function createDailySeriesPoint(
  response: MeasurementResponse,
  date: Date,
): RiverFlowSeriesPoint | undefined {
  const levels = getMeasurementSeries(response, "H");
  const flows = getMeasurementSeries(response, "Q");
  const levelCm = averageMeasurement(levels);
  const flowM3s = averageMeasurement(flows);
  const measuredAt = levels[0]?.dt ?? flows[0]?.dt ?? date.toISOString();

  if (levelCm === undefined && flowM3s === undefined) {
    return undefined;
  }

  return {
    flowM3s,
    levelCm,
    measuredAt,
  };
}

async function fetchDailySeriesPoint(gaugeId: string, date: Date) {
  const response = await fetchJson<MeasurementResponse>(
    getSeriesMeasurementUrl(gaugeId, date),
  );

  return createDailySeriesPoint(response, date);
}

async function mapInBatches<Input, Output>(
  values: Input[],
  batchSize: number,
  mapper: (value: Input) => Promise<Output>,
) {
  const results: Output[] = [];

  for (let index = 0; index < values.length; index += batchSize) {
    const batch = values.slice(index, index + batchSize);
    results.push(...(await Promise.all(batch.map(mapper))));
  }

  return results;
}

export async function fetchRiverFlowSeries(gaugeId: string) {
  const points = await mapInBatches(
    createRecentSeriesDates(),
    5,
    async (date) => {
      return fetchDailySeriesPoint(gaugeId, date).catch(() => undefined);
    },
  );

  return points
    .filter((point): point is RiverFlowSeriesPoint => point !== undefined)
    .sort(
      (left, right) =>
        new Date(left.measuredAt).getTime() -
        new Date(right.measuredAt).getTime(),
    );
}

export async function fetchPopularRiverFlows() {
  const metadata = await fetchStationMetadata();
  const metadataByGaugeId = new Map(
    metadata.map((station) => [station.gaugeId, station]),
  );

  return mapInBatches(getRiverFlowNames(), 2, async (river) => {
    const presets = riverFlowSections.filter(
      (section) => section.river === river,
    );
    const sections = await mapInBatches(presets, 3, (preset) =>
      createSnapshot(preset, metadataByGaugeId),
    );

    return {
      latestMeasuredAt: getLatestMeasuredAt(sections),
      navigableSections: sections.filter(isNavigableSection),
      river,
      riverDescription:
        riverFlowDescriptions[river] ?? "Sledované vodácké úseky v ČR.",
      sections,
    } satisfies RiverFlowOverview;
  });
}

export async function fetchRiverFlowSections(river: string) {
  const metadata = await fetchStationMetadata();
  const metadataByGaugeId = new Map(
    metadata.map((station) => [station.gaugeId, station]),
  );
  const sections = riverFlowSections.filter(
    (section) => section.river === river,
  );

  return Promise.all(
    sections.map((section) => createSnapshot(section, metadataByGaugeId)),
  );
}
