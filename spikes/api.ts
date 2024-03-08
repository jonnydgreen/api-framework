export class Controller {
  @Post()
  public getHello(): Hello {
    return {
      name: "name",
      address: "address",
    };
  }
}

export type ClassType = new (...args: unknown[]) => unknown;

export interface Hello {
  name: string;
  address: string;
}

function Post() {
  return function post<T>(
    target: T,
    context: ClassMethodDecoratorContext,
  ): void {
    const methodName = context.name;
    if (context.private) {
      throw new Error(
        `'bound' cannot decorate private properties like ${methodName as string}.`,
      );
    }
    context.addInitializer(function (this: unknown) {
      const thisArg = this as ClassType;
      const className = thisArg.constructor.name;
      console.log({ className, methodName, this: this, target, context });
    });
  };
}

const c = new Controller();
c.getHello();
