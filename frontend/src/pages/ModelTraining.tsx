import { useQuery } from "@tanstack/react-query";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { api } from "@/api/client";

const HYPERPARAMS = [
  { param: "Input Size", value: "240 x 240" },
  { param: "Phase 1 (frozen)", value: "7 epochs, head LR 3e-4" },
  { param: "Phase 2 (fine-tune)", value: "Up to 43 epochs, cosine annealing" },
  { param: "Backbone LR", value: "3e-5" },
  { param: "Head LR", value: "3e-4" },
  { param: "Warmup", value: "5 epochs" },
  { param: "Early Stopping", value: "Patience 8 on val F1" },
  { param: "Optimizer", value: "AdamW (weight decay 1e-4)" },
  { param: "Label Smoothing", value: "0.1" },
  { param: "MixUp", value: "alpha = 0.2" },
  { param: "Class Balancing", value: "WeightedRandomSampler + weighted CE loss" },
  { param: "Seed", value: "42" },
];

const BACKBONE_COMPARISON = [
  {
    metric: "L2 CV Accuracy",
    s: "98.88% +/- 0.19%",
    b1: "97.85% +/- 0.29%",
  },
  {
    metric: "L2 CV Macro F1",
    s: "98.87% +/- 0.17%",
    b1: "97.84% +/- 0.29%",
  },
  {
    metric: "L2 Test Accuracy",
    s: "98.81%",
    b1: "98.22%",
  },
  {
    metric: "L3 CV Accuracy",
    s: "90.0% +/- 1.6%",
    b1: "87.9% +/- 1.9%",
  },
  {
    metric: "L3 CV Macro F1",
    s: "84.9% +/- 3.0%",
    b1: "82.5% +/- 3.3%",
  },
  {
    metric: "CPU Inference",
    s: "61 ms",
    b1: "33 ms",
  },
  {
    metric: "Parameters",
    s: "20.2M",
    b1: "6.9M",
  },
  {
    metric: "Checkpoint Size",
    s: "81.6 MB",
    b1: "26.5 MB",
  },
];

