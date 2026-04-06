import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend,
} from "recharts";
import { Database, Filter, GitBranch, CheckCircle } from "lucide-react";

const L2_DISTRIBUTION = [
  { name: "glioma", train: 2084, val: 447, test: 446, color: "#e41a1c" },
  { name: "meningioma", train: 1176, val: 252, test: 252, color: "#377eb8" },
  { name: "no_tumor", train: 1193, val: 256, test: 255, color: "#4daf4a" },
  { name: "pituitary", train: 1059, val: 227, test: 226, color: "#984ea3" },
];

const DATA_SOURCES = [
  {
    name: "Nickparvar v2",
    images: 7200,
    afterDedup: 5414,
    license: "CC BY 4.0",
    desc: "Primary 4-class dataset (JPEG, 512x512). Contains FigShare/Cheng images converted from .mat.",
  },
  {
    name: "Mendeley 12K v5",
    images: 12054,
    afterDedup: "~2,000",
    license: "CC BY 4.0",
    desc: "Largest single source. 3,641 pre-baked augmentations stripped. Heavy overlap with Nickparvar after dedup.",
  },
  {
    name: "BRISC 2025",
    images: 6000,
    afterDedup: "~1,200",
    license: "CC BY 4.0",
    desc: "Curated 2025 publication. 5,653 radiologist-verified segmentation masks for Grad-CAM validation.",
  },
  {
    name: "Brain Tumor 2D",
    images: 3465,
    afterDedup: 2206,
    license: "MIT",
    desc: "Glioma subtypes (GBM, Astrocytoma) with paired masks. Used for L3 classification and Grad-CAM.",
  },
  {
    name: "UCSF-PDGM",
    images: "501 patients",
    afterDedup: "475 patients",
    license: "CDLA-Permissive-2.0",
    desc: "Clinical 3D NIfTI volumes (T1c/FLAIR/T2). 16,696 axial slices extracted for L3 glioma subtype classification.",
  },
];

const DEDUP_STATS = [
  { stage: "Raw images indexed", count: 29881 },
  { stage: "Mendeley augmentations stripped", count: 26240 },
  { stage: "Perceptual hash dedup (pHash 256-bit)", count: 9148 },
  { stage: "Cross-split label errors removed", count: 7873 },
];

const PIPELINE_STEPS = [
  { step: 1, name: "Index all images", desc: "Master CSV with file paths, classes, datasets" },
  { step: 2, name: "Strip augmentations", desc: "Remove 3,641 Mendeley pre-baked variants" },
  { step: 3, name: "Compute perceptual hashes", desc: "pHash + dHash at 256-bit for all 29,881 images" },
  { step: 4, name: "Cross-dataset dedup", desc: "LSH bucketing by class, 70,407 duplicate pairs found" },
  { step: 5, name: "Process Brain Tumor 2D", desc: "TIFF to PNG, class mapping, mask separation" },
  { step: 6, name: "UCSF-PDGM extraction", desc: "3D NIfTI to 2D slices (T1c/FLAIR/T2 as RGB)" },
  { step: 7, name: "Create splits", desc: "70/15/15 stratified, patient-level for PDGM" },
  { step: 8, name: "Resize to 240x240", desc: "LANCZOS for images, NEAREST for masks" },
  { step: 9, name: "Match masks", desc: "6,345 masks matched to classification images" },
  { step: 10, name: "Validation", desc: "Cross-split scan, class distributions, mask alignment" },
];

export default function Dataset() {
  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dataset & Processing</h1>
        <p className="text-muted-foreground">
          7,873 unique brain MRI images from 5 research datasets, deduplicated
          using perceptual hashing to prevent data leakage and inflated metrics.
        </p>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: Database, value: "29,881", label: "Raw images indexed" },
          { icon: Filter, value: "7,873", label: "After dedup" },
          { icon: GitBranch, value: "5", label: "Data sources" },
          { icon: CheckCircle, value: "6,345", label: "Tumor masks" },
        ].map(({ icon: Icon, value, label }) => (
          <div key={label} className="border rounded-lg p-4 text-center bg-card">
            <Icon className="h-5 w-5 mx-auto mb-1 text-primary" />
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      {/* Class distribution chart */}
      <div className="border rounded-lg p-6 bg-card">
        <h2 className="text-xl font-semibold mb-4">L2 Class Distribution</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={L2_DISTRIBUTION}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Bar dataKey="train" name="Train" stackId="a" fill="var(--chart-1)" />
            <Bar dataKey="val" name="Val" stackId="a" fill="var(--chart-2)" />
            <Bar dataKey="test" name="Test" stackId="a" fill="var(--chart-3)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Data sources */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Data Sources</h2>
        <div className="space-y-3">
          {DATA_SOURCES.map((src) => (
            <div key={src.name} className="border rounded-lg p-4 bg-card">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold">{src.name}</h3>
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span>Raw: {src.images}</span>
                  <span>After dedup: {src.afterDedup}</span>
                  <span className="px-2 py-0.5 bg-muted rounded">{src.license}</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{src.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Dedup funnel */}
      <div className="border rounded-lg p-6 bg-card">
        <h2 className="text-xl font-semibold mb-4">Deduplication Funnel</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Multiple datasets repackage the same underlying studies. Without dedup,
          training and testing on near-identical images inflates accuracy and
          creates data leakage.
        </p>
        <div className="space-y-2">
          {DEDUP_STATS.map((stat, i) => (
            <div key={stat.stage} className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                {i + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{stat.stage}</span>
                  <span className="font-bold">{stat.count.toLocaleString()}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 mt-1">
                  <div
                    className="bg-primary rounded-full h-2 transition-all"
                    style={{ width: `${(stat.count / 29881) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Processing pipeline */}
      <div className="border rounded-lg p-6 bg-card">
        <h2 className="text-xl font-semibold mb-4">10-Step Processing Pipeline</h2>
        <div className="grid grid-cols-2 gap-3">
          {PIPELINE_STEPS.map(({ step, name, desc }) => (
            <div key={step} className="flex gap-3 items-start">
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                {step}
              </div>
              <div>
                <div className="text-sm font-medium">{name}</div>
                <div className="text-xs text-muted-foreground">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
