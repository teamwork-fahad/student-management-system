import env from "./config/env.js";
import app from "./app.js";
import { ensureDbSchema } from "./config/ensureDbSchema.js";

const PORT = env.PORT;

app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  await ensureDbSchema();
});

