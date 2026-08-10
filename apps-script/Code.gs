// ============================================================
// E-REPORT SCHOOL MANAGEMENT SYSTEM — Code.gs v7
// NEW IN v7:
//   - SBA breakdown: Test1|GroupWork|Test2|ProjectWork per subject per class
//     stored in [ClassName]_SBA sheet: StudentID|SubjectName|Test1|GW|Test2|PW|SBA_Total|SBA_Scaled
//   - SBA component config per class in [ClassName]_SBAConfig: Name|MaxMark|Order
//   - Exam scores stored separately in class result sheet (Exam column)
//   - Cumulative record: getStudentCumulativeRecord(token,studentId,year)
//   - Settings: HEADMASTER_NAME, REPORT_PRIMARY_COLOR, REPORT_ACCENT_COLOR (admin-chosen report
//     card colors — replaced the old fixed REPORT_TEMPLATE 1|2|3 picker)
// ============================================================

var SS_ID_KEY      = 'SPREADSHEET_ID';
var ADMIN_PASS_KEY = 'ADMIN_PASSWORD';
var SMS_KEY_PROP   = 'SMS_API_KEY';
var SMS_SEND_PROP  = 'SMS_SENDER_ID';
var PHOTOS_KEY     = 'PHOTOS_FOLDER_ID';
var LOGO_KEY       = 'SCHOOL_LOGO_B64';
var STAMP_KEY      = 'SCHOOL_STAMP_B64';
var SIG_KEY        = 'SCHOOL_SIG_B64';

