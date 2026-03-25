<?php

if (! defined('ABSPATH')) exit; // Exit if accessed directly

/**
 * Akismet integration for WP FlowForms.
 *
 * Optional layer — only active when Akismet is installed, activated,
 * and configured with a valid API key. Silently skipped otherwise.
 */
class FlowForms_Akismet
{
  /**
   * Check whether Akismet is installed, active, and configured.
   *
   * @return bool
   */
  public static function is_available(): bool
  {
    return file_exists(WP_PLUGIN_DIR . '/akismet/akismet.php')
      && is_callable(['Akismet', 'get_api_key'])
      && ! empty(Akismet::get_api_key());
  }

  /**
   * Check whether a submission looks like spam.
   *
   * Sends text-based field values to the Akismet comment-check API.
   * Only short_text, long_text, and email field types are evaluated.
   *
   * @param int   $form_id   Form post ID.
   * @param array $answers   Sanitized answers keyed by question UUID.
   * @param array $questions Questions array from published form content.
   * @return bool True = spam, false = not spam.
   */
  public function check(int $form_id, array $answers, array $questions): bool
  {
    $data = [
      'blog'         => home_url(),
      'blog_charset' => 'UTF-8',
      'user_ip'      => sanitize_text_field($_SERVER['REMOTE_ADDR'] ?? ''),
      'user_agent'   => sanitize_text_field($_SERVER['HTTP_USER_AGENT'] ?? ''),
      'comment_type' => 'contact-form',
    ];

    $email_set     = false;
    $author_set    = false;
    $content_parts = [];

    foreach ($questions as $question) {
      $type = $question['type'] ?? '';
      $uuid = $question['id']   ?? '';

      if (! in_array($type, ['short_text', 'long_text', 'email'], true)) {
        continue;
      }

      $value = trim((string) ($answers[$uuid] ?? ''));
      if ($value === '') {
        continue;
      }

      if ($type === 'email' && ! $email_set) {
        $data['comment_author_email'] = $value;
        $email_set = true;
      } elseif ($type === 'short_text' && ! $author_set) {
        $data['comment_author'] = $value;
        $author_set = true;
        // Also include in content for full-text analysis.
        $content_parts[] = $value;
      } else {
        $content_parts[] = $value;
      }
    }

    if (! empty($content_parts)) {
      $data['comment_content'] = implode("\n\n", $content_parts);
    }

    // Nothing meaningful to send — treat as ham.
    if (empty($data['comment_content']) && empty($data['comment_author_email'])) {
      return false;
    }

    $response = Akismet::http_post(http_build_query($data), 'comment-check');

    if (empty($response[1])) {
      // No response from Akismet — fail open (don't block).
      return false;
    }

    return $response[1] === 'true';
  }
}
