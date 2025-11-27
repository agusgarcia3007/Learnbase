import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import {
  TOKEN_EXPIRATION,
  JWT_SECRET,
  REFRESH_SECRET,
  RESET_SECRET,
} from "@/lib/constants";

export const jwtPlugin = new Elysia({ name: "jwt" })
  .use(
    jwt({
      name: "jwt",
      secret: JWT_SECRET,
      exp: TOKEN_EXPIRATION.ACCESS,
    })
  )
  .use(
    jwt({
      name: "refreshJwt",
      secret: REFRESH_SECRET,
      exp: TOKEN_EXPIRATION.REFRESH,
    })
  )
  .use(
    jwt({
      name: "resetJwt",
      secret: RESET_SECRET,
      exp: TOKEN_EXPIRATION.RESET,
    })
  );
