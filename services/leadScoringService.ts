import type { Company, CrmLead } from '../types';
import { supabase } from './databaseService';

export interface QualityScore {
  overall_score: number;
  confidence_score: number;
  validation_score: number;
  buying_likelihood_score: number;
}

const VALIDATION_STATUS_SCORES: Record<string, number> = {
  'valid': 100,
  'soft-fail': 50,
  'invalid': 0,
  'unknown': 25
};

const BUYING_LIKELIHOOD_SCORES: Record<string, number> = {
  'High': 100,
  'Medium': 60,
  'Low': 30,
  'unknown': 0
};

export const calculateLeadQualityScore = (
  confidenceScore: number,
  validationStatus: string,
  buyingLikelihood: string
): QualityScore => {
  const validationScore = VALIDATION_STATUS_SCORES[validationStatus] || 0;
  const buyingLikelihoodScore = BUYING_LIKELIHOOD_SCORES[buyingLikelihood] || 0;

  const overallScore = Math.round(
    (confidenceScore * 0.4) +
    (validationScore * 0.35) +
    (buyingLikelihoodScore * 0.25)
  );

  return {
    overall_score: Math.min(100, Math.max(0, overallScore)),
    confidence_score: confidenceScore,
    validation_score: validationScore,
    buying_likelihood_score: buyingLikelihoodScore
  };
};

export const calculateCompanyQualityScore = (company: Company): number => {
  const score = calculateLeadQualityScore(
    company.confidence_score,
    company.contact.validation_status,
    company.likely_to_buy
  );
  return score.overall_score;
};

export const calculateCrmLeadQualityScore = (lead: CrmLead): number => {
  const score = calculateLeadQualityScore(
    lead.confidence_score,
    lead.contact.validation_status,
    lead.likely_to_buy
  );
  return score.overall_score;
};

export const saveLeadQualityScore = async (leadId: string, qualityData: QualityScore): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('lead_quality_scores')
    .upsert({
      lead_id: leadId,
      user_id: user.id,
      overall_score: qualityData.overall_score,
      confidence_score: qualityData.confidence_score,
      validation_score: qualityData.validation_score,
      buying_likelihood_score: qualityData.buying_likelihood_score,
      computed_at: new Date().toISOString()
    }, {
      onConflict: 'lead_id'
    });

  if (error) {
    console.error('Error saving quality score:', error);
    return false;
  }

  await supabase
    .from('crm_leads')
    .update({ quality_score: qualityData.overall_score })
    .eq('id', leadId)
    .eq('user_id', user.id);

  return true;
};

export const getLeadQualityScore = async (leadId: string): Promise<QualityScore | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('lead_quality_scores')
    .select('*')
    .eq('lead_id', leadId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    overall_score: data.overall_score,
    confidence_score: data.confidence_score,
    validation_score: data.validation_score,
    buying_likelihood_score: data.buying_likelihood_score
  };
};

export const batchCalculateQualityScores = async (leads: CrmLead[]): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const qualityScores = leads.map(lead => {
    const score = calculateLeadQualityScore(
      lead.confidence_score,
      lead.contact.validation_status,
      lead.likely_to_buy
    );
    return {
      lead_id: lead.id,
      user_id: user.id,
      overall_score: score.overall_score,
      confidence_score: score.confidence_score,
      validation_score: score.validation_score,
      buying_likelihood_score: score.buying_likelihood_score,
      computed_at: new Date().toISOString()
    };
  });

  await supabase
    .from('lead_quality_scores')
    .upsert(qualityScores, { onConflict: 'lead_id' });

  const leadUpdates = leads.map(lead => ({
    id: lead.id,
    quality_score: calculateCrmLeadQualityScore(lead),
    updated_at: new Date().toISOString()
  }));

  for (const update of leadUpdates) {
    await supabase
      .from('crm_leads')
      .update({ quality_score: update.quality_score, updated_at: update.updated_at })
      .eq('id', update.id)
      .eq('user_id', user.id);
  }
};

export const sortLeadsByQuality = <T extends { quality_score?: number }>(
  leads: T[],
  direction: 'asc' | 'desc' = 'desc'
): T[] => {
  return [...leads].sort((a, b) => {
    const scoreA = a.quality_score || 0;
    const scoreB = b.quality_score || 0;
    return direction === 'desc' ? scoreB - scoreA : scoreA - scoreB;
  });
};

export const filterLeadsByQualityRange = <T extends { quality_score?: number }>(
  leads: T[],
  minScore: number,
  maxScore: number
): T[] => {
  return leads.filter(lead => {
    const score = lead.quality_score || 0;
    return score >= minScore && score <= maxScore;
  });
};

export const getQualityScoreLabel = (score: number): string => {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  if (score >= 20) return 'Poor';
  return 'Very Poor';
};

export const getQualityScoreColor = (score: number): string => {
  if (score >= 80) return 'text-green-700 bg-green-100';
  if (score >= 60) return 'text-blue-700 bg-blue-100';
  if (score >= 40) return 'text-yellow-700 bg-yellow-100';
  if (score >= 20) return 'text-orange-700 bg-orange-100';
  return 'text-red-700 bg-red-100';
};
