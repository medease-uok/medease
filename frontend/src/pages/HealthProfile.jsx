import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HeartPulse, Syringe } from 'lucide-react';
import ChronicConditions from './ChronicConditions';
import Vaccinations from './Vaccinations';

const TABS = [
  { id: 'conditions', label: 'Chronic Conditions', icon: HeartPulse },
  { id: 'vaccinations', label: 'Vaccinations', icon: Syringe },
];

const TAB_COMPONENTS = {
  conditions: ChronicConditions,
  vaccinations: Vaccinations,
};

export default function HealthProfile() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = TABS.find((t) => t.id === searchParams.get('tab'))?.id || 'conditions';
  const [activeTab, setActiveTab] = useState(initialTab);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId }, { replace: true });
  };

  const ActiveComponent = TAB_COMPONENTS[activeTab];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-heading text-slate-900">
          Health Profile
        </h1>
        <p className="text-slate-500 mt-1">
          Your ongoing health conditions and vaccination history.
        </p>
      </div>

      {/* Tab navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-1 -mb-px" aria-label="Health profile tabs">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                role="tab"
                aria-selected={isActive}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab content */}
      <div>
        <ActiveComponent embedded />
      </div>
    </div>
  );
}
