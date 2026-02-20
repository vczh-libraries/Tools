import * as http from "node:http";
import * as path from "node:path";
import * as fs from "node:fs";
import type { ICopilotSession } from "./copilotSession.js";
import type { Entry, Work, TaskWork, SequentialWork, ParallelWork, LoopWork, AltWork } from "./jobsDef.js";
import { getModelId } from "./jobsDef.js";
import { generateChartNodes } from "./jobsChart.js";
import {
    jsonResponse,
} from "./copilotApi.js";
import {
    readBody,
    getCountDownMs,
    createLiveEntityState,
    pushLiveResponse,
    closeLiveEntity,
    waitForLiveResponse,
    shutdownLiveEntity,
    type LiveEntityState,
    type LiveResponse,
} from "./sharedApi.js";
import {
    type ICopilotTask,
    type ICopilotTaskCallback,
    startTask,
    errorToDetailedString,
    registerJobTask,
} from "./taskApi.js";

export type { ICopilotTask, ICopilotTaskCallback };

// ---- Types ----

export interface ICopilotJob {
    get runningWorkIds(): number[];
    get status(): "Executing" | "Succeeded" | "Failed";
    stop(): void;
}

export interface ICopilotJobCallback {
    jobSucceeded(): void;
    jobFailed(): void;
    workStarted(workId: number, taskId: string): void;
    workStopped(workId: number, succeeded: boolean): void;
}

// ---- Job State ----

interface JobState {
    jobId: string;
    job: ICopilotJob;
    entity: LiveEntityState;
    jobError: string | null;
}

const jobs = new Map<string, JobState>();
let nextJobId = 1;

// ---- executeWork ----

