/**
 * ============================================================================
 * AppXwinD ERP - Google Sheets Single Sheet Live Auto-Sync (Code.gs)
 * ============================================================================
 */

var CONFIG = {
  // Production Backend Vercel URL
  API_URL: "https://student-management-system-backend-pied.vercel.app/api/v1/sync/export",
  
  // Secret API Key (Matches SYNC_API_KEY in backend process.env)
  API_KEY: "appxwind-erp-secret-key"
};

/**
 * Creates custom menu in Google Sheets header on document open
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🚀 AppXwinD ERP Sync')
    .addItem('🔄 Sync Student Admissions Data', 'syncSingleSheetData')
    .addSeparator()
    .addItem('⚙️ Configure Backend API URL', 'configureApiUrlPrompt')
    .addItem('⏰ Enable Hourly Auto-Sync', 'enableHourlyTrigger')
    .addItem('🛑 Disable Auto-Sync', 'disableHourlyTrigger')
    .addToUi();
}

/**
 * Prompt user to configure API URL directly inside Google Sheets UI
 */
function configureApiUrlPrompt() {
  var ui = SpreadsheetApp.getUi();
  var currentUrl = getApiUrl();
  
  var result = ui.prompt(
    "⚙️ Configure ERP Backend API URL",
    "Enter your Backend Server API URL:\n\nCurrent: " + currentUrl,
    ui.ButtonSet.OK_CANCEL
  );

  if (result.getSelectedButton() == ui.Button.OK) {
    var newUrl = result.getResponseText().trim();
    if (newUrl) {
      PropertiesService.getScriptProperties().setProperty("API_URL", newUrl);
      ui.alert("✅ Backend API URL saved successfully!\n\nActive URL: " + getApiUrl());
    }
  }
}

/**
 * Get base domain URL
 */
function getDomain() {
  var url = getApiUrl();
  return url.replace(/\/api\/v1\/sync\/export\/?$/, "")
            .replace(/\/api\/v1\/admissions\/?$/, "")
            .replace(/\/+$/, "");
}

/**
 * Get active Backend API URL with automatic path normalization
 */
function getApiUrl() {
  var rawUrl = PropertiesService.getScriptProperties().getProperty("API_URL") || CONFIG.API_URL;
  var url = rawUrl.trim().replace(/\/+$/, "");
  if (url.indexOf("/api/v1/sync/export") === -1 && url.indexOf("/api/v1/admissions") === -1) {
    url = url + "/api/v1/sync/export";
  }
  return url;
}

/**
 * Fetch raw data from ERP Backend Sync Endpoint (API Key protected)
 */
function fetchErpData() {
  var baseUrl = getApiUrl();
  var syncUrl = baseUrl + (baseUrl.indexOf("?") > -1 ? "&" : "?") + "apiKey=" + encodeURIComponent(CONFIG.API_KEY);

  var options = {
    method: "get",
    muteHttpExceptions: true,
    headers: {
      "x-api-key": CONFIG.API_KEY,
      "Accept": "application/json"
    }
  };

  var response = UrlFetchApp.fetch(syncUrl, options);
  var statusCode = response.getResponseCode();
  var content = response.getContentText().trim();

  // Smart Fallback: If /v1/sync/export returns 404, fallback to /api/v1/admissions?apiKey=...
  if (statusCode === 404) {
    var domain = getDomain();
    var fallbackUrl = domain + "/api/v1/admissions?limit=1000&apiKey=" + encodeURIComponent(CONFIG.API_KEY);
    var fallbackResponse = UrlFetchApp.fetch(fallbackUrl, options);
    var fbStatus = fallbackResponse.getResponseCode();
    var fbContent = fallbackResponse.getContentText().trim();

    if (fbStatus === 200) {
      var fallbackJson = JSON.parse(fbContent);
      var admissionsList = (fallbackJson.data && fallbackJson.data.admissions) ? fallbackJson.data.admissions : (Array.isArray(fallbackJson.data) ? fallbackJson.data : []);
      return {
        data: {
          admissions: admissionsList.map(function(a) {
            return {
              admissionNumber: a.admissionNumber || "",
              studentName: a.student ? a.student.fullName : (a.studentName || "N/A"),
              mobile: a.student ? a.student.mobile : (a.guardianMobile || a.mobile || "N/A"),
              courseName: a.courseNameSnapshot || (a.course ? a.course.name : "N/A"),
              paidAmount: Number(a.paidAmount || 0),
              pendingAmount: Number(a.pendingAmount || 0),
              status: a.status || "ACTIVE",
              admissionDate: a.admissionDate || ""
            };
          })
        }
      };
    } else {
      throw new Error("HTTP Error " + fbStatus + ": " + fbContent);
    }
  }

  if (content.indexOf("<!doctype html") === 0 || content.indexOf("<html") === 0 || content.indexOf("<!DOCTYPE") === 0) {
    throw new Error(
      "API_URL returned HTML instead of JSON. Ensure your CONFIG.API_URL is set to your Backend Server URL."
    );
  }

  if (statusCode !== 200) {
    throw new Error("HTTP Error " + statusCode + ": " + content);
  }

  return JSON.parse(content);
}

