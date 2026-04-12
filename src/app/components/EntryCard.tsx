import { Entry } from "../types";
import { FileText, Image, X } from "lucide-react";
import { motion } from "motion/react";

interface EntryCardProps {
  entry: Entry;
  onClick: () => void;
  onDelete: (id: string) => void;
}

export function EntryCard({ entry, onClick, onDelete }: EntryCardProps) {
  const date = new Date(entry.createdAt);
  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const getPreview = (content: string) => {
    const cleaned = content.replace(/#{1,6}\s/g, "").replace(/[*_-]/g, "");
    return cleaned.substring(0, 200) + (cleaned.length > 200 ? "..." : "");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="group relative bg-card rounded-2xl p-6 cursor-pointer 
        transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 border border-border/50"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-muted-foreground">{timeStr}</span>
          <div className="flex items-center gap-2">
            {entry.images.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground/60">
                <Image className="h-3.5 w-3.5" />
                <span>{entry.images.length}</span>
              </div>
            )}
            {entry.attachments.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground/60">
                <FileText className="h-3.5 w-3.5" />
                <span>{entry.attachments.length}</span>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(entry.id);
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 
            hover:bg-muted rounded-lg"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <p className="text-sm leading-relaxed text-foreground/80 line-clamp-4 font-light">
        {getPreview(entry.formattedContent || entry.rawContent)}
      </p>

      {entry.images.length > 0 && (
        <div className="flex gap-2 mt-4 overflow-x-auto">
          {entry.images.slice(0, 3).map((img, i) => (
            <img
              key={i}
              src={img}
              alt={`Preview ${i + 1}`}
              className="h-20 w-20 object-cover rounded-lg"
            />
          ))}
          {entry.images.length > 3 && (
            <div className="h-20 w-20 bg-muted rounded-lg flex items-center justify-center text-xs text-muted-foreground">
              +{entry.images.length - 3}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
