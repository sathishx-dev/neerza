---
description: Build and prepare the project for production deployment
---

# Deploy Workflow

Follow these steps to prepare the project for production.

1. Install all dependencies
// turbo
```bash
npm install
```

2. Build the frontend assets
// turbo
```bash
npm run build
```

3. (Optional) Run migrations if needed
// turbo
```bash
node migrateDb.mjs
```

4. Verify the build
// turbo
```bash
ls dist/index.html
```

5. Start the production server
```bash
npm start
```
