import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import Landing from "./pages/Landing";
import Demo from "./pages/Demo";
import Dataset from "./pages/Dataset";
import ModelTraining from "./pages/ModelTraining";
import Results from "./pages/Results";
import Explainability from "./pages/Explainability";
import SystemArchitecture from "./pages/SystemArchitecture";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Landing />} />
          <Route path="demo" element={<Demo />} />
          <Route path="dataset" element={<Dataset />} />
          <Route path="model" element={<ModelTraining />} />
          <Route path="results" element={<Results />} />
          <Route path="explainability" element={<Explainability />} />
          <Route path="architecture" element={<SystemArchitecture />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
