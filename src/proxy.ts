import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  getAuthenticatedRedirectPath,
  getUserPassionStatus,
  isAuthRoute,
  isProtectedRoute,
} from "@/lib/auth";
import { getSupabaseEnv } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

function createRedirectResponse(
  request: NextRequest,
  sourceResponse: NextResponse,
  targetPath: string,
): NextResponse {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = targetPath;
  redirectUrl.search = "";

  const redirectResponse = NextResponse.redirect(redirectUrl);
  sourceResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });
  sourceResponse.headers.forEach((value, key) => {
    redirectResponse.headers.set(key, value);
  });

  return redirectResponse;
}

export async function proxy(request: NextRequest) {
  const { url, anonKey } = getSupabaseEnv();
  const pathname = request.nextUrl.pathname;
  const isLandingPage = pathname === "/";
  const inAuthArea = isAuthRoute(pathname);
  const inProtectedArea = isProtectedRoute(pathname);

  const response = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll().map(({ name, value }) => ({ name, value }));
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    if (inProtectedArea) {
      return createRedirectResponse(request, response, "/login");
    }
    return response;
  }

  const { hasPassions } = await getUserPassionStatus(supabase, user);
  const authenticatedRedirect = getAuthenticatedRedirectPath(hasPassions);

  if (inAuthArea || isLandingPage) {
    return createRedirectResponse(request, response, authenticatedRedirect);
  }

  if (!hasPassions && pathname !== "/onboarding") {
    return createRedirectResponse(request, response, "/onboarding");
  }

  if (hasPassions && pathname === "/onboarding") {
    return createRedirectResponse(request, response, "/feed");
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)"],
};
