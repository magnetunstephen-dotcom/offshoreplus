import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Repository path while using magnetunstephen-dotcom.github.io/offshoreplus/.
  // Change to "/" when offshoreplus.no is connected.
  base: "/offshoreplus/",
});
