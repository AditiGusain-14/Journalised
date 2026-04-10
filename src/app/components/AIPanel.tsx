import { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Sparkles, Copy, FileText, Lightbulb } from "lucide-react";
import { aiService } from "../services/ai";
import { Attachment } from "../types";
import { toast } from "sonner";
import { motion } from "motion/react";

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

  const handleAsk = () => {
    if (!question.trim()) {
      toast.error("Please enter a question");
      return;
    }

    const context = rawContent + "\n" + attachments.map((a) => a.extractedText).join("\n");
    let answer = "";

    if (question.toLowerCase().includes("summary")) {
      answer = `Based on your notes: ${rawContent.substring(0, 200)}...`;
    } else if (question.toLowerCase().includes("key") || question.toLowerCase().includes("important")) {
      answer = "Key points from your entry:\n• " + rawContent.split("\n").slice(0, 3).join("\n• ");
    } else {
      answer = `Regarding "${question}":\n\nBased on the context, ${
        context.length > 100
          ? "you've mentioned relevant information in your notes."
          : "you might want to add more details about this."
      }`;
    }

    setResponse(answer);
  };

  const handleAnalyzePdf = (attachment: Attachment) => {
    setSelectedPdf(attachment.fileName);
    const insight = aiService.analyzePDF(attachment.extractedText || "");
    setPdfInsight(insight);
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
              <div className="whitespace-pre-wrap text-muted-foreground font-light leading-relaxed">
                {pdfInsight}
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
          size="sm"
          className="w-full h-9 rounded-lg bg-primary/90 hover:bg-primary"
        >
          <span className="font-light">Ask</span>
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
            <div className="whitespace-pre-wrap text-foreground/70 font-light leading-relaxed">
              {response}
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
              const suggestions = [
                "Add specific metrics or numbers",
                "Clarify the timeline",
                "Include next action items",
              ];
              setResponse("Suggestions:\n\n" + suggestions.map((s) => `• ${s}`).join("\n"));
            }}
          >
            <Sparkles className="h-3 w-3 mr-2" />
            Get Suggestions
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-xs h-9 rounded-lg border-border/50 
              hover:bg-muted/50 font-light"
            onClick={() => {
              const expanded = `${rawContent}\n\nAdditional Context:\nThis observation is significant because it indicates a pattern worth monitoring. Consider documenting related metrics and setting up regular check-ins.`;
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
