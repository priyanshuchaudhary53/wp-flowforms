<?php

if (! defined('ABSPATH')) exit; // Exit if accessed directly

/**
 * Smart tag resolver for WP FlowForms.
 *
 * Usage:
 *   wp_flowforms()->obj('smart_tags')->resolve($template, $context);
 *
 * Supported tags:
 *   {admin_email}      Site administrator email address
 *   {site_name}        Site name
 *   {form_name}        Form post title
 *   {entry_id}         Saved entry ID
 *   {date}             Current date in the site's date format
 *   {all_fields}       All question labels and answers, one per line
 *   {field:uuid}       Answer for a specific question UUID
 *
 * @since 1.0.0
 */
class FlowForms_Smart_Tags
{
  /**
   * Resolve all smart tags in a template string.
   *
   * @param string $template Raw template, e.g. "New submission: {form_name}"
   * @param array  $context {
   *   @type int    $form_id   Form post ID.
   *   @type string $form_name Form post title.
   *   @type int    $entry_id  Saved entry ID.
   *   @type array  $answers   Answers keyed by question UUID.
   *   @type array  $questions Question objects from formContent (id, type, content, settings).
   * }
   * @since 1.0.0
   * @return string
   */
  public function resolve(string $template, array $context): string
  {
    if (empty($template)) {
      return $template;
    }

    $form_name = $context['form_name'] ?? '';
    $entry_id  = $context['entry_id']  ?? 0;
    $answers   = $context['answers']   ?? [];
    $questions = $context['questions'] ?? [];

    // Static tag replacements
    $result = str_replace(
      ['{admin_email}', '{site_name}', '{form_name}', '{entry_id}', '{date}'],
      [
        get_option('admin_email'),
        get_bloginfo('name'),
        $form_name,
        (string) $entry_id,
        date_i18n(get_option('date_format')),
      ],
      $template
    );

    // {all_fields} — all labels with their submitted values
    if (str_contains($result, '{all_fields}')) {
      $lines = [];

      foreach ($questions as $question) {
        $uuid   = $question['id']             ?? '';
        $label  = $question['content']['title'] ?? $uuid;
        $answer = $answers[$uuid]             ?? null;

        // Skip unanswered / empty questions
        if (is_null($answer)) {
          continue;
        }
        if (is_array($answer) && empty($answer)) {
          continue;
        }
        if (is_string($answer) && trim($answer) === '') {
          continue;
        }

        $value   = is_array($answer) ? implode(', ', $answer) : (string) $answer;
        $lines[] = $label . ': ' . $value;
      }

      $result = str_replace('{all_fields}', implode("\n", $lines), $result);
    }

    // {field:uuid} — single field value by question UUID
    $result = preg_replace_callback(
      '/\{field:([^}]+)\}/',
      function (array $matches) use ($answers): string {
        $uuid   = $matches[1];
        $answer = $answers[$uuid] ?? '';
        return is_array($answer) ? implode(', ', $answer) : (string) $answer;
      },
      $result
    );

    return $result;
  }
}
