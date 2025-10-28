import { supabase } from './databaseService';

export interface ExcludedCompany {
  id: string;
  user_id: string;
  company_name: string;
  website: string;
  reason: string;
  excluded_at: string;
}

export const addExcludedCompany = async (
  companyName: string,
  website: string = '',
  reason: string = ''
): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('excluded_companies')
    .insert({
      user_id: user.id,
      company_name: companyName,
      website,
      reason
    });

  if (error) {
    console.error('Error adding excluded company:', error);
    return false;
  }

  return true;
};

export const getExcludedCompanies = async (): Promise<ExcludedCompany[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('excluded_companies')
    .select('*')
    .eq('user_id', user.id)
    .order('excluded_at', { ascending: false });

  if (error) {
    console.error('Error fetching excluded companies:', error);
    return [];
  }

  return data || [];
};

export const getExcludedCompanyNames = async (): Promise<string[]> => {
  const companies = await getExcludedCompanies();
  return companies.map(c => c.company_name);
};

export const removeExcludedCompany = async (companyId: string): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('excluded_companies')
    .delete()
    .eq('id', companyId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error removing excluded company:', error);
    return false;
  }

  return true;
};

export const isCompanyExcluded = async (companyName: string): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('excluded_companies')
    .select('id')
    .eq('user_id', user.id)
    .ilike('company_name', companyName)
    .maybeSingle();

  if (error) {
    console.error('Error checking if company is excluded:', error);
    return false;
  }

  return !!data;
};

export const bulkAddExcludedCompanies = async (
  companies: { company_name: string; website?: string; reason?: string }[]
): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const records = companies.map(c => ({
    user_id: user.id,
    company_name: c.company_name,
    website: c.website || '',
    reason: c.reason || ''
  }));

  const { error } = await supabase
    .from('excluded_companies')
    .upsert(records, { onConflict: 'user_id,company_name', ignoreDuplicates: true });

  if (error) {
    console.error('Error bulk adding excluded companies:', error);
    return false;
  }

  return true;
};
