import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

interface TestCookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'Lax' | 'Strict' | 'None';
  expires?: number;
}

interface CreateTestAccountResult {
  uid: string;
  email: string;
  password: string;
  idToken: string;
  refreshToken: string;
  sessionToken: string;
  cookies: TestCookie[];
}

async function createTestAccount(request: APIRequestContext, label: string): Promise<CreateTestAccountResult> {
  const res = await request.post('/api/test/accounts', { data: { label } });
  expect(res.ok(), `failed to create test account "${label}"`).toBeTruthy();
  return res.json();
}

async function deleteTestAccount(request: APIRequestContext, uid: string): Promise<void> {
  await request.delete('/api/test/accounts', { data: { uid } });
}

/**
 * Intercepts the Firebase Auth REST call the real email/password form makes
 * and fulfills it with a real ID/refresh token pair obtained server-side (via
 * the Admin SDK custom-token exchange in `/api/test/accounts`) — this Firebase
 * test project doesn't have email/password sign-in enabled as a provider, so
 * the form's own request would otherwise fail with `PASSWORD_LOGIN_DISABLED`.
 * The Firebase JS SDK completes sign-in exactly as it would for a genuine
 * response; no application code is touched. Registered once per test and
 * matches by email, so it transparently covers both the primary sign-in form
 * and the add-account dialog's embedded form (a different Firebase Auth
 * instance, same intercepted network call).
 */
async function mockPasswordSignIn(page: Page, ...accounts: CreateTestAccountResult[]) {
  const byEmail = new Map(accounts.map((a) => [a.email, a]));
  await page.route('**/v1/accounts:signInWithPassword*', async (route) => {
    const body = route.request().postDataJSON() as { email: string };
    const account = byEmail.get(body.email);
    if (!account) {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        kind: 'identitytoolkit#VerifyPasswordResponse',
        localId: account.uid,
        email: account.email,
        idToken: account.idToken,
        registered: true,
        refreshToken: account.refreshToken,
        expiresIn: '3600',
      }),
    });
  });
}

async function signInViaUi(page: Page, account: CreateTestAccountResult) {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'メールアドレス' }).fill(account.email);
  await page.getByRole('textbox', { name: 'パスワード' }).fill(account.password);
  await page.getByRole('button', { name: 'サインイン', exact: true }).click();
  await page.waitForURL('/settings');
}

/** The sidebar's account-switcher popup — scoped to avoid matching the same email shown in page content. */
function sidebarFooter(page: Page) {
  return page.locator('[data-slot="sidebar-footer"]');
}

test.describe('multi-account switching', () => {
  test.describe.configure({ mode: 'serial' });

  let accountA: CreateTestAccountResult;
  let accountB: CreateTestAccountResult;

  test.beforeAll(async ({ request }) => {
    accountA = await createTestAccount(request, 'a');
    accountB = await createTestAccount(request, 'b');
  });

  test.afterAll(async ({ request }) => {
    await deleteTestAccount(request, accountA.uid);
    await deleteTestAccount(request, accountB.uid);
    const res = await request.get('/api/auth/accounts');
    if (res.ok()) {
      const { accounts } = (await res.json()) as { accounts: { uid: string }[] };
      expect(accounts.some((a) => a.uid === accountA.uid || a.uid === accountB.uid)).toBe(false);
    }
  });

  test('creates a test account and signs in', async ({ page }) => {
    await mockPasswordSignIn(page, accountA);
    await signInViaUi(page, accountA);
    await expect(sidebarFooter(page).getByText(accountA.email)).toBeVisible();
  });

  test('adds a second account and switches between them', async ({ page }) => {
    await mockPasswordSignIn(page, accountA, accountB);
    await signInViaUi(page, accountA);
    await expect(sidebarFooter(page).getByText(accountA.email)).toBeVisible();

    await sidebarFooter(page).getByText(accountA.email).click();
    await page.getByText('別のアカウントを追加').click();

    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox', { name: 'メールアドレス' }).fill(accountB.email);
    await dialog.getByRole('textbox', { name: 'パスワード' }).fill(accountB.password);
    await dialog.getByRole('button', { name: 'サインイン', exact: true }).click();
    await expect(dialog).not.toBeAttached({ timeout: 15000 });

    await sidebarFooter(page).getByText(accountA.email).click();
    await expect(page.getByText(accountB.email).first()).toBeVisible();
    await page.getByText(accountB.email).first().click();

    await expect(sidebarFooter(page).getByText(accountB.email).first()).toBeVisible({ timeout: 10000 });

    const accountsRes = await page.request.get('/api/auth/accounts');
    expect(accountsRes.ok()).toBeTruthy();
    const { activeUid } = (await accountsRes.json()) as { activeUid: string | null };
    expect(activeUid).toBe(accountB.uid);
  });

  test('removes a bridged account', async ({ page, context }) => {
    await context.addCookies(accountA.cookies);
    await page.goto('/settings');

    const addRes = await page.request.post('/api/auth/accounts/add', {
      data: { idToken: accountB.idToken },
    });
    expect(addRes.ok()).toBeTruthy();
    const added = (await addRes.json()) as { sessionToken: string };

    const removeRes = await page.request.post('/api/auth/accounts/remove', {
      data: { sessionToken: added.sessionToken },
    });
    expect(removeRes.ok()).toBeTruthy();

    const listRes = await page.request.get('/api/auth/accounts');
    const { accounts } = (await listRes.json()) as { accounts: { uid: string }[] };
    expect(accounts.some((a) => a.uid === accountB.uid)).toBe(false);
  });
});
