<?php
if(!defined('ABSPATH')){fwrite(STDERR,"Run with WP-CLI\n");exit(1);}
if(!class_exists('WooCommerce')){fwrite(STDERR,"WooCommerce inactive\n");exit(1);}
require_once ABSPATH.'wp-admin/includes/media.php';
require_once ABSPATH.'wp-admin/includes/file.php';
require_once ABSPATH.'wp-admin/includes/image.php';
@set_time_limit(0);ini_set('memory_limit','1024M');

const DH_BASE='https://mirat.eu';
const DH_BRAND='https://mirat.eu/brand/asm-meble';
const DH_SEARCH='https://mirat.eu/search/asm';
const DH_MAP='https://raw.githubusercontent.com/Otmane2020/Site-vitrine-express/master/tmp/decora-price-map.b64';
const DH_UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/151.0 Safari/537.36';
$confirm=getenv('DH_IMPORT_CONFIRM')==='YES';
$publish=getenv('DH_PUBLISH')==='YES';
$skipImages=getenv('DH_SKIP_IMAGES')==='YES';
$limit=max(0,intval(getenv('DH_LIMIT')?:'0'));

function dh_get($u,$timeout=40){
  for($i=0;$i<3;$i++){
    $r=wp_remote_get($u,['timeout'=>$timeout,'redirection'=>5,'headers'=>[
      'User-Agent'=>DH_UA,'Accept-Language'=>'pl-PL,pl;q=0.9,en;q=0.7','Cache-Control'=>'no-cache'
    ]]);
    if(!is_wp_error($r)){
      $c=(int)wp_remote_retrieve_response_code($r);$b=(string)wp_remote_retrieve_body($r);
      if($c>=200&&$c<300&&strlen($b)>100)return $b;
    }
    usleep(300000*($i+1));
  }
  return '';
}
function dh_norm($s){return preg_replace('/[^A-Z0-9]+/','',strtoupper(remove_accents((string)$s)));}
function dh_abs($u){
  $u=html_entity_decode(trim((string)$u),ENT_QUOTES|ENT_HTML5,'UTF-8');
  if($u==='')return '';
  if(preg_match('~^https?://~i',$u))return $u;
  if(strpos($u,'//')===0)return 'https:'.$u;
  return rtrim(DH_BASE,'/').'/'.ltrim($u,'/');
}
function dh_product_url($u){
  $p=wp_parse_url($u);if(!$p||empty($p['host'])||stripos($p['host'],'mirat.eu')===false)return false;
  $x=trim($p['path']??'','/');if($x===''||strpos($x,'/')!==false)return false;
  $bad=['meble','brands','kontakt','blog','pomoc','faq','outlet','nowosci','asortyment','jadalnia','salon','sypialnia','kuchnia','lazienka','biuro','wyposazenie','oswietlenie'];
  return strlen($x)>5&&!in_array(strtolower($x),$bad,true)&&!preg_match('/^(brand|search|category|customer|checkout|cart|media|static)(-|$)/i',$x);
}
function dh_json_urls($n,&$out){
  if(!is_array($n))return;
  $t=$n['@type']??null;$ts=is_array($t)?$t:[$t];
  if(in_array('Product',$ts,true)){ $u=$n['url']??($n['@id']??'');if(is_string($u)&&$u)$out[]=dh_abs($u); }
  if(isset($n['itemListElement'])&&is_array($n['itemListElement']))foreach($n['itemListElement'] as $it){
    if(is_array($it)){ $u=$it['url']??($it['item']['url']??($it['item']['@id']??''));if(is_string($u)&&$u)$out[]=dh_abs($u); }
  }
  foreach($n as $v)if(is_array($v))dh_json_urls($v,$out);
}
function dh_links($html){
  if(!class_exists('DOMDocument'))return [];
  libxml_use_internal_errors(true);$d=new DOMDocument();@$d->loadHTML('<?xml encoding="utf-8" ?>'.$html);$x=new DOMXPath($d);$out=[];
  foreach($x->query('//script[contains(@type,"ld+json")]') as $s){$j=json_decode(trim($s->textContent),true);if(is_array($j))dh_json_urls($j,$out);}
  foreach($x->query('//a[@href]') as $a){
    $u=dh_abs($a->getAttribute('href'));if(!dh_product_url($u))continue;$ok=false;$n=$a;
    for($i=0;$i<5&&$n;$i++,$n=$n->parentNode){
      $t=preg_replace('/\s+/u',' ',trim((string)$n->textContent));if(strlen($t)>3500)break;
      $c=$n instanceof DOMElement?(string)$n->getAttribute('class'):'';
      if(stripos($t,'PLN')!==false&&stripos(remove_accents($t),'Czas wysylki')!==false){$ok=true;break;}
      if(preg_match('/product|item/i',$c)&&stripos($t,'PLN')!==false){$ok=true;break;}
    }
    if($ok)$out[]=$u;
  }
  $z=[];foreach($out as $u)if(dh_product_url($u))$z[strtok($u,'#')]=1;return array_keys($z);
}
function dh_find_product($n){
  if(!is_array($n))return null;$t=$n['@type']??null;$ts=is_array($t)?$t:[$t];if(in_array('Product',$ts,true))return $n;
  foreach($n as $v)if(is_array($v)){ $r=dh_find_product($v);if($r)return $r; }return null;
}
function dh_img_add($v,&$out){
  if(is_string($v)){if(preg_match('~\.(?:jpe?g|png|webp)(?:\?|$)~i',$v))$out[]=dh_abs($v);return;}
  if(!is_array($v))return;
  foreach(['url','contentUrl'] as $k)if(isset($v[$k])&&is_string($v[$k]))$out[]=dh_abs($v[$k]);
  foreach($v as $x)if(is_array($x)||is_string($x))dh_img_add($x,$out);
}
function dh_images($arr){
  $o=[];foreach($arr as $u){$u=str_replace('\/','/',html_entity_decode((string)$u,ENT_QUOTES|ENT_HTML5,'UTF-8'));$l=strtolower($u);
    if(!preg_match('~^https?://~i',$u)||!preg_match('~\.(jpe?g|png|webp)(?:\?|$)~i',$l))continue;
    if(preg_match('/logo|favicon|sprite|icon|payment|platn|raty|cert|newsletter|facebook|instagram|loader|placeholder|flag|avatar|badge/',$l))continue;
    $o[$u]=1;if(count($o)>=6)break;
  }return array_keys($o);
}
function dh_parse($html,$url){
  libxml_use_internal_errors(true);$d=new DOMDocument();@$d->loadHTML('<?xml encoding="utf-8" ?>'.$html);$x=new DOMXPath($d);
  $jp=null;foreach($x->query('//script[contains(@type,"ld+json")]') as $s){$j=json_decode(trim($s->textContent),true);if(is_array($j)&&($jp=dh_find_product($j)))break;}
  $name='';$sku='';$imgs=[];$av='';
  if($jp){$name=trim((string)($jp['name']??''));$sku=trim((string)($jp['sku']??''));if(isset($jp['image']))dh_img_add($jp['image'],$imgs);
    $of=$jp['offers']??null;if(is_array($of)){if(isset($of[0])&&is_array($of[0]))$of=$of[0];$av=(string)($of['availability']??'');}}
  if(!$name&&($h=$x->query('//h1')->item(0)))$name=trim(preg_replace('/\s+/u',' ',$h->textContent));
  foreach($x->query('//meta[@property="og:image"]/@content|//meta[@name="twitter:image"]/@content') as $m)$imgs[]=dh_abs($m->nodeValue);
  $text=preg_replace('/\s+/u',' ',trim((string)$d->textContent));$a=remove_accents($text);
  if(!$sku&&preg_match('/\bSKU\s*[:\-]?\s*([A-Za-z0-9][A-Za-z0-9+\/ ._-]{1,50}?)(?=\s+(?:Szerokosc|Wysokosc|Glebokosc|Rodzaj|Kolor|Elementy|Waga|Do samodzielnego|Zmiana|Podswietlenie|Producent)\b)/i',$a,$m))$sku=trim($m[1]);
  if(preg_match_all('~https?:\\\\?/\\\\?/[^"\'\s]+/media/catalog/product/[^"\'\s<>]+?\.(?:jpe?g|png|webp)(?:\\\\?[^"\'\s<>]*)?~i',$html,$mm))foreach($mm[0] as $u)$imgs[]=str_replace('\/','/',$u);
  $dim=['w'=>'','h'=>'','d'=>''];
  if(preg_match('/Szerokosc(?: zestawu)? \(cm\)\s*([0-9]+(?:[.,][0-9]+)?)/i',$a,$m))$dim['w']=str_replace(',','.',$m[1]);
  if(preg_match('/Wysokosc(?: zestawu)? \(cm\)\s*([0-9]+(?:[.,][0-9]+)?)/i',$a,$m))$dim['h']=str_replace(',','.',$m[1]);
  if(preg_match('/Glebokosc(?: zestawu)? \(cm\)\s*([0-9]+(?:[.,][0-9]+)?)/i',$a,$m))$dim['d']=str_replace(',','.',$m[1]);
  $f=['lam'=>preg_match('/plyt(?:a|y) (?:wiorowa )?laminowan/i',$a)>0,'mdf'=>stripos($a,'MDF')!==false,'glass'=>stripos($a,'szklo hartowane')!==false,
      'push'=>preg_match('/push[- ]?(?:click|to open)|pusch-click/i',$a)>0,'gas'=>stripos($a,'silownik')!==false&&stripos($a,'gaz')!==false,
      'led'=>stripos($a,'LED')!==false&&!preg_match('/Podswietlenie\s+nie\b/i',$a),'fire'=>stripos($a,'biokomink')!==false,'assembly'=>preg_match('/Do samodzielnego montazu\s+Tak/i',$a)>0];
  return ['url'=>$url,'name'=>$name,'sku'=>$sku,'images'=>dh_images($imgs),'availability'=>$av,'dimensions'=>$dim,'features'=>$f];
}
function dh_kind($n,$sheet){
  $n=strtolower(remove_accents((string)$n));
  $m=[['mebloscianka','Ensemble meuble TV'],['szafka rtv','Meuble TV'],['stolik rtv','Meuble TV'],['komoda','Buffet'],['witryna','Vitrine'],['garderoba',"Meuble d’entrée"],['szafka na buty','Meuble à chaussures'],['lustro','Miroir'],['lozeczko','Lit bébé'],['lozko','Lit'],['szafa','Armoire'],['regal','Étagère'],['polka','Étagère murale'],['stolik kawowy','Table basse'],['lawa','Table basse'],['stolik',"Table d’appoint"],['biurko','Bureau']];
  foreach($m as $r)if(strpos($n,$r[0])!==false)return $r[1];
  if($sheet==='hallway')return "Meuble d’entrée";if($sheet==='kids')return 'Meuble enfant';if($sheet==='with fireplaces')return 'Meuble avec cheminée';return 'Meuble';
}
function dh_cat($kind,$sheet){
  $m=['Ensemble meuble TV'=>'Ensembles meubles TV','Meuble TV'=>'Meubles TV','Buffet'=>'Buffets & commodes','Vitrine'=>'Vitrines',"Meuble d’entrée"=>'Entrée & dressing','Meuble à chaussures'=>'Entrée & dressing','Miroir'=>'Miroirs','Lit bébé'=>'Chambre enfant','Lit'=>'Lits','Armoire'=>'Armoires','Étagère'=>'Étagères','Étagère murale'=>'Étagères','Table basse'=>'Tables basses',"Table d’appoint"=>"Tables d’appoint",'Bureau'=>'Bureaux','Meuble enfant'=>'Chambre enfant','Meuble avec cheminée'=>'Meubles avec cheminée'];
  if(isset($m[$kind]))return $m[$kind];if($sheet==='new 2026')return 'Nouveautés 2026';return 'Collections & systèmes';
}
function dh_term($n){$t=term_exists($n,'product_cat');if(is_array($t))return(int)$t['term_id'];if(is_int($t))return$t;$r=wp_insert_term($n,'product_cat');return is_wp_error($r)?0:(int)$r['term_id'];}
function dh_wcsku($s){$s=preg_replace('/[^A-Z0-9]+/','-',strtoupper(remove_accents(trim((string)$s))));return 'DH_'.trim($s,'-');}
function dh_desc($title,$color,$p){
  $d=$p['dimensions'];$f=$p['features'];$s='<p><strong>'.esc_html($title).'</strong> associe des lignes contemporaines à une conception fonctionnelle pensée pour Decora Home.';
  if($color)$s.=' Ses finitions <strong>'.esc_html($color).'</strong> s’intègrent facilement dans un intérieur moderne.';$s.='</p><h3>Caractéristiques</h3><ul>';
  if($color)$s.='<li><strong>Coloris :</strong> '.esc_html($color).'</li>';
  $x=[];if($d['w']!=='')$x[]='L '.$d['w'].' cm';if($d['h']!=='')$x[]='H '.$d['h'].' cm';if($d['d']!=='')$x[]='P '.$d['d'].' cm';if($x)$s.='<li><strong>Dimensions :</strong> '.esc_html(implode(' × ',$x)).'</li>';
  if($f['lam'])$s.='<li>Structure en panneaux laminés.</li>';if($f['mdf'])$s.='<li>Éléments ou façades en MDF selon le modèle.</li>';if($f['glass'])$s.='<li>Éléments en verre trempé.</li>';if($f['push'])$s.='<li>Ouverture sans poignée par système push.</li>';if($f['gas'])$s.='<li>Vérins à gaz sur les éléments concernés.</li>';if($f['led'])$s.='<li>Éclairage LED intégré ou fourni.</li>';if($f['fire'])$s.='<li>Cheminée décorative bioéthanol intégrée.</li>';if($f['assembly'])$s.='<li>Meuble livré à monter.</li>';
  return $s.'</ul><p>Les teintes peuvent légèrement varier selon l’éclairage et le réglage de votre écran. Vérifiez les dimensions avant installation.</p>';
}
function dh_attrs($color,$d,$f){
  $o=[];$mk=function($n,$v,$p){$a=new WC_Product_Attribute();$a->set_id(0);$a->set_name($n);$a->set_options([(string)$v]);$a->set_position($p);$a->set_visible(true);return$a;};$p=0;
  if($color)$o[]=$mk('Couleur',$color,$p++);if($d['w']!=='')$o[]=$mk('Largeur',$d['w'].' cm',$p++);if($d['h']!=='')$o[]=$mk('Hauteur',$d['h'].' cm',$p++);if($d['d']!=='')$o[]=$mk('Profondeur',$d['d'].' cm',$p++);if($f['led'])$o[]=$mk('Éclairage','LED',$p++);return$o;
}
function dh_image($u,$title,$n){
  $h=sha1($u);$e=get_posts(['post_type'=>'attachment','post_status'=>'inherit','posts_per_page'=>1,'fields'=>'ids','meta_key'=>'_dh_img_hash','meta_value'=>$h]);if($e)return(int)$e[0];
  $tmp=download_url($u,60);if(is_wp_error($tmp))return 0;$ext=strtolower(pathinfo((string)parse_url($u,PHP_URL_PATH),PATHINFO_EXTENSION));if(!in_array($ext,['jpg','jpeg','png','webp'],true))$ext='jpg';
  $id=media_handle_sideload(['name'=>sanitize_title($title).'-'.sprintf('%02d',$n).'.'.$ext,'tmp_name'=>$tmp],0,$title);if(is_wp_error($id)){@unlink($tmp);return 0;}
  update_post_meta($id,'_dh_img_hash',$h);update_post_meta($id,'_wp_attachment_image_alt',$title);wp_update_post(['ID'=>$id,'post_title'=>$title,'post_excerpt'=>'','post_content'=>'']);return(int)$id;
}

