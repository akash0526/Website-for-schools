import { test, expect, type Page, type APIRequestContext } from '@playwright/test';
import path from 'node:path';
const photo = path.resolve('client/public/images/classroom.jpg');
async function signIn(page: Page, request: APIRequestContext) {
  const response = await request.post('/api/admin/auth/demo');
  const { data } = await response.json();
  await page.addInitScript(
    (token) => sessionStorage.setItem('schoolsite-demo-token', token),
    data.token,
  );
  return data.token as string;
}
async function cleanup(request: APIRequestContext, token: string, resource: string, title: string) {
  const response = await request.get(
    `/api/admin/${resource}?search=${encodeURIComponent(title)}&limit=100`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const { data } = await response.json();
  for (const item of data.items)
    if (item.title === title)
      await request.delete(`/api/admin/${resource}/${item.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
}

test('public navigation, event filters, gallery lightbox, and mobile menu', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Big dreams.*Bright futures/ })).toBeVisible();
  await page.getByRole('link', { name: 'All school events' }).click();
  await expect(
    page.getByRole('heading', { name: 'Young Scientists, Big Discoveries' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Past events' }).click();
  await expect(page.getByRole('heading', { name: 'Celebrating How Far We’ve Come' })).toBeVisible();
  await page.getByRole('button', { name: 'Upcoming events' }).click();
  await page.getByRole('link', { name: 'View Young Scientists, Big Discoveries' }).click();
  await expect(page.getByRole('button', { name: 'Add to my calendar' })).toBeVisible();
  await page.goto('/gallery');
  await page.getByRole('link', { name: /Curious minds at work/ }).click();
  await page
    .getByRole('button', { name: /Enlarge photo/ })
    .first()
    .click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Our school' })
    .click();
  await expect(page.getByRole('heading', { name: 'OUR PURPOSE' })).toHaveCount(0);
  await expect(page.getByText('THIS IS OUR STORY')).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBeTruthy();
  expect(errors).toEqual([]);
});

test('school staff create an illustrated draft, publish it, and see it on the public site', async ({
  page,
  request,
}) => {
  const token = await signIn(page, request),
    title = `E2E Open Day ${Date.now()}`;
  try {
    await page.goto('/admin/events');
    await page.getByRole('button', { name: 'Add event', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Event title').fill(title);
    await dialog.getByLabel('Location', { exact: false }).fill('Our school hall');
    await dialog
      .getByLabel('Tell families about the event')
      .fill('A wonderful opportunity to meet our teachers and explore the school.');
    await dialog.locator('input[type="file"]').setInputFiles(photo);
    await expect(dialog.getByText('Looking good.')).toBeVisible();
    await dialog.getByLabel('Image description').fill('A teacher reading with children');
    await dialog.getByRole('button', { name: 'Save changes' }).click();
    await expect(dialog).toHaveCount(0);
    const row = page.getByRole('row').filter({ hasText: title });
    await expect(row.getByText('Draft', { exact: true })).toBeVisible();
    await row.getByTitle('Publish to website').click();
    await expect(row.getByText('Published', { exact: true })).toBeVisible();
    await page.goto('/events');
    await page.getByRole('textbox', { name: 'Search events' }).fill(title);
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
    await page.getByRole('link', { name: `View ${title}`, exact: false }).click();
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
    await expect(page.getByAltText('A teacher reading with children')).toBeVisible();
  } finally {
    await cleanup(request, token, 'events', title);
  }
});

test('school owner edits website identity and the public header updates', async ({
  page,
  request,
}) => {
  const token = await signIn(page, request);
  const original = await (
    await request.get('/api/admin/settings', { headers: { Authorization: `Bearer ${token}` } })
  ).json();
  try {
    await page.goto('/admin/settings');
    await page.getByLabel('School tagline').fill('A test tagline for a bright school day.');
    await page.getByRole('button', { name: 'Save website changes' }).click();
    await expect(page.getByText('Everything is up to date')).toBeVisible();
    await page.goto('/');
    await expect(page.locator('.utility-bar')).toContainText(
      'A test tagline for a bright school day.',
    );
  } finally {
    await request.patch('/api/admin/settings', {
      headers: { Authorization: `Bearer ${token}` },
      data: { tagline: original.data.tagline },
    });
  }
});

test('school staff create an album, upload a photograph, and publish the memory', async ({
  page,
  request,
}) => {
  const token = await signIn(page, request),
    title = `E2E Memories ${Date.now()}`;
  try {
    await page.goto('/admin/gallery');
    await page.getByRole('button', { name: 'Create an album', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Album title').fill(title);
    await dialog
      .getByLabel('A little about this album')
      .fill('A test album full of happy school moments.');
    await dialog.getByRole('button', { name: 'Save changes' }).click();
    await expect(dialog).toHaveCount(0);
    await page.getByRole('link', { name: title, exact: true }).click();
    await page.locator('.gallery-upload-zone input[type="file"]').setInputFiles(photo);
    await expect(page.locator('.admin-photo-card')).toHaveCount(1);
    await page.getByRole('button', { name: 'Publish album', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Unpublish album' })).toBeVisible();
    await page.goto('/gallery');
    await page.getByRole('textbox', { name: 'Search albums' }).fill(title);
    await page.getByRole('link', { name: new RegExp(title) }).click();
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
    await expect(page.getByRole('button', { name: /Enlarge photo/ })).toHaveCount(1);
  } finally {
    await cleanup(request, token, 'albums', title);
  }
});

test('a family sends an enquiry and only the owner can read it', async ({ page, request }) => {
  const name = `E2E Family ${Date.now()}`;
  let token = '',
    id = '';
  try {
    await page.goto('/contact');
    await page.getByLabel('Your name').fill(name);
    await page.getByLabel('Email address').fill('e2e@example.com');
    await page
      .getByLabel('What’s on your mind?')
      .fill('We would love to arrange a school visit next week.');
    await page.getByRole('button', { name: 'Send my enquiry' }).click();
    await expect(page.getByRole('heading', { name: 'A lovely first step.' })).toBeVisible();
    token = await signIn(page, request);
    await page.goto('/admin/inquiries');
    await page.getByRole('button').filter({ hasText: name }).click();
    await expect(page.getByRole('dialog').getByRole('heading', { name })).toBeVisible();
    await expect(
      page.getByText('We would love to arrange a school visit next week.'),
    ).toBeVisible();
    const response = await request.get('/api/admin/inquiries', {
      headers: { Authorization: `Bearer ${token}` },
    });
    id = (await response.json()).data.items.find((item: { name: string }) => item.name === name).id;
  } finally {
    if (token && id)
      await request.delete(`/api/admin/inquiries/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  }
});

test('key public and administrator screens pass automated accessibility checks', async ({
  page,
  request,
}) => {
  test.setTimeout(60000);
  const { default: AxeBuilder } = await import('@axe-core/playwright');
  for (const route of ['/', '/our-school', '/contact', '/admin/login']) {
    await page.goto(route);
    await page.locator('h1').first().waitFor();
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations, `Accessibility issues at ${route}`).toEqual([]);
  }
  await signIn(page, request);
  for (const route of ['/admin', '/admin/events', '/admin/settings']) {
    await page.goto(route);
    await page.locator('h1').first().waitFor();
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations, `Accessibility issues at ${route}`).toEqual([]);
  }
  await page.goto('/admin/events');
  await page.getByRole('button', { name: 'Add event', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.waitForTimeout(350); // Allow the drawer's entrance animation to finish before scanning.
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations, 'Accessibility issues in event editor').toEqual([]);
});