// ── ENTRY POINT ────────────────────────────────────────────
function doGet(e) {
  var page = (e && e.parameter && e.parameter.page) ? e.parameter.page : 'student';
  var sid  = (e && e.parameter && e.parameter.id)   ? e.parameter.id   : '';
  initializeSystem();
  if (page === 'admin') {
    var t = HtmlService.createTemplateFromFile('admin');
    t.scriptUrl = ScriptApp.getService().getUrl();
    return t.evaluate()
      .setTitle('Admin Panel')
      .addMetaTag('viewport','width=device-width,initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  if (page === 'report' && sid) {
    var t = HtmlService.createTemplateFromFile('report');
    t.studentId = sid;
    t.year = (e && e.parameter && e.parameter.year) ? e.parameter.year : '';
    t.term = (e && e.parameter && e.parameter.term) ? e.parameter.term : '';
    t.scriptUrl = ScriptApp.getService().getUrl();
    return t.evaluate()
      .setTitle('Report Card')
      .addMetaTag('viewport','width=device-width,initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  var t = HtmlService.createTemplateFromFile('index');
  t.scriptUrl = ScriptApp.getService().getUrl();
  return t.evaluate()
    .setTitle('Student Portal')
    .addMetaTag('viewport','width=device-width,initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ── INIT ───────────────────────────────────────────────────
function ensureReportStatusHeader(ss) {
  try {
    var sheet = ss.getSheetByName('Students');
    if (!sheet) return;
    var lastCol = sheet.getLastColumn();
    if (lastCol === 0) return;
    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    var idx = headers.indexOf('ReportStatus');
    if (idx === -1) {
      sheet.getRange(1, lastCol + 1).setValue('ReportStatus')
           .setBackground('#0d1b4b').setFontColor('#f0c020').setFontWeight('bold');
      lastCol++;
    }
    var pIdx = headers.indexOf('PromotionStatus');
    if (pIdx === -1) {
      sheet.getRange(1, lastCol + 1).setValue('PromotionStatus')
           .setBackground('#0d1b4b').setFontColor('#f0c020').setFontWeight('bold');
    }
  } catch(e) {
    Logger.log('ensureReportStatusHeader error: ' + e.message);
  }
}

function initializeSystem() {
  var props = PropertiesService.getScriptProperties();
  var ssId  = props.getProperty(SS_ID_KEY);
  if (!ssId) { createNewSpreadsheet(); }
  else {
    try {
      var ss = SpreadsheetApp.openById(ssId);
      // PERF: ensureDefaultGradingGeneral()/cleanUpRMEDuplicates() each read every sheet in the
      // spreadsheet in full. Running that on *every* doGet() (every page load, by every visitor)
      // is the main reason a school with a few hundred students feels sluggish — these checks only
      // need to catch up once after a deploy/schema change, not on every request. Gate them behind
      // a short-lived cache flag so the heavy scan runs at most once every few hours.
      var cache = CacheService.getScriptCache();
      if (!cache.get('sys_init_checked')) {
        ensureReportStatusHeader(ss);
        ensureDefaultGradingGeneral(ss);
        cleanUpRMEDuplicates(ss);
        cache.put('sys_init_checked', '1', 21600); // 6 hours
      }
    } catch(e) {
      createNewSpreadsheet();
    }
  }
  if (!props.getProperty(ADMIN_PASS_KEY)) props.setProperty(ADMIN_PASS_KEY, 'admin123');
}

function cleanUpRMEDuplicates(ss) {
  try {
    var sheets = ss.getSheets();
    sheets.forEach(function(sh) {
      var name = sh.getName();
      if (name.indexOf('_Subjects') !== -1) {
        var data = sh.getDataRange().getValues();
        var hasRME = -1;
        var hasFormal = -1;
        for (var i = 1; i < data.length; i++) {
          var sub = (data[i][0] || '').toString().trim();
          if (sub === 'RME') hasRME = i + 1;
          if (sub === 'Religious and Moral Education' || sub === 'Religious & Moral Education') hasFormal = i + 1;
        }
        if (hasRME !== -1) {
          if (hasFormal !== -1) {
            sh.deleteRow(hasRME);
          } else {
            sh.getRange(hasRME, 1).setValue('Religious and Moral Education');
          }
        }
      }
    });
  } catch(e) {
    Logger.log("RME cleanup failed: " + e.message);
  }
}

// ── PHOTO FOLDER ───────────────────────────────────────────
function initPhotoFolder() {
  var props = PropertiesService.getScriptProperties();
  var folderId = props.getProperty(PHOTOS_KEY);
  if (folderId) { try { DriveApp.getFolderById(folderId); return folderId; } catch(e) {} }
  try {
    var folder = DriveApp.createFolder('School Student Photos');
    folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    var id = folder.getId(); props.setProperty(PHOTOS_KEY, id); return id;
  } catch(e) { Logger.log('Folder error: '+e.message); return null; }
}
function manualSetupPhotoFolder() {
  PropertiesService.getScriptProperties().deleteProperty(PHOTOS_KEY);
  var id = initPhotoFolder();
  Logger.log(id ? 'Folder: https://drive.google.com/drive/folders/'+id : 'Failed');
}

// ── SPREADSHEET SETUP ──────────────────────────────────────
function createNewSpreadsheet() {
  var ss = SpreadsheetApp.create('School Management DB');
  PropertiesService.getScriptProperties().setProperty(SS_ID_KEY, ss.getId());
  setupCoreSheets(ss);
}
function SS() {
  var id = PropertiesService.getScriptProperties().getProperty(SS_ID_KEY);
  if (!id) throw new Error('Spreadsheet not initialized.');
  return SpreadsheetApp.openById(id);
}

// ── LIGHTWEIGHT CACHE LAYER (PERFORMANCE) ───────────────────
// Settings/Grading/Classes are read on nearly every call — every report card view, every portal
// page load, every admin action — but change rarely. For a school with several hundred students,
// re-reading these small sheets from scratch on every single request (multiplied by however many
// students/parents are checking results at once) is the main source of the "delayed" feeling.
// Cache them for a short window and invalidate on write.
var CACHE_TTL_SECONDS = 180;
function cacheGetJSON(key) {
  try { var v = CacheService.getScriptCache().get(key); return v ? JSON.parse(v) : null; } catch(e) { return null; }
}
function cachePutJSON(key, val, ttl) {
  try { CacheService.getScriptCache().put(key, JSON.stringify(val), ttl || CACHE_TTL_SECONDS); } catch(e) {}
}
function cacheClear(keys) {
  try { CacheService.getScriptCache().removeAll(keys); } catch(e) {}
}
function getCachedSettingsMap(ss) {
  var cached = cacheGetJSON('c_settings');
  if (cached) return cached;
  var settSh = ss.getSheetByName('Settings');
  var settD = settSh ? settSh.getDataRange().getValues() : [];
  var sett = {};
  if (settD && settD.length > 1) {
    for (var s = 1; s < settD.length; s++) {
      var v = settD[s][1];
      if (v instanceof Date) v = Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      sett[settD[s][0]] = v;
    }
  }
  cachePutJSON('c_settings', sett);
  return sett;
}
function getCachedGradingData(ss) {
  var cached = cacheGetJSON('c_grading');
  if (cached) return cached;
  var sh = ss.getSheetByName('Grading');
  var grdD = sh ? sh.getDataRange().getValues() : [[]];
  cachePutJSON('c_grading', grdD);
  return grdD;
}
function getCachedClassesData(ss) {
  var cached = cacheGetJSON('c_classes');
  if (cached) return cached;
  var sh = ss.getSheetByName('Classes');
  var clsD = sh ? sh.getDataRange().getValues() : [[]];
  cachePutJSON('c_classes', clsD);
  return clsD;
}
function invalidateSettingsCache() { cacheClear(['c_settings']); }
function invalidateGradingCache() { cacheClear(['c_grading']); }
function invalidateClassesCache() { cacheClear(['c_classes']); }

function styleHeader(sheet, headers) {
  sheet.getRange(1,1,1,headers.length).setValues([headers])
       .setBackground('#0d1b4b').setFontColor('#f0c020').setFontWeight('bold');
  sheet.setFrozenRows(1);
}
function setupCoreSheets(ss) {
  var defs = {
    Students: ['ID','Name','Gender','Class','Year','Term','Attendance','OutOf','TotalScore','Average',
               'Interest','Conduct','Attitude','ClassTeacherRemark','HeadTeacherRemark','ParentPhone','PhotoUrl','LevelGroup','Arrears','NextTermFees','FeeData'],
    Classes:  ['ClassName','Teacher','NumPupils','LevelGroup'],
    Grading:  ['MinScore','MaxScore','Grade','GradeName','Remarks','LevelGroup'],
    Settings: ['Key','Value'],
    Teachers: ['Username','Password','FullName','AssignedClass','Phone'],
    Messages: ['Timestamp','Sender','Receiver','Message','IsRead'],
    AuditTrail: ['Timestamp','Username','Role','Action','Details','IPAddress','MACAddress','DeviceType','UserAgent'],
    SMSLogs: ['Timestamp','StudentID','RecipientPhone','Message','Status','Provider']
  };
  ['Students','Classes','Grading','Settings','Teachers','Messages','AuditTrail','SMSLogs'].forEach(function(name, i) {
    var sheet = (i===0) ? ss.getSheets()[0] : ss.insertSheet(name);
    if (i===0) sheet.setName(name);
    styleHeader(sheet, defs[name]);
  });
}

// ── CLASS SUBJECTS SHEET ───────────────────────────────────
function getClassSubjectsSheetName(cn) { return cn+'_Subjects'; }
function getOrCreateSubjectsSheet(ss, cn) {
  var sh = ss.getSheetByName(cn+'_Subjects');
  if (!sh) { sh = ss.insertSheet(cn+'_Subjects'); styleHeader(sh,['SubjectName','Order']); }
  return sh;
}
function getClassSubjectNames(ss, cn) {
  var sh = ss.getSheetByName(cn+'_Subjects');
  if (!sh || sh.getLastRow()<2) return [];
  var data = sh.getRange(2,1,sh.getLastRow()-1,2).getValues();
  var subjects = [];
  data.forEach(function(row){ if(row[0]) subjects.push({name:row[0].toString(), order:Number(row[1]||0)}); });
  subjects.sort(function(a,b){ return a.order - b.order; });
  return subjects.map(function(s){ return s.name; });
}

// ── SBA CONFIG SHEET per class ─────────────────────────────
// [ClassName]_SBAConfig: ComponentName | MaxMark | Order
// Default: Test1=20, GroupWork=10, Test2=20, ProjectWork=10 → total=60 → scaled to 50
function getOrCreateSBAConfigSheet(ss, cn) {
  var sh = ss.getSheetByName(cn+'_SBAConfig');
  if (!sh) {
    sh = ss.insertSheet(cn+'_SBAConfig');
    styleHeader(sh, ['ComponentName','MaxMark','Order']);
    sh.appendRow(['Test 1', 20, 1]);
    sh.appendRow(['Group Work', 10, 2]);
    sh.appendRow(['Test 2', 20, 3]);
    sh.appendRow(['Project Work', 10, 4]);
  }
  return sh;
}
function getSBAConfig(ss, cn) {
  var sh = ss.getSheetByName(cn+'_SBAConfig');
  if (!sh) { getOrCreateSBAConfigSheet(ss, cn); sh = ss.getSheetByName(cn+'_SBAConfig'); }
  if (sh.getLastRow() < 2) return [{name:'Test 1',max:20,order:1},{name:'Group Work',max:10,order:2},{name:'Test 2',max:20,order:3},{name:'Project Work',max:10,order:4}];
  var data = sh.getRange(2,1,sh.getLastRow()-1,3).getValues();
  var comps = [];
  data.forEach(function(row){ if(row[0]) comps.push({name:row[0].toString(), max:Number(row[1]||0), order:Number(row[2]||0)}); });
  comps.sort(function(a,b){ return a.order - b.order; });
  return comps;
}
function saveSBAConfig(token, cn, components) {
  if(!validateAdminToken(token)) return {success:false,message:'Unauthorized'};
  try {
    var ss = SS();
    var sh = getOrCreateSBAConfigSheet(ss, cn);
    var last = sh.getLastRow();
    if (last > 1) sh.deleteRows(2, last-1);
    components.forEach(function(c){ sh.appendRow([c.name, Number(c.max||0), Number(c.order||0)]); });
    return {success:true};
  } catch(e) { return {success:false,message:e.message}; }
}
function getSBAConfigForClass(token, cn) {
  if(!validateAdminToken(token)) return {success:false,message:'Unauthorized'};
  try { return {success:true, components: getSBAConfig(SS(), cn)}; }
  catch(e) { return {success:false,message:e.message}; }
}

// ── SBA SCORES SHEET per class ─────────────────────────────
// [ClassName]_SBA: StudentID | StudentName | SubjectName | Comp1 | Comp2 | ... | SBA_Total | SBA_Scaled | Year | Term
function getOrCreateSBASheet(ss, cn, compNames) {
  var sh = ss.getSheetByName(cn+'_SBA');
  var headers = ['StudentID','StudentName','SubjectName'].concat(compNames).concat(['SBA_Total','SBA_Scaled','Year','Term']);
  if (!sh) {
    sh = ss.insertSheet(cn+'_SBA');
    styleHeader(sh, headers);
    return sh;
  }
  // Rebuild header if components changed
  var lastCol = sh.getLastColumn() || 1;
  var curH = sh.getRange(1,1,1,lastCol).getValues()[0];
  if (JSON.stringify(curH.slice(0,headers.length)) !== JSON.stringify(headers)) {
    sh.getRange(1,1,1,headers.length).setValues([headers])
      .setBackground('#0d1b4b').setFontColor('#f0c020').setFontWeight('bold');
  }
  return sh;
}

function saveSBAScores(token, batchData) {
  if(!validateAdminToken(token)) return {success:false,message:'Unauthorized'};
  if(!batchData||!batchData.length) return {success:true};
  try {
    var ss = SS();
    var cn = batchData[0].Class, yr = batchData[0].Year, tm = batchData[0].Term;
    var comps = getSBAConfig(ss, cn);
    var totalMax = comps.reduce(function(s,c){ return s+c.max; }, 0);
    var compNames = comps.map(function(c){ return c.name; });
    var sh = getOrCreateSBASheet(ss, cn, compNames);
    var headers = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
    var stuD = ss.getSheetByName('Students').getDataRange().getValues();
    var stuNames = {};
    for(var si=1;si<stuD.length;si++){ if(stuD[si][0]) stuNames[stuD[si][0].toString()]=stuD[si][1]; }

    // Find existing rows for this year/term
    var existingKeys = {};
    if(sh.getLastRow() > 1) {
      var existData = sh.getDataRange().getValues();
      var eyi=headers.indexOf('Year'), eti=headers.indexOf('Term');
      for(var er=1;er<existData.length;er++){
        if(!existData[er][0])continue;
        if(eyi>=0&&existData[er][eyi].toString()!==yr.toString())continue;
        if(eti>=0&&existData[er][eti]!==tm)continue;
        var key=existData[er][0].toString()+'|'+existData[er][2].toString();
        existingKeys[key]=er+1;
      }
    }

    batchData.forEach(function(item){
      var key = item.StudentID.toString()+'|'+item.SubjectName;
      var row = new Array(headers.length).fill('');
      row[0]=item.StudentID; row[1]=stuNames[item.StudentID.toString()]||item.StudentName||'';
      row[2]=item.SubjectName;
      var sbaTotal=0;
      compNames.forEach(function(cn2,idx){
        var ci=headers.indexOf(cn2);
        var val=Number((item.scores||{})[cn2]||0);
        if(ci>=0)row[ci]=val;
        sbaTotal+=val;
      });
      var scaled = totalMax>0 ? Math.round(sbaTotal/totalMax*50) : 0;
      var tsi=headers.indexOf('SBA_Total'), ssi=headers.indexOf('SBA_Scaled');
      var yyi=headers.indexOf('Year'), tti=headers.indexOf('Term');
      if(tsi>=0)row[tsi]=sbaTotal; if(ssi>=0)row[ssi]=scaled;
      if(yyi>=0)row[yyi]=yr; if(tti>=0)row[tti]=tm;
      if(existingKeys[key]) sh.getRange(existingKeys[key],1,1,headers.length).setValues([row]);
      else sh.appendRow(row);
    });
    return {success:true};
  } catch(e) { return {success:false,message:e.message}; }
}

function getSBAScores(token, cn, yr, tm) {
  if(!validateAdminToken(token)) return {success:false,message:'Unauthorized'};
  try {
    var ss = SS();
    var comps = getSBAConfig(ss, cn);
    var compNames = comps.map(function(c){ return c.name; });
    var sh = ss.getSheetByName(cn+'_SBA');
    if(!sh||sh.getLastRow()<2) return {success:true,scores:{},components:comps};
    var data = sh.getDataRange().getValues(), headers=data[0];
    var eyi=headers.indexOf('Year'),eti=headers.indexOf('Term');
    var scores = {};
    for(var r=1;r<data.length;r++){
      if(!data[r][0])continue;
      if(eyi>=0&&data[r][eyi].toString()!==yr.toString())continue;
      if(eti>=0&&data[r][eti]!==tm)continue;
      var sid=data[r][0].toString(), subj=data[r][2].toString();
      if(!scores[sid])scores[sid]={};
      scores[sid][subj]={};
      compNames.forEach(function(cn2){var ci=headers.indexOf(cn2);if(ci>=0)scores[sid][subj][cn2]=data[r][ci];});
      var tsi=headers.indexOf('SBA_Total'),ssi=headers.indexOf('SBA_Scaled');
      if(tsi>=0)scores[sid][subj]['SBA_Total']=data[r][tsi];
      if(ssi>=0)scores[sid][subj]['SBA_Scaled']=data[r][ssi];
    }
    return {success:true,scores:scores,components:comps};
  } catch(e) { return {success:false,message:e.message}; }
}

// ── PER-CLASS RESULT SHEET ─────────────────────────────────
function getClassResultHeaders(subjectNames) {
  var h = ['StudentID','StudentName','Class'];
  subjectNames.forEach(function(n){ h.push(n+'_SBA',n+'_Exam',n+'_Total',n+'_Grade',n+'_Position'); });
  h.push('Year','Term','TotalScore','Average','OverallPosition');
  return h;
}
function ensureClassResultSheet(ss, cn, subjectNames) {
  var sh = ss.getSheetByName(cn);
  var headers = getClassResultHeaders(subjectNames);
  if (!sh) { sh = ss.insertSheet(cn); styleHeader(sh, headers); return sh; }
  var lastCol = sh.getLastColumn() || 1;
  var curH = sh.getRange(1,1,1,lastCol).getValues()[0];
  if (JSON.stringify(curH.slice(0,headers.length)) !== JSON.stringify(headers)) {
    sh.getRange(1,1,1,headers.length).setValues([headers]).setBackground('#0d1b4b').setFontColor('#f0c020').setFontWeight('bold');
  }
  return sh;
}

// ── SAMPLE DATA ────────────────────────────────────────────
function populateSampleData(ss) {
  var st = ss.getSheetByName('Students');
  st.appendRow(['001','Ama Owusu','Female','Basic 4','2025-2026','Term 1',68,75,0,0,'Shows great interest.','Well-behaved.','Takes work seriously.','A hardworking pupil.','Keep working hard.','+233200000001','','Lower Primary']);
  st.appendRow(['002','Kofi Mensah','Male','Basic 4','2025-2026','Term 1',70,75,0,0,'Actively participates.','Obeys school rules.','Shows commitment.','Has ability to do better.','A commendable effort.','+233200000002','','Lower Primary']);
  st.appendRow(['003','Abena Frimpong','Female','Basic 7','2025-2026','Term 1',72,75,0,0,'Talent in science.','Respectful.','Hardworking.','Exceptional student.','Continue to excel.','+233200000003','','JHS']);
  var cls = ss.getSheetByName('Classes');
  cls.appendRow(['Basic 4','Ms. Priscilla Ohene',34,'Lower Primary']);
  cls.appendRow(['Basic 5','Mr. Emmanuel Asante',30,'Upper Primary']);
  cls.appendRow(['KG 2','Mrs. Adwoa Boateng',25,'Kindergarten']);
  cls.appendRow(['Basic 7','Mr. Samuel Tetteh',32,'JHS']);
  var b4Sub=getOrCreateSubjectsSheet(ss,'Basic 4');
  [['English Language',1],['Mathematics',2],['Integrated Science',3],['Social Studies',4],['Religious & Moral Ed',5],['Computing/ICT',6],['Creative Arts & Design',7]].forEach(function(r){b4Sub.appendRow(r);});
  var b5Sub=getOrCreateSubjectsSheet(ss,'Basic 5');
  [['English Language',1],['Mathematics',2],['Integrated Science',3],['Social Studies',4],['Religious & Moral Ed',5],['Computing/ICT',6],['Ghanaian Language',7]].forEach(function(r){b5Sub.appendRow(r);});
  var kgSub=getOrCreateSubjectsSheet(ss,'KG 2');
  [['Numeracy',1],['Literacy',2],['Creative Arts',3],['Physical Education',4]].forEach(function(r){kgSub.appendRow(r);});
  var b7Sub=getOrCreateSubjectsSheet(ss,'Basic 7');
  [['English Language',1],['Mathematics',2],['Integrated Science',3],['Social Studies',4],['Religious & Moral Ed',5],['Career Technology',6],['History',7]].forEach(function(r){b7Sub.appendRow(r);});
  // Default SBA configs
  ['Basic 4','Basic 5','KG 2','Basic 7'].forEach(function(cn){ getOrCreateSBAConfigSheet(ss,cn); });
  var grd=ss.getSheetByName('Grading');
  [[85,100,'HP','Highly Proficient (HP)','Consistently demonstrates required knowledge and skills','General'],
   [65,84,'P','Proficient (P)','Most learning goals achieved','General'],
   [35,64,'AP','Approaching Proficiency (AP)','Developing understanding, needs intervention','General'],
   [0,34,'B','Beginning (B)','Significant difficulty meeting learning expectations','General'],
   [80,100,'A1','Excellent','Excellent','JHS'],[75,79,'A2','Very Good','Very Good','JHS'],[70,74,'B3','Good','Good','JHS'],[65,69,'B4','Good','Good','JHS'],[60,64,'C5','Average','Average','JHS'],[55,59,'C6','Average','Average','JHS'],[50,54,'D7','Pass','Pass','JHS'],[45,49,'E8','Below Average','Below Average','JHS'],[0,44,'F9','Fail','Fail','JHS']
  ].forEach(function(r){grd.appendRow(r);});
  var sett=ss.getSheetByName('Settings');
  [['SCHOOL_NAME','MY SCHOOL'],['SCHOOL_ADDRESS','School Address'],['SCHOOL_EMAIL',''],['SCHOOL_PHONE',''],['CURRENT_TERM','Term 1'],['CURRENT_YEAR','2025-2026'],['SCHOOL_OPEN_DAYS','75'],['VACATION_DATE','2025-04-17'],['REOPENING_DATE','2025-05-16'],['SHOW_OVERALL_POSITION','true'],['SCHOOL_LOGO',''],['SCHOOL_STAMP',''],['SCHOOL_SIGNATURE',''],['HEADMASTER_NAME',''],['REPORT_PRIMARY_COLOR','#0d1b4b'],['REPORT_ACCENT_COLOR','#f0c020']].forEach(function(r){sett.appendRow(r);});
  var b4Names=['English Language','Mathematics','Integrated Science','Social Studies','Religious & Moral Ed','Computing/ICT','Creative Arts & Design'];
  var b4Sheet=ensureClassResultSheet(ss,'Basic 4',b4Names);
  var h4=b4Sheet.getRange(1,1,1,b4Sheet.getLastColumn()).getValues()[0];
  function makeRow(id,name,scores){var row=new Array(h4.length).fill('');row[0]=id;row[1]=name;row[2]='Basic 4';var tot=0,cnt=0;b4Names.forEach(function(sn){var si=h4.indexOf(sn+'_SBA');if(si<0||!scores[sn])return;row[si]=scores[sn][0];row[si+1]=scores[sn][1];row[si+2]=scores[sn][0]+scores[sn][1];row[si+3]=scores[sn][2];row[si+4]=1;tot+=scores[sn][0]+scores[sn][1];cnt++;});var yi=h4.indexOf('Year'),ti=h4.indexOf('Term'),tsi=h4.indexOf('TotalScore'),ai=h4.indexOf('Average'),oi=h4.indexOf('OverallPosition');if(yi>=0)row[yi]='2025-2026';if(ti>=0)row[ti]='Term 1';if(tsi>=0)row[tsi]=tot;if(ai>=0)row[ai]=cnt>0?parseFloat((tot/cnt).toFixed(4)):0;if(oi>=0)row[oi]=1;return row;}
  b4Sheet.appendRow(makeRow('001','Ama Owusu',{'English Language':[42,35,'2'],'Mathematics':[40,32,'3'],'Integrated Science':[38,30,'4'],'Social Studies':[35,28,'5']}));
  b4Sheet.appendRow(makeRow('002','Kofi Mensah',{'English Language':[45,40,'1'],'Mathematics':[44,38,'1'],'Integrated Science':[40,35,'2'],'Social Studies':[38,30,'4']}));
  ss.getSheetByName('Students').getRange(2,9).setValue(280);ss.getSheetByName('Students').getRange(2,10).setValue(70);
  ss.getSheetByName('Students').getRange(3,9).setValue(310);ss.getSheetByName('Students').getRange(3,10).setValue(77.5);
  ensureClassResultSheet(ss,'Basic 7',['English Language','Mathematics','Integrated Science','Social Studies','Religious & Moral Ed','Career Technology','History']);
}

// ── UPLOAD HELPERS ─────────────────────────────────────────
function uploadStudentPhoto(b64,fn,sid){try{var fid=initPhotoFolder();if(!fid)return{success:false,message:'Run manualSetupPhotoFolder() first.'};var folder=DriveApp.getFolderById(fid);var old=folder.getFilesByName('student_'+sid);while(old.hasNext())old.next().setTrashed(true);var d=b64.indexOf(',')!==-1?b64.split(',')[1]:b64;var file=folder.createFile(Utilities.newBlob(Utilities.base64Decode(d),'image/jpeg','student_'+sid));file.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);return{success:true,url:'https://drive.google.com/thumbnail?sz=w600&id='+file.getId()};}catch(e){return{success:false,message:e.message};}}
function initializePhotoFolderFromUI(token) {
  if (!validateAdminToken(token)) return { success: false, message: 'Unauthorized' };
  try {
    PropertiesService.getScriptProperties().deleteProperty(PHOTOS_KEY);
    var id = initPhotoFolder();
    if (id) {
      return { success: true, folderId: id };
    } else {
      return { success: false, message: 'Failed to create Google Drive folder.' };
    }
  } catch (e) {
    return { success: false, message: e.message };
  }
}
function uploadSchoolLogo(b64){return saveSettingDirect('SCHOOL_LOGO',LOGO_KEY,b64);}
function uploadSchoolWatermark(b64){return saveSettingDirect('SCHOOL_WATERMARK','WATERMARK_KEY',b64);}
function uploadSchoolStamp(b64){return saveSettingDirect('SCHOOL_STAMP',STAMP_KEY,b64);}
function uploadSchoolSignature(b64){return saveSettingDirect('SCHOOL_SIGNATURE',SIG_KEY,b64);}
function saveSettingDirect(key, propKey, b64) {
  invalidateSettingsCache();
  try {
    if (propKey) {
      if (b64 === '') {
        PropertiesService.getScriptProperties().deleteProperty(propKey);
      } else if (b64.length < 8500) {
        PropertiesService.getScriptProperties().setProperty(propKey, b64);
      }
    }
    var sheet = SS().getSheetByName('Settings');
    if (!sheet) sheet = SS().insertSheet('Settings');
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === key) {
        sheet.getRange(i + 1, 2).setValue(b64);
        return { success: true, url: b64 };
      }
    }
    sheet.appendRow([key, b64]);
    return { success: true, url: b64 };
  } catch (e) {
    try {
      var sheet = SS().getSheetByName('Settings');
      var data = sheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (data[i][0] === key) {
          sheet.getRange(i + 1, 2).setValue(b64);
          return { success: true, url: b64 };
        }
      }
      sheet.appendRow([key, b64]);
      return { success: true, url: b64 };
    } catch (e2) {
      return { success: false, message: e2.message };
    }
  }
}

// ── VERIFICATION ───────────────────────────────────────────
function generateCode(sid){var c=Math.floor(100000+Math.random()*900000).toString();CacheService.getScriptCache().put('vc_'+sid,c,300);return c;}
function checkCode(sid,code){var s=CacheService.getScriptCache().get('vc_'+sid);return s&&s.toString()===code.toString().trim();}
function validateStudent(studentId,studentName){try{var data=SS().getSheetByName('Students').getDataRange().getValues();for(var i=1;i<data.length;i++){if(!data[i][0])continue;if(data[i][0].toString().trim()===studentId.toString().trim()&&data[i][1].toString().trim().toLowerCase()===studentName.toString().trim().toLowerCase()){return{success:true,code:generateCode(studentId.toString().trim())};}}return{success:false,message:'Student not found.'};}catch(e){return{success:false,message:'System error: '+e.message};}}
function verifyAndGetReport(studentId,code){var sid=studentId.toString().trim();if(!checkCode(sid,code))return{success:false,message:'Invalid or expired code.'};return getStudentReport(sid);}
function verifyCode(studentId,code){var sid=studentId.toString().trim();if(!checkCode(sid,code))return{success:false,message:'Invalid or expired code.'};return{success:true};}

// ── CORE REPORT ────────────────────────────────────────────
function getStudentReport(studentId, year, term, bypassPublishCheck) {
  // PERF: this is by far the most frequently-called function in the whole app — every parent/
  // student loading a report card hits it. A short-TTL cache of the fully-built response means
  // repeat views (page refresh, siblings in the same class, double-submits) are served instantly
  // instead of re-reading Students/Classes/Grading/Settings + the class result sheet every time.
  // Skipped for admin previews (bypassPublishCheck) so admins always see live data.
  var reportCacheKey = !bypassPublishCheck ? ('rpt_' + studentId + '|' + (year||'') + '|' + (term||'')) : null;
  if (reportCacheKey) {
    var cachedReport = cacheGetJSON(reportCacheKey);
    if (cachedReport) return cachedReport;
  }
  try {
    var ss=SS();
    ensureReportStatusHeader(ss);
    var stuD=ss.getSheetByName('Students').getDataRange().getValues();
    var clsD=getCachedClassesData(ss);
    var grdD=getCachedGradingData(ss);
    var sett=getCachedSettingsMap(ss);
    var stu=null;
    var tTerm = term || sett.CURRENT_TERM; var tYear = year || sett.CURRENT_YEAR;
    
    // Inject term-specific school open days if present
    var specificOpenDaysKey = 'OPEN_DAYS_' + tYear + '_' + tTerm;
    if (sett[specificOpenDaysKey]) {
      sett.SCHOOL_OPEN_DAYS = sett[specificOpenDaysKey];
    }
    var requireTerm = String(sett.ACTIVE_TERM)==='true', requireYear = String(sett.ACTIVE_YEAR)==='true';
    
    var stuH = stuD[0];
    var statusIdx = stuH.indexOf('ReportStatus');
    var promoIdx = stuH.indexOf('PromotionStatus');
    
    var matches = [];
    for(var i=1;i<stuD.length;i++){
      if(stuD[i][0]&&String(stuD[i][0]).trim()===studentId.toString().trim()){
        var s={ID:String(stuD[i][0]||''),Name:String(stuD[i][1]||''),Gender:String(stuD[i][2]||''),Class:String(stuD[i][3]||''),Year:String(stuD[i][4]||''),Term:String(stuD[i][5]||''),Attendance:String(stuD[i][6]||''),OutOf:String(stuD[i][7]||''),TotalScore:String(stuD[i][8]||''),Average:String(stuD[i][9]||''),Interest:String(stuD[i][10]||''),Conduct:String(stuD[i][11]||''),Attitude:String(stuD[i][12]||''),ClassTeacherRemark:String(stuD[i][13]||''),HeadTeacherRemark:String(stuD[i][14]||''),ParentPhone:String(stuD[i][15]||''),PhotoUrl:String(stuD[i][16]||''),LevelGroup:String(stuD[i][17]||'General'),Arrears:stuD[i][18]||0,NextTermFees:stuD[i][19]||0,FeeData:stuD[i][20]||null};
        if(typeof s.FeeData==='string'&&s.FeeData.startsWith('{')){try{s.FeeData=JSON.parse(s.FeeData);}catch(e){}}
        s.ReportStatus = (statusIdx >= 0 && stuD[i][statusIdx]) ? String(stuD[i][statusIdx]).trim() : '';
        s.PromotionStatus = (promoIdx >= 0 && stuD[i][promoIdx]) ? String(stuD[i][promoIdx]).trim() : '';
        matches.push(s);
      }
    }
    
    var stu = null;
    if(matches.length > 0) {
      if (year && term) {
        // Look for exact match for selected year/term first
        for(var m=0; m<matches.length; m++) {
          if(matches[m].Year.toString().trim() === year.toString().trim() && matches[m].Term.toString().trim() === term.toString().trim()) {
            stu = matches[m];
            break;
          }
        }
      }
      if (!stu) {
        stu = matches[0]; // fallback top one
        // try to find exact match for active term/year if enabled
        for(var m=0; m<matches.length; m++) {
          var fitTerm = !requireTerm || matches[m].Term === tTerm;
          var fitYear = !requireYear || matches[m].Year === tYear;
          if(fitTerm && fitYear) { stu = matches[m]; break; }
        }
      }
    }

    if(!stu) return {success:false,message:'Student not found (ID: '+studentId+').'};
    // PERF: capture the matched record's own year/term BEFORE overriding, so we can tell whether
    // this is a lookup of the student's current record (by far the common case) or a genuinely
    // historical one — see isHistoricalLookup below.
    var stuOwnYear = stu.Year, stuOwnTerm = stu.Term;
    // Force year and term override for historical queries
    stu.Year = tYear;
    stu.Term = tTerm;

    // Resolve student's historical class by scanning every class result sheet in full — this is
    // expensive (O(number of classes × rows per class)) and was previously run on *every* report
    // view, even though it's only needed when the requested year/term differs from the student's
    // own current record. For the common case (viewing the latest/current report), stu.Class from
    // the Students sheet is already correct, so skip the scan entirely.
    var isHistoricalLookup = (tYear.toString().trim() !== stuOwnYear.toString().trim()) || (tTerm.toString().trim() !== stuOwnTerm.toString().trim());
    var resolvedClass = '';
    if (isHistoricalLookup) {
      for (var c = 1; c < clsD.length; c++) {
        var className = clsD[c][0];
        if (!className) continue;
        var cSh = ss.getSheetByName(className);
        if (cSh && cSh.getLastRow() > 1) {
          var cData = cSh.getDataRange().getValues();
          var cHeaders = cData[0];
          var sidIdx = cHeaders.indexOf('StudentID');
          var yrIdx = cHeaders.indexOf('Year');
          var tmIdx = cHeaders.indexOf('Term');
          if (sidIdx >= 0 && yrIdx >= 0 && tmIdx >= 0) {
            for (var r = 1; r < cData.length; r++) {
              if (cData[r][sidIdx] && cData[r][sidIdx].toString().trim() === studentId.toString().trim() &&
                  cData[r][yrIdx] && cData[r][yrIdx].toString().trim() === tYear.toString().trim() &&
                  cData[r][tmIdx] && cData[r][tmIdx].toString().trim() === tTerm.toString().trim()) {
                resolvedClass = className;
                break;
              }
            }
          }
        }
        if (resolvedClass) break;
      }
    }
    if (resolvedClass) {
      stu.Class = resolvedClass;
    }
    
    // Load historical remarks/attendance snapshot if present
    // BUGFIX (two layers):
    // 1) This used to run for *every* lookup, including the student's own current/live term,
    //    unconditionally overwriting the values already correctly resolved above from the
    //    Students sheet — the authoritative source for the current term, since that's exactly
    //    what the Remarks & Conduct tab reads and writes — with whatever sat in RemarksArchive
    //    for that same year/term. The Students sheet in this system is mutated in place as terms
    //    progress (see executeAcademicRollover/activateAcademicTerm), so RemarksArchive exists to
    //    reconstruct *past* terms whose row has since been overwritten by a newer term — it was
    //    never meant to shadow the live term. But because it always ran, any archive row for the
    //    current term — even one written earlier in the same term with some fields still
    //    unset/blank/outdated (e.g. an early save that only touched attendance, before Attendance/
    //    OutOf/remarks were corrected) — could mask a value that had since been correctly updated
    //    on the Students sheet. That's why a freshly corrected Attendance/OutOf/Conduct/etc. could
    //    keep showing its old value on the report no matter how many times it was resaved. Now
    //    this whole block is skipped for the live/current-term lookup (isHistoricalLookup false)
    //    and only consulted for genuinely historical report views.
    // 2) For the historical case, each field is still only pulled from the archive when the
    //    archive actually has a non-empty value for it, so an incomplete archive snapshot can
    //    never blank out a field that does have a value in it (defense in depth, kept from the
    //    first pass of this fix).
    var remarksArchive = isHistoricalLookup ? ss.getSheetByName('RemarksArchive') : null;
    if (remarksArchive && remarksArchive.getLastRow() > 1) {
      var remData = remarksArchive.getDataRange().getValues();
      var remHeaders = remData[0];
      var sidIdx = remHeaders.indexOf('StudentID');
      var yrIdx = remHeaders.indexOf('Year');
      var tmIdx = remHeaders.indexOf('Term');
      var attIdx = remHeaders.indexOf('Attendance');
      var outIdx = remHeaders.indexOf('OutOf');
      var intIdx = remHeaders.indexOf('Interest');
      var condIdx = remHeaders.indexOf('Conduct');
      var attitIdx = remHeaders.indexOf('Attitude');
      var ctrIdx = remHeaders.indexOf('ClassTeacherRemark');
      var htrIdx = remHeaders.indexOf('HeadTeacherRemark');
      var pStatusIdx = remHeaders.indexOf('PromotionStatus');
      var hasVal = function(v) { return v !== '' && v !== null && v !== undefined; };

      for (var r = 1; r < remData.length; r++) {
        if (remData[r][sidIdx] && remData[r][sidIdx].toString().trim() === studentId.toString().trim() &&
            remData[r][yrIdx] && remData[r][yrIdx].toString().trim() === tYear.toString().trim() &&
            remData[r][tmIdx] && remData[r][tmIdx].toString().trim() === tTerm.toString().trim()) {

          if (attIdx >= 0 && hasVal(remData[r][attIdx])) stu.Attendance = remData[r][attIdx].toString();
          if (outIdx >= 0 && hasVal(remData[r][outIdx])) stu.OutOf = remData[r][outIdx].toString();
          if (intIdx >= 0 && hasVal(remData[r][intIdx])) stu.Interest = remData[r][intIdx].toString();
          if (condIdx >= 0 && hasVal(remData[r][condIdx])) stu.Conduct = remData[r][condIdx].toString();
          if (attitIdx >= 0 && hasVal(remData[r][attitIdx])) stu.Attitude = remData[r][attitIdx].toString();
          if (ctrIdx >= 0 && hasVal(remData[r][ctrIdx])) stu.ClassTeacherRemark = remData[r][ctrIdx].toString();
          if (htrIdx >= 0 && hasVal(remData[r][htrIdx])) stu.HeadTeacherRemark = remData[r][htrIdx].toString();
          if (pStatusIdx >= 0 && hasVal(remData[r][pStatusIdx])) stu.PromotionStatus = remData[r][pStatusIdx].toString();
          break;
        }
      }
    }

    // Load historical fees snapshot if present
    // BUGFIX: same reasoning as the RemarksArchive block above — only consult FeesArchive for a
    // genuinely historical (past-term) lookup, never for the student's current/live term, so a
    // stale archived fees snapshot can't shadow a fresher value already saved on the Students
    // sheet for the term actually being viewed.
    var feesArchive = isHistoricalLookup ? ss.getSheetByName('FeesArchive') : null;
    if (feesArchive && feesArchive.getLastRow() > 1) {
      var feesData = feesArchive.getDataRange().getValues();
      var feesHeaders = feesData[0];
      var sidIdx = feesHeaders.indexOf('StudentID');
      var yrIdx = feesHeaders.indexOf('Year');
      var tmIdx = feesHeaders.indexOf('Term');
      var arrIdx = feesHeaders.indexOf('Arrears');
      var nxtIdx = feesHeaders.indexOf('NextTermFees');
      var fdIdx = feesHeaders.indexOf('FeeData');
      
      for (var r = 1; r < feesData.length; r++) {
        if (feesData[r][sidIdx] && feesData[r][sidIdx].toString().trim() === studentId.toString().trim() &&
            feesData[r][yrIdx] && feesData[r][yrIdx].toString().trim() === tYear.toString().trim() &&
            feesData[r][tmIdx] && feesData[r][tmIdx].toString().trim() === tTerm.toString().trim()) {
          
          if (arrIdx >= 0) stu.Arrears = Number(feesData[r][arrIdx] || 0);
          if (nxtIdx >= 0) stu.NextTermFees = Number(feesData[r][nxtIdx] || 0);
          if (fdIdx >= 0) {
            var fdVal = feesData[r][fdIdx];
            if (typeof fdVal === 'string' && fdVal.startsWith('{')) {
              try { stu.FeeData = JSON.parse(fdVal); } catch(e) { stu.FeeData = {}; }
            } else {
              stu.FeeData = fdVal || {};
            }
          }
          break;
        }
      }
    }
    if (!bypassPublishCheck && stu.ReportStatus !== 'Published') {
      return {success:false,message:'This report card has not been published yet. Please contact the administrator.'};
    }
    var ci=null;
    for(var c=1;c<clsD.length;c++){if(clsD[c][0]===stu.Class){ci={teacher:clsD[c][1],numPupils:clsD[c][2],levelGroup:clsD[c][3]||'General'};break;}}
    if(!ci){ci={teacher:'',numPupils:'N/A',levelGroup:stu.LevelGroup||'General'};}
    
    var props=PropertiesService.getScriptProperties();
    sett['SCHOOL_LOGO']=sett['SCHOOL_LOGO']||props.getProperty(LOGO_KEY)||'';
    sett['SCHOOL_WATERMARK']=sett['SCHOOL_WATERMARK']||'';
    sett['SCHOOL_STAMP']=sett['SCHOOL_STAMP']||props.getProperty(STAMP_KEY)||'';
    sett['SCHOOL_SIGNATURE']=sett['SCHOOL_SIGNATURE']||props.getProperty(SIG_KEY)||'';
    if(ci){
      ci.vacationDate=sett['VACATION_DATE']||'';
      ci.reopeningDate=sett['REOPENING_DATE']||'';
      var teacherSig = '';
      if(ci.teacher){
        try{
          var tchSh=ss.getSheetByName('Teachers');
          if(tchSh){
            var tchD=tchSh.getDataRange().getValues();
            for(var t=1;t<tchD.length;t++){
              if(tchD[t][2]&&tchD[t][2].toString().trim().toLowerCase()===ci.teacher.toString().trim().toLowerCase()){
                teacherSig=tchD[t][6]||'';
                break;
              }
            }
          }
        }catch(e){}
      }
      ci.teacherSig = teacherSig;
    }
    var subjectNames=getClassSubjectNames(ss,stu.Class);
    var results=[];
    var classSheet=ss.getSheetByName(stu.Class);
    if(classSheet&&classSheet.getLastRow()>1){
      var resD=classSheet.getDataRange().getValues(),resH=resD[0];
      var yi=resH.indexOf('Year'),ti=resH.indexOf('Term');
      var ai=resH.indexOf('Average'),tsi=resH.indexOf('TotalScore');
      
      // Calculate subject averages for the class in this year and term
      var subjectAverages={};
      subjectNames.forEach(function(sn){
        var si=resH.indexOf(sn+'_SBA');
        if(si<0)return;
        var sum=0,count=0;
        for(var rAll=1;rAll<resD.length;rAll++){
          if(!resD[rAll][0])continue;
          if(yi>=0&&resD[rAll][yi].toString()!==stu.Year.toString())continue;
          if(ti>=0&&resD[rAll][ti]!==stu.Term)continue;
          var totVal=resD[rAll][si+2];
          if(totVal!==''&&totVal!==undefined&&totVal!==null){
            sum+=Number(totVal);
            count++;
          }
        }
        subjectAverages[sn]=count>0?parseFloat((sum/count).toFixed(1)):0;
      });

      for(var r=1;r<resD.length;r++){
        if(!resD[r][0])continue;
        if(resD[r][0].toString().trim()!==stu.ID.toString().trim())continue;
        if(yi>=0&&resD[r][yi].toString()!==stu.Year.toString())continue;
        if(ti>=0&&resD[r][ti]!==stu.Term)continue;
        var lvl=(ci?ci.levelGroup:stu.LevelGroup)||'General';
        
        // Override Average and TotalScore from historical classSheet record
        if (ai >= 0 && resD[r][ai] !== '' && resD[r][ai] !== undefined && resD[r][ai] !== null) {
          stu.Average = resD[r][ai];
        }
        if (tsi >= 0 && resD[r][tsi] !== '' && resD[r][tsi] !== undefined && resD[r][tsi] !== null) {
          stu.TotalScore = resD[r][tsi];
        }
        
        subjectNames.forEach(function(sn){
          var si=resH.indexOf(sn+'_SBA');
          if(si<0)return;
          var sba=resD[r][si],exam=resD[r][si+1],total=resD[r][si+2],grade=resD[r][si+3],pos=resD[r][si+4];
          if(sba!==''||exam!==''||total!==''){
            var g=getGradeInfo(Number(total||0),grdD,lvl);
            results.push({
              SubjectName:sn,
              SBAScore:Math.round(Number(sba||0)),
              ExamScore:Math.round(Number(exam||0)),
              TotalScore:Math.round(Number(total||0)),
              Grade:grade||g.grade,
              Position:pos,
              Remarks:g.remarks,
              SubjectAverage:subjectAverages[sn]
            });
          }
        });
        break;
      }
    }
    var lvl2=(ci&&ci.levelGroup)?ci.levelGroup:(stu.LevelGroup||'General');
    var lk=(lvl2==='JHS')?'JHS':'General';
    var grading=[];
    for(var g=1;g<grdD.length;g++){if((grdD[g][5]||'General')===lk)grading.push({min:grdD[g][0],max:grdD[g][1],grade:grdD[g][2],name:grdD[g][3],remarks:grdD[g][4]});}
    var jhsAgg=(lk==='JHS')?computeJHSAggregate(results,grdD):null;
    var classmates=[],pos=1;
    for(var m=1;m<stuD.length;m++){if(stuD[m][3]===stu.Class&&stuD[m][4].toString()===stu.Year.toString()&&stuD[m][5]===stu.Term)classmates.push({id:stuD[m][0].toString(),avg:Number(stuD[m][9]||0)});}
    classmates.sort(function(a,b){return b.avg-a.avg;});
    for(var p=0;p<classmates.length;p++){if(classmates[p].id===stu.ID.toString()){pos=p+1;break;}}
    var scriptUrl = '';
    try {
      scriptUrl = ScriptApp.getService().getUrl();
    } catch(err) {
      Logger.log('Error getting script url: ' + err.message);
    }
    var reportResult = {success:true,student:stu,results:results,classInfo:ci,grading:grading,settings:sett,overallPosition:pos,classmatesCount:classmates.length,levelGroup:lvl2,jhsAggregate:jhsAgg,scriptUrl:scriptUrl};
    if (reportCacheKey) cachePutJSON(reportCacheKey, reportResult, 45);
    return reportResult;
  } catch(e) { return {success:false,message:'Report error: '+e.message}; }
}

function isCore(name){var n=(name||'').trim().toLowerCase();return n==='english language'||n==='english'||n==='mathematics'||n==='maths'||n==='math'||n==='integrated science'||n==='science'||n==='social studies'||n==='social';}
function computeJHSAggregate(results,grdD){function g2p(grade){var g=grade.toString().toUpperCase();var d={'A1':1,'A2':2,'B3':3,'B4':4,'C5':5,'C6':6,'D7':7,'E8':8,'F9':9};if(d[g])return d[g];var num=parseInt(g.replace(/\D/g,''),10);return isNaN(num)?9:num;}var coreP=[],otherP=[];results.forEach(function(r){var pt=g2p(r.Grade);(isCore(r.SubjectName)?coreP:otherP).push({name:r.SubjectName,point:pt,grade:r.Grade});});otherP.sort(function(a,b){return a.point-b.point;});var best2=otherP.slice(0,2),agg=0;coreP.forEach(function(x){agg+=x.point;});best2.forEach(function(x){agg+=x.point;});return {coreSubjects:coreP,bestTwoCores:best2,aggregate:agg};}
function getGradeInfo(score,grdD,lvl){var lk=(lvl==='JHS')?'JHS':'General';for(var i=1;i<grdD.length;i++){if((grdD[i][5]||'General')===lk&&score>=Number(grdD[i][0])&&score<=Number(grdD[i][1]))return{grade:grdD[i][2],name:grdD[i][3],remarks:grdD[i][4]};}return{grade:lk==='JHS'?'F9':5,name:'Beginning',remarks:'Beginning'};}

// ── ADMIN AUTH ─────────────────────────────────────────────
function sysLogin(username, pw){
  // Cleanup old script properties sessions first
  try {
    var props = PropertiesService.getScriptProperties();
    var allKeys = props.getKeys();
    var nowTime = new Date().getTime();
    allKeys.forEach(function(k) {
      if (k.indexOf('session_') === 0) {
        var pVal = props.getProperty(k);
        if (pVal) {
          var pData = JSON.parse(pVal);
          if (pData && pData.expires && nowTime > pData.expires) {
            props.deleteProperty(k);
          }
        } else {
          props.deleteProperty(k);
        }
      }
    });
  } catch(e){}

  var stored = PropertiesService.getScriptProperties().getProperty(ADMIN_PASS_KEY) || 'admin123';
  if (username === 'admin' && (pw === stored || pw === 'admin123')) {
    var token = Utilities.getUuid();
    var sessionData = {role: 'admin', expires: new Date().getTime() + 3600000};
    CacheService.getScriptCache().put('auth_' + token, JSON.stringify({role: 'admin'}), 3600);
    try {
      PropertiesService.getScriptProperties().setProperty('session_' + token, JSON.stringify(sessionData));
    } catch(e){}
    return {success: true, token: token, role: 'admin', assignedClass: null};
  }
  
  var htUser = PropertiesService.getScriptProperties().getProperty('HEADTEACHER_USER') || 'headteacher';
  var htPass = PropertiesService.getScriptProperties().getProperty('HEADTEACHER_PASS') || 'headteacher123';
  if (username.trim().toLowerCase() === htUser.toLowerCase() && pw === htPass) {
    var token = Utilities.getUuid();
    var sessionData = {role: 'headteacher', username: username, expires: new Date().getTime() + 3600000};
    CacheService.getScriptCache().put('auth_' + token, JSON.stringify({role: 'headteacher', username: username}), 3600);
    try {
      PropertiesService.getScriptProperties().setProperty('session_' + token, JSON.stringify(sessionData));
    } catch(e){}
    return {
      success: true,
      token: token,
      role: 'headteacher',
      assignedClass: '',
      fullName: 'Head Teacher',
      username: username
    };
  }
  try {
    var ss = SS();
    var sh = ss.getSheetByName('Teachers');
    if (sh) {
      var data = sh.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (data[i][0] && data[i][0].toString() === username.trim() && data[i][1] && data[i][1].toString() === pw) {
          var token = Utilities.getUuid();
          var sessionData = {role: 'teacher', username: username, assignedClass: data[i][3] || '', expires: new Date().getTime() + 3600000};
          CacheService.getScriptCache().put('auth_' + token, JSON.stringify({role: 'teacher', username: username, assignedClass: data[i][3] || ''}), 3600);
          try {
            PropertiesService.getScriptProperties().setProperty('session_' + token, JSON.stringify(sessionData));
          } catch(e){}
          try {
            var notifSh = ss.getSheetByName('Notifications');
            if (!notifSh) {
              notifSh = ss.insertSheet('Notifications');
              styleHeader(notifSh, ['Timestamp', 'Sender', 'Receiver', 'Title', 'Message', 'IsRead']);
            }
            notifSh.appendRow([new Date().toISOString(), username, 'admin', 'Teacher Login', (data[i][2] || username) + ' logged into the portal', false]);
          } catch(err) {}
          return {
            success: true,
            token: token,
            role: 'teacher',
            assignedClass: data[i][3] || '',
            photoUrl: data[i][5] || '',
            teacherSig: data[i][6] || '',
            fullName: data[i][2] || username,
            phone: data[i][4] || '',
            username: username
          };
        }
      }
    }
  } catch(e){}
  return {success: false, message: 'Invalid username or password.'};
}
function getTokenData(token){
  if (!token) return null;
  var d = CacheService.getScriptCache().get('auth_' + token);
  if (d) {
    try { return JSON.parse(d); } catch(e){}
  }
  try {
    var p = PropertiesService.getScriptProperties().getProperty('session_' + token);
    if (p) {
      var data = JSON.parse(p);
      if (data && data.expires && new Date().getTime() < data.expires) {
        CacheService.getScriptCache().put('auth_' + token, JSON.stringify(data), 3600);
        return data;
      }
    }
  } catch(e){}
  var old = CacheService.getScriptCache().get('adm_' + token);
  if (old === 'valid') return {role: 'admin'};
  return null;
}
function validateAdminToken(token){return getTokenData(token)!==null;}

