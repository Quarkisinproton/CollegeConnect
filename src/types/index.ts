import type { Timestamp } from "firebase/firestore";

export interface CampusConnectUser {
  uid: string;
  email: string | null;
  displayName?: string | null;
  role: 'student' | 'president';
}

export interface CampusEvent {
  id: string;
  name: string;
  description: string;
  dateTime: Timestamp;
  location: {
    lat: number;
    lng: number;
  };
  locationName: string;
  createdBy: string;
  createdAt: Timestamp;
}
