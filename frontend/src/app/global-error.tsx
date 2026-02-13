"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Error:", error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0f172a",
          color: "white",
          fontFamily: "system-ui, sans-serif",
          padding: "2rem",
        }}>
          <div style={{ textAlign: "center", maxWidth: "500px" }}>
            <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
              Application Error
            </h1>
            <p style={{ color: "#94a3b8", marginBottom: "1.5rem" }}>
              A critical error occurred. Please try refreshing the page.
            </p>
            <div style={{
              padding: "1rem",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              borderRadius: "0.5rem",
              marginBottom: "1.5rem",
              textAlign: "left",
            }}>
              <code style={{ color: "#f87171", fontSize: "0.875rem", wordBreak: "break-all" }}>
                {error.message}
              </code>
            </div>
            <button
              onClick={reset}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "0.5rem",
                cursor: "pointer",
                fontSize: "1rem",
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