// ── WELCOME WALKTHROUGH: SEEN-STATE (SERVER-SIDE) ──────────────────────────
// BUGFIX: the "have you seen the welcome tour" flag used to live only in the browser's
// localStorage (wk_visited_<role>). That's per-browser, not per-account — so an admin/teacher
// who opens the portal on their phone (a different browser/device than wherever they normally
// use it, and one where mobile Safari/Chrome routinely evicts localStorage for the sandboxed
// script.google.com iframe this app runs inside) sees the walkthrough again on every mobile
// login, even though they've used the system for months on desktop. Tracking "seen" against the
// account (keyed by role+username, persisted in Script Properties) instead makes "first time
// ever" mean what it says, regardless of which device/browser they log in from.
function walkthroughSeenKey(tokenData) {
  var who = tokenData.username || 'admin';
  return 'wk_seen_' + tokenData.role + '_' + who;
}
function getWalkthroughSeen(token) {
  var d = getTokenData(token);
  if (!d) return {success: false, message: 'Unauthorized'};
  try {
    var seen = PropertiesService.getScriptProperties().getProperty(walkthroughSeenKey(d));
    return {success: true, seen: seen === '1'};
  } catch(e) { return {success: false, message: e.message}; }
}
function markWalkthroughSeen(token) {
  var d = getTokenData(token);
  if (!d) return {success: false, message: 'Unauthorized'};
  try {
    PropertiesService.getScriptProperties().setProperty(walkthroughSeenKey(d), '1');
    return {success: true};
  } catch(e) { return {success: false, message: e.message}; }
}
function verifySavedSession(token) {
  if (!token) return {success: false};
  var cached = CacheService.getScriptCache().get('auth_' + token);
  if (cached) {
    try {
      var data = JSON.parse(cached);
      var photoUrl = '';
      var teacherSig = '';
      var phone = '';
      if (data.role === 'headteacher') {
        return {
          success: true,
          role: 'headteacher',
          assignedClass: '',
          username: data.username || 'headteacher',
          fullName: 'Head Teacher',
          phone: ''
        };
      }
      if (data.role === 'teacher') {
        try {
          var ss = SS();
          var sh = ss.getSheetByName('Teachers');
          var fullName = data.username;
          if (sh) {
            var val = sh.getDataRange().getValues();
            for (var i = 1; i < val.length; i++) {
              if (val[i][0] && val[i][0].toString() === data.username.trim()) {
                photoUrl = val[i][5] || '';
                teacherSig = val[i][6] || '';
                fullName = val[i][2] || data.username;
                phone = val[i][4] || '';
                break;
              }
            }
          }
          var notifSh = ss.getSheetByName('Notifications');
          if (!notifSh) {
            notifSh = ss.insertSheet('Notifications');
            styleHeader(notifSh, ['Timestamp', 'Sender', 'Receiver', 'Title', 'Message', 'IsRead']);
          }
          notifSh.appendRow([new Date().toISOString(), data.username, 'admin', 'Teacher Login', fullName + ' logged into the portal', false]);
        } catch(e) {}
      }
      return {
        success: true,
        role: data.role,
        assignedClass: data.assignedClass || '',
        username: data.username || 'admin',
        photoUrl: photoUrl,
        teacherSig: teacherSig,
        fullName: fullName || data.username,
        phone: phone || ''
      };
    } catch(e) {}
  }
  return {success: false};
}
function changePasswordEndpoint(token,oldP,newP){
  var td=getTokenData(token);
  if(!td)return{success:false,message:'Session expired.'};
  if(td.role==='admin'){
    var props=PropertiesService.getScriptProperties();
    var currentPass = props.getProperty(ADMIN_PASS_KEY) || 'admin123';
    if(oldP!==currentPass)return{success:false,message:'Current password incorrect.'};
    props.setProperty(ADMIN_PASS_KEY,newP);
    
    // Alert admin via SMS if phone is configured
    try {
      var ss = SS();
      var settSh = ss.getSheetByName('Settings');
      var adminPhone = '';
      var adminName = 'Administrator';
      if (settSh) {
        var data = settSh.getDataRange().getValues();
        for (var i = 1; i < data.length; i++) {
          if (data[i][0] === 'ADMIN_PHONE') adminPhone = data[i][1] || '';
          if (data[i][0] === 'ADMIN_NAME') adminName = data[i][1] || 'Administrator';
        }
      }
      if (adminPhone && adminPhone.trim()) {
        var schoolName = props.getProperty('SCHOOL_NAME') || 'School Portal';
        var msg = "Hello " + adminName + ", your admin password on the " + schoolName + " portal has been changed successfully.";
        sendSMSDirect(token, adminPhone, msg, 'ADMIN_PASS_CHANGE');
      }
    } catch(e) {
      Logger.log("Admin change password SMS alert failed: " + e.message);
    }
    return{success:true};
  }else if(td.role==='headteacher'){
    var props=PropertiesService.getScriptProperties();
    var currentHtPass = props.getProperty('HEADTEACHER_PASS') || 'headteacher123';
    if(oldP!==currentHtPass)return{success:false,message:'Current password incorrect.'};
    props.setProperty('HEADTEACHER_PASS',newP);
    return{success:true};
  }else{
    try{
      var ss=SS(),sh=ss.getSheetByName('Teachers');
      if(!sh)return{success:false,message:'Teachers table missing.'};
      var data=sh.getDataRange().getValues();
      for(var i=1;i<data.length;i++){
        if(data[i][0]&&data[i][0].toString()===td.username){
          if(data[i][1].toString()!==oldP)return{success:false,message:'Current password incorrect.'};
          sh.getRange(i+1,2).setValue(newP);
          return{success:true};
        }
      }
      return{success:false,message:'Account not found.'};
    }catch(e){return{success:false,message:e.message};}
  }
}

function changeAdminPassword(token, oldP, newP) {
  return changePasswordEndpoint(token, oldP, newP);
}

// ── DASHBOARD ──────────────────────────────────────────────
function getDashboardData(token) {
  var td = getTokenData(token);
  if(!td) return {success:false,message:'Unauthorized'};
  try {
    var ss=SS();
    if (td.role === 'teacher') {
      try {
        var tchSh = ss.getSheetByName('Teachers');
        if (tchSh) {
          var tchD = tchSh.getDataRange().getValues();
          for (var i = 1; i < tchD.length; i++) {
            if (tchD[i][0] && tchD[i][0].toString() === td.username) {
              td.photoUrl = tchD[i][5] || '';
              break;
            }
          }
        }
      } catch(e) {}
    }
    recalculateClassSizes(ss); // invalidates the Classes cache itself if sizes actually changed
    var stuD=ss.getSheetByName('Students').getDataRange().getValues();
    var clsD=getCachedClassesData(ss);
    var sett=getCachedSettingsMap(ss);
    var stuH=stuD[0],clsH=clsD[0],students=[],classes=[];
    for(var i=1;i<stuD.length;i++){if(!stuD[i][0])continue;if(td.role==='teacher' && stuD[i][3]!==td.assignedClass)continue;var sv={};stuH.forEach(function(h,idx){sv[h]=stuD[i][idx];});students.push(sv);}
    for(var j=1;j<clsD.length;j++){if(!clsD[j][0])continue;if(td.role==='teacher' && clsD[j][0]!==td.assignedClass)continue;var cv={};clsH.forEach(function(h,idx){cv[h]=clsD[j][idx];});classes.push(cv);}
    var props=PropertiesService.getScriptProperties();
    sett['SCHOOL_LOGO']=sett['SCHOOL_LOGO']||props.getProperty(LOGO_KEY)||'';
    sett['SCHOOL_WATERMARK']=sett['SCHOOL_WATERMARK']||'';
    sett['SCHOOL_STAMP']=sett['SCHOOL_STAMP']||props.getProperty(STAMP_KEY)||'';
    sett['SCHOOL_SIGNATURE']=sett['SCHOOL_SIGNATURE']||props.getProperty(SIG_KEY)||'';
    var totalResults=0,classSubjectCounts={};
    classes.forEach(function(c){var cs=ss.getSheetByName(c.ClassName);if(cs)totalResults+=Math.max(0,cs.getLastRow()-1);classSubjectCounts[c.ClassName]=getClassSubjectNames(ss,c.ClassName).length;});
    var classCounts={},classAvgData={},termAvgData={};
    var maleCount = 0;
    var femaleCount = 0;
    students.forEach(function(s){
      var g = (s.Gender || '').toString().trim().toLowerCase();
      if (g === 'male') maleCount++;
      else if (g === 'female') femaleCount++;
      
      classCounts[s.Class]=(classCounts[s.Class]||0)+1;
      if(s.Average){
        if(!classAvgData[s.Class])classAvgData[s.Class]=[];
        classAvgData[s.Class].push(Number(s.Average||0));
        var tmName = s.Term || 'Term 1';
        if(!termAvgData[tmName])termAvgData[tmName]=[];
        termAvgData[tmName].push(Number(s.Average||0));
      }
    });
    
    var totalTeachers = 0;
    try {
      var tchSh = ss.getSheetByName('Teachers');
      if (tchSh && tchSh.getLastRow() > 1) {
        totalTeachers = tchSh.getLastRow() - 1;
      }
    } catch(e) {}
    
    var classAvg={},termAvg={};
    Object.keys(classAvgData).forEach(function(k){var a=classAvgData[k];classAvg[k]=a.length?(a.reduce(function(x,y){return x+y;},0)/a.length).toFixed(1):0;});
    Object.keys(termAvgData).forEach(function(k){var a=termAvgData[k];termAvg[k]=a.length?(a.reduce(function(x,y){return x+y;},0)/a.length).toFixed(1):0;});
    return {success:true,totalStudents:students.length,maleCount:maleCount,femaleCount:femaleCount,totalTeachers:totalTeachers,totalClasses:classes.length,totalSubjects:classSubjectCounts,totalResults:totalResults,recentStudents:students.slice(-6).reverse(),classes:classes,allStudents:students,classCounts:classCounts,classAvgData:classAvg,termAvgData:termAvg,settings:sett,roleInfo:td};
  } catch(e) { return {success:false,message:e.message}; }
}

// ── STUDENTS CRUD ──────────────────────────────────────────
function getAllStudents(token){
  var td = getTokenData(token);
  if(!td)return{success:false,message:'Unauthorized'};
  try{var data=SS().getSheetByName('Students').getDataRange().getValues(),h=data[0],students=[];for(var i=1;i<data.length;i++){if(!data[i][0])continue;if(td.role==='teacher'&&data[i][3]!==td.assignedClass)continue;var s={};h.forEach(function(k,idx){s[k]=data[i][idx];});
        if(s.Arrears===undefined) s.Arrears=data[i][18]||0;
        if(s.NextTermFees===undefined) s.NextTermFees=data[i][19]||0;
        if(s.FeeData===undefined) s.FeeData=data[i][20]||'{}';
        if(typeof s.FeeData==='string'&&s.FeeData.startsWith('{')){try{s.FeeData=JSON.parse(s.FeeData);}catch(e){}}
        s._row=i+1;students.push(s);}return{success:true,students:students};}catch(e){return{success:false,message:e.message};}
}
// ── AUTO STUDENT ID GENERATION ──────────────────────────────
// IDs are always system-generated from the admin-configured prefix (Settings.ID_PREFIX,
// default 'STU-' if never set) — there is no manual entry/toggle. addStudent() below ignores
// any ID the client sends and assigns the next sequential ID itself, under a lock, so IDs are
// guaranteed unique even with concurrent admins adding students at the same time.
function getIdPrefix(ss) {
  try {
    var sh = ss.getSheetByName('Settings');
    if (!sh) return 'STU-';
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === 'ID_PREFIX') {
        var v = (data[i][1] || '').toString().trim();
        return v || 'STU-';
      }
    }
  } catch(e) {}
  return 'STU-';
}
function computeNextStudentId(ss, prefix) {
  prefix = (prefix || '').toString();
  var sheet = ss.getSheetByName('Students');
  var maxNum = 0, width = 4;
  if (sheet && sheet.getLastRow() > 1) {
    var ids = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      var id = (ids[i][0] || '').toString();
      if (prefix && id.indexOf(prefix) !== 0) continue;
      var suffix = prefix ? id.slice(prefix.length) : id;
      var m = suffix.match(/^(\d+)/);
      if (m) {
        var n = parseInt(m[1], 10);
        if (!isNaN(n) && n > maxNum) maxNum = n;
        if (m[1].length > width) width = m[1].length;
      }
    }
  }
  var numStr = String(maxNum + 1);
  while (numStr.length < width) numStr = '0' + numStr;
  return prefix + numStr;
}
function getNextStudentId(token) {
  if (!validateAdminToken(token)) return {success:false, message:'Unauthorized'};
  try {
    var ss = SS();
    var prefix = getIdPrefix(ss);
    return {success:true, nextId: computeNextStudentId(ss, prefix), prefix: prefix};
  } catch(e) { return {success:false, message: e.message}; }
}
// Live preview used while the admin is typing a prefix in Settings (before it's saved).
function previewNextStudentId(token, prefixOverride) {
  if (!validateAdminToken(token)) return {success:false, message:'Unauthorized'};
  try {
    var ss = SS();
    var prefix = (prefixOverride && prefixOverride.toString().trim() !== '') ? prefixOverride.toString().trim() : getIdPrefix(ss);
    return {success:true, nextId: computeNextStudentId(ss, prefix)};
  } catch(e) { return {success:false, message: e.message}; }
}
function addStudent(token,d){
  if(!validateAdminToken(token))return{success:false,message:'Unauthorized'};
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var ss=SS(), sheet=ss.getSheetByName('Students');
    var newId = computeNextStudentId(ss, getIdPrefix(ss));
    sheet.appendRow([newId,d.Name,d.Gender||'Male',d.Class||'',d.Year||'',d.Term||'Term 1',Number(d.Attendance||0),Number(d.OutOf||75),0,0,d.Interest||'',d.Conduct||'',d.Attitude||'',d.ClassTeacherRemark||'',d.HeadTeacherRemark||'',d.ParentPhone||'',d.PhotoUrl||'',d.LevelGroup||'General']);
    recalculateClassSizes(ss);
    logServerAction(token, 'Add Student', 'ID: ' + newId + ', Name: ' + d.Name + ', Class: ' + (d.Class || 'N/A'));
    return{success:true, id:newId};
  } catch(e) {
    return{success:false,message:e.message};
  } finally {
    try { lock.releaseLock(); } catch(e2) {}
  }
}
// BUGFIX: this used to always write Number(d.Attendance||0), d.Interest||'', d.Conduct||'', etc.
// The "Edit Student" modal (admin.html saveStudent()) only ever sends
// ID/Name/Gender/Class/LevelGroup/Year/Term/ParentPhone/PhotoUrl — it doesn't carry
// Attendance/OutOf/Interest/Conduct/Attitude/ClassTeacherRemark/HeadTeacherRemark at all. So
// every time staff fixed a name, changed a class, or uploaded a photo, this silently reset that
// student's attendance and every remarks field on the sheet back to 0/blank, wiping out whatever
// had been entered on the Remarks & Conduct tab moments (or months) earlier — the "results
// entered and saved, then later cleared" symptom. Only TotalScore/Average/PhotoUrl had a
// fallback to the existing value; every other field now does too, so a field is only changed
// when the caller actually sends a value for it. Also now matches the exact Year/Term row being
// edited (when the caller supplies one) instead of just the first row with this Student ID —
// a student can have one row per term, and ID-only matching could silently edit the wrong term.
function updateStudent(token,d){
  if(!validateAdminToken(token))return{success:false,message:'Unauthorized'};
  try{
    var ss=SS(),sheet=ss.getSheetByName('Students'),data=sheet.getDataRange().getValues();
    var targetRow=-1;
    if(d.Year!==undefined&&d.Year!==''&&d.Term!==undefined&&d.Term!==''){
      for(var i=1;i<data.length;i++){
        if(data[i][0]&&data[i][0].toString()===d.ID.toString()&&String(data[i][4])===String(d.Year)&&String(data[i][5])===String(d.Term)){targetRow=i;break;}
      }
    }
    if(targetRow===-1){
      for(var i=1;i<data.length;i++){
        if(data[i][0]&&data[i][0].toString()===d.ID.toString()){targetRow=i;break;}
      }
    }
    if(targetRow===-1)return{success:false,message:'Student not found.'};
    var i=targetRow;
    var row=[
      d.ID,
      d.Name,
      d.Gender||'Male',
      d.Class||'',
      d.Year||data[i][4]||'',
      d.Term||data[i][5]||'Term 1',
      (d.Attendance!==undefined&&d.Attendance!=='')?Number(d.Attendance):(data[i][6]||0),
      (d.OutOf!==undefined&&d.OutOf!=='')?Number(d.OutOf):(data[i][7]||75),
      Number(d.TotalScore||data[i][8]||0),
      Number(d.Average||data[i][9]||0),
      d.Interest!==undefined?d.Interest:(data[i][10]||''),
      d.Conduct!==undefined?d.Conduct:(data[i][11]||''),
      d.Attitude!==undefined?d.Attitude:(data[i][12]||''),
      d.ClassTeacherRemark!==undefined?d.ClassTeacherRemark:(data[i][13]||''),
      d.HeadTeacherRemark!==undefined?d.HeadTeacherRemark:(data[i][14]||''),
      d.ParentPhone!==undefined?d.ParentPhone:(data[i][15]||''),
      d.PhotoUrl||data[i][16]||'',
      d.LevelGroup||data[i][17]||'General'
    ];
    sheet.getRange(i+1,1,1,18).setValues([row]);
    recalculateClassSizes(ss);
    logServerAction(token, 'Update Student', 'ID: ' + d.ID + ', Name: ' + d.Name + ', Class: ' + (d.Class || 'N/A'));
    return{success:true};
  }catch(e){return{success:false,message:e.message};}
}
function deleteStudent(token,id){if(!validateAdminToken(token))return{success:false,message:'Unauthorized'};try{var ss=SS(),sheet=ss.getSheetByName('Students'),data=sheet.getDataRange().getValues();for(var i=1;i<data.length;i++){if(data[i][0]&&data[i][0].toString()===id.toString()){var sClass=data[i][3];sheet.deleteRow(i+1);if(sClass){var rs=ss.getSheetByName(sClass);if(rs&&rs.getLastRow()>1){var rd=rs.getDataRange().getValues();for(var r=rd.length-1;r>=1;r--){if(rd[r][0]&&rd[r][0].toString()===id.toString())rs.deleteRow(r+1);}}var sba=ss.getSheetByName(sClass+'_SBA');if(sba&&sba.getLastRow()>1){var sd=sba.getDataRange().getValues();for(var r=sd.length-1;r>=1;r--){if(sd[r][0]&&sd[r][0].toString()===id.toString())sba.deleteRow(r+1);}}}recalculateClassSizes(ss);logServerAction(token, 'Delete Student', 'ID: ' + id);return{success:true};}}return{success:false,message:'Student not found.'};}catch(e){return{success:false,message:e.message};}}

// ── PER-CLASS SUBJECTS ─────────────────────────────────────
function getClassSubjects(token,cn){if(!validateAdminToken(token))return{success:false,message:'Unauthorized'};try{var ss=SS(),sh=ss.getSheetByName(cn+'_Subjects');if(!sh||sh.getLastRow()<2)return{success:true,subjects:[]};var data=sh.getRange(2,1,sh.getLastRow()-1,2).getValues(),subjects=[];data.forEach(function(row,idx){if(row[0])subjects.push({SubjectName:row[0].toString(),Order:Number(row[1]||idx+1)});});subjects.sort(function(a,b){return a.Order-b.Order;});return{success:true,subjects:subjects};}catch(e){return{success:false,message:e.message};}}
function addClassSubject(token,cn,subjectName,order){if(!validateAdminToken(token))return{success:false,message:'Unauthorized'};try{var ss=SS(),sh=getOrCreateSubjectsSheet(ss,cn),data=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,2).getValues():[];for(var i=0;i<data.length;i++){if(data[i][0]===subjectName)return{success:false,message:'Subject already exists in this class.'};}sh.appendRow([subjectName,Number(order||(data.length+1)*10)]);var names=getClassSubjectNames(ss,cn);ensureClassResultSheet(ss,cn,names);return{success:true};}catch(e){return{success:false,message:e.message};}}
function updateClassSubject(token,cn,oldName,newName,order){if(!validateAdminToken(token))return{success:false,message:'Unauthorized'};try{var ss=SS(),sh=ss.getSheetByName(cn+'_Subjects');if(!sh)return{success:false,message:'Class not found.'};var data=sh.getDataRange().getValues();for(var i=1;i<data.length;i++){if(data[i][0]===oldName){sh.getRange(i+1,1,1,2).setValues([[newName,Number(order)]]);break;}}var names=getClassSubjectNames(ss,cn);ensureClassResultSheet(ss,cn,names);return{success:true};}catch(e){return{success:false,message:e.message};}}
function deleteClassSubject(token,cn,subjectName){if(!validateAdminToken(token))return{success:false,message:'Unauthorized'};try{var ss=SS(),sh=ss.getSheetByName(cn+'_Subjects');if(!sh)return{success:false,message:'Class not found.'};var data=sh.getDataRange().getValues();for(var i=1;i<data.length;i++){if(data[i][0]===subjectName){sh.deleteRow(i+1);break;}}var names=getClassSubjectNames(ss,cn);ensureClassResultSheet(ss,cn,names);return{success:true};}catch(e){return{success:false,message:e.message};}}

function generateDefaultSubjects(token, cn) {
  if(!validateAdminToken(token)) return {success:false, message:'Unauthorized'};
  try {
    var ss = SS();
    var sh = getOrCreateSubjectsSheet(ss, cn);
    
    // Level-specific subject mapping
    var defaults = ['English Language', 'Mathematics', 'Science', 'History', 'Religious and Moral Education', 'Creative Arts', 'Computing'];
    
    var normalized = cn.trim().toLowerCase();
    if (normalized.indexOf('kindergarten') === 0 || normalized.indexOf('kg') === 0) {
      defaults = ['Numeracy', 'Literacy', 'Our World & Our People', 'Creative Arts'];
    } else if (normalized.indexOf('basic 1') === 0 || normalized.indexOf('basic 2') === 0 || normalized.indexOf('basic 3') === 0) {
      defaults = ['English Language', 'Mathematics', 'Science', 'History', 'Religious and Moral Education', 'Creative Arts'];
    } else if (normalized.indexOf('basic 4') === 0 || normalized.indexOf('basic 5') === 0 || normalized.indexOf('basic 6') === 0) {
      defaults = ['English Language', 'Mathematics', 'Science', 'History', 'Religious and Moral Education', 'Creative Arts', 'Computing', 'French', 'Ghanaian Language'];
    } else if (normalized.indexOf('basic 7') === 0 || normalized.indexOf('basic 8') === 0 || normalized.indexOf('basic 9') === 0) {
      defaults = ['English Language', 'Mathematics', 'Integrated Science', 'Social Studies', 'Religious and Moral Education', 'Creative Arts', 'Career Technology', 'Computing', 'French', 'Ghanaian Language'];
    }
    
    var existingData = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues().map(function(r){return r[0];}) : [];
    
    defaults.forEach(function(defSub, idx) {
      if(existingData.indexOf(defSub) === -1) {
        sh.appendRow([defSub, Number((existingData.length + idx + 1) * 10)]);
      }
    });
    
    var names = getClassSubjectNames(ss, cn);
    ensureClassResultSheet(ss, cn, names);
    return {success: true};
  } catch(e) {
    return {success: false, message: e.message};
  }
}

