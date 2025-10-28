import { GoogleGenAI } from '@google/genai';
import type { UserInput, Company } from '../types';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const validateEmail = async (email: string): Promise<'valid' | 'soft-fail' | 'invalid' | 'unknown'> => {
  if (!RAPIDAPI_KEY) {
    console.warn("RAPIDAPI_KEY not found. Skipping email validation.");
    return 'unknown';
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
        console.error('Email validation API error:', response.status, response.statusText);
        return 'soft-fail';
    }
    const result = await response.json();
    switch (result.status) {
        case 'valid':
            return 'valid';
        case 'risky':
            return 'soft-fail';
        case 'invalid':
            return 'invalid';
        default:
            return 'unknown';
    }
  } catch (error) {
    console.error('Failed to validate email:', error);
    return 'soft-fail';
  }
};

const buildPrompt = (input: UserInput, excludeCompanies: string[]) => {
  let prompt = `
    SYSTEM: You are Sales Crew AI, a precision-driven B2B sales intelligence and CRM assistant.
    Your goal is to identify the 10 most likely buyers for a user’s product, validate their contact data with maximum accuracy, and assist in crafting personalized cold-sales outreach.
    Follow the structured pipeline carefully and never hallucinate information. Return only data that can be reasoned or verified from known, factual context.
    
    For each company, identify the best person to contact (CEO/Founder for SMB, VP/Head for mid-stage, or functional Director for enterprise).
    
    CRITICAL EMAIL VALIDATION STEP: You must use your search tool to investigate the most common email format for each company's domain (e.g., firstname.lastname@domain.com, firstinitiallastname@domain.com). Your final output must contain only the single, most likely valid email address. A separate service will perform the final validation check, so your priority is finding the most probable address.

    For each validated contact, craft 3 unique subject lines and 3 email variants (short, medium, long).
    Personalize the pitch by mentioning the company's mission or recent activity.
    
    STRICT RULES:
    - Do NOT invent company names or people.
    - Only output verifiable or reasoned data. If unknown, output "unknown".
    - Always include a Confidence Score between 0–100.
    - Explain reasoning for fit and buying likelihood.
    - If the user's product context is insufficient to generate high-quality leads, you MUST still return a valid JSON object with an empty "companies" array. Do not ask for more information or engage in conversation.
    - Do NOT include any of the following companies in your results: ${excludeCompanies.join(', ')}

    USER'S PRODUCT CONTEXT:
  `;

  if (input.productName) prompt += `\n- Product Name: ${input.productName}`;
  if (input.productDescription) prompt += `\n- Product Description: ${input.productDescription}`;
  if (input.targetAudience) prompt += `\n- Target Audience / ICP: ${input.targetAudience}`;
  if (input.companySize) prompt += `\n- Ideal Company Size / Industry: ${input.companySize}`;
  if (input.industry) prompt += `\n- Industry: ${input.industry}`;
  if (input.geography) prompt += `\n- Geography / Market Region: ${input.geography}`;
  if (input.priceRange) prompt += `\n- Price Range or Ticket Size: ${input.priceRange}`;
  if (input.valueProposition) prompt += `\n- Value Proposition: ${input.valueProposition}`;
  if (input.competitiveEdge) prompt += `\n- Competitive Edge / USP: ${input.competitiveEdge}`;
  if (input.keywords) prompt += `\n- Keywords to match: ${input.keywords}`;

  prompt += `

    Generate a list of exactly 10 new, relevant companies that are not in the excluded list. Include their best contact and a personalized pitch. Use your tools to find the most up-to-date and accurate information.

    Your final output MUST be a single, valid JSON object. Do not include any text, markdown formatting, or code fences (like \`\`\`json) before or after the JSON object.
    The JSON object must have a single key "companies" which is an array of company objects. Each company object must follow this exact structure:
    {
      "company": "string",
      "website": "string",
      "industry": "string",
      "reason_for_fit": "string",
      "confidence_score": number (0-100),
      "likely_to_buy": "High" | "Medium" | "Low" | "unknown",
      "contact": {
        "name": "string",
        "title": "string",
        "department": "string",
        "validated_email": "string",
        "validation_status": "unknown"
      },
      "pitch": {
        "subject_lines": ["string", "string", "string"],
        "email_short": "string (<=80 words)",
        "email_medium": "string (≈120 words)",
        "email_long": "string (Narrative)"
      }
    }
  `;
  return prompt;
};

export const generateLeadsAndPitches = async (input: UserInput, userLocation: GeolocationCoordinates | null, excludeCompanies: string[] = []): Promise<Company[]> => {
  const prompt = buildPrompt(input, excludeCompanies);

  const tools: any[] = [{ googleSearch: {} }];
  const toolConfig: any = {};

  if (userLocation) {
    tools.push({ googleMaps: {} });
    toolConfig.retrievalConfig = {
      latLng: {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      },
    };
  }

  let rawText = '';
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 32768 },
        tools: tools,
        ...(Object.keys(toolConfig).length > 0 && { toolConfig: toolConfig }),
      },
    });

    rawText = response.text.trim();
    const jsonText = rawText.replace(/^```json\n?/, '').replace(/```$/, '').trim();
    const result = JSON.parse(jsonText);
    const companies: Company[] = result.companies || [];

    const validatedCompanies = await Promise.all(
      companies.map(async (company) => {
        if (company.contact?.validated_email) {
            const validationStatus = await validateEmail(company.contact.validated_email);
            company.contact.validation_status = validationStatus;
        }
        return company;
      })
    );

    return validatedCompanies;

  } catch (error) {
    console.error("Error generating leads:", error);
    if (error instanceof SyntaxError) {
      console.error("Failed to parse JSON response from AI. Raw text:", rawText);
      throw new Error("Failed to generate leads. The AI returned an invalid format. Please try again.");
    }
    const apiError = error as any;
    if (apiError.message) {
      throw new Error(`Failed to generate leads: ${apiError.message}`);
    }
    throw new Error("Failed to generate leads. Please check your input and try again.");
  }
};

export const getRolePlayFeedback = async (
  transcript: { speaker: 'user' | 'ai', text: string }[],
  userInput: UserInput | null,
  lead: Company
): Promise<string> => {
  const formattedTranscript = transcript.map(t => `${t.speaker === 'user' ? 'Salesperson' : 'Prospect'}: ${t.text}`).join('\n');

  const prompt = `
    SYSTEM: You are a world-class B2B sales coach. Your task is to analyze a sales call transcript and provide constructive, actionable feedback.

    The salesperson is selling a product with the following details:
    - Product Name: ${userInput?.productName || 'N/A'}
    - Value Proposition: ${userInput?.valueProposition || 'N/A'}
    - Competitive Edge: ${userInput?.competitiveEdge || 'N/A'}

    The prospect is ${lead.contact.name}, ${lead.contact.title} at ${lead.company}.

    Analyze the following transcript:
    ---
    ${formattedTranscript}
    ---

    Provide a concise feedback report formatted in Markdown. The report should include:
    1.  **Overall Summary:** A brief overview of the call's effectiveness.
    2.  **Key Strengths:** 2-3 bullet points on what the salesperson did well.
    3.  **Areas for Improvement:** 2-3 specific, actionable points for improvement. Focus on objection handling, value communication, and closing.
    4.  **A "Golden Rephrase":** Suggest a better way the salesperson could have phrased one of their key statements.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating feedback:", error);
    return "Sorry, I was unable to generate feedback for this session.";
  }
};