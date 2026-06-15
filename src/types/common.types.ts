import {NextRequest, NextResponse} from "next/server";

export interface MiddlewareInstance {
  route: boolean | ((request: NextRequest) => boolean);
  executor: (
    request: NextRequest,
    response: NextResponse,
    signal: ISignal,
    wrapper: MiddlewareWrapperInstance
  ) => Promise<NextResponse>;
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