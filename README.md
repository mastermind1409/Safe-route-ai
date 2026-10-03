# React + TypeScript + Vite

## SafeRoute AI safety assistant

The route insight panel and nearby-hazard alerts use the route and report data already available in the app. The optional chat assistant is served through a Netlify Function so the AI provider key is never included in the browser bundle.

To enable chat on Netlify:

1. Deploy the project from its Git repository with the included `netlify.toml` and `netlify/functions` directory. Uploading only the generated `dist` folder does not deploy serverless functions.
2. In Netlify site settings, add `OPENAI_API_KEY` as a secret environment variable scoped to Functions.
3. Optionally set `OPENAI_MODEL` to a model available to the configured API key; the default is `gpt-4o-mini`.
4. Trigger a new deploy after setting the environment variable.

The assistant sends the current route summary, mapped hazard labels/severities, and chat text to the configured AI provider. It does not send GPS coordinates. Do not enter personal or emergency information into chat. The assistant does not verify live conditions or contact emergency services.

Without `OPENAI_API_KEY`, the route insights and location-based hazard warnings continue to work, while chat displays a configuration message.

The function applies input limits and a best-effort per-instance request throttle. Because serverless instances do not share memory, also configure provider spending limits and platform-level rate limiting before using this on a public production site.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
