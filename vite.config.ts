import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Repository path while using stephen644.github.io/offshoreplus/.
  // Change to "/" when offshoreplus.no is connected.
  base: "/offshoreplus/",
});
