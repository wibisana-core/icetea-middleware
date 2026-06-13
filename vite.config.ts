import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { resolve } from "path";

export default defineConfig({
  publicDir: false,
  plugins: [dts({ include: ["src"], rollupTypes: true })],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "Ice Tea Middleware",
      fileName: "index",
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      external: ["next"],
    },
    target: "es2020",
    ssr: true,
  },
});
