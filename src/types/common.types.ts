import {NextRequest, NextResponse} from "next/server";

export interface MiddlewareInstance {
  route: (request: NextRequest) => boolean | boolean;
  executor: (
    request: NextRequest,
    response: NextResponse,
    signal: ISignal,
  ) => Promise<NextResponse>;
}

export interface ISignal {
  set(value: boolean): void;
  get(): boolean;
}