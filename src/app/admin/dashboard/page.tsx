import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"
import { testCases, testFields, testRuns, users, testAnswers } from "@/db/schema"
import { eq, and, sql } from "drizzle-orm"
import Link from "next/link"
import { ClipboardList, CheckCircle2, AlertTriangle, PlayCircle, Users, ArrowRight } from "lucide-react"
import { ResetAllButton } from "@/components/admin/ResetAllButton"
import { RefreshButton } from "@/components/admin/RefreshButton"

export const dynamic = "force-dynamic"


export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/")
  }

  // 1. Fetch server-side statistics
  let totalCases = 0;
  let totalRuns = 0;
  let submitted = 0;
  let passRate = 0;
  let recentCases: any[] = [];
  let topTesters: any[] = [];
  let inProgressList: any[] = [];

  try {
    // Total Test Cases
    const totalCasesQuery = await db.select({ count: sql<number>`count(*)::int` }).from(testCases);
    totalCases = totalCasesQuery[0]?.count || 0;

    // Total Runs
    const totalRunsQuery = await db.select({ count: sql<number>`count(*)::int` }).from(testRuns);
    totalRuns = totalRunsQuery[0]?.count || 0;

    // Submitted Runs
    const submittedQuery = await db.select({ count: sql<number>`count(*)::int` }).from(testRuns).where(sql`status != 'PENDING'`);
    submitted = submittedQuery[0]?.count || 0;

    // Pass Rate from step answers
    const submittedAnswers = await db
      .select({
        value: testAnswers.value,
      })
      .from(testAnswers)
      .innerJoin(testRuns, eq(testRuns.id, testAnswers.testRunId))
      .where(sql`${testRuns.status} != 'PENDING'`);

    let passedAnswers = 0;
    let totalUatAnswers = 0;

    for (const ans of submittedAnswers) {
      if (ans.value) {
        let choice = "";
        try {
          const parsed = JSON.parse(ans.value);
          if (typeof parsed === "object" && parsed !== null) {
            choice = parsed.choice || "";
          } else {
            choice = String(parsed || "");
          }
        } catch {
          choice = String(ans.value || "");
        }

        const choiceLower = choice.toLowerCase().trim();
        if (choiceLower === "passed" || choiceLower === "pass" || choiceLower === "true") {
          passedAnswers++;
          totalUatAnswers++;
        } else if (
          choiceLower === "failed" ||
          choiceLower === "fail" ||
          choiceLower === "false" ||
          choiceLower === "blocked" ||
          choiceLower === "block" ||
          choiceLower.includes("n/a") ||
          choiceLower.includes("na") ||
          choiceLower.includes("not execute") ||
          choiceLower.includes("could not")
        ) {
          totalUatAnswers++;
        }
      }
    }

    passRate = totalUatAnswers > 0 ? Math.round((passedAnswers / totalUatAnswers) * 100) : 0;

    // Recent test cases (limit 5)
    recentCases = await db
      .select({
        id: testCases.id,
        title: testCases.title,
        createdAt: testCases.createdAt,
        fieldsCount: sql<number>`count(distinct ${testFields.id})::int`,
        runsCount: sql<number>`count(distinct ${testRuns.id})::int`,
      })
      .from(testCases)
      .leftJoin(testFields, eq(testFields.testCaseId, testCases.id))
      .leftJoin(testRuns, eq(testRuns.testCaseId, testCases.id))
      .groupBy(testCases.id, testCases.title, testCases.createdAt)
      .orderBy(sql`${testCases.createdAt} DESC`)
      .limit(5);

    // Top Testers (limit 5) by submitted count
    topTesters = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        submittedCount: sql<number>`count(distinct case when ${testRuns.status} != 'PENDING' then ${testRuns.id} end)::int`,
      })
      .from(users)
      .leftJoin(testRuns, eq(testRuns.testerId, users.id))
      .where(eq(users.role, "TESTER"))
      .groupBy(users.id, users.name, users.email)
      .orderBy(sql`count(distinct case when ${testRuns.status} != 'PENDING' then ${testRuns.id} end) DESC`)
      .limit(5);

    // In-Progress Runs (limit 10)
    inProgressList = await db
      .select({
        id: testRuns.id,
        createdAt: testRuns.createdAt,
        testerName: users.name,
        testerEmail: users.email,
        testCaseId: testCases.id,
        testCaseTitle: testCases.title,
      })
      .from(testRuns)
      .leftJoin(users, eq(users.id, testRuns.testerId))
      .leftJoin(testCases, eq(testCases.id, testRuns.testCaseId))
      .where(eq(testRuns.status, "PENDING"))
      .orderBy(sql`${testRuns.createdAt} DESC`)
      .limit(10);

  } catch (error) {
    console.error("Failed to query dashboard statistics:", error);
  }

  return (
    <main className="p-8 space-y-8 flex-1 flex flex-col justify-between">
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-gray-400 mt-2">Comprehensive health check overview of JobGiga UAT progress.</p>
          </div>
          <div className="flex items-center gap-3">
            <RefreshButton />
            <ResetAllButton />
          </div>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="border border-white/5 bg-zinc-900/40 backdrop-blur-md p-6 rounded-2xl flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Total Test Cases</p>
              <p className="text-3xl font-extrabold">{totalCases}</p>
            </div>
            <div className="p-3 rounded-xl bg-brand-teal/15 text-brand-cyan border border-brand-teal/20">
              <ClipboardList className="w-6 h-6" />
            </div>
          </div>

          <div className="border border-white/5 bg-zinc-900/40 backdrop-blur-md p-6 rounded-2xl flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Total Runs</p>
              <p className="text-3xl font-extrabold">{totalRuns}</p>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <PlayCircle className="w-6 h-6" />
            </div>
          </div>

          <div className="border border-white/5 bg-zinc-900/40 backdrop-blur-md p-6 rounded-2xl flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Submitted</p>
              <p className="text-3xl font-extrabold">{submitted}</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="border border-white/5 bg-zinc-900/40 backdrop-blur-md p-6 rounded-2xl flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Pass Rate</p>
              <p className="text-3xl font-extrabold">{passRate}%</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* 60% / 40% Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
          
          {/* Left: Recent Test Cases Table (60%) */}
          <div className="lg:col-span-6 border border-white/5 bg-zinc-900/40 backdrop-blur-md p-6 rounded-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold">Recent Test Cases</h2>
              <Link
                href="/admin/test-cases"
                className="text-xs font-bold text-brand-cyan hover:underline flex items-center space-x-1"
              >
                <span>View All Cases</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-gray-400 font-semibold bg-white/[0.01]">
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Fields</th>
                    <th className="py-3 px-4">Runs</th>
                    <th className="py-3 px-4">Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCases.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-500">
                        No test cases defined yet.
                      </td>
                    </tr>
                  ) : (
                    recentCases.map((c) => (
                      <tr key={c.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 font-semibold text-white">{c.title}</td>
                        <td className="py-3 px-4 text-gray-400">{c.fieldsCount} fields</td>
                        <td className="py-3 px-4 text-gray-400">{c.runsCount} runs</td>
                        <td className="py-3 px-4 text-gray-500">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: Top Testers List (40%) */}
          <div className="lg:col-span-4 border border-white/5 bg-zinc-900/40 backdrop-blur-md p-6 rounded-2xl space-y-4">
            <div>
              <h2 className="text-base font-bold">Top UAT Testers</h2>
              <p className="text-xs text-gray-400 mt-1">Testers ordered by total submitted runs.</p>
            </div>

            <div className="space-y-3">
              {topTesters.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-8">No testers registered yet.</p>
              ) : (
                topTesters.map((t, index) => (
                  <div key={t.id} className="flex items-center justify-between p-4 border border-white/5 bg-black/20 rounded-xl hover:bg-black/35 transition-colors">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20 text-sm font-extrabold flex items-center justify-center shrink-0">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{t.name || "Tester"}</p>
                        <p className="text-xs text-gray-400 truncate font-mono">{t.email}</p>
                      </div>
                    </div>
                    <div className="text-xs font-bold text-brand-teal whitespace-nowrap bg-brand-teal/10 px-3 py-1.5 rounded-full border border-brand-teal/20">
                      {t.submittedCount} submissions
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* In-Progress Runs Table */}
        <div className="border border-white/5 bg-zinc-900/40 backdrop-blur-md p-6 rounded-2xl space-y-4">
          <div>
            <h2 className="text-base font-bold">In-Progress UAT Runs</h2>
            <p className="text-xs text-gray-400 mt-1">Active execution runs currently being filled out by testers.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-gray-400 font-semibold bg-white/[0.01]">
                  <th className="py-3 px-4">Tester</th>
                  <th className="py-3 px-4">UAT Case Scenario</th>
                  <th className="py-3 px-4">Start Time</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {inProgressList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500 font-medium">
                      No active in-progress runs found.
                    </td>
                  </tr>
                ) : (
                  inProgressList.map((r) => (
                    <tr key={r.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-semibold text-white">{r.testerName || "Tester"}</span>
                        <span className="block text-[9px] text-gray-500 font-mono mt-0.5">{r.testerEmail}</span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-300 max-w-sm truncate">
                        {r.testCaseTitle}
                      </td>
                      <td className="py-3 px-4 text-gray-400 font-mono">
                        {new Date(r.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/admin/test-cases/${r.testCaseId}/results/${r.id}`}
                          className="text-xs font-bold text-brand-cyan hover:underline"
                        >
                          Monitor Live
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <footer className="text-center text-[10px] text-gray-600 pt-8 border-t border-white/5">
        &copy; {new Date().getFullYear()} JobGiga UAT Platform. All rights reserved.
      </footer>
    </main>
  )
}
