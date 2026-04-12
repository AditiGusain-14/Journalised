import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AIPanel } from "../components/AIPanel";
import { storageService } from "../services/storage";
import { aiService } from "../services/ai";
import { Entry, Attachment } from "../types";
import { ArrowLeft, Save, Wand2, Image as ImageIcon, FileText, X } from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";

export function EditorPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [rawContent, setRawContent] = useState("");
  const [formattedContent, setFormattedContent] = useState("");
  const [isFormatted, setIsFormatted] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!id) return;

    const loadEntry = async () => {
      const entry = await storageService.getEntry(id);
      if (entry) {
        setRawContent(entry.rawContent);
        setFormattedContent(entry.formattedContent);
        setIsFormatted(!!entry.formattedContent);
        setImages(entry.images);
        setAttachments(entry.attachments);
      }
    };

    loadEntry();
  }, [id]);

  const handleFormat = async () => {
    if (!rawContent.trim()) {
      toast.error("Please write something first");
      return;
    }

    try {
      setIsFormatting(true);
      const formatted = await aiService.formatEntry(rawContent);
      setFormattedContent(formatted);
      setIsFormatted(true);
      toast.success("Entry formatted!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Formatting failed");
    } finally {
      setIsFormatting(false);
    }
  };

  const handleSave = async () => {
    if (!rawContent.trim() && !formattedContent.trim()) {
      toast.error("Entry cannot be empty");
      return;
    }

    setIsSaving(true);

    const entry: Entry = {
      id: id || Math.random().toString(36).substring(7),
      userId: storageService.getUser()?.id || "",
      rawContent,
      formattedContent: formattedContent || rawContent,
      createdAt: new Date().toISOString(),
      images,
      attachments,
    };

    try {
      await storageService.saveEntry(entry);
      toast.success("Saved");
      navigate("/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    try {
      setIsUploading(true);
      for (const file of Array.from(files)) {
        await aiService.uploadImage(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImages((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      }
      toast.success("Image uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Image upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    try {
      setIsUploading(true);
      for (const file of Array.from(files)) {
        await aiService.uploadPdf(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          const attachment: Attachment = {
            id: Math.random().toString(36).substring(7),
            fileName: file.name,
            fileType: file.type,
            dataUrl: reader.result as string,
          };
          setAttachments((prev) => [...prev, attachment]);
        };
        reader.readAsDataURL(file);
      }
      toast.success("PDF uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "PDF upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleInsertText = (text: string) => {
    if (isFormatted) {
      setFormattedContent((prev) => prev + text);
    } else {
      setRawContent((prev) => prev + text);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="rounded-full hover:bg-muted/50 transition-all duration-200 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="font-light">Back</span>
          </Button>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleFormat}
              disabled={isFormatted || isFormatting}
              className="rounded-xl border-border/50 hover:bg-muted/50 h-10 px-4"
            >
              <Wand2 className="h-4 w-4 mr-2" />
              <span className="font-light">{isFormatting ? "Formatting..." : "Format"}</span>
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-xl h-10 px-6 bg-primary hover:bg-primary/90"
            >
              <Save className="h-4 w-4 mr-2" />
              <span className="font-light">{isSaving ? "Saving..." : "Save"}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Editor */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-12">
          {/* Left: Editor */}
          <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex items-center gap-2">
              <label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="cursor-pointer h-9 rounded-lg border-border/50 hover:bg-muted/50 px-3"
                  asChild
                >
                  <span>
                    <ImageIcon className="h-3.5 w-3.5 mr-2" />
                    <span className="font-light text-xs">{isUploading ? "Uploading..." : "Images"}</span>
                  </span>
                </Button>
              </label>
              <label>
                <input
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={handlePdfUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="cursor-pointer h-9 rounded-lg border-border/50 hover:bg-muted/50 px-3"
                  asChild
                >
                  <span>
                    <FileText className="h-3.5 w-3.5 mr-2" />
                    <span className="font-light text-xs">{isUploading ? "Uploading..." : "PDFs"}</span>
                  </span>
                </Button>
              </label>
            </div>

            {/* Images Preview */}
            {images.length > 0 && (
              <div className="flex gap-3 flex-wrap">
                {images.map((img, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative group"
                  >
                    <img
                      src={img}
                      alt={`Upload ${i + 1}`}
                      className="h-24 w-24 object-cover rounded-xl"
                    />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute -top-2 -right-2 bg-background border border-border 
                        rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity 
                        shadow-sm hover:bg-muted"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Attachments */}
            {attachments.length > 0 && (
              <div className="space-y-2">
                {attachments.map((attachment) => (
                  <motion.div
                    key={attachment.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-xl group"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="text-sm font-light">{attachment.fileName}</span>
                    </div>
                    <button
                      onClick={() => removeAttachment(attachment.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity 
                        p-1.5 hover:bg-background/80 rounded-lg"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Editor */}
            <div className="pt-4">
              {!isFormatted ? (
                <div>
                  <Textarea
                    placeholder="Write freely... your thoughts, notes, observations..."
                    value={rawContent}
                    onChange={(e) => setRawContent(e.target.value)}
                    className="min-h-[500px] text-base border-0 bg-transparent resize-none 
                      focus-visible:ring-0 px-0 font-light leading-relaxed"
                  />
                  <p className="text-xs text-muted-foreground font-light mt-4">
                    Write naturally. Click "Format" to structure your thoughts.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-sm font-medium">Formatted Entry</label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsFormatted(false);
                        setFormattedContent("");
                      }}
                      className="h-8 px-3 rounded-lg hover:bg-muted/50"
                    >
                      <span className="font-light text-xs">Edit Raw</span>
                    </Button>
                  </div>
                  <div className="prose prose-sm max-w-none prose-headings:font-bold prose-h1:mb-8 prose-h2:mb-6 prose-h3:mb-4 prose-ul:ml-8 min-h-[500px] p-6 border rounded-xl bg-muted/20 font-serif [&_*]:font-serif [&_h1]:font-bold [&_h2]:font-bold [&_h3]:font-bold [&_ul]:list-disc [&_li]:ml-4">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {formattedContent}
                    </ReactMarkdown>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFormattedContent(rawContent)}
                    className="mt-4 h-8 px-4 rounded-lg hover:bg-muted/50"
                  >
                    Edit Raw
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Right: AI Panel */}
          <div className="lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)] lg:overflow-hidden">
            <div className="bg-card/50 border border-border/50 rounded-2xl p-6 h-full flex flex-col">
              <h3 className="text-sm font-medium mb-6">AI Assistant</h3>
              <div className="flex-1 overflow-y-auto -mr-2 pr-2">
                <AIPanel
                  rawContent={rawContent || formattedContent}
                  attachments={attachments}
                  onInsertText={handleInsertText}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
