import React from "react";
import ReactDOM from "react-dom/client";
import "bootstrap/dist/css/bootstrap.min.css";
import "./app.css";
import App from "./App.jsx";
import { buildShellIntegrationContext } from "./shellIntegration.js";

const shellContext = buildShellIntegrationContext({
  search: typeof window !== "undefined" ? window.location.search : "",
  storage: typeof window !== "undefined" ? window.localStorage : null,
  env: import.meta.env,
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App shellContext={shellContext} />
  </React.StrictMode>
);
