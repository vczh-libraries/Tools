import { describe, it } from "node:test";
import assert from "node:assert/strict";

const { expandPromptStatic, expandPromptDynamic, validateEntry, entry, availableTools, runtimeVariables } =
    await import("../dist/jobsData.js");

describe("expandPromptStatic", () => {
    it("joins prompt array with LF", () => {
        const testEntry = {
            ...entry,
            promptVariables: {},
        };
        const result = expandPromptStatic(testEntry, "test", ["line1", "line2", "line3"]);
        assert.deepStrictEqual(result, ["line1\nline2\nline3"]);
    });

    it("resolves prompt variables recursively", () => {
        const testEntry = {
            ...entry,
            promptVariables: {
                greeting: ["Hello"],
                full: ["$greeting", "World"],
            },
        };
        const result = expandPromptStatic(testEntry, "test", ["$full"]);
        assert.deepStrictEqual(result, ["Hello\nWorld"]);
    });

    it("keeps runtime variables as-is", () => {
        const testEntry = {
            ...entry,
            promptVariables: {},
        };
        const result = expandPromptStatic(testEntry, "test", ["Say $user-input please"]);
        assert.deepStrictEqual(result, ["Say $user-input please"]);
    });

    it("throws on unknown variable", () => {
        const testEntry = {
            ...entry,
            promptVariables: {},
        };
        assert.throws(
            () => expandPromptStatic(testEntry, "test", ["$unknown-var"]),
            { message: "test: Cannot find prompt variable: $unknown-var." }
        );
    });

    it("throws on empty prompt", () => {
        assert.throws(
            () => expandPromptStatic(entry, "test", []),
            { message: "test: Prompt is empty." }
        );
    });

    it("codePath includes variable chain for nested errors", () => {
        const testEntry = {
            ...entry,
            promptVariables: {
                outer: ["$inner"],
                inner: ["$missing"],
            },
        };
        assert.throws(
            () => expandPromptStatic(testEntry, "root", ["$outer"]),
            { message: "root/$outer/$inner: Cannot find prompt variable: $missing." }
        );
    });
});

describe("expandPromptDynamic", () => {
    it("resolves runtime variables from values", () => {
        const result = expandPromptDynamic(entry, ["Hello $user-input"], { "user-input": "world" });
        assert.deepStrictEqual(result, ["Hello world"]);
    });

    it("throws when prompt has more than one item", () => {
        assert.throws(
            () => expandPromptDynamic(entry, ["a", "b"], {}),
            /must have exactly one item/
        );
    });

    it("throws when variable not in values", () => {
        assert.throws(
            () => expandPromptDynamic(entry, ["$user-input"], {}),
            /Cannot find runtime variable: \$user-input/
        );
    });
});

describe("validateEntry (entry export)", () => {
    it("entry is exported and has expected structure", () => {
        assert.ok(entry.models, "should have models");
        assert.ok(entry.grid, "should have grid");
        assert.ok(entry.tasks, "should have tasks");
    });

    it("all task prompts are expanded to single item", () => {
        for (const [name, task] of Object.entries(entry.tasks)) {
            assert.strictEqual(task.prompt.length, 1, `task ${name} prompt should be single item`);
        }
    });

    it("all availability conditions are expanded to single item", () => {
        for (const [name, task] of Object.entries(entry.tasks)) {
            if (task.availability?.condition) {
                assert.strictEqual(
                    task.availability.condition.length, 1,
                    `task ${name} availability.condition should be single item`
                );
            }
        }
    });

    it("all criteria conditions are expanded to single item", () => {
        for (const [name, task] of Object.entries(entry.tasks)) {
            if (task.criteria?.condition) {
                assert.strictEqual(
                    task.criteria.condition.length, 1,
                    `task ${name} criteria.condition should be single item`
                );
            }
        }
    });

    it("all criteria failureAction prompts are expanded to single item", () => {
        for (const [name, task] of Object.entries(entry.tasks)) {
            if (task.criteria?.failureAction && task.criteria.failureAction.length === 3) {
                const prompt = task.criteria.failureAction[2];
                assert.strictEqual(
                    prompt.length, 1,
                    `task ${name} criteria.failureAction[2] should be single item`
                );
            }
        }
    });

    it("expanded prompts do not contain resolvable variables (only runtime ones)", () => {
        for (const [name, task] of Object.entries(entry.tasks)) {
            const text = task.prompt[0];
            const vars = text.match(/\$[a-zA-Z]+(?:-[a-zA-Z]+)*/g) || [];
            for (const v of vars) {
                assert.ok(
                    runtimeVariables.includes(v),
                    `task ${name} prompt contains unresolved variable: ${v}`
                );
            }
        }
    });

    it("validation error paths use JS expression format", () => {
        // Build a minimal entry with an invalid model to test error path format
        const badEntry = {
            models: { driving: "gpt-5-mini", planning: "gpt-5.2", coding: "gpt-5.2-codex", reviewers: [] },
            promptVariables: {},
            grid: [],
            tasks: {
                "test-task": { model: "nonexistent", prompt: ["hello"] }
            }
        };
        assert.throws(
            () => {
                validateEntry(badEntry, "root:");
            },
            (err) => {
                return err.message.includes('root:entry.tasks["test-task"].model');
            }
        );
    });

    it("availableTools is a non-empty array of strings", () => {
        assert.ok(Array.isArray(availableTools));
        assert.ok(availableTools.length > 0);
        for (const t of availableTools) {
            assert.ok(typeof t === "string");
        }
    });

    it("runtimeVariables is a non-empty array of strings starting with $", () => {
        assert.ok(Array.isArray(runtimeVariables));
        assert.ok(runtimeVariables.length > 0);
        for (const v of runtimeVariables) {
            assert.ok(v.startsWith("$"), `${v} should start with $`);
        }
    });
});

