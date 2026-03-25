<?php

if (! defined('ABSPATH')) exit;

/**
 * FlowForms_Templates
 *
 * Registry for free (local) form templates.
 *
 * Each template is a PHP file in includes/templates/ that returns an array:
 *
 *   return [
 *     'slug'             => 'contact-form',
 *     'name'             => 'Contact Form',
 *     'description'      => 'A simple contact form.',
 *     'category'         => 'contact',
 *     'thumbnail_url'    => '../contact-form.webp',
 *     'content'          => [ ...questions, welcomeScreen, thankYouScreen... ],
 *     'design'           => [ ...design tokens... ],
 *   ];
 *
 * To add a new free template: drop a PHP file in includes/templates/.
 * No registration needed — the directory is scanned automatically.
 *
 * Pro templates will hook in later via the wpff_templates filter.
 *
 * @since 1.0.0
 */
class FlowForms_Templates
{
  /**
   * Directory where free template files live.
   */
  const TEMPLATES_DIR = 'templates';

  /**
   * Loaded templates, keyed by slug.
   *
   * @var array|null  null = not yet loaded
   */
  private ?array $templates = null;

  /**
   * Return all templates as a flat array, keyed by slug.
   *
   * @since 1.0.0
   * @return array
   */
  public function get_all(): array
  {
    if ($this->templates === null) {
      $this->load();
    }

    return $this->templates;
  }

  /**
   * Return a single template by slug, or null if not found.
   *
   * @param string $slug
   * @since 1.0.0
   * @return array|null
   */
  public function get(string $slug): ?array
  {
    $all = $this->get_all();
    return $all[$slug] ?? null;
  }

  /**
   * Return template metadata suitable for passing to JS.
   * Strips the 'content' key — content is only sent server-side on form creation.
   *
   * @since 1.0.0
   * @return array
   */
  public function get_metadata(): array
  {
    return array_map(function (array $template): array {
      return [
        'slug'          => $template['slug'],
        'name'          => $template['name'],
        'description'   => $template['description'] ?? '',
        'category'      => $template['category'] ?? 'general',
        'thumbnail_url' => $template['thumbnail_url'] ?? '',
        'is_pro'        => false,
      ];
    }, $this->get_all());
  }

  /**
   * Return all unique category slugs across loaded templates.
   *
   * @since 1.0.0
   * @return string[]
   */
  public function get_categories(): array
  {
    $cats = array_column(array_values($this->get_all()), 'category');
    return array_values(array_unique(array_filter($cats)));
  }

  /**
   * Scan the templates directory and load every PHP file.
   *
   * @since 1.0.0
   */
  private function load(): void
  {
    $this->templates = [];

    $dir   = WP_FLOWFORMS_PATH . self::TEMPLATES_DIR . '/';
    $files = glob($dir . '*.php') ?: [];

    foreach ($files as $file) {
      $template = require $file;

      if (! is_array($template) || empty($template['slug'])) {
        continue;
      }

      $slug = sanitize_key($template['slug']);

      $this->templates[$slug] = [
        'slug'          => $slug,
        'name'          => sanitize_text_field($template['name'] ?? ''),
        'description'   => sanitize_text_field($template['description'] ?? ''),
        'category'      => sanitize_key($template['category'] ?? 'general'),
        'is_pro'        => false,
        'thumbnail_url' => sanitize_text_field($template['thumbnail_url'] ?? ''),
        'content'       => $template['content'] ?? [],
        'design'        => $template['design']  ?? [],
      ];
    }

    /**
     * Allows pro plugin or addons to inject additional templates.
     *
     * Each entry must follow the same shape as local templates.
     * Pro templates should set 'is_pro' => true.
     *
     * @since 1.0.0
     *
     * @param array $templates Templates array keyed by slug.
     */
    $this->templates = apply_filters('wpff_templates', $this->templates);
  }
}
