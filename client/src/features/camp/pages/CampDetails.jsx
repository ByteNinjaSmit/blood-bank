import React, { useEffect, useState } from 'react';
import { MapPin, Phone, Mail, Users, Calendar, Droplets, Plus, Activity, Clock, ArrowLeft, Trash2, FolderOpen, FileSpreadsheet, ChevronDown, Loader2, RefreshCw } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Button from '@/components/shared/Button';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useCampDetail } from '@/hooks/useCamp';
import EnhancedLoader from '@/components/utils/Spinner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { donorApi } from '@/features/donor/api';
import { donationApi } from '@/features/donation/api';
import { useAuth } from '@/store/auth';
import { exportCampDonorRegister } from '@/features/donor/donorRegisterExport';
import { exportCampDonationRegister } from '@/features/donation/donationRegisterExport';

const CampDetails = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const campId = searchParams.get('id');
  const { data: camp, isLoading: loading, isFetching, error: queryError, refetch } = useCampDetail(campId);
  const { user } = useAuth();
  const [drafts, setDrafts] = React.useState([]);
  const [showDraftsModal, setShowDraftsModal] = React.useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const generatedBy = user?.name ? [user.name.first, user.name.last].filter(Boolean).join(' ') : (user?.username || 'System User');

  // Both exports below share the exact same columns, colours and layout as
  // the Master Donor / Master Donation registers (via the same helper
  // functions those pages use) — just pre-filtered to this camp, with the
  // sheet tab and file named "<Donor|Donation> Register — <camp name>".
  const handleExportCampDonors = async () => {
    setExportMenuOpen(false);
    setExporting(true);
    try {
      const { items } = await donorApi.list({ campId, pageSize: 1 });
      if (!items || items.length === 0) {
        toast.info('No donors registered at this camp yet');
        return;
      }
      await exportCampDonorRegister(campId, camp?.name || 'Camp', generatedBy);
    } catch (e) {
      toast.error(e?.message || 'Failed to export donor data');
    } finally {
      setExporting(false);
    }
  };

  const handleExportCampDonations = async () => {
    setExportMenuOpen(false);
    setExporting(true);
    try {
      const { items } = await donationApi.list({ campId, pageSize: 1 });
      if (!items || items.length === 0) {
        toast.info('No donations recorded at this camp yet');
        return;
      }
      await exportCampDonationRegister(campId, camp?.name || 'Camp', generatedBy);
    } catch (e) {
      toast.error(e?.message || 'Failed to export donation data');
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    const rawDrafts = localStorage.getItem("blood_bank_donor_creation_drafts");
    try {
      const allDrafts = rawDrafts ? JSON.parse(rawDrafts) : [];
      if (Array.isArray(allDrafts)) {
        const campDrafts = allDrafts.filter(d => d.campId === campId);
        setDrafts(campDrafts);
      }
    } catch (e) {
      console.error("Failed to parse drafts", e);
    }
  }, [campId, showDraftsModal]);

  const handleDeleteDraft = (id) => {
    const rawDrafts = localStorage.getItem("blood_bank_donor_creation_drafts");
    try {
      let allDrafts = rawDrafts ? JSON.parse(rawDrafts) : [];
      allDrafts = allDrafts.filter(d => d.id !== id);
      localStorage.setItem("blood_bank_donor_creation_drafts", JSON.stringify(allDrafts));
      setDrafts(allDrafts.filter(d => d.campId === campId));
      toast.success("Draft deleted successfully");
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!campId) {
      navigate('/camp-listing');
    }
  }, [campId, navigate]);

  const error = queryError?.message ?? null;

  const handleFacilityClick = (facilityType) => {
    switch (facilityType) {
      case 'view-donor':
        navigate(`/camp-donors?id=${campId}`);
        break;
      case 'create-donation':
        navigate(`/master-register/donor-creation?campId=${campId}`);
        break;
      case 'view-donations':
        navigate(`/camp-donation?id=${campId}`);
        break;
      case 'draft-forms':
        setShowDraftsModal(true);
        break;
      default:
        break;
    }
  };

  const getProgressStatus = (camp) => {
    if (!camp.dateFrom || !camp.dateTo) return "N/A";

    const now = new Date();
    const start = new Date(camp.dateFrom);
    const end = new Date(camp.dateTo);

    if (now < start) return "Upcoming";
    if (now >= start && now <= end) return "Ongoing";
    return "Completed";
  };

  const getProgressBadge = (status) => {
    const colors = {
      Upcoming: "bg-blue-100 text-blue-800",
      Ongoing: "bg-green-100 text-green-800",
      Completed: "bg-gray-100 text-gray-800",
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-800"}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return <EnhancedLoader message="Loading camp details..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Camp</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => navigate('/camp-listing')}>
            Go to Camp List
          </Button>
        </div>
      </div>
    );
  }

  if (!camp) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Camp Not Found</h2>
          <p className="text-gray-600 mb-6">The requested camp could not be found.</p>
          <Button onClick={() => navigate('/camp-listing')}>
            Go to Camp List
          </Button>
        </div>
      </div>
    );
  }

  const durationDays = Math.max(1, Math.ceil((new Date(camp.dateTo) - new Date(camp.dateFrom)) / 86400000));
  const formatDateTime = (d) => new Date(d).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const facilities = [
    {
      id: "view-donor",
      title: "View Donors",
      description: "Browse, search, and manage existing donor records and history",
      icon: Users,
      color: "bg-orange-800",
      stats: `${camp?.donorCount || 0} Total Donors`,
    },
    {
      id: "create-donation",
      title: "Create Donation",
      description: "Record new blood donations with vitals, tests, and bag information",
      icon: Plus,
      color: "bg-orange-800",
    },
    {
      id: "view-donations",
      title: "View Donations",
      description: "Manage donation records, track status, and view test results",
      icon: Activity,
      color: "bg-orange-800",
      stats: `${camp?.donationCount || 0} Total Donations`,
    },
    {
      id: "draft-forms",
      title: "Draft Forms",
      description: "Resume or manage partially completed donor registration and donation forms",
      icon: FolderOpen,
      color: "bg-orange-800",
      stats: `${drafts.length} Draft Form${drafts.length !== 1 ? 's' : ''}`,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
            <div className="flex items-center gap-3">
              <div className="relative overflow-hidden p-2.5 bg-gradient-to-br from-red-600 via-red-700 to-red-950 rounded-xl shadow-[0_4px_10px_-2px_rgba(127,29,29,0.55)] ring-1 ring-white/25 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/40 before:via-white/5 before:to-transparent before:content-['']">
                <MapPin className="w-6 h-6 text-white relative z-10 drop-shadow-sm" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Camp Management</h1>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="truncate" title={camp.name}>{camp.name}</span>
                  <span>•</span>
                  {getProgressBadge(getProgressStatus(camp))}
                </div>
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/camp-donors?id=${campId}`)}
                title="View donors for this camp"
                className="hidden sm:flex text-sm"
              >
                <Users className="w-4 h-4 mr-1.5" /> Donors
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/camp-donation?id=${campId}`)}
                title="View donations for this camp"
                className="hidden sm:flex text-sm"
              >
                <Activity className="w-4 h-4 mr-1.5" /> Donations
              </Button>
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setExportMenuOpen((o) => !o)}
                  disabled={exporting}
                  title="Export this camp's donor or donation register to Excel"
                  className="text-sm"
                >
                  {exporting ? (
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-4 h-4 mr-1.5 text-green-700" />
                  )}
                  Export Excel
                  <ChevronDown className={`w-3.5 h-3.5 ml-1.5 transition-transform ${exportMenuOpen ? 'rotate-180' : ''}`} />
                </Button>
                {exportMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setExportMenuOpen(false)}></div>
                    <div className="absolute right-0 mt-1.5 w-56 rounded-lg bg-white shadow-lg ring-1 ring-black/5 z-20 overflow-hidden divide-y divide-gray-100">
                      <button
                        type="button"
                        onClick={handleExportCampDonors}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left font-medium"
                      >
                        <Users className="w-4 h-4 text-orange-700 flex-shrink-0" /> Donor Data
                      </button>
                      <button
                        type="button"
                        onClick={handleExportCampDonations}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left font-medium"
                      >
                        <Activity className="w-4 h-4 text-orange-700 flex-shrink-0" /> Donation Data
                      </button>
                    </div>
                  </>
                )}
              </div>
              <Button
                size="sm"
                onClick={() => navigate(`/master-register/donor-creation?campId=${campId}`)}
                title="Create a new donation"
                className="text-sm"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Create Donation
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between" title="Total donors who have donated in this camp">
              <span className="text-sm text-gray-500">Donors</span>
              <Users className="w-4 h-4 text-gray-400" />
            </div>
            <div className="mt-2 text-2xl font-semibold text-gray-900">{camp?.donorCount || 0}</div>
          </div>
          <div className="rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between" title="Total donations recorded in this camp">
              <span className="text-sm text-gray-500">Donations</span>
              <Droplets className="w-4 h-4 text-gray-400" />
            </div>
            <div className="mt-2 text-2xl font-semibold text-gray-900">{camp?.donationCount || 0}</div>
          </div>
          <div className="rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between" title="Camp duration">
              <span className="text-sm text-gray-500">Duration</span>
              <Clock className="w-4 h-4 text-gray-400" />
            </div>
            <div className="mt-2 text-2xl font-semibold text-gray-900">{durationDays}</div>
            <div className="text-xs text-gray-500">day{durationDays > 1 ? 's' : ''}</div>
          </div>
          <div className="rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between" title="Staff assigned">
              <span className="text-sm text-gray-500">Staff</span>
              <Users className="w-4 h-4 text-gray-400" />
            </div>
            <div className="mt-2 text-2xl font-semibold text-gray-900">{camp.staff?.length || 0}</div>
          </div>
        </div>
        {/* Camp Information */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-xl font-bold text-gray-900">{camp.name}</h2>
            {getProgressBadge(getProgressStatus(camp))}
          </div>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="px-2.5 py-1 rounded-full text-xs bg-gray-100 text-gray-800" title="Internal camp identifier">
              ID: <span className="font-mono">{camp.campId}</span>
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs bg-gray-100 text-gray-800" title="Start and end dates">
              <Clock className="inline w-3 h-3 mr-1" />{formatDateTime(camp.dateFrom)} → {formatDateTime(camp.dateTo)}
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs bg-gray-100 text-gray-800" title="Created date">
              <Calendar className="inline w-3 h-3 mr-1" />{new Date(camp.createdAt).toLocaleDateString()}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-3">
              {camp.description && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 mb-1">Description</p>
                  <p className="text-sm text-gray-700">{camp.description}</p>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg" title="Camp address">
                  <MapPin className="w-4 h-4 text-orange-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-500">Address</p>
                    <p className="text-sm text-gray-700 truncate">{camp.address}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg" title="Contact phone">
                  <Phone className="w-4 h-4 text-orange-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-500">Phone</p>
                    <p className="text-sm text-gray-700">{camp.contactInfo?.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg" title="Contact email">
                  <Mail className="w-4 h-4 text-orange-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-500">Email</p>
                    <p className="text-sm text-gray-700 truncate">{camp.contactInfo?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg" title="Camp created by">
                  <Users className="w-4 h-4 text-orange-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-500">Created By</p>
                    <p className="text-sm text-gray-700">{camp.createdBy?.name?.first} {camp.createdBy?.name?.last}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {camp.staff && camp.staff.length > 0 && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 mb-2">Assigned Staff ({camp.staff.length})</p>
                  <div className="space-y-2">
                    {camp.staff.map((member, index) => (
                      <div key={member._id || index} className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-800 flex items-center justify-center text-xs font-semibold shrink-0" title={`${member.name?.first || ''} ${member.name?.last || ''}`}>
                          {(member?.name?.first?.[0] || 'S')}{(member?.name?.last?.[0] || '')}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-gray-700 truncate">
                            {member.name?.first} {member.name?.last}
                          </p>
                          <p className="text-xs text-gray-500">{member.role || 'Staff'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {camp.volunteers && camp.volunteers.length > 0 && (
                <div className="p-3 bg-orange-50/60 border border-orange-100 rounded-lg">
                  <p className="text-xs font-medium text-orange-900 mb-2">Staff Not In System ({camp.volunteers.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {camp.volunteers.map((volName, index) => (
                      <span key={index} className="px-2 py-0.5 rounded bg-white text-orange-900 border border-orange-200 text-xs font-medium shadow-2xs">
                        {volName}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {camp.lastUpdatedBy && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 mb-1">Last Updated</p>
                  <p className="text-sm text-gray-700">{camp.lastUpdatedBy?.name?.first} {camp.lastUpdatedBy?.name?.last}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Facilities Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {facilities.map((facility) => {
            const IconComponent = facility.icon;
            return (
              <div
                key={facility.id}
                onClick={() => handleFacilityClick(facility.id)}
                className="group cursor-pointer bg-white rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors"
                title={facility.title}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-lg bg-orange-100`}>
                      <IconComponent className="w-5 h-5 text-orange-800" />
                    </div>
                    <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-orange-800 transition-colors">
                    {facility.title}
                  </h3>
                  {facility.stats && (
                    <p className="text-xs text-gray-500 mb-2">{facility.stats}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Drafts Modal */}
      <Dialog open={showDraftsModal} onOpenChange={(open) => { if (!open) setShowDraftsModal(false); }}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Draft Donation Forms</DialogTitle>
          </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Select a draft form to resume filling or delete it.
          </p>
          {drafts.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              No draft forms found for this camp.
            </div>
          ) : (
            <div className="divide-y divide-gray-150 max-h-96 overflow-y-auto pr-1">
              {drafts.map((draft) => (
                <div key={draft.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800">
                      {draft.donorName || "Unnamed Donor"}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Last Saved: {new Date(draft.lastSaved).toLocaleString()} • Step {draft.currentStep} of 6
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setShowDraftsModal(false);
                        navigate(`/master-register/donor-creation?campId=${campId}&draftId=${draft.id}`);
                      }}
                      className="px-3.5 py-1.5 bg-orange-800 text-white rounded-lg text-xs font-semibold hover:bg-orange-900 transition-colors shadow-sm"
                    >
                      Resume
                    </button>
                    <button
                      onClick={() => handleDeleteDraft(draft.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                      title="Delete Draft"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CampDetails;