describe("expandPromptStatic requiresBooleanTool", () => {
    it("passes when boolean tool is mentioned", () => {
        const testEntry = {
            ...entry,
            promptVariables: {},
        };
        const result = expandPromptStatic(testEntry, "test", ["You must call job_boolean_true or job_boolean_false"], true);
        assert.deepStrictEqual(result, ["You must call job_boolean_true or job_boolean_false"]);
    });

    it("passes when only job_boolean_true is mentioned", () => {
        const testEntry = {
            ...entry,
            promptVariables: {},
        };
        const result = expandPromptStatic(testEntry, "test", ["Call job_boolean_true to confirm"], true);
        assert.ok(result[0].includes("job_boolean_true"));
    });

    it("throws when no boolean tool is mentioned and requiresBooleanTool is true", () => {
        const testEntry = {
            ...entry,
            promptVariables: {},
        };
        assert.throws(
            () => expandPromptStatic(testEntry, "test", ["No boolean tool here"], true),
            /Boolean tool/
        );
    });

    it("does not throw when requiresBooleanTool is false or unset", () => {
        const testEntry = {
            ...entry,
            promptVariables: {},
        };
        const result = expandPromptStatic(testEntry, "test", ["No boolean tool here"], false);
        assert.deepStrictEqual(result, ["No boolean tool here"]);
        const result2 = expandPromptStatic(testEntry, "test", ["No boolean tool here"]);
        assert.deepStrictEqual(result2, ["No boolean tool here"]);
    });

    it("all availability conditions mention boolean tools", () => {
        for (const [name, task] of Object.entries(entry.tasks)) {
            if (task.availability?.condition) {
                const text = task.availability.condition[0];
                assert.ok(
                    text.includes("job_boolean_true") || text.includes("job_boolean_false"),
                    `task ${name} availability.condition should mention boolean tool`
                );
            }
        }
    });

    it("all criteria conditions mention boolean tools", () => {
        for (const [name, task] of Object.entries(entry.tasks)) {
            if (task.criteria?.condition) {
                const text = task.criteria.condition[0];
                assert.ok(
                    text.includes("job_boolean_true") || text.includes("job_boolean_false"),
                    `task ${name} criteria.condition should mention boolean tool`
                );
            }
        }
    });
});

describe("validateEntry requireUserInput", () => {
    it("throws when requireUserInput is true but prompt does not use $user-input", () => {
        const badEntry = {
            models: { driving: "gpt-5-mini", planning: "gpt-5.2", coding: "gpt-5.2-codex", reviewers: [] },
            promptVariables: {},
            grid: [],
            tasks: {
                "test-task": { model: "planning", requireUserInput: true, prompt: ["hello world"] }
            }
        };
        assert.throws(
            () => validateEntry(badEntry, "test:"),
            /requireUserInput.*should use \$user-input/
        );
    });

    it("throws when requireUserInput is false but prompt uses $user-input", () => {
        const badEntry = {
            models: { driving: "gpt-5-mini", planning: "gpt-5.2", coding: "gpt-5.2-codex", reviewers: [] },
            promptVariables: {},
            grid: [],
            tasks: {
                "test-task": { model: "planning", requireUserInput: false, prompt: ["hello $user-input"] }
            }
        };
        assert.throws(
            () => validateEntry(badEntry, "test:"),
            /requireUserInput.*should not use \$user-input/
        );
    });

    it("passes when requireUserInput matches prompt usage", () => {
        const goodEntry = {
            models: { driving: "gpt-5-mini", planning: "gpt-5.2", coding: "gpt-5.2-codex", reviewers: [] },
            promptVariables: {},
            grid: [],
            tasks: {
                "task-with-input": { model: "planning", requireUserInput: true, prompt: ["do $user-input"] },
                "task-without-input": { model: "planning", requireUserInput: false, prompt: ["do something"] }
            }
        };
        const result = validateEntry(goodEntry, "test:");
        assert.ok(result);
    });

    it("validated entry tasks have correct requireUserInput for tasks using $user-input", () => {
        for (const [name, task] of Object.entries(entry.tasks)) {
            const text = task.prompt[0];
            const usesUserInput = text.includes("$user-input");
            assert.strictEqual(
                task.requireUserInput, usesUserInput,
                `task ${name}: requireUserInput=${task.requireUserInput} but prompt ${usesUserInput ? "uses" : "does not use"} $user-input`
            );
        }
    });
});
