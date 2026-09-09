import { createCopilot } from "./app.js";

const query = process.argv.slice(2).join(" ").trim() || "How do I reset my password?";
const copilot = await createCopilot();

for await (const event of copilot.run(query)) console.log(JSON.stringify(event));
