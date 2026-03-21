<?php

if (! defined('ABSPATH')) exit;

/**
 * FlowForms_Field_Icons
 *
 * Maps question type slugs to inline SVG icons and brand colours,
 * matching the builder's fields.js definition exactly.
 *
 * All SVG paths are from Lucide (lucide.dev) — MIT licence.
 * Viewbox is always "0 0 24 24", stroke-based, stroke-width="2".
 *
 * @since 1.1.0
 */
class FlowForms_Field_Icons
{
  /**
   * Type → [ color, svg_inner ] map.
   * svg_inner is everything inside <svg>…</svg> (no wrapper tag).
   *
   * @var array
   */
  private static array $map = [

    // TextCursorInput — blue-500 #3B82F6
    'short_text' => [
      'color' => '#3B82F6',
      'svg'   => '<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" x2="15" y1="20" y2="20"/><line x1="12" x2="12" y1="4" y2="20"/>',
    ],

    // AlignLeft — violet-500 #8B5CF6
    'long_text' => [
      'color' => '#8B5CF6',
      'svg'   => '<line x1="21" x2="3" y1="6" y2="6"/><line x1="15" x2="3" y1="12" y2="12"/><line x1="17" x2="3" y1="18" y2="18"/>',
    ],

    // CircleDot — pink-500 #EC4899
    'multiple_choice' => [
      'color' => '#EC4899',
      'svg'   => '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>',
    ],

    // CheckSquare — emerald-500 #10B981
    'checkboxes' => [
      'color' => '#10B981',
      'svg'   => '<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
    ],

    // Star — amber-500 #F59E0B
    'rating' => [
      'color' => '#F59E0B',
      'svg'   => '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    ],

    // ThumbsUp — red-500 #EF4444
    'yes_no' => [
      'color' => '#EF4444',
      'svg'   => '<path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/>',
    ],

    // Mail — cyan-500 #06B6D4
    'email' => [
      'color' => '#06B6D4',
      'svg'   => '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    ],

    // Hash — orange-500 #F97316
    'number' => [
      'color' => '#F97316',
      'svg'   => '<line x1="4" x2="20" y1="9" y2="9"/><line x1="4" x2="20" y1="15" y2="15"/><line x1="10" x2="8" y1="3" y2="21"/><line x1="16" x2="14" y1="3" y2="21"/>',
    ],

  ];

  /**
   * Return an HTML string: a small coloured icon badge + the question title.
   *
   * @param string $type  Question type slug.
   * @param string $label Question title text.
   * @return string
   */
  public static function label_with_icon(string $type, string $label): string
  {
    $def   = self::$map[$type] ?? null;
    $color = $def ? esc_attr($def['color']) : '#9ca3af';
    $svg   = $def ? $def['svg'] : '<circle cx="12" cy="12" r="10"/>';

    $icon_html = sprintf(
      '<span class="wpff-field-icon" style="background:%s;" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                     fill="none" stroke="#ffffff" stroke-width="2"
                     stroke-linecap="round" stroke-linejoin="round"
                     width="12" height="12">%s</svg>
            </span>',
      $color,
      $svg
    );

    return '<div class="wpff-field__wrapper">' . $icon_html . '<span class="wpff-field-label-text">' . esc_html($label) . '</span></div>';
  }

  /**
   * Return only the colour for a given type, or a neutral grey fallback.
   *
   * @param string $type
   * @return string Hex colour string.
   */
  public static function color(string $type): string
  {
    return self::$map[$type]['color'] ?? '#9ca3af';
  }
}
