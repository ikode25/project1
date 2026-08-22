/**
 * Code.gs
 * Single entry point. Routes:
 *   ?              -> admin app (requires a logged-in, provisioned Google account)
 *   ?page=checkin  -> public mobile-friendly attendance check-in (QR link target)
 *   ?page=prayer   -> public prayer request submission form
 * Everything else (service-layer functions) lives in the per-module .gs files;
 * this file only wires HTML output together.
 */

function doGet(e) {
  var page = (e && e.parameter && e.parameter.page) || 'app';

  try {
    if (page === 'checkin') return renderCheckIn_(e);
    if (page === 'prayer') return renderPrayerPublic_(e);
    return renderApp_(e);
  } catch (err) {
    logError_('doGet', err);
    return HtmlService.createHtmlOutput(
      '<div style="font-family:sans-serif;padding:40px;text-align:center;color:#333">' +
      '<h2>Something went wrong</h2><p>' + sanitizeText_(err.message) + '</p></div>'
    );
  }
}

function renderApp_(e) {
  var user = getCurrentUserRecord_();
  var tmpl = HtmlService.createTemplateFromFile(user ? 'Index' : 'AccessDenied');
  tmpl.orgName = getSetting_('OrgName', APP_NAME);
  tmpl.userEmail = currentUserEmail_();
  var out = tmpl.evaluate()
    .setTitle(getSetting_('OrgName', APP_NAME) + ' | ' + APP_TAGLINE)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  return out;
}

function renderCheckIn_(e) {
  var tmpl = HtmlService.createTemplateFromFile('CheckIn');
  tmpl.orgName = getSetting_('OrgName', APP_NAME);
  tmpl.memberId = (e.parameter && e.parameter.id) || '';
  return tmpl.evaluate()
    .setTitle(getSetting_('OrgName', APP_NAME) + ' | Check-In')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function renderPrayerPublic_(e) {
  var tmpl = HtmlService.createTemplateFromFile('PrayerPublic');
  tmpl.orgName = getSetting_('OrgName', APP_NAME);
  return tmpl.evaluate()
    .setTitle(getSetting_('OrgName', APP_NAME) + ' | Prayer Request')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** Used by HtmlService templates to inline partials: <?!= include('Members'); ?> */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/** Client-callable convenience so the frontend can build check-in / prayer links without hardcoding the URL. */
function getWebAppUrl() {
  return ScriptApp.getService().getUrl();
}
