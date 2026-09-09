export const approvalUi = String.raw`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Production Operator</title>
    <style>
      :root { color-scheme: dark; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
      body { max-width: 920px; margin: 0 auto; padding: 32px 20px; background: #09090b; color: #e4e4e7; }
      h1 { margin-bottom: 4px; } .muted { color: #a1a1aa; }
      section { border: 1px solid #27272a; border-radius: 12px; padding: 18px; margin: 20px 0; background: #111113; }
      form, .actions { display: grid; gap: 12px; }
      label { display: grid; gap: 6px; color: #d4d4d8; }
      input, textarea, button { font: inherit; border-radius: 7px; border: 1px solid #3f3f46; padding: 10px; }
      input, textarea { color: #fafafa; background: #18181b; }
      button { cursor: pointer; color: #09090b; background: #a7f3d0; font-weight: 700; }
      button.secondary { color: #fafafa; background: #27272a; }
      button.danger { color: #fff; background: #991b1b; }
      button:disabled { cursor: not-allowed; opacity: .45; }
      pre { overflow: auto; padding: 14px; background: #09090b; border-radius: 8px; white-space: pre-wrap; }
      .digest { overflow-wrap: anywhere; color: #fde68a; }
      .actions { grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); }
      .hidden { display: none; }
    </style>
  </head>
  <body>
    <h1>Production Operator</h1>
    <p class="muted">Investigate first. Approve the exact proposal digest. Execute one idempotent write.</p>

    <section>
      <form id="create-form">
        <label>Account ID <input name="accountId" value="acct-100" required /></label>
        <label>Issue <textarea name="issue" required>Duplicate charge confirmed by support</textarea></label>
        <label>Refund amount in cents <input name="requestedAmountCents" type="number" min="1" max="10000" value="2500" required /></label>
        <button type="submit">Investigate and prepare proposal</button>
      </form>
    </section>

    <section id="review" class="hidden">
      <h2>Review</h2>
      <p>Status: <strong id="status"></strong></p>
      <p>Proposal digest: <span id="digest" class="digest"></span></p>
      <pre id="state"></pre>
      <label>Reviewer ID <input id="reviewer" value="operator@example.com" /></label>
      <div class="actions">
        <button id="approve">Approve exact proposal</button>
        <button id="execute" class="secondary">Execute approved write</button>
        <button id="reject" class="danger">Reject proposal</button>
        <button id="refresh" class="secondary">Refresh persisted state</button>
      </div>
    </section>

    <script type="module">
      let current = null;
      const review = document.querySelector('#review');
      const state = document.querySelector('#state');
      const status = document.querySelector('#status');
      const digest = document.querySelector('#digest');
      const reviewer = document.querySelector('#reviewer');

      function render(workflow) {
        current = workflow;
        review.classList.remove('hidden');
        status.textContent = workflow.status;
        digest.textContent = workflow.proposalDigest ?? 'none';
        state.textContent = JSON.stringify(workflow, null, 2);
        document.querySelector('#approve').disabled = workflow.status !== 'awaiting_approval';
        document.querySelector('#reject').disabled = workflow.status !== 'awaiting_approval';
        document.querySelector('#execute').disabled = !['approved', 'executing'].includes(workflow.status);
      }

      async function request(path, options = {}) {
        const response = await fetch(path, {
          ...options,
          headers: { 'content-type': 'application/json', ...(options.headers ?? {}) }
        });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error?.code + ': ' + body.error?.message);
        return body;
      }

      document.querySelector('#create-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        const values = Object.fromEntries(new FormData(event.currentTarget));
        values.requestedAmountCents = Number(values.requestedAmountCents);
        try { render(await request('/api/workflows', { method: 'POST', body: JSON.stringify(values) })); }
        catch (error) { alert(error.message); }
      });

      document.querySelector('#approve').addEventListener('click', async () => {
        try {
          render(await request('/api/workflows/' + current.id + '/approve', {
            method: 'POST',
            body: JSON.stringify({ reviewerId: reviewer.value, proposalDigest: current.proposalDigest })
          }));
        } catch (error) { alert(error.message); }
      });

      document.querySelector('#execute').addEventListener('click', async () => {
        try { render(await request('/api/workflows/' + current.id + '/execute', { method: 'POST', body: '{}' })); }
        catch (error) { alert(error.message); }
      });

      document.querySelector('#reject').addEventListener('click', async () => {
        const reason = prompt('Rejection reason');
        if (!reason) return;
        try {
          render(await request('/api/workflows/' + current.id + '/reject', {
            method: 'POST', body: JSON.stringify({ reviewerId: reviewer.value, reason })
          }));
        } catch (error) { alert(error.message); }
      });

      document.querySelector('#refresh').addEventListener('click', async () => {
        try { render(await request('/api/workflows/' + current.id)); }
        catch (error) { alert(error.message); }
      });
    </script>
  </body>
</html>`;
