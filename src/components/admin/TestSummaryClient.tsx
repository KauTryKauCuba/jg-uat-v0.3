"use client";

import * as React from "react";
import Link from "next/link";
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  BarChart3, 
  AlertCircle, 
  MinusCircle, 
  FileText, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  ArrowRight, 
  Star, 
  Paperclip, 
  Check, 
  Eye, 
  Search, 
  Filter,
  TrendingUp,
  Activity,
  ShieldAlert
} from "lucide-react";

interface TargetGroup {
  id: string;
  name: string;
  displayName: string;
}

interface TestCaseItem {
  id: string;
  categoryId: string | null;
  targetGroup: string | null;
}

interface RunTester {
  id: string;
  name: string;
  email: string;
  testerGroup: string | null;
  organisationName?: string | null;
}

interface TestCase {
  id: string;
  title: string;
}

interface PassFailSummary {
  total: number;
  passed: number;
  failed: number;
  blocked: number;
  na: number;
  unanswered: number;
}

interface EvidenceItem {
  fieldName: string;
  screenshotUrl: string | null;
  pdfUrl: string | null;
}

interface DefectDetailsItem {
  fieldName: string;
  choice: string;
  defectDetails: string;
  screenshotUrl: string | null;
  pdfUrl: string | null;
}

interface RunItem {
  id: string;
  status: string;
  submittedAt: string | null;
  createdAt: string;
  module: string;
  elapsedSeconds: number;
  tester: RunTester;
  testCase: TestCase;
  passFailSummary: PassFailSummary;
  evidences: EvidenceItem[];
  defects: DefectDetailsItem[];
}

interface FeedbackItem {
  id: string;
  ratingOverall: number;
  ratingEaseOfUse: number;
  ratingInstructions: number;
  ratingResultForm: number;
  impressiveAspects: string | null;
  improvementAreas: string | null;
  otherFeedback: string | null;
  createdAt: string;
  testerId: string;
  testerName: string | null;
  testerEmail: string | null;
  testerRole: string | null;
  organisationName: string | null;
}

interface SignOffItem {
  id: string;
  designation: string;
  createdAt: string;
  testerId: string;
  testerName: string | null;
  testerEmail: string | null;
  testerRole: string | null;
  organisationName: string | null;
}

interface TesterInfo {
  id: string;
  name: string | null;
  email: string;
  testerGroup: string | null;
  organisationName: string | null;
}

interface TestSummaryClientProps {
  targetGroups: TargetGroup[];
  testCases: TestCaseItem[];
  initialRuns: RunItem[];
  initialFeedbacks: FeedbackItem[];
  initialSignOffs: SignOffItem[];
  testers: TesterInfo[];
}

