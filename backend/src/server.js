import dotenv from "dotenv";
import app from "./app.js";
import env from "./config/env.js";

dotenv.config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

console.log(env);