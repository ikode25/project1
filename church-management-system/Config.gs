/**
 * Config.gs
 * Central configuration: sheet schema, roles/permissions, app constants.
 * Nothing here talks to Sheets/Drive directly — SheetService.gs and Setup.gs do that.
 */

var APP_NAME = 'ChurchMS';
var APP_TAGLINE = 'Advanced Church Management System';

// Script Properties keys
var PROP_SPREADSHEET_ID = 'CHURCHMS_SPREADSHEET_ID';
var PROP_BACKUP_FOLDER_ID = 'CHURCHMS_BACKUP_FOLDER_ID';
var PROP_ATTACHMENTS_FOLDER_ID = 'CHURCHMS_ATTACHMENTS_FOLDER_ID';

/** One tab per entity. Header row = schema. First column is always "ID". */
var SHEETS = {
  MEMBERS: 'Members',
  MEMBER_STATUS_HISTORY: 'MemberStatusHistory',
  VISITORS: 'Visitors',
  ATTENDANCE: 'Attendance',
  FINANCE: 'Finance',
  CAMPAIGNS: 'Campaigns',
  PLEDGES: 'Pledges',
  EXPENSES: 'Expenses',
  SMS_LOG: 'SMS_Log',
  SMS_TEMPLATES: 'SMS_Templates',
  EQUIPMENT: 'Equipment',
  PRAYER_REQUESTS: 'PrayerRequests',
  MESSAGE_THREADS: 'MessageThreads',
  MESSAGES: 'Messages',
  CLUSTERS: 'Clusters',
  CLUSTER_FOLLOWUPS: 'ClusterFollowUps',
  USERS: 'Users',
  AUDIT_LOG: 'AuditLog',
  ERRORS: 'Errors',
  RATE_LIMITS: 'RateLimits',
  SETTINGS: 'Settings'
};

/** Header rows per sheet, in column order. Column A is always the record ID. */
var SCHEMA = {};
SCHEMA[SHEETS.MEMBERS] = ['ID', 'FirstName', 'LastName', 'Gender', 'DOB', 'Phone', 'Email', 'Address',
  'MaritalStatus', 'EmergencyContactName', 'EmergencyContactPhone', 'MembershipStatus', 'MembershipDate',
  'MembershipClass', 'Cluster', 'Department', 'PhotoFileId', 'DocumentLinks', 'CustomFields', 'SmsOptOut',
  'Notes', 'CreatedAt', 'CreatedBy', 'UpdatedAt', 'UpdatedBy'];

SCHEMA[SHEETS.MEMBER_STATUS_HISTORY] = ['ID', 'MemberID', 'MemberName', 'OldStatus', 'NewStatus', 'Reason', 'ChangedBy', 'ChangedAt'];

SCHEMA[SHEETS.VISITORS] = ['ID', 'FirstName', 'LastName', 'Phone', 'Email', 'Address', 'VisitDate', 'HowHeard',
  'Interest', 'FollowUpStatus', 'AssignedTo', 'Notes', 'ConvertedMemberID', 'CreatedAt', 'CreatedBy'];

SCHEMA[SHEETS.ATTENDANCE] = ['ID', 'MemberID', 'MemberName', 'ServiceType', 'ServiceDate', 'CheckInTime',
  'CheckInMethod', 'RecordedBy', 'Notes'];

SCHEMA[SHEETS.FINANCE] = ['ID', 'Type', 'DonorMemberID', 'DonorName', 'Amount', 'PaymentMethod', 'CampaignID',
  'Recurring', 'Date', 'ReceiptNumber', 'RecordedBy', 'Notes', 'CreatedAt'];

SCHEMA[SHEETS.CAMPAIGNS] = ['ID', 'Name', 'Goal', 'StartDate', 'EndDate', 'Status', 'CreatedAt'];

SCHEMA[SHEETS.PLEDGES] = ['ID', 'MemberID', 'MemberName', 'CampaignID', 'CampaignName', 'PledgedAmount',
  'StartDate', 'EndDate', 'Status', 'Notes', 'CreatedAt', 'CreatedBy'];

SCHEMA[SHEETS.EXPENSES] = ['ID', 'Category', 'Department', 'Description', 'Amount', 'Date', 'Status',
  'RequestedBy', 'ApprovedBy', 'ReceiptFileId', 'BudgetLine', 'CreatedAt'];

