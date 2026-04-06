export default function SystemArchitecture() {
  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <div>
        <h1 className="text-3xl font-bold mb-2">System Architecture</h1>
        <p className="text-muted-foreground">
          Full-stack deployment: FastAPI backend with PyTorch inference, React frontend,
          Docker Compose, deployed to DigitalOcean with Cloudflare DNS.
        </p>
      </div>

      {/* Architecture overview */}
      <div className="border rounded-lg p-6 bg-card">
        <h2 className="text-xl font-semibold mb-4">Infrastructure</h2>
        <div className="flex items-center justify-center gap-3 text-sm flex-wrap">
          {[
            { label: "User Browser", bg: "bg-muted" },
            { label: "->", bg: "" },
            { label: "Cloudflare CDN + SSL", bg: "bg-blue-50 border-blue-200" },
            { label: "->", bg: "" },
            { label: "DigitalOcean Droplet", bg: "bg-green-50 border-green-200" },
          ].map((item, i) => (
            item.label === "->" ? (
              <span key={i} className="text-muted-foreground">-&gt;</span>
            ) : (
              <div key={i} className={`border rounded-lg px-4 py-2 font-medium ${item.bg}`}>
                {item.label}
              </div>
            )
          ))}
        </div>
        <div className="mt-6 border rounded-lg p-4">
          <div className="text-sm font-medium mb-3 text-center">Docker Compose Stack</div>
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-lg p-4 bg-muted/30">
              <div className="font-semibold mb-2">Frontend Container</div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Nginx (Alpine) on port 3000</div>
                <div>Serves built React app (static files)</div>
                <div>Proxies /api/* to backend container</div>
                <div>SPA fallback (try_files)</div>
              </div>
            </div>
            <div className="border rounded-lg p-4 bg-muted/30">
              <div className="font-semibold mb-2">API Container</div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Python 3.12 + FastAPI + uvicorn on port 8000</div>
                <div>PyTorch models loaded at startup (~200MB RAM)</div>
                <div>Grad-CAM++ computed on demand</div>
                <div>No GPU required (CPU inference: 33-61ms)</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tech stack */}
      <div className="border rounded-lg p-6 bg-card">
        <h2 className="text-xl font-semibold mb-4">Tech Stack</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-2">Backend</h3>
            <div className="space-y-1 text-sm text-muted-foreground">
              {[
                "Python 3.12",
                "FastAPI 0.115",
                "PyTorch 2.11 (CPU)",
                "timm (EfficientNetV2-B1)",
                "torchvision (EfficientNetV2-S)",
                "pytorch-grad-cam",
                "Pillow / NumPy",
                "uvicorn",
              ].map((t) => (
                <div key={t} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  {t}
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Frontend</h3>
            <div className="space-y-1 text-sm text-muted-foreground">
              {[
                "React 19 + TypeScript",
                "Vite 8 (build tool)",
                "Tailwind CSS 4",
                "shadcn/ui components",
                "Recharts (interactive charts)",
                "React Router 7",
                "TanStack Query (data fetching)",
                "Lucide React (icons)",
              ].map((t) => (
                <div key={t} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-chart-2 shrink-0" />
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* API endpoints */}
      <div className="border rounded-lg p-6 bg-card">
        <h2 className="text-xl font-semibold mb-4">API Endpoints</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 pr-4 w-24">Method</th>
              <th className="text-left py-2 pr-4">Path</th>
              <th className="text-left py-2">Description</th>
            </tr>
          </thead>
          <tbody>
            {[
              { method: "POST", path: "/predict", desc: "Upload image -> L2 classification + L3 subtype (if glioma) + Grad-CAM++ heatmap" },
              { method: "GET", path: "/samples", desc: "List pre-computed gallery images with predictions for both backbones" },
              { method: "GET", path: "/samples/{id}/image.jpg", desc: "Serve gallery image" },
              { method: "GET", path: "/samples/{id}/gradcam/{backbone}.png", desc: "Serve pre-computed Grad-CAM overlay" },
              { method: "GET", path: "/metrics", desc: "All training results: CV scores, test metrics, calibration, shortcut analysis" },
              { method: "GET", path: "/metrics/training-history/{level}/{backbone}", desc: "Per-epoch training curves for all folds" },
              { method: "GET", path: "/health", desc: "Health check with loaded model list" },
            ].map(({ method, path, desc }) => (
              <tr key={path} className="border-b border-border/50">
                <td className="py-2 pr-4">
                  <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                    method === "POST" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                  }`}>
                    {method}
                  </span>
                </td>
                <td className="py-2 pr-4 font-mono text-xs">{path}</td>
                <td className="py-2 text-muted-foreground">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Data pipeline */}
      <div className="border rounded-lg p-6 bg-card">
        <h2 className="text-xl font-semibold mb-4">Data Processing Pipeline</h2>
        <div className="grid grid-cols-5 gap-2 text-center text-xs">
          {[
            { label: "5 Datasets", sub: "29,881 images" },
            { label: "Dedup", sub: "pHash 256-bit" },
            { label: "7,873 unique", sub: "+ 16,696 slices" },
            { label: "Train Models", sub: "5-fold CV" },
            { label: "Deploy", sub: "Docker + DO" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="border rounded-lg p-3 flex-1 bg-muted/30">
                <div className="font-semibold text-foreground">{item.label}</div>
                <div className="text-muted-foreground">{item.sub}</div>
              </div>
              {i < 4 && <span className="text-muted-foreground shrink-0">-&gt;</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Design decisions */}
      <div className="border rounded-lg p-6 bg-card">
        <h2 className="text-xl font-semibold mb-4">Key Design Decisions</h2>
        <div className="space-y-3 text-sm">
          {[
            {
              decision: "CPU-only inference on the droplet",
              rationale: "EfficientNetV2-S runs at 61ms on CPU — fast enough for interactive demo. Avoids GPU droplet costs ($50+/mo vs $6/mo).",
            },
            {
              decision: "Two backbones deployed, user-selectable",
              rationale: "Demonstrates architecture benchmarking. Users can see the accuracy/speed tradeoff firsthand.",
            },
            {
              decision: "Gallery images pre-computed",
              rationale: "Predictions and Grad-CAM cached at build time. Gallery loads instantly with no model inference.",
            },
            {
              decision: "No database",
              rationale: "All data is static (models, results, gallery). File-based serving is simpler and sufficient.",
            },
            {
              decision: "Hierarchical L2 -> L3 classification",
              rationale: "L1 (tumor/no_tumor) derived from L2 output. L3 runs only if L2 predicts glioma. Mirrors clinical workflow.",
            },
          ].map(({ decision, rationale }) => (
            <div key={decision} className="border-l-4 border-primary/30 pl-4">
              <div className="font-medium text-foreground">{decision}</div>
              <div className="text-muted-foreground">{rationale}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Source */}
      <div className="text-center text-sm text-muted-foreground border-t pt-6">
        Built by Ryan Blake | MS Artificial Intelligence, UT Austin |{" "}
        <a href="https://github.com/ryblake89" className="text-primary hover:underline">
          GitHub
        </a>
      </div>
    </div>
  );
}
