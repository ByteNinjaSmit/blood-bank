import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, Printer, FileBarChart, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useYearlyReport } from '../queries';
import CollectionSection from '@/features/monthly-report/components/CollectionSection';
import IssuedDiscardedSection from '@/features/monthly-report/components/IssuedDiscardedSection';
import DonorStatsSection from '@/features/monthly-report/components/DonorStatsSection';
import TestingAndStockSection from '@/features/monthly-report/components/TestingAndStockSection';
import IndicationSection from '@/features/monthly-report/components/IndicationSection';
import ChemicalStockSection from '@/features/monthly-report/components/ChemicalStockSection';
import CampWiseSection from '@/features/monthly-report/components/CampWiseSection';
import DataNotesSection from '@/features/monthly-report/components/DataNotesSection';

export default function YearlyReport() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentYear = new Date().getFullYear();
  const year = Number(searchParams.get('year')) || currentYear;
  const yearOptions = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3, currentYear - 4];

  const setYear = (nextYear) => {
    setSearchParams({ year: String(nextYear) });
  };

  const { data, isLoading, isError, error, refetch, isFetching } = useYearlyReport(year);

  const periodPicker = (
    <div className="flex items-center gap-2 print:hidden">
      <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
        <SelectTrigger className="h-9 w-[110px] text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {yearOptions.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const header = (subtitle) => (
    <div className="flex items-center justify-between print:hidden">
      <div className="flex items-center gap-3">
        <div className="relative overflow-hidden p-2.5 bg-gradient-to-br from-red-600 via-red-700 to-red-950 rounded-xl shadow-[0_4px_10px_-2px_rgba(127,29,29,0.55)] ring-1 ring-white/25 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/40 before:via-white/5 before:to-transparent before:content-['']">
          <FileBarChart className="w-6 h-6 text-white relative z-10 drop-shadow-sm" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sanjivani Blood Bank, Kopargaon</h1>
          <p className="text-gray-500 text-sm">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          title="Refresh"
          aria-label="Refresh"
          className="p-2 border border-gray-200 rounded-lg bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
        {periodPicker}
        {data && (
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" /> Print
          </Button>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        {header('Yearly statutory report')}
        <div className="flex items-center justify-center text-slate-500 gap-2 py-10">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading yearly report...
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 space-y-6">
        {header('Yearly statutory report')}
        <Card className="border-red-200">
          <CardContent className="p-4 text-red-600 text-sm">
            {error?.message || 'Failed to load yearly report'}
          </CardContent>
        </Card>
      </div>
    );
  }

  const generatedOn = new Date().toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  });

  return (
    <div id="yearly-report-print-root" className="p-6 space-y-6 print:p-0 print:space-y-4">
      {header(`Yearly statutory report — ${data.period.label}`)}

      <div className="hidden print:block text-center border-b border-slate-300 pb-3 mb-2">
        <h1 className="text-2xl font-bold tracking-wide">Sanjivani Blood Bank, Kopargaon</h1>
        <p className="text-base font-semibold mt-1">Blood Bank Yearly Record</p>
        <p className="text-sm mt-0.5">Report for the year: {data.period.label}</p>
        <p className="text-xs text-slate-500 mt-1">Generated on: {generatedOn}</p>
      </div>

      <div className="space-y-5">
        <CollectionSection collection={data.collection} />
        <IssuedDiscardedSection componentsIssued={data.componentsIssued} discards={data.discards} />
        <DonorStatsSection
          repeatedDonors={data.repeatedDonors}
          donorTesting={data.donorTesting}
          rejectedDonors={data.rejectedDonors}
          donorCounselling={data.donorCounselling}
          bulkTransfer={data.bulkTransfer}
          donorCards={data.donorCards}
        />
        <TestingAndStockSection
          ttiTesting={data.ttiTesting}
          ictcReferral={data.ictcReferral}
          stockLedger={data.stockLedger}
          bloodGroupCollection={data.bloodGroupCollection}
        />
        <IndicationSection
          issueByIndication={data.issueByIndication}
          bagsToStorageCentres={data.bagsToStorageCentres}
        />
        <ChemicalStockSection chemicalStock={data.chemicalStock} bagStock={data.bagStock} />
        <CampWiseSection campWise={data.campWise} />
        <DataNotesSection notes={data.missingDataNotes} />
      </div>
    </div>
  );
}
