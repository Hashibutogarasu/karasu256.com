import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { deleteUploadedImage } from '@Hashibutogarasu/utils/server';
import { getAdminAuth } from '@/lib/firebase-admin';
import { requireSession } from '@/lib/api/require-session';
import { badRequest } from '@/lib/api/responses';
import { SESSION_COOKIE_NAME } from '@/lib/session';

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

  const uploadForm = new FormData();
  uploadForm.append('file', file);
  uploadForm.append('path', `users/${user.uid}/avatar.png`);

  const uploadRes = await fetch(`${imageApiUrl}/upload`, {
    method: 'POST',
    body: uploadForm,
    headers: { Cookie: `${SESSION_COOKIE_NAME}=${sessionCookie}` },
  });
  if (!uploadRes.ok) {
    const body = await uploadRes.json().catch(() => ({ error: 'upload_failed' }));
    return NextResponse.json(body, { status: uploadRes.status });
  }
  const { url } = (await uploadRes.json()) as { url: string };

  const previous = await getAdminAuth().getUser(user.uid);
  await getAdminAuth().updateUser(user.uid, { photoURL: url });
  await cleanupPreviousIcon(previous.photoURL, url, imageApiUrl, sessionCookie);

  return NextResponse.json({ photoURL: url });
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
