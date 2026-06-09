export type RootStackParamList = {
  MainTabs: undefined;
  EditTrip: {
    tripId: string;
  };
  TripDetails: {
    tripId: string;
  };
  RiverFlowDetails: {
    river: string;
  };
};

export type MainTabParamList = {
  Overview: undefined;
  Flows: undefined;
  AddTrip: undefined;
  History: undefined;
  Settings: undefined;
};
