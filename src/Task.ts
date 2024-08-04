import { Spinner } from '@topcli/spinner';
import Logger from './Logger';

export type TaskFlag = {
  name: string;
  description: string;
  required?: boolean;
};

export type TaskDependency = {
  command: string;
  paramsOverride?: string[];
};

type Args = { [name: string]: any };

export enum RunResult {
  Success = 0,
  Failed = 1,
  Pending = -1,
}

/**
 * A distinct action that can be performed by invoking a command. Extend this class and define the
 * `getCommand()`, `getDescription()` and `run()` methods. Refer to the documentation for a full
 * list of available methods.
 */
abstract class Task {
  public readonly isInternalTask: boolean = false;
  protected argValues: Args = {};
  protected result: RunResult = RunResult.Pending;
  protected spinner: Spinner | null = null;
  protected log: Logger = new Logger();

  /**
   * Returns the command that can be invoked to execute this task.
   */
  abstract getCommand(): string;

  /**
   * Returns a description of what this task does. This will be returned when the task runner is run with
   * the `--help` flag.
   */
  abstract getDescription(): string;

  /**
   * The method that will be executed when the task is run. This method contains the main logic for this task.
   */
  abstract run(): Promise<void>;

  /**
   * Gets pre-requisite tasks that must be run before this one.
   */
  getDependencies(): TaskDependency[] {
    return [];
  }

  /**
   * Gets params that must be passed when running this task.
   */
  getParams(): string[] {
    return [];
  }

  /**
   * Gets optional flags that can be set when running this task.
   */
  getFlags(): TaskFlag[] {
    return [];
  }

  /**
   * Gets the value of a a param supplied to this task.
   * @param name The name of the param. Must be a param name returned by `getParams()`.
   */
  getParam(name: string): string {
    const params = this.getParams();
    if (!params.includes(name)) {
      throw new Error(
        `[${this.getCommand()}] Invalid param name "${name}" provided in call to getParam(); must be a param returned by getParams().`
      );
    }

    const index = params.indexOf(name);
    if (this.argValues._args.length < index - 1) {
      throw new Error(`[${this.getCommand()}] Param "${name}" not supplied.`);
    }

    return this.argValues._args[index];
  }

  /**
   * Gets the value of a flag supplied to this task.
   * @param name The name of the flag. Must be the name of a flag returned in `getFlags()`.
   */
  getFlag(name: string): any {
    const flagDefinition = this.getFlags().find((flag) => flag.name === name);
    if (flagDefinition == null) {
      throw new Error(
        `[${this.getCommand()}] Invalid flag name "${name}" provided in call to getFlag(); must be a flag returned by getFlags().`
      );
    }

    const value = this.argValues[name] as string | undefined;
    if (flagDefinition.required === true && value == null) {
      throw new Error(
        `[${this.getCommand()}] Flag "${name}" is required but was not supplied.`
      );
    }

    return value ?? null;
  }

  /**
   * Gets a human-friendly name for this task. Defaults to the command returned in `getCommand()`.
   */
  getTaskLabel(): string {
    return this.getCommand();
  }

  initialiseRunContext(args: Args, spinner: Spinner) {
    this.argValues = args;
    this.result = RunResult.Pending;
    this.spinner = spinner;
    this.log.setTag(this.getTaskLabel());
  }

  /**
   * Sets the result of the task (success or failed).
   * @param result The result of the task.
   */
  setResult(result: RunResult) {
    this.result = result;
  }

  getResult() {
    return this.result;
  }

  /**
   * Updates the spinner for this task with the provided text.
   * @param text The text to show next to the spinner.
   */
  setProgressText(text: string) {
    if (this.spinner == null) return;

    this.spinner.text = text;
  }

  getLogger(): Logger {
    return this.log;
  }
}

export default Task;