SCHEMA[SHEETS.SMS_LOG] = ['ID', 'RecipientPhone', 'RecipientMemberID', 'RecipientName', 'MessageBody', 'Provider',
  'Status', 'SentAt', 'ScheduledFor', 'GroupLabel', 'ErrorDetail', 'CreatedBy'];

SCHEMA[SHEETS.SMS_TEMPLATES] = ['ID', 'Name', 'Body', 'CreatedAt', 'CreatedBy'];

SCHEMA[SHEETS.EQUIPMENT] = ['ID', 'Name', 'Category', 'SerialNumber', 'Status', 'Location', 'AssignedTo',
  'PurchaseDate', 'Condition', 'Notes', 'CreatedAt'];

SCHEMA[SHEETS.PRAYER_REQUESTS] = ['ID', 'RequesterName', 'RequesterContact', 'RequestText', 'Visibility',
  'Status', 'AssignedTo', 'ResponseNotes', 'SubmittedAt'];

SCHEMA[SHEETS.MESSAGE_THREADS] = ['ID', 'Type', 'Name', 'Participants', 'CreatedAt', 'CreatedBy'];

SCHEMA[SHEETS.MESSAGES] = ['ID', 'ThreadID', 'FromUser', 'Body', 'Attachments', 'SentAt', 'ReadBy'];

SCHEMA[SHEETS.CLUSTERS] = ['ID', 'Name', 'LeaderMemberID', 'LeaderName', 'MeetingDay', 'Location', 'Status',
  'Notes', 'CreatedAt'];

SCHEMA[SHEETS.CLUSTER_FOLLOWUPS] = ['ID', 'ClusterID', 'ClusterName', 'MemberID', 'MemberName', 'FollowUpDate',
  'Type', 'Notes', 'Outcome', 'FollowedUpBy', 'CreatedAt'];

SCHEMA[SHEETS.USERS] = ['ID', 'Email', 'FullName', 'Role', 'Active', 'Phone', 'CreatedAt', 'LastLogin'];

SCHEMA[SHEETS.AUDIT_LOG] = ['ID', 'Timestamp', 'UserEmail', 'Action', 'Entity', 'RecordID', 'Details'];

SCHEMA[SHEETS.ERRORS] = ['ID', 'Timestamp', 'FunctionName', 'Message', 'Stack'];

SCHEMA[SHEETS.RATE_LIMITS] = ['ID', 'Bucket', 'Timestamp'];

SCHEMA[SHEETS.SETTINGS] = ['Key', 'Value', 'Description'];

/** Roles */
var ROLES = {
  SUPER_ADMIN: 'SuperAdmin',
  ADMIN: 'Admin',
  FINANCE_OFFICER: 'FinanceOfficer',
  CLUSTER_LEADER: 'ClusterLeader',
  COMMUNICATION_OFFICER: 'CommunicationOfficer',
  VIEWER: 'Viewer'
};
var ALL_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.FINANCE_OFFICER, ROLES.CLUSTER_LEADER,
  ROLES.COMMUNICATION_OFFICER, ROLES.VIEWER];

/** Which roles may access (view) and mutate (create/update/delete) each module. SuperAdmin always has full access. */
var MODULE_PERMISSIONS = {
  dashboard: { view: ALL_ROLES, mutate: [] },
  members: { view: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.CLUSTER_LEADER], mutate: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },
  visitors: { view: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.CLUSTER_LEADER], mutate: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.CLUSTER_LEADER] },
  attendance: { view: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.CLUSTER_LEADER], mutate: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.CLUSTER_LEADER] },
  finance: { view: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.FINANCE_OFFICER], mutate: [ROLES.SUPER_ADMIN, ROLES.FINANCE_OFFICER] },
  sms: { view: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.COMMUNICATION_OFFICER], mutate: [ROLES.SUPER_ADMIN, ROLES.COMMUNICATION_OFFICER] },
  equipment: { view: [ROLES.SUPER_ADMIN, ROLES.ADMIN], mutate: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },
  reports: { view: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.FINANCE_OFFICER], mutate: [] },
  settings: { view: [ROLES.SUPER_ADMIN, ROLES.ADMIN], mutate: [ROLES.SUPER_ADMIN] },
  cluster: { view: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.CLUSTER_LEADER], mutate: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.CLUSTER_LEADER] }
};