async function executeWork(
    entry: Entry,
    work: Work<number>,
    userInput: string,
    workingDirectory: string,
    runningIds: Set<number>,
    stopped: { readonly value: boolean },
    activeTasks: ICopilotTask[],
    callback: ICopilotJobCallback
): Promise<boolean> {
    if (stopped.value) return false;

    switch (work.kind) {
        case "Ref": {
            const taskWork = work as TaskWork<number>;
            const taskName = taskWork.taskId;

            // Determine model override
            let taskModelId: string | undefined;
            if (taskWork.modelOverride) {
                taskModelId = getModelId(taskWork.modelOverride, entry);
            }

            // Register task state for live API
            const reg = registerJobTask(false);

            runningIds.add(taskWork.workIdInJob);
            callback.workStarted(taskWork.workIdInJob, reg.taskId);

            try {
                const result = await new Promise<boolean>((resolve, reject) => {
                    const taskCallback: ICopilotTaskCallback = {
                        taskSucceeded() {
                            reg.pushResponse({ callback: "taskSucceeded" });
                            reg.setClosed();
                            const crashErr = startedTask?.crashError;
                            if (crashErr) { reject(crashErr); } else { resolve(true); }
                        },
                        taskFailed() {
                            reg.pushResponse({ callback: "taskFailed" });
                            reg.setClosed();
                            const crashErr = startedTask?.crashError;
                            if (crashErr) { reject(crashErr); } else { resolve(false); }
                        },
                        taskDecision(reason: string) {
                            reg.pushResponse({ callback: "taskDecision", reason });
                        },
                        taskSessionStarted(taskSession: ICopilotSession, taskId: string, isDrivingSession: boolean) {
                            reg.pushResponse({ callback: "taskSessionStarted", sessionId: taskId, isDriving: isDrivingSession });
                        },
                        taskSessionStopped(taskSession: ICopilotSession, taskId: string, succeeded: boolean) {
                            reg.pushResponse({ callback: "taskSessionStopped", sessionId: taskId, succeeded });
                        },
                    };

                    let startedTask: ICopilotTask | null = null;
                    startTask(
                        entry,
                        taskName,
                        userInput,
                        undefined, // managed session mode for jobs
                        false, // not ignoring prerequisites
                        taskCallback,
                        taskModelId,
                        workingDirectory,
                        () => { }
                    ).then(t => {
                        startedTask = t;
                        reg.setTask(t);
                        activeTasks.push(t);
                    }).catch(err => {
                        reg.setError(errorToDetailedString(err));
                        reg.pushResponse({ taskError: errorToDetailedString(err) });
                        reg.setClosed();
                        reject(err);
                    });
                });

                runningIds.delete(taskWork.workIdInJob);
                callback.workStopped(taskWork.workIdInJob, result);
                return result;
            } catch (err) {
                runningIds.delete(taskWork.workIdInJob);
                callback.workStopped(taskWork.workIdInJob, false);
                throw err; // Propagate crash to job level
            }
        }
        case "Seq": {
            const seqWork = work as SequentialWork<number>;
            for (const w of seqWork.works) {
                if (stopped.value) return false;
                const result = await executeWork(entry, w, userInput, workingDirectory, runningIds, stopped, activeTasks, callback);
                if (!result) return false;
            }
            return true;
        }
        case "Par": {
            const parWork = work as ParallelWork<number>;
            if (parWork.works.length === 0) return true;
            const results = await Promise.all(
                parWork.works.map(w => executeWork(entry, w, userInput, workingDirectory, runningIds, stopped, activeTasks, callback))
            );
            return results.every(r => r);
        }
        case "Loop": {
            const loopWork = work as LoopWork<number>;
            while (true) {
                if (stopped.value) return false;

                // Check pre-condition
                if (loopWork.preCondition) {
                    const [expected, condWork] = loopWork.preCondition;
                    const condResult = await executeWork(entry, condWork, userInput, workingDirectory, runningIds, stopped, activeTasks, callback);
                    if (condResult !== expected) {
                        return true; // LoopWork finishes as succeeded
                    }
                }

                // Run body
                const bodyResult = await executeWork(entry, loopWork.body, userInput, workingDirectory, runningIds, stopped, activeTasks, callback);
                if (!bodyResult) return false; // body fails → LoopWork fails

                // Check post-condition
                if (loopWork.postCondition) {
                    const [expected, condWork] = loopWork.postCondition;
                    const condResult = await executeWork(entry, condWork, userInput, workingDirectory, runningIds, stopped, activeTasks, callback);
                    if (condResult !== expected) {
                        return true; // LoopWork finishes as succeeded
                    }
                    // condition matches expected → redo loop
                } else {
                    return true; // No post-condition, loop body ran once successfully
                }
            }
        }
        case "Alt": {
            const altWork = work as AltWork<number>;
            const condResult = await executeWork(entry, altWork.condition, userInput, workingDirectory, runningIds, stopped, activeTasks, callback);
            const chosen = condResult ? altWork.trueWork : altWork.falseWork;
            if (!chosen) return true; // No chosen work = success
            return executeWork(entry, chosen, userInput, workingDirectory, runningIds, stopped, activeTasks, callback);
        }
    }
}

// ---- startJob ----

export async function startJob(
    entry: Entry,
    jobName: string,
    userInput: string,
    workingDirectory: string,
    callback: ICopilotJobCallback
): Promise<ICopilotJob> {
    const job = entry.jobs[jobName];
    if (!job) {
        throw new Error(`Job "${jobName}" not found.`);
    }

    let status: "Executing" | "Succeeded" | "Failed" = "Executing";
    let stopped = false;
    const runningIds = new Set<number>();
    const activeTasks: ICopilotTask[] = [];

    const copilotJob: ICopilotJob = {
        get runningWorkIds() { return Array.from(runningIds); },
        get status() { return status; },
        stop() {
            if (stopped) return;
            stopped = true;
            status = "Failed";
            for (const task of activeTasks) {
                task.stop();
            }
        },
    };

    const executionPromise = (async () => {
        try {
            const result = await executeWork(
                entry, job.work, userInput, workingDirectory,
                runningIds, { get value() { return stopped; } },
                activeTasks, callback
            );
            if (result) {
                status = "Succeeded";
                callback.jobSucceeded();
            } else {
                status = "Failed";
                callback.jobFailed();
            }
        } catch (err) {
            if (status === "Executing") {
                status = "Failed";
            }
            // Stop all running tasks
            for (const task of activeTasks) {
                task.stop();
            }
            callback.jobFailed();
            throw err; // Don't consume silently
        }
    })();

    (copilotJob as any)._executionPromise = executionPromise;
    executionPromise.catch(() => { }); // Prevent unhandled rejection; callers should handle

    return copilotJob;
}

