import React, { useState } from 'react';
import type { UserInput } from '../types';
import { SparklesIcon } from './icons';

interface InputFormProps {
  onGenerate: (input: UserInput) => void;
  isLoading: boolean;
}

const InputField: React.FC<{
  id: keyof UserInput;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  isTextArea?: boolean;
}> = ({ id, label, value, onChange, placeholder, isTextArea = false }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-slate-700">
      {label}
    </label>
    <div className="mt-1">
      {isTextArea ? (
        <textarea
          id={id}
          name={id}
          rows={3}
          value={value}
          onChange={onChange}
          className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white py-2 px-3"
          placeholder={placeholder}
        />
      ) : (
        <input
          type="text"
          id={id}
          name={id}
          value={value}
          onChange={onChange}
          className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white py-2 px-3"
          placeholder={placeholder}
        />
      )}
    </div>
  </div>
);

export const InputForm: React.FC<InputFormProps> = ({ onGenerate, isLoading }) => {
  const [userInput, setUserInput] = useState<UserInput>({
    productName: '',
    productDescription: '',
    targetAudience: '',
    companySize: '',
    industry: '',
    geography: '',
    priceRange: '',
    valueProposition: '',
    competitiveEdge: '',
    keywords: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUserInput(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(userInput);
  };

  // FIX: Add type guard to prevent calling .trim() on non-string values.
  const isFormValid = Object.values(userInput).some(value => typeof value === 'string' && value.trim() !== '');

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <SparklesIcon className="mx-auto h-12 w-12 text-indigo-600" />
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Sales Crew AI
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Describe your product and target audience. We'll find your next customers.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-10 space-y-8 bg-white p-8 rounded-lg shadow-lg border border-slate-200">
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
          <InputField id="productName" label="Product Name" value={userInput.productName} onChange={handleChange} placeholder="e.g., QuantumLeap AI" />
          <InputField id="targetAudience" label="Target Audience / ICP" value={userInput.targetAudience} onChange={handleChange} placeholder="e.g., CMOs, Heads of Marketing" />
        </div>
        
        <InputField id="productDescription" label="Product Description" value={userInput.productDescription} onChange={handleChange} isTextArea={true} placeholder="Describe what your product does." />
        
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
          <InputField id="companySize" label="Ideal Company Size" value={userInput.companySize} onChange={handleChange} placeholder="e.g., 50-500 employees" />
          <InputField id="industry" label="Industry" value={userInput.industry} onChange={handleChange} placeholder="e.g., E-commerce, SaaS" />
          <InputField id="geography" label="Geography / Market Region" value={userInput.geography} onChange={handleChange} placeholder="e.g., North America" />
          <InputField id="priceRange" label="Price Range or Ticket Size" value={userInput.priceRange} onChange={handleChange} placeholder="e.g., $5k - $20k/month" />
        </div>

        <InputField id="valueProposition" label="Value Proposition" value={userInput.valueProposition} onChange={handleChange} isTextArea={true} placeholder="What is the key benefit for the customer?" />
        <InputField id="competitiveEdge" label="Competitive Edge / USP" value={userInput.competitiveEdge} onChange={handleChange} placeholder="What makes you unique?" />
        <InputField id="keywords" label="Keywords to Match" value={userInput.keywords} onChange={handleChange} placeholder="e.g., predictive analytics, lead scoring" />

        <div className="pt-5">
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading || !isFormValid}
              className="inline-flex justify-center items-center rounded-md border border-transparent bg-indigo-600 py-3 px-6 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-300 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating Leads...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5 mr-2" />
                  Generate Leads
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};