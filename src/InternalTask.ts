import Task from './Task';

abstract class InternalTask extends Task {
  public readonly isInternalTask = true;

  getDescription(): string {
    return '';
  }
}

export default InternalTask;