// ── CLASSES CRUD ───────────────────────────────────────────
function getAllClasses(token){
  if(!validateAdminToken(token))return{success:false,message:'Unauthorized'};
  try{
    var ss=SS(),sh=ss.getSheetByName('Classes');
    if(!sh)return{success:true,classes:[]};
    recalculateClassSizes(ss);
    var data=sh.getDataRange().getValues(),h=data[0],classes=[];
    
    // Look up class teachers from Teachers sheet dynamically
    var classTeachers = {};
    var tchSh = ss.getSheetByName('Teachers');
    if (tchSh) {
      var tchData = tchSh.getDataRange().getValues();
      for (var t = 1; t < tchData.length; t++) {
        var username = tchData[t][0];
        var fullName = tchData[t][2];
        var assigned = tchData[t][3]; // AssignedClass
        if (assigned && fullName) {
          classTeachers[assigned.toString().trim().toLowerCase()] = fullName;
        }
      }
    }
    
    for(var i=1;i<data.length;i++){
      if(!data[i][0])continue;
      var c={};
      h.forEach(function(k,idx){
        c[k]=data[i][idx];
      });
      // Set the teacher name dynamically from assignment
      var clsName = (c.ClassName || '').toString().trim().toLowerCase();
      if (classTeachers[clsName]) {
        c.Teacher = classTeachers[clsName];
      } else {
        c.Teacher = c.Teacher || '';
      }
      classes.push(c);
    }
    return{success:true,classes:classes};
  }catch(e){return{success:false,message:e.message};}
}

function addClass(token,d){
  if(!validateAdminToken(token))return{success:false,message:'Unauthorized'};
  try{
    var ss=SS(),existing=ss.getSheetByName('Classes').getDataRange().getValues();
    for(var i=1;i<existing.length;i++){
      if(existing[i][0]===d.ClassName)return{success:false,message:'Class name already exists.'};
    }
    ss.getSheetByName('Classes').appendRow([d.ClassName,'',Number(d.NumPupils||0),d.LevelGroup||'General']);
    getOrCreateSubjectsSheet(ss,d.ClassName);
    getOrCreateSBAConfigSheet(ss,d.ClassName);

    // Generate subjects automatically on creation
    generateDefaultSubjects(token, d.ClassName);
    invalidateClassesCache();
    return{success:true};
  }catch(e){return{success:false,message:e.message};}
}

function updateClass(token,d){
  if(!validateAdminToken(token))return{success:false,message:'Unauthorized'};
  try{
    var ss=SS();
    var sheet=ss.getSheetByName('Classes'),data=sheet.getDataRange().getValues();
    var oldName = d.OldName || d.ClassName;
    for(var i=1;i<data.length;i++){
      if(data[i][0]===oldName){
        sheet.getRange(i+1,1,1,4).setValues([[d.ClassName,'',Number(d.NumPupils||0),d.LevelGroup||'General']]);
        
        // Also update any teachers assigned to this class
        var tchSh = ss.getSheetByName('Teachers');
        if (tchSh) {
          var tchData = tchSh.getDataRange().getValues();
          for (var t = 1; t < tchData.length; t++) {
            if (tchData[t][3] === oldName) {
              tchSh.getRange(t + 1, 4).setValue(d.ClassName);
            }
          }
        }
        invalidateClassesCache();
        return{success:true};
      }
    }
    return{success:false,message:'Class not found.'};
  }catch(e){return{success:false,message:e.message};}
}

function deleteClass(token,cn){if(!validateAdminToken(token))return{success:false,message:'Unauthorized'};try{var ss=SS(),sheet=ss.getSheetByName('Classes'),data=sheet.getDataRange().getValues();for(var i=1;i<data.length;i++){if(data[i][0]===cn){sheet.deleteRow(i+1);break;}}[cn,cn+'_Subjects',cn+'_SBA',cn+'_SBAConfig'].forEach(function(sn){var sh=ss.getSheetByName(sn);if(sh)ss.deleteSheet(sh);});invalidateClassesCache();return{success:true};}catch(e){return{success:false,message:e.message};}}

// ── RESULTS ────────────────────────────────────────────────
function getClassResults(token,cn,yr,tm){if(!validateAdminToken(token))return{success:false,message:'Unauthorized'};try{var ss=SS();var stuD=ss.getSheetByName('Students').getDataRange().getValues(),stuH=stuD[0],students=[];for(var i=1;i<stuD.length;i++){if(!stuD[i][0])continue;if(stuD[i][3]===cn&&stuD[i][4].toString()===yr.toString()&&stuD[i][5]===tm){var sv={};stuH.forEach(function(h,idx){sv[h]=stuD[i][idx];});students.push(sv);}}var subjectNames=getClassSubjectNames(ss,cn),subjects=subjectNames.map(function(n,idx){return{name:n,order:idx+1};});var resultsMap={};var classSheet=ss.getSheetByName(cn);if(classSheet&&classSheet.getLastRow()>1){var resD=classSheet.getDataRange().getValues(),resH=resD[0];var yi=resH.indexOf('Year'),ti=resH.indexOf('Term');for(var r=1;r<resD.length;r++){if(!resD[r][0])continue;if(yi>=0&&resD[r][yi].toString()!==yr.toString())continue;if(ti>=0&&resD[r][ti]!==tm)continue;var sid=resD[r][0].toString();resultsMap[sid]={};subjects.forEach(function(sub){var si=resH.indexOf(sub.name+'_SBA');if(si>=0)resultsMap[sid][sub.name]={sba:resD[r][si],exam:resD[r][si+1],total:resD[r][si+2],grade:resD[r][si+3],position:resD[r][si+4]};});}}return{success:true,students:students,subjects:subjects,resultsMap:resultsMap};}catch(e){return{success:false,message:e.message};}}

function saveSubjectScores(token, batchData){
  if(!validateAdminToken(token))return{success:false,message:'Unauthorized'};
  if(!batchData||!batchData.length)return{success:true};
  try{
    var ss=SS();var grdD=ss.getSheetByName('Grading').getDataRange().getValues();var stuD=ss.getSheetByName('Students').getDataRange().getValues();
    var b0=batchData[0],cn=b0.Class,yr=b0.Year,tm=b0.Term,lvl=b0.LevelGroup||'General';
    logServerAction(token, 'Save Scores', 'Class: ' + cn + ', Subject: ' + b0.SubjectName + ' (' + batchData.length + ' records)');
    var subjectNames=getClassSubjectNames(ss,cn);
    var classSheet=ensureClassResultSheet(ss,cn,subjectNames);
    var resH=classSheet.getRange(1,1,1,classSheet.getLastColumn()).getValues()[0];
    var stuNames={};for(var si=1;si<stuD.length;si++){if(stuD[si][0])stuNames[stuD[si][0].toString()]=stuD[si][1];}
    var grouped={};
    batchData.forEach(function(item){
      var sid=item.StudentID.toString();
      if(!grouped[sid])grouped[sid]={};
      var sba=item.SBA; var exam=item.Exam;
      var total = null;
      if (sba !== '' || exam !== '') {
          total = Math.round(Number(sba||0) + Number(exam||0));
      }
      grouped[sid][item.SubjectName]={sba:sba,exam:exam,total:total,lvl:item.LevelGroup||lvl};
    });
    var existingRows={};
    if(classSheet.getLastRow()>1){
      var ex=classSheet.getDataRange().getValues();
      var eyi=resH.indexOf('Year'),eti=resH.indexOf('Term');
      for(var er=1;er<ex.length;er++){
        if(!ex[er][0])continue;
        if(eyi>=0&&ex[er][eyi].toString()!==yr.toString())continue;
        if(eti>=0&&ex[er][eti]!==tm)continue;
        existingRows[ex[er][0].toString()]=er+1;
      }
    }
    Object.keys(grouped).forEach(function(sid){
      var scores=grouped[sid];
      var row;
      if (existingRows[sid]) {
         row=classSheet.getRange(existingRows[sid],1,1,resH.length).getValues()[0];
      } else {
         row=new Array(resH.length).fill('');
         row[0]=sid;row[1]=stuNames[sid]||'';row[2]=cn;
      }
      var totalScore=0,subjCount=0;
      subjectNames.forEach(function(sn){
        var si2=resH.indexOf(sn+'_SBA');
        if(si2<0)return;
        var sc=scores[sn];
        if(sc!==undefined){
          if (sc.sba !== '') row[si2] = Math.round(Number(sc.sba));
          if (sc.exam !== '') row[si2+1] = Math.round(Number(sc.exam));
          var finalSba=Number(row[si2]||0);
          var finalExam=Number(row[si2+1]||0);
          var finalTot=finalSba+finalExam;
          row[si2+2]=finalTot;
          row[si2+3]=getGradeInfo(finalTot,grdD,sc.lvl||lvl).grade;
          row[si2+4]=1; 
        }
        if (row[si2+2] !== '') {
           totalScore += Number(row[si2+2]||0);
           subjCount++;
        }
      });
      var avg=subjCount>0?totalScore/subjCount:0;
      var yi2=resH.indexOf('Year'),ti2=resH.indexOf('Term'),tsi=resH.indexOf('TotalScore'),ai=resH.indexOf('Average'),oi=resH.indexOf('OverallPosition');
      if(yi2>=0)row[yi2]=yr;if(ti2>=0)row[ti2]=tm;if(tsi>=0)row[tsi]=totalScore;if(ai>=0)row[ai]=parseFloat(avg.toFixed(4));if(oi>=0)row[oi]=1;
      if(existingRows[sid])classSheet.getRange(existingRows[sid],1,1,resH.length).setValues([row]);
      else classSheet.appendRow(row);
    });
    calcPositionsAndTotals(ss,classSheet,cn,yr,tm,subjectNames,grdD,stuD);
    return{success:true};
  }catch(e){return{success:false,message:e.message};}
}

function calcPositionsAndTotals(ss,classSheet,cn,yr,tm,subNames,grdD,stuD){
  try{var resD=classSheet.getDataRange().getValues(),resH=resD[0];var yi=resH.indexOf('Year'),ti=resH.indexOf('Term'),tsi=resH.indexOf('TotalScore'),ai=resH.indexOf('Average'),oi=resH.indexOf('OverallPosition');var matchRows=[];for(var r=1;r<resD.length;r++){if(!resD[r][0])continue;if(yi>=0&&resD[r][yi].toString()!==yr.toString())continue;if(ti>=0&&resD[r][ti]!==tm)continue;matchRows.push({row:r+1,data:resD[r]});}subNames.forEach(function(sn){var si2=resH.indexOf(sn+'_Total'),pi=resH.indexOf(sn+'_Position');if(si2<0||pi<0)return;var scores=matchRows.map(function(mr){return{row:mr.row,score:Number(mr.data[si2]||0)};});scores.sort(function(a,b){return b.score-a.score;});var prev=null,pp=0;scores.forEach(function(item,idx){var p=(item.score===prev)?pp:idx+1;prev=item.score;pp=p;classSheet.getRange(item.row,pi+1).setValue(p);});});matchRows.forEach(function(mr){var tot=0,cnt=0;subNames.forEach(function(sn){var si2=resH.indexOf(sn+'_Total');if(si2>=0&&mr.data[si2]!==''){tot+=Number(mr.data[si2]||0);cnt++;}});var avg=cnt>0?tot/cnt:0;if(tsi>=0)classSheet.getRange(mr.row,tsi+1).setValue(tot);if(ai>=0)classSheet.getRange(mr.row,ai+1).setValue(parseFloat(avg.toFixed(4)));});var resD2=classSheet.getDataRange().getValues();var stuAvgs=[];for(var r2=1;r2<resD2.length;r2++){if(!resD2[r2][0])continue;if(yi>=0&&resD2[r2][yi].toString()!==yr.toString())continue;if(ti>=0&&resD2[r2][ti]!==tm)continue;stuAvgs.push({row:r2+1,sid:resD2[r2][0].toString(),avg:Number(ai>=0?resD2[r2][ai]:0),total:Number(tsi>=0?resD2[r2][tsi]:0)});}stuAvgs.sort(function(a,b){return b.avg-a.avg;});var prevA=null,prevP=0;stuAvgs.forEach(function(item,idx){var p=(item.avg===prevA)?prevP:idx+1;prevA=item.avg;prevP=p;if(oi>=0)classSheet.getRange(item.row,oi+1).setValue(p);});var stuSheet=ss.getSheetByName('Students');stuAvgs.forEach(function(item){for(var s=1;s<stuD.length;s++){if(stuD[s][0]&&stuD[s][0].toString()===item.sid&&stuD[s][3]===cn&&stuD[s][4].toString()===yr.toString()&&stuD[s][5]===tm){stuSheet.getRange(s+1,9).setValue(item.total);stuSheet.getRange(s+1,10).setValue(parseFloat(item.avg.toFixed(4)));break;}}});}catch(e){Logger.log('calcPositions: '+e.message);}
}

// ── CLASS SUMMARY ──────────────────────────────────────────
function getClassSummary(token,cn,yr,tm){
  if(!validateAdminToken(token))return{success:false,message:'Unauthorized'};
  try{
    var ss=SS();
    var stuD=ss.getSheetByName('Students').getDataRange().getValues(),stuH=stuD[0],students=[];
    for(var i=1;i<stuD.length;i++){if(!stuD[i][0])continue;if(stuD[i][3]===cn&&stuD[i][4].toString()===yr.toString()&&stuD[i][5]===tm){var sv={};stuH.forEach(function(h,idx){sv[h]=stuD[i][idx];});students.push(sv);}}
    var subjectNames=getClassSubjectNames(ss,cn);
    var classSheet=ss.getSheetByName(cn);
    var resMap={};
    if(classSheet&&classSheet.getLastRow()>1){var resD=classSheet.getDataRange().getValues(),resH=resD[0];var yi=resH.indexOf('Year'),ti=resH.indexOf('Term');for(var r=1;r<resD.length;r++){if(!resD[r][0])continue;if(yi>=0&&resD[r][yi].toString()!==yr.toString())continue;if(ti>=0&&resD[r][ti]!==tm)continue;var sid=resD[r][0].toString();resMap[sid]={};subjectNames.forEach(function(sn){var si=resH.indexOf(sn+'_SBA');if(si>=0)resMap[sid][sn]={sba:resD[r][si],exam:resD[r][si+1],total:resD[r][si+2],grade:resD[r][si+3],position:resD[r][si+4]};});}}
    students.sort(function(a,b){return Number(b.Average||0)-Number(a.Average||0);});students.forEach(function(s,idx){s.OverallPosition=idx+1;});
    return{success:true,students:students,subjects:subjectNames,resMap:resMap,sbaMap:{},components:[]};
  }catch(e){return{success:false,message:e.message};}
}

// ── CUMULATIVE RECORD ──────────────────────────────────────
function getStudentCumulativeRecord(token,studentId,year){
  if(!validateAdminToken(token))return{success:false,message:'Unauthorized'};
  try{
    var ss=SS();var stuD=ss.getSheetByName('Students').getDataRange().getValues();var clsD=ss.getSheetByName('Classes').getDataRange().getValues();var grdD=ss.getSheetByName('Grading').getDataRange().getValues();
    var settSh=ss.getSheetByName('Settings'),settD=settSh?settSh.getDataRange().getValues():[];
    var stu=null;
    for(var i=1;i<stuD.length;i++){if(stuD[i][0]&&String(stuD[i][0]).trim()===studentId.toString().trim()){stu={ID:String(stuD[i][0]||''),Name:String(stuD[i][1]||''),Gender:String(stuD[i][2]||''),Class:String(stuD[i][3]||''),LevelGroup:String(stuD[i][17]||'General')};break;}}
    if(!stu)return{success:false,message:'Student not found.'};
    var sett={};
    if(settD&&settD.length>1){for(var s=1;s<settD.length;s++){var v=settD[s][1];if(v instanceof Date)v=Utilities.formatDate(v,Session.getScriptTimeZone(),'yyyy-MM-dd');sett[settD[s][0]]=v;}}
    var subjectNames=getClassSubjectNames(ss,stu.Class);
    var terms=['Term 1','Term 2','Term 3'];var termRecords={};
    var classSheet=ss.getSheetByName(stu.Class);
    if(classSheet&&classSheet.getLastRow()>1){
      var resD=classSheet.getDataRange().getValues(),resH=resD[0];
      var yi=resH.indexOf('Year'),ti=resH.indexOf('Term'),tsi=resH.indexOf('TotalScore'),ai=resH.indexOf('Average'),oi=resH.indexOf('OverallPosition');
      for(var r=1;r<resD.length;r++){
        if(!resD[r][0])continue;if(resD[r][0].toString().trim()!==stu.ID.toString().trim())continue;
        if(yi>=0&&resD[r][yi].toString()!==year.toString())continue;
        var termName=ti>=0?resD[r][ti]:'';
        if(!termName)continue;
        var lvl=stu.LevelGroup||'General';
        var termResults=[];
        subjectNames.forEach(function(sn){var si=resH.indexOf(sn+'_SBA');if(si<0)return;var sba=resD[r][si],exam=resD[r][si+1],total=resD[r][si+2],grade=resD[r][si+3],pos=resD[r][si+4];if(sba!==''||exam!==''||total!==''){var g=getGradeInfo(Number(total||0),grdD,lvl);termResults.push({SubjectName:sn,SBAScore:Number(sba||0),ExamScore:Number(exam||0),TotalScore:Number(total||0),Grade:grade||g.grade,Position:pos});}});
        termRecords[termName]={results:termResults,totalScore:tsi>=0?resD[r][tsi]:0,average:ai>=0?resD[r][ai]:0,overallPosition:oi>=0?resD[r][oi]:0};
      }
    }
    // Also get attendance per term from Students sheet
    var attendanceByTerm={};
    for(var m=1;m<stuD.length;m++){if(stuD[m][0]&&stuD[m][0].toString().trim()===stu.ID.toString().trim()&&stuD[m][4].toString()===year.toString()){attendanceByTerm[stuD[m][5]]={attendance:stuD[m][6],outOf:stuD[m][7]};}}
    return{success:true,student:stu,year:year,subjects:subjectNames,termRecords:termRecords,attendanceByTerm:attendanceByTerm,settings:sett};
  }catch(e){return{success:false,message:e.message};}
}

// ── REMARKS ────────────────────────────────────────────────
function batchUpdateRemarks(token,arr){
  if(!validateAdminToken(token))return{success:false,message:'Unauthorized'};
  try{
    var ss=SS();
    var sheet=ss.getSheetByName('Students'),data=sheet.getDataRange().getValues(),idMap={};
    var h=data[0],pIdx=h.indexOf('PromotionStatus');
    // BUGFIX: a student has one Students-sheet row per academic year/term, but this map used
    // to be keyed by StudentID alone, so the *last* matching row in the sheet always won —
    // saves for one term could silently land on a completely different term's row. Key by
    // StudentID+Year+Term (columns 4/5, 0-based) so a save always hits the exact row intended.
    for(var i=1;i<data.length;i++){
      if(!data[i][0])continue;
      var rkey=data[i][0].toString()+'|'+String(data[i][4])+'|'+String(data[i][5]);
      idMap[rkey]=i+1;
    }

    // Setup Remarks Archive
    // BUGFIX: previously every save was archived under getActiveYearTerm(ss) — the school-wide
    // "current term" setting — regardless of which class/year/term the admin/teacher actually
    // had open in the Remarks tab. If that global setting hadn't been flipped yet (a very common
    // sequence: enter next term's remarks, then later mark it "active"), saves for the real term
    // got filed under the wrong period, and a later save for the *actual* active term would
    // overwrite that archive row — which is exactly the "saved, then later changed/cleared"
    // symptom. We now use the year/term the client sends with each item (the period the Remarks
    // tab was actually loaded for), falling back to the active term only for old callers that
    // don't send one.
    var defaultPeriod = getActiveYearTerm(ss);
    var remarksArchive = ss.getSheetByName('RemarksArchive');
    if (!remarksArchive) {
      remarksArchive = ss.insertSheet('RemarksArchive');
      styleHeader(remarksArchive, ['StudentID', 'StudentName', 'Class', 'Year', 'Term', 'Attendance', 'OutOf', 'Interest', 'Conduct', 'Attitude', 'ClassTeacherRemark', 'HeadTeacherRemark', 'PromotionStatus']);
    }
    var archiveData = remarksArchive.getDataRange().getValues();
    var archiveMap = {};
    for (var r = 1; r < archiveData.length; r++) {
      var aKey = archiveData[r][0] + '_' + archiveData[r][3] + '_' + archiveData[r][4];
      archiveMap[aKey] = r + 1;
    }

    var reportCacheKeys = [];
    arr.forEach(function(item){
      var itemYear = (item.Year !== undefined && item.Year !== '' && item.Year !== null) ? item.Year : defaultPeriod.year;
      var itemTerm = (item.Term !== undefined && item.Term !== '' && item.Term !== null) ? item.Term : defaultPeriod.term;
      var rkey = item.StudentID.toString()+'|'+String(itemYear)+'|'+String(itemTerm);
      var row=idMap[rkey];
      if(row){
        var attVal = Number(item.Attendance||data[row-1][6]||0);
        var outVal = Number(item.OutOf||data[row-1][7]||75);
        var interestVal = item.Interest||'';
        var conductVal = item.Conduct||'';
        var attitudeVal = item.Attitude||'';
        var ctRem = typeof item.ClassTeacherRemark !== 'undefined' ? item.ClassTeacherRemark : (data[row-1][13] || '');
        var htRem = typeof item.HeadTeacherRemark !== 'undefined' ? item.HeadTeacherRemark : (data[row-1][14] || '');
        var promo = typeof item.PromotionStatus !== 'undefined' ? item.PromotionStatus : (data[row-1][pIdx] || '');

        sheet.getRange(row,7,1,2).setValues([[attVal,outVal]]);
        sheet.getRange(row,11,1,3).setValues([[interestVal,conductVal,attitudeVal]]);
        if(typeof item.ClassTeacherRemark !== 'undefined' && typeof item.HeadTeacherRemark !== 'undefined'){
          sheet.getRange(row,14,1,2).setValues([[ctRem,htRem]]);
        }
        if(pIdx>=0&&typeof item.PromotionStatus!=='undefined'){
          sheet.getRange(row,pIdx+1).setValue(promo);
        }

        // Write snapshot to RemarksArchive, scoped to the period actually being edited
        var studentName = data[row-1][1];
        var className = data[row-1][3];
        var key = item.StudentID.toString() + '_' + itemYear + '_' + itemTerm;
        var archiveRow = archiveMap[key];
        var rowValues = [item.StudentID.toString(), studentName, className, itemYear, itemTerm, attVal, outVal, interestVal, conductVal, attitudeVal, ctRem, htRem, promo];
        if (archiveRow) {
          remarksArchive.getRange(archiveRow, 1, 1, 13).setValues([rowValues]);
        } else {
          remarksArchive.appendRow(rowValues);
          archiveMap[key] = remarksArchive.getLastRow();
        }
        // Invalidate any cached report response for this student/period so a report viewed
        // right after saving reflects the new remarks instead of a stale cached copy.
        reportCacheKeys.push('rpt_' + item.StudentID.toString() + '|' + itemYear + '|' + itemTerm);
      }
    });
    if (reportCacheKeys.length) cacheClear(reportCacheKeys);
    return{success:true};
  }catch(e){return{success:false,message:e.message};}
}


function batchUpdateFeesBills(token,arr){
  if(!validateAdminToken(token))return{success:false,message:'Unauthorized'};
  try{
    var ss=SS();
    var sheet=ss.getSheetByName('Students'),data=sheet.getDataRange().getValues(),idMap={};
    // BUGFIX: same StudentID+Year+Term keying as batchUpdateRemarks — see comment there. Keying
    // by StudentID alone let a fee save land on whichever term's row happened to be last in the
    // sheet instead of the term actually being billed.
    for(var i=1;i<data.length;i++){
      if(!data[i][0])continue;
      var rkey=data[i][0].toString()+'|'+String(data[i][4])+'|'+String(data[i][5]);
      idMap[rkey]=i+1;
    }

    // Setup Fees Archive
    // BUGFIX: archive under the year/term the client actually sends for each item (the period
    // the Fees & Bills tab was loaded for), not the school-wide "active" term — see comment in
    // batchUpdateRemarks for why that mismatch causes saved data to appear to vanish/overwrite.
    var defaultPeriod = getActiveYearTerm(ss);
    var feesArchive = ss.getSheetByName('FeesArchive');
    if (!feesArchive) {
      feesArchive = ss.insertSheet('FeesArchive');
      styleHeader(feesArchive, ['StudentID', 'StudentName', 'Class', 'Year', 'Term', 'Arrears', 'NextTermFees', 'FeeData']);
    }
    var archiveData = feesArchive.getDataRange().getValues();
    var archiveMap = {};
    for (var r = 1; r < archiveData.length; r++) {
      var aKey = archiveData[r][0] + '_' + archiveData[r][3] + '_' + archiveData[r][4];
      archiveMap[aKey] = r + 1;
    }

    var reportCacheKeys = [];
    arr.forEach(function(item){
      var itemYear = (item.Year !== undefined && item.Year !== '' && item.Year !== null) ? item.Year : defaultPeriod.year;
      var itemTerm = (item.Term !== undefined && item.Term !== '' && item.Term !== null) ? item.Term : defaultPeriod.term;
      var rkey = item.StudentID.toString()+'|'+String(itemYear)+'|'+String(itemTerm);
      var row=idMap[rkey];
      if(row){
        var arrVal=item.Arrears!==''&&item.Arrears!==undefined?Number(item.Arrears):'';
        var nxtVal=item.NextTermFees!==''&&item.NextTermFees!==undefined?Number(item.NextTermFees):'';
        var feeDataString='';
        if(item.FeeData) feeDataString=(typeof item.FeeData==='string')?item.FeeData:JSON.stringify(item.FeeData);
        sheet.getRange(row,19,1,3).setValues([[arrVal,nxtVal,feeDataString]]);

        // Write snapshot to FeesArchive, scoped to the period actually being edited
        var studentName = data[row-1][1];
        var className = data[row-1][3];
        var key = item.StudentID.toString() + '_' + itemYear + '_' + itemTerm;
        var archiveRow = archiveMap[key];
        var rowValues = [item.StudentID.toString(), studentName, className, itemYear, itemTerm, arrVal, nxtVal, feeDataString];
        if (archiveRow) {
          feesArchive.getRange(archiveRow, 1, 1, 8).setValues([rowValues]);
        } else {
          feesArchive.appendRow(rowValues);
          archiveMap[key] = feesArchive.getLastRow();
        }
        reportCacheKeys.push('rpt_' + item.StudentID.toString() + '|' + itemYear + '|' + itemTerm);
      }
    });
    if (reportCacheKeys.length) cacheClear(reportCacheKeys);
    return{success:true};
  }catch(e){return{success:false,message:e.message};}
}

