"use client";

import { AssistantProvider } from "@/context/AssistantContext";
import { ReactNode } from "react";

export default function AIAssistantLayout({ children }: { children: ReactNode }) {
  return <AssistantProvider>{children}</AssistantProvider>;
}