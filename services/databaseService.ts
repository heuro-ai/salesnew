import { createClient } from '@supabase/supabase-js';
import type { UserInput, Company, CrmLead } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface DbUserSearch {
  id: string;
  user_id: string;
  product_name: string;
  product_description: string;
  target_audience: string;
  company_size: string;
  industry: string;
  geography: string;
  price_range: string;
  value_proposition: string;
  competitive_edge: string;
  keywords: string;
  created_at: string;
}

export interface DbCompany {
  id: string;
  search_id: string;
  user_id: string;
  company_name: string;
  website: string;
  industry: string;
  reason_for_fit: string;
  confidence_score: number;
  likely_to_buy: string;
  contact_data: any;
  pitch_data: any;
  created_at: string;
}

export interface DbCrmLead {
  id: string;
  user_id: string;
  company_id?: string;
  company_name: string;
  website: string;
  industry: string;
  reason_for_fit: string;
  confidence_score: number;
  likely_to_buy: string;
  contact_data: any;
  pitch_data: any;
  status: string;
  last_contacted?: string;
  email_sent: boolean;
  reply_received: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
}

export const saveUserSearch = async (userInput: UserInput): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('user_searches')
    .insert({
      user_id: user.id,
      product_name: userInput.productName,
      product_description: userInput.productDescription,
      target_audience: userInput.targetAudience,
      company_size: userInput.companySize,
      industry: userInput.industry,
      geography: userInput.geography,
      price_range: userInput.priceRange,
      value_proposition: userInput.valueProposition,
      competitive_edge: userInput.competitiveEdge,
      keywords: userInput.keywords,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error saving search:', error);
    return null;
  }

  return data?.id || null;
};

export const saveCompanies = async (searchId: string, companies: Company[]): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const companiesToInsert = companies.map(company => ({
    search_id: searchId,
    user_id: user.id,
    company_name: company.company,
    website: company.website,
    industry: company.industry,
    reason_for_fit: company.reason_for_fit,
    confidence_score: company.confidence_score,
    likely_to_buy: company.likely_to_buy,
    contact_data: company.contact,
    pitch_data: company.pitch,
  }));

  const { error } = await supabase
    .from('companies')
    .insert(companiesToInsert);

  if (error) {
    console.error('Error saving companies:', error);
    return false;
  }

  return true;
};

export const getRecentSearches = async (limit: number = 10): Promise<DbUserSearch[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('user_searches')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching searches:', error);
    return [];
  }

  return data || [];
};

export const getCompaniesForSearch = async (searchId: string): Promise<Company[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('search_id', searchId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error fetching companies:', error);
    return [];
  }

  return (data || []).map(dbCompany => ({
    company: dbCompany.company_name,
    website: dbCompany.website,
    industry: dbCompany.industry,
    reason_for_fit: dbCompany.reason_for_fit,
    confidence_score: dbCompany.confidence_score,
    likely_to_buy: dbCompany.likely_to_buy as any,
    contact: dbCompany.contact_data,
    pitch: dbCompany.pitch_data,
  }));
};

export const saveCrmLeads = async (leads: CrmLead[]): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const leadsToInsert = leads.map(lead => ({
    user_id: user.id,
    company_name: lead.company,
    website: lead.website,
    industry: lead.industry,
    reason_for_fit: lead.reason_for_fit,
    confidence_score: lead.confidence_score,
    likely_to_buy: lead.likely_to_buy,
    contact_data: lead.contact,
    pitch_data: lead.pitch,
    status: lead.status,
    last_contacted: lead.lastContacted,
    email_sent: lead.emailSent,
    reply_received: lead.replyReceived,
    notes: '',
  }));

  const { error } = await supabase
    .from('crm_leads')
    .insert(leadsToInsert);

  if (error) {
    console.error('Error saving CRM leads:', error);
    return false;
  }

  return true;
};

export const getCrmLeads = async (): Promise<CrmLead[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('crm_leads')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching CRM leads:', error);
    return [];
  }

  return (data || []).map(dbLead => ({
    id: dbLead.id,
    company: dbLead.company_name,
    website: dbLead.website,
    industry: dbLead.industry,
    reason_for_fit: dbLead.reason_for_fit,
    confidence_score: dbLead.confidence_score,
    likely_to_buy: dbLead.likely_to_buy as any,
    contact: dbLead.contact_data,
    pitch: dbLead.pitch_data,
    status: dbLead.status as any,
    lastContacted: dbLead.last_contacted || null,
    emailSent: dbLead.email_sent,
    replyReceived: dbLead.reply_received,
  }));
};

export const updateCrmLead = async (lead: CrmLead): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('crm_leads')
    .update({
      status: lead.status,
      last_contacted: lead.lastContacted,
      email_sent: lead.emailSent,
      reply_received: lead.replyReceived,
      updated_at: new Date().toISOString(),
    })
    .eq('id', lead.id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error updating CRM lead:', error);
    return false;
  }

  return true;
};

export const deleteCrmLead = async (leadId: string): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('crm_leads')
    .delete()
    .eq('id', leadId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting CRM lead:', error);
    return false;
  }

  return true;
};

export const saveRolePlaySession = async (
  leadId: string,
  transcript: { speaker: 'user' | 'ai'; text: string }[],
  feedback: string | null,
  durationSeconds: number
): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('role_play_sessions')
    .insert({
      user_id: user.id,
      lead_id: leadId,
      transcript,
      feedback,
      duration_seconds: durationSeconds,
    });

  if (error) {
    console.error('Error saving role-play session:', error);
    return false;
  }

  return true;
};

export const getRolePlaySessions = async (leadId: string): Promise<any[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('role_play_sessions')
    .select('*')
    .eq('lead_id', leadId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching role-play sessions:', error);
    return [];
  }

  return data || [];
};
