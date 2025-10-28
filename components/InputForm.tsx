import React, { useState, useEffect } from 'react';
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
  required?: boolean;
  helpText?: string;
}> = ({ id, label, value, onChange, placeholder, isTextArea = false, required = false, helpText }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-slate-700">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
      {helpText && (
        <span className="ml-2 text-xs text-slate-500 font-normal">
          {helpText}
        </span>
      )}
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

const STORAGE_KEY = 'sales-crew-draft';

export const InputForm: React.FC<InputFormProps> = ({ onGenerate, isLoading }) => {
  const [userInput, setUserInput] = useState<UserInput>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {
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
        };
      }
    }
    return {
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
    };
  });
  const [showSavedMessage, setShowSavedMessage] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userInput));
    }, 500);
    return () => clearTimeout(timer);
  }, [userInput]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUserInput(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveDraft = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userInput));
    setShowSavedMessage(true);
    setTimeout(() => setShowSavedMessage(false), 2000);
  };

  const handleClearDraft = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUserInput({
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
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.removeItem(STORAGE_KEY);
    onGenerate(userInput);
  };

  const requiredFields: (keyof UserInput)[] = ['productName', 'productDescription', 'targetAudience'];
  const isFormValid = requiredFields.every(field => userInput[field].trim() !== '');
  const filledCount = Object.values(userInput).filter(v => v.trim() !== '').length;
  const totalCount = Object.keys(userInput).length;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <SparklesIcon className="mx-auto h-12 w-12 text-blue-600" />
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Sales Crew AI
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Describe your product and target audience. We'll find your next customers.
        </p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <div className="flex-1 max-w-xs bg-slate-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(filledCount / totalCount) * 100}%` }}
            ></div>
          </div>
          <span className="text-sm text-slate-600">{filledCount} of {totalCount} fields</span>
        </div>
        {showSavedMessage && (
          <div className="mt-2 text-sm text-green-600 font-medium animate-pulse">
            Draft saved!
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-10 space-y-8 bg-white p-8 rounded-lg shadow-lg border border-slate-200">
        <div className="border-l-4 border-blue-600 pl-4 mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Product Information</h2>
          <p className="text-sm text-slate-600">Tell us about what you're selling</p>
        </div>

        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
          <InputField
            id="productName"
            label="Product Name"
            value={userInput.productName}
            onChange={handleChange}
            placeholder="e.g., QuantumLeap AI"
            required
          />
          <InputField
            id="priceRange"
            label="Price Range"
            value={userInput.priceRange}
            onChange={handleChange}
            placeholder="e.g., $5k-$20k/month"
            helpText="Optional"
          />
        </div>

        <InputField
          id="productDescription"
          label="Product Description"
          value={userInput.productDescription}
          onChange={handleChange}
          isTextArea={true}
          placeholder="Describe what your product does and how it helps customers..."
          required
        />

        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
          <InputField
            id="valueProposition"
            label="Key Benefit"
            value={userInput.valueProposition}
            onChange={handleChange}
            placeholder="e.g., Reduce costs by 40%"
            helpText="What's the main value?"
          />
          <InputField
            id="competitiveEdge"
            label="Unique Selling Point"
            value={userInput.competitiveEdge}
            onChange={handleChange}
            placeholder="e.g., Only AI-powered solution"
            helpText="What makes you different?"
          />
        </div>

        <div className="border-l-4 border-blue-600 pl-4 mb-6 mt-8">
          <h2 className="text-lg font-semibold text-slate-900">Target Audience</h2>
          <p className="text-sm text-slate-600">Who are your ideal customers?</p>
        </div>

        <InputField
          id="targetAudience"
          label="Decision Makers"
          value={userInput.targetAudience}
          onChange={handleChange}
          placeholder="e.g., VP of Sales, Revenue Operations"
          required
          helpText="Job titles to target"
        />

        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
          <InputField
            id="companySize"
            label="Company Size"
            value={userInput.companySize}
            onChange={handleChange}
            placeholder="e.g., 50-500 employees"
            helpText="Optional"
          />
          <InputField
            id="industry"
            label="Industry"
            value={userInput.industry}
            onChange={handleChange}
            placeholder="e.g., SaaS, E-commerce"
            helpText="Optional"
          />
        </div>

        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
          <InputField
            id="geography"
            label="Target Region"
            value={userInput.geography}
            onChange={handleChange}
            placeholder="e.g., United States, Europe"
            helpText="Countries or regions"
          />
          <InputField
            id="keywords"
            label="Keywords"
            value={userInput.keywords}
            onChange={handleChange}
            placeholder="e.g., CRM, automation, analytics"
            helpText="Technologies or topics"
          />
        </div>

        <div className="pt-5">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save Draft
              </button>
              {filledCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearDraft}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Clear
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={isLoading || !isFormValid}
              className="inline-flex justify-center items-center rounded-md border border-transparent bg-blue-600 py-3 px-6 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300 disabled:cursor-not-allowed"
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
          {!isFormValid && filledCount > 0 && (
            <p className="mt-2 text-sm text-slate-600 text-right">
              Please fill in all required fields (*) to continue
            </p>
          )}
        </div>
      </form>
    </div>
  );
};