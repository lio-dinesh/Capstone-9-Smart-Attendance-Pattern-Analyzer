import React, { useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sidebar, NavPage } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { FilterBar } from './components/layout/FilterBar';
import { OverviewPage } from './pages/OverviewPage';
import { TrendsPage } from './pages/TrendsPage';
import { CourseInsightsPage } from './pages/CourseInsightsPage';
import { ReviewCenterPage } from './pages/ReviewCenterPage';
import { DataQualityPage } from './pages/DataQualityPage';
import { DataExplorerPage } from './pages/DataExplorerPage';
import { MethodologyPage } from './pages/MethodologyPage';
import { fetchSummary, fetchQualityReport, reloadDemoData } from './services/api';
import { FilterState } from './types';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const DashboardApp: React.FC = () => {
  const [activePage, setActivePage] = useState<NavPage>('overview');
  const [filters, setFilters] = useState<FilterState>({
    courseCode: 'All Courses',
    section: 'All Sections',
    dateStart: '',
    dateEnd: '',
  });

  const qc = useQueryClient();

  const { data: summary, refetch: refetchSummary, isFetching: isRefreshingSummary } = useQuery({
    queryKey: ['summary', filters],
    queryFn: () => fetchSummary(filters),
  });

  const { data: qualityReport } = useQuery({
    queryKey: ['quality-report'],
    queryFn: fetchQualityReport,
  });

  const resetMutation = useMutation({
    mutationFn: reloadDemoData,
    onSuccess: () => {
      qc.invalidateQueries();
    },
  });

  const handleRefresh = () => {
    qc.invalidateQueries();
  };

  const showFilterBar = ['overview', 'trends', 'courses', 'explorer'].includes(activePage);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      {/* Fixed Left Navigation */}
      <Sidebar
        activePage={activePage}
        onPageSelect={setActivePage}
        activeFlagsCount={summary?.active_flags_count ?? 0}
        dataQualityIssuesCount={qualityReport?.issues_list.length ?? 0}
        onResetDemo={() => resetMutation.mutate()}
        isResetting={resetMutation.isPending}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          activePage={activePage}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshingSummary}
        />

        {showFilterBar && (
          <FilterBar
            filters={filters}
            onChange={setFilters}
            onReset={() =>
              setFilters({
                courseCode: 'All Courses',
                section: 'All Sections',
                dateStart: '',
                dateEnd: '',
              })
            }
          />
        )}

        <main className="flex-1 pb-16">
          {activePage === 'overview' && (
            <OverviewPage filters={filters} onNavigate={setActivePage} />
          )}
          {activePage === 'trends' && <TrendsPage filters={filters} />}
          {activePage === 'courses' && <CourseInsightsPage filters={filters} />}
          {activePage === 'review' && <ReviewCenterPage />}
          {activePage === 'quality' && <DataQualityPage />}
          {activePage === 'explorer' && <DataExplorerPage filters={filters} />}
          {activePage === 'methodology' && <MethodologyPage />}
        </main>
      </div>
    </div>
  );
};

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DashboardApp />
    </QueryClientProvider>
  );
}

export default App;
