import { useState } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { aiService } from "../services/ai";
import { Sparkles, TrendingUp, Calendar } from "lucide-react";
import { storageService } from "../services/storage";
import { motion } from "motion/react";

interface MonthlyInsightPanelProps {
  selectedDate: Date;
}

export function MonthlyInsightPanel({ selectedDate }: MonthlyInsightPanelProps) {
  const [showInsight, setShowInsight] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [compareMonth, setCompareMonth] = useState<Date | null>(null);
  const [insight, setInsight] = useState<ReturnType<typeof aiService.generateMonthlyInsight> | null>(
    null
  );
  const [comparison, setComparison] = useState<string>("");

  const generateInsight = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;
    const entries = storageService.getEntriesByMonth(year, month);
    const generated = aiService.generateMonthlyInsight(entries, year, month);
    setInsight(generated);
    setShowInsight(true);
  };

  const handleCompare = (month: Date) => {
    const year1 = selectedDate.getFullYear();
    const month1 = selectedDate.getMonth() + 1;
    const entries1 = storageService.getEntriesByMonth(year1, month1);

    const year2 = month.getFullYear();
    const month2 = month.getMonth() + 1;
    const entries2 = storageService.getEntriesByMonth(year2, month2);

    const month1Name = selectedDate.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
    const month2Name = month.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    const result = aiService.compareMonths(entries1, entries2, month1Name, month2Name);
    setComparison(result);
    setCompareMonth(month);
  };

  const getMonthOptions = () => {
    const options: Date[] = [];
    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();

    for (let i = 1; i <= 6; i++) {
      let month = currentMonth - i;
      let year = currentYear;
      if (month < 0) {
        month += 12;
        year -= 1;
      }
      options.push(new Date(year, month, 1));
    }
    return options;
  };

  return (
    <>
      <div className="flex gap-3 mb-12">
        <Button
          onClick={generateInsight}
          variant="outline"
          className="rounded-xl border-border/50 hover:bg-primary/5 hover:border-primary/20 
            transition-all duration-200 h-10 px-4"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          <span className="font-light">Monthly Insight</span>
        </Button>
        <Button
          onClick={() => setShowComparison(true)}
          variant="outline"
          className="rounded-xl border-border/50 hover:bg-primary/5 hover:border-primary/20 
            transition-all duration-200 h-10 px-4"
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          <span className="font-light">Compare Months</span>
        </Button>
      </div>

      {/* Monthly Insight Dialog */}
      <Dialog open={showInsight} onOpenChange={setShowInsight}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-light">
              <Sparkles className="h-5 w-5 text-primary" />
              {insight?.month}
            </DialogTitle>
          </DialogHeader>
          {insight && (
            <div className="space-y-6 pt-4">
              <div>
                <p className="text-sm leading-relaxed text-muted-foreground font-light">
                  {insight.summary}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-3">Key Moments</h3>
                <div className="space-y-2">
                  {insight.keyEvents.map((event, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex gap-4 text-sm p-3 bg-muted/30 rounded-xl"
                    >
                      <span className="font-medium text-primary min-w-[60px]">{event.date}</span>
                      <span className="text-foreground/70 font-light">{event.event}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-3">Highlights</h3>
                <ul className="space-y-2">
                  {insight.highlights.map((highlight, i) => (
                    <li key={i} className="text-sm text-muted-foreground font-light flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-3">Pattern</h3>
                <p className="text-sm text-muted-foreground font-light leading-relaxed">
                  {insight.patterns}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Month Comparison Dialog */}
      <Dialog
        open={showComparison}
        onOpenChange={(open) => {
          if (!open) {
            setShowComparison(false);
            setCompareMonth(null);
            setComparison("");
          }
        }}
      >
        <DialogContent className="max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-light">
              <TrendingUp className="h-5 w-5 text-primary" />
              {comparison ? "Analysis" : "Compare With"}
            </DialogTitle>
          </DialogHeader>

          {!comparison ? (
            <div className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground font-light">
                Compare{" "}
                <span className="text-foreground font-medium">
                  {selectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </span>{" "}
                with another month
              </p>
              <div className="grid grid-cols-2 gap-3">
                {getMonthOptions().map((month) => (
                  <Button
                    key={month.toISOString()}
                    variant="outline"
                    onClick={() => handleCompare(month)}
                    className="justify-start h-12 rounded-xl border-border/50 hover:bg-muted/50 
                      hover:border-primary/20 transition-all duration-200"
                  >
                    <Calendar className="h-4 w-4 mr-3 text-muted-foreground" />
                    <span className="font-light">
                      {month.toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none pt-4">
              <div className="whitespace-pre-wrap text-sm font-light leading-relaxed text-foreground/80">
                {comparison}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
