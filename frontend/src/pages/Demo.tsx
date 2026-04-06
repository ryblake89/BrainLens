import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Upload, Loader2, AlertTriangle } from "lucide-react";
import { api } from "@/api/client";
import type { GallerySample, PredictionResult, ClassProbabilities } from "@/api/client";

const BACKBONE_OPTIONS = [
  { value: "efficientnetv2_s", label: "EfficientNetV2-S", desc: "Higher accuracy (98.9%)" },
  { value: "efficientnetv2_b1", label: "EfficientNetV2-B1", desc: "Faster inference (33ms)" },
];

function ConfidenceBars({ probs }: { probs: ClassProbabilities }) {
  const sorted = Object.entries(probs.probabilities).sort(([, a], [, b]) => b - a);
  return (
    <div className="space-y-2">
      {sorted.map(([cls, prob]) => (
        <div key={cls} className="flex items-center gap-3">
          <span className={`text-sm w-28 text-right ${cls === probs.prediction ? "font-bold" : "text-muted-foreground"}`}>
            {cls.replace("_", " ")}
          </span>
          <div className="flex-1 bg-muted rounded-full h-5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                cls === probs.prediction ? "bg-primary" : "bg-muted-foreground/30"
              }`}
              style={{ width: `${(prob * 100).toFixed(1)}%` }}
            />
          </div>
          <span className="text-sm w-14 text-right font-mono">
            {(prob * 100).toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  );
}

interface DisplayData {
  l2: ClassProbabilities;
  l3: ClassProbabilities | null;
  gradcamSrc: string;
  imageSrc: string;
  inferenceMs: number;
  backbone: string;
}

function PredictionPanel({ data }: { data: DisplayData | null }) {
  if (!data) {
    return (
      <div className="border rounded-lg p-12 text-center text-muted-foreground">
        Select an image from the gallery or upload your own
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
        <AlertTriangle className="h-3 w-3 shrink-0" />
        For educational purposes only. Not a medical diagnostic tool.
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-sm font-medium mb-2 text-center">Original</div>
          <img src={data.imageSrc} alt="Input MRI" className="w-full rounded-lg border" />
        </div>
        <div>
          <div className="text-sm font-medium mb-2 text-center">Grad-CAM++</div>
          <img src={data.gradcamSrc} alt="Grad-CAM heatmap" className="w-full rounded-lg border" />
        </div>
      </div>

      <div className="border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Tumor Classification (L2)</h3>
          <span className="text-xs text-muted-foreground">
            {data.inferenceMs}ms | {data.backbone.replace("efficientnetv2_", "V2-")}
          </span>
        </div>
        <div className="text-2xl font-bold mb-3 capitalize">
          {data.l2.prediction.replace("_", " ")}
          <span className="text-base font-normal text-muted-foreground ml-2">
            ({(data.l2.confidence * 100).toFixed(1)}%)
          </span>
        </div>
        <ConfidenceBars probs={data.l2} />
      </div>

      {data.l3 && (
        <div className="border rounded-lg p-4 border-primary/30 bg-primary/5">
          <h3 className="font-semibold mb-3">Glioma Subtype (L3)</h3>
          <div className="text-2xl font-bold mb-3">
            {data.l3.prediction}
            <span className="text-base font-normal text-muted-foreground ml-2">
              ({(data.l3.confidence * 100).toFixed(1)}%)
            </span>
          </div>
          <ConfidenceBars probs={data.l3} />
        </div>
      )}
    </div>
  );
}

export default function Demo() {
  const [selectedSample, setSelectedSample] = useState<GallerySample | null>(null);
  const [backbone, setBackbone] = useState("efficientnetv2_s");
  const [uploadResult, setUploadResult] = useState<PredictionResult | null>(null);
  const [uploadImageUrl, setUploadImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [mode, setMode] = useState<"gallery" | "upload">("gallery");

  const { data: galleryData } = useQuery({
    queryKey: ["gallery"],
    queryFn: () => api.getSamples(),
  });

  const samples = galleryData?.samples ?? [];

  // Build display data from either gallery selection or upload result
  let displayData: DisplayData | null = null;

  if (mode === "gallery" && selectedSample) {
    const pred = selectedSample.predictions[backbone];
    if (pred) {
      displayData = {
        l2: pred.l2,
        l3: pred.l3,
        gradcamSrc: `/api${pred.gradcam_url.replace("/api", "")}`,
        imageSrc: `/api${selectedSample.image_url.replace("/api", "")}`,
        inferenceMs: pred.inference_time_ms,
        backbone,
      };
    }
  } else if (mode === "upload" && uploadResult && uploadImageUrl) {
    displayData = {
      l2: uploadResult.l2,
      l3: uploadResult.l3,
      gradcamSrc: `data:image/png;base64,${uploadResult.gradcam_b64}`,
      imageSrc: uploadImageUrl,
      inferenceMs: uploadResult.inference_time_ms,
      backbone: uploadResult.backbone,
    };
  }

  const handleUpload = useCallback(async (file: File) => {
    setMode("upload");
    setIsUploading(true);
    setSelectedSample(null);
    setUploadImageUrl(URL.createObjectURL(file));
    try {
      const result = await api.predict(file, backbone);
      setUploadResult(result);
    } catch (e) {
      console.error("Prediction failed:", e);
    } finally {
      setIsUploading(false);
    }
  }, [backbone]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }, [handleUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  }, [handleUpload]);

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Interactive Demo</h1>
      <p className="text-muted-foreground mb-6">
        Select a brain MRI from the gallery or upload your own. The model classifies the tumor type
        and generates a Grad-CAM++ heatmap showing which regions influenced the prediction.
      </p>

      {/* Backbone toggle */}
      <div className="flex gap-2 mb-6">
        {BACKBONE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setBackbone(opt.value)}
            className={`px-4 py-2 rounded-md text-sm border transition-colors ${
              backbone === opt.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-foreground border-border hover:bg-accent"
            }`}
          >
            <div className="font-medium">{opt.label}</div>
            <div className="text-xs opacity-75">{opt.desc}</div>
          </button>
        ))}
      </div>

      {/* Gallery strip — auto-scrolls, stops on hover to allow manual scrolling */}
      <div className="mb-4">
        <h2 className="text-sm font-medium mb-2">Gallery ({samples.length} test images) — hover to browse, click to classify</h2>
        <div
          className="group relative overflow-x-hidden hover:overflow-x-auto"
        >
          <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none group-hover:opacity-0 transition-opacity" />
          <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none group-hover:opacity-0 transition-opacity" />
          <div className="flex gap-2 pb-2 animate-scroll-slow group-hover:[animation:none]">
            {[...samples, ...samples].map((sample, i) => (
              <button
                key={`${sample.id}-${i}`}
                onClick={() => {
                  setSelectedSample(sample);
                  setMode("gallery");
                  setUploadResult(null);
                  setUploadImageUrl(null);
                }}
                className={`shrink-0 relative rounded-lg overflow-hidden border-2 transition-all ${
                  selectedSample?.id === sample.id && mode === "gallery"
                    ? "border-primary ring-2 ring-primary/20 scale-110 z-20"
                    : "border-transparent hover:border-border hover:scale-105"
                }`}
              >
                <img
                  src={`/api${sample.image_url.replace("/api", "")}`}
                  alt={sample.class_label}
                  className="w-16 h-16 object-cover"
                  loading="lazy"
                />
                {sample.is_failure_case && (
                  <div className="absolute top-0 right-0 bg-destructive text-white text-[8px] px-1 rounded-bl">!</div>
                )}
                <div className="text-[9px] text-center py-0.5 bg-muted truncate px-1">
                  {sample.class_label}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Upload zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer mb-6"
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <input id="file-input" type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
        <Upload className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Drag & drop a brain MRI image, or click to browse
        </p>
      </div>

      {isUploading && (
        <div className="flex items-center justify-center gap-2 py-4">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Running inference...</span>
        </div>
      )}

      {/* Prediction results — full width below */}
      <div className="max-w-2xl mx-auto">
        <PredictionPanel data={displayData} />
      </div>
    </div>
  );
}
