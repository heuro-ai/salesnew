import { supabase } from './databaseService';

export interface LeadTag {
  id: string;
  user_id: string;
  tag_name: string;
  color: string;
  description: string;
  created_at: string;
}

export const createTag = async (
  tagName: string,
  color: string = '#3B82F6',
  description: string = ''
): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('lead_tags')
    .insert({
      user_id: user.id,
      tag_name: tagName,
      color,
      description
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating tag:', error);
    return null;
  }

  return data?.id || null;
};

export const getTags = async (): Promise<LeadTag[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('lead_tags')
    .select('*')
    .eq('user_id', user.id)
    .order('tag_name');

  if (error) {
    console.error('Error fetching tags:', error);
    return [];
  }

  return data || [];
};

export const updateTag = async (
  tagId: string,
  updates: Partial<Pick<LeadTag, 'tag_name' | 'color' | 'description'>>
): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('lead_tags')
    .update(updates)
    .eq('id', tagId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error updating tag:', error);
    return false;
  }

  return true;
};

export const deleteTag = async (tagId: string): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('lead_tags')
    .delete()
    .eq('id', tagId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting tag:', error);
    return false;
  }

  return true;
};

export const assignTagToLead = async (leadId: string, tagId: string): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('lead_tag_assignments')
    .insert({
      lead_id: leadId,
      tag_id: tagId,
      user_id: user.id
    });

  if (error) {
    console.error('Error assigning tag to lead:', error);
    return false;
  }

  const { data: tag } = await supabase
    .from('lead_tags')
    .select('tag_name')
    .eq('id', tagId)
    .single();

  if (tag) {
    const { data: currentLead } = await supabase
      .from('crm_leads')
      .select('tags')
      .eq('id', leadId)
      .single();

    if (currentLead) {
      const updatedTags = [...(currentLead.tags || []), tag.tag_name];
      await supabase
        .from('crm_leads')
        .update({ tags: updatedTags })
        .eq('id', leadId)
        .eq('user_id', user.id);
    }
  }

  return true;
};

export const removeTagFromLead = async (leadId: string, tagId: string): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('lead_tag_assignments')
    .delete()
    .eq('lead_id', leadId)
    .eq('tag_id', tagId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error removing tag from lead:', error);
    return false;
  }

  const { data: tag } = await supabase
    .from('lead_tags')
    .select('tag_name')
    .eq('id', tagId)
    .single();

  if (tag) {
    const { data: currentLead } = await supabase
      .from('crm_leads')
      .select('tags')
      .eq('id', leadId)
      .single();

    if (currentLead) {
      const updatedTags = (currentLead.tags || []).filter((t: string) => t !== tag.tag_name);
      await supabase
        .from('crm_leads')
        .update({ tags: updatedTags })
        .eq('id', leadId)
        .eq('user_id', user.id);
    }
  }

  return true;
};

export const getLeadTags = async (leadId: string): Promise<LeadTag[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('lead_tag_assignments')
    .select(`
      tag_id,
      lead_tags (*)
    `)
    .eq('lead_id', leadId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error fetching lead tags:', error);
    return [];
  }

  return (data || []).map((item: any) => item.lead_tags).filter(Boolean);
};

export const bulkAssignTag = async (leadIds: string[], tagId: string): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const assignments = leadIds.map(leadId => ({
    lead_id: leadId,
    tag_id: tagId,
    user_id: user.id
  }));

  const { error } = await supabase
    .from('lead_tag_assignments')
    .upsert(assignments, { onConflict: 'lead_id,tag_id', ignoreDuplicates: true });

  if (error) {
    console.error('Error bulk assigning tag:', error);
    return false;
  }

  return true;
};

export const getLeadsByTag = async (tagId: string): Promise<string[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('lead_tag_assignments')
    .select('lead_id')
    .eq('tag_id', tagId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error fetching leads by tag:', error);
    return [];
  }

  return (data || []).map(item => item.lead_id);
};
