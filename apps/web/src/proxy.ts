import { clerkMiddleware } from "@clerk/nextjs/server";

// Next.js 16 renamed middleware.ts -> proxy.ts (same NextMiddleware signature,
// see node_modules/next/dist/docs/.../file-conventions/proxy.md). This is a
// defense-in-depth nicety on top of the per-page client-side guards every
// dashboard layout already does + the NestJS API's own auth enforcement —
// nothing here is the actual security boundary.
export const proxy = clerkMiddleware({
  authorizedParties: [process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"],
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
