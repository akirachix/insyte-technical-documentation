import { defineConfig } from "vitepress";
const base = process.env.GITHUB_ACTIONS ? "/insyte-technical-documentation/" : "/";
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? "/insyte-technical-documentation/" : "/",
  title: "Vesper Docs",
  description: "Technical documentation for Vesper, satellite night-light intelligence for Lake Kariba",
  lang: "en-GB",
  cleanUrls: false,
  lastUpdated: true,
  head: [["link", { rel: "icon", type: "image/png", href: `${base}logo.png` }]],
  themeConfig: {
    logo: "/logo.png",
    siteTitle: false,
    nav: [
      { text: "Home", link: "/" },
      { text: "Documentation", link: "/overview" },
    ],
    sidebar: [
      {
        text: "Documentation",
        items: [
          { text: "Overview", link: "/overview" },
          { text: "Architecture", link: "/architecture/overview" },
          {
            text: "Backend",
            collapsed: false,
            items: [
              { text: "Backend Overview", link: "/backend/overview" },
              { text: "API Reference", link: "/backend/api" },
              { text: "Database", link: "/backend/database" },
              { text: "Detection Pipeline", link: "/backend/detection" },
            ],
          },
          { text: "Frontend Web", link: "/frontend-web/overview" },
          { text: "Frontend Mobile", link: "/frontend-mobile/overview" },
          { text: "Security", link: "/security/overview" },
          { text: "Deployment", link: "/deployment/overview" },
        ],
      },
    ],
    outline: { level: [2, 3], label: "On this page" },
    search: { provider: "local" },
    docFooter: { prev: "Previous", next: "Next" },
    footer: {
      message: "Built for the patrol teams of Lake Kariba",
      copyright: "Copyright © 2026 Insyte Team",
    },
  },
});