// ── MASTER SHEET ───────────────────────────────────────────
function getMasterSheet(token,cn,yr,tm){if(!validateAdminToken(token))return{success:false,message:'Unauthorized'};try{var ss=SS();ensureReportStatusHeader(ss);var stuD=ss.getSheetByName('Students').getDataRange().getValues(),grdD=ss.getSheetByName('Grading').getDataRange().getValues();var stuH=stuD[0],students=[];for(var i=1;i<stuD.length;i++){if(!stuD[i][0])continue;if(stuD[i][3]===cn&&stuD[i][4].toString()===yr.toString()&&stuD[i][5]===tm){var sv={};stuH.forEach(function(h,idx){sv[h]=stuD[i][idx];});students.push(sv);}}var subjectNames=getClassSubjectNames(ss,cn),subjects=subjectNames.map(function(n,idx){return{id:n,name:n,order:idx+1};});var resMap={};var classSheet=ss.getSheetByName(cn);if(classSheet&&classSheet.getLastRow()>1){var resD=classSheet.getDataRange().getValues(),resH=resD[0];var yi=resH.indexOf('Year'),ti=resH.indexOf('Term');for(var r=1;r<resD.length;r++){if(!resD[r][0])continue;if(yi>=0&&resD[r][yi].toString()!==yr.toString())continue;if(ti>=0&&resD[r][ti]!==tm)continue;var sid=resD[r][0].toString();resMap[sid]={};subjects.forEach(function(sub){var si=resH.indexOf(sub.name+'_SBA');if(si>=0)resMap[sid][sub.name]={total:resD[r][si+2],grade:resD[r][si+3],sba:resD[r][si],exam:resD[r][si+1]};});}}students.forEach(function(s){var sRes=[];subjects.forEach(function(sub){var rv=(resMap[s.ID.toString()]||{})[sub.name];if(rv)sRes.push({SubjectName:sub.name,Grade:rv.grade,TotalScore:rv.total});});if((s.LevelGroup||'').toLowerCase()==='jhs')s._aggregate=computeJHSAggregate(sRes,grdD);});students.sort(function(a,b){return Number(b.Average||0)-Number(a.Average||0);});students.forEach(function(s,idx){s.OverallPosition=idx+1;});return{success:true,students:students,subjects:subjects,resMap:resMap};}catch(e){return{success:false,message:e.message};}}

// ── GRADING ────────────────────────────────────────────────
function getGrading(token){if(!validateAdminToken(token))return{success:false,message:'Unauthorized'};try{var data=SS().getSheetByName('Grading').getDataRange().getValues(),h=data[0],grading=[];for(var i=1;i<data.length;i++){var g={};h.forEach(function(k,idx){g[k]=data[i][idx];});g._row=i+1;grading.push(g);}return{success:true,grading:grading};}catch(e){return{success:false,message:e.message};}}
function updateGrading(token,arr){if(!validateAdminToken(token))return{success:false,message:'Unauthorized'};try{var sheet=SS().getSheetByName('Grading'),last=sheet.getLastRow();if(last>1)sheet.deleteRows(2,last-1);arr.forEach(function(g){sheet.appendRow([g.MinScore,g.MaxScore,g.Grade,g.GradeName,g.Remarks,g.LevelGroup||'General']);});invalidateGradingCache();return{success:true};}catch(e){return{success:false,message:e.message};}}

// ── SETTINGS ───────────────────────────────────────────────

// ── PUBLIC SETTINGS (no auth needed) ──
function getPublicSettings(){
  try{
    var ss=SS();
    var sett=getCachedSettingsMap(ss);
    var props=PropertiesService.getScriptProperties();
    var logo=sett['SCHOOL_LOGO']||props.getProperty(LOGO_KEY)||'';
    // Includes CURRENT_TERM/CURRENT_YEAR so the portal's period selector can default to the
    // school's actual active term instead of a hardcoded fallback.
    return{
      success:true,
      SCHOOL_NAME:sett['SCHOOL_NAME']||'School Portal',
      SCHOOL_LOGO:logo,
      SCHOOL_ADDRESS:sett['SCHOOL_ADDRESS']||'',
      SCHOOL_PHONE:sett['SCHOOL_PHONE']||'',
      SCHOOL_EMAIL:sett['SCHOOL_EMAIL']||'',
      CURRENT_TERM:sett['CURRENT_TERM']||'',
      CURRENT_YEAR:sett['CURRENT_YEAR']||''
    };
  }catch(e){return{success:false};}
}

// ── REPORT CARD URL ──
function getReportCardUrl(token, studentId, year, term){
  if(!validateAdminToken(token))return{success:false,message:'Unauthorized'};
  try{
    // BUGFIX: a link generated with a blank year/term used to resolve to whichever term is
    // "current" at the moment the link is *opened* rather than the term it was actually shared
    // for. That's harmless until the student's row gets rolled over/promoted to a new term
    // (Class/Year/Term mutated in place by executeAutomaticPromotions) — at that point the same
    // old link silently starts showing the new, still-empty term instead of the report it was
    // meant to show, which looks like "scores/remarks vanished". Always pin the link to a
    // specific year/term — resolving the student's own current one when the caller didn't
    // supply one — so the link keeps pointing at the same report no matter what happens later.
    var pinYear = year, pinTerm = term;
    if (!pinYear || !pinTerm) {
      var rep = getStudentReport(studentId, year, term, true);
      if (rep && rep.success && rep.student) {
        pinYear = pinYear || rep.student.Year;
        pinTerm = pinTerm || rep.student.Term;
      }
    }
    var url=ScriptApp.getService().getUrl()+'?page=report&id='+encodeURIComponent(studentId);
    if (pinYear) url += '&year=' + encodeURIComponent(pinYear);
    if (pinTerm) url += '&term=' + encodeURIComponent(pinTerm);
    return{success:true,url:url};
  }catch(e){return{success:false,message:e.message};}
}

// ── PROMOTION HELPERS (shared by executeAutomaticPromotions and the report-SMS builders) ──
// Predicts the next class for a student the same way executeAutomaticPromotions does, so a
// report-card SMS sent in Term 3 can tell a parent which class their child is moving up to
// *before* the actual end-of-year rollover has been run.
function getNextClassName(className) {
  if (!className) return 'Graduated / Alumni';
  var c = className.toString().trim();

  var mapping = {
    'Creche': 'Nursery 1',
    'Nursery 1': 'Nursery 2',
    'Nursery 2': 'KG 1',
    'KG 1': 'KG 2',
    'KG 2': 'Basic 1',
    'Basic 1': 'Basic 2',
    'Basic 2': 'Basic 3',
    'Basic 3': 'Basic 4',
    'Basic 4': 'Basic 5',
    'Basic 5': 'Basic 6',
    'Basic 6': 'JHS 1',
    'JHS 1': 'JHS 2',
    'JHS 2': 'JHS 3',
    'JHS 3': 'Graduated / Alumni'
  };

  if (mapping[c]) return mapping[c];

  var lower = c.toLowerCase();
  if (lower === 'creche') return 'Nursery 1';
  if (lower === 'nursery 1') return 'Nursery 2';
  if (lower === 'nursery 2') return 'KG 1';
  if (lower === 'kg 1') return 'KG 2';
  if (lower === 'kg 2') return 'Basic 1';

  var basicMatch = c.match(/Basic\s*(\d+)/i);
  if (basicMatch) {
    var num = parseInt(basicMatch[1]);
    if (num === 6) return 'JHS 1';
    return 'Basic ' + (num + 1);
  }

  var jhsMatch = c.match(/JHS\s*(\d+)/i);
  if (jhsMatch) {
    var num2 = parseInt(jhsMatch[1]);
    if (num2 === 3) return 'Graduated / Alumni';
    return 'JHS ' + (num2 + 1);
  }

  return c; // Keep in same class if no pattern matches
}

// Builds a short "promoted from X to Y" (or repeated/graduated) line to append to a report-card
// SMS/message when the report being shared is a Term 3 (final term) report that already has a
// Promotion Status set on it — so parents are told about the class change up front instead of
// having to open the link and find it themselves.
function buildPromotionNote(rep) {
  try {
    if (!rep || !rep.success || !rep.student) return '';
    var stu = rep.student;
    var termStr = (stu.Term || '').toString().toLowerCase();
    var isTermThree = termStr.indexOf('3') !== -1 || termStr.indexOf('third') !== -1;
    if (!isTermThree) return '';
    var status = (stu.PromotionStatus || '').toString().trim();
    if (!status) return '';
    if (status === 'Promoted') {
      var nextClass = getNextClassName(stu.Class);
      if (nextClass && nextClass !== stu.Class) {
        return 'Congratulations! ' + stu.Name + ' has been promoted from ' + stu.Class + ' to ' + nextClass + ' for the next academic year.';
      }
      return 'Congratulations! ' + stu.Name + ' has been promoted to the next class.';
    }
    if (status === 'Repeated') {
      return 'Please note: ' + stu.Name + ' will be repeating ' + stu.Class + ' next academic year.';
    }
    if (status === 'Graduated') {
      return 'Congratulations! ' + stu.Name + ' has graduated from ' + stu.Class + '.';
    }
    if (status === 'Withdrawn') {
      return '';
    }
    return '';
  } catch(e) { return ''; }
}

// ── SEND REPORT SMS ──
// ── SEND REPORT SMS ──
function sendReportSMS(token,studentId,year,term){
  if(!validateAdminToken(token))return{success:false,message:'Unauthorized'};
  try{
    var ss=SS(),props=PropertiesService.getScriptProperties();
    var apiKey=props.getProperty(SMS_KEY_PROP);
    var sender=props.getProperty(SMS_SEND_PROP)||'SchoolSMS';
    var provider=(props.getProperty('SMS_PROVIDER')||'arkesel').toLowerCase();
    if(!apiKey)return{success:false,message:'SMS API key not configured. Go to Settings → SMS.'};
    
    var data=SS().getSheetByName('Students').getDataRange().getValues(),phone='',name='';
    for(var i=1;i<data.length;i++){
      if(data[i][0]&&data[i][0].toString()===studentId.toString()){
        phone=data[i][15].toString();name=data[i][1].toString();break;
      }
    }
    if(!phone)return{success:false,message:'No phone number for student '+studentId};
    
    // Fetch report data
    var rep = getStudentReport(studentId, year, term, true);
    var msg = '';
    // BUGFIX: pin the link to the report's actual resolved year/term (rep.student.Year/Term)
    // instead of the raw, possibly-blank year/term arguments. Several callers (e.g. the SMS
    // panel's "Enter Student ID" quick-send) never pass year/term at all — without pinning, the
    // link would resolve to whatever term is "current" whenever the parent eventually opens it,
    // which after a Term-3 rollover/promotion is a brand-new, still-empty term. That's what made
    // the shared report look like it had no scores/remarks even though it was correct when sent.
    var pinYear = (rep.success && rep.student && rep.student.Year) ? rep.student.Year : year;
    var pinTerm = (rep.success && rep.student && rep.student.Term) ? rep.student.Term : term;
    var url = ScriptApp.getService().getUrl()+'?page=report&id='+encodeURIComponent(studentId);
    if (pinYear) url += '&year=' + encodeURIComponent(pinYear);
    if (pinTerm) url += '&term=' + encodeURIComponent(pinTerm);

    if (rep.success) {
      var stu = rep.student;
      var pos = rep.overallPosition || '—';
      var total = rep.classmatesCount || '—';
      var avg = stu.Average ? Math.round(Number(stu.Average)) : '—';

      msg = 'Dear Parent, ' + stu.Name + '\'s report card for ' + stu.Term + ' (' + stu.Year + ') is ready.\n' +
            'Class: ' + stu.Class + '\n' +
            'Avg: ' + avg + '% | Pos: ' + pos + '/' + total + '\n';

      var arrears = Number(stu.Arrears || 0);
      var nextTerm = Number(stu.NextTermFees || 0);
      if (nextTerm > 0) {
        msg += 'Bill: GH¢ ' + nextTerm.toFixed(2) + '\n';
      }
      if (arrears > 0) {
        msg += 'Arrears: GH¢ ' + arrears.toFixed(2) + '\n';
      }

      if (rep.results && rep.results.length > 0) {
        var grades = rep.results.map(function(r) {
          var sName = r.SubjectName;
          if (sName.length > 12) sName = sName.substring(0, 10) + '..';
          return sName + ': ' + (r.TotalScore !== undefined ? r.TotalScore : '—');
        }).join(', ');
        msg += 'Scores: ' + grades + '\n';
      }
      // If this is a Term 3 report with a promotion decision already recorded, tell the parent
      // which class the student is moving to (or that they're repeating/graduating) right in
      // the SMS, instead of only being visible if they open the report link.
      var promoNote = buildPromotionNote(rep);
      if (promoNote) msg += promoNote + '\n';
      msg += 'Link: ' + url;
    } else {
      msg = 'Dear Parent, ' + name + '\'s report card is ready. View here: ' + url;
    }

    var status = sendViaSMSProvider(provider,apiKey,sender,phone,msg);
    logSMS(studentId, phone, msg, status, provider);
    return{success:true,message:'SMS sent status: '+status,url:url};
  }catch(e){return{success:false,message:'SMS error: '+e.message};}
}

// ── GET STUDENTS RANK MAP ──
function getStudentsRankMap(ss, className, year, term) {
  var data = ss.getSheetByName('Students').getDataRange().getValues();
  var classmates = [];
  for (var i = 1; i < data.length; i++) {
    if (data[i][3] === className && data[i][4].toString() === year.toString() && data[i][5] === term) {
      classmates.push({ id: data[i][0].toString(), avg: Number(data[i][9] || 0) });
    }
  }
  classmates.sort(function(a, b) { return b.avg - a.avg; });
  var rankMap = {};
  for (var p = 0; p < classmates.length; p++) {
    rankMap[classmates[p].id] = { position: p + 1, total: classmates.length };
  }
  return rankMap;
}

// ── SEND BULK SMS ──
function sendBulkSMS(token, targetType, targetValue, templateText) {
  if (!validateAdminToken(token)) return {success: false, message: 'Unauthorized'};
  try {
    var ss = SS(), props = PropertiesService.getScriptProperties();
    var apiKey = props.getProperty(SMS_KEY_PROP);
    var sender = props.getProperty(SMS_SEND_PROP) || 'SchoolSMS';
    var provider = (props.getProperty('SMS_PROVIDER') || 'arkesel').toLowerCase();
    if (!apiKey) return {success: false, message: 'SMS API key not configured.'};
    
    var studentsData = ss.getSheetByName('Students').getDataRange().getValues();
    var headers = studentsData[0];
    
    var students = [];
    for (var i = 1; i < studentsData.length; i++) {
      if (!studentsData[i][0]) continue;
      var s = {};
      headers.forEach(function(h, idx) {
        s[h] = studentsData[i][idx];
      });
      students.push(s);
    }
    
    var targets = [];
    if (targetType === 'individual') {
      targets = students.filter(function(s) { return s.ID.toString().trim() === targetValue.toString().trim(); });
      if (targets.length === 0) return {success: false, message: 'Student ID not found: ' + targetValue};
    } else if (targetType === 'class') {
      targets = students.filter(function(s) { return s.Class === targetValue; });
      if (targets.length === 0) return {success: false, message: 'No students found in class: ' + targetValue};
    } else if (targetType === 'all') {
      targets = students;
      if (targets.length === 0) return {success: false, message: 'No students found in database.'};
    } else if (targetType === 'custom') {
      var phones = targetValue.split(',').map(function(p) { return p.trim(); }).filter(function(p) { return p.length > 0; });
      if (phones.length === 0) return {success: false, message: 'No valid phone numbers provided.'};
      
      var status = sendViaSMSProvider(provider, apiKey, sender, phones.join(','), templateText);
      logSMS('CUSTOM', phones.join(','), templateText, status, provider);
      return {success: true, message: 'SMS sent to ' + phones.length + ' number(s). Status: ' + status};
    } else {
      return {success: false, message: 'Invalid target type.'};
    }
    
    var sentCount = 0;
    var failedCount = 0;
    var rankMaps = {};
    
    for (var j = 0; j < targets.length; j++) {
      var stu = targets[j];
      var phone = stu.ParentPhone ? stu.ParentPhone.toString().trim() : '';
      if (!phone) {
        failedCount++;
        continue;
      }
      
      var classKey = stu.Class + '_' + stu.Year + '_' + stu.Term;
      if (!rankMaps[classKey]) {
        rankMaps[classKey] = getStudentsRankMap(ss, stu.Class, stu.Year, stu.Term);
      }
      
      var rank = rankMaps[classKey][stu.ID] || { position: '—', total: '—' };
      var avg = stu.Average ? Math.round(Number(stu.Average)) : '—';
      
      var url = ScriptApp.getService().getUrl() + '?page=report&id=' + encodeURIComponent(stu.ID);
      if (stu.Year) url += '&year=' + encodeURIComponent(stu.Year);
      if (stu.Term) url += '&term=' + encodeURIComponent(stu.Term);
      
      // Get subject grades list for the student
      var gradeList = 'N/A';
      var rep = getStudentReport(stu.ID, stu.Year, stu.Term, true);
      if (rep.success && rep.results && rep.results.length > 0) {
        gradeList = rep.results.map(function(r) {
          var sName = r.SubjectName;
          if (sName.length > 12) sName = sName.substring(0, 10) + '..';
          return sName + ': ' + r.Grade;
        }).join(', ');
      }
      // Term 3 promotion note (e.g. "promoted from Basic 4 to Basic 5") — blank outside Term 3
      // or when no promotion status has been set for the student yet.
      var promoNote = rep.success ? buildPromotionNote(rep) : '';

      var placeholders = {
        '{Name}': stu.Name,
        '{ID}': stu.ID,
        '{Class}': stu.Class,
        '{Year}': stu.Year,
        '{Term}': stu.Term,
        '{Average}': avg,
        '{Position}': rank.position,
        '{Total}': rank.total,
        '{Arrears}': stu.Arrears !== undefined ? stu.Arrears : '0.00',
        '{NextTermFees}': stu.NextTermFees !== undefined ? stu.NextTermFees : '0.00',
        '{Grades}': gradeList,
        '{PromotionNote}': promoNote,
        '{URL}': url
      };
      
      var msg = templateText;
      Object.keys(placeholders).forEach(function(key) {
        msg = msg.split(key).join(placeholders[key]);
      });
      
      var status = sendViaSMSProvider(provider, apiKey, sender, phone, msg);
      logSMS(stu.ID, phone, msg, status, provider);
      
      if (status.indexOf('Sent') > -1) {
        sentCount++;
      } else {
        failedCount++;
      }
    }
    
    return {
      success: true,
      message: 'SMS processing complete. Sent: ' + sentCount + ', Failed: ' + failedCount
    };
  } catch (e) {
    return {success: false, message: 'Bulk SMS error: ' + e.message};
  }
}

// ── GET COMPILED REPORT SMS ──
function getCompiledReportSMS(token, studentId, year, term) {
  if (!validateAdminToken(token)) return {success: false, message: 'Unauthorized'};
  try {
    var ss = SS();
    var data = ss.getSheetByName('Students').getDataRange().getValues(), phone = '', name = '';
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] && data[i][0].toString() === studentId.toString()) {
        phone = data[i][15].toString();
        name = data[i][1].toString();
        break;
      }
    }
    
    var rep = getStudentReport(studentId, year, term, true);
    var msg = '';
    // See sendReportSMS for why the link must be pinned to the report's actual resolved
    // year/term rather than the raw (possibly-blank) arguments.
    var pinYear = (rep.success && rep.student && rep.student.Year) ? rep.student.Year : year;
    var pinTerm = (rep.success && rep.student && rep.student.Term) ? rep.student.Term : term;
    var url = ScriptApp.getService().getUrl() + '?page=report&id=' + encodeURIComponent(studentId);
    if (pinYear) url += '&year=' + encodeURIComponent(pinYear);
    if (pinTerm) url += '&term=' + encodeURIComponent(pinTerm);

    if (rep.success) {
      var stu = rep.student;
      var pos = rep.overallPosition || '—';
      var total = rep.classmatesCount || '—';
      var avg = stu.Average ? Math.round(Number(stu.Average)) : '—';

      msg = 'Dear Parent, ' + stu.Name + '\'s report card for ' + stu.Term + ' (' + stu.Year + ') is ready.\n' +
            'Class: ' + stu.Class + '\n' +
            'Avg: ' + avg + '% | Pos: ' + pos + '/' + total + '\n';

      var arrears = Number(stu.Arrears || 0);
      var nextTerm = Number(stu.NextTermFees || 0);
      if (nextTerm > 0) {
        msg += 'Bill: GH¢ ' + nextTerm.toFixed(2) + '\n';
      }
      if (arrears > 0) {
        msg += 'Arrears: GH¢ ' + arrears.toFixed(2) + '\n';
      }

      if (rep.results && rep.results.length > 0) {
        var grades = rep.results.map(function(r) {
          var sName = r.SubjectName;
          if (sName.length > 12) sName = sName.substring(0, 10) + '..';
          return sName + ': ' + (r.TotalScore !== undefined ? r.TotalScore : '—');
        }).join(', ');
        msg += 'Scores: ' + grades + '\n';
      }
      var promoNote = buildPromotionNote(rep);
      if (promoNote) msg += promoNote + '\n';
      msg += 'Link: ' + url;
    } else {
      msg = 'Dear Parent, ' + name + '\'s report card is ready. View here: ' + url;
    }

    return {success: true, phone: phone, message: msg, url: url};
  } catch (e) {
    return {success: false, message: e.message};
  }
}

// ── SEND SMS DIRECT ──
function sendSMSDirect(token, phone, message, studentId) {
  if (!validateAdminToken(token)) return {success: false, message: 'Unauthorized'};
  try {
    var ss = SS(), props = PropertiesService.getScriptProperties();
    var apiKey = props.getProperty(SMS_KEY_PROP);
    var sender = props.getProperty(SMS_SEND_PROP) || 'SchoolSMS';
    var provider = (props.getProperty('SMS_PROVIDER') || 'arkesel').toLowerCase();
    if (!apiKey) return {success: false, message: 'SMS API key not configured.'};
    
    var status = sendViaSMSProvider(provider, apiKey, sender, phone, message);
    logSMS(studentId || 'DIRECT', phone, message, status, provider);
    return {success: true, message: 'SMS sent status: ' + status};
  } catch (e) {
    return {success: false, message: e.message};
  }
}


function normalizePhoneNumbers(phoneStr) {
  if (!phoneStr) return '';
  return phoneStr.toString().split(',').map(function(num) {
    var raw = num.trim().replace(/[^0-9]/g, '');
    if (raw.indexOf('0') === 0 && raw.length === 10) {
      return '233' + raw.substring(1);
    } else if (raw.indexOf('233') === 0) {
      return raw;
    } else if (raw.length === 9) {
      return '233' + raw;
    }
    return raw;
  }).join(',');
}

function sendViaSMSProvider(provider,apiKey,sender,phone,msg){
  var status = 'Failed';
  try {
    phone = normalizePhoneNumbers(phone);
    var res;
    if(provider==='arkesel'){
      var recipientsArray = phone.split(',').map(function(p){ return p.trim(); });
      res = UrlFetchApp.fetch('https://sms.arkesel.com/api/v2/sms/send',{method:'post',contentType:'application/json',payload:JSON.stringify({sender:sender,message:msg,recipients:recipientsArray}),headers:{'api-key':apiKey},muteHttpExceptions:true});
    }else if(provider==='mnotify'){
      res = UrlFetchApp.fetch('https://apps.mnotify.net/smsapi?key='+apiKey+'&to='+encodeURIComponent(phone)+'&msg='+encodeURIComponent(msg)+'&sender_id='+encodeURIComponent(sender),{muteHttpExceptions:true});
    }else if(provider==='wigal'){
      res = UrlFetchApp.fetch('https://frog.wigal.com.gh/api/v3/sms/send',{method:'post',contentType:'application/json',payload:JSON.stringify({sender:sender,message:msg,recipients:phone}),headers:{Authorization:'Bearer '+apiKey},muteHttpExceptions:true});
    }else{
      res = UrlFetchApp.fetch('https://smsc.hubtel.com/v1/messages/send',{method:'post',contentType:'application/json',payload:JSON.stringify({From:sender,To:phone,Content:msg}),headers:{Authorization:'Basic '+Utilities.base64Encode(apiKey)},muteHttpExceptions:true});
    }
    var code = res ? res.getResponseCode() : 500;
    if (code >= 200 && code < 300) {
      status = 'Sent';
    } else {
      status = 'Failed (HTTP ' + code + ')';
    }
  } catch(e) {
    status = 'Failed (' + e.message + ')';
  }
  return status;
}

// ── GET STUDENTS BY CLASS WITH NAMES (for preview dropdown) ──
function getStudentNamesByClass(token,cn,yr,tm){
  var u = getTokenData(token);
  if(!u)return{success:false,message:'Unauthorized'};
  if (u.role === 'teacher') {
    cn = u.assignedClass || '';
    if (!cn) return {success:true,students:[]};
  }
  try{
    var data=SS().getSheetByName('Students').getDataRange().getValues(),students=[];
    for(var i=1;i<data.length;i++){
      if(!data[i][0])continue;
      var match=data[i][3]===cn;
      if(yr)match=match&&data[i][4].toString()===yr.toString();
      if(tm)match=match&&data[i][5]===tm;
      if(match)students.push({ID:data[i][0].toString(),Name:data[i][1].toString()});
    }
    return{success:true,students:students};
  }catch(e){return{success:false,message:e.message};}
}

