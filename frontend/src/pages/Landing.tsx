import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Brain, Play, Database, BarChart3 } from "lucide-react";
import { api } from "@/api/client";

function ImageSlideshow() {
  const { data } = useQuery({
    queryKey: ["gallery"],
    queryFn: () => api.getSamples(),
  });

  // Combine gallery images and showcase images into one strip
  const galleryUrls = (data?.samples ?? []).map(
    (s) => `/api${s.image_url.replace("/api", "")}`
  );
  // Add showcase images from manifest
  const showcaseUrls = Array.from({ length: 12 }, (_, i) =>
    `/api/samples/showcase_${String(i).padStart(3, "0")}/image.jpg`
  );

  const allUrls = [...galleryUrls, ...showcaseUrls];
  if (allUrls.length === 0) return null;

  // Duplicate for seamless loop
  const doubled = [...allUrls, ...allUrls];

  return (
    <div className="relative overflow-hidden my-10">
      {/* Fade edges */}
      <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-background to-transparent z-10" />
      <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-background to-transparent z-10" />

      <div className="flex gap-3 animate-scroll">
        {doubled.map((url, i) => (
          <img
            key={i}
            src={url}
            alt=""
            className="w-20 h-20 rounded-lg object-cover shrink-0 opacity-70 hover:opacity-100 transition-opacity"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ))}
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero */}
      <div className="text-center py-12">
        <div className="flex justify-center mb-6">
          <Brain className="h-16 w-16 text-primary" />
        </div>
        <h1 className="text-5xl font-bold tracking-tight mb-4">BrainLens</h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Brain tumor classification from MRI scans with real-time Grad-CAM++
          explainability. See what the model sees.
        </p>
        <Link
          to="/demo"
          className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-lg text-lg font-medium hover:opacity-90 transition-opacity"
        >
          <Play className="h-5 w-5" />
          Try It Yourself
        </Link>
      </div>

      {/* Ambient scrolling image strip */}
      <ImageSlideshow />

      {/* Key Stats */}
      <div className="grid grid-cols-4 gap-4 mb-16">
        {[
          { value: "98.9%", label: "Accuracy", sub: "5-fold CV" },
          { value: "7,873", label: "Images", sub: "Deduplicated" },
          { value: "5", label: "Datasets", sub: "Multi-source" },
          { value: "2", label: "Models", sub: "L2 + L3" },
        ].map(({ value, label, sub }) => (
          <div
            key={label}
            className="border rounded-lg p-6 text-center bg-card"
          >
            <div className="text-3xl font-bold text-primary">{value}</div>
            <div className="text-sm font-medium mt-1">{label}</div>
            <div className="text-xs text-muted-foreground">{sub}</div>
          </div>
        ))}
      </div>

      {/* Features */}
      <div className="grid grid-cols-3 gap-6 mb-16">
        {[
          {
            icon: Play,
            title: "Interactive Demo",
            desc: "Upload any brain MRI or pick from our gallery. Get instant classification with Grad-CAM heatmaps.",
            link: "/demo",
          },
          {
            icon: Database,
            title: "Rigorous Data Pipeline",
            desc: "15,000+ raw images deduplicated to 7,873 unique scans using perceptual hashing across 5 research datasets.",
            link: "/dataset",
          },
          {
            icon: BarChart3,
            title: "Deep Evaluation",
            desc: "5-fold cross-validation, shortcut learning detection, calibration analysis, and cross-domain testing.",
            link: "/results",
          },
        ].map(({ icon: Icon, title, desc, link }) => (
          <Link
            key={title}
            to={link}
            className="border rounded-lg p-6 bg-card hover:border-primary/50 transition-colors"
          >
            <Icon className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground">{desc}</p>
          </Link>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="text-center text-xs text-muted-foreground border-t pt-6">
        This is an educational and portfolio project. It is not intended for
        clinical diagnosis and has not been validated for medical use.
      </div>
    </div>
  );
}