function TrainingCurves({ level, backbone }: { level: string; backbone: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["training-history", level, backbone],
    queryFn: () => api.getTrainingHistory(level, backbone),
  });

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading...</div>;
  if (!data) return null;

  // Use fold 0 for display
  const history = (data as Record<string, Array<Record<string, number>>>)["fold_0"];
  if (!history) return <div className="text-sm text-muted-foreground">No history data</div>;

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={history}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="epoch" label={{ value: "Epoch", position: "bottom", offset: -5 }} />
        <YAxis domain={[0, 1]} />
        <Tooltip
          contentStyle={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
          }}
          formatter={(value) => (Number(value) * 100).toFixed(1) + "%"}
        />
        <Legend />
        <Line type="monotone" dataKey="train_acc" name="Train Acc" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="val_acc" name="Val Acc" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="val_f1" name="Val F1" stroke="var(--chart-3)" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function LossCurves({ level, backbone }: { level: string; backbone: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["training-history", level, backbone],
    queryFn: () => api.getTrainingHistory(level, backbone),
  });

  if (isLoading || !data) return null;

  const history = (data as Record<string, Array<Record<string, number>>>)["fold_0"];
  if (!history) return null;

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={history}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="epoch" label={{ value: "Epoch", position: "bottom", offset: -5 }} />
        <YAxis />
        <Tooltip
          contentStyle={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
          }}
          formatter={(value) => Number(value).toFixed(4)}
        />
        <Legend />
        <Line type="monotone" dataKey="train_loss" name="Train Loss" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="val_loss" name="Val Loss" stroke="var(--chart-3)" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default function ModelTraining() {
  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <div>
        <h1 className="text-3xl font-bold mb-2">Model Architecture & Training</h1>
        <p className="text-muted-foreground">
          Two EfficientNetV2 backbones benchmarked with two-phase transfer learning
          and 5-fold cross-validation. Both deployed as user-selectable options.
        </p>
      </div>

      {/* Architecture overview */}
      <div className="border rounded-lg p-6 bg-card">
        <h2 className="text-xl font-semibold mb-4">Hierarchical Architecture</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="border rounded-lg p-4 text-center">
            <div className="text-sm text-muted-foreground mb-1">Level 1</div>
            <div className="font-bold">Tumor Detection</div>
            <div className="text-xs text-muted-foreground mt-1">
              Derived from L2: is the prediction "no_tumor" or not?
            </div>
          </div>
          <div className="border rounded-lg p-4 text-center border-primary/50">
            <div className="text-sm text-muted-foreground mb-1">Level 2</div>
            <div className="font-bold">Tumor Type (4-class)</div>
            <div className="text-xs text-muted-foreground mt-1">
              glioma, meningioma, pituitary, no_tumor
            </div>
          </div>
          <div className="border rounded-lg p-4 text-center border-primary/50">
            <div className="text-sm text-muted-foreground mb-1">Level 3</div>
            <div className="font-bold">Glioma Subtype (2-class)</div>
            <div className="text-xs text-muted-foreground mt-1">
              GBM vs Astrocytoma (runs only if L2 = glioma)
            </div>
          </div>
        </div>
        <div className="flex justify-center mt-4 gap-2 text-sm text-muted-foreground">
          <span>Input MRI</span>
          <span>-&gt;</span>
          <span className="font-medium text-foreground">L2 Model</span>
          <span>-&gt;</span>
          <span>If glioma</span>
          <span>-&gt;</span>
          <span className="font-medium text-foreground">L3 Model</span>
          <span>-&gt;</span>
          <span>Subtype</span>
        </div>
      </div>

      {/* Two-phase training */}
      <div className="border rounded-lg p-6 bg-card">
        <h2 className="text-xl font-semibold mb-4">Two-Phase Transfer Learning</h2>
        <div className="grid grid-cols-2 gap-6">
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Phase 1: Frozen Backbone</h3>
            <p className="text-sm text-muted-foreground">
              ImageNet-pretrained backbone is frozen. Only the classification head
              trains for 7 epochs. This lets the head stabilize before backbone
              gradients flow, preventing corruption of pretrained features.
            </p>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Phase 2: Full Fine-Tuning</h3>
            <p className="text-sm text-muted-foreground">
              All layers unfrozen with differential learning rates: backbone at 3e-5,
              head at 3e-4. Cosine annealing with 5-epoch warmup. Early stopping on
              validation macro F1 (patience 8).
            </p>
          </div>
        </div>
      </div>

      {/* Backbone comparison table */}
      <div className="border rounded-lg p-6 bg-card">
        <h2 className="text-xl font-semibold mb-4">Backbone Comparison</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 pr-4">Metric</th>
              <th className="text-right py-2 px-4 font-semibold text-primary">EfficientNetV2-S</th>
              <th className="text-right py-2 pl-4">EfficientNetV2-B1</th>
            </tr>
          </thead>
          <tbody>
            {BACKBONE_COMPARISON.map(({ metric, s, b1 }) => (
              <tr key={metric} className="border-b border-border/50">
                <td className="py-2 pr-4">{metric}</td>
                <td className="text-right py-2 px-4 font-medium">{s}</td>
                <td className="text-right py-2 pl-4 text-muted-foreground">{b1}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Training curves */}
      <div className="border rounded-lg p-6 bg-card">
        <h2 className="text-xl font-semibold mb-4">L2 Training Curves (EfficientNetV2-S, Fold 0)</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium mb-2">Accuracy</h3>
            <TrainingCurves level="l2" backbone="efficientnetv2_s" />
          </div>
          <div>
            <h3 className="text-sm font-medium mb-2">Loss</h3>
            <LossCurves level="l2" backbone="efficientnetv2_s" />
          </div>
        </div>
      </div>

      <div className="border rounded-lg p-6 bg-card">
        <h2 className="text-xl font-semibold mb-4">L3 Training Curves (EfficientNetV2-S, Fold 0)</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium mb-2">Accuracy</h3>
            <TrainingCurves level="l3" backbone="efficientnetv2_s" />
          </div>
          <div>
            <h3 className="text-sm font-medium mb-2">Loss</h3>
            <LossCurves level="l3" backbone="efficientnetv2_s" />
          </div>
        </div>
      </div>

      {/* Hyperparameters */}
      <div className="border rounded-lg p-6 bg-card">
        <h2 className="text-xl font-semibold mb-4">Hyperparameters</h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1">
          {HYPERPARAMS.map(({ param, value }) => (
            <div key={param} className="flex justify-between py-1.5 border-b border-border/30 text-sm">
              <span className="text-muted-foreground">{param}</span>
              <span className="font-medium">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