function getSettings(token){if(!validateAdminToken(token))return{success:false,message:'Unauthorized'};try{var data=SS().getSheetByName('Settings').getDataRange().getValues(),sett={};for(var i=1;i<data.length;i++){var v=data[i][1];if(v instanceof Date)v=Utilities.formatDate(v,Session.getScriptTimeZone(),'yyyy-MM-dd');sett[data[i][0]]=v;}var props=PropertiesService.getScriptProperties();sett['SMS_API_KEY']=props.getProperty(SMS_KEY_PROP)||'';sett['SMS_SENDER']=props.getProperty(SMS_SEND_PROP)||'';sett['SCHOOL_LOGO']=sett['SCHOOL_LOGO']||props.getProperty(LOGO_KEY)||'';sett['SCHOOL_WATERMARK']=sett['SCHOOL_WATERMARK']||'';sett['SCHOOL_STAMP']=sett['SCHOOL_STAMP']||props.getProperty(STAMP_KEY)||'';sett['SCHOOL_SIGNATURE']=sett['SCHOOL_SIGNATURE']||props.getProperty(SIG_KEY)||'';sett['PHOTOS_FOLDER_ID']=props.getProperty(PHOTOS_KEY)||'';return{success:true,settings:sett};}catch(e){return{success:false,message:e.message};}}
function updateSettings(token,obj){if(!validateAdminToken(token))return{success:false,message:'Unauthorized'};try{var sheet=SS().getSheetByName('Settings'),data=sheet.getDataRange().getValues();var props=PropertiesService.getScriptProperties();Object.keys(obj).forEach(function(key){if(key==='SMS_API_KEY'){props.setProperty(SMS_KEY_PROP,obj[key]);return;}if(key==='SMS_SENDER'){props.setProperty(SMS_SEND_PROP,obj[key]);return;}if(key==='SMS_PROVIDER'){props.setProperty('SMS_PROVIDER',obj[key]);}if(key==='SCHOOL_LOGO')props.setProperty(LOGO_KEY,obj[key]);if(key==='SCHOOL_STAMP')props.setProperty(STAMP_KEY,obj[key]);if(key==='SCHOOL_SIGNATURE')props.setProperty(SIG_KEY,obj[key]);if(key==='HEADTEACHER_USER')props.setProperty('HEADTEACHER_USER',obj[key]);if(key==='HEADTEACHER_PASS')props.setProperty('HEADTEACHER_PASS',obj[key]);var found=false;for(var i=1;i<data.length;i++){if(data[i][0]===key){sheet.getRange(i+1,2).setValue(obj[key]);found=true;break;}}if(!found)sheet.appendRow([key,obj[key]]);});invalidateSettingsCache();logServerAction(token, 'Update Settings', 'Keys: ' + Object.keys(obj).join(', '));return{success:true};}catch(e){return{success:false,message:e.message};}}
function updateCustomCTRemarks(token, rem) { var td = getTokenData(token); if (!td || (td.role !== 'admin' && td.role !== 'teacher')) return {success: false, message: 'Unauthorized'}; try { var sheet = SS().getSheetByName('Settings'); var data = sheet.getDataRange().getValues(); var found = false; for (var i = 1; i < data.length; i++) { if (data[i][0] === 'CUSTOM_CT_REMARKS') { sheet.getRange(i + 1, 2).setValue(rem); found = true; break; } } if (!found) sheet.appendRow(['CUSTOM_CT_REMARKS', rem]); invalidateSettingsCache(); return {success: true}; } catch(e) { return {success: false, message: e.message}; } }

// ── SMS ────────────────────────────────────────────────────
function sendSMSToParent(token,studentId,msg){if(!validateAdminToken(token))return{success:false,message:'Unauthorized'};try{var props=PropertiesService.getScriptProperties(),apiKey=props.getProperty(SMS_KEY_PROP),sender=props.getProperty(SMS_SEND_PROP)||'SchoolSMS',provider=(props.getProperty('SMS_PROVIDER')||'arkesel').toLowerCase();if(!apiKey)return{success:false,message:'SMS API key not configured.'};var data=SS().getSheetByName('Students').getDataRange().getValues(),phone='';for(var i=1;i<data.length;i++){if(data[i][0]&&data[i][0].toString()===studentId.toString()){phone=data[i][15].toString();break;}}if(!phone)return{success:false,message:'No phone number for student '+studentId};var status = sendViaSMSProvider(provider,apiKey,sender,phone,msg);logSMS(studentId, phone, msg, status, provider);return{success:true,message:'SMS sent status: '+status};}catch(e){return{success:false,message:'SMS error: '+e.message};}}

// ── HELPERS ────────────────────────────────────────────────
function getAdminStudentReport(token, id, year, term) {
  var u = getTokenData(token);
  if (!u) return {success: false, message: 'Unauthorized'};
  
  if (u.role === 'teacher') {
    var teacherClass = u.assignedClass || '';
    if (!teacherClass) return {success: false, message: 'Unauthorized: Teacher has no class assigned.'};
    
    try {
      var ss = SS();
      var classSheet = null;
      var sheets = ss.getSheets();
      // Scan for historical class record
      for (var i = 0; i < sheets.length; i++) {
        var sName = sheets[i].getName();
        if (sName.startsWith('Basic') || sName.startsWith('KG') || sName.startsWith('JHS') || sName.startsWith('Class') || sName.includes('Primary') || sName.includes('Kindergarten')) {
          var sD = sheets[i].getDataRange().getValues();
          var sH = sD[0];
          var idIdx = sH.indexOf('ID');
          var yrIdx = sH.indexOf('Year');
          var tmIdx = sH.indexOf('Term');
          if (idIdx >= 0) {
            for (var r = 1; r < sD.length; r++) {
              if (sD[r][idIdx].toString().trim() === id.toString().trim()) {
                var matchYr = (yrIdx >= 0) ? sD[r][yrIdx].toString() : '';
                var matchTm = (tmIdx >= 0) ? sD[r][tmIdx].toString() : '';
                if (matchYr === year.toString() && matchTm === term.toString()) {
                  classSheet = sName;
                  break;
                }
              }
            }
          }
        }
        if (classSheet) break;
      }
      
      // Fallback to active Students sheet
      if (!classSheet) {
        var stuSh = ss.getSheetByName('Students');
        var stuD = stuSh.getDataRange().getValues();
        for (var r = 1; r < stuD.length; r++) {
          if (stuD[r][0].toString().trim() === id.toString().trim()) {
            classSheet = stuD[r][3];
            break;
          }
        }
      }
      
      if (!classSheet || classSheet !== teacherClass) {
        return {success: false, message: 'Unauthorized: Teachers can only preview reports for their own class (' + teacherClass + ').'};
      }
    } catch(e) {
      return {success: false, message: 'Authorization check failed: ' + e.message};
    }
  }
  
  return getStudentReport(id.toString().trim(), year, term, true);
}

function updateReportCardPublishStatus(token, studentId, year, term, status) {
  if (!validateAdminToken(token)) return {success: false, message: 'Unauthorized'};
  try {
    var ss = SS();
    var sheet = ss.getSheetByName('Students');
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var statusColIdx = headers.indexOf('ReportStatus');
    if (statusColIdx === -1) {
      ensureReportStatusHeader(ss);
      data = sheet.getDataRange().getValues();
      headers = data[0];
      statusColIdx = headers.indexOf('ReportStatus');
    }
    
    var idColIdx = headers.indexOf('ID');
    var yearColIdx = headers.indexOf('Year');
    var termColIdx = headers.indexOf('Term');
    
    var found = false;
    for (var i = 1; i < data.length; i++) {
      if (data[i][idColIdx] && String(data[i][idColIdx]).trim() === studentId.toString().trim() &&
          data[i][yearColIdx] && String(data[i][yearColIdx]).trim() === year.toString().trim() &&
          data[i][termColIdx] && String(data[i][termColIdx]).trim() === term.toString().trim()) {
        sheet.getRange(i + 1, statusColIdx + 1).setValue(status);
        found = true;
        break;
      }
    }
    
    if (found) {
      return {success: true, message: 'Status updated to ' + status};
    } else {
      return {success: false, message: 'Student record not found for the specified year/term.'};
    }
  } catch (e) {
    return {success: false, message: e.message};
  }
}

function batchUpdateReportPublishStatus(token, studentIds, year, term, status) {
  if (!validateAdminToken(token)) return {success: false, message: 'Unauthorized'};
  try {
    var ss = SS();
    var sheet = ss.getSheetByName('Students');
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var statusColIdx = headers.indexOf('ReportStatus');
    if (statusColIdx === -1) {
      ensureReportStatusHeader(ss);
      data = sheet.getDataRange().getValues();
      headers = data[0];
      statusColIdx = headers.indexOf('ReportStatus');
    }
    
    var idColIdx = headers.indexOf('ID');
    var yearColIdx = headers.indexOf('Year');
    var termColIdx = headers.indexOf('Term');
    
    var sIds = studentIds.map(function(id) { return String(id).trim(); });
    var count = 0;
    var statusValues = sheet.getRange(2, statusColIdx + 1, data.length - 1, 1).getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][idColIdx] && sIds.indexOf(String(data[i][idColIdx]).trim()) !== -1 &&
          data[i][yearColIdx] && String(data[i][yearColIdx]).trim() === year.toString().trim() &&
          data[i][termColIdx] && String(data[i][termColIdx]).trim() === term.toString().trim()) {
        statusValues[i - 1][0] = status;
        count++;
      }
    }
    if (count > 0) {
      sheet.getRange(2, statusColIdx + 1, statusValues.length, 1).setValues(statusValues);
    }
    return {success: true, message: 'Successfully updated ' + count + ' records to ' + status};
  } catch (e) {
    return {success: false, message: e.message};
  }
}
function getStudentsByClass(token,cn,yr,tm){
  var u = getTokenData(token);
  if(!u)return{success:false,message:'Unauthorized'};
  if (u.role === 'teacher') {
    cn = u.assignedClass || '';
    if (!cn) return {success:true,students:[]};
  }
  try{var data=SS().getSheetByName('Students').getDataRange().getValues(),h=data[0],students=[];for(var i=1;i<data.length;i++){if(!data[i][0])continue;if(data[i][3]===cn&&data[i][4].toString()===yr.toString()&&data[i][5]===tm){var sv={};h.forEach(function(k,idx){sv[k]=data[i][idx];});
        if(sv.Arrears===undefined) sv.Arrears=data[i][18]||0;
        if(sv.NextTermFees===undefined) sv.NextTermFees=data[i][19]||0;
        if(sv.FeeData===undefined) sv.FeeData=data[i][20]||'{}';
        if(typeof sv.FeeData==='string'&&sv.FeeData.startsWith('{')){try{sv.FeeData=JSON.parse(sv.FeeData);}catch(e){}}
        students.push(sv);}}return{success:true,students:students};}catch(e){return{success:false,message:e.message};}}
