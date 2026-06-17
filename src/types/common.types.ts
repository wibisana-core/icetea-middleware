import { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
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
  redirect(url: string | URL): NextResponse;
  rewrite(url: string | URL): NextResponse;
  setHeaders(headers: Record<string, string>): void;
  setCookie(cookie: MiddlewareCookie): void;
  switchResponse(newResponse: NextResponse, response: NextResponse): void;
}

export type MiddlewareCookie = ResponseCookie