import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { api } from "@/api/client";

const CLASS_COLORS = ["#e41a1c", "#377eb8", "#4daf4a", "#984ea3"];
const L2_CLASSES = ["glioma", "meningioma", "no_tumor", "pituitary"];

export default function Results() {
  const { data: metrics } = useQuery({
    queryKey: ["metrics"],
    queryFn: () => api.getMetrics(),
  });

  const l2Test = (metrics as Record<string, Record<string, Record<string, unknown>>>)?.l2?.test as Record<string, unknown> | undefined;
  const l3Test = (metrics as Record<string, Record<string, Record<string, unknown>>>)?.l3?.test as Record<string, unknown> | undefined;
  const l2CvS = (metrics as Record<string, Record<string, Record<string, unknown>>>)?.l2?.cv_s as Record<string, unknown> | undefined;
  const l3CvS = (metrics as Record<string, Record<string, Record<string, unknown>>>)?.l3?.cv_s as Record<string, unknown> | undefined;

  // Build per-class metrics for bar chart
  const classReport = l2Test?.classification_report as Record<string, Record<string, number>> | undefined;
  const perClassData = classReport
    ? L2_CLASSES.map((cls, i) => ({
        name: cls.replace("_", " "),
        precision: +(classReport[cls]?.precision * 100).toFixed(1),
        recall: +(classReport[cls]?.recall * 100).toFixed(1),
        f1: +(classReport[cls]?.["f1-score"] * 100).toFixed(1),
        color: CLASS_COLORS[i],
      }))
    : [];

  // CV fold data for bar chart
  const cvFolds = l2CvS?.folds as Array<{ fold: number; accuracy: number; f1_macro: number }> | undefined;
  const foldData = cvFolds?.map((f) => ({
    name: `Fold ${f.fold}`,
    accuracy: +(f.accuracy * 100).toFixed(2),
    f1: +(f.f1_macro * 100).toFixed(2),
  }));

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <div>
        <h1 className="text-3xl font-bold mb-2">Results & Evaluation</h1>
        <p className="text-muted-foreground">
          Comprehensive evaluation with 5-fold cross-validation, held-out test sets,
          and multiple analysis dimensions.
        </p>
      </div>

      {/* Headline metrics */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { value: l2CvS ? `${((l2CvS.accuracy_mean as number) * 100).toFixed(1)}%` : "—", label: "L2 CV Accuracy", sub: `+/- ${l2CvS ? ((l2CvS.accuracy_std as number) * 100).toFixed(2) : "—"}%` },
          { value: l2Test ? `${((l2Test.test_accuracy as number) * 100).toFixed(1)}%` : "—", label: "L2 Test Accuracy", sub: "Held-out" },
          { value: l3CvS ? `${((l3CvS.accuracy_mean as number) * 100).toFixed(1)}%` : "—", label: "L3 CV Accuracy", sub: `+/- ${l3CvS ? ((l3CvS.accuracy_std as number) * 100).toFixed(2) : "—"}%` },
          { value: l3Test ? `${((l3Test.test_accuracy as number) * 100).toFixed(1)}%` : "—", label: "L3 Test Accuracy", sub: "Held-out" },
        ].map(({ value, label, sub }) => (
          <div key={label} className="border rounded-lg p-4 text-center bg-card">
            <div className="text-2xl font-bold text-primary">{value}</div>
            <div className="text-sm font-medium">{label}</div>
            <div className="text-xs text-muted-foreground">{sub}</div>
          </div>
        ))}
      </div>

      {/* 5-fold CV results */}
      {foldData && (
        <div className="border rounded-lg p-6 bg-card">
          <h2 className="text-xl font-semibold mb-4">5-Fold Cross-Validation (L2, EfficientNetV2-S)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={foldData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" />
              <YAxis domain={[95, 100]} />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                }}
                formatter={(value) => Number(value).toFixed(2) + "%"}
              />
              <Legend />
              <Bar dataKey="accuracy" name="Accuracy" fill="var(--chart-1)" />
              <Bar dataKey="f1" name="Macro F1" fill="var(--chart-2)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Per-class metrics */}
      {perClassData.length > 0 && (
        <div className="border rounded-lg p-6 bg-card">
          <h2 className="text-xl font-semibold mb-4">Per-Class Metrics (L2 Test Set)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={perClassData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" domain={[90, 100]} />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                }}
                formatter={(value) => Number(value).toFixed(1) + "%"}
              />
              <Legend />
              <Bar dataKey="precision" name="Precision" fill="var(--chart-1)" />
              <Bar dataKey="recall" name="Recall" fill="var(--chart-2)" />
              <Bar dataKey="f1" name="F1" fill="var(--chart-3)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Confusion matrix image */}
      <div className="border rounded-lg p-6 bg-card">
        <h2 className="text-xl font-semibold mb-4">Confusion Matrix (L2 Test Set)</h2>
        <div className="flex justify-center">
          <img
            src="/api/static/l2/confusion_matrix_test.png"
            alt="L2 Confusion Matrix"
            className="max-w-lg rounded-lg"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      </div>

      {/* UMAP visualization */}
      <div className="border rounded-lg p-6 bg-card">
        <h2 className="text-xl font-semibold mb-4">Feature Space Visualization (UMAP)</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Penultimate-layer features (1,280 dimensions) reduced to 2D. Left: colored by class
          (clean separation). Right: colored by source dataset (no dataset-specific clustering —
          the model learned class features, not dataset artifacts).
        </p>
        <div className="flex justify-center">
          <img
            src="/api/static/l2/umap_combined.png"
            alt="UMAP visualization"
            className="max-w-full rounded-lg"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      </div>

      {/* Cross-domain results */}
      <div className="border rounded-lg p-6 bg-card">
        <h2 className="text-xl font-semibold mb-4">Cross-Domain Generalization (L3)</h2>
        <p className="text-sm text-muted-foreground mb-4">
          The L3 model trained on UCSF-PDGM clinical data (3-channel T1c/FLAIR/T2) was
          evaluated on Brain Tumor 2D images (single-modality JPEGs). Result: <strong>3% accuracy</strong> —
          essentially random. This demonstrates the well-known domain shift problem in medical
          imaging and validates the decision to train L3 on a single data source.
        </p>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="border rounded-lg p-4">
            <div className="text-2xl font-bold text-primary">90.4%</div>
            <div className="text-sm">In-domain (UCSF-PDGM test)</div>
          </div>
          <div className="border rounded-lg p-4">
            <div className="text-2xl font-bold text-destructive">3.0%</div>
            <div className="text-sm">Cross-domain (BT2D)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
