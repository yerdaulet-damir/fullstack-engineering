import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { ExecutionRecord, PersistedOperatorData, WorkflowState } from "./contracts.js";
import { OperatorError } from "./errors.js";

const emptyData = (): PersistedOperatorData => ({ version: 1, workflows: {}, executions: {} });

export class FileOperatorStore {
  #queue: Promise<void> = Promise.resolve();

  constructor(public readonly filePath: string) {}

  async initialize(): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    try {
      await readFile(this.filePath, "utf8");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      await this.#write(emptyData());
    }
  }

  async getWorkflow(id: string): Promise<WorkflowState> {
    const workflow = (await this.#read()).workflows[id];
    if (!workflow) throw new OperatorError("WORKFLOW_NOT_FOUND", `Workflow ${id} was not found`, 404);
    return structuredClone(workflow);
  }

  async listWorkflows(): Promise<WorkflowState[]> {
    return Object.values((await this.#read()).workflows)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .map((workflow) => structuredClone(workflow));
  }

  async saveWorkflow(workflow: WorkflowState): Promise<void> {
    await this.#update((data) => {
      data.workflows[workflow.id] = structuredClone(workflow);
    });
  }

  async getExecution(key: string): Promise<ExecutionRecord | null> {
    const execution = (await this.#read()).executions[key];
    return execution ? structuredClone(execution) : null;
  }

  async saveExecution(execution: ExecutionRecord): Promise<void> {
    await this.#update((data) => {
      const existing = data.executions[execution.key];
      if (existing && existing.proposalDigest !== execution.proposalDigest) {
        throw new OperatorError("EXECUTION_KEY_CONFLICT", "Execution key is bound to another proposal", 409);
      }
      data.executions[execution.key] = structuredClone(existing ?? execution);
    });
  }

  async #read(): Promise<PersistedOperatorData> {
    const parsed = JSON.parse(await readFile(this.filePath, "utf8")) as PersistedOperatorData;
    if (parsed.version !== 1) throw new OperatorError("STORE_VERSION_UNSUPPORTED", "Unsupported store version", 500);
    return parsed;
  }

  async #update(change: (data: PersistedOperatorData) => void): Promise<void> {
    let release: () => void = () => undefined;
    const next = new Promise<void>((resolve) => {
      release = resolve;
    });
    const previous = this.#queue;
    this.#queue = previous.then(() => next);
    await previous;
    try {
      const data = await this.#read();
      change(data);
      await this.#write(data);
    } finally {
      release();
    }
  }

  async #write(data: PersistedOperatorData): Promise<void> {
    const temporaryPath = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(temporaryPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
    await rename(temporaryPath, this.filePath);
  }
}
