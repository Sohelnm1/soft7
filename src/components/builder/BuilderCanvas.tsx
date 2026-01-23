"use client";

import { ReactFlowProvider } from "reactflow";
import BuilderCanvasInner from "./BuilderCanvasInner";

export default function BuilderCanvas({ bot }: any) {
  return (
    <ReactFlowProvider>
      <BuilderCanvasInner bot={bot} />
    </ReactFlowProvider>
  );
}
