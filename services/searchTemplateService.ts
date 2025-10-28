import type { UserInput } from '../types';
import { supabase } from './databaseService';

export interface SearchTemplate {
  id: string;
  user_id: string;
  template_name: string;
  search_criteria: UserInput;
  is_favorite: boolean;
  usage_count: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

export const saveSearchTemplate = async (
  templateName: string,
  searchCriteria: UserInput,
  isFavorite: boolean = false
): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('search_templates')
    .insert({
      user_id: user.id,
      template_name: templateName,
      search_criteria: searchCriteria,
      is_favorite: isFavorite
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error saving search template:', error);
    return null;
  }

  return data?.id || null;
};

export const getSearchTemplates = async (): Promise<SearchTemplate[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('search_templates')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching search templates:', error);
    return [];
  }

  return data || [];
};

export const getFavoriteTemplates = async (): Promise<SearchTemplate[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('search_templates')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_favorite', true)
    .order('usage_count', { ascending: false });

  if (error) {
    console.error('Error fetching favorite templates:', error);
    return [];
  }

  return data || [];
};

export const updateSearchTemplate = async (
  templateId: string,
  updates: Partial<Pick<SearchTemplate, 'template_name' | 'search_criteria' | 'is_favorite'>>
): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('search_templates')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', templateId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error updating search template:', error);
    return false;
  }

  return true;
};

export const deleteSearchTemplate = async (templateId: string): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('search_templates')
    .delete()
    .eq('id', templateId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting search template:', error);
    return false;
  }

  return true;
};

export const incrementTemplateUsage = async (templateId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.rpc('increment_template_usage', { template_id: templateId });

  await supabase
    .from('search_templates')
    .update({
      last_used_at: new Date().toISOString()
    })
    .eq('id', templateId)
    .eq('user_id', user.id);
};

export const duplicateSearchTemplate = async (
  templateId: string,
  newName: string
): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: template, error: fetchError } = await supabase
    .from('search_templates')
    .select('*')
    .eq('id', templateId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (fetchError || !template) {
    console.error('Error fetching template for duplication:', fetchError);
    return null;
  }

  return await saveSearchTemplate(
    newName,
    template.search_criteria as UserInput,
    false
  );
};
