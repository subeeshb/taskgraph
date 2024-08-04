import Task, { TaskFlag, TaskDependency, RunResult } from './Task';
import InternalTask from './InternalTask';
import TaskRunner from './TaskRunner';

export type { TaskFlag, TaskDependency };
export default {
  InternalTask,
  Task,
  TaskRunner,
  RunResult,
};
