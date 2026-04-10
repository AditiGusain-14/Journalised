import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { motion } from "motion/react";

interface CalendarStripProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  entryCounts: Record<string, number>;
}

export function CalendarStrip({
  selectedDate,
  onDateSelect,
  onPrevMonth,
  onNextMonth,
  entryCounts,
}: CalendarStripProps) {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();

  const monthName = selectedDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    return (
      day === selectedDate.getDate() &&
      month === selectedDate.getMonth() &&
      year === selectedDate.getFullYear()
    );
  };

  const getEntryCount = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return entryCounts[dateStr] || 0;
  };

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-light tracking-tight">{monthName}</h2>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onPrevMonth}
            className="hover:bg-muted/50 transition-all duration-200 rounded-full h-9 w-9"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onNextMonth}
            className="hover:bg-muted/50 transition-all duration-200 rounded-full h-9 w-9"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-3">
        {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
          <div key={i} className="text-center text-xs font-medium text-muted-foreground/60 pb-3">
            {day}
          </div>
        ))}

        {days.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} />;
          }

          const entryCount = getEntryCount(day);
          const today = isToday(day);
          const selected = isSelected(day);

          return (
            <motion.button
              key={day}
              onClick={() => onDateSelect(new Date(year, month, day))}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`
                aspect-square rounded-xl flex flex-col items-center justify-center text-sm
                transition-all duration-200 relative font-light
                ${
                  selected
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : ""
                }
                ${today && !selected ? "bg-muted/50 font-medium" : ""}
                ${!selected && !today ? "hover:bg-muted/30" : ""}
              `}
            >
              <span>{day}</span>
              {entryCount > 0 && !selected && (
                <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-primary" />
              )}
              {entryCount > 0 && selected && (
                <span className="absolute bottom-1.5 text-[9px] opacity-70">{entryCount}</span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
