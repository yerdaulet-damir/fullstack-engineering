import { ReconnectPolicy, validatedIdentity } from "./client-policy.js";

const columns = ["unassigned", "investigating", "waiting", "resolved"];
const storageKey = "relay-live-board-v1";
const identityKey = "relay-live-board-identity-v1";
const query = new URLSearchParams(location.search);
const token = query.get("token") ?? "local-development-token";
const identity = loadIdentity();
const stored = loadProjection();

const state = {
  cards: new Map((stored?.cards ?? []).map((card) => [card.id, card])),
  sequence: stored?.sequence ?? 0,
  hasProjection: Boolean(stored),
  pending: new Map(),
  agents: [],
  socket: null,
  reconnect: new ReconnectPolicy(),
  reconnectTimer: null,
  heartbeatTimer: null,
  deliberateClose: false
};

const elements = {
  board: document.querySelector("#board"),
  status: document.querySelector("#status"),
  sequence: document.querySelector("#sequence"),
  pending: document.querySelector("#pending"),
  presence: document.querySelector("#presence"),
  notice: document.querySelector("#notice"),
  columnTemplate: document.querySelector("#column-template"),
  cardTemplate: document.querySelector("#card-template")
};

render();
connect();
window.addEventListener("beforeunload", () => {
  state.deliberateClose = true;
  clearTimers();
  state.socket?.close(1000, "page closed");
});

function connect() {
  clearTimeout(state.reconnectTimer);
  setConnectionState(state.reconnect.attempt ? "recovering" : "connecting");
  const scheme = location.protocol === "https:" ? "wss" : "ws";
  const socket = new WebSocket(`${scheme}://${location.host}/ws?token=${encodeURIComponent(token)}`, "live-board.v1");
  state.socket = socket;

  socket.addEventListener("open", () => {
    socket.send(JSON.stringify({
      type: "hello",
      clientId: identity.clientId,
      name: identity.name,
      lastSequence: state.hasProjection ? state.sequence : null
    }));
    state.heartbeatTimer = setInterval(() => send({ type: "heartbeat" }), 5_000);
  });

  socket.addEventListener("message", ({ data }) => receive(JSON.parse(data)));
  socket.addEventListener("close", ({ code, reason }) => {
    clearInterval(state.heartbeatTimer);
    if (state.socket === socket) state.socket = null;
    if (state.deliberateClose) return;
    setConnectionState("offline");
    scheduleReconnect(code, reason);
  });
  socket.addEventListener("error", () => showNotice("The realtime connection failed.", "error"));
}

function receive(message) {
  if (message.type === "sync") {
    if (message.mode === "snapshot") replaceSnapshot(message.snapshot);
    else if (!applyEvents(message.events)) return requestSync();
    state.agents = message.presence;
    state.reconnect.markSessionReady();
    setConnectionState("live");
    showNotice(message.mode === "snapshot" ? "Projection replaced from a server snapshot." : `Resumed with ${message.events.length} missed event(s).`);
    render();
    retryPendingCommands();
    return;
  }
  if (message.type === "event") {
    if (!applyEvent(message.event)) return requestSync();
    settleCommand(message.event.commandId);
    render();
    return;
  }
  if (message.type === "command.ack") {
    if (message.event.sequence > state.sequence && !applyEvent(message.event)) return requestSync();
    settleCommand(message.event.commandId);
    showNotice("A retried command returned its original result.");
    render();
    return;
  }
  if (message.type === "command.rejected") {
    settleCommand(message.commandId);
    if (message.currentCard) state.cards.set(message.currentCard.id, message.currentCard);
    showNotice(`${message.code}: ${message.message}`, "error");
    render();
    return;
  }
  if (message.type === "presence") {
    state.agents = message.agents;
    renderPresence();
    return;
  }
  if (message.type === "protocol.error") showNotice(`${message.code}: ${message.message}`, "error");
}

function replaceSnapshot(snapshot) {
  state.cards = new Map(snapshot.cards.map((card) => [card.id, card]));
  state.sequence = snapshot.sequence;
  state.hasProjection = true;
  persistProjection();
}

function applyEvents(events) {
  for (const event of events) {
    if (!applyEvent(event)) return false;
    settleCommand(event.commandId);
  }
  return true;
}

function applyEvent(event) {
  if (event.sequence <= state.sequence) return true;
  if (event.sequence !== state.sequence + 1) return false;
  if (event.type === "card.moved") state.cards.set(event.card.id, event.card);
  state.sequence = event.sequence;
  state.hasProjection = true;
  persistProjection();
  return true;
}

