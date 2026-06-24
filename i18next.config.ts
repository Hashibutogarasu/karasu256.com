import { defineConfig } from 'i18next-cli'

export default defineConfig({
  locales: [
    "en",
    "ja",
    "cn"
  ],
  extract: {
    input: "src/**/*.{js,jsx,ts,tsx}",
    output: "src/lib/i18n/locales/{{language}}/{{namespace}}.json"
  }
})