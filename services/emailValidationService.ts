import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase environment variables are required");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type ValidationStatus = 'valid' | 'soft-fail' | 'invalid' | 'unknown';
export type ValidationMethod = 'api' | 'regex' | 'dns' | 'smtp' | 'manual' | 'pattern';

interface ValidationResult {
  email: string;
  status: ValidationStatus;
  method: ValidationMethod;
  confidence: number;
  message?: string;
}

const extractDomain = (email: string): string => {
  const parts = email.split('@');
  return parts.length === 2 ? parts[1].toLowerCase() : '';
};

const validateEmailFormat = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const checkCachedValidation = async (email: string): Promise<ValidationResult | null> => {
  try {
    const { data, error } = await supabase
      .from('email_validations')
      .select('*')
      .eq('email', email.toLowerCase())
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (error) {
      console.error('Error checking cached validation:', error);
      return null;
    }

    if (data) {
      return {
        email: data.email,
        status: data.validation_status as ValidationStatus,
        method: data.validation_method as ValidationMethod,
        confidence: data.confidence_score,
        message: data.error_message || undefined
      };
    }

    return null;
  } catch (error) {
    console.error('Failed to check cached validation:', error);
    return null;
  }
};

const saveCachedValidation = async (result: ValidationResult): Promise<void> => {
  try {
    const domain = extractDomain(result.email);

    const { error: upsertError } = await supabase
      .from('email_validations')
      .upsert({
        email: result.email.toLowerCase(),
        validation_status: result.status,
        validation_method: result.method,
        confidence_score: result.confidence,
        domain,
        error_message: result.message,
        validated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }, {
        onConflict: 'email'
      });

    if (upsertError) {
      console.error('Error saving validation to cache:', upsertError);
    }

    await supabase
      .from('email_validation_history')
      .insert({
        email: result.email.toLowerCase(),
        validation_status: result.status,
        validation_method: result.method,
        api_response: result.message ? { message: result.message } : null,
        validated_at: new Date().toISOString()
      });

    if (result.status === 'valid' && result.method === 'api') {
      const { data: existingPattern } = await supabase
        .from('email_domain_patterns')
        .select('*')
        .eq('domain', domain)
        .maybeSingle();

      if (existingPattern) {
        await supabase
          .from('email_domain_patterns')
          .update({
            total_validations: existingPattern.total_validations + 1,
            successful_validations: existingPattern.successful_validations + 1,
            confidence_score: Math.min(100, existingPattern.confidence_score + 5)
          })
          .eq('domain', domain);
      } else {
        const pattern = inferEmailPattern(result.email);
        await supabase
          .from('email_domain_patterns')
          .insert({
            domain,
            common_pattern: pattern,
            confidence_score: 50,
            total_validations: 1,
            successful_validations: 1
          });
      }
    }
  } catch (error) {
    console.error('Failed to save cached validation:', error);
  }
};

const inferEmailPattern = (email: string): string => {
  const localPart = email.split('@')[0];

  if (localPart.includes('.')) {
    return 'firstname.lastname';
  } else if (localPart.length > 0 && localPart[0] === localPart[0].toLowerCase()) {
    return 'firstinitiallastname';
  } else {
    return 'unknown';
  }
};

const validateViaAPI = async (email: string): Promise<ValidationResult> => {
  if (!RAPIDAPI_KEY || RAPIDAPI_KEY === 'your_rapidapi_key_here') {
    return {
      email,
      status: 'unknown',
      method: 'regex',
      confidence: 30,
      message: 'API key not configured'
    };
  }

  const url = `https://validect-email-verification-v1.p.rapidapi.com/v1/verify?email=${encodeURIComponent(email)}`;
  const options = {
    method: 'GET',
    headers: {
      'x-rapidapi-host': 'validect-email-verification-v1.p.rapidapi.com',
      'x-rapidapi-key': RAPIDAPI_KEY
    }
  };

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Email validation API error:', response.status, errorText);

      return {
        email,
        status: 'unknown',
        method: 'regex',
        confidence: 30,
        message: `API error: ${response.status}`
      };
    }

    const result = await response.json();

    let status: ValidationStatus;
    let confidence: number;

    switch (result.status) {
      case 'valid':
        status = 'valid';
        confidence = 95;
        break;
      case 'risky':
        status = 'soft-fail';
        confidence = 60;
        break;
      case 'invalid':
        status = 'invalid';
        confidence = 90;
        break;
      default:
        status = 'unknown';
        confidence = 30;
    }

    return {
      email,
      status,
      method: 'api',
      confidence,
      message: result.reason || undefined
    };
  } catch (error) {
    console.error('Failed to validate email via API:', error);
    return {
      email,
      status: 'unknown',
      method: 'regex',
      confidence: 30,
      message: 'API request failed'
    };
  }
};

const validateViaRegex = (email: string): ValidationResult => {
  if (!validateEmailFormat(email)) {
    return {
      email,
      status: 'invalid',
      method: 'regex',
      confidence: 85,
      message: 'Invalid email format'
    };
  }

  const domain = extractDomain(email);
  const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];

  if (commonDomains.includes(domain)) {
    return {
      email,
      status: 'soft-fail',
      method: 'regex',
      confidence: 50,
      message: 'Personal email domain'
    };
  }

  return {
    email,
    status: 'unknown',
    method: 'regex',
    confidence: 40,
    message: 'Format valid, but not fully verified'
  };
};

export const validateEmail = async (email: string): Promise<ValidationStatus> => {
  const result = await validateEmailWithDetails(email);
  return result.status;
};

export const validateEmailWithDetails = async (email: string): Promise<ValidationResult> => {
  if (!email || !validateEmailFormat(email)) {
    return {
      email,
      status: 'invalid',
      method: 'regex',
      confidence: 90,
      message: 'Invalid email format'
    };
  }

  const cached = await checkCachedValidation(email);
  if (cached) {
    return cached;
  }

  let result: ValidationResult;

  if (RAPIDAPI_KEY && RAPIDAPI_KEY !== 'your_rapidapi_key_here') {
    result = await validateViaAPI(email);
  } else {
    result = validateViaRegex(email);
  }

  await saveCachedValidation(result);

  return result;
};

export const bulkValidateEmails = async (emails: string[]): Promise<Map<string, ValidationResult>> => {
  const results = new Map<string, ValidationResult>();

  const uniqueEmails = [...new Set(emails.map(e => e.toLowerCase()))];

  const validationPromises = uniqueEmails.map(async (email) => {
    const result = await validateEmailWithDetails(email);
    results.set(email, result);
  });

  await Promise.all(validationPromises);

  return results;
};

export const getValidationStatistics = async (): Promise<{
  total: number;
  valid: number;
  softFail: number;
  invalid: number;
  unknown: number;
}> => {
  try {
    const { data, error } = await supabase
      .from('email_validations')
      .select('validation_status');

    if (error) {
      console.error('Error fetching validation statistics:', error);
      return { total: 0, valid: 0, softFail: 0, invalid: 0, unknown: 0 };
    }

    const stats = {
      total: data.length,
      valid: data.filter(v => v.validation_status === 'valid').length,
      softFail: data.filter(v => v.validation_status === 'soft-fail').length,
      invalid: data.filter(v => v.validation_status === 'invalid').length,
      unknown: data.filter(v => v.validation_status === 'unknown').length
    };

    return stats;
  } catch (error) {
    console.error('Failed to get validation statistics:', error);
    return { total: 0, valid: 0, softFail: 0, invalid: 0, unknown: 0 };
  }
};
