import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Upload,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Check,
  X,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { fetchRecords, patchAttendanceRecord, importDatasets, BASE_URL } from '../services/api';
import { FilterState, AttendanceStatus, ReconciledRecord } from '../types';
import { GlassCard } from '../components/common/GlassCard';
import { getStatusBadgeClasses } from '../lib/utils';

interface DataExplorerPageProps {
  filters: FilterState;
}

export const DataExplorerPage: React.FC<DataExplorerPageProps> = ({ filters }) => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [missingFilter, setMissingFilter] = useState<boolean | undefined>(undefined);

  // Edit record state
  const [editingRecord, setEditingRecord] = useState<ReconciledRecord | null>(null);
  const [editStatus, setEditStatus] = useState<AttendanceStatus>('PRESENT');
  const [editNote, setEditNote] = useState('');

  // Upload state
  const [expectedFile, setExpectedFile] = useState<File | null>(null);
  const [attendanceFile, setAttendanceFile] = useState<File | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['records', page, pageSize, filters, search, statusFilter, missingFilter],
    queryFn: () =>
      fetchRecords(page, pageSize, filters, search, statusFilter, missingFilter),
  });

  const patchMutation = useMutation({
    mutationFn: ({ recordId, status, note }: { recordId: number; status: AttendanceStatus; note: string }) =>
      patchAttendanceRecord(recordId, status, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['records'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      queryClient.invalidateQueries({ queryKey: ['trends'] });
      queryClient.invalidateQueries({ queryKey: ['flags'] });
      setEditingRecord(null);
    },
  });

  const importMutation = useMutation({
    mutationFn: () => {
      if (!expectedFile || !attendanceFile) throw new Error('Both files are required.');
      return importDatasets(expectedFile, attendanceFile);
    },
    onSuccess: (res) => {
      setUploadSuccess('Datasets successfully validated, imported, and metrics recomputed.');
      setUploadError(null);
      setExpectedFile(null);
      setAttendanceFile(null);
      queryClient.invalidateQueries();
      setTimeout(() => {
        setIsImportModalOpen(false);
        setUploadSuccess(null);
      }, 1500);
    },
    onError: (err: any) => {
      setUploadError(err.message || 'Import failed.');
      setUploadSuccess(null);
    },
  });

  const records = data?.records || [];
  const totalPages = data?.total_pages || 1;

  const handleStartEdit = (rec: ReconciledRecord) => {
    if (!rec.id) return;
    setEditingRecord(rec);
    setEditStatus(rec.status === 'MISSING' ? 'PRESENT' : rec.status);
    setEditNote('');
  };

  const handleSaveEdit = () => {
    if (!editingRecord || !editingRecord.id) return;
    patchMutation.mutate({
      recordId: editingRecord.id,
      status: editStatus,
      note: editNote || 'Manual status amendment from Data Explorer',
    });
  };

  return (
    <div className="p-8 space-y-8">
      {/* 1. Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Data Explorer & Record Ingestion</h2>
          <p className="text-xs text-slate-500">
            Inspect pseudonymous session records, make audited amendments, or import fresh timetable data.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={`${BASE_URL}/datasets/templates/expected`}
            download
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-teal-600" />
            <span>Expected Template</span>
          </a>

          <a
            href={`${BASE_URL}/datasets/templates/attendance`}
            download
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-cyan-600" />
            <span>Attendance Template</span>
          </a>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 transition-all shadow-sm shadow-teal-600/20"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import CSV Datasets</span>
          </button>
        </div>
      </div>

      {/* 2. Search & Table Filter Bar */}
      <GlassCard className="p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Student Key (e.g. STU-0012) or Session ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 shadow-xs"
            />
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-600 font-semibold">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/50 cursor-pointer shadow-xs"
            >
              <option value="ALL">All Statuses</option>
              <option value="PRESENT">PRESENT</option>
              <option value="LATE">LATE</option>
              <option value="ABSENT">ABSENT</option>
              <option value="EXCUSED">EXCUSED</option>
              <option value="MISSING">MISSING</option>
            </select>
          </div>

          {/* Missing toggle */}
          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => {
                setMissingFilter(missingFilter === true ? undefined : true);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg border font-semibold transition-all ${
                missingFilter === true
                  ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-xs'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              Missing Entries Only
            </button>
          </div>
        </div>
      </GlassCard>

      {/* 3. Paginated Reconciled Table */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <th className="py-3 px-4">Student Key</th>
                <th className="py-3 px-4">Session ID</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Course & Sec</th>
                <th className="py-3 px-4">Time Slot</th>
                <th className="py-3 px-4">Held?</th>
                <th className="py-3 px-4">Recorded Status</th>
                <th className="py-3 px-4">Reconciliation State</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Loading records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No matching records found.
                  </td>
                </tr>
              ) : (
                records.map((rec) => (
                  <tr key={`${rec.student_key}-${rec.session_id}`} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{rec.student_key}</td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{rec.session_id}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{rec.session_date}</td>
                    <td className="py-3 px-4 text-slate-700 font-mono font-medium">
                      {rec.course_code} ({rec.section})
                    </td>
                    <td className="py-3 px-4 text-slate-600">{rec.timetable_slot}</td>
                    <td className="py-3 px-4">
                      {rec.session_held ? (
                        <span className="text-emerald-700 font-bold">Held</span>
                      ) : (
                        <span className="text-slate-400 line-through">Cancelled</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold border shadow-xs ${getStatusBadgeClasses(rec.status)}`}>
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px] font-mono">
                      {rec.reconciliation_status}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {rec.id ? (
                        <button
                          onClick={() => handleStartEdit(rec)}
                          className="px-2.5 py-1 rounded-lg bg-white text-teal-800 hover:bg-teal-50 border border-teal-200 text-[11px] font-bold transition-colors inline-flex items-center gap-1 shadow-xs"
                        >
                          <Edit2 className="w-3 h-3 text-teal-700" />
                          <span>Amend</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">Unrecorded</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs text-slate-600">
          <div>
            Showing page <span className="font-mono text-slate-900 font-bold">{page}</span> of{' '}
            <span className="font-mono text-slate-900 font-bold">{totalPages}</span> ({data?.total?.toLocaleString()} total records)
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors shadow-xs"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors shadow-xs"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Edit Record Modal */}
      {editingRecord && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Amend Recorded Attendance</h3>
              <button
                onClick={() => setEditingRecord(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 text-slate-600 font-mono bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>Student: <span className="text-slate-900 font-bold">{editingRecord.student_key}</span></div>
                <div>Course: <span className="text-slate-900 font-bold">{editingRecord.course_code}</span></div>
                <div>Session: <span className="text-slate-900 font-bold">{editingRecord.session_id}</span></div>
                <div>Date: <span className="text-slate-900 font-bold">{editingRecord.session_date}</span></div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Amended Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/50 shadow-xs"
                >
                  <option value="PRESENT">PRESENT</option>
                  <option value="LATE">LATE</option>
                  <option value="ABSENT">ABSENT</option>
                  <option value="EXCUSED">EXCUSED</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Audit Justification / Note</label>
                <textarea
                  placeholder="Reason for amendment (e.g. verified student check-in log, excused illness notice)..."
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/50 h-20 shadow-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                onClick={() => setEditingRecord(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={patchMutation.isPending}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{patchMutation.isPending ? 'Amending...' : 'Confirm Amendment'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Import Academic Attendance CSVs</h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 leading-relaxed">
                <strong>Explicit Data Notice:</strong> Importing fresh datasets replaces the active in-memory and database tables. Ensure files conform to the expected template headers.
              </div>

              {/* Expected Sessions File Input */}
              <div className="space-y-1.5">
                <label className="block text-slate-700 font-semibold">
                  1. Expected Sessions Schedule CSV (expected_sessions.csv)
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setExpectedFile(e.target.files?.[0] || null)}
                  className="w-full text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-teal-800 hover:file:bg-slate-200 cursor-pointer"
                />
              </div>

              {/* Attendance Records File Input */}
              <div className="space-y-1.5">
                <label className="block text-slate-700 font-semibold">
                  2. Attendance Records Log CSV (attendance_records.csv)
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setAttendanceFile(e.target.files?.[0] || null)}
                  className="w-full text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-cyan-800 hover:file:bg-slate-200 cursor-pointer"
                />
              </div>

              {uploadError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{uploadError}</span>
                </div>
              )}

              {uploadSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 flex items-start gap-2">
                  <Check className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                  <span>{uploadSuccess}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={() => importMutation.mutate()}
                disabled={!expectedFile || !attendanceFile || importMutation.isPending}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 flex items-center gap-1.5 disabled:opacity-40 shadow-xs"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{importMutation.isPending ? 'Validating & Importing...' : 'Validate & Import'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
