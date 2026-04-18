import { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useShuttleStore, StrikeStatus } from '@/store/shuttleStore';
import { ArrowLeft, Upload, X, CheckCircle2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

const REASON_OPTIONS = [
  { value: 'class_replacement', label: 'Kelas pengganti mendadak' },
  { value: 'health', label: 'Kondisi kesehatan' },
  { value: 'emergency', label: 'Keadaan darurat lainnya' },
  { value: 'force_majeure', label: 'Pembatalan terlambat karena kondisi di luar kendali' },
];

const EVIDENCE_HINTS: Record<string, string> = {
  class_replacement: 'Screenshot jadwal pengganti dari BinusMaya',
  health: 'Surat keterangan sakit atau bukti kunjungan klinik',
  emergency: 'Dokumen pendukung yang relevan',
  force_majeure: 'Dokumen atau bukti kondisi yang tidak terduga',
};

interface UploadedFile {
  name: string;
  size: number;
}

export default function AppealPage() {
  const { strikeId } = useParams<{ strikeId: string }>();
  const navigate = useNavigate();
  const { strikeHistory, updateStrikeStatus } = useShuttleStore();

  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [declared, setDeclared] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const strike = strikeHistory.find((s) => s.id === strikeId);

  const descriptionValid = description.trim().length >= 30;
  const canSubmit = reason && descriptionValid && files.length > 0 && declared;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    const remaining = 3 - files.length;
    const toAdd = selected.slice(0, remaining).map((f) => ({ name: f.name, size: f.size }));
    setFiles((prev) => [...prev, ...toAdd]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSubmit = () => {
    if (!canSubmit || !strikeId) return;
    updateStrikeStatus(strikeId, 'dalam_peninjauan' as StrikeStatus);
    setSubmitted(true);
  };

  if (!strike) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-ink-light text-body">Strike tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="px-5 pt-10 pb-4">
        <button onClick={() => navigate(-1)} className="text-ink mb-3">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-h1 text-ink">Pengajuan Banding Strike #{strike.number}</h1>
        <p className="text-caption text-ink-light mt-1">
          Rute: {strike.bookingRoute} · {strike.bookingDate} {strike.bookingTime}
        </p>
      </div>

      <div className="px-5 space-y-5 flex-1">
        {/* Reason */}
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <p className="text-body font-semibold text-ink mb-3">Kategori Alasan</p>
          <div className="space-y-2">
            {REASON_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    reason === opt.value ? 'border-primary bg-primary' : 'border-border'
                  }`}
                >
                  {reason === opt.value && (
                    <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                  )}
                </div>
                <input
                  type="radio"
                  name="reason"
                  value={opt.value}
                  checked={reason === opt.value}
                  onChange={() => setReason(opt.value)}
                  className="sr-only"
                />
                <span className="text-body text-ink">{opt.label}</span>
              </label>
            ))}
          </div>
          {reason && EVIDENCE_HINTS[reason] && (
            <div className="mt-3 bg-accent/50 rounded-xl p-3">
              <p className="text-caption text-ink-light">
                <span className="font-medium text-ink">Contoh bukti: </span>
                {EVIDENCE_HINTS[reason]}
              </p>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <p className="text-body font-semibold text-ink mb-2">Deskripsi</p>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Jelaskan situasi yang menyebabkan ketidakhadiran atau pembatalan terlambat..."
            rows={4}
            className="w-full rounded-xl border border-border bg-muted p-3 text-body text-ink placeholder:text-ink-light/50 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <div className="flex justify-between mt-1">
            <p className={`text-caption ${descriptionValid ? 'text-success' : 'text-ink-light'}`}>
              {description.trim().length < 30
                ? `Minimal 30 karakter (${description.trim().length}/30)`
                : `${description.trim().length} karakter ✓`}
            </p>
          </div>
        </div>

        {/* File upload */}
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <p className="text-body font-semibold text-ink mb-1">Unggah Bukti</p>
          <p className="text-caption text-ink-light mb-3">
            Maks. 3 file · 5 MB per file · JPG, PNG, PDF
          </p>

          {files.length < 3 && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-14 border-2 border-dashed border-border rounded-xl flex items-center justify-center gap-2 text-ink-light hover:border-primary/50 hover:text-primary transition-colors"
            >
              <Upload className="w-5 h-5" />
              <span className="text-body">Pilih File</span>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />

          {files.length > 0 && (
            <div className="mt-3 space-y-2">
              {files.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-muted rounded-xl px-3 py-2.5"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Upload className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-caption font-medium text-ink truncate">{f.name}</p>
                    <p className="text-[11px] text-ink-light">{formatBytes(f.size)}</p>
                  </div>
                  <button onClick={() => removeFile(i)} className="text-ink-light hover:text-destructive">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Declaration */}
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <label className="flex items-start gap-3 cursor-pointer">
            <div className="relative mt-0.5">
              <input
                type="checkbox"
                checked={declared}
                onChange={(e) => setDeclared(e.target.checked)}
                className="sr-only"
              />
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  declared ? 'gradient-orange border-primary' : 'border-border bg-card'
                }`}
              >
                {declared && (
                  <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 12 12">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </div>
            <p className="text-caption text-ink leading-relaxed">
              Saya menyatakan bahwa informasi dan bukti yang saya berikan adalah benar.
              Pengajuan banding palsu dapat mengakibatkan penalti tambahan.
            </p>
          </label>
        </div>
      </div>

      {/* CTA */}
      <div className="sticky bottom-0 p-5 bg-card shadow-sticky">
        <button
          disabled={!canSubmit}
          onClick={handleSubmit}
          className={`w-full h-12 rounded-xl font-semibold text-body transition-all active:scale-[0.98] ${
            canSubmit
              ? 'gradient-orange text-primary-foreground shadow-card'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
        >
          Kirim Banding
        </button>
      </div>

      {/* Success sheet */}
      <Sheet open={submitted} onOpenChange={() => {}}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader className="mb-4">
            <div className="flex justify-center mb-3">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
            </div>
            <SheetTitle className="text-center text-h2 text-ink">Banding Diajukan</SheetTitle>
          </SheetHeader>
          <div className="pb-6 space-y-4 text-center">
            <p className="text-body text-ink-light">
              Banding Anda telah diajukan dan akan ditinjau oleh administrator dalam{' '}
              <span className="font-semibold text-ink">1–3 hari kerja</span>.
            </p>
            <button
              onClick={() => navigate('/strikes')}
              className="w-full h-12 rounded-xl gradient-orange text-primary-foreground font-semibold text-body shadow-card"
            >
              Lihat Riwayat Strike
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
