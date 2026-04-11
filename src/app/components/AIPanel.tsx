import React, { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Sparkles, Copy, FileText, Lightbulb } from "lucide-react";
import { aiService } from "../services/ai";
import { Attachment } from "../types";
import { toast } from "sonner";
import { motion } from "motion/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

interface AIPanelProps {
  rawContent: string;
  attachments: Attachment[];
  onInsertText: (text: string) => void;
}

export function AIPanel({ rawContent, attachments, onInsertText }: AIPanelProps) {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [pdfInsight, setPdfInsight] = useState("");
  const [selectedPdf, setSelectedPdf] = useState<string>("");
  const [isAsking, setIsAsking] = useState(false);
  const [isAnalyzingPdf, setIsAnalyzingPdf] = useState(false);

  const handleAsk = async () => {
    if (!question.trim()) {
      toast.error("Please enter a question");
      return;
    }

    try {
      setIsAsking(true);
      setResponse("");
      const normalizedQuestion = question.trim();
      const answer = await aiService.askRag(normalizedQuestion);
      setResponse(answer);
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI request failed";
      setResponse(`Could not get AI response: ${message}`);
      toast.error(message);
    } finally {
      setIsAsking(false);
    }
  };

  const handleAnalyzePdf = async (attachment: Attachment) => {
    try {
      setIsAnalyzingPdf(true);
      setSelectedPdf(attachment.fileName);
      const insight = await aiService.analyzePDF(attachment.fileName);
      setPdfInsight(insight);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Document analysis failed");
    } finally {
      setIsAnalyzingPdf(false);
    }
  };

  const buildSuggestions = (text: string): string => {
    const words = text.trim().split(/\s+/).filter(Boolean);
    const hasNumbers = /\d/.test(text);
    const hasDate = /\b(today|tomorrow|yesterday|\d{4}-\d{2}-\d{2}|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i.test(
      text
    );
    const hasActionVerbs = /\b(will|plan|start|finish|follow up|call|email|schedule|review)\b/i.test(text);
    const firstLine = text.split("\n").map((l) => l.trim()).find(Boolean) || "your main topic";

    const suggestions: string[] = [];
    if (!hasNumbers) suggestions.push("Add at least one metric (number, %, time, or count) to make progress trackable.");
    if (!hasDate) suggestions.push("Mention a concrete date/time for the next step.");
    if (!hasActionVerbs) suggestions.push("Add one explicit action sentence starting with 'I will ...'.");
    suggestions.push(`Clarify impact: why "${firstLine.slice(0, 60)}" matters right now.`);
    if (words.length < 80) suggestions.push("Expand with context: trigger, what happened, and what changed after.");

    return "Suggestions:\n\n" + suggestions.map((s) => `- ${s}`).join("\n");
  };

  const buildExpandedEntry = (text: string): string => {
    const base = text.trim();
    if (!base) {
      return [
        "Context:",
        "- What happened?",
        "- Where/when did it happen?",
        "",
        "What I noticed:",
        "- Key signals or emotions",
        "",
        "Impact:",
        "- What changed because of this?",
        "",
        "Next step:",
        "- One concrete action with deadline",
      ].join("\n");
    }

    return [
      base,
      "",
      "Reflection:",
      "- What was the root cause?",
      "- What part was under my control?",
      "- What evidence supports this interpretation?",
      "",
      "Action Plan:",
      "- Next action:",
      "- Deadline:",
      "- Success metric:",
      "",
      "Follow-up note:",
      "- What to review in 48 hours:",
    ].join("\n");
  };

  return (
    <div className="space-y-6 h-full overflow-y-auto px-1">
      {/* PDF Insights */}
      {attachments.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Documents
          </h3>
          {attachments.map((attachment) => (
            <div key={attachment.id} className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs h-9 rounded-lg border-border/50 
                  hover:bg-muted/50 font-light"
                onClick={() => handleAnalyzePdf(attachment)}
              >
                <FileText className="h-3 w-3 mr-2" />
                {attachment.fileName}
              </Button>
            </div>
          ))}
          {pdfInsight && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-muted/30 rounded-xl text-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">{selectedPdf}</span>
                <button
                  onClick={() => {
                    onInsertText("\n\n" + pdfInsight);
                    toast.success("Inserted");
                  }}
                  className="p-1.5 hover:bg-background/80 rounded-lg transition-colors"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>
              <div className="prose prose-sm max-w-none text-muted-foreground font-light leading-relaxed prose-headings:font-bold">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                  components={{
                    h1: ({node, ...props}) => <h1 className="text-xl font-bold mt-4 mb-2 text-primary" {...props}/>,
                    h2: ({node, ...props}) => <h2 className="text-lg font-semibold mt-3 mb-2 border-b border-primary/20 pb-1" {...props}/>,
                    h3: ({node, ...props}) => <h3 className="text-base font-semibold mt-2 mb-1 text-accent" {...props}/>,
                    ul: ({node, ...props}) => <ul className="list-disc ml-6 space-y-1 mb-3" {...props}/>,
                    ol: ({node, ...props}) => <ol className="list-decimal ml-6 space-y-1 mb-3" {...props}/>,
                    li: ({node, ...props}) => <li className="leading-relaxed" {...props}/>,
                    p: ({node, ...props}) => <p className="leading-relaxed mb-2" {...props}/>,
                    strong: ({node, ...props}) => <strong className="font-bold text-foreground" {...props}/>
                  }}
                >
                  {pdfInsight}
                </ReactMarkdown>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Ask Questions */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Ask AI
        </h3>
        <Textarea
          placeholder="Ask about your entry..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="text-xs min-h-[80px] resize-none rounded-xl border-border/50 
            focus:border-primary/20 font-light"
        />
        <Button
          onClick={handleAsk}
          disabled={isAsking}
          size="sm"
          className="w-full h-9 rounded-lg bg-primary/90 hover:bg-primary"
        >
          <span className="font-light">{isAsking ? "Thinking..." : "Ask"}</span>
        </Button>
        {response && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-primary/5 rounded-xl text-xs space-y-3 border border-primary/10"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-primary">Response</span>
              <button
                onClick={() => {
                  onInsertText("\n\n" + response);
                  toast.success("Inserted");
                }}
                className="p-1.5 hover:bg-background/80 rounded-lg transition-colors"
              >
                <Copy className="h-3 w-3 text-primary" />
              </button>
            </div>
            <div className="prose prose-sm max-w-none text-foreground/70 font-light leading-relaxed prose-headings:font-bold">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                  components={{
                    h1: ({node, ...props}) => <h1 className="text-xl font-bold mt-4 mb-2 text-primary" {...props}/>,
                    h2: ({node, ...props}) => <h2 className="text-lg font-semibold mt-3 mb-2 border-b border-primary/20 pb-1" {...props}/>,
                    h3: ({node, ...props}) => <h3 className="text-base font-semibold mt-2 mb-1 text-accent" {...props}/>,
                    ul: ({node, ...props}) => <ul className="list-disc ml-6 space-y-1 mb-3" {...props}/>,
                    ol: ({node, ...props}) => <ol className="list-decimal ml-6 space-y-1 mb-3" {...props}/>,
                    li: ({node, ...props}) => <li className="leading-relaxed" {...props}/>,
                    p: ({node, ...props}) => <p className="leading-relaxed mb-2" {...props}/>,
                    strong: ({node, ...props}) => <strong className="font-bold text-foreground" {...props}/>
                  }}
                >
                  {response}
                </ReactMarkdown>
              </div>
          </motion.div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-primary" />
          Suggestions
        </h3>
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-xs h-9 rounded-lg border-border/50 
              hover:bg-muted/50 font-light"
            onClick={() => {
              setResponse(buildSuggestions(rawContent));
            }}
          >
            <Sparkles className="h-3 w-3 mr-2" />
            {isAnalyzingPdf ? "Analyzing..." : "Get Suggestions"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-xs h-9 rounded-lg border-border/50 
              hover:bg-muted/50 font-light"
            onClick={() => {
              const expanded = buildExpandedEntry(rawContent);
              onInsertText(expanded);
              toast.success("Entry expanded");
            }}
          >
            <Sparkles className="h-3 w-3 mr-2" />
            Expand Entry
          </Button>
        </div>
      </div>
    </div>
  );
}
