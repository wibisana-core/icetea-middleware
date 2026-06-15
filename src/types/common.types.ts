import {NextRequest, NextResponse} from "next/server";

export type MiddlewareExecutor = {
  (
    request: NextRequest,
    response: NextResponse,
    signal: ISignal,
    wrapper: MiddlewareWrapperInstance
  ): Promise<NextResponse>;
}

export type MiddlewareRoute = boolean | ((request: NextRequest) => boolean);

export interface MiddlewareInstance {
  route: MiddlewareRoute;
  executor: MiddlewareExecutor;
}

export interface ISignal {
  set(value: boolean): void;
  get(): boolean;
}

export interface MiddlewareWrapperInstance {
  register(middlewares: MiddlewareInstance[]): MiddlewareWrapperInstance;
  execute(): Promise<NextResponse | null>;
  redirect(url: string): NextResponse;
}