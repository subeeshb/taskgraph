import path from 'path';
import process from 'process';
import CommandLineParser from 'command-line-parser';
import Task, { RunResult, TaskDependency } from './Task';
import chalk from 'chalk';
import { Spinner } from '@topcli/spinner';
import Logger from './Logger';

class TaskRunner {
  name: string;
  tasks: { [command: string]: Task } = {};
  argValues: { [name: string]: any };
  loggers: Logger[] = [];

  /**
   * Create a new task runner.
   * @param name The name of this task runner, for example a name for the CLI tool.
   */
  constructor(name: string) {
    this.name = name;
    this.argValues = CommandLineParser();
  }

  /**
   * Register a task with this runner.
   * @param TaskType A class extending `Task`.
   */
  registerTask(TaskType: new () => Task) {
    const task = new TaskType();
    this.tasks[task.getCommand()] = task;
  }

  /**
   * Runs the task runner.
   */
  async run() {
    if (Object.keys(this.argValues).indexOf('help') !== -1) {
      this.printHelpMessage();
      return;
    }

    const args = this.argValues._args;
    if (args == null || args?.length === 0) {
      this.printErrorMessage(
        'No command specified.',
        `You must provide a command to run. Available commands: ${this.getAvailableCommands().join(
          ', '
        )}\nRun this with the --help flag for more details.`
      );
      process.exit(1);
    }

    const command = args[0];
    const task = this.tasks[command];
    if (task == null || task.isInternalTask) {
      this.printErrorMessage(
        'Invalid command specified.',
        `The command "${command}" is not valid. Available commands: ${this.getAvailableCommands().join(
          ', '
        )}\nRun this with the --help flag for more details.`
      );
      process.exit(1);
    }

    await this.runTask(task);

    console.log('');
    this.loggers.forEach((logger) => {
      logger.printLogs();
    });
  }

  private async runTask(
    task: Task,
    depth: number = 0,
    dependencyDefinition?: TaskDependency
  ) {
    let spacer = new Array(depth).fill('   ').join('');
    if (spacer != '') spacer += '↳ ';

    const spinner = new Spinner();
    spinner.start(`Waiting...`, {
      withPrefix: `${spacer}[${task.getTaskLabel()}] `,
    });

    const dependencies = task.getDependencies();
    if (dependencies.length > 0) {
      await Promise.all(
        dependencies.map(async (dependency) => {
          const dependencyCommand = dependency.command;
          const dependencyTask = this.tasks[dependencyCommand];
          if (dependencyTask == null) {
            // Invalid command specified as a dependency
            this.printErrorMessage(
              'Invalid dependency',
              `The task ${task.getTaskLabel()} defined a dependency "${dependencyCommand}", but this command is not valid.`
            );
            process.exit(1);
          }

          await this.runTask(dependencyTask, depth + 1, dependency);
        })
      );
    }

    const taskArgs = {
      ...this.argValues,
      _args: (this.argValues._args ?? []).slice(1),
    };
    if (dependencyDefinition?.paramsOverride != null) {
      taskArgs._args = dependencyDefinition.paramsOverride;
    }

    if (task.getParams().length > taskArgs._args.length) {
      this.printErrorMessage(
        'Missing params',
        `One or more required params for the task "${task.getTaskLabel()}" was not provided. Required params: ${task
          .getParams()
          .join(', ')}`
      );
      process.exit(1);
    }

    task.initialiseRunContext(taskArgs, spinner);
    spinner.text = `Running...`;
    await task.run();

    this.loggers.push(task.getLogger());

    const result = task.getResult();
    if (result === RunResult.Failed) {
      if (spinner.text === 'Running...') {
        spinner.text = 'Failed.';
      }
      spinner.failed();
    } else {
      if (spinner.text === 'Running...') {
        spinner.text = 'Done.';
      }
      spinner.succeed();
    }
  }

  private printHelpMessage() {
    console.log(chalk.bold.underline(this.name));
    console.log(
      `\n\nUsage: node ${path.basename(process.argv[1])} <command> [...flags]`
    );
    console.log(`\n\n${chalk.italic.underline('Available commands:')}`);
    this.getAvailableCommands().forEach((command) => {
      const task = this.tasks[command];

      const params = task.getParams().map((param) => `<${param}> `);
      console.log(
        `* ${chalk.bold(command)} ${params}- ${chalk.gray(
          task.getDescription()
        )}`
      );

      const flags = task.getFlags();
      if (flags.length > 0) {
        console.log(chalk.italic('\tFlags:'));
        task.getFlags().forEach((flag) => {
          console.log(
            `\t --${flag.name} (${chalk.gray(flag.description)})${
              flag.required === true ? ' [REQUIRED]' : ''
            }`
          );
        });
      }
    });
  }

  private getAvailableCommands() {
    return Object.keys(this.tasks).filter(
      (command) => !this.tasks[command].isInternalTask
    );
  }

  private printErrorMessage(title: string, message: string) {
    console.log(chalk.red(`${chalk.bold(`<!> ${title}`)}\n${message}`));
  }
}

export default TaskRunner;
