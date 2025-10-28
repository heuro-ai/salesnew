import type { Company } from '../types';
import { supabase } from './databaseService';

export interface SearchAnalytics {
  id: string;
  user_id: string;
  search_id: string | null;
  leads_generated: number;
  valid_emails_count: number;
  invalid_emails_count: number;
  high_likelihood_count: number;
  medium_likelihood_count: number;
  low_likelihood_count: number;
  average_confidence_score: number;
  leads_added_to_crm: number;
  leads_contacted: number;
  leads_converted: number;
  search_duration_seconds: number;
  industries_found: string[];
  created_at: string;
}

export const recordSearchAnalytics = async (
  searchId: string,
  companies: Company[],
  durationSeconds: number
): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const validEmailsCount = companies.filter(c => c.contact.validation_status === 'valid').length;
  const invalidEmailsCount = companies.filter(c =>
    c.contact.validation_status === 'invalid' ||
    c.contact.validation_status === 'soft-fail' ||
    c.contact.validation_status === 'unknown'
  ).length;

  const highLikelihoodCount = companies.filter(c => c.likely_to_buy === 'High').length;
  const mediumLikelihoodCount = companies.filter(c => c.likely_to_buy === 'Medium').length;
  const lowLikelihoodCount = companies.filter(c => c.likely_to_buy === 'Low').length;

  const averageConfidenceScore = companies.length > 0
    ? Math.round(companies.reduce((sum, c) => sum + c.confidence_score, 0) / companies.length)
    : 0;

  const industriesFound = [...new Set(companies.map(c => c.industry))];

  const { error } = await supabase
    .from('search_analytics')
    .insert({
      user_id: user.id,
      search_id: searchId,
      leads_generated: companies.length,
      valid_emails_count: validEmailsCount,
      invalid_emails_count: invalidEmailsCount,
      high_likelihood_count: highLikelihoodCount,
      medium_likelihood_count: mediumLikelihoodCount,
      low_likelihood_count: lowLikelihoodCount,
      average_confidence_score: averageConfidenceScore,
      search_duration_seconds: durationSeconds,
      industries_found: industriesFound
    });

  if (error) {
    console.error('Error recording search analytics:', error);
    return false;
  }

  return true;
};

export const updateSearchConversionMetrics = async (
  searchId: string,
  addedToCrm: number = 0,
  contacted: number = 0,
  converted: number = 0
): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('search_analytics')
    .update({
      leads_added_to_crm: addedToCrm,
      leads_contacted: contacted,
      leads_converted: converted
    })
    .eq('search_id', searchId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error updating conversion metrics:', error);
    return false;
  }

  return true;
};

export const getSearchAnalytics = async (searchId: string): Promise<SearchAnalytics | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('search_analytics')
    .select('*')
    .eq('search_id', searchId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error || !data) {
    console.error('Error fetching search analytics:', error);
    return null;
  }

  return data as SearchAnalytics;
};

export const getAllSearchAnalytics = async (limit: number = 50): Promise<SearchAnalytics[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('search_analytics')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching all search analytics:', error);
    return [];
  }

  return (data || []) as SearchAnalytics[];
};

export const getAggregatedAnalytics = async (): Promise<{
  totalLeadsGenerated: number;
  totalValidEmails: number;
  averageConfidenceScore: number;
  topIndustries: { industry: string; count: number }[];
  conversionRate: number;
}> => {
  const analytics = await getAllSearchAnalytics(100);

  if (analytics.length === 0) {
    return {
      totalLeadsGenerated: 0,
      totalValidEmails: 0,
      averageConfidenceScore: 0,
      topIndustries: [],
      conversionRate: 0
    };
  }

  const totalLeadsGenerated = analytics.reduce((sum, a) => sum + a.leads_generated, 0);
  const totalValidEmails = analytics.reduce((sum, a) => sum + a.valid_emails_count, 0);
  const avgConfidence = Math.round(
    analytics.reduce((sum, a) => sum + a.average_confidence_score, 0) / analytics.length
  );

  const industryMap = new Map<string, number>();
  analytics.forEach(a => {
    a.industries_found.forEach(industry => {
      industryMap.set(industry, (industryMap.get(industry) || 0) + 1);
    });
  });

  const topIndustries = Array.from(industryMap.entries())
    .map(([industry, count]) => ({ industry, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const totalAddedToCrm = analytics.reduce((sum, a) => sum + a.leads_added_to_crm, 0);
  const totalConverted = analytics.reduce((sum, a) => sum + a.leads_converted, 0);
  const conversionRate = totalAddedToCrm > 0
    ? Math.round((totalConverted / totalAddedToCrm) * 100)
    : 0;

  return {
    totalLeadsGenerated,
    totalValidEmails,
    averageConfidenceScore: avgConfidence,
    topIndustries,
    conversionRate
  };
};

export const getSearchPerformanceComparison = async (): Promise<{
  searches: {
    searchId: string;
    leadsGenerated: number;
    validEmailRate: number;
    averageQuality: number;
    createdAt: string;
  }[];
}> => {
  const analytics = await getAllSearchAnalytics(20);

  const searches = analytics.map(a => ({
    searchId: a.search_id || '',
    leadsGenerated: a.leads_generated,
    validEmailRate: a.leads_generated > 0
      ? Math.round((a.valid_emails_count / a.leads_generated) * 100)
      : 0,
    averageQuality: a.average_confidence_score,
    createdAt: a.created_at
  }));

  return { searches };
};