// ---- Job API Handlers ----

export async function apiJobList(
    entry: Entry,
    req: http.IncomingMessage,
    res: http.ServerResponse,
): Promise<void> {
    // Build a combined chart from all jobs
    const chart: Record<string, ReturnType<typeof generateChartNodes>> = {};
    for (const [jobName, job] of Object.entries(entry.jobs)) {
        chart[jobName] = generateChartNodes(job.work);
    }
    jsonResponse(res, 200, { grid: entry.grid, jobs: entry.jobs, chart });
}

export async function apiJobStart(
    entry: Entry,
    req: http.IncomingMessage,
    res: http.ServerResponse,
    jobName: string,
): Promise<void> {
    if (!(jobName in entry.jobs)) {
        jsonResponse(res, 200, { error: "JobNotFound" });
        return;
    }

    const body = await readBody(req);
    const lines = body.split("\n");
    const workingDirectory = lines[0].trim();
    const userInput = lines.slice(1).join("\n");

    if (!workingDirectory || !path.isAbsolute(workingDirectory)) {
        jsonResponse(res, 200, { error: "JobNotFound" });
        return;
    }
    if (!fs.existsSync(workingDirectory)) {
        jsonResponse(res, 200, { error: "JobNotFound" });
        return;
    }

    try {
        const jobId = `job-${nextJobId++}`;
        const entity = createLiveEntityState(getCountDownMs(), () => {
            jobs.delete(jobId);
        });
        const state: JobState = {
            jobId,
            job: null as unknown as ICopilotJob,
            entity,
            jobError: null,
        };

        const jobCallback: ICopilotJobCallback = {
            jobSucceeded() {
                pushLiveResponse(entity, { callback: "jobSucceeded" });
                closeLiveEntity(entity);
            },
            jobFailed() {
                pushLiveResponse(entity, { callback: "jobFailed" });
                closeLiveEntity(entity);
            },
            workStarted(workId: number, taskId: string) {
                pushLiveResponse(entity, { callback: "workStarted", workId, taskId });
            },
            workStopped(workId: number, succeeded: boolean) {
                pushLiveResponse(entity, { callback: "workStopped", workId, succeeded });
            },
        };

        const copilotJob = await startJob(entry, jobName, userInput, workingDirectory, jobCallback);
        state.job = copilotJob;
        jobs.set(jobId, state);

        // Catch execution crashes
        const execPromise = (copilotJob as any)._executionPromise as Promise<void> | undefined;
        if (execPromise) {
            execPromise.catch((err: unknown) => {
                state.jobError = errorToDetailedString(err);
                pushLiveResponse(entity, { jobError: state.jobError });
                closeLiveEntity(entity);
            });
        }

        jsonResponse(res, 200, { jobId });
    } catch (err) {
        jsonResponse(res, 200, { jobError: errorToDetailedString(err) });
    }
}

export async function apiJobStop(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    jobId: string,
): Promise<void> {
    const state = jobs.get(jobId);
    if (!state) {
        jsonResponse(res, 200, { error: "JobNotFound" });
        return;
    }
    state.job.stop();
    closeLiveEntity(state.entity);
    jsonResponse(res, 200, { result: "Closed" });
}

export async function apiJobLive(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    jobId: string,
    token: string,
): Promise<void> {
    const state = jobs.get(jobId);
    const response = await waitForLiveResponse(
        state?.entity,
        token,
        5000,
        "JobNotFound",
        "JobsClosed",
    );
    jsonResponse(res, 200, response);
}