export function TestSummaryClient({
  targetGroups,
  testCases,
  initialRuns,
  initialFeedbacks,
  initialSignOffs,
  testers
}: TestSummaryClientProps) {
  // State
  const [activeGroup, setActiveGroup] = React.useState<string>("ALL");
  const [signOffs, setSignOffs] = React.useState<SignOffItem[]>(initialSignOffs);
  const [isSubmittingSignOff, setIsSubmittingSignOff] = React.useState<string | null>(null);

  // Filters state
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [moduleFilter, setModuleFilter] = React.useState<string>("ALL");
  const [testerFilter, setTesterFilter] = React.useState<string>("ALL");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [showAll, setShowAll] = React.useState<boolean>(false);

  // Sorting state
  const [sortField, setSortField] = React.useState<string>("lastUpdated");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");

  // Pagination state
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const itemsPerPage = 15;

  // Evidence Modal State
  const [previewEvidence, setPreviewEvidence] = React.useState<EvidenceItem | null>(null);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeGroup, statusFilter, moduleFilter, testerFilter, searchQuery, showAll]);

  // 1. Filter data based on target UAT group
  const groupFilteredRuns = React.useMemo(() => {
    if (activeGroup === "ALL") return initialRuns;
    return initialRuns.filter(r => r.tester.testerGroup === activeGroup);
  }, [initialRuns, activeGroup]);

  const groupFilteredFeedbacks = React.useMemo(() => {
    if (activeGroup === "ALL") return initialFeedbacks;
    return initialFeedbacks.filter(f => f.testerRole === activeGroup);
  }, [initialFeedbacks, activeGroup]);

  const groupFilteredSignOffs = React.useMemo(() => {
    if (activeGroup === "ALL") return signOffs;
    return signOffs.filter(s => s.testerRole === activeGroup);
  }, [signOffs, activeGroup]);

  const groupFilteredTesters = React.useMemo(() => {
    if (activeGroup === "ALL") return testers;
    return testers.filter(t => t.testerGroup === activeGroup);
  }, [testers, activeGroup]);

  const groupTestCases = React.useMemo(() => {
    if (activeGroup === "ALL") return testCases;
    return testCases.filter(tc => tc.targetGroup === activeGroup);
  }, [testCases, activeGroup]);

  // 2. Calculations for scorecard & banner
  const {
    totalRunsCount,
    passedRunsCount,
    failedRunsCount,
    blockedRunsCount,
    naRunsCount,
    inProgressRunsCount,
    passRate,
    passedPct,
    failedPct,
    blockedPct,
    naPct
  } = React.useMemo(() => {
    const total = groupFilteredRuns.length;
    let passed = 0;
    let failed = 0;
    let blocked = 0;
    let na = 0;
    let pending = 0;

    groupFilteredRuns.forEach(r => {
      const f = r.passFailSummary.failed || 0;
      const b = r.passFailSummary.blocked || 0;
      const n = r.passFailSummary.na || 0;
      const p = r.passFailSummary.passed || 0;

      if (r.status === "PENDING") {
        pending++;
      } else if (f > 0) {
        failed++;
      } else if (b > 0) {
        blocked++;
      } else if (n > 0 && p === 0) {
        na++;
      } else {
        passed++;
      }
    });

    const denom = passed + failed + blocked;
    const rate = denom > 0 ? Math.round((passed / denom) * 100) : 0;

    const totalSubmitted = passed + failed + blocked + na;
    const pPct = totalSubmitted > 0 ? Math.round((passed / totalSubmitted) * 100) : 0;
    const fPct = totalSubmitted > 0 ? Math.round((failed / totalSubmitted) * 100) : 0;
    const bPct = totalSubmitted > 0 ? Math.round((blocked / totalSubmitted) * 100) : 0;
    const nPct = totalSubmitted > 0 ? Math.round((na / totalSubmitted) * 100) : 0;

    return {
      totalRunsCount: total,
      passedRunsCount: passed,
      failedRunsCount: failed,
      blockedRunsCount: blocked,
      naRunsCount: na,
      inProgressRunsCount: pending,
      passRate: rate,
      passedPct: pPct,
      failedPct: fPct,
      blockedPct: bPct,
      naPct: nPct
    };
  }, [groupFilteredRuns]);

  // Sign-off banner calculations
  const totalApprovers = groupFilteredTesters.length;
  const approvedTesters = groupFilteredSignOffs.map(s => s.testerId);
  const approvedCount = groupFilteredTesters.filter(t => approvedTesters.includes(t.id)).length;
  const pendingApproversCount = totalApprovers - approvedCount;

  const isFullySignedOff = pendingApproversCount === 0 && failedRunsCount === 0 && blockedRunsCount === 0 && totalApprovers > 0;

  // Dynamic Coverage Calculations
  const totalGroupTestCasesCount = groupTestCases.length;
  const expectedRunsCount = React.useMemo(() => {
    let expected = 0;
    groupFilteredTesters.forEach(tester => {
      if (tester.testerGroup) {
        const testerGroupCases = testCases.filter(tc => tc.targetGroup === tester.testerGroup);
        expected += testerGroupCases.length;
      }
    });
    return expected;
  }, [groupFilteredTesters, testCases]);

  const completedRunsCount = groupFilteredRuns.filter(r => r.status !== "PENDING").length;
  const coveragePercent = expectedRunsCount > 0 ? Math.min(100, Math.round((completedRunsCount / expectedRunsCount) * 100)) : 0;

  // UAT Velocity Calculations
  const { avgDurationStr, totalDurationStr } = React.useMemo(() => {
    const runsWithTime = groupFilteredRuns.filter(r => r.status !== "PENDING" && r.elapsedSeconds > 0);
    const avgSec = runsWithTime.length > 0 
      ? Math.round(runsWithTime.reduce((acc, r) => acc + r.elapsedSeconds, 0) / runsWithTime.length)
      : 0;
    const totalSec = groupFilteredRuns.reduce((acc, r) => acc + r.elapsedSeconds, 0);

    const format = (seconds: number) => {
      if (seconds === 0) return "0s";
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      if (h > 0) return `${h}h ${m}m`;
      if (m > 0) return `${m}m ${s}s`;
      return `${s}s`;
    };

    return {
      avgDurationStr: format(avgSec),
      totalDurationStr: format(totalSec)
    };
  }, [groupFilteredRuns]);

  // Module breakdown calculations
  const moduleData = React.useMemo(() => {
    const map: Record<string, { passed: number; failed: number; blocked: number; na: number; total: number }> = {};
    
    groupFilteredRuns.forEach(r => {
      const mod = r.module;
      if (!map[mod]) {
        map[mod] = { passed: 0, failed: 0, blocked: 0, na: 0, total: 0 };
      }

      const f = r.passFailSummary.failed || 0;
      const b = r.passFailSummary.blocked || 0;
      const n = r.passFailSummary.na || 0;
      const p = r.passFailSummary.passed || 0;

      map[mod].total++;
      if (r.status === "PENDING") {
        // counted in total
      } else if (f > 0) {
        map[mod].failed++;
      } else if (b > 0) {
        map[mod].blocked++;
      } else if (n > 0 && p === 0) {
        map[mod].na++;
      } else {
        map[mod].passed++;
      }
    });

    return Object.entries(map).map(([name, stats]) => ({
      name,
      ...stats
    })).sort((a, b) => b.total - a.total);
  }, [groupFilteredRuns]);

  // Organisation participation breakdown
  const orgParticipation = React.useMemo(() => {
    const orgMap: Record<string, { total: number; submitted: number }> = {};
    
    // Set up expected total count per organisation based on listed testers
    groupFilteredTesters.forEach(t => {
      const org = t.organisationName || "Unassigned";
      if (!orgMap[org]) {
        orgMap[org] = { total: 0, submitted: 0 };
      }
      orgMap[org].total += totalGroupTestCasesCount;
    });

    // Count submitted runs for each organisation
    groupFilteredRuns.forEach(r => {
      if (r.status !== "PENDING") {
        const org = r.tester.organisationName || "Unassigned";
        if (orgMap[org]) {
          orgMap[org].submitted++;
        } else {
          orgMap[org] = { total: totalGroupTestCasesCount, submitted: 1 };
        }
      }
    });

    return Object.entries(orgMap).map(([name, stats]) => {
      const pct = stats.total > 0 ? Math.round((stats.submitted / stats.total) * 100) : 0;
      return { name, ...stats, pct };
    }).sort((a, b) => b.pct - a.pct);
  }, [groupFilteredTesters, groupFilteredRuns, totalGroupTestCasesCount]);

  // Multi-Dimensional Experience Ratings
  const ratingsBreakdown = React.useMemo(() => {
    if (groupFilteredFeedbacks.length === 0) {
      return { overall: 0, easeOfUse: 0, instructions: 0, resultForm: 0 };
    }
    const overall = groupFilteredFeedbacks.reduce((acc, f) => acc + f.ratingOverall, 0) / groupFilteredFeedbacks.length;
    const easeOfUse = groupFilteredFeedbacks.reduce((acc, f) => acc + f.ratingEaseOfUse, 0) / groupFilteredFeedbacks.length;
    const instructions = groupFilteredFeedbacks.reduce((acc, f) => acc + f.ratingInstructions, 0) / groupFilteredFeedbacks.length;
    const resultForm = groupFilteredFeedbacks.reduce((acc, f) => acc + f.ratingResultForm, 0) / groupFilteredFeedbacks.length;

    return {
      overall: Number(overall.toFixed(1)),
      easeOfUse: Number(easeOfUse.toFixed(1)),
      instructions: Number(instructions.toFixed(1)),
      resultForm: Number(resultForm.toFixed(1))
    };
  }, [groupFilteredFeedbacks]);

  // Rating Overall distribution
  const ratingDistribution = React.useMemo(() => {
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    groupFilteredFeedbacks.forEach(f => {
      const rating = Math.round(f.ratingOverall) as 5|4|3|2|1;
      if (dist[rating] !== undefined) {
        dist[rating]++;
      }
    });
    return dist;
  }, [groupFilteredFeedbacks]);

  // Blocker & Defect Reason list
  const activeDefects = React.useMemo(() => {
    const list: { runId: string; scenarioTitle: string; testerName: string; fieldName: string; choice: string; defectDetails: string; screenshotUrl: string | null }[] = [];
    
    groupFilteredRuns.forEach(r => {
      if (r.defects && r.defects.length > 0) {
        r.defects.forEach(d => {
          list.push({
            runId: r.id,
            scenarioTitle: r.testCase.title,
            testerName: r.tester.name,
            fieldName: d.fieldName,
            choice: d.choice,
            defectDetails: d.defectDetails,
            screenshotUrl: d.screenshotUrl
          });
        });
      }
    });
    return list;
  }, [groupFilteredRuns]);

  // Toggle sign off approval inline handler
  const handleToggleSignOff = async (testerId: string, isApproved: boolean) => {
    setIsSubmittingSignOff(testerId);
    try {
      const response = await fetch("/api/admin/sign-off", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testerId,
          action: isApproved ? "revoke" : "approve",
          designation: "UAT Summary Sign-Off"
        })
      });

      if (response.ok) {
        if (isApproved) {
          setSignOffs(prev => prev.filter(s => s.testerId !== testerId));
        } else {
          const testerObj = testers.find(t => t.id === testerId);
          const newSignOff: SignOffItem = {
            id: Math.random().toString(),
            designation: "UAT Summary Sign-Off",
            createdAt: new Date().toISOString(),
            testerId,
            testerName: testerObj?.name || "Tester",
            testerEmail: testerObj?.email || "",
            testerRole: testerObj?.testerGroup || null,
            organisationName: testerObj?.organisationName || null
          };
          setSignOffs(prev => [newSignOff, ...prev]);
        }
      }
    } catch (err) {
      console.error("Failed to toggle sign off", err);
    } finally {
      setIsSubmittingSignOff(null);
    }
  };

  // Dynamic filters & search on Results table
  const processedFilteredRuns = React.useMemo(() => {
    let result = [...groupFilteredRuns];

    if (!showAll) {
      result = result.filter(r => {
        const f = r.passFailSummary.failed || 0;
        const b = r.passFailSummary.blocked || 0;
        return f > 0 || b > 0;
      });
    }

    if (statusFilter !== "ALL") {
      result = result.filter(r => {
        const f = r.passFailSummary.failed || 0;
        const b = r.passFailSummary.blocked || 0;
        const n = r.passFailSummary.na || 0;
        const p = r.passFailSummary.passed || 0;

        const derived = r.status === "PENDING"
          ? "PENDING"
          : f > 0
          ? "FAILED"
          : b > 0
          ? "BLOCKED"
          : (n > 0 && p === 0)
          ? "NA"
          : "PASSED";

        return derived === statusFilter;
      });
    }

    if (moduleFilter !== "ALL") {
      result = result.filter(r => r.module === moduleFilter);
    }

    if (testerFilter !== "ALL") {
      result = result.filter(r => r.tester.id === testerFilter);
    }

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        r => r.id.toLowerCase().includes(q) || r.testCase.title.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      let valA: any = "";
      let valB: any = "";

      if (sortField === "id") {
        valA = a.id;
        valB = b.id;
      } else if (sortField === "title") {
        valA = a.testCase.title.toLowerCase();
        valB = b.testCase.title.toLowerCase();
      } else if (sortField === "module") {
        valA = a.module.toLowerCase();
        valB = b.module.toLowerCase();
      } else if (sortField === "tester") {
        valA = a.tester.name.toLowerCase();
        valB = b.tester.name.toLowerCase();
      } else if (sortField === "status") {
        valA = a.status;
        valB = b.status;
      } else if (sortField === "lastUpdated") {
        valA = new Date(a.submittedAt || a.createdAt).getTime();
        valB = new Date(b.submittedAt || b.createdAt).getTime();
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [groupFilteredRuns, showAll, statusFilter, moduleFilter, testerFilter, searchQuery, sortField, sortOrder]);

  // Unique filters
  const uniqueModules = React.useMemo(() => {
    return Array.from(new Set(groupFilteredRuns.map(r => r.module))).sort();
  }, [groupFilteredRuns]);

  const uniqueTesters = React.useMemo(() => {
    const seen = new Set();
    return groupFilteredRuns
      .map(r => r.tester)
      .filter(t => {
        if (seen.has(t.id)) return false;
        seen.add(t.id);
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [groupFilteredRuns]);

  // Pagination
  const totalItems = processedFilteredRuns.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedRuns = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedFilteredRuns.slice(start, start + itemsPerPage);
  }, [processedFilteredRuns, currentPage]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const totalSubmittedRuns = passedRunsCount + failedRunsCount + blockedRunsCount + naRunsCount;

  return (
    <main className="p-8 space-y-8 flex-1">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">UAT Test Summary</h1>
          <p className="text-gray-400 mt-2">Executive summary, sign-off status, and quality breakdown of test execution.</p>
        </div>
      </div>

      {/* Target Group Selector */}
      <div className="flex border-b border-white/5 justify-between items-center w-full">
        <div className="flex space-x-4 overflow-x-auto pb-0.5 scrollbar-none">
          {[
            { id: "ALL", name: "ALL", displayName: "All Groups" },
            ...targetGroups.map((tg) => ({ id: tg.id, name: tg.name, displayName: tg.displayName }))
          ].map((grp) => (
            <button
              key={grp.id}
              onClick={() => setActiveGroup(grp.name)}
              className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeGroup === grp.name
                  ? "border-brand-cyan text-brand-cyan"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              {grp.displayName}
            </button>
          ))}
        </div>
      </div>

      {/* 1. Sign-off Banner */}
      <div className="w-full">
        {totalApprovers === 0 ? (
          <div className="p-4 rounded-2xl bg-zinc-800/30 border border-zinc-700/30 text-zinc-400 flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="font-semibold text-sm">No approvers registered for this target group.</span>
          </div>
        ) : isFullySignedOff ? (
          <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-6 h-6 shrink-0" />
              <div>
                <p className="font-bold text-base">Fully Signed Off</p>
                <p className="text-xs text-emerald-400/80 mt-0.5">All approvers have approved and zero open Failed or Blocked cases exist.</p>
              </div>
            </div>
            <span className="px-3.5 py-1 text-xs font-black uppercase tracking-wider bg-emerald-500/20 rounded-full border border-emerald-500/30">
              Approved
            </span>
          </div>
        ) : (
          <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <div>
                <p className="font-bold text-base">UAT Sign-off Pending</p>
                <p className="text-xs text-rose-400/85 mt-0.5">
                  Not ready — {pendingApproversCount} of {totalApprovers} approver{totalApprovers > 1 ? "s" : ""} pending, {failedRunsCount + blockedRunsCount} failed/blocked case{failedRunsCount + blockedRunsCount !== 1 ? "s" : ""} open.
                </p>
              </div>
            </div>
            <span className="px-3.5 py-1 text-xs font-black uppercase tracking-wider bg-rose-500/20 rounded-full border border-rose-500/30 animate-pulse">
              In Review
            </span>
          </div>
        )}
      </div>

      {/* Grid: 2. Scorecard, 3. Progress Coverage, & UAT Velocity */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        {/* Pass Rate Scorecard (3 columns) */}
        <div className="lg:col-span-3 border border-white/5 bg-zinc-900/40 backdrop-blur-md p-6 rounded-2xl flex flex-col justify-between space-y-6 relative group/chart">
          <div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">UAT Pass Rate</p>
                <p className="text-5xl font-black text-brand-cyan mt-1">{passRate}%</p>
                <p className="text-[9px] text-gray-500 mt-2">* Excludes N/A runs from rate</p>
              </div>
              
              {/* Donut Chart */}
              <div className="relative w-20 h-20 cursor-pointer">
                <svg className="w-full h-full transform -rotate-90 overflow-visible" viewBox="0 0 36 36">
                  {totalSubmittedRuns === 0 ? (
                    <circle cx="18" cy="18" r="15.9155" className="text-white/10" stroke="currentColor" strokeWidth="4" fill="none" />
                  ) : (
                    <>
                      {passedRunsCount > 0 && (
                        <circle cx="18" cy="18" r="15.9155" className="text-emerald-500 transition-all hover:stroke-[5]" stroke="currentColor" strokeWidth="4" strokeDasharray={`${passedPct} 100`} strokeDashoffset="0" fill="none" />
                      )}
                      {failedRunsCount > 0 && (
                        <circle cx="18" cy="18" r="15.9155" className="text-rose-500 transition-all hover:stroke-[5]" stroke="currentColor" strokeWidth="4" strokeDasharray={`${failedPct} 100`} strokeDashoffset={-passedPct} fill="none" />
                      )}
                      {blockedRunsCount > 0 && (
                        <circle cx="18" cy="18" r="15.9155" className="text-amber-500 transition-all hover:stroke-[5]" stroke="currentColor" strokeWidth="4" strokeDasharray={`${blockedPct} 100`} strokeDashoffset={-(passedPct + failedPct)} fill="none" />
                      )}
                      {naRunsCount > 0 && (
                        <circle cx="18" cy="18" r="15.9155" className="text-zinc-500 transition-all hover:stroke-[5]" stroke="currentColor" strokeWidth="4" strokeDasharray={`${naPct} 100`} strokeDashoffset={-(passedPct + failedPct + blockedPct)} fill="none" />
                      )}
                    </>
                  )}
                </svg>

                <div className="absolute bottom-full right-0 mb-2 w-48 bg-zinc-950/95 border border-white/10 p-3.5 rounded-xl shadow-2xl transition-all duration-200 opacity-0 scale-95 pointer-events-none group-hover/chart:opacity-100 group-hover/chart:scale-100 z-50 space-y-2 text-xs backdrop-blur-md">
                  <p className="font-bold text-gray-300 border-b border-white/5 pb-1">UAT Runs Distribution</p>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center text-emerald-400 font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
                        Passed
                      </span>
                      <span className="text-gray-300 font-bold">{passedPct}% <span className="text-[10px] text-gray-500 font-normal">({passedRunsCount})</span></span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center text-rose-400 font-medium">
                        <span className="w-2 h-2 rounded-full bg-rose-500 mr-2" />
                        Failed
                      </span>
                      <span className="text-gray-300 font-bold">{failedPct}% <span className="text-[10px] text-gray-500 font-normal">({failedRunsCount})</span></span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center text-amber-400 font-medium">
                        <span className="w-2 h-2 rounded-full bg-amber-500 mr-2" />
                        Blocked
                      </span>
                      <span className="text-gray-300 font-bold">{blockedPct}% <span className="text-[10px] text-gray-500 font-normal">({blockedRunsCount})</span></span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center text-zinc-400 font-medium">
                        <span className="w-2 h-2 rounded-full bg-zinc-500 mr-2" />
                        N/A
                      </span>
                      <span className="text-gray-300 font-bold">{naPct}% <span className="text-[10px] text-gray-500 font-normal">({naRunsCount})</span></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Counts breakdown */}
          <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Total Runs</p>
              <p className="text-xl font-bold mt-1 text-white">{totalRunsCount}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">In Progress</p>
              <p className="text-xl font-bold mt-1 text-amber-400">{inProgressRunsCount}</p>
            </div>
            <div>
              <p className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold">Passed</p>
              <p className="text-xl font-bold mt-1 text-emerald-400">{passedRunsCount}</p>
            </div>
            <div>
              <p className="text-[10px] text-rose-400 uppercase tracking-wider font-semibold">Failed</p>
              <p className="text-xl font-bold mt-1 text-rose-400">{failedRunsCount}</p>
            </div>
            <div>
              <p className="text-[10px] text-amber-400 uppercase tracking-wider font-semibold">Blocked</p>
              <p className="text-xl font-bold mt-1 text-amber-400">{blockedRunsCount}</p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">N/A</p>
              <p className="text-xl font-bold mt-1 text-zinc-400">{naRunsCount}</p>
            </div>
          </div>
        </div>

        {/* 3. Progress Coverage Card (2 columns) */}
        <div className="lg:col-span-2 border border-white/5 bg-zinc-900/40 backdrop-blur-md p-6 rounded-2xl flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Test Coverage</p>
              <Activity className="w-4 h-4 text-brand-cyan" />
            </div>
            <p className="text-4xl font-extrabold text-white mt-1">{coveragePercent}%</p>
            <p className="text-[10px] text-gray-500">Target Group Completeness</p>
          </div>
          <div className="space-y-3 pt-4 border-t border-white/5">
            <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/5">
              <div className="bg-brand-cyan h-full rounded-full transition-all duration-500" style={{ width: `${coveragePercent}%` }} />
            </div>
            <div className="flex justify-between text-[11px] text-gray-400">
              <span>Runs Completed</span>
              <span className="font-bold text-white">{completedRunsCount} / {expectedRunsCount || 0}</span>
            </div>
          </div>
        </div>

        {/* UAT Velocity / Duration Card (2 columns) */}
        <div className="lg:col-span-2 border border-white/5 bg-zinc-900/40 backdrop-blur-md p-6 rounded-2xl flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">UAT Velocity</p>
              <Clock className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-4xl font-extrabold text-white mt-1">{avgDurationStr}</p>
            <p className="text-[10px] text-gray-500">Average Duration per Run</p>
          </div>
          <div className="pt-4 border-t border-white/5 flex justify-between items-center text-xs">
            <span className="text-gray-400">Total Run Time</span>
            <span className="font-bold text-white font-mono">{totalDurationStr}</span>
          </div>
        </div>
      </div>

      {/* Grid: 3. Module breakdown & 5. Organisation Participation */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        {/* Module breakdown (4 columns) */}
        <div className="lg:col-span-4 border border-white/5 bg-zinc-900/40 backdrop-blur-md p-6 rounded-2xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex justify-between items-center pb-3 border-b border-white/5 mb-4">
              <h2 className="text-sm font-bold text-gray-200">Module Breakdown</h2>
              <div className="flex space-x-3 text-[10px] text-gray-400 font-semibold select-none">
                <span className="flex items-center"><span className="w-2 h-2 rounded bg-emerald-500 mr-1.5" />Pass</span>
                <span className="flex items-center"><span className="w-2 h-2 rounded bg-rose-500 mr-1.5" />Fail</span>
                <span className="flex items-center"><span className="w-2 h-2 rounded bg-amber-500 mr-1.5" />Block</span>
                <span className="flex items-center"><span className="w-2 h-2 rounded bg-zinc-500 mr-1.5" />N/A</span>
              </div>
            </div>

            <div className="space-y-4 max-h-[200px] overflow-y-auto pr-1">
              {moduleData.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-8">No module breakdown data available.</p>
              ) : (
                moduleData.map((m) => {
                  const pass = m.total > 0 ? (m.passed / m.total) * 100 : 0;
                  const fail = m.total > 0 ? (m.failed / m.total) * 100 : 0;
                  const block = m.total > 0 ? (m.blocked / m.total) * 100 : 0;
                  const na = m.total > 0 ? (m.na / m.total) * 100 : 0;

                  return (
                    <div key={m.name} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-gray-300">
                        <span>{m.name}</span>
                        <span>{m.total} runs</span>
                      </div>
                      <div className="w-full h-3.5 bg-white/5 rounded-lg overflow-hidden border border-white/5 flex">
                        {m.passed > 0 && (
                          <div className="bg-emerald-500 h-full transition-all" style={{ width: `${pass}%` }} title={`${m.passed} Passed`} />
                        )}
                        {m.failed > 0 && (
                          <div className="bg-rose-500 h-full transition-all" style={{ width: `${fail}%` }} title={`${m.failed} Failed`} />
                        )}
                        {m.blocked > 0 && (
                          <div className="bg-amber-500 h-full transition-all" style={{ width: `${block}%` }} title={`${m.blocked} Blocked`} />
                        )}
                        {m.na > 0 && (
                          <div className="bg-zinc-500 h-full transition-all" style={{ width: `${na}%` }} title={`${m.na} N/A`} />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* 5. Organisation Participation breakdown (3 columns) */}
        <div className="lg:col-span-3 border border-white/5 bg-zinc-900/40 backdrop-blur-md p-6 rounded-2xl flex flex-col justify-between space-y-4">
          <div>
            <div className="pb-3 border-b border-white/5 mb-4">
              <h2 className="text-sm font-bold text-gray-200">Organisation Progress</h2>
              <p className="text-[10px] text-gray-500 mt-1">UAT testing coverage by organisation.</p>
            </div>
            <div className="space-y-4 max-h-[200px] overflow-y-auto pr-1">
              {orgParticipation.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-8">No organisation data registered.</p>
              ) : (
                orgParticipation.map((org) => (
                  <div key={org.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-gray-300">
                      <span>{org.name}</span>
                      <span>{org.pct}% <span className="text-[10px] text-gray-500 font-normal">({org.submitted}/{org.total})</span></span>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
                      <div className="bg-brand-cyan h-full rounded-full transition-all" style={{ width: `${org.pct}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Feedback experience breakdown & required approvers */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        {/* Required Sign off Panel (3 columns) */}
        <div className="lg:col-span-3 border border-white/5 bg-zinc-900/40 backdrop-blur-md p-6 rounded-2xl space-y-4">
          <div className="border-b border-white/5 pb-3">
            <h2 className="text-sm font-bold text-gray-200">UAT Approvers (Required Sign-off)</h2>
            <p className="text-[10px] text-gray-500 mt-1">Users in UAT group required to approve release.</p>
          </div>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {groupFilteredTesters.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-8">No required approvers defined.</p>
            ) : (
              groupFilteredTesters.map((tester) => {
                const approval = groupFilteredSignOffs.find(s => s.testerId === tester.id);
                const isApproved = !!approval;

                return (
                  <div key={tester.id} className="border border-white/5 bg-zinc-950/40 p-3.5 rounded-xl flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-white">{tester.name || "Approver"}</p>
                      <p className="text-[10px] text-gray-500 font-mono truncate max-w-[150px]" title={tester.email}>{tester.email}</p>
                      {isApproved && (
                        <p className="text-[9px] text-emerald-400/80 font-mono">
                          Signed off: {formatDateTime(approval.createdAt)}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        isApproved
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}>
                        {isApproved ? "Approved" : "Pending"}
                      </span>

                      <button
                        onClick={() => handleToggleSignOff(tester.id, isApproved)}
                        disabled={isSubmittingSignOff === tester.id}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                          isApproved
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                        }`}
                        title={isApproved ? "Revoke Sign Off" : "Approve UAT"}
                      >
                        {isSubmittingSignOff === tester.id ? (
                          <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : isApproved ? (
                          <X className="w-3.5 h-3.5" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 1. Multi-Dimensional UAT Feedback summary (4 columns) */}
        <div className="lg:col-span-4 border border-white/5 bg-zinc-900/40 backdrop-blur-md p-6 rounded-2xl space-y-6">
          <div className="border-b border-white/5 pb-3">
            <h2 className="text-sm font-bold text-gray-200">UAT Experience Feedback</h2>
            <p className="text-[10px] text-gray-500 mt-1">Multi-dimensional rating averages from UAT surveys.</p>
          </div>

          {/* Core metrics comparison */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="border border-white/5 bg-zinc-950/40 p-3 rounded-xl space-y-1">
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Overall</span>
              <p className="text-lg font-black text-white">{ratingsBreakdown.overall}</p>
              <div className="flex text-amber-400"><Star className="w-2.5 h-2.5 fill-current" /></div>
            </div>
            <div className="border border-white/5 bg-zinc-950/40 p-3 rounded-xl space-y-1">
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Ease of Use</span>
              <p className="text-lg font-black text-white">{ratingsBreakdown.easeOfUse}</p>
              <div className="flex text-amber-400"><Star className="w-2.5 h-2.5 fill-current" /></div>
            </div>
            <div className="border border-white/5 bg-zinc-950/40 p-3 rounded-xl space-y-1">
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Instructions</span>
              <p className="text-lg font-black text-white">{ratingsBreakdown.instructions}</p>
              <div className="flex text-amber-400"><Star className="w-2.5 h-2.5 fill-current" /></div>
            </div>
            <div className="border border-white/5 bg-zinc-950/40 p-3 rounded-xl space-y-1">
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Result Form</span>
              <p className="text-lg font-black text-white">{ratingsBreakdown.resultForm}</p>
              <div className="flex text-amber-400"><Star className="w-2.5 h-2.5 fill-current" /></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Rating distribution chart */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-300">Overall Distribution</p>
              <div className="space-y-1.5">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = ratingDistribution[stars as 5|4|3|2|1] || 0;
                  const totalFb = groupFilteredFeedbacks.length;
                  const pct = totalFb > 0 ? (count / totalFb) * 100 : 0;

                  return (
                    <div key={stars} className="flex items-center text-xs space-x-2">
                      <span className="w-3 font-mono text-gray-400 text-right">{stars}</span>
                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400 shrink-0" />
                      <div className="flex-1 bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
                        <div className="bg-amber-400 h-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-6 font-mono text-[10px] text-gray-500 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Individual comments */}
            <div className="space-y-2 flex flex-col justify-between">
              <p className="text-xs font-bold text-gray-300">Tester Comments</p>
              <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                {groupFilteredFeedbacks.filter(f => f.otherFeedback || f.impressiveAspects || f.improvementAreas).length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-6">No comments recorded.</p>
                ) : (
                  groupFilteredFeedbacks.map((f) => (
                    <div key={f.id} className="border border-white/5 bg-zinc-950/40 p-2.5 rounded-lg space-y-1 text-[11px]">
                      <div className="flex justify-between text-gray-400 font-semibold">
                        <span>{f.testerName || "Tester"}</span>
                        <span className="text-[9px] font-mono">{formatDateTime(f.createdAt)}</span>
                      </div>
                      <p className="text-gray-300 leading-normal italic">
                        "{f.otherFeedback || f.impressiveAspects || f.improvementAreas}"
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Blocker & Defect Reason Quick-List (Full Width) */}
      <div className="border border-white/5 bg-zinc-900/40 backdrop-blur-md p-6 rounded-2xl space-y-4">
        <div className="border-b border-white/5 pb-3">
          <h2 className="text-sm font-bold text-gray-200 flex items-center">
            <ShieldAlert className="w-4 h-4 text-rose-500 mr-2" /> Top Open UAT Defects & Blockers
          </h2>
          <p className="text-[10px] text-gray-500 mt-1">Specific steps marked failed or blocked by testers with comments.</p>
        </div>
        <div className="max-h-[250px] overflow-y-auto space-y-3">
          {activeDefects.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-8">No open defects or blocker reasons logged in this group.</p>
          ) : (
            activeDefects.map((def, idx) => (
              <div key={idx} className="border border-white/5 bg-zinc-950/40 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center space-x-2.5">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                      def.choice === "FAILED"
                        ? "bg-rose-500/15 text-rose-400 border border-rose-500/25"
                        : "bg-amber-500/15 text-amber-400 border border-amber-500/25"
                    }`}>
                      {def.choice}
                    </span>
                    <strong className="text-xs text-white">{def.scenarioTitle}</strong>
                    <span className="text-[10px] text-gray-500 font-semibold">({def.fieldName})</span>
                  </div>
                  <p className="text-xs text-gray-300 italic">
                    "{def.defectDetails}"
                  </p>
                  <p className="text-[9px] text-gray-500 font-mono">Logged by: {def.testerName}</p>
                </div>
                {def.screenshotUrl && (
                  <button
                    onClick={() => setPreviewEvidence({ fieldName: def.fieldName, screenshotUrl: def.screenshotUrl, pdfUrl: null })}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-brand-cyan/15 text-brand-cyan border border-brand-teal/20 text-[11px] font-bold hover:bg-brand-cyan/25 transition-all cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Evidence</span>
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 6. Filters and Search Bar */}
      <div className="border border-white/5 bg-zinc-900/40 p-5 rounded-2xl space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="relative w-full md:w-96">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by TestCase Title or Run ID..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-brand-cyan/50 placeholder-gray-500"
            />
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-3.5" />
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto">
            <label className="flex items-center space-x-2 text-xs font-semibold text-gray-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showAll}
                onChange={(e) => setShowAll(e.target.checked)}
                className="rounded border-white/10 bg-black/40 text-brand-cyan focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
              />
              <span>Show All Runs</span>
            </label>
            <span className="text-gray-600 text-xs">|</span>
            <span className="text-xs font-bold text-gray-400 flex items-center shrink-0">
              <Filter className="w-3.5 h-3.5 mr-1 text-gray-500" /> Filters
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Status Dropdown */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-gray-300 focus:outline-none focus:border-brand-cyan/50 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">In Progress</option>
              <option value="PASSED">Passed</option>
              <option value="FAILED">Failed</option>
              <option value="BLOCKED">Blocked</option>
              <option value="NA">N/A</option>
            </select>
          </div>

          {/* Module Dropdown */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Module / Category</label>
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-gray-300 focus:outline-none focus:border-brand-cyan/50 cursor-pointer"
            >
              <option value="ALL">All Modules</option>
              {uniqueModules.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Tester Dropdown */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Tester</label>
            <select
              value={testerFilter}
              onChange={(e) => setTesterFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-gray-300 focus:outline-none focus:border-brand-cyan/50 cursor-pointer"
            >
              <option value="ALL">All Testers</option>
              {uniqueTesters.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 7. Results Table */}
      <div className="border border-white/5 bg-zinc-900/40 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-gray-400 font-semibold bg-white/[0.01] select-none">
                <th className="py-3 px-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort("id")}>
                  <span>Run ID</span>
                </th>
                <th className="py-3 px-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort("title")}>
                  <span>Scenario Title</span>
                </th>
                <th className="py-3 px-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort("module")}>
                  <span>Module</span>
                </th>
                <th className="py-3 px-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort("tester")}>
                  <span>Tester</span>
                </th>
                <th className="py-3 px-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort("status")}>
                  <span>Status</span>
                </th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Evidence</th>
                <th className="py-3 px-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort("lastUpdated")}>
                  <span>Last Updated</span>
                </th>
                <th className="py-3 px-4 text-right">Run Result</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRuns.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-500 font-medium">
                    No runs found matching the selected search criteria.
                  </td>
                </tr>
              ) : (
                paginatedRuns.map((r) => {
                  const f = r.passFailSummary.failed || 0;
                  const b = r.passFailSummary.blocked || 0;
                  const n = r.passFailSummary.na || 0;
                  const p = r.passFailSummary.passed || 0;

                  const derivedStatus = r.status === "PENDING"
                    ? "PENDING"
                    : f > 0
                    ? "FAILED"
                    : b > 0
                    ? "BLOCKED"
                    : (n > 0 && p === 0)
                    ? "NA"
                    : "PASSED";

                  return (
                    <tr key={r.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-mono text-[10px] text-gray-400">
                        {r.id.substring(0, 8)}...
                      </td>
                      <td className="py-3 px-4 font-semibold text-white max-w-xs truncate">
                        {r.testCase.title}
                      </td>
                      <td className="py-3 px-4 text-gray-300 font-medium">
                        {r.module}
                      </td>
                      <td className="py-3 px-4 text-gray-300 font-medium">
                        {r.tester.name}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          derivedStatus === "PASSED"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : derivedStatus === "FAILED"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : derivedStatus === "BLOCKED"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        }`}>
                          {derivedStatus === "PENDING" ? "In Progress" : derivedStatus === "NA" ? "N/A" : derivedStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500 italic">
                        Not Tracked
                      </td>
                      <td className="py-3 px-4">
                        {r.evidences.length > 0 ? (
                          <div className="flex items-center space-x-1.5">
                            {r.evidences.map((ev, i) => (
                              <button
                                key={i}
                                onClick={() => setPreviewEvidence(ev)}
                                className="inline-flex items-center p-1 rounded bg-white/5 border border-white/10 text-brand-cyan hover:bg-brand-cyan/15 transition-all cursor-pointer"
                                title={`Preview: ${ev.fieldName}`}
                              >
                                <Paperclip className="w-3.5 h-3.5" />
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-400 font-mono">
                        {formatDateTime(r.submittedAt || r.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/admin/test-cases/${r.testCase.id}/results/${r.id}`}
                          className="inline-flex items-center space-x-1 text-xs font-bold text-brand-cyan hover:text-brand-cyan/95 hover:underline"
                        >
                          <span>Review</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-white/5 flex items-center justify-between text-xs text-gray-400 bg-white/[0.01]">
            <span>
              Showing Page <strong className="text-gray-200">{currentPage}</strong> of <strong className="text-gray-200">{totalPages}</strong>
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-gray-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-gray-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Evidence Preview Modal */}
      {previewEvidence && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/10 w-full max-w-3xl rounded-2xl overflow-hidden flex flex-col shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-zinc-950/40">
              <div className="flex items-center space-x-2">
                <Paperclip className="w-4 h-4 text-brand-cyan" />
                <span className="text-sm font-bold text-white">{previewEvidence.fieldName}</span>
              </div>
              <button
                onClick={() => setPreviewEvidence(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 flex-1 flex items-center justify-center min-h-[300px] max-h-[600px] overflow-auto bg-black/20">
              {previewEvidence.screenshotUrl ? (
                <img
                  src={previewEvidence.screenshotUrl}
                  alt={previewEvidence.fieldName}
                  className="max-w-full max-h-[500px] object-contain rounded-lg shadow-md border border-white/5"
                />
              ) : previewEvidence.pdfUrl ? (
                <iframe
                  src={previewEvidence.pdfUrl}
                  className="w-full h-[500px] rounded-lg border border-white/5"
                  title="PDF Preview"
                />
              ) : (
                <span className="text-gray-500 text-xs">No media preview available.</span>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
