import { db } from "@/lib/db";
import { mobileUploads, testCases, testRuns, testFields } from "@/db/schema";
import { eq } from "drizzle-orm";
import MobileUploadClient from "./MobileUploadClient";
import Link from "next/link";
import { Camera } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MobileUploadPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  // Retrieve session and join with test cases details for a rich user experience
  const sessionList = await db
    .select({
      id: mobileUploads.id,
      status: mobileUploads.status,
      caseTitle: testCases.title,
      fieldName: testFields.fieldName,
    })
    .from(mobileUploads)
    .leftJoin(testRuns, eq(testRuns.id, mobileUploads.testRunId))
    .leftJoin(testCases, eq(testCases.id, testRuns.testCaseId))
    .leftJoin(testFields, eq(testFields.id, mobileUploads.testFieldId))
    .where(eq(mobileUploads.id, sessionId))
    .limit(1);

  if (sessionList.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="space-y-4 max-w-md border border-white/5 bg-zinc-900/40 p-8 rounded-3xl">
          <h1 className="text-xl font-bold text-rose-400">Invalid Session</h1>
          <p className="text-sm text-gray-400">
            This QR code link is invalid or has expired. Please try generating a new QR code from your desktop browser.
          </p>
        </div>
      </div>
    );
  }

  const session = sessionList[0];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-sans">
      <header className="h-14 bg-black/60 border-b border-white/5 px-6 flex items-center justify-center space-x-2 shadow-sm backdrop-blur-md">
        <img src="/icon.png" alt="JobGiga Logo" className="w-5 h-5 object-contain" />
        <span className="text-base font-bold text-white">
          JobGiga UAT Mobile Upload
        </span>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 max-w-md mx-auto w-full">
        <div className="w-full space-y-6 border border-white/5 bg-zinc-900/40 p-8 rounded-3xl backdrop-blur-md shadow-xl text-center">
          <div className="inline-flex p-3 rounded-full bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20">
            <Camera className="w-8 h-8" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-xl font-bold tracking-tight">{session.caseTitle || "UAT Scenario"}</h1>
            <p className="text-xs text-gray-400">
              Uploading photo for: <span className="font-semibold text-gray-200">{session.fieldName || "Screenshot Attachment"}</span>
            </p>
          </div>

          <hr className="border-white/5" />

          <MobileUploadClient sessionId={session.id} initialStatus={session.status} />
        </div>
      </main>

      <footer className="py-6 text-center text-[10px] text-gray-600 border-t border-white/5">
        &copy; {new Date().getFullYear()} JobGiga UAT Platform. All rights reserved.
      </footer>
    </div>
  );
}
