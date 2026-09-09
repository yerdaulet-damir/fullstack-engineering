import Fastify from "fastify";
import cookie from "@fastify/cookie";
import { randomUUID } from "node:crypto";

const page = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Issue tracker</title>
<style>body{font:16px system-ui;max-width:720px;margin:3rem auto;padding:0 1rem;color:#172033}input,button{font:inherit;padding:.6rem;margin:.25rem}li{margin:.75rem 0}.error{color:#a21}</style></head>
<body><main><h1>Private issue tracker</h1><form id="login"><label>Email <input name="email" type="email" value="alice@example.test" required></label><button>Sign in</button></form><section id="app" hidden><h2>Projects</h2><div id="projects"></div></section><p id="message" class="error" role="status"></p></main>
<script type="module">
const login=document.querySelector('#login'),area=document.querySelector('#app'),projects=document.querySelector('#projects'),message=document.querySelector('#message');
login.addEventListener('submit',async event=>{event.preventDefault();message.textContent='';const response=await fetch('/session',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:new FormData(login).get('email')})});if(!response.ok){message.textContent='Sign-in failed';return}login.hidden=true;area.hidden=false;await load()});
async function load(){const response=await fetch('/api/projects');if(!response.ok){message.textContent='Could not load projects';return}const data=await response.json();projects.innerHTML=data.map(project=>\`<article><h3>\${project.name}</h3><form data-id="\${project.id}"><input name="title" minlength="3" placeholder="Issue title" required><button>Create issue</button></form></article>\`).join('');}
projects.addEventListener('submit',async event=>{event.preventDefault();const form=event.target;const response=await fetch(\`/api/projects/\${form.dataset.id}/issues\`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({title:new FormData(form).get('title')})});message.textContent=response.ok?'Issue created':'Issue was rejected';if(response.ok)form.reset()});
</script></body></html>`;

export async function buildApp(store) {
  const app = Fastify({ logger: false });
  await app.register(cookie);
  app.setErrorHandler((error, request, reply) => reply.status(error.statusCode ?? 500).send({ error: { code: error.code ?? "INTERNAL_ERROR", message: error.message } }));

  const authenticate = async (request, reply) => {
    const userId = store.userForSession(request.cookies.session);
    if (!userId) return reply.status(401).send({ error: { code: "AUTHENTICATION_REQUIRED", message: "sign in first" } });
    request.userId = userId;
  };

  app.get("/", async (_request, reply) => reply.type("text/html").send(page));
  app.post("/session", { schema: { body: { type: "object", additionalProperties: false, required: ["email"], properties: { email: { type: "string", format: "email" } } } } }, async (request, reply) => {
    const session = store.signIn(request.body.email);
    if (!session) return reply.status(401).send({ error: { code: "INVALID_CREDENTIALS", message: "email was not recognized" } });
    reply.setCookie("session", session.sessionId, { httpOnly: true, sameSite: "strict", path: "/", secure: process.env.NODE_ENV === "production" });
    return { user: session.user };
  });
  app.get("/api/projects", { preHandler: authenticate }, async (request) => store.listProjects(request.userId));
  app.get("/api/projects/:projectId", { preHandler: authenticate }, async (request) => store.getProject(request.userId, request.params.projectId));
  app.post("/api/projects/:projectId/issues", {
    preHandler: authenticate,
    schema: { body: { type: "object", additionalProperties: false, required: ["title"], properties: { title: { type: "string", minLength: 3, maxLength: 160 } } } }
  }, async (request, reply) => reply.status(201).send(store.createIssue(request.userId, request.params.projectId, request.body.title)));
  app.post("/api/projects/:projectId/attachments/prepare", {
    preHandler: authenticate,
    schema: { body: { type: "object", additionalProperties: false, required: ["contentType"], properties: { contentType: { type: "string", enum: ["image/png", "image/jpeg", "application/pdf"] } } } }
  }, async (request) => {
    store.ownedProject(request.userId, request.params.projectId);
    return { objectUrl: `/uploads/${randomUUID()}`, contentType: request.body.contentType, maxBytes: 5_000_000, expiresInSeconds: 300 };
  });
  await app.ready();
  return app;
}