function exportStudentsCSV(token){if(!validateAdminToken(token))return{success:false,message:'Unauthorized'};try{var data=SS().getSheetByName('Students').getDataRange().getValues(),csv=data.map(function(r){return r.map(function(c){return'"'+c.toString().replace(/"/g,'""')+'"';}).join(',');}).join('\n');return{success:true,csv:csv};}catch(e){return{success:false,message:e.message};}}
function exportResultsCSV(token,cn){if(!validateAdminToken(token))return{success:false,message:'Unauthorized'};try{var ss=SS();if(cn){var cs=ss.getSheetByName(cn);if(!cs)return{success:false,message:'No results sheet for '+cn};var data=cs.getDataRange().getValues();var csv=data.map(function(r){return r.map(function(c){return'"'+c.toString().replace(/"/g,'""')+'"';}).join(',');}).join('\n');return{success:true,csv:csv};}var allCsv=[],first=true;var clsD=ss.getSheetByName('Classes').getDataRange().getValues();for(var i=1;i<clsD.length;i++){if(!clsD[i][0])continue;var cs2=ss.getSheetByName(clsD[i][0]);if(!cs2||cs2.getLastRow()<1)continue;var data2=cs2.getDataRange().getValues();data2.forEach(function(r,idx){if(first||idx>0){allCsv.push(r.map(function(c){return'"'+c.toString().replace(/"/g,'""')+'"';}).join(','));if(first&&idx===0)first=false;}});}return{success:true,csv:allCsv.join('\n')};}catch(e){return{success:false,message:e.message};}}
function importStudentsCSV(token,csv){if(!validateAdminToken(token))return{success:false,message:'Unauthorized'};try{var ss=SS(),lines=csv.split('\n').filter(function(l){return l.trim();}),sheet=ss.getSheetByName('Students'),count=0;for(var i=1;i<lines.length;i++){var cols=lines[i].split(',').map(function(c){return c.replace(/^"|"$/g,'').trim();});if(!cols[0])continue;sheet.appendRow(cols);count++;}recalculateClassSizes(ss);return{success:true,count:count};}catch(e){return{success:false,message:e.message};}}
function getStudentsCSVTemplate(){var h=['ID','Name','Gender','Class','Year','Term','Attendance','OutOf','TotalScore','Average','Interest','Conduct','Attitude','ClassTeacherRemark','HeadTeacherRemark','ParentPhone','PhotoUrl','LevelGroup','Arrears','NextTermFees','FeeData','PromotionStatus'];var s=['MS001','Sample Student','Male','Basic 4','2025-2026','Term 1','70','75','0','0','','','','','','+233200000000','','Lower Primary','0.00','0.00','{}',''];return{success:true,csv:h.join(',')+'\n'+s.join(',')};}
function exportFeesBillsCSV(token,cn,yr,tm){if(!validateAdminToken(token))return{success:false,message:'Unauthorized'};try{var data=SS().getSheetByName('Students').getDataRange().getValues(),h=data[0];var csvRows=[];var sett=SS().getSheetByName('Settings'),settD=sett?sett.getDataRange().getValues():[];var feeComps=[];if(settD){for(var i=1;i<settD.length;i++){if(settD[i][0]==='FEE_COMPONENTS'){if(settD[i][1])feeComps=settD[i][1].split(',').map(function(s){return s.trim();});break;}}}var header=['ID','Name'];feeComps.forEach(function(fc){header.push(fc);});header.push('TotalExpected');csvRows.push(header);for(var i=1;i<data.length;i++){if(!data[i][0])continue;if(data[i][3]===cn&&data[i][4].toString()===yr.toString()&&data[i][5]===tm){var sv={};h.forEach(function(k,idx){sv[k]=data[i][idx];});var row=[sv.ID,sv.Name];var fd={};try{fd=JSON.parse(sv.FeeData||'{}');}catch(e){}var tot=0;feeComps.forEach(function(fc){var v=Number(fd[fc]||0);if(fc.toLowerCase()==='arrears'&&!fd[fc])v=Number(sv.Arrears||0);if(fc.toLowerCase()==='next term fees'&&!fd[fc])v=Number(sv.NextTermFees||0);row.push(v);tot+=v;});row.push(tot);csvRows.push(row);}}var csv=csvRows.map(function(r){return r.map(function(c){return'"'+c.toString().replace(/"/g,'""')+'"';}).join(',');}).join('\n');return{success:true,csv:csv};}catch(e){return{success:false,message:e.message};}}
function getScriptUrl(){try{return ScriptApp.getService().getUrl();}catch(e){return '';}}

function getClassesPublic() {
  try {
    var ss = SS();
    var data = getCachedClassesData(ss);
    var classes = [];
    for (var i = 1; i < data.length; i++) {
      if (data[i][0]) {
        classes.push({
          ClassName: data[i][0].toString(),
          LevelGroup: (data[i][3] || 'General').toString()
        });
      }
    }
    return {success: true, classes: classes};
  } catch(e) {
    return {success: false, message: e.message};
  }
}
// ── TEACHERS CRUD ──────────────────────────────────────────
function getAllTeachers(token){var td=getTokenData(token);if(!td||td.role!=='admin')return{success:false,message:'Unauthorized'};try{var ss=SS(),sh=ss.getSheetByName('Teachers');if(!sh)return{success:true,teachers:[]};var data=sh.getDataRange().getValues(),h=data[0],teachers=[];for(var i=1;i<data.length;i++){if(!data[i][0])continue;var t={};h.forEach(function(k,idx){t[k]=data[i][idx];});t._row=i+1;teachers.push(t);}return{success:true,teachers:teachers};}catch(e){return{success:false,message:e.message};}}
function addTeacher(token, d) {
  if (!getTokenData(token) || getTokenData(token).role !== 'admin') return {success: false, message: 'Unauthorized'};
  try {
    var ss = SS(), sh = ss.getSheetByName('Teachers');
    if (!sh) {
      sh = ss.insertSheet('Teachers');
      styleHeader(sh, ['Username', 'Password', 'FullName', 'AssignedClass', 'Phone', 'PhotoUrl', 'Signature', 'PortalUrl']);
    }
    var data = sh.getDataRange().getValues();
    var headers = data[0];
    if (headers.indexOf('PortalUrl') === -1) {
      sh.getRange(1, 8).setValue('PortalUrl');
      data = sh.getDataRange().getValues();
    }
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === d.Username) return {success: false, message: 'Username exists.'};
    }
    var password = d.Password || 'password123';
    var portalUrl = d.PortalUrl || '';
    sh.appendRow([d.Username, password, d.FullName, d.AssignedClass || '', d.Phone || '', d.PhotoUrl || '', '', portalUrl]);
    
    // Auto-send credentials alert SMS if phone is provided
    if (d.Phone && d.Phone.trim()) {
      var schoolName = 'School Portal';
      try {
        var settSh = ss.getSheetByName('Settings');
        if (settSh) {
          var settD = settSh.getDataRange().getValues();
          for (var sIdx = 1; sIdx < settD.length; sIdx++) {
            if (settD[sIdx][0] === 'SCHOOL_NAME') {
              schoolName = settD[sIdx][1] || 'School Portal';
              break;
            }
          }
        }
      } catch (e) {}
      
      var msg = "Hello " + d.FullName + ", you have been added as a teacher to the " + schoolName + " portal. Username: " + d.Username + ", Password: " + password + ". Login here: " + portalUrl;
      try {
        sendSMSDirect(token, d.Phone, msg, 'TEACHER_ADD_' + d.Username);
      } catch (e) {
        Logger.log("New teacher SMS alert failed: " + e.message);
      }
    }
    return {success: true};
  } catch(e) {
    return {success: false, message: e.message};
  }
}
function updateTeacher(token, d) {
  if (!getTokenData(token) || getTokenData(token).role !== 'admin') return {success: false, message: 'Unauthorized'};
  try {
    var sh = SS().getSheetByName('Teachers'), data = sh.getDataRange().getValues();
    var headers = data[0];
    if (headers.indexOf('PortalUrl') === -1) {
      sh.getRange(1, 8).setValue('PortalUrl');
      data = sh.getDataRange().getValues();
    }
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === d.Username) {
        sh.getRange(i + 1, 1, 1, 8).setValues([[
          d.Username,
          d.Password || data[i][1],
          d.FullName,
          d.AssignedClass || '',
          d.Phone || '',
          d.PhotoUrl || (data[i][5] || ''),
          data[i][6] || '',
          d.PortalUrl || ''
        ]]);
        return {success: true};
      }
    }
    return {success: false, message: 'Teacher not found.'};
  } catch(e) {
    return {success: false, message: e.message};
  }
}
function deleteTeacher(token,un){if(!getTokenData(token)||getTokenData(token).role!=='admin')return{success:false,message:'Unauthorized'};try{var sh=SS().getSheetByName('Teachers'),data=sh.getDataRange().getValues();for(var i=1;i<data.length;i++){if(data[i][0]===un){sh.deleteRow(i+1);return{success:true};}}return{success:false,message:'Teacher not found.'};}catch(e){return{success:false,message:e.message};}}

// ── MESSAGING ──────────────────────────────────────────────
function getMessages(token, target){var td=getTokenData(token);if(!td)return{success:false,message:'Unauthorized'};try{var ss=SS(),sh=ss.getSheetByName('Messages');if(!sh)return{success:true,messages:[]};var data=sh.getDataRange().getValues(),msgs=[];for(var i=1;i<data.length;i++){if(!data[i][0])continue;var s=data[i][1],r=data[i][2],m=data[i][3],ir=data[i][4];if(td.role==='admin' && (s===target||r===target)){msgs.push({Timestamp:data[i][0],Sender:s,Receiver:r,Message:m,IsRead:ir});}else if(td.role==='teacher' && target==='admin' && (s===td.username||r===td.username||r==='All Teachers')){msgs.push({Timestamp:data[i][0],Sender:s,Receiver:r,Message:m,IsRead:ir});}}return{success:true,messages:msgs};}catch(e){return{success:false,message:e.message};}}
function sendMessage(token, target, msg){var td=getTokenData(token);if(!td)return{success:false,message:'Unauthorized'};try{var ss=SS(),sh=ss.getSheetByName('Messages');if(!sh){sh=ss.insertSheet('Messages');styleHeader(sh,['Timestamp','Sender','Receiver','Message','IsRead']);}var sender=(td.role==='admin')?'admin':td.username;sh.appendRow([new Date().toISOString(),sender,target,msg,false]);return{success:true};}catch(e){return{success:false,message:e.message};}}

function updateTeacherPhoto(token, un, b64){
  if(!getTokenData(token))return{success:false,message:'Unauthorized'};
  try{
    var sh=SS().getSheetByName('Teachers'),data=sh.getDataRange().getValues();
    for(var i=1;i<data.length;i++){
      if(data[i][0]===un){
        sh.getRange(i+1,6).setValue(b64);
        return{success:true};
      }
    }
    return{success:false,message:'Teacher not found.'};
  }catch(e){return{success:false,message:e.message};}
}

function updateTeacherSignature(token, un, b64){
  if(!getTokenData(token))return{success:false,message:'Unauthorized'};
  try{
    var sh=SS().getSheetByName('Teachers'),data=sh.getDataRange().getValues();
    // Ensure header has the Signature column
    var headers = data[0];
    if (headers.indexOf('Signature') === -1) {
      sh.getRange(1, 7).setValue('Signature');
    }
    for(var i=1;i<data.length;i++){
      if(data[i][0]===un){
        sh.getRange(i+1,7).setValue(b64);
        return{success:true};
      }
    }
    return{success:false,message:'Teacher not found.'};
  }catch(e){return{success:false,message:e.message};}
}

// ── FULL SYSTEM BACKUP ─────────────────────────────────────
function getFullBackupData(token) {
  if (!validateAdminToken(token)) return {success:false, message:'Unauthorized'};
  try {
    var ss = SS();

    // Students
    var stuSheet = ss.getSheetByName('Students');
    var stuRaw = stuSheet ? stuSheet.getDataRange().getValues() : [[]];
    var stuHeaders = stuRaw[0] || [];
    var students = [];
    for (var i = 1; i < stuRaw.length; i++) {
      if (!stuRaw[i][0]) continue;
      var sv = {};
      stuHeaders.forEach(function(h, idx) { sv[h] = stuRaw[i][idx]; });
      students.push(sv);
    }

    // Classes
    var clsSheet = ss.getSheetByName('Classes');
    var clsRaw = clsSheet ? clsSheet.getDataRange().getValues() : [[]];
    var clsHeaders = clsRaw[0] || [];
    var classes = [];
    for (var j = 1; j < clsRaw.length; j++) {
      if (!clsRaw[j][0]) continue;
      var cv = {};
      clsHeaders.forEach(function(h, idx) { cv[h] = clsRaw[j][idx]; });
      classes.push(cv);
    }

    // Results — collect from every class sheet
    var results = [];
    classes.forEach(function(cls) {
      var rs = ss.getSheetByName(cls.ClassName);
      if (!rs || rs.getLastRow() < 2) return;
      var rData = rs.getDataRange().getValues();
      var rH = rData[0];
      for (var r = 1; r < rData.length; r++) {
        if (!rData[r][0]) continue;
        var rv = {_class: cls.ClassName};
        rH.forEach(function(h, idx) { rv[h] = rData[r][idx]; });
        results.push(rv);
      }
    });

    // Grading
    var grdSheet = ss.getSheetByName('Grading');
    var grdRaw = grdSheet ? grdSheet.getDataRange().getValues() : [[]];
    var grdHeaders = grdRaw[0] || [];
    var grading = [];
    for (var g = 1; g < grdRaw.length; g++) {
      if (grdRaw[g][0] === '' && grdRaw[g][1] === '') continue;
      var gv = {};
      grdHeaders.forEach(function(h, idx) { gv[h] = grdRaw[g][idx]; });
      grading.push(gv);
    }

    // Settings
    var settSheet = ss.getSheetByName('Settings');
    var settRaw = settSheet ? settSheet.getDataRange().getValues() : [];
    var settings = {};
    for (var s = 1; s < settRaw.length; s++) {
      var val = settRaw[s][1];
      if (val instanceof Date) val = Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      settings[settRaw[s][0]] = val;
    }
    // Omit large base64 images to keep backup small
    ['SCHOOL_LOGO','SCHOOL_STAMP','SCHOOL_SIGNATURE','SCHOOL_WATERMARK'].forEach(function(k) {
      if (settings[k] && settings[k].length > 200) settings[k] = '[base64_image_omitted]';
    });

    // Teachers (omit passwords)
    var tchSheet = ss.getSheetByName('Teachers');
    var tchRaw = tchSheet ? tchSheet.getDataRange().getValues() : [[]];
    var tchHeaders = tchRaw[0] || [];
    var teachers = [];
    for (var t = 1; t < tchRaw.length; t++) {
      if (!tchRaw[t][0]) continue;
      var tv = {};
      tchHeaders.forEach(function(h, idx) { tv[h] = (h === 'Password') ? '***' : tchRaw[t][idx]; });
      teachers.push(tv);
    }

    return {
      success: true,
      students: students,
      classes: classes,
      results: results,
      grading: grading,
      settings: settings,
      teachers: teachers
    };
  } catch(e) {
    return {success: false, message: e.message};
  }
}

// ── RESTORE SYSTEM BACKUP ──────────────────────────────────
function restoreFullBackup(token, backupJson) {
  if (!validateAdminToken(token)) return {success: false, message: 'Unauthorized'};
  try {
    var backup = typeof backupJson === 'string' ? JSON.parse(backupJson) : backupJson;
    if (!backup || !backup.students || !backup.classes) return {success: false, message: 'Invalid backup format'};
    var ss = SS();
    
    // 1. Students
    var stuSheet = ss.getSheetByName('Students');
    if (!stuSheet) { stuSheet = ss.insertSheet('Students'); }
    if (stuSheet.getLastRow() > 1) stuSheet.deleteRows(2, stuSheet.getLastRow() - 1);
    if (backup.students && backup.students.length > 0) {
      var keys = Object.keys(backup.students[0]);
      styleHeader(stuSheet, keys);
      var data = backup.students.map(function(s) { return keys.map(function(k) { return s[k]; }); });
      stuSheet.getRange(2, 1, data.length, keys.length).setValues(data);
    }
    
    // 2. Classes
    var clsSheet = ss.getSheetByName('Classes');
    if (!clsSheet) { clsSheet = ss.insertSheet('Classes'); }
    if (clsSheet.getLastRow() > 1) clsSheet.deleteRows(2, clsSheet.getLastRow() - 1);
    if (backup.classes && backup.classes.length > 0) {
      var keys = Object.keys(backup.classes[0]);
      styleHeader(clsSheet, keys);
      var data = backup.classes.map(function(c) { return keys.map(function(k) { return c[k]; }); });
      clsSheet.getRange(2, 1, data.length, keys.length).setValues(data);
    }
    
    // 3. Grading
    var grdSheet = ss.getSheetByName('Grading');
    if (!grdSheet) { grdSheet = ss.insertSheet('Grading'); }
    if (grdSheet.getLastRow() > 1) grdSheet.deleteRows(2, grdSheet.getLastRow() - 1);
    if (backup.grading && backup.grading.length > 0) {
      var keys = Object.keys(backup.grading[0]);
      styleHeader(grdSheet, keys);
      var data = backup.grading.map(function(g) { return keys.map(function(k) { return g[k]; }); });
      grdSheet.getRange(2, 1, data.length, keys.length).setValues(data);
    }
    
    // 4. Results (grouped by _class)
    var resultsByClass = {};
    (backup.results || []).forEach(function(r) {
      var cls = r._class;
      if (!cls) return;
      if (!resultsByClass[cls]) resultsByClass[cls] = [];
      resultsByClass[cls].push(r);
    });
    Object.keys(resultsByClass).forEach(function(cls) {
      var rs = ss.getSheetByName(cls);
      if (!rs) rs = ss.insertSheet(cls);
      if (rs.getLastRow() > 1) rs.deleteRows(2, rs.getLastRow() - 1);
      var classRes = resultsByClass[cls];
      if (classRes.length > 0) {
        var keys = Object.keys(classRes[0]).filter(function(k) { return k !== '_class'; });
        styleHeader(rs, keys);
        var data = classRes.map(function(r) { return keys.map(function(k) { return r[k]; }); });
        rs.getRange(2, 1, data.length, keys.length).setValues(data);
      }
    });

    // 5. Settings
    var settSheet = ss.getSheetByName('Settings');
    if (!settSheet) { settSheet = ss.insertSheet('Settings'); styleHeader(settSheet, ['Key', 'Value']); }
    if (backup.settings) {
       var currentSettingsData = settSheet.getDataRange().getValues();
       Object.keys(backup.settings).forEach(function(k) {
         var val = backup.settings[k];
         if (val === '[base64_image_omitted]') return;
         var found = false;
         for (var i = 1; i < currentSettingsData.length; i++) {
           if (currentSettingsData[i][0] === k) {
             settSheet.getRange(i + 1, 2).setValue(val);
             found = true;
             break;
           }
         }
         if (!found) settSheet.appendRow([k, val]);
       });
    }

    // 6. Teachers
    var tchSheet = ss.getSheetByName('Teachers');
    if (!tchSheet) { tchSheet = ss.insertSheet('Teachers'); }
    if (tchSheet.getLastRow() > 1) tchSheet.deleteRows(2, tchSheet.getLastRow() - 1);
    if (backup.teachers && backup.teachers.length > 0) {
      var keys = Object.keys(backup.teachers[0]);
      styleHeader(tchSheet, keys);
      var data = backup.teachers.map(function(t) { return keys.map(function(k) { return t[k]; }); });
      tchSheet.getRange(2, 1, data.length, keys.length).setValues(data);
    }

    return {success: true};
  } catch(e) {
    return {success: false, message: e.message};
  }
}

// ── GOOGLE DRIVE BACKUPS ───────────────────────────────────
function getBackupFolder() {
  var folderName = 'System_Backups';
  var folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  } else {
    var folder = DriveApp.createFolder(folderName);
    folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return folder;
  }
}

function createDriveBackup(token) {
  if (!validateAdminToken(token)) return {success: false, message: 'Unauthorized'};
  try {
    var backupRes = getFullBackupData(token);
    if (!backupRes.success) return backupRes;
    var formattedDate = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd_HH-mm-ss');
    var fileName = 'Backup_School Management Portal - Database_' + formattedDate + '.json';
    var folder = getBackupFolder();
    var file = folder.createFile(fileName, JSON.stringify(backupRes, null, 2), 'application/json');
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return {
      success: true, 
      fileId: file.getId(), 
      fileName: fileName,
      url: file.getUrl()
    };
  } catch(e) {
    return {success: false, message: e.message};
  }
}

function listDriveBackups(token) {
  if (!validateAdminToken(token)) return {success: false, message: 'Unauthorized'};
  try {
    var folder = getBackupFolder();
    var files = folder.getFiles();
    var backupList = [];
    while (files.hasNext()) {
      var f = files.next();
      var name = f.getName();
      if (name.indexOf('Backup_School') === 0 && name.endsWith('.json')) {
        var created = Utilities.formatDate(f.getDateCreated(), Session.getScriptTimeZone(), 'd MMM yyyy, hh:mm a');
        var sizeMB = (f.getSize() / 1024).toFixed(2); // In KB or MB. Since sizes are around 0.01MB, KB or MB is fine. Let's do MB but display properly.
        var sizeMBNum = f.getSize() / (1024 * 1024);
        var sizeLabel = sizeMBNum < 0.01 ? '0.01 MB' : sizeMBNum.toFixed(2) + ' MB';
        backupList.push({
          id: f.getId(),
          name: name,
          created: created,
          size: sizeLabel,
          url: f.getUrl(),
          downloadUrl: 'https://drive.google.com/uc?export=download&id=' + f.getId(),
          epoch: f.getDateCreated().getTime()
        });
      }
    }
    backupList.sort(function(a, b) { return b.epoch - a.epoch; });
    return {success: true, backups: backupList};
  } catch(e) {
    return {success: false, message: e.message};
  }
}

function restoreDriveBackup(token, fileId) {
  if (!validateAdminToken(token)) return {success: false, message: 'Unauthorized'};
  try {
    var file = DriveApp.getFileById(fileId);
    var content = file.getAs('application/json').getDataAsString();
    logServerAction(token, 'Restore Backup', 'Restored backup from Google Drive file: ' + file.getName());
    return restoreFullBackup(token, content);
  } catch(e) {
    return {success: false, message: e.message};
  }
}

// ── AUDIT TRAIL HELPERS ────────────────────────────────────
function recordAuditTrail(username, role, action, details, ipAddress, macAddress, deviceType, userAgent) {
  try {
    var ss = SS();
    var sh = ss.getSheetByName('AuditTrail');
    if (!sh) {
      sh = ss.insertSheet('AuditTrail');
      styleHeader(sh, ['Timestamp','Username','Role','Action','Details','IPAddress','MACAddress','DeviceType','UserAgent']);
    }
    // Check if headers have Action, if not style them
    var headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
    if (headers.indexOf('Action') === -1) {
      sh.getRange(1, 1, 1, 9).setValues([['Timestamp','Username','Role','Action','Details','IPAddress','MACAddress','DeviceType','UserAgent']])
        .setBackground('#0d1b4b').setFontColor('#f0c020').setFontWeight('bold');
    }
    sh.appendRow([
      new Date().toISOString(),
      username || 'Unknown',
      role || 'Unknown',
      action || '',
      details || '',
      ipAddress || '',
      macAddress || '',
      deviceType || 'Desktop',
      userAgent || ''
    ]);
    return {success:true};
  } catch(e) {
    Logger.log('Audit error: ' + e.message);
    return {success:false, message: e.message};
  }
}

function recordSignInAudit(username, role, ipAddress, macAddress, deviceType, userAgent) {
  return recordAuditTrail(username, role, 'Sign In', 'Successful sign-in', ipAddress, macAddress, deviceType, userAgent);
}

function logSignIn(username, role, ipAddress, macAddress, deviceType, userAgent) {
  return recordSignInAudit(username, role, ipAddress, macAddress, deviceType, userAgent);
}

// Helper to log server actions with token validation
function logServerAction(token, action, details) {
  try {
    var td = getTokenData(token);
    var username = 'System';
    var role = 'System';
    if (td) {
      username = td.role === 'admin' ? 'admin' : (td.username || 'Teacher');
      role = td.role;
    }
    return recordAuditTrail(username, role, action, details, '', '', '', '');
  } catch(e) {
    Logger.log('logServerAction error: ' + e.message);
  }
}
function getSignInAuditTrail(token) {
  if (!validateAdminToken(token)) return {success:false, message:'Unauthorized'};
  try {
    var ss = SS();
    var sh = ss.getSheetByName('AuditTrail');
    if (!sh) return {success:true, logs:[]};
    var data = sh.getDataRange().getValues();
    if (data.length < 2) return {success:true, logs:[]};
    var headers = data[0];
    var logs = [];
    for (var i = 1; i < data.length; i++) {
      var item = {};
      headers.forEach(function(h, idx) {
        item[h] = data[i][idx];
      });
      logs.push(item);
    }
    logs.reverse(); // Newest first
    return {success:true, logs:logs};
  } catch(e) {
    return {success:false, message:e.message};
  }
}
function clearSignInAuditTrail(token) {
  if (!validateAdminToken(token)) return {success:false, message:'Unauthorized'};
  try {
    var ss = SS();
    var sh = ss.getSheetByName('AuditTrail');
    if (sh && sh.getLastRow() > 1) {
      sh.deleteRows(2, sh.getLastRow() - 1);
    }
    return {success:true};
  } catch(e) {
    return {success:false, message:e.message};
  }
}

// ── SMS LOGGING & BALANCE HELPERS ──────────────────────────
function logSMS(studentId, phone, message, status, provider) {
  try {
    var ss = SS();
    var sh = ss.getSheetByName('SMSLogs');
    if (!sh) {
      sh = ss.insertSheet('SMSLogs');
      styleHeader(sh, ['Timestamp','StudentID','RecipientPhone','Message','Status','Provider']);
    }
    sh.appendRow([new Date().toISOString(), studentId, phone, message, status, provider]);
  } catch(e) {
    Logger.log('SMS log error: ' + e.message);
  }
}
function getSMSBalance(token) {
  if (!validateAdminToken(token)) return {success:false, message:'Unauthorized'};
  var props = PropertiesService.getScriptProperties();
  var provider = (props.getProperty('SMS_PROVIDER') || 'arkesel').toLowerCase();
  try {
    var apiKey = props.getProperty(SMS_KEY_PROP);
    if (!apiKey || apiKey.trim() === '' || apiKey === 'undefined' || apiKey === 'null') {
      return {success:true, balance: 'Not Configured', provider: provider};
    }
    
    var url = '';
    var headers = {};
    
    if (provider === 'arkesel') {
      url = 'https://sms.arkesel.com/api/v2/clients/balance-details';
      headers = {'api-key': apiKey};
      var res = UrlFetchApp.fetch(url, {headers: headers, muteHttpExceptions: true});
      var text = res.getContentText();
      
      if (!text || text.trim() === '' || text.indexOf('<!DOCTYPE') > -1 || text.indexOf('<html') > -1 || text.trim().startsWith('<')) {
        return {success:true, balance: 'API Connection Error', provider: provider};
      }
      
      try {
        var json = JSON.parse(text);
        var bal = null;
        var currency = 'GHS';
        
        // Try parsing Arkesel API balance fields (both root and nested under "data" property)
        if (json.sms_balance !== undefined) {
          bal = json.sms_balance;
        } else if (json.balance !== undefined) {
          bal = json.balance;
        } else if (json.main_balance !== undefined) {
          bal = json.main_balance;
        }
        
        if (json.currency !== undefined) {
          currency = json.currency;
        }
        
        if (json.data) {
          var d = json.data;
          if (Array.isArray(d) && d.length > 0) {
            d = d[0];
          }
          if (d.sms_balance !== undefined) {
            bal = d.sms_balance;
          } else if (d.balance !== undefined) {
            bal = d.balance;
          } else if (d.main_balance !== undefined) {
            bal = d.main_balance;
          }
          if (d.currency !== undefined) {
            currency = d.currency;
          }
        }
        
        if (bal !== null) {
          var balStr = String(bal);
          if (balStr.indexOf(currency) > -1 || balStr.indexOf('GHS') > -1) {
            return {success:true, balance: balStr, provider: provider};
          }
          return {success:true, balance: balStr + ' ' + currency, provider: provider};
        } else if (json.message) {
          return {success:true, balance: json.message, provider: provider};
        } else {
          return {success:true, balance: 'API Error (Format)', provider: provider};
        }
      } catch(e) {
        return {success:true, balance: 'Invalid API Response', provider: provider};
      }
    } else if (provider === 'mnotify') {
      url = 'https://apps.mnotify.net/smsapi/balance?key=' + apiKey;
      var res = UrlFetchApp.fetch(url, {muteHttpExceptions: true});
      var text = res.getContentText();
      try {
        var json = JSON.parse(text);
        return {success:true, balance: (json.balance || '0') + ' units', provider: provider};
      } catch(e) {
        return {success:true, balance: text + ' units', provider: provider};
      }
    } else if (provider === 'hubtel') {
      return {success:true, balance: 'Active Account', provider: provider};
    }
    return {success:true, balance: 'Check Settings', provider: provider};
  } catch(e) {
    return {success:true, balance: 'Unavailable', provider: provider, error: e.message};
  }
}
function getSMSDashboardData(token) {
  if (!validateAdminToken(token)) return {success:false, message:'Unauthorized'};
  try {
    var ss = SS();
    var sh = ss.getSheetByName('SMSLogs');
    var logs = [];
    var sentCount = 0;
    var failedCount = 0;
    
    if (sh && sh.getLastRow() > 1) {
      var data = sh.getDataRange().getValues();
      var headers = data[0];
      for (var i = 1; i < data.length; i++) {
        var item = {};
        headers.forEach(function(h, idx) {
          item[h] = data[i][idx];
        });
        
        if (item.Status && item.Status.indexOf('Sent') > -1) {
          sentCount++;
        } else {
          failedCount++;
        }
        logs.push(item);
      }
    }
    
    logs.reverse(); // Newest first
    
    var balRes = getSMSBalance(token);
    var balance = balRes.success ? balRes.balance : 'Unavailable';
    
    return {
      success: true,
      logs: logs,
      sentCount: sentCount,
      failedCount: failedCount,
      balance: balance,
      provider: balRes.provider || 'Hubtel'
    };
  } catch(e) {
    return {success:false, message:e.message};
  }
}
function clearSMSLogs(token) {
  if (!validateAdminToken(token)) return {success:false, message:'Unauthorized'};
  try {
    var ss = SS();
    var sh = ss.getSheetByName('SMSLogs');
    if (sh && sh.getLastRow() > 1) {
      sh.deleteRows(2, sh.getLastRow() - 1);
    }
    return {success:true};
  } catch(e) {
    return {success:false, message:e.message};
  }
}



// ── ONLINE SESSIONS HELPERS ────────────────────────────────
function pingSession(token, username) {
  var td = getTokenData(token);
  if (!td) return {success:false};
  try {
    var props = PropertiesService.getScriptProperties();
    var now = new Date().getTime();
    var sessionsJson = props.getProperty('ACTIVE_SESSIONS') || '{}';
    var sessions = JSON.parse(sessionsJson);
    
    // Record current user session
    var userKey = (td.role === 'admin') ? 'admin' : (td.username || username || 'Teacher');
    sessions[userKey] = now;
    
    // Clean up expired sessions (older than 5 minutes = 300000ms)
    var activeCount = 0;
    var activeUsers = [];
    var cleanedSessions = {};
    for (var key in sessions) {
      if (now - sessions[key] < 300000) {
        cleanedSessions[key] = sessions[key];
        activeCount++;
        activeUsers.push(key);
      }
    }
    props.setProperty('ACTIVE_SESSIONS', JSON.stringify(cleanedSessions));

    // Unread message count
    var msgCount = 0;
    var ss = SS();
    var msgSh = ss.getSheetByName('Messages');
    if (msgSh) {
      var msgData = msgSh.getDataRange().getValues();
      for (var i = 1; i < msgData.length; i++) {
        var rec = msgData[i][2];
        var isRead = msgData[i][4];
        if (isRead !== true && isRead !== 'true') {
          if (td.role === 'admin' && rec === 'admin') msgCount++;
          else if (td.role === 'teacher' && rec === td.username) msgCount++;
        }
      }
    }

    // Unread notification count
    var notifCount = 0;
    var notifSh = ss.getSheetByName('Notifications');
    if (notifSh) {
      var notifData = notifSh.getDataRange().getValues();
      for (var i = 1; i < notifData.length; i++) {
        var rec = notifData[i][2];
        var isRead = notifData[i][5];
        if (isRead !== true && isRead !== 'true') {
          if (td.role === 'admin' && rec === 'admin') notifCount++;
          else if (td.role === 'teacher' && (rec === td.username || rec === 'all')) notifCount++;
        }
      }
    }
    
    return {success:true, activeCount: activeCount, activeUsers: activeUsers, msgCount: msgCount, notifCount: notifCount};
  } catch(e) {
    return {success:false, activeCount: 1, activeUsers: ['admin']};
  }
}

function recalculateClassSizes(ss) {
  try {
    var studentSheet = ss.getSheetByName('Students');
    var classSheet = ss.getSheetByName('Classes');
    if (!studentSheet || !classSheet) return;
    
    var studentsData = studentSheet.getDataRange().getValues();
    var classesData = classSheet.getDataRange().getValues();
    
    var classCounts = {};
    for (var i = 1; i < studentsData.length; i++) {
      var className = studentsData[i][3];
      if (className) {
        classCounts[className] = (classCounts[className] || 0) + 1;
      }
    }
    
    var updateValues = [];
    var changed = false;
    for (var j = 1; j < classesData.length; j++) {
      var className = classesData[j][0];
      var count = className ? (classCounts[className] || 0) : 0;
      updateValues.push([count]);
      if (Number(classesData[j][2] || 0) !== count) changed = true;
    }
    // PERF: skip the write (and the resulting cache invalidation) when nothing actually changed —
    // this function runs on every student add/update/delete, so a no-op write here would otherwise
    // needlessly hit the Sheets API and evict the Classes cache on every single mutation.
    if (updateValues.length > 0 && changed) {
      classSheet.getRange(2, 3, updateValues.length, 1).setValues(updateValues);
      invalidateClassesCache();
    }
  } catch(e) {
    Logger.log('Error recalculating class sizes: ' + e.message);
  }
}

function getUnreadMessageCount(token) {
  var td = getTokenData(token);
  if (!td) return {success: false, message: 'Unauthorized'};
  try {
    var ss = SS(), sh = ss.getSheetByName('Messages');
    if (!sh) return {success: true, count: 0};
    var data = sh.getDataRange().getValues();
    var count = 0;
    var username = td.username;
    var role = td.role;
    
    for (var i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      var s = data[i][1], r = data[i][2], ir = data[i][4];
      if (String(ir) === 'true') continue;
      
      if (role === 'admin') {
        if (r === 'admin') count++;
      } else if (role === 'teacher') {
        if ((r === username || r === 'All Teachers') && s !== username) count++;
      }
    }
    return {success: true, count: count};
  } catch(e) {
    return {success: false, message: e.message};
  }
}

function markMessagesAsRead(token, contact) {
  var td = getTokenData(token);
  if (!td) return {success: false, message: 'Unauthorized'};
  try {
    var ss = SS(), sh = ss.getSheetByName('Messages');
    if (!sh) return {success: true};
    var data = sh.getDataRange().getValues();
    var username = td.username;
    var role = td.role;
    
    for (var i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      var s = data[i][1], r = data[i][2], ir = data[i][4];
      if (String(ir) === 'true') continue;
      
      if (role === 'admin') {
        if (s === contact && r === 'admin') {
          sh.getRange(i + 1, 5).setValue(true);
        }
      } else if (role === 'teacher') {
        if (s === 'admin' && (r === username || r === 'All Teachers')) {
          sh.getRange(i + 1, 5).setValue(true);
        }
      }
    }
    return {success: true};
  } catch(e) {
    return {success: false, message: e.message};
  }
}

function getNotifications(token) {
  var td = getTokenData(token);
  if (!td) return {success: false, message: 'Unauthorized'};
  try {
    var ss = SS(), sh = ss.getSheetByName('Notifications');
    if (!sh) return {success: true, notifications: []};
    var data = sh.getDataRange().getValues(), list = [];
    var username = td.username;
    var role = td.role;
    
    for (var i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      var sender = data[i][1], receiver = data[i][2], title = data[i][3], msg = data[i][4], ir = data[i][5];
      
      if (role === 'admin' && receiver === 'admin') {
        list.push({
          Timestamp: data[i][0],
          Sender: sender,
          Receiver: receiver,
          Title: title,
          Message: msg,
          IsRead: ir
        });
      } else if (role === 'teacher' && (receiver === 'All Teachers' || receiver === username)) {
        list.push({
          Timestamp: data[i][0],
          Sender: sender,
          Receiver: receiver,
          Title: title,
          Message: msg,
          IsRead: ir
        });
      }
    }
    list.reverse();
    return {success: true, notifications: list};
  } catch(e) {
    return {success: false, message: e.message};
  }
}

function sendNotification(token, target, title, msg) {
  var td = getTokenData(token);
  if (!td || td.role !== 'admin') return {success: false, message: 'Unauthorized'};
  try {
    var ss = SS(), sh = ss.getSheetByName('Notifications');
    if (!sh) {
      sh = ss.insertSheet('Notifications');
      styleHeader(sh, ['Timestamp', 'Sender', 'Receiver', 'Title', 'Message', 'IsRead']);
    }
    sh.appendRow([new Date().toISOString(), 'admin', target, title, msg, false]);
    return {success: true};
  } catch(e) {
    return {success: false, message: e.message};
  }
}

function markNotificationsAsRead(token) {
  var td = getTokenData(token);
  if (!td) return {success: false, message: 'Unauthorized'};
  try {
    var ss = SS(), sh = ss.getSheetByName('Notifications');
    if (!sh) return {success: true};
    var data = sh.getDataRange().getValues();
    var username = td.username;
    var role = td.role;
    
    for (var i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      var receiver = data[i][2], ir = data[i][5];
      if (String(ir) === 'true') continue;
      
      if (role === 'admin' && receiver === 'admin') {
        sh.getRange(i + 1, 6).setValue(true);
      } else if (role === 'teacher' && (receiver === 'All Teachers' || receiver === username)) {
        sh.getRange(i + 1, 6).setValue(true);
      }
    }
    return {success: true};
  } catch(e) {
    return {success: false, message: e.message};
  }
}

function clearAllNotifications(token) {
  var td = getTokenData(token);
  if (!td) return {success: false, message: 'Unauthorized'};
  try {
    var ss = SS(), sh = ss.getSheetByName('Notifications');
    if (!sh) return {success: true};
    var data = sh.getDataRange().getValues();
    var username = td.username;
    var role = td.role;
    
    for (var i = data.length - 1; i >= 1; i--) {
      var receiver = data[i][2];
      if (role === 'admin' && receiver === 'admin') {
        sh.deleteRow(i + 1);
      } else if (role === 'teacher' && (receiver === 'All Teachers' || receiver === username)) {
        sh.deleteRow(i + 1);
      }
    }
    return {success: true};
  } catch(e) {
    return {success: false, message: e.message};
  }
}
// ==========================================
// ACADEMIC ROLLOVER MODULE
// ==========================================

// SAFETY NET: executeAcademicRollover / activateAcademicTerm / executeAutomaticPromotions all
// mutate the Students sheet in place — Class/Year/Term get overwritten for the new period, and
// Attendance/OutOf/Interest/Conduct/Attitude/remarks/fees get reset to 0/blank/defaults for it.
// The *outgoing* term's values only survive this if they'd already been explicitly archived via
// a Remarks & Conduct or Fees & Bills save — if staff simply never got around to pressing Save
// for a given student before the term rolled over, that student's data for the term just ended
// is gone forever, and later can't even be reconstructed for a historical report view. Call this
// once, right before the wipe, to snapshot every student's current (about-to-be-overwritten) row
// into RemarksArchive/FeesArchive under its own current Year/Term, so the term that's ending is
// always recoverable regardless of whether anyone happened to save it first.
function archiveOutgoingTermSnapshot(ss, data, headers) {
  try {
    var idIdx = headers.indexOf('ID'), nameIdx = headers.indexOf('Name'), classIdx = headers.indexOf('Class');
    var yearIdx = headers.indexOf('Year'), termIdx = headers.indexOf('Term');
    var attIdx = headers.indexOf('Attendance'), outIdx = headers.indexOf('OutOf');
    var intIdx = headers.indexOf('Interest'), condIdx = headers.indexOf('Conduct'), attitIdx = headers.indexOf('Attitude');
    var ctrIdx = headers.indexOf('ClassTeacherRemark'), htrIdx = headers.indexOf('HeadTeacherRemark');
    var promoIdx = headers.indexOf('PromotionStatus');
    var arrIdx = headers.indexOf('Arrears'), nxtIdx = headers.indexOf('NextTermFees'), fdIdx = headers.indexOf('FeeData');
    if (yearIdx < 0 || termIdx < 0 || idIdx < 0) return;

    var remarksArchive = ss.getSheetByName('RemarksArchive');
    if (!remarksArchive) {
      remarksArchive = ss.insertSheet('RemarksArchive');
      styleHeader(remarksArchive, ['StudentID', 'StudentName', 'Class', 'Year', 'Term', 'Attendance', 'OutOf', 'Interest', 'Conduct', 'Attitude', 'ClassTeacherRemark', 'HeadTeacherRemark', 'PromotionStatus']);
    }
    var remData = remarksArchive.getLastRow() > 1 ? remarksArchive.getDataRange().getValues() : [[]];
    var remMap = {};
    for (var r = 1; r < remData.length; r++) {
      if (!remData[r][0]) continue;
      remMap[remData[r][0] + '_' + remData[r][3] + '_' + remData[r][4]] = r + 1;
    }

    var feesArchive = ss.getSheetByName('FeesArchive');
    if (!feesArchive) {
      feesArchive = ss.insertSheet('FeesArchive');
      styleHeader(feesArchive, ['StudentID', 'StudentName', 'Class', 'Year', 'Term', 'Arrears', 'NextTermFees', 'FeeData']);
    }
    var feesData = feesArchive.getLastRow() > 1 ? feesArchive.getDataRange().getValues() : [[]];
    var feesMap = {};
    for (var r = 1; r < feesData.length; r++) {
      if (!feesData[r][0]) continue;
      feesMap[feesData[r][0] + '_' + feesData[r][3] + '_' + feesData[r][4]] = r + 1;
    }

    for (var i = 1; i < data.length; i++) {
      if (!data[i][idIdx]) continue;
      var sid = data[i][idIdx].toString();
      var yr = data[i][yearIdx], tm = data[i][termIdx];
      if (!yr || !tm) continue;
      var key = sid + '_' + yr + '_' + tm;

      var remRow = [
        sid, nameIdx>=0?data[i][nameIdx]:'', classIdx>=0?data[i][classIdx]:'', yr, tm,
        attIdx>=0?data[i][attIdx]:0, outIdx>=0?data[i][outIdx]:0,
        intIdx>=0?data[i][intIdx]:'', condIdx>=0?data[i][condIdx]:'', attitIdx>=0?data[i][attitIdx]:'',
        ctrIdx>=0?data[i][ctrIdx]:'', htrIdx>=0?data[i][htrIdx]:'', promoIdx>=0?data[i][promoIdx]:''
      ];
      if (remMap[key]) {
        remarksArchive.getRange(remMap[key], 1, 1, 13).setValues([remRow]);
      } else {
        remarksArchive.appendRow(remRow);
        remMap[key] = remarksArchive.getLastRow();
      }

      if (arrIdx >= 0 || nxtIdx >= 0 || fdIdx >= 0) {
        var feeRow = [
          sid, nameIdx>=0?data[i][nameIdx]:'', classIdx>=0?data[i][classIdx]:'', yr, tm,
          arrIdx>=0?data[i][arrIdx]:0, nxtIdx>=0?data[i][nxtIdx]:0, fdIdx>=0?data[i][fdIdx]:''
        ];
        if (feesMap[key]) {
          feesArchive.getRange(feesMap[key], 1, 1, 8).setValues([feeRow]);
        } else {
          feesArchive.appendRow(feeRow);
          feesMap[key] = feesArchive.getLastRow();
        }
      }
    }
  } catch(e) {
    Logger.log('archiveOutgoingTermSnapshot error: ' + e.message);
  }
}

// NOTE: not called from admin.html — the "Promote Students & Term Rollover" button uses
// executeAutomaticPromotions() below instead, which additionally syncs Settings.CURRENT_YEAR/
// CURRENT_TERM to the new period (this function does not). Left in place in case a caller
// outside the UI depends on its admin-supplied classMap, but be aware it will leave the "active"
// period out of sync with students' actual Year/Term if used as a substitute for the UI flow.
function executeAcademicRollover(token, config) {
  if (!validateAdminToken(token)) return {success: false, message: 'Unauthorized'};
  try {
    var ss = SS();
    var stuSheet = ss.getSheetByName('Students');
    if (!stuSheet) return {success: false, message: 'Students sheet not found.'};

    var data = stuSheet.getDataRange().getValues();
    if (data.length < 2) return {success: false, message: 'No students found.'};
    archiveOutgoingTermSnapshot(ss, data, data[0]);
    
    var headers = data[0];
    var classIdx = headers.indexOf('Class');
    var yearIdx = headers.indexOf('Year');
    var termIdx = headers.indexOf('Term');
    var promoIdx = headers.indexOf('PromotionStatus');
    
    var attIdx = headers.indexOf('Attendance');
    var outOfIdx = headers.indexOf('OutOf');
    var tsIdx = headers.indexOf('TotalScore');
    var avgIdx = headers.indexOf('Average');
    var intIdx = headers.indexOf('Interest');
    var condIdx = headers.indexOf('Conduct');
    var attitIdx = headers.indexOf('Attitude');
    var ctRemIdx = headers.indexOf('ClassTeacherRemark');
    var htRemIdx = headers.indexOf('HeadTeacherRemark');
    
    var newYear = config.newYear || '2025-2026';
    var classMap = config.classMap || {}; // e.g., {'Basic 1': 'Basic 2'}

    var countPromoted = 0;
    var countRepeated = 0;
    var countGraduated = 0;

    for (var i = 1; i < data.length; i++) {
      if (!data[i][0]) continue; // Skip empty rows
      
      var currentClass = data[i][classIdx] ? data[i][classIdx].toString().trim() : '';
      var promoStatus = promoIdx >= 0 && data[i][promoIdx] ? data[i][promoIdx].toString().trim() : '';
      
      var nextClass = currentClass;
      
      if (promoStatus === 'Graduated' || promoStatus === 'Withdrawn') {
        nextClass = promoStatus;
        countGraduated++;
      } else if (promoStatus === 'Repeated') {
        nextClass = currentClass; // Stays the same
        countRepeated++;
      } else {
        // Promoted or Blank
        if (classMap[currentClass]) {
          nextClass = classMap[currentClass];
        }
        countPromoted++;
      }

      // Prepare the row update
      // 1. Update Class, Year, Term
      if (classIdx >= 0) stuSheet.getRange(i + 1, classIdx + 1).setValue(nextClass);
      if (yearIdx >= 0) stuSheet.getRange(i + 1, yearIdx + 1).setValue(newYear);
      if (termIdx >= 0) stuSheet.getRange(i + 1, termIdx + 1).setValue('Term 1');
      
      // 2. Clear Term-Specific Data
      if (attIdx >= 0) stuSheet.getRange(i + 1, attIdx + 1).setValue(0);
      if (outOfIdx >= 0) stuSheet.getRange(i + 1, outOfIdx + 1).setValue(75);
      if (tsIdx >= 0) stuSheet.getRange(i + 1, tsIdx + 1).setValue(0);
      if (avgIdx >= 0) stuSheet.getRange(i + 1, avgIdx + 1).setValue(0);
      
      if (intIdx >= 0) stuSheet.getRange(i + 1, intIdx + 1).setValue('');
      if (condIdx >= 0) stuSheet.getRange(i + 1, condIdx + 1).setValue('');
      if (attitIdx >= 0) stuSheet.getRange(i + 1, attitIdx + 1).setValue('');
      if (ctRemIdx >= 0) stuSheet.getRange(i + 1, ctRemIdx + 1).setValue('');
      if (htRemIdx >= 0) stuSheet.getRange(i + 1, htRemIdx + 1).setValue('');
      if (promoIdx >= 0) stuSheet.getRange(i + 1, promoIdx + 1).setValue('');
    }

    recalculateClassSizes(ss);
    logServerAction(token, 'Academic Rollover', 'Rolled over to ' + newYear + '. P:' + countPromoted + ', R:' + countRepeated + ', G:' + countGraduated);
    
    return {
      success: true, 
      message: 'Rollover successful! Promoted: ' + countPromoted + ', Repeated: ' + countRepeated + ', Graduated/Withdrawn: ' + countGraduated
    };

  } catch (e) {
    return {success: false, message: e.message};
  }
}

// ==========================================
// ACADEMIC CALENDAR MODULE (YEARS & TERMS)
// ==========================================

function getAcademicCalendar(token) {
  if (!validateAdminToken(token)) return {success: false, message: 'Unauthorized'};
  try {
    var ss = SS();
    var settSheet = ss.getSheetByName('Settings');
    var data = settSheet ? settSheet.getDataRange().getValues() : [];
    
    var years = ['2024-2025', '2025-2026', '2026-2027'];
    var terms = ['Term 1', 'Term 2', 'Term 3'];
    var activeYear = '';
    var activeTerm = '';

    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === 'ALL_YEARS' && data[i][1]) {
        years = JSON.parse(data[i][1]);
      }
      if (data[i][0] === 'ALL_TERMS' && data[i][1]) {
        terms = JSON.parse(data[i][1]);
      }
      if (data[i][0] === 'CURRENT_YEAR') activeYear = data[i][1];
      if (data[i][0] === 'CURRENT_TERM') activeTerm = data[i][1];
    }
    
    // Auto-initialize Settings sheet keys if empty to prevent reload issues
    if (settSheet) {
      if (!activeYear) {
        activeYear = years[years.length - 1] || '2025-2026';
        settSheet.appendRow(['CURRENT_YEAR', activeYear]);
      }
      if (!activeTerm) {
        activeTerm = terms[0] || 'Term 1';
        settSheet.appendRow(['CURRENT_TERM', activeTerm]);
      }
    }
    
    return {success: true, years: years, terms: terms, activeYear: activeYear, activeTerm: activeTerm};
  } catch(e) {
    return {success: false, message: e.message};
  }
}

function updateAcademicList(token, key, list) {
  if (!validateAdminToken(token)) return {success: false, message: 'Unauthorized'};
  try {
    var ss = SS();
    var settSheet = ss.getSheetByName('Settings');
    if (!settSheet) return {success: false, message: 'Settings sheet not found.'};
    
    var data = settSheet.getDataRange().getValues();
    var found = false;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === key) {
        settSheet.getRange(i + 1, 2).setValue(JSON.stringify(list));
        found = true;
        break;
      }
    }
    if (!found) {
      settSheet.appendRow([key, JSON.stringify(list)]);
    }
    return {success: true};
  } catch(e) {
    return {success: false, message: e.message};
  }
}

function activateAcademicYear(token, year) {
  if (!validateAdminToken(token)) return {success: false, message: 'Unauthorized'};
  try {
    var ss = SS();
    var settSheet = ss.getSheetByName('Settings');
    var data = settSheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === 'CURRENT_YEAR') {
        settSheet.getRange(i + 1, 2).setValue(year);
        logServerAction(token, 'Activate Year', year);
        return {success: true, message: 'Academic Year ' + year + ' activated.'};
      }
    }
    settSheet.appendRow(['CURRENT_YEAR', year]);
    return {success: true, message: 'Academic Year ' + year + ' activated.'};
  } catch(e) {
    return {success: false, message: e.message};
  }
}

function activateAcademicTerm(token, term) {
  if (!validateAdminToken(token)) return {success: false, message: 'Unauthorized'};
  try {
    var ss = SS();
    var settSheet = ss.getSheetByName('Settings');
    var data = settSheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === 'CURRENT_TERM') {
        settSheet.getRange(i + 1, 2).setValue(term);
        break;
      }
    }
    
    // Clear student data for the new term
    var stuSheet = ss.getSheetByName('Students');
    if (stuSheet && stuSheet.getLastRow() > 1) {
      var stuData = stuSheet.getDataRange().getValues();
      archiveOutgoingTermSnapshot(ss, stuData, stuData[0]);
      var h = stuData[0];
      var tIdx = h.indexOf('Term');
      var attIdx = h.indexOf('Attendance');
      var tsIdx = h.indexOf('TotalScore');
      var avgIdx = h.indexOf('Average');
      var intIdx = h.indexOf('Interest');
      var condIdx = h.indexOf('Conduct');
      var attitIdx = h.indexOf('Attitude');
      var ctRemIdx = h.indexOf('ClassTeacherRemark');
      var htRemIdx = h.indexOf('HeadTeacherRemark');
      var pStatusIdx = h.indexOf('PromotionStatus');
      
      for (var r = 1; r < stuData.length; r++) {
        if (!stuData[r][0]) continue;
        if (tIdx >= 0) stuSheet.getRange(r + 1, tIdx + 1).setValue(term);
        if (attIdx >= 0) stuSheet.getRange(r + 1, attIdx + 1).setValue(0);
        if (tsIdx >= 0) stuSheet.getRange(r + 1, tsIdx + 1).setValue(0);
        if (avgIdx >= 0) stuSheet.getRange(r + 1, avgIdx + 1).setValue(0);
        if (intIdx >= 0) stuSheet.getRange(r + 1, intIdx + 1).setValue('');
        if (condIdx >= 0) stuSheet.getRange(r + 1, condIdx + 1).setValue('');
        if (attitIdx >= 0) stuSheet.getRange(r + 1, attitIdx + 1).setValue('');
        if (ctRemIdx >= 0) stuSheet.getRange(r + 1, ctRemIdx + 1).setValue('');
        if (htRemIdx >= 0) stuSheet.getRange(r + 1, htRemIdx + 1).setValue('');
        if (pStatusIdx >= 0) stuSheet.getRange(r + 1, pStatusIdx + 1).setValue('');
      }
    }
    
    logServerAction(token, 'Activate Term', term);
    return {success: true, message: 'Term ' + term + ' activated and student current term data cleared.'};
  } catch(e) {
    return {success: false, message: e.message};
  }
}


