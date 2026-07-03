import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@Hashibutogarasu/db";
import { users } from "@Hashibutogarasu/db/schema";
import { APIKeyRoute, OauthAppRoute, Read, Write } from "@/lib/api/route-auth";
import { getAdminAuth } from "@/lib/firebase-admin";

const patchBodySchema = z.object({ name: z.string().nullable() });

/**
 * Reads the authenticated user's profile.
 * Requires a Bearer token with the `profile` read permission.
 */
export const GET = APIKeyRoute()(
  OauthAppRoute()(
    Read()(async (_request, _ctx, auth) => {
      const db = getDb();
      const [user] = await db
        .select({ id: users.id, name: users.name })
        .from(users)
        .where(eq(users.id, auth.userId));

      if (!user) return NextResponse.json({ error: "not_found" }, { status: 404 });

      let { name } = user;
      if (name === null) {
        const firebaseUser = await getAdminAuth().getUser(user.id);
        name = firebaseUser.displayName ?? null;
        if (name !== null) {
          await db.update(users).set({ name, updatedAt: new Date() }).where(eq(users.id, user.id));
        }
      }

      return NextResponse.json({ id: user.id, name });
    }),
  ),
);

/**
 * Updates the authenticated user's display name.
 * Requires a Bearer token with the `profile` write permission.
 */
export const PATCH = APIKeyRoute()(
  OauthAppRoute()(
    Write()(async (request, _ctx, auth) => {
      const parsed = patchBodySchema.safeParse(await request.json());
      if (!parsed.success) {
        return NextResponse.json({ error: "invalid_request" }, { status: 400 });
      }
      const { name } = parsed.data;

      const db = getDb();
      const [updated] = await db
        .update(users)
        .set({ name: name ?? null, updatedAt: new Date() })
        .where(eq(users.id, auth.userId))
        .returning({ id: users.id, name: users.name });

      if (!updated) return NextResponse.json({ error: "not_found" }, { status: 404 });
      return NextResponse.json({ id: updated.id, name: updated.name });
    }),
  ),
);
