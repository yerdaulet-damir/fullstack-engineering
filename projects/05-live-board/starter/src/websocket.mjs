import { createHash } from "node:crypto";
import { EventEmitter } from "node:events";

const WEBSOCKET_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

export function acceptWebSocket(request, socket, head, { protocol, maxPayloadBytes = 64 * 1024 } = {}) {
  const key = request.headers["sec-websocket-key"];
  const version = request.headers["sec-websocket-version"];
  const upgrade = request.headers.upgrade?.toLowerCase();
  const connection = request.headers.connection?.toLowerCase() ?? "";
  const offeredProtocols = (request.headers["sec-websocket-protocol"] ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (upgrade !== "websocket" || !connection.split(/\s*,\s*/).includes("upgrade") || version !== "13" || !validKey(key)) {
    rejectUpgrade(socket, 400, "Invalid WebSocket upgrade");
    return null;
  }
  if (protocol && !offeredProtocols.includes(protocol)) {
    rejectUpgrade(socket, 426, `WebSocket subprotocol ${protocol} is required`, {
      "Sec-WebSocket-Protocol": protocol
    });
    return null;
  }

  const accept = createHash("sha1").update(`${key}${WEBSOCKET_GUID}`).digest("base64");
  const headers = [
    "HTTP/1.1 101 Switching Protocols",
    "Upgrade: websocket",
    "Connection: Upgrade",
    `Sec-WebSocket-Accept: ${accept}`
  ];
  if (protocol) headers.push(`Sec-WebSocket-Protocol: ${protocol}`);
  socket.write(`${headers.join("\r\n")}\r\n\r\n`);

  return new WebSocketPeer(socket, { head, maxPayloadBytes });
}

export function rejectUpgrade(socket, status, message, extraHeaders = {}) {
  const body = `${message}\n`;
  const statusText = status === 401 ? "Unauthorized" : status === 426 ? "Upgrade Required" : "Bad Request";
  const headers = Object.entries(extraHeaders).map(([name, value]) => `${name}: ${value}`);
  socket.end([
    `HTTP/1.1 ${status} ${statusText}`,
    "Connection: close",
    "Content-Type: text/plain; charset=utf-8",
    `Content-Length: ${Buffer.byteLength(body)}`,
    ...headers,
    "",
    body
  ].join("\r\n"));
}

class WebSocketPeer extends EventEmitter {
  #socket;
  #buffer = Buffer.alloc(0);
  #closed = false;
  #maxPayloadBytes;

  constructor(socket, { head, maxPayloadBytes }) {
    super();
    this.#socket = socket;
    this.#maxPayloadBytes = maxPayloadBytes;
    socket.setNoDelay(true);
    socket.on("data", (chunk) => this.#consume(chunk));
    socket.on("error", (error) => this.#finish(error));
    socket.on("close", () => this.#finish());
    if (head?.length) queueMicrotask(() => this.#consume(head));
  }

  get closed() {
    return this.#closed;
  }

  sendJSON(value) {
    this.sendText(JSON.stringify(value));
  }

  sendText(text) {
    if (this.#closed) return false;
    this.#socket.write(encodeFrame(0x1, Buffer.from(text)));
    return true;
  }

  close(code = 1000, reason = "") {
    if (this.#closed) return;
    this.#closed = true;
    const safeReason = Buffer.from(reason).subarray(0, 123);
    const payload = Buffer.allocUnsafe(2 + safeReason.length);
    payload.writeUInt16BE(code, 0);
    safeReason.copy(payload, 2);
    this.#socket.end(encodeFrame(0x8, payload));
    this.emit("close", { code, reason: safeReason.toString() });
  }

  #consume(chunk) {
    if (this.#closed) return;
    this.#buffer = Buffer.concat([this.#buffer, chunk]);

    while (this.#buffer.length >= 2) {
      const first = this.#buffer[0];
      const second = this.#buffer[1];
      const final = (first & 0x80) !== 0;
      const reserved = first & 0x70;
      const opcode = first & 0x0f;
      const masked = (second & 0x80) !== 0;
      const lengthCode = second & 0x7f;
      let length = lengthCode;
      let offset = 2;

      if (reserved || !masked) return this.#protocolError("Client frames must be masked with no reserved bits");
      if (opcode >= 0x8 && (!final || lengthCode > 125)) {
        return this.#protocolError("Control frames must be final and contain at most 125 bytes");
      }
      if (!final) return this.#unsupported("Fragmented messages are not supported");

      if (length === 126) {
        if (this.#buffer.length < 4) return;
        length = this.#buffer.readUInt16BE(2);
        offset = 4;
      } else if (length === 127) {
        if (this.#buffer.length < 10) return;
        const largeLength = this.#buffer.readBigUInt64BE(2);
        if (largeLength > BigInt(Number.MAX_SAFE_INTEGER)) return this.#tooLarge();
        length = Number(largeLength);
        offset = 10;
      }

      if (length > this.#maxPayloadBytes) return this.#tooLarge();
      if (this.#buffer.length < offset + 4 + length) return;

      const mask = this.#buffer.subarray(offset, offset + 4);
      offset += 4;
      const payload = Buffer.from(this.#buffer.subarray(offset, offset + length));
      this.#buffer = this.#buffer.subarray(offset + length);
      for (let index = 0; index < payload.length; index += 1) payload[index] ^= mask[index % 4];

      if (opcode === 0x1) {
        try {
          const text = new TextDecoder("utf-8", { fatal: true }).decode(payload);
          this.emit("message", text);
        } catch {
          return this.#protocolError("Text message is not valid UTF-8", 1007);
        }
      } else if (opcode === 0x8) {
        if (payload.length === 1) return this.#protocolError("Close frames cannot contain a one-byte payload");
        const code = payload.length >= 2 ? payload.readUInt16BE(0) : 1000;
        const reason = payload.length > 2 ? payload.subarray(2).toString() : "";
        return this.close(code, reason);
      } else if (opcode === 0x9) {
        this.#socket.write(encodeFrame(0xA, payload));
      } else if (opcode !== 0xA) {
        return this.#unsupported("Only text messages are supported");
      }
    }
  }

  #protocolError(message, code = 1002) {
    this.close(code, message);
  }

  #unsupported(message) {
    this.close(1003, message);
  }

  #tooLarge() {
    this.close(1009, "Message exceeds the configured limit");
  }

  #finish(error) {
    if (this.#closed) return;
    this.#closed = true;
    this.emit("close", { code: 1006, reason: error?.message ?? "Socket closed" });
  }
}

function validKey(key) {
  if (typeof key !== "string") return false;
  try {
    return Buffer.from(key, "base64").length === 16;
  } catch {
    return false;
  }
}

function encodeFrame(opcode, payload) {
  const first = 0x80 | opcode;
  if (payload.length < 126) return Buffer.concat([Buffer.from([first, payload.length]), payload]);
  if (payload.length <= 65_535) {
    const header = Buffer.allocUnsafe(4);
    header[0] = first;
    header[1] = 126;
    header.writeUInt16BE(payload.length, 2);
    return Buffer.concat([header, payload]);
  }
  const header = Buffer.allocUnsafe(10);
  header[0] = first;
  header[1] = 127;
  header.writeBigUInt64BE(BigInt(payload.length), 2);
  return Buffer.concat([header, payload]);
}
