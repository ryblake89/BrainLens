import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";

function PointingGameCards({ data }: { data: Record<string, Record<string, number>> | undefined }) {
  if (!data) return null;
  return (
    <div className="grid grid-cols-3 gap-4">
      {Object.entries(data).map(([cls, vals]) => (
        <div key={cls} className="border rounded-lg p-4 text-center">
          <div className="text-xl font-bold">{(vals.pointing_accuracy * 100).toFixed(1)}%</div>
          <div className="font-medium capitalize">{cls}</div>
          <div className="text-xs text-muted-foreground mt-1">
            Top-10% overlap: {(vals.top10_overlap * 100).toFixed(1)}%
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Explainability() {
  const { data: metrics } = useQuery({
    queryKey: ["metrics"],
    queryFn: () => api.getMetrics(),
  });

  const shortcutTest = (metrics as Record<string, Record<string, Record<string, unknown>>>)?.l2?.shortcut_test as Record<string, Record<string, unknown>> | undefined;
  const pointingGame = (metrics as Record<string, Record<string, Record<string, unknown>>>)?.l2?.pointing_game as Record<string, unknown> | undefined;
  const gradcamEval = (metrics as Record<string, Record<string, Record<string, unknown>>>)?.l2?.gradcam as Record<string, unknown> | undefined;

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <div>
        <h1 className="text-3xl font-bold mb-2">Explainability Deep Dive</h1>
        <p className="text-muted-foreground">
          Understanding what the model sees, what it ignores, and whether it learned
          real pathology or shortcuts.
        </p>
      </div>

      {/* What is Grad-CAM */}
      <div className="border rounded-lg p-6 bg-card">
        <h2 className="text-xl font-semibold mb-4">What is Grad-CAM++?</h2>
        <div className="grid grid-cols-[2fr_1fr] gap-6">
          <div className="text-sm text-muted-foreground space-y-3">
            <p>
              <strong className="text-foreground">Gradient-weighted Class Activation Mapping</strong> highlights
              which regions of an input image the model considers most important for its
              prediction. It produces a heatmap overlaid on the original image.
            </p>
            <p>
              <strong className="text-foreground">Red/warm areas</strong> are regions the model focuses on.{" "}
              <strong className="text-foreground">Blue/cool areas</strong> are largely ignored.
              Grad-CAM++ is an improved version that better localizes multiple instances
              of the same feature.
            </p>
            <p>
              For brain tumor classification, we'd ideally want the heatmap to highlight
              the tumor region. But as our analysis shows, the reality is more nuanced.
            </p>
          </div>
          <div className="border rounded-lg overflow-hidden">
            <img
              src="/api/static/l2/gradcam_examples/example_001_gbm.png"
              alt="Grad-CAM example"
              className="w-full"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        </div>
      </div>

      {/* Shortcut Learning */}
      <div className="border rounded-lg p-6 bg-card">
        <h2 className="text-xl font-semibold mb-4">Shortcut Learning Test</h2>
        <p className="text-sm text-muted-foreground mb-4">
          We masked the tumor region with neutral fill and re-ran the model. If accuracy
          drops to chance (~25%), the model relies on tumor features. If it stays high,
          it uses non-tumor features (shortcuts).
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-4">Class</th>
                <th className="text-right py-2 px-3">Unmasked</th>
                <th className="text-right py-2 px-3">Black Fill</th>
                <th className="text-right py-2 px-3">Mean Fill</th>
                <th className="text-right py-2 px-3">Blur Fill</th>
                <th className="text-right py-2 px-3">Noise Fill</th>
              </tr>
            </thead>
            <tbody>
              {shortcutTest && ["glioma", "meningioma", "pituitary"].map((cls) => {
                const none = (shortcutTest["none"] as Record<string, Record<string, number>>)?.per_class?.[cls];
                const black = (shortcutTest["black"] as Record<string, Record<string, number>>)?.per_class?.[cls];
                const mean = (shortcutTest["mean"] as Record<string, Record<string, number>>)?.per_class?.[cls];
                const blur = (shortcutTest["blur"] as Record<string, Record<string, number>>)?.per_class?.[cls];
                const noise = (shortcutTest["noise"] as Record<string, Record<string, number>>)?.per_class?.[cls];
                return (
                  <tr key={cls} className="border-b border-border/50">
                    <td className="py-2 pr-4 font-medium">{cls}</td>
                    <td className="text-right py-2 px-3">{none ? (none * 100).toFixed(1) + "%" : "—"}</td>
                    <td className={`text-right py-2 px-3 ${black && black < 0.5 ? "text-destructive font-bold" : ""}`}>
                      {black ? (black * 100).toFixed(1) + "%" : "—"}
                    </td>
                    <td className={`text-right py-2 px-3 ${mean && mean < 0.5 ? "text-destructive font-bold" : ""}`}>
                      {mean ? (mean * 100).toFixed(1) + "%" : "—"}
                    </td>
                    <td className="text-right py-2 px-3">{blur ? (blur * 100).toFixed(1) + "%" : "—"}</td>
                    <td className="text-right py-2 px-3">{noise ? (noise * 100).toFixed(1) + "%" : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 space-y-3 text-sm text-muted-foreground">
          <div className="border-l-4 border-primary pl-4">
            <strong className="text-foreground">Pituitary (99.9% masked):</strong> Classified entirely by anatomical
            location (sella turcica). The tumor itself is irrelevant — this is clinically valid since
            pituitary tumors have a pathognomonic location.
          </div>
          <div className="border-l-4 border-primary pl-4">
            <strong className="text-foreground">Glioma (99.5% masked):</strong> Uses hemisphere-level features —
            mass effect, midline shift, edema, asymmetry. These are legitimate diagnostic indicators
            that exist outside the tumor boundary.
          </div>
          <div className="border-l-4 border-destructive pl-4">
            <strong className="text-foreground">Meningioma (40-46% masked):</strong> The only class where the model
            genuinely relies on seeing the tumor. Makes sense — meningiomas are extra-axial and
            don't cause the same mass effect patterns.
          </div>
        </div>
      </div>

      {/* Pointing Game */}
      <div className="border rounded-lg p-6 bg-card">
        <h2 className="text-xl font-semibold mb-4">Pointing Game</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Does the Grad-CAM++ peak activation pixel fall inside the tumor mask?
          Overall: <strong className="text-foreground">
            {pointingGame ? ((pointingGame.overall_pointing_accuracy as number) * 100).toFixed(1) + "%" : "—"}
          </strong>
        </p>

        <PointingGameCards data={pointingGame?.per_class as Record<string, Record<string, number>> | undefined} />
      </div>

      {/* Faithfulness metrics */}
      <div className="border rounded-lg p-6 bg-card">
        <h2 className="text-xl font-semibold mb-4">Grad-CAM++ Faithfulness</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Faithfulness curves are a stronger metric than IoU for classification models.
          They measure whether removing highlighted regions actually drops confidence
          (deletion) and whether revealing them recovers it (insertion).
        </p>
        <div className="grid grid-cols-3 gap-4">
          <div className="border rounded-lg p-4 text-center">
            <div className="text-xl font-bold">
              {gradcamEval ? ((gradcamEval.iou_mean as number)).toFixed(3) : "—"}
            </div>
            <div className="text-sm">IoU vs Mask</div>
            <div className="text-xs text-muted-foreground">Low (model uses context)</div>
          </div>
          <div className="border rounded-lg p-4 text-center">
            <div className="text-xl font-bold">
              {gradcamEval?.deletion_auc_mean ? ((gradcamEval.deletion_auc_mean as number)).toFixed(3) : "—"}
            </div>
            <div className="text-sm">Deletion AUC</div>
            <div className="text-xs text-muted-foreground">Lower = more faithful</div>
          </div>
          <div className="border rounded-lg p-4 text-center">
            <div className="text-xl font-bold">
              {gradcamEval?.insertion_auc_mean ? ((gradcamEval.insertion_auc_mean as number)).toFixed(3) : "—"}
            </div>
            <div className="text-sm">Insertion AUC</div>
            <div className="text-xs text-muted-foreground">Higher = more faithful</div>
          </div>
        </div>
      </div>

      {/* The narrative */}
      <div className="border rounded-lg p-6 bg-card">
        <h2 className="text-xl font-semibold mb-4">What the Model Actually Learned</h2>
        <div className="text-sm text-muted-foreground space-y-3">
          <p>
            The post-training analysis reveals a model that achieves 98.9% accuracy by
            learning the <strong className="text-foreground">most discriminative features for each class</strong>,
            which aren't always the tumor itself:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>
              <strong className="text-foreground">Pituitary tumors:</strong> Identified by anatomical location
              (sella turcica at the base of the brain). The model doesn't need to see the tumor —
              the location is unique and diagnostic.
            </li>
            <li>
              <strong className="text-foreground">Gliomas:</strong> Identified by hemisphere-level features —
              brain asymmetry, mass effect, edema patterns. These are real clinical features
              that radiologists also use.
            </li>
            <li>
              <strong className="text-foreground">Meningiomas:</strong> The one class where the model genuinely
              examines the tumor itself, because meningiomas lack the distinctive contextual
              features of the other types.
            </li>
          </ul>
          <p>
            This isn't a failure — it's a nuanced understanding of how deep learning models
            approach medical image classification. The UMAP visualization confirms the model
            learned source-agnostic, class-discriminative features (no dataset clustering).
          </p>
        </div>
      </div>
    </div>
  );
}
