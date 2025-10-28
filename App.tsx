import React, { useState, useCallback, useEffect } from 'react';
import type { UserInput, Company, CrmLead } from './types';
import { Page } from './types';
import { InputForm } from './components/InputForm';
import { ResearchResults } from './components/ResearchResults';
import { CrmTable } from './components/CrmTable';
import { RolePlay } from './components/RolePlay';
import { AuthForm } from './components/AuthForm';
import { generateLeadsAndPitches } from './services/perplexityService';
import { SparklesIcon } from './components/icons';
import { useAuth } from './contexts/AuthContext';

const NavButton: React.FC<{
  label: string;
  page: Page;
  currentPage: Page;
  onClick: (page: Page) => void;
  disabled?: boolean;
}> = ({ label, page, currentPage, onClick, disabled = false }) => (
  <button
    onClick={() => onClick(page)}
    disabled={disabled}
    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
      currentPage === page
        ? 'bg-indigo-600 text-white'
        : 'text-slate-600 hover:bg-slate-200'
    } disabled:text-slate-400 disabled:bg-slate-100 disabled:cursor-not-allowed`}
  >
    {label}
  </button>
);


export default function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>(Page.INPUT);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [userInput, setUserInput] = useState<UserInput | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [crmLeads, setCrmLeads] = useState<CrmLead[]>([]);
  const [rolePlayLead, setRolePlayLead] = useState<CrmLead | null>(null);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  const fetchLeads = async (input: UserInput, existingCompanies: Company[] = []) => {
    setIsLoading(true);
    setError(null);
    try {
      const userLocation = await new Promise<GeolocationCoordinates | null>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => resolve(position.coords),
          () => resolve(null) // Resolve with null on error/denial
        );
      });
      const excludeCompanyNames = existingCompanies.map(c => c.company);
      const results = await generateLeadsAndPitches(input, userLocation, excludeCompanyNames);
      setCompanies(prev => [...prev, ...results]);
      return true;
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async (input: UserInput) => {
    setUserInput(input);
    setCompanies([]); // Reset companies for a new search
    const success = await fetchLeads(input);
    if (success) {
      setCurrentPage(Page.RESEARCH);
    } else {
      setCurrentPage(Page.INPUT);
    }
  };

  const handleGenerateMore = async () => {
    if (!userInput) return;
    await fetchLeads(userInput, companies);
  };


  const handleAddToCrm = useCallback((leads: CrmLead[]) => {
    setCrmLeads(prev => {
      const newLeads = leads.filter(l => !prev.some(pl => pl.company === l.company));
      return [...prev, ...newLeads];
    });
    setCurrentPage(Page.CRM);
  }, []);
  
  const handleUpdateLead = useCallback((updatedLead: CrmLead) => {
    setCrmLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
  }, []);

  const handleStartRolePlay = useCallback((lead: CrmLead) => {
    setRolePlayLead(lead);
    setCurrentPage(Page.ROLE_PLAY);
  }, []);

  const navigate = (page: Page) => {
    if (page === Page.ROLE_PLAY && !rolePlayLead) return;
    setCurrentPage(page);
  }

  const renderContent = () => {
    switch (currentPage) {
      case Page.INPUT:
        return <InputForm onGenerate={handleGenerate} isLoading={isLoading} />;
      case Page.RESEARCH:
        return <ResearchResults companies={companies} onAddToCrm={handleAddToCrm} onGenerateMore={handleGenerateMore} isLoading={isLoading} />;
      case Page.CRM:
        return <CrmTable leads={crmLeads} onUpdateLead={handleUpdateLead} onStartRolePlay={handleStartRolePlay} />;
      case Page.ROLE_PLAY:
        return rolePlayLead ? <RolePlay lead={rolePlayLead} userInput={userInput} /> : <p>No lead selected for role-play.</p>;
      default:
        return <InputForm onGenerate={handleGenerate} isLoading={isLoading} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <SparklesIcon className="h-8 w-8 text-indigo-600" />
            <span className="text-xl font-bold text-slate-800">Sales Crew AI</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-lg">
               <NavButton label="1. Input" page={Page.INPUT} currentPage={currentPage} onClick={navigate} />
               <NavButton label="2. Research" page={Page.RESEARCH} currentPage={currentPage} onClick={navigate} disabled={companies.length === 0} />
               <NavButton label="3. CRM" page={Page.CRM} currentPage={currentPage} onClick={navigate} disabled={crmLeads.length === 0} />
               <NavButton label="4. Role-Play" page={Page.ROLE_PLAY} currentPage={currentPage} onClick={navigate} disabled={!rolePlayLead} />
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-slate-600">{user.email}</span>
              <button
                onClick={signOut}
                className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </nav>
      </header>
      <main>
        {error && (
            <div className="max-w-4xl mx-auto mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
                <p><strong>Error:</strong> {error}</p>
            </div>
        )}
        {renderContent()}
      </main>
    </div>
  );
}