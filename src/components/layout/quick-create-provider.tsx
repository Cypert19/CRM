"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { DealForm } from "@/components/deals/deal-form";
import { ContactForm } from "@/components/contacts/contact-form";
import { CompanyForm } from "@/components/companies/company-form";
import { TaskForm } from "@/components/tasks/task-form";
import { NoteForm } from "@/components/notes/note-form";
import { getPipelines } from "@/actions/pipelines";
import type { Tables } from "@/types/database";

type QuickCreateContextType = {
  openDeal: () => void;
  openContact: () => void;
  openCompany: () => void;
  openTask: () => void;
  openNote: () => void;
};

const QuickCreateContext = createContext<QuickCreateContextType | null>(null);

export function useQuickCreate() {
  const ctx = useContext(QuickCreateContext);
  if (!ctx) throw new Error("useQuickCreate must be used within QuickCreateProvider");
  return ctx;
}

export function QuickCreateProvider({ children }: { children: React.ReactNode }) {
  const [dealOpen, setDealOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);

  // Pipeline data for DealForm (lazy-loaded on first open)
  const [pipelineData, setPipelineData] = useState<{
    pipelineId: string;
    stages: Tables<"pipeline_stages">[];
  } | null>(null);
  const [pipelineLoaded, setPipelineLoaded] = useState(false);

  const loadPipelineData = useCallback(async () => {
    if (pipelineLoaded) return;
    try {
      const result = await getPipelines();
      if (result.success && result.data && result.data.length > 0) {
        const pipeline = result.data[0];
        const stages = pipeline.pipeline_stages.sort(
          (a, b) => a.display_order - b.display_order
        );
        setPipelineData({ pipelineId: pipeline.id, stages });
      }
      setPipelineLoaded(true);
    } catch {
      console.error("Failed to load pipeline data");
    }
  }, [pipelineLoaded]);

  // Pre-load pipeline data once on mount
  useEffect(() => {
    loadPipelineData();
  }, [loadPipelineData]);

  const openDeal = useCallback(() => {
    loadPipelineData();
    setDealOpen(true);
  }, [loadPipelineData]);

  const openContact = useCallback(() => setContactOpen(true), []);
  const openCompany = useCallback(() => setCompanyOpen(true), []);
  const openTask = useCallback(() => setTaskOpen(true), []);
  const openNote = useCallback(() => setNoteOpen(true), []);

  return (
    <QuickCreateContext.Provider
      value={{ openDeal, openContact, openCompany, openTask, openNote }}
    >
      {children}

      {/* Deal Form — only render if pipeline data is loaded */}
      {pipelineData && (
        <DealForm
          open={dealOpen}
          onOpenChange={setDealOpen}
          stages={pipelineData.stages}
          pipelineId={pipelineData.pipelineId}
          defaultStageId={pipelineData.stages[0]?.id}
        />
      )}

      {/* Contact Form */}
      <ContactForm open={contactOpen} onOpenChange={setContactOpen} />

      {/* Company Form */}
      <CompanyForm open={companyOpen} onOpenChange={setCompanyOpen} />

      {/* Task Form */}
      <TaskForm open={taskOpen} onOpenChange={setTaskOpen} />

      {/* Note Form */}
      <NoteForm open={noteOpen} onOpenChange={setNoteOpen} />
    </QuickCreateContext.Provider>
  );
}
