import { NextRequest, NextResponse } from "next/server";
import {ISignal, MiddlewareInstance, MiddlewareWrapperInstance} from "../types/common.types"
import { Signal } from "../utils/signal";

export class MiddlewareWrapper implements MiddlewareWrapperInstance {
  private signal: ISignal;
  private request: NextRequest;
  private response: NextResponse;
  private coreMiddleware: MiddlewareInstance[];
  private middlewares: MiddlewareInstance[];
  private tempResponse: NextResponse | null;

  constructor(request: NextRequest){
    if (!request) throw new Error("Request is required");

    this.request = request;
    this.response = NextResponse.next();

    this.signal = new Signal();
    this.coreMiddleware = [];
    this.middlewares = [];
    this.tempResponse = null;

    return this
  }

  register(middlewares: MiddlewareInstance[]): MiddlewareWrapperInstance {
    if (!Boolean(middlewares.length)) return this;

    // filter core middleware
    this.coreMiddleware = middlewares?.filter(
      (midd) => typeof midd.route === "boolean" && midd,
    );

    // filter normal middleware
    this.middlewares = middlewares?.filter(
      (midd) => typeof midd.route === "function" && midd.route(this.request),
    );

    return this
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
        this
      );
      if (this.signal.get()) break;
    }

    if (this.signal.get()) return this.tempResponse;

    return this.response;
  }

  redirect(url: string): NextResponse {
    const redirectResponse = NextResponse.redirect(new URL(url, this.request.url));
    MiddlewareWrapper.switchResponse(redirectResponse, this.response);

    return redirectResponse
  }

  rewrite(url: string): NextResponse {
    const rewriteResponse = NextResponse.rewrite(new URL(url, this.request.url));
    MiddlewareWrapper.switchResponse(rewriteResponse, this.response);

    return rewriteResponse
  }

  static create(request: NextRequest): MiddlewareWrapper {
    return new MiddlewareWrapper(request);
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