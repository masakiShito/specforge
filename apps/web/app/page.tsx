"use client";

import { DocumentEditor } from "../components/document-editor";
import { ProtectedRoute } from "../components/auth";

export default function HomePage() {
  return (
    <ProtectedRoute>
      <DocumentEditor />
    </ProtectedRoute>
  );
}