$mapBody=dh_get(DH_MAP,30);if(!$mapBody){fwrite(STDERR,"Price map unavailable.\n");exit(2);}
$rows=json_decode(gzuncompress(base64_decode(trim($mapBody))),true);if(!is_array($rows)){fwrite(STDERR,"Price map invalid.\n");exit(2);}
$prices=[];foreach($rows as $r){$k=$r['k']??dh_norm($r['sku']??'');if($k)$prices[$k]=$r;}
fwrite(STDOUT,"PRICE_MAP=".count($prices)." refs\n");

$urls=[];$last='';$empty=0;
for($p=1;$p<=20;$p++){
  $html=dh_get(DH_BRAND.($p>1?'?page='.$p:''));
  if(!$html){if(++$empty>=2)break;continue;}
  $f=dh_links($html);sort($f);fwrite(STDOUT,"DISCOVERY page=$p urls=".count($f)."\n");
  if(!$f){if(++$empty>=2)break;continue;}$empty=0;$fp=md5(implode('|',$f));if($fp===$last&&$p>1)break;$last=$fp;foreach($f as $u)$urls[$u]=1;
}
if(!$urls){$h=dh_get(DH_SEARCH);if($h)foreach(dh_links($h) as $u)$urls[$u]=1;}
$urls=array_keys($urls);sort($urls);fwrite(STDOUT,"DISCOVERY total_unique=".count($urls)."\n");if(!$urls){fwrite(STDERR,"No catalogue URLs found.\n");exit(3);}