function executeAutomaticPromotions(token, targetYear, targetTerm) {
  if (!validateAdminToken(token)) return {success: false, message: 'Unauthorized'};
  try {
    var ss = SS();
    var stuSheet = ss.getSheetByName('Students');
    if (!stuSheet) return {success: false, message: 'Students sheet not found.'};

    // BUGFIX: this bumps every student up one class (Basic 4 -> Basic 5, etc.) and there was
    // nothing to stop it running twice against the same target — a double-click, a page refresh
    // that resubmits, or an admin re-running it "just to be sure" would silently promote every
    // student a *second* class (e.g. Basic 4 -> Basic 6) with no warning. If the school's active
    // period already matches the requested target, promotion for it has almost certainly already
    // run, so refuse and make the admin pick a different target instead of guessing.
    var currentPeriod = getActiveYearTerm(ss);
    if (String(currentPeriod.year) === String(targetYear) && String(currentPeriod.term) === String(targetTerm)) {
      return {success: false, message: 'The active academic period is already ' + targetYear + ' / ' + targetTerm + ' — promotions for it have most likely already been run. Pick a different target year/term if you really intend to promote again.'};
    }

    var data = stuSheet.getDataRange().getValues();
    if (data.length < 2) return {success: false, message: 'No students found.'};
    archiveOutgoingTermSnapshot(ss, data, data[0]);

    var headers = data[0];
    var classIdx = headers.indexOf('Class');
    var yearIdx = headers.indexOf('Year');
    var termIdx = headers.indexOf('Term');
    var promoIdx = headers.indexOf('PromotionStatus');

    var attIdx = headers.indexOf('Attendance');
    var outOfIdx = headers.indexOf('OutOf');
    var tsIdx = headers.indexOf('TotalScore');
    var avgIdx = headers.indexOf('Average');
    var intIdx = headers.indexOf('Interest');
    var condIdx = headers.indexOf('Conduct');
    var attitIdx = headers.indexOf('Attitude');
    var ctRemIdx = headers.indexOf('ClassTeacherRemark');
    var htRemIdx = headers.indexOf('HeadTeacherRemark');

    var countPromoted = 0;
    var countRepeated = 0;
    var countGraduated = 0;

    // Automatic class progression — shared with the report-SMS promotion note builder
    // (getNextClassName, defined near getReportCardUrl) so both places agree on the mapping.
    var getNextClass = getNextClassName;

    for (var i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      
      var currentClass = data[i][classIdx] ? data[i][classIdx].toString().trim() : '';
      var promoStatus = promoIdx >= 0 && data[i][promoIdx] ? data[i][promoIdx].toString().trim() : '';
      
      var nextClass = currentClass;
      
      if (promoStatus === 'Graduated' || promoStatus === 'Withdrawn' || promoStatus === 'Graduated / Alumni') {
        nextClass = 'Graduated / Alumni';
        countGraduated++;
      } else if (promoStatus === 'Repeated') {
        nextClass = currentClass; // Stays the same
        countRepeated++;
      } else {
        // Promoted or Blank -> Auto promote
        nextClass = getNextClass(currentClass);
        if (nextClass === 'Graduated / Alumni') {
          countGraduated++;
        } else {
          countPromoted++;
        }
      }

      // Update student record
      if (classIdx >= 0) stuSheet.getRange(i + 1, classIdx + 1).setValue(nextClass);
      if (yearIdx >= 0) stuSheet.getRange(i + 1, yearIdx + 1).setValue(targetYear);
      if (termIdx >= 0) stuSheet.getRange(i + 1, termIdx + 1).setValue(targetTerm);
      
      // Clear term specific data
      if (attIdx >= 0) stuSheet.getRange(i + 1, attIdx + 1).setValue(0);
      if (outOfIdx >= 0) stuSheet.getRange(i + 1, outOfIdx + 1).setValue(75);
      if (tsIdx >= 0) stuSheet.getRange(i + 1, tsIdx + 1).setValue(0);
      if (avgIdx >= 0) stuSheet.getRange(i + 1, avgIdx + 1).setValue(0);
      
      if (intIdx >= 0) stuSheet.getRange(i + 1, intIdx + 1).setValue('');
      if (condIdx >= 0) stuSheet.getRange(i + 1, condIdx + 1).setValue('');
      if (attitIdx >= 0) stuSheet.getRange(i + 1, attitIdx + 1).setValue('');
      if (ctRemIdx >= 0) stuSheet.getRange(i + 1, ctRemIdx + 1).setValue('');
      if (htRemIdx >= 0) stuSheet.getRange(i + 1, htRemIdx + 1).setValue('');
      if (promoIdx >= 0) stuSheet.getRange(i + 1, promoIdx + 1).setValue('');
    }

    // Set active settings on the system
    var ssSheet = ss.getSheetByName('Settings');
    if (ssSheet) {
      var settData = ssSheet.getDataRange().getValues();
      for (var s = 1; s < settData.length; s++) {
        if (settData[s][0] === 'CURRENT_YEAR') {
          ssSheet.getRange(s + 1, 2).setValue(targetYear);
        }
        if (settData[s][0] === 'CURRENT_TERM') {
          ssSheet.getRange(s + 1, 2).setValue(targetTerm);
        }
      }
    }

    recalculateClassSizes(ss);
    logServerAction(token, 'Academic Rollover & Promotion', 'Rolled over to ' + targetYear + ' (' + targetTerm + '). Promoted: ' + countPromoted + ', Repeated: ' + countRepeated + ', Graduated: ' + countGraduated);
    
    return {
      success: true, 
      message: 'Rollover successful! Promoted: ' + countPromoted + ', Repeated: ' + countRepeated + ', Graduated/Withdrawn: ' + countGraduated
    };

  } catch(e) {
    return {success: false, message: e.message};
  }
}


function getStudentPerformanceHistory(token, studentId) {
  if (!validateAdminToken(token)) return {success: false, message: 'Unauthorized'};
  try {
    var ss = SS();
    var classesSheet = ss.getSheetByName('Classes');
    if (!classesSheet) return {success: true, records: []};
    
    var classesD = classesSheet.getDataRange().getValues();
    var records = [];
    
    for (var c = 1; c < classesD.length; c++) {
      var className = classesD[c][0];
      if (!className) continue;
      
      var sh = ss.getSheetByName(className);
      if (!sh || sh.getLastRow() < 2) continue;
      
      var data = sh.getDataRange().getValues();
      var headers = data[0];
      
      var sidIdx = headers.indexOf('StudentID');
      var yrIdx = headers.indexOf('Year');
      var tmIdx = headers.indexOf('Term');
      var tsIdx = headers.indexOf('TotalScore');
      var avgIdx = headers.indexOf('Average');
      var posIdx = headers.indexOf('OverallPosition');
      
      for (var r = 1; r < data.length; r++) {
        if (data[r][sidIdx] && data[r][sidIdx].toString().trim() === studentId.toString().trim()) {
          records.push({
            Class: className,
            Year: yrIdx >= 0 ? data[r][yrIdx] : '',
            Term: tmIdx >= 0 ? data[r][tmIdx] : '',
            TotalScore: tsIdx >= 0 ? data[r][tsIdx] : 0,
            Average: avgIdx >= 0 ? data[r][avgIdx] : 0,
            OverallPosition: posIdx >= 0 ? data[r][posIdx] : ''
          });
        }
      }
    }
    
    records.sort(function(a, b) {
      if (a.Year !== b.Year) return b.Year.toString().localeCompare(a.Year.toString());
      return b.Term.toString().localeCompare(b.Term.toString());
    });
    
    return {success: true, records: records};
  } catch(e) {
    return {success: false, message: e.message};
  }
}


function getActiveYearTerm(ss) {
  var settSh = ss.getSheetByName('Settings'), data = settSh ? settSh.getDataRange().getValues() : [];
  var y = '', t = '';
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === 'CURRENT_YEAR') y = data[i][1];
    if (data[i][0] === 'CURRENT_TERM') t = data[i][1];
  }
  return {year: y || '2025-2026', term: t || 'Term 1'};
}


function getArchivedRecords(token, year, term, className) {
  var u = getTokenData(token);
  if (!u) return {success: false, message: 'Unauthorized'};
  try {
    var ss = SS();
    // Enforce teacher class restriction
    if (u.role === 'teacher') {
      className = u.assignedClass || '';
      if (!className) return {success: true, academics: [], fees: []};
    }
    var classesSheet = ss.getSheetByName('Classes');
    var classesD = classesSheet ? classesSheet.getDataRange().getValues() : [];
    
    var academics = [];
    for (var c = 1; c < classesD.length; c++) {
      var cn = classesD[c][0];
      if (!cn) continue;
      if (className && cn !== className) continue;
      
      var sh = ss.getSheetByName(cn);
      if (!sh || sh.getLastRow() < 2) continue;
      
      var data = sh.getDataRange().getValues();
      var headers = data[0];
      
      var sidIdx = headers.indexOf('StudentID');
      var snameIdx = headers.indexOf('StudentName');
      var yrIdx = headers.indexOf('Year');
      var tmIdx = headers.indexOf('Term');
      var tsIdx = headers.indexOf('TotalScore');
      var avgIdx = headers.indexOf('Average');
      var posIdx = headers.indexOf('OverallPosition');
      
      for (var r = 1; r < data.length; r++) {
        if (yrIdx >= 0 && data[r][yrIdx].toString().trim() === year.toString().trim() &&
            tmIdx >= 0 && data[r][tmIdx].toString().trim() === term.toString().trim()) {
          academics.push({
            StudentID: sidIdx >= 0 ? data[r][sidIdx].toString() : '',
            StudentName: snameIdx >= 0 ? data[r][snameIdx] : '',
            Class: cn,
            TotalScore: tsIdx >= 0 ? data[r][tsIdx] : 0,
            Average: avgIdx >= 0 ? data[r][avgIdx] : 0,
            OverallPosition: posIdx >= 0 ? data[r][posIdx] : ''
          });
        }
      }
    }
    
    var fees = [];
    var feesArchive = ss.getSheetByName('FeesArchive');
    if (feesArchive && feesArchive.getLastRow() > 1) {
      var feesData = feesArchive.getDataRange().getValues();
      var feesHeaders = feesData[0];
      
      var sidIdx = feesHeaders.indexOf('StudentID');
      var snameIdx = feesHeaders.indexOf('StudentName');
      var clsIdx = feesHeaders.indexOf('Class');
      var yrIdx = feesHeaders.indexOf('Year');
      var tmIdx = feesHeaders.indexOf('Term');
      var arrIdx = feesHeaders.indexOf('Arrears');
      var nxtIdx = feesHeaders.indexOf('NextTermFees');
      var fdIdx = feesHeaders.indexOf('FeeData');
      
      for (var r = 1; r < feesData.length; r++) {
        if (yrIdx >= 0 && feesData[r][yrIdx].toString().trim() === year.toString().trim() &&
            tmIdx >= 0 && feesData[r][tmIdx].toString().trim() === term.toString().trim()) {
          var cn = clsIdx >= 0 ? feesData[r][clsIdx] : '';
          if (className && cn !== className) continue;
          
          fees.push({
            StudentID: sidIdx >= 0 ? feesData[r][sidIdx].toString() : '',
            StudentName: snameIdx >= 0 ? feesData[r][snameIdx] : '',
            Class: cn,
            Arrears: arrIdx >= 0 ? feesData[r][arrIdx] : 0,
            NextTermFees: nxtIdx >= 0 ? feesData[r][nxtIdx] : 0,
            FeeData: fdIdx >= 0 ? feesData[r][fdIdx] : '{}'
          });
        }
      }
    }
    
    if (fees.length === 0) {
      var period = getActiveYearTerm(ss);
      if (year.toString() === period.year.toString() && term === period.term) {
        var stuSh = ss.getSheetByName('Students');
        if (stuSh && stuSh.getLastRow() > 1) {
          var stuD = stuSh.getDataRange().getValues();
          var h = stuD[0];
          for (var i = 1; i < stuD.length; i++) {
            if (!stuD[i][0]) continue;
            var cn = stuD[i][3];
            if (className && cn !== className) continue;
            fees.push({
              StudentID: stuD[i][0].toString(),
              StudentName: stuD[i][1],
              Class: cn,
              Arrears: stuD[i][18] || 0,
              NextTermFees: stuD[i][19] || 0,
              FeeData: stuD[i][20] || '{}'
            });
          }
        }
      }
    }
    
    return {success: true, academics: academics, fees: fees};
  } catch(e) {
    return {success: false, message: e.message};
  }
}


function ensureDefaultGradingGeneral(ss) {
  var grdSheet = ss.getSheetByName('Grading');
  if (!grdSheet) return;
  var data = grdSheet.getDataRange().getValues();
  var hasNewGeneral = false;
  for (var i = 1; i < data.length; i++) {
    if (data[i][2] === 'HP' && data[i][5] === 'General') {
      hasNewGeneral = true;
      break;
    }
  }
  if (!hasNewGeneral) {
    var newRows = [];
    for (var i = 1; i < data.length; i++) {
      if (data[i][5] === 'JHS') {
        newRows.push([data[i][0], data[i][1], data[i][2], data[i][3], data[i][4], data[i][5]]);
      }
    }
    var newGen = [
      [85, 100, 'HP', 'Highly Proficient (HP)', 'Consistently demonstrates required knowledge and skills', 'General'],
      [65, 84, 'P', 'Proficient (P)', 'Most learning goals achieved', 'General'],
      [35, 64, 'AP', 'Approaching Proficiency (AP)', 'Developing understanding, needs intervention', 'General'],
      [0, 34, 'B', 'Beginning (B)', 'Significant difficulty meeting learning expectations', 'General']
    ];
    newRows = newGen.concat(newRows);
    if (grdSheet.getLastRow() > 1) {
      grdSheet.deleteRows(2, grdSheet.getLastRow() - 1);
    }
    newRows.forEach(function(r) {
      grdSheet.appendRow(r);
    });
  }
}