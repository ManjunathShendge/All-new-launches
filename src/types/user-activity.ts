/** An enquiry the signed-in user submitted (matched by their email). */
export interface UserEnquiry {
  id: number;
  propertyId: number | null;
  propertyTitle: string | null;
  propertySlug: string | null;
  city: string | null;
  locality: string | null;
  message: string | null;
  status: string; // lead status: new | contacted | converted | dead
  createdAt: string | null;
}

/** An event the user registered for (matched by their email). */
export interface UserEventReg {
  id: number;
  eventId: number;
  title: string;
  slug: string | null;
  venue: string | null;
  city: string | null;
  startsAt: string | null;
  status: string; // registered | waitlisted | cancelled
}

export interface UserActivityStats {
  enquiries: number;
  events: number;
  saved: number;
}

/** Compact snapshot stored client-side (localStorage) for "Recently Viewed". */
export interface RecentlyViewedItem {
  id: number;
  slug: string;
  title: string;
  image: string | null;
  price: string | null;
  location: string | null;
  at: number; // epoch ms viewed
}
