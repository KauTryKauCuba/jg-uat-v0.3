import * as React from "react"
import { TestCaseForm } from "@/components/admin/test-case-form"

export default function NewTestCasePage() {
  return (
    <main className="p-8 space-y-6 flex-1">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Test Case</h1>
        <p className="text-gray-400 mt-2">Publish a new UAT test case with dynamic verification fields.</p>
      </div>
      <React.Suspense fallback={<div className="text-xs text-gray-500 py-4">Loading form details...</div>}>
        <TestCaseForm />
      </React.Suspense>
    </main>
  )
}
