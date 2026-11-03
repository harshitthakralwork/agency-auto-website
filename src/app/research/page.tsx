import { ResearchStudioView } from "@/components/research/research-studio-view";

export const metadata = {
  title: "Research Intelligence Studio | Agency Website Engine",
  description: "Analyze reference websites via REA under sandboxed egress protection",
};

export default function ResearchPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <ResearchStudioView />
    </div>
  );
}

