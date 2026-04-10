import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { CalendarStrip } from "../components/CalendarStrip";
import { EntryCard } from "../components/EntryCard";
import { MonthlyInsightPanel } from "../components/MonthlyInsightPanel";
import { storageService } from "../services/storage";
import { Entry } from "../types";
import { Plus, LogOut, Palette } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { toast } from "sonner";
import { motion } from "motion/react";

export function HomePage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [entries, setEntries] = useState<Entry[]>([]);
  const [entryCounts, setEntryCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    loadEntries();
  }, [selectedDate]);

  const loadEntries = () => {
    const dateStr = selectedDate.toISOString().split("T")[0];
    const dayEntries = storageService.getEntriesByDate(dateStr);
    setEntries(dayEntries.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));

    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;
    const monthEntries = storageService.getEntriesByMonth(year, month);

    const counts: Record<string, number> = {};
    monthEntries.forEach((entry) => {
      const date = entry.createdAt.split("T")[0];
      counts[date] = (counts[date] || 0) + 1;
    });
    setEntryCounts(counts);
  };

  const handlePrevMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1));
  };

  const handleDeleteEntry = (id: string) => {
    storageService.deleteEntry(id);
    toast.success("Entry deleted");
    loadEntries();
  };

  const handleLogout = () => {
    storageService.logout();
    navigate("/login");
    toast.success("Logged out");
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
          <h1 className="text-xl font-light tracking-tight">Insight Journal</h1>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-muted/50 transition-all duration-200"
                >
                  <Palette className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl">
                <DropdownMenuItem
                  onClick={() => setTheme("light")}
                  className="rounded-lg cursor-pointer"
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-neutral-100 to-neutral-300 border" />
                    <span className="font-light">Light</span>
                    {theme === "light" && <span className="ml-auto text-primary">✓</span>}
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setTheme("dark")}
                  className="rounded-lg cursor-pointer"
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-neutral-800 to-neutral-950 border" />
                    <span className="font-light">Dark</span>
                    {theme === "dark" && <span className="ml-auto text-primary">✓</span>}
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setTheme("warm")}
                  className="rounded-lg cursor-pointer"
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-amber-100 to-amber-300 border" />
                    <span className="font-light">Warm</span>
                    {theme === "warm" && <span className="ml-auto text-primary">✓</span>}
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="rounded-full hover:bg-muted/50 transition-all duration-200"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <CalendarStrip
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          entryCounts={entryCounts}
        />

        <MonthlyInsightPanel selectedDate={selectedDate} />

        {/* Entries Timeline */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-light tracking-tight">
                {selectedDate.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                })}
              </h2>
              <p className="text-xs text-muted-foreground font-light mt-1">
                {entries.length} {entries.length === 1 ? "entry" : "entries"}
              </p>
            </div>
          </div>

          {entries.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <p className="text-muted-foreground font-light mb-6">No entries yet</p>
              <Button
                onClick={() => navigate("/editor")}
                variant="outline"
                className="rounded-xl border-border/50 hover:bg-muted/50 h-10 px-6"
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className="font-light">Create Entry</span>
              </Button>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  onClick={() => navigate(`/editor/${entry.id}`)}
                  onDelete={handleDeleteEntry}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Floating Add Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate("/editor")}
        className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-primary-foreground 
          rounded-full shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 
          transition-all duration-200 flex items-center justify-center"
      >
        <Plus className="h-5 w-5" />
      </motion.button>
    </div>
  );
}
