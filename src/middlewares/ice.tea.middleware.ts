import { NextRequest, NextResponse } from "next/server";
import {ISignal, MiddlewareCookie, MiddlewareInstance, MiddlewareWrapperInstance} from "../types/common.types"
import { Signal } from "../utils/signal";

export class MiddlewareWrapper implements MiddlewareWrapperInstance {
  private signal: ISignal;
  private request: NextRequest;
  private response: NextResponse;
  private coreMiddleware: MiddlewareInstance[];
  private middlewares: MiddlewareInstance[];
  private tempResponse: NextResponse | null;

  private headers: { key: string, value: string }[]
  private cookies: MiddlewareCookie[]

  private defaultCookieOptions: MiddlewareCookie

  constructor(request: NextRequest){
    if (!request) throw new Error("Request is required");

    this.request = request;
    this.response = NextResponse.next();

    this.signal = new Signal();
    this.coreMiddleware = [];
    this.middlewares = [];
    this.tempResponse = null;

    this.headers = []
    this.cookies = []
    
    this.defaultCookieOptions = {
      name: "",
      value: "",
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" || true,
      sameSite: "strict",
    }

    return this
  }

  setHeaders(header: { key: string, value: string }) {
    this.headers.push(header)
    return this
  }

  setCookie(options: MiddlewareCookie) {
    this.cookies.push(options)
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
      this.modifyHttpResponse(this.tempResponse)
      if (this.signal.get()) break;
    }

    if (this.signal.get()) return this.tempResponse;

    return this.tempResponse || this.response;
  }

  redirect(url: string | URL): NextResponse {
    const currentResponse = this.tempResponse || this.response

    const redirectResponse = NextResponse.redirect(url instanceof URL ? url : new URL(url, this.request.url));
    this.switchResponse(redirectResponse, currentResponse);

    return redirectResponse
  }

  rewrite(url: string | URL): NextResponse {
    const currentResponse = this.tempResponse || this.response

    const rewriteResponse = NextResponse.rewrite(url instanceof URL ? url : new URL(url, this.request.url));
    this.switchResponse(rewriteResponse, currentResponse);

    return rewriteResponse
  }

  modifyHttpResponse(response: NextResponse): void {
    // modify headers
    if(this.headers?.length > 0)
      this.headers.forEach(({key, value}) => {
        response.headers.set(key, value)
      })

    if(this.cookies?.length > 0)
      this.cookies.forEach((cookie) => {
        response.cookies.set({...this.defaultCookieOptions, ...cookie})
      })
  }
  
  switchResponse(newResponse: NextResponse, response: NextResponse) {
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

  static create(request: NextRequest): MiddlewareWrapper {
    return new MiddlewareWrapper(request);
  }
}