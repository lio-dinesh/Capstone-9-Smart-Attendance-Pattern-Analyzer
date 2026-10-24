import React from 'react';
import { ShieldCheck, BookOpen, AlertCircle, FileText, CheckCircle, Scale } from 'lucide-react';
import { GlassCard } from '../components/common/GlassCard';

export const MethodologyPage: React.FC = () => {
  return (
    <div className="p-8 space-y-8 max-w-6xl">
      {/* 1. Header */}
      <div>
        <h2 className="text-base font-bold text-slate-900">Mathematical Methodology & Responsible Use Statement</h2>
        <p className="text-xs text-slate-500">
          Formal definitions of calculation formulas, data reconciliation policies, active anomaly thresholds, and ethical safeguards.
        </p>
      </div>

      {/* 2. Mathematical Attendance Formulas */}
      <GlassCard className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Scale className="w-4 h-4 text-teal-600" />
          <h3 className="text-sm font-bold text-slate-900">Attendance Calculation Policy & Formulas</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 shadow-xs">
            <div className="font-bold text-teal-800">1. Standard Attendance Rate</div>
            <div className="p-3 bg-white rounded-lg font-mono text-[11px] text-teal-900 border border-teal-200 shadow-xs font-semibold">
              Rate = (PRESENT + w_late * LATE) / (PRESENT + LATE + ABSENT) * 100
            </div>
            <p className="text-slate-600 leading-relaxed font-normal">
              Default configuration uses late weight <code>w_late = 1.0</code>, counting a late arrival as an attended session under institutional standards. Configurable to <code>0.5</code> or <code>0.0</code>.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 shadow-xs">
            <div className="font-bold text-cyan-800">2. Record Completeness Metric</div>
            <div className="p-3 bg-white rounded-lg font-mono text-[11px] text-cyan-900 border border-cyan-200 shadow-xs font-semibold">
              Completeness = (Recorded Valid Logs) / (Expected Sessions Held) * 100
            </div>
            <p className="text-slate-600 leading-relaxed font-normal">
              Measures the proportion of scheduled timetable sessions that received legitimate attendance entries. Rates with completeness below 85% are classified as <em>Provisional</em>.
            </p>
          </div>
        </div>

        {/* Status Treatment Rules */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2 shadow-xs">
          <div className="font-bold text-slate-900">Status Denominator Treatment Protocol:</div>
          <ul className="space-y-1.5 text-slate-700 list-disc list-inside font-normal">
            <li>
              <strong>PRESENT:</strong> Added to both numerator and denominator.
            </li>
            <li>
              <strong>LATE:</strong> Added to denominator; multiplied by <code>w_late</code> in numerator.
            </li>
            <li>
              <strong>ABSENT:</strong> Added to denominator; contributes 0 to numerator.
            </li>
            <li>
              <strong>EXCUSED:</strong> Fully excluded from both numerator and denominator. Does not penalize students for documented medical or compassionate leaves.
            </li>
            <li>
              <strong>MISSING:</strong> Excluded from attendance rate denominator. Tracked exclusively in Data Quality audits to protect students from data capture omissions.
            </li>
            <li>
              <strong>Zero Denominator:</strong> If total eligible entries equals 0, the system outputs <code>N/A</code> rather than 0.0%, preventing misleading zero-rates.
            </li>
          </ul>
        </div>
      </GlassCard>

      {/* 3. Explainable Anomaly Detection Rules & Thresholds */}
      <GlassCard className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <h3 className="text-sm font-bold text-slate-900">Active Anomaly Detection Rules & Demonstration Thresholds</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 bg-slate-50">
                <th className="py-2.5 px-3 font-bold">Rule Identifier</th>
                <th className="py-2.5 px-3 font-bold">Category</th>
                <th className="py-2.5 px-3 font-bold">Trigger Threshold</th>
                <th className="py-2.5 px-3 font-bold">Eligibility Conditions</th>
                <th className="py-2.5 px-3 font-bold">Action Intent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50">
                <td className="py-3 px-3 font-mono font-bold text-teal-800">RULE-ABS-STREAK</td>
                <td className="py-3 px-3 text-purple-800 font-mono font-bold">Attendance Pattern</td>
                <td className="py-3 px-3 font-mono font-bold text-slate-900">≥ 3 consecutive ABSENT</td>
                <td className="py-3 px-3 text-slate-600">Consecutive scheduled sessions held</td>
                <td className="py-3 px-3 text-slate-700">Supportive well-being inquiry</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-3 px-3 font-mono font-bold text-teal-800">RULE-ATT-DROP</td>
                <td className="py-3 px-3 text-purple-800 font-mono font-bold">Attendance Pattern</td>
                <td className="py-3 px-3 font-mono font-bold text-slate-900">≥ 15.0% drop vs baseline</td>
                <td className="py-3 px-3 text-slate-600">N ≥ 4 baseline sessions, completeness ≥ 80%</td>
                <td className="py-3 px-3 text-slate-700">Academic advisor workload review</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-3 px-3 font-mono font-bold text-cyan-800">RULE-MISSING-BURST</td>
                <td className="py-3 px-3 text-cyan-800 font-mono font-bold">Data Quality</td>
                <td className="py-3 px-3 font-mono font-bold text-slate-900">≥ 10.0% unrecorded</td>
                <td className="py-3 px-3 text-slate-600">Held section or scheduled session</td>
                <td className="py-3 px-3 text-slate-700">Faculty attendance sheet request</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-3 px-3 font-mono font-bold text-cyan-800">RULE-DATA-INTEGRITY</td>
                <td className="py-3 px-3 text-cyan-800 font-mono font-bold">Data Quality</td>
                <td className="py-3 px-3 font-mono font-bold text-slate-900">Duplicate key / Invalid enum</td>
                <td className="py-3 px-3 text-slate-600">Any ingestion batch occurrence</td>
                <td className="py-3 px-3 text-slate-700">Data engineering source pipeline fix</td>
              </tr>
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* 4. Data Dictionary */}
      <GlassCard className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <BookOpen className="w-4 h-4 text-purple-600" />
          <h3 className="text-sm font-bold text-slate-900">Data Dictionary & Schema Specification</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900">expected_sessions.csv</h4>
            <div className="space-y-1 font-mono text-[11px] bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-700">
              <div><code>student_key</code>: String (e.g. STU-0012)</div>
              <div><code>session_id</code>: String (e.g. SES-CS101-SEC-A-W01-1)</div>
              <div><code>session_date</code>: ISO Date (YYYY-MM-DD)</div>
              <div><code>course_code</code>: String (e.g. CS101)</div>
              <div><code>section</code>: String (e.g. SEC-A)</div>
              <div><code>timetable_slot</code>: String (e.g. 08:30-10:00)</div>
              <div><code>session_held</code>: Integer (1=held, 0=cancelled)</div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-slate-900">attendance_records.csv</h4>
            <div className="space-y-1 font-mono text-[11px] bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-700">
              <div><code>student_key</code>: String (matches expected)</div>
              <div><code>session_id</code>: String (matches expected)</div>
              <div><code>status</code>: Enum [PRESENT, ABSENT, LATE, EXCUSED]</div>
              <div><code>recorded_at</code>: ISO Datetime string (optional)</div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* 5. Responsible Use & Privacy Principles */}
      <GlassCard className="space-y-4 border-l-4 border-l-teal-500">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <h3 className="text-sm font-bold text-slate-900">Responsible Use Principles & Privacy Safeguards</h3>
        </div>

        <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1 shadow-xs">
            <div className="font-bold text-slate-900">1. Non-Punitive Educational Paradigm</div>
            <p className="text-slate-600 font-normal">
              Attendance patterns are indicators for supportive outreach, never weapons for automated punishment, disciplinary marks, or immediate grade deductions. Faculty and mentors must engage students with empathy to discover underlying causes such as transit disruptions, health crises, or family care obligations.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1 shadow-xs">
            <div className="font-bold text-slate-900">2. Strict Pseudonymisation & No Direct PII</div>
            <p className="text-slate-600 font-normal">
              The analytical engine operates strictly on synthetic or pseudonymised identifiers (<code>STU-XXXX</code>). No student names, home addresses, phone numbers, or demographic attributes are stored in the persistence layer or transmitted to public views.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1 shadow-xs">
            <div className="font-bold text-slate-900">3. Institutional Timetable Reflection</div>
            <p className="text-slate-600 font-normal">
              Before reaching out to individual students, institutions must examine cohort-wide trends. When attendance dips universally on early Monday slots (08:30) or across specific Friday blocks, the issue reflects timetable friction or campus transit limitations rather than individual student apathy.
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