/**
 * Single Sheet Sync Function (Formats active sheet exactly like screenshot)
 */
function syncSingleSheetData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();
  ss.toast("Syncing Student Admissions Data...", "ERP Sync", 5);

  try {
    var raw = fetchErpData();
    var data = (raw && raw.data) ? raw.data : (raw || {});
    var admissions = (data && Array.isArray(data.admissions)) ? data.admissions : [];

    if (admissions.length === 0) {
      ss.toast("⚠️ No admission records returned by API.", "ERP Sync", 5);
      return;
    }

    // Clear existing content
    sheet.clear();

    // Table Header Row matching exact screenshot format
    var headers = [["Admission #", "Student Name", "Mobile", "Course", "Paid (₹)", "Pending (₹)", "Status", "Admission Date"]];
    
    // Map admissions data into rows
    var rows = admissions.map(function(a) {
      return [
        a.admissionNumber || "",
        a.studentName || "",
        a.mobile || "",
        a.courseName || "",
        a.paidAmount || 0,
        a.pendingAmount || 0,
        a.status || "",
        a.admissionDate ? formatDateDDMMYYYY(a.admissionDate) : ""
      ];
    });

    // Write Header Row
    var headerRange = sheet.getRange(1, 1, 1, headers[0].length);
    headerRange.setValues(headers)
      .setBackground("#1e4d38") // Dark Green Header Theme
      .setFontColor("#ffffff")
      .setFontWeight("bold")
      .setFontSize(10)
      .setVerticalAlignment("middle");

    sheet.setRowHeight(1, 32);

    // Write Data Rows
    if (rows.length > 0) {
      var dataRange = sheet.getRange(2, 1, rows.length, headers[0].length);
      dataRange.setValues(rows)
        .setFontSize(10)
        .setVerticalAlignment("middle");

      // Format Paid (₹) and Pending (₹) columns as numbers
      sheet.getRange(2, 5, rows.length, 2).setNumberFormat("#,##0");

      // Set Row Heights
      for (var r = 2; r <= rows.length + 1; r++) {
        sheet.setRowHeight(r, 26);
      }
    }

    // Auto-fit column widths
    sheet.autoResizeColumns(1, headers[0].length);

    ss.toast("✅ " + admissions.length + " Student Admissions synced successfully!", "ERP Sync Complete", 5);
  } catch (err) {
    SpreadsheetApp.getUi().alert("❌ ERP Sync Error:\n\n" + err.message);
  }
}

/**
 * Trigger Functions (Hourly Auto-Sync)
 */
function enableHourlyTrigger() {
  disableHourlyTrigger();
  ScriptApp.newTrigger('syncSingleSheetData')
    .timeBased()
    .everyHours(1)
    .create();
  SpreadsheetApp.getUi().alert("✅ Hourly Auto-Sync Enabled! Google Sheet will automatically update every hour.");
}

function disableHourlyTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'syncSingleSheetData') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  SpreadsheetApp.getUi().alert("🛑 Auto-Sync Disabled.");
}

/**
 * Date formatter for dd/MM/yyyy
 */
function formatDateDDMMYYYY(isoStr) {
  if (!isoStr) return "";
  var d = new Date(isoStr);
  return Utilities.formatDate(d, Session.getScriptTimeZone(), "dd/MM/yyyy");
}
