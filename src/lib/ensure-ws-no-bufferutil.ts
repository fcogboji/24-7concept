/**
 * Load before `ws` so optional native `bufferutil` is skipped. On some Node/OS combos a
 * broken bufferutil install causes: TypeError: bufferUtil.mask is not a function
 * (Neon serverless + Prisma uses `ws` for Postgres over WebSocket).
 * Override: WS_NO_BUFFER_UTIL=0 to try native acceleration.
 */
if (process.env.WS_NO_BUFFER_UTIL === undefined) {
  process.env.WS_NO_BUFFER_UTIL = "1";
}
