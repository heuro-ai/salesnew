// FIX: Replaced the original `process` type override with a namespace augmentation
// to ensure compatibility with Node.js environments like vite.config.ts.
// Also removed the `vite/client` reference that was causing a type resolution error.

// This file provides type definitions for environment variables
// that are injected into the client-side code via Vite's `define` feature.
declare namespace NodeJS {
  interface ProcessEnv {
    readonly API_KEY: string;
    readonly RAPIDAPI_KEY: string;
  }
}
