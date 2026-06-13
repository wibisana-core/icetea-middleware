# Ice Tea Middleware

A lightweight, flexible middleware pipeline for **Next.js** applications. Ice Tea Middleware provides a clean and extensible way to manage request/response middleware in your Next.js projects using class-based middleware instances with signal support.

## Features

- **Simple & Clean API** – Register and execute middlewares with minimal boilerplate
- **Signal-Based Early Termination** – Halt middleware execution when needed using signals
- **Route-Based Filtering** – Conditionally execute middlewares based on request matching
- **Zero-Config Setup** – Works out of the box with Next.js App Router and Pages Router
- **Response Migration** – Seamlessly transfer headers and cookies between responses
- **Core Middleware Support** – Execute essential middlewares on every request regardless of route
- **Async/Await Ready** – Built for modern asynchronous middleware execution

## Installation

```bash
npm install icetea-middleware
```

```bash
yarn add icetea-middleware
```

```bash
pnpm add icetea-middleware
```

## Quick Start

### 1. Create a Middleware Instance

Each middleware is an object implementing the `MiddlewareInstance` interface:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { ISignal } from "icetea-middleware";

export const loggerMiddleware = {
  name: "logger",
  route: () => true, // applies to all requests
  executor: async (
    request: NextRequest,
    response: NextResponse,
    signal: ISignal,
  ) => {
    console.log(`[${request.method}] ${request.nextUrl.pathname}`);
    return response;
  },
};
```

### 2. Set Up the Middleware Pipeline

Create a `middleware.ts` file at the root of your Next.js project:

```typescript
// middleware.ts
import { NextRequest } from "next/server";
import { MiddlewareWrapper } from "icetea-middleware";

export async function middleware(request: NextRequest) {
  const wrapper = new MiddlewareWrapper(request);

  wrapper.register([
    loggerMiddleware,
    // ... other middlewares
  ]);

  return await wrapper.execute();
}
```

## API Reference

### `MiddlewareWrapper`

The core class that orchestrates middleware execution.

#### `constructor(request: NextRequest)`

Creates a new middleware pipeline instance.

```typescript
const wrapper = new MiddlewareWrapper(request);
```

#### `register(middlewares: MiddlewareInstance[]): void`

Registers an array of middlewares. Core middlewares (those with a boolean `route`) are executed on every request, while route-based middlewares are filtered by their `route` function.

```typescript
wrapper.register([
  { name: "auth", route: true, executor: async (req, res, signal) => res },
  {
    name: "logging",
    route: (req) => req.nextUrl.pathname.startsWith("/api"),
    executor: async (req, res, signal) => res,
  },
]);
```

#### `execute(): Promise<NextResponse | null>`

Executes the registered middlewares sequentially. Returns a `NextResponse` or `null`.

```typescript
const response = await wrapper.execute();
```

#### `static switchResponse(newResponse: NextResponse, response: NextResponse): void`

Copies headers and cookies from one response to another. Useful when you need to create a new response but preserve existing headers/cookies.

```typescript
const newResponse = NextResponse.redirect(new URL("/login", request.url));
MiddlewareWrapper.switchResponse(newResponse, response);
```

### `Signal`

A simple signal mechanism to stop middleware execution early.

```typescript
import { Signal } from "icetea-middleware";

const signal = new Signal();
signal.set(); // triggers the signal
const isStopped = signal.get(); // boolean
```

## Types

### `MiddlewareInstance`

```typescript
interface MiddlewareInstance {
  name: string;
  route: boolean | ((request: NextRequest) => boolean);
  executor: (
    request: NextRequest,
    response: NextResponse,
    signal: ISignal,
  ) => Promise<NextResponse>;
}
```

| Property   | Type                                                   | Description                                                                                 |
| ---------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `name`     | `string`                                               | A descriptive name for the middleware (used for debugging/logging)                          |
| `route`    | `boolean \| ((request) => boolean)`                    | If `true`, runs on every request. If a function, executes when it returns `true`            |
| `executor` | `(request, response, signal) => Promise<NextResponse>` | The middleware logic. Receive the request, current response, and a signal to stop execution |

### `ISignal`

```typescript
interface ISignal {
  set: () => void;
  get: () => boolean;
}
```

## Examples

### Authentication Middleware

```typescript
import { NextRequest, NextResponse } from "next/server";
import { ISignal } from "icetea-middleware";

export const authMiddleware = {
  name: "auth",
  route: (request: NextRequest) => {
    const protectedPaths = ["/dashboard", "/profile", "/admin"];
    return protectedPaths.some((path) =>
      request.nextUrl.pathname.startsWith(path),
    );
  },
  executor: async (
    request: NextRequest,
    response: NextResponse,
    signal: ISignal,
  ) => {
    const token = request.cookies.get("session-token");

    if (!token) {
      signal.set();
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return response;
  },
};
```

### Rate Limiting Middleware

```typescript
import { NextRequest, NextResponse } from "next/server";
import { ISignal } from "icetea-middleware";

const rateLimit = new Map<string, { count: number; timestamp: number }>();

export const rateLimitMiddleware = {
  name: "rate-limit",
  route: (request: NextRequest) => request.nextUrl.pathname.startsWith("/api"),
  executor: async (
    request: NextRequest,
    response: NextResponse,
    signal: ISignal,
  ) => {
    const ip = request.ip ?? "unknown";
    const now = Date.now();
    const windowMs = 60_000; // 1 minute
    const maxRequests = 100;

    const entry = rateLimit.get(ip);

    if (!entry || now - entry.timestamp > windowMs) {
      rateLimit.set(ip, { count: 1, timestamp: now });
      return response;
    }

    entry.count++;

    if (entry.count > maxRequests) {
      signal.set();
      return new NextResponse("Too Many Requests", { status: 429 });
    }

    return response;
  },
};
```

## How It Works

1. **Initialization** – `MiddlewareWrapper` is instantiated with the incoming `NextRequest`.
2. **Registration** – Middlewares are registered via `register()`. They are split into two groups:
   - **Core middlewares** (`route: boolean`) – Always executed.
   - **Route middlewares** (`route: function`) – Executed only when the route function returns `true` for the current request.
3. **Execution** – `execute()` runs each middleware in order, passing the request, current response, and a `Signal` instance.
4. **Early Termination** – If any middleware calls `signal.set()`, the pipeline stops immediately and returns the current response.
5. **Response** – If execution completes without interruption, the default `NextResponse.next()` is returned.

## License

MIT © De Wibisana

---

<p align="center">Built with ❤️ for Next.js</p>
