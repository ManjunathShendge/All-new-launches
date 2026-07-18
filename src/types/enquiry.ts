export type EnquirySource = "blog" | "newsletter" | "contact";

/** A captured site enquiry (admin read shape). */
export interface SiteEnquiry {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  message: string | null;
  interest: string | null;
  source: string;
  pageUrl: string | null;
  createdAt: string | null;
}
