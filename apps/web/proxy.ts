import { NextResponse } from "next/server";

export const config = {
  matcher: ["/", "/chat/:path*"],
};

// middleware.js
export function proxy() {
  return NextResponse.next();
}
