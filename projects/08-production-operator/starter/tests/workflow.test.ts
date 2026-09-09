import assert from "node:assert/strict";
import test from "node:test";
import { proposalDigest } from "../src/canonical.js";
import { CrashAfterWriteError, OperatorError } from "../src/errors.js";
import { JsonRefundGateway } from "../src/refund-gateway.js";
import { FileOperatorStore } from "../src/store.js";
import { OperatorService } from "../src/workflow.js";
import { createDemoToolRegistry } from "../src/demo-tools.js";
import { createHarness, prepareWorkflow } from "./helpers.js";

test("write execution requires approval bound to the exact proposal digest", async () => {
  const { service, gateway } = await createHarness();
  const prepared = await prepareWorkflow(service);

  await assert.rejects(() => service.execute(prepared.id), /exact approval/);
  await assert.rejects(
    () => service.approve(prepared.id, "reviewer-1", `changed-${prepared.proposalDigest}`),
    /exact current proposal/
  );
  assert.equal(await gateway.count(), 0);

  const approved = await service.approve(prepared.id, "reviewer-1", prepared.proposalDigest!);
  assert.equal(approved.approval?.proposalDigest, prepared.proposalDigest);
  const completed = await service.execute(prepared.id);
  assert.equal(completed.status, "completed");
  assert.equal(await gateway.count(), 1);
});

test("oversized refund requests fail before workflow persistence", async () => {
  const { service } = await createHarness();
  await assert.rejects(
    () =>
      service.prepare({
        accountId: "acct-oversized",
        issue: "Duplicate charge",
        requestedAmountCents: 10001
      }),
    /integer from 1 to 10000/
  );
  assert.deepEqual(await service.list(), []);
});

test("canonical approval digest is key-order independent and changes with bound values", async () => {
  const { service } = await createHarness();
  const prepared = await prepareWorkflow(service);
  assert.ok(prepared.proposal);
  const reordered = {
    ...prepared.proposal,
    args: {
      reason: prepared.proposal.args.reason!,
      amountCents: prepared.proposal.args.amountCents!,
      accountId: prepared.proposal.args.accountId!
    }
  };
  assert.equal(proposalDigest(reordered), prepared.proposalDigest);
  reordered.args.amountCents = 2600;
  assert.notEqual(proposalDigest(reordered), prepared.proposalDigest);
});

test("proposal tampering after approval invalidates execution", async () => {
  const harness = await createHarness();
  const prepared = await prepareWorkflow(harness.service);
  await harness.service.approve(prepared.id, "reviewer-1", prepared.proposalDigest!);
  const tampered = await harness.store.getWorkflow(prepared.id);
  assert.ok(tampered.proposal);
  tampered.proposal.args.amountCents = 9900;
  await harness.store.saveWorkflow(tampered);

  await assert.rejects(() => harness.service.execute(prepared.id), /changed before execution/);
  assert.equal(await harness.gateway.count(), 0);
});

test("serialized approval resumes in a new service process", async () => {
  const harness = await createHarness();
  const prepared = await prepareWorkflow(harness.service);
  await harness.service.approve(prepared.id, "reviewer-1", prepared.proposalDigest!);

  const restartedStore = new FileOperatorStore(harness.storePath);
  const restartedGateway = new JsonRefundGateway(harness.gatewayPath);
  await Promise.all([restartedStore.initialize(), restartedGateway.initialize()]);
  const restartedService = new OperatorService(restartedStore, createDemoToolRegistry(restartedGateway));
  const completed = await restartedService.execute(prepared.id);

  assert.equal(completed.status, "completed");
  assert.equal(completed.approval?.reviewerId, "reviewer-1");
  assert.equal(await restartedGateway.count(), 1);
});

