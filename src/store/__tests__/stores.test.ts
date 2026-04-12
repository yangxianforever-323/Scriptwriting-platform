import { describe, it, expect, beforeEach } from "vitest";
import { useProjectsStore, useScenesStore, useErrorStore } from "@/store";

describe("useProjectsStore", () => {
  beforeEach(() => {
    useProjectsStore.setState({
      projects: [],
      currentProject: null,
      loading: false,
      error: null,
      total: 0,
    });
  });

  it("should initialize with empty state", () => {
    const state = useProjectsStore.getState();
    expect(state.projects).toEqual([]);
    expect(state.currentProject).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it("should set current project", () => {
    const mockProject = {
      id: "test-id",
      user_id: "test-user",
      title: "Test Project",
      story: null,
      style: null,
      shot_count: 9,
      stage: "draft",
      current_stage: "planning",
      stage_progress: {} as any,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    useProjectsStore.getState().setCurrentProject(mockProject);

    expect(useProjectsStore.getState().currentProject).toEqual(mockProject);
  });

  it("should clear error", () => {
    useProjectsStore.setState({ error: "Test error" });
    useProjectsStore.getState().clearError();
    expect(useProjectsStore.getState().error).toBeNull();
  });
});

describe("useScenesStore", () => {
  beforeEach(() => {
    useScenesStore.setState({
      scenes: [],
      loading: false,
      error: null,
    });
  });

  it("should initialize with empty state", () => {
    const state = useScenesStore.getState();
    expect(state.scenes).toEqual([]);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it("should clear error", () => {
    useScenesStore.setState({ error: "Scene error" });
    useScenesStore.getState().clearError();
    expect(useScenesStore.getState().error).toBeNull();
  });
});

describe("useErrorStore", () => {
  beforeEach(() => {
    useErrorStore.setState({
      errors: [],
      hasUnhandledErrors: false,
    });
  });

  it("should add error", () => {
    const error = useErrorStore
      .getState()
      .addError("Something went wrong");

    expect(error.message).toBe("Something went wrong");
    expect(error.severity).toBe("error");
    expect(error.handled).toBe(false);
    expect(useErrorStore.getState().errors.length).toBe(1);
    expect(useErrorStore.getState().hasUnhandledErrors).toBe(true);
  });

  it("should mark error as handled", () => {
    const error = useErrorStore
      .getState()
      .addError("Test error with ID");

    useErrorStore.getState().markErrorAsHandled(error.id);

    const updatedError = useErrorStore
      .getState()
      .errors.find((e) => e.id === error.id);
    expect(updatedError?.handled).toBe(true);
  });

  it("should remove error", () => {
    const error = useErrorStore.getState().addError("Removable error");
    
    useErrorStore.getState().removeError(error.id);

    expect(
      useErrorStore.getState().errors.find((e) => e.id === error.id)
    ).toBeUndefined();
  });

  it("should clear all errors", () => {
    useErrorStore.getState().addError("Error 1");
    useErrorStore.getState().addError("Error 2");

    useErrorStore.getState().clearAllErrors();

    expect(useErrorStore.getState().errors).toHaveLength(0);
    expect(useErrorStore.getState().hasUnhandledErrors).toBe(false);
  });

  it("should handle different severity levels", () => {
    const warning = useErrorStore
      .getState()
      .addError("Warning message", { severity: "warning" });
    expect(warning.severity).toBe("warning");

    const info = useErrorStore
      .getState()
      .addError("Info message", { severity: "info" });
    expect(info.severity).toBe("info");
  });
});