/** ID prefixes per entity */
var ID_PREFIX = {
  MEMBERS: 'MEM', MEMBER_STATUS_HISTORY: 'MSH', VISITORS: 'VIS', ATTENDANCE: 'ATT', FINANCE: 'FIN',
  CAMPAIGNS: 'CMP', PLEDGES: 'PLG', EXPENSES: 'EXP', SMS_LOG: 'SMS', SMS_TEMPLATES: 'TPL', EQUIPMENT: 'EQP',
  PRAYER_REQUESTS: 'PRY', MESSAGE_THREADS: 'THR', MESSAGES: 'MSG', CLUSTERS: 'CLU', CLUSTER_FOLLOWUPS: 'FUP',
  USERS: 'USR'
};

/** Default Settings sheet seed values */
var DEFAULT_SETTINGS = [
  ['OrgName', 'Grace Community Church', 'Name shown in sidebar and reports'],
  ['OrgLogoFileId', '', 'Google Drive file ID of the org logo'],
  ['ThemeMode', 'green', 'UI theme palette key'],
  ['SmsProvider', 'arkesel', 'arkesel | hubtel | custom'],
  ['Sms_Arkesel_ApiKey', '', 'Arkesel API key'],
  ['Sms_Arkesel_SenderId', 'ChurchMS', 'Arkesel approved sender ID'],
  ['Sms_Hubtel_ClientId', '', 'Hubtel client ID'],
  ['Sms_Hubtel_ClientSecret', '', 'Hubtel client secret'],
  ['Sms_Hubtel_SenderId', 'ChurchMS', 'Hubtel approved sender ID'],
  ['Sms_Hubtel_From', '', 'Hubtel account "from" number if required'],
  ['Sms_Custom_Endpoint', '', 'Custom SMS provider HTTP endpoint'],
  ['Sms_Custom_Method', 'POST', 'HTTP method for custom provider'],
  ['Sms_Custom_ApiKey', '', 'Custom provider API key / bearer token'],
  ['Sms_Custom_PhoneField', 'to', 'JSON field name the custom provider expects for phone number'],
  ['Sms_Custom_MessageField', 'message', 'JSON field name the custom provider expects for message body'],
  ['AbsenceThresholdWeeks', '3', 'Consecutive missed Sundays before an absence notification fires'],
  ['CustomFieldsConfig', '[]', 'JSON array of admin-defined extra Member fields'],
  ['BackupFolderId', '', 'Drive folder ID for scheduled spreadsheet backups'],
  ['RetentionYears', '7', 'Years to retain archived records before purge eligibility'],
  ['CheckInWindowMinutes', '180', 'Minutes a check-in QR/link stays valid for a given service']
];

/** Dropdown option lists used for data validation + frontend selects */
var OPTIONS = {
  GENDER: ['Male', 'Female'],
  MARITAL_STATUS: ['Single', 'Married', 'Divorced', 'Widowed'],
  MEMBERSHIP_STATUS: ['New', 'Active', 'Inactive', 'Transferred', 'Deceased'],
  FOLLOW_UP_STATUS: ['New', 'Contacted', 'Converted', 'Closed'],
  SERVICE_TYPE: ['Sunday Service', 'Midweek Service', 'Prayer Meeting', 'Youth Service', 'Special Event'],
  CHECKIN_METHOD: ['QR', 'Manual'],
  PAYMENT_METHOD: ['Cash', 'Mobile Money', 'Bank Transfer', 'Card', 'Cheque'],
  FINANCE_TYPE: ['Tithe', 'Offering', 'Donation', 'Pledge Payment'],
  PLEDGE_STATUS: ['Active', 'Fulfilled', 'Overdue', 'Cancelled'],
  EXPENSE_STATUS: ['Pending', 'Approved', 'Rejected'],
  EQUIPMENT_STATUS: ['Available', 'In Use', 'Maintenance', 'Retired'],
  EQUIPMENT_CONDITION: ['Excellent', 'Good', 'Fair', 'Poor'],
  PRAYER_VISIBILITY: ['Private', 'Prayer Team', 'Public'],
  PRAYER_STATUS: ['New', 'In Progress', 'Answered', 'Closed'],
  SMS_STATUS: ['Sent', 'Failed', 'Pending', 'Scheduled'],
  CLUSTER_STATUS: ['Active', 'Inactive'],
  FOLLOWUP_TYPE: ['Visit', 'Call', 'Message']
};
