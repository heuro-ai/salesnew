export enum Page {
  INPUT = 'INPUT',
  RESEARCH = 'RESEARCH',
  CRM = 'CRM',
  ROLE_PLAY = 'ROLE_PLAY',
}

export interface UserInput {
  productName: string;
  productDescription: string;
  targetAudience: string;
  companySize: string;
  industry: string;
  geography: string;
  priceRange: string;
  valueProposition: string;
  competitiveEdge: string;
  keywords: string;
}

export interface Pitch {
  subject_lines: string[];
  email_short: string;
  email_medium: string;
  email_long: string;
}

export interface Contact {
  name: string;
  title: string;
  department: string;
  validated_email: string;
  validation_status: 'valid' | 'soft-fail' | 'invalid' | 'unknown';
}

export interface Company {
  company: string;
  website: string;
  industry: string;
  reason_for_fit: string;
  confidence_score: number;
  likely_to_buy: 'High' | 'Medium' | 'Low' | 'unknown';
  contact: Contact;
  pitch: Pitch;
  quality_score?: number;
}

export interface CrmLead extends Company {
  id: string;
  status: 'New' | 'Contacted' | 'Meeting' | 'Negotiation' | 'Closed';
  lastContacted: string | null;
  emailSent: boolean;
  replyReceived: boolean;
}