test("crash after the external write is recovered without a duplicate write", async () => {
  let crashOnce = true;
  const harness = await createHarness({
    async afterExternalWrite() {
      if (crashOnce) {
        crashOnce = false;
        throw new CrashAfterWriteError();
      }
    }
  });
  const prepared = await prepareWorkflow(harness.service);
  await harness.service.approve(prepared.id, "reviewer-1", prepared.proposalDigest!);

  await assert.rejects(() => harness.service.execute(prepared.id), CrashAfterWriteError);
  assert.equal((await harness.service.get(prepared.id)).status, "executing");
  assert.equal(await harness.gateway.count(), 1);

  const restartedStore = new FileOperatorStore(harness.storePath);
  const restartedGateway = new JsonRefundGateway(harness.gatewayPath);
  await Promise.all([restartedStore.initialize(), restartedGateway.initialize()]);
  const restartedService = new OperatorService(restartedStore, createDemoToolRegistry(restartedGateway));
  const recovered = await restartedService.execute(prepared.id);

  assert.equal(recovered.status, "completed");
  assert.equal(recovered.attempts, 2);
  assert.equal(await restartedGateway.count(), 1);
});

test("retryable execution failures return through approved before retry", async () => {
  const harness = await createHarness();
  let failOnce = true;
  const registry = createDemoToolRegistry(harness.gateway);
  const originalCallWrite = registry.callWrite.bind(registry);
  registry.callWrite = async (...args) => {
    if (failOnce) {
      failOnce = false;
      throw new OperatorError("UPSTREAM_UNAVAILABLE", "Refund provider unavailable", 503, true);
    }
    return originalCallWrite(...args);
  };

  const service = new OperatorService(harness.store, registry);
  const prepared = await prepareWorkflow(service);
  await service.approve(prepared.id, "reviewer-1", prepared.proposalDigest!);
  await assert.rejects(() => service.execute(prepared.id), /unavailable/);
  const failed = await service.get(prepared.id);
  assert.equal(failed.status, "failed");
  assert.equal(failed.lastError?.retryable, true);

  const completed = await service.retry(prepared.id);
  assert.equal(completed.status, "completed");
  assert.equal(completed.attempts, 2);
});

test("rejection and cancellation are terminal and perform no write", async () => {
  const rejectedHarness = await createHarness();
  const prepared = await prepareWorkflow(rejectedHarness.service);
  const rejected = await rejectedHarness.service.reject(prepared.id, "reviewer-1", "Evidence needs review");
  assert.equal(rejected.status, "cancelled");
  await assert.rejects(() => rejectedHarness.service.execute(prepared.id), /exact approval/);
  await assert.rejects(() => rejectedHarness.service.investigate(prepared.id), /cannot transition/);
  assert.equal(await rejectedHarness.gateway.count(), 0);

  const cancelledHarness = await createHarness();
  const queued = await cancelledHarness.service.create({
    accountId: "acct-cancel",
    issue: "Do not continue",
    requestedAmountCents: 100
  });
  const cancelled = await cancelledHarness.service.cancel(queued.id);
  assert.equal(cancelled.status, "cancelled");
  await assert.rejects(() => cancelledHarness.service.investigate(queued.id), /cannot transition/);
  assert.equal(await cancelledHarness.gateway.count(), 0);
});

test("tool registry enforces read and write permissions plus exact schemas", async () => {
  const { tools } = await createHarness();
  await assert.rejects(
    () => tools.callWrite("account.lookup", { accountId: "a1" }, { workflowId: "w1", executionKey: "k1" }),
    /not a write tool/
  );
  await assert.rejects(
    () => tools.callRead("refund.issue", { accountId: "a1" }, { workflowId: "w1" }),
    /not a read tool/
  );
  assert.throws(
    () => tools.validate("refund.issue", "write", { accountId: "a1", amountCents: 1, reason: "x", admin: true }),
    /Unexpected arguments/
  );
  assert.throws(
    () => tools.validate("refund.issue", "write", { accountId: "a1", amountCents: 1 }),
    /reason must be a non-empty string/
  );
  assert.throws(
    () => tools.validate("refund.issue", "write", { accountId: "a1", amountCents: 1, reason: "x".repeat(201) }),
    /reason must be at most 200 characters/
  );
});
