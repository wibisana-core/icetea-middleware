import { NextRequest, NextResponse } from "next/server";
import {ISignal, MiddlewareInstance} from "../types/common.types"
import { Signal } from "./signal";

export class MiddlewareWrapper {
  private signal: ISignal;
  private request: NextRequest;
  private response: NextResponse;
  private coreMiddleware: MiddlewareInstance[];
  private middlewares: MiddlewareInstance[];
  private tempResponse: NextResponse | null;

  constructor(request: NextRequest) {
    if (!request) throw new Error("Request is required");

    this.request = request;
    this.response = NextResponse.next();

    this.signal = new Signal();
    this.coreMiddleware = [];
    this.middlewares = [];
    this.tempResponse = null;
  }

  register(middlewares: MiddlewareInstance[]): void {
    if (!Boolean(middlewares.length)) return;

    // filter core middleware
    this.coreMiddleware = middlewares?.filter(
      (midd) => typeof midd.route === "boolean" && midd,
    );

    // filter normal middleware
    this.middlewares = middlewares?.filter(
      (midd) => typeof midd.route === "function" && midd.route(this.request),
    );
  }

  async execute(): Promise<NextResponse | null> {
    const MIDDLEWARE = [...this.coreMiddleware, ...this.middlewares];
    // execute with promise
    if (MIDDLEWARE.length === 0) return this.response

    for (const middleware of MIDDLEWARE) {
      this.tempResponse = await middleware.executor(
        this.request,
        this.tempResponse || this.response,
        this.signal,
      );
      if (this.signal.get()) break;
    }

    if (this.signal.get()) return this.tempResponse;

    return this.response;
  }

  static switchResponse(newResponse: NextResponse, response: NextResponse) {
    // setHeaders from old response to new response
    for (const [key, value] of response.headers.entries()) {
      newResponse.headers.set(key, value);
    }

    // setCookies from old response to new response
    response.cookies.getAll().forEach((cookie) => {
      newResponse.cookies.set(cookie.name, cookie.value, {
        path: cookie.path,
        domain: cookie.domain,
        expires: cookie.expires,
        httpOnly: cookie.httpOnly,
        secure: cookie.secure,
        sameSite: cookie.sameSite,
      });
    });
  }
}