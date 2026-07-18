export interface AppNotification {
  id: number;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string | null;
}

/** Fields needed to create a notification. */
export interface NotifyInput {
  type: string;
  title: string;
  body?: string | null;
  link?: string | null;
}
