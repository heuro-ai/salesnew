import React, { useState } from 'react';
import type { Company, CrmLead } from '../types';
import { ChevronDownIcon, SparklesIcon } from './icons';

interface CompanyCardProps {
  company: Company;
  isSelected: boolean;
  onSelect: (company: Company) => void;
}

const CompanyCard: React.FC<CompanyCardProps> = ({ company, isSelected, onSelect }) => {
  const [expandedSection, setExpandedSection] = useState<'pitch' | 'contact' | null>(null);

  const toggleSection = (section: 'pitch' | 'contact') => {
    setExpandedSection(prev => (prev === section ? null : section));
  };
  
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-slate-900">{company.company}</h3>
            <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:text-indigo-800">
              {company.website}
            </a>
            <div className={`mt-2 text-xs font-semibold inline-flex items-center px-2.5 py-0.5 rounded-full ${
              company.likely_to_buy === 'High' ? 'bg-green-100 text-green-800' : 
              company.likely_to_buy === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 
              'bg-red-100 text-red-800'
            }`}>
              Likely to Buy: {company.likely_to_buy}
            </div>
          </div>
          <div className="flex items-center">
            <span className="text-sm font-medium text-slate-600 mr-4">Confidence: {company.confidence_score}%</span>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(company)}
              className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
          </div>
        </div>
        <p className="mt-4 text-sm text-slate-600">{company.reason_for_fit}</p>
      </div>

      {/* Contact Section */}
      <div className="border-t border-slate-200">
        <button onClick={() => toggleSection('contact')} className="w-full flex justify-between items-center p-4 text-left hover:bg-slate-50">
          <span className="font-semibold text-slate-800">Contact Details</span>
          <ChevronDownIcon className={`w-5 h-5 text-slate-500 transform transition-transform ${expandedSection === 'contact' ? 'rotate-180' : ''}`} />
        </button>
        {expandedSection === 'contact' && (
          <div className="px-6 pb-4 border-t border-slate-200 bg-slate-50">
            <p className="mt-4"><strong>Name:</strong> {company.contact.name}</p>
            <p><strong>Title:</strong> {company.contact.title}</p>
            <p><strong>Email:</strong> {company.contact.validated_email} ({company.contact.validation_status})</p>
          </div>
        )}
      </div>

      {/* Pitch Section */}
      <div className="border-t border-slate-200">
        <button onClick={() => toggleSection('pitch')} className="w-full flex justify-between items-center p-4 text-left hover:bg-slate-50">
          <span className="font-semibold text-slate-800">Generated Pitch</span>
          <ChevronDownIcon className={`w-5 h-5 text-slate-500 transform transition-transform ${expandedSection === 'pitch' ? 'rotate-180' : ''}`} />
        </button>
        {expandedSection === 'pitch' && (
          <div className="px-6 pb-6 border-t border-slate-200 bg-slate-50 space-y-4">
            <div className="mt-4">
              <h4 className="font-semibold text-sm">Subject Lines</h4>
              <ul className="list-disc list-inside text-sm text-slate-700">
                {company.pitch.subject_lines.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm">Short Email (&le;80 words)</h4>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{company.pitch.email_short}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm">Medium Email (≈120 words)</h4>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{company.pitch.email_medium}</p>
            </div>
             <div>
              <h4 className="font-semibold text-sm">Long Email (Narrative)</h4>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{company.pitch.email_long}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface ResearchResultsProps {
  companies: Company[];
  onAddToCrm: (leads: CrmLead[]) => void;
  onGenerateMore: () => void;
  isLoading: boolean;
}

export const ResearchResults: React.FC<ResearchResultsProps> = ({ companies, onAddToCrm, onGenerateMore, isLoading }) => {
  const [selectedCompanies, setSelectedCompanies] = useState<Company[]>([]);

  const handleSelectCompany = (company: Company) => {
    setSelectedCompanies(prev =>
      prev.some(c => c.company === company.company)
        ? prev.filter(c => c.company !== company.company)
        : [...prev, company]
    );
  };
  
  const handleAddToCrm = () => {
    const newLeads: CrmLead[] = selectedCompanies.map(c => ({
      ...c,
      id: `${c.company}-${Date.now()}`,
      status: 'New',
      emailSent: false,
      replyReceived: false,
      lastContacted: null,
    }));
    onAddToCrm(newLeads);
    setSelectedCompanies([]);
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="text-center">
         <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Prospecting Results
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Here are {companies.length} highly-qualified leads tailored to your product. Select the best fits to add to your CRM.
        </p>
      </div>

      <div className="mt-10 grid gap-8 md:grid-cols-2">
        {companies.map(company => (
          <CompanyCard
            key={company.company}
            company={company}
            isSelected={selectedCompanies.some(c => c.company === company.company)}
            onSelect={handleSelectCompany}
          />
        ))}
      </div>

      {companies.length > 0 && (
         <div className="sticky bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-sm border-t border-slate-200 mt-8">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
             <button
              onClick={onGenerateMore}
              disabled={isLoading}
              className="inline-flex items-center rounded-md border border-slate-300 bg-white px-6 py-3 text-base font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-slate-100 disabled:cursor-not-allowed"
            >
               {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5 mr-2" />
                  Generate More
                </>
              )}
            </button>
            <div className="flex items-center">
              <span className="mr-4 text-lg font-medium text-slate-700">{selectedCompanies.length} selected</span>
              <button
                onClick={handleAddToCrm}
                disabled={selectedCompanies.length === 0}
                className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-300 disabled:cursor-not-allowed"
              >
                Add to CRM
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};