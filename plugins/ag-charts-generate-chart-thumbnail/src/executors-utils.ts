/* eslint-disable no-console */
import type { ExecutorContext, TaskGraph } from '@nx/devkit';
import type { ChildProcess } from 'child_process';
import { readFileSync } from 'fs';
import * as fs from 'fs/promises';
import * as glob from 'glob';
import * as os from 'os';
import * as path from 'path';
import * as ts from 'typescript';

export type TaskResult = {
    success: boolean;
    terminalOutput: string;
    startTime?: number;
    endTime?: number;
};

export type BatchExecutorTaskResult = {
    task: string;
    result: TaskResult;
};

async function exists(filePath: string) {
    try {
        return (await fs.stat(filePath))?.isFile();
    } catch (e) {
        return false;
    }
}

export async function readJSONFile(filePath: string) {
    return (await exists(filePath)) ? JSON.parse(await fs.readFile(filePath, 'utf-8')) : null;
}

export async function readFile(filePath: string) {
    return (await exists(filePath)) ? await fs.readFile(filePath, 'utf-8') : null;
}

export async function writeJSONFile(filePath: string, data: unknown, indent = 2) {
    const dataContent = JSON.stringify(data, null, indent);
    await writeFile(filePath, dataContent);
}

export async function ensureDirectory(dirPath: string) {
    await fs.mkdir(dirPath, { recursive: true });
}

export async function writeFile(filePath: string, newContent: string | Buffer) {
    await ensureDirectory(path.dirname(filePath));
    await fs.writeFile(filePath, newContent);
}

export function parseFile(filePath: string) {
    const contents = readFileSync(filePath, 'utf8');
    return ts.createSourceFile('tempFile.ts', contents, ts.ScriptTarget.Latest, true);
}

export function inputGlob(fullPath: string) {
    return glob.sync(`${fullPath}/**/*.ts`, {
        ignore: [`${fullPath}/**/*.test.ts`, `${fullPath}/**/*.spec.ts`],
    });
}

export function batchExecutor<ExecutorOptions>(
    executor: (opts: ExecutorOptions, ctx: ExecutorContext) => Promise<void>
) {
    return async function* (
        taskGraph: TaskGraph,
        inputs: Record<string, ExecutorOptions>,
        overrides: ExecutorOptions,
        context: ExecutorContext
    ): AsyncGenerator<BatchExecutorTaskResult, any, unknown> {
        const tasks = Object.keys(inputs);

        for (let taskIndex = 0; taskIndex < tasks.length; taskIndex++) {
            const taskName = tasks[taskIndex++];
            const task = taskGraph.tasks[taskName];
            const inputOptions = inputs[taskName];

            let success = false;
            let terminalOutput = '';
            try {
                await executor(
                    { ...inputOptions, ...overrides },
                    {
                        ...context,
                        projectName: task.target.project,
                        targetName: task.target.target,
                        configurationName: task.target.configuration,
                    }
                );
                success = true;
            } catch (e) {
                terminalOutput += `${e}`;
            }

            yield { task: taskName, result: { success, terminalOutput } };
        }
    };
}

const workers: ChildProcess[] = [];
const terminateWorkers = () => {
    workers.forEach((w) => w.kill('SIGKILL'));
    workers.length = 0;
};

process.on('exit', () => {
    terminateWorkers();
});

export function batchWorkerExecutor<ExecutorOptions>(worker: () => ChildProcess) {
    const maxChildCount = Math.max(1, os.cpus().length - 1);
    const results: Map<string, Promise<BatchExecutorTaskResult>> = new Map();
    const resolvers: Map<string, (res: BatchExecutorTaskResult) => void> = new Map();

    const createWorker = () => {
        const workerInstance = worker();
        workerInstance.on('message', (message: BatchExecutorTaskResult) => {
            const { task, result } = message;
            resolvers.get(task)({ task, result });
            resolvers.delete(task);

            if (result.success !== true) {
                console.error(`[${task}]: ${result.terminalOutput}`);
            }
            if (resolvers.size === 0) {
                terminateWorkers();
            }
        });
        workerInstance.on('error', (e) => {
            console.error(e);
            terminateWorkers();
        });
        workers.push(workerInstance);
    };

    for (let i = workers.length; i < maxChildCount; i++) {
        createWorker();
    }
    console.log('Worker count: ' + workers.length);

    return async function* (
        taskGraph: TaskGraph,
        inputs: Record<string, ExecutorOptions>,
        overrides: ExecutorOptions,
        context: ExecutorContext
    ): AsyncGenerator<BatchExecutorTaskResult, any, unknown> {
        const tasks = Object.keys(inputs);

        for (let taskIndex = 0; taskIndex < tasks.length; taskIndex++) {
            const taskName = tasks[taskIndex++];
            const task = taskGraph.tasks[taskName];
            const inputOptions = inputs[taskName];

            workers[taskIndex % workers.length].send({
                options: { ...inputOptions, ...overrides },
                context: {
                    ...context,
                    projectName: task.target.project,
                    targetName: task.target.target,
                    configurationName: task.target.configuration,
                },
                taskName,
            });

            results.set(
                taskName,
                new Promise((resolve) => {
                    resolvers.set(taskName, resolve);
                })
            );
        }

        for (let taskIndex = 0; taskIndex < tasks.length; taskIndex++) {
            const taskName = tasks[taskIndex++];
            yield results.get(taskName);
        }
    };
}

export async function consolePrefix(prefix: string, cb: () => Promise<void>) {
    const fns = {};
    for (const fn of ['log', 'debug', 'info', 'warn', 'error']) {
        fns[fn] = console[fn];

        console[fn] = (arg: any, ...args: any[]) => {
            // Filter license message.
            if (typeof arg === 'string' && arg.startsWith('*')) return;

            fns[fn].call(console, prefix, arg, ...args);
        };
    }
    try {
        await cb();
    } finally {
        Object.assign(console, fns);
    }
}
