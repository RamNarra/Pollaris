import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const url = new URL("/sign-in", request.url);
  // Pass along the redirect param if it exists
  const redirectParams = request.nextUrl.searchParams.get("redirect");
  if (redirectParams) {
    url.searchParams.set("redirect", redirectParams);
  }
  const response = NextResponse.redirect(url);
  response.cookies.delete("session");
  return response;
}
