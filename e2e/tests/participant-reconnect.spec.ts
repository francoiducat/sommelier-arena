/**
 * participant-reconnect.spec.ts
 * R5-A fix: PartySocket fires `close` on every reconnect — participant must NOT
 * see "Session Ended" due to a transient close event.
 *
 * These smoke tests verify the *initial state* of /play is correct (join form
 * visible, no false "Session Ended" screen). The real reconnect scenario
 * (where the socket momentarily closes and re-opens while the participant is in
 * lobby/question) requires the full Docker stack and is covered by the
 * full-game.spec.ts integration tests.
 *
 * Tags: @smoke
 */
import { test, expect } from '@playwright/test';

test.describe('@smoke participant reconnect', () => {
  test('participant join page does not show Session Ended on load @smoke', async ({ page }) => {
    await page.goto('/play');

    await test.step('Verify "Session Ended" is not shown on initial load', async () => {
      // R5-A regression guard: a spurious socket close must not trigger the
      // "Session Ended" screen before the participant has even joined.
      await expect(page.getByText('Session Ended', { exact: false })).not.toBeVisible();
    });

    await test.step('Verify the code input field is visible', async () => {
      await expect(page.getByRole('textbox')).toBeVisible();
    });
  });

  test('participant join page shows session code input @smoke', async ({ page }) => {
    await page.goto('/play');

    await test.step('Join form renders with a text input for the session code', async () => {
      // The code input should be present and empty — ready for the participant
      // to type a 4-digit code.
      const codeInput = page.getByRole('textbox');
      await expect(codeInput).toBeVisible();
      await expect(codeInput).toHaveValue('');
    });
  });
});
