const API_PREFIX = "/api";

class ApiError extends Error {
  status: number;
  statusText: string;
  detail?: string;

  constructor(status: number, statusText: string, detail?: string) {
    super(detail || statusText);
    this.status = status;
    this.statusText = statusText;
    this.detail = detail;
  }
}

async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_PREFIX}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    let detail: string | undefined;
    try {
      detail = (await res.json()).detail;
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, res.statusText, detail);
  }
  return res.json();
}

export interface ClassProbabilities {
  prediction: string;
  confidence: number;
  probabilities: Record<string, number>;
}

export interface PredictionResult {
  l2: ClassProbabilities;
  l3: ClassProbabilities | null;
  gradcam_b64: string;
  ood_score: number;
  ood_flag: boolean;
  inference_time_ms: number;
  backbone: string;
  disclaimer: string;
}

export interface GallerySample {
  id: string;
  class_label: string;
  image_url: string;
  predictions: Record<
    string,
    {
      l2: ClassProbabilities;
      l3: ClassProbabilities | null;
      gradcam_url: string;
      inference_time_ms: number;
    }
  >;
  is_failure_case: boolean;
  notes: string | null;
}

export const api = {
  predict: async (
    file: File,
    backbone = "efficientnetv2_s"
  ): Promise<PredictionResult> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("backbone", backbone);
    const res = await fetch(`${API_PREFIX}/predict`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new ApiError(res.status, res.statusText);
    return res.json();
  },

  getSamples: () =>
    apiFetch<{ samples: GallerySample[] }>("/samples"),

  getMetrics: () =>
    apiFetch<Record<string, unknown>>("/metrics"),

  getTrainingHistory: (level: string, backbone: string) =>
    apiFetch<Record<string, unknown[]>>(
      `/metrics/training-history/${level}/${backbone}`
    ),
};