if(!$confirm)fwrite(STDOUT,"DRY CHECK: matching only, no WordPress writes.\n");
$created=0;$updated=0;$matched=0;$unmatched=0;$errors=0;$seen=[];$processed=0;
foreach($urls as $u){
  if($limit&&$processed>=$limit)break;$processed++;$html=dh_get($u);if(!$html){$errors++;continue;}$p=dh_parse($html,$u);
  if(!$p||!$p['sku']){$unmatched++;continue;}$k=dh_norm($p['sku']);if(!isset($prices[$k])){$unmatched++;fwrite(STDOUT,"UNMATCHED sku=".$p['sku']." name=".$p['name']."\n");continue;}
  if(isset($seen[$k]))continue;$seen[$k]=1;$r=$prices[$k];$matched++;
  $kind=dh_kind($p['name'],$r['sheet']??'');$model=trim((string)($r['core']??$r['model']??''));if($kind!=='Meuble'&&stripos($model,'System ')===0)$model=trim(substr($model,7));
  $color=trim((string)($r['color']??''));$title=trim($kind.' '.$model.($color?' – '.$color:''));$sku=dh_wcsku($r['sku']);$price=(string)$r['price'];
  if(!$confirm){fwrite(STDOUT,"MATCH ".$p['sku']." => $sku | $price EUR | $title\n");continue;}
  try{
    $eid=wc_get_product_id_by_sku($sku);$x=$eid?new WC_Product_Simple($eid):new WC_Product_Simple();
    $x->set_name($title);$x->set_slug(sanitize_title($title.' '.$sku));$x->set_sku($sku);$x->set_status($publish?'publish':'draft');$x->set_regular_price($price);$x->set_price($price);$x->set_manage_stock(false);
    $x->set_stock_status(stripos((string)$p['availability'],'OutOfStock')!==false?'outofstock':'instock');$x->set_tax_status('taxable');$x->set_description(dh_desc($title,$color,$p));
    $short=$kind.' '.$model.($color?' en '.$color:'').'. Design contemporain pour un intérieur moderne.';$x->set_short_description($short);
    $cid=dh_term(dh_cat($kind,$r['sheet']??''));if($cid)$x->set_category_ids([$cid]);$x->set_attributes(dh_attrs($color,$p['dimensions'],$p['features']));$id=$x->save();
    update_post_meta($id,'_dh_catalog_import','1');update_post_meta($id,'_dh_original_ref',$r['sku']);update_post_meta($id,'_dh_model',$model);update_post_meta($id,'_dh_color',$color);
    if(!$skipImages&&!empty($p['images'])){$ids=[];$n=1;foreach($p['images'] as $img){$aid=dh_image($img,$title,$n++);if($aid)$ids[]=$aid;if(count($ids)>=5)break;}if($ids){set_post_thumbnail($id,array_shift($ids));update_post_meta($id,'_product_image_gallery',implode(',',$ids));}}
    if($eid)$updated++;else$created++;fwrite(STDOUT,"IMPORTED $sku price=$price status=".($publish?'publish':'draft')."\n");
  }catch(Throwable $e){$errors++;fwrite(STDERR,"ERROR ".$p['sku']." ".$e->getMessage()."\n");}
}
if($confirm){if(function_exists('wc_delete_product_transients'))wc_delete_product_transients();wp_cache_flush();}
fwrite(STDOUT,"SUMMARY discovered=".count($urls)." processed=$processed matched=$matched created=$created updated=$updated unmatched=$unmatched errors=$errors\n");
if($confirm)fwrite(STDOUT,"Success: Decora Home catalogue import finished.\n");
