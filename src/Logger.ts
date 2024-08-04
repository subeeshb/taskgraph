import chalk from 'chalk';

type LogType = 'info' | 'warn' | 'error';

export type DeferredLogData = {
  type: LogType;
  message: string;
  params?: any[];
};

class Logger {
  private tag: string = '';
  private logData: DeferredLogData[] = [];

  setTag(tag: string) {
    this.tag = tag;
  }

  private log(type: LogType, message: string, params?: any[]) {
    this.logData.push({
      type,
      message: `[${this.tag}] ${message}`,
      params,
    });
  }

  /**
   * Logs a message with the "INFO" level. Logs will be printed after the task has executed.
   * @param message The message to log.
   * @param params (Optional) Params to log along with the message.
   */
  info(message: string, params?: any) {
    this.log('info', message, params);
  }

  /**
   * Logs a message with the "WARN" level. Logs will be printed after the task has executed.
   * @param message The message to log.
   * @param params (Optional) Params to log along with the message.
   */
  warn(message: string, params?: any) {
    this.log('warn', message, params);
  }

  /**
   * Logs a message with the "ERROR" level. Logs will be printed after the task has executed.
   * @param message The message to log.
   * @param params (Optional) Params to log along with the message.
   */
  error(message: string, params?: any) {
    this.log('error', message, params);
  }

  printLogs() {
    this.logData.forEach((data) => {
      let level;
      switch (data.type) {
        case 'info':
          level = chalk.blue('INFO:');
          break;
        case 'warn':
          level = chalk.yellow('WARN:');
          break;
        case 'error':
          level = chalk.red('ERROR:');
          break;
      }

      if (data.params != null) {
        console.log(`${level}\t${data.message}`, data.params);
      } else {
        console.log(`${level}\t${data.message}`);
      }
    });
  }
}

export default Logger;
