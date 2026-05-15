import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Paperclip, Trash2, Upload, Camera } from "lucide-react";
import { toast } from "sonner";

type Attachment = { id: string; label: string | null; file_path: string; mime_type: string | null; created_at: string };

/** Proof / attachments uploader for any document. */
export function ProofUpload({ docType, docId }: { docType: string; docId: string | null }) {
  const [items, setItems] = useState<Attachment[]>([]);
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  async function load() {
    if (!docId) return;
    const { data } = await supabase.from("document_attachments")
      .select("id,label,file_path,mime_type,created_at")
      .eq("doc_type", docType).eq("doc_id", docId).order("created_at", { ascending: false });
    setItems(data ?? []);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [docType, docId]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !docId) return;
    setBusy(true);
    try {
      const path = `${docType}/${docId}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("attachments").upload(path, file);
      if (upErr) throw upErr;
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("document_attachments").insert({
        doc_type: docType, doc_id: docId, label: label || file.name,
        file_path: path, mime_type: file.type, uploaded_by: user?.id,
      });
      if (error) throw error;
      toast.success("Proof uploaded");
      setLabel(""); if (ref.current) ref.current.value = "";
      load();
    } catch (err: any) { toast.error(err.message); }
    finally { setBusy(false); }
  }

  async function remove(id: string, path: string) {
    await supabase.storage.from("attachments").remove([path]);
    await supabase.from("document_attachments").delete().eq("id", id);
    load();
  }

  function publicUrl(p: string) {
    return supabase.storage.from("attachments").getPublicUrl(p).data.publicUrl;
  }

  if (!docId) return null;

  return (
    <div className="rounded-md border p-3 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium"><Paperclip className="h-4 w-4" />Proof &amp; Attachments</div>
      <div className="grid grid-cols-12 gap-2 items-end">
        <div className="col-span-7">
          <Label className="text-xs">Label</Label>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Delivery photo" />
        </div>
        <div className="col-span-5 flex gap-2">
          <Button variant="outline" disabled={busy} onClick={() => ref.current?.click()} className="flex-1">
            <Upload className="h-3 w-3 mr-1" />Upload
          </Button>
          <input ref={ref} type="file" accept="image/*,application/pdf,.heic" capture="environment" hidden onChange={onFile} />
        </div>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">No attachments yet.</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {items.map((a) => {
            const isImg = a.mime_type?.startsWith("image/");
            const url = publicUrl(a.file_path);
            return (
              <div key={a.id} className="relative group rounded border overflow-hidden bg-muted/30">
                <a href={url} target="_blank" rel="noreferrer" className="block">
                  {isImg ? (
                    <img src={url} alt={a.label ?? ""} className="aspect-square object-cover w-full" />
                  ) : (
                    <div className="aspect-square flex items-center justify-center text-xs text-muted-foreground">PDF</div>
                  )}
                </a>
                <div className="px-1.5 py-1 text-[10px] truncate">{a.label}</div>
                <button onClick={() => remove(a.id, a.file_path)} className="absolute top-1 right-1 p-1 rounded bg-background/80 opacity-0 group-hover:opacity-100">
                  <Trash2 className="h-3 w-3 text-destructive" />
                </button>
              </div>
            );
          })}
        </div>
      )}
      <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Camera className="h-3 w-3" />Mobile: tap Upload to use the camera.</p>
    </div>
  );
}
