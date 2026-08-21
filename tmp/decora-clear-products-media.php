<?php
if (!defined('ABSPATH')) { fwrite(STDERR, "Run with WP-CLI\n"); exit(1); }
if (!function_exists('wp_delete_post')) { fwrite(STDERR, "WordPress unavailable\n"); exit(1); }
@set_time_limit(0);
ini_set('memory_limit', '768M');

$dry = getenv('DH_DRY_RUN') === '1';

$product_ids = get_posts([
    'post_type'      => ['product', 'product_variation'],
    'post_status'    => 'any',
    'numberposts'    => -1,
    'fields'         => 'ids',
    'orderby'        => 'ID',
    'order'          => 'ASC',
    'suppress_filters' => true,
]);

$product_ids = array_values(array_unique(array_map('intval', $product_ids)));
$product_set = array_fill_keys($product_ids, true);
$attachment_ids = [];

foreach ($product_ids as $product_id) {
    $thumb = (int) get_post_thumbnail_id($product_id);
    if ($thumb > 0) $attachment_ids[$thumb] = true;

    $gallery = (string) get_post_meta($product_id, '_product_image_gallery', true);
    if ($gallery !== '') {
        foreach (explode(',', $gallery) as $id) {
            $id = (int) trim($id);
            if ($id > 0) $attachment_ids[$id] = true;
        }
    }
}

// Include media explicitly attached to a product/variation, but never unrelated site media.
if ($product_ids) {
    global $wpdb;
    foreach (array_chunk($product_ids, 500) as $chunk) {
        $placeholders = implode(',', array_fill(0, count($chunk), '%d'));
        $sql = "SELECT ID FROM {$wpdb->posts} WHERE post_type='attachment' AND post_parent IN ($placeholders)";
        $ids = $wpdb->get_col($wpdb->prepare($sql, ...$chunk));
        foreach ($ids as $id) {
            $id = (int) $id;
            if ($id > 0) $attachment_ids[$id] = true;
        }
    }
}

$attachment_ids = array_map('intval', array_keys($attachment_ids));
sort($attachment_ids);

printf("FOUND products_variations=%d product_images=%d dry_run=%s\n", count($product_ids), count($attachment_ids), $dry ? 'yes' : 'no');

if ($dry) {
    echo "DRY RUN: nothing deleted.\n";
    exit(0);
}

$deleted_products = 0;
$failed_products = 0;

// Delete variations first, then parent products.
usort($product_ids, function($a, $b) {
    $ta = get_post_type($a);
    $tb = get_post_type($b);
    if ($ta === $tb) return $b <=> $a;
    return $ta === 'product_variation' ? -1 : 1;
});

foreach ($product_ids as $id) {
    $result = wp_delete_post($id, true);
    if ($result) $deleted_products++;
    else $failed_products++;
}

$deleted_images = 0;
$failed_images = 0;
foreach ($attachment_ids as $attachment_id) {
    if (get_post_type($attachment_id) !== 'attachment') continue;
    $result = wp_delete_attachment($attachment_id, true);
    if ($result) $deleted_images++;
    else $failed_images++;
}

if (function_exists('wc_delete_product_transients')) {
    wc_delete_product_transients();
}
wp_cache_flush();

// Remove expired transients and stale WooCommerce session/cache data when supported.
if (function_exists('delete_expired_transients')) {
    delete_expired_transients(true);
}

printf(
    "SUMMARY deleted_products_variations=%d failed_products=%d deleted_product_images=%d failed_images=%d\n",
    $deleted_products,
    $failed_products,
    $deleted_images,
    $failed_images
);

echo "Success: product catalogue and product media cleared.\n";
