const form = document.querySelector("#question-form");
const question = document.querySelector("#question");
const answer = document.querySelector("#answer");
const status = document.querySelector("#status");
const sources = document.querySelector("#sources");
const grounding = document.querySelector("#grounding");
const groundedBadge = document.querySelector("#grounded-badge");
const runId = document.querySelector("#run-id");
const citations = document.querySelector("#citations");
const submit = form.querySelector('button[type="submit"]');

for (const button of document.querySelectorAll("[data-question]")) {
  button.addEventListener("click", () => {
    question.value = button.dataset.question;
    question.focus();
  });
}

function renderEvidence(items) {
  if (!items.length) {
    sources.innerHTML = "<p>No matching evidence. The copilot should refuse the request.</p>";
    return;
  }
  sources.replaceChildren(...items.map((item) => {
    const article = document.createElement("article");
    const heading = document.createElement("h3");
    const meta = document.createElement("p");
    const excerpt = document.createElement("p");
    heading.textContent = item.title;
    meta.className = "meta";
    meta.textContent = `${item.id} · ${item.version} · score ${item.score}`;
    excerpt.textContent = item.text;
    article.append(heading, meta, excerpt);
    return article;
  }));
}

function handleEvent(event) {
  if (event.type === "run.started") {
    answer.textContent = "";
    sources.innerHTML = "<p>Searching the approved corpus…</p>";
    grounding.hidden = true;
    citations.hidden = true;
    runId.textContent = `run ${event.runId}`;
    status.textContent = "Started";
  }
  if (event.type === "retrieval.started") status.textContent = "Retrieving";
  if (event.type === "retrieval.completed") {
    status.textContent = `Retrieved ${event.evidence.length} sources`;
    renderEvidence(event.evidence);
  }
  if (event.type === "response.delta") {
    status.textContent = "Streaming";
    answer.textContent += event.delta;
  }
  if (event.type === "response.completed") {
    status.textContent = "Complete";
    grounding.hidden = false;
    groundedBadge.textContent = event.output.grounded
      ? "Grounded answer"
      : "Refused: no evidence";
    citations.textContent = event.output.citations.length
      ? `Citations: ${event.output.citations.map((citation) => `${citation.documentId}@${citation.version}`).join(", ")}`
      : "Citations: none";
    citations.hidden = false;
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  submit.disabled = true;
  status.textContent = "Connecting";
  try {
    const response = await fetch("/api/answer", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query: question.value }),
    });
    if (!response.ok || !response.body) throw new Error((await response.json()).error?.message ?? "Request failed");
    const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
    let buffered = "";
    while (true) {
      const { value, done } = await reader.read();
      buffered += value ?? "";
      const lines = buffered.split("\n");
      buffered = lines.pop() ?? "";
      for (const line of lines) if (line) handleEvent(JSON.parse(line));
      if (done) break;
    }
  } catch (error) {
    status.textContent = "Failed";
    answer.textContent = error instanceof Error ? error.message : "The request failed.";
  } finally {
    submit.disabled = false;
  }
});