function moveCard(cardId, column) {
  const card = state.cards.get(cardId);
  if (!card || card.column === column || state.pending.has(cardId)) return;
  if (!state.socket || state.socket.readyState !== WebSocket.OPEN) {
    return showNotice("Reconnect before moving a card.", "error");
  }
  const command = {
    type: "move",
    commandId: crypto.randomUUID(),
    cardId,
    column,
    expectedVersion: card.version
  };
  state.pending.set(cardId, command);
  send(command);
  render();
}

function settleCommand(commandId) {
  for (const [cardId, command] of state.pending) {
    if (command.commandId === commandId) state.pending.delete(cardId);
  }
}

function requestSync() {
  setConnectionState("recovering");
  send({ type: "sync.request", lastSequence: state.sequence });
}

function send(message) {
  if (state.socket?.readyState === WebSocket.OPEN) state.socket.send(JSON.stringify(message));
}

function retryPendingCommands() {
  for (const command of state.pending.values()) send(command);
}

function scheduleReconnect(code, reason) {
  const delay = state.reconnect.nextDelay();
  showNotice(`Socket closed (${code}${reason ? `: ${reason}` : ""}). Retrying in ${delay}ms.`, "error");
  state.reconnectTimer = setTimeout(connect, delay);
}

function setConnectionState(value) {
  elements.status.textContent = value;
  elements.status.dataset.state = value;
}

function showNotice(message, kind = "info") {
  elements.notice.textContent = message;
  elements.notice.dataset.kind = kind;
}

function render() {
  elements.sequence.textContent = String(state.sequence);
  elements.pending.textContent = String(state.pending.size);
  elements.board.replaceChildren(...columns.map(renderColumn));
  renderPresence();
}

function renderColumn(column) {
  const fragment = elements.columnTemplate.content.cloneNode(true);
  const section = fragment.querySelector(".column");
  const cards = [...state.cards.values()].filter((card) => card.column === column);
  section.dataset.column = column;
  section.querySelector("h2").textContent = column;
  section.querySelector(".count").textContent = String(cards.length);
  section.querySelector(".card-list").append(...cards.map(renderCard));
  section.addEventListener("dragover", (event) => { event.preventDefault(); section.dataset.over = "true"; });
  section.addEventListener("dragleave", () => { delete section.dataset.over; });
  section.addEventListener("drop", (event) => {
    event.preventDefault();
    delete section.dataset.over;
    moveCard(event.dataTransfer.getData("text/card-id"), column);
  });
  return fragment;
}

function renderCard(card) {
  const fragment = elements.cardTemplate.content.cloneNode(true);
  const article = fragment.querySelector(".card");
  article.dataset.cardId = card.id;
  article.dataset.pending = String(state.pending.has(card.id));
  article.draggable = !state.pending.has(card.id);
  article.querySelector(".card-id").textContent = card.id;
  article.querySelector(".priority").textContent = card.priority;
  article.querySelector(".priority").dataset.priority = card.priority;
  article.querySelector("h3").textContent = card.title;
  article.querySelector(".version").textContent = `v${card.version}`;
  const select = article.querySelector("select");
  for (const column of columns) {
    const option = document.createElement("option");
    option.value = column;
    option.textContent = column;
    option.selected = column === card.column;
    select.append(option);
  }
  select.disabled = state.pending.has(card.id);
  select.addEventListener("change", () => moveCard(card.id, select.value));
  article.addEventListener("dragstart", (event) => event.dataTransfer.setData("text/card-id", card.id));
  return fragment;
}

function renderPresence() {
  elements.presence.replaceChildren(...state.agents.map((agent) => {
    const item = document.createElement("li");
    item.textContent = agent.clientId === identity.clientId ? `${agent.name} · you` : agent.name;
    return item;
  }));
}

function loadIdentity() {
  let existing = null;
  try {
    existing = validatedIdentity(JSON.parse(localStorage.getItem(identityKey) ?? "null"));
  } catch {
    existing = null;
  }
  if (existing) return existing;
  const created = { clientId: crypto.randomUUID(), name: `Agent ${Math.floor(10 + Math.random() * 90)}` };
  localStorage.setItem(identityKey, JSON.stringify(created));
  return created;
}

function loadProjection() {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey) ?? "null");
    return Number.isInteger(value?.sequence) && Array.isArray(value?.cards) ? value : null;
  } catch {
    return null;
  }
}

function persistProjection() {
  localStorage.setItem(storageKey, JSON.stringify({ sequence: state.sequence, cards: [...state.cards.values()] }));
}

function clearTimers() {
  clearTimeout(state.reconnectTimer);
  clearInterval(state.heartbeatTimer);
}
