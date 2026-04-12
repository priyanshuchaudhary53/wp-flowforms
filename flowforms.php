<?php

/**
 * FlowForms WordPress Plugin
 *
 * @package FlowForms
 *
 * Plugin Name:       FlowForms
 * Description:       FlowForms lets you create beautiful step-by-step forms in WordPress. A modern conversational form builder and Typeform alternative for WordPress.
 * Plugin URI:        https://flowforms.priyanshuc.dev/
 * Version:           1.0.0
 * Requires at least: 6.2
 * Author:            Priyanshu
 * Author URI:        https://priyanshuc.dev/
 * Text Domain:       flowforms
 * License:           GPL-3.0-only
 * License URI:       https://opensource.org/licenses/GPL-3.0
 */

if (! defined('ABSPATH')) exit; // Exit if accessed directly

// Define constants
define('FLOWFORMS_VERSION', '1.0.0');
define('FLOWFORMS_NAME', 'FlowForms');
define('FLOWFORMS_SLUG', 'flowforms');

define('FLOWFORMS_FILE', __FILE__);
define('FLOWFORMS_PATH', plugin_dir_path(__FILE__));
define('FLOWFORMS_URL', plugin_dir_url(__FILE__));

// Autoload classes
require_once FLOWFORMS_PATH . 'includes/FlowForms.php';

flowforms();
