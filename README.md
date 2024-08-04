# TaskGraph

![taskgraph](https://github.com/user-attachments/assets/187d3121-5c43-4937-910d-e0143d513219)

TaskGraph is a task runner for Node.js that facilitates the creation of CLI utilities and build tools. It allows you to define tasks and their dependencies, ensuring that all required tasks are executed in the correct order.

## How to use

### Task

The basic unit of work is a `Task`. A Task is a distinct action that users of your CLI tool can invoke. To define a Task, create a class that extends the `Task` class and define the `getCommand()`, `getDescription()` and `run()` methods:

```typescript
import { Task } from 'taskgraph';

class BuildWebApp extends Task {
  getCommand() {
    return 'build-web';
  }

  getDescription() {
    return 'Builds the web app';
  }

  async run() {
    // Do something here...
  }
}
```

#### Params and flags

You can define any required params and optional flags using the `getParams()` and `getFlags()` methods. To access the values of a flag or param when the task is being run, call the `getParam(name)` or `getFlag(name)` method.

```typescript
import { Task } from 'taskgraph';

class BuildWebApp extends Task {
  getCommand() {
    return 'build-web';
  }

  getDescription() {
    return 'Builds the web app';
  }

  getFlags() {
    return [
      { name: 'minify', description: 'Whether to minify the source code' },
    ];
  }

  getParams() {
    return ['folder_name'];
  }

  async run() {
    const minify = this.getFlag('minify');
    const folderName = this.getParam('folder_name');

    // Do something here...
  }
}
```

#### Dependencies

You can define any pre-requisite tasks using the `getDependencies()` method. Any params or flags set when invoking the CLI tool will be passed to each task executed as a dependency. You can choose to override the params for a dependency by setting the `paramsOverride` property.

Note that dependencies are executed in parallel, not in the order they're defined in.

```typescript
import { Task } from 'taskgraph';

class BuildCSS extends Task {
  // ... Implements the "build-css" command.
}

class BuildJS extends Task {
  // ... Implements the "build-js" command.
}

class BuildWebApp extends Task {
  getCommand() {
    return 'build-web';
  }

  getDescription() {
    return 'Builds the web app';
  }

  getDependencies() {
    return [
      { command: 'build-css', paramsOverride: ['scss'] },
      { command: 'build-js' },
    ];
  }

  getFlags() {
    return [
      { name: 'minify', description: 'Whether to minify the source code' },
    ];
  }

  getParams() {
    return ['folder_name'];
  }

  async run() {
    const minify = this.getFlag('minify');
    const folderName = this.getParam('folder_name');

    // Do something here...
  }
}
```

#### Internal tasks

You can create a task extending the `InternalTask` class to define a non-user-callable task. These tasks cannot be explicitly invoked by the user, but can be referenced as dependencies by other tasks. When extending `InternalTask`, you do not need to implement the `getDescription()` method.

#### Reference

Here's a reference of other useful methods in the `Task` class:

| Method                          | Description                                                                                                                             |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `getTaskLabel(label: string)`   | Sets a label to be shown next to the progress spinner identifying the task. If not specified, the task's command will be shown instead. |
| `setResult(result: RunResult)`  | Sets the outcome of the task. Set this to either `RunResult.Success` or `RunResult.Failed`.                                             |
| `setProgressText(text: string)` | Sets the text to be shown on the progress spinner. Use this to update the progress of the task.                                         |

### TaskRunner

To create a CLI tool that executes your tasks, use the `TaskRunner` class. Create an instance of this class, register your tasks, then call the `run()` method.

```typescript
const runner = new TaskRunner('Example CLI');

runner.registerTask(BuildWebApp);
runner.registerTask(BuildJS);
runner.registerTask(BuildCSS);

await runner.run();
```
