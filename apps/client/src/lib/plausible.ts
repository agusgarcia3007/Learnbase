import { init } from "@plausible-analytics/tracker";

init({
  domain: import.meta.env.VITE_BASE_DOMAIN,
});
