import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { deleteUploadedImage, uploadImage } from '@Hashibutogarasu/utils/server';
import { getAdminAuth } from '@/lib/firebase-admin';
import { getProviderProfile } from '@/lib/auth/provider-profile';
import { requireSession } from '@/lib/api/require-session';
import { badRequest } from '@/lib/api/responses';
import { SESSION_COOKIE_NAME } from '@/lib/session';

const putBodySchema = z.object({ providerId: z.string().min(1) });

/**
 * Removes the previous icon from the image API when it was hosted there and
 * differs from the value it's being replaced by.
 */
async function cleanupPreviousIcon(
  previousPhotoURL: string | undefined,
  nextPhotoURL: string | null,
  imageApiUrl: string | undefined,
  sessionCookie: string | undefined
): Promise<void> {
  if (!imageApiUrl || !sessionCookie || !previousPhotoURL || previousPhotoURL === nextPhotoURL) return;
  await deleteUploadedImage(previousPhotoURL, { imageApiUrl, sessionCookie });
}

/**
 * Uploads the authenticated user's icon via the image API and updates the
 * Firebase Auth `photoURL` to point at it, deleting the previous icon once
 * the new one is persisted.
 *
 * POST /api/user/icon
 */
export async function POST(request: NextRequest) {
  const { user, error } = await requireSession();
  if (error) return error;

  const imageApiUrl = process.env.NEXT_PUBLIC_IMAGE_API_URL;
  if (!imageApiUrl) {
    return NextResponse.json({ error: 'image_api_not_configured' }, { status: 500 });
  }

  const incoming = await request.formData();
  const file = incoming.get('file');
  if (!(file instanceof File)) return badRequest();

  const sessionCookie = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const result = await uploadImage(file, {
    imageApiUrl,
    sessionCookie,
    path: `users/${user.uid}/avatar.png`,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  const { url } = result;

  const previous = await getAdminAuth().getUser(user.uid);
  await getAdminAuth().updateUser(user.uid, { photoURL: url });
  await cleanupPreviousIcon(previous.photoURL, url, imageApiUrl, sessionCookie);

  return NextResponse.json({ photoURL: url });
}

/**
 * Sets the authenticated user's icon to a linked provider's avatar,
 * re-deriving the avatar URL from the provider account server-side rather
 * than trusting a client-supplied URL.
 *
 * PUT /api/user/icon
 */
export async function PUT(request: NextRequest) {
  const { user, error } = await requireSession();
  if (error) return error;

  const parsed = putBodySchema.safeParse(await request.json());
  if (!parsed.success) return badRequest();

  const profile = await getProviderProfile(user.uid, parsed.data.providerId);
  if (!profile || !profile.avatarUrl) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const imageApiUrl = process.env.NEXT_PUBLIC_IMAGE_API_URL;
  const sessionCookie = (await cookies()).get(SESSION_COOKIE_NAME)?.value;

  const previous = await getAdminAuth().getUser(user.uid);
  await getAdminAuth().updateUser(user.uid, { photoURL: profile.avatarUrl });
  await cleanupPreviousIcon(previous.photoURL, profile.avatarUrl, imageApiUrl, sessionCookie);

  return NextResponse.json({ photoURL: profile.avatarUrl });
}

/**
 * Clears the authenticated user's icon, removing it from the image API when
 * it was hosted there.
 *
 * DELETE /api/user/icon
 */
export async function DELETE() {
  const { user, error } = await requireSession();
  if (error) return error;

  const imageApiUrl = process.env.NEXT_PUBLIC_IMAGE_API_URL;
  const sessionCookie = (await cookies()).get(SESSION_COOKIE_NAME)?.value;

  const previous = await getAdminAuth().getUser(user.uid);
  await getAdminAuth().updateUser(user.uid, { photoURL: null });
  await cleanupPreviousIcon(previous.photoURL, null, imageApiUrl, sessionCookie);

  return NextResponse.json({ photoURL: null });
}
