<?php
if (!defined('ABSPATH')) { fwrite(STDERR, "Run with WP-CLI\n"); exit(1); }
if (!class_exists('WooCommerce')) { fwrite(STDERR, "WooCommerce inactive\n"); exit(1); }

@set_time_limit(0);
ini_set('memory_limit', '1024M');

$confirm = getenv('DH_CONFIRM_DELETE') === 'YES';
$dryRun = !$confirm;

global $wpdb;

function dh_ids($type) {
    return get_posts([
        'post_type'      => $type,
        'post_status'    => 'any',
        'posts_per_page' => -1,
        'fields'         => 'ids',
        'orderby'        => 'ID',
        'order'          => 'ASC',
        'no_found_rows'  => true,
    ]);
}

function dh_gallery_ids($postId) {
    $raw = (string) get_post_meta($postId, '_product_image_gallery', true);
    if ($raw === '') return [];
    return array_values(array_filter(array_map('absint', preg_split('/\s*,\s*/', $raw))));
}

$productIds   = dh_ids('product');
$variationIds = dh_ids('product_variation');
$catalogIds   = array_values(array_unique(array_merge($productIds, $variationIds)));
$catalogSet   = array_fill_keys($catalogIds, true);

$mediaSet = [];
foreach ($catalogIds as $postId) {
    $thumb = absint(get_post_thumbnail_id($postId));
    if ($thumb) $mediaSet[$thumb] = true;

    foreach (dh_gallery_ids($postId) as $aid) {
        if ($aid) $mediaSet[$aid] = true;
    }

    $children = get_children([
        'post_parent'    => $postId,
        'post_type'      => 'attachment',
        'post_status'    => 'inherit',
        'posts_per_page' => -1,
        'fields'         => 'ids',
    ]);
    foreach ((array) $children as $aid) {
        $aid = absint($aid);
        if ($aid) $mediaSet[$aid] = true;
    }
}

$mediaIds = array_keys($mediaSet);
sort($mediaIds, SORT_NUMERIC);

fwrite(STDOUT, "MODE=" . ($dryRun ? 'DRY-RUN' : 'DELETE') . "\n");
fwrite(STDOUT, "FOUND products=" . count($productIds) . " variations=" . count($variationIds) . " candidate_product_media=" . count($mediaIds) . "\n");

if ($dryRun) {
    fwrite(STDOUT, "Nothing deleted. Re-run with DH_CONFIRM_DELETE=YES.\n");
    exit(0);
}

$deletedVariations = 0;
$deletedProducts = 0;
$deletedMedia = 0;
$keptMedia = 0;
$errors = 0;

// Variations first.
foreach ($variationIds as $id) {
    $r = wp_delete_post($id, true);
    if ($r) $deletedVariations++; else { $errors++; fwrite(STDERR, "WARN variation delete failed ID=$id\n"); }
}

// Then parent products.
foreach ($productIds as $id) {
    $r = wp_delete_post($id, true);
    if ($r) $deletedProducts++; else { $errors++; fwrite(STDERR, "WARN product delete failed ID=$id\n"); }
}

// Delete media that belonged to the catalog, but protect obvious non-product reuse.
foreach ($mediaIds as $aid) {
    $att = get_post($aid);
    if (!$att || $att->post_type !== 'attachment') continue;

    $parent = absint($att->post_parent);
    if ($parent && !isset($catalogSet[$parent])) {
        $keptMedia++;
        fwrite(STDOUT, "KEEP media ID=$aid reason=non_catalog_parent:$parent\n");
        continue;
    }

    // Protect attachments used as featured images by any surviving non-catalog post.
    $usedElsewhere = (int) $wpdb->get_var($wpdb->prepare(
        "SELECT COUNT(*) FROM {$wpdb->postmeta} pm
         INNER JOIN {$wpdb->posts} p ON p.ID=pm.post_id
         WHERE pm.meta_key='_thumbnail_id' AND pm.meta_value=%s
           AND p.post_type NOT IN ('product','product_variation')
           AND p.post_status NOT IN ('trash','auto-draft')",
        (string) $aid
    ));
    if ($usedElsewhere > 0) {
        $keptMedia++;
        fwrite(STDOUT, "KEEP media ID=$aid reason=featured_elsewhere\n");
        continue;
    }

    $r = wp_delete_attachment($aid, true);
    if ($r) $deletedMedia++; else { $errors++; fwrite(STDERR, "WARN media delete failed ID=$aid\n"); }
}

if (function_exists('wc_delete_product_transients')) wc_delete_product_transients();
wp_cache_flush();

// Remove orphan lookup rows if any plugins left them behind.
$lookup = $wpdb->prefix . 'wc_product_meta_lookup';
if ($wpdb->get_var($wpdb->prepare("SHOW TABLES LIKE %s", $lookup)) === $lookup) {
    $wpdb->query("DELETE l FROM {$lookup} l LEFT JOIN {$wpdb->posts} p ON p.ID=l.product_id WHERE p.ID IS NULL");
}
$attrLookup = $wpdb->prefix . 'wc_product_attributes_lookup';
if ($wpdb->get_var($wpdb->prepare("SHOW TABLES LIKE %s", $attrLookup)) === $attrLookup) {
    $wpdb->query("DELETE l FROM {$attrLookup} l LEFT JOIN {$wpdb->posts} p ON p.ID=l.product_or_parent_id WHERE p.ID IS NULL");
}

$remainingProducts = count(dh_ids('product'));
$remainingVariations = count(dh_ids('product_variation'));
$remainingAttachments = (int) $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->posts} WHERE post_type='attachment' AND post_status='inherit'");

fwrite(STDOUT, "SUMMARY deleted_products=$deletedProducts deleted_variations=$deletedVariations deleted_product_media=$deletedMedia kept_shared_media=$keptMedia errors=$errors\n");
fwrite(STDOUT, "REMAINING products=$remainingProducts variations=$remainingVariations attachments=$remainingAttachments\n");

if ($remainingProducts !== 0 || $remainingVariations !== 0 || $errors > 0) {
    fwrite(STDERR, "Catalog purge finished with warnings.\n");
    exit(2);
}

fwrite(STDOUT, "Success: WooCommerce catalog purged.\n");
