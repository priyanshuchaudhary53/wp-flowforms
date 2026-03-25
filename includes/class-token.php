<?php

if (! defined('ABSPATH')) exit; // Exit if accessed directly

/**
 * Token-based spam protection.
 *
 * Generates a daily-rotating token tied to the form ID and a server-side
 * secret. The token is embedded in the public form response so only browsers
 * that actually loaded the form via WordPress can obtain a valid token.
 *
 * Verification accepts tokens from the past 5 years (to handle pages cached
 * for weeks or months) plus a 45-minute future window (midnight edge cases).
 */
class FlowForms_Token
{
  /**
   * Retrieve (or generate) the persistent secret key.
   *
   * @since 1.0.0
   */
  private function get_secret_key(): string
  {
    $key = get_option('wpff_token_secret');
    if (! $key) {
      $key = wp_generate_password(32, false);
      update_option('wpff_token_secret', $key, false);
    }
    return $key;
  }

  /**
   * Generate a token for the current moment.
   *
   * @since 1.0.0
   */
  public function generate(int $form_id): string
  {
    return $this->generate_at(time(), $form_id);
  }

  /**
   * Verify a submitted token against a rolling window of valid values.
   *
   * Accepts tokens generated up to 5 years in the past (cached pages)
   * and up to 45 minutes in the future (midnight edge cases).
   *
   * @since 1.0.0
   *
   * @param string $token   Token submitted by the browser.
   * @param int    $form_id Form post ID.
   * @return bool True if valid.
   */
  public function verify(string $token, int $form_id): bool
  {
    $current = time();
    $valid   = [];

    for ($i = 1; $i <= 5 * 365; $i++) {
      $valid[] = $this->generate_at($current - ($i * DAY_IN_SECONDS), $form_id);
    }

    $valid[] = $this->generate_at($current, $form_id);
    $valid[] = $this->generate_at($current + (45 * MINUTE_IN_SECONDS), $form_id);

    return in_array($token, $valid, true);
  }

  /**
   * Generate a token for a specific Unix timestamp.
   *
   * @since 1.0.0
   */
  private function generate_at(int $timestamp, int $form_id): string
  {
    $date_string = gmdate('dmYzW', $timestamp);
    return md5($date_string . '::' . $form_id . $this->get_secret_key());
  }
}
