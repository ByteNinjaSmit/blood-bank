import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, Printer, FileBarChart, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMonthlyReport } from '../queries';
import CollectionSection from '../components/CollectionSection';
import IssuedDiscardedSection from '../components/IssuedDiscardedSection';
import DonorStatsSection from '../components/DonorStatsSection';
import TestingAndStockSection from '../components/TestingAndStockSection';
import IndicationSection from '../components/IndicationSection';
import ChemicalStockSection from '../components/ChemicalStockSection';
import CampWiseSection from '../components/CampWiseSection';
import DataNotesSection from '../components/DataNotesSection';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function lastMonth() {
  const today = new Date();
  const firstOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonthEnd = new Date(firstOfThisMonth.getTime() - 24 * 60 * 60 * 1000);
  return { month: lastMonthEnd.getMonth() + 1, year: lastMonthEnd.getFullYear() };
}

export default function MonthlyReport() {
  const [searchParams, setSearchParams] = useSearchParams();
  const defaults = lastMonth();
  const month = Number(searchParams.get('month')) || defaults.month;
  const year = Number(searchParams.get('year')) || defaults.year;
  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear, currentYear - 1, currentYear - 2];

  const setPeriod = (nextMonth, nextYear) => {
    setSearchParams({ month: String(nextMonth), year: String(nextYear) });
  };

  const { data, isLoading, isError, error, refetch, isFetching } = useMonthlyReport(month, year);

  const periodPicker = (
    <div className="flex items-center gap-2 print:hidden">
      <Select value={String(month)} onValueChange={(v) => setPeriod(Number(v), year)}>
        <SelectTrigger className="h-9 w-[140px] text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MONTH_NAMES.map((name, i) => (
            <SelectItem key={name} value={String(i + 1)}>
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={String(year)} onValueChange={(v) => setPeriod(month, Number(v))}>
        <SelectTrigger className="h-9 w-[100px] text-sm">
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

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative overflow-hidden p-2.5 bg-gradient-to-br from-red-600 via-red-700 to-red-950 rounded-xl shadow-[0_4px_10px_-2px_rgba(127,29,29,0.55)] ring-1 ring-white/25 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/40 before:via-white/5 before:to-transparent before:content-['']">
              <FileBarChart className="w-6 h-6 text-white relative z-10 drop-shadow-sm" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sanjivani Blood Bank, Kopargaon</h1>
              <p className="text-gray-500 text-sm">Monthly statutory report</p>
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
          </div>
        </div>
        <div className="flex items-center justify-center text-slate-500 gap-2 py-10">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading monthly report...
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative overflow-hidden p-2.5 bg-gradient-to-br from-red-600 via-red-700 to-red-950 rounded-xl shadow-[0_4px_10px_-2px_rgba(127,29,29,0.55)] ring-1 ring-white/25 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/40 before:via-white/5 before:to-transparent before:content-['']">
              <FileBarChart className="w-6 h-6 text-white relative z-10 drop-shadow-sm" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sanjivani Blood Bank, Kopargaon</h1>
              <p className="text-gray-500 text-sm">Monthly statutory report</p>
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
          </div>
        </div>
        <Card className="border-red-200">
          <CardContent className="p-4 text-red-600 text-sm">
            {error?.message || 'Failed to load monthly report'}
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
    <div id="monthly-report-print-root" className="p-6 space-y-6 print:p-0 print:space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <div className="relative overflow-hidden p-2.5 bg-gradient-to-br from-red-600 via-red-700 to-red-950 rounded-xl shadow-[0_4px_10px_-2px_rgba(127,29,29,0.55)] ring-1 ring-white/25 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/40 before:via-white/5 before:to-transparent before:content-['']">
            <FileBarChart className="w-6 h-6 text-white relative z-10 drop-shadow-sm" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sanjivani Blood Bank, Kopargaon</h1>
            <p className="text-gray-500 text-sm">Monthly statutory report — {data.period.label}</p>
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
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" /> Print
          </Button>
        </div>
      </div>

      <div className="hidden print:block text-center border-b border-slate-300 pb-3 mb-2">
        <h1 className="text-2xl font-bold tracking-wide">Sanjivani Blood Bank, Kopargaon</h1>
        <p className="text-base font-semibold mt-1">Blood Bank Monthly Record</p>
        <p className="text-sm mt-0.5">Report for the month of: {data.period.label}</p>
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
