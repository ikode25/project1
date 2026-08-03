/**
 * Developed by Mohammad Rameez Imdad (Rameez Scripts)
 * WhatsApp: https://wa.me/923224083545 (For Custom Projects)
 * YouTube: https://www.youtube.com/@rameezimdad (Subscribe for more!)
 */

// ============== Config ==============
var USERS_SHEET = 'Users';
var CLASSES_SHEET = 'Classes';
var SUBJECTS_SHEET = 'Subjects';
var ASSIGNMENTS_SHEET = 'Teacher_Assignments';
var STUDENTS_SHEET = 'Students';
var PARENTS_SHEET = 'Parents';
var PARENT_STUDENTS_SHEET = 'Parent_Students';
var EXAMS_SHEET = 'Exams';
var MARKS_SHEET = 'Marks';
var ATTENDANCE_SHEET = 'Attendance';
var FEE_STRUCTURE_SHEET = 'Fee_Structure';
var FEE_PAYMENTS_SHEET = 'Fee_Payments';
var FEE_DUES_SHEET = 'Fee_Dues';
var DISCIPLINE_SHEET = 'Discipline';
var CONDUCT_SHEET = 'Conduct';
var REPORT_REMARKS_SHEET = 'Report_Remarks';
var ACTIVITIES_SHEET = 'Activities';
var COMPLAINTS_SHEET = 'Complaints';
var NOTICES_SHEET = 'Notices';
var HELPDESK_SHEET = 'Helpdesk_Tickets';
var LESSON_PLANS_SHEET = 'Lesson_Plans';
var TEACHING_LOGBOOK_SHEET = 'Teaching_Logbook';
var DOCUMENTS_SHEET = 'Documents';
var PERIODS_SHEET = 'School_Periods';
var TIMETABLE_SHEET = 'Timetable';
var SETTINGS_SHEET = 'School_Settings';
var CALENDAR_SHEET = 'School_Calendar';
var PTM_SLOTS_SHEET = 'PTM_Slots';
var PTM_BOOKINGS_SHEET = 'PTM_Bookings';
var SUBSTITUTES_SHEET = 'Substitutes';
var ASSETS_SHEET = 'Assets';
var ASSET_MAINTENANCE_SHEET = 'Asset_Maintenance';
var STOCK_ITEMS_SHEET = 'Stock_Items';
var STOCK_TRANSACTIONS_SHEET = 'Stock_Transactions';
var LOGS_SHEET = 'Logs';
var ADMISSIONS_SHEET = 'Admissions';
var ACCOUNT_TXN_SHEET = 'Account_Transactions';
var SMS_LOG_SHEET = 'SMS_Log';
var SMS_TEMPLATES_SHEET = 'SMS_Templates';
var ASSETS_FOLDER_NAME = 'ASSETS';

// neutral graduation-cap placeholder (inline SVG) — schools replace this via School Settings > Logo
var DEFAULT_LOGO = 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20rx%3D%2214%22%20fill%3D%22%23001f3f%22%2F%3E%3Cpath%20d%3D%22M50%2022%20L88%2038%20L50%2054%20L12%2038%20Z%22%20fill%3D%22%23ffd166%22%2F%3E%3Cpath%20d%3D%22M28%2046%20v18%20c0%206%2010%2012%2022%2012%20s22%20-6%2022%20-12%20v-18%20L50%2054%20Z%22%20fill%3D%22%23ffffff%22%2F%3E%3Ccircle%20cx%3D%2288%22%20cy%3D%2238%22%20r%3D%223%22%20fill%3D%22%23ffd166%22%2F%3E%3Cline%20x1%3D%2288%22%20y1%3D%2238%22%20x2%3D%2288%22%20y2%3D%2258%22%20stroke%3D%22%23ffd166%22%20stroke-width%3D%222%22%2F%3E%3C%2Fsvg%3E';

// cols: 0=ID, 1=Username, 2=FullName, 3=Email, 4=Password, 5=Mobile, 6=Role, 7=Gender,
//       8=DateOfBirth, 9=Qualification, 10=Specialization, 11=JoiningDate, 12=ProfilePhoto,
//       13=Address, 14=Status, 15=LastLogin, 16=IsDeleted, 17=ThemeMode, 18=CustomColors,
//       19=CreatedAt, 20=CreatedBy, 21=UpdatedAt, 22=UpdatedBy,
//       23=EmployeeCode (UNIQUE staff ID), 24=EmergencyContactName, 25=EmergencyContactPhone
var USER_HEADERS = ['ID','Username','FullName','Email','Password','Mobile','Role','Gender','DateOfBirth','Qualification','Specialization','JoiningDate','ProfilePhoto','Address','Status','LastLogin','IsDeleted','ThemeMode','CustomColors','CreatedAt','CreatedBy','UpdatedAt','UpdatedBy','EmployeeCode','EmergencyContactName','EmergencyContactPhone'];

// classes cols: 0=ID, 1=ClassName, 2=Section, 3=AcademicYear, 4=ClassTeacherID,
//               5=TotalStrength, 6=IsDeleted, 7=CreatedAt, 8=UpdatedAt,
//               9=GradeLevel (0=Creche/Nursery/KG, 1-6=Basic 1-6, 7-9=JHS 1-3),
//               10=ClassCode, 11=CurriculumStage (creche|nursery|kg|lower_primary|upper_primary|jhs),
//               12=MediumOfInstruction, 13=SubjectStream, 14=MaxCapacity, 15=RoomNumber, 16=Building,
//               17=AssistantTeacherID, 18=IsActive, 19=Shift (morning|afternoon|evening|full_day)
// UNIQUE(ClassName, Section, AcademicYear, Shift)
var CLASS_HEADERS = ['ID','ClassName','Section','AcademicYear','ClassTeacherID','TotalStrength','IsDeleted','CreatedAt','UpdatedAt','GradeLevel','ClassCode','CurriculumStage','MediumOfInstruction','SubjectStream','MaxCapacity','RoomNumber','Building','AssistantTeacherID','IsActive','Shift'];

// subjects cols: 0=ID, 1=SubjectName, 2=SubjectCode, 3=ClassID (FK), 4=MaxMarks,
//                5=IsDeleted, 6=CreatedAt, 7=UpdatedAt,
//                8=PassMarks, 9=SubjectType (theory/practical/both/oral/project),
//                10=TheoryMaxMarks, 11=PracticalMaxMarks,
//                12=TheoryPassMarks, 13=PracticalPassMarks, 14=IsActive,
//                15=IsOptional (0/1 — elective vs core), 16=SubjectGroup (sciences/languages/arts/etc)
// UNIQUE(SubjectCode, ClassID)
var SUBJECT_HEADERS = ['ID','SubjectName','SubjectCode','ClassID','MaxMarks','IsDeleted','CreatedAt','UpdatedAt','PassMarks','SubjectType','TheoryMaxMarks','PracticalMaxMarks','TheoryPassMarks','PracticalPassMarks','IsActive','IsOptional','SubjectGroup'];

// teacher_assignments cols: 0=ID, 1=TeacherID (FK→Users), 2=ClassID (FK→Classes),
//                           3=SubjectID (FK→Subjects), 4=AcademicYear, 5=IsClassTeacher,
//                           6=CreatedAt, 7=UpdatedAt, 8=PeriodsPerWeek (int 0..40)
// UNIQUE(TeacherID, ClassID, SubjectID, AcademicYear) — hard delete per schema (no is_deleted)
var ASSIGNMENT_HEADERS = ['ID','TeacherID','ClassID','SubjectID','AcademicYear','IsClassTeacher','CreatedAt','UpdatedAt','PeriodsPerWeek'];

// students cols (65):
// 0=ID, 1=AdmissionNumber, 2=FirstName, 3=MiddleName, 4=LastName, 5=Gender, 6=DateOfBirth,
// 7=BloodGroup, 8=GhanaCardNumber (national ID, format GHA-XXXXXXXXX-X), 9=Mobile, 10=Email,
// 11=AddressLine, 12=City, 13=Region (one of Ghana's 16 regions), 14=GhanaPostGPS (digital address, e.g. GA-183-8541),
// 15=FatherName, 16=FatherOccupation, 17=FatherMobile, 18=MotherName, 19=MotherOccupation, 20=MotherMobile,
// 21=GuardianName, 22=GuardianRelation, 23=GuardianMobile, 24=AdmissionDate, 25=ClassID, 26=RollNumber,
// 27=Category (day|boarding), 28=Religion, 29=PreviousSchool, 30=TransportRequired, 31=TransportRoute, 32=MedicalNotes,
// 33=PhotoURL, 34=LoginPasswordHash, 35=Status, 36=IsDeleted, 37=CreatedAt, 38=UpdatedAt,
// intl/safeguarding (39-60):
// 39=Nationality, 40=SecondNationality, 41=CountryOfBirth, 42=PreferredName,
// 43=PassportNumber, 44=PassportExpiry, 45=VisaType, 46=VisaExpiry,
// 47=MotherTongue, 48=HomeLanguage, 49=EnglishProficiency (CEFR), 50=CurriculumTrack,
// 51=CustodyArrangement, 52=PrimaryContactParent, 53=AuthorizedPickupPersons, 54=MediaConsent (0/1),
// 55=DietaryRequirements (CSV), 56=Allergies, 57=InsuranceProvider, 58=InsurancePolicyExpiry,
// 59=HouseName, 60=AdmissionType,
// finance/welfare (61-62):
// 61=ConcessionPercent (0..100, fee waiver/scholarship %), 62=SpecialNeeds (CSV: SEN flags / IEP / accommodations / '' if none)
// BECE (63-64) — populated for JHS3 candidates ahead of the national exam:
// 63=BECEIndexNumber (WAEC candidate index number, '' until issued), 64=NHISNumber (National Health Insurance number, optional)
// UNIQUE: AdmissionNumber, GhanaCardNumber (when not null), (ClassID, RollNumber, Status)
var STUDENT_HEADERS = ['ID','AdmissionNumber','FirstName','MiddleName','LastName','Gender','DateOfBirth','BloodGroup','GhanaCardNumber','Mobile','Email','AddressLine','City','Region','GhanaPostGPS','FatherName','FatherOccupation','FatherMobile','MotherName','MotherOccupation','MotherMobile','GuardianName','GuardianRelation','GuardianMobile','AdmissionDate','ClassID','RollNumber','Category','Religion','PreviousSchool','TransportRequired','TransportRoute','MedicalNotes','PhotoURL','LoginPasswordHash','Status','IsDeleted','CreatedAt','UpdatedAt','Nationality','SecondNationality','CountryOfBirth','PreferredName','PassportNumber','PassportExpiry','VisaType','VisaExpiry','MotherTongue','HomeLanguage','EnglishProficiency','CurriculumTrack','CustodyArrangement','PrimaryContactParent','AuthorizedPickupPersons','MediaConsent','DietaryRequirements','Allergies','InsuranceProvider','InsurancePolicyExpiry','HouseName','AdmissionType','ConcessionPercent','SpecialNeeds','BECEIndexNumber','NHISNumber'];

// account_transactions cols (13) — day-book for non-fee income & expenses (donations, rent, fines, salary, utilities, supplies...)
// 0=ID, 1=TxnDate (YYYY-MM-DD), 2=TxnType (income|expense), 3=Category (from matching enum list),
// 4=Description, 5=Amount (num>0), 6=PaymentMode (cash|cheque|online|mobile_money|card|bank_transfer), 7=ReferenceNo (opt),
// 8=PartyName (opt), 9=RecordedBy (FK→Users), 10=IsDeleted (0/1), 11=CreatedAt, 12=UpdatedAt
var ACCOUNT_TXN_HEADERS = ['ID','TxnDate','TxnType','Category','Description','Amount','PaymentMode','ReferenceNo','PartyName','RecordedBy','IsDeleted','CreatedAt','UpdatedAt'];

// admissions cols (56) — admission pipeline: register → confirm → enroll (+ rejected/cancelled side states)
// 0=ID, 1=RegistrationNumber (REG-YYYY-NNNN, UNIQUE), 2=FirstName, 3=MiddleName, 4=LastName, 5=Gender, 6=DateOfBirth,
// 7=AppliedForClassID (FK opt), 8=AppliedForGrade (int opt), 9=AdmissionType (new|transfer|re_admission),
// 10=PreviousSchool, 11=TransferCertificateNumber, 12=LastClassAttended,
// 13=AddressLine, 14=City, 15=Region, 16=GhanaPostGPS,
// 17=FatherName, 18=FatherMobile, 19=MotherName, 20=MotherMobile, 21=GuardianName, 22=GuardianRelation, 23=GuardianMobile,
// 24=Email, 25=Mobile,
// 26=AcademicYear, 27=RegistrationDate, 28=RegistrationFee, 29=RegistrationFeeMode, 30=RegistrationFeeReceiptNo (REGF-...),
// 31=Status (registered|admitted|enrolled|rejected|cancelled),
// 32=BloodGroup, 33=Religion, 34=Category, 35=MedicalNotes,
// 36=AdmissionFee, 37=AdmissionFeeMode, 38=AdmissionFeeReceiptNo (ADMF-...), 39=AdmissionConfirmedDate,
// 40=AllottedClassID (FK), 41=RollNumber, 42=AdmissionNumber, 43=AdmissionDate, 44=EntryPoint (session_start|mid_session), 45=TransportRequired (0/1), 46=TransportRoute,
// 47=LinkedStudentID (FK→Students once enrolled), 48=FeePaymentID (FK→Fee_Payments — admission fee receipt),
// 49=RejectionReason, 50=Remarks, 51=ProcessedBy (FK→Users), 52=IsDeleted, 53=CreatedAt, 54=UpdatedAt,
// 55=PhotoURL (set via photo picker, stored in Drive)
var ADMISSION_HEADERS = ['ID','RegistrationNumber','FirstName','MiddleName','LastName','Gender','DateOfBirth','AppliedForClassID','AppliedForGrade','AdmissionType','PreviousSchool','TransferCertificateNumber','LastClassAttended','AddressLine','City','Region','GhanaPostGPS','FatherName','FatherMobile','MotherName','MotherMobile','GuardianName','GuardianRelation','GuardianMobile','Email','Mobile','AcademicYear','RegistrationDate','RegistrationFee','RegistrationFeeMode','RegistrationFeeReceiptNo','Status','BloodGroup','Religion','Category','MedicalNotes','AdmissionFee','AdmissionFeeMode','AdmissionFeeReceiptNo','AdmissionConfirmedDate','AllottedClassID','RollNumber','AdmissionNumber','AdmissionDate','EntryPoint','TransportRequired','TransportRoute','LinkedStudentID','FeePaymentID','RejectionReason','Remarks','ProcessedBy','IsDeleted','CreatedAt','UpdatedAt','PhotoURL'];

// parents cols (32):
// 0=ID, 1=FullName, 2=Email (UNIQUE when populated), 3=Mobile (UNIQUE always),
// 4=PasswordHash (plain per Apps Script rule), 5=Relation (father/mother/guardian),
// 6=Occupation, 7=Address, 8=LastLogin, 9=Status, 10=IsDeleted, 11=CreatedAt, 12=UpdatedAt,
// 13=Nationality, 14=CountryOfResidence, 15=PreferredLanguage (en/fr/es/zh/ar/ru/ko/ja/pt/de/it/hi/ur/bn/ta/ms/id/th/vi/other),
// 16=PreferredContactMethod (email/sms/whatsapp/phone/app), 17=WhatsAppNumber, 18=TimeZone (IANA),
// 19=Employer, 20=JobTitle, 21=WorkEmail, 22=WorkPhone,
// 23=PreferredBillingContact (0/1), 24=NotificationPreferences (CSV: attendance,exams,fees,notices,discipline),
// 25=EmergencyOnly (0/1), 26=PhotoURL, 27=City, 28=Country, 29=PostalCode, 30=NumberOfChildren,
// 31=AnnualIncome (numeric, base currency — drives RTE/scholarship eligibility)
var PARENT_HEADERS = ['ID','FullName','Email','Mobile','PasswordHash','Relation','Occupation','Address','LastLogin','Status','IsDeleted','CreatedAt','UpdatedAt','Nationality','CountryOfResidence','PreferredLanguage','PreferredContactMethod','WhatsAppNumber','TimeZone','Employer','JobTitle','WorkEmail','WorkPhone','PreferredBillingContact','NotificationPreferences','EmergencyOnly','PhotoURL','City','Country','PostalCode','NumberOfChildren','AnnualIncome'];

// parent_students cols (6):
// 0=ID, 1=ParentID (FK→Parents), 2=StudentID (FK→Students), 3=IsPrimaryContact, 4=CreatedAt, 5=UpdatedAt
// UNIQUE(ParentID, StudentID) — hard delete per schema (no is_deleted)
var PARENT_STUDENT_HEADERS = ['ID','ParentID','StudentID','IsPrimaryContact','CreatedAt','UpdatedAt'];

// exams cols (31):
// 0=ID, 1=ExamName, 2=ExamType (class_test|mid_term|end_of_term|mock), 3=ClassID (FK), 4=AcademicYear, 5=StartDate, 6=EndDate,
// 7=MaxMarksPerSubject, 8=IsPublished, 9=PublishedAt, 10=PublishedBy (FK→Users), 11=IsDeleted,
// 12=CreatedAt, 13=UpdatedAt,
// 14=Term (enum), 15=AssessmentType (enum), 16=ExamCode (str<=30), 17=WeightagePercent (0-100),
// 18=GradingScheme (enum), 19=CurriculumStage (enum), 20=ExamDuration (mins 0-600),
// 21=ResultsLockedDate (YYYY-MM-DD opt), 22=PassMarksOverride (dec opt), 23=ReportCardGenerated (0/1),
// 24=NextExamID (FK self opt), 25=ApplicableSections (csv<=200),
// 26=PassingPercentageRequired (overall % to pass exam — drives promotion),
// 27=VacationDate (YYYY-MM-DD — term closing date, printed on the report card),
// 28=ReopeningDate (YYYY-MM-DD — next term's resumption date, printed on the report card),
// 29=SbaMaxMarks (end_of_term only — class-score/continuous-assessment max, e.g. 40 or 50; '' otherwise),
// 30=ExamMaxMarks (end_of_term only — exam-paper max, e.g. 50 or 60; '' otherwise. SbaMaxMarks+ExamMaxMarks = MaxMarksPerSubject)
var EXAM_HEADERS = ['ID','ExamName','ExamType','ClassID','AcademicYear','StartDate','EndDate','MaxMarksPerSubject','IsPublished','PublishedAt','PublishedBy','IsDeleted','CreatedAt','UpdatedAt','Term','AssessmentType','ExamCode','WeightagePercent','GradingScheme','CurriculumStage','ExamDuration','ResultsLockedDate','PassMarksOverride','ReportCardGenerated','NextExamID','ApplicableSections','PassingPercentageRequired','VacationDate','ReopeningDate','SbaMaxMarks','ExamMaxMarks'];

// marks cols (26):
// 0=ID, 1=ExamID (FK), 2=StudentID (FK), 3=SubjectID (FK), 4=MarksObtained, 5=MaxMarks,
// 6=Grade, 7=IsAbsent, 8=Remarks, 9=EnteredBy (FK→Users), 10=CreatedAt, 11=UpdatedAt,
// 12=TheoryMarks, 13=PracticalMarks, 14=InternalMarks, 15=ExternalMarks,
// 16=PercentageScored (0-100 computed), 17=GradePoints (0-10), 18=AttemptNumber (1-3),
// 19=Status (enum), 20=IsModerated (0/1), 21=ModeratedBy (FK Users opt),
// 22=ModerationDate (YYYY-MM-DD opt), 23=Comments (text<=500),
// 24=Rank (class/section rank — int, '' if not yet computed),
// 25=OriginalMarks (audit snapshot of MarksObtained before moderation)
// UNIQUE(ExamID, StudentID, SubjectID) — hard delete per schema (no is_deleted)
var MARK_HEADERS = ['ID','ExamID','StudentID','SubjectID','MarksObtained','MaxMarks','Grade','IsAbsent','Remarks','EnteredBy','CreatedAt','UpdatedAt','TheoryMarks','PracticalMarks','InternalMarks','ExternalMarks','PercentageScored','GradePoints','AttemptNumber','Status','IsModerated','ModeratedBy','ModerationDate','Comments','Rank','OriginalMarks'];

// attendance cols (15) — DENORMALIZED: 1 row per (class, date, mode, subject, period).
// 0=ID, 1=ClassID (FK), 2=AttendanceDate (ISO),
// 3=Mode ('daily' | 'subject_wise'),
// 4=SubjectID (FK, '' for daily mode),
// 5=PeriodNumber (1-8, '' for daily mode),
// 6=Statuses (JSON: {"<studentId>": {"status":"...", "remarks":"..."}, ...}),
// 7=PresentCount, 8=AbsentCount, 9=TotalCount,
// 10=MarkedBy (FK→Users), 11=CreatedAt, 12=UpdatedAt,
// 13=IsLocked (0/1 — once admin locks at EOD, no edits), 14=LockedAt (ISO datetime, '' if unlocked)
// UNIQUE(ClassID, AttendanceDate, Mode, SubjectID, PeriodNumber)
// Hard delete via row removal — no is_deleted column.
var ATTENDANCE_HEADERS = ['ID','ClassID','AttendanceDate','Mode','SubjectID','PeriodNumber','Statuses','PresentCount','AbsentCount','TotalCount','MarkedBy','CreatedAt','UpdatedAt','IsLocked','LockedAt'];

// fee_structure cols (16):
// 0=ID, 1=ClassID (FK), 2=FeeCategory, 3=Amount, 4=Frequency, 5=AcademicYear,
// 6=DueDay, 7=LateFeePerDay, 8=IsActive, 9=IsDeleted, 10=CreatedAt, 11=UpdatedAt,
// 12=InstallmentsAllowed (0/1), 13=InstallmentCount (int 1..12, default 1),
// 14=LevyPercent (0..100, optional extra levy — most Ghanaian school fees carry none), 15=Description (free text — what this fee covers)
var FEE_STRUCTURE_HEADERS = ['ID','ClassID','FeeCategory','Amount','Frequency','AcademicYear','DueDay','LateFeePerDay','IsActive','IsDeleted','CreatedAt','UpdatedAt','InstallmentsAllowed','InstallmentCount','TaxPercent','Description'];

// fee_payments cols (23):
// 0=ID, 1=StudentID (FK), 2=FeeStructureID (FK), 3=AmountPaid, 4=AmountDue, 5=LateFee, 6=Discount,
// 7=PaymentDate, 8=BillingPeriod, 9=PaymentMode (cash|cheque|online|mobile_money|card|bank_transfer),
// 10=TransactionReference (MoMo transaction ID / cheque no / bank ref), 11=ReceiptNumber (UNIQUE),
// 12=PaymentStatus, 13=CollectedBy (FK→Users), 14=Remarks, 15=IsDeleted, 16=CreatedAt, 17=UpdatedAt,
// 18=AcademicYear (denorm for fast year-wise reports),
// 19=RefundAmount (numeric >=0), 20=RefundDate (ISO opt), 21=RefundReason (text opt),
// 22=MobileMoneyProvider (mtn_momo|telecel_cash|airteltigo_money — '' unless PaymentMode=mobile_money)
var FEE_PAYMENT_HEADERS = ['ID','StudentID','FeeStructureID','AmountPaid','AmountDue','LateFee','Discount','PaymentDate','BillingPeriod','PaymentMode','TransactionReference','ReceiptNumber','PaymentStatus','CollectedBy','Remarks','IsDeleted','CreatedAt','UpdatedAt','AcademicYear','RefundAmount','RefundDate','RefundReason','MobileMoneyProvider'];

// fee_dues cols (12): one row per (student, fee_structure, billing_month) — auto-generated from admission month forward
// 0=ID, 1=StudentID, 2=FeeStructureID, 3=BillingMonth (YYYY-MM), 4=BillingMonthLabel ('August 2026'), 5=Amount,
// 6=Status (pending|paid|partial|waived), 7=PaymentID (FK→Fee_Payments when paid), 8=PaidAmount,
// 9=PaidDate, 10=CreatedAt, 11=UpdatedAt
var FEE_DUE_HEADERS = ['ID','StudentID','FeeStructureID','BillingMonth','BillingMonthLabel','Amount','Status','PaymentID','PaidAmount','PaidDate','CreatedAt','UpdatedAt'];

// sms_log cols (10): one row per SMS attempt
// 0=ID, 1=SentAt, 2=Recipient, 3=Message, 4=TemplateType, 5=Status (sent|failed), 6=ProviderResponse,
// 7=RelatedStudentID, 8=SentBy, 9=RelatedType (fees|exams|birthday|report_card|other)
var SMS_LOG_HEADERS = ['ID','SentAt','Recipient','Message','TemplateType','Status','ProviderResponse','RelatedStudentID','SentBy','RelatedType'];

// sms_templates cols (6): admin-editable message templates, one row per TemplateType
// 0=ID, 1=TemplateType (fees|exam_published|birthday|report_card|other), 2=TemplateText (placeholders like {StudentName}),
// 3=IsActive, 4=CreatedAt, 5=UpdatedAt
var SMS_TEMPLATE_HEADERS = ['ID','TemplateType','TemplateText','IsActive','CreatedAt','UpdatedAt'];

var SMS_DEFAULT_TEMPLATES = [
  { type: 'fees', text: 'Dear Parent, {StudentName} ({ClassName}) has an outstanding balance of GHS {Amount}. Kindly settle at your earliest convenience. Thank you. - {SchoolName}' },
  { type: 'exam_published', text: 'Dear Parent, results for {StudentName} ({ClassName}) - {ExamName} have been published. Log in to the school portal to view. - {SchoolName}' },
  { type: 'birthday', text: 'Happy Birthday {StudentName}! Wishing you a wonderful day and a great year ahead. From all of us at {SchoolName}.' },
  { type: 'report_card', text: 'Dear Parent, the report card for {StudentName} ({ClassName}) is ready. Please log in to the school portal or contact the school office to collect it. - {SchoolName}' },
  { type: 'other', text: 'Dear Parent, this is a message from {SchoolName} regarding {StudentName}: {CustomMessage}' }
];

// discipline cols (16):
// 0=ID, 1=StudentID (FK), 2=IncidentDate, 3=IncidentType (enum), 4=Severity (enum),
// 5=Description, 6=ActionTaken, 7=ParentNotified (0/1), 8=Status (enum), 9=Remarks,
// 10=ReportedBy (FK→Users), 11=IsDeleted, 12=CreatedAt, 13=UpdatedAt,
// 14=Location (where incident occurred — classroom/canteen/bus/playground/lab/library/other),
// 15=WitnessNames (CSV of names — staff or students who witnessed)
var DISCIPLINE_HEADERS = ['ID','StudentID','IncidentDate','IncidentType','Severity','Description','ActionTaken','ParentNotified','Status','Remarks','ReportedBy','IsDeleted','CreatedAt','UpdatedAt','Location','WitnessNames'];

// conduct cols (15):
// 0=ID, 1=StudentID (FK), 2=EvaluationPeriod (enum), 3=PeriodLabel, 4=AcademicYear,
// 5=ConductGrade (enum), 6=Remarks, 7=EvaluatedBy (FK→Users), 8=IsDeleted, 9=CreatedAt, 10=UpdatedAt,
// 11=PunctualityGrade (A/B/C/D/E or 1-5), 12=BehaviorGrade, 13=TeamworkGrade, 14=LeadershipGrade
// UNIQUE(StudentID, EvaluationPeriod, PeriodLabel, AcademicYear)
var CONDUCT_HEADERS = ['ID','StudentID','EvaluationPeriod','PeriodLabel','AcademicYear','ConductGrade','Remarks','EvaluatedBy','IsDeleted','CreatedAt','UpdatedAt','PunctualityGrade','BehaviorGrade','TeamworkGrade','LeadershipGrade'];

// report_remarks cols (11) — free-text remarks printed on a student's termly report card (one row per student per exam/term)
// 0=ID, 1=StudentID (FK), 2=ExamID (FK — ties the remarks to one term's report card),
// 3=InterestTalent, 4=Conduct, 5=AttitudeToWork, 6=ClassTeacherRemark, 7=HeadmasterRemark,
// 8=PromotionStatus (promoted|not_promoted|on_trial|'' — Basic/JHS end-of-year only), 9=CreatedAt, 10=UpdatedAt
// UNIQUE(StudentID, ExamID) — hard delete per schema (no is_deleted)
var REPORT_REMARKS_HEADERS = ['ID','StudentID','ExamID','InterestTalent','Conduct','AttitudeToWork','ClassTeacherRemark','HeadmasterRemark','PromotionStatus','CreatedAt','UpdatedAt'];

// activities cols (15):
// 0=ID, 1=StudentID, 2=ActivityName, 3=ActivityType (10 enum), 4=Level (5 enum), 5=Position (free text),
// 6=ActivityDate, 7=AcademicYear, 8=CertificateURL, 9=Description, 10=RecordedBy (FK→Users),
// 11=IsDeleted, 12=CreatedAt, 13=UpdatedAt,
// 14=CoachTeacherID (FK→Users — supervising coach/mentor)
var ACTIVITY_HEADERS = ['ID','StudentID','ActivityName','ActivityType','Level','Position','ActivityDate','AcademicYear','CertificateURL','Description','RecordedBy','IsDeleted','CreatedAt','UpdatedAt','CoachTeacherID'];

// complaints cols (17) — NO is_deleted, hard delete per schema
// 0=ID, 1=ComplaintCode (UNIQUE), 2=SubmittedByType (4 enum), 3=SubmitterID, 4=RelatedStudentID (NULL),
// 5=Category (8 enum), 6=Subject, 7=Description, 8=Priority (4 enum), 9=Status (5 enum),
// 10=AssignedTo (FK→Users, NULL), 11=ResolutionNotes, 12=ResolvedAt, 13=CreatedAt, 14=UpdatedAt,
// 15=IsAnonymous (0/1 — hide submitter for safeguarding), 16=AttachmentURL
var COMPLAINT_HEADERS = ['ID','ComplaintCode','SubmittedByType','SubmitterID','RelatedStudentID','Category','Subject','Description','Priority','Status','AssignedTo','ResolutionNotes','ResolvedAt','CreatedAt','UpdatedAt','IsAnonymous','AttachmentURL'];

// notices cols (16)
// 0=ID, 1=Title, 2=Description, 3=NoticeType (9 enum), 4=NoticeDate, 5=TargetAudience (6 enum),
// 6=TargetClassID (NULL), 7=AttachmentURL, 8=Priority (4 enum), 9=ExpiryDate, 10=PostedBy (FK→Users),
// 11=IsActive, 12=IsDeleted, 13=CreatedAt, 14=UpdatedAt,
// 15=AcknowledgmentRequired (0/1 — track read receipts via separate Notice_Reads sheet later)
var NOTICE_HEADERS = ['ID','Title','Description','NoticeType','NoticeDate','TargetAudience','TargetClassID','AttachmentURL','Priority','ExpiryDate','PostedBy','IsActive','IsDeleted','CreatedAt','UpdatedAt','AcknowledgmentRequired'];

// helpdesk_tickets cols (16) — NO is_deleted, hard delete per schema
// 0=ID, 1=TicketCode (UNIQUE), 2=RaisedByType (2 enum), 3=RaiserID, 4=RelatedStudentID (NOT NULL),
// 5=Category (7 enum), 6=Subject, 7=Description, 8=Priority (3 enum), 9=Status (5 enum),
// 10=AssignedTo (FK→Users, NULL), 11=AdminResponse, 12=ResolvedAt, 13=CreatedAt, 14=UpdatedAt,
// 15=DueBy (ISO datetime — SLA target, auto from priority: urgent=4h, high=24h, normal=48h, low=72h)
var HELPDESK_HEADERS = ['ID','TicketCode','RaisedByType','RaiserID','RelatedStudentID','Category','Subject','Description','Priority','Status','AssignedTo','AdminResponse','ResolvedAt','CreatedAt','UpdatedAt','DueBy'];

// lesson_plans cols (18)
// 0=ID, 1=TeacherID (FK→Users), 2=ClassID, 3=SubjectID, 4=PlanPeriod (4 enum), 5=StartDate, 6=EndDate,
// 7=Topic, 8=Objectives, 9=TeachingMethods, 10=Resources, 11=AssessmentPlan, 12=Status (4 enum),
// 13=IsDeleted, 14=CreatedAt, 15=UpdatedAt,
// 16=ReviewedBy (FK→Users — HOD/Coordinator), 17=ReviewStatus (pending|approved|rework|na)
var LESSON_PLAN_HEADERS = ['ID','TeacherID','ClassID','SubjectID','PlanPeriod','StartDate','EndDate','Topic','Objectives','TeachingMethods','Resources','AssessmentPlan','Status','IsDeleted','CreatedAt','UpdatedAt','ReviewedBy','ReviewStatus'];

// teaching_logbook cols (15) — NO is_deleted, hard delete per schema
// UNIQUE(teacher_id, class_id, subject_id, log_date, period_number)
// 0=ID, 1=TeacherID, 2=ClassID, 3=SubjectID, 4=LogDate, 5=PeriodNumber (NULL), 6=TopicCovered,
// 7=Description, 8=HomeworkAssigned, 9=HomeworkDueDate, 10=Status (3 enum), 11=Remarks,
// 12=CreatedAt, 13=UpdatedAt, 14=StudentsPresent (int — correlate to attendance)
var TEACHING_LOGBOOK_HEADERS = ['ID','TeacherID','ClassID','SubjectID','LogDate','PeriodNumber','TopicCovered','Description','HomeworkAssigned','HomeworkDueDate','Status','Remarks','CreatedAt','UpdatedAt','StudentsPresent'];

// documents cols (17)
// 0=ID, 1=DocumentName, 2=DocumentType (11 enum), 3=EntityType (4 enum), 4=EntityID,
// 5=FileURL, 6=FileSizeKB, 7=MimeType, 8=UploadedBy (FK→Users), 9=IsVerified, 10=VerifiedBy (NULL),
// 11=Remarks, 12=IsDeleted, 13=CreatedAt, 14=UpdatedAt,
// 15=ExpiryDate (ISO opt — for passports/visas/certs; drives expiry reminders),
// 16=DocumentNumber (cert/passport/license number)
var DOCUMENT_HEADERS = ['ID','DocumentName','DocumentType','EntityType','EntityID','FileURL','FileSizeKB','MimeType','UploadedBy','IsVerified','VerifiedBy','Remarks','IsDeleted','CreatedAt','UpdatedAt','ExpiryDate','DocumentNumber'];

// school_periods cols (12):
// 0=ID, 1=PeriodNumber, 2=StartTime (HH:MM), 3=EndTime (HH:MM),
// 4=IsBreak (0/1), 5=Label, 6=AcademicYear, 7=DisplayOrder,
// 8=IsDeleted, 9=CreatedAt, 10=UpdatedAt,
// 11=DayType (regular|saturday|half_day|exam — same period number can have different times by day type)
// UNIQUE(PeriodNumber, AcademicYear, DayType)
var PERIOD_HEADERS = ['ID','PeriodNumber','StartTime','EndTime','IsBreak','Label','AcademicYear','DisplayOrder','IsDeleted','CreatedAt','UpdatedAt','DayType'];

// school_settings cols (32) — single-row config table; ID always 1.
// 0=ID, 1=SchoolName, 2=SchoolShortName, 3=SchoolLogo (URL — set via photo picker, stored in Drive), 4=SchoolEmail, 5=SchoolContact (phone),
// 6=SchoolAddress, 7=SchoolWebsite, 8=AdminName, 9=AdminEmail, 10=AcademicYear,
// 11=Currency, 12=TimeZone, 13=AboutText, 14=CreatedAt, 15=UpdatedAt,
// 16=WorkingDays (CSV: monday,tuesday,wednesday,thursday,friday — drives attendance % and timetable),
// 17=AcademicYearStartDate (ISO), 18=AcademicYearEndDate (ISO),
// 19=HiddenMenuIds (CSV of sidebar menu ids the admin has hidden — keeps the menu short per school),
// 20=AdmissionNumberPrefix (e.g. 'RAD' — system auto-generates AdmissionNumber as PREFIX+YEAR+SEQ),
// SMS gateway config (21-26):
// 21=SmsProvider (arkesel|hubtel|custom|''), 22=SmsApiKey, 23=SmsApiSecret,
// 24=SmsSenderId (max 11 chars per GH carrier rules), 25=SmsCustomEndpoint (custom provider POST URL),
// 26=SmsCustomConfig (JSON: {phoneField,messageField,senderField,authHeader,authValue,extraBody} for a custom provider),
// School owner daily digest (27-29):
// 27=OwnerEmail, 28=OwnerPhone, 29=DailyDigestTime (HH:MM, 24h, school-close time the digest fires at),
// SMS balance cache (30-31, refreshed on demand — avoids hammering the provider's balance API):
// 30=SmsBalanceCache (numeric, '' if never checked), 31=SmsBalanceCacheAt (ISO timestamp)
var SETTINGS_HEADERS = ['ID','SchoolName','SchoolShortName','SchoolLogo','SchoolEmail','SchoolContact','SchoolAddress','SchoolWebsite','AdminName','AdminEmail','AcademicYear','Currency','TimeZone','AboutText','CreatedAt','UpdatedAt','WorkingDays','AcademicYearStartDate','AcademicYearEndDate','HiddenMenuIds','AdmissionNumberPrefix','SmsProvider','SmsApiKey','SmsApiSecret','SmsSenderId','SmsCustomEndpoint','SmsCustomConfig','OwnerEmail','OwnerPhone','DailyDigestTime','SmsBalanceCache','SmsBalanceCacheAt'];

// timetable cols (18):
// 0=ID, 1=ClassID (FK), 2=DayOfWeek (lower: monday..sunday), 3=PeriodNumber,
// 4=SubjectID (FK NULL for breaks), 5=TeacherID (FK→Users NULL for breaks),
// 6=RoomNumber, 7=AcademicYear, 8=Term (full_year/term_1/term_2/term_3),
// 9=Notes, 10=IsActive (0/1), 11=IsDeleted (0/1),
// 12=CreatedAt, 13=CreatedBy, 14=UpdatedAt, 15=UpdatedBy,
// 16=Mode (offline|online|hybrid), 17=MeetingLink (Zoom/Meet URL — '' if offline)
// UNIQUE(ClassID, DayOfWeek, PeriodNumber, AcademicYear, Term)
var TIMETABLE_HEADERS = ['ID','ClassID','DayOfWeek','PeriodNumber','SubjectID','TeacherID','RoomNumber','AcademicYear','Term','Notes','IsActive','IsDeleted','CreatedAt','CreatedBy','UpdatedAt','UpdatedBy','Mode','MeetingLink'];

// school_calendar cols (16):
// 0=ID, 1=EventName, 2=EventDate (ISO), 3=EndDate (ISO opt for multi-day),
// 4=EventType (9 enum: holiday|event|exam|meeting|sports|function|ptm|working_day|other),
// 5=Description, 6=AcademicYear (YYYY-YYYY),
// 7=IsHoliday (0/1 — blocks attendance),
// 8=ApplicableTo (all|staff|students|class_specific),
// 9=TargetClassID (FK→Classes; '' if not class_specific),
// 10=Color (hex), 11=CreatedBy (FK→Users),
// 12=CreatedAt, 13=UpdatedAt, 14=IsDeleted (0/1),
// 15=IsRecurring (0/1 — annual repeat: Republic Day, Founder's Day, etc.)
var CALENDAR_HEADERS = ['ID','EventName','EventDate','EndDate','EventType','Description','AcademicYear','IsHoliday','ApplicableTo','TargetClassID','Color','CreatedBy','CreatedAt','UpdatedAt','IsDeleted','IsRecurring'];

// ptm_slots cols (17):
// 0=ID, 1=TeacherID(FK Users), 2=Date(ISO), 3=StartTime(HH:MM), 4=EndTime(HH:MM),
// 5=Duration(mins), 6=ClassID(FK), 7=AcademicYear, 8=IsAvailable(0/1),
// 9=MaxBookings, 10=Notes, 11=CreatedBy, 12=CreatedAt, 13=UpdatedAt, 14=IsDeleted,
// 15=Mode (in_person|online|hybrid), 16=MeetingLink (Zoom/Meet URL for online/hybrid)
// UNIQUE(TeacherID, Date, StartTime)
var PTM_SLOT_HEADERS = ['ID','TeacherID','Date','StartTime','EndTime','Duration','ClassID','AcademicYear','IsAvailable','MaxBookings','Notes','CreatedBy','CreatedAt','UpdatedAt','IsDeleted','Mode','MeetingLink'];

// ptm_bookings cols (14):
// 0=ID, 1=SlotID(FK), 2=ParentID, 3=StudentID, 4=Status, 5=ParentNotes,
// 6=TeacherMinutes, 7=ActionItems, 8=BookedAt, 9=CompletedAt, 10=CreatedAt, 11=UpdatedAt,
// 12=ParentAgenda (pre-meeting topics parent wants to discuss),
// 13=ParentRating (1..5 — parent's post-meeting rating, '' if not rated)
// Status: booked|completed|cancelled|no_show. UNIQUE(SlotID, StudentID)
var PTM_BOOKING_HEADERS = ['ID','SlotID','ParentID','StudentID','Status','ParentNotes','TeacherMinutes','ActionItems','BookedAt','CompletedAt','CreatedAt','UpdatedAt','ParentAgenda','ParentRating'];

// substitutes cols (14):
// 0=ID, 1=AbsentTeacherID, 2=Date, 3=Reason, 4=Description,
// 5=Allocations(JSON), 6=AllocatedCount, 7=PendingCount, 8=Status,
// 9=CreatedBy, 10=CreatedAt, 11=UpdatedAt, 12=IsDeleted,
// 13=LeaveDocumentURL (medical cert / leave proof)
// Reason: sick|personal|training|emergency|other. Status: pending|in_progress|completed
// Allocations JSON: [{periodNumber,classId,subjectId,substituteTeacherId,status}]
// alloc.status: pending|confirmed|missed. UNIQUE(AbsentTeacherID, Date)
var SUBSTITUTE_HEADERS = ['ID','AbsentTeacherID','Date','Reason','Description','Allocations','AllocatedCount','PendingCount','Status','CreatedBy','CreatedAt','UpdatedAt','IsDeleted','LeaveDocumentURL'];

// assets cols (21):
// 0=ID, 1=AssetTag(UNIQUE), 2=AssetName, 3=Category, 4=Description, 5=PurchaseDate,
// 6=PurchasePrice, 7=Vendor, 8=Warranty, 9=Location, 10=AssignedTo(FK Users),
// 11=Condition, 12=Status, 13=PhotoURL, 14=Notes, 15=CreatedBy,
// 16=CreatedAt, 17=UpdatedAt, 18=IsDeleted,
// 19=DepreciationRate (% per year, 0..100), 20=CurrentValue (numeric — written-down value)
var ASSET_HEADERS = ['ID','AssetTag','AssetName','Category','Description','PurchaseDate','PurchasePrice','Vendor','Warranty','Location','AssignedTo','Condition','Status','PhotoURL','Notes','CreatedBy','CreatedAt','UpdatedAt','IsDeleted','DepreciationRate','CurrentValue'];

// asset_maintenance cols (16):
// 0=ID, 1=AssetID(FK), 2=MaintenanceDate, 3=Type, 4=Description, 5=Cost,
// 6=PerformedBy, 7=NextDueDate, 8=Status, 9=ReceiptURL, 10=Notes,
// 11=CreatedBy, 12=CreatedAt, 13=UpdatedAt,
// 14=UnderWarranty (0/1 — vendor pays), 15=WarrantyClaimRef (claim/ticket reference)
var ASSET_MAINTENANCE_HEADERS = ['ID','AssetID','MaintenanceDate','Type','Description','Cost','PerformedBy','NextDueDate','Status','ReceiptURL','Notes','CreatedBy','CreatedAt','UpdatedAt','UnderWarranty','WarrantyClaimRef'];

// stock_items cols (17):
// 0=ID, 1=ItemCode(UNIQUE), 2=ItemName, 3=Category, 4=Unit, 5=CurrentStock,
// 6=ReorderLevel, 7=ReorderQuantity, 8=Vendor, 9=UnitCost, 10=Location,
// 11=Notes, 12=CreatedAt, 13=UpdatedAt, 14=IsDeleted,
// 15=ExpiryDate (ISO opt — for consumables: meds, chemicals, food),
// 16=MinimumStock (hard floor below which alert fires regardless of reorder level)
var STOCK_ITEM_HEADERS = ['ID','ItemCode','ItemName','Category','Unit','CurrentStock','ReorderLevel','ReorderQuantity','Vendor','UnitCost','Location','Notes','CreatedAt','UpdatedAt','IsDeleted','ExpiryDate','MinimumStock'];

// stock_transactions cols (12):
// 0=ID, 1=ItemID(FK), 2=Type(in|out|adjustment), 3=Quantity(+ve), 4=Reason,
// 5=IssuedTo, 6=Reference, 7=Notes, 8=PerformedBy, 9=TransactionDate, 10=CreatedAt,
// 11=ApprovedBy (FK→Users — second-signature for high-value issues, '' if not required)
var STOCK_TRANSACTION_HEADERS = ['ID','ItemID','Type','Quantity','Reason','IssuedTo','Reference','Notes','PerformedBy','TransactionDate','CreatedAt','ApprovedBy'];

// ============== Web App Entry ==============
function doGet(e) {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('SMS Dashboard')
    .setSandboxMode(HtmlService.SandboxMode.IFRAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ============== Helpers ==============
function getSheet(name) { return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name); }
function nowIso() { return new Date().toISOString(); }
function todayStr() { return new Date().toISOString().split('T')[0]; }
function isAdmin(role) { return role && String(role).toLowerCase() === 'admin'; }

// classes read access — admin/clerk/teacher/supervisor (and student/parent later)
function canReadClasses(role) {
  var r = String(role || '').toLowerCase();
  return r === 'admin' || r === 'clerk' || r === 'teacher' || r === 'supervisor' || r === 'student' || r === 'parent';
}

// teacher reference list — all staff need it (classes/timetable/ptm/substitutes/docs dropdowns)
function canListTeachers(role) {
  var r = String(role || '').toLowerCase();
  return r === 'admin' || r === 'clerk' || r === 'supervisor' || r === 'teacher';
}

function nextClassId(sh) {
  var data = sh.getDataRange().getValues(), max = 0;
  for (var i = 1; i < data.length; i++) {
    var n = parseInt(data[i][0], 10);
    if (!isNaN(n) && n > max) max = n;
  }
  return max + 1;
}

// id -> {fullName, role} map for join lookups
function getUsersMap() {
  var sh = getSheet(USERS_SHEET);
  if (!sh) return {};
  var data = sh.getDataRange().getValues(), map = {};
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][16]) === '1') continue;
    map[data[i][0]] = { fullName: data[i][2] || data[i][1], username: data[i][1], role: String(data[i][6] || '').toLowerCase() };
  }
  return map;
}

// id -> {className, section, academicYear} map for join lookups
function getClassesMap() {
  var sh = getSheet(CLASSES_SHEET);
  if (!sh) return {};
  var data = sh.getDataRange().getValues(), map = {};
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][6]) === '1') continue;
    map[data[i][0]] = {
      className: data[i][1],
      section: data[i][2],
      academicYear: data[i][3],
      label: data[i][1] + ' ' + data[i][2] + ' (' + data[i][3] + ')',
      curriculumStage: String(data[i][11] || 'lower_primary').toLowerCase(),
      gradeLevel: parseInt(data[i][9], 10) || 0,
      gradeBand: gradeBandForStage(data[i][11])
    };
  }
  return map;
}

// id -> {subjectName, subjectCode, classId, maxMarks} map
function getSubjectsMap() {
  var sh = getSheet(SUBJECTS_SHEET);
  if (!sh) return {};
  var data = sh.getDataRange().getValues(), map = {};
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][5]) === '1') continue;
    map[data[i][0]] = {
      subjectName: data[i][1],
      subjectCode: data[i][2],
      classId: data[i][3],
      maxMarks: parseInt(data[i][4], 10) || 100
    };
  }
  return map;
}

// subjects RBAC: read=admin/teacher/supervisor (NOT clerk), write=admin
function canReadSubjects(role) {
  var r = String(role || '').toLowerCase();
  return r === 'admin' || r === 'teacher' || r === 'supervisor' || r === 'student' || r === 'parent';
}

// teacher_assignments RBAC: read=admin/supervisor full, teacher=own only; write=admin
function canReadAssignments(role) {
  var r = String(role || '').toLowerCase();
  return r === 'admin' || r === 'supervisor' || r === 'teacher';
}

function nextSubjectId(sh) {
  var data = sh.getDataRange().getValues(), max = 0;
  for (var i = 1; i < data.length; i++) {
    var n = parseInt(data[i][0], 10);
    if (!isNaN(n) && n > max) max = n;
  }
  return max + 1;
}

function nextAssignmentId(sh) {
  var data = sh.getDataRange().getValues(), max = 0;
  for (var i = 1; i < data.length; i++) {
    var n = parseInt(data[i][0], 10);
    if (!isNaN(n) && n > max) max = n;
  }
  return max + 1;
}

function nextStudentId(sh) {
  var data = sh.getDataRange().getValues(), max = 0;
  for (var i = 1; i < data.length; i++) {
    var n = parseInt(data[i][0], 10);
    if (!isNaN(n) && n > max) max = n;
  }
  return max + 1;
}

// students RBAC: read=admin/clerk(basic)/teacher(own_class)/supervisor + future student/parent
function canReadStudents(role) {
  var r = String(role || '').toLowerCase();
  return r === 'admin' || r === 'clerk' || r === 'teacher' || r === 'supervisor' || r === 'student' || r === 'parent';
}
// clerk + supervisor get the stripped student view (no Ghana Card/medical/family/contact); admin/teacher see full
function isClerkBasicView(role) { var r = String(role || '').toLowerCase(); return r === 'clerk' || r === 'supervisor'; }

// teacher's class_ids — for student own-class filter
function getTeacherClassIds(currentUser) {
  var users = getSheet(USERS_SHEET);
  if (!users) return [];
  var udata = users.getDataRange().getValues();
  var teacherId = null;
  for (var i = 1; i < udata.length; i++) {
    if (udata[i][1] === currentUser && String(udata[i][16]) === '0') {
      teacherId = parseInt(udata[i][0], 10);
      break;
    }
  }
  if (!teacherId) return [];

  var asg = getSheet(ASSIGNMENTS_SHEET);
  if (!asg) return [];
  var adata = asg.getDataRange().getValues();
  var seen = {};
  for (var j = 1; j < adata.length; j++) {
    if (parseInt(adata[j][1], 10) === teacherId) {
      seen[parseInt(adata[j][2], 10)] = true;
    }
  }
  return Object.keys(seen).map(Number);
}

// parents RBAC: read=admin/clerk/teacher(mobile-bridge to own class)/supervisor + future student/parent
function canReadParents(role) {
  var r = String(role || '').toLowerCase();
  return r === 'admin' || r === 'clerk' || r === 'teacher' || r === 'supervisor' || r === 'student' || r === 'parent';
}

function nextParentId(sh) {
  var data = sh.getDataRange().getValues(), max = 0;
  for (var i = 1; i < data.length; i++) {
    var n = parseInt(data[i][0], 10);
    if (!isNaN(n) && n > max) max = n;
  }
  return max + 1;
}

// parent_students RBAC: read=admin/supervisor (+ future student/parent for own links), write=admin only
function canReadParentStudents(role) {
  var r = String(role || '').toLowerCase();
  return r === 'admin' || r === 'supervisor' || r === 'student' || r === 'parent';
}

// exams RBAC: read=admin/teacher(own_class)/supervisor/student/parent(published_only_own_class), write=admin only
function canReadExams(role) {
  var r = String(role || '').toLowerCase();
  return r === 'admin' || r === 'teacher' || r === 'supervisor' || r === 'student' || r === 'parent';
}

// marks RBAC same as exams; write/update gated additionally on assignment + publish lock
function canReadMarks(role) {
  var r = String(role || '').toLowerCase();
  return r === 'admin' || r === 'teacher' || r === 'supervisor' || r === 'student' || r === 'parent';
}

function nextExamId(sh) {
  var data = sh.getDataRange().getValues(), max = 0;
  for (var i = 1; i < data.length; i++) {
    var n = parseInt(data[i][0], 10);
    if (!isNaN(n) && n > max) max = n;
  }
  return max + 1;
}

function nextMarkId(sh) {
  var data = sh.getDataRange().getValues(), max = 0;
  for (var i = 1; i < data.length; i++) {
    var n = parseInt(data[i][0], 10);
    if (!isNaN(n) && n > max) max = n;
  }
  return max + 1;
}

// resolve a username to user_id (active, non-deleted only)
function getCurrentUserId(username) {
  var sh = getSheet(USERS_SHEET);
  if (!sh) return null;
  var data = sh.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][1] === username && String(data[i][16]) === '0') {
      return parseInt(data[i][0], 10);
    }
  }
  return null;
}

// returns set of "classId|subjectId" keys for a teacher's assignments (any year)
function getTeacherAssignmentsMap(teacherUserId) {
  if (!teacherUserId) return {};
  var sh = getSheet(ASSIGNMENTS_SHEET);
  if (!sh) return {};
  var data = sh.getDataRange().getValues(), map = {};
  for (var i = 1; i < data.length; i++) {
    if (parseInt(data[i][1], 10) !== teacherUserId) continue;
    var key = parseInt(data[i][2], 10) + '|' + parseInt(data[i][3], 10);
    map[key] = true;
  }
  return map;
}

// Ghana basic education has two grading bands, selected by the class's CurriculumStage:
//  - 'basic' (Creche..Basic 6): NaCCA 5-band SBA proficiency scale
//  - 'jhs'   (Basic 7-9): 9-grade WAEC-style scale (used for class tests, mid-terms,
//     end-of-term exams AND BECE mocks — they all share this one table)
// gradeBandForStage(curriculumStage) resolves which table to use.
function gradeBandForStage(curriculumStage) {
  return String(curriculumStage || '').toLowerCase() === 'jhs' ? 'jhs' : 'basic';
}

// NaCCA Standards-Based Curriculum 5-band proficiency scale (Creche through Basic 6).
// Band cut-offs: HP 80-100, P 68-79, AP 54-67, D 40-53, E 0-39.
function basicGradeFromPercent(pct) {
  if (pct >= 80) return 'HP';
  if (pct >= 68) return 'P';
  if (pct >= 54) return 'AP';
  if (pct >= 40) return 'D';
  return 'E';
}
var BASIC_GRADE_DESCRIPTORS = { HP: 'Highly Proficient', P: 'Proficient', AP: 'Approaching Proficiency', D: 'Developing', E: 'Emerging', AB: 'Absent' };

// JHS (Basic 7-9) 9-grade scale — used for class tests, mid-terms, end-of-term exams and
// BECE mocks. Number is the WAEC-style grade (1=best..9=weakest); letter/label are what
// gets printed on the report card's Grade and Remarks columns.
var JHS_GRADE_TABLE = [
  { min: 90, number: 1, letter: 'A+', label: 'Highest' },
  { min: 80, number: 2, letter: 'A',  label: 'Higher' },
  { min: 70, number: 3, letter: 'B+', label: 'High' },
  { min: 60, number: 4, letter: 'B',  label: 'High Average' },
  { min: 55, number: 5, letter: 'C+', label: 'Average' },
  { min: 50, number: 6, letter: 'C',  label: 'Low Average' },
  { min: 40, number: 7, letter: 'D+', label: 'Low' },
  { min: 35, number: 8, letter: 'E',  label: 'Lower' },
  { min: 0,  number: 9, letter: 'F',  label: 'Low' }
];
function jhsGradeInfo(pct) {
  for (var i = 0; i < JHS_GRADE_TABLE.length; i++) {
    if (pct >= JHS_GRADE_TABLE[i].min) return JHS_GRADE_TABLE[i];
  }
  return JHS_GRADE_TABLE[JHS_GRADE_TABLE.length - 1];
}

// obtained/max -> short grade code for the given band ('basic'|'jhs'); returns 'AB' for absent.
function computeGrade(obtained, max, isAbsent, band) {
  if (isAbsent === true || String(isAbsent) === '1' || isAbsent === 1) return 'AB';
  var o = parseFloat(obtained), m = parseFloat(max);
  if (isNaN(o) || isNaN(m) || m <= 0) return '';
  var pct = (o / m) * 100;
  return String(band).toLowerCase() === 'jhs' ? jhsGradeInfo(pct).letter : basicGradeFromPercent(pct);
}

// short grade code -> full descriptor (printed in the Remarks column of the report card)
function sbaGradeDescriptor(grade, band) {
  var g = String(grade || '').toUpperCase();
  if (g === 'AB') return 'Absent';
  if (String(band).toLowerCase() === 'jhs') {
    var row = JHS_GRADE_TABLE.filter(function(r) { return r.letter === g; })[0];
    return row ? row.label : '';
  }
  return BASIC_GRADE_DESCRIPTORS[g] || '';
}

// BECE-style 1-9 grade number from raw percentage — same table as jhsGradeInfo, used for
// aggregate scoring (lower number = better, mirrors WAEC's post-2024 grading reform).
function computeBeceGrade(pct) {
  return jhsGradeInfo(pct).number;
}

// BECE aggregate: sum of the 4 named core subjects (English Language, Mathematics, Science,
// Social Studies) + the best 2 grades among every other subject sat (French, RME, Ghanaian
// Language, Computing, Creative Arts & Design, Career Technology, etc). Matching is by
// subject NAME only — a subject counts as "core" only if its name matches one of the four,
// regardless of the timetable's IsOptional flag. subjectResults: [{ subjectName, pct }].
// Returns { aggregate, breakdown } or null if fewer than 4 core + 2 other results exist.
function computeBeceAggregate(subjectResults) {
  var CORE_NAMES = ['english language', 'english', 'mathematics', 'maths', 'integrated science', 'science', 'social studies'];
  var core = [], others = [];
  (subjectResults || []).forEach(function(r) {
    var nameLc = String(r.subjectName || '').toLowerCase().trim();
    var grade = computeBeceGrade(r.pct);
    var item = { subjectName: r.subjectName, grade: grade };
    if (CORE_NAMES.indexOf(nameLc) !== -1) core.push(item);
    else others.push(item);
  });
  // de-dupe core subjects that map to the same underlying requirement (e.g. 'english'/'english language')
  var seenCore = {}, coreUnique = [];
  core.forEach(function(c) {
    var key = String(c.subjectName || '').toLowerCase().trim();
    var canon = (key === 'english' || key === 'english language') ? 'english language'
      : (key === 'mathematics' || key === 'maths') ? 'mathematics'
      : (key === 'integrated science' || key === 'science') ? 'science' : key;
    if (seenCore[canon]) return;
    seenCore[canon] = true;
    coreUnique.push(c);
  });
  if (coreUnique.length < 4 || others.length < 2) return null;
  coreUnique.sort(function(a, b) { return a.grade - b.grade; });
  var coreFour = coreUnique.slice(0, 4);
  others.sort(function(a, b) { return a.grade - b.grade; });
  var bestTwo = others.slice(0, 2);
  var breakdown = coreFour.concat(bestTwo);
  var aggregate = breakdown.reduce(function(s, x) { return s + x.grade; }, 0);
  return { aggregate: aggregate, breakdown: breakdown };
}

// composite UNIQUE check on marks (exam_id, student_id, subject_id)
function markUniqueExists(sh, examId, studentId, subjectId, excludeId) {
  var data = sh.getDataRange().getValues();
  var e = parseInt(examId, 10), s = parseInt(studentId, 10), sub = parseInt(subjectId, 10);
  for (var i = 1; i < data.length; i++) {
    if (excludeId !== undefined && data[i][0] === excludeId) continue;
    if (parseInt(data[i][1], 10) === e &&
        parseInt(data[i][2], 10) === s &&
        parseInt(data[i][3], 10) === sub) {
      return i; // returns row index for upsert use
    }
  }
  return -1;
}

// attendance / fee_structure / fee_payments RBAC + helpers
function canReadAttendance(role) {
  var r = String(role || '').toLowerCase();
  // clerk = read-only (front desk needs to answer "was my child present?"); write stays admin/teacher/supervisor
  return r === 'admin' || r === 'clerk' || r === 'teacher' || r === 'supervisor' || r === 'student' || r === 'parent';
}

function canReadFeeStructure(role) {
  var r = String(role || '').toLowerCase();
  return r === 'admin' || r === 'clerk' || r === 'student' || r === 'parent';
}

function canReadPayments(role) {
  var r = String(role || '').toLowerCase();
  return r === 'admin' || r === 'clerk' || r === 'student' || r === 'parent';
}

function nextAttendanceId(sh) {
  var data = sh.getDataRange().getValues(), max = 0;
  for (var i = 1; i < data.length; i++) {
    var n = parseInt(data[i][0], 10);
    if (!isNaN(n) && n > max) max = n;
  }
  return max + 1;
}

function nextFeeStructureId(sh) {
  var data = sh.getDataRange().getValues(), max = 0;
  for (var i = 1; i < data.length; i++) {
    var n = parseInt(data[i][0], 10);
    if (!isNaN(n) && n > max) max = n;
  }
  return max + 1;
}

function nextPaymentId(sh) {
  var data = sh.getDataRange().getValues(), max = 0;
  for (var i = 1; i < data.length; i++) {
    var n = parseInt(data[i][0], 10);
    if (!isNaN(n) && n > max) max = n;
  }
  return max + 1;
}

// discipline + conduct RBAC — supervisor has WRITE access for the first time in these modules
function canReadDiscipline(role) {
  var r = String(role || '').toLowerCase();
  return r === 'admin' || r === 'teacher' || r === 'supervisor' || r === 'student' || r === 'parent';
}

function canWriteDiscipline(role) {
  var r = String(role || '').toLowerCase();
  return r === 'admin' || r === 'teacher' || r === 'supervisor';
}

function canReadConduct(role) {
  var r = String(role || '').toLowerCase();
  return r === 'admin' || r === 'teacher' || r === 'supervisor' || r === 'student' || r === 'parent';
}

function canWriteConduct(role) {
  var r = String(role || '').toLowerCase();
  return r === 'admin' || r === 'teacher' || r === 'supervisor';
}

function nextDisciplineId(sh) {
  var data = sh.getDataRange().getValues(), max = 0;
  for (var i = 1; i < data.length; i++) {
    var n = parseInt(data[i][0], 10);
    if (!isNaN(n) && n > max) max = n;
  }
  return max + 1;
}

function nextConductId(sh) {
  var data = sh.getDataRange().getValues(), max = 0;
  for (var i = 1; i < data.length; i++) {
    var n = parseInt(data[i][0], 10);
    if (!isNaN(n) && n > max) max = n;
  }
  return max + 1;
}

// generic next-id helper for any sheet (col 0 = ID)
function nextRowId(sh) {
  var data = sh.getDataRange().getValues(), max = 0;
  for (var i = 1; i < data.length; i++) {
    var n = parseInt(data[i][0], 10);
    if (!isNaN(n) && n > max) max = n;
  }
  return max + 1;
}

// activities RBAC — same pattern as Conduct
function canReadActivities(role) {
  var r = String(role || '').toLowerCase();
  return r === 'admin' || r === 'teacher' || r === 'supervisor' || r === 'student' || r === 'parent';
}
function canWriteActivities(role) {
  var r = String(role || '').toLowerCase();
  return r === 'admin' || r === 'teacher';
}

// complaints RBAC — admin/teacher/supervisor/student/parent can submit; teacher reads OWN submissions only
function canReadComplaints(role) {
  var r = String(role || '').toLowerCase();
  return r === 'admin' || r === 'clerk' || r === 'teacher' || r === 'supervisor' || r === 'student' || r === 'parent';
}
function canWriteComplaints(role) {
  var r = String(role || '').toLowerCase();
  return r === 'admin' || r === 'clerk' || r === 'teacher' || r === 'supervisor' || r === 'student' || r === 'parent';
}

// notices RBAC — clerk reads but doesn't write; supervisor write
function canReadNotices(role) {
  var r = String(role || '').toLowerCase();
  return r === 'admin' || r === 'clerk' || r === 'teacher' || r === 'supervisor' || r === 'student' || r === 'parent';
}
// admin/supervisor post any notice; teachers may post only class_specific notices to their own assigned classes
function canWriteNotices(role) {
  var r = String(role || '').toLowerCase();
  return r === 'admin' || r === 'supervisor' || r === 'teacher';
}

// helpdesk RBAC — narrow: admin, supervisor, student/parent (NOT teacher, NOT clerk)
function canReadHelpdesk(role) {
  var r = String(role || '').toLowerCase();
  return r === 'admin' || r === 'clerk' || r === 'supervisor' || r === 'student' || r === 'parent';
}
function canManageHelpdesk(role) {
  var r = String(role || '').toLowerCase();
  return r === 'admin' || r === 'clerk' || r === 'supervisor';
}

// lesson_plans + teaching_logbook RBAC
function canReadLessonPlans(role) {
  var r = String(role || '').toLowerCase();
  return r === 'admin' || r === 'teacher' || r === 'supervisor';
}
function canReadLogbook(role) {
  var r = String(role || '').toLowerCase();
  return r === 'admin' || r === 'teacher' || r === 'supervisor' || r === 'student' || r === 'parent';
}

// documents RBAC
function canReadDocuments(role) {
  var r = String(role || '').toLowerCase();
  return r === 'admin' || r === 'clerk' || r === 'teacher' || r === 'supervisor' || r === 'student' || r === 'parent';
}

// timetable + periods RBAC — read = everyone; write = admin
function canReadTimetable(role) {
  var r = String(role || '').toLowerCase();
  return r === 'admin' || r === 'clerk' || r === 'teacher' || r === 'supervisor' || r === 'student' || r === 'parent';
}
function canWriteTimetable(role) { return String(role || '').toLowerCase() === 'admin'; }

// day-of-week helpers
var DAY_LIST = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
var DAY_ORDER = { monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 7 };
function todayDayName() { return DAY_LIST[new Date().getDay()]; }
function isValidDay(d) { return DAY_LIST.indexOf(String(d || '').toLowerCase()) !== -1; }
function isValidTerm(t) {
  return ['full_year','term_1','term_2','term_3'].indexOf(String(t || '').toLowerCase()) !== -1;
}
// 'HH:MM' format check
function isValidHHMM(s) { return /^\d{2}:\d{2}$/.test(String(s || '')); }

// auto-gen prefixed sequential code (CMP-YYYY-XXXXXXXX or TKT-YYYY-XXXXXXXX)
function generatePrefixedCode(sh, codeColIndex, prefix) {
  var year = new Date().getFullYear();
  var fullPrefix = prefix + '-' + year + '-';
  var data = sh.getDataRange().getValues(), maxSeq = 0;
  for (var i = 1; i < data.length; i++) {
    var c = String(data[i][codeColIndex] || '');
    if (c.indexOf(fullPrefix) === 0) {
      var seq = parseInt(c.substring(fullPrefix.length), 10);
      if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
    }
  }
  return fullPrefix + String(maxSeq + 1).padStart(8, '0');
}

// resolve polymorphic submitter/raiser/entity to a display name
// type: student/parent/teacher/supervisor/staff
function resolvePolymorphicName(type, id) {
  if (!type || !id) return '';
  var t = String(type).toLowerCase();
  var nid = parseInt(id, 10);
  if (isNaN(nid)) return '';

  if (t === 'student') {
    var ssh = getSheet(STUDENTS_SHEET);
    if (!ssh) return '';
    var sdata = ssh.getDataRange().getValues();
    for (var i = 1; i < sdata.length; i++) {
      if (sdata[i][0] === nid && String(sdata[i][36]) === '0') {
        return [sdata[i][2], sdata[i][3], sdata[i][4]].filter(function(x){ return x; }).join(' ');
      }
    }
  } else if (t === 'parent') {
    var psh = getSheet(PARENTS_SHEET);
    if (!psh) return '';
    var pdata = psh.getDataRange().getValues();
    for (var j = 1; j < pdata.length; j++) {
      if (pdata[j][0] === nid && String(pdata[j][10]) === '0') return pdata[j][1];
    }
  } else if (t === 'teacher' || t === 'supervisor' || t === 'staff' || t === 'admin' || t === 'clerk') {
    var umap = getUsersMap();
    return umap[nid] ? umap[nid].fullName : '';
  }
  return '';
}

// notice audience filter — given a role, what target_audience values should they see?
function noticeAudienceMatches(targetAudience, targetClassId, role, currentUser, viewerClassIds) {
  var ta = String(targetAudience || '').toLowerCase();
  var r = String(role || '').toLowerCase();

  // admin/clerk/supervisor see all notices
  if (r === 'admin' || r === 'clerk' || r === 'supervisor') return true;

  if (ta === 'all') return true;
  if (ta === 'staff' && (r === 'teacher' || r === 'admin' || r === 'clerk' || r === 'supervisor')) return true;
  if (ta === 'teachers' && r === 'teacher') return true;
  if (ta === 'students' && r === 'student') return true;
  if (ta === 'parents' && r === 'parent') return true;
  if (ta === 'class_specific') {
    // student/parent see if their class matches; teacher sees if assigned to that class
    if (r === 'teacher') {
      var classIds = getTeacherClassIds(currentUser);
      return classIds.indexOf(parseInt(targetClassId, 10)) !== -1;
    }
    if (r === 'student' || r === 'parent') {
      var vci = viewerClassIds || getViewerScope(currentUser, r).classIds;
      return vci.indexOf(parseInt(targetClassId, 10)) !== -1;
    }
    return false;
  }
  return false;
}

// is the given student in any of currentUser teacher's assigned classes?
// Used by discipline + conduct since those tables don't have a class_id column.
function teacherHasStudent(currentUser, studentId) {
  var classIds = getTeacherClassIds(currentUser);
  if (!classIds.length) return false;
  var ssh = getSheet(STUDENTS_SHEET);
  if (!ssh) return false;
  var data = ssh.getDataRange().getValues();
  var sid = parseInt(studentId, 10);
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === sid && String(data[i][36]) === '0') {
      return classIds.indexOf(parseInt(data[i][25], 10)) !== -1;
    }
  }
  return false;
}

// students in teacher's classes — used to filter read endpoints
function getTeacherStudentIds(currentUser) {
  var classIds = getTeacherClassIds(currentUser);
  if (!classIds.length) return [];
  var ssh = getSheet(STUDENTS_SHEET);
  if (!ssh) return [];
  var data = ssh.getDataRange().getValues(), ids = [];
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][36]) === '1') continue;
    if (classIds.indexOf(parseInt(data[i][25], 10)) !== -1) {
      ids.push(parseInt(data[i][0], 10));
    }
  }
  return ids;
}

// is the given yyyy-mm-dd today's date?
function isDateToday(dateStr) {
  if (!dateStr) return false;
  var d = String(dateStr).split('T')[0];
  return d === todayStr();
}

// generate RCP-YYYY-seq receipt number
function generateReceiptNumber(sh) {
  var year = new Date().getFullYear();
  var prefix = 'RCP-' + year + '-';
  var data = sh.getDataRange().getValues(), maxSeq = 0;
  for (var i = 1; i < data.length; i++) {
    var rcp = String(data[i][11] || '');
    if (rcp.indexOf(prefix) === 0) {
      var seq = parseInt(rcp.substring(prefix.length), 10);
      if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
    }
  }
  return prefix + String(maxSeq + 1).padStart(8, '0');
}

function computePaymentStatus(amountPaid, amountExpected) {
  var p = parseFloat(amountPaid) || 0;
  var e = parseFloat(amountExpected) || 0;
  if (e <= 0) return 'paid';   // edge case
  if (p <= 0) return 'pending';
  if (p >= e) return 'paid';
  return 'partial';
}

// is exam published? (used for teacher edit lock)
function getExamRow(examId) {
  var sh = getSheet(EXAMS_SHEET);
  if (!sh) return null;
  var data = sh.getDataRange().getValues();
  var idn = parseInt(examId, 10);
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === idn && String(data[i][11]) === '0') return data[i];
  }
  return null;
}

function nextLinkId(sh) {
  var data = sh.getDataRange().getValues(), max = 0;
  for (var i = 1; i < data.length; i++) {
    var n = parseInt(data[i][0], 10);
    if (!isNaN(n) && n > max) max = n;
  }
  return max + 1;
}

// composite-unique check on (parent_id, student_id)
function parentStudentLinkExists(sh, parentId, studentId, excludeId) {
  var data = sh.getDataRange().getValues();
  var p = parseInt(parentId, 10);
  var s = parseInt(studentId, 10);
  for (var i = 1; i < data.length; i++) {
    if (excludeId !== undefined && data[i][0] === excludeId) continue;
    if (parseInt(data[i][1], 10) === p && parseInt(data[i][2], 10) === s) return true;
  }
  return false;
}

// teacher's "own class parents" bridge — match parent.mobile to student.father/mother/guardian_mobile
// of students in teacher's classes. Replace this with a parent_students junction lookup once that table ships.
function getTeacherParentMobiles(currentUser) {
  var classIds = getTeacherClassIds(currentUser);
  if (!classIds.length) return [];

  var ssh = getSheet(STUDENTS_SHEET);
  if (!ssh) return [];

  var data = ssh.getDataRange().getValues(), seen = {};
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][36]) === '1') continue;
    var clsId = parseInt(data[i][25], 10);
    if (classIds.indexOf(clsId) === -1) continue;
    if (data[i][17]) seen[String(data[i][17]).trim()] = true; // father_mobile
    if (data[i][20]) seen[String(data[i][20]).trim()] = true; // mother_mobile
    if (data[i][23]) seen[String(data[i][23]).trim()] = true; // guardian_mobile
  }
  return Object.keys(seen);
}

// recompute classes.total_strength after student CUD (counts active+inactive+suspended, excludes transferred/passed_out/deleted)
function recomputeClassStrength(classId) {
  if (!classId && classId !== 0) return;
  var cid = parseInt(classId, 10);
  if (isNaN(cid)) return;
  var ssh = getSheet(STUDENTS_SHEET);
  var csh = getSheet(CLASSES_SHEET);
  if (!ssh || !csh) return;

  var sdata = ssh.getDataRange().getValues(), count = 0;
  for (var i = 1; i < sdata.length; i++) {
    if (String(sdata[i][36]) === '1') continue;
    if (parseInt(sdata[i][25], 10) !== cid) continue;
    var st = String(sdata[i][35] || '').toLowerCase();
    if (st === 'transferred' || st === 'passed_out') continue;
    count++;
  }

  var cdata = csh.getDataRange().getValues();
  for (var j = 1; j < cdata.length; j++) {
    if (cdata[j][0] === cid && String(cdata[j][6]) === '0') {
      csh.getRange(j + 1, 6).setValue(count);
      csh.getRange(j + 1, 9).setValue(nowIso());
      return;
    }
  }
}

// next auto-increment id
function nextUserId(sh) {
  var data = sh.getDataRange().getValues(), max = 0;
  for (var i = 1; i < data.length; i++) {
    var n = parseInt(data[i][0], 10);
    if (!isNaN(n) && n > max) max = n;
  }
  return max + 1;
}

// dates -> ISO 8601 always. Handles Date, ISO string, date-only string, sheets serial number, or anything parseable.
// always returns full timestamp form like "2026-05-08T09:04:10.733Z" (or '' for empty/invalid).
function toIso(v) {
  if (v === '' || v === null || v === undefined) return '';
  if (v instanceof Date) return isNaN(v.getTime()) ? '' : v.toISOString();
  if (typeof v === 'string') {
    var s = v.trim();
    if (!s) return '';
    // already full ISO with time → re-normalize via Date for canonical output
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) {
      var di = new Date(s);
      return isNaN(di.getTime()) ? s : di.toISOString();
    }
    // date-only "YYYY-MM-DD" → midnight UTC ISO
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      var dd = new Date(s + 'T00:00:00.000Z');
      return isNaN(dd.getTime()) ? s : dd.toISOString();
    }
    // last-resort parse
    var dx = new Date(s);
    return isNaN(dx.getTime()) ? s : dx.toISOString();
  }
  if (typeof v === 'number') {
    var d = new Date(Math.round((v - 25569) * 86400 * 1000));
    return isNaN(d.getTime()) ? '' : d.toISOString();
  }
  return String(v);
}

// row -> public user object (no password)
function rowToUser(row) {
  return {
    ID: row[0],
    Username: row[1],
    FullName: row[2],
    Email: row[3],
    Mobile: row[5],
    Role: String(row[6] || '').toLowerCase(),
    Gender: String(row[7] || '').toLowerCase(),
    DateOfBirth: toIso(row[8]),
    Qualification: row[9],
    Specialization: row[10],
    JoiningDate: toIso(row[11]),
    ProfilePhoto: row[12] || DEFAULT_LOGO,
    Address: row[13],
    Status: String(row[14] || '').toLowerCase(),
    LastLogin: toIso(row[15]),
    CreatedAt: toIso(row[19]),
    CreatedBy: row[20],
    UpdatedAt: toIso(row[21]),
    UpdatedBy: row[22],
    EmployeeCode: row[23] || '',
    EmergencyContactName: row[24] || '',
    EmergencyContactPhone: row[25] || ''
  };
}

// ============== Init Sheets ==============
function initializeSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var us = ss.getSheetByName(USERS_SHEET);

  if (!us) {
    us = ss.insertSheet(USERS_SHEET);
    us.appendRow(USER_HEADERS);
    us.getRange(1, 1, 1, USER_HEADERS.length).setBackground('#001f3f').setFontColor('white').setFontWeight('bold');
    us.setFrozenRows(1);

    var ts = nowIso(), today = todayStr();
    // default admin
    us.appendRow([1,'admin','System Administrator','admin@example.com','admin123','+233244000001','admin','male','1990-01-01','MBA Computer Science','System Management',today,DEFAULT_LOGO,'Head Office','active','','0','light','',ts,'System',ts,'System','EMP001','Backup Contact','+233244000099']);
    // default teacher
    us.appendRow([2,'user','Demo Teacher','user@example.com','user123','+233244000002','teacher','male','1992-05-15','M.Sc Mathematics','Mathematics',today,DEFAULT_LOGO,'Demo Address','active','','0','light','',ts,'System',ts,'System','EMP002','Backup Contact','+233244000098']);
  }

  var cs = ss.getSheetByName(CLASSES_SHEET);
  if (!cs) {
    cs = ss.insertSheet(CLASSES_SHEET);
    cs.appendRow(CLASS_HEADERS);
    cs.getRange(1, 1, 1, CLASS_HEADERS.length).setBackground('#001f3f').setFontColor('white').setFontWeight('bold');
    cs.setFrozenRows(1);
  }

  var subs = ss.getSheetByName(SUBJECTS_SHEET);
  if (!subs) {
    subs = ss.insertSheet(SUBJECTS_SHEET);
    subs.appendRow(SUBJECT_HEADERS);
    subs.getRange(1, 1, 1, SUBJECT_HEADERS.length).setBackground('#001f3f').setFontColor('white').setFontWeight('bold');
    subs.setFrozenRows(1);
  }

  var asg = ss.getSheetByName(ASSIGNMENTS_SHEET);
  if (!asg) {
    asg = ss.insertSheet(ASSIGNMENTS_SHEET);
    asg.appendRow(ASSIGNMENT_HEADERS);
    asg.getRange(1, 1, 1, ASSIGNMENT_HEADERS.length).setBackground('#001f3f').setFontColor('white').setFontWeight('bold');
    asg.setFrozenRows(1);
  }

  var sts = ss.getSheetByName(STUDENTS_SHEET);
  if (!sts) {
    sts = ss.insertSheet(STUDENTS_SHEET);
    sts.appendRow(STUDENT_HEADERS);
    sts.getRange(1, 1, 1, STUDENT_HEADERS.length).setBackground('#001f3f').setFontColor('white').setFontWeight('bold');
    sts.setFrozenRows(1);
  }

  var pts = ss.getSheetByName(PARENTS_SHEET);
  if (!pts) {
    pts = ss.insertSheet(PARENTS_SHEET);
    pts.appendRow(PARENT_HEADERS);
    pts.getRange(1, 1, 1, PARENT_HEADERS.length).setBackground('#001f3f').setFontColor('white').setFontWeight('bold');
    pts.setFrozenRows(1);
  }

  var psl = ss.getSheetByName(PARENT_STUDENTS_SHEET);
  if (!psl) {
    psl = ss.insertSheet(PARENT_STUDENTS_SHEET);
    psl.appendRow(PARENT_STUDENT_HEADERS);
    psl.getRange(1, 1, 1, PARENT_STUDENT_HEADERS.length).setBackground('#001f3f').setFontColor('white').setFontWeight('bold');
    psl.setFrozenRows(1);
  }

  var exs = ss.getSheetByName(EXAMS_SHEET);
  if (!exs) {
    exs = ss.insertSheet(EXAMS_SHEET);
    exs.appendRow(EXAM_HEADERS);
    exs.getRange(1, 1, 1, EXAM_HEADERS.length).setBackground('#001f3f').setFontColor('white').setFontWeight('bold');
    exs.setFrozenRows(1);
  }

  var mks = ss.getSheetByName(MARKS_SHEET);
  if (!mks) {
    mks = ss.insertSheet(MARKS_SHEET);
    mks.appendRow(MARK_HEADERS);
    mks.getRange(1, 1, 1, MARK_HEADERS.length).setBackground('#001f3f').setFontColor('white').setFontWeight('bold');
    mks.setFrozenRows(1);
  }

  var att = ss.getSheetByName(ATTENDANCE_SHEET);
  if (!att) {
    att = ss.insertSheet(ATTENDANCE_SHEET);
    att.appendRow(ATTENDANCE_HEADERS);
    att.getRange(1, 1, 1, ATTENDANCE_HEADERS.length).setBackground('#001f3f').setFontColor('white').setFontWeight('bold');
    att.setFrozenRows(1);
  }

  var fst = ss.getSheetByName(FEE_STRUCTURE_SHEET);
  if (!fst) {
    fst = ss.insertSheet(FEE_STRUCTURE_SHEET);
    fst.appendRow(FEE_STRUCTURE_HEADERS);
    fst.getRange(1, 1, 1, FEE_STRUCTURE_HEADERS.length).setBackground('#001f3f').setFontColor('white').setFontWeight('bold');
    fst.setFrozenRows(1);
  }

  var fpy = ss.getSheetByName(FEE_PAYMENTS_SHEET);
  if (!fpy) {
    fpy = ss.insertSheet(FEE_PAYMENTS_SHEET);
    fpy.appendRow(FEE_PAYMENT_HEADERS);
    fpy.getRange(1, 1, 1, FEE_PAYMENT_HEADERS.length).setBackground('#001f3f').setFontColor('white').setFontWeight('bold');
    fpy.setFrozenRows(1);
  }

  var fdu = ss.getSheetByName(FEE_DUES_SHEET);
  if (!fdu) {
    fdu = ss.insertSheet(FEE_DUES_SHEET);
    fdu.appendRow(FEE_DUE_HEADERS);
    fdu.getRange(1, 1, 1, FEE_DUE_HEADERS.length).setBackground('#001f3f').setFontColor('white').setFontWeight('bold');
    fdu.setFrozenRows(1);
  }

  var dsc = ss.getSheetByName(DISCIPLINE_SHEET);
  if (!dsc) {
    dsc = ss.insertSheet(DISCIPLINE_SHEET);
    dsc.appendRow(DISCIPLINE_HEADERS);
    dsc.getRange(1, 1, 1, DISCIPLINE_HEADERS.length).setBackground('#001f3f').setFontColor('white').setFontWeight('bold');
    dsc.setFrozenRows(1);
  }

  var cnd = ss.getSheetByName(CONDUCT_SHEET);
  if (!cnd) {
    cnd = ss.insertSheet(CONDUCT_SHEET);
    cnd.appendRow(CONDUCT_HEADERS);
    cnd.getRange(1, 1, 1, CONDUCT_HEADERS.length).setBackground('#001f3f').setFontColor('white').setFontWeight('bold');
    cnd.setFrozenRows(1);
  }

  var rrm = ss.getSheetByName(REPORT_REMARKS_SHEET);
  if (!rrm) {
    rrm = ss.insertSheet(REPORT_REMARKS_SHEET);
    rrm.appendRow(REPORT_REMARKS_HEADERS);
    rrm.getRange(1, 1, 1, REPORT_REMARKS_HEADERS.length).setBackground('#001f3f').setFontColor('white').setFontWeight('bold');
    rrm.setFrozenRows(1);
  }

  var initBlock = [
    [ACTIVITIES_SHEET, ACTIVITY_HEADERS],
    [COMPLAINTS_SHEET, COMPLAINT_HEADERS],
    [NOTICES_SHEET, NOTICE_HEADERS],
    [HELPDESK_SHEET, HELPDESK_HEADERS],
    [LESSON_PLANS_SHEET, LESSON_PLAN_HEADERS],
    [TEACHING_LOGBOOK_SHEET, TEACHING_LOGBOOK_HEADERS],
    [DOCUMENTS_SHEET, DOCUMENT_HEADERS],
    [PERIODS_SHEET, PERIOD_HEADERS],
    [TIMETABLE_SHEET, TIMETABLE_HEADERS],
    [SETTINGS_SHEET, SETTINGS_HEADERS],
    [CALENDAR_SHEET, CALENDAR_HEADERS],
    [PTM_SLOTS_SHEET, PTM_SLOT_HEADERS],
    [PTM_BOOKINGS_SHEET, PTM_BOOKING_HEADERS],
    [SUBSTITUTES_SHEET, SUBSTITUTE_HEADERS],
    [ASSETS_SHEET, ASSET_HEADERS],
    [ASSET_MAINTENANCE_SHEET, ASSET_MAINTENANCE_HEADERS],
    [STOCK_ITEMS_SHEET, STOCK_ITEM_HEADERS],
    [STOCK_TRANSACTIONS_SHEET, STOCK_TRANSACTION_HEADERS],
    [ADMISSIONS_SHEET, ADMISSION_HEADERS],
    [ACCOUNT_TXN_SHEET, ACCOUNT_TXN_HEADERS]
  ];
  initBlock.forEach(function(pair) {
    if (!ss.getSheetByName(pair[0])) {
      var newSh = ss.insertSheet(pair[0]);
      newSh.appendRow(pair[1]);
      newSh.getRange(1, 1, 1, pair[1].length).setBackground('#001f3f').setFontColor('white').setFontWeight('bold');
      newSh.setFrozenRows(1);
    }
  });

  var ls = ss.getSheetByName(LOGS_SHEET);
  if (!ls) {
    ls = ss.insertSheet(LOGS_SHEET);
    ls.appendRow(['Timestamp', 'User', 'Action', 'Details']);
    ls.getRange(1, 1, 1, 4).setBackground('#001f3f').setFontColor('white').setFontWeight('bold');
    ls.setFrozenRows(1);
  }

  // pin every date-like column as text format so future writes don't auto-convert "Sept 2026" / dates / ISO strings
  try { pinAllDateColumns(); } catch (e) {}

  return { success: true, message: 'Sheets initialized' };
}

// ============== Auth ==============
// unified login: try Users (staff) → Students → Parents. one form, three sources.
// recovery: run manually from Apps Script editor (Run → resetAdminPassword) to
// force-reset the admin account back to admin / admin123. Useful if the staff
// password was changed and forgotten — no UI access required.
function resetAdminPassword() {
  var sh = getSheet(USERS_SHEET);
  if (!sh) throw new Error('Users sheet not found — run initializeSheets first');
  var data = sh.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    var u = String(data[i][1] || '').trim().toLowerCase();
    if (u !== 'admin') continue;
    sh.getRange(i + 1, 5).setValue('admin123');     // Password
    sh.getRange(i + 1, 15).setValue('active');      // Status (in case suspended)
    sh.getRange(i + 1, 17).setValue('0');           // IsDeleted (in case soft-deleted)
    sh.getRange(i + 1, 22).setValue(nowIso());      // UpdatedAt
    Logger.log('admin password reset to admin123');
    return 'admin password reset to admin123';
  }
  // no admin row exists — append a fresh one
  var ts = nowIso(), today = todayStr();
  sh.appendRow([1,'admin','System Administrator','admin@example.com','admin123','+233244000001','admin','male','1990-01-01','MBA','System',today,DEFAULT_LOGO,'Head Office','active','','0','light','',ts,'System',ts,'System','EMP001','Backup','+233244000099']);
  Logger.log('admin user created with admin / admin123');
  return 'admin user created with admin / admin123';
}

function authenticateUser(username, password) {
  try {
    if (!username || !password) return { success: false, message: 'Username and password required' };

    var staff = tryStaffAuth(username, password);
    if (staff !== null) return staff;

    var student = tryStudentAuth(username, password);
    if (student !== null) return student;

    var parent = tryParentAuth(username, password);
    if (parent !== null) return parent;

    addLog(username, 'Login Failed', 'No match in users/students/parents');
    return { success: false, message: 'Invalid credentials' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// staff: Users.Username + Password (cols 1, 4)
function tryStaffAuth(username, password) {
  var sh = getSheet(USERS_SHEET);
  if (!sh) return null;
  var data = sh.getDataRange().getValues();
  // case-insensitive trimmed username match (matches student/parent paths)
  var key = String(username || '').trim().toLowerCase();
  for (var i = 1; i < data.length; i++) {
    var rowUser = String(data[i][1] || '').trim().toLowerCase();
    if (rowUser !== key) continue;

    if (String(data[i][16]) === '1') {
      addLog(username, 'Login Failed', 'Account deleted');
      return { success: false, message: 'Account no longer exists' };
    }
    var st = String(data[i][14] || '').toLowerCase();
    if (st !== 'active') {
      addLog(username, 'Login Failed', 'Status: ' + st);
      return { success: false, message: 'Account is ' + st + '. Contact administrator.' };
    }
    // String() cast on both sides — defends against sheet type quirks (numeric pwd, leading apostrophe, etc.)
    if (String(password) !== String(data[i][4] || '')) {
      addLog(username, 'Login Failed', 'Invalid password');
      return { success: false, message: 'Invalid password' };
    }

    sh.getRange(i + 1, 16).setValue(nowIso());
    addLog(username, 'Login Success', 'User logged in');

    var u = rowToUser(data[i]);
    u.success = true;
    u.username = u.Username;
    u.role = u.Role;
    u.email = u.Email;
    u.fullName = u.FullName;
    u.profileImage = u.ProfilePhoto;
    u.themeMode = data[i][17] || 'light';
    u.customColors = data[i][18] || '';

    // student/parent mirror rows — attach the scoping ids the SPA needs (own class / own children)
    if (u.role === 'student') {
      var _si = _studentSelfInfo(u.Username);
      if (_si) { u.studentId = _si.studentId; u.classId = _si.classId; u.classLabel = _si.classLabel; u.admissionNumber = u.Username; if (_si.photo) u.profileImage = _si.photo; }
    } else if (u.role === 'parent') {
      var _pi = _parentSelfInfo(u.Username);
      if (_pi) { u.parentId = _pi.parentId; u.mobile = _pi.mobile || u.Username; }
    }
    return u;
  }
  return null;
}

// student: AdmissionNumber OR Email (cols 1, 10) + LoginPasswordHash (col 34, plain per AS rule)
function tryStudentAuth(login, password) {
  var sh = getSheet(STUDENTS_SHEET);
  if (!sh) return null;
  var data = sh.getDataRange().getValues();
  var key = String(login || '').trim().toLowerCase();

  for (var i = 1; i < data.length; i++) {
    var admNo = String(data[i][1] || '').trim().toLowerCase();
    var email = String(data[i][10] || '').trim().toLowerCase();
    if (admNo !== key && email !== key) continue;

    if (String(data[i][36]) === '1') {
      addLog(login, 'Student Login Failed', 'Soft-deleted');
      return { success: false, message: 'Account no longer exists' };
    }
    var st = String(data[i][35] || '').toLowerCase();
    if (st !== 'active') {
      addLog(login, 'Student Login Failed', 'Status: ' + st);
      return { success: false, message: 'Student account is ' + st + '. Contact administrator.' };
    }
    if (String(password) !== String(data[i][34] || '')) {
      addLog(login, 'Student Login Failed', 'Invalid password');
      return { success: false, message: 'Invalid password' };
    }

    var fullName = [data[i][2], data[i][3], data[i][4]].filter(function(x){ return x; }).join(' ');
    var clsId = parseInt(data[i][25], 10);
    var cmap = getClassesMap();
    var classLabel = cmap[clsId] ? cmap[clsId].label : '';

    addLog(login, 'Student Login Success', data[i][1]);

    return {
      success: true,
      role: 'student',
      username: data[i][1] || '',
      fullName: fullName,
      email: data[i][10] || '',
      profileImage: data[i][33] || DEFAULT_LOGO,
      themeMode: 'light',
      customColors: '',
      studentId: data[i][0],
      classId: clsId,
      classLabel: classLabel,
      admissionNumber: data[i][1] || ''
    };
  }
  return null;
}

// parent: Mobile OR Email (cols 3, 2) + PasswordHash (col 4, plain per AS rule)
function tryParentAuth(login, password) {
  var sh = getSheet(PARENTS_SHEET);
  if (!sh) return null;
  var data = sh.getDataRange().getValues();
  var key = String(login || '').trim().toLowerCase();

  for (var i = 1; i < data.length; i++) {
    var mob = String(data[i][3] || '').trim().toLowerCase();
    var email = String(data[i][2] || '').trim().toLowerCase();
    if (mob !== key && email !== key) continue;

    if (String(data[i][10]) === '1') {
      addLog(login, 'Parent Login Failed', 'Soft-deleted');
      return { success: false, message: 'Account no longer exists' };
    }
    var st = String(data[i][9] || '').toLowerCase();
    if (st !== 'active') {
      addLog(login, 'Parent Login Failed', 'Status: ' + st);
      return { success: false, message: 'Parent account is ' + st + '. Contact administrator.' };
    }
    if (String(password) !== String(data[i][4] || '')) {
      addLog(login, 'Parent Login Failed', 'Invalid password');
      return { success: false, message: 'Invalid password' };
    }

    sh.getRange(i + 1, 9).setValue(nowIso()); // last_login col 8 (0-idx) → col 9 (1-idx)
    addLog(login, 'Parent Login Success', data[i][1]);

    return {
      success: true,
      role: 'parent',
      username: data[i][3] || '',
      fullName: data[i][1] || '',
      email: data[i][2] || '',
      profileImage: data[i][26] || DEFAULT_LOGO,
      themeMode: 'light',
      customColors: '',
      parentId: data[i][0],
      mobile: data[i][3] || ''
    };
  }
  return null;
}

// resolve a logged-in student's id + class from their login key (admission no / email)
// used to enrich the unified-auth payload so window.SMS_CTX has classId
function _studentSelfInfo(loginKey) {
  var ssh = getSheet(STUDENTS_SHEET);
  if (!ssh) return null;
  var data = ssh.getDataRange().getValues();
  var key = String(loginKey || '').trim().toLowerCase();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][36]) === '1') continue;
    var admR = String(data[i][1] || '').trim().toLowerCase();
    var emR = String(data[i][10] || '').trim().toLowerCase();
    if (admR !== key && emR !== key) continue;
    var clsId = parseInt(data[i][25], 10);
    var cmap = getClassesMap();
    return { studentId: data[i][0], classId: clsId, classLabel: cmap[clsId] ? cmap[clsId].label : '', photo: data[i][33] || '' };
  }
  return null;
}

// resolve a logged-in parent's id from their login key (mobile / email)
function _parentSelfInfo(loginKey) {
  var psh = getSheet(PARENTS_SHEET);
  if (!psh) return null;
  var data = psh.getDataRange().getValues();
  var key = String(loginKey || '').trim().toLowerCase();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][10]) === '1') continue;
    var mob = String(data[i][3] || '').trim().toLowerCase();
    var em = String(data[i][2] || '').trim().toLowerCase();
    if (mob !== key && em !== key) continue;
    return { parentId: data[i][0], mobile: data[i][3] || '' };
  }
  return null;
}

// keep Students.LoginPasswordHash in sync when a student changes pwd via My Account (mirror is in Users)
function _syncStudentPassword(loginKey, newPwd) {
  var ssh = getSheet(STUDENTS_SHEET);
  if (!ssh) return;
  var data = ssh.getDataRange().getValues();
  var key = String(loginKey || '').trim().toLowerCase();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][36]) === '1') continue;
    var admR = String(data[i][1] || '').trim().toLowerCase();
    var emR = String(data[i][10] || '').trim().toLowerCase();
    if (admR === key || emR === key) { ssh.getRange(i + 1, 35).setValue(String(newPwd)); return; }
  }
}
// keep Parents.PasswordHash in sync when a parent changes pwd via My Account
function _syncParentPassword(mobile, email, newPwd) {
  var psh = getSheet(PARENTS_SHEET);
  if (!psh) return;
  var data = psh.getDataRange().getValues();
  var mk = String(mobile || '').trim().toLowerCase(), ek = String(email || '').trim().toLowerCase();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][10]) === '1') continue;
    var mR = String(data[i][3] || '').trim().toLowerCase();
    var eR = String(data[i][2] || '').trim().toLowerCase();
    if ((mk && mR === mk) || (ek && eR === ek)) { psh.getRange(i + 1, 5).setValue(String(newPwd)); return; }
  }
}

// ============== Users CRUD (admin only) ==============
function getAllUsers(currentUser, currentRole) {
  try {
    if (!isAdmin(currentRole)) return { success: false, message: 'Forbidden — admin only' };

    var sh = getSheet(USERS_SHEET);
    if (!sh) return { success: false, message: 'Users sheet not found' };

    var data = sh.getDataRange().getValues(), users = [];
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][16]) === '1') continue; // skip soft-deleted
      users.push(rowToUser(data[i]));
    }
    return { success: true, data: users };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

function addUser(userData, currentUser, currentRole) {
  try {
    if (!isAdmin(currentRole)) return { success: false, message: 'Forbidden — admin only' };

    var sh = getSheet(USERS_SHEET);
    if (!sh) return { success: false, message: 'Users sheet not found' };

    // required validation
    if (!userData.Username || !userData.Email || !userData.Password || !userData.FullName || !userData.Mobile) {
      return { success: false, message: 'Username, FullName, Email, Mobile, Password are required' };
    }

    // dupe check (active rows)
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][16]) === '1') continue;
      if (data[i][1] === userData.Username) return { success: false, message: 'Username already exists' };
      if (data[i][3] === userData.Email) return { success: false, message: 'Email already in use' };
    }

    // employee code dupe check (only when provided)
    var empCode = String(userData.EmployeeCode || '').trim();
    if (empCode) {
      for (var j = 1; j < data.length; j++) {
        if (String(data[j][16]) === '1') continue;
        if (String(data[j][23] || '').trim() === empCode) return { success: false, message: 'Employee code already in use' };
      }
    }

    var ts = nowIso(), id = nextUserId(sh);
    sh.appendRow([
      id,
      userData.Username,
      userData.FullName,
      userData.Email,
      userData.Password,
      userData.Mobile,
      String(userData.Role || 'teacher').toLowerCase(),
      String(userData.Gender || 'other').toLowerCase(),
      toIso(userData.DateOfBirth),
      userData.Qualification || '',
      userData.Specialization || '',
      toIso(userData.JoiningDate || todayStr()),
      DEFAULT_LOGO,
      userData.Address || '',
      String(userData.Status || 'active').toLowerCase(),
      '',           // last_login
      '0',          // is_deleted
      'light',      // theme
      '',           // custom colors
      ts, currentUser, ts, currentUser,
      empCode,
      String(userData.EmergencyContactName || '').trim(),
      String(userData.EmergencyContactPhone || '').trim()
    ]);

    addLog(currentUser, 'User Added', 'Added: ' + userData.Username + ' (' + userData.Role + ')');
    return { success: true, message: 'User added successfully' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

function updateUser(username, userData, currentUser, currentRole) {
  try {
    if (!isAdmin(currentRole)) return { success: false, message: 'Forbidden — admin only' };

    var sh = getSheet(USERS_SHEET);
    if (!sh) return { success: false, message: 'Users sheet not found' };

    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][1] !== username || String(data[i][16]) === '1') continue;
      var row = i + 1, ts = nowIso();

      sh.getRange(row, 3).setValue(userData.FullName || '');
      sh.getRange(row, 4).setValue(userData.Email);
      if (userData.Password && String(userData.Password).trim() !== '') {
        sh.getRange(row, 5).setValue(userData.Password);
      }
      sh.getRange(row, 6).setValue(userData.Mobile || '');
      sh.getRange(row, 7).setValue(String(userData.Role || 'teacher').toLowerCase());
      sh.getRange(row, 8).setValue(String(userData.Gender || 'other').toLowerCase());
      sh.getRange(row, 9).setValue(toIso(userData.DateOfBirth));
      sh.getRange(row, 10).setValue(userData.Qualification || '');
      sh.getRange(row, 11).setValue(userData.Specialization || '');
      sh.getRange(row, 12).setValue(toIso(userData.JoiningDate));
      sh.getRange(row, 14).setValue(userData.Address || '');
      sh.getRange(row, 15).setValue(String(userData.Status || 'active').toLowerCase());
      sh.getRange(row, 22).setValue(ts);
      sh.getRange(row, 23).setValue(currentUser);

      // employee code dupe check (skip self)
      var newEmpCode = String(userData.EmployeeCode || '').trim();
      if (newEmpCode) {
        for (var k = 1; k < data.length; k++) {
          if (k === i) continue;
          if (String(data[k][16]) === '1') continue;
          if (String(data[k][23] || '').trim() === newEmpCode) return { success: false, message: 'Employee code already in use' };
        }
      }
      sh.getRange(row, 24).setValue(newEmpCode);
      sh.getRange(row, 25).setValue(String(userData.EmergencyContactName || '').trim());
      sh.getRange(row, 26).setValue(String(userData.EmergencyContactPhone || '').trim());

      addLog(currentUser, 'User Updated', 'Updated: ' + username);
      return { success: true, message: 'User updated successfully' };
    }
    return { success: false, message: 'User not found' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// soft delete
function deleteUser(username, currentUser, currentRole) {
  try {
    if (!isAdmin(currentRole)) return { success: false, message: 'Forbidden — admin only' };
    if (username === currentUser) return { success: false, message: 'You cannot delete your own account' };

    var sh = getSheet(USERS_SHEET);
    if (!sh) return { success: false, message: 'Users sheet not found' };

    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][1] !== username || String(data[i][16]) === '1') continue;
      var row = i + 1, ts = nowIso();
      sh.getRange(row, 17).setValue('1');         // is_deleted
      sh.getRange(row, 15).setValue('inactive');  // status
      sh.getRange(row, 22).setValue(ts);
      sh.getRange(row, 23).setValue(currentUser);
      addLog(currentUser, 'User Deleted', 'Soft-deleted: ' + username);
      return { success: true, message: 'User deleted successfully' };
    }
    return { success: false, message: 'User not found' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// ============== My Account (self) ==============
function getMyAccount(username) {
  try {
    var sh = getSheet(USERS_SHEET);
    if (!sh) return { success: false, message: 'Users sheet not found' };
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][1] === username && String(data[i][16]) === '0') {
        return { success: true, data: rowToUser(data[i]) };
      }
    }
    return { success: false, message: 'User not found' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

function updateMyAccount(username, formData) {
  try {
    var sh = getSheet(USERS_SHEET);
    if (!sh) return { success: false, message: 'Users sheet not found' };

    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][1] !== username || String(data[i][16]) === '1') continue;
      var row = i + 1;

      // verify current pwd
      if (formData.CurrentPassword !== data[i][4]) {
        return { success: false, message: 'Current password is incorrect' };
      }

      var ts = nowIso();
      if (formData.FullName !== undefined) sh.getRange(row, 3).setValue(formData.FullName);
      if (formData.Email !== undefined) sh.getRange(row, 4).setValue(formData.Email);
      if (formData.NewPassword && String(formData.NewPassword).trim() !== '') {
        sh.getRange(row, 5).setValue(formData.NewPassword);
      }
      if (formData.Mobile !== undefined) sh.getRange(row, 6).setValue(formData.Mobile);
      if (formData.DateOfBirth !== undefined) sh.getRange(row, 9).setValue(toIso(formData.DateOfBirth));
      if (formData.Qualification !== undefined) sh.getRange(row, 10).setValue(formData.Qualification);
      if (formData.Specialization !== undefined) sh.getRange(row, 11).setValue(formData.Specialization);
      if (formData.Address !== undefined) sh.getRange(row, 14).setValue(formData.Address);
      sh.getRange(row, 22).setValue(ts);
      sh.getRange(row, 23).setValue(username);

      // student/parent self-service pwd change → keep source sheet in sync with the mirror
      if (formData.NewPassword && String(formData.NewPassword).trim() !== '') {
        var _r = String(data[i][6] || '').toLowerCase();
        if (_r === 'student') _syncStudentPassword(data[i][1], formData.NewPassword);
        else if (_r === 'parent') _syncParentPassword(data[i][1], data[i][3], formData.NewPassword);
      }

      addLog(username, 'Profile Updated', 'Updated own profile');
      return { success: true, message: 'Account updated successfully' };
    }
    return { success: false, message: 'User not found' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// ============== Dashboard Stats (admin only) ==============
function getDashboardStats(currentUser, currentRole) {
  try {
    if (!isAdmin(currentRole)) return { success: false, message: 'Forbidden — admin only' };

    var sh = getSheet(USERS_SHEET);
    if (!sh) return { success: false, message: 'Users sheet not found' };

    var data = sh.getDataRange().getValues();
    var total = 0, active = 0, inactive = 0, suspended = 0;
    var admins = 0, clerks = 0, teachers = 0, supervisors = 0;
    var male = 0, female = 0, other = 0;

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][16]) === '1') continue; // soft-deleted
      total++;
      var st = String(data[i][14] || '').toLowerCase();
      var rl = String(data[i][6] || '').toLowerCase();
      var gd = String(data[i][7] || '').toLowerCase();

      if (st === 'active') active++;
      else if (st === 'inactive') inactive++;
      else if (st === 'suspended') suspended++;

      if (rl === 'admin') admins++;
      else if (rl === 'clerk') clerks++;
      else if (rl === 'teacher') teachers++;
      else if (rl === 'supervisor') supervisors++;

      if (gd === 'male') male++;
      else if (gd === 'female') female++;
      else other++;
    }

    // classes count
    var totalClasses = 0, totalStrength = 0;
    var cs = getSheet(CLASSES_SHEET);
    if (cs) {
      var cdata = cs.getDataRange().getValues();
      for (var j = 1; j < cdata.length; j++) {
        if (String(cdata[j][6]) === '1') continue;
        totalClasses++;
        var ts = parseInt(cdata[j][5], 10);
        if (!isNaN(ts)) totalStrength += ts;
      }
    }

    // subjects count
    var totalSubjects = 0;
    var subs = getSheet(SUBJECTS_SHEET);
    if (subs) {
      var sdata = subs.getDataRange().getValues();
      for (var k = 1; k < sdata.length; k++) {
        if (String(sdata[k][5]) === '1') continue;
        totalSubjects++;
      }
    }

    // teacher assignments count (no soft delete on this sheet)
    var totalAssignments = 0;
    var asg = getSheet(ASSIGNMENTS_SHEET);
    if (asg) {
      var adata = asg.getDataRange().getValues();
      totalAssignments = Math.max(0, adata.length - 1);
    }

    // students breakdown
    var totalStudents = 0, activeStudents = 0, inactiveStudents = 0;
    var transferredStudents = 0, passedOutStudents = 0, suspendedStudents = 0;
    var maleStudents = 0, femaleStudents = 0, otherGenderStudents = 0;
    var sts = getSheet(STUDENTS_SHEET);
    if (sts) {
      var stdata = sts.getDataRange().getValues();
      for (var m = 1; m < stdata.length; m++) {
        if (String(stdata[m][36]) === '1') continue;
        totalStudents++;
        var ss2 = String(stdata[m][35] || '').toLowerCase();
        var gd2 = String(stdata[m][5] || '').toLowerCase();
        if (ss2 === 'active') activeStudents++;
        else if (ss2 === 'inactive') inactiveStudents++;
        else if (ss2 === 'transferred') transferredStudents++;
        else if (ss2 === 'passed_out') passedOutStudents++;
        else if (ss2 === 'suspended') suspendedStudents++;
        if (gd2 === 'male') maleStudents++;
        else if (gd2 === 'female') femaleStudents++;
        else otherGenderStudents++;
      }
    }

    // parents breakdown
    var totalParents = 0, activeParents = 0, inactiveParents = 0;
    var fathers = 0, mothers = 0, guardians = 0;
    var pts = getSheet(PARENTS_SHEET);
    if (pts) {
      var pdata = pts.getDataRange().getValues();
      for (var p = 1; p < pdata.length; p++) {
        if (String(pdata[p][10]) === '1') continue;
        totalParents++;
        var pst = String(pdata[p][9] || '').toLowerCase();
        var prl = String(pdata[p][5] || '').toLowerCase();
        if (pst === 'active') activeParents++;
        else if (pst === 'inactive') inactiveParents++;
        if (prl === 'father') fathers++;
        else if (prl === 'mother') mothers++;
        else if (prl === 'guardian') guardians++;
      }
    }

    // parent_students junction count (no soft delete on this sheet)
    var totalLinks = 0;
    var psl = getSheet(PARENT_STUDENTS_SHEET);
    if (psl) {
      var ldata = psl.getDataRange().getValues();
      totalLinks = Math.max(0, ldata.length - 1);
    }

    // exams count + published count
    var totalExams = 0, publishedExams = 0;
    var exs = getSheet(EXAMS_SHEET);
    if (exs) {
      var edata = exs.getDataRange().getValues();
      for (var ee = 1; ee < edata.length; ee++) {
        if (String(edata[ee][11]) === '1') continue;
        totalExams++;
        if (String(edata[ee][8]) === '1' || edata[ee][8] === 1) publishedExams++;
      }
    }

    // marks count + absences (no soft delete on this sheet)
    var totalMarks = 0, totalAbsences = 0;
    var mks = getSheet(MARKS_SHEET);
    if (mks) {
      var mdata = mks.getDataRange().getValues();
      for (var mm = 1; mm < mdata.length; mm++) {
        totalMarks++;
        if (String(mdata[mm][7]) === '1' || mdata[mm][7] === 1) totalAbsences++;
      }
    }

    // attendance: today's snapshot — total marked today, present today
    var todayDate = todayStr();
    var todayMarked = 0, todayPresent = 0;
    var att = getSheet(ATTENDANCE_SHEET);
    if (att) {
      var atd = att.getDataRange().getValues();
      for (var aa = 1; aa < atd.length; aa++) {
        if (String(atd[aa][3]).split('T')[0] !== todayDate) continue;
        todayMarked++;
        if (String(atd[aa][4] || '').toLowerCase() === 'present') todayPresent++;
      }
    }

    // fee structure + payment counts
    var totalFeeItems = 0, activeFeeItems = 0;
    var fst = getSheet(FEE_STRUCTURE_SHEET);
    if (fst) {
      var fsd = fst.getDataRange().getValues();
      for (var fi = 1; fi < fsd.length; fi++) {
        if (String(fsd[fi][9]) === '1') continue;
        totalFeeItems++;
        if (String(fsd[fi][8]) === '1' || fsd[fi][8] === 1) activeFeeItems++;
      }
    }

    var totalPayments = 0, totalCollected = 0, totalPending = 0;
    var fpy = getSheet(FEE_PAYMENTS_SHEET);
    if (fpy) {
      var fpd = fpy.getDataRange().getValues();
      for (var pi = 1; pi < fpd.length; pi++) {
        if (String(fpd[pi][15]) === '1') continue;
        totalPayments++;
        totalCollected += parseFloat(fpd[pi][3]) || 0;
        totalPending += parseFloat(fpd[pi][4]) || 0;
      }
    }

    // discipline + conduct counts
    var totalIncidents = 0, openIncidents = 0, criticalIncidents = 0;
    var dsc = getSheet(DISCIPLINE_SHEET);
    if (dsc) {
      var dd = dsc.getDataRange().getValues();
      for (var di = 1; di < dd.length; di++) {
        if (String(dd[di][11]) === '1') continue;
        totalIncidents++;
        var st = String(dd[di][8] || '').toLowerCase();
        if (st === 'open' || st === 'under_review' || st === 'escalated') openIncidents++;
        if (String(dd[di][4] || '').toLowerCase() === 'critical') criticalIncidents++;
      }
    }

    var totalConduct = 0;
    var cnd = getSheet(CONDUCT_SHEET);
    if (cnd) {
      var cdt = cnd.getDataRange().getValues();
      for (var ci = 1; ci < cdt.length; ci++) {
        if (String(cdt[ci][8]) === '1') continue;
        totalConduct++;
      }
    }

    return {
      success: true,
      data: {
        totalUsers: total, activeUsers: active, inactiveUsers: inactive, suspendedUsers: suspended,
        adminUsers: admins, clerkUsers: clerks, teacherUsers: teachers, supervisorUsers: supervisors,
        maleUsers: male, femaleUsers: female, otherGenderUsers: other,
        totalClasses: totalClasses, totalStrength: totalStrength,
        totalSubjects: totalSubjects, totalAssignments: totalAssignments,
        totalStudents: totalStudents, activeStudents: activeStudents, inactiveStudents: inactiveStudents,
        transferredStudents: transferredStudents, passedOutStudents: passedOutStudents, suspendedStudentsAll: suspendedStudents,
        maleStudents: maleStudents, femaleStudents: femaleStudents, otherGenderStudents: otherGenderStudents,
        totalParents: totalParents, activeParents: activeParents, inactiveParents: inactiveParents,
        fathers: fathers, mothers: mothers, guardians: guardians,
        totalLinks: totalLinks,
        totalExams: totalExams, publishedExams: publishedExams,
        totalMarks: totalMarks, totalAbsences: totalAbsences,
        todayMarked: todayMarked, todayPresent: todayPresent,
        totalFeeItems: totalFeeItems, activeFeeItems: activeFeeItems,
        totalPayments: totalPayments,
        totalCollected: totalCollected, totalPending: totalPending,
        totalIncidents: totalIncidents, openIncidents: openIncidents, criticalIncidents: criticalIncidents,
        totalConduct: totalConduct
      }
    };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// ============== Classes CRUD ==============
// read: admin/clerk/teacher/supervisor (+ future student/parent)
function getAllClasses(currentUser, currentRole) {
  try {
    if (!canReadClasses(currentRole)) return { success: false, message: 'Forbidden — no access' };

    var sh = getSheet(CLASSES_SHEET);
    if (!sh) return { success: false, message: 'Classes sheet not found' };

    var data = sh.getDataRange().getValues();
    var umap = getUsersMap();
    var classes = [];
    var scope = getViewerScope(currentUser, currentRole);
    var teacherClassIds = String(currentRole).toLowerCase() === 'teacher' ? getTeacherClassIds(currentUser) : null;

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][6]) === '1') continue; // soft-deleted
      var thisClassId = parseInt(data[i][0], 10);
      if (!scope.all && scope.classIds.indexOf(thisClassId) === -1) continue; // student/parent: own class only
      if (teacherClassIds !== null && teacherClassIds.indexOf(thisClassId) === -1) continue; // teacher: own classes only

      var teacherId = data[i][4];
      var teacherName = '';
      if (teacherId !== '' && teacherId !== null && umap[teacherId]) {
        teacherName = umap[teacherId].fullName;
      }

      var assistantId = data[i][17];
      var assistantName = (assistantId !== '' && assistantId != null && umap[assistantId]) ? umap[assistantId].fullName : '';

      classes.push({
        ID: data[i][0],
        ClassName: data[i][1],
        Section: data[i][2],
        AcademicYear: data[i][3],
        ClassTeacherID: teacherId === '' ? null : teacherId,
        ClassTeacherName: teacherName,
        TotalStrength: parseInt(data[i][5], 10) || 0,
        GradeLevel: parseInt(data[i][9], 10) || 0,
        ClassCode: data[i][10] || '',
        CurriculumStage: String(data[i][11] || 'lower_primary').toLowerCase(),
        MediumOfInstruction: String(data[i][12] || 'english').toLowerCase(),
        SubjectStream: String(data[i][13] || 'general').toLowerCase(),
        MaxCapacity: parseInt(data[i][14], 10) || 30,
        RoomNumber: data[i][15] || '',
        Building: data[i][16] || 'Main',
        AssistantTeacherID: assistantId === '' ? null : assistantId,
        AssistantTeacherName: assistantName,
        IsActive: data[i][18] === '' || data[i][18] == null ? true : (String(data[i][18]) === '1' || data[i][18] === 1 || data[i][18] === true),
        Shift: String(data[i][19] || 'full_day').toLowerCase(),
        CreatedAt: toIso(data[i][7]),
        UpdatedAt: toIso(data[i][8])
      });
    }
    return { success: true, data: classes };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// active teachers list — for class_teacher dropdown (admin only, used inside modal)
function getActiveTeachers(currentUser, currentRole) {
  try {
    if (!canListTeachers(currentRole)) return { success: false, message: 'Forbidden — no access' };

    var sh = getSheet(USERS_SHEET);
    if (!sh) return { success: false, message: 'Users sheet not found' };

    var data = sh.getDataRange().getValues(), teachers = [];
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][16]) === '1') continue;
      if (String(data[i][14] || '').toLowerCase() !== 'active') continue;
      var rl = String(data[i][6] || '').toLowerCase();
      if (rl !== 'teacher') continue;
      teachers.push({
        ID: data[i][0],
        Username: data[i][1],
        FullName: data[i][2] || data[i][1],
        Specialization: data[i][10] || ''
      });
    }
    return { success: true, data: teachers };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// email Classes & Sections list (rows from client, already filtered) as PDF attachment
function emailClassesReport(recipients, rows, title, currentUser, currentRole) {
  try {
    if (!canReadClasses(currentRole)) return { success: false, message: 'Forbidden — no access' };

    var emails = String(recipients || '').split(/[,;]+/).map(function (e) { return e.trim(); }).filter(function (e) { return e.indexOf('@') > 0; });
    if (emails.length === 0) return { success: false, message: 'Provide at least one valid email address' };
    if (!Array.isArray(rows) || rows.length === 0) return { success: false, message: 'No classes to export' };
    title = String(title || '').trim() || 'Classes & Sections';

    var settings = getSchoolSettings();
    var schoolName = (settings && settings.success && settings.data) ? settings.data.SchoolName : 'School';

    function esc(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

    var cells = '';
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i] || {};
      var grade = (r.GradeLevel && parseInt(r.GradeLevel, 10)) ? r.GradeLevel : '—';
      var code = r.ClassCode ? esc(r.ClassCode) : '—';
      var stage = String(r.CurriculumStage || '').toUpperCase() || '—';
      var medium = String(r.MediumOfInstruction || '').replace(/_/g, ' ');
      medium = medium ? medium.charAt(0).toUpperCase() + medium.slice(1) : '—';
      var teacher = r.ClassTeacherName ? esc(r.ClassTeacherName) : 'Unassigned';
      var strength = (r.TotalStrength == null ? 0 : r.TotalStrength) + '/' + (r.MaxCapacity == null ? '' : r.MaxCapacity);
      var room = r.RoomNumber ? (esc(r.RoomNumber) + (r.Building ? ' (' + esc(r.Building) + ')' : '')) : (r.Building ? esc(r.Building) : '—');
      var status = (r.IsActive === false || String(r.IsActive) === '0') ? 'Inactive' : 'Active';
      var bg = (i % 2) ? ' style="background:#f2f5f9;"' : '';
      cells += '<tr' + bg + '><td>' + esc(r.ID) + '</td><td>' + esc(r.ClassName) + '</td><td>' + esc(r.Section) + '</td><td>' + esc(grade) + '</td><td>' + code + '</td><td>' + esc(r.AcademicYear) + '</td><td>' + esc(stage) + '</td><td>' + esc(medium) + '</td><td>' + teacher + '</td><td>' + esc(strength) + '</td><td>' + room + '</td><td>' + status + '</td></tr>';
    }

    var html = '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,Helvetica,sans-serif;color:#222;">' +
      '<h2 style="margin:0 0 4px;color:#001f3f;">' + esc(schoolName) + ' — ' + esc(title) + '</h2>' +
      '<div style="font-size:12px;color:#555;">Generated: ' + new Date().toISOString() + '</div>' +
      '<div style="font-size:12px;color:#555;margin-bottom:10px;">' + rows.length + ' record(s)</div>' +
      '<table style="border-collapse:collapse;width:100%;font-size:11px;" border="1">' +
      '<thead><tr style="background:#001f3f;color:#fff;">' +
      '<th>ID</th><th>Class</th><th>Section</th><th>Grade</th><th>Code</th><th>Academic Year</th><th>Stage</th><th>Medium</th><th>Class Teacher</th><th>Strength / Capacity</th><th>Room</th><th>Status</th>' +
      '</tr></thead><tbody>' + cells + '</tbody></table></body></html>';

    var pdfBlob = Utilities.newBlob(html, 'text/html', 'Classes_Report.html').getAs('application/pdf').setName('Classes_Report_' + new Date().toISOString().slice(0, 10) + '.pdf');

    try {
      MailApp.sendEmail({ to: emails.join(','), subject: schoolName + ' — ' + title + ' Report', htmlBody: '<p>Dear Colleague,</p><p>Please find attached the ' + title + ' report (' + rows.length + ' record(s)).</p><p>Regards,<br>' + schoolName + '</p>', attachments: [pdfBlob] });
    } catch (mailErr) {
      return { success: false, message: 'Email failed: ' + mailErr.toString() };
    }

    addLog(currentUser, 'Classes Report Emailed', title + ' report (' + rows.length + ' rows) emailed to: ' + emails.join(', '));
    return { success: true, message: 'Report emailed to ' + emails.length + ' recipient(s)', recipients: emails };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

// validate academic year format YYYY-YYYY (9 chars). Accepts Date objects too (Sheets may auto-parse).
function validAcademicYear(s) {
  var v = formatAcademicYear(s);
  if (!v || v.length !== 9) return false;
  var m = v.match(/^(\d{4})-(\d{4})$/);
  if (!m) return false;
  return parseInt(m[2], 10) === parseInt(m[1], 10) + 1;
}

// Sheets sometimes auto-parses "Sept 2026" into a Date in cells. Coerce back to a readable string.
function formatPeriodLabel(v) {
  if (v instanceof Date && !isNaN(v.getTime())) {
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months[v.getMonth()] + ' ' + v.getFullYear();
  }
  return String(v == null ? '' : v).trim();
}

// AcademicYear "2026-2027" usually stays text but be defensive against any auto-parse to Date.
function formatAcademicYear(v) {
  if (v instanceof Date && !isNaN(v.getTime())) {
    var y = v.getFullYear();
    return y + '-' + (y + 1);
  }
  return String(v == null ? '' : v).trim();
}

// HH:MM coercion — Sheets auto-parses "08:00" into a Date with year 1899. Extract just the time.
function formatTimeHHMM(v) {
  if (v instanceof Date && !isNaN(v.getTime())) {
    var hh = String(v.getHours()).padStart(2, '0');
    var mm = String(v.getMinutes()).padStart(2, '0');
    return hh + ':' + mm;
  }
  var s = String(v == null ? '' : v).trim();
  if (/^\d{2}:\d{2}$/.test(s)) return s;
  // ISO or partial ISO? extract Thh:mm
  var m = s.match(/T?(\d{2}):(\d{2})/);
  if (m) return m[1] + ':' + m[2];
  return s;
}

// pin a cell to plain-text format and write the value as a string — prevents Sheets auto-date-conversion
function writeTextCell(sh, row1based, col1based, value) {
  var rng = sh.getRange(row1based, col1based);
  rng.setNumberFormat('@');
  rng.setValue(String(value == null ? '' : value));
}

// pin a column range to plain-text format (idempotent; safe to call repeatedly)
function pinColumnAsText(sh, col1based, fromRow) {
  if (!sh) return;
  var startRow = fromRow || 2;
  var maxRows = sh.getMaxRows();
  if (maxRows >= startRow) {
    sh.getRange(startRow, col1based, maxRows - startRow + 1, 1).setNumberFormat('@');
  }
}

// columns where Sheets tends to auto-convert text to Date — pin these as text everywhere.
// keyed by sheet header name (case-insensitive). Match by header text — works even if column order changes.
var DATE_LIKE_HEADERS = [
  'createdat','updatedat','publishedat','resolvedat','lastlogin',
  'dateofbirth','admissiondate','joiningdate','incidentdate','attendancedate',
  'paymentdate','activitydate','noticedate','expirydate','logdate','homeworkduedate',
  'starttime','endtime','startdate','enddate','moderationdate','resultslockeddate',
  'passportexpiry','visaexpiry','insurancepolicypiry','insurancepolicyexpiry',
  'periodlabel','academicyear','billingperiod','timestamp','eventdate',
  'transactiondate','bookedat','completedat','maintenancedate','nextduedate',
  'purchasedate','warranty','date'
];

// walk every sheet and pin date-like columns as plain text — prevents auto-date-conversion on future writes
function pinAllDateColumns() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  sheets.forEach(function(sh) {
    var lastCol = sh.getLastColumn();
    if (lastCol < 1) return;
    var headers;
    try { headers = sh.getRange(1, 1, 1, lastCol).getValues()[0]; } catch (e) { return; }
    headers.forEach(function(h, idx) {
      if (!h) return;
      var key = String(h).toLowerCase().replace(/[\s_-]/g, '');
      if (DATE_LIKE_HEADERS.indexOf(key) !== -1) pinColumnAsText(sh, idx + 1);
    });
  });
}

// one-shot repair: converts every Date object in date-like columns to ISO 8601 string.
// special-cases PeriodLabel (→ "Sep 2026") and AcademicYear (→ "YYYY-YYYY") since those are labels not dates.
// safe to run multiple times; idempotent.
function repairAllDatesToISO() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  var totalFixed = 0;
  var bySheet = {};
  sheets.forEach(function(sh) {
    var lastCol = sh.getLastColumn(), lastRow = sh.getLastRow();
    if (lastCol < 1 || lastRow < 2) return;
    var headers;
    try { headers = sh.getRange(1, 1, 1, lastCol).getValues()[0]; } catch (e) { return; }
    var fixed = 0;
    headers.forEach(function(h, idx) {
      if (!h) return;
      var key = String(h).toLowerCase().replace(/[\s_-]/g, '');
      if (DATE_LIKE_HEADERS.indexOf(key) === -1) return;
      var col = idx + 1;
      pinColumnAsText(sh, col);
      var rng = sh.getRange(2, col, lastRow - 1, 1);
      var values = rng.getValues();
      var changed = false;
      var newValues = values.map(function(r) {
        var v = r[0];
        if (v instanceof Date) {
          changed = true;
          if (key === 'periodlabel') return [formatPeriodLabel(v)];
          if (key === 'academicyear') return [formatAcademicYear(v)];
          if (key === 'starttime' || key === 'endtime') return [formatTimeHHMM(v)];
          return [toIso(v)];
        }
        return [v];
      });
      if (changed) { rng.setValues(newValues); fixed += 1; }
    });
    if (fixed) { bySheet[sh.getName()] = fixed; totalFixed += fixed; }
  });
  return { success: true, message: 'Repaired ' + totalFixed + ' columns. ' + JSON.stringify(bySheet), bySheet: bySheet };
}

// shared validator for new class fields
function validateClassFields(d) {
  var stages = ['creche','nursery','kg','lower_primary','upper_primary','jhs'];
  var media = ['english','french','spanish','mandarin','arabic','bilingual_en_fr','bilingual_en_zh','immersion'];
  var streams = ['science','commerce','arts','vocational','general','none'];

  var grade = parseInt(d.GradeLevel, 10);
  if (isNaN(grade) || grade < 0) grade = 0;
  if (grade > 13) return { ok: false, error: 'GradeLevel must be 0-13' };

  var stage = String(d.CurriculumStage || 'lower_primary').toLowerCase();
  if (stages.indexOf(stage) === -1) return { ok: false, error: 'CurriculumStage must be one of: ' + stages.join(', ') };

  var medium = String(d.MediumOfInstruction || 'english').toLowerCase();
  if (media.indexOf(medium) === -1) return { ok: false, error: 'MediumOfInstruction must be one of: ' + media.join(', ') };

  var stream = String(d.SubjectStream || 'general').toLowerCase();
  if (streams.indexOf(stream) === -1) return { ok: false, error: 'SubjectStream must be one of: ' + streams.join(', ') };

  var capacity = parseInt(d.MaxCapacity, 10);
  if (isNaN(capacity) || capacity < 0) capacity = 30;

  var classCode = String(d.ClassCode || '').trim().toUpperCase();
  if (classCode.length > 20) return { ok: false, error: 'ClassCode max 20 chars' };

  var room = String(d.RoomNumber || '').trim();
  if (room.length > 30) return { ok: false, error: 'RoomNumber max 30 chars' };

  var building = String(d.Building || 'Main').trim();
  if (building.length > 50) return { ok: false, error: 'Building max 50 chars' };

  var isActive = (d.IsActive === false || d.IsActive === '0' || d.IsActive === 0) ? '0' : '1';

  var shifts = ['morning','afternoon','evening','full_day'];
  var shift = String(d.Shift || 'full_day').toLowerCase();
  if (shifts.indexOf(shift) === -1) return { ok: false, error: 'Shift must be one of: ' + shifts.join(', ') };

  return { ok: true, normalized: { grade: grade, classCode: classCode, stage: stage, medium: medium, stream: stream, capacity: capacity, room: room, building: building, isActive: isActive, shift: shift } };
}

// composite-unique check (ClassName + Section + AcademicYear) on active rows
function classExists(sh, className, section, academicYear, excludeId) {
  var data = sh.getDataRange().getValues();
  var cn = String(className || '').trim().toLowerCase();
  var sc = String(section || '').trim().toLowerCase();
  var ay = String(academicYear || '').trim();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][6]) === '1') continue;
    if (excludeId !== undefined && data[i][0] === excludeId) continue;
    if (String(data[i][1] || '').trim().toLowerCase() === cn &&
        String(data[i][2] || '').trim().toLowerCase() === sc &&
        String(data[i][3] || '').trim() === ay) {
      return true;
    }
  }
  return false;
}

function addClass(classData, currentUser, currentRole) {
  try {
    if (!isAdmin(currentRole)) return { success: false, message: 'Forbidden — admin only' };

    var sh = getSheet(CLASSES_SHEET);
    if (!sh) return { success: false, message: 'Classes sheet not found' };

    // required
    if (!classData.ClassName || !classData.Section || !classData.AcademicYear) {
      return { success: false, message: 'ClassName, Section, AcademicYear are required' };
    }
    // length
    if (String(classData.ClassName).length > 50) return { success: false, message: 'ClassName max 50 chars' };
    if (String(classData.Section).length > 10) return { success: false, message: 'Section max 10 chars' };
    if (!validAcademicYear(classData.AcademicYear)) return { success: false, message: 'AcademicYear must be YYYY-YYYY (e.g. 2026-2027)' };

    // composite unique
    if (classExists(sh, classData.ClassName, classData.Section, classData.AcademicYear)) {
      return { success: false, message: 'Class + Section + Year already exists' };
    }

    // teacher fk validation (optional)
    var tid = '';
    var umap = getUsersMap();
    if (classData.ClassTeacherID !== '' && classData.ClassTeacherID !== null && classData.ClassTeacherID !== undefined) {
      tid = parseInt(classData.ClassTeacherID, 10);
      if (isNaN(tid)) return { success: false, message: 'Invalid ClassTeacherID' };
      if (!umap[tid] || umap[tid].role !== 'teacher') {
        return { success: false, message: 'Selected user is not an active teacher' };
      }
    }

    // assistant teacher fk (optional, must differ from class teacher)
    var atid = '';
    if (classData.AssistantTeacherID !== '' && classData.AssistantTeacherID !== null && classData.AssistantTeacherID !== undefined) {
      atid = parseInt(classData.AssistantTeacherID, 10);
      if (isNaN(atid)) return { success: false, message: 'Invalid AssistantTeacherID' };
      if (!umap[atid] || umap[atid].role !== 'teacher') {
        return { success: false, message: 'Selected assistant is not an active teacher' };
      }
      if (tid !== '' && atid === tid) return { success: false, message: 'AssistantTeacher cannot be the same as ClassTeacher' };
    }

    // validate new fields
    var v = validateClassFields(classData);
    if (!v.ok) return { success: false, message: v.error };
    var n = v.normalized;

    var ts = nowIso(), id = nextClassId(sh);
    var strength = parseInt(classData.TotalStrength, 10);
    if (isNaN(strength) || strength < 0) strength = 0;

    sh.appendRow([
      id,
      String(classData.ClassName).trim(),
      String(classData.Section).trim(),
      String(classData.AcademicYear).trim(),
      tid,
      strength,
      '0',
      ts,
      ts,
      n.grade,
      n.classCode,
      n.stage,
      n.medium,
      n.stream,
      n.capacity,
      n.room,
      n.building,
      atid,
      n.isActive,
      n.shift
    ]);

    addLog(currentUser, 'Class Added', 'Added: ' + classData.ClassName + ' ' + classData.Section + ' (' + classData.AcademicYear + ')');
    return { success: true, message: 'Class added successfully', id: id };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

function updateClass(id, classData, currentUser, currentRole) {
  try {
    if (!isAdmin(currentRole)) return { success: false, message: 'Forbidden — admin only' };

    var sh = getSheet(CLASSES_SHEET);
    if (!sh) return { success: false, message: 'Classes sheet not found' };

    var idn = parseInt(id, 10);
    if (isNaN(idn)) return { success: false, message: 'Invalid id' };

    if (!classData.ClassName || !classData.Section || !classData.AcademicYear) {
      return { success: false, message: 'ClassName, Section, AcademicYear are required' };
    }
    if (String(classData.ClassName).length > 50) return { success: false, message: 'ClassName max 50 chars' };
    if (String(classData.Section).length > 10) return { success: false, message: 'Section max 10 chars' };
    if (!validAcademicYear(classData.AcademicYear)) return { success: false, message: 'AcademicYear must be YYYY-YYYY' };

    if (classExists(sh, classData.ClassName, classData.Section, classData.AcademicYear, idn)) {
      return { success: false, message: 'Class + Section + Year already exists' };
    }

    var tid = '';
    var umap = getUsersMap();
    if (classData.ClassTeacherID !== '' && classData.ClassTeacherID !== null && classData.ClassTeacherID !== undefined) {
      tid = parseInt(classData.ClassTeacherID, 10);
      if (isNaN(tid)) return { success: false, message: 'Invalid ClassTeacherID' };
      if (!umap[tid] || umap[tid].role !== 'teacher') {
        return { success: false, message: 'Selected user is not an active teacher' };
      }
    }

    // assistant teacher fk (optional, must differ from class teacher)
    var atid = '';
    if (classData.AssistantTeacherID !== '' && classData.AssistantTeacherID !== null && classData.AssistantTeacherID !== undefined) {
      atid = parseInt(classData.AssistantTeacherID, 10);
      if (isNaN(atid)) return { success: false, message: 'Invalid AssistantTeacherID' };
      if (!umap[atid] || umap[atid].role !== 'teacher') {
        return { success: false, message: 'Selected assistant is not an active teacher' };
      }
      if (tid !== '' && atid === tid) return { success: false, message: 'AssistantTeacher cannot be the same as ClassTeacher' };
    }

    // validate new fields
    var v = validateClassFields(classData);
    if (!v.ok) return { success: false, message: v.error };
    var n = v.normalized;

    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] !== idn || String(data[i][6]) === '1') continue;
      var row = i + 1, ts = nowIso();
      var strength = parseInt(classData.TotalStrength, 10);
      if (isNaN(strength) || strength < 0) strength = 0;

      sh.getRange(row, 2).setValue(String(classData.ClassName).trim());
      sh.getRange(row, 3).setValue(String(classData.Section).trim());
      sh.getRange(row, 4).setValue(String(classData.AcademicYear).trim());
      sh.getRange(row, 5).setValue(tid);
      sh.getRange(row, 6).setValue(strength);
      sh.getRange(row, 9).setValue(ts);
      // new cols 10-19
      sh.getRange(row, 10).setValue(n.grade);
      sh.getRange(row, 11).setValue(n.classCode);
      sh.getRange(row, 12).setValue(n.stage);
      sh.getRange(row, 13).setValue(n.medium);
      sh.getRange(row, 14).setValue(n.stream);
      sh.getRange(row, 15).setValue(n.capacity);
      sh.getRange(row, 16).setValue(n.room);
      sh.getRange(row, 17).setValue(n.building);
      sh.getRange(row, 18).setValue(atid);
      sh.getRange(row, 19).setValue(n.isActive);
      sh.getRange(row, 20).setValue(n.shift);

      addLog(currentUser, 'Class Updated', 'Updated id ' + idn + ': ' + classData.ClassName + ' ' + classData.Section);
      return { success: true, message: 'Class updated successfully' };
    }
    return { success: false, message: 'Class not found' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// Standard Ghana school structure (Creche through JHS 3) — used to power the "Auto-Generate" classes button
var GHANA_CLASS_LEVELS = [
  { name: 'Creche',    grade: 0,  stage: 'creche' },
  { name: 'Nursery 1', grade: 0,  stage: 'nursery' },
  { name: 'Nursery 2', grade: 0,  stage: 'nursery' },
  { name: 'KG 1',      grade: 0,  stage: 'kg' },
  { name: 'KG 2',      grade: 0,  stage: 'kg' },
  { name: 'Basic 1',   grade: 1,  stage: 'lower_primary' },
  { name: 'Basic 2',   grade: 2,  stage: 'lower_primary' },
  { name: 'Basic 3',   grade: 3,  stage: 'lower_primary' },
  { name: 'Basic 4',   grade: 4,  stage: 'upper_primary' },
  { name: 'Basic 5',   grade: 5,  stage: 'upper_primary' },
  { name: 'Basic 6',   grade: 6,  stage: 'upper_primary' },
  { name: 'JHS 1',     grade: 7,  stage: 'jhs' },
  { name: 'JHS 2',     grade: 8,  stage: 'jhs' },
  { name: 'JHS 3',     grade: 9,  stage: 'jhs' }
];

function getGhanaClassLevels(currentUser, currentRole) {
  return { success: true, data: GHANA_CLASS_LEVELS };
}

// Auto-generate classes for the standard Ghana levels. payload: { academicYear, levels: [{ name, grade, stage, streams }] }
// streams=1 -> single class named e.g. "Basic 1" Section "A"; streams>1 -> "A","B","C"... sections, one row per stream.
function autoGenerateClasses(payload, currentUser, currentRole) {
  try {
    if (!isAdmin(currentRole)) return { success: false, message: 'Forbidden — admin only' };

    var sh = getSheet(CLASSES_SHEET);
    if (!sh) return { success: false, message: 'Classes sheet not found' };

    var academicYear = String((payload && payload.academicYear) || '').trim();
    if (!validAcademicYear(academicYear)) return { success: false, message: 'AcademicYear must be YYYY-YYYY (e.g. 2026-2027)' };

    var levels = (payload && payload.levels) || [];
    if (!levels.length) return { success: false, message: 'Pick at least one level to generate' };

    var letters = 'ABCDEFGHIJ';
    var created = 0, skipped = 0, ts = nowIso(), id = nextClassId(sh);
    var rows = [];

    levels.forEach(function (lvl) {
      var name = String(lvl.name || '').trim();
      if (!name) return;
      var streams = parseInt(lvl.streams, 10);
      if (isNaN(streams) || streams < 1) streams = 1;
      if (streams > letters.length) streams = letters.length;
      var grade = parseInt(lvl.grade, 10);
      if (isNaN(grade) || grade < 0) grade = 0;
      var stage = String(lvl.stage || 'lower_primary').toLowerCase();

      for (var s = 0; s < streams; s++) {
        var section = letters[s];
        if (classExists(sh, name, section, academicYear)) { skipped++; continue; }
        var classCode = (name.replace(/[^A-Za-z0-9]/g, '') + section).toUpperCase().slice(0, 20);
        rows.push([
          id++, name, section, academicYear, '', 0, '0', ts, ts,
          grade, classCode, stage, 'english', 'general', 30, '', 'Main', '', '1', 'full_day'
        ]);
        created++;
      }
    });

    if (rows.length) {
      sh.getRange(sh.getLastRow() + 1, 1, rows.length, CLASS_HEADERS.length).setValues(rows);
    }

    addLog(currentUser, 'Classes Auto-Generated', created + ' class(es) created for ' + academicYear + (skipped ? ', ' + skipped + ' skipped (already existed)' : ''));
    return { success: true, message: created + ' class(es) created' + (skipped ? ', ' + skipped + ' skipped (already existed)' : ''), created: created, skipped: skipped };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// soft delete
function deleteClass(id, currentUser, currentRole) {
  try {
    if (!isAdmin(currentRole)) return { success: false, message: 'Forbidden — admin only' };

    var sh = getSheet(CLASSES_SHEET);
    if (!sh) return { success: false, message: 'Classes sheet not found' };

    var idn = parseInt(id, 10);
    if (isNaN(idn)) return { success: false, message: 'Invalid id' };

    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] !== idn || String(data[i][6]) === '1') continue;
      var row = i + 1, ts = nowIso();
      sh.getRange(row, 7).setValue('1');
      sh.getRange(row, 9).setValue(ts);
      addLog(currentUser, 'Class Deleted', 'Soft-deleted class id ' + idn);
      return { success: true, message: 'Class deleted successfully' };
    }
    return { success: false, message: 'Class not found' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// ============== Subjects CRUD ==============
// read: admin/teacher/supervisor (NOT clerk) + future student/parent
function getAllSubjects(currentUser, currentRole) {
  try {
    if (!canReadSubjects(currentRole)) return { success: false, message: 'Forbidden — no access' };

    var sh = getSheet(SUBJECTS_SHEET);
    if (!sh) return { success: false, message: 'Subjects sheet not found' };

    var data = sh.getDataRange().getValues();
    var cmap = getClassesMap();
    var subjects = [];
    var scope = getViewerScope(currentUser, currentRole);

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][5]) === '1') continue; // soft-deleted
      if (!scope.all && scope.classIds.indexOf(parseInt(data[i][3], 10)) === -1) continue; // student/parent: own class only

      var clsId = data[i][3];
      var cls = cmap[clsId];
      var maxMarks = parseInt(data[i][4], 10) || 100;
      // new cols default-safe (legacy rows may be empty)
      var passMarks = data[i][8] !== '' && data[i][8] != null ? (parseInt(data[i][8], 10) || 0) : Math.round(maxMarks * 0.5);
      var sType = String(data[i][9] || '').toLowerCase() || 'theory';

      subjects.push({
        ID: data[i][0],
        SubjectName: data[i][1],
        SubjectCode: data[i][2],
        ClassID: clsId,
        ClassLabel: cls ? cls.label : '— deleted class —',
        ClassName: cls ? cls.className : '',
        Section: cls ? cls.section : '',
        AcademicYear: cls ? cls.academicYear : '',
        MaxMarks: maxMarks,
        PassMarks: passMarks,
        SubjectType: sType,
        TheoryMaxMarks: parseInt(data[i][10], 10) || 0,
        PracticalMaxMarks: parseInt(data[i][11], 10) || 0,
        TheoryPassMarks: parseInt(data[i][12], 10) || 0,
        PracticalPassMarks: parseInt(data[i][13], 10) || 0,
        IsActive: data[i][14] === '' || data[i][14] == null ? true : (String(data[i][14]) === '1' || data[i][14] === 1 || data[i][14] === true),
        IsOptional: String(data[i][15]) === '1' || data[i][15] === 1 || data[i][15] === true,
        SubjectGroup: String(data[i][16] || '').toLowerCase(),
        CreatedAt: toIso(data[i][6]),
        UpdatedAt: toIso(data[i][7])
      });
    }
    return { success: true, data: subjects };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// composite-unique check on (subject_code, class_id) for active rows
function subjectExists(sh, subjectCode, classId, excludeId) {
  var data = sh.getDataRange().getValues();
  var code = String(subjectCode || '').trim().toLowerCase();
  var cid = parseInt(classId, 10);
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][5]) === '1') continue;
    if (excludeId !== undefined && data[i][0] === excludeId) continue;
    if (String(data[i][2] || '').trim().toLowerCase() === code &&
        parseInt(data[i][3], 10) === cid) {
      return true;
    }
  }
  return false;
}

// NaCCA subject list per key phase, so a school never has to type subjects in by hand.
// name/code/subjectGroup match the curriculum; IsOptional flags subjects some schools skip
// (French at upper primary; the BECE aggregate itself only cares about subject NAME, not this flag).
var GHANA_CURRICULUM_SUBJECTS = {
  kg: [
    { name: 'Language and Literacy', code: 'LANLIT', group: 'core' },
    { name: 'Numeracy', code: 'NUM', group: 'core' },
    { name: 'Our World Our People', code: 'OWOP', group: 'core' },
    { name: 'Creative Arts', code: 'CRART', group: 'arts' }
  ],
  lower_primary: [
    { name: 'Mathematics', code: 'MATH', group: 'core' },
    { name: 'English Language', code: 'ENG', group: 'core' },
    { name: 'Ghanaian Language', code: 'GHLANG', group: 'languages' },
    { name: 'Computing', code: 'COMP', group: 'core' },
    { name: 'Religious and Moral Education', code: 'RME', group: 'humanities' },
    { name: 'Creative Arts', code: 'CRART', group: 'arts' },
    { name: 'History', code: 'HIST', group: 'humanities' }
  ],
  upper_primary: [
    { name: 'Mathematics', code: 'MATH', group: 'core' },
    { name: 'English Language', code: 'ENG', group: 'core' },
    { name: 'Ghanaian Language', code: 'GHLANG', group: 'languages' },
    { name: 'Science', code: 'SCI', group: 'sciences' },
    { name: 'History', code: 'HIST', group: 'humanities' },
    { name: 'Computing', code: 'COMP', group: 'core' },
    { name: 'French', code: 'FR', group: 'languages', optional: true },
    { name: 'Creative Arts', code: 'CRART', group: 'arts' },
    { name: 'Religious and Moral Education', code: 'RME', group: 'humanities' }
  ],
  jhs: [
    { name: 'Mathematics', code: 'MATH', group: 'core' },
    { name: 'English Language', code: 'ENG', group: 'core' },
    { name: 'Science', code: 'SCI', group: 'core' },
    { name: 'Social Studies', code: 'SOST', group: 'core' },
    { name: 'Computing', code: 'COMP', group: 'core' },
    { name: 'Ghanaian Language', code: 'GHLANG', group: 'languages' },
    { name: 'French', code: 'FR', group: 'languages', optional: true },
    { name: 'Religious and Moral Education', code: 'RME', group: 'humanities' },
    { name: 'Creative Arts and Design', code: 'CRAD', group: 'arts' },
    { name: 'Career Technology', code: 'CARTECH', group: 'vocational' }
  ]
};
// creche/nursery share the KG (Key Phase 1) broad-domain subject list
GHANA_CURRICULUM_SUBJECTS.creche = GHANA_CURRICULUM_SUBJECTS.kg;
GHANA_CURRICULUM_SUBJECTS.nursery = GHANA_CURRICULUM_SUBJECTS.kg;

function recommendedSubjectsForStage(curriculumStage) {
  return GHANA_CURRICULUM_SUBJECTS[String(curriculumStage || '').toLowerCase()] || GHANA_CURRICULUM_SUBJECTS.lower_primary;
}

// one-click "Quick Setup" — adds every NaCCA subject for a class's key phase that isn't
// already there. Admin never has to know the curriculum by heart to set a class up.
function quickSetupSubjects(classId, currentUser, currentRole) {
  try {
    if (!isAdmin(currentRole)) return { success: false, message: 'Forbidden — admin only' };
    var cid = parseInt(classId, 10);
    if (isNaN(cid)) return { success: false, message: 'Invalid ClassID' };
    var cmap = getClassesMap();
    if (!cmap[cid]) return { success: false, message: 'Selected class does not exist or is deleted' };

    var sh = getSheet(SUBJECTS_SHEET);
    if (!sh) return { success: false, message: 'Subjects sheet not found' };

    var recommended = recommendedSubjectsForStage(cmap[cid].curriculumStage);
    var ts = nowIso(), id = nextSubjectId(sh), added = [], skipped = [];
    recommended.forEach(function(s) {
      if (subjectExists(sh, s.code, cid)) { skipped.push(s.name); return; }
      sh.appendRow([
        id, s.name, s.code, cid, 100, '0', ts, ts,
        50, 'theory', 100, 0, 50, 0, '1', s.optional ? '1' : '0', s.group || 'other'
      ]);
      added.push(s.name);
      id++;
    });

    addLog(currentUser, 'Subjects Quick Setup', cmap[cid].label + ' — added ' + added.length + ' subject(s)');
    return { success: true, message: added.length + ' subject(s) added' + (skipped.length ? ', ' + skipped.length + ' already existed' : ''), added: added, skipped: skipped };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// shared validator — returns { ok, error, normalized:{...} } for the 7 marks/type fields
function validateSubjectMarksFields(d) {
  var maxMarks = parseInt(d.MaxMarks, 10);
  if (isNaN(maxMarks) || maxMarks < 0) maxMarks = 100;

  var passMarks = parseInt(d.PassMarks, 10);
  if (isNaN(passMarks) || passMarks < 0) passMarks = Math.round(maxMarks * 0.5);
  if (passMarks > maxMarks) return { ok: false, error: 'PassMarks cannot exceed MaxMarks' };

  var allowedTypes = ['theory','practical','both','oral','project'];
  var sType = String(d.SubjectType || 'theory').toLowerCase();
  if (allowedTypes.indexOf(sType) === -1) return { ok: false, error: 'SubjectType must be one of: ' + allowedTypes.join(', ') };

  var theoryMax = parseInt(d.TheoryMaxMarks, 10) || 0;
  var practMax = parseInt(d.PracticalMaxMarks, 10) || 0;
  var theoryPass = parseInt(d.TheoryPassMarks, 10) || 0;
  var practPass = parseInt(d.PracticalPassMarks, 10) || 0;

  if (sType === 'both') {
    if (theoryMax + practMax !== maxMarks) {
      return { ok: false, error: 'For type=both, TheoryMax (' + theoryMax + ') + PracticalMax (' + practMax + ') must equal MaxMarks (' + maxMarks + ')' };
    }
    if (theoryPass > theoryMax) return { ok: false, error: 'TheoryPassMarks cannot exceed TheoryMaxMarks' };
    if (practPass > practMax) return { ok: false, error: 'PracticalPassMarks cannot exceed PracticalMaxMarks' };
  } else if (sType === 'theory' || sType === 'oral' || sType === 'project') {
    theoryMax = maxMarks; practMax = 0; theoryPass = passMarks; practPass = 0;
  } else if (sType === 'practical') {
    theoryMax = 0; practMax = maxMarks; theoryPass = 0; practPass = passMarks;
  }

  var isActive = d.IsActive === false || d.IsActive === '0' || d.IsActive === 0 ? '0' : '1';
  var isOptional = (d.IsOptional === true || d.IsOptional === 1 || d.IsOptional === '1') ? '1' : '0';
  var allowedGroups = ['','core','sciences','languages','arts','humanities','commerce','vocational','elective','other'];
  var subjectGroup = String(d.SubjectGroup || '').toLowerCase();
  if (allowedGroups.indexOf(subjectGroup) === -1) subjectGroup = 'other';
  return {
    ok: true,
    normalized: { maxMarks: maxMarks, passMarks: passMarks, sType: sType, theoryMax: theoryMax, practMax: practMax, theoryPass: theoryPass, practPass: practPass, isActive: isActive, isOptional: isOptional, subjectGroup: subjectGroup }
  };
}

function addSubject(subjectData, currentUser, currentRole) {
  try {
    if (!isAdmin(currentRole)) return { success: false, message: 'Forbidden — admin only' };

    var sh = getSheet(SUBJECTS_SHEET);
    if (!sh) return { success: false, message: 'Subjects sheet not found' };

    if (!subjectData.SubjectName || !subjectData.SubjectCode || !subjectData.ClassID) {
      return { success: false, message: 'SubjectName, SubjectCode, ClassID are required' };
    }
    if (String(subjectData.SubjectName).length > 100) return { success: false, message: 'SubjectName max 100 chars' };
    if (String(subjectData.SubjectCode).length > 20) return { success: false, message: 'SubjectCode max 20 chars' };

    var cid = parseInt(subjectData.ClassID, 10);
    if (isNaN(cid)) return { success: false, message: 'Invalid ClassID' };
    var cmap = getClassesMap();
    if (!cmap[cid]) return { success: false, message: 'Selected class does not exist or is deleted' };

    if (subjectExists(sh, subjectData.SubjectCode, cid)) {
      return { success: false, message: 'SubjectCode already exists for this class' };
    }

    var v = validateSubjectMarksFields(subjectData);
    if (!v.ok) return { success: false, message: v.error };
    var n = v.normalized;

    var ts = nowIso(), id = nextSubjectId(sh);
    sh.appendRow([
      id,
      String(subjectData.SubjectName).trim(),
      String(subjectData.SubjectCode).trim().toUpperCase(),
      cid,
      n.maxMarks,
      '0',
      ts,
      ts,
      n.passMarks,
      n.sType,
      n.theoryMax,
      n.practMax,
      n.theoryPass,
      n.practPass,
      n.isActive,
      n.isOptional,
      n.subjectGroup
    ]);

    addLog(currentUser, 'Subject Added', 'Added: ' + subjectData.SubjectName + ' (' + subjectData.SubjectCode + ', ' + n.sType + ') -> ' + cmap[cid].label);
    return { success: true, message: 'Subject added successfully', id: id };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

function updateSubject(id, subjectData, currentUser, currentRole) {
  try {
    if (!isAdmin(currentRole)) return { success: false, message: 'Forbidden — admin only' };

    var sh = getSheet(SUBJECTS_SHEET);
    if (!sh) return { success: false, message: 'Subjects sheet not found' };

    var idn = parseInt(id, 10);
    if (isNaN(idn)) return { success: false, message: 'Invalid id' };

    if (!subjectData.SubjectName || !subjectData.SubjectCode || !subjectData.ClassID) {
      return { success: false, message: 'SubjectName, SubjectCode, ClassID are required' };
    }
    if (String(subjectData.SubjectName).length > 100) return { success: false, message: 'SubjectName max 100 chars' };
    if (String(subjectData.SubjectCode).length > 20) return { success: false, message: 'SubjectCode max 20 chars' };

    var cid = parseInt(subjectData.ClassID, 10);
    if (isNaN(cid)) return { success: false, message: 'Invalid ClassID' };
    var cmap = getClassesMap();
    if (!cmap[cid]) return { success: false, message: 'Selected class does not exist or is deleted' };

    if (subjectExists(sh, subjectData.SubjectCode, cid, idn)) {
      return { success: false, message: 'SubjectCode already exists for this class' };
    }

    var v = validateSubjectMarksFields(subjectData);
    if (!v.ok) return { success: false, message: v.error };
    var n = v.normalized;

    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] !== idn || String(data[i][5]) === '1') continue;
      var row = i + 1, ts = nowIso();

      sh.getRange(row, 2).setValue(String(subjectData.SubjectName).trim());
      sh.getRange(row, 3).setValue(String(subjectData.SubjectCode).trim().toUpperCase());
      sh.getRange(row, 4).setValue(cid);
      sh.getRange(row, 5).setValue(n.maxMarks);
      sh.getRange(row, 8).setValue(ts);
      // new cols
      sh.getRange(row, 9).setValue(n.passMarks);
      sh.getRange(row, 10).setValue(n.sType);
      sh.getRange(row, 11).setValue(n.theoryMax);
      sh.getRange(row, 12).setValue(n.practMax);
      sh.getRange(row, 13).setValue(n.theoryPass);
      sh.getRange(row, 14).setValue(n.practPass);
      sh.getRange(row, 15).setValue(n.isActive);
      sh.getRange(row, 16).setValue(n.isOptional);
      sh.getRange(row, 17).setValue(n.subjectGroup);

      addLog(currentUser, 'Subject Updated', 'Updated id ' + idn + ': ' + subjectData.SubjectName + ' (' + n.sType + ')');
      return { success: true, message: 'Subject updated successfully' };
    }
    return { success: false, message: 'Subject not found' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// soft delete (subjects schema has is_deleted)
function deleteSubject(id, currentUser, currentRole) {
  try {
    if (!isAdmin(currentRole)) return { success: false, message: 'Forbidden — admin only' };

    var sh = getSheet(SUBJECTS_SHEET);
    if (!sh) return { success: false, message: 'Subjects sheet not found' };

    var idn = parseInt(id, 10);
    if (isNaN(idn)) return { success: false, message: 'Invalid id' };

    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] !== idn || String(data[i][5]) === '1') continue;
      var row = i + 1, ts = nowIso();
      sh.getRange(row, 6).setValue('1');
      sh.getRange(row, 8).setValue(ts);
      addLog(currentUser, 'Subject Deleted', 'Soft-deleted subject id ' + idn);
      return { success: true, message: 'Subject deleted successfully' };
    }
    return { success: false, message: 'Subject not found' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// lightweight subjects list — used inside teacher_assignment modal (filtered by class)
function getSubjectsForClass(classId, currentUser, currentRole) {
  try {
    if (!canReadSubjects(currentRole) && !isAdmin(currentRole)) return { success: false, message: 'Forbidden' };
    var sh = getSheet(SUBJECTS_SHEET);
    if (!sh) return { success: false, message: 'Subjects sheet not found' };

    var cid = parseInt(classId, 10);
    if (isNaN(cid)) return { success: true, data: [] };
    var _scope = getViewerScope(currentUser, currentRole);
    if (!_scope.all && _scope.classIds.indexOf(cid) === -1) return { success: false, message: 'Forbidden — own class only' };

    var data = sh.getDataRange().getValues(), out = [];
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][5]) === '1') continue;
      if (parseInt(data[i][3], 10) !== cid) continue;
      var maxMarks = parseInt(data[i][4], 10) || 100;
      out.push({
        ID: data[i][0],
        SubjectName: data[i][1],
        SubjectCode: data[i][2],
        MaxMarks: maxMarks,
        PassMarks: parseInt(data[i][8], 10) || Math.round(maxMarks * 0.5),
        SubjectType: String(data[i][9] || 'theory').toLowerCase(),
        TheoryMaxMarks: parseInt(data[i][10], 10) || 0,
        PracticalMaxMarks: parseInt(data[i][11], 10) || 0,
        TheoryPassMarks: parseInt(data[i][12], 10) || 0,
        PracticalPassMarks: parseInt(data[i][13], 10) || 0,
        IsActive: data[i][14] === '' || data[i][14] == null ? true : (String(data[i][14]) === '1' || data[i][14] === 1 || data[i][14] === true)
      });
    }
    return { success: true, data: out };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// ============== Teacher Assignments CRUD ==============
// read: admin/supervisor see all, teacher sees own only — write: admin only
// schema has NO is_deleted column => hard delete via deleteRow()
function getAllAssignments(currentUser, currentRole) {
  try {
    if (!canReadAssignments(currentRole)) return { success: false, message: 'Forbidden — no access' };

    var sh = getSheet(ASSIGNMENTS_SHEET);
    if (!sh) return { success: false, message: 'Teacher_Assignments sheet not found' };

    var data = sh.getDataRange().getValues();
    var umap = getUsersMap();
    var cmap = getClassesMap();
    var smap = getSubjectsMap();

    // teacher sees own only — find their user id by username
    var ownTeacherId = null;
    if (String(currentRole).toLowerCase() === 'teacher') {
      for (var u in umap) {
        if (umap[u].username === currentUser) { ownTeacherId = parseInt(u, 10); break; }
      }
    }

    var out = [];
    for (var i = 1; i < data.length; i++) {
      var tid = parseInt(data[i][1], 10);
      var clsId = parseInt(data[i][2], 10);
      var subId = parseInt(data[i][3], 10);

      // teacher RBAC: only own assignments
      if (ownTeacherId !== null && tid !== ownTeacherId) continue;

      var t = umap[tid], c = cmap[clsId], s = smap[subId];

      out.push({
        ID: data[i][0],
        TeacherID: tid,
        TeacherName: t ? t.fullName : '— deleted user —',
        ClassID: clsId,
        ClassLabel: c ? c.label : '— deleted class —',
        ClassName: c ? c.className : '',
        Section: c ? c.section : '',
        SubjectID: subId,
        SubjectName: s ? s.subjectName : '— deleted subject —',
        SubjectCode: s ? s.subjectCode : '',
        AcademicYear: data[i][4],
        IsClassTeacher: String(data[i][5]) === '1' || data[i][5] === 1 || data[i][5] === true,
        CreatedAt: toIso(data[i][6]),
        UpdatedAt: toIso(data[i][7]),
        PeriodsPerWeek: parseInt(data[i][8], 10) || 0
      });
    }
    return { success: true, data: out };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

function assignmentExists(sh, teacherId, classId, subjectId, academicYear, excludeId) {
  var data = sh.getDataRange().getValues();
  var t = parseInt(teacherId, 10);
  var c = parseInt(classId, 10);
  var s = parseInt(subjectId, 10);
  var ay = String(academicYear || '').trim();
  for (var i = 1; i < data.length; i++) {
    if (excludeId !== undefined && data[i][0] === excludeId) continue;
    if (parseInt(data[i][1], 10) === t &&
        parseInt(data[i][2], 10) === c &&
        parseInt(data[i][3], 10) === s &&
        String(data[i][4] || '').trim() === ay) {
      return true;
    }
  }
  return false;
}

// aggregator — one record per active teacher with embedded Assignments[] array (JSON shape)
// admin/supervisor see all; teacher sees own only
function getAllTeachersWithAssignments(currentUser, currentRole) {
  try {
    if (!canReadAssignments(currentRole)) return { success: false, message: 'Forbidden — no access' };

    var ush = getSheet(USERS_SHEET);
    if (!ush) return { success: false, message: 'Users sheet not found' };

    var role = String(currentRole).toLowerCase();
    var ownTeacherId = null;
    if (role === 'teacher') {
      var udata0 = ush.getDataRange().getValues();
      for (var i0 = 1; i0 < udata0.length; i0++) {
        if (udata0[i0][1] === currentUser && String(udata0[i0][16]) === '0') {
          ownTeacherId = parseInt(udata0[i0][0], 10);
          break;
        }
      }
    }

    // build all active teachers map (id → teacher record skeleton)
    var teachers = {};
    var udata = ush.getDataRange().getValues();
    for (var i = 1; i < udata.length; i++) {
      if (String(udata[i][16]) === '1') continue; // soft-deleted
      var rl = String(udata[i][6] || '').toLowerCase();
      if (rl !== 'teacher') continue;
      var tid = parseInt(udata[i][0], 10);
      if (ownTeacherId !== null && tid !== ownTeacherId) continue;

      teachers[tid] = {
        TeacherID: tid,
        TeacherName: udata[i][2] || udata[i][1],
        Username: udata[i][1],
        Email: udata[i][3] || '',
        Mobile: udata[i][4] || '',
        Specialization: udata[i][10] || '',
        Status: String(udata[i][14] || 'active').toLowerCase(),
        PhotoURL: udata[i][12] || '',
        Assignments: [],
        TotalAssignments: 0,
        TotalClasses: 0,
        TotalSubjects: 0,
        ClassTeacherOf: []
      };
    }

    // walk assignments, attach to each teacher
    var ash = getSheet(ASSIGNMENTS_SHEET);
    if (ash) {
      var cmap = getClassesMap();
      var smap = getSubjectsMap();
      var adata = ash.getDataRange().getValues();
      for (var j = 1; j < adata.length; j++) {
        var atid = parseInt(adata[j][1], 10);
        if (!teachers[atid]) continue; // teacher gone or filtered

        var aclsId = parseInt(adata[j][2], 10);
        var asubId = parseInt(adata[j][3], 10);
        var c = cmap[aclsId], s = smap[asubId];
        var isCt = String(adata[j][5]) === '1' || adata[j][5] === 1 || adata[j][5] === true;

        teachers[atid].Assignments.push({
          ID: adata[j][0],
          ClassID: aclsId,
          ClassLabel: c ? c.label : '— deleted class —',
          ClassName: c ? c.className : '',
          Section: c ? c.section : '',
          SubjectID: asubId,
          SubjectName: s ? s.subjectName : '— deleted subject —',
          SubjectCode: s ? s.subjectCode : '',
          AcademicYear: adata[j][4],
          IsClassTeacher: isCt,
          CreatedAt: toIso(adata[j][6]),
          UpdatedAt: toIso(adata[j][7])
        });
      }
    }

    // post-aggregate counts
    var out = [];
    for (var key in teachers) {
      var t = teachers[key];
      t.TotalAssignments = t.Assignments.length;
      var clsSeen = {}, subSeen = {};
      for (var k = 0; k < t.Assignments.length; k++) {
        clsSeen[t.Assignments[k].ClassID] = true;
        subSeen[t.Assignments[k].SubjectID] = true;
        if (t.Assignments[k].IsClassTeacher) t.ClassTeacherOf.push(t.Assignments[k].ClassLabel);
      }
      t.TotalClasses = Object.keys(clsSeen).length;
      t.TotalSubjects = Object.keys(subSeen).length;
      out.push(t);
    }
    out.sort(function(a, b) { return String(a.TeacherName).localeCompare(String(b.TeacherName)); });

    return { success: true, data: out };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// bulk add — items: [{ClassID, SubjectID, AcademicYear, IsClassTeacher}, ...] for ONE teacher
// validates each, dedupes against existing rows, atomic batch write
function addAssignmentsBulk(teacherId, items, currentUser, currentRole) {
  try {
    if (!isAdmin(currentRole)) return { success: false, message: 'Forbidden — admin only' };
    if (!Array.isArray(items) || items.length === 0) return { success: false, message: 'No items provided' };
    if (items.length > 50) return { success: false, message: 'Bulk limit is 50 items per call' };

    var sh = getSheet(ASSIGNMENTS_SHEET);
    if (!sh) return { success: false, message: 'Teacher_Assignments sheet not found' };

    var tid = parseInt(teacherId, 10);
    if (isNaN(tid)) return { success: false, message: 'Invalid teacher id' };

    var umap = getUsersMap();
    if (!umap[tid] || umap[tid].role !== 'teacher') return { success: false, message: 'TeacherID is not an active teacher' };

    var cmap = getClassesMap();
    var smap = getSubjectsMap();

    // pre-validate ALL — if any fails, don't write anything
    var prepared = [];
    for (var i = 0; i < items.length; i++) {
      var p = items[i];
      var label = 'Item ' + (i + 1);
      if (!p.ClassID || !p.SubjectID || !p.AcademicYear) {
        return { success: false, message: label + ': ClassID, SubjectID, AcademicYear required' };
      }
      if (!validAcademicYear(p.AcademicYear)) {
        return { success: false, message: label + ': AcademicYear must be YYYY-YYYY' };
      }
      var cid = parseInt(p.ClassID, 10);
      var sid = parseInt(p.SubjectID, 10);
      if (isNaN(cid) || isNaN(sid)) return { success: false, message: label + ': invalid id' };
      if (!cmap[cid]) return { success: false, message: label + ': class not found' };
      if (!smap[sid]) return { success: false, message: label + ': subject not found' };
      if (parseInt(smap[sid].classId, 10) !== cid) {
        return { success: false, message: label + ': subject does not belong to selected class' };
      }
      if (assignmentExists(sh, tid, cid, sid, p.AcademicYear)) {
        return { success: false, message: label + ' (' + cmap[cid].label + ' / ' + smap[sid].subjectName + '): already assigned to this teacher' };
      }
      var ict = (p.IsClassTeacher === true || String(p.IsClassTeacher) === '1' || String(p.IsClassTeacher).toLowerCase() === 'true') ? '1' : '0';
      var ppw = parseInt(p.PeriodsPerWeek, 10);
      if (isNaN(ppw) || ppw < 0) ppw = 0;
      if (ppw > 40) ppw = 40;
      prepared.push({ cid: cid, sid: sid, year: String(p.AcademicYear).trim(), ict: ict, ppw: ppw, classLabel: cmap[cid].label, subjectName: smap[sid].subjectName });
    }

    // sequential id generation — read once, increment locally
    var allData = sh.getDataRange().getValues(), maxId = 0;
    for (var k = 1; k < allData.length; k++) {
      var n = parseInt(allData[k][0], 10);
      if (!isNaN(n) && n > maxId) maxId = n;
    }

    var ts = nowIso(), rows = [], summary = [];
    for (var m = 0; m < prepared.length; m++) {
      var pr = prepared[m];
      maxId++;
      rows.push([maxId, tid, pr.cid, pr.sid, pr.year, pr.ict, ts, ts, pr.ppw]);
      summary.push(pr.classLabel + ' / ' + pr.subjectName);
    }
    if (rows.length > 0) {
      sh.getRange(sh.getLastRow() + 1, 1, rows.length, ASSIGNMENT_HEADERS.length).setValues(rows);
    }

    addLog(currentUser, 'Bulk Assignments', 'Teacher ' + umap[tid].fullName + ': +' + rows.length + ' (' + summary.join(', ') + ')');
    return { success: true, message: 'Added ' + rows.length + ' assignment(s)', count: rows.length };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// hard delete — schema has no is_deleted column
function deleteAssignment(id, currentUser, currentRole) {
  try {
    if (!isAdmin(currentRole)) return { success: false, message: 'Forbidden — admin only' };

    var sh = getSheet(ASSIGNMENTS_SHEET);
    if (!sh) return { success: false, message: 'Teacher_Assignments sheet not found' };

    var idn = parseInt(id, 10);
    if (isNaN(idn)) return { success: false, message: 'Invalid id' };

    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] !== idn) continue;
      sh.deleteRow(i + 1);
      addLog(currentUser, 'Assignment Deleted', 'Hard-deleted assignment id ' + idn);
      return { success: true, message: 'Assignment deleted successfully' };
    }
    return { success: false, message: 'Assignment not found' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// ============== Students CRUD ==============
// row -> public student object (everything except password)
function rowToStudent(row) {
  return {
    ID: row[0],
    AdmissionNumber: row[1],
    FirstName: row[2],
    MiddleName: row[3],
    LastName: row[4],
    FullName: [row[2], row[3], row[4]].filter(function(x){ return x; }).join(' '),
    Gender: String(row[5] || '').toLowerCase(),
    DateOfBirth: toIso(row[6]),
    BloodGroup: row[7] || 'unknown',
    GhanaCardNumber: row[8] || '',
    Mobile: row[9] || '',
    Email: row[10] || '',
    AddressLine: row[11] || '',
    City: row[12] || '',
    Region: row[13] || '',
    GhanaPostGPS: row[14] || '',
    FatherName: row[15] || '',
    FatherOccupation: row[16] || '',
    FatherMobile: row[17] || '',
    MotherName: row[18] || '',
    MotherOccupation: row[19] || '',
    MotherMobile: row[20] || '',
    GuardianName: row[21] || '',
    GuardianRelation: row[22] || '',
    GuardianMobile: row[23] || '',
    AdmissionDate: toIso(row[24]),
    ClassID: row[25],
    RollNumber: row[26],
    Category: String(row[27] || '').toLowerCase(),
    Religion: row[28] || '',
    PreviousSchool: row[29] || '',
    TransportRequired: String(row[30]) === '1' || row[30] === 1 || row[30] === true,
    TransportRoute: row[31] || '',
    MedicalNotes: row[32] || '',
    PhotoURL: row[33] || '',
    Status: String(row[35] || '').toLowerCase(),
    CreatedAt: toIso(row[37]),
    UpdatedAt: toIso(row[38]),
    // intl/safeguarding cols 39-60
    Nationality: row[39] || '',
    SecondNationality: row[40] || '',
    CountryOfBirth: row[41] || '',
    PreferredName: row[42] || '',
    PassportNumber: row[43] || '',
    PassportExpiry: toIso(row[44]),
    VisaType: row[45] || '',
    VisaExpiry: toIso(row[46]),
    MotherTongue: row[47] || '',
    HomeLanguage: row[48] || '',
    EnglishProficiency: String(row[49] || 'b2').toLowerCase(),
    CurriculumTrack: String(row[50] || 'british').toLowerCase(),
    CustodyArrangement: String(row[51] || 'joint').toLowerCase(),
    PrimaryContactParent: String(row[52] || 'both').toLowerCase(),
    AuthorizedPickupPersons: row[53] || '',
    MediaConsent: row[54] === '' || row[54] == null ? true : (String(row[54]) === '1' || row[54] === 1 || row[54] === true),
    DietaryRequirements: row[55] || 'none',
    Allergies: row[56] || '',
    InsuranceProvider: row[57] || '',
    InsurancePolicyExpiry: toIso(row[58]),
    HouseName: row[59] || '',
    AdmissionType: String(row[60] || 'fresh').toLowerCase(),
    ConcessionPercent: parseFloat(row[61]) || 0,
    SpecialNeeds: row[62] || ''
  };
}

// strip down to clerk's basic-fields-only subset
function toBasicStudent(s, classLabel) {
  return {
    ID: s.ID,
    AdmissionNumber: s.AdmissionNumber,
    FirstName: s.FirstName,
    LastName: s.LastName,
    FullName: s.FullName,
    Gender: s.Gender,
    DateOfBirth: s.DateOfBirth,
    ClassID: s.ClassID,
    ClassLabel: classLabel,
    RollNumber: s.RollNumber,
    Status: s.Status,
    AdmissionDate: s.AdmissionDate,
    PhotoURL: s.PhotoURL,
    _basicView: true
  };
}

function getAllStudents(currentUser, currentRole) {
  try {
    if (!canReadStudents(currentRole)) return { success: false, message: 'Forbidden — no access' };

    var sh = getSheet(STUDENTS_SHEET);
    if (!sh) return { success: false, message: 'Students sheet not found' };

    var data = sh.getDataRange().getValues();
    var cmap = getClassesMap();

    // teacher own-class filter
    var teacherClassIds = null;
    if (String(currentRole).toLowerCase() === 'teacher') {
      teacherClassIds = getTeacherClassIds(currentUser);
    }

    // student/parent: only their own class(es); also get the limited roster view (like clerk)
    var scope = getViewerScope(currentUser, currentRole);
    var basicOnly = isClerkBasicView(currentRole) || !scope.all;
    var out = [];

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][36]) === '1') continue;

      var clsId = parseInt(data[i][25], 10);

      if (teacherClassIds !== null && teacherClassIds.indexOf(clsId) === -1) continue;
      if (!scope.all && scope.classIds.indexOf(clsId) === -1) continue;

      var s = rowToStudent(data[i]);
      var classLabel = cmap[clsId] ? cmap[clsId].label : '— deleted class —';
      s.ClassLabel = classLabel;
      s.ClassName = cmap[clsId] ? cmap[clsId].className : '';
      s.Section = cmap[clsId] ? cmap[clsId].section : '';
      s.AcademicYear = cmap[clsId] ? cmap[clsId].academicYear : '';

      // own / own-child record stays full; classmates are shown in the basic view
      var ownRecord = !scope.all && scope.studentIds.indexOf(parseInt(data[i][0], 10)) !== -1;
      out.push((basicOnly && !ownRecord) ? toBasicStudent(s, classLabel) : s);
    }
    return { success: true, data: out };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// uniqueness checks
function admissionNumberExists(sh, admNo, excludeId) {
  var data = sh.getDataRange().getValues();
  var n = String(admNo || '').trim().toLowerCase();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][36]) === '1') continue;
    if (excludeId !== undefined && data[i][0] === excludeId) continue;
    if (String(data[i][1] || '').trim().toLowerCase() === n) return true;
  }
  return false;
}

// PREFIX + YEAR + 4-digit sequence, e.g. ROA20260001 — scans existing admission numbers
// sharing the same prefix+year to find the next free sequence (never reuses a number).
function generateNextAdmissionNumber(sh) {
  var settingsRes = getSchoolSettings();
  var prefix = (settingsRes.data && settingsRes.data.AdmissionNumberPrefix) ? settingsRes.data.AdmissionNumberPrefix : 'STU';
  var year = new Date().getFullYear();
  var base = prefix + year;
  var data = sh.getDataRange().getValues();
  var maxSeq = 0;
  for (var i = 1; i < data.length; i++) {
    var admNo = String(data[i][1] || '');
    if (admNo.indexOf(base) !== 0) continue;
    var seq = parseInt(admNo.slice(base.length), 10);
    if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
  }
  return base + String(maxSeq + 1).padStart(4, '0');
}

// exposed for the frontend to preview the next AdmissionNumber before saving
function getNextAdmissionNumber(currentUser, currentRole) {
  try {
    if (!isAdmin(currentRole)) return { success: false, message: 'Forbidden — admin only' };
    var sh = getSheet(STUDENTS_SHEET);
    if (!sh) return { success: false, message: 'Students sheet not found' };
    return { success: true, admissionNumber: generateNextAdmissionNumber(sh) };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

function ghanaCardExists(sh, ghanaCard, excludeId) {
  if (!ghanaCard) return false;
  var data = sh.getDataRange().getValues();
  var a = String(ghanaCard).trim();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][36]) === '1') continue;
    if (excludeId !== undefined && data[i][0] === excludeId) continue;
    if (String(data[i][8] || '').trim() === a) return true;
  }
  return false;
}

// composite UNIQUE(class_id, roll_number, status)
function studentRollExists(sh, classId, rollNumber, status, excludeId) {
  var data = sh.getDataRange().getValues();
  var cid = parseInt(classId, 10);
  var roll = String(rollNumber || '').trim().toLowerCase();
  var st = String(status || '').trim().toLowerCase();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][36]) === '1') continue;
    if (excludeId !== undefined && data[i][0] === excludeId) continue;
    if (parseInt(data[i][25], 10) === cid &&
        String(data[i][26] || '').trim().toLowerCase() === roll &&
        String(data[i][35] || '').trim().toLowerCase() === st) {
      return true;
    }
  }
  return false;
}

// validate + normalize the 22 intl/safeguarding fields
function validateStudentIntlFields(d) {
  var profEnum = ['none','a1','a2','b1','b2','c1','c2','native'];
  var curEnum = ['ges','ib_pyp','ib_myp','ib_dp','cambridge_igcse','cambridge_alevel','british','american','french','german','other'];
  var custEnum = ['joint','mother_only','father_only','legal_guardian','split','other'];
  var primaryEnum = ['father','mother','guardian','both'];
  var dietEnum = ['halal','kosher','vegetarian','vegan','pescatarian','dairy_free','gluten_free','nut_free','none'];
  var admTypeEnum = ['fresh','transfer','re_admission'];

  var prof = String(d.EnglishProficiency || 'b2').toLowerCase();
  if (profEnum.indexOf(prof) === -1) return { ok: false, error: 'EnglishProficiency must be one of: ' + profEnum.join(', ') };

  var cur = String(d.CurriculumTrack || 'ges').toLowerCase();
  if (curEnum.indexOf(cur) === -1) return { ok: false, error: 'CurriculumTrack must be one of: ' + curEnum.join(', ') };

  var cust = String(d.CustodyArrangement || 'joint').toLowerCase();
  if (custEnum.indexOf(cust) === -1) return { ok: false, error: 'CustodyArrangement must be one of: ' + custEnum.join(', ') };

  var primary = String(d.PrimaryContactParent || 'both').toLowerCase();
  if (primaryEnum.indexOf(primary) === -1) return { ok: false, error: 'PrimaryContactParent must be one of: ' + primaryEnum.join(', ') };

  var admType = String(d.AdmissionType || 'fresh').toLowerCase();
  if (admTypeEnum.indexOf(admType) === -1) return { ok: false, error: 'AdmissionType must be one of: ' + admTypeEnum.join(', ') };

  // diet — accept CSV or array
  var dietRaw = d.DietaryRequirements;
  var dietStr = '';
  if (Array.isArray(dietRaw)) dietStr = dietRaw.join(',');
  else if (typeof dietRaw === 'string') dietStr = dietRaw;
  else dietStr = 'none';
  var dietParts = dietStr.split(',').map(function(x){ return String(x).trim().toLowerCase(); }).filter(function(x){ return dietEnum.indexOf(x) !== -1; });
  if (dietParts.length === 0) dietParts = ['none'];
  dietStr = dietParts.join(',');

  // length caps
  var nat = String(d.Nationality || '').trim(); if (nat.length > 50) return { ok: false, error: 'Nationality max 50' };
  var nat2 = String(d.SecondNationality || '').trim(); if (nat2.length > 50) return { ok: false, error: 'SecondNationality max 50' };
  var cob = String(d.CountryOfBirth || '').trim(); if (cob.length > 50) return { ok: false, error: 'CountryOfBirth max 50' };
  var pref = String(d.PreferredName || '').trim(); if (pref.length > 50) return { ok: false, error: 'PreferredName max 50' };
  var pp = String(d.PassportNumber || '').trim(); if (pp.length > 30) return { ok: false, error: 'PassportNumber max 30' };
  var ppExp = String(d.PassportExpiry || '').trim(); if (ppExp && !/^\d{4}-\d{2}-\d{2}$/.test(ppExp)) return { ok: false, error: 'PassportExpiry must be YYYY-MM-DD' };
  var visa = String(d.VisaType || '').trim(); if (visa.length > 50) return { ok: false, error: 'VisaType max 50' };
  var visaExp = String(d.VisaExpiry || '').trim(); if (visaExp && !/^\d{4}-\d{2}-\d{2}$/.test(visaExp)) return { ok: false, error: 'VisaExpiry must be YYYY-MM-DD' };
  var mt = String(d.MotherTongue || '').trim(); if (mt.length > 30) return { ok: false, error: 'MotherTongue max 30' };
  var hl = String(d.HomeLanguage || '').trim(); if (hl.length > 30) return { ok: false, error: 'HomeLanguage max 30' };
  var pickup = String(d.AuthorizedPickupPersons || '').trim(); if (pickup.length > 500) return { ok: false, error: 'AuthorizedPickupPersons max 500' };
  var allg = String(d.Allergies || '').trim(); if (allg.length > 300) return { ok: false, error: 'Allergies max 300' };
  var ins = String(d.InsuranceProvider || '').trim(); if (ins.length > 100) return { ok: false, error: 'InsuranceProvider max 100' };
  var insExp = String(d.InsurancePolicyExpiry || '').trim(); if (insExp && !/^\d{4}-\d{2}-\d{2}$/.test(insExp)) return { ok: false, error: 'InsurancePolicyExpiry must be YYYY-MM-DD' };
  var house = String(d.HouseName || '').trim(); if (house.length > 30) return { ok: false, error: 'HouseName max 30' };

  var media = (d.MediaConsent === false || String(d.MediaConsent) === '0' || d.MediaConsent === 0) ? '0' : '1';

  // concession (0..100, decimal allowed)
  var conc = parseFloat(d.ConcessionPercent);
  if (isNaN(conc) || conc < 0) conc = 0;
  if (conc > 100) return { ok: false, error: 'ConcessionPercent must be 0..100' };

  // SEN — CSV-friendly free text up to 300 chars
  var sen = String(d.SpecialNeeds || '').trim();
  if (sen.length > 300) return { ok: false, error: 'SpecialNeeds max 300' };

  return {
    ok: true,
    normalized: {
      nationality: nat, secondNationality: nat2, countryOfBirth: cob, preferredName: pref,
      passportNumber: pp, passportExpiry: toIso(ppExp), visaType: visa, visaExpiry: toIso(visaExp),
      motherTongue: mt, homeLanguage: hl, englishProficiency: prof, curriculumTrack: cur,
      custodyArrangement: cust, primaryContactParent: primary, authorizedPickupPersons: pickup,
      mediaConsent: media, dietaryRequirements: dietStr, allergies: allg,
      insuranceProvider: ins, insurancePolicyExpiry: toIso(insExp), houseName: house, admissionType: admType,
      concessionPercent: conc, specialNeeds: sen
    }
  };
}

// ============== Auto-mirror to Users sheet ==============
// student/parent rows are auto-mirrored into Users (Role='student'/'parent') so admin
// sees ONE unified login list + the staff auth path covers all logins.
// Linked by EmployeeCode = 'STU-<id>' / 'PAR-<id>' so the mirror is findable
// even if Username (admNum/mobile) changes later.

function _mirrorStudentToUsers(studentId, admNum, fullName, email, mobile, password, gender, dob, photoUrl, currentUser) {
  try {
    var sh = getSheet(USERS_SHEET);
    if (!sh) return;
    var ec = 'STU-' + studentId;
    var ts = nowIso();
    var data = sh.getDataRange().getValues();
    var existingRow = -1, conflictRow = -1;
    var uname = String(admNum || '').trim();
    var unameLow = uname.toLowerCase();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][23] || '') === ec) { existingRow = i + 1; break; }
      if (String(data[i][1] || '').trim().toLowerCase() === unameLow) conflictRow = i + 1;
    }
    if (existingRow > 0) {
      sh.getRange(existingRow, 2).setValue(uname);
      sh.getRange(existingRow, 3).setValue(fullName || '');
      sh.getRange(existingRow, 4).setValue(email || '');
      if (password && String(password).trim() !== '') sh.getRange(existingRow, 5).setValue(password);
      sh.getRange(existingRow, 6).setValue(mobile || '');
      sh.getRange(existingRow, 7).setValue('student');
      sh.getRange(existingRow, 8).setValue(String(gender || '').toLowerCase());
      sh.getRange(existingRow, 9).setValue(dob || '');
      sh.getRange(existingRow, 13).setValue(photoUrl || '');
      sh.getRange(existingRow, 15).setValue('active');
      sh.getRange(existingRow, 17).setValue('0');
      sh.getRange(existingRow, 22).setValue(ts);
      sh.getRange(existingRow, 23).setValue(currentUser || 'System');
      return;
    }
    if (conflictRow > 0) {
      Logger.log('mirrorStudentToUsers: username conflict for "' + uname + '" — student #' + studentId + ' not mirrored');
      return;
    }
    var nextId = nextRowId(sh);
    sh.appendRow([
      nextId, uname, fullName || '', email || '', password || '', mobile || '',
      'student', String(gender || '').toLowerCase(), dob || '',
      '', '', '', photoUrl || '', '', 'active', '', '0', 'light', '',
      ts, currentUser || 'System', ts, currentUser || 'System',
      ec, '', ''
    ]);
  } catch (e) { Logger.log('mirrorStudentToUsers error: ' + e.toString()); }
}

function _mirrorParentToUsers(parentId, fullName, email, mobile, password, relation, photoUrl, currentUser) {
  try {
    var sh = getSheet(USERS_SHEET);
    if (!sh) return;
    var ec = 'PAR-' + parentId;
    var ts = nowIso();
    var data = sh.getDataRange().getValues();
    // parent uses Mobile as primary username; fall back to Email if no mobile
    var uname = String(mobile || email || '').trim();
    if (!uname) return;
    var unameLow = uname.toLowerCase();
    var existingRow = -1, conflictRow = -1;
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][23] || '') === ec) { existingRow = i + 1; break; }
      if (String(data[i][1] || '').trim().toLowerCase() === unameLow) conflictRow = i + 1;
    }
    var rel = String(relation || '').toLowerCase();
    var gender = rel === 'father' ? 'male' : rel === 'mother' ? 'female' : 'other';
    if (existingRow > 0) {
      sh.getRange(existingRow, 2).setValue(uname);
      sh.getRange(existingRow, 3).setValue(fullName || '');
      sh.getRange(existingRow, 4).setValue(email || '');
      if (password && String(password).trim() !== '') sh.getRange(existingRow, 5).setValue(password);
      sh.getRange(existingRow, 6).setValue(mobile || '');
      sh.getRange(existingRow, 7).setValue('parent');
      sh.getRange(existingRow, 8).setValue(gender);
      sh.getRange(existingRow, 13).setValue(photoUrl || '');
      sh.getRange(existingRow, 15).setValue('active');
      sh.getRange(existingRow, 17).setValue('0');
      sh.getRange(existingRow, 22).setValue(ts);
      sh.getRange(existingRow, 23).setValue(currentUser || 'System');
      return;
    }
    if (conflictRow > 0) {
      Logger.log('mirrorParentToUsers: username conflict for "' + uname + '" — parent #' + parentId + ' not mirrored');
      return;
    }
    var nextId = nextRowId(sh);
    sh.appendRow([
      nextId, uname, fullName || '', email || '', password || '', mobile || '',
      'parent', gender, '',
      '', '', '', photoUrl || '', '', 'active', '', '0', 'light', '',
      ts, currentUser || 'System', ts, currentUser || 'System',
      ec, '', ''
    ]);
  } catch (e) { Logger.log('mirrorParentToUsers error: ' + e.toString()); }
}

function _unmirrorByEmployeeCode(ec) {
  try {
    var sh = getSheet(USERS_SHEET);
    if (!sh) return;
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][23] || '') === ec) {
        sh.getRange(i + 1, 17).setValue('1');           // IsDeleted
        sh.getRange(i + 1, 22).setValue(nowIso());      // UpdatedAt
        return;
      }
    }
  } catch (e) { Logger.log('_unmirrorByEmployeeCode error: ' + e.toString()); }
}

// admin-run-once recovery: walk every active student + parent and ensure a Users mirror exists.
// Run from Apps Script editor → Run → backfillUserMirrors. Safe to run multiple times.
function backfillUserMirrors() {
  var s = 0, p = 0;
  var ssh = getSheet(STUDENTS_SHEET);
  if (ssh) {
    var sd = ssh.getDataRange().getValues();
    for (var i = 1; i < sd.length; i++) {
      if (String(sd[i][36]) === '1') continue;
      var fullName = [sd[i][2], sd[i][3], sd[i][4]].filter(function(x){return x;}).join(' ');
      _mirrorStudentToUsers(sd[i][0], sd[i][1], fullName, sd[i][10] || '', sd[i][9] || '',
        sd[i][34] || '', sd[i][5] || '', sd[i][6] || '', sd[i][33] || '', 'System');
      s++;
    }
  }
  var psh = getSheet(PARENTS_SHEET);
  if (psh) {
    var pd = psh.getDataRange().getValues();
    for (var j = 1; j < pd.length; j++) {
      if (String(pd[j][10]) === '1') continue;
      _mirrorParentToUsers(pd[j][0], pd[j][1] || '', pd[j][2] || '', pd[j][3] || '',
        pd[j][4] || '', pd[j][5] || '', pd[j][26] || '', 'System');
      p++;
    }
  }
  var msg = 'Backfill complete — ' + s + ' student(s) + ' + p + ' parent(s) mirrored to Users';
  Logger.log(msg);
  return msg;
}

// Only FirstName/LastName are enforced — every other field is optional so admins can
// complete a student record in stages. ClassID left blank means "unassigned" (the student
// just won't show up in attendance/marks/fees/timetable until a class is set). AdmissionNumber
// and LoginPassword auto-generate when left blank so nothing blocks saving.
function addStudent(s, currentUser, currentRole) {
  try {
    if (!isAdmin(currentRole)) return { success: false, message: 'Forbidden — admin only' };

    var sh = getSheet(STUDENTS_SHEET);
    if (!sh) return { success: false, message: 'Students sheet not found' };

    if (!String(s.FirstName || '').trim() || !String(s.LastName || '').trim()) {
      return { success: false, message: 'First Name and Last Name are required' };
    }

    var cid = null;
    if (s.ClassID !== '' && s.ClassID != null) {
      cid = parseInt(s.ClassID, 10);
      if (isNaN(cid)) return { success: false, message: 'Invalid ClassID' };
    }
    var cmap = getClassesMap();
    if (cid !== null && !cmap[cid]) return { success: false, message: 'Selected class does not exist or is deleted' };

    var admissionNumber = String(s.AdmissionNumber || '').trim() || generateNextAdmissionNumber(sh);
    if (admissionNumberExists(sh, admissionNumber)) {
      return { success: false, message: 'Admission Number already exists' };
    }
    if (s.GhanaCardNumber && ghanaCardExists(sh, s.GhanaCardNumber)) {
      return { success: false, message: 'Ghana Card Number already in use' };
    }
    var statusVal = String(s.Status || 'active').toLowerCase();
    var rollNumber = String(s.RollNumber || '').trim();
    if (cid !== null && rollNumber && studentRollExists(sh, cid, rollNumber, statusVal)) {
      return { success: false, message: 'Roll Number already used in this class for status: ' + statusVal };
    }
    var loginPassword = String(s.LoginPassword || '').trim() || Utilities.getUuid().slice(0, 8);

    // intl/safeguarding validation + normalize
    var iv = validateStudentIntlFields(s);
    if (!iv.ok) return { success: false, message: iv.error };
    var ni = iv.normalized;

    var ts = nowIso(), id = nextStudentId(sh);
    var transportReq = (s.TransportRequired === true || String(s.TransportRequired) === '1' || String(s.TransportRequired).toLowerCase() === 'true') ? '1' : '0';

    sh.appendRow([
      id,
      admissionNumber,
      String(s.FirstName).trim(),
      s.MiddleName ? String(s.MiddleName).trim() : '',
      String(s.LastName).trim(),
      String(s.Gender || '').toLowerCase(),
      s.DateOfBirth ? toIso(s.DateOfBirth) : '',
      s.BloodGroup || 'unknown',
      s.GhanaCardNumber ? String(s.GhanaCardNumber).trim() : '',
      s.Mobile || '',
      s.Email || '',
      String(s.AddressLine || '').trim(),
      String(s.City || '').trim(),
      String(s.Region || '').trim(),
      String(s.GhanaPostGPS || '').trim(),
      String(s.FatherName || '').trim(),
      s.FatherOccupation || '',
      String(s.FatherMobile || '').trim(),
      String(s.MotherName || '').trim(),
      s.MotherOccupation || '',
      s.MotherMobile || '',
      s.GuardianName || '',
      s.GuardianRelation || '',
      s.GuardianMobile || '',
      toIso(s.AdmissionDate || todayStr()),
      cid === null ? '' : cid,
      rollNumber,
      String(s.Category || '').toLowerCase(),
      s.Religion || '',
      s.PreviousSchool || '',
      transportReq,
      s.TransportRoute || '',
      s.MedicalNotes || '',
      s.PhotoURL || '',
      loginPassword,  // plain per Apps Script rule, schema field name kept
      statusVal,
      '0',
      ts, ts,
      // 22 new intl cols
      ni.nationality, ni.secondNationality, ni.countryOfBirth, ni.preferredName,
      ni.passportNumber, ni.passportExpiry, ni.visaType, ni.visaExpiry,
      ni.motherTongue, ni.homeLanguage, ni.englishProficiency, ni.curriculumTrack,
      ni.custodyArrangement, ni.primaryContactParent, ni.authorizedPickupPersons, ni.mediaConsent,
      ni.dietaryRequirements, ni.allergies, ni.insuranceProvider, ni.insurancePolicyExpiry,
      ni.houseName, ni.admissionType,
      // welfare/finance cols 61-62
      ni.concessionPercent, ni.specialNeeds
    ]);

    if (cid !== null) recomputeClassStrength(cid);
    // mirror into Users so the student can log in via the unified auth path
    var _fullName = [String(s.FirstName).trim(), s.MiddleName ? String(s.MiddleName).trim() : '', String(s.LastName).trim()]
      .filter(function(x){ return x; }).join(' ');
    _mirrorStudentToUsers(id, admissionNumber, _fullName, s.Email || '', s.Mobile || '',
      loginPassword, s.Gender || '', s.DateOfBirth ? toIso(s.DateOfBirth) : '', s.PhotoURL || '', currentUser);
    // auto-generate monthly dues from admission month → current month
    if (cid !== null) { try { generateStudentDues(id, currentUser); } catch (e) { Logger.log('generateStudentDues hook failed: ' + e.toString()); } }
    addLog(currentUser, 'Student Added', 'Added: ' + admissionNumber + ' / ' + s.FirstName + ' ' + s.LastName + (cmap[cid] ? ' -> ' + cmap[cid].label : ''));
    return { success: true, message: 'Student added successfully' + (String(s.LoginPassword || '').trim() ? '' : ' — generated password: ' + loginPassword), id: id, admissionNumber: admissionNumber };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

function updateStudent(id, s, currentUser, currentRole) {
  try {
    if (!isAdmin(currentRole)) return { success: false, message: 'Forbidden — admin only' };

    var sh = getSheet(STUDENTS_SHEET);
    if (!sh) return { success: false, message: 'Students sheet not found' };

    var idn = parseInt(id, 10);
    if (isNaN(idn)) return { success: false, message: 'Invalid id' };

    if (!String(s.FirstName || '').trim() || !String(s.LastName || '').trim()) {
      return { success: false, message: 'First Name and Last Name are required' };
    }

    var cid = null;
    if (s.ClassID !== '' && s.ClassID != null) {
      cid = parseInt(s.ClassID, 10);
      if (isNaN(cid)) return { success: false, message: 'Invalid ClassID' };
    }
    var cmap = getClassesMap();
    if (cid !== null && !cmap[cid]) return { success: false, message: 'Selected class does not exist or is deleted' };

    var admissionNumber = String(s.AdmissionNumber || '').trim();
    if (admissionNumber && admissionNumberExists(sh, admissionNumber, idn)) {
      return { success: false, message: 'Admission Number already exists' };
    }
    if (s.GhanaCardNumber && ghanaCardExists(sh, s.GhanaCardNumber, idn)) {
      return { success: false, message: 'Ghana Card Number already in use' };
    }
    var statusVal = String(s.Status || 'active').toLowerCase();
    var rollNumber = String(s.RollNumber || '').trim();
    if (cid !== null && rollNumber && studentRollExists(sh, cid, rollNumber, statusVal, idn)) {
      return { success: false, message: 'Roll Number already used in this class for status: ' + statusVal };
    }

    // intl/safeguarding validation + normalize
    var iv = validateStudentIntlFields(s);
    if (!iv.ok) return { success: false, message: iv.error };
    var ni = iv.normalized;

    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] !== idn || String(data[i][36]) === '1') continue;
      var row = i + 1, ts = nowIso();
      var oldClassIdRaw = parseInt(data[i][25], 10);
      var oldClassId = isNaN(oldClassIdRaw) ? null : oldClassIdRaw;
      var transportReq = (s.TransportRequired === true || String(s.TransportRequired) === '1' || String(s.TransportRequired).toLowerCase() === 'true') ? '1' : '0';
      if (!admissionNumber) admissionNumber = data[i][1]; // keep existing if cleared

      sh.getRange(row, 2).setValue(admissionNumber);
      sh.getRange(row, 3).setValue(String(s.FirstName).trim());
      sh.getRange(row, 4).setValue(s.MiddleName || '');
      sh.getRange(row, 5).setValue(String(s.LastName).trim());
      sh.getRange(row, 6).setValue(String(s.Gender || '').toLowerCase());
      sh.getRange(row, 7).setValue(s.DateOfBirth ? toIso(s.DateOfBirth) : '');
      sh.getRange(row, 8).setValue(s.BloodGroup || 'unknown');
      sh.getRange(row, 9).setValue(s.GhanaCardNumber ? String(s.GhanaCardNumber).trim() : '');
      sh.getRange(row, 10).setValue(s.Mobile || '');
      sh.getRange(row, 11).setValue(s.Email || '');
      sh.getRange(row, 12).setValue(String(s.AddressLine || '').trim());
      sh.getRange(row, 13).setValue(String(s.City || '').trim());
      sh.getRange(row, 14).setValue(String(s.Region || '').trim());
      sh.getRange(row, 15).setValue(String(s.GhanaPostGPS || '').trim());
      sh.getRange(row, 16).setValue(String(s.FatherName || '').trim());
      sh.getRange(row, 17).setValue(s.FatherOccupation || '');
      sh.getRange(row, 18).setValue(String(s.FatherMobile || '').trim());
      sh.getRange(row, 19).setValue(String(s.MotherName || '').trim());
      sh.getRange(row, 20).setValue(s.MotherOccupation || '');
      sh.getRange(row, 21).setValue(s.MotherMobile || '');
      sh.getRange(row, 22).setValue(s.GuardianName || '');
      sh.getRange(row, 23).setValue(s.GuardianRelation || '');
      sh.getRange(row, 24).setValue(s.GuardianMobile || '');
      sh.getRange(row, 25).setValue(toIso(s.AdmissionDate || todayStr()));
      sh.getRange(row, 26).setValue(cid === null ? '' : cid);
      sh.getRange(row, 27).setValue(rollNumber);
      sh.getRange(row, 28).setValue(String(s.Category || '').toLowerCase());
      sh.getRange(row, 29).setValue(s.Religion || '');
      sh.getRange(row, 30).setValue(s.PreviousSchool || '');
      sh.getRange(row, 31).setValue(transportReq);
      sh.getRange(row, 32).setValue(s.TransportRoute || '');
      sh.getRange(row, 33).setValue(s.MedicalNotes || '');
      sh.getRange(row, 34).setValue(s.PhotoURL || '');
      if (s.LoginPassword && String(s.LoginPassword).trim() !== '') {
        sh.getRange(row, 35).setValue(s.LoginPassword);
      }
      sh.getRange(row, 36).setValue(statusVal);
      sh.getRange(row, 39).setValue(ts);

      // intl/safeguarding cols 40-61 (1-indexed)
      sh.getRange(row, 40).setValue(ni.nationality);
      sh.getRange(row, 41).setValue(ni.secondNationality);
      sh.getRange(row, 42).setValue(ni.countryOfBirth);
      sh.getRange(row, 43).setValue(ni.preferredName);
      sh.getRange(row, 44).setValue(ni.passportNumber);
      sh.getRange(row, 45).setValue(ni.passportExpiry);
      sh.getRange(row, 46).setValue(ni.visaType);
      sh.getRange(row, 47).setValue(ni.visaExpiry);
      sh.getRange(row, 48).setValue(ni.motherTongue);
      sh.getRange(row, 49).setValue(ni.homeLanguage);
      sh.getRange(row, 50).setValue(ni.englishProficiency);
      sh.getRange(row, 51).setValue(ni.curriculumTrack);
      sh.getRange(row, 52).setValue(ni.custodyArrangement);
      sh.getRange(row, 53).setValue(ni.primaryContactParent);
      sh.getRange(row, 54).setValue(ni.authorizedPickupPersons);
      sh.getRange(row, 55).setValue(ni.mediaConsent);
      sh.getRange(row, 56).setValue(ni.dietaryRequirements);
      sh.getRange(row, 57).setValue(ni.allergies);
      sh.getRange(row, 58).setValue(ni.insuranceProvider);
      sh.getRange(row, 59).setValue(ni.insurancePolicyExpiry);
      sh.getRange(row, 60).setValue(ni.houseName);
      sh.getRange(row, 61).setValue(ni.admissionType);
      // welfare/finance cols 62-63
      sh.getRange(row, 62).setValue(ni.concessionPercent);
      sh.getRange(row, 63).setValue(ni.specialNeeds);

      // recompute strength on both old + new class if class changed
      if (cid !== null) recomputeClassStrength(cid);
      if (oldClassId !== cid && oldClassId !== null) recomputeClassStrength(oldClassId);

      // sync mirror in Users sheet (preserves login)
      var _fullName = [String(s.FirstName).trim(), s.MiddleName ? String(s.MiddleName).trim() : '', String(s.LastName).trim()]
        .filter(function(x){ return x; }).join(' ');
      _mirrorStudentToUsers(idn, admissionNumber, _fullName, s.Email || '', s.Mobile || '',
        s.LoginPassword || '', s.Gender || '', s.DateOfBirth ? toIso(s.DateOfBirth) : '', s.PhotoURL || '', currentUser);

      addLog(currentUser, 'Student Updated', 'Updated id ' + idn + ': ' + admissionNumber);
      return { success: true, message: 'Student updated successfully' };
    }
    return { success: false, message: 'Student not found' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// Ghana promotion rule: move every active student in one class to another, carrying forward
// any outstanding fee balance into the new class as an "Arrears (Carried Forward)" fee item.
function promoteStudents(payload, currentUser, currentRole) {
  try {
    if (!isAdmin(currentRole)) return { success: false, message: 'Forbidden — admin only' };

    var fromClassId = parseInt(payload && payload.fromClassId, 10);
    var toClassId = parseInt(payload && payload.toClassId, 10);
    if (isNaN(fromClassId) || isNaN(toClassId)) return { success: false, message: 'Invalid fromClassId/toClassId' };
    if (fromClassId === toClassId) return { success: false, message: 'From and To class must be different' };

    var cmap = getClassesMap();
    if (!cmap[fromClassId]) return { success: false, message: 'From-class not found or deleted' };
    if (!cmap[toClassId]) return { success: false, message: 'To-class not found or deleted' };

    var ssh = getSheet(STUDENTS_SHEET);
    if (!ssh) return { success: false, message: 'Students sheet not found' };
    var sdata = ssh.getDataRange().getValues();

    var pickIds = null;
    if (payload.studentIds && payload.studentIds.length) {
      pickIds = {};
      payload.studentIds.forEach(function (x) { pickIds[parseInt(x, 10)] = true; });
    }

    var targetRows = [];
    for (var i = 1; i < sdata.length; i++) {
      if (String(sdata[i][36]) === '1') continue; // deleted
      if (parseInt(sdata[i][25], 10) !== fromClassId) continue;
      var sid = parseInt(sdata[i][0], 10);
      if (pickIds && !pickIds[sid]) continue;
      targetRows.push({ row: i + 1, sid: sid });
    }
    if (!targetRows.length) return { success: false, message: 'No students found to promote in the source class' };

    // pull all non-deleted fee payments once, grouped by student, to compute + close out outstanding balances
    var fpsh = getSheet(FEE_PAYMENTS_SHEET);
    if (!fpsh) return { success: false, message: 'Fee_Payments sheet not found' };
    var fpdata = fpsh.getDataRange().getValues();
    var duesByStudent = {}; // sid -> [{ rowIdx, amountDue }]
    for (var f = 1; f < fpdata.length; f++) {
      if (String(fpdata[f][15]) === '1') continue; // deleted
      var due = parseFloat(fpdata[f][4]) || 0;
      if (due <= 0) continue;
      var fsid = parseInt(fpdata[f][1], 10);
      if (!duesByStudent[fsid]) duesByStudent[fsid] = [];
      duesByStudent[fsid].push({ rowIdx: f, amountDue: due });
    }

    // find (or create) the "Arrears" fee structure item for the target class + year
    var newAcademicYear = String((payload && payload.newAcademicYear) || cmap[toClassId].academicYear || '').trim();
    var fsh = getSheet(FEE_STRUCTURE_SHEET);
    if (!fsh) return { success: false, message: 'Fee_Structure sheet not found' };
    var fsdata = fsh.getDataRange().getValues();
    var arrearsFeeStructureId = null;
    for (var g = 1; g < fsdata.length; g++) {
      if (String(fsdata[g][9]) === '1') continue; // deleted
      if (parseInt(fsdata[g][1], 10) !== toClassId) continue;
      if (String(fsdata[g][2]).toLowerCase() !== 'arrears') continue;
      if (String(fsdata[g][5] || '').trim() !== newAcademicYear) continue;
      arrearsFeeStructureId = fsdata[g][0];
      break;
    }
    if (arrearsFeeStructureId === null) {
      arrearsFeeStructureId = nextFeeStructureId(fsh);
      var fts = nowIso();
      fsh.appendRow([
        arrearsFeeStructureId, toClassId, 'arrears', 0, 'one_time', newAcademicYear,
        10, 0, '1', '0', fts, fts, '0', 1, 0, 'Balances carried forward from a previous class/term'
      ]);
    }

    var promoted = 0, withArrears = 0, totalArrears = 0;
    var fpNextId = nextPaymentId(fpsh);
    var newPaymentRows = [];
    var ts = nowIso();
    var fromLabel = cmap[fromClassId].label, toLabel = cmap[toClassId].label;

    targetRows.forEach(function (t) {
      // 1) move the student's ClassID
      ssh.getRange(t.row, 26).setValue(toClassId);
      ssh.getRange(t.row, 39).setValue(ts);
      promoted++;

      // 2) close out old outstanding balance(s) and roll the total into one new arrears payment row
      var dues = duesByStudent[t.sid] || [];
      var balance = 0;
      dues.forEach(function (d) {
        balance += d.amountDue;
        var r = d.rowIdx + 1;
        fpsh.getRange(r, 5).setValue(0); // AmountDue -> 0, balance now lives on the new arrears row
        fpsh.getRange(r, 13).setValue('transferred'); // PaymentStatus
        var oldRemarks = String(fpdata[d.rowIdx][14] || '');
        fpsh.getRange(r, 15).setValue((oldRemarks ? oldRemarks + ' — ' : '') + 'Balance carried forward to ' + toLabel);
      });
      if (balance > 0) {
        newPaymentRows.push([
          fpNextId++, t.sid, arrearsFeeStructureId, 0, balance, 0, 0,
          todayStr(), 'Arrears Carried Forward', 'cash', '', '', 'pending', '',
          'Carried forward from ' + fromLabel, '0', ts, ts, newAcademicYear, 0, '', '', ''
        ]);
        withArrears++;
        totalArrears += balance;
      }
    });

    if (newPaymentRows.length) {
      fpsh.getRange(fpsh.getLastRow() + 1, 1, newPaymentRows.length, FEE_PAYMENT_HEADERS.length).setValues(newPaymentRows);
    }

    recomputeClassStrength(fromClassId);
    recomputeClassStrength(toClassId);

    addLog(currentUser, 'Students Promoted', promoted + ' student(s) moved from ' + fromLabel + ' to ' + toLabel +
      (withArrears ? ', ' + withArrears + ' with arrears totalling ' + totalArrears.toFixed(2) : ''));

    return {
      success: true,
      promoted: promoted,
      withArrears: withArrears,
      totalArrears: totalArrears,
      message: promoted + ' student(s) promoted from ' + fromLabel + ' to ' + toLabel +
        (withArrears ? ' — ' + withArrears + ' student(s) carried forward GH₵' + totalArrears.toFixed(2) + ' in arrears' : '')
    };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

function deleteStudent(id, currentUser, currentRole) {
  try {
    if (!isAdmin(currentRole)) return { success: false, message: 'Forbidden — admin only' };

    var sh = getSheet(STUDENTS_SHEET);
    if (!sh) return { success: false, message: 'Students sheet not found' };

    var idn = parseInt(id, 10);
    if (isNaN(idn)) return { success: false, message: 'Invalid id' };

    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] !== idn || String(data[i][36]) === '1') continue;
      var row = i + 1, ts = nowIso();
      var classId = parseInt(data[i][25], 10);
      sh.getRange(row, 37).setValue('1');
      sh.getRange(row, 39).setValue(ts);
      recomputeClassStrength(classId);
      _unmirrorByEmployeeCode('STU-' + idn);  // soft-delete the Users mirror too
      addLog(currentUser, 'Student Deleted', 'Soft-deleted student id ' + idn);
      return { success: true, message: 'Student deleted successfully' };
    }
    return { success: false, message: 'Student not found' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// ============== Admissions ==============
// admission pipeline: register → confirm → enroll (+ rejected/cancelled side states). admin + clerk only.

var ADMISSION_PAY_MODES = ['cash','cheque','online','mobile_money','card','bank_transfer'];
var ADMISSION_TYPES = ['new','transfer','re_admission'];
var ADMISSION_ENTRY_POINTS = ['session_start','mid_session'];

function isAdminOrClerk(role) {
  var r = String(role || '').toLowerCase();
  return r === 'admin' || r === 'clerk';
}

// reports hub — full set is admin/clerk/supervisor only
function canViewReports(role) {
  return ['admin', 'clerk', 'supervisor', 'owner'].indexOf(String(role || '').toLowerCase()) !== -1;
}
function isOwnerOrAdmin(role) {
  return ['admin', 'owner'].indexOf(String(role || '').toLowerCase()) !== -1;
}
// own-class academic reports (Attendance Summary, Exam Result) — also open to teachers, scoped to their classes
function canViewClassReports(role) {
  return ['admin', 'clerk', 'supervisor', 'teacher'].indexOf(String(role || '').toLowerCase()) !== -1;
}

// next REG-<year>-NNNN (per-year sequence, 4-digit pad) — col 1 = RegistrationNumber
function generateRegistrationNumber(sh) {
  var year = new Date().getFullYear();
  var prefix = 'REG-' + year + '-';
  var data = sh.getDataRange().getValues(), maxSeq = 0;
  for (var i = 1; i < data.length; i++) {
    var rn = String(data[i][1] || '');
    if (rn.indexOf(prefix) === 0) {
      var seq = parseInt(rn.substring(prefix.length), 10);
      if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
    }
  }
  return prefix + String(maxSeq + 1).padStart(4, '0');
}

function nextAdmissionId(sh) {
  var data = sh.getDataRange().getValues(), max = 0;
  for (var i = 1; i < data.length; i++) {
    var n = parseInt(data[i][0], 10);
    if (!isNaN(n) && n > max) max = n;
  }
  return max + 1;
}

// row -> public admission object (all header fields + computed labels/names)
function rowToAdmission(row, cmap, umap) {
  cmap = cmap || {};
  umap = umap || {};
  var aClassId = (row[7] === '' || row[7] == null) ? '' : (parseInt(row[7], 10) || '');
  var allClassId = (row[40] === '' || row[40] == null) ? '' : (parseInt(row[40], 10) || '');
  var linkedId = (row[47] === '' || row[47] == null) ? null : (parseInt(row[47], 10) || null);
  var feePayId = (row[48] === '' || row[48] == null) ? '' : (parseInt(row[48], 10) || row[48]);
  var procBy = (row[51] === '' || row[51] == null) ? '' : (parseInt(row[51], 10) || '');
  return {
    ID: row[0],
    RegistrationNumber: row[1] || '',
    FirstName: row[2] || '',
    MiddleName: row[3] || '',
    LastName: row[4] || '',
    ApplicantName: [row[2], row[3], row[4]].filter(function(x){ return x; }).join(' '),
    Gender: String(row[5] || '').toLowerCase(),
    DateOfBirth: toIso(row[6]),
    AppliedForClassID: aClassId,
    AppliedForClassLabel: (aClassId && cmap[aClassId]) ? cmap[aClassId].label : '',
    AppliedForGrade: (row[8] === '' || row[8] == null) ? '' : (parseInt(row[8], 10) || ''),
    AdmissionType: String(row[9] || 'new').toLowerCase(),
    PreviousSchool: row[10] || '',
    TransferCertificateNumber: row[11] || '',
    LastClassAttended: row[12] || '',
    AddressLine: row[13] || '',
    City: row[14] || '',
    Region: row[15] || '',
    GhanaPostGPS: row[16] || '',
    FatherName: row[17] || '',
    FatherMobile: row[18] || '',
    MotherName: row[19] || '',
    MotherMobile: row[20] || '',
    GuardianName: row[21] || '',
    GuardianRelation: row[22] || '',
    GuardianMobile: row[23] || '',
    Email: row[24] || '',
    Mobile: row[25] || '',
    AcademicYear: row[26] || '',
    RegistrationDate: toIso(row[27]),
    RegistrationFee: parseFloat(row[28]) || 0,
    RegistrationFeeMode: String(row[29] || '').toLowerCase(),
    RegistrationFeeReceiptNo: row[30] || '',
    Status: String(row[31] || '').toLowerCase(),
    BloodGroup: row[32] || '',
    Religion: row[33] || '',
    Category: String(row[34] || '').toLowerCase(),
    MedicalNotes: row[35] || '',
    AdmissionFee: parseFloat(row[36]) || 0,
    AdmissionFeeMode: String(row[37] || '').toLowerCase(),
    AdmissionFeeReceiptNo: row[38] || '',
    AdmissionConfirmedDate: toIso(row[39]),
    AllottedClassID: allClassId,
    AllottedClassLabel: (allClassId && cmap[allClassId]) ? cmap[allClassId].label : '',
    RollNumber: row[41] || '',
    AdmissionNumber: row[42] || '',
    AdmissionDate: toIso(row[43]),
    EntryPoint: String(row[44] || '').toLowerCase(),
    TransportRequired: String(row[45]) === '1' || row[45] === 1 || row[45] === true,
    TransportRoute: row[46] || '',
    LinkedStudentID: linkedId,
    FeePaymentID: feePayId,
    RejectionReason: row[49] || '',
    Remarks: row[50] || '',
    ProcessedBy: procBy,
    ProcessedByName: (procBy && umap[procBy]) ? umap[procBy].fullName : '',
    IsDeleted: String(row[52]) === '1',
    CreatedAt: toIso(row[53]),
    UpdatedAt: toIso(row[54]),
    PhotoURL: row[55] || ''
  };
}

function getAllAdmissions(currentUser, currentRole) {
  try {
    if (!isAdminOrClerk(currentRole)) return { success: false, message: 'Forbidden — admin/clerk only' };
    var sh = getSheet(ADMISSIONS_SHEET);
    if (!sh) return { success: false, message: 'Admissions sheet not found' };
    var data = sh.getDataRange().getValues();
    var cmap = getClassesMap(), umap = getUsersMap();
    var out = [];
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][52]) === '1') continue; // skip deleted
      out.push(rowToAdmission(data[i], cmap, umap));
    }
    // newest first by RegistrationDate
    out.sort(function(a, b) {
      var ra = String(a.RegistrationDate || ''), rb = String(b.RegistrationDate || '');
      if (rb < ra) return -1;
      if (rb > ra) return 1;
      return (b.ID || 0) - (a.ID || 0);
    });
    return { success: true, data: out };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// validate + apply the registration-stage fields onto a row-values array (used by add + update)
// returns { ok, error, vals: {col index -> value} } — vals only contains the reg-stage cols
function _validateRegistrationFields(d, opts) {
  if (!String(d.FirstName || '').trim() || !String(d.LastName || '').trim()) {
    return { ok: false, error: 'First Name and Last Name are required' };
  }
  var admType = String(d.AdmissionType || 'new').toLowerCase();
  if (ADMISSION_TYPES.indexOf(admType) === -1) return { ok: false, error: 'Invalid admission type' };
  if (admType === 'transfer' && (d.PreviousSchool == null || String(d.PreviousSchool).trim() === '')) {
    return { ok: false, error: 'PreviousSchool is required for transfer admissions' };
  }
  var aClassId = '';
  if (d.AppliedForClassID != null && String(d.AppliedForClassID).trim() !== '') {
    aClassId = parseInt(d.AppliedForClassID, 10);
    if (isNaN(aClassId)) return { ok: false, error: 'Invalid AppliedForClassID' };
    var cmap = getClassesMap();
    if (!cmap[aClassId]) return { ok: false, error: 'Applied-for class does not exist or is deleted' };
  }
  var aGrade = '';
  if (d.AppliedForGrade != null && String(d.AppliedForGrade).trim() !== '') {
    aGrade = parseInt(d.AppliedForGrade, 10);
    if (isNaN(aGrade)) return { ok: false, error: 'Invalid AppliedForGrade' };
  }
  var regFee = parseFloat(d.RegistrationFee);
  if (isNaN(regFee) || regFee < 0) regFee = 0;
  var regFeeMode = '';
  if (regFee > 0) {
    regFeeMode = String(d.RegistrationFeeMode || '').toLowerCase();
    if (ADMISSION_PAY_MODES.indexOf(regFeeMode) === -1) return { ok: false, error: 'Invalid registration fee mode' };
  }
  return {
    ok: true,
    admType: admType,
    regFee: regFee,
    regFeeMode: regFeeMode,
    fields: {
      2: String(d.FirstName).trim(),
      3: d.MiddleName ? String(d.MiddleName).trim() : '',
      4: String(d.LastName).trim(),
      5: d.Gender ? String(d.Gender).toLowerCase() : '',
      6: d.DateOfBirth ? toIso(d.DateOfBirth) : '',
      7: aClassId,
      8: aGrade,
      9: admType,
      10: d.PreviousSchool ? String(d.PreviousSchool).trim() : '',
      11: d.TransferCertificateNumber ? String(d.TransferCertificateNumber).trim() : '',
      12: d.LastClassAttended ? String(d.LastClassAttended).trim() : '',
      13: d.AddressLine ? String(d.AddressLine).trim() : '',
      14: d.City ? String(d.City).trim() : '',
      15: d.Region ? String(d.Region).trim() : '',
      16: d.GhanaPostGPS ? String(d.GhanaPostGPS).trim() : '',
      17: d.FatherName ? String(d.FatherName).trim() : '',
      18: d.FatherMobile ? String(d.FatherMobile).trim() : '',
      19: d.MotherName ? String(d.MotherName).trim() : '',
      20: d.MotherMobile ? String(d.MotherMobile).trim() : '',
      21: d.GuardianName ? String(d.GuardianName).trim() : '',
      22: d.GuardianRelation ? String(d.GuardianRelation).trim() : '',
      23: d.GuardianMobile ? String(d.GuardianMobile).trim() : '',
      24: d.Email ? String(d.Email).trim() : '',
      25: d.Mobile ? String(d.Mobile).trim() : '',
      26: d.AcademicYear ? String(d.AcademicYear).trim() : '',
      28: regFee,
      29: regFeeMode,
      50: d.Remarks != null ? String(d.Remarks).trim() : ''
    }
  };
}

function addRegistration(d, currentUser, currentRole) {
  try {
    if (!isAdminOrClerk(currentRole)) return { success: false, message: 'Forbidden — admin/clerk only' };
    var sh = getSheet(ADMISSIONS_SHEET);
    if (!sh) return { success: false, message: 'Admissions sheet not found' };
    d = d || {};

    var v = _validateRegistrationFields(d, {});
    if (!v.ok) return { success: false, message: v.error };

    var ts = nowIso(), id = nextAdmissionId(sh), regNo = generateRegistrationNumber(sh);
    var year = new Date().getFullYear();
    var regFeeRcpt = v.regFee > 0 ? ('REGF-' + year + '-' + String(id).padStart(4, '0')) : '';
    var procBy = getCurrentUserId(currentUser) || '';

    // build full 55-col row
    var fld = v.fields;
    var rowArr = [
      id, regNo, fld[2], fld[3], fld[4], fld[5], fld[6], fld[7], fld[8], fld[9], fld[10], fld[11], fld[12],
      fld[13], fld[14], fld[15], fld[16], fld[17], fld[18], fld[19], fld[20], fld[21], fld[22], fld[23],
      fld[24], fld[25], fld[26], toIso(todayStr()), fld[28], fld[29], regFeeRcpt, 'registered',
      '', '', '', '', 0, '', '', '', '', '', '', '', '', '0', '', '', '', '', fld[50], procBy, '0', ts, ts,
      String(d.PhotoURL || '').trim()
    ];
    sh.appendRow(rowArr);
    addLog(currentUser, 'Registration Created', regNo + ' — ' + fld[2] + ' ' + fld[4]);
    return { success: true, message: 'Registration created — ' + regNo, id: id, registrationNumber: regNo };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

function updateRegistration(id, d, currentUser, currentRole) {
  try {
    if (!isAdminOrClerk(currentRole)) return { success: false, message: 'Forbidden — admin/clerk only' };
    var sh = getSheet(ADMISSIONS_SHEET);
    if (!sh) return { success: false, message: 'Admissions sheet not found' };
    var idn = parseInt(id, 10);
    if (isNaN(idn)) return { success: false, message: 'Invalid id' };
    d = d || {};

    var v = _validateRegistrationFields(d, {});
    if (!v.ok) return { success: false, message: v.error };

    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] !== idn || String(data[i][52]) === '1') continue;
      var status = String(data[i][31] || '').toLowerCase();
      if (status !== 'registered' && status !== 'admitted') {
        return { success: false, message: 'Cannot edit — admission already ' + status };
      }
      var row = i + 1, ts = nowIso();
      var fld = v.fields;
      // recompute registration-fee receipt only if it was/now is chargeable
      var existingRegRcpt = String(data[i][30] || '');
      var regFeeRcpt = existingRegRcpt;
      if (v.regFee > 0 && !existingRegRcpt) regFeeRcpt = 'REGF-' + new Date().getFullYear() + '-' + String(idn).padStart(4, '0');
      if (v.regFee <= 0) regFeeRcpt = '';
      Object.keys(fld).forEach(function(colIdx) {
        sh.getRange(row, parseInt(colIdx, 10) + 1).setValue(fld[colIdx]);
      });
      sh.getRange(row, 31).setValue(regFeeRcpt); // col 30 = RegistrationFeeReceiptNo
      sh.getRange(row, 55).setValue(ts);          // col 54 = UpdatedAt
      if (d.PhotoURL != null) sh.getRange(row, 56).setValue(String(d.PhotoURL || '').trim()); // col 55 = PhotoURL
      addLog(currentUser, 'Registration Updated', 'id ' + idn + ' — ' + (data[i][1] || ''));
      return { success: true, message: 'Registration updated' };
    }
    return { success: false, message: 'Admission record not found' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

function confirmAdmission(id, d, currentUser, currentRole) {
  try {
    if (!isAdminOrClerk(currentRole)) return { success: false, message: 'Forbidden — admin/clerk only' };
    var sh = getSheet(ADMISSIONS_SHEET);
    if (!sh) return { success: false, message: 'Admissions sheet not found' };
    var idn = parseInt(id, 10);
    if (isNaN(idn)) return { success: false, message: 'Invalid id' };
    d = d || {};

    if (d.Category == null || String(d.Category).trim() === '') return { success: false, message: 'Category is required' };
    var admFee = parseFloat(d.AdmissionFee);
    if (isNaN(admFee) || admFee < 0) return { success: false, message: 'AdmissionFee must be a non-negative number' };
    var admFeeMode = '';
    if (admFee > 0) {
      admFeeMode = String(d.AdmissionFeeMode || '').toLowerCase();
      if (ADMISSION_PAY_MODES.indexOf(admFeeMode) === -1) return { success: false, message: 'Invalid admission fee mode' };
    }

    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] !== idn || String(data[i][52]) === '1') continue;
      var status = String(data[i][31] || '').toLowerCase();
      if (status !== 'registered') return { success: false, message: 'Cannot confirm — admission is ' + status + ' (must be registered)' };
      var row = i + 1, ts = nowIso();
      var recNo = 'ADMF-' + new Date().getFullYear() + '-' + String(idn).padStart(4, '0');
      sh.getRange(row, 33).setValue(d.BloodGroup ? String(d.BloodGroup).trim() : '');     // 32 BloodGroup
      sh.getRange(row, 34).setValue(d.Religion ? String(d.Religion).trim() : '');           // 33 Religion
      sh.getRange(row, 35).setValue(String(d.Category).trim().toLowerCase());               // 34 Category
      sh.getRange(row, 36).setValue(d.MedicalNotes ? String(d.MedicalNotes).trim() : '');   // 35 MedicalNotes
      sh.getRange(row, 37).setValue(admFee);                                                // 36 AdmissionFee
      sh.getRange(row, 38).setValue(admFeeMode);                                            // 37 AdmissionFeeMode
      sh.getRange(row, 39).setValue(recNo);                                                 // 38 AdmissionFeeReceiptNo
      sh.getRange(row, 40).setValue(toIso(todayStr()));                                     // 39 AdmissionConfirmedDate
      sh.getRange(row, 32).setValue('admitted');                                            // 31 Status
      // optional address updates
      if (d.AddressLine != null && String(d.AddressLine).trim() !== '') sh.getRange(row, 14).setValue(String(d.AddressLine).trim());
      if (d.City != null && String(d.City).trim() !== '') sh.getRange(row, 15).setValue(String(d.City).trim());
      if (d.Region != null && String(d.Region).trim() !== '') sh.getRange(row, 16).setValue(String(d.Region).trim());
      if (d.GhanaPostGPS != null && String(d.GhanaPostGPS).trim() !== '') sh.getRange(row, 17).setValue(String(d.GhanaPostGPS).trim());
      if (d.Remarks != null) sh.getRange(row, 51).setValue(String(d.Remarks).trim());       // 50 Remarks
      sh.getRange(row, 55).setValue(ts);                                                    // 54 UpdatedAt
      addLog(currentUser, 'Admission Confirmed', (data[i][1] || ('id ' + idn)) + ' — receipt ' + recNo + ' (GH₵' + admFee + ')');
      return { success: true, message: 'Admission confirmed — receipt ' + recNo, receiptNumber: recNo };
    }
    return { success: false, message: 'Admission record not found' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

function enrollAdmission(id, d, currentUser, currentRole) {
  try {
    if (!isAdminOrClerk(currentRole)) return { success: false, message: 'Forbidden — admin/clerk only' };
    var sh = getSheet(ADMISSIONS_SHEET);
    if (!sh) return { success: false, message: 'Admissions sheet not found' };
    var idn = parseInt(id, 10);
    if (isNaN(idn)) return { success: false, message: 'Invalid id' };
    d = d || {};

    var allottedClassId = parseInt(d.AllottedClassID, 10);
    if (isNaN(allottedClassId)) return { success: false, message: 'Pick a class to enroll this applicant into' };
    var cmap = getClassesMap();
    if (!cmap[allottedClassId]) return { success: false, message: 'Allotted class does not exist or is deleted' };
    var admissionDate = String(d.AdmissionDate || '').trim() || todayStr();
    var entryPoint = String(d.EntryPoint || '').toLowerCase();
    if (ADMISSION_ENTRY_POINTS.indexOf(entryPoint) === -1) return { success: false, message: 'Invalid EntryPoint' };
    var transportReq = (d.TransportRequired === true || String(d.TransportRequired) === '1' || String(d.TransportRequired).toLowerCase() === 'true');

    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] !== idn || String(data[i][52]) === '1') continue;
      var status = String(data[i][31] || '').toLowerCase();
      if (status !== 'admitted') return { success: false, message: 'Cannot enroll — admission is ' + status + ' (must be admitted)' };
      var row = i + 1, ar = data[i];
      var ad = rowToAdmission(ar, cmap, getUsersMap());

      var rollNumber = String(d.RollNumber || '').trim();
      var admissionNumber = String(d.AdmissionNumber || '').trim();
      var payload = {
        AdmissionNumber: admissionNumber,
        FirstName: ad.FirstName, MiddleName: ad.MiddleName, LastName: ad.LastName,
        Gender: ad.Gender, DateOfBirth: ad.DateOfBirth ? String(ad.DateOfBirth).split('T')[0] : '',
        AddressLine: ad.AddressLine, City: ad.City, Region: ad.Region, GhanaPostGPS: ad.GhanaPostGPS,
        FatherName: ad.FatherName, FatherMobile: ad.FatherMobile,
        MotherName: ad.MotherName, MotherMobile: ad.MotherMobile,
        GuardianName: ad.GuardianName, GuardianRelation: ad.GuardianRelation, GuardianMobile: ad.GuardianMobile,
        Email: ad.Email, Mobile: ad.Mobile, PhotoURL: ad.PhotoURL || '',
        AdmissionDate: admissionDate, ClassID: allottedClassId, RollNumber: rollNumber,
        Category: ad.Category, Religion: ad.Religion, BloodGroup: ad.BloodGroup, MedicalNotes: ad.MedicalNotes, PreviousSchool: ad.PreviousSchool,
        AdmissionType: ({ 'new': 'fresh', 'transfer': 'transfer', 're_admission': 're_admission' })[String(ad.AdmissionType || 'new')] || 'fresh',
        TransportRequired: transportReq, TransportRoute: d.TransportRoute || '',
        LoginPassword: d.LoginPassword || '', Status: 'active'
      };

      var sres = addStudent(payload, currentUser, 'admin');
      if (!sres || !sres.success) return { success: false, message: 'Enrollment failed: ' + (sres ? sres.message : 'unknown error') };
      var newStudentId = sres.id;
      admissionNumber = sres.admissionNumber || admissionNumber;

      // write back enroll-stage fields onto the admission row
      sh.getRange(row, 41).setValue(allottedClassId);                 // 40 AllottedClassID
      sh.getRange(row, 42).setValue(rollNumber);                      // 41 RollNumber
      sh.getRange(row, 43).setValue(admissionNumber);                 // 42 AdmissionNumber
      sh.getRange(row, 44).setValue(toIso(admissionDate));   // 43 AdmissionDate
      sh.getRange(row, 45).setValue(entryPoint);                      // 44 EntryPoint
      sh.getRange(row, 46).setValue(transportReq ? '1' : '0');        // 45 TransportRequired
      sh.getRange(row, 47).setValue(d.TransportRoute || '');          // 46 TransportRoute
      sh.getRange(row, 48).setValue(newStudentId);                    // 47 LinkedStudentID
      sh.getRange(row, 32).setValue('enrolled');                      // 31 Status
      sh.getRange(row, 55).setValue(nowIso());                        // 54 UpdatedAt

      // best-effort: push admission fee into Fee_Payments — never fail the enrollment over this
      var feePaymentId = '';
      try {
        var admFee = parseFloat(ad.AdmissionFee) || 0;
        if (admFee > 0) {
          var year = ad.AcademicYear;
          var fsId = '';
          var fsSh = getSheet(FEE_STRUCTURE_SHEET);
          if (fsSh) {
            var fsData = fsSh.getDataRange().getValues();
            for (var f = 1; f < fsData.length; f++) {
              if (String(fsData[f][9]) === '1') continue; // skip deleted
              if (parseInt(fsData[f][1], 10) === allottedClassId &&
                  String(fsData[f][2]).toLowerCase() === 'admission' &&
                  String(fsData[f][4]).toLowerCase() === 'one_time' &&
                  String(fsData[f][5]).trim() === String(year).trim()) {
                fsId = fsData[f][0];
                break;
              }
            }
          }
          if (!fsId) {
            var fres = addFeeStructure({ ClassID: allottedClassId, FeeCategory: 'admission', Amount: admFee, Frequency: 'one_time', AcademicYear: year, DueDay: 1, LateFeePerDay: 0, Description: 'Admission Fee' }, currentUser, 'admin');
            if (fres && fres.success) fsId = fres.id;
          }
          if (fsId) {
            var pres = addPayment({ StudentID: newStudentId, FeeStructureID: fsId, AmountPaid: admFee, PaymentDate: todayStr(), BillingPeriod: 'Admission Fee ' + year, PaymentMode: (ad.AdmissionFeeMode || 'cash'), Remarks: 'Auto from admission ' + ad.RegistrationNumber }, currentUser, currentRole);
            if (pres && pres.success) {
              feePaymentId = pres.id;
              sh.getRange(row, 49).setValue(feePaymentId); // 48 FeePaymentID
            }
          }
        }
      } catch (feeErr) {
        Logger.log('enrollAdmission fee push failed: ' + feeErr.toString());
      }

      addLog(currentUser, 'Admission Enrolled', ad.RegistrationNumber + ' → student #' + newStudentId + ' (' + String(d.AdmissionNumber).trim() + ') class ' + allottedClassId);
      return {
        success: true,
        message: 'Student enrolled — admission no ' + String(d.AdmissionNumber).trim() + (feePaymentId ? ' · admission fee receipted in Fees Collection' : ''),
        studentId: newStudentId,
        admissionNumber: String(d.AdmissionNumber).trim()
      };
    }
    return { success: false, message: 'Admission record not found' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

function rejectAdmission(id, reason, currentUser, currentRole) {
  return _closeAdmission(id, reason, 'rejected', 'Application rejected', 'Admission Rejected', currentUser, currentRole);
}

// shared: reject / cancel — both require status registered|admitted and store reason in RejectionReason
function _closeAdmission(id, reason, newStatus, okMsg, logAction, currentUser, currentRole) {
  try {
    if (!isAdminOrClerk(currentRole)) return { success: false, message: 'Forbidden — admin/clerk only' };
    var sh = getSheet(ADMISSIONS_SHEET);
    if (!sh) return { success: false, message: 'Admissions sheet not found' };
    var idn = parseInt(id, 10);
    if (isNaN(idn)) return { success: false, message: 'Invalid id' };
    var r = String(reason || '').trim();
    if (r.length < 3) return { success: false, message: 'Reason is required (min 3 chars)' };

    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] !== idn || String(data[i][52]) === '1') continue;
      var status = String(data[i][31] || '').toLowerCase();
      if (status !== 'registered' && status !== 'admitted') return { success: false, message: 'Cannot proceed — admission is ' + status };
      var row = i + 1, ts = nowIso();
      sh.getRange(row, 32).setValue(newStatus);   // 31 Status
      sh.getRange(row, 50).setValue(r);           // 49 RejectionReason
      sh.getRange(row, 55).setValue(ts);          // 54 UpdatedAt
      addLog(currentUser, logAction, (data[i][1] || ('id ' + idn)) + ' — ' + r);
      return { success: true, message: okMsg };
    }
    return { success: false, message: 'Admission record not found' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

function deleteAdmission(id, currentUser, currentRole) {
  try {
    if (!isAdminOrClerk(currentRole)) return { success: false, message: 'Forbidden — admin/clerk only' };
    var sh = getSheet(ADMISSIONS_SHEET);
    if (!sh) return { success: false, message: 'Admissions sheet not found' };
    var idn = parseInt(id, 10);
    if (isNaN(idn)) return { success: false, message: 'Invalid id' };
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] !== idn || String(data[i][52]) === '1') continue;
      var row = i + 1, ts = nowIso();
      sh.getRange(row, 53).setValue('1');  // 52 IsDeleted
      sh.getRange(row, 55).setValue(ts);   // 54 UpdatedAt
      addLog(currentUser, 'Admission Deleted', 'Soft-deleted admission id ' + idn + ' (' + (data[i][1] || '') + ')');
      return { success: true, message: 'Admission record deleted' };
    }
    return { success: false, message: 'Admission record not found' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// ============== Daily Accounts ==============
// day-book for non-fee income & expenses. admin + clerk only. fee income lives in Fee_Payments.

var ACCOUNT_TXN_TYPES = ['income','expense'];
var ACCOUNT_PAY_MODES = ['cash','cheque','online','mobile_money','card','bank_transfer'];
var ACCOUNT_INCOME_CATEGORIES = ['donation','rent_received','fine','sale','grant','interest','misc_income','other'];
var ACCOUNT_EXPENSE_CATEGORIES = ['salary','utilities','supplies','maintenance','transport','rent_paid','marketing','events','taxes','printing','refreshments','misc_expense','other'];

function nextAccountTxnId(sh) {
  var data = sh.getDataRange().getValues(), max = 0;
  for (var i = 1; i < data.length; i++) {
    var n = parseInt(data[i][0], 10);
    if (!isNaN(n) && n > max) max = n;
  }
  return max + 1;
}

// row -> public transaction object (all header fields + RecordedByName)
function rowToTransaction(row, umap) {
  umap = umap || {};
  var recBy = (row[9] === '' || row[9] == null) ? '' : (parseInt(row[9], 10) || '');
  return {
    ID: row[0],
    TxnDate: toIso(row[1]),
    TxnType: String(row[2] || '').toLowerCase(),
    Category: String(row[3] || '').toLowerCase(),
    Description: row[4] || '',
    Amount: parseFloat(row[5]) || 0,
    PaymentMode: String(row[6] || '').toLowerCase(),
    ReferenceNo: row[7] || '',
    PartyName: row[8] || '',
    RecordedBy: recBy,
    RecordedByName: (recBy && umap[recBy]) ? umap[recBy].fullName : '',
    IsDeleted: String(row[10]) === '1',
    CreatedAt: toIso(row[11]),
    UpdatedAt: toIso(row[12])
  };
}

function getAllTransactions(currentUser, currentRole) {
  try {
    if (!isAdminOrClerk(currentRole)) return { success: false, message: 'Forbidden — admin/clerk only' };
    var sh = getSheet(ACCOUNT_TXN_SHEET);
    if (!sh) return { success: false, message: 'Account_Transactions sheet not found' };
    var data = sh.getDataRange().getValues();
    var umap = getUsersMap();
    var out = [];
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][10]) === '1') continue; // skip deleted
      out.push(rowToTransaction(data[i], umap));
    }
    // newest first by TxnDate then ID
    out.sort(function(a, b) {
      var ta = String(a.TxnDate || ''), tb = String(b.TxnDate || '');
      if (tb < ta) return -1;
      if (tb > ta) return 1;
      return (b.ID || 0) - (a.ID || 0);
    });
    return { success: true, data: out };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// validate the txn payload -> { ok, error, type, category, desc, amount, mode, refNo, party, txnDate }
function _validateTransactionFields(d) {
  d = d || {};
  if (d.TxnDate == null || String(d.TxnDate).trim() === '') return { ok: false, error: 'TxnDate is required' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(d.TxnDate).trim())) return { ok: false, error: 'TxnDate must be YYYY-MM-DD' };
  var type = String(d.TxnType || '').toLowerCase();
  if (ACCOUNT_TXN_TYPES.indexOf(type) === -1) return { ok: false, error: 'Invalid transaction type' };
  var cat = String(d.Category || '').toLowerCase().trim();
  if (!cat) return { ok: false, error: 'Category is required' };
  var catList = type === 'income' ? ACCOUNT_INCOME_CATEGORIES : ACCOUNT_EXPENSE_CATEGORIES;
  if (catList.indexOf(cat) === -1) return { ok: false, error: 'Invalid category for ' + type };
  var desc = d.Description != null ? String(d.Description).trim() : '';
  if (desc.length < 2) return { ok: false, error: 'Description must be at least 2 characters' };
  var amount = parseFloat(d.Amount);
  if (isNaN(amount) || amount <= 0) return { ok: false, error: 'Amount must be a number greater than 0' };
  var mode = String(d.PaymentMode || '').toLowerCase();
  if (ACCOUNT_PAY_MODES.indexOf(mode) === -1) return { ok: false, error: 'Invalid payment mode' };
  return {
    ok: true,
    type: type,
    category: cat,
    desc: desc,
    amount: amount,
    mode: mode,
    refNo: d.ReferenceNo != null ? String(d.ReferenceNo).trim() : '',
    party: d.PartyName != null ? String(d.PartyName).trim() : '',
    txnDate: toIso(d.TxnDate)
  };
}

function addTransaction(d, currentUser, currentRole) {
  try {
    if (!isAdminOrClerk(currentRole)) return { success: false, message: 'Forbidden — admin/clerk only' };
    var sh = getSheet(ACCOUNT_TXN_SHEET);
    if (!sh) return { success: false, message: 'Account_Transactions sheet not found' };
    var v = _validateTransactionFields(d);
    if (!v.ok) return { success: false, message: v.error };
    var ts = nowIso(), id = nextAccountTxnId(sh);
    var recBy = getCurrentUserId(currentUser) || '';
    // cols: id, txnDate, type, cat, desc, amount, mode, refNo, party, recBy, isDel, createdAt, updatedAt
    sh.appendRow([id, v.txnDate, v.type, v.category, v.desc, v.amount, v.mode, v.refNo, v.party, recBy, '0', ts, ts]);
    addLog(currentUser, 'Account Txn Added', v.type + ' GH₵' + v.amount + ' (' + v.category + ') — ' + v.desc);
    return { success: true, message: (v.type === 'income' ? 'Income' : 'Expense') + ' recorded — GH₵' + v.amount, id: id };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

function updateTransaction(id, d, currentUser, currentRole) {
  try {
    if (!isAdminOrClerk(currentRole)) return { success: false, message: 'Forbidden — admin/clerk only' };
    var sh = getSheet(ACCOUNT_TXN_SHEET);
    if (!sh) return { success: false, message: 'Account_Transactions sheet not found' };
    var idn = parseInt(id, 10);
    if (isNaN(idn)) return { success: false, message: 'Invalid id' };
    var v = _validateTransactionFields(d);
    if (!v.ok) return { success: false, message: v.error };
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] !== idn || String(data[i][10]) === '1') continue;
      var row = i + 1, ts = nowIso();
      sh.getRange(row, 2).setValue(v.txnDate);   // 1 TxnDate
      sh.getRange(row, 3).setValue(v.type);      // 2 TxnType
      sh.getRange(row, 4).setValue(v.category);  // 3 Category
      sh.getRange(row, 5).setValue(v.desc);      // 4 Description
      sh.getRange(row, 6).setValue(v.amount);    // 5 Amount
      sh.getRange(row, 7).setValue(v.mode);      // 6 PaymentMode
      sh.getRange(row, 8).setValue(v.refNo);     // 7 ReferenceNo
      sh.getRange(row, 9).setValue(v.party);     // 8 PartyName
      sh.getRange(row, 13).setValue(ts);         // 12 UpdatedAt
      addLog(currentUser, 'Account Txn Updated', 'id ' + idn + ' — ' + v.type + ' GH₵' + v.amount + ' (' + v.category + ')');
      return { success: true, message: 'Transaction updated' };
    }
    return { success: false, message: 'Transaction not found' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

function deleteTransaction(id, currentUser, currentRole) {
  try {
    if (!isAdminOrClerk(currentRole)) return { success: false, message: 'Forbidden — admin/clerk only' };
    var sh = getSheet(ACCOUNT_TXN_SHEET);
    if (!sh) return { success: false, message: 'Account_Transactions sheet not found' };
    var idn = parseInt(id, 10);
    if (isNaN(idn)) return { success: false, message: 'Invalid id' };
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] !== idn || String(data[i][10]) === '1') continue;
      var row = i + 1, ts = nowIso();
      sh.getRange(row, 11).setValue('1'); // 10 IsDeleted
      sh.getRange(row, 13).setValue(ts);  // 12 UpdatedAt
      addLog(currentUser, 'Account Txn Deleted', 'Soft-deleted txn id ' + idn);
      return { success: true, message: 'Transaction deleted' };
    }
    return { success: false, message: 'Transaction not found' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// "Today's Accounts" KPI tile — income/expense/net for today + current month. admin/clerk only
function getAccountTodaySummary(currentUser, currentRole) {
  try {
    if (!isAdminOrClerk(currentRole)) return { success: false, message: 'Forbidden — admin/clerk only' };
    var tStr = todayStr(), mStr = tStr.slice(0, 7); // today, current YYYY-MM
    var t = { income: 0, expense: 0 }, m = { income: 0, expense: 0 };
    // fee payments → income (cols: 3=AmountPaid, 7=PaymentDate, 15=IsDeleted)
    var fsh = getSheet(FEE_PAYMENTS_SHEET);
    if (fsh) {
      var fd = fsh.getDataRange().getValues();
      for (var i = 1; i < fd.length; i++) {
        if (String(fd[i][15]) === '1') continue;
        var d = _dOnly(fd[i][7]); if (!d) continue;
        var amt = parseFloat(fd[i][3]) || 0;
        if (d.slice(0, 7) === mStr) { m.income += amt; if (d === tStr) t.income += amt; }
      }
    }
    // account txns → income/expense (cols: 1=TxnDate, 2=TxnType, 5=Amount, 10=IsDeleted)
    var ash = getSheet(ACCOUNT_TXN_SHEET);
    if (ash) {
      var ad = ash.getDataRange().getValues();
      for (var j = 1; j < ad.length; j++) {
        if (String(ad[j][10]) === '1') continue;
        var dt = _dOnly(ad[j][1]); if (!dt || dt.slice(0, 7) !== mStr) continue;
        var tp = ad[j][2], a = parseFloat(ad[j][5]) || 0, isT = (dt === tStr);
        if (tp === 'income') { m.income += a; if (isT) t.income += a; }
        else if (tp === 'expense') { m.expense += a; if (isT) t.expense += a; }
      }
    }
    var mLabel = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'MMMM yyyy');
    return {
      success: true,
      today: { date: tStr, income: t.income, expense: t.expense, net: t.income - t.expense },
      month: { label: mLabel, income: m.income, expense: m.expense, net: m.income - m.expense }
    };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// ============== Reports ==============
// read-only report-data endpoints for the Reports hub. access: admin/clerk/supervisor.
// each returns { success, rows, summary, columns:[{key,label,type?}], generatedAt }

// date-only string from a Date or string cell ('' if blank)
function _dOnly(v) {
  if (v === '' || v == null) return '';
  var d = (v instanceof Date) ? v : new Date(v);
  if (isNaN(d.getTime())) return String(v).slice(0, 10);
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

// resolve [from,to] with last-30-days default when BOTH blank
function _reportRange(from, to) {
  var f = (from == null) ? '' : String(from).trim();
  var t = (to == null) ? '' : String(to).trim();
  if (!f && !t) { f = _dOnly(new Date(Date.now() - 30 * 864e5)); t = todayStr(); }
  return { from: f, to: t };
}

// is date-only `d` within [from,to]? blank bounds = no filter on that side
function _inRange(d, from, to) {
  if (!d) return false;
  if (from && d < from) return false;
  if (to && d > to) return false;
  return true;
}

// 1. fee collection — p = { fromDate, toDate, classId, feeCategory }
function getFeeCollectionReport(p, currentUser, currentRole) {
  try {
    if (!canViewReports(currentRole)) return { success: false, message: 'Forbidden — admin/clerk/supervisor only' };
    p = p || {};
    var rg = _reportRange(p.fromDate, p.toDate);
    var clsId = (p.classId === '' || p.classId == null) ? null : parseInt(p.classId, 10);
    var cat = (p.feeCategory == null || String(p.feeCategory).trim() === '') ? null : String(p.feeCategory).toLowerCase().trim();
    var sh = getSheet(FEE_PAYMENTS_SHEET);
    if (!sh) return { success: false, message: 'Fee_Payments sheet not found' };
    var data = sh.getDataRange().getValues();
    var students = getStudentsLite(), fmap = getFeeStructuresLite(), umap = getUsersMap();
    var rows = [], tPaid = 0, tLate = 0, tDisc = 0, tDue = 0;
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][15]) === '1') continue;
      if (!_inRange(_dOnly(data[i][7]), rg.from, rg.to)) continue;
      var pay = rowToPayment(data[i], students, fmap, umap);
      var s = students[data[i][1]], f = fmap[data[i][2]];
      if (clsId !== null && (!s || s.classId !== clsId)) continue;
      if (cat !== null && (!f || f.category !== cat)) continue;
      rows.push({
        ReceiptNumber: pay.ReceiptNumber,
        PaymentDate: pay.PaymentDate,
        StudentName: pay.StudentName,
        AdmissionNumber: pay.AdmissionNumber,
        ClassLabel: pay.ClassLabel,
        FeeCategory: pay.FeeCategory,
        BillingPeriod: pay.BillingPeriod,
        AmountPaid: pay.AmountPaid,
        LateFee: pay.LateFee,
        Discount: pay.Discount,
        AmountDue: pay.AmountDue,
        PaymentMode: pay.PaymentMode,
        PaymentStatus: pay.PaymentStatus,
        CollectedByName: pay.CollectedByName
      });
      tPaid += pay.AmountPaid; tLate += pay.LateFee; tDisc += pay.Discount; tDue += pay.AmountDue;
    }
    rows.sort(function(a, b) { return String(b.PaymentDate || '').localeCompare(String(a.PaymentDate || '')); });
    return {
      success: true,
      rows: rows,
      summary: { 'Receipts': rows.length, 'Total Collected': tPaid, 'Late Fees': tLate, 'Discounts Given': tDisc, 'Still Due (in these)': tDue },
      columns: [
        { key: 'ReceiptNumber', label: 'Receipt #' },
        { key: 'PaymentDate', label: 'Date', type: 'date' },
        { key: 'StudentName', label: 'Student' },
        { key: 'AdmissionNumber', label: 'Adm #' },
        { key: 'ClassLabel', label: 'Class' },
        { key: 'FeeCategory', label: 'Category' },
        { key: 'BillingPeriod', label: 'Period' },
        { key: 'AmountPaid', label: 'Paid', type: 'money' },
        { key: 'LateFee', label: 'Late Fee', type: 'money' },
        { key: 'Discount', label: 'Discount', type: 'money' },
        { key: 'AmountDue', label: 'Due', type: 'money' },
        { key: 'PaymentMode', label: 'Mode' },
        { key: 'PaymentStatus', label: 'Status' },
        { key: 'CollectedByName', label: 'Collected By' }
      ],
      generatedAt: nowIso()
    };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// 2. outstanding dues — p = { classId, academicYear }
function getOutstandingDuesReport(p, currentUser, currentRole) {
  try {
    if (!canViewReports(currentRole)) return { success: false, message: 'Forbidden — admin/clerk/supervisor only' };
    p = p || {};
    var clsId = (p.classId === '' || p.classId == null) ? null : parseInt(p.classId, 10);
    var year = (p.academicYear == null || String(p.academicYear).trim() === '') ? null : String(p.academicYear).trim();
    var sh = getSheet(FEE_DUES_SHEET);
    if (!sh) return { success: false, message: 'Fee_Dues sheet not found' };
    var data = sh.getDataRange().getValues();
    var students = getStudentsLite(), fmap = getFeeStructuresLite();
    var rows = [], tBal = 0, sids = {};
    for (var i = 1; i < data.length; i++) {
      var st = String(data[i][6] || '').toLowerCase();
      if (st !== 'pending' && st !== 'partial') continue;
      var amt = parseFloat(data[i][5]) || 0, paid = parseFloat(data[i][8]) || 0, bal = amt - paid;
      if (bal <= 0) continue;
      var s = students[data[i][1]];
      if (!s) continue; // missing/deleted student
      if (clsId !== null && s.classId !== clsId) continue;
      var f = fmap[data[i][2]];
      if (year !== null && (!f || String(f.year) !== year)) continue;
      rows.push({
        StudentName: s.fullName,
        AdmissionNumber: s.admNo,
        ClassLabel: s.classLabel,
        FeeCategory: f ? f.category : '',
        BillingMonthLabel: data[i][4] || '',
        DueAmount: amt,
        PaidAmount: paid,
        BalanceAmount: bal,
        Status: st
      });
      tBal += bal; sids[data[i][1]] = true;
    }
    rows.sort(function(a, b) {
      var c = String(a.ClassLabel || '').localeCompare(String(b.ClassLabel || ''));
      return c !== 0 ? c : String(a.StudentName || '').localeCompare(String(b.StudentName || ''));
    });
    return {
      success: true,
      rows: rows,
      summary: { 'Students with dues': Object.keys(sids).length, 'Due line items': rows.length, 'Total Outstanding': tBal },
      columns: [
        { key: 'StudentName', label: 'Student' },
        { key: 'AdmissionNumber', label: 'Adm #' },
        { key: 'ClassLabel', label: 'Class' },
        { key: 'FeeCategory', label: 'Category' },
        { key: 'BillingMonthLabel', label: 'Billing Month' },
        { key: 'DueAmount', label: 'Due', type: 'money' },
        { key: 'PaidAmount', label: 'Paid', type: 'money' },
        { key: 'BalanceAmount', label: 'Balance', type: 'money' },
        { key: 'Status', label: 'Status' }
      ],
      generatedAt: nowIso()
    };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// 3. cash book — merged fee collection + account txns, running balance — p = { fromDate, toDate }
function getCashBookReport(p, currentUser, currentRole) {
  try {
    if (!canViewReports(currentRole)) return { success: false, message: 'Forbidden — admin/clerk/supervisor only' };
    p = p || {};
    var rg = _reportRange(p.fromDate, p.toDate);
    var students = getStudentsLite(), fmap = getFeeStructuresLite(), umap = getUsersMap();
    var list = [];
    // fee payments → income
    var fsh = getSheet(FEE_PAYMENTS_SHEET);
    if (fsh) {
      var fd = fsh.getDataRange().getValues();
      for (var i = 1; i < fd.length; i++) {
        if (String(fd[i][15]) === '1') continue;
        var amtP = parseFloat(fd[i][3]) || 0;
        if (amtP <= 0) continue;
        var dd = _dOnly(fd[i][7]);
        if (!_inRange(dd, rg.from, rg.to)) continue;
        var pay = rowToPayment(fd[i], students, fmap, umap);
        list.push({
          _d: dd, Date: pay.PaymentDate, Source: 'Fee Collection', Type: 'income',
          Category: pay.FeeCategory, Particulars: pay.StudentName + ' — ' + pay.BillingPeriod,
          Mode: pay.PaymentMode, In: amtP, Out: 0
        });
      }
    }
    // account transactions → income/expense
    var ash = getSheet(ACCOUNT_TXN_SHEET);
    if (ash) {
      var ad = ash.getDataRange().getValues();
      for (var j = 1; j < ad.length; j++) {
        if (String(ad[j][10]) === '1') continue;
        var dt = _dOnly(ad[j][1]);
        if (!_inRange(dt, rg.from, rg.to)) continue;
        var t = rowToTransaction(ad[j], umap);
        var part = t.Description + (t.PartyName ? ' (' + t.PartyName + ')' : '');
        if (t.TxnType === 'income') {
          list.push({ _d: dt, Date: t.TxnDate, Source: 'Account', Type: 'income', Category: t.Category, Particulars: part, Mode: t.PaymentMode, In: t.Amount, Out: 0 });
        } else {
          list.push({ _d: dt, Date: t.TxnDate, Source: 'Account', Type: 'expense', Category: t.Category, Particulars: part, Mode: t.PaymentMode, In: 0, Out: t.Amount });
        }
      }
    }
    // stable ascending sort by _d
    list.forEach(function(r, idx) { r._i = idx; });
    list.sort(function(a, b) {
      var c = String(a._d).localeCompare(String(b._d));
      return c !== 0 ? c : (a._i - b._i);
    });
    var bal = 0, tIn = 0, tOut = 0, rows = [];
    for (var k = 0; k < list.length; k++) {
      var r = list[k];
      bal += r.In - r.Out; tIn += r.In; tOut += r.Out;
      rows.push({ Date: r.Date, Source: r.Source, Type: r.Type, Category: r.Category, Particulars: r.Particulars, Mode: r.Mode, In: r.In, Out: r.Out, Balance: bal });
    }
    return {
      success: true,
      rows: rows,
      summary: { 'Total In': tIn, 'Total Out': tOut, 'Net': tIn - tOut, 'Entries': rows.length },
      columns: [
        { key: 'Date', label: 'Date', type: 'date' },
        { key: 'Source', label: 'Source' },
        { key: 'Type', label: 'Type' },
        { key: 'Category', label: 'Category' },
        { key: 'Particulars', label: 'Particulars' },
        { key: 'Mode', label: 'Mode' },
        { key: 'In', label: 'In', type: 'money' },
        { key: 'Out', label: 'Out', type: 'money' },
        { key: 'Balance', label: 'Balance', type: 'money' }
      ],
      generatedAt: nowIso()
    };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// 4. income vs expense by category — p = { fromDate, toDate }
function getIncomeExpenseReport(p, currentUser, currentRole) {
  try {
    if (!canViewReports(currentRole)) return { success: false, message: 'Forbidden — admin/clerk/supervisor only' };
    p = p || {};
    var rg = _reportRange(p.fromDate, p.toDate);
    var fmap = getFeeStructuresLite();
    var inc = {}, exp = {}; // category -> {count, amount}
    function bump(bag, key, amt) {
      key = key || 'other';
      if (!bag[key]) bag[key] = { count: 0, amount: 0 };
      bag[key].count++; bag[key].amount += amt;
    }
    // fee payments income
    var fsh = getSheet(FEE_PAYMENTS_SHEET);
    if (fsh) {
      var fd = fsh.getDataRange().getValues();
      for (var i = 1; i < fd.length; i++) {
        if (String(fd[i][15]) === '1') continue;
        var amtP = parseFloat(fd[i][3]) || 0;
        if (amtP <= 0) continue;
        if (!_inRange(_dOnly(fd[i][7]), rg.from, rg.to)) continue;
        var f = fmap[fd[i][2]];
        bump(inc, f ? f.category : 'other', amtP);
      }
    }
    // account transactions
    var ash = getSheet(ACCOUNT_TXN_SHEET);
    if (ash) {
      var ad = ash.getDataRange().getValues();
      for (var j = 1; j < ad.length; j++) {
        if (String(ad[j][10]) === '1') continue;
        if (!_inRange(_dOnly(ad[j][1]), rg.from, rg.to)) continue;
        var typ = String(ad[j][2] || '').toLowerCase(), cat = String(ad[j][3] || 'other').toLowerCase();
        var amt = parseFloat(ad[j][5]) || 0;
        if (typ === 'income') bump(inc, cat, amt);
        else bump(exp, cat, amt);
      }
    }
    function toRows(bag, type) {
      return Object.keys(bag).map(function(c) { return { Type: type, Category: c, Count: bag[c].count, Amount: bag[c].amount }; })
        .sort(function(a, b) { return b.Amount - a.Amount; });
    }
    var incRows = toRows(inc, 'income'), expRows = toRows(exp, 'expense');
    var totIn = incRows.reduce(function(s, r) { return s + r.Amount; }, 0);
    var totEx = expRows.reduce(function(s, r) { return s + r.Amount; }, 0);
    return {
      success: true,
      rows: incRows.concat(expRows),
      summary: { 'Total Income': totIn, 'Total Expense': totEx, 'Net Surplus/Deficit': totIn - totEx },
      columns: [
        { key: 'Type', label: 'Type' },
        { key: 'Category', label: 'Category' },
        { key: 'Count', label: 'Entries', type: 'int' },
        { key: 'Amount', label: 'Amount', type: 'money' }
      ],
      generatedAt: nowIso()
    };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// ============== Owner Portal — read-only monitoring: financials, class/student summaries, daily activity ==============

// financial summary — income/expense breakdown (reuses the existing report) plus total fees still outstanding
function getOwnerFinancialSummary(p, currentUser, currentRole) {
  try {
    if (!isOwnerOrAdmin(currentRole)) return { success: false, message: 'Forbidden — owner/admin only' };
    var base = getIncomeExpenseReport(p, currentUser, currentRole);
    if (!base.success) return base;

    var fsh = getSheet(FEE_PAYMENTS_SHEET);
    var totalOutstanding = 0;
    if (fsh) {
      var fd = fsh.getDataRange().getValues();
      for (var i = 1; i < fd.length; i++) {
        if (String(fd[i][15]) === '1') continue;
        totalOutstanding += parseFloat(fd[i][4]) || 0;
      }
    }
    base.summary['Total Outstanding Fees'] = totalOutstanding;
    return base;
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// one row per active class: strength, capacity, fee collection %, avg exam performance (if any results exist)
function getOwnerClassSummaries(currentUser, currentRole) {
  try {
    if (!isOwnerOrAdmin(currentRole)) return { success: false, message: 'Forbidden — owner/admin only' };

    var csh = getSheet(CLASSES_SHEET);
    if (!csh) return { success: false, message: 'Classes sheet not found' };
    var cdata = csh.getDataRange().getValues();

    var fmap = getFeeStructuresLite();
    var fsh = getSheet(FEE_PAYMENTS_SHEET);
    var fpdata = fsh ? fsh.getDataRange().getValues() : [];
    // classId -> { paid, due }
    var feesByClass = {};
    for (var f = 1; f < fpdata.length; f++) {
      if (String(fpdata[f][15]) === '1') continue;
      var fs = fmap[fpdata[f][2]];
      if (!fs) continue;
      var cid = fs.classId;
      if (!feesByClass[cid]) feesByClass[cid] = { paid: 0, due: 0 };
      feesByClass[cid].paid += parseFloat(fpdata[f][3]) || 0;
      feesByClass[cid].due += parseFloat(fpdata[f][4]) || 0;
    }

    var out = [];
    for (var i = 1; i < cdata.length; i++) {
      if (String(cdata[i][6]) === '1') continue;
      var id = cdata[i][0];
      var strength = parseInt(cdata[i][5], 10) || 0;
      var capacity = parseInt(cdata[i][14], 10) || 0;
      var fees = feesByClass[id] || { paid: 0, due: 0 };
      out.push({
        ID: id,
        ClassName: cdata[i][1],
        Section: cdata[i][2],
        AcademicYear: cdata[i][3],
        TotalStrength: strength,
        MaxCapacity: capacity,
        FeesCollected: fees.paid,
        FeesOutstanding: fees.due,
        IsActive: String(cdata[i][18]) !== '0'
      });
    }
    out.sort(function (a, b) { return String(a.ClassName + a.Section).localeCompare(String(b.ClassName + b.Section)); });
    return { success: true, data: out };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// one row per active student: class, status, fees outstanding
function getOwnerStudentSummaries(currentUser, currentRole) {
  try {
    if (!isOwnerOrAdmin(currentRole)) return { success: false, message: 'Forbidden — owner/admin only' };

    var ssh = getSheet(STUDENTS_SHEET);
    if (!ssh) return { success: false, message: 'Students sheet not found' };
    var sdata = ssh.getDataRange().getValues();
    var cmap = getClassesMap();

    var fmap = getFeeStructuresLite();
    var fsh = getSheet(FEE_PAYMENTS_SHEET);
    var fpdata = fsh ? fsh.getDataRange().getValues() : [];
    var dueByStudent = {};
    for (var f = 1; f < fpdata.length; f++) {
      if (String(fpdata[f][15]) === '1') continue;
      var sid = parseInt(fpdata[f][1], 10);
      dueByStudent[sid] = (dueByStudent[sid] || 0) + (parseFloat(fpdata[f][4]) || 0);
    }

    var out = [];
    for (var i = 1; i < sdata.length; i++) {
      if (String(sdata[i][36]) === '1') continue;
      var id = sdata[i][0];
      var classId = parseInt(sdata[i][25], 10);
      out.push({
        ID: id,
        AdmissionNumber: sdata[i][1],
        FullName: [sdata[i][2], sdata[i][3], sdata[i][4]].filter(function (x) { return x; }).join(' '),
        ClassLabel: cmap[classId] ? cmap[classId].label : '— unassigned —',
        Status: String(sdata[i][35] || '').toLowerCase(),
        FeesOutstanding: dueByStudent[id] || 0
      });
    }
    out.sort(function (a, b) { return a.FullName.localeCompare(b.FullName); });
    return { success: true, data: out };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// activity log for a single day (defaults to today), grouped by action type — powers the owner's daily digest too
function getOwnerDailyActivityReport(dateStr, currentUser, currentRole) {
  try {
    if (!isOwnerOrAdmin(currentRole)) return { success: false, message: 'Forbidden — owner/admin only' };

    var sh = getSheet(LOGS_SHEET);
    if (!sh) return { success: true, data: { date: dateStr || todayStr(), entries: [], byAction: [] } };

    var target = String(dateStr || todayStr()).slice(0, 10);
    var data = sh.getDataRange().getValues();
    var entries = [];
    var byAction = {};
    for (var i = 1; i < data.length; i++) {
      var ts = data[i][0];
      var d = ts ? String(toIso(ts)).slice(0, 10) : '';
      if (d !== target) continue;
      var action = data[i][2] || 'Other';
      entries.push({ Time: toIso(ts), User: data[i][1], Action: action, Details: data[i][3] });
      byAction[action] = (byAction[action] || 0) + 1;
    }
    entries.sort(function (a, b) { return String(a.Time).localeCompare(String(b.Time)); });
    var byActionArr = Object.keys(byAction).map(function (k) { return { Action: k, Count: byAction[k] }; })
      .sort(function (a, b) { return b.Count - a.Count; });

    return { success: true, data: { date: target, entries: entries, byAction: byActionArr, totalEntries: entries.length } };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// 5b. exam picker list for reports
function getExamsForReport(currentUser, currentRole) {
  try {
    if (!canViewClassReports(currentRole)) return { success: false, message: 'Forbidden' };
    var sh = getSheet(EXAMS_SHEET);
    if (!sh) return { success: false, message: 'Exams sheet not found' };
    var data = sh.getDataRange().getValues(), cmap = getClassesMap(), out = [];
    var teacherClassIds = String(currentRole).toLowerCase() === 'teacher' ? getTeacherClassIds(currentUser) : null;
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][11]) === '1') continue;
      var clsId = parseInt(data[i][3], 10);
      if (teacherClassIds !== null && teacherClassIds.indexOf(clsId) === -1) continue; // teacher: own classes only
      var cl = cmap[clsId] ? cmap[clsId].label : '— deleted class —';
      out.push({ ID: data[i][0], label: data[i][1] + ' — ' + cl + ' (' + (data[i][4] || '') + ')' });
    }
    out.sort(function(a, b) { return (b.ID || 0) - (a.ID || 0); }); // newest first
    return { success: true, data: out };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// 5. exam result sheet — p = { examId }
function getExamResultReport(p, currentUser, currentRole) {
  try {
    if (!canViewClassReports(currentRole)) return { success: false, message: 'Forbidden' };
    p = p || {};
    var examId = parseInt(p.examId, 10);
    if (isNaN(examId)) return { success: false, message: 'examId is required' };
    var esh = getSheet(EXAMS_SHEET);
    if (!esh) return { success: false, message: 'Exams sheet not found' };
    var ed = esh.getDataRange().getValues(), exRow = null;
    for (var i = 1; i < ed.length; i++) {
      if (String(ed[i][11]) === '1') continue;
      if (parseInt(ed[i][0], 10) === examId) { exRow = ed[i]; break; }
    }
    if (!exRow) return { success: false, message: 'Exam not found' };
    var classId = parseInt(exRow[3], 10);
    // teacher: only exams of their assigned classes
    if (String(currentRole).toLowerCase() === 'teacher' && getTeacherClassIds(currentUser).indexOf(classId) === -1) {
      return { success: false, message: 'Forbidden — that exam is not in your assigned classes' };
    }
    var gradeBand = (getClassesMap()[classId] || {}).gradeBand || 'basic';

    // students in class (getStudentsLite already excludes deleted)
    var slite = getStudentsLite(), studentsArr = [];
    var ssh = getSheet(STUDENTS_SHEET);
    if (ssh) {
      var sd = ssh.getDataRange().getValues();
      for (var j = 1; j < sd.length; j++) {
        if (String(sd[j][36]) === '1') continue;
        if (parseInt(sd[j][25], 10) !== classId) continue;
        var stt = String(sd[j][35] || '').toLowerCase();
        if (stt === 'transferred' || stt === 'passed_out') continue;
        studentsArr.push({ id: sd[j][0], admNo: sd[j][1], name: slite[sd[j][0]] ? slite[sd[j][0]].fullName : ([sd[j][2], sd[j][3], sd[j][4]].filter(function(x){return x;}).join(' ')), roll: sd[j][26] || '' });
      }
    }

    // subjects for class — build dynamic columns (suffix code if name dup)
    var subsh = getSheet(SUBJECTS_SHEET), subjects = [];
    if (subsh) {
      var subd = subsh.getDataRange().getValues();
      for (var k = 1; k < subd.length; k++) {
        if (String(subd[k][5]) === '1') continue;
        if (parseInt(subd[k][3], 10) !== classId) continue;
        subjects.push({ id: subd[k][0], name: subd[k][1], code: subd[k][2], max: parseInt(subd[k][4], 10) || 100 });
      }
    }
    var nameSeen = {};
    subjects.forEach(function(s) { nameSeen[s.name] = (nameSeen[s.name] || 0) + 1; });
    var keySeen = {};
    subjects.forEach(function(s) {
      var key = (nameSeen[s.name] > 1 && s.code) ? (s.name + ' (' + s.code + ')') : s.name;
      while (keySeen[key]) key = key + '·';
      keySeen[key] = true;
      s.colKey = key;
    });
    var maxTotal = subjects.reduce(function(t, s) { return t + s.max; }, 0);

    // marks for exam (no is_deleted) — index by studentId|subjectId
    var msh = getSheet(MARKS_SHEET), mIdx = {}, anyMarks = false;
    if (msh) {
      var md = msh.getDataRange().getValues();
      for (var m = 1; m < md.length; m++) {
        if (parseInt(md[m][1], 10) !== examId) continue;
        mIdx[String(md[m][2]) + '|' + String(md[m][3])] = { obtained: parseFloat(md[m][4]), absent: (String(md[m][7]) === '1' || md[m][7] === 1 || md[m][7] === true) };
        anyMarks = true;
      }
    }

    var rows = [], passed = 0, failed = 0, pctSum = 0, hi = null, lo = null;
    studentsArr.forEach(function(st) {
      var row = { AdmissionNumber: st.admNo, StudentName: st.name, RollNumber: st.roll };
      var total = 0;
      subjects.forEach(function(s) {
        var mk = mIdx[String(st.id) + '|' + String(s.id)];
        if (!mk) { row[s.colKey] = '—'; return; }
        if (mk.absent) { row[s.colKey] = 'AB'; return; }
        var v = isNaN(mk.obtained) ? 0 : mk.obtained;
        row[s.colKey] = v; total += v;
      });
      var pct = Math.round((100 * total / Math.max(1, maxTotal)) * 100) / 100;
      row.Total = total;
      row.MaxTotal = maxTotal;
      row.Percentage = pct;
      row.Grade = computeGrade(total, maxTotal, false, gradeBand);
      row.Result = pct >= 50 ? 'Pass' : 'Fail';
      if (pct >= 50) passed++; else failed++;
      pctSum += pct;
      hi = (hi === null || pct > hi) ? pct : hi;
      lo = (lo === null || pct < lo) ? pct : lo;
      rows.push(row);
    });
    rows.sort(function(a, b) {
      if (b.Percentage !== a.Percentage) return b.Percentage - a.Percentage;
      return String(a.RollNumber || '').localeCompare(String(b.RollNumber || ''));
    });

    var n = rows.length;
    var cols = [
      { key: 'AdmissionNumber', label: 'Adm #' },
      { key: 'StudentName', label: 'Student' },
      { key: 'RollNumber', label: 'Roll' }
    ];
    subjects.forEach(function(s) { cols.push({ key: s.colKey, label: s.colKey }); });
    cols.push({ key: 'Total', label: 'Total', type: 'int' });
    cols.push({ key: 'MaxTotal', label: 'Max', type: 'int' });
    cols.push({ key: 'Percentage', label: '%' });
    cols.push({ key: 'Grade', label: 'Grade' });
    cols.push({ key: 'Result', label: 'Result' });

    var res = {
      success: true,
      rows: rows,
      summary: {
        'Students': n,
        'Passed': passed,
        'Failed': failed,
        'Class Average %': n ? Math.round((pctSum / n) * 100) / 100 : 0,
        'Highest %': n ? hi : 0,
        'Lowest %': n ? lo : 0
      },
      columns: cols,
      generatedAt: nowIso()
    };
    if (!anyMarks) res.message = 'No marks entered for this exam yet';
    return res;
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// 6. attendance summary — p = { classId, fromDate, toDate } (all required)
function getAttendanceSummaryReport(p, currentUser, currentRole) {
  try {
    if (!canViewClassReports(currentRole)) return { success: false, message: 'Forbidden' };
    p = p || {};
    var classId = parseInt(p.classId, 10);
    var from = (p.fromDate == null) ? '' : String(p.fromDate).trim();
    var to = (p.toDate == null) ? '' : String(p.toDate).trim();
    if (isNaN(classId) || !from || !to) return { success: false, message: 'classId, fromDate, toDate are required' };
    // teacher: only their assigned classes
    if (String(currentRole).toLowerCase() === 'teacher' && getTeacherClassIds(currentUser).indexOf(classId) === -1) {
      return { success: false, message: 'Forbidden — that class is not in your assigned classes' };
    }

    // active students in class
    var slite = getStudentsLite(), studentsArr = [];
    var ssh = getSheet(STUDENTS_SHEET);
    if (ssh) {
      var sd = ssh.getDataRange().getValues();
      for (var j = 1; j < sd.length; j++) {
        if (String(sd[j][36]) === '1') continue;
        if (parseInt(sd[j][25], 10) !== classId) continue;
        var stt = String(sd[j][35] || '').toLowerCase();
        if (stt === 'transferred' || stt === 'passed_out') continue;
        studentsArr.push({ id: sd[j][0], admNo: sd[j][1], name: slite[sd[j][0]] ? slite[sd[j][0]].fullName : ([sd[j][2], sd[j][3], sd[j][4]].filter(function(x){return x;}).join(' ')), roll: sd[j][26] || '' });
      }
    }
    var counts = {}; // studentId -> {present,absent,late,half_day,leave}
    studentsArr.forEach(function(s) { counts[s.id] = { present: 0, absent: 0, late: 0, half_day: 0, leave: 0 }; });
    var schoolDays = {};
    var ash = getSheet(ATTENDANCE_SHEET);
    if (ash) {
      var ad = ash.getDataRange().getValues();
      for (var i = 1; i < ad.length; i++) {
        if (parseInt(ad[i][1], 10) !== classId) continue;
        var dd = _dOnly(ad[i][2]);
        if (!_inRange(dd, from, to)) continue;
        schoolDays[dd] = true;
        var jsonObj = parseAttendanceJson(ad[i][6]);
        studentsArr.forEach(function(s) {
          var entry = jsonObj[s.id] || jsonObj[String(s.id)];
          if (!entry) return;
          var stat = String(entry.status || '').toLowerCase();
          if (counts[s.id][stat] != null) counts[s.id][stat]++;
        });
      }
    }
    var rows = [], pctSum = 0;
    studentsArr.forEach(function(s) {
      var c = counts[s.id];
      var tot = c.present + c.absent + c.late + c.half_day + c.leave;
      var attended = c.present + c.late + c.half_day;
      var pct = Math.round((100 * attended / Math.max(1, tot)) * 10) / 10;
      pctSum += pct;
      rows.push({
        AdmissionNumber: s.admNo, StudentName: s.name, RollNumber: s.roll,
        Present: c.present, Absent: c.absent, Late: c.late, HalfDay: c.half_day, Leave: c.leave,
        TotalRecords: tot, PercentPresent: pct
      });
    });
    rows.sort(function(a, b) { return String(a.RollNumber || '').localeCompare(String(b.RollNumber || '')); });
    var n = rows.length, distinctDays = Object.keys(schoolDays).length;
    return {
      success: true,
      rows: rows,
      summary: { 'Students': n, 'School days in range': distinctDays, 'Avg attendance %': n ? Math.round((pctSum / n) * 10) / 10 : 0 },
      columns: [
        { key: 'AdmissionNumber', label: 'Adm #' },
        { key: 'StudentName', label: 'Student' },
        { key: 'RollNumber', label: 'Roll' },
        { key: 'Present', label: 'Present', type: 'int' },
        { key: 'Absent', label: 'Absent', type: 'int' },
        { key: 'Late', label: 'Late', type: 'int' },
        { key: 'HalfDay', label: 'Half Day', type: 'int' },
        { key: 'Leave', label: 'Leave', type: 'int' },
        { key: 'TotalRecords', label: 'Records', type: 'int' },
        { key: 'PercentPresent', label: '% Present' }
      ],
      generatedAt: nowIso()
    };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// 7. student roster — p = { classId, status }
function getStudentRosterReport(p, currentUser, currentRole) {
  try {
    if (!canViewReports(currentRole)) return { success: false, message: 'Forbidden — admin/clerk/supervisor only' };
    p = p || {};
    var clsId = (p.classId === '' || p.classId == null) ? null : parseInt(p.classId, 10);
    var status = (p.status == null || String(p.status).trim() === '') ? null : String(p.status).toLowerCase().trim();
    var sh = getSheet(STUDENTS_SHEET);
    if (!sh) return { success: false, message: 'Students sheet not found' };
    var data = sh.getDataRange().getValues(), cmap = getClassesMap();
    var rows = [], active = 0, male = 0, female = 0;
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][36]) === '1') continue;
      var cid = parseInt(data[i][25], 10);
      if (clsId !== null && cid !== clsId) continue;
      var stt = String(data[i][35] || '').toLowerCase();
      if (status !== null && stt !== status) continue;
      var g = String(data[i][5] || '').toLowerCase();
      rows.push({
        AdmissionNumber: data[i][1],
        StudentName: [data[i][2], data[i][3], data[i][4]].filter(function(x){ return x; }).join(' '),
        ClassLabel: cmap[cid] ? cmap[cid].label : '',
        RollNumber: data[i][26] || '',
        Gender: g,
        DateOfBirth: toIso(data[i][6]),
        FatherName: data[i][15] || '',
        FatherMobile: data[i][17] || '',
        AdmissionDate: toIso(data[i][24]),
        Status: stt
      });
      if (stt === 'active') active++;
      if (g === 'male') male++;
      if (g === 'female') female++;
    }
    rows.sort(function(a, b) {
      var c = String(a.ClassLabel || '').localeCompare(String(b.ClassLabel || ''));
      return c !== 0 ? c : String(a.RollNumber || '').localeCompare(String(b.RollNumber || ''));
    });
    return {
      success: true,
      rows: rows,
      summary: { 'Students': rows.length, 'Active': active, 'Male': male, 'Female': female },
      columns: [
        { key: 'AdmissionNumber', label: 'Adm #' },
        { key: 'StudentName', label: 'Student' },
        { key: 'ClassLabel', label: 'Class' },
        { key: 'RollNumber', label: 'Roll' },
        { key: 'Gender', label: 'Gender' },
        { key: 'DateOfBirth', label: 'DOB', type: 'date' },
        { key: 'FatherName', label: 'Father' },
        { key: 'FatherMobile', label: 'Father Mobile' },
        { key: 'AdmissionDate', label: 'Admitted', type: 'date' },
        { key: 'Status', label: 'Status' }
      ],
      generatedAt: nowIso()
    };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// 8. staff list — p = { role, status }
function getStaffListReport(p, currentUser, currentRole) {
  try {
    if (!canViewReports(currentRole)) return { success: false, message: 'Forbidden — admin/clerk/supervisor only' };
    p = p || {};
    var role = (p.role == null || String(p.role).trim() === '') ? null : String(p.role).toLowerCase().trim();
    var status = (p.status == null || String(p.status).trim() === '') ? null : String(p.status).toLowerCase().trim();
    var sh = getSheet(USERS_SHEET);
    if (!sh) return { success: false, message: 'Users sheet not found' };
    var data = sh.getDataRange().getValues();
    var rows = [], cAdmin = 0, cClerk = 0, cTeacher = 0, cSup = 0;
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][16]) === '1') continue;
      var r = String(data[i][6] || '').toLowerCase();
      var stt = String(data[i][14] || '').toLowerCase();
      if (role !== null && r !== role) continue;
      if (status !== null && stt !== status) continue;
      rows.push({
        EmployeeCode: data[i][23] || '',
        FullName: data[i][2] || data[i][1],
        Username: data[i][1] || '',
        Role: r,
        Email: data[i][3] || '',
        Mobile: data[i][5] || '',
        Specialization: data[i][10] || '',
        JoiningDate: toIso(data[i][11]),
        Status: stt
      });
      if (r === 'admin') cAdmin++;
      else if (r === 'clerk') cClerk++;
      else if (r === 'teacher') cTeacher++;
      else if (r === 'supervisor') cSup++;
    }
    rows.sort(function(a, b) {
      var c = String(a.Role || '').localeCompare(String(b.Role || ''));
      return c !== 0 ? c : String(a.FullName || '').localeCompare(String(b.FullName || ''));
    });
    return {
      success: true,
      rows: rows,
      summary: { 'Staff': rows.length, 'Admins': cAdmin, 'Clerks': cClerk, 'Teachers': cTeacher, 'Supervisors': cSup },
      columns: [
        { key: 'EmployeeCode', label: 'Emp Code' },
        { key: 'FullName', label: 'Name' },
        { key: 'Username', label: 'Username' },
        { key: 'Role', label: 'Role' },
        { key: 'Email', label: 'Email' },
        { key: 'Mobile', label: 'Mobile' },
        { key: 'Specialization', label: 'Specialization' },
        { key: 'JoiningDate', label: 'Joined', type: 'date' },
        { key: 'Status', label: 'Status' }
      ],
      generatedAt: nowIso()
    };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// 9. admissions — p = { status, admissionType, academicYear, fromDate, toDate } (date on RegistrationDate)
function getAdmissionsReport(p, currentUser, currentRole) {
  try {
    if (!canViewReports(currentRole)) return { success: false, message: 'Forbidden — admin/clerk/supervisor only' };
    p = p || {};
    var status = (p.status == null || String(p.status).trim() === '') ? null : String(p.status).toLowerCase().trim();
    var aType = (p.admissionType == null || String(p.admissionType).trim() === '') ? null : String(p.admissionType).toLowerCase().trim();
    var year = (p.academicYear == null || String(p.academicYear).trim() === '') ? null : String(p.academicYear).trim();
    var from = (p.fromDate == null) ? '' : String(p.fromDate).trim();
    var to = (p.toDate == null) ? '' : String(p.toDate).trim();
    var sh = getSheet(ADMISSIONS_SHEET);
    if (!sh) return { success: false, message: 'Admissions sheet not found' };
    var data = sh.getDataRange().getValues(), cmap = getClassesMap(), umap = getUsersMap();
    var rows = [], cReg = 0, cAdm = 0, cEnr = 0, cRej = 0, total = 0;
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][52]) === '1') continue;
      var a = rowToAdmission(data[i], cmap, umap);
      if (status !== null && a.Status !== status) continue;
      if (aType !== null && a.AdmissionType !== aType) continue;
      if (year !== null && String(a.AcademicYear) !== year) continue;
      if (from || to) {
        var rd = _dOnly(data[i][27]);
        if (!_inRange(rd, from, to)) continue;
      }
      rows.push({
        RegistrationNumber: a.RegistrationNumber,
        ApplicantName: a.ApplicantName,
        Gender: a.Gender,
        DateOfBirth: a.DateOfBirth,
        AppliedForClassLabel: a.AppliedForClassLabel,
        AdmissionType: a.AdmissionType,
        PreviousSchool: a.PreviousSchool,
        RegistrationDate: a.RegistrationDate,
        Status: a.Status,
        AdmissionFee: a.AdmissionFee,
        AllottedClassLabel: a.AllottedClassLabel,
        AdmissionNumber: a.AdmissionNumber,
        EnrolledDate: a.AdmissionDate
      });
      total++;
      if (a.Status === 'registered') cReg++;
      else if (a.Status === 'admitted') cAdm++;
      else if (a.Status === 'enrolled') cEnr++;
      else if (a.Status === 'rejected') cRej++;
    }
    rows.sort(function(a, b) { return String(b.RegistrationDate || '').localeCompare(String(a.RegistrationDate || '')); });
    return {
      success: true,
      rows: rows,
      summary: {
        'Applications': total,
        'Registered': cReg,
        'Admitted': cAdm,
        'Enrolled': cEnr,
        'Rejected': cRej,
        'Conversion %': Math.round((100 * cEnr / Math.max(1, total)) * 10) / 10
      },
      columns: [
        { key: 'RegistrationNumber', label: 'Reg #' },
        { key: 'ApplicantName', label: 'Applicant' },
        { key: 'Gender', label: 'Gender' },
        { key: 'DateOfBirth', label: 'DOB', type: 'date' },
        { key: 'AppliedForClassLabel', label: 'Applied For' },
        { key: 'AdmissionType', label: 'Type' },
        { key: 'PreviousSchool', label: 'Previous School' },
        { key: 'RegistrationDate', label: 'Registered', type: 'date' },
        { key: 'Status', label: 'Status' },
        { key: 'AdmissionFee', label: 'Adm Fee', type: 'money' },
        { key: 'AllottedClassLabel', label: 'Allotted Class' },
        { key: 'AdmissionNumber', label: 'Adm #' },
        { key: 'EnrolledDate', label: 'Enrolled', type: 'date' }
      ],
      generatedAt: nowIso()
    };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// 10. activity log — p = { fromDate, toDate, search, limit }
function getActivityLogReport(p, currentUser, currentRole) {
  try {
    if (!canViewReports(currentRole)) return { success: false, message: 'Forbidden — admin/clerk/supervisor only' };
    p = p || {};
    var from = (p.fromDate == null) ? '' : String(p.fromDate).trim();
    var to = (p.toDate == null) ? '' : String(p.toDate).trim();
    var search = (p.search == null) ? '' : String(p.search).toLowerCase().trim();
    var limit = parseInt(p.limit, 10);
    if (isNaN(limit) || limit <= 0) limit = 500;
    if (limit > 2000) limit = 2000;
    var sh = getSheet(LOGS_SHEET);
    if (!sh) return { success: false, message: 'Logs sheet not found' };
    var data = sh.getDataRange().getValues();
    var all = [];
    for (var i = 1; i < data.length; i++) {
      var ts = data[i][0], user = data[i][1] || '', action = data[i][2] || '', details = data[i][3] || '';
      if (from || to) {
        var dd = _dOnly(ts);
        if (!_inRange(dd, from, to)) continue;
      }
      if (search) {
        var hay = (String(user) + ' ' + String(action) + ' ' + String(details)).toLowerCase();
        if (hay.indexOf(search) === -1) continue;
      }
      all.push({ Timestamp: toIso(ts), User: String(user), Action: String(action), Details: String(details) });
    }
    all.sort(function(a, b) { return String(b.Timestamp || '').localeCompare(String(a.Timestamp || '')); });
    var rows = all.slice(0, limit);
    var actSet = {}, userSet = {};
    rows.forEach(function(r) { if (r.Action) actSet[r.Action] = true; if (r.User) userSet[r.User] = true; });
    return {
      success: true,
      rows: rows,
      summary: { 'Entries shown': rows.length, 'Distinct actions': Object.keys(actSet).length, 'Distinct users': Object.keys(userSet).length },
      columns: [
        { key: 'Timestamp', label: 'Time', type: 'datetime' },
        { key: 'User', label: 'User' },
        { key: 'Action', label: 'Action' },
        { key: 'Details', label: 'Details' }
      ],
      generatedAt: nowIso()
    };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// ============== Parents CRUD ==============
// row -> public parent object (no password)
function rowToParent(row) {
  return {
    ID: row[0],
    FullName: row[1],
    Email: row[2] || '',
    Mobile: row[3] || '',
    Relation: String(row[5] || '').toLowerCase(),
    Occupation: row[6] || '',
    Address: row[7] || '',
    LastLogin: toIso(row[8]),
    Status: String(row[9] || '').toLowerCase(),
    CreatedAt: toIso(row[11]),
    UpdatedAt: toIso(row[12]),
    Nationality: row[13] || '',
    CountryOfResidence: row[14] || '',
    PreferredLanguage: String(row[15] || 'en').toLowerCase(),
    PreferredContactMethod: String(row[16] || 'email').toLowerCase(),
    WhatsAppNumber: row[17] || '',
    TimeZone: row[18] || 'UTC',
    Employer: row[19] || '',
    JobTitle: row[20] || '',
    WorkEmail: row[21] || '',
    WorkPhone: row[22] || '',
    PreferredBillingContact: String(row[23]) === '1' || row[23] === 1 || row[23] === true,
    NotificationPreferences: row[24] || 'attendance,exams,fees,notices,discipline',
    EmergencyOnly: String(row[25]) === '1' || row[25] === 1 || row[25] === true,
    PhotoURL: row[26] || '',
    City: row[27] || '',
    Country: row[28] || '',
    PostalCode: row[29] || '',
    NumberOfChildren: parseInt(row[30], 10) || 0,
    AnnualIncome: parseFloat(row[31]) || 0
  };
}

function getAllParents(currentUser, currentRole) {
  try {
    if (!canReadParents(currentRole)) return { success: false, message: 'Forbidden — no access' };

    var sh = getSheet(PARENTS_SHEET);
    if (!sh) return { success: false, message: 'Parents sheet not found' };

    // teacher mobile-bridge filter
    var allowedMobiles = null;
    if (String(currentRole).toLowerCase() === 'teacher') {
      allowedMobiles = getTeacherParentMobiles(currentUser);
    }

    var data = sh.getDataRange().getValues(), out = [];
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][10]) === '1') continue;
      var mob = String(data[i][3] || '').trim();
      if (allowedMobiles !== null && allowedMobiles.indexOf(mob) === -1) continue;
      out.push(rowToParent(data[i]));
    }

    // attach linked student counts
    var psh = getSheet(PARENT_STUDENTS_SHEET);
    var linkCount = {};
    if (psh) {
      var pdata = psh.getDataRange().getValues();
      for (var pi = 1; pi < pdata.length; pi++) {
        var pid = parseInt(pdata[pi][1], 10);
        if (isNaN(pid)) continue;
        linkCount[pid] = (linkCount[pid] || 0) + 1;
      }
    }
    out.forEach(function(p) { p.LinkedStudentsCount = linkCount[p.ID] || 0; });

    return { success: true, data: out };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// uniqueness checks
function parentMobileExists(sh, mobile, excludeId) {
  var data = sh.getDataRange().getValues();
  var m = String(mobile || '').trim();
  if (!m) return false;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][10]) === '1') continue;
    if (excludeId !== undefined && data[i][0] === excludeId) continue;
    if (String(data[i][3] || '').trim() === m) return true;
  }
  return false;
}

function parentEmailExists(sh, email, excludeId) {
  if (!email) return false;
  var data = sh.getDataRange().getValues();
  var e = String(email).trim().toLowerCase();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][10]) === '1') continue;
    if (excludeId !== undefined && data[i][0] === excludeId) continue;
    if (String(data[i][2] || '').trim().toLowerCase() === e) return true;
  }
  return false;
}

// shared field validator + normalizer for new parent cols (13-30)
function validateParentFields(d) {
  var langs = ['en','fr','es','zh','ar','ru','ko','ja','pt','de','it','hi','ur','bn','ta','ms','id','th','vi','other'];
  var contacts = ['email','sms','whatsapp','phone','app'];
  var allowedChannels = ['attendance','exams','fees','notices','discipline'];

  var lang = String(d.PreferredLanguage || 'en').toLowerCase();
  if (langs.indexOf(lang) === -1) return { ok: false, error: 'PreferredLanguage must be one of: ' + langs.join(', ') };

  var contact = String(d.PreferredContactMethod || 'email').toLowerCase();
  if (contacts.indexOf(contact) === -1) return { ok: false, error: 'PreferredContactMethod must be one of: ' + contacts.join(', ') };

  // notif prefs — accept csv or array
  var notifRaw = d.NotificationPreferences;
  var notif = '';
  if (Array.isArray(notifRaw)) notif = notifRaw.join(',');
  else if (typeof notifRaw === 'string') notif = notifRaw;
  else notif = 'attendance,exams,fees,notices,discipline';
  // keep only allowed channels
  var parts = notif.split(',').map(function(x){ return String(x).trim().toLowerCase(); }).filter(function(x){ return allowedChannels.indexOf(x) !== -1; });
  notif = parts.join(',');

  var nat = String(d.Nationality || '').trim();
  if (nat.length > 50) return { ok: false, error: 'Nationality max 50 chars' };
  var cor = String(d.CountryOfResidence || '').trim();
  if (cor.length > 50) return { ok: false, error: 'CountryOfResidence max 50 chars' };
  var wa = String(d.WhatsAppNumber || '').trim();
  if (wa.length > 20) return { ok: false, error: 'WhatsAppNumber max 20 chars' };
  var tz = String(d.TimeZone || 'UTC').trim();
  if (tz.length > 60) return { ok: false, error: 'TimeZone max 60 chars' };
  var emp = String(d.Employer || '').trim();
  if (emp.length > 100) return { ok: false, error: 'Employer max 100 chars' };
  var jt = String(d.JobTitle || '').trim();
  if (jt.length > 100) return { ok: false, error: 'JobTitle max 100 chars' };
  var we = String(d.WorkEmail || '').trim().toLowerCase();
  if (we.length > 100) return { ok: false, error: 'WorkEmail max 100 chars' };
  if (we && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(we)) return { ok: false, error: 'WorkEmail format invalid' };
  var wp = String(d.WorkPhone || '').trim();
  if (wp.length > 20) return { ok: false, error: 'WorkPhone max 20 chars' };
  var pbc = (d.PreferredBillingContact === true || String(d.PreferredBillingContact) === '1' || String(d.PreferredBillingContact).toLowerCase() === 'true') ? '1' : '0';
  var eo = (d.EmergencyOnly === true || String(d.EmergencyOnly) === '1' || String(d.EmergencyOnly).toLowerCase() === 'true') ? '1' : '0';
  var photo = String(d.PhotoURL || '').trim();
  if (photo.length > 500) return { ok: false, error: 'PhotoURL max 500 chars' };
  var city = String(d.City || '').trim();
  if (city.length > 50) return { ok: false, error: 'City max 50 chars' };
  var ctry = String(d.Country || '').trim();
  if (ctry.length > 50) return { ok: false, error: 'Country max 50 chars' };
  var pc = String(d.PostalCode || '').trim();
  if (pc.length > 20) return { ok: false, error: 'PostalCode max 20 chars' };
  var noc = parseInt(d.NumberOfChildren, 10);
  if (isNaN(noc) || noc < 0) noc = 0;
  if (noc > 30) return { ok: false, error: 'NumberOfChildren seems too high' };

  var inc = parseFloat(d.AnnualIncome);
  if (isNaN(inc) || inc < 0) inc = 0;

  return {
    ok: true,
    normalized: {
      nationality: nat, countryOfResidence: cor, preferredLanguage: lang,
      preferredContactMethod: contact, whatsAppNumber: wa, timeZone: tz,
      employer: emp, jobTitle: jt, workEmail: we, workPhone: wp,
      preferredBillingContact: pbc, notificationPreferences: notif,
      emergencyOnly: eo, photoURL: photo,
      city: city, country: ctry, postalCode: pc, numberOfChildren: noc,
      annualIncome: inc
    }
  };
}

function addParent(p, currentUser, currentRole) {
  try {
    if (!isAdmin(currentRole)) return { success: false, message: 'Forbidden — admin only' };

    var sh = getSheet(PARENTS_SHEET);
    if (!sh) return { success: false, message: 'Parents sheet not found' };

    if (!p.FullName || !p.Mobile || !p.Password || !p.Relation) {
      return { success: false, message: 'FullName, Mobile, Password, Relation are required' };
    }
    if (String(p.FullName).length > 100) return { success: false, message: 'FullName max 100 chars' };
    if (String(p.Mobile).length > 15) return { success: false, message: 'Mobile max 15 chars' };
    var rel = String(p.Relation).toLowerCase();
    if (['father','mother','guardian'].indexOf(rel) === -1) return { success: false, message: 'Relation must be father/mother/guardian' };

    if (parentMobileExists(sh, p.Mobile)) return { success: false, message: 'Mobile already in use' };
    if (p.Email && parentEmailExists(sh, p.Email)) return { success: false, message: 'Email already in use' };

    var statusVal = String(p.Status || 'active').toLowerCase();
    if (['active','inactive'].indexOf(statusVal) === -1) statusVal = 'active';

    var v = validateParentFields(p);
    if (!v.ok) return { success: false, message: v.error };
    var n = v.normalized;

    var ts = nowIso(), id = nextParentId(sh);
    sh.appendRow([
      id,
      String(p.FullName).trim(),
      p.Email ? String(p.Email).trim().toLowerCase() : '',
      String(p.Mobile).trim(),
      p.Password,  // plain per Apps Script rule, schema field is PasswordHash
      rel,
      p.Occupation || '',
      p.Address || '',
      '',          // last_login
      statusVal,
      '0',
      ts, ts,
      // new cols 13-30
      n.nationality, n.countryOfResidence, n.preferredLanguage, n.preferredContactMethod,
      n.whatsAppNumber, n.timeZone, n.employer, n.jobTitle, n.workEmail, n.workPhone,
      n.preferredBillingContact, n.notificationPreferences, n.emergencyOnly, n.photoURL,
      n.city, n.country, n.postalCode, n.numberOfChildren,
      // 31 — annual income
      n.annualIncome
    ]);

    // mirror to Users sheet so the parent can log in via unified auth
    _mirrorParentToUsers(id, String(p.FullName).trim(), p.Email || '', String(p.Mobile).trim(),
      p.Password, rel, n.photoURL || '', currentUser);
    addLog(currentUser, 'Parent Added', 'Added: ' + p.FullName + ' (' + rel + ', ' + p.Mobile + ')');
    return { success: true, message: 'Parent added successfully', id: id };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

function updateParent(id, p, currentUser, currentRole) {
  try {
    if (!isAdmin(currentRole)) return { success: false, message: 'Forbidden — admin only' };

    var sh = getSheet(PARENTS_SHEET);
    if (!sh) return { success: false, message: 'Parents sheet not found' };

    var idn = parseInt(id, 10);
    if (isNaN(idn)) return { success: false, message: 'Invalid id' };

    if (!p.FullName || !p.Mobile || !p.Relation) {
      return { success: false, message: 'FullName, Mobile, Relation are required' };
    }
    var rel = String(p.Relation).toLowerCase();
    if (['father','mother','guardian'].indexOf(rel) === -1) return { success: false, message: 'Relation must be father/mother/guardian' };

    if (parentMobileExists(sh, p.Mobile, idn)) return { success: false, message: 'Mobile already in use' };
    if (p.Email && parentEmailExists(sh, p.Email, idn)) return { success: false, message: 'Email already in use' };

    var statusVal = String(p.Status || 'active').toLowerCase();
    if (['active','inactive'].indexOf(statusVal) === -1) statusVal = 'active';

    var v = validateParentFields(p);
    if (!v.ok) return { success: false, message: v.error };
    var n = v.normalized;

    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] !== idn || String(data[i][10]) === '1') continue;
      var row = i + 1, ts = nowIso();

      sh.getRange(row, 2).setValue(String(p.FullName).trim());
      sh.getRange(row, 3).setValue(p.Email ? String(p.Email).trim().toLowerCase() : '');
      sh.getRange(row, 4).setValue(String(p.Mobile).trim());
      if (p.Password && String(p.Password).trim() !== '') {
        sh.getRange(row, 5).setValue(p.Password);
      }
      sh.getRange(row, 6).setValue(rel);
      sh.getRange(row, 7).setValue(p.Occupation || '');
      sh.getRange(row, 8).setValue(p.Address || '');
      sh.getRange(row, 10).setValue(statusVal);
      sh.getRange(row, 13).setValue(ts);

      // new cols 14-31 (1-indexed)
      sh.getRange(row, 14).setValue(n.nationality);
      sh.getRange(row, 15).setValue(n.countryOfResidence);
      sh.getRange(row, 16).setValue(n.preferredLanguage);
      sh.getRange(row, 17).setValue(n.preferredContactMethod);
      sh.getRange(row, 18).setValue(n.whatsAppNumber);
      sh.getRange(row, 19).setValue(n.timeZone);
      sh.getRange(row, 20).setValue(n.employer);
      sh.getRange(row, 21).setValue(n.jobTitle);
      sh.getRange(row, 22).setValue(n.workEmail);
      sh.getRange(row, 23).setValue(n.workPhone);
      sh.getRange(row, 24).setValue(n.preferredBillingContact);
      sh.getRange(row, 25).setValue(n.notificationPreferences);
      sh.getRange(row, 26).setValue(n.emergencyOnly);
      sh.getRange(row, 27).setValue(n.photoURL);
      sh.getRange(row, 28).setValue(n.city);
      sh.getRange(row, 29).setValue(n.country);
      sh.getRange(row, 30).setValue(n.postalCode);
      sh.getRange(row, 31).setValue(n.numberOfChildren);
      sh.getRange(row, 32).setValue(n.annualIncome);

      // sync the Users mirror
      _mirrorParentToUsers(idn, String(p.FullName).trim(), p.Email || '', String(p.Mobile).trim(),
        p.Password || '', rel, n.photoURL || '', currentUser);

      addLog(currentUser, 'Parent Updated', 'Updated id ' + idn + ': ' + p.FullName);
      return { success: true, message: 'Parent updated successfully' };
    }
    return { success: false, message: 'Parent not found' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

function deleteParent(id, currentUser, currentRole) {
  try {
    if (!isAdmin(currentRole)) return { success: false, message: 'Forbidden — admin only' };

    var sh = getSheet(PARENTS_SHEET);
    if (!sh) return { success: false, message: 'Parents sheet not found' };

    var idn = parseInt(id, 10);
    if (isNaN(idn)) return { success: false, message: 'Invalid id' };

    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] !== idn || String(data[i][10]) === '1') continue;
      var row = i + 1, ts = nowIso();
      sh.getRange(row, 11).setValue('1');
      sh.getRange(row, 13).setValue(ts);
      _unmirrorByEmployeeCode('PAR-' + idn);  // soft-delete the Users mirror too
      addLog(currentUser, 'Parent Deleted', 'Soft-deleted parent id ' + idn);
      return { success: true, message: 'Parent deleted successfully' };
    }
    return { success: false, message: 'Parent not found' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// ============== Parent ↔ Student Junction ==============
// returns links for one parent, with joined student+class info — soft-deleted students filtered out
function getParentStudentLinks(parentId, currentUser, currentRole) {
  try {
    if (!canReadParentStudents(currentRole)) return { success: false, message: 'Forbidden — no access' };

    var sh = getSheet(PARENT_STUDENTS_SHEET);
    if (!sh) return { success: false, message: 'Parent_Students sheet not found' };

    var pid = parseInt(parentId, 10);
    if (isNaN(pid)) return { success: false, message: 'Invalid parent id' };

    var ssh = getSheet(STUDENTS_SHEET);
    var sdata = ssh ? ssh.getDataRange().getValues() : [];
    var sMap = {};
    for (var k = 1; k < sdata.length; k++) {
      if (String(sdata[k][36]) === '1') continue; // skip soft-deleted students
      sMap[sdata[k][0]] = sdata[k];
    }

    var cmap = getClassesMap();

    var data = sh.getDataRange().getValues(), out = [];
    for (var i = 1; i < data.length; i++) {
      if (parseInt(data[i][1], 10) !== pid) continue;
      var sid = parseInt(data[i][2], 10);
      var srow = sMap[sid];
      if (!srow) continue;  // student deleted/missing — hide link

      var clsId = parseInt(srow[25], 10);
      var cls = cmap[clsId];

      out.push({
        ID: data[i][0],
        ParentID: data[i][1],
        StudentID: sid,
        IsPrimaryContact: String(data[i][3]) === '1' || data[i][3] === 1 || data[i][3] === true,
        CreatedAt: toIso(data[i][4]),
        // joined student info
        StudentFullName: [srow[2], srow[3], srow[4]].filter(function(x){ return x; }).join(' '),
        AdmissionNumber: srow[1],
        ClassLabel: cls ? cls.label : '— deleted class —',
        ClassID: clsId,
        RollNumber: srow[26],
        Gender: String(srow[5] || '').toLowerCase(),
        PhotoURL: srow[33] || '',
        Status: String(srow[35] || '').toLowerCase()
      });
    }
    return { success: true, data: out };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// returns active students NOT already linked to this parent — used by the link picker
function getEligibleStudentsForLinking(parentId, currentUser, currentRole) {
  try {
    if (!isAdmin(currentRole)) return { success: false, message: 'Forbidden — admin only' };

    var psh = getSheet(PARENT_STUDENTS_SHEET);
    if (!psh) return { success: false, message: 'Parent_Students sheet not found' };

    var pid = parseInt(parentId, 10);
    if (isNaN(pid)) return { success: false, message: 'Invalid parent id' };

    var pdata = psh.getDataRange().getValues();
    var linked = {};
    for (var i = 1; i < pdata.length; i++) {
      if (parseInt(pdata[i][1], 10) === pid) linked[parseInt(pdata[i][2], 10)] = true;
    }

    var ssh = getSheet(STUDENTS_SHEET);
    if (!ssh) return { success: false, message: 'Students sheet not found' };

    var cmap = getClassesMap();
    var sdata = ssh.getDataRange().getValues(), out = [];
    for (var j = 1; j < sdata.length; j++) {
      if (String(sdata[j][36]) === '1') continue;
      var stat = String(sdata[j][35] || '').toLowerCase();
      if (stat === 'transferred' || stat === 'passed_out') continue;
      var sid = sdata[j][0];
      if (linked[sid]) continue;

      var clsId = parseInt(sdata[j][25], 10);
      var cls = cmap[clsId];
      out.push({
        ID: sid,
        AdmissionNumber: sdata[j][1],
        FullName: [sdata[j][2], sdata[j][3], sdata[j][4]].filter(function(x){ return x; }).join(' '),
        ClassLabel: cls ? cls.label : '— no class —',
        RollNumber: sdata[j][26]
      });
    }
    return { success: true, data: out };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

function linkParentStudent(parentId, studentId, isPrimary, currentUser, currentRole) {
  try {
    if (!isAdmin(currentRole)) return { success: false, message: 'Forbidden — admin only' };

    var sh = getSheet(PARENT_STUDENTS_SHEET);
    if (!sh) return { success: false, message: 'Parent_Students sheet not found' };

    var pid = parseInt(parentId, 10);
    var sid = parseInt(studentId, 10);
    if (isNaN(pid) || isNaN(sid)) return { success: false, message: 'Invalid parent/student id' };

    // FK validation
    var psh = getSheet(PARENTS_SHEET);
    var pdata = psh ? psh.getDataRange().getValues() : [];
    var parentOk = false, parentName = '';
    for (var i = 1; i < pdata.length; i++) {
      if (pdata[i][0] === pid && String(pdata[i][10]) === '0') {
        parentOk = true; parentName = pdata[i][1]; break;
      }
    }
    if (!parentOk) return { success: false, message: 'Parent not found or deleted' };

    var ssh = getSheet(STUDENTS_SHEET);
    var sdata = ssh ? ssh.getDataRange().getValues() : [];
    var studentOk = false, studentName = '';
    for (var j = 1; j < sdata.length; j++) {
      if (sdata[j][0] === sid && String(sdata[j][36]) === '0') {
        studentOk = true; studentName = [sdata[j][2], sdata[j][3], sdata[j][4]].filter(function(x){ return x; }).join(' '); break;
      }
    }
    if (!studentOk) return { success: false, message: 'Student not found or deleted' };

    if (parentStudentLinkExists(sh, pid, sid)) return { success: false, message: 'This parent is already linked to this student' };

    var primary = (isPrimary === true || String(isPrimary) === '1' || String(isPrimary).toLowerCase() === 'true') ? '1' : '0';
    var ts = nowIso(), id = nextLinkId(sh);
    sh.appendRow([id, pid, sid, primary, ts, ts]);

    addLog(currentUser, 'Link Created', 'Linked: ' + parentName + ' (id ' + pid + ') -> ' + studentName + ' (id ' + sid + ')' + (primary === '1' ? ' [primary]' : ''));
    return { success: true, message: 'Student linked successfully', id: id };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// hard delete — schema has no is_deleted
function unlinkParentStudent(linkId, currentUser, currentRole) {
  try {
    if (!isAdmin(currentRole)) return { success: false, message: 'Forbidden — admin only' };

    var sh = getSheet(PARENT_STUDENTS_SHEET);
    if (!sh) return { success: false, message: 'Parent_Students sheet not found' };

    var idn = parseInt(linkId, 10);
    if (isNaN(idn)) return { success: false, message: 'Invalid id' };

    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] !== idn) continue;
      sh.deleteRow(i + 1);
      addLog(currentUser, 'Link Removed', 'Unlinked link id ' + idn + ' (parent ' + data[i][1] + ' / student ' + data[i][2] + ')');
      return { success: true, message: 'Link removed successfully' };
    }
    return { success: false, message: 'Link not found' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

function setPrimaryContact(linkId, isPrimary, currentUser, currentRole) {
  try {
    if (!isAdmin(currentRole)) return { success: false, message: 'Forbidden — admin only' };

    var sh = getSheet(PARENT_STUDENTS_SHEET);
    if (!sh) return { success: false, message: 'Parent_Students sheet not found' };

    var idn = parseInt(linkId, 10);
    if (isNaN(idn)) return { success: false, message: 'Invalid id' };

    var primary = (isPrimary === true || String(isPrimary) === '1' || String(isPrimary).toLowerCase() === 'true') ? '1' : '0';
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] !== idn) continue;
      var row = i + 1, ts = nowIso();
      sh.getRange(row, 4).setValue(primary);
      sh.getRange(row, 6).setValue(ts);
      addLog(currentUser, 'Link Updated', 'Set primary=' + primary + ' on link id ' + idn);
      return { success: true, message: primary === '1' ? 'Marked as primary contact' : 'Primary contact removed' };
    }
    return { success: false, message: 'Link not found' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// ============== Exams CRUD ==============
function rowToExam(row, umap) {
  var pubBy = row[10];
  return {
    ID: row[0],
    ExamName: row[1],
    ExamType: String(row[2] || '').toLowerCase(),
    ClassID: row[3],
    AcademicYear: row[4],
    StartDate: toIso(row[5]),
    EndDate: toIso(row[6]),
    MaxMarksPerSubject: parseInt(row[7], 10) || 100,
    IsPublished: String(row[8]) === '1' || row[8] === 1 || row[8] === true,
    PublishedAt: toIso(row[9]),
    PublishedBy: pubBy || null,
    PublishedByName: (pubBy && umap && umap[pubBy]) ? umap[pubBy].fullName : '',
    CreatedAt: toIso(row[12]),
    UpdatedAt: toIso(row[13]),
    // new cols 14-25
    Term: String(row[14] || 'term1').toLowerCase(),
    AssessmentType: String(row[15] || 'summative').toLowerCase(),
    ExamCode: row[16] || '',
    WeightagePercent: parseInt(row[17], 10) || 0,
    GradingScheme: String(row[18] || 'percentage').toLowerCase(),
    CurriculumStage: String(row[19] || 'lower_primary').toLowerCase(),
    ExamDuration: parseInt(row[20], 10) || 60,
    ResultsLockedDate: toIso(row[21]),
    PassMarksOverride: row[22] === '' || row[22] == null ? '' : (parseFloat(row[22]) || 0),
    ReportCardGenerated: String(row[23]) === '1' || row[23] === 1 || row[23] === true,
    NextExamID: row[24] === '' || row[24] == null ? null : (parseInt(row[24], 10) || null),
    ApplicableSections: row[25] || '',
    PassingPercentageRequired: row[26] === '' || row[26] == null ? '' : (parseFloat(row[26]) || 0),
    VacationDate: row[27] ? toIso(row[27]) : '',
    ReopeningDate: row[28] ? toIso(row[28]) : '',
    SbaMaxMarks: row[29] === '' || row[29] == null ? '' : (parseFloat(row[29]) || 0),
    ExamMaxMarks: row[30] === '' || row[30] == null ? '' : (parseFloat(row[30]) || 0)
  };
}

function getAllExams(currentUser, currentRole) {
  try {
    if (!canReadExams(currentRole)) return { success: false, message: 'Forbidden — no access' };

    var sh = getSheet(EXAMS_SHEET);
    if (!sh) return { success: false, message: 'Exams sheet not found' };

    var data = sh.getDataRange().getValues();
    var cmap = getClassesMap();
    var umap = getUsersMap();

    var role = String(currentRole).toLowerCase();
    var teacherClassIds = role === 'teacher' ? getTeacherClassIds(currentUser) : null;
    var scope = getViewerScope(currentUser, currentRole);

    var out = [];
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][11]) === '1') continue; // soft-deleted

      var clsId = parseInt(data[i][3], 10);

      // teacher: own class only
      if (teacherClassIds !== null && teacherClassIds.indexOf(clsId) === -1) continue;

      // student/parent: own class only + published only
      if (!scope.all && scope.classIds.indexOf(clsId) === -1) continue;
      if ((role === 'student' || role === 'parent') && !(String(data[i][8]) === '1' || data[i][8] === 1)) continue;

      var e = rowToExam(data[i], umap);
      var c = cmap[clsId];
      e.ClassLabel = c ? c.label : '— deleted class —';
      e.ClassName = c ? c.className : '';
      e.Section = c ? c.section : '';
      out.push(e);
    }
    return { success: true, data: out };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// shared exam field validator — enums, ranges, formats
function validateExamFields(d) {
  var termEnum = ['term1','term2','term3'];
  var assTypeEnum = ['summative','formative','mock','project','oral','practical'];
  var schemeEnum = ['sba_5band','bece_9grade','percentage','pass_fail'];
  var stageEnum = ['creche','nursery','kg','lower_primary','upper_primary','jhs'];

  var term = String(d.Term || 'term1').toLowerCase();
  if (termEnum.indexOf(term) === -1) return { ok: false, error: 'Term must be one of: ' + termEnum.join(', ') };

  var aType = String(d.AssessmentType || 'summative').toLowerCase();
  if (assTypeEnum.indexOf(aType) === -1) return { ok: false, error: 'AssessmentType must be one of: ' + assTypeEnum.join(', ') };

  var scheme = String(d.GradingScheme || 'sba_5band').toLowerCase();
  if (schemeEnum.indexOf(scheme) === -1) return { ok: false, error: 'GradingScheme must be one of: ' + schemeEnum.join(', ') };

  var stage = String(d.CurriculumStage || 'lower_primary').toLowerCase();
  if (stageEnum.indexOf(stage) === -1) return { ok: false, error: 'CurriculumStage must be one of: ' + stageEnum.join(', ') };

  var weight = parseInt(d.WeightagePercent, 10);
  if (isNaN(weight)) weight = 0;
  if (weight < 0 || weight > 100) return { ok: false, error: 'WeightagePercent must be 0-100' };

  var duration = parseInt(d.ExamDuration, 10);
  if (isNaN(duration) || duration < 0) duration = 60;
  if (duration > 600) return { ok: false, error: 'ExamDuration max 600 minutes' };

  var code = String(d.ExamCode || '').trim().toUpperCase();
  if (code.length > 30) return { ok: false, error: 'ExamCode max 30 chars' };

  var lockedDate = String(d.ResultsLockedDate || '').trim();
  if (lockedDate && !/^\d{4}-\d{2}-\d{2}$/.test(lockedDate)) return { ok: false, error: 'ResultsLockedDate must be YYYY-MM-DD' };

  var passOverride = '';
  if (d.PassMarksOverride !== '' && d.PassMarksOverride != null) {
    var po = parseFloat(d.PassMarksOverride);
    if (isNaN(po) || po < 0) return { ok: false, error: 'PassMarksOverride must be ≥ 0' };
    passOverride = po;
  }

  var rcGen = (d.ReportCardGenerated === true || String(d.ReportCardGenerated) === '1' || String(d.ReportCardGenerated).toLowerCase() === 'true') ? '1' : '0';

  var nextEx = '';
  if (d.NextExamID !== '' && d.NextExamID != null) {
    var nid = parseInt(d.NextExamID, 10);
    if (isNaN(nid)) return { ok: false, error: 'NextExamID must be an integer' };
    nextEx = nid;
  }

  var sections = String(d.ApplicableSections || '').trim();
  if (sections.length > 200) return { ok: false, error: 'ApplicableSections max 200 chars' };

  var passPctRequired = '';
  if (d.PassingPercentageRequired !== '' && d.PassingPercentageRequired != null) {
    var pp = parseFloat(d.PassingPercentageRequired);
    if (isNaN(pp) || pp < 0 || pp > 100) return { ok: false, error: 'PassingPercentageRequired must be 0..100' };
    passPctRequired = pp;
  }

  var vacationDate = String(d.VacationDate || '').trim();
  if (vacationDate && !/^\d{4}-\d{2}-\d{2}$/.test(vacationDate)) return { ok: false, error: 'VacationDate must be YYYY-MM-DD' };
  var reopeningDate = String(d.ReopeningDate || '').trim();
  if (reopeningDate && !/^\d{4}-\d{2}-\d{2}$/.test(reopeningDate)) return { ok: false, error: 'ReopeningDate must be YYYY-MM-DD' };

  // end_of_term exams split MaxMarksPerSubject into a class-score (SBA) component and an
  // exam-paper component (e.g. 50+50 or 40+60) — the two must add up to MaxMarksPerSubject.
  // Other exam types (class_test/mid_term/mock) are a single score and leave these blank.
  var examType = String(d.ExamType || '').toLowerCase();
  var sbaMax = '', examMax = '';
  if (examType === 'end_of_term') {
    sbaMax = parseFloat(d.SbaMaxMarks);
    examMax = parseFloat(d.ExamMaxMarks);
    if (isNaN(sbaMax) || sbaMax <= 0) return { ok: false, error: 'SbaMaxMarks (class score) must be a positive number' };
    if (isNaN(examMax) || examMax <= 0) return { ok: false, error: 'ExamMaxMarks (exam paper) must be a positive number' };
    var wantMax = parseInt(d.MaxMarksPerSubject, 10) || (sbaMax + examMax);
    if (Math.round(sbaMax + examMax) !== wantMax) return { ok: false, error: 'SbaMaxMarks + ExamMaxMarks must equal MaxMarksPerSubject (' + wantMax + ')' };
  }

  return {
    ok: true,
    normalized: {
      term: term, assessmentType: aType, examCode: code, weightagePercent: weight,
      gradingScheme: scheme, curriculumStage: stage, examDuration: duration,
      resultsLockedDate: toIso(lockedDate), passMarksOverride: passOverride,
      reportCardGenerated: rcGen, nextExamID: nextEx, applicableSections: sections,
      passingPercentageRequired: passPctRequired,
      vacationDate: vacationDate, reopeningDate: reopeningDate,
      sbaMaxMarks: sbaMax, examMaxMarks: examMax
    }
  };
}

function addExam(data, currentUser, currentRole) {
  try {
    if (!isAdmin(currentRole)) return { success: false, message: 'Forbidden — admin only' };

    var sh = getSheet(EXAMS_SHEET);
    if (!sh) return { success: false, message: 'Exams sheet not found' };

    if (!data.ExamName || !data.ExamType || !data.ClassID || !data.AcademicYear || !data.StartDate || !data.EndDate) {
      return { success: false, message: 'ExamName, ExamType, ClassID, AcademicYear, StartDate, EndDate are required' };
    }
    var allowedTypes = ['class_test','mid_term','end_of_term','mock','other'];
    var t = String(data.ExamType).toLowerCase();
    if (allowedTypes.indexOf(t) === -1) return { success: false, message: 'Invalid exam type' };
    if (!validAcademicYear(data.AcademicYear)) return { success: false, message: 'AcademicYear must be YYYY-YYYY' };

    var cid = parseInt(data.ClassID, 10);
    if (isNaN(cid)) return { success: false, message: 'Invalid ClassID' };
    var cmap = getClassesMap();
    if (!cmap[cid]) return { success: false, message: 'Selected class does not exist or is deleted' };

    if (new Date(data.StartDate) > new Date(data.EndDate)) {
      return { success: false, message: 'EndDate must be on or after StartDate' };
    }
    var max = parseInt(data.MaxMarksPerSubject, 10);
    if (isNaN(max) || max < 1) {
      // end_of_term derives its total from Sba+Exam if MaxMarksPerSubject wasn't sent
      var sbaGuess = parseFloat(data.SbaMaxMarks), examGuess = parseFloat(data.ExamMaxMarks);
      max = (t === 'end_of_term' && !isNaN(sbaGuess) && !isNaN(examGuess)) ? Math.round(sbaGuess + examGuess) : 100;
    }
    data.MaxMarksPerSubject = max;

    // new field validation
    var v = validateExamFields(data);
    if (!v.ok) return { success: false, message: v.error };
    var n = v.normalized;

    var ts = nowIso(), id = nextExamId(sh);
    sh.appendRow([
      id,
      String(data.ExamName).trim(),
      t,
      cid,
      String(data.AcademicYear).trim(),
      toIso(data.StartDate),
      toIso(data.EndDate),
      max,
      '0',         // is_published
      '',          // published_at
      '',          // published_by
      '0',         // is_deleted
      ts, ts,
      // new 12 cols
      n.term, n.assessmentType, n.examCode, n.weightagePercent,
      n.gradingScheme, n.curriculumStage, n.examDuration, n.resultsLockedDate,
      n.passMarksOverride, n.reportCardGenerated, n.nextExamID, n.applicableSections,
      // 26 — passing % required
      n.passingPercentageRequired,
      // 27-28 — vacation / reopening dates
      toIso(n.vacationDate), toIso(n.reopeningDate),
      // 29-30 — SBA / exam-paper max marks (end_of_term only)
      n.sbaMaxMarks, n.examMaxMarks
    ]);

    addLog(currentUser, 'Exam Added', 'Added: ' + data.ExamName + ' (' + t + ') -> ' + cmap[cid].label);
    return { success: true, message: 'Exam added successfully', id: id };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

function updateExam(id, data, currentUser, currentRole) {
  try {
    if (!isAdmin(currentRole)) return { success: false, message: 'Forbidden — admin only' };

    var sh = getSheet(EXAMS_SHEET);
    if (!sh) return { success: false, message: 'Exams sheet not found' };
    var idn = parseInt(id, 10);
    if (isNaN(idn)) return { success: false, message: 'Invalid id' };

    if (!data.ExamName || !data.ExamType || !data.ClassID || !data.AcademicYear || !data.StartDate || !data.EndDate) {
      return { success: false, message: 'Required fields missing' };
    }
    var allowedTypes = ['class_test','mid_term','end_of_term','mock','other'];
    var t = String(data.ExamType).toLowerCase();
    if (allowedTypes.indexOf(t) === -1) return { success: false, message: 'Invalid exam type' };
    if (!validAcademicYear(data.AcademicYear)) return { success: false, message: 'AcademicYear must be YYYY-YYYY' };

    var cid = parseInt(data.ClassID, 10);
    if (isNaN(cid)) return { success: false, message: 'Invalid ClassID' };
    var cmap = getClassesMap();
    if (!cmap[cid]) return { success: false, message: 'Selected class does not exist or is deleted' };

    if (new Date(data.StartDate) > new Date(data.EndDate)) {
      return { success: false, message: 'EndDate must be on or after StartDate' };
    }
    var max = parseInt(data.MaxMarksPerSubject, 10);
    if (isNaN(max) || max < 1) {
      var sbaGuess2 = parseFloat(data.SbaMaxMarks), examGuess2 = parseFloat(data.ExamMaxMarks);
      max = (t === 'end_of_term' && !isNaN(sbaGuess2) && !isNaN(examGuess2)) ? Math.round(sbaGuess2 + examGuess2) : 100;
    }
    data.MaxMarksPerSubject = max;

    // new field validation
    var v = validateExamFields(data);
    if (!v.ok) return { success: false, message: v.error };
    var n = v.normalized;

    var rows = sh.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] !== idn || String(rows[i][11]) === '1') continue;
      var row = i + 1, ts = nowIso();
      sh.getRange(row, 2).setValue(String(data.ExamName).trim());
      sh.getRange(row, 3).setValue(t);
      sh.getRange(row, 4).setValue(cid);
      sh.getRange(row, 5).setValue(String(data.AcademicYear).trim());
      sh.getRange(row, 6).setValue(toIso(data.StartDate));
      sh.getRange(row, 7).setValue(toIso(data.EndDate));
      sh.getRange(row, 8).setValue(max);
      sh.getRange(row, 14).setValue(ts);
      // new cols 15-26
      sh.getRange(row, 15).setValue(n.term);
      sh.getRange(row, 16).setValue(n.assessmentType);
      sh.getRange(row, 17).setValue(n.examCode);
      sh.getRange(row, 18).setValue(n.weightagePercent);
      sh.getRange(row, 19).setValue(n.gradingScheme);
      sh.getRange(row, 20).setValue(n.curriculumStage);
      sh.getRange(row, 21).setValue(n.examDuration);
      sh.getRange(row, 22).setValue(n.resultsLockedDate);
      sh.getRange(row, 23).setValue(n.passMarksOverride);
      sh.getRange(row, 24).setValue(n.reportCardGenerated);
      sh.getRange(row, 25).setValue(n.nextExamID);
      sh.getRange(row, 26).setValue(n.applicableSections);
      sh.getRange(row, 27).setValue(n.passingPercentageRequired);
      sh.getRange(row, 28).setValue(toIso(n.vacationDate));
      sh.getRange(row, 29).setValue(toIso(n.reopeningDate));
      sh.getRange(row, 30).setValue(n.sbaMaxMarks);
      sh.getRange(row, 31).setValue(n.examMaxMarks);
      addLog(currentUser, 'Exam Updated', 'Updated id ' + idn + ': ' + data.ExamName);
      return { success: true, message: 'Exam updated successfully' };
    }
    return { success: false, message: 'Exam not found' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

function deleteExam(id, currentUser, currentRole) {
  try {
    if (!isAdmin(currentRole)) return { success: false, message: 'Forbidden — admin only' };
    var sh = getSheet(EXAMS_SHEET);
    if (!sh) return { success: false, message: 'Exams sheet not found' };
    var idn = parseInt(id, 10);
    if (isNaN(idn)) return { success: false, message: 'Invalid id' };
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] !== idn || String(data[i][11]) === '1') continue;
      var row = i + 1, ts = nowIso();
      sh.getRange(row, 12).setValue('1');
      sh.getRange(row, 14).setValue(ts);
      addLog(currentUser, 'Exam Deleted', 'Soft-deleted exam id ' + idn);
      return { success: true, message: 'Exam deleted successfully' };
    }
    return { success: false, message: 'Exam not found' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

function publishExam(id, currentUser, currentRole) {
  try {
    if (!isAdmin(currentRole)) return { success: false, message: 'Forbidden — admin only' };
    var sh = getSheet(EXAMS_SHEET);
    if (!sh) return { success: false, message: 'Exams sheet not found' };
    var idn = parseInt(id, 10);
    if (isNaN(idn)) return { success: false, message: 'Invalid id' };
    var pubById = getCurrentUserId(currentUser);
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] !== idn || String(data[i][11]) === '1') continue;
      var row = i + 1, ts = nowIso();
      sh.getRange(row, 9).setValue('1');
      sh.getRange(row, 10).setValue(ts);
      sh.getRange(row, 11).setValue(pubById || '');
      sh.getRange(row, 14).setValue(ts);
      addLog(currentUser, 'Exam Published', 'Published exam id ' + idn);
      return { success: true, message: 'Exam published — marks now visible to students/parents and locked for teachers' };
    }
    return { success: false, message: 'Exam not found' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

function unpublishExam(id, currentUser, currentRole) {
  try {
    if (!isAdmin(currentRole)) return { success: false, message: 'Forbidden — admin only' };
    var sh = getSheet(EXAMS_SHEET);
    if (!sh) return { success: false, message: 'Exams sheet not found' };
    var idn = parseInt(id, 10);
    if (isNaN(idn)) return { success: false, message: 'Invalid id' };
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] !== idn || String(data[i][11]) === '1') continue;
      var row = i + 1, ts = nowIso();
      sh.getRange(row, 9).setValue('0');
      sh.getRange(row, 10).setValue('');
      sh.getRange(row, 11).setValue('');
      sh.getRange(row, 14).setValue(ts);
      addLog(currentUser, 'Exam Unpublished', 'Unpublished exam id ' + idn);
      return { success: true, message: 'Exam unpublished — teachers can edit marks again' };
    }
    return { success: false, message: 'Exam not found' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// ============== Marks CRUD (bulk-oriented) ==============
// returns: { exam, subject, students[], marks{ studentId: row }, canEdit }
function getMarksForExamSubject(examId, subjectId, currentUser, currentRole) {
  try {
    if (!canReadMarks(currentRole)) return { success: false, message: 'Forbidden — no access' };

    var examRow = getExamRow(examId);
    if (!examRow) return { success: false, message: 'Exam not found or deleted' };
    var examClassId = parseInt(examRow[3], 10);
    var isPublished = String(examRow[8]) === '1' || examRow[8] === 1;

    var sub = parseInt(subjectId, 10);
    var smap = getSubjectsMap();
    if (!smap[sub]) return { success: false, message: 'Subject not found or deleted' };
    if (parseInt(smap[sub].classId, 10) !== examClassId) {
      return { success: false, message: 'Subject does not belong to the exam\'s class' };
    }

    var role = String(currentRole).toLowerCase();
    var teacherUserId = role === 'teacher' ? getCurrentUserId(currentUser) : null;
    var canEdit = false;

    if (role === 'admin') {
      canEdit = true;
    } else if (role === 'teacher') {
      var asgMap = getTeacherAssignmentsMap(teacherUserId);
      var hasAssignment = asgMap[examClassId + '|' + sub] === true;
      canEdit = hasAssignment && !isPublished;
      if (!hasAssignment) return { success: false, message: 'You are not assigned to this class+subject' };
    }
    // supervisor → read-only; student/parent → read-only + scoped to own class + own row + published only
    var scope = getViewerScope(currentUser, currentRole);
    if (!scope.all) {
      if (scope.classIds.indexOf(examClassId) === -1) return { success: false, message: 'Forbidden — own class only' };
      if ((role === 'student' || role === 'parent') && !isPublished) return { success: false, message: 'Marks not published yet' };
    }

    // pull students of exam.class
    var ssh = getSheet(STUDENTS_SHEET);
    if (!ssh) return { success: false, message: 'Students sheet not found' };
    var sdata = ssh.getDataRange().getValues(), students = [];
    for (var i = 1; i < sdata.length; i++) {
      if (String(sdata[i][36]) === '1') continue;
      if (parseInt(sdata[i][25], 10) !== examClassId) continue;
      if (!scope.all && scope.studentIds.indexOf(parseInt(sdata[i][0], 10)) === -1) continue;
      var stat = String(sdata[i][35] || '').toLowerCase();
      if (stat === 'transferred' || stat === 'passed_out') continue;
      students.push({
        ID: sdata[i][0],
        AdmissionNumber: sdata[i][1],
        FullName: [sdata[i][2], sdata[i][3], sdata[i][4]].filter(function(x){ return x; }).join(' '),
        RollNumber: sdata[i][26],
        PhotoURL: sdata[i][33] || ''
      });
    }
    students.sort(function(a, b) { return String(a.RollNumber).localeCompare(String(b.RollNumber), undefined, { numeric: true }); });

    // pull existing marks for this exam+subject
    var msh = getSheet(MARKS_SHEET);
    var mdata = msh ? msh.getDataRange().getValues() : [];
    var byStudent = {};
    for (var j = 1; j < mdata.length; j++) {
      if (parseInt(mdata[j][1], 10) !== parseInt(examId, 10)) continue;
      if (parseInt(mdata[j][3], 10) !== sub) continue;
      if (!scope.all && scope.studentIds.indexOf(parseInt(mdata[j][2], 10)) === -1) continue;
      byStudent[parseInt(mdata[j][2], 10)] = {
        ID: mdata[j][0],
        MarksObtained: parseFloat(mdata[j][4]) || 0,
        MaxMarks: parseFloat(mdata[j][5]) || 100,
        Grade: mdata[j][6] || '',
        IsAbsent: String(mdata[j][7]) === '1' || mdata[j][7] === 1,
        Remarks: mdata[j][8] || '',
        EnteredBy: mdata[j][9] || '',
        // new cols 12-23
        TheoryMarks: parseFloat(mdata[j][12]) || 0,
        PracticalMarks: parseFloat(mdata[j][13]) || 0,
        InternalMarks: parseFloat(mdata[j][14]) || 0,
        ExternalMarks: parseFloat(mdata[j][15]) || 0,
        PercentageScored: parseFloat(mdata[j][16]) || 0,
        GradePoints: parseFloat(mdata[j][17]) || 0,
        AttemptNumber: parseInt(mdata[j][18], 10) || 1,
        Status: String(mdata[j][19] || 'submitted').toLowerCase(),
        IsModerated: String(mdata[j][20]) === '1' || mdata[j][20] === 1 || mdata[j][20] === true,
        ModeratedBy: mdata[j][21] === '' || mdata[j][21] == null ? null : (parseInt(mdata[j][21], 10) || null),
        ModerationDate: toIso(mdata[j][22]),
        Comments: mdata[j][23] || '',
        Rank: mdata[j][24] === '' || mdata[j][24] == null ? '' : (parseInt(mdata[j][24], 10) || ''),
        OriginalMarks: mdata[j][25] === '' || mdata[j][25] == null ? '' : (parseFloat(mdata[j][25]) || 0)
      };
    }

    return {
      success: true,
      data: {
        exam: {
          ID: examRow[0],
          ExamName: examRow[1],
          ExamType: String(examRow[2] || '').toLowerCase(),
          ClassID: examClassId,
          AcademicYear: examRow[4],
          MaxMarksPerSubject: parseInt(examRow[7], 10) || 100,
          IsPublished: isPublished
        },
        subject: {
          ID: sub,
          SubjectName: smap[sub].subjectName,
          SubjectCode: smap[sub].subjectCode,
          MaxMarks: smap[sub].maxMarks
        },
        students: students,
        marks: byStudent,
        canEdit: canEdit,
        publishedLock: isPublished && role !== 'admin'
      }
    };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// shared mark field validator — splits, status, moderation
function validateMarkFields(d, maxMarks) {
  var statusEnum = ['draft','submitted','moderated','locked','published'];

  // tolerate both camelCase (frontend bulk payload) and PascalCase keys
  if (d.theoryMarks != null && d.TheoryMarks == null) d.TheoryMarks = d.theoryMarks;
  if (d.practicalMarks != null && d.PracticalMarks == null) d.PracticalMarks = d.practicalMarks;
  if (d.internalMarks != null && d.InternalMarks == null) d.InternalMarks = d.internalMarks;
  if (d.externalMarks != null && d.ExternalMarks == null) d.ExternalMarks = d.externalMarks;
  if (d.percentageScored != null && d.PercentageScored == null) d.PercentageScored = d.percentageScored;
  if (d.gradePoints != null && d.GradePoints == null) d.GradePoints = d.gradePoints;
  if (d.attemptNumber != null && d.AttemptNumber == null) d.AttemptNumber = d.attemptNumber;
  if (d.status != null && d.Status == null) d.Status = d.status;
  if (d.isModerated != null && d.IsModerated == null) d.IsModerated = d.isModerated;
  if (d.moderatedBy != null && d.ModeratedBy == null) d.ModeratedBy = d.moderatedBy;
  if (d.moderationDate != null && d.ModerationDate == null) d.ModerationDate = d.moderationDate;
  if (d.comments != null && d.Comments == null) d.Comments = d.comments;

  var theory = parseFloat(d.TheoryMarks);
  if (isNaN(theory) || theory < 0) theory = 0;
  var practical = parseFloat(d.PracticalMarks);
  if (isNaN(practical) || practical < 0) practical = 0;
  var internal = parseFloat(d.InternalMarks);
  if (isNaN(internal) || internal < 0) internal = 0;
  var external = parseFloat(d.ExternalMarks);
  if (isNaN(external) || external < 0) external = 0;

  var maxN = parseFloat(maxMarks) || 100;
  if (theory > 0 && practical > 0 && (theory + practical) > maxN + 0.01) {
    return { ok: false, error: 'Theory (' + theory + ') + Practical (' + practical + ') exceeds MaxMarks (' + maxN + ')' };
  }
  if (internal > 0 && external > 0 && (internal + external) > maxN + 0.01) {
    return { ok: false, error: 'Internal (' + internal + ') + External (' + external + ') exceeds MaxMarks (' + maxN + ')' };
  }

  // PercentageScored — accept if provided, else compute from MarksObtained/MaxMarks server-side later
  var pct = parseFloat(d.PercentageScored);
  if (isNaN(pct)) pct = 0;
  if (pct < 0) pct = 0;
  if (pct > 100) pct = 100;

  var gp = parseFloat(d.GradePoints);
  if (isNaN(gp) || gp < 0) gp = 0;
  if (gp > 10) gp = 10;  // sanity cap (covers cgpa_10 + ib_7)

  var attempt = parseInt(d.AttemptNumber, 10);
  if (isNaN(attempt) || attempt < 1) attempt = 1;
  if (attempt > 3) return { ok: false, error: 'AttemptNumber max 3' };

  var status = String(d.Status || 'submitted').toLowerCase();
  if (statusEnum.indexOf(status) === -1) return { ok: false, error: 'Status must be one of: ' + statusEnum.join(', ') };

  var moderated = (d.IsModerated === true || String(d.IsModerated) === '1') ? '1' : '0';

  var modBy = '';
  if (d.ModeratedBy !== '' && d.ModeratedBy != null) {
    var mb = parseInt(d.ModeratedBy, 10);
    if (!isNaN(mb)) modBy = mb;
  }

  var modDate = String(d.ModerationDate || '').trim();
  if (modDate && !/^\d{4}-\d{2}-\d{2}$/.test(modDate)) return { ok: false, error: 'ModerationDate must be YYYY-MM-DD' };

  var comments = String(d.Comments || '').trim();
  if (comments.length > 500) return { ok: false, error: 'Comments max 500 chars' };

  return {
    ok: true,
    normalized: {
      theory: theory, practical: practical, internal: internal, external: external,
      percentage: pct, gradePoints: gp, attempt: attempt, status: status,
      moderated: moderated, moderatedBy: modBy, moderationDate: toIso(modDate), comments: comments
    }
  };
}

// bulk upsert: entries = [{ studentId, marksObtained, isAbsent, remarks, ...new fields }, ...]
function bulkSaveMarks(examId, subjectId, entries, currentUser, currentRole) {
  try {
    var role = String(currentRole).toLowerCase();
    if (role !== 'admin' && role !== 'teacher') return { success: false, message: 'Forbidden — admin or teacher only' };

    var sh = getSheet(MARKS_SHEET);
    if (!sh) return { success: false, message: 'Marks sheet not found' };

    var examRow = getExamRow(examId);
    if (!examRow) return { success: false, message: 'Exam not found or deleted' };
    var examClassId = parseInt(examRow[3], 10);
    var isPublished = String(examRow[8]) === '1' || examRow[8] === 1;

    var sub = parseInt(subjectId, 10);
    var smap = getSubjectsMap();
    if (!smap[sub]) return { success: false, message: 'Subject not found' };
    if (parseInt(smap[sub].classId, 10) !== examClassId) return { success: false, message: 'Subject does not belong to exam class' };

    var enteredBy = getCurrentUserId(currentUser);
    if (!enteredBy) return { success: false, message: 'Could not resolve current user' };

    if (role === 'teacher') {
      if (isPublished) return { success: false, message: 'Cannot edit marks — exam is published. Ask admin to unpublish first.' };
      var asgMap = getTeacherAssignmentsMap(enteredBy);
      if (!asgMap[examClassId + '|' + sub]) {
        return { success: false, message: 'You are not assigned to this class+subject' };
      }
    }

    var maxMarks = parseFloat(smap[sub].maxMarks) || parseInt(examRow[7], 10) || 100;
    var gradeBand = (getClassesMap()[examClassId] || {}).gradeBand || 'basic';
    var inserted = 0, updated = 0;
    var ts = nowIso();

    for (var i = 0; i < entries.length; i++) {
      var e = entries[i];
      var sid = parseInt(e.studentId, 10);
      if (isNaN(sid)) continue;

      var isAbsent = (e.isAbsent === true || String(e.isAbsent) === '1' || String(e.isAbsent).toLowerCase() === 'true') ? '1' : '0';
      var obtained = isAbsent === '1' ? 0 : parseFloat(e.marksObtained);
      if (isAbsent === '0') {
        if (isNaN(obtained) || obtained < 0) obtained = 0;
        if (obtained > maxMarks) obtained = maxMarks;
      }
      var grade = computeGrade(obtained, maxMarks, isAbsent === '1', gradeBand);
      // Remarks is always auto-generated from the grade — never taken from client input
      var remarks = isAbsent === '1' ? 'Absent' : sbaGradeDescriptor(grade, gradeBand);

      // validate new fields (defaults via validator if missing)
      var mv = validateMarkFields(e, maxMarks);
      if (!mv.ok) return { success: false, message: 'Row for student ' + sid + ': ' + mv.error };
      var n = mv.normalized;

      // compute pct server-side if not provided (or zeroed)
      var providedPct = parseFloat(e.PercentageScored);
      if (isNaN(providedPct) || providedPct === 0) {
        n.percentage = (isAbsent === '1' || maxMarks <= 0) ? 0 : Math.round((obtained / maxMarks) * 10000) / 100;
      }

      var existingIdx = markUniqueExists(sh, examId, sid, sub);
      if (existingIdx !== -1) {
        var rowNum = existingIdx + 1;
        // preserve OriginalMarks: if blank (legacy), backfill with current value before overwriting MarksObtained
        var origVal = sh.getRange(rowNum, 26).getValue();
        if (origVal === '' || origVal === null) {
          var preObt = sh.getRange(rowNum, 5).getValue();
          sh.getRange(rowNum, 26).setValue(preObt === '' || preObt === null ? obtained : preObt);
        }
        sh.getRange(rowNum, 5).setValue(obtained);
        sh.getRange(rowNum, 6).setValue(maxMarks);
        sh.getRange(rowNum, 7).setValue(grade);
        sh.getRange(rowNum, 8).setValue(isAbsent);
        sh.getRange(rowNum, 9).setValue(remarks);
        sh.getRange(rowNum, 12).setValue(ts);
        // entered_by preserved on update
        // new cols 13-24
        sh.getRange(rowNum, 13).setValue(n.theory);
        sh.getRange(rowNum, 14).setValue(n.practical);
        sh.getRange(rowNum, 15).setValue(n.internal);
        sh.getRange(rowNum, 16).setValue(n.external);
        sh.getRange(rowNum, 17).setValue(n.percentage);
        sh.getRange(rowNum, 18).setValue(n.gradePoints);
        sh.getRange(rowNum, 19).setValue(n.attempt);
        sh.getRange(rowNum, 20).setValue(n.status);
        sh.getRange(rowNum, 21).setValue(n.moderated);
        sh.getRange(rowNum, 22).setValue(n.moderatedBy);
        sh.getRange(rowNum, 23).setValue(n.moderationDate);
        sh.getRange(rowNum, 24).setValue(n.comments);
        // Rank (col 25) computed separately by computeMarkRanks
        updated++;
      } else {
        var id = nextMarkId(sh);
        sh.appendRow([
          id, parseInt(examId, 10), sid, sub,
          obtained, maxMarks, grade, isAbsent, remarks,
          enteredBy, ts, ts,
          // new 12 cols
          n.theory, n.practical, n.internal, n.external,
          n.percentage, n.gradePoints, n.attempt, n.status,
          n.moderated, n.moderatedBy, n.moderationDate, n.comments,
          '',                  // Rank — computed post-hoc via computeMarkRanks
          obtained             // OriginalMarks — audit snapshot (first write)
        ]);
        inserted++;
      }
    }

    addLog(currentUser, 'Marks Saved', 'Exam ' + examId + ' / Subject ' + sub + ': ' + inserted + ' new, ' + updated + ' updated');
    return { success: true, message: 'Saved: ' + inserted + ' new, ' + updated + ' updated', inserted: inserted, updated: updated };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// recompute Rank (col 25, 1-indexed) for all marks of one exam+subject — descending by MarksObtained, absent rows get '' rank
function computeMarkRanks(examId, subjectId, currentUser, currentRole) {
  try {
    var role = String(currentRole || '').toLowerCase();
    if (role !== 'admin' && role !== 'teacher') return { success: false, message: 'Forbidden' };
    var sh = getSheet(MARKS_SHEET);
    if (!sh) return { success: false, message: 'Marks sheet not found' };
    var data = sh.getDataRange().getValues();
    var ex = parseInt(examId, 10), sub = parseInt(subjectId, 10);
    var rows = [];
    for (var i = 1; i < data.length; i++) {
      if (parseInt(data[i][1], 10) !== ex) continue;
      if (parseInt(data[i][3], 10) !== sub) continue;
      rows.push({ rowIdx: i, marks: parseFloat(data[i][4]) || 0, absent: String(data[i][7]) === '1' });
    }
    rows.sort(function(a, b){ return b.marks - a.marks; });
    var lastMarks = null, lastRank = 0, count = 0;
    rows.forEach(function(r){
      count++;
      if (r.absent) {
        sh.getRange(r.rowIdx + 1, 25).setValue('');
        return;
      }
      if (lastMarks !== null && r.marks === lastMarks) {
        // tie — same rank
      } else {
        lastRank = count;
        lastMarks = r.marks;
      }
      sh.getRange(r.rowIdx + 1, 25).setValue(lastRank);
    });
    return { success: true, message: 'Ranks computed for ' + count + ' rows' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// ============== Attendance CRUD (JSON-blob, daily + subject-wise) ==============

// helpers — parse + serialize the JSON statuses blob
function parseAttendanceJson(s) {
  if (!s) return {};
  if (typeof s === 'object') return s;
  try { var o = JSON.parse(String(s)); return (o && typeof o === 'object') ? o : {}; }
  catch (e) { return {}; }
}
function serializeAttendanceJson(obj) {
  return JSON.stringify(obj || {});
}
function isValidAttendanceMode(m) { return m === 'daily' || m === 'subject_wise'; }
function isValidAttendanceStatus(s) {
  return ['present','absent','late','half_day','leave'].indexOf(String(s || '').toLowerCase()) !== -1;
}

// find row index matching the composite key (returns 0-indexed in data, -1 if not found)
function findAttendanceRowIdx(data, classId, dateIso, mode, subjectId, periodNumber) {
  var cid = parseInt(classId, 10);
  var dateOnly = toIso(dateIso).split('T')[0];
  var m = String(mode || 'daily').toLowerCase();
  var sid = subjectId === '' || subjectId == null ? '' : parseInt(subjectId, 10);
  var pn = periodNumber === '' || periodNumber == null ? '' : parseInt(periodNumber, 10);

  for (var i = 1; i < data.length; i++) {
    if (parseInt(data[i][1], 10) !== cid) continue;
    if (toIso(data[i][2]).split('T')[0] !== dateOnly) continue;
    if (String(data[i][3] || 'daily').toLowerCase() !== m) continue;
    var rowSubj = data[i][4] === '' || data[i][4] == null ? '' : parseInt(data[i][4], 10);
    var rowPeriod = data[i][5] === '' || data[i][5] == null ? '' : parseInt(data[i][5], 10);
    if (rowSubj !== sid) continue;
    if (rowPeriod !== pn) continue;
    return i;
  }
  return -1;
}

// returns: { class, date, mode, subjectId, periodNumber, students[], attendance{ studentId: {Status, Remarks} }, canEdit, isToday }
function getAttendanceForClassDate(classId, date, mode, subjectId, periodNumber, currentUser, currentRole) {
  try {
    if (!canReadAttendance(currentRole)) return { success: false, message: 'Forbidden — no access' };

    var cid = parseInt(classId, 10);
    if (isNaN(cid)) return { success: false, message: 'Invalid class id' };
    var cmap = getClassesMap();
    if (!cmap[cid]) return { success: false, message: 'Class not found or deleted' };

    var _scope = getViewerScope(currentUser, currentRole);
    if (!_scope.all && _scope.classIds.indexOf(cid) === -1) return { success: false, message: 'Forbidden — own class only' };

    if (!date) return { success: false, message: 'Date is required' };
    var dateOnly = toIso(date).split('T')[0];

    var m = String(mode || 'daily').toLowerCase();
    if (!isValidAttendanceMode(m)) return { success: false, message: 'Invalid mode (use daily or subject_wise)' };

    var sid = '', pn = '';
    if (m === 'subject_wise') {
      sid = subjectId === '' || subjectId == null ? '' : parseInt(subjectId, 10);
      pn = periodNumber === '' || periodNumber == null ? '' : parseInt(periodNumber, 10);
      if (sid === '' || isNaN(sid)) return { success: false, message: 'SubjectID required for subject_wise mode' };
      if (pn === '' || isNaN(pn)) return { success: false, message: 'PeriodNumber required for subject_wise mode' };
      // verify subject belongs to this class
      var smap = getSubjectsMap();
      if (!smap[sid] || parseInt(smap[sid].classId, 10) !== cid) {
        return { success: false, message: 'Subject does not belong to this class' };
      }
    }

    var role = String(currentRole).toLowerCase();
    var canEdit = false;

    if (role === 'admin') {
      canEdit = true;
    } else if (role === 'teacher') {
      var teacherClasses = getTeacherClassIds(currentUser);
      if (teacherClasses.indexOf(cid) === -1) {
        return { success: false, message: 'You are not assigned to any teacher_assignment in this class' };
      }
      // for subject mode, teacher must be assigned to teach this subject in this class
      if (m === 'subject_wise') {
        var tid = getCurrentUserId(currentUser);
        var asgMap = getTeacherAssignmentsMap(tid);
        if (!asgMap[cid + '|' + sid]) {
          return { success: false, message: 'You are not assigned to teach this subject in this class' };
        }
      }
      canEdit = isDateToday(dateOnly);
    } else if (role === 'supervisor') {
      canEdit = true;
    }

    // active students
    var ssh = getSheet(STUDENTS_SHEET);
    if (!ssh) return { success: false, message: 'Students sheet not found' };
    var sdata = ssh.getDataRange().getValues(), students = [];
    for (var i = 1; i < sdata.length; i++) {
      if (String(sdata[i][36]) === '1') continue;
      if (parseInt(sdata[i][25], 10) !== cid) continue;
      var stat = String(sdata[i][35] || '').toLowerCase();
      if (stat === 'transferred' || stat === 'passed_out') continue;
      students.push({
        ID: sdata[i][0],
        AdmissionNumber: sdata[i][1],
        FullName: [sdata[i][2], sdata[i][3], sdata[i][4]].filter(function(x){ return x; }).join(' '),
        RollNumber: sdata[i][26],
        PhotoURL: sdata[i][33] || ''
      });
    }
    students.sort(function(a, b) { return String(a.RollNumber).localeCompare(String(b.RollNumber), undefined, { numeric: true }); });

    // find the row
    var ash = getSheet(ATTENDANCE_SHEET);
    var byStudent = {};
    var isLocked = false, lockedAt = '';
    if (ash) {
      var adata = ash.getDataRange().getValues();
      var idx = findAttendanceRowIdx(adata, cid, dateOnly, m, sid, pn);
      if (idx !== -1) {
        var jsonObj = parseAttendanceJson(adata[idx][6]);
        Object.keys(jsonObj).forEach(function(k) {
          var entry = jsonObj[k] || {};
          byStudent[parseInt(k, 10)] = {
            Status: String(entry.status || '').toLowerCase(),
            Remarks: entry.remarks || ''
          };
        });
        isLocked = String(adata[idx][13]) === '1';
        lockedAt = toIso(adata[idx][14]);
      }
    }
    if (isLocked && role !== 'admin') canEdit = false;

    return {
      success: true,
      data: {
        class: { ID: cid, Label: cmap[cid].label },
        date: dateOnly,
        mode: m,
        subjectId: sid,
        periodNumber: pn,
        students: students,
        attendance: byStudent,
        canEdit: canEdit,
        isToday: isDateToday(dateOnly),
        isLocked: isLocked,
        lockedAt: lockedAt
      }
    };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// bulk upsert — single JSON row per (class, date, mode, subject, period)
// entries = [{ studentId, status, remarks }, ...]
function bulkSaveAttendance(classId, date, mode, subjectId, periodNumber, entries, currentUser, currentRole) {
  try {
    var role = String(currentRole).toLowerCase();
    if (role !== 'admin' && role !== 'teacher' && role !== 'supervisor') return { success: false, message: 'Forbidden — admin/supervisor/teacher only' };

    var sh = getSheet(ATTENDANCE_SHEET);
    if (!sh) return { success: false, message: 'Attendance sheet not found. Run setup() first.' };

    var cid = parseInt(classId, 10);
    if (isNaN(cid)) return { success: false, message: 'Invalid class id' };
    var cmap = getClassesMap();
    if (!cmap[cid]) return { success: false, message: 'Class not found' };

    if (!date) return { success: false, message: 'Date is required' };
    var dateOnly = toIso(date).split('T')[0];
    var dateIso = toIso(date);

    var m = String(mode || 'daily').toLowerCase();
    if (!isValidAttendanceMode(m)) return { success: false, message: 'Invalid mode' };

    var sid = '', pn = '';
    if (m === 'subject_wise') {
      sid = subjectId === '' || subjectId == null ? '' : parseInt(subjectId, 10);
      pn = periodNumber === '' || periodNumber == null ? '' : parseInt(periodNumber, 10);
      if (sid === '' || isNaN(sid)) return { success: false, message: 'SubjectID required for subject_wise mode' };
      if (pn === '' || isNaN(pn) || pn < 1) return { success: false, message: 'PeriodNumber required (1-12) for subject_wise mode' };
      var smap = getSubjectsMap();
      if (!smap[sid] || parseInt(smap[sid].classId, 10) !== cid) {
        return { success: false, message: 'Subject does not belong to this class' };
      }
    }

    var markedBy = getCurrentUserId(currentUser);
    if (!markedBy) return { success: false, message: 'Could not resolve current user' };

    if (role === 'teacher') {
      var teacherClasses = getTeacherClassIds(currentUser);
      if (teacherClasses.indexOf(cid) === -1) {
        return { success: false, message: 'You are not assigned to this class' };
      }
      if (!isDateToday(dateOnly)) {
        return { success: false, message: 'Teachers can only mark/edit attendance for today (' + todayStr() + ')' };
      }
      if (m === 'subject_wise') {
        var asgMap = getTeacherAssignmentsMap(markedBy);
        if (!asgMap[cid + '|' + sid]) {
          return { success: false, message: 'You are not assigned to teach this subject in this class' };
        }
      }
    }

    if (!Array.isArray(entries)) return { success: false, message: 'entries must be an array' };

    // build status JSON + counts
    var statuses = {}, present = 0, absent = 0, total = 0;
    entries.forEach(function(e) {
      var stid = parseInt(e.studentId, 10);
      if (isNaN(stid)) return;
      var st = String(e.status || 'present').toLowerCase();
      if (!isValidAttendanceStatus(st)) st = 'present';
      var rmks = e.remarks || '';
      statuses[stid] = { status: st, remarks: rmks };
      total++;
      if (st === 'present' || st === 'late' || st === 'half_day') present++;
      else if (st === 'absent') absent++;
    });
    var jsonStr = serializeAttendanceJson(statuses);

    var data = sh.getDataRange().getValues();
    var idx = findAttendanceRowIdx(data, cid, dateOnly, m, sid, pn);
    var ts = nowIso();
    var rowNum, action;

    if (idx === -1) {
      // INSERT
      var newId = nextAttendanceId(sh);
      var newRow = sh.getLastRow() + 1;
      sh.getRange(newRow, 3).setNumberFormat('@'); // pin date col as text
      sh.getRange(newRow, 7).setNumberFormat('@'); // pin JSON col as text
      sh.appendRow([newId, cid, dateIso, m, sid, pn, jsonStr, present, absent, total, markedBy, ts, ts, '0', '']);
      sh.getRange(newRow, 3).setNumberFormat('@').setValue(dateIso);
      sh.getRange(newRow, 7).setNumberFormat('@').setValue(jsonStr);
      action = 'inserted';
    } else {
      // UPDATE — block writes if row is locked (admin can override via lockAttendance with action='unlock')
      var locked = String(data[idx][13]) === '1';
      if (locked && role !== 'admin') return { success: false, message: 'Attendance row is locked. Ask admin to unlock first.' };
      rowNum = idx + 1;
      sh.getRange(rowNum, 7).setNumberFormat('@').setValue(jsonStr);
      sh.getRange(rowNum, 8).setValue(present);
      sh.getRange(rowNum, 9).setValue(absent);
      sh.getRange(rowNum, 10).setValue(total);
      sh.getRange(rowNum, 11).setValue(markedBy);
      sh.getRange(rowNum, 13).setValue(ts);
      action = 'updated';
    }

    var modeLabel = m === 'subject_wise' ? ('subject ' + sid + ' / P' + pn) : 'daily';
    addLog(currentUser, 'Attendance Saved', 'Class ' + cid + ' @ ' + dateOnly + ' (' + modeLabel + '): ' + total + ' students [' + action + ']');
    return {
      success: true,
      message: 'Saved ' + total + ' students (' + present + ' present, ' + absent + ' absent)',
      action: action,
      counts: { present: present, absent: absent, total: total }
    };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// lock/unlock attendance row for one (class, date, mode, subject, period) — admin only
function lockAttendance(classId, date, mode, subjectId, periodNumber, action, currentUser, currentRole) {
  try {
    if (!isAdmin(currentRole)) return { success: false, message: 'Forbidden — admin only' };
    var sh = getSheet(ATTENDANCE_SHEET);
    if (!sh) return { success: false, message: 'Attendance sheet not found' };
    var cid = parseInt(classId, 10);
    var dateOnly = toIso(date).split('T')[0];
    var m = String(mode || 'daily').toLowerCase();
    var sid = '', pn = '';
    if (m === 'subject_wise') {
      sid = subjectId === '' || subjectId == null ? '' : parseInt(subjectId, 10);
      pn = periodNumber === '' || periodNumber == null ? '' : parseInt(periodNumber, 10);
    }
    var data = sh.getDataRange().getValues();
    var idx = findAttendanceRowIdx(data, cid, dateOnly, m, sid, pn);
    if (idx === -1) return { success: false, message: 'Attendance row not found' };
    var rowNum = idx + 1;
    var doLock = String(action || 'lock').toLowerCase() !== 'unlock';
    sh.getRange(rowNum, 14).setValue(doLock ? '1' : '0');
    sh.getRange(rowNum, 15).setValue(doLock ? nowIso() : '');
    addLog(currentUser, doLock ? 'Attendance Locked' : 'Attendance Unlocked', 'Class ' + cid + ' @ ' + dateOnly);
    return { success: true, message: doLock ? 'Locked' : 'Unlocked' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// recent N working days for a class (mode-scoped). Used for trend strip + copy-from-yesterday.
function getRecentAttendanceForClass(classId, endDate, daysBack, mode, subjectId, periodNumber, currentUser, currentRole) {
  try {
    if (!canReadAttendance(currentRole)) return { success: false, message: 'Forbidden' };
    var cid = parseInt(classId, 10);
    if (isNaN(cid)) return { success: false, message: 'Invalid class id' };

    var role = String(currentRole).toLowerCase();
    if (role === 'teacher') {
      var teacherClasses = getTeacherClassIds(currentUser);
      if (teacherClasses.indexOf(cid) === -1) return { success: false, message: 'Not your class' };
    }
    var _scope = getViewerScope(currentUser, currentRole);
    if (!_scope.all && _scope.classIds.indexOf(cid) === -1) return { success: false, message: 'Forbidden — own class only' };

    var m = String(mode || 'daily').toLowerCase();
    var sid = '', pn = '';
    if (m === 'subject_wise') {
      sid = subjectId === '' || subjectId == null ? '' : parseInt(subjectId, 10);
      pn = periodNumber === '' || periodNumber == null ? '' : parseInt(periodNumber, 10);
    }

    var n = Math.max(1, Math.min(30, parseInt(daysBack, 10) || 7));
    var endStr = endDate ? toIso(endDate).split('T')[0] : new Date().toISOString().split('T')[0];

    var dates = [];
    var cursor = new Date(endStr + 'T00:00:00');
    cursor.setDate(cursor.getDate() - 1);
    var safety = 0;
    while (dates.length < n && safety < 90) {
      if (cursor.getDay() !== 0) {
        var iso = cursor.getFullYear() + '-' +
                  String(cursor.getMonth() + 1).padStart(2, '0') + '-' +
                  String(cursor.getDate()).padStart(2, '0');
        dates.push(iso);
      }
      cursor.setDate(cursor.getDate() - 1);
      safety++;
    }
    var dateSet = {};
    dates.forEach(function(x) { dateSet[x] = true; });

    var ash = getSheet(ATTENDANCE_SHEET);
    if (!ash) return { success: true, data: { dates: dates, byStudent: {} } };

    var data = ash.getDataRange().getValues();
    var byStudent = {};
    for (var i = 1; i < data.length; i++) {
      if (parseInt(data[i][1], 10) !== cid) continue;
      var ds = toIso(data[i][2]).split('T')[0];
      if (!dateSet[ds]) continue;
      var rowMode = String(data[i][3] || 'daily').toLowerCase();
      if (rowMode !== m) continue;
      if (m === 'subject_wise') {
        var rowSubj = data[i][4] === '' || data[i][4] == null ? '' : parseInt(data[i][4], 10);
        var rowPeriod = data[i][5] === '' || data[i][5] == null ? '' : parseInt(data[i][5], 10);
        if (rowSubj !== sid) continue;
        if (rowPeriod !== pn) continue;
      }
      var jsonObj = parseAttendanceJson(data[i][6]);
      Object.keys(jsonObj).forEach(function(k) {
        var sid2 = parseInt(k, 10);
        var st = String((jsonObj[k] || {}).status || '').toLowerCase();
        if (!byStudent[sid2]) byStudent[sid2] = {};
        byStudent[sid2][ds] = st;
      });
    }
    return { success: true, data: { dates: dates, byStudent: byStudent } };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// list subjects for a class — used by attendance subject-wise picker
function getSubjectsForClassId(classId, currentUser, currentRole) {
  try {
    if (!canReadSubjects(currentRole) && !canReadAttendance(currentRole)) return { success: false, message: 'Forbidden' };
    var cid = parseInt(classId, 10);
    if (isNaN(cid)) return { success: false, message: 'Invalid class id' };
    var _scope = getViewerScope(currentUser, currentRole);
    if (!_scope.all && _scope.classIds.indexOf(cid) === -1) return { success: false, message: 'Forbidden — own class only' };
    var sh = getSheet(SUBJECTS_SHEET);
    if (!sh) return { success: true, data: [] };
    var data = sh.getDataRange().getValues(), out = [];
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][5]) === '1') continue;
      if (parseInt(data[i][3], 10) !== cid) continue;
      out.push({
        ID: data[i][0],
        SubjectName: data[i][1],
        SubjectCode: data[i][2],
        ClassID: cid
      });
    }
    return { success: true, data: out };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// one-shot migration: converts old normalized attendance (1 row per student per date)
// into the new denormalized JSON format. Safe to run once after schema upgrade.
function migrateAttendanceToJson() {
  try {
    var sh = getSheet(ATTENDANCE_SHEET);
    if (!sh) return { success: false, message: 'Attendance sheet not found' };
    var data = sh.getDataRange().getValues();
    if (data.length < 2) return { success: true, message: 'Empty sheet — nothing to migrate', migrated: 0 };
    var headers = data[0].map(function(h) { return String(h).toLowerCase(); });
    // detect old format by presence of separate StudentID column (col 1 in old schema is StudentID)
    if (headers[1] !== 'studentid') {
      return { success: true, message: 'Already in new format — nothing to migrate', migrated: 0 };
    }
    // group rows by (ClassID, AttendanceDate)
    var groups = {};
    for (var i = 1; i < data.length; i++) {
      var sid = parseInt(data[i][1], 10);
      var cid = parseInt(data[i][2], 10);
      var dateOnly = toIso(data[i][3]).split('T')[0];
      var status = String(data[i][4] || 'present').toLowerCase();
      var remarks = data[i][5] || '';
      var markedBy = data[i][6];
      var createdAt = toIso(data[i][7]) || nowIso();
      if (isNaN(cid) || !dateOnly) continue;
      var key = cid + '|' + dateOnly;
      if (!groups[key]) groups[key] = { classId: cid, date: dateOnly, statuses: {}, markedBy: markedBy, createdAt: createdAt };
      groups[key].statuses[sid] = { status: status, remarks: remarks };
    }
    // wipe + rewrite header + all groups as new rows
    sh.clear();
    sh.getRange(1, 1, 1, ATTENDANCE_HEADERS.length).setValues([ATTENDANCE_HEADERS])
      .setBackground('#001f3f').setFontColor('white').setFontWeight('bold');
    sh.setFrozenRows(1);
    var newRows = [];
    Object.keys(groups).forEach(function(k, idx) {
      var g = groups[k];
      var present = 0, absent = 0, total = 0;
      Object.keys(g.statuses).forEach(function(s) {
        var st = g.statuses[s].status;
        total++;
        if (st === 'present' || st === 'late' || st === 'half_day') present++;
        else if (st === 'absent') absent++;
      });
      var dateIso = toIso(g.date);
      newRows.push([
        idx + 1, g.classId, dateIso, 'daily', '', '',
        serializeAttendanceJson(g.statuses),
        present, absent, total,
        g.markedBy || '', g.createdAt, nowIso()
      ]);
    });
    if (newRows.length) {
      sh.getRange(2, 1, newRows.length, ATTENDANCE_HEADERS.length).setValues(newRows);
      sh.getRange(2, 3, newRows.length, 1).setNumberFormat('@'); // pin date col as text
      sh.getRange(2, 7, newRows.length, 1).setNumberFormat('@'); // pin JSON col as text
    }
    addLog('System', 'Attendance Migrated', 'Migrated ' + newRows.length + ' (class, date) groups to JSON format');
    return { success: true, message: 'Migrated ' + newRows.length + ' rows to JSON format', migrated: newRows.length };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// ============== Fee Structure CRUD ==============
function rowToFeeStructure(row, cmap) {
  var clsId = row[1];
  return {
    ID: row[0],
    ClassID: clsId,
    ClassLabel: cmap && cmap[clsId] ? cmap[clsId].label : '— deleted class —',
    FeeCategory: String(row[2] || '').toLowerCase(),
    Amount: parseFloat(row[3]) || 0,
    Frequency: String(row[4] || '').toLowerCase(),
    AcademicYear: row[5],
    DueDay: parseInt(row[6], 10) || 10,
    LateFeePerDay: parseFloat(row[7]) || 0,
    IsActive: String(row[8]) === '1' || row[8] === 1 || row[8] === true,
    CreatedAt: toIso(row[10]),
    UpdatedAt: toIso(row[11]),
    InstallmentsAllowed: String(row[12]) === '1' || row[12] === 1 || row[12] === true,
    InstallmentCount: parseInt(row[13], 10) || 1,
    TaxPercent: parseFloat(row[14]) || 0,
    Description: row[15] || ''
  };
}

function getAllFeeStructures(currentUser, currentRole) {
  try {
    if (!canReadFeeStructure(currentRole)) return { success: false, message: 'Forbidden — no access' };

    var sh = getSheet(FEE_STRUCTURE_SHEET);
    if (!sh) return { success: false, message: 'Fee_Structure sheet not found' };

    var data = sh.getDataRange().getValues();
    var cmap = getClassesMap();
    var scope = getViewerScope(currentUser, currentRole);
    var out = [];
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][9]) === '1') continue;
      // student/parent: only their own class fee schedule
      if (!scope.all && scope.classIds.indexOf(parseInt(data[i][1], 10)) === -1) continue;
      out.push(rowToFeeStructure(data[i], cmap));
    }
    return { success: true, data: out };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

function feeStructureExists(sh, classId, category, frequency, academicYear, excludeId) {
  var data = sh.getDataRange().getValues();
  var c = parseInt(classId, 10);
  var cat = String(category || '').toLowerCase();
  var fr = String(frequency || '').toLowerCase();
  var ay = String(academicYear || '').trim();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][9]) === '1') continue;
    if (excludeId !== undefined && data[i][0] === excludeId) continue;
    if (parseInt(data[i][1], 10) === c &&
        String(data[i][2] || '').toLowerCase() === cat &&
        String(data[i][4] || '').toLowerCase() === fr &&
        String(data[i][5] || '').trim() === ay) return true;
  }
  return false;
}

function addFeeStructure(data, currentUser, currentRole) {
  try {
    if (!isAdminOrClerk(currentRole)) return { success: false, message: 'Forbidden — admin/clerk only' };

    var sh = getSheet(FEE_STRUCTURE_SHEET);
    if (!sh) return { success: false, message: 'Fee_Structure sheet not found' };

    if (!data.ClassID || !data.FeeCategory || data.Amount == null || !data.Frequency || !data.AcademicYear) {
      return { success: false, message: 'ClassID, FeeCategory, Amount, Frequency, AcademicYear are required' };
    }
    var allowedCats = ['tuition','admission','transport','exam','library','sports','lab','annual','arrears','other'];
    var cat = String(data.FeeCategory).toLowerCase();
    if (allowedCats.indexOf(cat) === -1) return { success: false, message: 'Invalid fee category' };
    var allowedFreq = ['monthly','quarterly','half_yearly','annual','one_time'];
    var fr = String(data.Frequency).toLowerCase();
    if (allowedFreq.indexOf(fr) === -1) return { success: false, message: 'Invalid frequency' };
    if (!validAcademicYear(data.AcademicYear)) return { success: false, message: 'AcademicYear must be YYYY-YYYY' };

    var amt = parseFloat(data.Amount);
    if (isNaN(amt) || amt < 0) return { success: false, message: 'Amount must be a non-negative number' };

    var cid = parseInt(data.ClassID, 10);
    var cmap = getClassesMap();
    if (!cmap[cid]) return { success: false, message: 'Class not found or deleted' };

    if (feeStructureExists(sh, cid, cat, fr, data.AcademicYear)) {
      return { success: false, message: 'A fee item already exists for this class+category+frequency+year' };
    }

    var dueDay = parseInt(data.DueDay, 10);
    if (isNaN(dueDay) || dueDay < 1 || dueDay > 31) dueDay = 10;
    var lateFee = parseFloat(data.LateFeePerDay);
    if (isNaN(lateFee) || lateFee < 0) lateFee = 0;
    var isActive = (data.IsActive === false || String(data.IsActive) === '0' || String(data.IsActive).toLowerCase() === 'false') ? '0' : '1';

    var instAllowed = (data.InstallmentsAllowed === true || String(data.InstallmentsAllowed) === '1' || String(data.InstallmentsAllowed).toLowerCase() === 'true') ? '1' : '0';
    var instCount = parseInt(data.InstallmentCount, 10);
    if (isNaN(instCount) || instCount < 1) instCount = 1;
    if (instCount > 12) instCount = 12;
    var taxPct = parseFloat(data.TaxPercent);
    if (isNaN(taxPct) || taxPct < 0) taxPct = 0;
    if (taxPct > 100) return { success: false, message: 'TaxPercent must be 0..100' };
    var desc = String(data.Description || '').trim();
    if (desc.length > 500) return { success: false, message: 'Description max 500 chars' };

    var ts = nowIso(), id = nextFeeStructureId(sh);
    sh.appendRow([
      id, cid, cat, amt, fr, String(data.AcademicYear).trim(),
      dueDay, lateFee, isActive, '0', ts, ts,
      instAllowed, instCount, taxPct, desc
    ]);

    addLog(currentUser, 'Fee Added', 'Added: ' + cat + ' (' + fr + ') ' + amt + ' for ' + cmap[cid].label);
    return { success: true, message: 'Fee structure added successfully', id: id };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

function updateFeeStructure(id, data, currentUser, currentRole) {
  try {
    if (!isAdminOrClerk(currentRole)) return { success: false, message: 'Forbidden — admin/clerk only' };
    var sh = getSheet(FEE_STRUCTURE_SHEET);
    if (!sh) return { success: false, message: 'Fee_Structure sheet not found' };
    var idn = parseInt(id, 10);
    if (isNaN(idn)) return { success: false, message: 'Invalid id' };

    if (!data.ClassID || !data.FeeCategory || data.Amount == null || !data.Frequency || !data.AcademicYear) {
      return { success: false, message: 'Required fields missing' };
    }
    var allowedCats = ['tuition','admission','transport','exam','library','sports','lab','annual','arrears','other'];
    var cat = String(data.FeeCategory).toLowerCase();
    if (allowedCats.indexOf(cat) === -1) return { success: false, message: 'Invalid fee category' };
    var allowedFreq = ['monthly','quarterly','half_yearly','annual','one_time'];
    var fr = String(data.Frequency).toLowerCase();
    if (allowedFreq.indexOf(fr) === -1) return { success: false, message: 'Invalid frequency' };
    if (!validAcademicYear(data.AcademicYear)) return { success: false, message: 'AcademicYear must be YYYY-YYYY' };
    var amt = parseFloat(data.Amount);
    if (isNaN(amt) || amt < 0) return { success: false, message: 'Amount must be non-negative' };

    var cid = parseInt(data.ClassID, 10);
    var cmap = getClassesMap();
    if (!cmap[cid]) return { success: false, message: 'Class not found' };

    if (feeStructureExists(sh, cid, cat, fr, data.AcademicYear, idn)) {
      return { success: false, message: 'A fee item already exists for this class+category+frequency+year' };
    }

    var dueDay = parseInt(data.DueDay, 10);
    if (isNaN(dueDay) || dueDay < 1 || dueDay > 31) dueDay = 10;
    var lateFee = parseFloat(data.LateFeePerDay);
    if (isNaN(lateFee) || lateFee < 0) lateFee = 0;
    var isActive = (data.IsActive === false || String(data.IsActive) === '0' || String(data.IsActive).toLowerCase() === 'false') ? '0' : '1';

    var rows = sh.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] !== idn || String(rows[i][9]) === '1') continue;
      var row = i + 1, ts = nowIso();
      sh.getRange(row, 2).setValue(cid);
      sh.getRange(row, 3).setValue(cat);
      sh.getRange(row, 4).setValue(amt);
      sh.getRange(row, 5).setValue(fr);
      sh.getRange(row, 6).setValue(String(data.AcademicYear).trim());
      sh.getRange(row, 7).setValue(dueDay);
      sh.getRange(row, 8).setValue(lateFee);
      sh.getRange(row, 9).setValue(isActive);
      sh.getRange(row, 12).setValue(ts);

      var instAllowed = (data.InstallmentsAllowed === true || String(data.InstallmentsAllowed) === '1' || String(data.InstallmentsAllowed).toLowerCase() === 'true') ? '1' : '0';
      var instCount = parseInt(data.InstallmentCount, 10);
      if (isNaN(instCount) || instCount < 1) instCount = 1;
      if (instCount > 12) instCount = 12;
      var taxPct = parseFloat(data.TaxPercent);
      if (isNaN(taxPct) || taxPct < 0) taxPct = 0;
      if (taxPct > 100) return { success: false, message: 'TaxPercent must be 0..100' };
      var desc = String(data.Description || '').trim();
      if (desc.length > 500) return { success: false, message: 'Description max 500 chars' };

      sh.getRange(row, 13).setValue(instAllowed);
      sh.getRange(row, 14).setValue(instCount);
      sh.getRange(row, 15).setValue(taxPct);
      sh.getRange(row, 16).setValue(desc);

      addLog(currentUser, 'Fee Updated', 'Updated id ' + idn);
      return { success: true, message: 'Fee structure updated successfully' };
    }
    return { success: false, message: 'Fee structure not found' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

function deleteFeeStructure(id, currentUser, currentRole) {
  try {
    if (!isAdminOrClerk(currentRole)) return { success: false, message: 'Forbidden — admin/clerk only' };
    var sh = getSheet(FEE_STRUCTURE_SHEET);
    if (!sh) return { success: false, message: 'Fee_Structure sheet not found' };
    var idn = parseInt(id, 10);
    if (isNaN(idn)) return { success: false, message: 'Invalid id' };
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] !== idn || String(data[i][9]) === '1') continue;
      var row = i + 1, ts = nowIso();
      sh.getRange(row, 10).setValue('1');
      sh.getRange(row, 12).setValue(ts);
      addLog(currentUser, 'Fee Deleted', 'Soft-deleted fee structure id ' + idn);
      return { success: true, message: 'Fee structure deleted successfully' };
    }
    return { success: false, message: 'Fee structure not found' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// fee structures for a specific class — used by payment modal cascading dropdown
function getFeeStructuresForClass(classId, currentUser, currentRole) {
  try {
    if (!canReadFeeStructure(currentRole) && !canReadPayments(currentRole)) return { success: false, message: 'Forbidden' };
    var sh = getSheet(FEE_STRUCTURE_SHEET);
    if (!sh) return { success: false, message: 'Fee_Structure sheet not found' };
    var cid = parseInt(classId, 10);
    if (isNaN(cid)) return { success: true, data: [] };
    var data = sh.getDataRange().getValues(), out = [];
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][9]) === '1') continue;
      if (parseInt(data[i][1], 10) !== cid) continue;
      if (String(data[i][8]) !== '1') continue;  // skip inactive
      out.push({
        ID: data[i][0],
        FeeCategory: String(data[i][2] || '').toLowerCase(),
        Amount: parseFloat(data[i][3]) || 0,
        Frequency: String(data[i][4] || '').toLowerCase(),
        AcademicYear: data[i][5],
        LateFeePerDay: parseFloat(data[i][7]) || 0
      });
    }
    return { success: true, data: out };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// ============== Fee Payments CRUD ==============
function rowToPayment(row, students, fmap, umap) {
  var sid = row[1], fsid = row[2], cby = row[13];
  var s = students && students[sid];
  var f = fmap && fmap[fsid];
  return {
    ID: row[0],
    StudentID: sid,
    StudentName: s ? s.fullName : '— deleted student —',
    AdmissionNumber: s ? s.admNo : '',
    ClassLabel: s ? s.classLabel : '',
    FeeStructureID: fsid,
    FeeCategory: f ? f.category : '',
    FeeAmount: f ? f.amount : 0,
    AmountPaid: parseFloat(row[3]) || 0,
    AmountDue: parseFloat(row[4]) || 0,
    LateFee: parseFloat(row[5]) || 0,
    Discount: parseFloat(row[6]) || 0,
    PaymentDate: toIso(row[7]),
    BillingPeriod: row[8] || '',
    PaymentMode: String(row[9] || '').toLowerCase(),
    TransactionReference: row[10] || '',
    ReceiptNumber: row[11],
    PaymentStatus: String(row[12] || '').toLowerCase(),
    CollectedBy: cby,
    CollectedByName: (cby && umap && umap[cby]) ? umap[cby].fullName : '',
    Remarks: row[14] || '',
    CreatedAt: toIso(row[16]),
    UpdatedAt: toIso(row[17]),
    AcademicYear: row[18] || '',
    RefundAmount: parseFloat(row[19]) || 0,
    RefundDate: toIso(row[20]),
    RefundReason: row[21] || '',
    MobileMoneyProvider: String(row[22] || '').toLowerCase()
  };
}

function getStudentsLite() {
  var ssh = getSheet(STUDENTS_SHEET);
  if (!ssh) return {};
  var data = ssh.getDataRange().getValues(), cmap = getClassesMap(), map = {};
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][36]) === '1') continue;
    var clsId = parseInt(data[i][25], 10);
    map[data[i][0]] = {
      fullName: [data[i][2], data[i][3], data[i][4]].filter(function(x){ return x; }).join(' '),
      admNo: data[i][1],
      classId: clsId,
      classLabel: cmap[clsId] ? cmap[clsId].label : '',
      status: String(data[i][35] || '').toLowerCase()
    };
  }
  return map;
}

function getFeeStructuresLite() {
  var sh = getSheet(FEE_STRUCTURE_SHEET);
  if (!sh) return {};
  var data = sh.getDataRange().getValues(), map = {};
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][9]) === '1') continue;
    map[data[i][0]] = {
      category: String(data[i][2] || '').toLowerCase(),
      amount: parseFloat(data[i][3]) || 0,
      frequency: String(data[i][4] || '').toLowerCase(),
      year: data[i][5],
      classId: parseInt(data[i][1], 10),
      lateFeePerDay: parseFloat(data[i][7]) || 0
    };
  }
  return map;
}

function getAllPayments(currentUser, currentRole) {
  try {
    if (!canReadPayments(currentRole)) return { success: false, message: 'Forbidden — no access' };
    var sh = getSheet(FEE_PAYMENTS_SHEET);
    if (!sh) return { success: false, message: 'Fee_Payments sheet not found' };
    var data = sh.getDataRange().getValues();
    var students = getStudentsLite();
    var fmap = getFeeStructuresLite();
    var umap = getUsersMap();
    var scope = getViewerScope(currentUser, currentRole);
    var out = [];
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][15]) === '1') continue;
      // student/parent: only their own (own child's) payments
      if (!scope.all && scope.studentIds.indexOf(parseInt(data[i][1], 10)) === -1) continue;
      out.push(rowToPayment(data[i], students, fmap, umap));
    }
    return { success: true, data: out };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

function receiptNumberExists(sh, receiptNo, excludeId) {
  if (!receiptNo) return false;
  var data = sh.getDataRange().getValues();
  var rcp = String(receiptNo).trim();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][15]) === '1') continue;
    if (excludeId !== undefined && data[i][0] === excludeId) continue;
    if (String(data[i][11] || '').trim() === rcp) return true;
  }
  return false;
}

function addPayment(p, currentUser, currentRole) {
  try {
    var role = String(currentRole).toLowerCase();
    if (role !== 'admin' && role !== 'clerk') return { success: false, message: 'Forbidden — admin or clerk only' };

    var sh = getSheet(FEE_PAYMENTS_SHEET);
    if (!sh) return { success: false, message: 'Fee_Payments sheet not found' };

    if (!p.StudentID || !p.FeeStructureID || p.AmountPaid == null || !p.PaymentDate || !p.BillingPeriod || !p.PaymentMode) {
      return { success: false, message: 'StudentID, FeeStructureID, AmountPaid, PaymentDate, BillingPeriod, PaymentMode are required' };
    }
    var allowedModes = ['cash','cheque','online','mobile_money','card','bank_transfer'];
    var mode = String(p.PaymentMode).toLowerCase();
    if (allowedModes.indexOf(mode) === -1) return { success: false, message: 'Invalid payment mode' };

    // FK validations
    var sid = parseInt(p.StudentID, 10);
    var fsid = parseInt(p.FeeStructureID, 10);
    if (isNaN(sid) || isNaN(fsid)) return { success: false, message: 'Invalid student/fee_structure id' };

    var students = getStudentsLite();
    if (!students[sid]) return { success: false, message: 'Student not found or deleted' };

    var fmap = getFeeStructuresLite();
    if (!fmap[fsid]) return { success: false, message: 'Fee structure not found or deleted' };
    if (fmap[fsid].classId !== students[sid].classId) {
      return { success: false, message: 'Selected fee does not belong to the student\'s class' };
    }

    // amounts
    var amountPaid = parseFloat(p.AmountPaid);
    if (isNaN(amountPaid) || amountPaid < 0) return { success: false, message: 'AmountPaid must be non-negative' };
    var lateFee = parseFloat(p.LateFee) || 0;
    var discount = parseFloat(p.Discount) || 0;
    var feeAmt = fmap[fsid].amount;
    var expected = feeAmt + lateFee - discount;
    if (expected < 0) expected = 0;
    var amountDue = Math.max(0, expected - amountPaid);

    // status auto-compute (admin can override)
    var status = computePaymentStatus(amountPaid, expected);
    if (role === 'admin' && p.PaymentStatus) {
      var allowedStatuses = ['paid','partial','pending','failed','refunded'];
      if (allowedStatuses.indexOf(String(p.PaymentStatus).toLowerCase()) !== -1) {
        status = String(p.PaymentStatus).toLowerCase();
      }
    }

    // receipt number — auto-gen if blank, else validate uniqueness
    var receiptNo = (p.ReceiptNumber && String(p.ReceiptNumber).trim() !== '')
      ? String(p.ReceiptNumber).trim()
      : generateReceiptNumber(sh);
    if (receiptNumberExists(sh, receiptNo)) return { success: false, message: 'Receipt number already in use' };

    var collectedBy = getCurrentUserId(currentUser);
    if (!collectedBy) return { success: false, message: 'Could not resolve current user' };

    // academic year — denorm from fee_structure if not provided
    var ay = String(p.AcademicYear || fmap[fsid].year || '').trim();
    var refAmt = parseFloat(p.RefundAmount);
    if (isNaN(refAmt) || refAmt < 0) refAmt = 0;
    var refDate = String(p.RefundDate || '').trim();
    if (refDate && !/^\d{4}-\d{2}-\d{2}$/.test(refDate)) return { success: false, message: 'RefundDate must be YYYY-MM-DD' };
    var refReason = String(p.RefundReason || '').trim();
    if (refReason.length > 300) return { success: false, message: 'RefundReason max 300 chars' };

    var momoProviders = ['mtn_momo', 'telecel_cash', 'airteltigo_money'];
    var momoProvider = mode === 'mobile_money' ? String(p.MobileMoneyProvider || '').toLowerCase() : '';
    if (mode === 'mobile_money' && momoProvider && momoProviders.indexOf(momoProvider) === -1) {
      return { success: false, message: 'Invalid MobileMoneyProvider' };
    }

    var ts = nowIso(), id = nextPaymentId(sh);
    sh.appendRow([
      id, sid, fsid, amountPaid, amountDue, lateFee, discount,
      toIso(p.PaymentDate), String(p.BillingPeriod).trim(), mode,
      p.TransactionReference || '', receiptNo, status, collectedBy,
      p.Remarks || '', '0', ts, ts,
      ay, refAmt, toIso(refDate), refReason, momoProvider
    ]);

    addLog(currentUser, 'Payment Added', 'Receipt ' + receiptNo + ' (' + status + '): GH₵' + amountPaid + ' from student ' + sid);
    return { success: true, message: 'Payment recorded — receipt ' + receiptNo, id: id, receiptNumber: receiptNo, status: status };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// bulk-record payments — used by parent-mode (one parent → many kids in one shot)
// payments: array of { StudentID, FeeStructureID, AmountPaid, LateFee, Discount, PaymentDate, BillingPeriod, PaymentMode, TransactionReference, Remarks }
// validates ALL rows first; if any fail → no writes. otherwise bulk-appends + sequential receipts.
function addPaymentsBulk(payments, currentUser, currentRole) {
  try {
    var role = String(currentRole).toLowerCase();
    if (role !== 'admin' && role !== 'clerk') return { success: false, message: 'Forbidden — admin or clerk only' };
    if (!Array.isArray(payments) || payments.length === 0) return { success: false, message: 'No payments provided' };
    if (payments.length > 50) return { success: false, message: 'Bulk limit is 50 rows per call' };

    var sh = getSheet(FEE_PAYMENTS_SHEET);
    if (!sh) return { success: false, message: 'Fee_Payments sheet not found' };

    var students = getStudentsLite();
    var fmap = getFeeStructuresLite();
    var allowedModes = ['cash','cheque','online','mobile_money','card','bank_transfer'];

    // pre-validate everything first
    var prepared = [];
    for (var i = 0; i < payments.length; i++) {
      var p = payments[i];
      var rowLabel = 'Row ' + (i + 1);
      if (!p.StudentID || !p.FeeStructureID || p.AmountPaid == null || !p.PaymentDate || !p.BillingPeriod || !p.PaymentMode) {
        return { success: false, message: rowLabel + ': required fields missing' };
      }
      var mode = String(p.PaymentMode).toLowerCase();
      if (allowedModes.indexOf(mode) === -1) return { success: false, message: rowLabel + ': invalid payment mode' };

      var sid = parseInt(p.StudentID, 10), fsid = parseInt(p.FeeStructureID, 10);
      if (isNaN(sid) || isNaN(fsid)) return { success: false, message: rowLabel + ': invalid id' };
      if (!students[sid]) return { success: false, message: rowLabel + ': student not found / deleted' };
      if (!fmap[fsid]) return { success: false, message: rowLabel + ': fee item not found / deleted' };
      if (fmap[fsid].classId !== students[sid].classId) {
        return { success: false, message: rowLabel + ' (' + students[sid].fullName + '): fee does not belong to student\'s class' };
      }

      var amountPaid = parseFloat(p.AmountPaid);
      if (isNaN(amountPaid) || amountPaid < 0) return { success: false, message: rowLabel + ': amount must be ≥ 0' };
      var lateFee = parseFloat(p.LateFee) || 0, discount = parseFloat(p.Discount) || 0;
      var feeAmt = fmap[fsid].amount;
      var expected = Math.max(0, feeAmt + lateFee - discount);
      var amountDue = Math.max(0, expected - amountPaid);
      var status = computePaymentStatus(amountPaid, expected);

      var ay = String(p.AcademicYear || fmap[fsid].year || '').trim();
      var momoProvider = mode === 'mobile_money' ? String(p.MobileMoneyProvider || '').toLowerCase() : '';

      prepared.push({
        sid: sid, fsid: fsid, amountPaid: amountPaid, amountDue: amountDue,
        lateFee: lateFee, discount: discount, paymentDate: toIso(p.PaymentDate),
        billingPeriod: String(p.BillingPeriod).trim(), mode: mode,
        txnRef: p.TransactionReference || '', remarks: p.Remarks || '',
        status: status, studentName: students[sid].fullName, admNo: students[sid].admNo,
        academicYear: ay, momoProvider: momoProvider
      });
    }

    var collectedBy = getCurrentUserId(currentUser);
    if (!collectedBy) return { success: false, message: 'Could not resolve current user' };

    // sequential receipts — read once, increment locally
    var year = new Date().getFullYear();
    var prefix = 'RCP-' + year + '-';
    var allData = sh.getDataRange().getValues(), maxSeq = 0, maxId = 0;
    for (var k = 1; k < allData.length; k++) {
      var rcp = String(allData[k][11] || '');
      if (rcp.indexOf(prefix) === 0) {
        var seq = parseInt(rcp.substring(prefix.length), 10);
        if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
      }
      var nId = parseInt(allData[k][0], 10);
      if (!isNaN(nId) && nId > maxId) maxId = nId;
    }

    var ts = nowIso(), rowsToWrite = [], receipts = [];
    for (var j = 0; j < prepared.length; j++) {
      var pr = prepared[j];
      maxSeq++;
      maxId++;
      var rcpNo = prefix + String(maxSeq).padStart(8, '0');
      receipts.push({
        studentId: pr.sid, studentName: pr.studentName, admissionNumber: pr.admNo,
        receiptNumber: rcpNo, amountPaid: pr.amountPaid, amountDue: pr.amountDue, status: pr.status
      });
      rowsToWrite.push([
        maxId, pr.sid, pr.fsid, pr.amountPaid, pr.amountDue, pr.lateFee, pr.discount,
        pr.paymentDate, pr.billingPeriod, pr.mode, pr.txnRef, rcpNo, pr.status,
        collectedBy, pr.remarks, '0', ts, ts,
        pr.academicYear, 0, '', '', pr.momoProvider
      ]);
    }

    if (rowsToWrite.length > 0) {
      sh.getRange(sh.getLastRow() + 1, 1, rowsToWrite.length, FEE_PAYMENT_HEADERS.length).setValues(rowsToWrite);
    }

    addLog(currentUser, 'Bulk Payment', 'Recorded ' + receipts.length + ' payment(s) — ' + receipts.map(function(r){ return r.receiptNumber; }).join(', '));
    return { success: true, message: 'Recorded ' + receipts.length + ' payment(s)', count: receipts.length, receipts: receipts };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

function updatePayment(id, p, currentUser, currentRole) {
  try {
    var role = String(currentRole).toLowerCase();
    if (role !== 'admin' && role !== 'clerk') return { success: false, message: 'Forbidden — admin or clerk only' };

    var sh = getSheet(FEE_PAYMENTS_SHEET);
    if (!sh) return { success: false, message: 'Fee_Payments sheet not found' };
    var idn = parseInt(id, 10);
    if (isNaN(idn)) return { success: false, message: 'Invalid id' };

    if (!p.StudentID || !p.FeeStructureID || p.AmountPaid == null || !p.PaymentDate || !p.BillingPeriod || !p.PaymentMode) {
      return { success: false, message: 'Required fields missing' };
    }

    // find row first to check the existing payment_date for clerk same-day gate
    var rows = sh.getDataRange().getValues();
    var foundIdx = -1;
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] === idn && String(rows[i][15]) === '0') { foundIdx = i; break; }
    }
    if (foundIdx === -1) return { success: false, message: 'Payment not found' };

    if (role === 'clerk') {
      var existingPayDate = String(rows[foundIdx][7]).split('T')[0];
      if (!isDateToday(existingPayDate)) {
        return { success: false, message: 'Clerks can only edit payments recorded today (' + todayStr() + '). Ask admin for older edits.' };
      }
    }

    var allowedModes = ['cash','cheque','online','mobile_money','card','bank_transfer'];
    var mode = String(p.PaymentMode).toLowerCase();
    if (allowedModes.indexOf(mode) === -1) return { success: false, message: 'Invalid payment mode' };

    var sid = parseInt(p.StudentID, 10);
    var fsid = parseInt(p.FeeStructureID, 10);
    if (isNaN(sid) || isNaN(fsid)) return { success: false, message: 'Invalid id' };

    var students = getStudentsLite();
    if (!students[sid]) return { success: false, message: 'Student not found' };
    var fmap = getFeeStructuresLite();
    if (!fmap[fsid]) return { success: false, message: 'Fee structure not found' };
    if (fmap[fsid].classId !== students[sid].classId) {
      return { success: false, message: 'Fee does not belong to student\'s class' };
    }

    var amountPaid = parseFloat(p.AmountPaid);
    if (isNaN(amountPaid) || amountPaid < 0) return { success: false, message: 'AmountPaid must be non-negative' };
    var lateFee = parseFloat(p.LateFee) || 0;
    var discount = parseFloat(p.Discount) || 0;
    var expected = fmap[fsid].amount + lateFee - discount;
    if (expected < 0) expected = 0;
    var amountDue = Math.max(0, expected - amountPaid);

    var status = computePaymentStatus(amountPaid, expected);
    if (role === 'admin' && p.PaymentStatus) {
      var allowedStatuses = ['paid','partial','pending','failed','refunded'];
      if (allowedStatuses.indexOf(String(p.PaymentStatus).toLowerCase()) !== -1) {
        status = String(p.PaymentStatus).toLowerCase();
      }
    }

    var receiptNo = String(p.ReceiptNumber || '').trim() || rows[foundIdx][11];
    if (receiptNumberExists(sh, receiptNo, idn)) return { success: false, message: 'Receipt number already in use' };

    var row = foundIdx + 1, ts = nowIso();
    sh.getRange(row, 2).setValue(sid);
    sh.getRange(row, 3).setValue(fsid);
    sh.getRange(row, 4).setValue(amountPaid);
    sh.getRange(row, 5).setValue(amountDue);
    sh.getRange(row, 6).setValue(lateFee);
    sh.getRange(row, 7).setValue(discount);
    sh.getRange(row, 8).setValue(toIso(p.PaymentDate));
    sh.getRange(row, 9).setValue(String(p.BillingPeriod).trim());
    sh.getRange(row, 10).setValue(mode);
    sh.getRange(row, 11).setValue(p.TransactionReference || '');
    sh.getRange(row, 12).setValue(receiptNo);
    sh.getRange(row, 13).setValue(status);
    sh.getRange(row, 15).setValue(p.Remarks || '');
    sh.getRange(row, 18).setValue(ts);

    var ay2 = String(p.AcademicYear || fmap[fsid].year || '').trim();
    var refAmt2 = parseFloat(p.RefundAmount);
    if (isNaN(refAmt2) || refAmt2 < 0) refAmt2 = 0;
    var refDate2 = String(p.RefundDate || '').trim();
    if (refDate2 && !/^\d{4}-\d{2}-\d{2}$/.test(refDate2)) return { success: false, message: 'RefundDate must be YYYY-MM-DD' };
    var refReason2 = String(p.RefundReason || '').trim();
    if (refReason2.length > 300) return { success: false, message: 'RefundReason max 300 chars' };
    sh.getRange(row, 19).setValue(ay2);
    sh.getRange(row, 20).setValue(refAmt2);
    sh.getRange(row, 21).setValue(toIso(refDate2));
    sh.getRange(row, 22).setValue(refReason2);
    var momoProviders2 = ['mtn_momo', 'telecel_cash', 'airteltigo_money'];
    var momoProvider2 = mode === 'mobile_money' ? String(p.MobileMoneyProvider || '').toLowerCase() : '';
    if (mode === 'mobile_money' && momoProvider2 && momoProviders2.indexOf(momoProvider2) === -1) {
      return { success: false, message: 'Invalid MobileMoneyProvider' };
    }
    sh.getRange(row, 23).setValue(momoProvider2);

    addLog(currentUser, 'Payment Updated', 'Updated id ' + idn + ' — receipt ' + receiptNo);
    return { success: true, message: 'Payment updated successfully' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

function deletePayment(id, currentUser, currentRole) {
  try {
    if (!isAdmin(currentRole)) return { success: false, message: 'Forbidden — admin only' };
    var sh = getSheet(FEE_PAYMENTS_SHEET);
    if (!sh) return { success: false, message: 'Fee_Payments sheet not found' };
    var idn = parseInt(id, 10);
    if (isNaN(idn)) return { success: false, message: 'Invalid id' };
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] !== idn || String(data[i][15]) === '1') continue;
      var row = i + 1, ts = nowIso();
      sh.getRange(row, 16).setValue('1');
      sh.getRange(row, 18).setValue(ts);
      addLog(currentUser, 'Payment Deleted', 'Soft-deleted payment id ' + idn);
      return { success: true, message: 'Payment deleted successfully' };
    }
    return { success: false, message: 'Payment not found' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// ============== Discipline CRUD ==============
function rowToDiscipline(row, students, umap) {
  var sid = row[1], rby = row[10];
  var s = students && students[sid];
  return {
    ID: row[0],
    StudentID: sid,
    StudentName: s ? s.fullName : '— deleted student —',
    AdmissionNumber: s ? s.admNo : '',
    ClassLabel: s ? s.classLabel : '',
    ClassID: s ? s.classId : null,
    IncidentDate: toIso(row[2]),
    IncidentType: String(row[3] || '').toLowerCase(),
    Severity: String(row[4] || '').toLowerCase(),
    Description: row[5] || '',
    ActionTaken: row[6] || '',
    ParentNotified: String(row[7]) === '1' || row[7] === 1 || row[7] === true,
    Status: String(row[8] || '').toLowerCase(),
    Remarks: row[9] || '',
    ReportedBy: rby,
    ReportedByName: (rby && umap && umap[rby]) ? umap[rby].fullName : '',
    CreatedAt: toIso(row[12]),
    UpdatedAt: toIso(row[13]),
    Location: row[14] || '',
    WitnessNames: row[15] || ''
  };
}

function getAllDiscipline(currentUser, currentRole) {
  try {
    if (!canReadDiscipline(currentRole)) return { success: false, message: 'Forbidden — no access' };
    var sh = getSheet(DISCIPLINE_SHEET);
    if (!sh) return { success: false, message: 'Discipline sheet not found' };

    var role = String(currentRole).toLowerCase();
    var teacherStudentIds = role === 'teacher' ? getTeacherStudentIds(currentUser) : null;
    var scope = getViewerScope(currentUser, currentRole);

    var students = getStudentsLite();
    var umap = getUsersMap();
    var data = sh.getDataRange().getValues(), out = [];
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][11]) === '1') continue;
      var sid = parseInt(data[i][1], 10);
      if (teacherStudentIds !== null && teacherStudentIds.indexOf(sid) === -1) continue;
      if (!scope.all && scope.studentIds.indexOf(sid) === -1) continue; // student/parent: own only
      out.push(rowToDiscipline(data[i], students, umap));
    }
    return { success: true, data: out };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

function addDiscipline(d, currentUser, currentRole) {
  try {
    if (!canWriteDiscipline(currentRole)) return { success: false, message: 'Forbidden — admin/teacher/supervisor only' };

    var sh = getSheet(DISCIPLINE_SHEET);
    if (!sh) return { success: false, message: 'Discipline sheet not found' };

    if (!d.StudentID || !d.IncidentDate || !d.IncidentType || !d.Severity || !d.Description) {
      return { success: false, message: 'StudentID, IncidentDate, IncidentType, Severity, Description are required' };
    }

    var allowedTypes = ['misbehavior','fighting','bullying','property_damage','disrespect','uniform_violation','tardiness','absconding','cheating','other'];
    var t = String(d.IncidentType).toLowerCase();
    if (allowedTypes.indexOf(t) === -1) return { success: false, message: 'Invalid incident type' };

    var allowedSev = ['low','medium','high','critical'];
    var sev = String(d.Severity).toLowerCase();
    if (allowedSev.indexOf(sev) === -1) return { success: false, message: 'Invalid severity' };

    var allowedStatuses = ['open','under_review','resolved','escalated'];
    var status = String(d.Status || 'open').toLowerCase();
    if (allowedStatuses.indexOf(status) === -1) status = 'open';

    var sid = parseInt(d.StudentID, 10);
    if (isNaN(sid)) return { success: false, message: 'Invalid StudentID' };

    var students = getStudentsLite();
    if (!students[sid]) return { success: false, message: 'Student not found or deleted' };

    // teacher must teach this student
    var role = String(currentRole).toLowerCase();
    if (role === 'teacher' && !teacherHasStudent(currentUser, sid)) {
      return { success: false, message: 'Student is not in your class' };
    }

    var reportedBy = getCurrentUserId(currentUser);
    if (!reportedBy) return { success: false, message: 'Could not resolve current user' };

    var notified = (d.ParentNotified === true || String(d.ParentNotified) === '1' || String(d.ParentNotified).toLowerCase() === 'true') ? '1' : '0';
    var ts = nowIso(), id = nextDisciplineId(sh);

    var allowedLocations = ['','classroom','canteen','bus','playground','lab','library','corridor','toilet','assembly','outside_school','other'];
    var loc = String(d.Location || '').toLowerCase();
    if (allowedLocations.indexOf(loc) === -1) loc = 'other';
    var witnesses = String(d.WitnessNames || '').trim();
    if (witnesses.length > 300) return { success: false, message: 'WitnessNames max 300 chars' };

    sh.appendRow([
      id, sid, toIso(d.IncidentDate), t, sev,
      String(d.Description).trim(),
      d.ActionTaken || '',
      notified, status,
      d.Remarks || '',
      reportedBy, '0', ts, ts,
      loc, witnesses
    ]);

    addLog(currentUser, 'Incident Reported', 'Student ' + sid + ': ' + t + ' (' + sev + ') — status ' + status);
    return { success: true, message: 'Incident reported successfully', id: id };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

function updateDiscipline(id, d, currentUser, currentRole) {
  try {
    if (!canWriteDiscipline(currentRole)) return { success: false, message: 'Forbidden — admin/teacher/supervisor only' };

    var sh = getSheet(DISCIPLINE_SHEET);
    if (!sh) return { success: false, message: 'Discipline sheet not found' };
    var idn = parseInt(id, 10);
    if (isNaN(idn)) return { success: false, message: 'Invalid id' };

    var rows = sh.getDataRange().getValues();
    var foundIdx = -1;
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] === idn && String(rows[i][11]) === '0') { foundIdx = i; break; }
    }
    if (foundIdx === -1) return { success: false, message: 'Incident not found' };

    var role = String(currentRole).toLowerCase();
    var currentUid = getCurrentUserId(currentUser);

    // teacher: must own the entry (reported_by === self_id)
    if (role === 'teacher' && parseInt(rows[foundIdx][10], 10) !== currentUid) {
      return { success: false, message: 'Teachers can only edit incidents they reported themselves' };
    }
    // teacher: student still needs to be in their class
    if (role === 'teacher') {
      var stid = parseInt(rows[foundIdx][1], 10);
      if (!teacherHasStudent(currentUser, stid)) {
        return { success: false, message: 'Student is no longer in your class' };
      }
    }

    if (!d.StudentID || !d.IncidentDate || !d.IncidentType || !d.Severity || !d.Description) {
      return { success: false, message: 'Required fields missing' };
    }
    var allowedTypes = ['misbehavior','fighting','bullying','property_damage','disrespect','uniform_violation','tardiness','absconding','cheating','other'];
    var t = String(d.IncidentType).toLowerCase();
    if (allowedTypes.indexOf(t) === -1) return { success: false, message: 'Invalid incident type' };
    var allowedSev = ['low','medium','high','critical'];
    var sev = String(d.Severity).toLowerCase();
    if (allowedSev.indexOf(sev) === -1) return { success: false, message: 'Invalid severity' };
    var allowedStatuses = ['open','under_review','resolved','escalated'];
    var status = String(d.Status || 'open').toLowerCase();
    if (allowedStatuses.indexOf(status) === -1) status = 'open';

    var sid = parseInt(d.StudentID, 10);
    if (isNaN(sid)) return { success: false, message: 'Invalid StudentID' };
    var students = getStudentsLite();
    if (!students[sid]) return { success: false, message: 'Student not found' };

    var notified = (d.ParentNotified === true || String(d.ParentNotified) === '1' || String(d.ParentNotified).toLowerCase() === 'true') ? '1' : '0';

    var row = foundIdx + 1, ts = nowIso();
    sh.getRange(row, 2).setValue(sid);
    sh.getRange(row, 3).setValue(toIso(d.IncidentDate));
    sh.getRange(row, 4).setValue(t);
    sh.getRange(row, 5).setValue(sev);
    sh.getRange(row, 6).setValue(String(d.Description).trim());
    sh.getRange(row, 7).setValue(d.ActionTaken || '');
    sh.getRange(row, 8).setValue(notified);
    sh.getRange(row, 9).setValue(status);
    sh.getRange(row, 10).setValue(d.Remarks || '');
    sh.getRange(row, 14).setValue(ts);
    // reported_by preserved on update

    var allowedLocations2 = ['','classroom','canteen','bus','playground','lab','library','corridor','toilet','assembly','outside_school','other'];
    var loc2 = String(d.Location || '').toLowerCase();
    if (allowedLocations2.indexOf(loc2) === -1) loc2 = 'other';
    var witnesses2 = String(d.WitnessNames || '').trim();
    if (witnesses2.length > 300) return { success: false, message: 'WitnessNames max 300 chars' };
    sh.getRange(row, 15).setValue(loc2);
    sh.getRange(row, 16).setValue(witnesses2);

    addLog(currentUser, 'Incident Updated', 'Updated id ' + idn + ' — ' + t + '/' + sev + '/' + status);
    return { success: true, message: 'Incident updated successfully' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

function deleteDiscipline(id, currentUser, currentRole) {
  try {
    if (!isAdmin(currentRole)) return { success: false, message: 'Forbidden — admin only' };
    var sh = getSheet(DISCIPLINE_SHEET);
    if (!sh) return { success: false, message: 'Discipline sheet not found' };
    var idn = parseInt(id, 10);
    if (isNaN(idn)) return { success: false, message: 'Invalid id' };
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] !== idn || String(data[i][11]) === '1') continue;
      var row = i + 1, ts = nowIso();
      sh.getRange(row, 12).setValue('1');
      sh.getRange(row, 14).setValue(ts);
      addLog(currentUser, 'Incident Deleted', 'Soft-deleted incident id ' + idn);
      return { success: true, message: 'Incident deleted successfully' };
    }
    return { success: false, message: 'Incident not found' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// accepts A/B/C/D/E or 1-5; returns A-E ('' if blank/invalid)
function normalizeSubGrade(v) {
  if (v == null) return '';
  var s = String(v).trim().toUpperCase();
  if (!s) return '';
  if (['A','B','C','D','E'].indexOf(s) !== -1) return s;
  var n = parseInt(s, 10);
  if (n >= 1 && n <= 5) return ['A','B','C','D','E'][n - 1];
  return '';
}

// ============== Conduct CRUD ==============
function rowToConduct(row, students, umap) {
  var sid = row[1], eby = row[7];
  var s = students && students[sid];
  return {
    ID: row[0],
    StudentID: sid,
    StudentName: s ? s.fullName : '— deleted student —',
    AdmissionNumber: s ? s.admNo : '',
    ClassLabel: s ? s.classLabel : '',
    ClassID: s ? s.classId : null,
    EvaluationPeriod: String(row[2] || '').toLowerCase(),
    PeriodLabel: formatPeriodLabel(row[3]),
    AcademicYear: formatAcademicYear(row[4]),
    ConductGrade: String(row[5] || '').toLowerCase(),
    Remarks: row[6] || '',
    EvaluatedBy: eby,
    EvaluatedByName: (eby && umap && umap[eby]) ? umap[eby].fullName : '',
    CreatedAt: toIso(row[9]),
    UpdatedAt: toIso(row[10]),
    PunctualityGrade: String(row[11] || '').toUpperCase(),
    BehaviorGrade: String(row[12] || '').toUpperCase(),
    TeamworkGrade: String(row[13] || '').toUpperCase(),
    LeadershipGrade: String(row[14] || '').toUpperCase()
  };
}

function getAllConduct(currentUser, currentRole) {
  try {
    if (!canReadConduct(currentRole)) return { success: false, message: 'Forbidden — no access' };
    var sh = getSheet(CONDUCT_SHEET);
    if (!sh) return { success: true, data: [], message: 'Conduct sheet missing — returning empty list. Run setup() to create it.' };

    var role = String(currentRole || '').toLowerCase();
    var teacherStudentIds = null;
    try { if (role === 'teacher') teacherStudentIds = getTeacherStudentIds(currentUser) || []; } catch (e1) { teacherStudentIds = []; }
    var scope = getViewerScope(currentUser, currentRole);

    var students = {};
    try { students = getStudentsLite() || {}; } catch (e2) {}

    var umap = {};
    try { umap = getUsersMap() || {}; } catch (e3) {}

    var data;
    try { data = sh.getDataRange().getValues(); }
    catch (e4) { return { success: true, data: [], message: 'Conduct sheet read error: ' + e4 }; }

    var out = [];
    for (var i = 1; i < (data || []).length; i++) {
      try {
        if (String(data[i][8]) === '1') continue;
        var sid = parseInt(data[i][1], 10);
        if (teacherStudentIds !== null && teacherStudentIds.indexOf(sid) === -1) continue;
        if (!scope.all && scope.studentIds.indexOf(sid) === -1) continue; // student/parent: own only
        out.push(rowToConduct(data[i], students, umap));
      } catch (rowErr) { /* skip bad row, keep going */ }
    }
    return { success: true, data: out };
  } catch (err) {
    return { success: false, message: 'Error: ' + (err && err.toString ? err.toString() : 'unknown') };
  }
}

function conductExists(sh, studentId, evalPeriod, periodLabel, academicYear, excludeId) {
  var data = sh.getDataRange().getValues();
  var s = parseInt(studentId, 10);
  var ep = String(evalPeriod || '').toLowerCase();
  var pl = formatPeriodLabel(periodLabel);
  var ay = formatAcademicYear(academicYear);
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][8]) === '1') continue;
    if (excludeId !== undefined && data[i][0] === excludeId) continue;
    if (parseInt(data[i][1], 10) === s &&
        String(data[i][2] || '').toLowerCase() === ep &&
        formatPeriodLabel(data[i][3]) === pl &&
        formatAcademicYear(data[i][4]) === ay) return true;
  }
  return false;
}

function addConduct(c, currentUser, currentRole) {
  try {
    if (!canWriteConduct(currentRole)) return { success: false, message: 'Forbidden — admin/teacher/supervisor only' };

    var sh = getSheet(CONDUCT_SHEET);
    if (!sh) return { success: false, message: 'Conduct sheet not found' };

    if (!c.StudentID || !c.EvaluationPeriod || !c.PeriodLabel || !c.AcademicYear || !c.ConductGrade) {
      return { success: false, message: 'StudentID, EvaluationPeriod, PeriodLabel, AcademicYear, ConductGrade are required' };
    }
    var allowedPeriods = ['monthly','term_1','term_2','term_3','annual'];
    var ep = String(c.EvaluationPeriod).toLowerCase();
    if (allowedPeriods.indexOf(ep) === -1) return { success: false, message: 'Invalid evaluation period' };
    var allowedGrades = ['excellent','very_good','good','satisfactory','needs_improvement','poor'];
    var gr = String(c.ConductGrade).toLowerCase();
    if (allowedGrades.indexOf(gr) === -1) return { success: false, message: 'Invalid conduct grade' };
    if (!validAcademicYear(c.AcademicYear)) return { success: false, message: 'AcademicYear must be YYYY-YYYY' };

    var sid = parseInt(c.StudentID, 10);
    if (isNaN(sid)) return { success: false, message: 'Invalid StudentID' };
    var students = getStudentsLite();
    if (!students[sid]) return { success: false, message: 'Student not found or deleted' };

    var role = String(currentRole).toLowerCase();
    if (role === 'teacher' && !teacherHasStudent(currentUser, sid)) {
      return { success: false, message: 'Student is not in your class' };
    }

    if (conductExists(sh, sid, ep, c.PeriodLabel, c.AcademicYear)) {
      return { success: false, message: 'A conduct evaluation already exists for this student/period/label/year' };
    }

    var evaluatedBy = getCurrentUserId(currentUser);
    if (!evaluatedBy) return { success: false, message: 'Could not resolve current user' };

    var ts = nowIso(), id = nextConductId(sh);
    var plClean = formatPeriodLabel(c.PeriodLabel);
    var ayClean = formatAcademicYear(c.AcademicYear);
    var pun = normalizeSubGrade(c.PunctualityGrade);
    var beh = normalizeSubGrade(c.BehaviorGrade);
    var tm = normalizeSubGrade(c.TeamworkGrade);
    var ldr = normalizeSubGrade(c.LeadershipGrade);
    var newRow = sh.getLastRow() + 1;
    // pin PeriodLabel (col 4) + AcademicYear (col 5) as text BEFORE write to block auto-date-conversion
    sh.getRange(newRow, 4, 1, 2).setNumberFormat('@');
    sh.appendRow([
      id, sid, ep,
      plClean,
      ayClean,
      gr, c.Remarks || '',
      evaluatedBy, '0', ts, ts,
      pun, beh, tm, ldr
    ]);
    // re-pin in case appendRow changed it; explicitly setValue as string
    sh.getRange(newRow, 4).setNumberFormat('@').setValue(plClean);
    sh.getRange(newRow, 5).setNumberFormat('@').setValue(ayClean);

    addLog(currentUser, 'Conduct Added', 'Student ' + sid + ' / ' + ep + ' / ' + plClean + ' / ' + gr);
    return { success: true, message: 'Conduct evaluation added successfully', id: id };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

function updateConduct(id, c, currentUser, currentRole) {
  try {
    if (!canWriteConduct(currentRole)) return { success: false, message: 'Forbidden — admin/teacher/supervisor only' };

    var sh = getSheet(CONDUCT_SHEET);
    if (!sh) return { success: false, message: 'Conduct sheet not found' };
    var idn = parseInt(id, 10);
    if (isNaN(idn)) return { success: false, message: 'Invalid id' };

    var rows = sh.getDataRange().getValues();
    var foundIdx = -1;
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] === idn && String(rows[i][8]) === '0') { foundIdx = i; break; }
    }
    if (foundIdx === -1) return { success: false, message: 'Conduct entry not found' };

    var role = String(currentRole).toLowerCase();
    var currentUid = getCurrentUserId(currentUser);

    if (role === 'teacher' && parseInt(rows[foundIdx][7], 10) !== currentUid) {
      return { success: false, message: 'Teachers can only edit conduct entries they evaluated themselves' };
    }
    if (role === 'teacher') {
      var stid = parseInt(rows[foundIdx][1], 10);
      if (!teacherHasStudent(currentUser, stid)) {
        return { success: false, message: 'Student is no longer in your class' };
      }
    }

    if (!c.StudentID || !c.EvaluationPeriod || !c.PeriodLabel || !c.AcademicYear || !c.ConductGrade) {
      return { success: false, message: 'Required fields missing' };
    }
    var allowedPeriods = ['monthly','term_1','term_2','term_3','annual'];
    var ep = String(c.EvaluationPeriod).toLowerCase();
    if (allowedPeriods.indexOf(ep) === -1) return { success: false, message: 'Invalid evaluation period' };
    var allowedGrades = ['excellent','very_good','good','satisfactory','needs_improvement','poor'];
    var gr = String(c.ConductGrade).toLowerCase();
    if (allowedGrades.indexOf(gr) === -1) return { success: false, message: 'Invalid conduct grade' };
    if (!validAcademicYear(c.AcademicYear)) return { success: false, message: 'AcademicYear must be YYYY-YYYY' };

    var sid = parseInt(c.StudentID, 10);
    if (isNaN(sid)) return { success: false, message: 'Invalid StudentID' };
    var students = getStudentsLite();
    if (!students[sid]) return { success: false, message: 'Student not found' };

    if (conductExists(sh, sid, ep, c.PeriodLabel, c.AcademicYear, idn)) {
      return { success: false, message: 'A conduct entry already exists for this student/period/label/year' };
    }

    var row = foundIdx + 1, ts = nowIso();
    var plClean = formatPeriodLabel(c.PeriodLabel);
    var ayClean = formatAcademicYear(c.AcademicYear);
    sh.getRange(row, 2).setValue(sid);
    sh.getRange(row, 3).setValue(ep);
    sh.getRange(row, 4).setNumberFormat('@').setValue(plClean);
    sh.getRange(row, 5).setNumberFormat('@').setValue(ayClean);
    sh.getRange(row, 6).setValue(gr);
    sh.getRange(row, 7).setValue(c.Remarks || '');
    sh.getRange(row, 11).setValue(ts);
    // evaluated_by preserved
    sh.getRange(row, 12).setValue(normalizeSubGrade(c.PunctualityGrade));
    sh.getRange(row, 13).setValue(normalizeSubGrade(c.BehaviorGrade));
    sh.getRange(row, 14).setValue(normalizeSubGrade(c.TeamworkGrade));
    sh.getRange(row, 15).setValue(normalizeSubGrade(c.LeadershipGrade));

    addLog(currentUser, 'Conduct Updated', 'Updated id ' + idn);
    return { success: true, message: 'Conduct evaluation updated successfully' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

function deleteConduct(id, currentUser, currentRole) {
  try {
    if (!isAdmin(currentRole)) return { success: false, message: 'Forbidden — admin only' };
    var sh = getSheet(CONDUCT_SHEET);
    if (!sh) return { success: false, message: 'Conduct sheet not found' };
    var idn = parseInt(id, 10);
    if (isNaN(idn)) return { success: false, message: 'Invalid id' };
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] !== idn || String(data[i][8]) === '1') continue;
      var row = i + 1, ts = nowIso();
      sh.getRange(row, 9).setValue('1');
      sh.getRange(row, 11).setValue(ts);
      addLog(currentUser, 'Conduct Deleted', 'Soft-deleted conduct id ' + idn);
      return { success: true, message: 'Conduct entry deleted successfully' };
    }
    return { success: false, message: 'Conduct entry not found' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// ============== Activities CRUD ==============
function rowToActivity(row, students, umap) {
  var sid = row[1], rby = row[10];
  var s = students && students[sid];
  return {
    ID: row[0], StudentID: sid,
    StudentName: s ? s.fullName : '— deleted student —',
    AdmissionNumber: s ? s.admNo : '',
    ClassLabel: s ? s.classLabel : '',
    ActivityName: row[2],
    ActivityType: String(row[3] || '').toLowerCase(),
    Level: String(row[4] || '').toLowerCase(),
    Position: row[5] || '',
    ActivityDate: toIso(row[6]),
    AcademicYear: row[7],
    CertificateURL: row[8] || '',
    Description: row[9] || '',
    RecordedBy: rby,
    RecordedByName: (rby && umap && umap[rby]) ? umap[rby].fullName : '',
    CreatedAt: toIso(row[12]), UpdatedAt: toIso(row[13]),
    CoachTeacherID: row[14] === '' || row[14] == null ? null : (parseInt(row[14], 10) || null),
    CoachTeacherName: (row[14] && umap && umap[row[14]]) ? umap[row[14]].fullName : ''
  };
}

function getAllActivities(currentUser, currentRole) {
  try {
    if (!canReadActivities(currentRole)) return { success: false, message: 'Forbidden' };
    var sh = getSheet(ACTIVITIES_SHEET);
    if (!sh) return { success: false, message: 'Activities sheet not found' };
    var role = String(currentRole).toLowerCase();
    var teacherStudentIds = role === 'teacher' ? getTeacherStudentIds(currentUser) : null;
    var scope = getViewerScope(currentUser, currentRole);
    var students = getStudentsLite();
    var umap = getUsersMap();
    var data = sh.getDataRange().getValues(), out = [];
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][11]) === '1') continue;
      var sid = parseInt(data[i][1], 10);
      if (teacherStudentIds !== null && teacherStudentIds.indexOf(sid) === -1) continue;
      if (!scope.all && scope.studentIds.indexOf(sid) === -1) continue; // student/parent: own only
      out.push(rowToActivity(data[i], students, umap));
    }
    return { success: true, data: out };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

function addActivity(a, currentUser, currentRole) {
  try {
    if (!canWriteActivities(currentRole)) return { success: false, message: 'Forbidden — admin/teacher only' };
    var sh = getSheet(ACTIVITIES_SHEET);
    if (!sh) return { success: false, message: 'Activities sheet not found' };
    if (!a.StudentID || !a.ActivityName || !a.ActivityType || !a.Level || !a.ActivityDate || !a.AcademicYear) {
      return { success: false, message: 'StudentID, ActivityName, ActivityType, Level, ActivityDate, AcademicYear are required' };
    }
    var allowedTypes = ['sports','cultural','academic','social','arts','music','dance','debate','science','other'];
    var t = String(a.ActivityType).toLowerCase();
    if (allowedTypes.indexOf(t) === -1) return { success: false, message: 'Invalid activity type' };
    var allowedLevels = ['school','district','state','national','international'];
    var lv = String(a.Level).toLowerCase();
    if (allowedLevels.indexOf(lv) === -1) return { success: false, message: 'Invalid level' };
    if (!validAcademicYear(a.AcademicYear)) return { success: false, message: 'AcademicYear must be YYYY-YYYY' };

    var sid = parseInt(a.StudentID, 10);
    if (isNaN(sid)) return { success: false, message: 'Invalid StudentID' };
    var students = getStudentsLite();
    if (!students[sid]) return { success: false, message: 'Student not found' };

    if (String(currentRole).toLowerCase() === 'teacher' && !teacherHasStudent(currentUser, sid)) {
      return { success: false, message: 'Student is not in your class' };
    }

    var recordedBy = getCurrentUserId(currentUser);
    if (!recordedBy) return { success: false, message: 'Could not resolve current user' };

    var coach = '';
    if (a.CoachTeacherID !== '' && a.CoachTeacherID != null) {
      var ctid = parseInt(a.CoachTeacherID, 10);
      if (!isNaN(ctid)) {
        var umap = getUsersMap();
        if (!umap[ctid] || umap[ctid].role !== 'teacher') return { success: false, message: 'CoachTeacherID is not an active teacher' };
        coach = ctid;
      }
    }

    var ts = nowIso(), id = nextRowId(sh);
    sh.appendRow([
      id, sid, String(a.ActivityName).trim(), t, lv,
      a.Position || '', toIso(a.ActivityDate), String(a.AcademicYear).trim(),
      a.CertificateURL || '', a.Description || '',
      recordedBy, '0', ts, ts,
      coach
    ]);
    addLog(currentUser, 'Activity Added', 'Student ' + sid + ' / ' + a.ActivityName + ' (' + t + '/' + lv + ')');
    return { success: true, message: 'Activity recorded successfully', id: id };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

function updateActivity(id, a, currentUser, currentRole) {
  try {
    if (!canWriteActivities(currentRole)) return { success: false, message: 'Forbidden' };
    var sh = getSheet(ACTIVITIES_SHEET);
    if (!sh) return { success: false, message: 'Activities sheet not found' };
    var idn = parseInt(id, 10);
    if (isNaN(idn)) return { success: false, message: 'Invalid id' };
    var rows = sh.getDataRange().getValues(), foundIdx = -1;
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] === idn && String(rows[i][11]) === '0') { foundIdx = i; break; }
    }
    if (foundIdx === -1) return { success: false, message: 'Activity not found' };

    var role = String(currentRole).toLowerCase();
    var currentUid = getCurrentUserId(currentUser);
    if (role === 'teacher' && parseInt(rows[foundIdx][10], 10) !== currentUid) {
      return { success: false, message: 'Teachers can only edit activities they recorded themselves' };
    }

    if (!a.StudentID || !a.ActivityName || !a.ActivityType || !a.Level || !a.ActivityDate || !a.AcademicYear) {
      return { success: false, message: 'Required fields missing' };
    }
    var allowedTypes = ['sports','cultural','academic','social','arts','music','dance','debate','science','other'];
    var t = String(a.ActivityType).toLowerCase();
    if (allowedTypes.indexOf(t) === -1) return { success: false, message: 'Invalid type' };
    var allowedLevels = ['school','district','state','national','international'];
    var lv = String(a.Level).toLowerCase();
    if (allowedLevels.indexOf(lv) === -1) return { success: false, message: 'Invalid level' };

    var sid = parseInt(a.StudentID, 10);
    var students = getStudentsLite();
    if (!students[sid]) return { success: false, message: 'Student not found' };

    var row = foundIdx + 1, ts = nowIso();
    sh.getRange(row, 2).setValue(sid);
    sh.getRange(row, 3).setValue(String(a.ActivityName).trim());
    sh.getRange(row, 4).setValue(t);
    sh.getRange(row, 5).setValue(lv);
    sh.getRange(row, 6).setValue(a.Position || '');
    sh.getRange(row, 7).setValue(toIso(a.ActivityDate));
    sh.getRange(row, 8).setValue(String(a.AcademicYear).trim());
    sh.getRange(row, 9).setValue(a.CertificateURL || '');
    sh.getRange(row, 10).setValue(a.Description || '');
    sh.getRange(row, 14).setValue(ts);
    var coach2 = '';
    if (a.CoachTeacherID !== '' && a.CoachTeacherID != null) {
      var ctid2 = parseInt(a.CoachTeacherID, 10);
      if (!isNaN(ctid2)) {
        var umap2 = getUsersMap();
        if (!umap2[ctid2] || umap2[ctid2].role !== 'teacher') return { success: false, message: 'CoachTeacherID is not an active teacher' };
        coach2 = ctid2;
      }
    }
    sh.getRange(row, 15).setValue(coach2);
    addLog(currentUser, 'Activity Updated', 'Updated id ' + idn);
    return { success: true, message: 'Activity updated successfully' };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

function deleteActivity(id, currentUser, currentRole) {
  try {
    if (!isAdmin(currentRole)) return { success: false, message: 'Forbidden — admin only' };
    var sh = getSheet(ACTIVITIES_SHEET);
    if (!sh) return { success: false, message: 'Activities sheet not found' };
    var idn = parseInt(id, 10);
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] !== idn || String(data[i][11]) === '1') continue;
      var row = i + 1, ts = nowIso();
      sh.getRange(row, 12).setValue('1');
      sh.getRange(row, 14).setValue(ts);
      addLog(currentUser, 'Activity Deleted', 'Soft-deleted activity id ' + idn);
      return { success: true, message: 'Activity deleted successfully' };
    }
    return { success: false, message: 'Activity not found' };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

// ============== Complaints CRUD (NO is_deleted, hard delete) ==============
function rowToComplaint(row, students, umap) {
  var rsid = row[4], assignedTo = row[10];
  // label maps
  var stype = String(row[2] || '').toLowerCase();
  var stypeMap = { teacher:'Teacher', parent:'Parent', student:'Student', supervisor:'Supervisor', staff:'Staff' };
  var cat = String(row[5] || '').toLowerCase();
  var pri = String(row[8] || '').toLowerCase();
  var st = String(row[9] || '').toLowerCase();
  var cap = function(s){ return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; };
  return {
    ID: row[0], ComplaintCode: row[1],
    SubmittedByType: stype,
    SubmitterTypeLabel: stypeMap[stype] || cap(stype),
    SubmitterID: row[3],
    SubmitterName: resolvePolymorphicName(row[2], row[3]),
    RelatedStudentID: rsid,
    RelatedStudentName: rsid && students[rsid] ? students[rsid].fullName : '',
    Category: cat,
    CategoryLabel: cap(cat),
    Subject: row[6], Description: row[7],
    Priority: pri,
    PriorityLabel: cap(pri),
    Status: st,
    StatusLabel: cap(st.replace('_', ' ')),
    AssignedTo: assignedTo,
    AssignedToName: (assignedTo && umap && umap[assignedTo]) ? umap[assignedTo].fullName : '',
    ResolutionNotes: row[11] || '',
    ResolvedAt: toIso(row[12]),
    CreatedAt: toIso(row[13]), UpdatedAt: toIso(row[14]),
    IsAnonymous: String(row[15]) === '1' || row[15] === 1 || row[15] === true,
    AttachmentURL: row[16] || ''
  };
}

function getAllComplaints(currentUser, currentRole) {
  try {
    if (!canReadComplaints(currentRole)) return { success: false, message: 'Forbidden' };
    var sh = getSheet(COMPLAINTS_SHEET);
    if (!sh) return { success: false, message: 'Complaints sheet not found' };
    var role = String(currentRole).toLowerCase();
    var currentUid = getCurrentUserId(currentUser);
    var scope = getViewerScope(currentUser, currentRole);

    var students = getStudentsLite();
    var umap = getUsersMap();
    var data = sh.getDataRange().getValues(), out = [];
    for (var i = 1; i < data.length; i++) {
      // teacher: own submissions only
      if (role === 'teacher') {
        var t = String(data[i][2] || '').toLowerCase();
        if (t !== 'teacher' || parseInt(data[i][3], 10) !== currentUid) continue;
      }
      // student/parent: own submissions or complaints about their (child's) student record
      if (!scope.all) {
        var mine = String(data[i][2] || '').toLowerCase() === role && parseInt(data[i][3], 10) === currentUid;
        var aboutMine = data[i][4] !== '' && scope.studentIds.indexOf(parseInt(data[i][4], 10)) !== -1;
        if (!mine && !aboutMine) continue;
      }
      out.push(rowToComplaint(data[i], students, umap));
    }
    out.sort(function(a,b){ return (b.CreatedAt||'').localeCompare(a.CreatedAt||''); }); // newest first
    return { success: true, data: out };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

function addComplaint(c, currentUser, currentRole) {
  try {
    if (!canWriteComplaints(currentRole)) return { success: false, message: 'Forbidden' };
    var sh = getSheet(COMPLAINTS_SHEET);
    if (!sh) return { success: false, message: 'Complaints sheet not found' };

    if (!c.Category || !c.Subject || !c.Description) {
      return { success: false, message: 'Category, Subject, Description are required' };
    }
    var allowedCats = ['academic','behavior','infrastructure','staff','transport','fees','safety','other'];
    var cat = String(c.Category).toLowerCase();
    if (allowedCats.indexOf(cat) === -1) return { success: false, message: 'Invalid category' };

    var role = String(currentRole).toLowerCase();
    var submitterType = role === 'admin' ? 'supervisor' : role; // admin can submit on behalf, default to supervisor type
    var submitterId = getCurrentUserId(currentUser);
    if (!submitterId) return { success: false, message: 'Could not resolve current user' };

    var priority = String(c.Priority || 'medium').toLowerCase();
    if (['low','medium','high','urgent'].indexOf(priority) === -1) priority = 'medium';

    var status = String(c.Status || 'open').toLowerCase();
    if (['open','in_progress','resolved','closed','rejected'].indexOf(status) === -1) status = 'open';

    var assignedTo = c.AssignedTo ? parseInt(c.AssignedTo, 10) : '';
    var rsid = c.RelatedStudentID ? parseInt(c.RelatedStudentID, 10) : '';

    var code = c.ComplaintCode && String(c.ComplaintCode).trim() !== ''
      ? String(c.ComplaintCode).trim()
      : generatePrefixedCode(sh, 1, 'CMP');

    var anon = (c.IsAnonymous === true || String(c.IsAnonymous) === '1' || String(c.IsAnonymous).toLowerCase() === 'true') ? '1' : '0';
    var attUrl = String(c.AttachmentURL || '').trim();
    if (attUrl.length > 500) return { success: false, message: 'AttachmentURL max 500 chars' };

    var ts = nowIso(), id = nextRowId(sh);
    sh.appendRow([
      id, code, submitterType, submitterId, rsid, cat,
      String(c.Subject).trim(), String(c.Description).trim(),
      priority, status, assignedTo, c.ResolutionNotes || '',
      status === 'resolved' || status === 'closed' ? ts : '',
      ts, ts,
      anon, attUrl
    ]);
    addLog(currentUser, 'Complaint Filed', code + ' (' + cat + '/' + priority + (anon === '1' ? '/anonymous' : '') + ')');
    return { success: true, message: 'Complaint filed — ' + code, id: id, complaintCode: code };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

function updateComplaint(id, c, currentUser, currentRole) {
  try {
    var role = String(currentRole).toLowerCase();
    if (role !== 'admin' && role !== 'supervisor') return { success: false, message: 'Forbidden — admin or supervisor only' };
    var sh = getSheet(COMPLAINTS_SHEET);
    if (!sh) return { success: false, message: 'Complaints sheet not found' };
    var idn = parseInt(id, 10);
    var rows = sh.getDataRange().getValues(), foundIdx = -1;
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] === idn) { foundIdx = i; break; }
    }
    if (foundIdx === -1) return { success: false, message: 'Complaint not found' };

    var allowedCats = ['academic','behavior','infrastructure','staff','transport','fees','safety','other'];
    var cat = String(c.Category || rows[foundIdx][5]).toLowerCase();
    if (allowedCats.indexOf(cat) === -1) return { success: false, message: 'Invalid category' };
    var priority = String(c.Priority || rows[foundIdx][8]).toLowerCase();
    if (['low','medium','high','urgent'].indexOf(priority) === -1) priority = 'medium';
    var status = String(c.Status || rows[foundIdx][9]).toLowerCase();
    if (['open','in_progress','resolved','closed','rejected'].indexOf(status) === -1) status = 'open';

    var row = foundIdx + 1, ts = nowIso();
    sh.getRange(row, 5).setValue(c.RelatedStudentID ? parseInt(c.RelatedStudentID, 10) : '');
    sh.getRange(row, 6).setValue(cat);
    sh.getRange(row, 7).setValue(String(c.Subject || rows[foundIdx][6]).trim());
    sh.getRange(row, 8).setValue(String(c.Description || rows[foundIdx][7]).trim());
    sh.getRange(row, 9).setValue(priority);
    sh.getRange(row, 10).setValue(status);
    sh.getRange(row, 11).setValue(c.AssignedTo ? parseInt(c.AssignedTo, 10) : '');
    sh.getRange(row, 12).setValue(c.ResolutionNotes || '');
    if ((status === 'resolved' || status === 'closed') && !rows[foundIdx][12]) {
      sh.getRange(row, 13).setValue(ts);
    }
    sh.getRange(row, 15).setValue(ts);
    if (c.IsAnonymous != null) {
      var anon2 = (c.IsAnonymous === true || String(c.IsAnonymous) === '1' || String(c.IsAnonymous).toLowerCase() === 'true') ? '1' : '0';
      sh.getRange(row, 16).setValue(anon2);
    }
    if (c.AttachmentURL != null) {
      var attUrl2 = String(c.AttachmentURL || '').trim();
      if (attUrl2.length > 500) return { success: false, message: 'AttachmentURL max 500 chars' };
      sh.getRange(row, 17).setValue(attUrl2);
    }
    addLog(currentUser, 'Complaint Updated', 'Updated id ' + idn + ' — ' + status);
    return { success: true, message: 'Complaint updated successfully' };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

function deleteComplaint(id, currentUser, currentRole) {
  try {
    if (!isAdmin(currentRole)) return { success: false, message: 'Forbidden — admin only' };
    var sh = getSheet(COMPLAINTS_SHEET);
    if (!sh) return { success: false, message: 'Complaints sheet not found' };
    var idn = parseInt(id, 10);
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] !== idn) continue;
      sh.deleteRow(i + 1);
      addLog(currentUser, 'Complaint Deleted', 'Hard-deleted complaint id ' + idn);
      return { success: true, message: 'Complaint deleted successfully' };
    }
    return { success: false, message: 'Complaint not found' };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

// ============== Notices CRUD ==============
function rowToNotice(row, cmap, umap) {
  var clsId = row[6], pby = row[10];
  // labels
  var nt = String(row[3] || '').toLowerCase();
  var aud = String(row[5] || '').toLowerCase();
  var pri = String(row[8] || '').toLowerCase();
  var cap = function(s){ return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; };
  return {
    ID: row[0], Title: row[1], Description: row[2],
    NoticeType: nt,
    NoticeTypeLabel: cap(nt),
    NoticeDate: toIso(row[4]),
    TargetAudience: aud,
    TargetAudienceLabel: cap(aud.replace(/_/g, ' ')),
    TargetClassID: clsId,
    TargetClassLabel: clsId && cmap[clsId] ? cmap[clsId].label : '',
    AttachmentURL: row[7] || '',
    Priority: pri,
    PriorityLabel: cap(pri),
    ExpiryDate: toIso(row[9]),
    PostedBy: pby,
    PostedByName: (pby && umap && umap[pby]) ? umap[pby].fullName : '',
    IsActive: String(row[11]) === '1' || row[11] === 1 || row[11] === true,
    CreatedAt: toIso(row[13]), UpdatedAt: toIso(row[14]),
    AcknowledgmentRequired: String(row[15]) === '1' || row[15] === 1 || row[15] === true
  };
}

function getAllNotices(currentUser, currentRole) {
  try {
    if (!canReadNotices(currentRole)) return { success: false, message: 'Forbidden' };
    var sh = getSheet(NOTICES_SHEET);
    if (!sh) return { success: false, message: 'Notices sheet not found' };

    var cmap = getClassesMap(), umap = getUsersMap();
    var scope = getViewerScope(currentUser, currentRole);
    var data = sh.getDataRange().getValues(), out = [];
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][12]) === '1') continue;
      // audience filter for non-staff roles
      if (!noticeAudienceMatches(data[i][5], data[i][6], currentRole, currentUser, scope.classIds)) continue;
      out.push(rowToNotice(data[i], cmap, umap));
    }
    out.sort(function(a,b){ return (b.NoticeDate||'').localeCompare(a.NoticeDate||''); }); // newest first
    return { success: true, data: out };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

function addNotice(n, currentUser, currentRole) {
  try {
    if (!canWriteNotices(currentRole)) return { success: false, message: 'Forbidden — admin/supervisor only' };
    var sh = getSheet(NOTICES_SHEET);
    if (!sh) return { success: false, message: 'Notices sheet not found' };
    if (!n.Title || !n.Description || !n.NoticeType || !n.NoticeDate || !n.TargetAudience) {
      return { success: false, message: 'Title, Description, NoticeType, NoticeDate, TargetAudience required' };
    }
    var allowedTypes = ['event','function','program','announcement','holiday','exam','meeting','incident','other'];
    var t = String(n.NoticeType).toLowerCase();
    if (allowedTypes.indexOf(t) === -1) return { success: false, message: 'Invalid notice type' };
    var allowedAud = ['all','students','teachers','parents','staff','class_specific'];
    var aud = String(n.TargetAudience).toLowerCase();
    if (allowedAud.indexOf(aud) === -1) return { success: false, message: 'Invalid audience' };
    // teachers may only post class_specific notices to a class they teach
    if (String(currentRole).toLowerCase() === 'teacher') {
      if (aud !== 'class_specific') return { success: false, message: 'Teachers can only post class-specific notices to their own class' };
      if (getTeacherClassIds(currentUser).indexOf(parseInt(n.TargetClassID, 10)) === -1) return { success: false, message: 'You can only post notices to a class you teach' };
    }
    var priority = String(n.Priority || 'medium').toLowerCase();
    if (['low','medium','high','urgent'].indexOf(priority) === -1) priority = 'medium';

    var classId = '';
    if (aud === 'class_specific') {
      classId = parseInt(n.TargetClassID, 10);
      if (isNaN(classId)) return { success: false, message: 'TargetClassID required when audience = class_specific' };
      var cmap = getClassesMap();
      if (!cmap[classId]) return { success: false, message: 'Target class not found' };
    }

    var postedBy = getCurrentUserId(currentUser);
    if (!postedBy) return { success: false, message: 'Could not resolve current user' };

    var isActive = (n.IsActive === false || String(n.IsActive) === '0' || String(n.IsActive).toLowerCase() === 'false') ? '0' : '1';
    var ackReq = (n.AcknowledgmentRequired === true || String(n.AcknowledgmentRequired) === '1' || String(n.AcknowledgmentRequired).toLowerCase() === 'true') ? '1' : '0';
    var ts = nowIso(), id = nextRowId(sh);
    sh.appendRow([
      id, String(n.Title).trim(), String(n.Description).trim(), t, toIso(n.NoticeDate),
      aud, classId, n.AttachmentURL || '', priority, toIso(n.ExpiryDate),
      postedBy, isActive, '0', ts, ts,
      ackReq
    ]);
    addLog(currentUser, 'Notice Posted', n.Title + ' (' + t + '/' + aud + (ackReq === '1' ? '/ack-required' : '') + ')');
    return { success: true, message: 'Notice posted successfully', id: id };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

function updateNotice(id, n, currentUser, currentRole) {
  try {
    if (!canWriteNotices(currentRole)) return { success: false, message: 'Forbidden' };
    var sh = getSheet(NOTICES_SHEET);
    if (!sh) return { success: false, message: 'Notices sheet not found' };
    var idn = parseInt(id, 10);
    var rows = sh.getDataRange().getValues(), foundIdx = -1;
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] === idn && String(rows[i][12]) === '0') { foundIdx = i; break; }
    }
    if (foundIdx === -1) return { success: false, message: 'Notice not found' };

    // teachers may only edit their own class_specific notices for a class they teach
    if (String(currentRole).toLowerCase() === 'teacher') {
      if (parseInt(rows[foundIdx][10], 10) !== getCurrentUserId(currentUser)) return { success: false, message: 'You can only edit notices you posted' };
      if (String(n.TargetAudience).toLowerCase() !== 'class_specific') return { success: false, message: 'Teachers can only post class-specific notices' };
      if (getTeacherClassIds(currentUser).indexOf(parseInt(n.TargetClassID, 10)) === -1) return { success: false, message: 'You can only post notices to a class you teach' };
    }

    if (!n.Title || !n.Description || !n.NoticeType || !n.NoticeDate || !n.TargetAudience) {
      return { success: false, message: 'Required fields missing' };
    }
    var allowedTypes = ['event','function','program','announcement','holiday','exam','meeting','incident','other'];
    var t = String(n.NoticeType).toLowerCase();
    if (allowedTypes.indexOf(t) === -1) return { success: false, message: 'Invalid type' };
    var allowedAud = ['all','students','teachers','parents','staff','class_specific'];
    var aud = String(n.TargetAudience).toLowerCase();
    if (allowedAud.indexOf(aud) === -1) return { success: false, message: 'Invalid audience' };
    var priority = String(n.Priority || 'medium').toLowerCase();
    if (['low','medium','high','urgent'].indexOf(priority) === -1) priority = 'medium';

    var classId = '';
    if (aud === 'class_specific') {
      classId = parseInt(n.TargetClassID, 10);
      if (isNaN(classId)) return { success: false, message: 'TargetClassID required' };
    }

    var isActive = (n.IsActive === false || String(n.IsActive) === '0' || String(n.IsActive).toLowerCase() === 'false') ? '0' : '1';
    var row = foundIdx + 1, ts = nowIso();
    sh.getRange(row, 2).setValue(String(n.Title).trim());
    sh.getRange(row, 3).setValue(String(n.Description).trim());
    sh.getRange(row, 4).setValue(t);
    sh.getRange(row, 5).setValue(toIso(n.NoticeDate));
    sh.getRange(row, 6).setValue(aud);
    sh.getRange(row, 7).setValue(classId);
    sh.getRange(row, 8).setValue(n.AttachmentURL || '');
    sh.getRange(row, 9).setValue(priority);
    sh.getRange(row, 10).setValue(toIso(n.ExpiryDate));
    sh.getRange(row, 12).setValue(isActive);
    sh.getRange(row, 15).setValue(ts);
    if (n.AcknowledgmentRequired != null) {
      var ackReq2 = (n.AcknowledgmentRequired === true || String(n.AcknowledgmentRequired) === '1' || String(n.AcknowledgmentRequired).toLowerCase() === 'true') ? '1' : '0';
      sh.getRange(row, 16).setValue(ackReq2);
    }
    addLog(currentUser, 'Notice Updated', 'id ' + idn + ': ' + n.Title);
    return { success: true, message: 'Notice updated successfully' };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

function deleteNotice(id, currentUser, currentRole) {
  try {
    var _isTeacher = String(currentRole).toLowerCase() === 'teacher';
    if (!isAdmin(currentRole) && !_isTeacher) return { success: false, message: 'Forbidden — admin only' };
    var sh = getSheet(NOTICES_SHEET);
    if (!sh) return { success: false, message: 'Notices sheet not found' };
    var idn = parseInt(id, 10);
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] !== idn || String(data[i][12]) === '1') continue;
      if (_isTeacher && parseInt(data[i][10], 10) !== getCurrentUserId(currentUser)) return { success: false, message: 'You can only delete notices you posted' };
      var row = i + 1, ts = nowIso();
      sh.getRange(row, 13).setValue('1');
      sh.getRange(row, 15).setValue(ts);
      addLog(currentUser, 'Notice Deleted', 'Soft-deleted notice id ' + idn);
      return { success: true, message: 'Notice deleted successfully' };
    }
    return { success: false, message: 'Notice not found' };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

// ============== Helpdesk Tickets CRUD (NO is_deleted) ==============
function rowToTicket(row, students, umap) {
  var rsid = row[4], assignedTo = row[10];
  // labels
  var rtype = String(row[2] || '').toLowerCase();
  var rtypeMap = { student:'Student', parent:'Parent', teacher:'Teacher', supervisor:'Supervisor', staff:'Staff' };
  var cat = String(row[5] || '').toLowerCase();
  var pri = String(row[8] || '').toLowerCase();
  var st = String(row[9] || '').toLowerCase();
  var cap = function(s){ return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; };
  return {
    ID: row[0], TicketCode: row[1],
    RaisedByType: rtype,
    RaisedByTypeLabel: rtypeMap[rtype] || cap(rtype),
    RaiserID: row[3],
    RaiserName: resolvePolymorphicName(row[2], row[3]),
    RelatedStudentID: rsid,
    RelatedStudentName: rsid && students[rsid] ? students[rsid].fullName : '',
    Category: cat,
    CategoryLabel: cap(cat),
    Subject: row[6], Description: row[7],
    Priority: pri,
    PriorityLabel: cap(pri),
    Status: st,
    StatusLabel: cap(st.replace(/_/g, ' ')),
    AssignedTo: assignedTo,
    AssignedToName: (assignedTo && umap && umap[assignedTo]) ? umap[assignedTo].fullName : '',
    AdminResponse: row[11] || '',
    ResolvedAt: toIso(row[12]),
    CreatedAt: toIso(row[13]), UpdatedAt: toIso(row[14]),
    DueBy: toIso(row[15])
  };
}

// SLA hours by priority
function helpdeskSlaHours(priority) {
  var p = String(priority || 'medium').toLowerCase();
  if (p === 'urgent') return 4;
  if (p === 'high') return 24;
  if (p === 'low') return 72;
  return 48; // medium
}

function getAllHelpdeskTickets(currentUser, currentRole) {
  try {
    if (!canReadHelpdesk(currentRole)) return { success: false, message: 'Forbidden — no access' };
    var sh = getSheet(HELPDESK_SHEET);
    if (!sh) return { success: false, message: 'Helpdesk_Tickets sheet not found' };
    var students = getStudentsLite(), umap = getUsersMap();
    var role = String(currentRole).toLowerCase();
    var currentUid = getCurrentUserId(currentUser);
    var scope = getViewerScope(currentUser, currentRole);
    var data = sh.getDataRange().getValues(), out = [];
    for (var i = 1; i < data.length; i++) {
      // student/parent: own tickets or tickets about their (child's) student record
      if (!scope.all) {
        var mine = String(data[i][2] || '').toLowerCase() === role && parseInt(data[i][3], 10) === currentUid;
        var aboutMine = data[i][4] !== '' && scope.studentIds.indexOf(parseInt(data[i][4], 10)) !== -1;
        if (!mine && !aboutMine) continue;
      }
      out.push(rowToTicket(data[i], students, umap));
    }
    out.sort(function(a,b){ return (b.CreatedAt||'').localeCompare(a.CreatedAt||''); }); // newest first
    return { success: true, data: out };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

function addHelpdeskTicket(t, currentUser, currentRole) {
  try {
    var role = String(currentRole).toLowerCase();
    // admin/supervisor can also raise on behalf; student/parent are the primary raisers
    if (!canReadHelpdesk(currentRole)) return { success: false, message: 'Forbidden' };
    var sh = getSheet(HELPDESK_SHEET);
    if (!sh) return { success: false, message: 'Helpdesk_Tickets sheet not found' };

    if (!t.RelatedStudentID || !t.Category || !t.Subject || !t.Description) {
      return { success: false, message: 'RelatedStudentID, Category, Subject, Description are required' };
    }
    var allowedCats = ['academic','technical','fees','admission','documents','general','other'];
    var cat = String(t.Category).toLowerCase();
    if (allowedCats.indexOf(cat) === -1) return { success: false, message: 'Invalid category' };

    var sid = parseInt(t.RelatedStudentID, 10);
    var students = getStudentsLite();
    if (!students[sid]) return { success: false, message: 'Student not found' };

    var raisedByType = (role === 'student' || role === 'parent') ? role : 'parent'; // staff raise as parent on behalf
    var raiserId = getCurrentUserId(currentUser);
    if (!raiserId) return { success: false, message: 'Could not resolve current user' };

    var priority = String(t.Priority || 'medium').toLowerCase();
    if (['low','medium','high'].indexOf(priority) === -1) priority = 'medium';
    var status = String(t.Status || 'open').toLowerCase();
    if (['open','in_progress','awaiting_response','resolved','closed'].indexOf(status) === -1) status = 'open';

    var code = t.TicketCode && String(t.TicketCode).trim() !== ''
      ? String(t.TicketCode).trim()
      : generatePrefixedCode(sh, 1, 'TKT');

    var ts = nowIso(), id = nextRowId(sh);
    var due = t.DueBy && String(t.DueBy).trim() !== ''
      ? String(t.DueBy).trim()
      : new Date(Date.now() + helpdeskSlaHours(priority) * 3600 * 1000).toISOString();
    sh.appendRow([
      id, code, raisedByType, raiserId, sid, cat,
      String(t.Subject).trim(), String(t.Description).trim(),
      priority, status, t.AssignedTo ? parseInt(t.AssignedTo, 10) : '',
      t.AdminResponse || '',
      status === 'resolved' || status === 'closed' ? ts : '',
      ts, ts,
      toIso(due)
    ]);
    addLog(currentUser, 'Ticket Raised', code + ' (' + cat + '/' + priority + ', SLA ' + helpdeskSlaHours(priority) + 'h)');
    return { success: true, message: 'Ticket raised — ' + code, id: id, ticketCode: code };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

function updateHelpdeskTicket(id, t, currentUser, currentRole) {
  try {
    if (!canManageHelpdesk(currentRole)) return { success: false, message: 'Forbidden — admin/supervisor only' };
    var sh = getSheet(HELPDESK_SHEET);
    if (!sh) return { success: false, message: 'Helpdesk_Tickets sheet not found' };
    var idn = parseInt(id, 10);
    var rows = sh.getDataRange().getValues(), foundIdx = -1;
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] === idn) { foundIdx = i; break; }
    }
    if (foundIdx === -1) return { success: false, message: 'Ticket not found' };

    var allowedCats = ['academic','technical','fees','admission','documents','general','other'];
    var cat = String(t.Category || rows[foundIdx][5]).toLowerCase();
    if (allowedCats.indexOf(cat) === -1) return { success: false, message: 'Invalid category' };
    var priority = String(t.Priority || rows[foundIdx][8]).toLowerCase();
    if (['low','medium','high'].indexOf(priority) === -1) priority = 'medium';
    var status = String(t.Status || rows[foundIdx][9]).toLowerCase();
    if (['open','in_progress','awaiting_response','resolved','closed'].indexOf(status) === -1) status = 'open';

    var row = foundIdx + 1, ts = nowIso();
    sh.getRange(row, 6).setValue(cat);
    sh.getRange(row, 7).setValue(String(t.Subject || rows[foundIdx][6]).trim());
    sh.getRange(row, 8).setValue(String(t.Description || rows[foundIdx][7]).trim());
    sh.getRange(row, 9).setValue(priority);
    sh.getRange(row, 10).setValue(status);
    sh.getRange(row, 11).setValue(t.AssignedTo ? parseInt(t.AssignedTo, 10) : '');
    sh.getRange(row, 12).setValue(t.AdminResponse || '');
    if ((status === 'resolved' || status === 'closed') && !rows[foundIdx][12]) {
      sh.getRange(row, 13).setValue(ts);
    }
    sh.getRange(row, 15).setValue(ts);
    if (t.DueBy != null) sh.getRange(row, 16).setValue(toIso(t.DueBy));
    addLog(currentUser, 'Ticket Updated', 'id ' + idn + ' — ' + status);
    return { success: true, message: 'Ticket updated successfully' };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

function deleteHelpdeskTicket(id, currentUser, currentRole) {
  try {
    if (!isAdmin(currentRole)) return { success: false, message: 'Forbidden — admin only' };
    var sh = getSheet(HELPDESK_SHEET);
    if (!sh) return { success: false, message: 'Helpdesk_Tickets sheet not found' };
    var idn = parseInt(id, 10);
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] !== idn) continue;
      sh.deleteRow(i + 1);
      addLog(currentUser, 'Ticket Deleted', 'Hard-deleted ticket id ' + idn);
      return { success: true, message: 'Ticket deleted successfully' };
    }
    return { success: false, message: 'Ticket not found' };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

// ============== Lesson Plans CRUD (admin can delete but NOT write/update) ==============
function rowToLessonPlan(row, cmap, smap, umap) {
  var tid = row[1], cid = row[2], sbid = row[3];
  // label maps
  var pp = String(row[4] || '').toLowerCase();
  var st = String(row[12] || '').toLowerCase();
  var cap = function(s){ return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; };
  return {
    ID: row[0], TeacherID: tid,
    TeacherName: (tid && umap[tid]) ? umap[tid].fullName : '',
    ClassID: cid, ClassLabel: cmap[cid] ? cmap[cid].label : '',
    SubjectID: sbid, SubjectName: smap[sbid] ? smap[sbid].subjectName : '',
    PlanPeriod: pp,
    PlanPeriodLabel: cap(pp),
    StartDate: toIso(row[5]), EndDate: toIso(row[6]),
    Topic: row[7], Objectives: row[8],
    TeachingMethods: row[9] || '', Resources: row[10] || '',
    AssessmentPlan: row[11] || '',
    Status: st,
    StatusLabel: cap(st.replace('_', ' ')),
    CreatedAt: toIso(row[14]), UpdatedAt: toIso(row[15]),
    ReviewedBy: row[16] === '' || row[16] == null ? null : (parseInt(row[16], 10) || null),
    ReviewedByName: (row[16] && umap && umap[row[16]]) ? umap[row[16]].fullName : '',
    ReviewStatus: String(row[17] || 'pending').toLowerCase()
  };
}

function getAllLessonPlans(currentUser, currentRole) {
  try {
    if (!canReadLessonPlans(currentRole)) return { success: false, message: 'Forbidden' };
    var sh = getSheet(LESSON_PLANS_SHEET);
    if (!sh) return { success: false, message: 'Lesson_Plans sheet not found' };
    var role = String(currentRole).toLowerCase();
    var teacherUid = role === 'teacher' ? getCurrentUserId(currentUser) : null;

    var cmap = getClassesMap(), smap = getSubjectsMap(), umap = getUsersMap();
    var data = sh.getDataRange().getValues(), out = [];
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][13]) === '1') continue;
      // teacher: own plans only
      if (teacherUid !== null && parseInt(data[i][1], 10) !== teacherUid) continue;
      out.push(rowToLessonPlan(data[i], cmap, smap, umap));
    }
    out.sort(function(a,b){ return (b.StartDate||'').localeCompare(a.StartDate||''); }); // newest first
    return { success: true, data: out };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

function addLessonPlan(p, currentUser, currentRole) {
  try {
    // ONLY teacher can add (admin can delete but not create)
    var role = String(currentRole).toLowerCase();
    if (role !== 'teacher') return { success: false, message: 'Only teachers can create lesson plans' };
    var sh = getSheet(LESSON_PLANS_SHEET);
    if (!sh) return { success: false, message: 'Lesson_Plans sheet not found' };

    if (!p.ClassID || !p.SubjectID || !p.PlanPeriod || !p.StartDate || !p.EndDate || !p.Topic || !p.Objectives) {
      return { success: false, message: 'ClassID, SubjectID, PlanPeriod, StartDate, EndDate, Topic, Objectives are required' };
    }
    var allowedPeriods = ['daily','weekly','monthly','term'];
    var pp = String(p.PlanPeriod).toLowerCase();
    if (allowedPeriods.indexOf(pp) === -1) return { success: false, message: 'Invalid plan_period' };
    var status = String(p.Status || 'planned').toLowerCase();
    if (['planned','in_progress','completed','postponed'].indexOf(status) === -1) status = 'planned';
    if (new Date(p.StartDate) > new Date(p.EndDate)) {
      return { success: false, message: 'EndDate must be on or after StartDate' };
    }

    var cid = parseInt(p.ClassID, 10), sid = parseInt(p.SubjectID, 10);
    var cmap = getClassesMap(), smap = getSubjectsMap();
    if (!cmap[cid]) return { success: false, message: 'Class not found' };
    if (!smap[sid]) return { success: false, message: 'Subject not found' };
    if (parseInt(smap[sid].classId, 10) !== cid) return { success: false, message: 'Subject does not belong to selected class' };

    // teacher must be assigned to this class+subject
    var teacherUid = getCurrentUserId(currentUser);
    var asgMap = getTeacherAssignmentsMap(teacherUid);
    if (!asgMap[cid + '|' + sid]) return { success: false, message: 'You are not assigned to this class+subject' };

    var ts = nowIso(), id = nextRowId(sh);
    sh.appendRow([
      id, teacherUid, cid, sid, pp,
      toIso(p.StartDate), toIso(p.EndDate),
      String(p.Topic).trim(), String(p.Objectives).trim(),
      p.TeachingMethods || '', p.Resources || '', p.AssessmentPlan || '',
      status, '0', ts, ts,
      '', 'pending'
    ]);
    addLog(currentUser, 'Lesson Plan Added', 'Class ' + cid + ' / Subject ' + sid + ' / ' + pp);
    return { success: true, message: 'Lesson plan added successfully', id: id };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

function updateLessonPlan(id, p, currentUser, currentRole) {
  try {
    var role = String(currentRole).toLowerCase();
    if (role !== 'teacher') return { success: false, message: 'Only teachers can update lesson plans' };
    var sh = getSheet(LESSON_PLANS_SHEET);
    if (!sh) return { success: false, message: 'Lesson_Plans sheet not found' };
    var idn = parseInt(id, 10);
    var rows = sh.getDataRange().getValues(), foundIdx = -1;
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] === idn && String(rows[i][13]) === '0') { foundIdx = i; break; }
    }
    if (foundIdx === -1) return { success: false, message: 'Lesson plan not found' };

    var teacherUid = getCurrentUserId(currentUser);
    if (parseInt(rows[foundIdx][1], 10) !== teacherUid) {
      return { success: false, message: 'You can only edit your own lesson plans' };
    }

    var allowedPeriods = ['daily','weekly','monthly','term'];
    var pp = String(p.PlanPeriod || rows[foundIdx][4]).toLowerCase();
    if (allowedPeriods.indexOf(pp) === -1) return { success: false, message: 'Invalid plan_period' };
    var status = String(p.Status || 'planned').toLowerCase();
    if (['planned','in_progress','completed','postponed'].indexOf(status) === -1) status = 'planned';

    var row = foundIdx + 1, ts = nowIso();
    sh.getRange(row, 5).setValue(pp);
    sh.getRange(row, 6).setValue(toIso(p.StartDate));
    sh.getRange(row, 7).setValue(toIso(p.EndDate));
    sh.getRange(row, 8).setValue(String(p.Topic || rows[foundIdx][7]).trim());
    sh.getRange(row, 9).setValue(String(p.Objectives || rows[foundIdx][8]).trim());
    sh.getRange(row, 10).setValue(p.TeachingMethods || '');
    sh.getRange(row, 11).setValue(p.Resources || '');
    sh.getRange(row, 12).setValue(p.AssessmentPlan || '');
    sh.getRange(row, 13).setValue(status);
    sh.getRange(row, 16).setValue(ts);
    addLog(currentUser, 'Lesson Plan Updated', 'id ' + idn);
    return { success: true, message: 'Lesson plan updated successfully' };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

// admin OR teacher (own) can delete
function deleteLessonPlan(id, currentUser, currentRole) {
  try {
    var role = String(currentRole).toLowerCase();
    if (role !== 'admin' && role !== 'teacher') return { success: false, message: 'Forbidden' };
    var sh = getSheet(LESSON_PLANS_SHEET);
    if (!sh) return { success: false, message: 'Lesson_Plans sheet not found' };
    var idn = parseInt(id, 10);
    var rows = sh.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] !== idn || String(rows[i][13]) === '1') continue;
      // teacher can delete own only
      if (role === 'teacher' && parseInt(rows[i][1], 10) !== getCurrentUserId(currentUser)) {
        return { success: false, message: 'You can only delete your own lesson plans' };
      }
      var row = i + 1, ts = nowIso();
      sh.getRange(row, 14).setValue('1');
      sh.getRange(row, 16).setValue(ts);
      addLog(currentUser, 'Lesson Plan Deleted', 'Soft-deleted lesson plan id ' + idn);
      return { success: true, message: 'Lesson plan deleted successfully' };
    }
    return { success: false, message: 'Lesson plan not found' };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

// ============== Teaching Logbook CRUD (NO is_deleted, hard delete; UNIQUE composite; teacher same-day update) ==============
function rowToLogbook(row, cmap, smap, umap, homeworkOnly) {
  var tid = row[1], cid = row[2], sbid = row[3];
  if (homeworkOnly) {
    return {
      ID: row[0],
      ClassLabel: cmap[cid] ? cmap[cid].label : '',
      SubjectName: smap[sbid] ? smap[sbid].subjectName : '',
      LogDate: toIso(row[4]),
      TopicCovered: row[6],
      HomeworkAssigned: row[8] || '',
      HomeworkDueDate: toIso(row[9]),
      _homeworkOnly: true
    };
  }
  return {
    ID: row[0], TeacherID: tid,
    TeacherName: (tid && umap[tid]) ? umap[tid].fullName : '',
    ClassID: cid, ClassLabel: cmap[cid] ? cmap[cid].label : '',
    SubjectID: sbid, SubjectName: smap[sbid] ? smap[sbid].subjectName : '',
    LogDate: toIso(row[4]),
    PeriodNumber: row[5],
    TopicCovered: row[6],
    Description: row[7] || '',
    HomeworkAssigned: row[8] || '',
    HomeworkDueDate: toIso(row[9]),
    Status: String(row[10] || '').toLowerCase(),
    Remarks: row[11] || '',
    CreatedAt: toIso(row[12]), UpdatedAt: toIso(row[13]),
    StudentsPresent: row[14] === '' || row[14] == null ? '' : (parseInt(row[14], 10) || 0)
  };
}

function getAllLogbookEntries(currentUser, currentRole) {
  try {
    if (!canReadLogbook(currentRole)) return { success: false, message: 'Forbidden' };
    var sh = getSheet(TEACHING_LOGBOOK_SHEET);
    if (!sh) return { success: false, message: 'Teaching_Logbook sheet not found' };
    var role = String(currentRole).toLowerCase();
    var teacherUid = role === 'teacher' ? getCurrentUserId(currentUser) : null;
    var homeworkOnly = role === 'student' || role === 'parent';

    var cmap = getClassesMap(), smap = getSubjectsMap(), umap = getUsersMap();
    var data = sh.getDataRange().getValues(), out = [];
    for (var i = 1; i < data.length; i++) {
      // teacher: own only
      if (teacherUid !== null && parseInt(data[i][1], 10) !== teacherUid) continue;
      out.push(rowToLogbook(data[i], cmap, smap, umap, homeworkOnly));
    }
    return { success: true, data: out };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

function logbookExists(sh, teacherId, classId, subjectId, logDate, periodNumber, excludeId) {
  var data = sh.getDataRange().getValues();
  var t = parseInt(teacherId, 10), c = parseInt(classId, 10), s = parseInt(subjectId, 10);
  // compare on date portion only (date-only string), so a Date cell vs ISO string vs YYYY-MM-DD all match
  var d = toIso(logDate).split('T')[0];
  var p = periodNumber === '' || periodNumber == null ? '' : parseInt(periodNumber, 10);
  for (var i = 1; i < data.length; i++) {
    if (excludeId !== undefined && data[i][0] === excludeId) continue;
    var rowP = data[i][5] === '' || data[i][5] == null ? '' : parseInt(data[i][5], 10);
    if (parseInt(data[i][1], 10) === t &&
        parseInt(data[i][2], 10) === c &&
        parseInt(data[i][3], 10) === s &&
        toIso(data[i][4]).split('T')[0] === d &&
        rowP === p) return true;
  }
  return false;
}

function addLogbookEntry(l, currentUser, currentRole) {
  try {
    var role = String(currentRole).toLowerCase();
    if (role !== 'teacher') return { success: false, message: 'Only teachers can add logbook entries' };
    var sh = getSheet(TEACHING_LOGBOOK_SHEET);
    if (!sh) return { success: false, message: 'Teaching_Logbook sheet not found' };

    if (!l.ClassID || !l.SubjectID || !l.LogDate || !l.TopicCovered) {
      return { success: false, message: 'ClassID, SubjectID, LogDate, TopicCovered are required' };
    }
    var status = String(l.Status || 'completed').toLowerCase();
    if (['completed','partial','not_taught'].indexOf(status) === -1) status = 'completed';

    var cid = parseInt(l.ClassID, 10), sid = parseInt(l.SubjectID, 10);
    var smap = getSubjectsMap();
    if (!smap[sid] || parseInt(smap[sid].classId, 10) !== cid) {
      return { success: false, message: 'Subject does not belong to selected class' };
    }

    var teacherUid = getCurrentUserId(currentUser);
    var asgMap = getTeacherAssignmentsMap(teacherUid);
    if (!asgMap[cid + '|' + sid]) return { success: false, message: 'You are not assigned to this class+subject' };

    var period = l.PeriodNumber === '' || l.PeriodNumber == null ? '' : parseInt(l.PeriodNumber, 10);
    var logDateIso = toIso(l.LogDate);
    var hwDueIso = l.HomeworkDueDate ? toIso(l.HomeworkDueDate) : '';
    if (logbookExists(sh, teacherUid, cid, sid, logDateIso, period)) {
      return { success: false, message: 'A log entry already exists for this teacher/class/subject/date/period' };
    }

    var ts = nowIso(), id = nextRowId(sh);
    var newRow = sh.getLastRow() + 1;
    // pin LogDate (col 5) + HomeworkDueDate (col 10) as text format → blocks auto-date conversion
    sh.getRange(newRow, 5).setNumberFormat('@');
    sh.getRange(newRow, 10).setNumberFormat('@');
    var presentCount = '';
    if (l.StudentsPresent !== '' && l.StudentsPresent != null) {
      var pc = parseInt(l.StudentsPresent, 10);
      if (!isNaN(pc) && pc >= 0) presentCount = pc;
    }
    sh.appendRow([
      id, teacherUid, cid, sid, logDateIso, period,
      String(l.TopicCovered).trim(), l.Description || '',
      l.HomeworkAssigned || '', hwDueIso,
      status, l.Remarks || '', ts, ts,
      presentCount
    ]);
    // re-set as strings to defeat any conversion that happened in appendRow
    sh.getRange(newRow, 5).setNumberFormat('@').setValue(logDateIso);
    sh.getRange(newRow, 10).setNumberFormat('@').setValue(hwDueIso);
    addLog(currentUser, 'Logbook Entry Added', 'Class ' + cid + ' / Subject ' + sid + ' / ' + logDateIso);
    return { success: true, message: 'Logbook entry added successfully', id: id };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

function updateLogbookEntry(id, l, currentUser, currentRole) {
  try {
    var role = String(currentRole).toLowerCase();
    if (role !== 'teacher') return { success: false, message: 'Only teachers can update logbook entries' };
    var sh = getSheet(TEACHING_LOGBOOK_SHEET);
    if (!sh) return { success: false, message: 'Teaching_Logbook sheet not found' };
    var idn = parseInt(id, 10);
    var rows = sh.getDataRange().getValues(), foundIdx = -1;
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] === idn) { foundIdx = i; break; }
    }
    if (foundIdx === -1) return { success: false, message: 'Logbook entry not found' };

    var teacherUid = getCurrentUserId(currentUser);
    if (parseInt(rows[foundIdx][1], 10) !== teacherUid) {
      return { success: false, message: 'You can only edit your own logbook entries' };
    }
    // same-day rule
    var existingDate = String(rows[foundIdx][4]).split('T')[0];
    if (!isDateToday(existingDate)) {
      return { success: false, message: 'Logbook entries can only be edited on the same day they cover (' + existingDate + ' is not today)' };
    }

    var cid = parseInt(l.ClassID, 10), sid = parseInt(l.SubjectID, 10);
    var smap = getSubjectsMap();
    if (!smap[sid] || parseInt(smap[sid].classId, 10) !== cid) {
      return { success: false, message: 'Subject does not belong to class' };
    }

    var period = l.PeriodNumber === '' || l.PeriodNumber == null ? '' : parseInt(l.PeriodNumber, 10);
    var logDateIso = toIso(l.LogDate);
    var hwDueIso = l.HomeworkDueDate ? toIso(l.HomeworkDueDate) : '';
    if (logbookExists(sh, teacherUid, cid, sid, logDateIso, period, idn)) {
      return { success: false, message: 'Duplicate composite key' };
    }
    var status = String(l.Status || 'completed').toLowerCase();
    if (['completed','partial','not_taught'].indexOf(status) === -1) status = 'completed';

    var row = foundIdx + 1, ts = nowIso();
    sh.getRange(row, 3).setValue(cid);
    sh.getRange(row, 4).setValue(sid);
    sh.getRange(row, 5).setNumberFormat('@').setValue(logDateIso);
    sh.getRange(row, 6).setValue(period);
    sh.getRange(row, 7).setValue(String(l.TopicCovered).trim());
    sh.getRange(row, 8).setValue(l.Description || '');
    sh.getRange(row, 9).setValue(l.HomeworkAssigned || '');
    sh.getRange(row, 10).setNumberFormat('@').setValue(hwDueIso);
    sh.getRange(row, 11).setValue(status);
    sh.getRange(row, 12).setValue(l.Remarks || '');
    sh.getRange(row, 14).setValue(ts);
    if (l.StudentsPresent != null) {
      var pc2 = parseInt(l.StudentsPresent, 10);
      sh.getRange(row, 15).setValue(isNaN(pc2) || pc2 < 0 ? '' : pc2);
    }
    addLog(currentUser, 'Logbook Entry Updated', 'id ' + idn);
    return { success: true, message: 'Logbook entry updated successfully' };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

function deleteLogbookEntry(id, currentUser, currentRole) {
  try {
    if (!isAdmin(currentRole)) return { success: false, message: 'Forbidden — admin only' };
    var sh = getSheet(TEACHING_LOGBOOK_SHEET);
    if (!sh) return { success: false, message: 'Teaching_Logbook sheet not found' };
    var idn = parseInt(id, 10);
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] !== idn) continue;
      sh.deleteRow(i + 1);
      addLog(currentUser, 'Logbook Entry Deleted', 'Hard-deleted logbook id ' + idn);
      return { success: true, message: 'Logbook entry deleted successfully' };
    }
    return { success: false, message: 'Logbook entry not found' };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

// ============== Documents CRUD (polymorphic entity + verification) ==============
function rowToDocument(row, umap) {
  var uby = row[8], vby = row[10];
  return {
    ID: row[0], DocumentName: row[1],
    DocumentType: String(row[2] || '').toLowerCase(),
    EntityType: String(row[3] || '').toLowerCase(),
    EntityID: row[4],
    EntityName: resolvePolymorphicName(row[3], row[4]),
    FileURL: row[5],
    FileSizeKB: row[6] || '',
    MimeType: row[7] || '',
    UploadedBy: uby,
    UploadedByName: (uby && umap[uby]) ? umap[uby].fullName : '',
    IsVerified: String(row[9]) === '1' || row[9] === 1 || row[9] === true,
    VerifiedBy: vby,
    VerifiedByName: (vby && umap[vby]) ? umap[vby].fullName : '',
    Remarks: row[11] || '',
    CreatedAt: toIso(row[13]), UpdatedAt: toIso(row[14]),
    ExpiryDate: toIso(row[15]),
    DocumentNumber: row[16] || ''
  };
}

function getAllDocuments(currentUser, currentRole) {
  try {
    if (!canReadDocuments(currentRole)) return { success: false, message: 'Forbidden' };
    var sh = getSheet(DOCUMENTS_SHEET);
    if (!sh) return { success: false, message: 'Documents sheet not found' };
    var role = String(currentRole).toLowerCase();
    var currentUid = getCurrentUserId(currentUser);
    var teacherStudentIds = role === 'teacher' ? getTeacherStudentIds(currentUser) : null;
    var scope = getViewerScope(currentUser, currentRole);

    var umap = getUsersMap();
    var data = sh.getDataRange().getValues(), out = [];
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][12]) === '1') continue;
      var et = String(data[i][3] || '').toLowerCase();
      var eid = parseInt(data[i][4], 10);

      // clerk: only student docs
      if (role === 'clerk' && et !== 'student') continue;

      // teacher: own user docs OR own-class students' docs
      if (role === 'teacher') {
        var isOwnUserDoc = (et === 'teacher' && eid === currentUid);
        var isOwnClassStudentDoc = (et === 'student' && teacherStudentIds && teacherStudentIds.indexOf(eid) !== -1);
        if (!isOwnUserDoc && !isOwnClassStudentDoc) continue;
      }

      // student/parent: only their own (own child's) student documents
      if (!scope.all) {
        if (et !== 'student' || scope.studentIds.indexOf(eid) === -1) continue;
      }

      out.push(rowToDocument(data[i], umap));
    }
    return { success: true, data: out };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

function addDocument(d, currentUser, currentRole) {
  try {
    var role = String(currentRole).toLowerCase();
    if (role === 'supervisor') return { success: false, message: 'Supervisors are read-only on documents' };
    if (role === 'teacher') {
      // teacher can write own docs only
      // entity_type=teacher, entity_id=self
      // OR student docs of own class
    }
    var sh = getSheet(DOCUMENTS_SHEET);
    if (!sh) return { success: false, message: 'Documents sheet not found' };

    if (!d.DocumentName || !d.DocumentType || !d.EntityType || !d.EntityID || !d.FileURL) {
      return { success: false, message: 'DocumentName, DocumentType, EntityType, EntityID, FileURL are required' };
    }
    var allowedTypes = ['id_proof','birth_certificate','transfer_certificate','marksheet','medical','photo','ghana_card','admission_form','fee_receipt','certificate','other'];
    var dt = String(d.DocumentType).toLowerCase();
    if (allowedTypes.indexOf(dt) === -1) return { success: false, message: 'Invalid document type' };
    var allowedEntities = ['student','teacher','staff','parent'];
    var et = String(d.EntityType).toLowerCase();
    if (allowedEntities.indexOf(et) === -1) return { success: false, message: 'Invalid entity type' };

    var eid = parseInt(d.EntityID, 10);
    if (isNaN(eid)) return { success: false, message: 'Invalid EntityID' };

    // role-specific entity scope
    var currentUid = getCurrentUserId(currentUser);
    if (role === 'clerk' && et !== 'student') {
      return { success: false, message: 'Clerks can upload only student documents' };
    }
    if (role === 'teacher') {
      var isOwnUserDoc = (et === 'teacher' && eid === currentUid);
      // teacher write: own docs only per RBAC
      if (!isOwnUserDoc) return { success: false, message: 'Teachers can only upload their own documents' };
    }

    var uploadedBy = currentUid;
    if (!uploadedBy) return { success: false, message: 'Could not resolve current user' };

    var ts = nowIso(), id = nextRowId(sh);
    var sizeKb = d.FileSizeKB ? parseInt(d.FileSizeKB, 10) : '';
    var expiry = String(d.ExpiryDate || '').trim();
    if (expiry && !/^\d{4}-\d{2}-\d{2}$/.test(expiry)) return { success: false, message: 'ExpiryDate must be YYYY-MM-DD' };
    var docNum = String(d.DocumentNumber || '').trim();
    if (docNum.length > 100) return { success: false, message: 'DocumentNumber max 100 chars' };
    sh.appendRow([
      id, String(d.DocumentName).trim(), dt, et, eid,
      String(d.FileURL).trim(), sizeKb, d.MimeType || '',
      uploadedBy, '0', '', d.Remarks || '',
      '0', ts, ts,
      toIso(expiry), docNum
    ]);
    addLog(currentUser, 'Document Uploaded', d.DocumentName + ' (' + dt + ' for ' + et + '#' + eid + ')');
    return { success: true, message: 'Document uploaded successfully', id: id };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

function verifyDocument(id, isVerified, currentUser, currentRole) {
  try {
    var role = String(currentRole).toLowerCase();
    if (role !== 'admin' && role !== 'supervisor') return { success: false, message: 'Forbidden — admin or supervisor only' };
    var sh = getSheet(DOCUMENTS_SHEET);
    if (!sh) return { success: false, message: 'Documents sheet not found' };
    var idn = parseInt(id, 10);
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] !== idn || String(data[i][12]) === '1') continue;
      var row = i + 1, ts = nowIso();
      var verified = (isVerified === true || String(isVerified) === '1' || String(isVerified).toLowerCase() === 'true') ? '1' : '0';
      sh.getRange(row, 10).setValue(verified);
      sh.getRange(row, 11).setValue(verified === '1' ? getCurrentUserId(currentUser) : '');
      sh.getRange(row, 15).setValue(ts);
      addLog(currentUser, 'Document Verified', 'id ' + idn + ' set verified=' + verified);
      return { success: true, message: verified === '1' ? 'Document marked as verified' : 'Verification removed' };
    }
    return { success: false, message: 'Document not found' };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

function deleteDocument(id, currentUser, currentRole) {
  try {
    if (!isAdmin(currentRole)) return { success: false, message: 'Forbidden — admin only' };
    var sh = getSheet(DOCUMENTS_SHEET);
    if (!sh) return { success: false, message: 'Documents sheet not found' };
    var idn = parseInt(id, 10);
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] !== idn || String(data[i][12]) === '1') continue;
      var row = i + 1, ts = nowIso();
      sh.getRange(row, 13).setValue('1');
      sh.getRange(row, 15).setValue(ts);
      addLog(currentUser, 'Document Deleted', 'Soft-deleted document id ' + idn);
      return { success: true, message: 'Document deleted successfully' };
    }
    return { success: false, message: 'Document not found' };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

// ============== File Upload ==============
function getAssetsFolder() {
  try {
    var folders = DriveApp.getFoldersByName(ASSETS_FOLDER_NAME);
    if (folders.hasNext()) return folders.next();
    var f = DriveApp.createFolder(ASSETS_FOLDER_NAME);
    f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return f;
  } catch (e) {
    Logger.log('ASSETS folder error: ' + e.toString());
    return null;
  }
}

function uploadProfileImage(base64Data, filename, username) {
  try {
    var folder = getAssetsFolder();
    if (!folder) return { success: false, message: 'Failed to access ASSETS folder' };

    var b64 = base64Data.split(',')[1] || base64Data;
    var blob = Utilities.newBlob(Utilities.base64Decode(b64), 'image/jpeg', filename);
    var file = folder.createFile(blob);
    file.setName(username + '_' + new Date().getTime() + '_' + filename);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    var fileId = file.getId();
    var fileUrl = 'https://lh3.google.com/u/0/d/' + fileId;
    addLog(username, 'Profile Image Uploaded', 'Uploaded: ' + file.getName());
    return { success: true, fileId: fileId, fileUrl: fileUrl, fileName: file.getName() };
  } catch (err) {
    return { success: false, message: 'Upload error: ' + err.toString() };
  }
}

// ============== User Settings (theme/colors/photo) ==============
function updateUserSettings(username, settings) {
  try {
    var sh = getSheet(USERS_SHEET);
    if (!sh) return { success: false, message: 'Users sheet not found' };

    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][1] !== username || String(data[i][16]) === '1') continue;
      var row = i + 1, ts = nowIso();

      if (settings.profileImage !== undefined) sh.getRange(row, 13).setValue(settings.profileImage);
      if (settings.themeMode !== undefined) sh.getRange(row, 18).setValue(settings.themeMode);
      if (settings.customColors !== undefined) sh.getRange(row, 19).setValue(settings.customColors);
      sh.getRange(row, 22).setValue(ts);
      sh.getRange(row, 23).setValue(username);

      addLog(username, 'Settings Updated', 'Updated user settings');
      return { success: true, message: 'Settings updated' };
    }
    return { success: false, message: 'User not found' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

function getUserSettings(username) {
  try {
    var sh = getSheet(USERS_SHEET);
    if (!sh) return { success: false, message: 'Users sheet not found' };
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][1] === username && String(data[i][16]) === '0') {
        return {
          success: true,
          settings: {
            profileImage: data[i][12] || '',
            themeMode: data[i][17] || 'light',
            customColors: data[i][18] || ''
          }
        };
      }
    }
    return { success: false, message: 'User not found' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// ============== Logs ==============
function addLog(user, action, details) {
  try {
    var sh = getSheet(LOGS_SHEET);
    if (!sh) return;
    sh.appendRow([nowIso(), user, action, details]);
  } catch (e) {
    Logger.log('Log error: ' + e.toString());
  }
}

// ============== School Calendar ==============
// RBAC — read = everyone (incl. students/parents); write = admin only
function canReadCalendar(role) {
  var r = String(role || '').toLowerCase();
  return r === 'admin' || r === 'clerk' || r === 'teacher' || r === 'supervisor' || r === 'student' || r === 'parent';
}
function canWriteCalendar(role) { return String(role || '').toLowerCase() === 'admin'; }

var CALENDAR_EVENT_TYPES = ['holiday','event','exam','meeting','sports','function','ptm','working_day','other'];
var CALENDAR_APPLY_TO   = ['all','staff','students','class_specific'];

// row -> public event obj
function rowToCalendarEvent(row, cmap, umap) {
  var cby = parseInt(row[11], 10) || '';
  var tcid = row[9] === '' || row[9] === null ? '' : parseInt(row[9], 10);
  return {
    ID: row[0],
    EventName: row[1],
    EventDate: toIso(row[2]),
    EndDate: row[3] ? toIso(row[3]) : '',
    EventType: String(row[4] || '').toLowerCase(),
    Description: row[5] || '',
    AcademicYear: formatAcademicYear(row[6]),
    IsHoliday: String(row[7]) === '1' || row[7] === 1 || row[7] === true,
    ApplicableTo: String(row[8] || '').toLowerCase(),
    TargetClassID: tcid,
    TargetClassLabel: (tcid && cmap && cmap[tcid]) ? cmap[tcid].label : '',
    Color: row[10] || '',
    CreatedBy: cby,
    CreatedByName: (cby && umap && umap[cby]) ? umap[cby].fullName : '',
    CreatedAt: toIso(row[12]),
    UpdatedAt: toIso(row[13]),
    IsRecurring: String(row[15]) === '1' || row[15] === 1 || row[15] === true
  };
}

// validate + extract calendar payload — returns {ok:true, vals:{...}} or {ok:false, message:...}
function validateCalendarPayload(d) {
  if (!d || typeof d !== 'object') return { ok: false, message: 'Invalid payload' };
  var name = String(d.EventName || '').trim();
  if (!name) return { ok: false, message: 'EventName is required' };
  var ed = toIso(d.EventDate);
  if (!ed) return { ok: false, message: 'Valid EventDate required' };
  var endd = d.EndDate ? toIso(d.EndDate) : '';
  if (d.EndDate && !endd) return { ok: false, message: 'Invalid EndDate' };
  if (endd && endd < ed) return { ok: false, message: 'EndDate cannot precede EventDate' };
  var et = String(d.EventType || '').toLowerCase();
  if (CALENDAR_EVENT_TYPES.indexOf(et) === -1) return { ok: false, message: 'Invalid EventType' };
  var ay = formatAcademicYear(d.AcademicYear);
  if (!validAcademicYear(ay)) return { ok: false, message: 'Invalid AcademicYear (YYYY-YYYY)' };
  var ap = String(d.ApplicableTo || 'all').toLowerCase();
  if (CALENDAR_APPLY_TO.indexOf(ap) === -1) return { ok: false, message: 'Invalid ApplicableTo' };
  var tcid = '';
  if (ap === 'class_specific') {
    tcid = parseInt(d.TargetClassID, 10);
    if (isNaN(tcid)) return { ok: false, message: 'TargetClassID required for class_specific' };
  }
  var color = String(d.Color || '').trim();
  if (color && !/^#[0-9a-fA-F]{6}$/.test(color)) return { ok: false, message: 'Color must be hex like #34a853' };
  var isHol = (d.IsHoliday === true || d.IsHoliday === 1 || String(d.IsHoliday) === '1' || et === 'holiday') ? '1' : '0';
  var isRec = (d.IsRecurring === true || d.IsRecurring === 1 || String(d.IsRecurring) === '1') ? '1' : '0';
  return {
    ok: true,
    vals: {
      name: name, eventDate: ed, endDate: endd, type: et, desc: String(d.Description || ''),
      year: ay, isHoliday: isHol, applyTo: ap, classId: tcid, color: color,
      isRecurring: isRec
    }
  };
}

// list events; pass empty year to get all years
function getCalendarEvents(academicYear, currentUser, currentRole) {
  try {
    if (!canReadCalendar(currentRole)) return { success: false, message: 'Forbidden' };
    var sh = getSheet(CALENDAR_SHEET);
    if (!sh) return { success: true, data: [] };
    var ay = academicYear ? formatAcademicYear(academicYear) : '';
    var data = sh.getDataRange().getValues();
    var cmap = getClassesMap(), umap = getUsersMap(), out = [];
    var scope = getViewerScope(currentUser, currentRole);
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][14]) === '1') continue; // skip soft-del
      if (ay && formatAcademicYear(data[i][6]) !== ay) continue;
      // student/parent: only events that apply to them (all / students / their own class)
      if (!scope.all) {
        var ap = String(data[i][8] || 'all').toLowerCase();
        if (ap === 'staff') continue;
        if (ap === 'class_specific' && scope.classIds.indexOf(parseInt(data[i][9], 10)) === -1) continue;
      }
      out.push(rowToCalendarEvent(data[i], cmap, umap));
    }
    out.sort(function(a, b) { return String(a.EventDate).localeCompare(String(b.EventDate)); });
    return { success: true, data: out };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

function addCalendarEvent(d, currentUser, currentRole) {
  try {
    if (!canWriteCalendar(currentRole)) return { success: false, message: 'Forbidden — admin only' };
    var v = validateCalendarPayload(d);
    if (!v.ok) return { success: false, message: v.message };
    var sh = getSheet(CALENDAR_SHEET);
    if (!sh) return { success: false, message: 'Calendar sheet not found' };
    var uid = getCurrentUserId(currentUser) || '';
    var ts = nowIso(), id = nextRowId(sh);
    sh.appendRow([
      id, v.vals.name, v.vals.eventDate, v.vals.endDate, v.vals.type, v.vals.desc,
      v.vals.year, v.vals.isHoliday, v.vals.applyTo, v.vals.classId, v.vals.color,
      uid, ts, ts, '0',
      v.vals.isRecurring
    ]);
    addLog(currentUser, 'Calendar Event Added', v.vals.name + ' (' + v.vals.type + ' on ' + v.vals.eventDate.split('T')[0] + (v.vals.isRecurring === '1' ? ', recurring' : '') + ')');
    return { success: true, message: 'Event added', id: id };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

function updateCalendarEvent(id, d, currentUser, currentRole) {
  try {
    if (!canWriteCalendar(currentRole)) return { success: false, message: 'Forbidden — admin only' };
    var v = validateCalendarPayload(d);
    if (!v.ok) return { success: false, message: v.message };
    var sh = getSheet(CALENDAR_SHEET);
    if (!sh) return { success: false, message: 'Calendar sheet not found' };
    var idn = parseInt(id, 10);
    if (isNaN(idn)) return { success: false, message: 'Invalid id' };
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === idn && String(data[i][14]) === '0') {
        var r = i + 1;
        sh.getRange(r, 2).setValue(v.vals.name);
        writeTextCell(sh, r, 3, v.vals.eventDate);
        writeTextCell(sh, r, 4, v.vals.endDate);
        sh.getRange(r, 5).setValue(v.vals.type);
        sh.getRange(r, 6).setValue(v.vals.desc);
        writeTextCell(sh, r, 7, v.vals.year);
        sh.getRange(r, 8).setValue(v.vals.isHoliday);
        sh.getRange(r, 9).setValue(v.vals.applyTo);
        sh.getRange(r, 10).setValue(v.vals.classId);
        sh.getRange(r, 11).setValue(v.vals.color);
        writeTextCell(sh, r, 14, nowIso());
        sh.getRange(r, 16).setValue(v.vals.isRecurring);
        addLog(currentUser, 'Calendar Event Updated', '#' + idn + ' — ' + v.vals.name);
        return { success: true, message: 'Event updated' };
      }
    }
    return { success: false, message: 'Event not found' };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

function deleteCalendarEvent(id, currentUser, currentRole) {
  try {
    if (!canWriteCalendar(currentRole)) return { success: false, message: 'Forbidden — admin only' };
    var sh = getSheet(CALENDAR_SHEET);
    if (!sh) return { success: false, message: 'Calendar sheet not found' };
    var idn = parseInt(id, 10);
    if (isNaN(idn)) return { success: false, message: 'Invalid id' };
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === idn && String(data[i][14]) === '0') {
        sh.getRange(i + 1, 15).setValue('1'); // is_del
        writeTextCell(sh, i + 1, 14, nowIso());
        addLog(currentUser, 'Calendar Event Deleted', '#' + idn + ' — ' + data[i][1]);
        return { success: true, message: 'Event deleted' };
      }
    }
    return { success: false, message: 'Event not found' };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

// ============== Hall Ticket ==============
// returns full payload for client-side PDF generation. PDF/QR rendered in the browser.
function getHallTicketData(examId, studentId, currentUser, currentRole) {
  try {
    var role = String(currentRole || '').toLowerCase();
    var examIdn = parseInt(examId, 10);
    var studIdn = parseInt(studentId, 10);
    if (isNaN(examIdn) || isNaN(studIdn)) return { success: false, message: 'Invalid examId or studentId' };

    // exam check
    var exam = getExamRow(examIdn);
    if (!exam) return { success: false, message: 'Exam not found' };
    var isPub = String(exam[8]) === '1' || exam[8] === 1 || exam[8] === true;
    if (!isPub && role !== 'admin') return { success: false, message: 'Hall ticket unavailable — exam not published' };

    // student check
    var ssh = getSheet(STUDENTS_SHEET);
    if (!ssh) return { success: false, message: 'Students sheet not found' };
    var sdata = ssh.getDataRange().getValues(), srow = null;
    for (var i = 1; i < sdata.length; i++) {
      if (sdata[i][0] === studIdn && String(sdata[i][36]) === '0') { srow = sdata[i]; break; }
    }
    if (!srow) return { success: false, message: 'Student not found' };

    // class match — exam.ClassID must match student.ClassID
    var examClassId = parseInt(exam[3], 10);
    var studClassId = parseInt(srow[25], 10);
    if (examClassId !== studClassId) return { success: false, message: 'Student is not in the exam class' };

    // RBAC scope
    if (role === 'teacher') {
      var ids = getTeacherStudentIds(currentUser);
      if (ids.indexOf(studIdn) === -1) return { success: false, message: 'Forbidden — student not in your assigned classes' };
    } else if (role === 'student') {
      // username matches admission number
      if (String(srow[1]) !== String(currentUser)) return { success: false, message: 'Forbidden — students can view only their own hall ticket' };
    } else if (role === 'parent') {
      // verify parent ↔ student link
      var psh = getSheet(PARENT_STUDENTS_SHEET);
      if (!psh) return { success: false, message: 'Parent_Students sheet not found' };
      var psdata = psh.getDataRange().getValues();
      var parentRow = null, psh2 = getSheet(PARENTS_SHEET);
      var pdata = psh2 ? psh2.getDataRange().getValues() : [];
      for (var p = 1; p < pdata.length; p++) {
        // parent login = mobile or email; match either
        if (String(pdata[p][3]) === String(currentUser) || String(pdata[p][2]) === String(currentUser)) {
          if (String(pdata[p][10]) === '0') { parentRow = pdata[p]; break; }
        }
      }
      if (!parentRow) return { success: false, message: 'Forbidden — parent record not found' };
      var ok = false;
      for (var j = 1; j < psdata.length; j++) {
        if (parseInt(psdata[j][1], 10) === parentRow[0] && parseInt(psdata[j][2], 10) === studIdn) { ok = true; break; }
      }
      if (!ok) return { success: false, message: 'Forbidden — student not linked to this parent' };
    } else if (role !== 'admin' && role !== 'supervisor' && role !== 'clerk') {
      return { success: false, message: 'Forbidden' };
    }

    // school payload
    var settings = getSchoolSettings();
    var sd = (settings && settings.data) ? settings.data : {};

    // class label
    var cmap = getClassesMap();
    var classLabel = (cmap && cmap[studClassId]) ? cmap[studClassId].label : '';

    // subjects for the exam class
    var subSh = getSheet(SUBJECTS_SHEET);
    var subjects = [];
    if (subSh) {
      var subData = subSh.getDataRange().getValues();
      for (var s = 1; s < subData.length; s++) {
        if (String(subData[s][5]) === '1') continue; // skip deleted
        if (parseInt(subData[s][3], 10) !== examClassId) continue;
        if (String(subData[s][14]) !== '1' && subData[s][14] !== '' && subData[s][14] !== 1) continue; // only active (treat blank as active for legacy)
        subjects.push({
          id: subData[s][0],
          subjectName: subData[s][1],
          subjectCode: subData[s][2],
          maxMarks: subData[s][4],
          examDate: toIso(exam[5]),
          passMarks: subData[s][8] || ''
        });
      }
    }

    // build student name from first/middle/last
    var fullName = [srow[2], srow[3], srow[4]].filter(function(x){ return x; }).join(' ');

    var payload = {
      school: {
        name: sd.SchoolName || '',
        logo: sd.SchoolLogo || DEFAULT_LOGO,
        address: sd.SchoolAddress || '',
        contact: sd.SchoolContact || '',
        email: sd.SchoolEmail || '',
        academicYear: sd.AcademicYear || formatAcademicYear(exam[4])
      },
      student: {
        id: srow[0],
        admissionNumber: srow[1],
        fullName: fullName,
        fatherName: srow[15] || '',
        motherName: srow[18] || '',
        classLabel: classLabel,
        rollNumber: srow[26] || '',
        photoURL: srow[33] || '',
        dateOfBirth: toIso(srow[6])
      },
      exam: {
        id: exam[0],
        examName: exam[1],
        examType: exam[2],
        examCode: exam[16] || '',
        startDate: toIso(exam[5]),
        endDate: toIso(exam[6]),
        maxMarksPerSubject: exam[7],
        term: exam[14] || ''
      },
      subjects: subjects,
      qrPayload: 'EXAM:' + exam[0] + '|STUDENT:' + srow[0] + '|ADM:' + srow[1] + '|YEAR:' + (sd.AcademicYear || formatAcademicYear(exam[4])) + '|TS:' + nowIso(),
      issuedAt: nowIso(),
      issuedBy: currentUser
    };

    addLog(currentUser, 'Hall Ticket Issued', 'Exam #' + exam[0] + ' Student #' + srow[0] + ' (' + srow[1] + ')');
    return { success: true, data: payload };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

// ============== Setup Entrypoints ==============
function setup() { return initializeSheets(); }

// ============== School Settings (system-wide config) ==============
// returns the single settings row (or null sentinel object). Public — login page calls this without auth.
function getSchoolSettings() {
  try {
    var sh = getSheet(SETTINGS_SHEET);
    if (!sh) return { success: true, data: defaultSchoolSettings() };
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (parseInt(data[i][0], 10) === 1) {
        return {
          success: true,
          data: {
            ID: 1,
            SchoolName: data[i][1] || 'My School',
            SchoolShortName: data[i][2] || '',
            SchoolLogo: data[i][3] || DEFAULT_LOGO,
            SchoolEmail: data[i][4] || '',
            SchoolContact: data[i][5] || '',
            SchoolAddress: data[i][6] || '',
            SchoolWebsite: data[i][7] || '',
            AdminName: data[i][8] || '',
            AdminEmail: data[i][9] || '',
            AcademicYear: data[i][10] || '',
            Currency: data[i][11] || 'GH₵',
            TimeZone: data[i][12] || 'Africa/Accra',
            AboutText: data[i][13] || '',
            CreatedAt: toIso(data[i][14]),
            UpdatedAt: toIso(data[i][15]),
            WorkingDays: data[i][16] || 'monday,tuesday,wednesday,thursday,friday',
            AcademicYearStartDate: toIso(data[i][17]),
            AcademicYearEndDate: toIso(data[i][18]),
            HiddenMenuIds: data[i][19] || '',
            AdmissionNumberPrefix: data[i][20] || ''
          }
        };
      }
    }
    return { success: true, data: defaultSchoolSettings() };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString(), data: defaultSchoolSettings() };
  }
}

function defaultSchoolSettings() {
  var cy = new Date().getFullYear();
  return {
    ID: 1,
    SchoolName: 'My School',
    SchoolShortName: 'School',
    SchoolLogo: DEFAULT_LOGO,
    SchoolEmail: '',
    SchoolContact: '',
    SchoolAddress: '',
    SchoolWebsite: '',
    AdminName: '',
    AdminEmail: '',
    AcademicYear: cy + '-' + (cy + 1),
    Currency: 'GH₵',
    TimeZone: 'Africa/Accra',
    AboutText: '',
    WorkingDays: 'monday,tuesday,wednesday,thursday,friday',
    AcademicYearStartDate: cy + '-09-01',
    AcademicYearEndDate: (cy + 1) + '-07-31',
    HiddenMenuIds: '',
    AdmissionNumberPrefix: ''
  };
}

// admin-only — the sensitive/advanced half of settings (SMS gateway creds, owner contact,
// digest schedule). Kept OUT of getSchoolSettings() so API keys never reach non-admin roles.
function getAdminExtendedSettings(currentUser, currentRole) {
  try {
    if (!isAdmin(currentRole)) return { success: false, message: 'Forbidden — admin only' };
    var sh = getSheet(SETTINGS_SHEET);
    var row = null;
    if (sh) {
      var data = sh.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (parseInt(data[i][0], 10) === 1) { row = data[i]; break; }
      }
    }
    if (!row) {
      return {
        success: true,
        data: { SmsProvider: '', SmsApiKey: '', SmsApiSecret: '', SmsSenderId: '', SmsCustomEndpoint: '', SmsCustomConfig: '',
                OwnerEmail: '', OwnerPhone: '', DailyDigestTime: '18:00', SmsBalanceCache: '', SmsBalanceCacheAt: '' }
      };
    }
    return {
      success: true,
      data: {
        SmsProvider: row[21] || '', SmsApiKey: row[22] || '', SmsApiSecret: row[23] || '',
        SmsSenderId: row[24] || '', SmsCustomEndpoint: row[25] || '', SmsCustomConfig: row[26] || '',
        OwnerEmail: row[27] || '', OwnerPhone: row[28] || '', DailyDigestTime: row[29] || '18:00',
        SmsBalanceCache: row[30] === '' || row[30] == null ? '' : parseFloat(row[30]),
        SmsBalanceCacheAt: row[31] ? toIso(row[31]) : ''
      }
    };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// admin-only — SMS gateway config + owner digest contact/schedule. Separate from
// updateSchoolSettings() so saving the general form never clobbers API credentials.
function updateSmsSettings(d, currentUser, currentRole) {
  try {
    if (!isAdmin(currentRole)) return { success: false, message: 'Forbidden — admin only' };
    var sh = getSheet(SETTINGS_SHEET);
    if (!sh) return { success: false, message: 'Settings sheet not found. Run setup() first.' };

    var providerEnum = ['', 'arkesel', 'hubtel', 'custom'];
    var provider = String(d.SmsProvider || '').toLowerCase();
    if (providerEnum.indexOf(provider) === -1) return { success: false, message: 'Invalid SmsProvider' };

    var digestTime = String(d.DailyDigestTime || '18:00').trim();
    if (!/^\d{2}:\d{2}$/.test(digestTime)) return { success: false, message: 'DailyDigestTime must be HH:MM' };

    var ownerEmail = String(d.OwnerEmail || '').trim();
    if (ownerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail)) return { success: false, message: 'Invalid OwnerEmail' };

    var customConfig = String(d.SmsCustomConfig || '').trim();
    if (customConfig) {
      try { JSON.parse(customConfig); } catch (e) { return { success: false, message: 'SmsCustomConfig must be valid JSON' }; }
    }

    var data = sh.getDataRange().getValues();
    var foundRow = -1;
    for (var i = 1; i < data.length; i++) {
      if (parseInt(data[i][0], 10) === 1) { foundRow = i + 1; break; }
    }
    var ts = nowIso();
    if (foundRow === -1) {
      // no settings row yet — create a bare one carrying just the SMS/owner fields
      var blank = new Array(SETTINGS_HEADERS.length).fill('');
      blank[0] = 1; blank[14] = ts; blank[15] = ts;
      sh.appendRow(blank);
      foundRow = sh.getLastRow();
    }
    sh.getRange(foundRow, 22).setValue(provider);
    sh.getRange(foundRow, 23).setValue(String(d.SmsApiKey || '').trim());
    sh.getRange(foundRow, 24).setValue(String(d.SmsApiSecret || '').trim());
    sh.getRange(foundRow, 25).setValue(String(d.SmsSenderId || '').trim().slice(0, 11));
    sh.getRange(foundRow, 26).setValue(String(d.SmsCustomEndpoint || '').trim());
    sh.getRange(foundRow, 27).setValue(customConfig);
    sh.getRange(foundRow, 28).setValue(ownerEmail);
    sh.getRange(foundRow, 29).setValue(String(d.OwnerPhone || '').trim());
    sh.getRange(foundRow, 30).setValue(digestTime);
    sh.getRange(foundRow, 16).setValue(ts);

    addLog(currentUser, 'SMS Settings Updated', 'Provider: ' + (provider || 'none'));
    return { success: true, message: 'SMS & owner digest settings saved' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// ============== SMS Module ==============

function _ensureSmsLogSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SMS_LOG_SHEET);
  if (!sh) {
    sh = ss.insertSheet(SMS_LOG_SHEET);
    sh.appendRow(SMS_LOG_HEADERS);
    sh.getRange(1, 1, 1, SMS_LOG_HEADERS.length).setBackground('#001f3f').setFontColor('white').setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function _ensureSmsTemplatesSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SMS_TEMPLATES_SHEET);
  if (!sh) {
    sh = ss.insertSheet(SMS_TEMPLATES_SHEET);
    sh.appendRow(SMS_TEMPLATE_HEADERS);
    sh.getRange(1, 1, 1, SMS_TEMPLATE_HEADERS.length).setBackground('#001f3f').setFontColor('white').setFontWeight('bold');
    sh.setFrozenRows(1);
    var ts = nowIso(), id = 1, rows = [];
    SMS_DEFAULT_TEMPLATES.forEach(function (t) {
      rows.push([id++, t.type, t.text, '1', ts, ts]);
    });
    sh.getRange(2, 1, rows.length, SMS_TEMPLATE_HEADERS.length).setValues(rows);
  }
  return sh;
}

function _getSmsConfig() {
  var sh = getSheet(SETTINGS_SHEET);
  if (!sh) return null;
  var data = sh.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (parseInt(data[i][0], 10) === 1) {
      var row = data[i];
      return {
        provider: String(row[21] || '').toLowerCase(),
        apiKey: row[22] || '',
        apiSecret: row[23] || '',
        senderId: row[24] || 'School',
        customEndpoint: row[25] || '',
        customConfig: row[26] || ''
      };
    }
  }
  return null;
}

// low-level provider dispatch. Returns { ok, response } — never throws (network/API errors come back as ok:false).
function _dispatchSms(cfg, recipient, message) {
  try {
    if (!cfg || !cfg.provider) return { ok: false, response: 'SMS provider not configured' };
    var phone = String(recipient || '').replace(/[^\d+]/g, '');
    if (!phone) return { ok: false, response: 'Invalid recipient number' };

    if (cfg.provider === 'arkesel') {
      if (!cfg.apiKey) return { ok: false, response: 'Arkesel API key not configured' };
      var url = 'https://sms.arkesel.com/api/v2/sms/send';
      var resp = UrlFetchApp.fetch(url, {
        method: 'post',
        contentType: 'application/json',
        headers: { 'api-key': cfg.apiKey },
        payload: JSON.stringify({ sender: cfg.senderId || 'School', message: message, recipients: [phone] }),
        muteHttpExceptions: true
      });
      var body = resp.getContentText();
      var code = resp.getResponseCode();
      var ok = code >= 200 && code < 300;
      try { var j = JSON.parse(body); if (String(j.status || '').toLowerCase() !== 'success' && ok) ok = false; } catch (e) {}
      return { ok: ok, response: body };
    }

    if (cfg.provider === 'hubtel') {
      if (!cfg.apiKey || !cfg.apiSecret) return { ok: false, response: 'Hubtel Client ID / Secret not configured' };
      var hUrl = 'https://smsc.hubtel.com/v1/messages/send'
        + '?clientid=' + encodeURIComponent(cfg.apiKey)
        + '&clientsecret=' + encodeURIComponent(cfg.apiSecret)
        + '&from=' + encodeURIComponent(cfg.senderId || 'School')
        + '&to=' + encodeURIComponent(phone)
        + '&content=' + encodeURIComponent(message);
      var hResp = UrlFetchApp.fetch(hUrl, { method: 'get', muteHttpExceptions: true });
      var hCode = hResp.getResponseCode();
      return { ok: hCode >= 200 && hCode < 300, response: hResp.getContentText() };
    }

    if (cfg.provider === 'custom') {
      if (!cfg.customEndpoint) return { ok: false, response: 'Custom SMS endpoint not configured' };
      var conf = {};
      try { conf = cfg.customConfig ? JSON.parse(cfg.customConfig) : {}; } catch (e) { return { ok: false, response: 'SmsCustomConfig is not valid JSON' }; }
      var subst = function (v) {
        if (typeof v !== 'string') return v;
        return v.replace(/\{recipient\}/g, phone).replace(/\{message\}/g, message)
                .replace(/\{sender\}/g, cfg.senderId || '').replace(/\{apiKey\}/g, cfg.apiKey || '')
                .replace(/\{apiSecret\}/g, cfg.apiSecret || '');
      };
      var deepSubst = function (obj) {
        if (obj == null) return obj;
        if (typeof obj === 'string') return subst(obj);
        if (Array.isArray(obj)) return obj.map(deepSubst);
        if (typeof obj === 'object') {
          var out = {};
          Object.keys(obj).forEach(function (k) { out[k] = deepSubst(obj[k]); });
          return out;
        }
        return obj;
      };
      var method = String(conf.method || 'POST').toLowerCase();
      var endpoint = cfg.customEndpoint;
      var query = conf.queryTemplate ? deepSubst(conf.queryTemplate) : null;
      if (query) {
        var qs = Object.keys(query).map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(query[k]); }).join('&');
        endpoint += (endpoint.indexOf('?') === -1 ? '?' : '&') + qs;
      }
      var options = { method: method, muteHttpExceptions: true };
      if (conf.headers) options.headers = deepSubst(conf.headers);
      if (method === 'post' && conf.bodyTemplate) {
        options.contentType = 'application/json';
        options.payload = JSON.stringify(deepSubst(conf.bodyTemplate));
      }
      var cResp = UrlFetchApp.fetch(endpoint, options);
      var cCode = cResp.getResponseCode();
      return { ok: cCode >= 200 && cCode < 300, response: cResp.getContentText() };
    }

    return { ok: false, response: 'Unknown SMS provider: ' + cfg.provider };
  } catch (err) {
    return { ok: false, response: 'Error: ' + err.toString() };
  }
}

function _renderSmsTemplate(text, vars) {
  var out = String(text || '');
  Object.keys(vars || {}).forEach(function (k) {
    out = out.split('{' + k + '}').join(vars[k] == null ? '' : String(vars[k]));
  });
  return out;
}

// core send — logs every attempt regardless of outcome. admin/clerk only.
function sendSms(recipient, message, templateType, relatedStudentId, currentUser, currentRole) {
  try {
    var role = String(currentRole || '').toLowerCase();
    if (role !== 'admin' && role !== 'clerk') return { success: false, message: 'Forbidden — admin or clerk only' };
    if (!String(recipient || '').trim()) return { success: false, message: 'Recipient number required' };
    if (!String(message || '').trim()) return { success: false, message: 'Message text required' };

    var cfg = _getSmsConfig();
    var result = _dispatchSms(cfg, recipient, message);

    var logSh = _ensureSmsLogSheet();
    var ts = nowIso();
    var sid = relatedStudentId ? (parseInt(relatedStudentId, 10) || '') : '';
    logSh.appendRow([
      nextRowId(logSh), ts, String(recipient).trim(), String(message).trim(),
      templateType || 'other', result.ok ? 'sent' : 'failed', String(result.response || '').slice(0, 500),
      sid, currentUser || '', templateType || 'other'
    ]);

    if (!result.ok) return { success: false, message: 'SMS failed: ' + String(result.response || 'unknown error').slice(0, 200) };
    return { success: true, message: 'SMS sent to ' + recipient };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// bulk send — one message (rendered per-recipient with their own vars) to many recipients at once.
// payload: { recipients: [{ phone, studentId, vars }], templateType, rawMessage (used if templateType is blank/custom) }
function sendBulkSms(payload, currentUser, currentRole) {
  try {
    var role = String(currentRole || '').toLowerCase();
    if (role !== 'admin' && role !== 'clerk') return { success: false, message: 'Forbidden — admin or clerk only' };
    var recipients = (payload && payload.recipients) || [];
    if (!recipients.length) return { success: false, message: 'No recipients provided' };

    var templateType = payload.templateType || 'other';
    var templateText = payload.rawMessage || '';
    if (!templateText) {
      var tplRes = getSmsTemplates(currentUser, currentRole);
      var tpl = tplRes.success ? (tplRes.data || []).find(function (t) { return t.TemplateType === templateType && t.IsActive; }) : null;
      templateText = tpl ? tpl.TemplateText : '';
    }
    if (!templateText) return { success: false, message: 'No message template found for type: ' + templateType };

    var cfg = _getSmsConfig();
    var logSh = _ensureSmsLogSheet();
    var ts = nowIso();
    var nextId = nextRowId(logSh);
    var rows = [];
    var sent = 0, failed = 0;

    recipients.forEach(function (r) {
      var msg = _renderSmsTemplate(templateText, r.vars || {});
      var result = _dispatchSms(cfg, r.phone, msg);
      if (result.ok) sent++; else failed++;
      rows.push([
        nextId++, ts, String(r.phone || '').trim(), msg, templateType,
        result.ok ? 'sent' : 'failed', String(result.response || '').slice(0, 500),
        r.studentId || '', currentUser || '', templateType
      ]);
    });

    if (rows.length) logSh.getRange(logSh.getLastRow() + 1, 1, rows.length, SMS_LOG_HEADERS.length).setValues(rows);
    addLog(currentUser, 'Bulk SMS Sent', sent + ' sent, ' + failed + ' failed (' + templateType + ')');

    return { success: true, sent: sent, failed: failed, message: sent + ' sent, ' + failed + ' failed' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

function getSmsTemplates(currentUser, currentRole) {
  try {
    var role = String(currentRole || '').toLowerCase();
    if (role !== 'admin' && role !== 'clerk') return { success: false, message: 'Forbidden — admin or clerk only' };
    var sh = _ensureSmsTemplatesSheet();
    var data = sh.getDataRange().getValues();
    var out = [];
    for (var i = 1; i < data.length; i++) {
      out.push({
        ID: data[i][0], TemplateType: data[i][1], TemplateText: data[i][2],
        IsActive: String(data[i][3]) === '1', CreatedAt: toIso(data[i][4]), UpdatedAt: toIso(data[i][5])
      });
    }
    return { success: true, data: out };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

function updateSmsTemplate(id, data, currentUser, currentRole) {
  try {
    if (!isAdmin(currentRole)) return { success: false, message: 'Forbidden — admin only' };
    var sh = _ensureSmsTemplatesSheet();
    var idn = parseInt(id, 10);
    if (isNaN(idn)) return { success: false, message: 'Invalid id' };
    var text = String(data.TemplateText || '').trim();
    if (!text) return { success: false, message: 'TemplateText is required' };
    if (text.length > 1000) return { success: false, message: 'TemplateText max 1000 chars' };
    var isActive = (data.IsActive === false || String(data.IsActive) === '0') ? '0' : '1';

    var sdata = sh.getDataRange().getValues();
    for (var i = 1; i < sdata.length; i++) {
      if (parseInt(sdata[i][0], 10) !== idn) continue;
      var row = i + 1;
      sh.getRange(row, 3).setValue(text);
      sh.getRange(row, 4).setValue(isActive);
      sh.getRange(row, 6).setValue(nowIso());
      addLog(currentUser, 'SMS Template Updated', 'Updated template #' + idn + ' (' + sdata[i][1] + ')');
      return { success: true, message: 'Template updated' };
    }
    return { success: false, message: 'Template not found' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// checks the provider's balance endpoint (best-effort — providers vary), caches into Settings for ~30 min.
function getSmsBalance(currentUser, currentRole, forceRefresh) {
  try {
    var role = String(currentRole || '').toLowerCase();
    if (role !== 'admin' && role !== 'clerk') return { success: false, message: 'Forbidden — admin or clerk only' };

    var sh = getSheet(SETTINGS_SHEET);
    if (!sh) return { success: true, data: { balance: null, cachedAt: '', provider: '' } };
    var data = sh.getDataRange().getValues();
    var row = null, rowIdx = -1;
    for (var i = 1; i < data.length; i++) {
      if (parseInt(data[i][0], 10) === 1) { row = data[i]; rowIdx = i + 1; break; }
    }
    if (!row) return { success: true, data: { balance: null, cachedAt: '', provider: '' } };

    var provider = String(row[21] || '').toLowerCase();
    var cachedVal = row[30] === '' || row[30] == null ? null : parseFloat(row[30]);
    var cachedAt = row[31] ? new Date(row[31]) : null;
    var freshEnoughMs = 30 * 60 * 1000;
    if (!forceRefresh && cachedAt && (Date.now() - cachedAt.getTime()) < freshEnoughMs) {
      return { success: true, data: { balance: cachedVal, cachedAt: toIso(row[31]), provider: provider } };
    }

    var cfg = _getSmsConfig();
    var balance = cachedVal;
    if (cfg && cfg.provider === 'arkesel' && cfg.apiKey) {
      try {
        var aResp = UrlFetchApp.fetch('https://sms.arkesel.com/api/v2/clients/balance-details', {
          method: 'get', headers: { 'api-key': cfg.apiKey }, muteHttpExceptions: true
        });
        var aJson = JSON.parse(aResp.getContentText());
        if (aJson && aJson.data && aJson.data.sms_balance != null) balance = parseFloat(aJson.data.sms_balance);
      } catch (e) { /* keep last cached value on failure */ }
    } else if (cfg && cfg.provider === 'hubtel' && cfg.apiKey && cfg.apiSecret) {
      try {
        var hResp = UrlFetchApp.fetch('https://smsc.hubtel.com/v1/messages/' + encodeURIComponent(cfg.apiKey) + '/balance'
          + '?clientsecret=' + encodeURIComponent(cfg.apiSecret), { method: 'get', muteHttpExceptions: true });
        var hJson = JSON.parse(hResp.getContentText());
        if (hJson && hJson.balance != null) balance = parseFloat(hJson.balance);
      } catch (e) { /* keep last cached value on failure */ }
    }

    var ts = nowIso();
    if (rowIdx > 0) {
      sh.getRange(rowIdx, 31).setValue(balance == null ? '' : balance);
      sh.getRange(rowIdx, 32).setValue(ts);
    }
    return { success: true, data: { balance: balance, cachedAt: ts, provider: provider } };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

function getSmsDashboardStats(currentUser, currentRole) {
  try {
    var role = String(currentRole || '').toLowerCase();
    if (role !== 'admin' && role !== 'clerk') return { success: false, message: 'Forbidden — admin or clerk only' };
    var sh = _ensureSmsLogSheet();
    var data = sh.getDataRange().getValues();
    var sent = 0, failed = 0, recent = [];
    for (var i = data.length - 1; i >= 1; i--) {
      var status = String(data[i][5] || '').toLowerCase();
      if (status === 'sent') sent++; else if (status === 'failed') failed++;
      if (recent.length < 25) {
        recent.push({
          ID: data[i][0], SentAt: toIso(data[i][1]), Recipient: data[i][2], Message: data[i][3],
          TemplateType: data[i][4], Status: status, SentBy: data[i][8]
        });
      }
    }
    var bal = getSmsBalance(currentUser, currentRole, false);
    return {
      success: true,
      data: {
        balance: bal.success ? bal.data.balance : null,
        balanceCachedAt: bal.success ? bal.data.cachedAt : '',
        provider: bal.success ? bal.data.provider : '',
        totalSent: sent, totalFailed: failed, recent: recent
      }
    };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// convenience: send a fee-arrears reminder to one student's father/guardian mobile, using the "fees" template
function sendFeeReminderSms(studentId, amountDue, currentUser, currentRole) {
  try {
    var role = String(currentRole || '').toLowerCase();
    if (role !== 'admin' && role !== 'clerk') return { success: false, message: 'Forbidden — admin or clerk only' };
    var sid = parseInt(studentId, 10);
    if (isNaN(sid)) return { success: false, message: 'Invalid student id' };

    var ssh = getSheet(STUDENTS_SHEET);
    if (!ssh) return { success: false, message: 'Students sheet not found' };
    var sdata = ssh.getDataRange().getValues();
    var student = null;
    for (var i = 1; i < sdata.length; i++) {
      if (parseInt(sdata[i][0], 10) === sid && String(sdata[i][36]) !== '1') { student = sdata[i]; break; }
    }
    if (!student) return { success: false, message: 'Student not found' };
    var phone = student[17] || student[20]; // FatherMobile, else MotherMobile
    if (!phone) return { success: false, message: 'No parent mobile number on file for this student' };

    var cmap = getClassesMap();
    var classId = parseInt(student[25], 10);
    var settingsRes = getSchoolSettings();
    var schoolName = settingsRes.success ? settingsRes.data.SchoolName : 'School';

    var tplRes = getSmsTemplates(currentUser, currentRole);
    var tpl = tplRes.success ? (tplRes.data || []).find(function (t) { return t.TemplateType === 'fees' && t.IsActive; }) : null;
    var text = tpl ? tpl.TemplateText : SMS_DEFAULT_TEMPLATES[0].text;

    var msg = _renderSmsTemplate(text, {
      StudentName: [student[2], student[4]].filter(function (x) { return x; }).join(' '),
      ClassName: cmap[classId] ? cmap[classId].label : '',
      Amount: parseFloat(amountDue || 0).toFixed(2),
      SchoolName: schoolName
    });

    return sendSms(phone, msg, 'fees', sid, currentUser, currentRole);
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// admin-only — upserts the single settings row (ID=1)
function updateSchoolSettings(d, currentUser, currentRole) {
  try {
    if (!isAdmin(currentRole)) return { success: false, message: 'Forbidden — admin only' };
    var sh = getSheet(SETTINGS_SHEET);
    if (!sh) return { success: false, message: 'Settings sheet not found. Run setup() first.' };

    var data = sh.getDataRange().getValues();
    var foundRow = -1;
    for (var i = 1; i < data.length; i++) {
      if (parseInt(data[i][0], 10) === 1) { foundRow = i + 1; break; }
    }

    var ts = nowIso();

    // working days — accept CSV or array, keep only valid lowercased day names
    var dayList = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
    var wdRaw = d.WorkingDays;
    var wd = '';
    if (Array.isArray(wdRaw)) wd = wdRaw.join(',');
    else if (typeof wdRaw === 'string') wd = wdRaw;
    var wdParts = wd.split(',').map(function(x){ return String(x).trim().toLowerCase(); }).filter(function(x){ return dayList.indexOf(x) !== -1; });
    if (wdParts.length === 0) wdParts = ['monday','tuesday','wednesday','thursday','friday'];
    var workingDays = wdParts.join(',');

    var ayStart = String(d.AcademicYearStartDate || '').trim();
    if (ayStart && !/^\d{4}-\d{2}-\d{2}$/.test(ayStart)) return { success: false, message: 'AcademicYearStartDate must be YYYY-MM-DD' };
    var ayEnd = String(d.AcademicYearEndDate || '').trim();
    if (ayEnd && !/^\d{4}-\d{2}-\d{2}$/.test(ayEnd)) return { success: false, message: 'AcademicYearEndDate must be YYYY-MM-DD' };
    if (ayStart && ayEnd && ayStart > ayEnd) return { success: false, message: 'AcademicYearStartDate must be on or before AcademicYearEndDate' };

    // sidebar menu visibility — always-on ids can never be hidden
    var PROTECTED_MENU_IDS = ['dashboard', 'settings', 'account', 'about'];
    var hiddenRaw = d.HiddenMenuIds;
    var hiddenList = Array.isArray(hiddenRaw) ? hiddenRaw : String(hiddenRaw || '').split(',');
    var hiddenMenuIds = hiddenList
      .map(function(x) { return String(x).trim(); })
      .filter(function(x) { return x && /^[a-zA-Z]+$/.test(x) && PROTECTED_MENU_IDS.indexOf(x) === -1; })
      .join(',');

    var admissionPrefix = String(d.AdmissionNumberPrefix || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);

    var values = [
      1,
      String(d.SchoolName || '').trim(),
      String(d.SchoolShortName || '').trim(),
      String(d.SchoolLogo || '').trim(),
      String(d.SchoolEmail || '').trim(),
      String(d.SchoolContact || '').trim(),
      String(d.SchoolAddress || '').trim(),
      String(d.SchoolWebsite || '').trim(),
      String(d.AdminName || '').trim(),
      String(d.AdminEmail || '').trim(),
      String(d.AcademicYear || '').trim(),
      String(d.Currency || 'GH₵').trim(),
      String(d.TimeZone || 'Africa/Accra').trim(),
      String(d.AboutText || '').trim()
    ];

    if (foundRow === -1) {
      sh.appendRow(values.concat([ts, ts, workingDays, ayStart, ayEnd, hiddenMenuIds, admissionPrefix]));
    } else {
      sh.getRange(foundRow, 1, 1, values.length).setValues([values]);
      sh.getRange(foundRow, 16).setValue(ts);
      sh.getRange(foundRow, 17).setValue(workingDays);
      sh.getRange(foundRow, 18).setValue(ayStart);
      sh.getRange(foundRow, 19).setValue(ayEnd);
      sh.getRange(foundRow, 20).setValue(hiddenMenuIds);
      sh.getRange(foundRow, 21).setValue(admissionPrefix);
    }
    addLog(currentUser, 'School Settings Updated', d.SchoolName || '');
    return { success: true, message: 'School settings saved successfully' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// ============== School Periods CRUD ==============
function rowToPeriod(row) {
  return {
    ID: row[0],
    PeriodNumber: parseInt(row[1], 10) || 0,
    StartTime: formatTimeHHMM(row[2]),
    EndTime: formatTimeHHMM(row[3]),
    IsBreak: String(row[4]) === '1',
    Label: row[5] || '',
    AcademicYear: formatAcademicYear(row[6]),
    DisplayOrder: parseInt(row[7], 10) || (parseInt(row[1], 10) || 0),
    CreatedAt: toIso(row[9]),
    UpdatedAt: toIso(row[10]),
    DayType: String(row[11] || 'regular').toLowerCase()
  };
}

function getAllPeriods(currentUser, currentRole) {
  try {
    if (!canReadTimetable(currentRole)) return { success: false, message: 'Forbidden' };
    var sh = getSheet(PERIODS_SHEET);
    if (!sh) return { success: true, data: [] };
    var data = sh.getDataRange().getValues(), out = [];
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][8]) === '1') continue;
      out.push(rowToPeriod(data[i]));
    }
    out.sort(function(a, b) {
      if (a.AcademicYear !== b.AcademicYear) return String(b.AcademicYear).localeCompare(a.AcademicYear);
      return a.DisplayOrder - b.DisplayOrder;
    });
    return { success: true, data: out };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

function periodExists(sh, periodNumber, academicYear, dayType, excludeId) {
  var data = sh.getDataRange().getValues();
  var p = parseInt(periodNumber, 10);
  var ay = formatAcademicYear(academicYear);
  var dt = String(dayType || 'regular').toLowerCase();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][8]) === '1') continue;
    if (excludeId !== undefined && data[i][0] === excludeId) continue;
    var rowDt = String(data[i][11] || 'regular').toLowerCase();
    if (parseInt(data[i][1], 10) === p && formatAcademicYear(data[i][6]) === ay && rowDt === dt) return true;
  }
  return false;
}

function addPeriod(p, currentUser, currentRole) {
  try {
    if (!canWriteTimetable(currentRole)) return { success: false, message: 'Forbidden — admin only' };
    var sh = getSheet(PERIODS_SHEET);
    if (!sh) return { success: false, message: 'Periods sheet not found. Run setup first.' };

    var pn = parseInt(p.PeriodNumber, 10);
    var startT = formatTimeHHMM(p.StartTime);
    var endT = formatTimeHHMM(p.EndTime);
    var ay = formatAcademicYear(p.AcademicYear);
    if (isNaN(pn) || pn < 1 || pn > 20) return { success: false, message: 'PeriodNumber must be 1-20' };
    if (!isValidHHMM(startT) || !isValidHHMM(endT)) return { success: false, message: 'StartTime/EndTime must be HH:MM' };
    if (startT >= endT) return { success: false, message: 'StartTime must be before EndTime' };
    if (!validAcademicYear(ay)) return { success: false, message: 'AcademicYear must be YYYY-YYYY' };
    var allowedDayTypes = ['regular','saturday','half_day','exam'];
    var dayType = String(p.DayType || 'regular').toLowerCase();
    if (allowedDayTypes.indexOf(dayType) === -1) dayType = 'regular';
    if (periodExists(sh, pn, ay, dayType)) return { success: false, message: 'Period ' + pn + ' already exists for ' + ay + ' / ' + dayType };

    var ts = nowIso(), id = nextRowId(sh);
    var isBreak = (p.IsBreak === true || String(p.IsBreak) === '1') ? '1' : '0';
    var label = String(p.Label || (isBreak === '1' ? 'Break' : 'Period ' + pn)).trim();
    var displayOrder = (p.DisplayOrder != null && p.DisplayOrder !== '') ? parseInt(p.DisplayOrder, 10) : pn;

    var newRow = sh.getLastRow() + 1;
    // pin StartTime (col 3), EndTime (col 4), AcademicYear (col 7) as text BEFORE write
    sh.getRange(newRow, 3, 1, 2).setNumberFormat('@');
    sh.getRange(newRow, 7).setNumberFormat('@');
    sh.appendRow([id, pn, startT, endT, isBreak, label, ay, displayOrder, '0', ts, ts, dayType]);
    // re-pin + re-set as strings to defeat any auto-conversion
    sh.getRange(newRow, 3).setNumberFormat('@').setValue(startT);
    sh.getRange(newRow, 4).setNumberFormat('@').setValue(endT);
    sh.getRange(newRow, 7).setNumberFormat('@').setValue(ay);

    addLog(currentUser, 'Period Added', 'P' + pn + ' / ' + ay + ' / ' + dayType);
    return { success: true, message: 'Period added', id: id };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

function updatePeriod(id, p, currentUser, currentRole) {
  try {
    if (!canWriteTimetable(currentRole)) return { success: false, message: 'Forbidden — admin only' };
    var sh = getSheet(PERIODS_SHEET);
    if (!sh) return { success: false, message: 'Periods sheet not found' };

    var idn = parseInt(id, 10);
    var data = sh.getDataRange().getValues(), idx = -1;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === idn && String(data[i][8]) === '0') { idx = i; break; }
    }
    if (idx === -1) return { success: false, message: 'Period not found' };

    var pn = parseInt(p.PeriodNumber, 10);
    var startT = formatTimeHHMM(p.StartTime);
    var endT = formatTimeHHMM(p.EndTime);
    var ay = formatAcademicYear(p.AcademicYear);
    if (isNaN(pn) || pn < 1 || pn > 20) return { success: false, message: 'PeriodNumber must be 1-20' };
    if (!isValidHHMM(startT) || !isValidHHMM(endT)) return { success: false, message: 'StartTime/EndTime must be HH:MM' };
    if (startT >= endT) return { success: false, message: 'StartTime must be before EndTime' };
    if (!validAcademicYear(ay)) return { success: false, message: 'AcademicYear must be YYYY-YYYY' };
    var allowedDayTypes2 = ['regular','saturday','half_day','exam'];
    var dayType2 = String(p.DayType || 'regular').toLowerCase();
    if (allowedDayTypes2.indexOf(dayType2) === -1) dayType2 = 'regular';
    if (periodExists(sh, pn, ay, dayType2, idn)) return { success: false, message: 'Period ' + pn + ' already exists for ' + ay + ' / ' + dayType2 };

    var isBreak = (p.IsBreak === true || String(p.IsBreak) === '1') ? '1' : '0';
    var label = String(p.Label || (isBreak === '1' ? 'Break' : 'Period ' + pn)).trim();
    var displayOrder = (p.DisplayOrder != null && p.DisplayOrder !== '') ? parseInt(p.DisplayOrder, 10) : pn;

    var row = idx + 1;
    // pin StartTime, EndTime, AcademicYear as text BEFORE setValues to defeat auto-conversion
    sh.getRange(row, 3, 1, 2).setNumberFormat('@');
    sh.getRange(row, 7).setNumberFormat('@');
    sh.getRange(row, 2, 1, 7).setValues([[pn, startT, endT, isBreak, label, ay, displayOrder]]);
    // explicit re-set as strings
    sh.getRange(row, 3).setNumberFormat('@').setValue(startT);
    sh.getRange(row, 4).setNumberFormat('@').setValue(endT);
    sh.getRange(row, 7).setNumberFormat('@').setValue(ay);
    sh.getRange(row, 11).setValue(nowIso());
    sh.getRange(row, 12).setValue(dayType2);
    addLog(currentUser, 'Period Updated', 'P' + pn + ' / ' + ay + ' / ' + dayType2);
    return { success: true, message: 'Period updated' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

function deletePeriod(id, currentUser, currentRole) {
  try {
    if (!canWriteTimetable(currentRole)) return { success: false, message: 'Forbidden — admin only' };
    var sh = getSheet(PERIODS_SHEET);
    if (!sh) return { success: false, message: 'Periods sheet not found' };
    var idn = parseInt(id, 10);
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === idn && String(data[i][8]) === '0') {
        sh.getRange(i + 1, 9).setValue('1');
        sh.getRange(i + 1, 11).setValue(nowIso());
        addLog(currentUser, 'Period Deleted', 'P' + data[i][1]);
        return { success: true, message: 'Period removed' };
      }
    }
    return { success: false, message: 'Period not found' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// ============== Timetable CRUD + Queries ==============
function rowToTimetable(row, cmap, smap, umap) {
  var classId = parseInt(row[1], 10);
  var subjId = row[4] !== '' && row[4] != null ? parseInt(row[4], 10) : null;
  var teachId = row[5] !== '' && row[5] != null ? parseInt(row[5], 10) : null;
  return {
    ID: row[0],
    ClassID: classId,
    ClassLabel: cmap && cmap[classId] ? cmap[classId].label : '',
    DayOfWeek: String(row[2] || '').toLowerCase(),
    PeriodNumber: parseInt(row[3], 10) || 0,
    SubjectID: subjId,
    SubjectName: subjId && smap && smap[subjId] ? smap[subjId].subjectName : '',
    SubjectCode: subjId && smap && smap[subjId] ? smap[subjId].subjectCode : '',
    TeacherID: teachId,
    TeacherName: teachId && umap && umap[teachId] ? umap[teachId].fullName : '',
    RoomNumber: row[6] || '',
    AcademicYear: formatAcademicYear(row[7]),
    Term: String(row[8] || 'full_year').toLowerCase(),
    Notes: row[9] || '',
    IsActive: String(row[10]) === '1',
    CreatedAt: toIso(row[12]),
    CreatedBy: row[13] || '',
    UpdatedAt: toIso(row[14]),
    UpdatedBy: row[15] || '',
    Mode: String(row[16] || 'offline').toLowerCase(),
    MeetingLink: row[17] || ''
  };
}

function timetableSlotExists(sh, classId, day, periodNumber, academicYear, term, excludeId) {
  var data = sh.getDataRange().getValues();
  var c = parseInt(classId, 10), p = parseInt(periodNumber, 10);
  var d = String(day || '').toLowerCase();
  var ay = String(academicYear || '').trim();
  var t = String(term || 'full_year').toLowerCase();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][11]) === '1') continue;
    if (excludeId !== undefined && data[i][0] === excludeId) continue;
    if (parseInt(data[i][1], 10) === c &&
        String(data[i][2] || '').toLowerCase() === d &&
        parseInt(data[i][3], 10) === p &&
        String(data[i][7] || '').trim() === ay &&
        String(data[i][8] || 'full_year').toLowerCase() === t) {
      return data[i][0]; // return existing id
    }
  }
  return null;
}

// teacher conflict — returns conflicting class info or null
function teacherSlotConflict(sh, teacherId, day, periodNumber, academicYear, term, excludeId) {
  if (!teacherId) return null;
  var data = sh.getDataRange().getValues();
  var t = parseInt(teacherId, 10), p = parseInt(periodNumber, 10);
  var d = String(day || '').toLowerCase();
  var ay = String(academicYear || '').trim();
  var trm = String(term || 'full_year').toLowerCase();
  var cmap = getClassesMap();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][11]) === '1') continue;
    if (excludeId !== undefined && data[i][0] === excludeId) continue;
    if (parseInt(data[i][5], 10) === t &&
        String(data[i][2] || '').toLowerCase() === d &&
        parseInt(data[i][3], 10) === p &&
        String(data[i][7] || '').trim() === ay &&
        String(data[i][8] || 'full_year').toLowerCase() === trm) {
      var cid = parseInt(data[i][1], 10);
      return { id: data[i][0], classId: cid, classLabel: cmap[cid] ? cmap[cid].label : ('Class #' + cid) };
    }
  }
  return null;
}

// returns full timetable for a class (current academicYear + term)
function getTimetableForClass(classId, academicYear, term, currentUser, currentRole) {
  try {
    if (!canReadTimetable(currentRole)) return { success: false, message: 'Forbidden' };
    var sh = getSheet(TIMETABLE_SHEET);
    if (!sh) return { success: true, data: { entries: [], periods: [] } };
    var cid = parseInt(classId, 10);
    if (isNaN(cid)) return { success: false, message: 'Invalid classId' };
    var scope = getViewerScope(currentUser, currentRole);
    if (!scope.all && scope.classIds.indexOf(cid) === -1) return { success: false, message: 'Forbidden — own class only' };

    var ay = String(academicYear || '').trim();
    var t = String(term || 'full_year').toLowerCase();

    var cmap = getClassesMap(), smap = getSubjectsMap(), umap = getUsersMap();
    var data = sh.getDataRange().getValues(), out = [];
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][11]) === '1') continue;
      if (parseInt(data[i][1], 10) !== cid) continue;
      if (ay && String(data[i][7] || '').trim() !== ay) continue;
      if (t && String(data[i][8] || 'full_year').toLowerCase() !== t) continue;
      out.push(rowToTimetable(data[i], cmap, smap, umap));
    }
    var periods = getAllPeriods(currentUser, currentRole);
    return {
      success: true,
      data: {
        entries: out,
        periods: periods.success ? periods.data.filter(function(p) { return !ay || p.AcademicYear === ay; }) : []
      }
    };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// teacher's full week — across all their assigned classes
function getTimetableForTeacher(teacherId, academicYear, term, currentUser, currentRole) {
  try {
    if (!canReadTimetable(currentRole)) return { success: false, message: 'Forbidden' };
    var sh = getSheet(TIMETABLE_SHEET);
    if (!sh) return { success: true, data: { entries: [], periods: [] } };

    var tid = parseInt(teacherId, 10);
    if (isNaN(tid)) return { success: false, message: 'Invalid teacherId' };
    var ay = String(academicYear || '').trim();
    var t = String(term || 'full_year').toLowerCase();

    var cmap = getClassesMap(), smap = getSubjectsMap(), umap = getUsersMap();
    var data = sh.getDataRange().getValues(), out = [];
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][11]) === '1') continue;
      if (parseInt(data[i][5], 10) !== tid) continue;
      if (ay && String(data[i][7] || '').trim() !== ay) continue;
      if (t && String(data[i][8] || 'full_year').toLowerCase() !== t) continue;
      out.push(rowToTimetable(data[i], cmap, smap, umap));
    }
    var periods = getAllPeriods(currentUser, currentRole);
    return {
      success: true,
      data: {
        entries: out,
        periods: periods.success ? periods.data.filter(function(p) { return !ay || p.AcademicYear === ay; }) : []
      }
    };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// validate cross-refs: subject must belong to class, teacher must be assigned to teach that subject for that class
function validateTimetableEntry(d, classId, allowEmpty) {
  // empty slot allowed (e.g., free period) — only validates when subject/teacher provided
  if (allowEmpty && (!d.SubjectID || d.SubjectID === '') && (!d.TeacherID || d.TeacherID === '')) return null;
  if (!d.SubjectID) return 'SubjectID required';
  if (!d.TeacherID) return 'TeacherID required';

  var subjId = parseInt(d.SubjectID, 10);
  if (isNaN(subjId)) return 'Invalid SubjectID';
  var teachId = parseInt(d.TeacherID, 10);
  if (isNaN(teachId)) return 'Invalid TeacherID';

  // subject must belong to this class
  var smap = getSubjectsMap();
  if (!smap[subjId]) return 'Subject not found';
  if (parseInt(smap[subjId].classId, 10) !== parseInt(classId, 10)) return 'Subject does not belong to this class';

  // teacher must be assigned to this class+subject (any year)
  var asg = getSheet(ASSIGNMENTS_SHEET);
  if (asg) {
    var adata = asg.getDataRange().getValues(), ok = false;
    for (var i = 1; i < adata.length; i++) {
      if (parseInt(adata[i][1], 10) === teachId &&
          parseInt(adata[i][2], 10) === parseInt(classId, 10) &&
          parseInt(adata[i][3], 10) === subjId) {
        ok = true; break;
      }
    }
    if (!ok) return 'Teacher is not assigned to teach this subject for this class. Add the assignment first.';
  }
  return null;
}

function addTimetableEntry(d, currentUser, currentRole) {
  try {
    if (!canWriteTimetable(currentRole)) return { success: false, message: 'Forbidden — admin only' };
    var sh = getSheet(TIMETABLE_SHEET);
    if (!sh) return { success: false, message: 'Timetable sheet not found. Run setup first.' };

    if (!d.ClassID) return { success: false, message: 'ClassID required' };
    if (!isValidDay(d.DayOfWeek)) return { success: false, message: 'Invalid DayOfWeek' };
    var pn = parseInt(d.PeriodNumber, 10);
    if (isNaN(pn) || pn < 1) return { success: false, message: 'Invalid PeriodNumber' };
    if (!validAcademicYear(d.AcademicYear)) return { success: false, message: 'AcademicYear must be YYYY-YYYY' };
    var term = String(d.Term || 'full_year').toLowerCase();
    if (!isValidTerm(term)) return { success: false, message: 'Invalid Term' };

    var verr = validateTimetableEntry(d, d.ClassID, true);
    if (verr) return { success: false, message: verr };

    if (timetableSlotExists(sh, d.ClassID, d.DayOfWeek, pn, d.AcademicYear, term)) {
      return { success: false, message: 'A timetable entry already exists for this class/day/period — edit it instead.' };
    }

    if (d.TeacherID) {
      var conflict = teacherSlotConflict(sh, d.TeacherID, d.DayOfWeek, pn, d.AcademicYear, term);
      if (conflict) return { success: false, message: 'Teacher is already booked in ' + conflict.classLabel + ' at this slot.' };
    }

    var allowedModes = ['offline','online','hybrid'];
    var mode = String(d.Mode || 'offline').toLowerCase();
    if (allowedModes.indexOf(mode) === -1) mode = 'offline';
    var meetingLink = String(d.MeetingLink || '').trim();
    if (meetingLink.length > 500) return { success: false, message: 'MeetingLink max 500 chars' };
    if ((mode === 'online' || mode === 'hybrid') && !meetingLink) {
      // not strictly required — admin may add link later, just warn via log
    }

    var ts = nowIso(), id = nextRowId(sh);
    sh.appendRow([
      id, parseInt(d.ClassID, 10), String(d.DayOfWeek).toLowerCase(), pn,
      d.SubjectID || '', d.TeacherID || '', d.RoomNumber || '',
      d.AcademicYear, term, d.Notes || '',
      '1', '0', ts, currentUser, ts, currentUser,
      mode, meetingLink
    ]);
    addLog(currentUser, 'Timetable Added', 'Class ' + d.ClassID + ' / ' + d.DayOfWeek + ' / P' + pn + ' / ' + mode);
    return { success: true, message: 'Timetable entry added', id: id };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

function updateTimetableEntry(id, d, currentUser, currentRole) {
  try {
    if (!canWriteTimetable(currentRole)) return { success: false, message: 'Forbidden — admin only' };
    var sh = getSheet(TIMETABLE_SHEET);
    if (!sh) return { success: false, message: 'Timetable sheet not found' };

    var idn = parseInt(id, 10);
    var data = sh.getDataRange().getValues(), idx = -1;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === idn && String(data[i][11]) === '0') { idx = i; break; }
    }
    if (idx === -1) return { success: false, message: 'Timetable entry not found' };

    var classId = parseInt(d.ClassID || data[idx][1], 10);
    var day = String(d.DayOfWeek || data[idx][2]).toLowerCase();
    var pn = parseInt(d.PeriodNumber || data[idx][3], 10);
    var ay = d.AcademicYear || data[idx][7];
    var term = String(d.Term || data[idx][8] || 'full_year').toLowerCase();

    if (!isValidDay(day)) return { success: false, message: 'Invalid DayOfWeek' };
    if (!validAcademicYear(ay)) return { success: false, message: 'AcademicYear must be YYYY-YYYY' };
    if (!isValidTerm(term)) return { success: false, message: 'Invalid Term' };

    var verr = validateTimetableEntry(d, classId, true);
    if (verr) return { success: false, message: verr };

    var existing = timetableSlotExists(sh, classId, day, pn, ay, term, idn);
    if (existing) return { success: false, message: 'Another entry already occupies this slot' };

    if (d.TeacherID) {
      var conflict = teacherSlotConflict(sh, d.TeacherID, day, pn, ay, term, idn);
      if (conflict) return { success: false, message: 'Teacher is already booked in ' + conflict.classLabel + ' at this slot.' };
    }

    sh.getRange(idx + 1, 2, 1, 9).setValues([[
      classId, day, pn,
      d.SubjectID || '', d.TeacherID || '', d.RoomNumber || '',
      ay, term, d.Notes || ''
    ]]);
    sh.getRange(idx + 1, 15).setValue(nowIso());
    sh.getRange(idx + 1, 16).setValue(currentUser);
    if (d.Mode != null) {
      var allowedModes2 = ['offline','online','hybrid'];
      var mode2 = String(d.Mode || 'offline').toLowerCase();
      if (allowedModes2.indexOf(mode2) === -1) mode2 = 'offline';
      sh.getRange(idx + 1, 17).setValue(mode2);
    }
    if (d.MeetingLink != null) {
      var ml = String(d.MeetingLink || '').trim();
      if (ml.length > 500) return { success: false, message: 'MeetingLink max 500 chars' };
      sh.getRange(idx + 1, 18).setValue(ml);
    }
    addLog(currentUser, 'Timetable Updated', 'Class ' + classId + ' / ' + day + ' / P' + pn);
    return { success: true, message: 'Timetable entry updated' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

function deleteTimetableEntry(id, currentUser, currentRole) {
  try {
    if (!canWriteTimetable(currentRole)) return { success: false, message: 'Forbidden — admin only' };
    var sh = getSheet(TIMETABLE_SHEET);
    if (!sh) return { success: false, message: 'Timetable sheet not found' };
    var idn = parseInt(id, 10);
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === idn && String(data[i][11]) === '0') {
        sh.getRange(i + 1, 12).setValue('1');
        sh.getRange(i + 1, 15).setValue(nowIso());
        sh.getRange(i + 1, 16).setValue(currentUser);
        addLog(currentUser, 'Timetable Deleted', 'Entry #' + idn);
        return { success: true, message: 'Timetable entry removed' };
      }
    }
    return { success: false, message: 'Entry not found' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// copy a class's timetable into another class (admin convenience)
function copyTimetable(fromClassId, toClassId, academicYear, term, currentUser, currentRole) {
  try {
    if (!canWriteTimetable(currentRole)) return { success: false, message: 'Forbidden — admin only' };
    if (!fromClassId || !toClassId) return { success: false, message: 'Both classes required' };
    if (parseInt(fromClassId, 10) === parseInt(toClassId, 10)) return { success: false, message: 'Source and target must differ' };

    var sh = getSheet(TIMETABLE_SHEET);
    if (!sh) return { success: false, message: 'Timetable sheet not found' };
    var data = sh.getDataRange().getValues();
    var ay = String(academicYear || '').trim();
    var trm = String(term || 'full_year').toLowerCase();
    var fc = parseInt(fromClassId, 10), tc = parseInt(toClassId, 10);

    var sourceRows = [];
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][11]) === '1') continue;
      if (parseInt(data[i][1], 10) !== fc) continue;
      if (ay && String(data[i][7] || '').trim() !== ay) continue;
      if (trm && String(data[i][8] || 'full_year').toLowerCase() !== trm) continue;
      sourceRows.push(data[i]);
    }
    if (!sourceRows.length) return { success: false, message: 'Source class has no timetable to copy' };

    // wipe target's existing slots first (soft delete)
    var ts = nowIso();
    for (var j = 1; j < data.length; j++) {
      if (String(data[j][11]) === '1') continue;
      if (parseInt(data[j][1], 10) !== tc) continue;
      if (ay && String(data[j][7] || '').trim() !== ay) continue;
      if (trm && String(data[j][8] || 'full_year').toLowerCase() !== trm) continue;
      sh.getRange(j + 1, 12).setValue('1');
      sh.getRange(j + 1, 15).setValue(ts);
      sh.getRange(j + 1, 16).setValue(currentUser);
    }

    // append fresh copies pointing to target class (subject/teacher carried — admin must verify subject belongs to new class)
    var copied = 0;
    sourceRows.forEach(function(r) {
      // subject must belong to target class — if not, skip (subjects are class-scoped)
      var subjId = r[4];
      if (subjId) {
        var smap = getSubjectsMap();
        if (!smap[subjId] || parseInt(smap[subjId].classId, 10) !== tc) return; // skip mismatched
      }
      var newId = nextRowId(sh);
      sh.appendRow([
        newId, tc, r[2], r[3],
        r[4] || '', r[5] || '', r[6] || '',
        r[7], r[8], r[9] || '',
        '1', '0', ts, currentUser, ts, currentUser
      ]);
      copied++;
    });

    addLog(currentUser, 'Timetable Copied', 'From class ' + fc + ' → ' + tc + ' (' + copied + ' rows)');
    return { success: true, message: 'Copied ' + copied + ' slot(s). Verify subject mappings — class-specific subjects were skipped.' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// demo data — temp-sheet anchor pattern: drop targets, recreate fresh, batch insert
// (YouTube-policy friendly per docs/demo-data.md)
function setupDemoData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tempName = '_TEMP_SETUP_' + new Date().getTime();
  var temp = null;

  try {
    // 1. anchor: spreadsheet must always have >=1 sheet, so create temp first
    temp = ss.insertSheet(tempName);
    SpreadsheetApp.setActiveSheet(temp);

    // 2. drop existing target sheets (clean slate — kills old formatting/protection too)
    [USERS_SHEET, CLASSES_SHEET, SUBJECTS_SHEET, ASSIGNMENTS_SHEET, STUDENTS_SHEET, PARENTS_SHEET, PARENT_STUDENTS_SHEET, EXAMS_SHEET, MARKS_SHEET, ATTENDANCE_SHEET, FEE_STRUCTURE_SHEET, FEE_PAYMENTS_SHEET, FEE_DUES_SHEET, DISCIPLINE_SHEET, CONDUCT_SHEET, ACTIVITIES_SHEET, COMPLAINTS_SHEET, NOTICES_SHEET, HELPDESK_SHEET, LESSON_PLANS_SHEET, TEACHING_LOGBOOK_SHEET, DOCUMENTS_SHEET, PERIODS_SHEET, TIMETABLE_SHEET, SETTINGS_SHEET, CALENDAR_SHEET, PTM_SLOTS_SHEET, PTM_BOOKINGS_SHEET, SUBSTITUTES_SHEET, ASSETS_SHEET, ASSET_MAINTENANCE_SHEET, STOCK_ITEMS_SHEET, STOCK_TRANSACTIONS_SHEET, ADMISSIONS_SHEET, ACCOUNT_TXN_SHEET, LOGS_SHEET].forEach(function(name) {
      var sh = ss.getSheetByName(name);
      if (sh) ss.deleteSheet(sh);
    });

    // 3. demo users — generic numbered placeholders
    // cols: [Username, FullName, Email, Password, Mobile, Role, Gender, DOB, Qualification, Specialization, JoiningDate, Address, Status]
    var demo = [
      ['admin','Admin User','admin@demo.com','admin123','0244000001','admin','male','1985-01-15','Qualification 1','System Admin','2020-01-01','House 1, Street 1, Demo City','active'],
      ['admin2','Admin 2','admin2@demo.com','admin123','0244000002','admin','female','1988-02-15','Qualification 2','Operations','2021-01-01','House 2, Street 1, Demo City','active'],
      ['clerk1','Clerk 1','clerk1@demo.com','clerk123','0244000003','clerk','male','1990-03-15','Qualification 3','Records','2022-01-01','House 3, Street 1, Demo City','active'],
      ['clerk2','Clerk 2','clerk2@demo.com','clerk123','0244000004','clerk','female','1992-04-15','Qualification 4','Accounts','2025-01-01','House 4, Street 1, Demo City','active'],
      ['teacher1','Teacher 1','teacher1@demo.com','teacher123','0244000005','teacher','male','1991-05-15','Qualification 5','Mathematics','2022-02-01','House 5, Street 1, Demo City','active'],
      ['teacher2','Teacher 2','teacher2@demo.com','teacher123','0244000006','teacher','female','1993-06-15','Qualification 6','English','2022-03-01','House 6, Street 1, Demo City','active'],
      ['teacher3','Teacher 3','teacher3@demo.com','teacher123','0244000007','teacher','male','1989-07-15','Qualification 7','Science','2025-08-01','House 7, Street 1, Demo City','active'],
      ['supervisor1','Supervisor 1','supervisor1@demo.com','supervisor123','0244000008','supervisor','female','1984-08-15','Qualification 8','Senior Section','2019-06-01','House 8, Street 1, Demo City','active'],
      ['supervisor2','Supervisor 2','supervisor2@demo.com','supervisor123','0244000009','supervisor','male','1986-09-15','Qualification 9','Junior Section','2020-09-01','House 9, Street 1, Demo City','active'],
      ['teacher4','Teacher 4','teacher4@demo.com','teacher123','0244000010','teacher','female','1994-10-15','Qualification 10','Computer','2026-01-15','House 10, Street 1, Demo City','inactive'],
      ['clerk3','Clerk 3','clerk3@demo.com','clerk123','0244000011','clerk','male','1995-11-15','Qualification 11','Inventory','2026-03-01','House 11, Street 1, Demo City','suspended']
    ];

    var userRows = demo.map(function(u, i) {
      var stamp = new Date(Date.now() - (demo.length - i) * 86400000).toISOString();
      var empCode = 'EMP' + String(i + 1).padStart(3, '0');
      var emerName = 'Emergency Contact ' + (i + 1);
      var emerPhone = '0300' + String(2000000 + i).padStart(7, '0');
      return [
        i + 1, u[0], u[1], u[2], u[3], u[4], u[5], u[6], toIso(u[7]), u[8], u[9], toIso(u[10]),
        DEFAULT_LOGO, u[11], u[12], '', '0', 'light', '', stamp, 'System', stamp, 'System',
        empCode, emerName, emerPhone
      ];
    });

    // 4. demo classes — teacher IDs from seed: 5=teacher1, 6=teacher2, 7=teacher3
    // [ClassName, Section, Year, ClassTeacherID, TotalStrength, GradeLevel, ClassCode, Stage, Medium, Stream, MaxCapacity, Room, Building, AssistantTeacherID, IsActive]
    var demoClasses = [
      ['Basic 1','A','2026-2027', 5, 30, 1, 'B1A', 'lower_primary', 'english', 'general', 35, 'A-101', 'Main', '',  '1'], // class 1
      ['Basic 1','B','2026-2027', 6, 28, 1, 'B1B', 'lower_primary', 'english', 'general', 35, 'A-102', 'Main', '',  '1'], // class 2
      ['Basic 2','A','2026-2027', 7, 32, 2, 'B2A', 'lower_primary', 'english', 'general', 35, 'A-201', 'Main', '',  '1'], // class 3
      ['Basic 2','B','2026-2027', '', 30, 2, 'B2B', 'lower_primary', 'english', 'general', 35, 'A-202', 'Main', '',  '1'], // class 4
      ['Basic 3','A','2026-2027', '', 26, 3, 'B3A', 'lower_primary', 'english', 'general', 35, 'B-101', 'Main', '',  '1'], // class 5
      ['Basic 4','A','2026-2027', '', 28, 4, 'B4A', 'upper_primary', 'english', 'general', 35, 'B-201', 'Main', '',  '1'], // class 6
      ['Basic 5','A','2026-2027', '', 25, 5, 'B5A', 'upper_primary', 'english', 'general', 30, 'B-301', 'Main', '',  '1'], // class 7
      ['Basic 1','A','2027-2026', 5, 28, 1, 'B1A', 'lower_primary', 'english', 'general', 35, 'A-101', 'Main', '',  '0']  // class 8 — historical, inactive
    ];

    var classRows = demoClasses.map(function(c, k) {
      var cstamp = new Date(Date.now() - (demoClasses.length - k) * 43200000).toISOString();
      // cols: id, name, section, year, teacherId, strength, isDel, createdAt, updatedAt, gradeLvl, classCode, stage, medium, stream, maxCap, room, building, assistantId, isActive, shift
      return [k + 1, c[0], c[1], c[2], c[3], c[4], '0', cstamp, cstamp, c[5], c[6], c[7], c[8], c[9], c[10], c[11], c[12], c[13], c[14], 'full_day'];
    });

    // 5. demo subjects — same code can repeat across classes (UNIQUE is per-class)
    // [Name, Code, ClassID, MaxMarks, PassMarks, SubjectType, TheoryMax, PracticalMax, TheoryPass, PracticalPass]
    var demoSubjects = [
      ['Mathematics',        'MATH', 1, 100, 50, 'theory',    100,  0, 50, 0],   // sid 1 — Basic 1A
      ['English Language',   'ENG',  1, 100, 50, 'theory',    100,  0, 50, 0],   // sid 2
      ['Integrated Science', 'SCI',  1, 100, 50, 'both',       80, 20, 40, 10],  // sid 3 (theory+practical split)
      ['Mathematics',        'MATH', 2, 100, 50, 'theory',    100,  0, 50, 0],   // sid 4 — Basic 1B
      ['English Language',   'ENG',  2, 100, 50, 'theory',    100,  0, 50, 0],   // sid 5
      ['Integrated Science', 'SCI',  2, 100, 50, 'both',       80, 20, 40, 10],  // sid 6
      ['Mathematics',        'MATH', 3, 100, 50, 'theory',    100,  0, 50, 0],   // sid 7 — Basic 2A
      ['English Language',   'ENG',  3, 100, 50, 'theory',    100,  0, 50, 0],   // sid 8
      ['Integrated Science', 'SCI',  3, 100, 50, 'both',       80, 20, 40, 10],  // sid 9
      ['Mathematics',        'MATH', 4, 100, 50, 'theory',    100,  0, 50, 0],   // sid 10 — Basic 2B
      ['English Language',   'ENG',  4, 100, 50, 'theory',    100,  0, 50, 0],   // sid 11
      ['Computing',          'COMP', 4,  50, 25, 'practical',   0, 50,  0, 25],  // sid 12 (practical only)
      ['Mathematics',        'MATH', 5, 100, 50, 'theory',    100,  0, 50, 0],   // sid 13 — Basic 3A
      ['English Language',   'ENG',  5, 100, 50, 'theory',    100,  0, 50, 0]    // sid 14
    ];

    var subjectRows = demoSubjects.map(function(s, m) {
      var sstamp = new Date(Date.now() - (demoSubjects.length - m) * 21600000).toISOString();
      // cols: id, name, code, classId, maxMarks, isDel, createdAt, updatedAt, passMarks, type, theoryMax, practMax, theoryPass, practPass, isActive, isOptional, subjectGroup
      var grp = s[1] === 'COMP' ? 'sciences' : (s[1] === 'ENG' ? 'languages' : (s[1] === 'MATH' ? 'core' : (s[1] === 'SCI' ? 'sciences' : 'core')));
      var opt = s[1] === 'COMP' ? '1' : '0';
      return [m + 1, s[0], s[1], s[2], s[3], '0', sstamp, sstamp, s[4], s[5], s[6], s[7], s[8], s[9], '1', opt, grp];
    });

    // 6. demo teacher assignments — [TeacherID, ClassID, SubjectID, AcademicYear, IsClassTeacher]
    // teacher 5 = Math specialist, 6 = English, 7 = Science
    var demoAssignments = [
      [5, 1, 1, '2026-2027', '1'],   // Teacher 1 → Class 1A Math (class teacher)
      [5, 2, 4, '2026-2027', '0'],   // Teacher 1 → Class 1B Math
      [6, 1, 2, '2026-2027', '0'],   // Teacher 2 → Class 1A English
      [6, 2, 5, '2026-2027', '1'],   // Teacher 2 → Class 1B English (class teacher)
      [6, 3, 8, '2026-2027', '0'],   // Teacher 2 → Class 2A English
      [7, 1, 3, '2026-2027', '0'],   // Teacher 3 → Class 1A Science
      [7, 3, 9, '2026-2027', '1']    // Teacher 3 → Class 2A Science (class teacher)
    ];

    var assignmentRows = demoAssignments.map(function(a, n) {
      var astamp = new Date(Date.now() - (demoAssignments.length - n) * 36000000).toISOString();
      // PeriodsPerWeek: 5 for math/eng, 4 for science (typical workload)
      var ppw = (a[2] === 1 || a[2] === 4 || a[2] === 7) ? 5 : (a[2] === 3 || a[2] === 6 || a[2] === 9 ? 4 : 5);
      return [n + 1, a[0], a[1], a[2], a[3], a[4], astamp, astamp, ppw];
    });

    // 6b. demo students — generic numbered placeholders (YouTube-policy safe)
    // [classId, roll, gender, dob, bloodGroup, status, hasGhanaCard, transportReq, transportRoute, prevSchool,
    //  Nationality, CurriculumTrack, EnglishProficiency, HouseName]
    var demoStudents = [
      [1, '01', 'male',   '2018-03-15', 'A+',  'active',      true,  false, '',       '',                       'Ghanaian',   'ges',    'native', 'Red'],
      [1, '02', 'female', '2018-05-22', 'B+',  'active',      true,  true,  'Route A','',                       'Ghanaian',   'ges',    'native', 'Blue'],
      [1, '03', 'male',   '2018-07-08', 'O+',  'active',      false, false, '',       'Demo Previous School',   'Nigerian',   'ges',    'native', 'Green'],
      [2, '01', 'female', '2018-09-14', 'AB+', 'active',      true,  false, '',       '',                       'Ghanaian',   'ges',    'native', 'Yellow'],
      [2, '02', 'male',   '2018-11-30', 'A-',  'active',      true,  true,  'Route B','',                       'Ghanaian',   'ges',    'native', 'Red'],
      [3, '01', 'female', '2017-04-19', 'B-',  'active',      false, false, '',       '',                       'Ghanaian',   'ges',    'native', 'Blue'],
      [3, '02', 'male',   '2017-06-25', 'O-',  'active',      true,  false, '',       '',                       'Lebanese',   'ges',    'b2',     'Green'],
      [3, '03', 'female', '2017-08-12', 'AB-', 'active',      true,  true,  'Route A','',                       'Ghanaian',   'ges',    'native', 'Yellow'],
      [5, '01', 'male',   '2016-02-28', 'A+',  'active',      true,  false, '',       '',                       'Ghanaian',   'ges',    'native', 'Red'],
      [6, '01', 'female', '2015-10-05', 'O+',  'active',      false, false, '',       '',                       'Ghanaian',   'ges',    'native', 'Blue'],
      [7, '01', 'male',   '2014-12-18', 'B+',  'passed_out',  true,  false, '',       '',                       'Ghanaian',   'ges',    'native', 'Green'],
      [1, '04', 'female', '2018-01-09', 'A+',  'transferred', true,  false, '',       '',                       'Ghanaian',   'ges',    'native', 'Yellow']
    ];

    var studentRows = demoStudents.map(function(d, m) {
      var n = m + 1;
      var admDate = new Date(Date.now() - (demoStudents.length - m) * 7 * 86400000).toISOString();
      var stamp = new Date(Date.now() - (demoStudents.length - m) * 86400000).toISOString();
      var ghanaCard = d[6] ? 'GHA-' + String(700000000 + n * 111).padStart(9, '0') + '-' + ((n % 9) + 1) : '';  // fake, GHA-XXXXXXXXX-X format
      var npad = String(n).padStart(8, '0');
      return [
        n,
        '2026-' + npad,                       // AdmissionNumber
        'Student ' + n,                       // FirstName
        '',                                   // MiddleName
        'Demo',                               // LastName
        d[2],                                 // Gender
        toIso(d[3]),                          // DateOfBirth (ISO)
        d[4],                                 // BloodGroup
        ghanaCard,                              // GhanaCardNumber
        '024' + String(1000000 + n),          // Mobile
        'student' + n + '@demo.com',          // Email
        'House ' + n + ', Street 1, Demo City', // AddressLine
        'Demo City',                          // City
        'Greater Accra',                      // Region
        'GA-' + String(100 + n).padStart(3, '0') + '-' + String(1000 + n * 7).padStart(4, '0'), // GhanaPostGPS
        'Father ' + n,                        // FatherName
        'Occupation ' + (n % 3 + 1),          // FatherOccupation
        '024' + String(2000000 + n),          // FatherMobile
        'Mother ' + n,                        // MotherName
        '',                                   // MotherOccupation
        '020' + String(3000000 + n),          // MotherMobile
        '',                                   // GuardianName
        '',                                   // GuardianRelation
        '',                                   // GuardianMobile
        admDate,                              // AdmissionDate (full ISO)
        d[0],                                 // ClassID
        d[1],                                 // RollNumber
        ['day','day','day','boarding','day'][n % 5], // Category
        n % 4 === 0 ? 'Other' : '',           // Religion
        d[9],                                 // PreviousSchool
        d[7] ? '1' : '0',                     // TransportRequired
        d[8],                                 // TransportRoute
        n % 5 === 0 ? 'Sample medical note ' + n : '', // MedicalNotes
        '',                                   // PhotoURL
        'student123',                         // LoginPassword (plain)
        d[5],                                 // Status
        '0',                                  // IsDeleted
        stamp, stamp,                         // CreatedAt / UpdatedAt
        // 22 new intl cols
        d[10],                                // Nationality
        '',                                   // SecondNationality
        d[10],                                // CountryOfBirth (mirrors nationality for demo)
        ['Alex','Sam','Jamie','Taylor','Jordan'][n % 5], // PreferredName
        n % 3 === 0 ? 'P' + String(1000000 + n) : '',    // PassportNumber (sparse)
        n % 3 === 0 ? toIso('2030-12-31') : '',          // PassportExpiry
        n % 4 === 0 ? 'Dependent' : '',                   // VisaType (sparse)
        n % 4 === 0 ? toIso('2026-12-31') : '',          // VisaExpiry
        d[10] === 'Nigerian' ? 'Yoruba' : (d[10] === 'Lebanese' ? 'Arabic' : 'Twi'), // MotherTongue
        'English',                            // HomeLanguage
        d[12],                                // EnglishProficiency
        d[11],                                // CurriculumTrack
        ['joint','joint','joint','mother_only','joint'][n % 5], // CustodyArrangement
        ['both','father','mother','guardian','both'][n % 5],    // PrimaryContactParent
        n % 3 === 0 ? 'Grandfather, Driver Mr. Osei' : '',      // AuthorizedPickupPersons
        '1',                                  // MediaConsent
        ['none','vegetarian','halal','none','vegan'][n % 5],    // DietaryRequirements
        n % 7 === 0 ? 'Peanut allergy — EpiPen required' : (n % 5 === 0 ? 'Penicillin allergy' : ''), // Allergies
        n % 2 === 0 ? 'AXA International' : 'Cigna Global',     // InsuranceProvider
        toIso('2026-12-31'),                  // InsurancePolicyExpiry
        d[13],                                // HouseName
        ['fresh','fresh','transfer','fresh','fresh'][n % 5],    // AdmissionType
        // welfare/finance
        n % 4 === 0 ? 25 : (n % 6 === 0 ? 50 : 0),              // ConcessionPercent (sparse)
        n === 3 ? 'IEP — Dyslexia, extra time on exams' : (n === 7 ? 'Mild ASD — visual schedule support' : '') // SpecialNeeds
      ];
    });

    // 6c. demo parents — mobiles match the student demo seed (for teacher mobile-bridge filter)
    // student demo: father_mobile = '0321' + (2000000+n), mother_mobile = '0345' + (3000000+n)
    // [Name, Email, Mobile, Password, Relation, Occupation, Address, Status,
    //  Nationality, CoR, Lang, ContactMethod, WhatsApp, TZ, Employer, JobTitle, WorkEmail, WorkPhone,
    //  IsBilling, NotifPrefs, EmergencyOnly, Photo, City, Country, PostalCode, NumChildren]
    var demoParents = [
      ['Father 1','father1@demo.com','0244200001','parent123','father','Engineering','House 1, Street 1, Accra','active',
       'Ghanaian','Ghana','en','whatsapp','0244200001','Africa/Accra','Vodafone Ghana','Network Engineering Manager','f1@vodafone.com.gh','0302200001',
       '1','attendance,exams,fees,notices,discipline','0','','Accra','Ghana','GA-183-8541',2],
      ['Mother 1','mother1@demo.com','0207200001','parent123','mother','','House 1, Street 1, Accra','active',
       'Ghanaian','Ghana','en','email','0207200001','Africa/Accra','','','','',
       '0','attendance,exams,fees,notices','0','','Accra','Ghana','GA-183-8541',2],
      ['Father 2','father2@demo.com','0244200002','parent123','father','Finance','House 2, Street 1, Kumasi','active',
       'Ghanaian','Ghana','en','sms','','Africa/Accra','GCB Bank','Branch Manager','','0322200002',
       '1','attendance,fees,notices','0','','Kumasi','Ghana','AK-102-5673',1],
      ['Mother 2','mother2@demo.com','0207200002','parent123','mother','Marketing','House 2, Street 1, Kumasi','active',
       'Ghanaian','Ghana','en','whatsapp','0207200002','Africa/Accra','Unilever Ghana','Brand Manager','','',
       '0','attendance,exams,notices','0','','Kumasi','Ghana','AK-102-5673',1],
      ['Father 4','father4@demo.com','0244200004','parent123','father','Engineering','House 4, Street 1, Tema','active',
       'Ghanaian','United Kingdom','en','whatsapp','0244200004','Europe/London','Tema Oil Refinery (seconded to UK)','Senior Engineer','','+442071234567',
       '1','attendance,exams,fees,notices,discipline','0','','London','United Kingdom','11111',3],
      ['Father 6','father6@demo.com','0244200006','parent123','father','Medicine','House 6, Street 1, Accra','active',
       'Ghanaian','Canada','en','email','','America/Toronto','Toronto General Hospital','Cardiologist','f6@tgh.ca','',
       '1','attendance,fees,discipline','1','','Toronto','Canada','M5G 2C4',1],
      ['Mother 7','mother7@demo.com','0207200007','parent123','mother','','House 7, Street 1, Cape Coast','active',
       'Ghanaian','Ghana','en','app','0207200007','Africa/Accra','MTN Ghana','Director, Customer Experience','','0244220007',
       '0','attendance,exams,fees','0','','Cape Coast','Ghana','CE-105-2234',2],
      ['Guardian 9','guardian9@demo.com','0244200009','parent123','guardian','Legal','House 9, Street 1, Accra','active',
       'Ghanaian','Ghana','en','email','','Africa/Accra','Bentsi-Enchill, Letsa & Ankomah','Partner','','',
       '1','attendance,fees,notices,discipline','0','','Accra','Ghana','GA-201-7788',1],
      ['Father 9','father9@demo.com','0244200010','parent123','father','Engineering','House 9, Street 1, Takoradi','inactive',
       'Ghanaian','Ghana','en','sms','','Africa/Accra','Tullow Oil Ghana','Field Engineer','','',
       '0','','1','','Takoradi','Ghana','WS-045-1123',1],
      ['Mother 10','mother10@demo.com','0207200010','parent123','mother','','House 10, Street 1, Accra','active',
       'Ghanaian','United States','en','whatsapp','0207200010','America/New_York','Remote (Accounting Firm)','Senior Accountant','','',
       '0','attendance,exams,fees,notices,discipline','0','','New York','United States','10001',2]
    ];

    var parentRows = demoParents.map(function(p, q) {
      var pstamp = new Date(Date.now() - (demoParents.length - q) * 60000000).toISOString();
      // cols: id, name, email, mobile, pwd, rel, occ, addr, lastLogin, status, isDel, createdAt, updatedAt,
      //       nationality, cor, lang, contact, wa, tz, employer, jt, wEmail, wPhone, pbc, notif, eo, photo, city, country, pc, numKids
      // demo annual incomes (GHS-equivalent base) — varied for scholarship eligibility testing
      var incomes = [120000, 80000, 250000, 95000, 60000, 350000, 180000, 420000, 35000, 110000];
      return [
        q + 1, p[0], p[1], p[2], p[3], p[4], p[5], p[6],
        '',  // last_login
        p[7],
        '0',
        pstamp, pstamp,
        p[8], p[9], p[10], p[11], p[12], p[13], p[14], p[15], p[16], p[17],
        p[18], p[19], p[20], p[21], p[22], p[23], p[24], p[25],
        incomes[q] || 100000
      ];
    });

    // 6d. demo parent_students junctions — [parentId, studentId, isPrimary]
    // Father 1 (id=1) is linked to BOTH Student 1 and Student 3 → demonstrates parent multi-child switching
    var demoLinks = [
      [1, 1, '1'],   // Father 1 → Student 1 (primary)
      [2, 1, '0'],   // Mother 1 → Student 1
      [3, 2, '1'],   // Father 2 → Student 2 (primary)
      [4, 2, '0'],   // Mother 2 → Student 2
      [5, 4, '1'],   // Father 4 → Student 4 (primary)
      [6, 6, '1'],   // Father 6 → Student 6 (primary)
      [7, 7, '1'],   // Mother 7 → Student 7 (primary)
      [8, 9, '1'],   // Guardian 9 → Student 9 (primary)
      [10, 10, '1'], // Mother 10 → Student 10 (primary)
      [1, 3, '1']    // Father 1 → Student 3 (primary, sibling of Student 1) ← multi-child case
    ];

    var linkRows = demoLinks.map(function(l, n) {
      var lstamp = new Date(Date.now() - (demoLinks.length - n) * 30000000).toISOString();
      return [n + 1, l[0], l[1], l[2], lstamp, lstamp];
    });

    // 6e. demo exams — tuple: [name, type, classId, year, startDate, endDate, maxMarks, isPub,
    //                          term, assType, code, weight, scheme, stage, duration, lockedDate]
    // Ghana 2026/2027 basic school calendar: Term 1 Sep 8–Dec 17 2026, Term 2 Jan 5–Mar 25 2027,
    // Term 3 Apr 20–Jul 22 2027 (BECE May 5–12 2027 for JHS3 candidates).
    // [Name, Type, ClassID, AcademicYear, StartDate, EndDate, MaxMarksPerSubject, IsPublished,
    //  Term, AssessmentType, ExamCode, WeightagePercent, GradingScheme, CurriculumStage, ExamDuration,
    //  ResultsLockedDate, VacationDate, ReopeningDate]
    var demoExams = [
      ['Class Test 1','unit_test', 1, '2026-2027','2026-09-22','2026-09-24', 25, '1',
       'term1','formative','CT1-2026',  10,'sba_5band','lower_primary', 60, '', '', ''],
      ['End of Term 1 Exam','final', 1, '2026-2027','2026-12-08','2026-12-16', 100, '1',
       'term1','summative','EOT1-2026',  70,'sba_5band','lower_primary', 90, '2026-12-17', '2026-12-17', '2027-01-05'],
      ['End of Term 1 Exam','final', 2, '2026-2027','2026-12-08','2026-12-16', 100, '0',
       'term1','summative','EOT1-2026',  70,'sba_5band','lower_primary', 90, '', '2026-12-17', '2027-01-05'],
      ['End of Term 2 Exam','final', 3, '2026-2027','2027-03-15','2027-03-24', 100, '1',
       'term2','summative','EOT2-2027',  70,'sba_5band','lower_primary',120, '2027-03-25', '2027-03-25', '2027-04-20'],
      ['End of Term 2 Exam','final', 5, '2026-2027','2027-03-15','2027-03-24', 100, '0',
       'term2','summative','EOT2-2027',  70,'sba_5band','upper_primary',150, '', '2027-03-25', '2027-04-20'],
      ['End of Term 3 Exam','final', 1, '2026-2027','2027-07-12','2027-07-20', 100, '0',
       'term3','summative','EOT3-2027',  70,'sba_5band','lower_primary',180, '', '2027-07-22', '']
    ];

    var examRows = demoExams.map(function(x, k) {
      var estamp = new Date(Date.now() - (demoExams.length - k) * 50000000).toISOString();
      var isPub = x[7] === '1';
      var pubAt = isPub ? new Date(Date.now() - 5 * 86400000).toISOString() : '';
      var pubBy = isPub ? 1 : '';   // admin user_id = 1
      return [
        k + 1, x[0], x[1], x[2], x[3], toIso(x[4]), toIso(x[5]), x[6], x[7], pubAt, pubBy, '0', estamp, estamp,
        // term, assType, code, weight, scheme, stage, duration, lockedDate, passOverride, rcGen, nextExamId, sections
        x[8], x[9], x[10], x[11], x[12], x[13], x[14], x[15] ? toIso(x[15]) : '', '', '0', '', '',
        // PassingPercentageRequired — overall promotion threshold (NaCCA "Developing" band starts at 50%)
        50,
        x[16] ? toIso(x[16]) : '', x[17] ? toIso(x[17]) : ''
      ];
    });

    // 6f. demo marks — only for published exams. [examId, studentId, subjectId, marks, isAbsent]
    // Class 1A students: 1, 2, 3 — subjects: 1=Math, 2=English, 3=Science (each max=100, but exam1 has max=25)
    // Class 2A students: 6, 7, 8 — subjects: 7=Math, 8=English, 9=Science
    // Exam 1 (Unit Test 1, Class 1A, max=25), Exam 2 (Quarterly, Class 1A, max=100), Exam 4 (Mid Term, Class 2A, max=100)
    // Mix grades + one absent + one fail to demonstrate full grade scale
    var demoMarks = [
      // Exam 1 — Unit Test 1, Class 1A (max 25)
      [1, 1, 1, 23, '0'],   // Student 1 / Math: 23/25 = 92% A+
      [1, 1, 2, 21, '0'],   // Student 1 / English: 21/25 = 84% A
      [1, 1, 3, 18, '0'],   // Student 1 / Science: 18/25 = 72% B+
      [1, 2, 1, 19, '0'],   // Student 2 / Math: 76% B+
      [1, 2, 2, 22, '0'],   // Student 2 / English: 88% A
      [1, 2, 3, 16, '0'],   // Student 2 / Science: 64% B
      [1, 3, 1, 0, '1'],    // Student 3 / Math: ABSENT
      [1, 3, 2, 14, '0'],   // Student 3 / English: 56% C
      [1, 3, 3, 9, '0'],    // Student 3 / Science: 36% F (demonstrates fail grade)

      // Exam 2 — Quarterly, Class 1A (max 100)
      [2, 1, 1, 88, '0'],   // Student 1 / Math: A
      [2, 1, 2, 92, '0'],   // Student 1 / English: A+
      [2, 1, 3, 78, '0'],   // Student 1 / Science: B+
      [2, 2, 1, 75, '0'],   // Student 2 / Math: B+
      [2, 2, 2, 81, '0'],   // Student 2 / English: A
      [2, 2, 3, 68, '0'],   // Student 2 / Science: B
      [2, 3, 1, 55, '0'],   // Student 3 / Math: C
      [2, 3, 2, 62, '0'],   // Student 3 / English: B
      [2, 3, 3, 48, '0'],   // Student 3 / Science: D

      // Exam 4 — Mid Term, Class 2A (max 100)
      // students 6,7,8 — subjects 7=Math, 8=English, 9=Science (max 100)
      [4, 6, 7, 84, '0'],   // Student 6 / Math
      [4, 6, 8, 79, '0'],   // Student 6 / English
      [4, 6, 9, 91, '0'],   // Student 6 / Science
      [4, 7, 7, 72, '0'],   // Student 7 / Math
      [4, 7, 8, 88, '0'],   // Student 7 / English
      [4, 7, 9, 65, '0'],   // Student 7 / Science
      [4, 8, 7, 58, '0'],   // Student 8 / Math
      [4, 8, 8, 70, '0'],   // Student 8 / English
      [4, 8, 9, 53, '0']    // Student 8 / Science
    ];

    // teacher entered_by mapping: math by teacher 1 (id=5), english by teacher 2 (id=6), science by teacher 3 (id=7)
    var subjectToTeacher = { 1: 5, 2: 6, 3: 7, 7: 5, 8: 6, 9: 7 };

    var markRows = demoMarks.map(function(m, n) {
      var mstamp = new Date(Date.now() - (demoMarks.length - n) * 18000000).toISOString();
      var examIdx = m[0] - 1;
      var examMaxMarks = parseInt(demoExams[examIdx][6], 10);  // exam.max_marks_per_subject
      var obtained = parseFloat(m[3]);
      var isAbsent = m[4];
      var grade = computeGrade(obtained, examMaxMarks, isAbsent === '1');
      var enteredBy = subjectToTeacher[m[2]] || 1;
      // pct
      var pct = (isAbsent === '1' || examMaxMarks <= 0) ? 0 : Math.round((obtained / examMaxMarks) * 10000) / 100;
      // demo: science subjects (3,6,9) have theory+practical split — 80/20
      var isBothSubject = (m[2] === 3 || m[2] === 6 || m[2] === 9);
      var theory = isBothSubject && isAbsent === '0' ? Math.round(obtained * 0.8 * 100) / 100 : 0;
      var practical = isBothSubject && isAbsent === '0' ? Math.round(obtained * 0.2 * 100) / 100 : 0;
      // status: published exam = 'published', else 'submitted'
      var status = demoExams[examIdx][7] === '1' ? 'published' : 'submitted';
      return [
        n + 1, m[0], m[1], m[2], obtained, examMaxMarks, grade, isAbsent, '', enteredBy, mstamp, mstamp,
        // 12 new: theory, practical, internal, external, pct, gradePoints, attempt, status, moderated, modBy, modDate, comments
        theory, practical, 0, 0, pct, 0, 1, status, '0', '', '', '',
        // Rank (computed later via computeMarkRanks), OriginalMarks (audit snapshot)
        '', obtained
      ];
    });

    // 6g. demo attendance — DENORMALIZED: 1 row per (class, date, mode, subject, period) with JSON statuses blob
    // Demo dates computed at seed time so the same-day teacher RBAC is testable in real time.
    var d0 = new Date(); d0.setHours(0,0,0,0);
    var d1 = new Date(d0); d1.setDate(d0.getDate() - 1);
    var d2 = new Date(d0); d2.setDate(d0.getDate() - 2);
    var dIsoFn = function(d) { return d.toISOString(); };
    var today_d = dIsoFn(d0), yesterday_d = dIsoFn(d1), dayBefore_d = dIsoFn(d2);
    var attTs = nowIso();

    // helper: compute counts from a status object then build a row
    function buildAttRow(id, classId, dateIso, mode, subjectId, periodNumber, statusesObj, markedBy) {
      var p = 0, ab = 0, tot = 0;
      Object.keys(statusesObj).forEach(function(k) {
        var st = statusesObj[k].status;
        tot++;
        if (st === 'present' || st === 'late' || st === 'half_day') p++;
        else if (st === 'absent') ab++;
      });
      return [id, classId, dateIso, mode, subjectId, periodNumber,
              JSON.stringify(statusesObj), p, ab, tot, markedBy, attTs, attTs,
              '0', ''];
    }

    // daily attendance for Class 1A (students 1, 2, 3) over 3 days
    var demoAttendanceDaily = [
      buildAttRow(1, 1, dayBefore_d, 'daily', '', '', {
        '1': { status: 'present', remarks: '' },
        '2': { status: 'present', remarks: '' },
        '3': { status: 'late',    remarks: 'Bus delay' }
      }, 5),
      buildAttRow(2, 1, yesterday_d, 'daily', '', '', {
        '1': { status: 'present', remarks: '' },
        '2': { status: 'absent',  remarks: 'Sick' },
        '3': { status: 'present', remarks: '' }
      }, 5),
      buildAttRow(3, 1, today_d, 'daily', '', '', {
        '1': { status: 'present',  remarks: '' },
        '2': { status: 'half_day', remarks: 'Doctor appointment' },
        '3': { status: 'leave',    remarks: 'Family event' }
      }, 5)
    ];

    // subject-wise attendance for Class 1A — Math (subj=1, P1) + English (subj=2, P2) for today
    var demoAttendanceSubject = [
      buildAttRow(4, 1, today_d, 'subject_wise', 1, 1, {
        '1': { status: 'present', remarks: '' },
        '2': { status: 'present', remarks: '' },
        '3': { status: 'absent',  remarks: 'Was excused for sports' }
      }, 5),
      buildAttRow(5, 1, today_d, 'subject_wise', 2, 2, {
        '1': { status: 'present', remarks: '' },
        '2': { status: 'late',    remarks: 'From sick room' },
        '3': { status: 'present', remarks: '' }
      }, 6)
    ];

    var attRows = demoAttendanceDaily.concat(demoAttendanceSubject);

    // 6h. demo fee_structure — across Class 1A/1B/2A
    // [classId, category, amount, frequency, academicYear, dueDay, lateFee, isActive]
    var demoFeeStructures = [
      [1, 'tuition',    1500, 'monthly',  '2026-2027', 10,  10, '1'],   // Class 1A monthly tuition
      [1, 'admission',  5000, 'one_time', '2026-2027', 10,   0, '1'],
      [1, 'transport',   800, 'monthly',  '2026-2027', 10,   5, '1'],
      [1, 'exam',        300, 'quarterly','2026-2027', 15,   0, '1'],
      [1, 'annual',     2000, 'annual',   '2026-2027', 30,   0, '1'],
      [2, 'tuition',    1500, 'monthly',  '2026-2027', 10,  10, '1'],   // Class 1B
      [2, 'admission',  5000, 'one_time', '2026-2027', 10,   0, '1'],
      [3, 'tuition',    1800, 'monthly',  '2026-2027', 10,  15, '1'],   // Class 2A
      [3, 'transport',   900, 'monthly',  '2026-2027', 10,   5, '0'],   // inactive (off-season)
      [5, 'tuition',    2000, 'monthly',  '2026-2027', 10,  20, '1']    // Class 3A
    ];

    var feeRows = demoFeeStructures.map(function(f, n) {
      var fstamp = new Date(Date.now() - (demoFeeStructures.length - n) * 25000000).toISOString();
      // tuition allows 3 installments, others one-time. Tax 0 for fees (most schools tax-exempt). Description matches category.
      var instAllowed = f[1] === 'tuition' ? '1' : '0';
      var instCount = f[1] === 'tuition' ? 3 : 1;
      var desc = f[1] === 'tuition' ? 'Monthly tuition for ' + f[3] + ' billing' :
                 f[1] === 'admission' ? 'One-time admission fee' :
                 f[1] === 'transport' ? 'School bus transport' :
                 f[1] === 'exam' ? 'Quarterly exam fee' :
                 f[1] === 'annual' ? 'Annual charges (lab, library, sports)' : '';
      return [n + 1, f[0], f[1], f[2], f[3], f[4], f[5], f[6], f[7], '0', fstamp, fstamp,
              instAllowed, instCount, 0, desc];
    });

    // 6i. demo fee_payments — receipts for Class 1A students against fee structure ids 1 (tuition) and 2 (admission)
    // [studentId, feeStructureId, amountPaid, lateFee, discount, paymentDate, billingPeriod, mode, txnRef, receiptNumber, status, collectedBy=admin(id=1), remarks]
    // mode: cash|cheque|online|mobile_money|card|bank_transfer. momo: '' unless mode=mobile_money.
    var demoPayments = [
      [1, 1, 1500, 0,   0,   '2026-09-10', 'Term 1 2026/2027', 'cash',         '',              'RCP-2026-00000001', 'paid',    1, '',                 ''],
      [1, 2, 300,  0,   0,   '2026-08-20', 'Admission',        'online',       'TXN12345',      'RCP-2026-00000002', 'paid',    1, '',                 ''],
      [2, 1, 1500, 0,   100, '2026-09-11', 'Term 1 2026/2027', 'mobile_money', '024XXXXXXX-01', 'RCP-2026-00000003', 'paid',    1, 'Discount applied', 'mtn_momo'],
      [2, 2, 300,  0,   0,   '2026-08-22', 'Admission',        'bank_transfer','BT00112',       'RCP-2026-00000004', 'paid',    1, '',                 ''],
      [3, 1, 1000, 50,  0,   '2026-09-18', 'Term 1 2026/2027', 'cash',         '',              'RCP-2026-00000005', 'partial', 1, 'Late payment',     ''],   // partial: paid 1000 + 50 late = 1050 of 1550 = partial
      [3, 2, 0,    0,   0,   '2026-08-25', 'Admission',        'cheque',       'CHQ-7723',      'RCP-2026-00000006', 'pending', 1, 'Cheque pending',   '']
    ];

    var paymentRows = demoPayments.map(function(p, n) {
      var pstamp = new Date(Date.now() - (demoPayments.length - n) * 40000000).toISOString();
      var feeAmt = demoFeeStructures[p[1] - 1][2];   // fee_structure.amount
      var expected = feeAmt + p[3] - p[4];
      if (expected < 0) expected = 0;
      var amountDue = Math.max(0, expected - p[2]);
      return [
        n + 1, p[0], p[1], p[2], amountDue, p[3], p[4],
        toIso(p[5]), p[6], p[7], p[8], p[9], p[10], p[11], p[12],
        '0', pstamp, pstamp,
        '2026-2027', 0, '', '', p[13]
      ];
    });

    // 6j. demo discipline incidents — covers full type/severity/status/parent_notified range
    // [studentId, incidentDate, incidentType, severity, description, actionTaken, parentNotified, status, reportedBy]
    // teacher 1 = id 5, teacher 2 = id 6, teacher 3 = id 7, supervisor 1 = id 10
    var demoDiscipline = [
      [1, '2026-09-15', 'uniform_violation','low',     'Wore non-uniform shoes',         'Verbal warning',                  '0','resolved',    5],
      [2, '2026-09-20', 'tardiness',        'low',     'Late by 15 minutes (3rd time)',  'Noted; spoke with student',       '0','resolved',    5],
      [3, '2026-10-05', 'fighting',         'high',    'Physical altercation in playground','Suspension 2 days; counseling','1','resolved',    6],
      [6, '2026-10-15', 'disrespect',       'medium',  'Disrespectful tone to teacher',  'Counseling session scheduled',    '1','under_review',7],
      [7, '2026-11-02', 'cheating',         'high',    'Caught using notes during test', 'Test invalidated; meeting set',  '1','escalated',   10],
      [1, '2026-11-10', 'property_damage',  'medium',  'Broke desk drawer',              '',                                 '0','open',        5]
    ];

    var disciplineRows = demoDiscipline.map(function(d, n) {
      var dstamp = new Date(Date.now() - (demoDiscipline.length - n) * 30000000).toISOString();
      var locations = ['classroom','classroom','playground','classroom','classroom','classroom'];
      var witnessesArr = ['','','Teacher 1, Teacher 2','Teacher 3','Supervisor 1, Teacher 1','Teacher 1'];
      return [
        n + 1, d[0], toIso(d[1]), d[2], d[3], d[4], d[5], d[6], d[7], '', d[8],
        '0', dstamp, dstamp,
        locations[n] || 'classroom', witnessesArr[n] || ''
      ];
    });

    // 6k. demo conduct evaluations — monthly for Class 1A students + a Term 1 capstone
    // [studentId, evaluationPeriod, periodLabel, academicYear, conductGrade, remarks, evaluatedBy]
    var demoConduct = [
      // Sept 2026 monthly
      [1, 'monthly', 'Sept 2026',  '2026-2027', 'very_good',          'Active class participation', 5],
      [2, 'monthly', 'Sept 2026',  '2026-2027', 'good',               '',                            5],
      [3, 'monthly', 'Sept 2026',  '2026-2027', 'satisfactory',       'Distracted at times',         5],
      // Oct 2026 monthly
      [1, 'monthly', 'Oct 2026',   '2026-2027', 'good',               '',                            5],
      [2, 'monthly', 'Oct 2026',   '2026-2027', 'satisfactory',       'Missed homework twice',       5],
      [3, 'monthly', 'Oct 2026',   '2026-2027', 'needs_improvement',  'Disciplinary issue logged',   5],
      // Nov 2026 monthly
      [1, 'monthly', 'Nov 2026',   '2026-2027', 'very_good',          '',                            5],
      [2, 'monthly', 'Nov 2026',   '2026-2027', 'good',               '',                            5],
      // Term 1 capstone
      [1, 'term_1',  'Term 1',     '2026-2027', 'excellent',          'Strong overall performance',  10],
      [2, 'term_1',  'Term 1',     '2026-2027', 'good',               'Improving',                   10],
      [3, 'term_1',  'Term 1',     '2026-2027', 'needs_improvement',  'Recommend parent meeting',    10]
    ];

    var conductRows = demoConduct.map(function(c, n) {
      var cstamp = new Date(Date.now() - (demoConduct.length - n) * 25000000).toISOString();
      // map main grade → sub-grade default; vary one or two for realism
      var gradeMap = { excellent:'A', very_good:'A', good:'B', satisfactory:'C', needs_improvement:'D', poor:'E' };
      var base = gradeMap[c[4]] || 'C';
      // student 3's punctuality slightly worse than overall
      var pun = c[0] === 3 ? (base === 'A' ? 'B' : base === 'B' ? 'C' : 'C') : base;
      return [
        n + 1, c[0], c[1], c[2], c[3], c[4], c[5], c[6], '0', cstamp, cstamp,
        pun, base, base, base
      ];
    });

    // 6L. demo activities
    // [studentId, name, type, level, position, date, year, recordedBy]
    var demoActivities = [
      [1, 'Inter-school 100m sprint', 'sports',   'school',   '1st place',     '2026-09-22', '2026-2027', 5],
      [2, 'Annual cultural fest dance', 'dance',   'school',   'Participated',  '2026-10-12', '2026-2027', 5],
      [3, 'Math Olympiad Round 1',    'academic', 'district', '3rd place',     '2026-10-20', '2026-2027', 5],
      [6, 'Science fair project',     'science',  'school',   '1st place',     '2026-11-05', '2026-2027', 7],
      [7, 'Inter-school debate',      'debate',   'district', '2nd place',     '2026-11-18', '2026-2027', 6]
    ];
    var activityRows = demoActivities.map(function(a, n) {
      var ts = new Date(Date.now() - (demoActivities.length - n) * 20000000).toISOString();
      // CoachTeacherID — use the same teacher who recorded it (default), or a known sport coach
      var coach = a[7];
      return [n + 1, a[0], a[1], a[2], a[3], a[4], toIso(a[5]), a[6], '', '', a[7], '0', ts, ts, coach];
    });

    // 6m. demo complaints (NO is_deleted) — [type, submitterId, relatedStudentId, category, subject, description, priority, status, assignedTo]
    var demoComplaints = [
      ['parent',    1, 1, 'academic',       'Concern about exam grading',     'Marks seem inconsistent on Quarterly results', 'medium', 'in_progress', 1],
      ['teacher',   5, '', 'infrastructure','Classroom ceiling fan broken',   'Class 1A fan stopped working',                  'high',   'open',        1],
      ['supervisor',10,'', 'staff',         'Substitute teacher needed',      'Math teacher unavailable next week',            'urgent', 'in_progress', 1],
      ['parent',    3, 2, 'fees',           'Receipt not received',           'Paid fees on Sept 9 but no receipt',           'medium', 'resolved',    1]
    ];
    var complaintRows = demoComplaints.map(function(c, n) {
      var ts = new Date(Date.now() - (demoComplaints.length - n) * 18000000).toISOString();
      var code = 'CMP-2026-' + String(n + 1).padStart(8, '0');
      var resolvedAt = (c[7] === 'resolved' || c[7] === 'closed') ? ts : '';
      // 1 anonymous complaint to demo safeguarding flow
      var anon = n === 1 ? '1' : '0';
      return [n + 1, code, c[0], c[1], c[2], c[3], c[4], c[5], c[6], c[7], c[8], '', resolvedAt, ts, ts, anon, ''];
    });

    // 6n. demo notices
    // [title, description, type, date, audience, classId, attachment, priority, expiry, postedBy, isActive]
    var demoNotices = [
      ['Annual Sports Day 2026',   'Sports day will be held on Nov 28 at the school grounds', 'event',        '2026-11-15', 'all',            '', '', 'high',   '2026-11-28', 1, '1'],
      ['Diwali Holiday',           'School closed Oct 28 to Nov 3 for Diwali break',           'holiday',      '2026-10-25', 'all',            '', '', 'medium', '2026-11-03', 1, '1'],
      ['Class 1A Parent Meeting',  'PTM scheduled for Sept 30 at 3 pm in classroom',           'meeting',      '2026-09-25', 'class_specific', 1,  '', 'medium', '2026-09-30', 1, '1'],
      ['Mid Term Exam Schedule',   'Mid term exams begin Nov 18',                              'exam',         '2026-11-10', 'students',       '', '', 'high',   '',           8, '1'],
      ['Staff Meeting',            'Faculty meeting Friday at 4 pm',                           'meeting',      '2026-10-08', 'staff',          '', '', 'medium', '2026-10-11', 1, '1'],
      ['Fee Reminder',             'Sept tuition due Oct 10',                                  'announcement', '2026-10-01', 'parents',        '', '', 'medium', '2026-10-15', 1, '1'],
      ['Annual Function Auditions','Cultural function auditions on Dec 5 in main hall',        'function',     '2026-11-25', 'students',       '', '', 'medium', '2026-12-05', 9, '1'],
      ['Reading Week Program',     'Daily reading hour 9-10 am for one week',                  'program',      '2026-12-02', 'class_specific', 2,  '', 'low',    '2026-12-09', 8, '1'],
      ['Lab Safety Incident',      'Minor chemistry lab spill — area cleaned, no injuries',    'incident',     '2026-11-20', 'staff',          '', '', 'high',   '',           1, '1'],
      ['Winter Break Notice',      'School closed Dec 23 to Jan 5 for winter vacation',        'holiday',      '2026-12-15', 'all',            '', '', 'medium', '2027-01-05', 1, '1'],
      ['Library Card Renewal',     'Renew library cards by Nov 30 at front desk',              'announcement', '2026-11-10', 'students',       '', '', 'low',    '2026-11-30', 9, '1'],
      ['Class 3 Field Trip',       'Field trip to science museum on Dec 10',                   'event',        '2026-11-28', 'class_specific', 3,  '', 'high',   '2026-12-10', 8, '1'],
      ['Old Notice Archive',       'Outdated circular kept for record',                        'other',        '2026-08-15', 'all',            '', '', 'low',    '2026-08-30', 1, '0'],
      ['Urgent Power Cut Drill',   'Emergency power cut drill tomorrow morning',               'announcement', '2026-11-22', 'all',            '', '', 'urgent', '2026-11-23', 1, '1']
    ];
    var noticeRows = demoNotices.map(function(n, k) {
      var ts = new Date(Date.now() - (demoNotices.length - k) * 22000000).toISOString();
      // require ack on high/urgent priority + exam-related + safety incidents
      var p = String(n[7] || '').toLowerCase();
      var t = String(n[2] || '').toLowerCase();
      var ackReq = (p === 'urgent' || p === 'high' || t === 'exam' || t === 'incident') ? '1' : '0';
      return [k + 1, n[0], n[1], n[2], toIso(n[3]), n[4], n[5], n[6], n[7], n[8] ? toIso(n[8]) : '', n[9], n[10], '0', ts, ts, ackReq];
    });

    // 6o. demo helpdesk_tickets — [type, raiserId, studentId, category, subject, description, priority, status, assignedTo]
    var demoTickets = [
      ['parent',  1, 1, 'documents', 'Need transfer certificate copy',       'Requesting duplicate TC for sibling admission', 'medium', 'in_progress',       1],
      ['parent',  2, 1, 'fees',      'Online payment failed',                'Mobile money payment shows debited but not reflecting',  'high',   'awaiting_response', 1],
      ['student', 6, 6, 'academic',  'Doubt about Math homework',            'Cannot understand chapter 3 problem 5',         'low',    'resolved',          ''],
      ['parent',  8, 9, 'general',   'School bus timing query',              'Bus arriving late this week',                   'medium', 'open',              ''],
      ['parent',  1, 2, 'admission', 'Sibling admission process',            'Need info on admission for younger child',      'medium', 'open',              8],
      ['student', 6, 6, 'technical', 'Login OTP not received',               'OTP not arriving on parent mobile',             'high',   'in_progress',       1],
      ['parent',  2, 3, 'fees',      'Fee receipt download issue',           'Receipt PDF blank when downloaded',             'low',    'resolved',          1],
      ['student', 6, 7, 'academic',  'Request for extra class',              'Need help with science chapter 5',              'low',    'closed',            8],
      ['parent',  8, 4, 'documents', 'Bonafide certificate request',         'Need bonafide for visa application',            'high',   'awaiting_response', 1],
      ['parent',  1, 5, 'general',   'Uniform supplier contact',             'Need updated supplier info',                    'low',    'open',              ''],
      ['student', 6, 8, 'academic',  'Project submission extension',         'Group project needs 2 more days',               'medium', 'in_progress',       8],
      ['parent',  2, 1, 'technical', 'Parent portal slow',                   'App takes long to load timetable',              'low',    'open',              ''],
      ['parent',  8, 2, 'other',     'Lost ID card replacement',             'Student lost ID card, need duplicate',          'medium', 'resolved',          1],
      ['parent',  1, 3, 'fees',      'Late fee waiver request',              'Salary delay caused late payment, request waiver','high', 'closed',            1]
    ];
    var ticketRows = demoTickets.map(function(t, n) {
      var ts = new Date(Date.now() - (demoTickets.length - n) * 14000000).toISOString();
      var code = 'TKT-2026-' + String(n + 1).padStart(8, '0');
      var resolvedAt = (t[7] === 'resolved' || t[7] === 'closed') ? ts : '';
      // SLA-derived DueBy — based on creation timestamp + priority hours
      var slaHrs = helpdeskSlaHours(t[6]);
      var dueBy = new Date(new Date(ts).getTime() + slaHrs * 3600 * 1000).toISOString();
      return [n + 1, code, t[0], t[1], t[2], t[3], t[4], t[5], t[6], t[7], t[8], '', resolvedAt, ts, ts, dueBy];
    });

    // 6p. demo lesson_plans — [teacherId, classId, subjectId, period, startDate, endDate, topic, objectives, methods, resources, assessment, status]
    var demoLessonPlans = [
      [5, 1, 1, 'weekly', '2026-09-09', '2026-09-13', 'Numbers up to 100',                      'Students recognize, read, write 1-100', 'Counting games, worksheets', 'Number charts', 'Oral test',  'completed'],
      [5, 1, 1, 'weekly', '2026-09-16', '2026-09-20', 'Addition single digit',                  'Add numbers up to 9 + 9',                'Demo + practice',           'Math kit',      'Worksheet',  'completed'],
      [6, 1, 2, 'weekly', '2026-09-09', '2026-09-13', 'Alphabet recognition',                   'Identify A-Z in print',                  'Flash cards',                'ABC chart',     'Recitation', 'completed'],
      [7, 3, 9, 'monthly','2026-10-01', '2026-10-31', 'Plants & their parts',                   'Identify root, stem, leaf, flower',      'Field walk + diagram',       'Garden visit',  'Quiz',       'in_progress']
    ];
    var lessonPlanRows = demoLessonPlans.map(function(p, n) {
      var ts = new Date(Date.now() - (demoLessonPlans.length - n) * 11000000).toISOString();
      // first 2 plans approved by supervisor 10, last in_progress = pending review
      var revBy = n < 2 ? 10 : (n === 2 ? 8 : '');
      var revStatus = n < 2 ? 'approved' : (n === 2 ? 'rework' : 'pending');
      return [n + 1, p[0], p[1], p[2], p[3], toIso(p[4]), toIso(p[5]), p[6], p[7], p[8], p[9], p[10], p[11], '0', ts, ts, revBy, revStatus];
    });

    // 6q. demo teaching_logbook — today + yesterday for Class 1A Math by Teacher 1 (id=5)
    // [teacherId, classId, subjectId, logDate, periodNumber, topic, description, homework, homeworkDue, status]
    var dToday = new Date().toISOString();   // full ISO
    var dYesterday = new Date(Date.now() - 86400000).toISOString();
    var dTomorrow = new Date(Date.now() + 86400000).toISOString();
    var demoLogbook = [
      [5, 1, 1, dYesterday, 1, 'Numbers up to 50',  'Counted 1-50 with class', 'Page 12 exercise 1',  dToday,     'completed'],
      [5, 1, 1, dYesterday, 2, 'Number names',      'Wrote one to ten',        '',                    '',         'completed'],
      [5, 1, 1, dToday,     1, 'Number patterns',   'Even and odd intro',      'Worksheet 3',         dTomorrow,  'completed'],
      [6, 1, 2, dToday,     2, 'Phonics: vowels',   'A E I O U sounds',        '',                    '',         'completed'],
      [7, 3, 9, dYesterday, 3, 'Photosynthesis',    'Process diagram',         'Read pg 22-25',       dToday,     'completed']
    ];
    var logbookRows = demoLogbook.map(function(l, n) {
      var ts = new Date(Date.now() - (demoLogbook.length - n) * 8000000).toISOString();
      // Class 1A has 3 students, Class 2A has 3 students — students_present demo varies (some absent)
      var present = l[1] === 1 ? (n % 2 === 0 ? 3 : 2) : 3;
      // ensure LogDate + HomeworkDueDate are full ISO (defensive: dates may already be ISO from above)
      return [n + 1, l[0], l[1], l[2], toIso(l[3]), l[4], l[5], l[6], l[7], l[8] ? toIso(l[8]) : '', l[9], '', ts, ts, present];
    });

    // 6r. demo documents — polymorphic across student/teacher entities
    // [docName, docType, entityType, entityId, fileURL, sizeKB, mime, uploadedBy, isVerified, verifiedBy]
    var demoDocuments = [
      ['Ghana Card copy — Student 1',       'ghana_card',           'student', 1, 'https://example.com/docs/student1-ghana-card.pdf', 245,  'application/pdf', 1, '1', 1],
      ['Birth Certificate — Student 1',  'birth_certificate', 'student', 1, 'https://example.com/docs/student1-bc.pdf',      198,  'application/pdf', 1, '1', 1],
      ['Photo — Student 2',              'photo',             'student', 2, 'https://example.com/docs/student2-photo.jpg',   65,   'image/jpeg',      3, '0', ''],
      ['Marksheet — Student 6',          'marksheet',         'student', 6, 'https://example.com/docs/student6-marksheet.pdf', 320,'application/pdf', 1, '1', 1],
      ['ID Proof — Teacher 1',           'id_proof',          'teacher', 5, 'https://example.com/docs/teacher1-id.pdf',      180,  'application/pdf', 5, '1', 1]
    ];
    var documentRows = demoDocuments.map(function(d, n) {
      var ts = new Date(Date.now() - (demoDocuments.length - n) * 17000000).toISOString();
      // expiry: photo and id_proof get 5-year expiry; ghana_card/birth/marksheet are evergreen
      var hasExpiry = d[1] === 'photo' || d[1] === 'id_proof' || d[1] === 'passport';
      var expiry = hasExpiry ? '2029-12-31' : '';
      var docNum = d[1] === 'ghana_card' ? '999900001234' : (d[1] === 'id_proof' ? 'EMP-' + d[3] + '-001' : '');
      return [n + 1, d[0], d[1], d[2], d[3], d[4], d[5], d[6], d[7], d[8], d[9], '', '0', ts, ts, expiry, docNum];
    });
    var logs = [
      ['admin','System Setup','Demo data initialized'],
      ['admin','Login Success','User logged in'],
      ['admin2','Login Success','User logged in'],
      ['admin','User Added','Added: teacher1 (teacher)'],
      ['admin','User Added','Added: teacher2 (teacher)'],
      ['admin','User Added','Added: clerk1 (clerk)'],
      ['teacher1','Login Success','User logged in'],
      ['teacher1','Profile Updated','Updated own profile'],
      ['admin','User Added','Added: supervisor1 (supervisor)'],
      ['supervisor1','Login Success','User logged in'],
      ['clerk1','Login Success','User logged in'],
      ['admin','User Updated','Updated: teacher4'],
      ['admin','User Updated','Status: clerk3 -> suspended'],
      ['teacher2','Profile Updated','Updated own profile'],
      ['admin','Dashboard Viewed','Viewed dashboard statistics'],
      ['admin','Class Added','Added: Class 1 A (2026-2027)'],
      ['admin','Class Added','Added: Class 2 A (2026-2027)'],
      ['admin','Subject Added','Added: Mathematics (MATH) -> Class 1 A'],
      ['admin','Subject Added','Added: English (ENG) -> Class 1 A'],
      ['admin','Subject Added','Added: Science (SCI) -> Class 2 A'],
      ['admin','Assignment Added','Added: Teacher 1 -> Class 1 A / Mathematics'],
      ['admin','Assignment Added','Added: Teacher 2 -> Class 1 B / English'],
      ['admin','Student Added','Added: 2026-00000001 / Student 1 Demo -> Class 1 A'],
      ['admin','Student Added','Added: 2026-00000002 / Student 2 Demo -> Class 1 A'],
      ['admin','Student Added','Added: 2026-00000004 / Student 4 Demo -> Class 1 B'],
      ['admin','Parent Added','Added: Father 1 (father, 03212000001)'],
      ['admin','Parent Added','Added: Mother 1 (mother, 03453000001)'],
      ['admin','Parent Added','Added: Guardian 9 (guardian, 03114000009)'],
      ['admin','Link Created','Linked: Father 1 -> Student 1 [primary]'],
      ['admin','Link Created','Linked: Father 1 -> Student 3 [primary] (sibling)'],
      ['admin','Link Created','Linked: Mother 1 -> Student 1'],
      ['admin','Exam Added','Added: Unit Test 1 (unit_test) -> Class 1 A'],
      ['admin','Exam Added','Added: Quarterly (quarterly) -> Class 1 A'],
      ['admin','Exam Added','Added: Mid Term (mid_term) -> Class 2 A'],
      ['admin','Exam Published','Published exam id 1'],
      ['admin','Exam Published','Published exam id 2'],
      ['admin','Exam Published','Published exam id 4'],
      ['teacher1','Marks Saved','Exam 1 / Subject 1 (Math, Class 1A): 3 new'],
      ['teacher2','Marks Saved','Exam 1 / Subject 2 (English, Class 1A): 3 new'],
      ['teacher3','Marks Saved','Exam 1 / Subject 3 (Science, Class 1A): 3 new'],
      ['teacher1','Marks Saved','Exam 2 / Subject 1 (Math, Class 1A): 3 new'],
      ['teacher3','Marks Saved','Exam 4 / Subject 9 (Science, Class 2A): 3 new'],
      ['teacher1','Attendance Saved','Class 1A @ today: 3 new'],
      ['teacher1','Attendance Saved','Class 1A @ yesterday: 3 new'],
      ['admin','Fee Added','Added: tuition (monthly) 1500 for Class 1 A'],
      ['admin','Fee Added','Added: admission (one_time) 5000 for Class 1 A'],
      ['admin','Payment Added','Receipt RCP-2026-00000001 (paid): GH₵1500 from student 1'],
      ['clerk1','Payment Added','Receipt RCP-2026-00000003 (paid): GH₵1500 from student 2'],
      ['clerk1','Payment Added','Receipt RCP-2026-00000005 (partial): GH₵1000 from student 3'],
      ['teacher1','Incident Reported','Student 1: uniform_violation (low) — status resolved'],
      ['teacher2','Incident Reported','Student 3: fighting (high) — status resolved'],
      ['supervisor1','Incident Reported','Student 7: cheating (high) — status escalated'],
      ['teacher1','Conduct Added','Student 1 / monthly / Sept 2026 / very_good'],
      ['supervisor1','Conduct Added','Student 1 / term_1 / Term 1 / excellent'],
      ['teacher1','Activity Added','Student 1 / Inter-school 100m sprint (sports/school)'],
      ['teacher3','Activity Added','Student 6 / Science fair project (science/school)'],
      ['parent','Complaint Filed','CMP-2026-00000001 (academic/medium)'],
      ['supervisor1','Complaint Filed','CMP-2026-00000003 (staff/urgent)'],
      ['admin','Notice Posted','Annual Sports Day 2026 (event/all)'],
      ['supervisor1','Notice Posted','Mid Term Exam Schedule (exam/students)'],
      ['parent','Ticket Raised','TKT-2026-00000001 (documents/medium)'],
      ['parent','Ticket Raised','TKT-2026-00000002 (fees/high)'],
      ['teacher1','Lesson Plan Added','Class 1 / Subject 1 / weekly'],
      ['teacher1','Logbook Entry Added','Class 1 / Subject 1 / today'],
      ['admin','Document Uploaded','Ghana Card copy — Student 1 (ghana_card for student#1)'],
      ['clerk1','Login Success','User logged in'],
      ['supervisor1','Login Success','User logged in'],
      ['teacher3','Login Failed','Invalid password attempt']
    ];

    var logRows = logs.map(function(l, j) {
      var lt = new Date(Date.now() - (logs.length - j) * 7200000).toISOString();
      return [lt, l[0], l[1], l[2]];
    });

    // 6. recreate Users sheet — header + batch insert
    var us = ss.insertSheet(USERS_SHEET);
    us.getRange(1, 1, 1, USER_HEADERS.length).setValues([USER_HEADERS])
      .setBackground('#001f3f').setFontColor('white').setFontWeight('bold');
    us.setFrozenRows(1);
    us.getRange(2, 1, userRows.length, USER_HEADERS.length).setValues(userRows);
    us.autoResizeColumns(1, USER_HEADERS.length);

    // 7. recreate Classes sheet
    var cs = ss.insertSheet(CLASSES_SHEET);
    cs.getRange(1, 1, 1, CLASS_HEADERS.length).setValues([CLASS_HEADERS])
      .setBackground('#001f3f').setFontColor('white').setFontWeight('bold');
    cs.setFrozenRows(1);
    cs.getRange(2, 1, classRows.length, CLASS_HEADERS.length).setValues(classRows);
    cs.autoResizeColumns(1, CLASS_HEADERS.length);

    // 7b. recreate Subjects sheet
    var subs = ss.insertSheet(SUBJECTS_SHEET);
    subs.getRange(1, 1, 1, SUBJECT_HEADERS.length).setValues([SUBJECT_HEADERS])
      .setBackground('#001f3f').setFontColor('white').setFontWeight('bold');
    subs.setFrozenRows(1);
    subs.getRange(2, 1, subjectRows.length, SUBJECT_HEADERS.length).setValues(subjectRows);
    subs.autoResizeColumns(1, SUBJECT_HEADERS.length);

    // 7c. recreate Teacher_Assignments sheet
    var asg = ss.insertSheet(ASSIGNMENTS_SHEET);
    asg.getRange(1, 1, 1, ASSIGNMENT_HEADERS.length).setValues([ASSIGNMENT_HEADERS])
      .setBackground('#001f3f').setFontColor('white').setFontWeight('bold');
    asg.setFrozenRows(1);
    asg.getRange(2, 1, assignmentRows.length, ASSIGNMENT_HEADERS.length).setValues(assignmentRows);
    asg.autoResizeColumns(1, ASSIGNMENT_HEADERS.length);

    // 7d. recreate Students sheet
    var sts = ss.insertSheet(STUDENTS_SHEET);
    sts.getRange(1, 1, 1, STUDENT_HEADERS.length).setValues([STUDENT_HEADERS])
      .setBackground('#001f3f').setFontColor('white').setFontWeight('bold');
    sts.setFrozenRows(1);
    sts.getRange(2, 1, studentRows.length, STUDENT_HEADERS.length).setValues(studentRows);
    sts.autoResizeColumns(1, Math.min(STUDENT_HEADERS.length, 15)); // resize first 15 cols only — too many

    // 7e. recreate Parents sheet
    var pts = ss.insertSheet(PARENTS_SHEET);
    pts.getRange(1, 1, 1, PARENT_HEADERS.length).setValues([PARENT_HEADERS])
      .setBackground('#001f3f').setFontColor('white').setFontWeight('bold');
    pts.setFrozenRows(1);
    pts.getRange(2, 1, parentRows.length, PARENT_HEADERS.length).setValues(parentRows);
    pts.autoResizeColumns(1, PARENT_HEADERS.length);

    // 7f. recreate Parent_Students junction sheet
    var psl = ss.insertSheet(PARENT_STUDENTS_SHEET);
    psl.getRange(1, 1, 1, PARENT_STUDENT_HEADERS.length).setValues([PARENT_STUDENT_HEADERS])
      .setBackground('#001f3f').setFontColor('white').setFontWeight('bold');
    psl.setFrozenRows(1);
    psl.getRange(2, 1, linkRows.length, PARENT_STUDENT_HEADERS.length).setValues(linkRows);
    psl.autoResizeColumns(1, PARENT_STUDENT_HEADERS.length);

    // 7g. recreate Exams sheet
    var exs = ss.insertSheet(EXAMS_SHEET);
    exs.getRange(1, 1, 1, EXAM_HEADERS.length).setValues([EXAM_HEADERS])
      .setBackground('#001f3f').setFontColor('white').setFontWeight('bold');
    exs.setFrozenRows(1);
    exs.getRange(2, 1, examRows.length, EXAM_HEADERS.length).setValues(examRows);
    exs.autoResizeColumns(1, EXAM_HEADERS.length);

    // 7h. recreate Marks sheet
    var mks = ss.insertSheet(MARKS_SHEET);
    mks.getRange(1, 1, 1, MARK_HEADERS.length).setValues([MARK_HEADERS])
      .setBackground('#001f3f').setFontColor('white').setFontWeight('bold');
    mks.setFrozenRows(1);
    mks.getRange(2, 1, markRows.length, MARK_HEADERS.length).setValues(markRows);
    mks.autoResizeColumns(1, MARK_HEADERS.length);

    // 7i. recreate Attendance sheet
    var att = ss.insertSheet(ATTENDANCE_SHEET);
    att.getRange(1, 1, 1, ATTENDANCE_HEADERS.length).setValues([ATTENDANCE_HEADERS])
      .setBackground('#001f3f').setFontColor('white').setFontWeight('bold');
    att.setFrozenRows(1);
    att.getRange(2, 1, attRows.length, ATTENDANCE_HEADERS.length).setValues(attRows);
    att.autoResizeColumns(1, ATTENDANCE_HEADERS.length);

    // 7j. recreate Fee_Structure sheet
    var fst = ss.insertSheet(FEE_STRUCTURE_SHEET);
    fst.getRange(1, 1, 1, FEE_STRUCTURE_HEADERS.length).setValues([FEE_STRUCTURE_HEADERS])
      .setBackground('#001f3f').setFontColor('white').setFontWeight('bold');
    fst.setFrozenRows(1);
    fst.getRange(2, 1, feeRows.length, FEE_STRUCTURE_HEADERS.length).setValues(feeRows);
    fst.autoResizeColumns(1, FEE_STRUCTURE_HEADERS.length);

    // 7k. recreate Fee_Payments sheet
    var fpy = ss.insertSheet(FEE_PAYMENTS_SHEET);
    fpy.getRange(1, 1, 1, FEE_PAYMENT_HEADERS.length).setValues([FEE_PAYMENT_HEADERS])
      .setBackground('#001f3f').setFontColor('white').setFontWeight('bold');
    fpy.setFrozenRows(1);
    fpy.getRange(2, 1, paymentRows.length, FEE_PAYMENT_HEADERS.length).setValues(paymentRows);
    fpy.autoResizeColumns(1, FEE_PAYMENT_HEADERS.length);

    // 7l. recreate Discipline sheet
    var dsc = ss.insertSheet(DISCIPLINE_SHEET);
    dsc.getRange(1, 1, 1, DISCIPLINE_HEADERS.length).setValues([DISCIPLINE_HEADERS])
      .setBackground('#001f3f').setFontColor('white').setFontWeight('bold');
    dsc.setFrozenRows(1);
    dsc.getRange(2, 1, disciplineRows.length, DISCIPLINE_HEADERS.length).setValues(disciplineRows);
    dsc.autoResizeColumns(1, DISCIPLINE_HEADERS.length);

    // 7m. recreate Conduct sheet
    var cnd = ss.insertSheet(CONDUCT_SHEET);
    cnd.getRange(1, 1, 1, CONDUCT_HEADERS.length).setValues([CONDUCT_HEADERS])
      .setBackground('#001f3f').setFontColor('white').setFontWeight('bold');
    cnd.setFrozenRows(1);
    cnd.getRange(2, 1, conductRows.length, CONDUCT_HEADERS.length).setValues(conductRows);
    cnd.autoResizeColumns(1, CONDUCT_HEADERS.length);

    // 6s. demo school_periods — 8-period day, P3 + P6 are breaks
    var periodTs = nowIso();
    var demoPeriodsSeed = [
      [1, '08:00', '08:45', '0', 'Period 1'],
      [2, '08:45', '09:30', '0', 'Period 2'],
      [3, '09:30', '09:50', '1', 'Snack Break'],
      [4, '09:50', '10:35', '0', 'Period 3'],
      [5, '10:35', '11:20', '0', 'Period 4'],
      [6, '11:20', '12:00', '1', 'Lunch'],
      [7, '12:00', '12:45', '0', 'Period 5'],
      [8, '12:45', '13:30', '0', 'Period 6']
    ];
    var periodRows = demoPeriodsSeed.map(function(p, idx) {
      return [idx + 1, p[0], p[1], p[2], p[3], p[4], '2026-2027', p[0], '0', periodTs, periodTs, 'regular'];
    });

    // 6t. demo timetable — Mon-Fri × 6 teaching periods × 3 classes (1A/1B/2A)
    // teachers: 5=teacher1(Math), 6=teacher2(English), 7=teacher3(Science)
    // subjects: Class 1A → 1=Math,2=Eng,3=Sci · Class 1B → 4=Math,5=Eng,6=Sci · Class 2A → 7=Math,8=Eng,9=Sci
    var ttDays = ['monday','tuesday','wednesday','thursday','friday'];
    var ttTeachingPeriods = [1,2,4,5,7,8]; // skip break periods (3 + 6)
    var ttPattern1A = [[1,5],[2,6],[3,7],[1,5],[2,6],[3,7]]; // [subjectId, teacherId] per period idx
    var ttPattern1B = [[4,5],[5,6],[6,7],[4,5],[5,6],[6,7]];
    var ttPattern2A = [[7,5],[8,6],[9,7],[7,5],[8,6],[9,7]];
    var ttClasses = [
      [1, 'A-101', ttPattern1A],
      [2, 'A-102', ttPattern1B],
      [3, 'A-201', ttPattern2A]
    ];
    var timetableRows = [];
    var ttId = 1;
    var ttStamp = nowIso();
    ttClasses.forEach(function(cc) {
      var classId = cc[0], room = cc[1], pattern = cc[2];
      ttDays.forEach(function(day, dayIdx) {
        ttTeachingPeriods.forEach(function(periodNum, periodIdx) {
          // small daily rotation so each day has slight variation
          var pIdx = (periodIdx + dayIdx) % pattern.length;
          var pair = pattern[pIdx];
          timetableRows.push([
            ttId++, classId, day, periodNum,
            pair[0], pair[1], room,
            '2026-2027', 'full_year', '',
            '1', '0', ttStamp, 'System', ttStamp, 'System',
            'offline', ''
          ]);
        });
      });
    });

    // 6u. demo calendar — academic year 2026-2027 staples (holidays, exams, sports, ptm, workshop)
    // [eventName, eventDate, endDate, eventType, description, isHoliday, applicableTo, targetClassId, color]
    var demoCalendar = [
      ['Independence Day',     '2026-08-14', '',           'holiday',     'National holiday — school closed',    '1', 'all',            '',  '#ea4335'],
      ['Sports Day Practice',  '2026-09-15', '',           'event',       'Practice session for annual sports',  '0', 'students',       '',  '#fbbc04'],
      ['Class 1A PTM',         '2026-09-30', '',           'ptm',         'Parent-Teacher meeting for Class 1A', '0', 'class_specific', 1,   '#0074D9'],
      ['Diwali Break',         '2026-10-28', '2026-11-03', 'holiday',     'Festival break — school closed',      '1', 'all',            '',  '#ea4335'],
      ['Mid Term Exams',       '2026-11-18', '2026-11-29', 'exam',        'Mid-term examinations',               '0', 'students',       '',  '#34a853'],
      ['Annual Sports Day',    '2026-11-28', '',           'sports',      'Annual sports event',                 '0', 'all',            '',  '#fbbc04'],
      ['Winter Break',         '2026-12-23', '2027-01-05', 'holiday',     'Winter vacation',                     '1', 'all',            '',  '#ea4335'],
      ['Teacher Workshop',     '2027-03-08', '',           'meeting',     'Pedagogy workshop for staff',         '0', 'staff',          '',  '#9b59b6']
    ];
    var calendarRows = demoCalendar.map(function(c, n) {
      var cts = new Date(Date.now() - (demoCalendar.length - n) * 12000000).toISOString();
      // independence day, diwali, winter break = recurring annual events
      var rec = c[3] === 'holiday' ? '1' : '0';
      // cols: id, name, date, end, type, desc, year, isHol, applyTo, classId, color, createdBy, createdAt, updatedAt, isDel, isRecurring
      return [n + 1, c[0], toIso(c[1]), c[2] ? toIso(c[2]) : '', c[3], c[4], '2026-2027', c[5], c[6], c[7], c[8], 1, cts, cts, '0', rec];
    });

    // 6v. demo PTM slots — teacher 5 (Math) tomorrow morning, teacher 6 (English) tomorrow afternoon. Class 1 (1A).
    var ptmTs = nowIso();
    var tomorrow = new Date(Date.now() + 86400000);
    var tomorrowIso = tomorrow.toISOString();
    var tomorrowDate = tomorrowIso.split('T')[0];
    // [TeacherID, Date, Start, End, Duration, ClassID, IsAvailable, MaxBookings, Notes]
    var demoPtmSlots = [
      [5, tomorrowDate, '09:00', '09:15', 15, 1, '1', 1, 'Math review — Class 1A'],
      [5, tomorrowDate, '09:15', '09:30', 15, 1, '1', 1, 'Math review — Class 1A'],
      [6, tomorrowDate, '14:00', '14:20', 20, 1, '1', 1, 'English review — Class 1A'],
      [6, tomorrowDate, '14:20', '14:40', 20, 1, '1', 1, 'English review — Class 1A']
    ];
    var ptmSlotRows = demoPtmSlots.map(function(p, n) {
      // mix in_person + online slots for demo
      var mode = n < 2 ? 'in_person' : 'online';
      var link = mode === 'online' ? 'https://meet.example.com/ptm-' + (n + 1) : '';
      // cols: id, teacherId, date, start, end, duration, classId, year, isAvail, maxBookings, notes, createdBy, createdAt, updatedAt, isDel, mode, meetingLink
      return [n + 1, p[0], toIso(p[1]), p[2], p[3], p[4], p[5], '2026-2027', p[6], p[7], p[8], 1, ptmTs, ptmTs, '0', mode, link];
    });

    // 6w. demo PTM bookings — parent 1 books teacher 5 first slot for student 1 (status='booked')
    // [SlotID, ParentID, StudentID, Status, ParentNotes]
    var demoPtmBookings = [
      [1, 1, 1, 'booked', 'Discuss math progress and homework consistency']
    ];
    var ptmBookingRows = demoPtmBookings.map(function(b, n) {
      // cols: id, slotId, parentId, studentId, status, notes, mins, items, bookedAt, completedAt, createdAt, updatedAt, parentAgenda, parentRating
      return [n + 1, b[0], b[1], b[2], b[3], b[4], 0, '', ptmTs, '', ptmTs, ptmTs,
              'Pre-meeting agenda: math homework patterns + reading speed', ''];
    });

    // 6x. demo Substitutes — teacher 5 absent today (sick), 2 periods reallocated to teacher 6 (status='confirmed')
    var subTs = nowIso();
    var todayIsoForSub = nowIso();
    var demoSubAllocations = [
      { periodNumber: 1, classId: 1, subjectId: 1, substituteTeacherId: 6, status: 'confirmed' },
      { periodNumber: 2, classId: 2, subjectId: 4, substituteTeacherId: 6, status: 'confirmed' }
    ];
    var subRows = [
      // cols: id, absentTeacherId, date, reason, desc, allocations(JSON), allocCount, pendCount, status, createdBy, createdAt, updatedAt, isDel, leaveDocURL
      [1, 5, todayIsoForSub, 'sick', 'Flu symptoms — recovering at home',
       JSON.stringify(demoSubAllocations),
       demoSubAllocations.length,
       0,
       'in_progress',
       1, subTs, subTs, '0',
       'https://example.com/medical-cert-teacher5.pdf']
    ];

    // 6y. demo Assets — laptop, projector, chairs (qty 30 captured in description), microscope, football
    var assetTs = nowIso();
    var thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
    // [AssetTag, AssetName, Category, Description, PurchaseDate, Price, Vendor, Warranty, Location, AssignedTo, Condition, Status, PhotoURL, Notes]
    var demoAssets = [
      ['AST-LAP-001', 'Dell Latitude Laptop',  'computer',         '14-inch teaching laptop',          '2025-04-12', 75000, 'Dell Ghana',          '2026-04-12', 'Room A-101',    5,  'good', 'active', '', 'Issued to Math teacher'],
      ['AST-PRJ-001', 'Epson Projector',       'projector',        'Main hall projector',              '2022-08-20', 60000, 'Epson Distributor',   '2027-08-20', 'Main Hall',     '', 'good', 'active', '', ''],
      ['AST-FRN-001', '30x Classroom Chairs',  'furniture',        'Set of 30 stackable chairs',       '2020-01-05', 45000, 'Local Vendor',        '',           'Class 1A',      '', 'fair', 'active', '', 'Some scuffs on legs'],
      ['AST-LAB-001', 'Compound Microscope',   'lab_equipment',    'Bio lab — student grade',          '2021-06-15', 18000, 'Lab Supplies Co.',    '2026-06-15', 'Science Lab',   '', 'good', 'active', '', ''],
      ['AST-SPT-001', 'Leather Football',      'sports_equipment', 'Senior section sports',            '2026-02-10',  2500, 'Sports Direct',       '',           'Sports Storage','', 'new',  'active', '', '']
    ];
    var assetRows = demoAssets.map(function(a, n) {
      // depreciation: laptops/projectors/electronics 25% straight-line, furniture 10%, sports 50%
      var rates = { computer: 25, projector: 25, lab_equipment: 15, furniture: 10, sports_equipment: 50 };
      var rate = rates[a[2]] || 15;
      // current value = price * (1 - rate * years_owned/100), floored at 0
      var purchaseDate = new Date(a[4]);
      var yearsOwned = Math.max(0, (Date.now() - purchaseDate.getTime()) / (365.25 * 86400000));
      var currentValue = Math.max(0, a[5] * (1 - rate * yearsOwned / 100));
      currentValue = Math.round(currentValue * 100) / 100;
      // cols: id, tag, name, cat, desc, pdate, price, vendor, warranty, location, assigned, cond, status, photo, notes, createdBy, createdAt, updatedAt, isDel, depRate, curVal
      return [n + 1, a[0], a[1], a[2], a[3], toIso(a[4]), a[5], a[6], a[7] ? toIso(a[7]) : '', a[8], a[9], a[10], a[11], a[12], a[13], 1, assetTs, assetTs, '0', rate, currentValue];
    });

    // 6z. demo Asset Maintenance — laptop screen cleaning completed 30 days ago
    var maintRows = [
      // cols: id, assetId, mdate, type, desc, cost, perfBy, ndate, status, receipt, notes, createdBy, createdAt, updatedAt, underWarranty, claimRef
      [1, 1, thirtyDaysAgo, 'cleaning', 'Screen cleaning + thermal paste check', 1500, 'Internal IT', toIso(new Date(Date.now() + 60 * 86400000).toISOString()), 'completed', '', 'Routine cleaning', 1, assetTs, assetTs, '1', 'CLM-DELL-2026-001']
    ];

    // 6aa. demo Stock Items — A4 paper LOW STOCK, pens, markers, chalk, gloves, sanitizer
    var stockTs = nowIso();
    // [ItemCode, ItemName, Category, Unit, CurrentStock, ReorderLevel, ReorderQty, Vendor, UnitCost, Location, Notes]
    var demoStockItems = [
      ['STK-A4-001',  'A4 Printing Paper',     'stationery', 'pack',  5, 50, 100, 'Stationery Direct', 250, 'Stock Room',     'LOW STOCK — reorder!'],
      ['STK-PEN-001', 'Blue Ball Pens',        'stationery', 'pcs', 100, 50, 200, 'Stationery Direct',  10, 'Stock Room',     ''],
      ['STK-MRK-001', 'Whiteboard Markers',    'stationery', 'box',  20, 10,  20, 'Stationery Direct', 800, 'Stock Room',     ''],
      ['STK-CHK-001', 'Chalk White',           'stationery', 'box',  15,  5,  10, 'Stationery Direct', 200, 'Stock Room',     ''],
      ['STK-GLV-001', 'Lab Nitrile Gloves',    'lab',        'box',  12,  6,  12, 'Lab Supplies Co.',  600, 'Science Lab',    ''],
      ['STK-SAN-001', 'Hand Sanitizer 500ml',  'medical',    'pcs',  40, 20,  40, 'Pharma Wholesale',  150, 'Reception Desk', '']
    ];
    var stockItemRows = demoStockItems.map(function(s, n) {
      // sanitizer + gloves get expiry; others none. minStock = 50% of reorder level
      var hasExpiry = s[2] === 'medical' || s[2] === 'lab';
      var expiry = hasExpiry ? '2026-12-31' : '';
      var minStock = Math.floor(s[5] / 2);
      // cols: id, code, name, cat, unit, cur, rl, rq, vendor, uc, loc, notes, createdAt, updatedAt, isDel, expiry, minStock
      return [n + 1, s[0], s[1], s[2], s[3], s[4], s[5], s[6], s[7], s[8], s[9], s[10], stockTs, stockTs, '0', expiry, minStock];
    });

    // 6bb. demo Stock Transactions — paper initial stock-in, paper issue to Class 1A, sanitizer purchase
    var stockTxnRows = [
      // cols: id, itemId, type, qty, reason, issuedTo, ref, notes, perfBy, txnDate, createdAt, approvedBy
      [1, 1, 'in',  100, 'Initial stock load', '',           'PO-2026-001', 'Quarterly purchase', 1, new Date(Date.now() - 10 * 86400000).toISOString(), stockTs, 1],
      [2, 1, 'out',  95, 'Issued to Class 1A', 'Class 1A',   '',            'For exam printing',   1, new Date(Date.now() -  5 * 86400000).toISOString(), stockTs, ''],
      [3, 6, 'in',   40, 'Replenishment',      '',           'PO-2026-002', 'COVID protocol',     1, new Date(Date.now() -  2 * 86400000).toISOString(), stockTs, 1]
    ];

    // 7n1. demo admissions — generic placeholder applicants only (2 registered, 1 admitted, 1 rejected)
    var admTs = nowIso(), admYear = '2026-2027', admYr = new Date().getFullYear();
    // cols: 0=id,1=regNo,2=first,3=mid,4=last,5=gender,6=dob,7=appliedClassId,8=appliedGrade,9=admType,10=prevSchool,11=tcNo,12=lastClass,
    //       13=addr,14=city,15=state,16=pin,17=fName,18=fMob,19=mName,20=mMob,21=gName,22=gRel,23=gMob,24=email,25=mob,
    //       26=year,27=regDate,28=regFee,29=regFeeMode,30=regFeeRcpt,31=status,32=blood,33=religion,34=category,35=medical,
    //       36=admFee,37=admFeeMode,38=admFeeRcpt,39=admConfDate,40=allottedClassId,41=roll,42=admNo,43=admDate,44=entryPt,45=transReq,46=transRoute,
    //       47=linkedStudentId,48=feePaymentId,49=rejReason,50=remarks,51=processedBy,52=isDel,53=createdAt,54=updatedAt
    var admissionRows = [
      [1, 'REG-' + admYr + '-0001', 'Applicant', '', 'One', 'male', '2018-06-12', 1, 1, 'new', '', '', '', 'House 21, Street 4, Demo City', 'Accra', 'Greater Accra', 'GA-183-8541', 'Father One', '0244100001', 'Mother One', '0244100002', '', '', '', 'applicant1@demo.com', '0244100003', admYear, '2026-05-10', 500, 'cash', 'REGF-' + admYr + '-0001', 'registered', 'unknown', '', '', '', 0, '', '', '', '', '', '', '', '', '0', '', '', '', '', 'Walk-in enquiry', 3, '0', admTs, admTs],
      [2, 'REG-' + admYr + '-0002', 'Applicant', 'M', 'Two', 'female', '2017-03-08', 3, 2, 'transfer', 'Demo Public School', 'TC-2026-77', 'Class 1', 'House 22, Street 4, Demo City', 'Accra', 'Greater Accra', 'GA-184-3947', 'Father Two', '0244100011', 'Mother Two', '0244100012', 'Guardian Two', 'uncle', '0244100013', 'applicant2@demo.com', '0244100014', admYear, '2026-05-18', 0, '', '', 'registered', 'unknown', '', '', '', 0, '', '', '', '', '', '', '', '', '0', '', '', '', '', 'Online application', 3, '0', admTs, admTs],
      [3, 'REG-' + admYr + '-0003', 'Applicant', '', 'Three', 'male', '2018-11-20', 1, 1, 'new', '', '', '', 'House 23, Street 4, Demo City', 'Kumasi', 'Ashanti', 'AK-102-5673', 'Father Three', '0244100021', 'Mother Three', '0244100022', '', '', '', 'applicant3@demo.com', '0244100023', admYear, '2026-05-22', 500, 'online', 'REGF-' + admYr + '-0003', 'admitted', 'b+', 'religion-a', 'general', '', 2000, 'cash', 'ADMF-' + admYr + '-0003', '2026-06-01', '', '', '', '', '', '0', '', '', '', '', 'Admission confirmed, awaiting enrollment', 1, '0', admTs, admTs],
      [4, 'REG-' + admYr + '-0004', 'Applicant', '', 'Four', 'female', '2016-09-14', 3, 2, 'new', '', '', '', 'House 24, Street 4, Demo City', 'Accra', 'Greater Accra', 'GA-201-7788', 'Father Four', '0244100031', 'Mother Four', '0244100032', '', '', '', 'applicant4@demo.com', '0244100033', admYear, '2026-05-25', 0, '', '', 'rejected', 'unknown', '', '', '', 0, '', '', '', '', '', '', '', '', '0', '', '', 'Seats full for the requested class', '', '', 3, '0', admTs, admTs]
    ];

    // 7n2. demo account transactions — generic non-fee income & expenses across the last ~10 days
    var acctTs = nowIso();
    var dStr = function(n) { return new Date(Date.now() - n * 86400000).toISOString().split('T')[0]; };
    // cols: id, txnDate, type, cat, desc, amount, mode, refNo, party, recBy, isDel, createdAt, updatedAt
    var accountTxnRows = [
      [1, dStr(9), 'income',  'donation',       'Alumni community donation',          25000, 'online',        'DON-2026-001', 'Alumni Association',   1, '0', acctTs, acctTs],
      [2, dStr(7), 'income',  'rent_received',  'Ground floor hall rent — weekend',   12000, 'bank_transfer', 'RNT-2026-014', 'Local Sports Club',    1, '0', acctTs, acctTs],
      [3, dStr(5), 'income',  'fine',           'Library late-return fines',            850, 'cash',          '',             '',                     3, '0', acctTs, acctTs],
      [4, dStr(4), 'expense', 'salary',         'Support staff salary payout',        48000, 'bank_transfer', 'SAL-2026-006', 'Payroll',              1, '0', acctTs, acctTs],
      [5, dStr(2), 'expense', 'utilities',      'Electricity bill — monthly',         15600, 'online',        'UTL-2026-019', 'City Power Co.',       1, '0', acctTs, acctTs],
      [6, dStr(1), 'expense', 'supplies',       'Classroom stationery restock',        4200, 'cash',          '',             'Stationery Direct',    3, '0', acctTs, acctTs]
    ];

    // 7n. recreate the 9 new sheets in one batch via reusable helper
    var sheetSpec = [
      [ADMISSIONS_SHEET,       ADMISSION_HEADERS,        admissionRows],
      [ACCOUNT_TXN_SHEET,      ACCOUNT_TXN_HEADERS,      accountTxnRows],
      [ACTIVITIES_SHEET,       ACTIVITY_HEADERS,         activityRows],
      [COMPLAINTS_SHEET,       COMPLAINT_HEADERS,        complaintRows],
      [NOTICES_SHEET,          NOTICE_HEADERS,           noticeRows],
      [HELPDESK_SHEET,         HELPDESK_HEADERS,         ticketRows],
      [LESSON_PLANS_SHEET,     LESSON_PLAN_HEADERS,      lessonPlanRows],
      [TEACHING_LOGBOOK_SHEET, TEACHING_LOGBOOK_HEADERS, logbookRows],
      [DOCUMENTS_SHEET,        DOCUMENT_HEADERS,         documentRows],
      [PERIODS_SHEET,          PERIOD_HEADERS,           periodRows],
      [TIMETABLE_SHEET,        TIMETABLE_HEADERS,        timetableRows],
      [CALENDAR_SHEET,         CALENDAR_HEADERS,         calendarRows],
      [PTM_SLOTS_SHEET,        PTM_SLOT_HEADERS,         ptmSlotRows],
      [PTM_BOOKINGS_SHEET,     PTM_BOOKING_HEADERS,      ptmBookingRows],
      [SUBSTITUTES_SHEET,      SUBSTITUTE_HEADERS,       subRows],
      [ASSETS_SHEET,           ASSET_HEADERS,            assetRows],
      [ASSET_MAINTENANCE_SHEET, ASSET_MAINTENANCE_HEADERS, maintRows],
      [STOCK_ITEMS_SHEET,      STOCK_ITEM_HEADERS,       stockItemRows],
      [STOCK_TRANSACTIONS_SHEET, STOCK_TRANSACTION_HEADERS, stockTxnRows],
      [SETTINGS_SHEET,         SETTINGS_HEADERS,         [[
        1,
        'Radiant Oak Academy',
        'Radiant Oak',
        DEFAULT_LOGO,
        'info@radiantoakacademy.edu.gh',
        '0546978214',
        'P.O. Box KD 205, Accra, Kanda',
        'https://radiantoakacademy.edu.gh',
        'Admin User',
        'admin@radiantoakacademy.edu.gh',
        '2026-2027',
        'GH₵',
        'Africa/Accra',
        'Welcome to Radiant Oak Academy\'s school management system.',
        nowIso(),
        nowIso(),
        'monday,tuesday,wednesday,thursday,friday',
        '2026-09-01',
        '2027-07-31',
        '',
        'ROA',
        '', '', '', '', '', '',
        '', '', '18:00',
        '', ''
      ]]]
    ];
    sheetSpec.forEach(function(spec) {
      var newSh = ss.insertSheet(spec[0]);
      newSh.getRange(1, 1, 1, spec[1].length).setValues([spec[1]])
        .setBackground('#001f3f').setFontColor('white').setFontWeight('bold');
      newSh.setFrozenRows(1);
      if (spec[2].length > 0) {
        newSh.getRange(2, 1, spec[2].length, spec[1].length).setValues(spec[2]);
      }
      newSh.autoResizeColumns(1, Math.min(spec[1].length, 12));
    });

    // 7o. backfill Classes.total_strength based on the seeded students (active + non-passed_out)
    var cs2 = cs.getDataRange().getValues();
    for (var ci = 1; ci < cs2.length; ci++) {
      var classId = cs2[ci][0];
      var c2 = 0;
      for (var si = 0; si < demoStudents.length; si++) {
        if (demoStudents[si][0] !== classId) continue;
        var st = demoStudents[si][5];
        if (st === 'transferred' || st === 'passed_out') continue;
        c2++;
      }
      if (c2 > 0) cs.getRange(ci + 1, 6).setValue(c2);
    }

    // 8. recreate Logs sheet
    var ls = ss.insertSheet(LOGS_SHEET);
    var logHeaders = ['Timestamp', 'User', 'Action', 'Details'];
    ls.getRange(1, 1, 1, 4).setValues([logHeaders])
      .setBackground('#001f3f').setFontColor('white').setFontWeight('bold');
    ls.setFrozenRows(1);
    ls.getRange(2, 1, logRows.length, 4).setValues(logRows);
    ls.autoResizeColumns(1, 4);

    // 8a2. generate demo monthly dues for active students — reuses the production generateStudentDues()
    //      logic against the just-seeded Students + Fee_Structure (null currentUser → no log spam)
    var feeDuesGenerated = 0;
    try {
      _ensureFeeDuesSheet();
      var _sdForDues = sts.getDataRange().getValues();
      for (var _di = 1; _di < _sdForDues.length; _di++) {
        if (String(_sdForDues[_di][36]) === '1') continue;                          // is_deleted
        if (String(_sdForDues[_di][35] || '').toLowerCase() !== 'active') continue;  // status
        var _dres = generateStudentDues(_sdForDues[_di][0], null);
        if (_dres && _dres.success) feeDuesGenerated += (_dres.generated || 0);
      }
    } catch (e) { Logger.log('demo dues generation failed: ' + e.toString()); }

    // 8b. pin every date-like column as plain text — blocks Sheets from auto-converting future writes
    try { pinAllDateColumns(); } catch (e) {}

    // 9. focus on Users, drop temp anchor
    SpreadsheetApp.setActiveSheet(us);
    ss.deleteSheet(temp);
    temp = null;

    return {
      success: true,
      message: 'Demo data setup complete',
      summary: {
        totalUsers: demo.length,
        admins: demo.filter(function(u){ return u[5] === 'admin'; }).length,
        clerks: demo.filter(function(u){ return u[5] === 'clerk'; }).length,
        teachers: demo.filter(function(u){ return u[5] === 'teacher'; }).length,
        supervisors: demo.filter(function(u){ return u[5] === 'supervisor'; }).length,
        active: demo.filter(function(u){ return u[12] === 'active'; }).length,
        inactive: demo.filter(function(u){ return u[12] === 'inactive'; }).length,
        suspended: demo.filter(function(u){ return u[12] === 'suspended'; }).length,
        totalClasses: demoClasses.length,
        totalSubjects: demoSubjects.length,
        totalAssignments: demoAssignments.length,
        totalStudents: demoStudents.length,
        activeStudents: demoStudents.filter(function(d){ return d[5] === 'active'; }).length,
        transferredStudents: demoStudents.filter(function(d){ return d[5] === 'transferred'; }).length,
        passedOutStudents: demoStudents.filter(function(d){ return d[5] === 'passed_out'; }).length,
        totalParents: demoParents.length,
        fathers: demoParents.filter(function(p){ return p[4] === 'father'; }).length,
        mothers: demoParents.filter(function(p){ return p[4] === 'mother'; }).length,
        guardians: demoParents.filter(function(p){ return p[4] === 'guardian'; }).length,
        totalLinks: demoLinks.length,
        primaryLinks: demoLinks.filter(function(l){ return l[2] === '1'; }).length,
        totalExams: demoExams.length,
        publishedExams: demoExams.filter(function(x){ return x[7] === '1'; }).length,
        totalMarks: demoMarks.length,
        absentMarks: demoMarks.filter(function(m){ return m[4] === '1'; }).length,
        totalAttendance: attRows.length,
        totalFeeItems: demoFeeStructures.length,
        activeFeeItems: demoFeeStructures.filter(function(f){ return f[7] === '1'; }).length,
        totalPayments: demoPayments.length,
        totalFeeDues: feeDuesGenerated,
        totalIncidents: demoDiscipline.length,
        totalConduct: demoConduct.length,
        totalActivities: demoActivities.length,
        totalComplaints: demoComplaints.length,
        totalNotices: demoNotices.length,
        totalTickets: demoTickets.length,
        totalLessonPlans: demoLessonPlans.length,
        totalLogbook: demoLogbook.length,
        totalDocuments: demoDocuments.length,
        totalPeriods: periodRows.length,
        totalTimetableSlots: timetableRows.length,
        totalCalendarEvents: calendarRows.length,
        totalPtmSlots: ptmSlotRows.length,
        totalPtmBookings: ptmBookingRows.length,
        totalSubstitutes: subRows.length,
        totalAssets: assetRows.length,
        totalAssetMaintenance: maintRows.length,
        totalStockItems: stockItemRows.length,
        totalStockTransactions: stockTxnRows.length,
        totalLogs: logs.length
      }
    };
  } catch (err) {
    // best-effort temp cleanup on failure
    try { if (temp) ss.deleteSheet(temp); } catch (e) {}
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// non-destructive timetable seed — adds periods + sample week for Class 1A/1B/2A
// safe to run multiple times; skips if data already present
function seedTimetableDemo() {
  try {
    initializeSheets(); // ensure sheets exist
    var ay = '2026-2027';

    // 1. seed periods (8 standard, P3 + P6 = breaks)
    var pSh = getSheet(PERIODS_SHEET);
    var pData = pSh.getDataRange().getValues();
    var hasPeriodsThisYear = false;
    for (var i = 1; i < pData.length; i++) {
      if (String(pData[i][8]) === '0' && String(pData[i][6] || '').trim() === ay) { hasPeriodsThisYear = true; break; }
    }

    if (!hasPeriodsThisYear) {
      var ts = nowIso();
      var periods = [
        // [periodNum, start, end, isBreak, label]
        [1, '08:00', '08:45', '0', 'Period 1'],
        [2, '08:45', '09:30', '0', 'Period 2'],
        [3, '09:30', '09:50', '1', 'Snack Break'],
        [4, '09:50', '10:35', '0', 'Period 3'],
        [5, '10:35', '11:20', '0', 'Period 4'],
        [6, '11:20', '12:00', '1', 'Lunch'],
        [7, '12:00', '12:45', '0', 'Period 5'],
        [8, '12:45', '13:30', '0', 'Period 6']
      ];
      var startId = nextRowId(pSh);
      var rows = periods.map(function(p, idx) {
        return [startId + idx, p[0], p[1], p[2], p[3], p[4], ay, p[0], '0', ts, ts, 'regular'];
      });
      pSh.getRange(pSh.getLastRow() + 1, 1, rows.length, PERIOD_HEADERS.length).setValues(rows);
    }

    // 2. seed sample timetable — only if no entries exist for any of the demo classes
    var tSh = getSheet(TIMETABLE_SHEET);
    var tData = tSh.getDataRange().getValues();
    var hasEntries = false;
    for (var j = 1; j < tData.length; j++) {
      if (String(tData[j][11]) === '0' && String(tData[j][7] || '').trim() === ay) { hasEntries = true; break; }
    }

    if (!hasEntries) {
      var ts2 = nowIso();
      // pattern: [classId, day, periodNumber, subjectId, teacherId, room]
      // demo seed uses subject ids matched to classes (1A→1,2,3; 1B→4,5,6; 2A→7,8,9)
      // teachers: 5=teacher1(Math), 6=teacher2(English), 7=teacher3(Science)
      var slots = [];
      var days = ['monday','tuesday','wednesday','thursday','friday'];
      // Class 1A pattern: P1=Math, P2=Eng, P4=Sci, P5=Math, P7=Eng, P8=Sci (varies by day a bit)
      var class1aPattern = {
        monday:    { 1: [1, 5], 2: [2, 6], 4: [3, 7], 5: [1, 5], 7: [2, 6], 8: [3, 7] },
        tuesday:   { 1: [2, 6], 2: [3, 7], 4: [1, 5], 5: [2, 6], 7: [3, 7], 8: [1, 5] },
        wednesday: { 1: [3, 7], 2: [1, 5], 4: [2, 6], 5: [3, 7], 7: [1, 5], 8: [2, 6] },
        thursday:  { 1: [1, 5], 2: [2, 6], 4: [3, 7], 5: [1, 5], 7: [2, 6], 8: [3, 7] },
        friday:    { 1: [2, 6], 2: [1, 5], 4: [3, 7], 5: [2, 6], 7: [3, 7], 8: [1, 5] }
      };
      // Class 1B: subjects 4=Math, 5=Eng, 6=Sci
      var class1bPattern = {
        monday:    { 1: [4, 5], 2: [5, 6], 4: [6, 7], 5: [4, 5], 7: [5, 6], 8: [6, 7] },
        tuesday:   { 1: [5, 6], 2: [6, 7], 4: [4, 5], 5: [5, 6], 7: [6, 7], 8: [4, 5] },
        wednesday: { 1: [6, 7], 2: [4, 5], 4: [5, 6], 5: [6, 7], 7: [4, 5], 8: [5, 6] },
        thursday:  { 1: [4, 5], 2: [5, 6], 4: [6, 7], 5: [4, 5], 7: [5, 6], 8: [6, 7] },
        friday:    { 1: [5, 6], 2: [4, 5], 4: [6, 7], 5: [5, 6], 7: [6, 7], 8: [4, 5] }
      };
      // Class 2A: subjects 7=Math, 8=Eng, 9=Sci
      var class2aPattern = {
        monday:    { 1: [7, 5], 2: [8, 6], 4: [9, 7], 5: [7, 5], 7: [8, 6], 8: [9, 7] },
        tuesday:   { 1: [8, 6], 2: [9, 7], 4: [7, 5], 5: [8, 6], 7: [9, 7], 8: [7, 5] },
        wednesday: { 1: [9, 7], 2: [7, 5], 4: [8, 6], 5: [9, 7], 7: [7, 5], 8: [8, 6] },
        thursday:  { 1: [7, 5], 2: [8, 6], 4: [9, 7], 5: [7, 5], 7: [8, 6], 8: [9, 7] },
        friday:    { 1: [8, 6], 2: [7, 5], 4: [9, 7], 5: [8, 6], 7: [9, 7], 8: [7, 5] }
      };
      var pushClass = function(classId, room, pattern) {
        days.forEach(function(d) {
          var byPeriod = pattern[d];
          Object.keys(byPeriod).forEach(function(pStr) {
            var p = parseInt(pStr, 10);
            var pair = byPeriod[pStr];
            slots.push([classId, d, p, pair[0], pair[1], room]);
          });
        });
      };
      pushClass(1, 'A-101', class1aPattern);
      pushClass(2, 'A-102', class1bPattern);
      pushClass(3, 'A-201', class2aPattern);

      var startId2 = nextRowId(tSh);
      var rows2 = slots.map(function(s, idx) {
        return [startId2 + idx, s[0], s[1], s[2], s[3], s[4], s[5], ay, 'full_year', '', '1', '0', ts2, 'System', ts2, 'System', 'offline', ''];
      });
      tSh.getRange(tSh.getLastRow() + 1, 1, rows2.length, TIMETABLE_HEADERS.length).setValues(rows2);

      addLog('System', 'Timetable Seed', 'Added periods + ' + rows2.length + ' slots for ' + ay);
    }

    return { success: true, message: 'Timetable demo seeded for ' + ay + '. Refresh the page to see it.' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// ============== PTM (Parent-Teacher Meeting) ==============
// RBAC
function canReadPtm(role) {
  var r = String(role || '').toLowerCase();
  return r === 'admin' || r === 'clerk' || r === 'teacher' || r === 'supervisor' || r === 'student' || r === 'parent';
}
function canWritePtmSlot(role) {
  var r = String(role || '').toLowerCase();
  return r === 'admin' || r === 'teacher' || r === 'supervisor';
}
function canBookPtm(role) { return String(role || '').toLowerCase() === 'parent'; }
function canCompletePtm(role) {
  var r = String(role || '').toLowerCase();
  return r === 'admin' || r === 'teacher' || r === 'supervisor';
}

// resolve a parent login (mobile/email) to parent_id
function getParentIdFromLogin(login) {
  if (!login) return null;
  var sh = getSheet(PARENTS_SHEET);
  if (!sh) return null;
  var data = sh.getDataRange().getValues();
  var key = String(login).trim().toLowerCase();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][10]) === '1') continue; // is_del
    var em = String(data[i][2] || '').trim().toLowerCase();
    var mb = String(data[i][3] || '').trim().toLowerCase();
    if (em === key || mb === key) return parseInt(data[i][0], 10);
  }
  return null;
}

// minutes between two HH:MM strings; returns 0 if invalid
function minutesBetween(start, end) {
  if (!isValidHHMM(start) || !isValidHHMM(end)) return 0;
  var s = start.split(':'), e = end.split(':');
  return (parseInt(e[0], 10) * 60 + parseInt(e[1], 10)) - (parseInt(s[0], 10) * 60 + parseInt(s[1], 10));
}

// teacher's own slots overlap on same date — exclusive of excludeId
function ptmSlotOverlap(sh, teacherId, dateIso, startT, endT, excludeId) {
  var data = sh.getDataRange().getValues();
  var dOnly = String(dateIso).split('T')[0];
  var tid = parseInt(teacherId, 10);
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][14]) === '1') continue;
    if (excludeId !== undefined && data[i][0] === excludeId) continue;
    if (parseInt(data[i][1], 10) !== tid) continue;
    if (String(toIso(data[i][2])).split('T')[0] !== dOnly) continue;
    var sx = formatTimeHHMM(data[i][3]), ex = formatTimeHHMM(data[i][4]);
    if (!sx || !ex) continue;
    // overlap if startT < ex && endT > sx
    if (startT < ex && endT > sx) return true;
  }
  return false;
}

// row -> ptm slot obj
function rowToPtmSlot(row, umap, cmap) {
  var tid = parseInt(row[1], 10);
  var cid = parseInt(row[6], 10);
  return {
    ID: row[0],
    TeacherID: tid,
    TeacherName: umap && umap[tid] ? umap[tid].fullName : '',
    Date: toIso(row[2]),
    StartTime: formatTimeHHMM(row[3]),
    EndTime: formatTimeHHMM(row[4]),
    Duration: parseInt(row[5], 10) || 0,
    ClassID: cid || '',
    ClassLabel: cmap && cmap[cid] ? cmap[cid].label : '',
    AcademicYear: formatAcademicYear(row[7]),
    IsAvailable: String(row[8]) === '1',
    MaxBookings: parseInt(row[9], 10) || 1,
    Notes: row[10] || '',
    CreatedBy: row[11] || '',
    CreatedAt: toIso(row[12]),
    UpdatedAt: toIso(row[13]),
    Mode: String(row[15] || 'in_person').toLowerCase(),
    MeetingLink: row[16] || ''
  };
}

// row -> ptm booking obj
function rowToPtmBooking(row, slotsMap, parentsMap, studentsLite, umap, cmap) {
  var slotId = parseInt(row[1], 10);
  var pid = parseInt(row[2], 10);
  var sid = parseInt(row[3], 10);
  var slot = slotsMap && slotsMap[slotId] ? slotsMap[slotId] : null;
  return {
    ID: row[0],
    SlotID: slotId,
    Slot: slot,
    ParentID: pid,
    ParentName: parentsMap && parentsMap[pid] ? parentsMap[pid].fullName : '',
    ParentMobile: parentsMap && parentsMap[pid] ? parentsMap[pid].mobile : '',
    StudentID: sid,
    StudentName: studentsLite && studentsLite[sid] ? studentsLite[sid].fullName : '',
    StudentClassLabel: studentsLite && studentsLite[sid] ? studentsLite[sid].classLabel : '',
    Status: String(row[4] || 'booked').toLowerCase(),
    ParentNotes: row[5] || '',
    TeacherMinutes: parseInt(row[6], 10) || 0,
    ActionItems: row[7] || '',
    BookedAt: toIso(row[8]),
    CompletedAt: toIso(row[9]),
    CreatedAt: toIso(row[10]),
    UpdatedAt: toIso(row[11]),
    ParentAgenda: row[12] || '',
    ParentRating: row[13] === '' || row[13] == null ? '' : (parseInt(row[13], 10) || '')
  };
}

// build slot id -> row map for joins
function getPtmSlotsMap() {
  var sh = getSheet(PTM_SLOTS_SHEET);
  if (!sh) return {};
  var data = sh.getDataRange().getValues();
  var map = {}, umap = getUsersMap(), cmap = getClassesMap();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][14]) === '1') continue;
    map[data[i][0]] = rowToPtmSlot(data[i], umap, cmap);
  }
  return map;
}

// id -> {fullName, mobile, email} parents map
function getParentsLiteMap() {
  var sh = getSheet(PARENTS_SHEET);
  if (!sh) return {};
  var data = sh.getDataRange().getValues(), map = {};
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][10]) === '1') continue;
    map[data[i][0]] = {
      fullName: data[i][1] || '',
      email: data[i][2] || '',
      mobile: data[i][3] || ''
    };
  }
  return map;
}

// count active bookings for a slot (excludes cancelled)
function countSlotBookings(bookingSh, slotId) {
  var data = bookingSh.getDataRange().getValues();
  var sid = parseInt(slotId, 10), c = 0;
  for (var i = 1; i < data.length; i++) {
    if (parseInt(data[i][1], 10) !== sid) continue;
    var st = String(data[i][4] || '').toLowerCase();
    if (st === 'cancelled') continue;
    c++;
  }
  return c;
}

// list slots with optional filters
function getPtmSlots(filters, currentUser, currentRole) {
  try {
    if (!canReadPtm(currentRole)) return { success: false, message: 'Forbidden' };
    var sh = getSheet(PTM_SLOTS_SHEET);
    if (!sh) return { success: true, data: [] };
    var f = filters || {};
    var teacherId = f.teacherId ? parseInt(f.teacherId, 10) : null;
    var date = f.date ? toIso(f.date).split('T')[0] : '';
    var fromD = f.fromDate ? toIso(f.fromDate).split('T')[0] : '';
    var toD = f.toDate ? toIso(f.toDate).split('T')[0] : '';
    var classId = f.classId ? parseInt(f.classId, 10) : null;
    var avail = f.isAvailable !== undefined && f.isAvailable !== null && f.isAvailable !== '' ? (String(f.isAvailable) === '1' || f.isAvailable === true) : null;

    var data = sh.getDataRange().getValues();
    var umap = getUsersMap(), cmap = getClassesMap(), out = [];
    var bookingSh = getSheet(PTM_BOOKINGS_SHEET);

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][14]) === '1') continue;
      if (teacherId && parseInt(data[i][1], 10) !== teacherId) continue;
      var d = toIso(data[i][2]).split('T')[0];
      if (date && d !== date) continue;
      if (fromD && d < fromD) continue;
      if (toD && d > toD) continue;
      if (classId && parseInt(data[i][6], 10) !== classId) continue;
      var isAv = String(data[i][8]) === '1';
      if (avail !== null && isAv !== avail) continue;
      var slot = rowToPtmSlot(data[i], umap, cmap);
      slot.BookingCount = bookingSh ? countSlotBookings(bookingSh, slot.ID) : 0;
      out.push(slot);
    }
    out.sort(function(a, b) {
      if (a.Date !== b.Date) return String(a.Date).localeCompare(String(b.Date));
      return String(a.StartTime).localeCompare(String(b.StartTime));
    });
    return { success: true, data: out };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

// my slots — teacher: own; parent: available slots matching their child's class
function getMyPtmSlots(currentUser, currentRole) {
  try {
    if (!canReadPtm(currentRole)) return { success: false, message: 'Forbidden' };
    var role = String(currentRole).toLowerCase();
    var sh = getSheet(PTM_SLOTS_SHEET);
    if (!sh) return { success: true, data: [] };
    var data = sh.getDataRange().getValues();
    var umap = getUsersMap(), cmap = getClassesMap(), out = [];
    var bookingSh = getSheet(PTM_BOOKINGS_SHEET);

    if (role === 'teacher') {
      var tid = getCurrentUserId(currentUser);
      if (!tid) return { success: true, data: [] };
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][14]) === '1') continue;
        if (parseInt(data[i][1], 10) !== tid) continue;
        var slot = rowToPtmSlot(data[i], umap, cmap);
        slot.BookingCount = bookingSh ? countSlotBookings(bookingSh, slot.ID) : 0;
        out.push(slot);
      }
    } else if (role === 'parent') {
      var pid = getParentIdFromLogin(currentUser);
      if (!pid) return { success: true, data: [] };
      // child class IDs
      var psh = getSheet(PARENT_STUDENTS_SHEET);
      var stsh = getSheet(STUDENTS_SHEET);
      var classIds = {}, studentIds = {};
      if (psh && stsh) {
        var pdata = psh.getDataRange().getValues();
        var sdata = stsh.getDataRange().getValues();
        for (var p = 1; p < pdata.length; p++) {
          if (parseInt(pdata[p][1], 10) === pid) studentIds[parseInt(pdata[p][2], 10)] = true;
        }
        for (var s = 1; s < sdata.length; s++) {
          if (String(sdata[s][36]) === '1') continue;
          if (studentIds[parseInt(sdata[s][0], 10)]) classIds[parseInt(sdata[s][25], 10)] = true;
        }
      }
      // bookings already done by this parent (slot id -> studentId)
      var myBooked = {};
      if (bookingSh) {
        var bdata = bookingSh.getDataRange().getValues();
        for (var b = 1; b < bdata.length; b++) {
          if (parseInt(bdata[b][2], 10) !== pid) continue;
          var st2 = String(bdata[b][4] || '').toLowerCase();
          if (st2 === 'cancelled') continue;
          myBooked[parseInt(bdata[b][1], 10)] = parseInt(bdata[b][3], 10);
        }
      }
      for (var j = 1; j < data.length; j++) {
        if (String(data[j][14]) === '1') continue;
        if (String(data[j][8]) !== '1') continue; // available only
        var sCid = parseInt(data[j][6], 10);
        if (!classIds[sCid]) continue;
        var sl = rowToPtmSlot(data[j], umap, cmap);
        sl.BookingCount = bookingSh ? countSlotBookings(bookingSh, sl.ID) : 0;
        sl.BookedByMe = myBooked[sl.ID] ? true : false;
        sl.MyBookedStudentID = myBooked[sl.ID] || null;
        out.push(sl);
      }
    } else {
      // admin/supervisor: all
      for (var k = 1; k < data.length; k++) {
        if (String(data[k][14]) === '1') continue;
        var slk = rowToPtmSlot(data[k], umap, cmap);
        slk.BookingCount = bookingSh ? countSlotBookings(bookingSh, slk.ID) : 0;
        out.push(slk);
      }
    }
    out.sort(function(a, b) {
      if (a.Date !== b.Date) return String(a.Date).localeCompare(String(b.Date));
      return String(a.StartTime).localeCompare(String(b.StartTime));
    });
    return { success: true, data: out };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

// validate ptm slot payload
function validatePtmSlotPayload(d) {
  if (!d || typeof d !== 'object') return { ok: false, message: 'Invalid payload' };
  var tid = parseInt(d.TeacherID, 10);
  if (isNaN(tid)) return { ok: false, message: 'TeacherID required' };
  var dt = toIso(d.Date);
  if (!dt) return { ok: false, message: 'Valid Date required' };
  var st = formatTimeHHMM(d.StartTime), et = formatTimeHHMM(d.EndTime);
  if (!isValidHHMM(st)) return { ok: false, message: 'StartTime must be HH:MM' };
  if (!isValidHHMM(et)) return { ok: false, message: 'EndTime must be HH:MM' };
  if (st >= et) return { ok: false, message: 'EndTime must be after StartTime' };
  var dur = minutesBetween(st, et);
  var ay = formatAcademicYear(d.AcademicYear);
  if (!validAcademicYear(ay)) return { ok: false, message: 'AcademicYear must be YYYY-YYYY' };
  var cid = d.ClassID === '' || d.ClassID === null || d.ClassID === undefined ? '' : parseInt(d.ClassID, 10);
  if (cid !== '' && isNaN(cid)) return { ok: false, message: 'ClassID invalid' };
  var maxB = d.MaxBookings != null && d.MaxBookings !== '' ? parseInt(d.MaxBookings, 10) : 1;
  if (isNaN(maxB) || maxB < 1) maxB = 1;
  var avail = (d.IsAvailable === false || String(d.IsAvailable) === '0') ? '0' : '1';
  var allowedModes = ['in_person','online','hybrid'];
  var mode = String(d.Mode || 'in_person').toLowerCase();
  if (allowedModes.indexOf(mode) === -1) mode = 'in_person';
  var meetingLink = String(d.MeetingLink || '').trim();
  if (meetingLink.length > 500) return { ok: false, message: 'MeetingLink max 500 chars' };
  return { ok: true, vals: { teacherId: tid, date: dt, startT: st, endT: et, duration: dur, classId: cid, year: ay, isAvail: avail, maxB: maxB, notes: String(d.Notes || ''), mode: mode, meetingLink: meetingLink } };
}

function addPtmSlot(d, currentUser, currentRole) {
  try {
    if (!canWritePtmSlot(currentRole)) return { success: false, message: 'Forbidden' };
    var v = validatePtmSlotPayload(d);
    if (!v.ok) return { success: false, message: v.message };
    var role = String(currentRole).toLowerCase();
    // teacher can only create own slots
    if (role === 'teacher') {
      var myId = getCurrentUserId(currentUser);
      if (myId !== v.vals.teacherId) return { success: false, message: 'Teachers can only create own slots' };
    }
    var sh = getSheet(PTM_SLOTS_SHEET);
    if (!sh) return { success: false, message: 'PTM_Slots sheet not found' };
    if (ptmSlotOverlap(sh, v.vals.teacherId, v.vals.date, v.vals.startT, v.vals.endT)) {
      return { success: false, message: 'Slot overlaps with existing slot for this teacher on the same date' };
    }
    var ts = nowIso(), id = nextRowId(sh);
    var uid = getCurrentUserId(currentUser) || '';
    var newRow = sh.getLastRow() + 1;
    sh.getRange(newRow, 3, 1, 3).setNumberFormat('@'); // pin date+times
    sh.appendRow([id, v.vals.teacherId, v.vals.date, v.vals.startT, v.vals.endT, v.vals.duration, v.vals.classId, v.vals.year, v.vals.isAvail, v.vals.maxB, v.vals.notes, uid, ts, ts, '0', v.vals.mode, v.vals.meetingLink]);
    sh.getRange(newRow, 3).setNumberFormat('@').setValue(v.vals.date);
    sh.getRange(newRow, 4).setNumberFormat('@').setValue(v.vals.startT);
    sh.getRange(newRow, 5).setNumberFormat('@').setValue(v.vals.endT);
    sh.getRange(newRow, 8).setNumberFormat('@').setValue(v.vals.year);
    addLog(currentUser, 'PTM Slot Added', '#' + id + ' teacher ' + v.vals.teacherId + ' / ' + v.vals.date.split('T')[0] + ' ' + v.vals.startT);
    return { success: true, message: 'Slot added', id: id };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

function updatePtmSlot(id, d, currentUser, currentRole) {
  try {
    if (!canWritePtmSlot(currentRole)) return { success: false, message: 'Forbidden' };
    var v = validatePtmSlotPayload(d);
    if (!v.ok) return { success: false, message: v.message };
    var sh = getSheet(PTM_SLOTS_SHEET);
    if (!sh) return { success: false, message: 'PTM_Slots sheet not found' };
    var idn = parseInt(id, 10);
    if (isNaN(idn)) return { success: false, message: 'Invalid id' };
    var data = sh.getDataRange().getValues(), idx = -1;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === idn && String(data[i][14]) === '0') { idx = i; break; }
    }
    if (idx === -1) return { success: false, message: 'Slot not found' };
    var role = String(currentRole).toLowerCase();
    if (role === 'teacher') {
      var myId = getCurrentUserId(currentUser);
      if (parseInt(data[idx][1], 10) !== myId) return { success: false, message: 'Teachers can only edit own slots' };
    }
    if (ptmSlotOverlap(sh, v.vals.teacherId, v.vals.date, v.vals.startT, v.vals.endT, idn)) {
      return { success: false, message: 'Slot overlaps with another slot for this teacher on the same date' };
    }
    // can't disable IsAvailable if already booked
    var bookingSh = getSheet(PTM_BOOKINGS_SHEET);
    if (v.vals.isAvail === '0' && bookingSh && countSlotBookings(bookingSh, idn) > 0) {
      return { success: false, message: 'Cannot disable IsAvailable — slot already has bookings' };
    }
    var r = idx + 1;
    sh.getRange(r, 3, 1, 3).setNumberFormat('@');
    sh.getRange(r, 2).setValue(v.vals.teacherId);
    sh.getRange(r, 3).setNumberFormat('@').setValue(v.vals.date);
    sh.getRange(r, 4).setNumberFormat('@').setValue(v.vals.startT);
    sh.getRange(r, 5).setNumberFormat('@').setValue(v.vals.endT);
    sh.getRange(r, 6).setValue(v.vals.duration);
    sh.getRange(r, 7).setValue(v.vals.classId);
    sh.getRange(r, 8).setNumberFormat('@').setValue(v.vals.year);
    sh.getRange(r, 9).setValue(v.vals.isAvail);
    sh.getRange(r, 10).setValue(v.vals.maxB);
    sh.getRange(r, 11).setValue(v.vals.notes);
    sh.getRange(r, 14).setValue(nowIso());
    sh.getRange(r, 16).setValue(v.vals.mode);
    sh.getRange(r, 17).setValue(v.vals.meetingLink);
    addLog(currentUser, 'PTM Slot Updated', '#' + idn);
    return { success: true, message: 'Slot updated' };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

function deletePtmSlot(id, currentUser, currentRole) {
  try {
    if (!canWritePtmSlot(currentRole)) return { success: false, message: 'Forbidden' };
    var sh = getSheet(PTM_SLOTS_SHEET);
    if (!sh) return { success: false, message: 'PTM_Slots sheet not found' };
    var idn = parseInt(id, 10);
    if (isNaN(idn)) return { success: false, message: 'Invalid id' };
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === idn && String(data[i][14]) === '0') {
        var role = String(currentRole).toLowerCase();
        if (role === 'teacher') {
          var myId = getCurrentUserId(currentUser);
          if (parseInt(data[i][1], 10) !== myId) return { success: false, message: 'Teachers can only delete own slots' };
        }
        sh.getRange(i + 1, 15).setValue('1');
        sh.getRange(i + 1, 14).setValue(nowIso());
        // cancel related bookings
        var bsh = getSheet(PTM_BOOKINGS_SHEET);
        if (bsh) {
          var bdata = bsh.getDataRange().getValues();
          for (var b = 1; b < bdata.length; b++) {
            if (parseInt(bdata[b][1], 10) === idn) {
              var st = String(bdata[b][4] || '').toLowerCase();
              if (st !== 'cancelled' && st !== 'completed') {
                bsh.getRange(b + 1, 5).setValue('cancelled');
                bsh.getRange(b + 1, 12).setValue(nowIso());
              }
            }
          }
        }
        addLog(currentUser, 'PTM Slot Deleted', '#' + idn);
        return { success: true, message: 'Slot deleted' };
      }
    }
    return { success: false, message: 'Slot not found' };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

function bookPtmSlot(slotId, studentId, parentNotes, currentUser, currentRole) {
  try {
    if (!canBookPtm(currentRole)) return { success: false, message: 'Forbidden — parents only' };
    var sId = parseInt(slotId, 10), stId = parseInt(studentId, 10);
    if (isNaN(sId) || isNaN(stId)) return { success: false, message: 'Invalid slotId or studentId' };
    var pid = getParentIdFromLogin(currentUser);
    if (!pid) return { success: false, message: 'Parent record not found' };
    // verify parent-student link
    var psh = getSheet(PARENT_STUDENTS_SHEET);
    if (!psh) return { success: false, message: 'Parent_Students sheet missing' };
    var pdata = psh.getDataRange().getValues(), linked = false;
    for (var i = 1; i < pdata.length; i++) {
      if (parseInt(pdata[i][1], 10) === pid && parseInt(pdata[i][2], 10) === stId) { linked = true; break; }
    }
    if (!linked) return { success: false, message: 'Student not linked to this parent' };
    // slot lookup
    var ssh = getSheet(PTM_SLOTS_SHEET);
    if (!ssh) return { success: false, message: 'PTM_Slots sheet missing' };
    var sdata = ssh.getDataRange().getValues(), slotRow = null;
    for (var s = 1; s < sdata.length; s++) {
      if (sdata[s][0] === sId && String(sdata[s][14]) === '0') { slotRow = sdata[s]; break; }
    }
    if (!slotRow) return { success: false, message: 'Slot not found' };
    if (String(slotRow[8]) !== '1') return { success: false, message: 'Slot is unavailable' };
    var maxB = parseInt(slotRow[9], 10) || 1;
    var bsh = getSheet(PTM_BOOKINGS_SHEET);
    if (!bsh) return { success: false, message: 'PTM_Bookings sheet missing' };
    var current = countSlotBookings(bsh, sId);
    if (current >= maxB) return { success: false, message: 'Slot is fully booked' };
    // dup check — same parent+student already booked this slot (active)
    var bdata = bsh.getDataRange().getValues();
    for (var b = 1; b < bdata.length; b++) {
      if (parseInt(bdata[b][1], 10) !== sId) continue;
      if (parseInt(bdata[b][3], 10) !== stId) continue;
      var st = String(bdata[b][4] || '').toLowerCase();
      if (st !== 'cancelled') return { success: false, message: 'You already booked this slot for this student' };
    }
    var ts = nowIso(), bid = nextRowId(bsh);
    bsh.appendRow([bid, sId, pid, stId, 'booked', String(parentNotes || ''), 0, '', ts, '', ts, ts, '', '']);
    addLog(currentUser, 'PTM Booked', 'Slot #' + sId + ' Student #' + stId);
    return { success: true, message: 'Slot booked', id: bid };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

function cancelPtmBooking(bookingId, currentUser, currentRole) {
  try {
    var role = String(currentRole).toLowerCase();
    var bsh = getSheet(PTM_BOOKINGS_SHEET);
    if (!bsh) return { success: false, message: 'PTM_Bookings sheet missing' };
    var idn = parseInt(bookingId, 10);
    if (isNaN(idn)) return { success: false, message: 'Invalid bookingId' };
    var data = bsh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] !== idn) continue;
      var status = String(data[i][4] || '').toLowerCase();
      if (status === 'cancelled') return { success: false, message: 'Already cancelled' };
      if (status === 'completed') return { success: false, message: 'Cannot cancel a completed booking' };
      // role checks
      if (role === 'parent') {
        var pid = getParentIdFromLogin(currentUser);
        if (parseInt(data[i][2], 10) !== pid) return { success: false, message: 'You can only cancel your own bookings' };
      } else if (role !== 'admin' && role !== 'teacher' && role !== 'supervisor') {
        return { success: false, message: 'Forbidden' };
      }
      bsh.getRange(i + 1, 5).setValue('cancelled');
      bsh.getRange(i + 1, 12).setValue(nowIso());
      addLog(currentUser, 'PTM Booking Cancelled', '#' + idn);
      return { success: true, message: 'Booking cancelled' };
    }
    return { success: false, message: 'Booking not found' };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

function completePtmBooking(bookingId, teacherMinutes, actionItems, currentUser, currentRole) {
  try {
    if (!canCompletePtm(currentRole)) return { success: false, message: 'Forbidden' };
    var bsh = getSheet(PTM_BOOKINGS_SHEET);
    if (!bsh) return { success: false, message: 'PTM_Bookings sheet missing' };
    var idn = parseInt(bookingId, 10);
    if (isNaN(idn)) return { success: false, message: 'Invalid bookingId' };
    var data = bsh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] !== idn) continue;
      var role = String(currentRole).toLowerCase();
      // teacher can only complete bookings on their own slot
      if (role === 'teacher') {
        var ssh = getSheet(PTM_SLOTS_SHEET);
        if (!ssh) return { success: false, message: 'PTM_Slots sheet missing' };
        var sdata = ssh.getDataRange().getValues(), tId = null;
        for (var s = 1; s < sdata.length; s++) {
          if (sdata[s][0] === parseInt(data[i][1], 10)) { tId = parseInt(sdata[s][1], 10); break; }
        }
        var myId = getCurrentUserId(currentUser);
        if (tId !== myId) return { success: false, message: 'You are not the slot teacher' };
      }
      var mins = parseInt(teacherMinutes, 10);
      if (isNaN(mins) || mins < 0) mins = 0;
      var ts = nowIso();
      bsh.getRange(i + 1, 5).setValue('completed');
      bsh.getRange(i + 1, 7).setValue(mins);
      bsh.getRange(i + 1, 8).setValue(String(actionItems || ''));
      bsh.getRange(i + 1, 10).setValue(ts);
      bsh.getRange(i + 1, 12).setValue(ts);
      addLog(currentUser, 'PTM Booking Completed', '#' + idn);
      return { success: true, message: 'Booking marked complete' };
    }
    return { success: false, message: 'Booking not found' };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

function getMyPtmBookings(currentUser, currentRole) {
  try {
    if (!canReadPtm(currentRole)) return { success: false, message: 'Forbidden' };
    var bsh = getSheet(PTM_BOOKINGS_SHEET);
    if (!bsh) return { success: true, data: [] };
    var data = bsh.getDataRange().getValues();
    var role = String(currentRole).toLowerCase();
    var slotsMap = getPtmSlotsMap();
    var pmap = getParentsLiteMap();
    var stuLite = getStudentsLite();
    var umap = getUsersMap(), cmap = getClassesMap();
    var out = [];

    if (role === 'parent') {
      var pid = getParentIdFromLogin(currentUser);
      if (!pid) return { success: true, data: [] };
      for (var i = 1; i < data.length; i++) {
        if (parseInt(data[i][2], 10) !== pid) continue;
        out.push(rowToPtmBooking(data[i], slotsMap, pmap, stuLite, umap, cmap));
      }
    } else if (role === 'teacher') {
      var myId = getCurrentUserId(currentUser);
      for (var j = 1; j < data.length; j++) {
        var slotId = parseInt(data[j][1], 10);
        if (!slotsMap[slotId]) continue;
        if (slotsMap[slotId].TeacherID !== myId) continue;
        out.push(rowToPtmBooking(data[j], slotsMap, pmap, stuLite, umap, cmap));
      }
    } else {
      // admin/supervisor/clerk: all
      for (var k = 1; k < data.length; k++) {
        out.push(rowToPtmBooking(data[k], slotsMap, pmap, stuLite, umap, cmap));
      }
    }
    out.sort(function(a, b) { return String(b.BookedAt).localeCompare(String(a.BookedAt)); });
    return { success: true, data: out };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

// ============== Substitutes ==============
// RBAC
function canReadSubstitutes(role) {
  var r = String(role || '').toLowerCase();
  return r === 'admin' || r === 'clerk' || r === 'teacher' || r === 'supervisor';
}
function canWriteSubstitutes(role) {
  var r = String(role || '').toLowerCase();
  return r === 'admin' || r === 'supervisor';
}

var SUB_REASONS = ['sick','personal','training','emergency','other'];
var SUB_STATUSES = ['pending','in_progress','completed'];
var SUB_ALLOC_STATUSES = ['pending','confirmed','missed'];

// safe-parse JSON allocations; returns array
function parseSubAllocations(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    var v = JSON.parse(String(raw));
    return Array.isArray(v) ? v : [];
  } catch (e) { return []; }
}

// row -> substitute obj (joined)
function rowToSubstitute(row, umap, cmap, smap) {
  var atid = parseInt(row[1], 10);
  var allocs = parseSubAllocations(row[5]);
  var enriched = allocs.map(function(a) {
    var stid = parseInt(a.substituteTeacherId, 10);
    var cid = parseInt(a.classId, 10);
    var sbid = parseInt(a.subjectId, 10);
    return {
      periodNumber: parseInt(a.periodNumber, 10) || 0,
      classId: cid,
      classLabel: cmap && cmap[cid] ? cmap[cid].label : '',
      subjectId: sbid,
      subjectName: smap && smap[sbid] ? smap[sbid].subjectName : '',
      substituteTeacherId: stid,
      substituteTeacherName: umap && umap[stid] ? umap[stid].fullName : '',
      status: String(a.status || 'pending').toLowerCase()
    };
  });
  return {
    ID: row[0],
    AbsentTeacherID: atid,
    AbsentTeacherName: umap && umap[atid] ? umap[atid].fullName : '',
    Date: toIso(row[2]),
    Reason: String(row[3] || '').toLowerCase(),
    Description: row[4] || '',
    Allocations: enriched,
    AllocatedCount: parseInt(row[6], 10) || enriched.length,
    PendingCount: parseInt(row[7], 10) || 0,
    Status: String(row[8] || 'pending').toLowerCase(),
    CreatedBy: row[9] || '',
    CreatedAt: toIso(row[10]),
    UpdatedAt: toIso(row[11]),
    LeaveDocumentURL: row[13] || ''
  };
}

// (absentTeacherId, dateOnly) duplicate check
function substituteExists(sh, absentTeacherId, dateOnly, excludeId) {
  var data = sh.getDataRange().getValues();
  var aid = parseInt(absentTeacherId, 10);
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][12]) === '1') continue;
    if (excludeId !== undefined && data[i][0] === excludeId) continue;
    if (parseInt(data[i][1], 10) === aid && toIso(data[i][2]).split('T')[0] === dateOnly) return data[i][0];
  }
  return null;
}

// validate allocations array against absent teacher's timetable + sub-teacher conflicts
function validateSubAllocations(allocations, absentTeacherId, dateOnly) {
  if (!Array.isArray(allocations) || !allocations.length) return { ok: false, message: 'At least one allocation required' };
  var aid = parseInt(absentTeacherId, 10);
  // map dateOnly -> dayOfWeek
  var d = new Date(dateOnly + 'T00:00:00.000Z');
  if (isNaN(d.getTime())) return { ok: false, message: 'Invalid date' };
  var dayName = DAY_LIST[d.getUTCDay()];
  var ttSh = getSheet(TIMETABLE_SHEET);
  var ttData = ttSh ? ttSh.getDataRange().getValues() : [];
  // build keys: absent teacher's teaching slots that day → (period -> {classId, subjectId})
  var absentMap = {}, subOccupancyMap = {};
  for (var i = 1; i < ttData.length; i++) {
    if (String(ttData[i][11]) === '1') continue;
    if (String(ttData[i][2] || '').toLowerCase() !== dayName) continue;
    var teacherIdRow = parseInt(ttData[i][5], 10);
    var pn = parseInt(ttData[i][3], 10);
    if (teacherIdRow === aid) {
      absentMap[pn] = { classId: parseInt(ttData[i][1], 10), subjectId: parseInt(ttData[i][4], 10) };
    }
    if (!subOccupancyMap[teacherIdRow]) subOccupancyMap[teacherIdRow] = {};
    subOccupancyMap[teacherIdRow][pn] = true;
  }

  for (var k = 0; k < allocations.length; k++) {
    var a = allocations[k];
    var pn = parseInt(a.periodNumber, 10);
    var cid = parseInt(a.classId, 10);
    var sbid = parseInt(a.subjectId, 10);
    var stid = parseInt(a.substituteTeacherId, 10);
    if (isNaN(pn) || isNaN(cid) || isNaN(sbid) || isNaN(stid)) return { ok: false, message: 'Allocation #' + (k + 1) + ': invalid IDs' };
    if (stid === aid) return { ok: false, message: 'Allocation #' + (k + 1) + ': substitute cannot be the absent teacher' };
    // verify period belongs to absent teacher
    if (!absentMap[pn]) return { ok: false, message: 'Allocation #' + (k + 1) + ': period ' + pn + ' is not assigned to the absent teacher on ' + dayName };
    if (absentMap[pn].classId !== cid || absentMap[pn].subjectId !== sbid) return { ok: false, message: 'Allocation #' + (k + 1) + ': class/subject does not match absent teacher\'s timetable for period ' + pn };
    // sub teacher conflict
    if (subOccupancyMap[stid] && subOccupancyMap[stid][pn]) return { ok: false, message: 'Allocation #' + (k + 1) + ': substitute teacher has a conflicting slot at period ' + pn };
    // alloc.status check
    var stt = String(a.status || 'pending').toLowerCase();
    if (SUB_ALLOC_STATUSES.indexOf(stt) === -1) return { ok: false, message: 'Allocation #' + (k + 1) + ': invalid status' };
  }
  return { ok: true };
}

function getSubstitutes(filters, currentUser, currentRole) {
  try {
    if (!canReadSubstitutes(currentRole)) return { success: false, message: 'Forbidden' };
    var sh = getSheet(SUBSTITUTES_SHEET);
    if (!sh) return { success: true, data: [] };
    var f = filters || {};
    var date = f.date ? toIso(f.date).split('T')[0] : '';
    var fromD = f.fromDate ? toIso(f.fromDate).split('T')[0] : '';
    var toD = f.toDate ? toIso(f.toDate).split('T')[0] : '';
    var atid = f.absentTeacherId ? parseInt(f.absentTeacherId, 10) : null;
    var stid = f.substituteTeacherId ? parseInt(f.substituteTeacherId, 10) : null;

    var data = sh.getDataRange().getValues();
    var umap = getUsersMap(), cmap = getClassesMap(), smap = getSubjectsMap(), out = [];
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][12]) === '1') continue;
      if (atid && parseInt(data[i][1], 10) !== atid) continue;
      var d = toIso(data[i][2]).split('T')[0];
      if (date && d !== date) continue;
      if (fromD && d < fromD) continue;
      if (toD && d > toD) continue;
      if (stid) {
        var allocs = parseSubAllocations(data[i][5]);
        var match = false;
        for (var a = 0; a < allocs.length; a++) {
          if (parseInt(allocs[a].substituteTeacherId, 10) === stid) { match = true; break; }
        }
        if (!match) continue;
      }
      out.push(rowToSubstitute(data[i], umap, cmap, smap));
    }
    out.sort(function(a, b) { return String(b.Date).localeCompare(String(a.Date)); });
    return { success: true, data: out };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

function getMySubstituteAssignments(currentUser, currentRole) {
  try {
    if (!canReadSubstitutes(currentRole)) return { success: false, message: 'Forbidden' };
    var role = String(currentRole).toLowerCase();
    if (role !== 'teacher') return { success: true, data: [] };
    var myId = getCurrentUserId(currentUser);
    if (!myId) return { success: true, data: [] };
    var sh = getSheet(SUBSTITUTES_SHEET);
    if (!sh) return { success: true, data: [] };
    var data = sh.getDataRange().getValues();
    var umap = getUsersMap(), cmap = getClassesMap(), smap = getSubjectsMap(), out = [];
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][12]) === '1') continue;
      var allocs = parseSubAllocations(data[i][5]);
      allocs.forEach(function(a) {
        if (parseInt(a.substituteTeacherId, 10) !== myId) return;
        var cid = parseInt(a.classId, 10);
        var sbid = parseInt(a.subjectId, 10);
        var atid = parseInt(data[i][1], 10);
        out.push({
          SubstituteID: data[i][0],
          Date: toIso(data[i][2]),
          PeriodNumber: parseInt(a.periodNumber, 10) || 0,
          ClassID: cid,
          ClassLabel: cmap[cid] ? cmap[cid].label : '',
          SubjectID: sbid,
          SubjectName: smap[sbid] ? smap[sbid].subjectName : '',
          OriginalTeacherID: atid,
          OriginalTeacherName: umap[atid] ? umap[atid].fullName : '',
          Status: String(a.status || 'pending').toLowerCase(),
          Reason: String(data[i][3] || '').toLowerCase(),
          Description: data[i][4] || ''
        });
      });
    }
    out.sort(function(a, b) {
      if (a.Date !== b.Date) return String(b.Date).localeCompare(String(a.Date));
      return a.PeriodNumber - b.PeriodNumber;
    });
    return { success: true, data: out };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

function addSubstitute(d, currentUser, currentRole) {
  try {
    if (!canWriteSubstitutes(currentRole)) return { success: false, message: 'Forbidden — admin/supervisor only' };
    if (!d || typeof d !== 'object') return { success: false, message: 'Invalid payload' };
    var aid = parseInt(d.absentTeacherId, 10);
    if (isNaN(aid)) return { success: false, message: 'absentTeacherId required' };
    var dt = toIso(d.date);
    if (!dt) return { success: false, message: 'Valid date required' };
    var dOnly = dt.split('T')[0];
    var reason = String(d.reason || 'sick').toLowerCase();
    if (SUB_REASONS.indexOf(reason) === -1) return { success: false, message: 'Invalid reason' };
    var allocs = Array.isArray(d.allocations) ? d.allocations : [];
    var v = validateSubAllocations(allocs, aid, dOnly);
    if (!v.ok) return { success: false, message: v.message };
    var sh = getSheet(SUBSTITUTES_SHEET);
    if (!sh) return { success: false, message: 'Substitutes sheet not found' };
    if (substituteExists(sh, aid, dOnly)) return { success: false, message: 'Substitute already exists for this teacher on this date' };
    var allocClean = allocs.map(function(a) {
      return {
        periodNumber: parseInt(a.periodNumber, 10),
        classId: parseInt(a.classId, 10),
        subjectId: parseInt(a.subjectId, 10),
        substituteTeacherId: parseInt(a.substituteTeacherId, 10),
        status: String(a.status || 'pending').toLowerCase()
      };
    });
    var allocCount = allocClean.length;
    var pendCount = allocClean.filter(function(a){ return a.status === 'pending'; }).length;
    var overall = pendCount === 0 ? 'completed' : (pendCount === allocCount ? 'pending' : 'in_progress');
    var ts = nowIso(), id = nextRowId(sh);
    var uid = getCurrentUserId(currentUser) || '';
    var newRow = sh.getLastRow() + 1;
    sh.getRange(newRow, 3).setNumberFormat('@');
    var leaveDoc = String(d.leaveDocumentURL || d.LeaveDocumentURL || '').trim();
    if (leaveDoc.length > 500) return { success: false, message: 'LeaveDocumentURL max 500 chars' };
    sh.appendRow([id, aid, dt, reason, String(d.description || ''), JSON.stringify(allocClean), allocCount, pendCount, overall, uid, ts, ts, '0', leaveDoc]);
    sh.getRange(newRow, 3).setNumberFormat('@').setValue(dt);
    addLog(currentUser, 'Substitute Added', '#' + id + ' teacher ' + aid + ' / ' + dOnly + ' (' + allocCount + ' allocations)');
    return { success: true, message: 'Substitute added', id: id };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

function updateSubstitute(id, d, currentUser, currentRole) {
  try {
    if (!canWriteSubstitutes(currentRole)) return { success: false, message: 'Forbidden — admin/supervisor only' };
    var sh = getSheet(SUBSTITUTES_SHEET);
    if (!sh) return { success: false, message: 'Substitutes sheet not found' };
    var idn = parseInt(id, 10);
    if (isNaN(idn)) return { success: false, message: 'Invalid id' };
    var aid = parseInt(d.absentTeacherId, 10);
    if (isNaN(aid)) return { success: false, message: 'absentTeacherId required' };
    var dt = toIso(d.date);
    if (!dt) return { success: false, message: 'Valid date required' };
    var dOnly = dt.split('T')[0];
    var reason = String(d.reason || 'sick').toLowerCase();
    if (SUB_REASONS.indexOf(reason) === -1) return { success: false, message: 'Invalid reason' };
    var allocs = Array.isArray(d.allocations) ? d.allocations : [];
    var v = validateSubAllocations(allocs, aid, dOnly);
    if (!v.ok) return { success: false, message: v.message };
    var data = sh.getDataRange().getValues(), idx = -1;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === idn && String(data[i][12]) === '0') { idx = i; break; }
    }
    if (idx === -1) return { success: false, message: 'Substitute not found' };
    if (substituteExists(sh, aid, dOnly, idn)) return { success: false, message: 'Another substitute exists for this teacher on this date' };
    var allocClean = allocs.map(function(a) {
      return {
        periodNumber: parseInt(a.periodNumber, 10),
        classId: parseInt(a.classId, 10),
        subjectId: parseInt(a.subjectId, 10),
        substituteTeacherId: parseInt(a.substituteTeacherId, 10),
        status: String(a.status || 'pending').toLowerCase()
      };
    });
    var allocCount = allocClean.length;
    var pendCount = allocClean.filter(function(a){ return a.status === 'pending'; }).length;
    var overall = pendCount === 0 ? 'completed' : (pendCount === allocCount ? 'pending' : 'in_progress');
    var r = idx + 1;
    sh.getRange(r, 3).setNumberFormat('@');
    sh.getRange(r, 2).setValue(aid);
    sh.getRange(r, 3).setNumberFormat('@').setValue(dt);
    sh.getRange(r, 4).setValue(reason);
    sh.getRange(r, 5).setValue(String(d.description || ''));
    sh.getRange(r, 6).setValue(JSON.stringify(allocClean));
    sh.getRange(r, 7).setValue(allocCount);
    sh.getRange(r, 8).setValue(pendCount);
    sh.getRange(r, 9).setValue(overall);
    sh.getRange(r, 12).setValue(nowIso());
    var leaveDoc2 = String(d.leaveDocumentURL || d.LeaveDocumentURL || '').trim();
    if (leaveDoc2.length > 500) return { success: false, message: 'LeaveDocumentURL max 500 chars' };
    sh.getRange(r, 14).setValue(leaveDoc2);
    addLog(currentUser, 'Substitute Updated', '#' + idn);
    return { success: true, message: 'Substitute updated' };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

function deleteSubstitute(id, currentUser, currentRole) {
  try {
    if (!canWriteSubstitutes(currentRole)) return { success: false, message: 'Forbidden — admin/supervisor only' };
    var sh = getSheet(SUBSTITUTES_SHEET);
    if (!sh) return { success: false, message: 'Substitutes sheet not found' };
    var idn = parseInt(id, 10);
    if (isNaN(idn)) return { success: false, message: 'Invalid id' };
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === idn && String(data[i][12]) === '0') {
        sh.getRange(i + 1, 13).setValue('1');
        sh.getRange(i + 1, 12).setValue(nowIso());
        addLog(currentUser, 'Substitute Deleted', '#' + idn);
        return { success: true, message: 'Substitute deleted' };
      }
    }
    return { success: false, message: 'Substitute not found' };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

// helper for substitute UI: that day's periods for the absent teacher
function getTeacherTimetableForDate(teacherId, dateStr, currentUser, currentRole) {
  try {
    if (!canReadSubstitutes(currentRole)) return { success: false, message: 'Forbidden' };
    var tid = parseInt(teacherId, 10);
    if (isNaN(tid)) return { success: false, message: 'Invalid teacherId' };
    var dt = toIso(dateStr);
    if (!dt) return { success: false, message: 'Invalid date' };
    var d = new Date(dt.split('T')[0] + 'T00:00:00.000Z');
    if (isNaN(d.getTime())) return { success: false, message: 'Invalid date' };
    var dayName = DAY_LIST[d.getUTCDay()];
    var ttSh = getSheet(TIMETABLE_SHEET);
    if (!ttSh) return { success: true, data: [] };
    var ttData = ttSh.getDataRange().getValues();
    var cmap = getClassesMap(), smap = getSubjectsMap(), out = [];
    for (var i = 1; i < ttData.length; i++) {
      if (String(ttData[i][11]) === '1') continue;
      if (parseInt(ttData[i][5], 10) !== tid) continue;
      if (String(ttData[i][2] || '').toLowerCase() !== dayName) continue;
      var cid = parseInt(ttData[i][1], 10);
      var sbid = parseInt(ttData[i][4], 10);
      out.push({
        TimetableID: ttData[i][0],
        DayOfWeek: dayName,
        PeriodNumber: parseInt(ttData[i][3], 10) || 0,
        ClassID: cid,
        ClassLabel: cmap[cid] ? cmap[cid].label : '',
        SubjectID: sbid,
        SubjectName: smap[sbid] ? smap[sbid].subjectName : '',
        RoomNumber: ttData[i][6] || ''
      });
    }
    out.sort(function(a, b) { return a.PeriodNumber - b.PeriodNumber; });
    return { success: true, data: out };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

// teachers free at (date, periodNumber) — meaning no Timetable entry for that day+period
function getAvailableTeachersForSlot(date, periodNumber, classId, currentUser, currentRole) {
  try {
    if (!canReadSubstitutes(currentRole)) return { success: false, message: 'Forbidden' };
    var dt = toIso(date);
    if (!dt) return { success: false, message: 'Invalid date' };
    var d = new Date(dt.split('T')[0] + 'T00:00:00.000Z');
    if (isNaN(d.getTime())) return { success: false, message: 'Invalid date' };
    var dayName = DAY_LIST[d.getUTCDay()];
    var pn = parseInt(periodNumber, 10);
    if (isNaN(pn)) return { success: false, message: 'Invalid periodNumber' };
    var ttSh = getSheet(TIMETABLE_SHEET);
    var occupied = {};
    if (ttSh) {
      var ttData = ttSh.getDataRange().getValues();
      for (var i = 1; i < ttData.length; i++) {
        if (String(ttData[i][11]) === '1') continue;
        if (String(ttData[i][2] || '').toLowerCase() !== dayName) continue;
        if (parseInt(ttData[i][3], 10) !== pn) continue;
        var t = parseInt(ttData[i][5], 10);
        if (t) occupied[t] = true;
      }
    }
    var ush = getSheet(USERS_SHEET);
    if (!ush) return { success: true, data: [] };
    var udata = ush.getDataRange().getValues(), out = [];
    for (var j = 1; j < udata.length; j++) {
      if (String(udata[j][16]) === '1') continue;
      var role = String(udata[j][6] || '').toLowerCase();
      if (role !== 'teacher') continue;
      if (String(udata[j][14] || '').toLowerCase() !== 'active') continue;
      var uid = parseInt(udata[j][0], 10);
      if (occupied[uid]) continue;
      out.push({ ID: uid, FullName: udata[j][2] || udata[j][1], Specialization: udata[j][10] || '' });
    }
    return { success: true, data: out };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

// ============== Assets ==============
// RBAC
function canReadAssets(role) {
  var r = String(role || '').toLowerCase();
  return r === 'admin' || r === 'clerk' || r === 'teacher' || r === 'supervisor';
}
function canWriteAssets(role) { return String(role || '').toLowerCase() === 'admin'; }
function canMaintainAsset(role) {
  var r = String(role || '').toLowerCase();
  return r === 'admin' || r === 'clerk';
}

var ASSET_CATEGORIES = ['computer','projector','furniture','lab_equipment','sports_equipment','av_equipment','office_equipment','other'];
var ASSET_CONDITIONS = ['new','good','fair','poor','damaged','discarded'];
var ASSET_STATUSES = ['active','maintenance','discarded','lost'];
var MAINT_TYPES = ['repair','cleaning','upgrade','inspection','replacement'];
var MAINT_STATUSES = ['completed','pending','cancelled'];

function rowToAsset(row, umap) {
  var assignedId = row[10] === '' || row[10] === null ? '' : parseInt(row[10], 10);
  return {
    ID: row[0],
    AssetTag: row[1] || '',
    AssetName: row[2] || '',
    Category: String(row[3] || '').toLowerCase(),
    Description: row[4] || '',
    PurchaseDate: toIso(row[5]),
    PurchasePrice: parseFloat(row[6]) || 0,
    Vendor: row[7] || '',
    Warranty: toIso(row[8]),
    Location: row[9] || '',
    AssignedTo: assignedId,
    AssignedToName: assignedId && umap && umap[assignedId] ? umap[assignedId].fullName : '',
    Condition: String(row[11] || '').toLowerCase(),
    Status: String(row[12] || '').toLowerCase(),
    PhotoURL: row[13] || '',
    Notes: row[14] || '',
    CreatedBy: row[15] || '',
    CreatedAt: toIso(row[16]),
    UpdatedAt: toIso(row[17]),
    DepreciationRate: parseFloat(row[19]) || 0,
    CurrentValue: row[20] === '' || row[20] == null ? (parseFloat(row[6]) || 0) : (parseFloat(row[20]) || 0)
  };
}

function assetTagExists(sh, tag, excludeId) {
  if (!tag) return false;
  var data = sh.getDataRange().getValues();
  var t = String(tag).trim().toLowerCase();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][18]) === '1') continue;
    if (excludeId !== undefined && data[i][0] === excludeId) continue;
    if (String(data[i][1] || '').trim().toLowerCase() === t) return true;
  }
  return false;
}

function validateAssetPayload(d) {
  if (!d || typeof d !== 'object') return { ok: false, message: 'Invalid payload' };
  var tag = String(d.AssetTag || '').trim();
  if (!tag) return { ok: false, message: 'AssetTag required' };
  var name = String(d.AssetName || '').trim();
  if (!name) return { ok: false, message: 'AssetName required' };
  var cat = String(d.Category || 'other').toLowerCase();
  if (ASSET_CATEGORIES.indexOf(cat) === -1) return { ok: false, message: 'Invalid Category' };
  var cond = String(d.Condition || 'good').toLowerCase();
  if (ASSET_CONDITIONS.indexOf(cond) === -1) return { ok: false, message: 'Invalid Condition' };
  var status = String(d.Status || 'active').toLowerCase();
  if (ASSET_STATUSES.indexOf(status) === -1) return { ok: false, message: 'Invalid Status' };
  var pdate = d.PurchaseDate ? toIso(d.PurchaseDate) : '';
  var warranty = d.Warranty ? toIso(d.Warranty) : '';
  var price = d.PurchasePrice != null && d.PurchasePrice !== '' ? parseFloat(d.PurchasePrice) : 0;
  if (isNaN(price) || price < 0) price = 0;
  var assigned = d.AssignedTo === '' || d.AssignedTo === null || d.AssignedTo === undefined ? '' : parseInt(d.AssignedTo, 10);
  if (assigned !== '' && isNaN(assigned)) return { ok: false, message: 'AssignedTo invalid' };
  var depRate = d.DepreciationRate != null && d.DepreciationRate !== '' ? parseFloat(d.DepreciationRate) : 0;
  if (isNaN(depRate) || depRate < 0) depRate = 0;
  if (depRate > 100) return { ok: false, message: 'DepreciationRate must be 0..100' };
  var curVal = d.CurrentValue != null && d.CurrentValue !== '' ? parseFloat(d.CurrentValue) : price;
  if (isNaN(curVal) || curVal < 0) curVal = price;

  return {
    ok: true,
    vals: {
      tag: tag, name: name, cat: cat, desc: String(d.Description || ''),
      pdate: pdate, price: price, vendor: String(d.Vendor || ''), warranty: warranty,
      location: String(d.Location || ''), assigned: assigned, cond: cond, status: status,
      photo: String(d.PhotoURL || ''), notes: String(d.Notes || ''),
      depRate: depRate, curVal: curVal
    }
  };
}

function getAllAssets(filters, currentUser, currentRole) {
  try {
    if (!canReadAssets(currentRole)) return { success: false, message: 'Forbidden' };
    var sh = getSheet(ASSETS_SHEET);
    if (!sh) return { success: true, data: [] };
    var f = filters || {};
    var cat = f.category ? String(f.category).toLowerCase() : '';
    var status = f.status ? String(f.status).toLowerCase() : '';
    var cond = f.condition ? String(f.condition).toLowerCase() : '';
    var loc = f.location ? String(f.location).toLowerCase() : '';
    var assigned = f.assignedTo ? parseInt(f.assignedTo, 10) : null;
    var data = sh.getDataRange().getValues();
    var umap = getUsersMap(), out = [];
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][18]) === '1') continue;
      if (cat && String(data[i][3] || '').toLowerCase() !== cat) continue;
      if (status && String(data[i][12] || '').toLowerCase() !== status) continue;
      if (cond && String(data[i][11] || '').toLowerCase() !== cond) continue;
      if (loc && String(data[i][9] || '').toLowerCase().indexOf(loc) === -1) continue;
      if (assigned && parseInt(data[i][10], 10) !== assigned) continue;
      out.push(rowToAsset(data[i], umap));
    }
    out.sort(function(a, b) { return String(a.AssetTag).localeCompare(String(b.AssetTag)); });
    return { success: true, data: out };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

function addAsset(d, currentUser, currentRole) {
  try {
    if (!canWriteAssets(currentRole)) return { success: false, message: 'Forbidden — admin only' };
    var v = validateAssetPayload(d);
    if (!v.ok) return { success: false, message: v.message };
    var sh = getSheet(ASSETS_SHEET);
    if (!sh) return { success: false, message: 'Assets sheet not found' };
    if (assetTagExists(sh, v.vals.tag)) return { success: false, message: 'AssetTag must be unique' };
    var ts = nowIso(), id = nextRowId(sh);
    var uid = getCurrentUserId(currentUser) || '';
    var newRow = sh.getLastRow() + 1;
    sh.getRange(newRow, 6).setNumberFormat('@'); // pdate
    sh.getRange(newRow, 9).setNumberFormat('@'); // warranty
    sh.appendRow([id, v.vals.tag, v.vals.name, v.vals.cat, v.vals.desc, v.vals.pdate, v.vals.price, v.vals.vendor, v.vals.warranty, v.vals.location, v.vals.assigned, v.vals.cond, v.vals.status, v.vals.photo, v.vals.notes, uid, ts, ts, '0', v.vals.depRate, v.vals.curVal]);
    sh.getRange(newRow, 6).setNumberFormat('@').setValue(v.vals.pdate);
    sh.getRange(newRow, 9).setNumberFormat('@').setValue(v.vals.warranty);
    addLog(currentUser, 'Asset Added', '#' + id + ' ' + v.vals.tag + ' / ' + v.vals.name);
    return { success: true, message: 'Asset added', id: id };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

function updateAsset(id, d, currentUser, currentRole) {
  try {
    if (!canWriteAssets(currentRole)) return { success: false, message: 'Forbidden — admin only' };
    var v = validateAssetPayload(d);
    if (!v.ok) return { success: false, message: v.message };
    var sh = getSheet(ASSETS_SHEET);
    if (!sh) return { success: false, message: 'Assets sheet not found' };
    var idn = parseInt(id, 10);
    if (isNaN(idn)) return { success: false, message: 'Invalid id' };
    var data = sh.getDataRange().getValues(), idx = -1;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === idn && String(data[i][18]) === '0') { idx = i; break; }
    }
    if (idx === -1) return { success: false, message: 'Asset not found' };
    if (assetTagExists(sh, v.vals.tag, idn)) return { success: false, message: 'AssetTag must be unique' };
    var r = idx + 1;
    sh.getRange(r, 6).setNumberFormat('@');
    sh.getRange(r, 9).setNumberFormat('@');
    sh.getRange(r, 2).setValue(v.vals.tag);
    sh.getRange(r, 3).setValue(v.vals.name);
    sh.getRange(r, 4).setValue(v.vals.cat);
    sh.getRange(r, 5).setValue(v.vals.desc);
    sh.getRange(r, 6).setNumberFormat('@').setValue(v.vals.pdate);
    sh.getRange(r, 7).setValue(v.vals.price);
    sh.getRange(r, 8).setValue(v.vals.vendor);
    sh.getRange(r, 9).setNumberFormat('@').setValue(v.vals.warranty);
    sh.getRange(r, 10).setValue(v.vals.location);
    sh.getRange(r, 11).setValue(v.vals.assigned);
    sh.getRange(r, 12).setValue(v.vals.cond);
    sh.getRange(r, 13).setValue(v.vals.status);
    sh.getRange(r, 14).setValue(v.vals.photo);
    sh.getRange(r, 15).setValue(v.vals.notes);
    sh.getRange(r, 18).setValue(nowIso());
    sh.getRange(r, 20).setValue(v.vals.depRate);
    sh.getRange(r, 21).setValue(v.vals.curVal);
    addLog(currentUser, 'Asset Updated', '#' + idn);
    return { success: true, message: 'Asset updated' };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

function deleteAsset(id, currentUser, currentRole) {
  try {
    if (!canWriteAssets(currentRole)) return { success: false, message: 'Forbidden — admin only' };
    var sh = getSheet(ASSETS_SHEET);
    if (!sh) return { success: false, message: 'Assets sheet not found' };
    var idn = parseInt(id, 10);
    if (isNaN(idn)) return { success: false, message: 'Invalid id' };
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === idn && String(data[i][18]) === '0') {
        sh.getRange(i + 1, 19).setValue('1');
        sh.getRange(i + 1, 18).setValue(nowIso());
        addLog(currentUser, 'Asset Deleted', '#' + idn);
        return { success: true, message: 'Asset deleted' };
      }
    }
    return { success: false, message: 'Asset not found' };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

function rowToMaintenance(row, umap) {
  var perfId = parseInt(row[6], 10);
  return {
    ID: row[0],
    AssetID: parseInt(row[1], 10),
    MaintenanceDate: toIso(row[2]),
    Type: String(row[3] || '').toLowerCase(),
    Description: row[4] || '',
    Cost: parseFloat(row[5]) || 0,
    PerformedBy: perfId || row[6] || '',
    PerformedByName: perfId && umap && umap[perfId] ? umap[perfId].fullName : (row[6] || ''),
    NextDueDate: toIso(row[7]),
    Status: String(row[8] || '').toLowerCase(),
    ReceiptURL: row[9] || '',
    Notes: row[10] || '',
    CreatedBy: row[11] || '',
    CreatedAt: toIso(row[12]),
    UpdatedAt: toIso(row[13]),
    UnderWarranty: String(row[14]) === '1' || row[14] === 1 || row[14] === true,
    WarrantyClaimRef: row[15] || ''
  };
}

function validateMaintenancePayload(d) {
  if (!d || typeof d !== 'object') return { ok: false, message: 'Invalid payload' };
  var mdate = toIso(d.MaintenanceDate);
  if (!mdate) return { ok: false, message: 'MaintenanceDate required' };
  var type = String(d.Type || 'repair').toLowerCase();
  if (MAINT_TYPES.indexOf(type) === -1) return { ok: false, message: 'Invalid Type' };
  var status = String(d.Status || 'completed').toLowerCase();
  if (MAINT_STATUSES.indexOf(status) === -1) return { ok: false, message: 'Invalid Status' };
  var cost = d.Cost != null && d.Cost !== '' ? parseFloat(d.Cost) : 0;
  if (isNaN(cost) || cost < 0) cost = 0;
  var ndate = d.NextDueDate ? toIso(d.NextDueDate) : '';
  var underWarranty = (d.UnderWarranty === true || String(d.UnderWarranty) === '1' || String(d.UnderWarranty).toLowerCase() === 'true') ? '1' : '0';
  var claimRef = String(d.WarrantyClaimRef || '').trim();
  if (claimRef.length > 100) return { ok: false, message: 'WarrantyClaimRef max 100 chars' };
  return { ok: true, vals: {
    mdate: mdate, type: type, desc: String(d.Description || ''), cost: cost,
    perfBy: String(d.PerformedBy || ''), ndate: ndate, status: status,
    receipt: String(d.ReceiptURL || ''), notes: String(d.Notes || ''),
    underWarranty: underWarranty, claimRef: claimRef
  }};
}

function getAssetMaintenanceHistory(assetId, currentUser, currentRole) {
  try {
    if (!canReadAssets(currentRole)) return { success: false, message: 'Forbidden' };
    var sh = getSheet(ASSET_MAINTENANCE_SHEET);
    if (!sh) return { success: true, data: [] };
    var aid = parseInt(assetId, 10);
    if (isNaN(aid)) return { success: false, message: 'Invalid assetId' };
    var data = sh.getDataRange().getValues();
    var umap = getUsersMap(), out = [];
    for (var i = 1; i < data.length; i++) {
      if (parseInt(data[i][1], 10) !== aid) continue;
      out.push(rowToMaintenance(data[i], umap));
    }
    out.sort(function(a, b) { return String(b.MaintenanceDate).localeCompare(String(a.MaintenanceDate)); });
    return { success: true, data: out };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

function addMaintenanceRecord(assetId, d, currentUser, currentRole) {
  try {
    if (!canMaintainAsset(currentRole)) return { success: false, message: 'Forbidden — admin/clerk only' };
    var aid = parseInt(assetId, 10);
    if (isNaN(aid)) return { success: false, message: 'Invalid assetId' };
    var ash = getSheet(ASSETS_SHEET);
    if (!ash) return { success: false, message: 'Assets sheet not found' };
    var adata = ash.getDataRange().getValues(), found = false;
    for (var i = 1; i < adata.length; i++) {
      if (adata[i][0] === aid && String(adata[i][18]) === '0') { found = true; break; }
    }
    if (!found) return { success: false, message: 'Asset not found' };
    var v = validateMaintenancePayload(d);
    if (!v.ok) return { success: false, message: v.message };
    var sh = getSheet(ASSET_MAINTENANCE_SHEET);
    if (!sh) return { success: false, message: 'Asset_Maintenance sheet not found' };
    var ts = nowIso(), id = nextRowId(sh);
    var uid = getCurrentUserId(currentUser) || '';
    var newRow = sh.getLastRow() + 1;
    sh.getRange(newRow, 3).setNumberFormat('@');
    sh.getRange(newRow, 8).setNumberFormat('@');
    sh.appendRow([id, aid, v.vals.mdate, v.vals.type, v.vals.desc, v.vals.cost, v.vals.perfBy, v.vals.ndate, v.vals.status, v.vals.receipt, v.vals.notes, uid, ts, ts, v.vals.underWarranty, v.vals.claimRef]);
    sh.getRange(newRow, 3).setNumberFormat('@').setValue(v.vals.mdate);
    sh.getRange(newRow, 8).setNumberFormat('@').setValue(v.vals.ndate);
    addLog(currentUser, 'Asset Maintenance Added', 'Asset #' + aid + ' record #' + id);
    return { success: true, message: 'Maintenance record added', id: id };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

function updateMaintenanceRecord(id, d, currentUser, currentRole) {
  try {
    if (!canMaintainAsset(currentRole)) return { success: false, message: 'Forbidden — admin/clerk only' };
    var v = validateMaintenancePayload(d);
    if (!v.ok) return { success: false, message: v.message };
    var sh = getSheet(ASSET_MAINTENANCE_SHEET);
    if (!sh) return { success: false, message: 'Asset_Maintenance sheet not found' };
    var idn = parseInt(id, 10);
    if (isNaN(idn)) return { success: false, message: 'Invalid id' };
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === idn) {
        var r = i + 1;
        sh.getRange(r, 3).setNumberFormat('@');
        sh.getRange(r, 8).setNumberFormat('@');
        sh.getRange(r, 3).setNumberFormat('@').setValue(v.vals.mdate);
        sh.getRange(r, 4).setValue(v.vals.type);
        sh.getRange(r, 5).setValue(v.vals.desc);
        sh.getRange(r, 6).setValue(v.vals.cost);
        sh.getRange(r, 7).setValue(v.vals.perfBy);
        sh.getRange(r, 8).setNumberFormat('@').setValue(v.vals.ndate);
        sh.getRange(r, 9).setValue(v.vals.status);
        sh.getRange(r, 10).setValue(v.vals.receipt);
        sh.getRange(r, 11).setValue(v.vals.notes);
        sh.getRange(r, 14).setValue(nowIso());
        sh.getRange(r, 15).setValue(v.vals.underWarranty);
        sh.getRange(r, 16).setValue(v.vals.claimRef);
        addLog(currentUser, 'Asset Maintenance Updated', '#' + idn);
        return { success: true, message: 'Maintenance record updated' };
      }
    }
    return { success: false, message: 'Maintenance record not found' };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

function deleteMaintenanceRecord(id, currentUser, currentRole) {
  try {
    if (!canMaintainAsset(currentRole)) return { success: false, message: 'Forbidden — admin/clerk only' };
    var sh = getSheet(ASSET_MAINTENANCE_SHEET);
    if (!sh) return { success: false, message: 'Asset_Maintenance sheet not found' };
    var idn = parseInt(id, 10);
    if (isNaN(idn)) return { success: false, message: 'Invalid id' };
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === idn) {
        // hard delete (no IsDeleted column on this sheet)
        sh.deleteRow(i + 1);
        addLog(currentUser, 'Asset Maintenance Deleted', '#' + idn);
        return { success: true, message: 'Maintenance record deleted' };
      }
    }
    return { success: false, message: 'Maintenance record not found' };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

// ============== Stock / Inventory ==============
// RBAC
function canReadStock(role) {
  var r = String(role || '').toLowerCase();
  // supervisor = read-only (ops oversight); write/issue stays admin/clerk
  return r === 'admin' || r === 'clerk' || r === 'teacher' || r === 'supervisor';
}
function canWriteStock(role) {
  var r = String(role || '').toLowerCase();
  return r === 'admin' || r === 'clerk';
}
function canIssueStock(role) {
  var r = String(role || '').toLowerCase();
  return r === 'admin' || r === 'clerk';
}

var STOCK_CATEGORIES = ['stationery','cleaning','kitchen','lab','medical','sports','other'];
var STOCK_UNITS = ['pcs','box','pack','liter','kg','meter','dozen'];
var STOCK_TXN_TYPES = ['in','out','adjustment'];

function rowToStockItem(row) {
  return {
    ID: row[0],
    ItemCode: row[1] || '',
    ItemName: row[2] || '',
    Category: String(row[3] || '').toLowerCase(),
    Unit: String(row[4] || '').toLowerCase(),
    CurrentStock: parseFloat(row[5]) || 0,
    ReorderLevel: parseFloat(row[6]) || 0,
    ReorderQuantity: parseFloat(row[7]) || 0,
    Vendor: row[8] || '',
    UnitCost: parseFloat(row[9]) || 0,
    Location: row[10] || '',
    Notes: row[11] || '',
    CreatedAt: toIso(row[12]),
    UpdatedAt: toIso(row[13]),
    ExpiryDate: toIso(row[15]),
    MinimumStock: row[16] === '' || row[16] == null ? 0 : (parseFloat(row[16]) || 0)
  };
}

function rowToStockTxn(row, itemsMap, umap) {
  var iid = parseInt(row[1], 10);
  var perfId = parseInt(row[8], 10);
  var apprId = row[11] === '' || row[11] == null ? null : (parseInt(row[11], 10) || null);
  return {
    ID: row[0],
    ItemID: iid,
    ItemName: itemsMap && itemsMap[iid] ? itemsMap[iid].ItemName : '',
    ItemCode: itemsMap && itemsMap[iid] ? itemsMap[iid].ItemCode : '',
    Type: String(row[2] || '').toLowerCase(),
    Quantity: parseFloat(row[3]) || 0,
    Reason: row[4] || '',
    IssuedTo: row[5] || '',
    Reference: row[6] || '',
    Notes: row[7] || '',
    PerformedBy: perfId || row[8] || '',
    PerformedByName: perfId && umap && umap[perfId] ? umap[perfId].fullName : '',
    TransactionDate: toIso(row[9]),
    CreatedAt: toIso(row[10]),
    ApprovedBy: apprId,
    ApprovedByName: apprId && umap && umap[apprId] ? umap[apprId].fullName : ''
  };
}

function itemCodeExists(sh, code, excludeId) {
  if (!code) return false;
  var data = sh.getDataRange().getValues();
  var c = String(code).trim().toLowerCase();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][14]) === '1') continue;
    if (excludeId !== undefined && data[i][0] === excludeId) continue;
    if (String(data[i][1] || '').trim().toLowerCase() === c) return true;
  }
  return false;
}

function validateStockItemPayload(d) {
  if (!d || typeof d !== 'object') return { ok: false, message: 'Invalid payload' };
  var code = String(d.ItemCode || '').trim();
  if (!code) return { ok: false, message: 'ItemCode required' };
  var name = String(d.ItemName || '').trim();
  if (!name) return { ok: false, message: 'ItemName required' };
  var cat = String(d.Category || 'other').toLowerCase();
  if (STOCK_CATEGORIES.indexOf(cat) === -1) return { ok: false, message: 'Invalid Category' };
  var unit = String(d.Unit || 'pcs').toLowerCase();
  if (STOCK_UNITS.indexOf(unit) === -1) return { ok: false, message: 'Invalid Unit' };
  var cur = d.CurrentStock != null && d.CurrentStock !== '' ? parseFloat(d.CurrentStock) : 0;
  if (isNaN(cur) || cur < 0) cur = 0;
  var rl = d.ReorderLevel != null && d.ReorderLevel !== '' ? parseFloat(d.ReorderLevel) : 0;
  if (isNaN(rl) || rl < 0) rl = 0;
  var rq = d.ReorderQuantity != null && d.ReorderQuantity !== '' ? parseFloat(d.ReorderQuantity) : 0;
  if (isNaN(rq) || rq < 0) rq = 0;
  var uc = d.UnitCost != null && d.UnitCost !== '' ? parseFloat(d.UnitCost) : 0;
  if (isNaN(uc) || uc < 0) uc = 0;
  var expiry = String(d.ExpiryDate || '').trim();
  if (expiry && !/^\d{4}-\d{2}-\d{2}$/.test(expiry)) return { ok: false, message: 'ExpiryDate must be YYYY-MM-DD' };
  var minStock = d.MinimumStock != null && d.MinimumStock !== '' ? parseFloat(d.MinimumStock) : 0;
  if (isNaN(minStock) || minStock < 0) minStock = 0;
  return { ok: true, vals: {
    code: code, name: name, cat: cat, unit: unit, cur: cur, rl: rl, rq: rq,
    vendor: String(d.Vendor || ''), uc: uc, loc: String(d.Location || ''), notes: String(d.Notes || ''),
    expiry: toIso(expiry), minStock: minStock
  }};
}

function getAllStockItems(filters, currentUser, currentRole) {
  try {
    if (!canReadStock(currentRole)) return { success: false, message: 'Forbidden' };
    var sh = getSheet(STOCK_ITEMS_SHEET);
    if (!sh) return { success: true, data: [] };
    var f = filters || {};
    var cat = f.category ? String(f.category).toLowerCase() : '';
    var lowOnly = f.lowStock === true || String(f.lowStock) === '1' || f.lowStock === 'true';
    var data = sh.getDataRange().getValues(), out = [];
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][14]) === '1') continue;
      if (cat && String(data[i][3] || '').toLowerCase() !== cat) continue;
      var item = rowToStockItem(data[i]);
      if (lowOnly && item.CurrentStock > item.ReorderLevel) continue;
      out.push(item);
    }
    out.sort(function(a, b) { return String(a.ItemCode).localeCompare(String(b.ItemCode)); });
    return { success: true, data: out };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

function addStockItem(d, currentUser, currentRole) {
  try {
    if (!canWriteStock(currentRole)) return { success: false, message: 'Forbidden — admin/clerk only' };
    var v = validateStockItemPayload(d);
    if (!v.ok) return { success: false, message: v.message };
    var sh = getSheet(STOCK_ITEMS_SHEET);
    if (!sh) return { success: false, message: 'Stock_Items sheet not found' };
    if (itemCodeExists(sh, v.vals.code)) return { success: false, message: 'ItemCode must be unique' };
    var ts = nowIso(), id = nextRowId(sh);
    sh.appendRow([id, v.vals.code, v.vals.name, v.vals.cat, v.vals.unit, v.vals.cur, v.vals.rl, v.vals.rq, v.vals.vendor, v.vals.uc, v.vals.loc, v.vals.notes, ts, ts, '0', v.vals.expiry, v.vals.minStock]);
    addLog(currentUser, 'Stock Item Added', '#' + id + ' ' + v.vals.code + ' / ' + v.vals.name);
    return { success: true, message: 'Item added', id: id };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

function updateStockItem(id, d, currentUser, currentRole) {
  try {
    if (!canWriteStock(currentRole)) return { success: false, message: 'Forbidden — admin/clerk only' };
    var v = validateStockItemPayload(d);
    if (!v.ok) return { success: false, message: v.message };
    var sh = getSheet(STOCK_ITEMS_SHEET);
    if (!sh) return { success: false, message: 'Stock_Items sheet not found' };
    var idn = parseInt(id, 10);
    if (isNaN(idn)) return { success: false, message: 'Invalid id' };
    var data = sh.getDataRange().getValues(), idx = -1;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === idn && String(data[i][14]) === '0') { idx = i; break; }
    }
    if (idx === -1) return { success: false, message: 'Item not found' };
    if (itemCodeExists(sh, v.vals.code, idn)) return { success: false, message: 'ItemCode must be unique' };
    var r = idx + 1;
    sh.getRange(r, 2, 1, 11).setValues([[v.vals.code, v.vals.name, v.vals.cat, v.vals.unit, v.vals.cur, v.vals.rl, v.vals.rq, v.vals.vendor, v.vals.uc, v.vals.loc, v.vals.notes]]);
    sh.getRange(r, 14).setValue(nowIso());
    sh.getRange(r, 16).setValue(v.vals.expiry);
    sh.getRange(r, 17).setValue(v.vals.minStock);
    addLog(currentUser, 'Stock Item Updated', '#' + idn);
    return { success: true, message: 'Item updated' };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

function deleteStockItem(id, currentUser, currentRole) {
  try {
    if (!canWriteStock(currentRole)) return { success: false, message: 'Forbidden — admin/clerk only' };
    var sh = getSheet(STOCK_ITEMS_SHEET);
    if (!sh) return { success: false, message: 'Stock_Items sheet not found' };
    var idn = parseInt(id, 10);
    if (isNaN(idn)) return { success: false, message: 'Invalid id' };
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === idn && String(data[i][14]) === '0') {
        sh.getRange(i + 1, 15).setValue('1');
        sh.getRange(i + 1, 14).setValue(nowIso());
        addLog(currentUser, 'Stock Item Deleted', '#' + idn);
        return { success: true, message: 'Item deleted' };
      }
    }
    return { success: false, message: 'Item not found' };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

function recordStockTransaction(itemId, d, currentUser, currentRole) {
  try {
    if (!canIssueStock(currentRole)) return { success: false, message: 'Forbidden — admin/clerk only' };
    var iid = parseInt(itemId, 10);
    if (isNaN(iid)) return { success: false, message: 'Invalid itemId' };
    if (!d || typeof d !== 'object') return { success: false, message: 'Invalid payload' };
    var type = String(d.type || '').toLowerCase();
    if (STOCK_TXN_TYPES.indexOf(type) === -1) return { success: false, message: 'Invalid type — must be in/out/adjustment' };
    var qty = parseFloat(d.quantity);
    if (isNaN(qty) || qty < 0) return { success: false, message: 'quantity must be a positive number' };
    var ish = getSheet(STOCK_ITEMS_SHEET);
    if (!ish) return { success: false, message: 'Stock_Items sheet not found' };
    var idata = ish.getDataRange().getValues(), itemRow = -1;
    for (var i = 1; i < idata.length; i++) {
      if (idata[i][0] === iid && String(idata[i][14]) === '0') { itemRow = i; break; }
    }
    if (itemRow === -1) return { success: false, message: 'Item not found' };
    var cur = parseFloat(idata[itemRow][5]) || 0;
    var newStock;
    if (type === 'in') newStock = cur + qty;
    else if (type === 'out') {
      if (qty > cur) return { success: false, message: 'Insufficient stock — current ' + cur + ', requested ' + qty };
      newStock = cur - qty;
    } else newStock = qty; // adjustment = absolute set
    var tsh = getSheet(STOCK_TRANSACTIONS_SHEET);
    if (!tsh) return { success: false, message: 'Stock_Transactions sheet not found' };
    var ts = nowIso(), tid = nextRowId(tsh);
    var uid = getCurrentUserId(currentUser) || '';
    var apprBy = '';
    if (d.approvedBy != null && d.approvedBy !== '') {
      var ab = parseInt(d.approvedBy, 10);
      if (!isNaN(ab)) apprBy = ab;
    }
    var newTxnRow = tsh.getLastRow() + 1;
    tsh.getRange(newTxnRow, 10).setNumberFormat('@');
    tsh.appendRow([tid, iid, type, qty, String(d.reason || ''), String(d.issuedTo || ''), String(d.reference || ''), String(d.notes || ''), uid, ts, ts, apprBy]);
    tsh.getRange(newTxnRow, 10).setNumberFormat('@').setValue(ts);
    // update CurrentStock
    ish.getRange(itemRow + 1, 6).setValue(newStock);
    ish.getRange(itemRow + 1, 14).setValue(ts);
    addLog(currentUser, 'Stock ' + type.charAt(0).toUpperCase() + type.slice(1), 'Item #' + iid + ' qty ' + qty + ' → stock ' + newStock);
    return { success: true, message: 'Transaction recorded', id: tid, newStock: newStock };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

function getStockTransactionHistory(itemId, currentUser, currentRole) {
  try {
    if (!canReadStock(currentRole)) return { success: false, message: 'Forbidden' };
    var sh = getSheet(STOCK_TRANSACTIONS_SHEET);
    if (!sh) return { success: true, data: [] };
    var iid = parseInt(itemId, 10);
    if (isNaN(iid)) return { success: false, message: 'Invalid itemId' };
    var data = sh.getDataRange().getValues();
    // build itemsMap
    var ish = getSheet(STOCK_ITEMS_SHEET);
    var itemsMap = {};
    if (ish) {
      var idata = ish.getDataRange().getValues();
      for (var k = 1; k < idata.length; k++) {
        if (String(idata[k][14]) === '1') continue;
        itemsMap[idata[k][0]] = { ItemName: idata[k][2], ItemCode: idata[k][1] };
      }
    }
    var umap = getUsersMap(), out = [];
    for (var i = 1; i < data.length; i++) {
      if (parseInt(data[i][1], 10) !== iid) continue;
      out.push(rowToStockTxn(data[i], itemsMap, umap));
    }
    out.sort(function(a, b) { return String(b.TransactionDate).localeCompare(String(a.TransactionDate)); });
    return { success: true, data: out };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

function getReorderAlerts(currentUser, currentRole) {
  try {
    if (!canReadStock(currentRole)) return { success: false, message: 'Forbidden' };
    var sh = getSheet(STOCK_ITEMS_SHEET);
    if (!sh) return { success: true, data: [] };
    var data = sh.getDataRange().getValues(), out = [];
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][14]) === '1') continue;
      var cur = parseFloat(data[i][5]) || 0;
      var rl = parseFloat(data[i][6]) || 0;
      if (cur <= rl) out.push(rowToStockItem(data[i]));
    }
    out.sort(function(a, b) { return a.CurrentStock - b.CurrentStock; });
    return { success: true, data: out };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

// ============== Student Drill-down (fees / attendance / parents) ==============

// per-student fee summary: applicable structures + payments + totals
function getStudentFeeSummary(studentId, currentUser, currentRole) {
  try {
    if (!canReadPayments(currentRole)) return { success: false, message: 'Forbidden — no access' };
    var sid = parseInt(studentId, 10);
    if (isNaN(sid)) return { success: false, message: 'Invalid student id' };
    var _scope = getViewerScope(currentUser, currentRole);
    if (!_scope.all && _scope.studentIds.indexOf(sid) === -1) return { success: false, message: 'Forbidden — own records only' };

    var students = getStudentsLite();
    var s = students[sid];
    if (!s) return { success: false, message: 'Student not found or deleted' };

    // active fee structures for the student's class
    var fsh = getSheet(FEE_STRUCTURE_SHEET);
    var feeStructures = [];
    if (fsh) {
      var fdata = fsh.getDataRange().getValues();
      for (var i = 1; i < fdata.length; i++) {
        if (String(fdata[i][9]) === '1') continue; // soft-deleted
        if (parseInt(fdata[i][1], 10) !== s.classId) continue;
        if (String(fdata[i][8]) !== '1') continue; // inactive
        feeStructures.push({
          ID: fdata[i][0],
          FeeCategory: String(fdata[i][2] || '').toLowerCase(),
          Amount: parseFloat(fdata[i][3]) || 0,
          Frequency: String(fdata[i][4] || '').toLowerCase(),
          AcademicYear: fdata[i][5] || '',
          LateFeePerDay: parseFloat(fdata[i][7]) || 0
        });
      }
    }

    // payments for this student
    var psh = getSheet(FEE_PAYMENTS_SHEET);
    var payments = [], totalPaid = 0, totalDue = 0, totalLate = 0, totalDiscount = 0;
    if (psh) {
      var fmap = getFeeStructuresLite();
      var umap = getUsersMap();
      var pdata = psh.getDataRange().getValues();
      for (var j = 1; j < pdata.length; j++) {
        if (String(pdata[j][15]) === '1') continue; // soft-deleted
        if (parseInt(pdata[j][1], 10) !== sid) continue;
        var p = rowToPayment(pdata[j], students, fmap, umap);
        payments.push(p);
        totalPaid += p.AmountPaid;
        totalDue += p.AmountDue;
        totalLate += p.LateFee;
        totalDiscount += p.Discount;
      }
      payments.sort(function(a, b) { return String(b.PaymentDate).localeCompare(String(a.PaymentDate)); });
    }

    return {
      success: true,
      data: {
        student: { ID: sid, FullName: s.fullName, AdmissionNumber: s.admNo, ClassLabel: s.classLabel, ClassID: s.classId },
        feeStructures: feeStructures,
        payments: payments,
        totals: {
          paid: totalPaid, due: totalDue, lateFee: totalLate, discount: totalDiscount,
          paymentCount: payments.length
        }
      }
    };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// per-student attendance scan over date range; walks Statuses JSON per row
function getStudentAttendanceReport(studentId, fromDate, toDate, currentUser, currentRole) {
  try {
    if (!canReadAttendance(currentRole)) return { success: false, message: 'Forbidden — no access' };
    var sid = parseInt(studentId, 10);
    if (isNaN(sid)) return { success: false, message: 'Invalid student id' };
    var _scope = getViewerScope(currentUser, currentRole);
    if (!_scope.all && _scope.studentIds.indexOf(sid) === -1) return { success: false, message: 'Forbidden — own records only' };

    var students = getStudentsLite();
    var s = students[sid];
    if (!s) return { success: false, message: 'Student not found or deleted' };

    // default range: last 60 days
    var to = toDate ? toIso(toDate).split('T')[0] : todayStr();
    var from = fromDate ? toIso(fromDate).split('T')[0] : '';
    if (!from) {
      var d = new Date(to);
      d.setDate(d.getDate() - 60);
      from = d.toISOString().split('T')[0];
    }

    var ash = getSheet(ATTENDANCE_SHEET);
    var records = [];
    var counts = { present: 0, absent: 0, late: 0, half_day: 0, leave: 0, unknown: 0 };
    if (ash) {
      var smap = getSubjectsMap();
      var adata = ash.getDataRange().getValues();
      for (var i = 1; i < adata.length; i++) {
        if (parseInt(adata[i][1], 10) !== s.classId) continue;
        var dOnly = toIso(adata[i][2]).split('T')[0];
        if (!dOnly) continue;
        if (dOnly < from || dOnly > to) continue;
        var jsonObj = parseAttendanceJson(adata[i][6]);
        var entry = jsonObj[sid] || jsonObj[String(sid)];
        if (!entry) continue;
        var status = String(entry.status || '').toLowerCase();
        if (counts[status] != null) counts[status]++;
        else counts.unknown++;
        var subjId = adata[i][4];
        records.push({
          Date: dOnly,
          Mode: String(adata[i][3] || '').toLowerCase(),
          SubjectID: subjId || '',
          SubjectLabel: subjId && smap[subjId] ? smap[subjId].subjectName : '',
          PeriodNumber: adata[i][5] || '',
          Status: status,
          Remarks: entry.remarks || ''
        });
      }
      records.sort(function(a, b) {
        if (a.Date !== b.Date) return b.Date.localeCompare(a.Date);
        return String(a.PeriodNumber || '').localeCompare(String(b.PeriodNumber || ''));
      });
    }

    var totalDays = counts.present + counts.absent + counts.late + counts.half_day + counts.leave;
    var attended = counts.present + counts.late + (counts.half_day * 0.5);
    var pct = totalDays > 0 ? Math.round((attended / totalDays) * 1000) / 10 : 0;

    return {
      success: true,
      data: {
        student: { ID: sid, FullName: s.fullName, AdmissionNumber: s.admNo, ClassLabel: s.classLabel },
        range: { from: from, to: to },
        records: records,
        summary: {
          totalRecords: records.length,
          totalDays: totalDays,
          present: counts.present,
          absent: counts.absent,
          late: counts.late,
          halfDay: counts.half_day,
          leave: counts.leave,
          percentage: pct
        }
      }
    };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// ============== Sidebar Badge Counts (cached 5 min) ==============

function getSidebarBadges(currentUser, currentRole) {
  try {
    var role = String(currentRole || '').toLowerCase();
    var u = String(currentUser || '').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
    var key = 'sb_' + role + '_' + u;
    var cache = CacheService.getScriptCache();
    try {
      var hit = cache.get(key);
      if (hit) return { success: true, data: JSON.parse(hit), cached: true };
    } catch (e) {}
    var badges = computeSidebarBadges(currentUser, role);
    try { cache.put(key, JSON.stringify(badges), 300); } catch (e) {}
    return { success: true, data: badges };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

function computeSidebarBadges(currentUser, role) {
  var badges = {};
  var today = new Date();
  var todayStr_ = today.toISOString().split('T')[0];

  // helpdesk — admin/supervisor manage open tickets
  if (role === 'admin' || role === 'supervisor') {
    var sh = getSheet(HELPDESK_SHEET);
    if (sh) {
      var d = sh.getDataRange().getValues(), c = 0;
      for (var i = 1; i < d.length; i++) {
        var st = String(d[i][9] || '').toLowerCase();
        if (st === 'open' || st === 'in_progress') c++;
      }
      if (c > 0) badges.helpdesk = c;
    }
  }

  // complaints — admin/clerk/teacher/supervisor watch open ones
  if (['admin','clerk','teacher','supervisor'].indexOf(role) !== -1) {
    var sh = getSheet(COMPLAINTS_SHEET);
    if (sh) {
      var d = sh.getDataRange().getValues(), c = 0;
      for (var i = 1; i < d.length; i++) {
        var st = String(d[i][9] || '').toLowerCase();
        if (st === 'open' || st === 'under_review') c++;
      }
      if (c > 0) badges.complaints = c;
    }
  }

  // discipline — admin/teacher/supervisor; teacher scoped to own students
  if (['admin','teacher','supervisor'].indexOf(role) !== -1) {
    var sh = getSheet(DISCIPLINE_SHEET);
    if (sh) {
      var teacherStudentIds = role === 'teacher' ? getTeacherStudentIds(currentUser) : null;
      var d = sh.getDataRange().getValues(), c = 0;
      for (var i = 1; i < d.length; i++) {
        if (String(d[i][11]) === '1') continue;
        var sid = parseInt(d[i][1], 10);
        if (teacherStudentIds && teacherStudentIds.indexOf(sid) === -1) continue;
        var st = String(d[i][8] || '').toLowerCase();
        if (st === 'open' || st === 'under_review' || st === 'escalated') c++;
      }
      if (c > 0) badges.discipline = c;
    }
  }

  // ptm — today's slots (teacher scoped to own)
  var ptmSh = getSheet(PTM_SLOTS_SHEET);
  if (ptmSh) {
    var d = ptmSh.getDataRange().getValues(), c = 0;
    var tid = (role === 'teacher') ? getCurrentUserId(currentUser) : null;
    for (var i = 1; i < d.length; i++) {
      var ds = toIso(d[i][2]).split('T')[0];
      if (ds !== todayStr_) continue;
      if (role === 'teacher' && parseInt(d[i][1], 10) !== tid) continue;
      c++;
    }
    if (c > 0) badges.ptm = c;
  }

  // notices — student/parent: active notices targeting them
  if (role === 'student' || role === 'parent') {
    var sh = getSheet(NOTICES_SHEET);
    if (sh) {
      var d = sh.getDataRange().getValues(), c = 0;
      for (var i = 1; i < d.length; i++) {
        if (String(d[i][12]) === '1') continue;
        if (String(d[i][11]) !== '1' && d[i][11] !== 1 && d[i][11] !== true) continue;
        var aud = String(d[i][5] || '').toLowerCase();
        if (role === 'student') { if (aud !== 'all' && aud !== 'students') continue; }
        else { if (aud !== 'all' && aud !== 'parents') continue; }
        c++;
      }
      if (c > 0) badges.notices = c;
    }
  }

  // feePayments — admin/clerk: count of payments with outstanding due
  if (role === 'admin' || role === 'clerk') {
    var sh = getSheet(FEE_PAYMENTS_SHEET);
    if (sh) {
      var d = sh.getDataRange().getValues(), c = 0;
      for (var i = 1; i < d.length; i++) {
        if (String(d[i][15]) === '1') continue;
        var due = parseFloat(d[i][4]) || 0;
        if (due > 0) c++;
      }
      if (c > 0) badges.feePayments = c;
    }
  }

  // substitutes — admin/supervisor: today's substitutions
  if (role === 'admin' || role === 'supervisor') {
    var sh = getSheet(SUBSTITUTES_SHEET);
    if (sh) {
      var d = sh.getDataRange().getValues(), c = 0;
      for (var i = 1; i < d.length; i++) {
        var ds = toIso(d[i][2]).split('T')[0];
        if (ds === todayStr_) c++;
      }
      if (c > 0) badges.substitutes = c;
    }
  }

  return badges;
}

// ============== Role-aware Dashboard Endpoints ==============

// student dashboard — own scope (currentUser = admissionNumber)
function getStudentDashboardData(currentUser, currentRole) {
  try {
    if (String(currentRole || '').toLowerCase() !== 'student') return { success: false, message: 'Forbidden' };

    var key = String(currentUser || '').trim().toLowerCase();
    var ssh = getSheet(STUDENTS_SHEET);
    if (!ssh) return { success: false, message: 'Students sheet not found' };
    var sd = ssh.getDataRange().getValues();
    var me = null, sid = null, classId = null;
    for (var i = 1; i < sd.length; i++) {
      if (String(sd[i][36]) === '1') continue;
      var admNo = String(sd[i][1] || '').toLowerCase();
      var email = String(sd[i][10] || '').toLowerCase();
      if (admNo === key || email === key) { me = sd[i]; sid = sd[i][0]; classId = parseInt(sd[i][25], 10); break; }
    }
    if (!me) return { success: false, message: 'Student profile not found' };

    var cmap = getClassesMap();
    var smap = getSubjectsMap();

    var today = new Date();
    var todayStr_ = today.toISOString().split('T')[0];

    // class subjects count
    var subjects = [];
    Object.keys(smap).forEach(function(k) {
      if (parseInt(smap[k].classId, 10) === classId) subjects.push({ ID: parseInt(k, 10), Name: smap[k].subjectName, Code: smap[k].subjectCode });
    });

    // attendance — count records for this student in last 60 days
    var att = { present:0, absent:0, late:0, half_day:0, leave:0, total:0 };
    var attTrend = [];
    for (var t = 29; t >= 0; t--) {
      var dt = new Date(today); dt.setDate(today.getDate() - t);
      attTrend.push({ date: dt.toISOString().split('T')[0], status: '' });
    }
    var attIdx = {};
    attTrend.forEach(function(t, i) { attIdx[t.date] = i; });
    var ash = getSheet(ATTENDANCE_SHEET);
    if (ash) {
      var ad = ash.getDataRange().getValues();
      for (var ai = 1; ai < ad.length; ai++) {
        if (parseInt(ad[ai][1], 10) !== classId) continue;
        var d = toIso(ad[ai][2]).split('T')[0];
        var jsonObj = parseAttendanceJson(ad[ai][6]);
        var entry = jsonObj[sid] || jsonObj[String(sid)];
        if (!entry) continue;
        var st = String(entry.status || '').toLowerCase();
        if (att[st] != null) att[st]++;
        att.total++;
        if (attIdx[d] != null) attTrend[attIdx[d]].status = st;
      }
    }
    var attended = att.present + att.late + (att.half_day * 0.5);
    var attPct = att.total > 0 ? Math.round((attended / att.total) * 1000) / 10 : 0;

    // latest exam result + per-subject performance
    var latestResultPct = 0;
    var subjectPerf = [];
    var msh = getSheet(MARKS_SHEET);
    var pendingExams = 0;
    var esh = getSheet(EXAMS_SHEET);
    var examMap = {};
    if (esh) {
      var ed = esh.getDataRange().getValues();
      for (var ee = 1; ee < ed.length; ee++) {
        if (String(ed[ee][11]) === '1') continue;
        if (parseInt(ed[ee][3], 10) !== classId) continue;
        examMap[ed[ee][0]] = {
          ID: ed[ee][0],
          Name: ed[ee][1] || '',
          StartDate: toIso(ed[ee][5]).split('T')[0],
          EndDate: toIso(ed[ee][6]).split('T')[0],
          IsPublished: String(ed[ee][8]) === '1' || ed[ee][8] === 1
        };
        if (toIso(ed[ee][5]).split('T')[0] >= todayStr_) pendingExams++;
      }
    }
    if (msh) {
      var md = msh.getDataRange().getValues();
      var byExam = {};
      var subjAgg = {};
      for (var mi = 1; mi < md.length; mi++) {
        if (parseInt(md[mi][2], 10) !== sid) continue;
        var examId = md[mi][1];
        var ex = examMap[examId];
        if (!ex || !ex.IsPublished) continue;
        var subjId = parseInt(md[mi][3], 10);
        var obtained = parseFloat(md[mi][4]) || 0;
        var maxM = parseFloat(md[mi][5]) || 0;
        var isAbsent = String(md[mi][7]) === '1';
        if (!byExam[examId]) byExam[examId] = { total:0, max:0, ts: ex.EndDate };
        if (!isAbsent) { byExam[examId].total += obtained; byExam[examId].max += maxM; }
        if (!subjAgg[subjId]) subjAgg[subjId] = { name: smap[subjId] ? smap[subjId].subjectName : '—', total:0, max:0 };
        if (!isAbsent) { subjAgg[subjId].total += obtained; subjAgg[subjId].max += maxM; }
      }
      // latest exam = max ts
      var latest = null;
      Object.keys(byExam).forEach(function(k) {
        if (!latest || byExam[k].ts > latest.ts) latest = byExam[k];
      });
      if (latest && latest.max > 0) latestResultPct = Math.round((latest.total / latest.max) * 1000) / 10;
      // subject performance avg
      Object.keys(subjAgg).forEach(function(k) {
        var p = subjAgg[k].max > 0 ? Math.round((subjAgg[k].total / subjAgg[k].max) * 1000) / 10 : 0;
        subjectPerf.push({ subject: subjAgg[k].name, percent: p });
      });
      subjectPerf.sort(function(a, b) { return b.percent - a.percent; });
    }

    // fees due (sum of AmountDue for this student)
    var feesDue = 0;
    var fpsh = getSheet(FEE_PAYMENTS_SHEET);
    if (fpsh) {
      var fd = fpsh.getDataRange().getValues();
      for (var fp = 1; fp < fd.length; fp++) {
        if (String(fd[fp][15]) === '1') continue;
        if (parseInt(fd[fp][1], 10) !== sid) continue;
        feesDue += parseFloat(fd[fp][4]) || 0;
      }
    }

    // latest conduct grade
    var conductGrade = '—';
    var consh = getSheet(CONDUCT_SHEET);
    if (consh) {
      var cnd = consh.getDataRange().getValues();
      var latestC = null;
      for (var co = 1; co < cnd.length; co++) {
        if (String(cnd[co][8]) === '1') continue;
        if (parseInt(cnd[co][1], 10) !== sid) continue;
        var ct = toIso(cnd[co][9]).split('T')[0];
        if (!latestC || ct > latestC.ts) latestC = { grade: cnd[co][5], ts: ct };
      }
      if (latestC) conductGrade = latestC.grade || '—';
    }

    // activities count
    var actCount = 0;
    var actsh = getSheet(ACTIVITIES_SHEET);
    if (actsh) {
      var actd = actsh.getDataRange().getValues();
      for (var aa = 1; aa < actd.length; aa++) {
        if (String(actd[aa][11]) === '1') continue;
        if (parseInt(actd[aa][1], 10) === sid) actCount++;
      }
    }

    // notices targeted to this class or 'all'
    var unreadNotices = 0;
    var recentNotices = [];
    var nsh = getSheet(NOTICES_SHEET);
    if (nsh) {
      var nd = nsh.getDataRange().getValues();
      var pool = [];
      for (var n = 1; n < nd.length; n++) {
        if (String(nd[n][12]) === '1') continue;
        if (String(nd[n][11]) !== '1' && nd[n][11] !== 1 && nd[n][11] !== true) continue;
        var aud = String(nd[n][5] || '').toLowerCase();
        var tgt = parseInt(nd[n][6], 10);
        if (aud !== 'all' && aud !== 'students' && tgt !== classId) continue;
        unreadNotices++;
        pool.push({
          ID: nd[n][0],
          Title: nd[n][1] || '',
          NoticeDate: toIso(nd[n][4]).split('T')[0],
          Priority: String(nd[n][8] || '').toLowerCase()
        });
      }
      pool.sort(function(a, b) { return String(b.NoticeDate).localeCompare(String(a.NoticeDate)); });
      recentNotices = pool.slice(0, 5);
    }

    // today's timetable for class
    var todayTimetable = [];
    var dayName = DAY_LIST[today.getDay()];
    var ttSh = getSheet(TIMETABLE_SHEET);
    var umap = getUsersMap();
    if (ttSh) {
      var td = ttSh.getDataRange().getValues();
      for (var tt = 1; tt < td.length; tt++) {
        if (String(td[tt][11]) === '1') continue;
        if (parseInt(td[tt][1], 10) !== classId) continue;
        if (String(td[tt][2] || '').toLowerCase() !== dayName) continue;
        var sbid = parseInt(td[tt][4], 10);
        var teachId = parseInt(td[tt][5], 10);
        todayTimetable.push({
          PeriodNumber: parseInt(td[tt][3], 10) || 0,
          SubjectName: smap[sbid] ? smap[sbid].subjectName : '',
          TeacherName: umap[teachId] ? umap[teachId].fullName : '',
          RoomNumber: td[tt][6] || ''
        });
      }
      todayTimetable.sort(function(a, b) { return a.PeriodNumber - b.PeriodNumber; });
    }

    return {
      success: true,
      data: {
        student: {
          ID: sid,
          FullName: [me[2], me[3], me[4]].filter(function(x){return x;}).join(' '),
          AdmissionNumber: me[1] || '',
          ClassLabel: cmap[classId] ? cmap[classId].label : '',
          RollNumber: me[26] || '',
          PhotoURL: me[33] || ''
        },
        kpis: {
          subjectsCount: subjects.length,
          latestResultPct: latestResultPct,
          attendancePct: attPct,
          feesDue: feesDue,
          pendingExams: pendingExams,
          conductGrade: conductGrade,
          activities: actCount,
          unreadNotices: unreadNotices
        },
        attendance: att,
        attendanceTrend: attTrend,
        subjectPerformance: subjectPerf,
        recentNotices: recentNotices,
        todayTimetable: todayTimetable
      }
    };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

// parent dashboard — own scope (currentUser = mobile or email)
function getParentDashboardData(currentUser, currentRole) {
  try {
    if (String(currentRole || '').toLowerCase() !== 'parent') return { success: false, message: 'Forbidden' };

    var key = String(currentUser || '').trim().toLowerCase();
    var psh = getSheet(PARENTS_SHEET);
    if (!psh) return { success: false, message: 'Parents sheet not found' };
    var pd = psh.getDataRange().getValues();
    var me = null, pid = null;
    for (var i = 1; i < pd.length; i++) {
      if (String(pd[i][10]) === '1') continue;
      var mob = String(pd[i][3] || '').toLowerCase();
      var email = String(pd[i][2] || '').toLowerCase();
      if (mob === key || email === key) { me = pd[i]; pid = pd[i][0]; break; }
    }
    if (!me) return { success: false, message: 'Parent profile not found' };

    var today = new Date();
    var todayStr_ = today.toISOString().split('T')[0];

    // linked children
    var lsh = getSheet(PARENT_STUDENTS_SHEET);
    var childIds = [];
    if (lsh) {
      var ld = lsh.getDataRange().getValues();
      for (var l = 1; l < ld.length; l++) {
        if (parseInt(ld[l][1], 10) === pid) childIds.push(parseInt(ld[l][2], 10));
      }
    }

    var students = getStudentsLite();
    var cmap = getClassesMap();

    // per-child stats
    var childStats = [];
    var totalDue = 0, totalAttPct = 0, totalResultPct = 0;
    var attSamples = 0, resSamples = 0;

    childIds.forEach(function(sid) {
      var s = students[sid];
      if (!s) return;
      var stat = {
        StudentID: sid,
        FullName: s.fullName,
        AdmissionNumber: s.admNo,
        ClassLabel: s.classLabel,
        FeesDue: 0,
        AttendancePct: 0,
        LatestResultPct: 0
      };

      // fees due
      var fpsh = getSheet(FEE_PAYMENTS_SHEET);
      if (fpsh) {
        var fd = fpsh.getDataRange().getValues();
        for (var fp = 1; fp < fd.length; fp++) {
          if (String(fd[fp][15]) === '1') continue;
          if (parseInt(fd[fp][1], 10) !== sid) continue;
          stat.FeesDue += parseFloat(fd[fp][4]) || 0;
        }
      }
      totalDue += stat.FeesDue;

      // attendance
      var ash = getSheet(ATTENDANCE_SHEET);
      var att = { present:0, absent:0, late:0, half_day:0, leave:0, total:0 };
      if (ash) {
        var ad = ash.getDataRange().getValues();
        for (var ai = 1; ai < ad.length; ai++) {
          if (parseInt(ad[ai][1], 10) !== s.classId) continue;
          var jsonObj = parseAttendanceJson(ad[ai][6]);
          var entry = jsonObj[sid] || jsonObj[String(sid)];
          if (!entry) continue;
          var st = String(entry.status || '').toLowerCase();
          if (att[st] != null) att[st]++;
          att.total++;
        }
      }
      var attended = att.present + att.late + (att.half_day * 0.5);
      stat.AttendancePct = att.total > 0 ? Math.round((attended / att.total) * 1000) / 10 : 0;
      if (att.total > 0) { totalAttPct += stat.AttendancePct; attSamples++; }

      // latest result
      var msh = getSheet(MARKS_SHEET);
      var esh = getSheet(EXAMS_SHEET);
      var examPubMap = {};
      if (esh) {
        var ed = esh.getDataRange().getValues();
        for (var ee = 1; ee < ed.length; ee++) {
          if (String(ed[ee][11]) === '1') continue;
          if (String(ed[ee][8]) !== '1' && ed[ee][8] !== 1) continue;
          examPubMap[ed[ee][0]] = toIso(ed[ee][6]).split('T')[0];
        }
      }
      if (msh) {
        var md = msh.getDataRange().getValues();
        var latest = null;
        var byExam = {};
        for (var mi = 1; mi < md.length; mi++) {
          if (parseInt(md[mi][2], 10) !== sid) continue;
          var examId = md[mi][1];
          if (!examPubMap[examId]) continue;
          var obtained = parseFloat(md[mi][4]) || 0;
          var maxM = parseFloat(md[mi][5]) || 0;
          var isAbsent = String(md[mi][7]) === '1';
          if (!byExam[examId]) byExam[examId] = { total:0, max:0, ts: examPubMap[examId] };
          if (!isAbsent) { byExam[examId].total += obtained; byExam[examId].max += maxM; }
        }
        Object.keys(byExam).forEach(function(k) {
          if (!latest || byExam[k].ts > latest.ts) latest = byExam[k];
        });
        if (latest && latest.max > 0) stat.LatestResultPct = Math.round((latest.total / latest.max) * 1000) / 10;
      }
      if (stat.LatestResultPct > 0) { totalResultPct += stat.LatestResultPct; resSamples++; }

      childStats.push(stat);
    });

    // PTMs today (involving any of my children's class teachers — simplified to all PTM slots today)
    var ptmToday = 0;
    var ptmSh = getSheet(PTM_SLOTS_SHEET);
    if (ptmSh) {
      var pmd = ptmSh.getDataRange().getValues();
      for (var pp = 1; pp < pmd.length; pp++) {
        if (toIso(pmd[pp][2]).split('T')[0] === todayStr_) ptmToday++;
      }
    }

    // notices for parents/all
    var unreadNotices = 0;
    var recentNotices = [];
    var nsh = getSheet(NOTICES_SHEET);
    if (nsh) {
      var nd = nsh.getDataRange().getValues();
      var pool = [];
      for (var n = 1; n < nd.length; n++) {
        if (String(nd[n][12]) === '1') continue;
        if (String(nd[n][11]) !== '1' && nd[n][11] !== 1 && nd[n][11] !== true) continue;
        var aud = String(nd[n][5] || '').toLowerCase();
        if (aud !== 'all' && aud !== 'parents') continue;
        unreadNotices++;
        pool.push({
          ID: nd[n][0],
          Title: nd[n][1] || '',
          NoticeDate: toIso(nd[n][4]).split('T')[0],
          Priority: String(nd[n][8] || '').toLowerCase()
        });
      }
      pool.sort(function(a, b) { return String(b.NoticeDate).localeCompare(String(a.NoticeDate)); });
      recentNotices = pool.slice(0, 5);
    }

    return {
      success: true,
      data: {
        parent: { ID: pid, FullName: me[1] || '', Mobile: me[3] || '', Email: me[2] || '', Relation: String(me[5] || '').toLowerCase() },
        kpis: {
          totalChildren: childIds.length,
          totalDue: totalDue,
          avgAttendance: attSamples > 0 ? Math.round((totalAttPct / attSamples) * 10) / 10 : 0,
          avgResult: resSamples > 0 ? Math.round((totalResultPct / resSamples) * 10) / 10 : 0,
          ptmToday: ptmToday,
          unreadNotices: unreadNotices
        },
        children: childStats,
        recentNotices: recentNotices
      }
    };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

// supervisor dashboard — academic + behavior oversight
function getSupervisorDashboardData(currentUser, currentRole) {
  try {
    var role = String(currentRole || '').toLowerCase();
    if (role !== 'admin' && role !== 'supervisor') return { success: false, message: 'Forbidden' };

    var today = new Date();
    var todayStr_ = today.toISOString().split('T')[0];
    var weekStart = new Date(today); weekStart.setDate(today.getDate() - today.getDay());
    var weekStartStr = weekStart.toISOString().split('T')[0];

    // students + teachers
    var totalStudents = 0, totalTeachers = 0;
    var ssh = getSheet(STUDENTS_SHEET);
    if (ssh) {
      var sd = ssh.getDataRange().getValues();
      for (var i = 1; i < sd.length; i++) {
        if (String(sd[i][36]) === '1') continue;
        if (String(sd[i][35] || '').toLowerCase() === 'active') totalStudents++;
      }
    }
    var ush = getSheet(USERS_SHEET);
    if (ush) {
      var ud = ush.getDataRange().getValues();
      for (var u = 1; u < ud.length; u++) {
        if (String(ud[u][16]) === '1') continue;
        if (String(ud[u][6] || '').toLowerCase() === 'teacher') totalTeachers++;
      }
    }

    // attendance trend (7d) + today %
    var attTrend = [];
    for (var t = 6; t >= 0; t--) {
      var dt = new Date(today); dt.setDate(today.getDate() - t);
      attTrend.push({ date: dt.toISOString().split('T')[0], present: 0, absent: 0, late: 0, total: 0 });
    }
    var attIdx = {};
    attTrend.forEach(function(t, i) { attIdx[t.date] = i; });
    var ash = getSheet(ATTENDANCE_SHEET);
    if (ash) {
      var ad = ash.getDataRange().getValues();
      for (var ai = 1; ai < ad.length; ai++) {
        var dStr = toIso(ad[ai][2]).split('T')[0];
        if (attIdx[dStr] == null) continue;
        var t = attTrend[attIdx[dStr]];
        var jsonObj = parseAttendanceJson(ad[ai][6]);
        Object.keys(jsonObj).forEach(function(k) {
          var st = String((jsonObj[k] || {}).status || '').toLowerCase();
          t.total++;
          if (st === 'present') t.present++;
          else if (st === 'absent') t.absent++;
          else if (st === 'late') t.late++;
        });
      }
    }
    var todayRow = attTrend[attTrend.length - 1] || { present:0, total:0 };
    var todayAttPct = todayRow.total > 0 ? Math.round((todayRow.present / todayRow.total) * 1000) / 10 : 0;

    // active exams
    var activeExams = 0;
    var esh = getSheet(EXAMS_SHEET);
    if (esh) {
      var ed = esh.getDataRange().getValues();
      for (var e = 1; e < ed.length; e++) {
        if (String(ed[e][11]) === '1') continue;
        var sd2 = toIso(ed[e][5]).split('T')[0];
        var ed2 = toIso(ed[e][6]).split('T')[0];
        if (sd2 <= todayStr_ && ed2 >= todayStr_) activeExams++;
      }
    }

    // discipline + severity
    var openDisc = 0, criticalInc = 0;
    var sevCounts = { low:0, medium:0, high:0, critical:0 };
    var recentIncidents = [];
    var dsh = getSheet(DISCIPLINE_SHEET);
    var students = getStudentsLite();
    if (dsh) {
      var dd = dsh.getDataRange().getValues();
      var pool = [];
      for (var di = 1; di < dd.length; di++) {
        if (String(dd[di][11]) === '1') continue;
        var sev = String(dd[di][4] || '').toLowerCase();
        if (sevCounts[sev] != null) sevCounts[sev]++;
        if (sev === 'critical') criticalInc++;
        var st = String(dd[di][8] || '').toLowerCase();
        if (st === 'open' || st === 'under_review' || st === 'escalated') openDisc++;
        var sid = parseInt(dd[di][1], 10);
        var s = students[sid];
        pool.push({
          ID: dd[di][0],
          StudentName: s ? s.fullName : '— deleted —',
          AdmissionNumber: s ? s.admNo : '',
          IncidentDate: toIso(dd[di][2]).split('T')[0],
          IncidentType: String(dd[di][3] || '').toLowerCase(),
          Severity: sev,
          Status: st
        });
      }
      pool.sort(function(a, b) { return String(b.IncidentDate).localeCompare(String(a.IncidentDate)); });
      recentIncidents = pool.slice(0, 5);
    }

    // lesson plans this week
    var lpThisWeek = 0;
    var lpsh = getSheet(LESSON_PLANS_SHEET);
    if (lpsh) {
      var lpd = lpsh.getDataRange().getValues();
      for (var lp = 1; lp < lpd.length; lp++) {
        if (String(lpd[lp][13]) === '1') continue;
        var sd3 = toIso(lpd[lp][5]).split('T')[0];
        var ed3 = toIso(lpd[lp][6]).split('T')[0];
        if (sd3 <= todayStr_ && ed3 >= weekStartStr) lpThisWeek++;
      }
    }

    // PTMs today
    var ptmToday = 0;
    var ptmSh = getSheet(PTM_SLOTS_SHEET);
    if (ptmSh) {
      var pd2 = ptmSh.getDataRange().getValues();
      for (var p2 = 1; p2 < pd2.length; p2++) {
        var ds = toIso(pd2[p2][2]).split('T')[0];
        if (ds === todayStr_) ptmToday++;
      }
    }

    // helpdesk + complaints open
    var openHelpdesk = 0;
    var hsh = getSheet(HELPDESK_SHEET);
    if (hsh) {
      var hd = hsh.getDataRange().getValues();
      for (var h = 1; h < hd.length; h++) {
        var hst = String(hd[h][9] || '').toLowerCase();
        if (hst === 'open' || hst === 'in_progress') openHelpdesk++;
      }
    }
    var openComplaints = 0;
    var csh = getSheet(COMPLAINTS_SHEET);
    if (csh) {
      var cd = csh.getDataRange().getValues();
      for (var c = 1; c < cd.length; c++) {
        var cst = String(cd[c][9] || '').toLowerCase();
        if (cst === 'open' || cst === 'under_review') openComplaints++;
      }
    }

    return {
      success: true,
      data: {
        kpis: {
          totalStudents: totalStudents,
          totalTeachers: totalTeachers,
          todayAttPct: todayAttPct,
          activeExams: activeExams,
          openDiscipline: openDisc,
          criticalIncidents: criticalInc,
          lpThisWeek: lpThisWeek,
          ptmToday: ptmToday,
          openHelpdesk: openHelpdesk,
          openComplaints: openComplaints
        },
        attendanceTrend: attTrend,
        disciplineSeverity: sevCounts,
        recentIncidents: recentIncidents
      }
    };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

// clerk dashboard — fees + admissions + records
function getClerkDashboardData(currentUser, currentRole) {
  try {
    var role = String(currentRole || '').toLowerCase();
    if (role !== 'admin' && role !== 'clerk') return { success: false, message: 'Forbidden' };

    var today = new Date();
    var todayStr_ = today.toISOString().split('T')[0];
    var monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    var monthStartStr = monthStart.toISOString().split('T')[0];

    // payments scan
    var todayCollection = 0, todayReceipts = 0, totalOutstanding = 0;
    var refundsToday = 0, refundsTodayCount = 0;
    var collectionTrend = [];
    for (var i = 6; i >= 0; i--) {
      var d = new Date(today); d.setDate(today.getDate() - i);
      collectionTrend.push({ date: d.toISOString().split('T')[0], amount: 0 });
    }
    var collIdx = {};
    collectionTrend.forEach(function(t, i) { collIdx[t.date] = i; });

    var modeBreakdown = { cash:0, cheque:0, online:0, mobile_money:0, card:0, bank_transfer:0 };
    var students = getStudentsLite();
    var fmap = getFeeStructuresLite();
    var umap = getUsersMap();
    var recentPayments = [];
    var fpsh = getSheet(FEE_PAYMENTS_SHEET);
    if (fpsh) {
      var fpd = fpsh.getDataRange().getValues();
      var pool = [];
      for (var fi = 1; fi < fpd.length; fi++) {
        if (String(fpd[fi][15]) === '1') continue;
        var pdate = toIso(fpd[fi][7]).split('T')[0];
        var amt = parseFloat(fpd[fi][3]) || 0;
        var due = parseFloat(fpd[fi][4]) || 0;
        var mode = String(fpd[fi][9] || '').toLowerCase();
        var refundAmt = parseFloat(fpd[fi][19]) || 0;
        var refundDate = toIso(fpd[fi][20]).split('T')[0];
        totalOutstanding += due;
        if (pdate === todayStr_) { todayCollection += amt; todayReceipts++; }
        if (refundAmt > 0 && refundDate === todayStr_) { refundsToday += refundAmt; refundsTodayCount++; }
        if (collIdx[pdate] != null) collectionTrend[collIdx[pdate]].amount += amt;
        if (modeBreakdown[mode] != null) modeBreakdown[mode] += amt;
        pool.push({
          ID: fpd[fi][0],
          ReceiptNumber: fpd[fi][11] || '',
          PaymentDate: pdate,
          AmountPaid: amt,
          AmountDue: due,
          PaymentMode: mode,
          PaymentStatus: String(fpd[fi][12] || '').toLowerCase(),
          StudentID: parseInt(fpd[fi][1], 10)
        });
      }
      pool.sort(function(a, b) { return String(b.PaymentDate).localeCompare(String(a.PaymentDate)); });
      recentPayments = pool.slice(0, 5).map(function(p) {
        var s = students[p.StudentID];
        return Object.assign(p, {
          StudentName: s ? s.fullName : '— deleted —',
          AdmissionNumber: s ? s.admNo : '',
          ClassLabel: s ? s.classLabel : ''
        });
      });
    }

    // active fee items
    var activeFeeItems = 0;
    var fst = getSheet(FEE_STRUCTURE_SHEET);
    if (fst) {
      var fsd = fst.getDataRange().getValues();
      for (var fs = 1; fs < fsd.length; fs++) {
        if (String(fsd[fs][9]) === '1') continue;
        if (String(fsd[fs][8]) === '1' || fsd[fs][8] === 1) activeFeeItems++;
      }
    }

    // active students count + new admissions this month
    var activeStudents = 0, newAdmissions = 0;
    var ssh = getSheet(STUDENTS_SHEET);
    if (ssh) {
      var sd = ssh.getDataRange().getValues();
      for (var s = 1; s < sd.length; s++) {
        if (String(sd[s][36]) === '1') continue;
        var st = String(sd[s][35] || '').toLowerCase();
        if (st === 'active') activeStudents++;
        var admDate = toIso(sd[s][24]).split('T')[0];
        if (admDate >= monthStartStr) newAdmissions++;
      }
    }

    // total parents
    var totalParents = 0;
    var psh = getSheet(PARENTS_SHEET);
    if (psh) {
      var pd = psh.getDataRange().getValues();
      for (var p = 1; p < pd.length; p++) {
        if (String(pd[p][10]) === '1') continue;
        totalParents++;
      }
    }

    // open helpdesk + complaints
    var openHelpdesk = 0;
    var hsh = getSheet(HELPDESK_SHEET);
    if (hsh) {
      var hd = hsh.getDataRange().getValues();
      for (var h = 1; h < hd.length; h++) {
        var st2 = String(hd[h][9] || '').toLowerCase();
        if (st2 === 'open' || st2 === 'in_progress') openHelpdesk++;
      }
    }
    var openComplaints = 0;
    var csh = getSheet(COMPLAINTS_SHEET);
    if (csh) {
      var cd = csh.getDataRange().getValues();
      for (var c = 1; c < cd.length; c++) {
        var st3 = String(cd[c][9] || '').toLowerCase();
        if (st3 === 'open' || st3 === 'under_review') openComplaints++;
      }
    }

    // hall tickets — published exams count
    var publishedExams = 0;
    var esh = getSheet(EXAMS_SHEET);
    if (esh) {
      var ed = esh.getDataRange().getValues();
      for (var e = 1; e < ed.length; e++) {
        if (String(ed[e][11]) === '1') continue;
        if (String(ed[e][8]) === '1' || ed[e][8] === 1) publishedExams++;
      }
    }

    return {
      success: true,
      data: {
        kpis: {
          todayCollection: todayCollection,
          todayReceipts: todayReceipts,
          totalOutstanding: totalOutstanding,
          refundsToday: refundsToday,
          refundsTodayCount: refundsTodayCount,
          activeFeeItems: activeFeeItems,
          activeStudents: activeStudents,
          totalParents: totalParents,
          openHelpdesk: openHelpdesk,
          openComplaints: openComplaints,
          newAdmissions: newAdmissions,
          publishedExams: publishedExams
        },
        collectionTrend: collectionTrend,
        modeBreakdown: modeBreakdown,
        recentPayments: recentPayments
      }
    };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

// teacher dashboard — scoped to current user
function getTeacherDashboardData(currentUser, currentRole) {
  try {
    var role = String(currentRole || '').toLowerCase();
    if (role !== 'admin' && role !== 'teacher') return { success: false, message: 'Forbidden' };

    var tid = getCurrentUserId(currentUser);
    if (!tid) return { success: false, message: 'Teacher not found' };

    var today = new Date();
    var todayStr_ = today.toISOString().split('T')[0];
    var dayName = DAY_LIST[today.getDay()];

    // assignments — classes, subjects, periods/week
    var classSet = {}, subjectSet = {};
    var totalPeriodsPerWeek = 0;
    var ash = getSheet(ASSIGNMENTS_SHEET);
    if (ash) {
      var ad = ash.getDataRange().getValues();
      for (var i = 1; i < ad.length; i++) {
        if (parseInt(ad[i][1], 10) !== tid) continue;
        classSet[parseInt(ad[i][2], 10)] = true;
        subjectSet[parseInt(ad[i][3], 10)] = true;
        totalPeriodsPerWeek += parseInt(ad[i][8], 10) || 0;
      }
    }

    // my students count (across my classes)
    var studentSet = {};
    var ssh = getSheet(STUDENTS_SHEET);
    if (ssh) {
      var sd = ssh.getDataRange().getValues();
      for (var s = 1; s < sd.length; s++) {
        if (String(sd[s][36]) === '1') continue;
        var cid = parseInt(sd[s][25], 10);
        if (classSet[cid]) studentSet[sd[s][0]] = true;
      }
    }

    // today's lectures + weekly load by day
    var todayLectures = [];
    var weekLoad = { monday:0, tuesday:0, wednesday:0, thursday:0, friday:0, saturday:0, sunday:0 };
    var ttSh = getSheet(TIMETABLE_SHEET);
    var cmap = getClassesMap(), smap = getSubjectsMap();
    if (ttSh) {
      var td = ttSh.getDataRange().getValues();
      for (var t = 1; t < td.length; t++) {
        if (String(td[t][11]) === '1') continue;
        if (parseInt(td[t][5], 10) !== tid) continue;
        var d = String(td[t][2] || '').toLowerCase();
        if (weekLoad[d] != null) weekLoad[d]++;
        if (d !== dayName) continue;
        var cid = parseInt(td[t][1], 10);
        var sbid = parseInt(td[t][4], 10);
        todayLectures.push({
          PeriodNumber: parseInt(td[t][3], 10) || 0,
          ClassLabel: cmap[cid] ? cmap[cid].label : '',
          SubjectName: smap[sbid] ? smap[sbid].subjectName : '',
          SubjectCode: smap[sbid] ? smap[sbid].subjectCode : '',
          RoomNumber: td[t][6] || '',
          Mode: String(td[t][16] || 'offline').toLowerCase()
        });
      }
    }
    todayLectures.sort(function(a, b) { return a.PeriodNumber - b.PeriodNumber; });

    // logbook last 7 days + recent 5
    var logbook7d = 0;
    var recentLogbook = [];
    var lsh = getSheet(TEACHING_LOGBOOK_SHEET);
    if (lsh) {
      var ld = lsh.getDataRange().getValues();
      var c7 = new Date(today); c7.setDate(today.getDate() - 7);
      var c7Str = c7.toISOString().split('T')[0];
      var pool = [];
      for (var lo = 1; lo < ld.length; lo++) {
        if (parseInt(ld[lo][1], 10) !== tid) continue;
        var dStr = toIso(ld[lo][4]).split('T')[0];
        if (dStr >= c7Str) logbook7d++;
        pool.push({
          ID: ld[lo][0],
          LogDate: dStr,
          ClassLabel: cmap[parseInt(ld[lo][2], 10)] ? cmap[parseInt(ld[lo][2], 10)].label : '',
          SubjectName: smap[parseInt(ld[lo][3], 10)] ? smap[parseInt(ld[lo][3], 10)].subjectName : '',
          TopicCovered: ld[lo][6] || '',
          Status: String(ld[lo][10] || '').toLowerCase()
        });
      }
      pool.sort(function(a, b) { return String(b.LogDate).localeCompare(String(a.LogDate)); });
      recentLogbook = pool.slice(0, 5);
    }

    // active lesson plans
    var activePlans = 0;
    var lpsh = getSheet(LESSON_PLANS_SHEET);
    if (lpsh) {
      var lpd = lpsh.getDataRange().getValues();
      for (var lp = 1; lp < lpd.length; lp++) {
        if (String(lpd[lp][13]) === '1') continue;
        if (parseInt(lpd[lp][1], 10) !== tid) continue;
        var st = String(lpd[lp][12] || '').toLowerCase();
        if (st === 'active' || st === 'in_progress' || st === 'planned') activePlans++;
      }
    }

    // PTM bookings today
    var ptmToday = 0;
    var ptmSh = getSheet(PTM_BOOKINGS_SHEET);
    if (ptmSh) {
      var pmd = ptmSh.getDataRange().getValues();
      var slotSh = getSheet(PTM_SLOTS_SHEET);
      var slotMap = {};
      if (slotSh) {
        var sld = slotSh.getDataRange().getValues();
        for (var sl = 1; sl < sld.length; sl++) {
          slotMap[sld[sl][0]] = { teacherId: parseInt(sld[sl][1], 10), date: toIso(sld[sl][2]).split('T')[0] };
        }
      }
      for (var pm = 1; pm < pmd.length; pm++) {
        var sid_ = parseInt(pmd[pm][1], 10);
        var slot = slotMap[sid_];
        if (slot && slot.teacherId === tid && slot.date === todayStr_) ptmToday++;
      }
    }

    // substitute count last 30 days
    var subs30 = 0;
    var subSh = getSheet(SUBSTITUTES_SHEET);
    if (subSh) {
      var sbd = subSh.getDataRange().getValues();
      var c30 = new Date(today); c30.setDate(today.getDate() - 30);
      var c30Str = c30.toISOString().split('T')[0];
      for (var sb = 1; sb < sbd.length; sb++) {
        var sd2 = toIso(sbd[sb][2]).split('T')[0];
        if (sd2 < c30Str) continue;
        var orig = parseInt(sbd[sb][3], 10);
        var subT = parseInt(sbd[sb][4], 10);
        if (orig === tid || subT === tid) subs30++;
      }
    }

    // recent notices (last 5 active)
    var recentNotices = [];
    var nsh = getSheet(NOTICES_SHEET);
    if (nsh) {
      var nd = nsh.getDataRange().getValues();
      var pool2 = [];
      for (var n = 1; n < nd.length; n++) {
        if (String(nd[n][12]) === '1') continue;
        if (String(nd[n][11]) !== '1' && nd[n][11] !== 1 && nd[n][11] !== true) continue;
        pool2.push({
          ID: nd[n][0],
          Title: nd[n][1] || '',
          NoticeDate: toIso(nd[n][4]).split('T')[0],
          Priority: String(nd[n][8] || '').toLowerCase()
        });
      }
      pool2.sort(function(a, b) { return String(b.NoticeDate).localeCompare(String(a.NoticeDate)); });
      recentNotices = pool2.slice(0, 5);
    }

    return {
      success: true,
      data: {
        kpis: {
          classes: Object.keys(classSet).length,
          students: Object.keys(studentSet).length,
          subjects: Object.keys(subjectSet).length,
          todayLectures: todayLectures.length,
          weekPeriods: totalPeriodsPerWeek,
          logbook7d: logbook7d,
          activePlans: activePlans,
          ptmToday: ptmToday,
          subs30: subs30,
          totalAssignments: Object.keys(classSet).length * Object.keys(subjectSet).length || 0
        },
        weekLoad: weekLoad,
        todayLectures: todayLectures,
        recentLogbook: recentLogbook,
        recentNotices: recentNotices,
        dayName: dayName
      }
    };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

// admin: enrichment data — alerts, birthdays, capacity, activity log
function getAdminDashboardEnrich(currentUser, currentRole) {
  try {
    if (!isAdmin(currentRole)) return { success: false, message: 'Forbidden — admin only' };
    var today = new Date();
    var todayStr_ = today.toISOString().split('T')[0];
    var todayMM = today.getMonth() + 1;
    var todayDD = today.getDate();
    var d30 = new Date(today); d30.setDate(today.getDate() - 30);
    var d30Str = d30.toISOString().split('T')[0];
    var d7 = new Date(today); d7.setDate(today.getDate() - 7);
    var d7Str = d7.toISOString().split('T')[0];

    // === Alerts ===
    var todayAbsent = 0;
    var ash = getSheet(ATTENDANCE_SHEET);
    if (ash) {
      var ad = ash.getDataRange().getValues();
      for (var i = 1; i < ad.length; i++) {
        var dStr = toIso(ad[i][2]).split('T')[0];
        if (dStr !== todayStr_) continue;
        var jsonObj = parseAttendanceJson(ad[i][6]);
        Object.keys(jsonObj).forEach(function(k) {
          var st = String((jsonObj[k] || {}).status || '').toLowerCase();
          if (st === 'absent') todayAbsent++;
        });
      }
    }

    var overdueCount = 0, overdueAmount = 0;
    var fpsh = getSheet(FEE_PAYMENTS_SHEET);
    if (fpsh) {
      var fpd = fpsh.getDataRange().getValues();
      for (var fp = 1; fp < fpd.length; fp++) {
        if (String(fpd[fp][15]) === '1') continue;
        var due = parseFloat(fpd[fp][4]) || 0;
        if (due <= 0) continue;
        var pdate = toIso(fpd[fp][7]).split('T')[0];
        if (pdate < d30Str) { overdueCount++; overdueAmount += due; }
      }
    }

    var docsPending = 0;
    var dsh = getSheet(DOCUMENTS_SHEET);
    if (dsh) {
      var dd = dsh.getDataRange().getValues();
      for (var d = 1; d < dd.length; d++) {
        if (String(dd[d][12]) === '1') continue;
        var ver = dd[d][9];
        if (ver !== '1' && ver !== 1 && ver !== true) docsPending++;
      }
    }

    var lowStock = [];
    var ssh = getSheet(STOCK_ITEMS_SHEET);
    if (ssh) {
      var sd = ssh.getDataRange().getValues();
      for (var s = 1; s < sd.length; s++) {
        if (String(sd[s][14]) === '1') continue;
        var cur = parseFloat(sd[s][5]) || 0;
        var rl = parseFloat(sd[s][6]) || 0;
        if (rl > 0 && cur <= rl) lowStock.push({ Name: sd[s][1] || '', Current: cur, ReorderLevel: rl });
      }
      lowStock.sort(function(a, b) { return (a.Current / Math.max(1, a.ReorderLevel)) - (b.Current / Math.max(1, b.ReorderLevel)); });
      lowStock = lowStock.slice(0, 5);
    }

    var helpdeskStale = 0;
    var hsh = getSheet(HELPDESK_SHEET);
    if (hsh) {
      var hd = hsh.getDataRange().getValues();
      for (var h = 1; h < hd.length; h++) {
        var st = String(hd[h][9] || '').toLowerCase();
        if (st !== 'open' && st !== 'in_progress') continue;
        var cdate = toIso(hd[h][13]).split('T')[0];
        if (cdate && cdate < d7Str) helpdeskStale++;
      }
    }

    var subToday = 0;
    var subSh = getSheet(SUBSTITUTES_SHEET);
    if (subSh) {
      var sub_d = subSh.getDataRange().getValues();
      for (var sx = 1; sx < sub_d.length; sx++) {
        var ds = toIso(sub_d[sx][2]).split('T')[0];
        if (ds === todayStr_) subToday++;
      }
    }

    // === Birthdays Today ===
    var studentBdays = [];
    var ssh2 = getSheet(STUDENTS_SHEET);
    if (ssh2) {
      var sd2 = ssh2.getDataRange().getValues();
      var cmap = getClassesMap();
      for (var sb = 1; sb < sd2.length; sb++) {
        if (String(sd2[sb][36]) === '1') continue;
        var dob = sd2[sb][6];
        if (!dob) continue;
        var dt = new Date(dob);
        if (isNaN(dt.getTime())) continue;
        if (dt.getMonth() + 1 === todayMM && dt.getDate() === todayDD) {
          var cid = parseInt(sd2[sb][25], 10);
          studentBdays.push({
            ID: sd2[sb][0],
            FullName: [sd2[sb][2], sd2[sb][3], sd2[sb][4]].filter(function(x){return x;}).join(' '),
            AdmissionNumber: sd2[sb][1],
            ClassLabel: cmap[cid] ? cmap[cid].label : '',
            PhotoURL: sd2[sb][33] || ''
          });
        }
      }
    }

    var staffBdays = [];
    var ush = getSheet(USERS_SHEET);
    if (ush) {
      var ud = ush.getDataRange().getValues();
      for (var u = 1; u < ud.length; u++) {
        if (String(ud[u][16]) === '1') continue;
        var dob2 = ud[u][8];
        if (!dob2) continue;
        var dt2 = new Date(dob2);
        if (isNaN(dt2.getTime())) continue;
        if (dt2.getMonth() + 1 === todayMM && dt2.getDate() === todayDD) {
          staffBdays.push({
            ID: ud[u][0],
            FullName: ud[u][2] || ud[u][1],
            Role: String(ud[u][6] || '').toLowerCase(),
            PhotoURL: ud[u][12] || ''
          });
        }
      }
    }

    // === Class Capacity ===
    var classCapacity = [];
    var csh = getSheet(CLASSES_SHEET);
    if (csh) {
      var cd = csh.getDataRange().getValues();
      for (var c = 1; c < cd.length; c++) {
        if (String(cd[c][6]) === '1') continue;
        var cur = parseInt(cd[c][5], 10) || 0;
        var max = parseInt(cd[c][14], 10) || 0;
        var pct = max > 0 ? Math.round((cur / max) * 100) : 0;
        classCapacity.push({
          ID: cd[c][0],
          Label: (cd[c][1] || '') + (cd[c][2] ? '-' + cd[c][2] : ''),
          Current: cur,
          Max: max,
          Pct: pct
        });
      }
      classCapacity.sort(function(a, b) { return b.Pct - a.Pct; });
    }

    // === Recent Activity (last 10 logs) ===
    var recentActivity = [];
    var lsh = getSheet(LOGS_SHEET);
    if (lsh) {
      var lastRow = lsh.getLastRow();
      if (lastRow > 1) {
        var startRow = Math.max(2, lastRow - 49);
        var ld = lsh.getRange(startRow, 1, lastRow - startRow + 1, 4).getValues();
        var pool = [];
        for (var li = 0; li < ld.length; li++) {
          pool.push({
            Timestamp: toIso(ld[li][0]),
            User: ld[li][1] || '',
            Action: ld[li][2] || '',
            Details: ld[li][3] || ''
          });
        }
        pool.sort(function(a, b) { return String(b.Timestamp).localeCompare(String(a.Timestamp)); });
        recentActivity = pool.slice(0, 10);
      }
    }

    return {
      success: true,
      data: {
        alerts: {
          todayAbsent: todayAbsent,
          overdueFees: { count: overdueCount, amount: overdueAmount },
          docsPending: docsPending,
          lowStock: lowStock,
          helpdeskStale: helpdeskStale,
          subToday: subToday
        },
        birthdays: { students: studentBdays, staff: staffBdays },
        classCapacity: classCapacity,
        recentActivity: recentActivity
      }
    };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

// admin: charts (trends) + lists (recent items) — pairs with getDashboardStats KPIs
function getAdminDashboardCharts(currentUser, currentRole) {
  try {
    if (!isAdmin(currentRole)) return { success: false, message: 'Forbidden — admin only' };

    var today = new Date();
    var todayStr_ = today.toISOString().split('T')[0];

    // 7-day attendance trend
    var attTrend = [];
    for (var i = 6; i >= 0; i--) {
      var d = new Date(today); d.setDate(today.getDate() - i);
      attTrend.push({ date: d.toISOString().split('T')[0], present: 0, absent: 0, late: 0, total: 0 });
    }
    var ash = getSheet(ATTENDANCE_SHEET);
    if (ash) {
      var adata = ash.getDataRange().getValues();
      var idx = {};
      attTrend.forEach(function(t, i) { idx[t.date] = i; });
      for (var ai = 1; ai < adata.length; ai++) {
        var dStr = toIso(adata[ai][2]).split('T')[0];
        if (idx[dStr] == null) continue;
        var t = attTrend[idx[dStr]];
        var jsonObj = parseAttendanceJson(adata[ai][6]);
        Object.keys(jsonObj).forEach(function(k) {
          var st = String((jsonObj[k] || {}).status || '').toLowerCase();
          t.total++;
          if (st === 'present') t.present++;
          else if (st === 'absent') t.absent++;
          else if (st === 'late') t.late++;
        });
      }
    }

    // 30-day fee collection trend
    var collTrend = [];
    for (var c = 29; c >= 0; c--) {
      var dc = new Date(today); dc.setDate(today.getDate() - c);
      collTrend.push({ date: dc.toISOString().split('T')[0], amount: 0 });
    }
    var collIdx = {};
    collTrend.forEach(function(t, i) { collIdx[t.date] = i; });
    var fpsh = getSheet(FEE_PAYMENTS_SHEET);
    var todayCollection = 0;
    if (fpsh) {
      var fpdata = fpsh.getDataRange().getValues();
      for (var fi = 1; fi < fpdata.length; fi++) {
        if (String(fpdata[fi][15]) === '1') continue;
        var pdate = toIso(fpdata[fi][7]).split('T')[0];
        var amt = parseFloat(fpdata[fi][3]) || 0;
        if (pdate === todayStr_) todayCollection += amt;
        if (collIdx[pdate] != null) collTrend[collIdx[pdate]].amount += amt;
      }
    }

    // student gender split
    var gender = { male: 0, female: 0, other: 0 };
    var ssh = getSheet(STUDENTS_SHEET);
    if (ssh) {
      var sdata = ssh.getDataRange().getValues();
      for (var si = 1; si < sdata.length; si++) {
        if (String(sdata[si][36]) === '1') continue;
        var g = String(sdata[si][5] || '').toLowerCase();
        if (g === 'male') gender.male++;
        else if (g === 'female') gender.female++;
        else gender.other++;
      }
    }

    // discipline severity counts
    var sev = { low: 0, medium: 0, high: 0, critical: 0 };
    var dsh = getSheet(DISCIPLINE_SHEET);
    if (dsh) {
      var ddata = dsh.getDataRange().getValues();
      for (var di = 1; di < ddata.length; di++) {
        if (String(ddata[di][11]) === '1') continue;
        var s = String(ddata[di][4] || '').toLowerCase();
        if (sev[s] != null) sev[s]++;
      }
    }

    // recent admissions (last 5 by AdmissionDate desc)
    var recentAdmissions = [];
    if (ssh) {
      var sdata2 = ssh.getDataRange().getValues();
      var cmap = getClassesMap();
      var pool = [];
      for (var sj = 1; sj < sdata2.length; sj++) {
        if (String(sdata2[sj][36]) === '1') continue;
        pool.push({
          ID: sdata2[sj][0],
          AdmissionNumber: sdata2[sj][1],
          FullName: [sdata2[sj][2], sdata2[sj][3], sdata2[sj][4]].filter(function(x){return x;}).join(' '),
          ClassLabel: cmap[parseInt(sdata2[sj][25], 10)] ? cmap[parseInt(sdata2[sj][25], 10)].label : '',
          AdmissionDate: toIso(sdata2[sj][24]).split('T')[0]
        });
      }
      pool.sort(function(a, b) { return String(b.AdmissionDate).localeCompare(String(a.AdmissionDate)); });
      recentAdmissions = pool.slice(0, 5);
    }

    // upcoming events (next 5 from today)
    var upcomingEvents = [];
    var calsh = getSheet(CALENDAR_SHEET);
    if (calsh) {
      var cdata = calsh.getDataRange().getValues();
      var pool2 = [];
      for (var ci2 = 1; ci2 < cdata.length; ci2++) {
        if (String(cdata[ci2][14]) === '1') continue;
        var ed = toIso(cdata[ci2][2]).split('T')[0];
        if (!ed || ed < todayStr_) continue;
        pool2.push({
          ID: cdata[ci2][0],
          EventName: cdata[ci2][1] || '',
          EventDate: ed,
          EventType: String(cdata[ci2][4] || '').toLowerCase(),
          IsHoliday: String(cdata[ci2][7]) === '1' || cdata[ci2][7] === 1
        });
      }
      pool2.sort(function(a, b) { return String(a.EventDate).localeCompare(String(b.EventDate)); });
      upcomingEvents = pool2.slice(0, 5);
    }

    // recent incidents (last 5)
    var recentIncidents = [];
    if (dsh) {
      var ddata2 = dsh.getDataRange().getValues();
      var students = getStudentsLite();
      var pool3 = [];
      for (var dj = 1; dj < ddata2.length; dj++) {
        if (String(ddata2[dj][11]) === '1') continue;
        var sid = parseInt(ddata2[dj][1], 10);
        var s = students[sid];
        pool3.push({
          ID: ddata2[dj][0],
          StudentName: s ? s.fullName : '— deleted —',
          AdmissionNumber: s ? s.admNo : '',
          IncidentDate: toIso(ddata2[dj][2]).split('T')[0],
          Severity: String(ddata2[dj][4] || '').toLowerCase(),
          IncidentType: String(ddata2[dj][3] || '').toLowerCase(),
          Status: String(ddata2[dj][8] || '').toLowerCase()
        });
      }
      pool3.sort(function(a, b) { return String(b.IncidentDate).localeCompare(String(a.IncidentDate)); });
      recentIncidents = pool3.slice(0, 5);
    }

    // today attendance %
    var todayPresent = 0, todayTotal = 0;
    var todayRow = attTrend[attTrend.length - 1];
    if (todayRow) { todayPresent = todayRow.present; todayTotal = todayRow.total; }
    var todayAttPct = todayTotal > 0 ? Math.round((todayPresent / todayTotal) * 1000) / 10 : 0;

    return {
      success: true,
      data: {
        todayCollection: todayCollection,
        todayAttPct: todayAttPct,
        attendanceTrend: attTrend,
        collectionTrend: collTrend,
        gender: gender,
        disciplineSeverity: sev,
        recentAdmissions: recentAdmissions,
        upcomingEvents: upcomingEvents,
        recentIncidents: recentIncidents
      }
    };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

// ============== Discipline Drill-downs (action col helpers) ==============

// per-student discipline history (newest first)
function getStudentDisciplineHistory(studentId, currentUser, currentRole) {
  try {
    if (!canReadDiscipline(currentRole)) return { success: false, message: 'Forbidden' };
    var sid = parseInt(studentId, 10);
    if (isNaN(sid)) return { success: false, message: 'Invalid student id' };
    var _scope = getViewerScope(currentUser, currentRole);
    if (!_scope.all && _scope.studentIds.indexOf(sid) === -1) return { success: false, message: 'Forbidden — own records only' };

    var students = getStudentsLite();
    var s = students[sid];
    if (!s) return { success: false, message: 'Student not found' };

    var sh = getSheet(DISCIPLINE_SHEET);
    if (!sh) return { success: true, data: [], student: { ID: sid, FullName: s.fullName } };
    var umap = getUsersMap();
    var data = sh.getDataRange().getValues(), out = [];
    var counts = { open:0, under_review:0, resolved:0, escalated:0, total:0 };
    var sevCounts = { low:0, medium:0, high:0, critical:0 };
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][11]) === '1') continue;
      if (parseInt(data[i][1], 10) !== sid) continue;
      var r = rowToDiscipline(data[i], students, umap);
      out.push(r);
      counts.total++;
      var st = String(r.Status || '').toLowerCase();
      if (counts[st] != null) counts[st]++;
      var sev = String(r.Severity || '').toLowerCase();
      if (sevCounts[sev] != null) sevCounts[sev]++;
    }
    out.sort(function(a, b) { return String(b.IncidentDate).localeCompare(String(a.IncidentDate)); });
    return {
      success: true,
      data: out,
      student: { ID: sid, FullName: s.fullName, AdmissionNumber: s.admNo, ClassLabel: s.classLabel },
      summary: { ...counts, severity: sevCounts }
    };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

// toggle discipline ParentNotified flag (admin/teacher/supervisor)
function toggleDisciplineParentNotified(disciplineId, currentUser, currentRole) {
  try {
    if (!canWriteDiscipline(currentRole)) return { success: false, message: 'Forbidden' };
    var did = parseInt(disciplineId, 10);
    if (isNaN(did)) return { success: false, message: 'Invalid id' };
    var sh = getSheet(DISCIPLINE_SHEET);
    if (!sh) return { success: false, message: 'Discipline sheet not found' };
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] !== did) continue;
      if (String(data[i][11]) === '1') return { success: false, message: 'Record is deleted' };
      var current = String(data[i][7]) === '1' || data[i][7] === 1 || data[i][7] === true;
      var next = !current;
      var row = i + 1, ts = nowIso();
      sh.getRange(row, 8).setValue(next ? '1' : '0');     // col 8 = ParentNotified
      sh.getRange(row, 14).setValue(ts);                   // col 14 = UpdatedAt
      addLog(currentUser, 'Discipline Parent-Notified Toggled', 'Record #' + did + ' set to ' + (next ? 'notified' : 'not notified'));
      return { success: true, message: next ? 'Marked as parent notified' : 'Marked as not notified', isNotified: next };
    }
    return { success: false, message: 'Record not found' };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

// ============== Fee Payment Drill-downs (action col helpers) ==============

// email fee receipt to parent(s) of the student
function emailFeeReceipt(paymentId, currentUser, currentRole) {
  try {
    var role = String(currentRole || '').toLowerCase();
    if (role !== 'admin' && role !== 'clerk') return { success: false, message: 'Forbidden — admin/clerk only' };
    var pid = parseInt(paymentId, 10);
    if (isNaN(pid)) return { success: false, message: 'Invalid payment id' };

    // load payment + student
    var sh = getSheet(FEE_PAYMENTS_SHEET);
    if (!sh) return { success: false, message: 'Fee_Payments sheet not found' };
    var students = getStudentsLite();
    var fmap = getFeeStructuresLite();
    var umap = getUsersMap();
    var data = sh.getDataRange().getValues();
    var p = null;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === pid && String(data[i][15]) !== '1') { p = rowToPayment(data[i], students, fmap, umap); break; }
    }
    if (!p) return { success: false, message: 'Payment not found' };

    // collect parent emails via Parent_Students junction
    var emails = [];
    var psh = getSheet(PARENT_STUDENTS_SHEET);
    var parsh = getSheet(PARENTS_SHEET);
    if (psh && parsh) {
      var lsdata = psh.getDataRange().getValues();
      var parentIds = [];
      for (var j = 1; j < lsdata.length; j++) {
        if (parseInt(lsdata[j][2], 10) === p.StudentID) parentIds.push(parseInt(lsdata[j][1], 10));
      }
      if (parentIds.length > 0) {
        var pdata = parsh.getDataRange().getValues();
        for (var k = 1; k < pdata.length; k++) {
          if (String(pdata[k][10]) === '1') continue;
          if (parentIds.indexOf(parseInt(pdata[k][0], 10)) === -1) continue;
          if (pdata[k][2] && String(pdata[k][2]).indexOf('@') > 0) emails.push(pdata[k][2]);
        }
      }
    }
    // fallback: student's own email
    var ssh = getSheet(STUDENTS_SHEET);
    if (emails.length === 0 && ssh) {
      var sdata = ssh.getDataRange().getValues();
      for (var m = 1; m < sdata.length; m++) {
        if (parseInt(sdata[m][0], 10) === p.StudentID && String(sdata[m][36]) !== '1') {
          if (sdata[m][10] && String(sdata[m][10]).indexOf('@') > 0) emails.push(sdata[m][10]);
          break;
        }
      }
    }
    if (emails.length === 0) return { success: false, message: 'No parent/student email on file' };

    var settings = getSchoolSettings();
    var schoolName = (settings && settings.success && settings.data) ? settings.data.SchoolName : 'School';

    var subject = schoolName + ' — Fee Receipt #' + p.ReceiptNumber;
    var body = 'Dear Parent / Guardian,\n\n' +
               'Please find below the receipt for the recent fee payment:\n\n' +
               'Receipt No   : ' + p.ReceiptNumber + '\n' +
               'Date         : ' + (p.PaymentDate || '').split('T')[0] + '\n' +
               'Student      : ' + p.StudentName + ' (' + p.AdmissionNumber + ')\n' +
               'Class        : ' + p.ClassLabel + '\n' +
               'Fee Category : ' + (p.FeeCategory || '').toUpperCase() + '\n' +
               'Billing      : ' + p.BillingPeriod + '\n' +
               'Amount Paid  : ' + p.AmountPaid + '\n' +
               'Amount Due   : ' + p.AmountDue + '\n' +
               'Mode         : ' + (p.PaymentMode || '').toUpperCase() + '\n' +
               'Status       : ' + (p.PaymentStatus || '').toUpperCase() + '\n\n' +
               (p.Remarks ? 'Remarks: ' + p.Remarks + '\n\n' : '') +
               'Thank you,\n' + schoolName;

    try {
      MailApp.sendEmail({ to: emails.join(','), subject: subject, body: body });
    } catch (mailErr) {
      return { success: false, message: 'Email failed: ' + mailErr.toString() };
    }

    addLog(currentUser, 'Fee Receipt Emailed', 'Receipt #' + p.ReceiptNumber + ' emailed to: ' + emails.join(', '));
    return { success: true, message: 'Receipt emailed to ' + emails.length + ' recipient(s)', recipients: emails };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

// refund a payment (admin only) — sets RefundAmount/Date/Reason and flips status to 'refunded'
function refundPayment(paymentId, refundAmount, refundReason, currentUser, currentRole) {
  try {
    if (!isAdmin(currentRole)) return { success: false, message: 'Forbidden — admin only' };
    var pid = parseInt(paymentId, 10);
    if (isNaN(pid)) return { success: false, message: 'Invalid payment id' };
    var amt = parseFloat(refundAmount);
    if (isNaN(amt) || amt <= 0) return { success: false, message: 'Refund amount must be positive' };
    var reason = String(refundReason || '').trim();
    if (reason.length < 3) return { success: false, message: 'Refund reason required (min 3 chars)' };

    var sh = getSheet(FEE_PAYMENTS_SHEET);
    if (!sh) return { success: false, message: 'Fee_Payments sheet not found' };
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] !== pid) continue;
      if (String(data[i][15]) === '1') return { success: false, message: 'Payment is deleted' };
      var paid = parseFloat(data[i][3]) || 0;
      if (amt > paid) return { success: false, message: 'Refund cannot exceed amount paid (' + paid + ')' };
      var row = i + 1, ts = nowIso();
      sh.getRange(row, 20).setValue(amt);            // col 20 = RefundAmount
      sh.getRange(row, 21).setValue(ts);             // col 21 = RefundDate
      sh.getRange(row, 22).setValue(reason);         // col 22 = RefundReason
      sh.getRange(row, 13).setValue('refunded');     // col 13 = PaymentStatus
      sh.getRange(row, 18).setValue(ts);             // col 18 = UpdatedAt
      addLog(currentUser, 'Fee Refunded', 'Refund ' + amt + ' for payment #' + pid + ' — ' + reason);
      return { success: true, message: 'Refund of ' + amt + ' recorded' };
    }
    return { success: false, message: 'Payment not found' };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

// ============== Exam Drill-downs (action col helpers) ==============

// top N students for an exam by total marks
function getExamToppers(examId, limit, currentUser, currentRole) {
  try {
    if (!canReadMarks(currentRole)) return { success: false, message: 'Forbidden' };
    var eid = parseInt(examId, 10);
    if (isNaN(eid)) return { success: false, message: 'Invalid examId' };
    var examRow = getExamRow(eid);
    if (!examRow) return { success: false, message: 'Exam not found' };
    var n = parseInt(limit, 10) || 10;

    var students = getStudentsLite();
    var byStudent = {};
    var msh = getSheet(MARKS_SHEET);
    if (msh) {
      var data = msh.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (parseInt(data[i][1], 10) !== eid) continue;
        var sid = parseInt(data[i][2], 10);
        var s = students[sid];
        if (!s) continue;
        var obtained = parseFloat(data[i][4]);
        var maxM = parseFloat(data[i][5]) || 0;
        var isAbsent = String(data[i][7]) === '1';
        if (!byStudent[sid]) byStudent[sid] = {
          StudentID: sid, FullName: s.fullName, AdmissionNumber: s.admNo, ClassLabel: s.classLabel,
          Total: 0, Max: 0, AbsentCount: 0, SubjectCount: 0
        };
        byStudent[sid].SubjectCount++;
        byStudent[sid].Max += maxM;
        if (isAbsent) byStudent[sid].AbsentCount++;
        else if (!isNaN(obtained)) byStudent[sid].Total += obtained;
      }
    }
    var arr = Object.keys(byStudent).map(function(k) { return byStudent[k]; });
    arr.forEach(function(s) {
      s.Percentage = s.Max > 0 ? Math.round((s.Total / s.Max) * 1000) / 10 : 0;
      s.HasAbsent = s.AbsentCount > 0;
    });
    arr.sort(function(a, b) {
      if (b.Percentage !== a.Percentage) return b.Percentage - a.Percentage;
      return b.Total - a.Total;
    });
    arr.forEach(function(s, i) { s.Rank = i + 1; });
    return { success: true, data: arr.slice(0, n), totalStudents: arr.length, exam: { ID: eid, Name: examRow[1], MaxPerSubject: parseFloat(examRow[7]) || 0, AcademicYear: examRow[4] } };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

// grade distribution + per-subject avg/pass-rate for an exam
function getExamDistribution(examId, currentUser, currentRole) {
  try {
    if (!canReadMarks(currentRole)) return { success: false, message: 'Forbidden' };
    var eid = parseInt(examId, 10);
    if (isNaN(eid)) return { success: false, message: 'Invalid examId' };
    var examRow = getExamRow(eid);
    if (!examRow) return { success: false, message: 'Exam not found' };
    var passingPct = parseFloat(examRow[26]) || 50;
    var gradeBand = (getClassesMap()[parseInt(examRow[3], 10)] || {}).gradeBand || 'basic';

    var subjMap = getSubjectsMap();
    var subjectStats = {};
    var byStudent = {};
    var grades = gradeBand === 'jhs'
      ? { 'A+':0, 'A':0, 'B+':0, 'B':0, 'C+':0, 'C':0, 'D+':0, 'E':0, 'F':0 }
      : { 'HP':0, 'P':0, 'AP':0, 'D':0, 'E':0 };
    var totalCount = 0, absentCount = 0;

    var msh = getSheet(MARKS_SHEET);
    if (msh) {
      var data = msh.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (parseInt(data[i][1], 10) !== eid) continue;
        var sid = parseInt(data[i][2], 10);
        var subjId = parseInt(data[i][3], 10);
        var obtained = parseFloat(data[i][4]) || 0;
        var maxM = parseFloat(data[i][5]) || 0;
        var isAbsent = String(data[i][7]) === '1';
        var grade = String(data[i][6] || (isAbsent ? 'AB' : computeGrade(obtained, maxM, isAbsent, gradeBand))).toUpperCase();

        totalCount++;
        if (isAbsent) absentCount++;
        else if (grades.hasOwnProperty(grade)) grades[grade]++;

        if (!subjectStats[subjId]) subjectStats[subjId] = {
          SubjectID: subjId,
          SubjectName: subjMap[subjId] ? subjMap[subjId].subjectName : '— deleted —',
          Total: 0, Sum: 0, Max: 0, Pass: 0, Absent: 0, Highest: 0, Lowest: 999999
        };
        var sub = subjectStats[subjId];
        sub.Total++;
        if (isAbsent) sub.Absent++;
        else {
          sub.Sum += obtained;
          sub.Max += maxM;
          if (obtained > sub.Highest) sub.Highest = obtained;
          if (obtained < sub.Lowest) sub.Lowest = obtained;
          var pct = maxM > 0 ? (obtained / maxM) * 100 : 0;
          if (pct >= passingPct) sub.Pass++;
        }

        if (!byStudent[sid]) byStudent[sid] = { Total: 0, Max: 0, AbsentCount: 0 };
        byStudent[sid].Max += maxM;
        if (isAbsent) byStudent[sid].AbsentCount++;
        else byStudent[sid].Total += obtained;
      }
    }

    var passedStudents = 0, failedStudents = 0, incompleteStudents = 0;
    var studentList = Object.keys(byStudent).map(function(k) { return byStudent[k]; });
    studentList.forEach(function(s) {
      if (s.AbsentCount > 0) incompleteStudents++;
      else {
        var pct = s.Max > 0 ? (s.Total / s.Max) * 100 : 0;
        if (pct >= passingPct) passedStudents++;
        else failedStudents++;
      }
    });

    var subjectArr = Object.keys(subjectStats).map(function(k) {
      var sub = subjectStats[k];
      var attempted = sub.Total - sub.Absent;
      sub.AvgPct = (attempted > 0 && sub.Max > 0) ? Math.round((sub.Sum / sub.Max) * 1000) / 10 : 0;
      sub.PassRate = attempted > 0 ? Math.round((sub.Pass / attempted) * 1000) / 10 : 0;
      if (sub.Lowest === 999999) sub.Lowest = 0;
      return sub;
    });
    subjectArr.sort(function(a, b) { return String(a.SubjectName).localeCompare(String(b.SubjectName)); });

    return {
      success: true,
      data: {
        exam: { ID: eid, Name: examRow[1], PassingPct: passingPct },
        gradeBand: gradeBand,
        grades: grades,
        absentCount: absentCount,
        totalMarkRecords: totalCount,
        students: { total: studentList.length, passed: passedStudents, failed: failedStudents, incomplete: incompleteStudents, passRate: studentList.length ? Math.round((passedStudents / studentList.length) * 1000) / 10 : 0 },
        subjects: subjectArr
      }
    };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

// class-wide marksheet for an exam: students × subjects matrix + ranks
function getExamClassMarksheet(examId, currentUser, currentRole) {
  try {
    if (!canReadMarks(currentRole)) return { success: false, message: 'Forbidden' };
    var eid = parseInt(examId, 10);
    if (isNaN(eid)) return { success: false, message: 'Invalid examId' };
    var examRow = getExamRow(eid);
    if (!examRow) return { success: false, message: 'Exam not found' };
    var classId = parseInt(examRow[3], 10);
    var passingPct = parseFloat(examRow[26]) || 50;
    var cmap = getClassesMap();
    var gradeBand = (cmap[classId] || {}).gradeBand || 'basic';

    var _role = String(currentRole).toLowerCase();
    var _scope = getViewerScope(currentUser, currentRole);
    if (!_scope.all) {
      if (_scope.classIds.indexOf(classId) === -1) return { success: false, message: 'Forbidden — own class only' };
      if ((_role === 'student' || _role === 'parent') && !(String(examRow[8]) === '1' || examRow[8] === 1)) return { success: false, message: 'Exam not published yet' };
    }

    // active students in class
    var ssh = getSheet(STUDENTS_SHEET);
    var students = [];
    if (ssh) {
      var sdata = ssh.getDataRange().getValues();
      for (var i = 1; i < sdata.length; i++) {
        if (String(sdata[i][36]) === '1') continue;
        if (parseInt(sdata[i][25], 10) !== classId) continue;
        // student/parent only see their own (own child's) row in the marksheet
        if (!_scope.all && _scope.studentIds.indexOf(parseInt(sdata[i][0], 10)) === -1) continue;
        var stat = String(sdata[i][35] || '').toLowerCase();
        if (stat === 'transferred' || stat === 'passed_out') continue;
        students.push({
          ID: sdata[i][0],
          AdmissionNumber: sdata[i][1],
          FullName: [sdata[i][2], sdata[i][3], sdata[i][4]].filter(function(x){return x;}).join(' '),
          RollNumber: sdata[i][26]
        });
      }
    }
    students.sort(function(a, b) { return String(a.RollNumber).localeCompare(String(b.RollNumber), undefined, { numeric: true }); });

    // class subjects
    var smap = getSubjectsMap();
    var subjects = [];
    Object.keys(smap).forEach(function(k) {
      if (parseInt(smap[k].classId, 10) === classId) {
        subjects.push({ ID: parseInt(k, 10), Name: smap[k].subjectName, Code: smap[k].subjectCode || '', MaxMarks: smap[k].maxMarks });
      }
    });
    subjects.sort(function(a, b) { return String(a.Name).localeCompare(String(b.Name)); });

    // marks lookup [studentId][subjectId]
    var marksMap = {};
    var msh = getSheet(MARKS_SHEET);
    if (msh) {
      var mdata = msh.getDataRange().getValues();
      for (var j = 1; j < mdata.length; j++) {
        if (parseInt(mdata[j][1], 10) !== eid) continue;
        var sid = parseInt(mdata[j][2], 10);
        var subjId = parseInt(mdata[j][3], 10);
        var obtained = parseFloat(mdata[j][4]);
        var maxM = parseFloat(mdata[j][5]) || 0;
        var isAbsent = String(mdata[j][7]) === '1';
        var grade = String(mdata[j][6] || (isAbsent ? 'AB' : computeGrade(obtained, maxM, isAbsent, gradeBand))).toUpperCase();
        if (!marksMap[sid]) marksMap[sid] = {};
        marksMap[sid][subjId] = {
          MarksObtained: isAbsent ? null : (isNaN(obtained) ? null : obtained),
          MaxMarks: maxM,
          IsAbsent: isAbsent,
          Grade: grade
        };
      }
    }

    var rows = students.map(function(s) {
      var total = 0, max = 0, absent = false;
      subjects.forEach(function(sub) {
        var m = (marksMap[s.ID] || {})[sub.ID];
        if (m) {
          if (m.IsAbsent) absent = true;
          else if (m.MarksObtained != null) total += m.MarksObtained;
          max += m.MaxMarks || 0;
        }
      });
      var pct = max > 0 ? Math.round((total / max) * 1000) / 10 : 0;
      return {
        Student: s,
        Marks: marksMap[s.ID] || {},
        Total: total,
        Max: max,
        Percentage: pct,
        IsAbsent: absent,
        Result: absent ? 'INCOMPLETE' : (pct >= passingPct ? 'PASS' : 'FAIL'),
        OverallGrade: absent ? 'AB' : computeGrade(total, max, false, gradeBand)
      };
    });

    var ranking = rows.filter(function(r) { return !r.IsAbsent; }).slice().sort(function(a, b) { return b.Percentage - a.Percentage; });
    ranking.forEach(function(r, i) { r.Rank = i + 1; });
    rows.forEach(function(r) { if (!r.Rank) r.Rank = 0; });

    return {
      success: true,
      data: {
        exam: { ID: eid, Name: examRow[1], Type: String(examRow[2] || '').toLowerCase(), AcademicYear: examRow[4], StartDate: toIso(examRow[5]).split('T')[0], EndDate: toIso(examRow[6]).split('T')[0], MaxPerSubject: parseFloat(examRow[7]) || 0, IsPublished: String(examRow[8]) === '1', Term: examRow[14] || '', PassingPct: passingPct, GradeBand: gradeBand },
        class: cmap[classId] ? { ID: classId, Label: cmap[classId].label } : { ID: classId, Label: '— deleted —' },
        subjects: subjects,
        rows: rows
      }
    };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

// ============== Teacher Drill-downs (action col helpers) ==============

// teacher's today schedule — uses canReadTimetable so all roles can see
function getTeacherTodaySchedule(teacherId, currentUser, currentRole) {
  try {
    if (!canReadTimetable(currentRole)) return { success: false, message: 'Forbidden' };
    var tid = parseInt(teacherId, 10);
    if (isNaN(tid)) return { success: false, message: 'Invalid teacherId' };
    var today = new Date();
    var dayName = DAY_LIST[today.getDay()];

    var ttSh = getSheet(TIMETABLE_SHEET);
    if (!ttSh) return { success: true, data: { entries: [], periods: [], dayName: dayName } };
    var ttData = ttSh.getDataRange().getValues();
    var cmap = getClassesMap(), smap = getSubjectsMap(), out = [];
    for (var i = 1; i < ttData.length; i++) {
      if (String(ttData[i][11]) === '1') continue;
      if (parseInt(ttData[i][5], 10) !== tid) continue;
      if (String(ttData[i][2] || '').toLowerCase() !== dayName) continue;
      var cid = parseInt(ttData[i][1], 10);
      var sbid = parseInt(ttData[i][4], 10);
      out.push({
        TimetableID: ttData[i][0],
        DayOfWeek: dayName,
        PeriodNumber: parseInt(ttData[i][3], 10) || 0,
        ClassID: cid,
        ClassLabel: cmap[cid] ? cmap[cid].label : '',
        SubjectID: sbid,
        SubjectName: smap[sbid] ? smap[sbid].subjectName : '',
        SubjectCode: smap[sbid] ? smap[sbid].subjectCode : '',
        RoomNumber: ttData[i][6] || '',
        Mode: String(ttData[i][16] || 'offline').toLowerCase()
      });
    }
    out.sort(function(a, b) { return a.PeriodNumber - b.PeriodNumber; });

    var periods = getAllPeriods(currentUser, currentRole);
    return { success: true, data: { entries: out, periods: periods.success ? periods.data : [], dayName: dayName } };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

// per-teacher assignments (class+subject join)
function getTeacherAssignments(teacherId, currentUser, currentRole) {
  try {
    if (!canReadAssignments(currentRole)) return { success: false, message: 'Forbidden' };
    var tid = parseInt(teacherId, 10);
    if (isNaN(tid)) return { success: false, message: 'Invalid teacherId' };
    var ash = getSheet(ASSIGNMENTS_SHEET);
    if (!ash) return { success: true, data: [] };
    var cmap = getClassesMap(), smap = getSubjectsMap();
    var data = ash.getDataRange().getValues(), out = [];
    var totalPeriodsPerWeek = 0;
    var classSet = {}, subjectSet = {};
    for (var i = 1; i < data.length; i++) {
      if (parseInt(data[i][1], 10) !== tid) continue;
      var cid = parseInt(data[i][2], 10);
      var sid = parseInt(data[i][3], 10);
      var ppw = parseInt(data[i][8], 10) || 0;
      totalPeriodsPerWeek += ppw;
      classSet[cid] = true;
      subjectSet[sid] = true;
      out.push({
        ID: data[i][0],
        ClassID: cid,
        ClassLabel: cmap[cid] ? cmap[cid].label : '— deleted class —',
        SubjectID: sid,
        SubjectName: smap[sid] ? smap[sid].subjectName : '— deleted subject —',
        SubjectCode: smap[sid] ? smap[sid].subjectCode : '',
        AcademicYear: data[i][4] || '',
        IsClassTeacher: String(data[i][5]) === '1' || data[i][5] === 1 || data[i][5] === true,
        PeriodsPerWeek: ppw
      });
    }
    out.sort(function(a, b) { return String(a.ClassLabel).localeCompare(String(b.ClassLabel)); });
    return {
      success: true,
      data: out,
      summary: {
        total: out.length,
        classes: Object.keys(classSet).length,
        subjects: Object.keys(subjectSet).length,
        periodsPerWeek: totalPeriodsPerWeek
      }
    };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

// teacher's recent logbook entries (last N days, defaults 30)
function getTeacherRecentLogbook(teacherId, days, currentUser, currentRole) {
  try {
    if (!canReadLogbook(currentRole)) return { success: false, message: 'Forbidden' };
    var tid = parseInt(teacherId, 10);
    if (isNaN(tid)) return { success: false, message: 'Invalid teacherId' };
    var n = parseInt(days, 10) || 30;
    var cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - n);
    var cutoffStr = cutoff.toISOString().split('T')[0];

    var sh = getSheet(TEACHING_LOGBOOK_SHEET);
    if (!sh) return { success: true, data: [] };
    var cmap = getClassesMap(), smap = getSubjectsMap(), umap = getUsersMap();
    var data = sh.getDataRange().getValues(), out = [];
    for (var i = 1; i < data.length; i++) {
      if (parseInt(data[i][1], 10) !== tid) continue;
      var d = toIso(data[i][4]).split('T')[0];
      if (!d || d < cutoffStr) continue;
      out.push(rowToLogbook(data[i], cmap, smap, umap, false));
    }
    out.sort(function(a, b) { return String(b.LogDate).localeCompare(String(a.LogDate)); });
    return { success: true, data: out, range: { from: cutoffStr, days: n } };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

// admin: reset any user's password to a new value (plain per Apps Script convention)
function adminResetUserPassword(userId, newPassword, currentUser, currentRole) {
  try {
    if (!isAdmin(currentRole)) return { success: false, message: 'Forbidden — admin only' };
    var uid = parseInt(userId, 10);
    if (isNaN(uid)) return { success: false, message: 'Invalid user id' };
    var pwd = String(newPassword || '').trim();
    if (pwd.length < 6) return { success: false, message: 'New password must be at least 6 characters' };

    var sh = getSheet(USERS_SHEET);
    if (!sh) return { success: false, message: 'Users sheet not found' };
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (parseInt(data[i][0], 10) !== uid) continue;
      if (String(data[i][16]) === '1') return { success: false, message: 'User is deleted' };
      sh.getRange(i + 1, 5).setValue(pwd);   // col 5 = Password
      sh.getRange(i + 1, 22).setValue(nowIso()); // col 22 = UpdatedAt
      sh.getRange(i + 1, 23).setValue(currentUser || ''); // col 23 = UpdatedBy
      addLog(currentUser, 'Password Reset', 'Admin reset password for user #' + uid + ' (' + (data[i][1] || '') + ')');
      return { success: true, message: 'Password reset successfully' };
    }
    return { success: false, message: 'User not found' };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

// per-student exam results across all marks rows
function getStudentResults(studentId, currentUser, currentRole) {
  try {
    if (!canReadMarks(currentRole)) return { success: false, message: 'Forbidden — no access' };
    var sid = parseInt(studentId, 10);
    if (isNaN(sid)) return { success: false, message: 'Invalid student id' };
    var _scope = getViewerScope(currentUser, currentRole);
    if (!_scope.all && _scope.studentIds.indexOf(sid) === -1) return { success: false, message: 'Forbidden — own records only' };

    var students = getStudentsLite();
    var s = students[sid];
    if (!s) return { success: false, message: 'Student not found or deleted' };

    var msh = getSheet(MARKS_SHEET);
    if (!msh) return { success: true, data: { student: s, marks: [], summary: { count:0, attempted:0, absent:0, avgPercent:0 } } };

    // build exam map (name + type + year + dates + term + passing pct)
    var cmap = getClassesMap();
    var esh = getSheet(EXAMS_SHEET);
    var emap = {}, examsOut = {};
    if (esh) {
      var edata = esh.getDataRange().getValues();
      for (var e = 1; e < edata.length; e++) {
        if (String(edata[e][11]) === '1') continue; // soft-deleted exams
        var exId = edata[e][0];
        var exClassId = parseInt(edata[e][3], 10);
        var exObj = {
          ID: exId,
          Name: edata[e][1] || '',
          Type: String(edata[e][2] || '').toLowerCase(),
          AcademicYear: edata[e][4] || '',
          StartDate: toIso(edata[e][5]).split('T')[0],
          EndDate: toIso(edata[e][6]).split('T')[0],
          MaxPerSubject: parseFloat(edata[e][7]) || 0,
          IsPublished: String(edata[e][8]) === '1',
          Term: edata[e][14] || '',
          AssessmentType: String(edata[e][15] || '').toLowerCase(),
          ExamCode: edata[e][16] || '',
          PassingPct: parseFloat(edata[e][26]) || 0
        };
        emap[exId] = { name: exObj.Name, type: exObj.Type, year: exObj.AcademicYear, isPublished: exObj.IsPublished, gradeBand: (cmap[exClassId] || {}).gradeBand || 'basic' };
        examsOut[exId] = exObj;
      }
    }

    var smap = getSubjectsMap();
    var data = msh.getDataRange().getValues(), out = [];
    var totalPct = 0, attemptedCount = 0, absentCount = 0;

    for (var i = 1; i < data.length; i++) {
      if (parseInt(data[i][2], 10) !== sid) continue;
      var examId = data[i][1];
      var subjId = data[i][3];
      var ex = emap[examId];
      if (!ex) continue; // exam deleted/missing
      var subj = smap[subjId];
      var obtained = parseFloat(data[i][4]);
      var maxM = parseFloat(data[i][5]) || 0;
      var isAbsent = String(data[i][7]) === '1' || data[i][7] === true;
      var grade = data[i][6] || computeGrade(obtained, maxM, isAbsent, ex.gradeBand);
      var pct = (!isAbsent && maxM > 0) ? Math.round((obtained / maxM) * 1000) / 10 : 0;

      if (isAbsent) absentCount++;
      else if (!isNaN(obtained) && maxM > 0) {
        attemptedCount++;
        totalPct += pct;
      }

      out.push({
        ID: data[i][0],
        ExamID: examId,
        ExamName: ex.name,
        ExamType: ex.type,
        AcademicYear: ex.year,
        IsPublished: ex.isPublished,
        SubjectID: subjId,
        SubjectName: subj ? subj.subjectName : '— deleted subject —',
        SubjectCode: subj ? subj.subjectCode : '',
        MarksObtained: isAbsent ? null : (isNaN(obtained) ? null : obtained),
        MaxMarks: maxM,
        Percentage: pct,
        Grade: String(grade || '').toUpperCase(),
        IsAbsent: isAbsent,
        Status: String(data[i][19] || '').toLowerCase(),
        Remarks: data[i][8] || '',
        CreatedAt: toIso(data[i][10])
      });
    }

    // newest first
    out.sort(function(a, b) { return String(b.CreatedAt).localeCompare(String(a.CreatedAt)); });

    var avgPct = attemptedCount > 0 ? Math.round((totalPct / attemptedCount) * 10) / 10 : 0;

    return {
      success: true,
      data: {
        student: { ID: sid, FullName: s.fullName, AdmissionNumber: s.admNo, ClassLabel: s.classLabel },
        exams: examsOut,
        marks: out,
        summary: {
          count: out.length,
          attempted: attemptedCount,
          absent: absentCount,
          avgPercent: avgPct
        }
      }
    };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// ============== Ghana Basic/JHS Report Card ==============
// Builds the full termly report card for one student + one exam: per-subject SBA/Exam/Total/
// Grade/Position, grand totals, attendance, overall class position, JHS3 BECE aggregate
// (when applicable), and the free-text conduct/remarks block. Mirrors the Ghana report-card
// layout: SBA out of (MaxMarks - external share), Exam out of the remainder, Total, Grade,
// Position, Remarks; Grand Total row; Attendance/Total Score/Average/Subjects summary strip;
// Overall Class Position; JHS Aggregate for JHS classes; Conduct & Remarks; Grade Interpretation Key.
function getStudentReportCard(studentId, examId, currentUser, currentRole) {
  try {
    if (!canReadMarks(currentRole)) return { success: false, message: 'Forbidden — no access' };
    var sid = parseInt(studentId, 10), eid = parseInt(examId, 10);
    if (isNaN(sid) || isNaN(eid)) return { success: false, message: 'Invalid student or exam id' };
    var _scope = getViewerScope(currentUser, currentRole);
    if (!_scope.all && _scope.studentIds.indexOf(sid) === -1) return { success: false, message: 'Forbidden — own records only' };

    var examRow = getExamRow(eid);
    if (!examRow) return { success: false, message: 'Exam not found' };
    var classId = parseInt(examRow[3], 10);
    var isPublished = String(examRow[8]) === '1' || examRow[8] === 1;
    if (!_scope.all && (String(currentRole).toLowerCase() === 'student' || String(currentRole).toLowerCase() === 'parent') && !isPublished) {
      return { success: false, message: 'Exam not published yet' };
    }

    // student row
    var ssh = getSheet(STUDENTS_SHEET);
    if (!ssh) return { success: false, message: 'Students sheet not found' };
    var sdata = ssh.getDataRange().getValues();
    var studentRow = null;
    for (var i = 1; i < sdata.length; i++) {
      if (parseInt(sdata[i][0], 10) === sid && String(sdata[i][36]) !== '1') { studentRow = sdata[i]; break; }
    }
    if (!studentRow) return { success: false, message: 'Student not found or deleted' };
    if (parseInt(studentRow[25], 10) !== classId) return { success: false, message: 'Student is not enrolled in this exam\'s class' };

    // class row (need TotalStrength/CurriculumStage/GradeLevel directly — getClassesMap() doesn't carry these)
    var csh = getSheet(CLASSES_SHEET);
    var classRow = null;
    if (csh) {
      var cdata = csh.getDataRange().getValues();
      for (var c = 1; c < cdata.length; c++) {
        if (parseInt(cdata[c][0], 10) === classId && String(cdata[c][6]) !== '1') { classRow = cdata[c]; break; }
      }
    }
    if (!classRow) return { success: false, message: 'Class not found or deleted' };
    var classLabel = classRow[1] + ' ' + classRow[2];
    var curriculumStage = String(classRow[11] || 'lower_primary').toLowerCase();
    var isJhs = curriculumStage === 'jhs';
    var gradeBand = gradeBandForStage(curriculumStage);
    var examType = String(examRow[2] || '').toLowerCase();
    var isSplitScore = examType === 'end_of_term'; // SBA + Exam columns vs a single Score column
    var sbaMax = parseFloat(examRow[29]) || 0, examMax = parseFloat(examRow[30]) || 0;

    // active students in this class (for class size + overall position)
    var classStudents = [];
    for (var k = 1; k < sdata.length; k++) {
      if (String(sdata[k][36]) === '1') continue;
      if (parseInt(sdata[k][25], 10) !== classId) continue;
      var stat = String(sdata[k][35] || '').toLowerCase();
      if (stat === 'transferred' || stat === 'passed_out') continue;
      classStudents.push(sdata[k][0]);
    }
    var classSize = classStudents.length;

    // subjects in this class (raw read — need IsOptional for BECE aggregate, not exposed by getSubjectsMap)
    var subSh = getSheet(SUBJECTS_SHEET);
    var subjects = [];
    if (subSh) {
      var subData = subSh.getDataRange().getValues();
      for (var sIdx = 1; sIdx < subData.length; sIdx++) {
        if (String(subData[sIdx][5]) === '1') continue;
        if (parseInt(subData[sIdx][3], 10) !== classId) continue;
        subjects.push({
          ID: subData[sIdx][0],
          SubjectName: subData[sIdx][1],
          SubjectCode: subData[sIdx][2],
          MaxMarks: parseFloat(subData[sIdx][4]) || 100,
          IsOptional: String(subData[sIdx][15]) === '1'
        });
      }
    }
    subjects.sort(function(a, b) { return String(a.SubjectName).localeCompare(String(b.SubjectName)); });

    // all marks for this exam (every student, every subject) — needed for per-subject positions + class totals
    var msh = getSheet(MARKS_SHEET);
    var marksByStudentSubject = {}; // studentId -> subjectId -> row
    var subjectAllScores = {};      // subjectId -> [{studentId, total, absent}]
    var studentExamTotals = {};     // studentId -> { total, max, absent }
    if (msh) {
      var mdata = msh.getDataRange().getValues();
      for (var m = 1; m < mdata.length; m++) {
        if (parseInt(mdata[m][1], 10) !== eid) continue;
        var mSid = parseInt(mdata[m][2], 10);
        if (classStudents.indexOf(mSid) === -1) continue;
        var mSubId = parseInt(mdata[m][3], 10);
        var mObtained = parseFloat(mdata[m][4]);
        var mMax = parseFloat(mdata[m][5]) || 0;
        var mAbsent = String(mdata[m][7]) === '1';
        var mInternal = parseFloat(mdata[m][14]) || 0;
        var mExternal = parseFloat(mdata[m][15]) || 0;

        if (!marksByStudentSubject[mSid]) marksByStudentSubject[mSid] = {};
        marksByStudentSubject[mSid][mSubId] = {
          MarksObtained: mAbsent ? null : (isNaN(mObtained) ? null : mObtained),
          MaxMarks: mMax, IsAbsent: mAbsent, Internal: mInternal, External: mExternal
        };

        if (!subjectAllScores[mSubId]) subjectAllScores[mSubId] = [];
        subjectAllScores[mSubId].push({ studentId: mSid, total: mAbsent ? -1 : (mObtained || 0), absent: mAbsent });

        if (!studentExamTotals[mSid]) studentExamTotals[mSid] = { total: 0, max: 0, absent: false };
        if (mAbsent) studentExamTotals[mSid].absent = true;
        else studentExamTotals[mSid].total += (mObtained || 0);
        studentExamTotals[mSid].max += mMax;
      }
    }

    // per-subject positions (standard competition ranking: ties share rank, absentees unranked)
    var subjectPositions = {}; // subjectId -> { studentId -> position }
    Object.keys(subjectAllScores).forEach(function(subId) {
      var arr = subjectAllScores[subId].filter(function(r) { return !r.absent; }).slice();
      arr.sort(function(a, b) { return b.total - a.total; });
      var lastScore = null, lastRank = 0, count = 0, posMap = {};
      arr.forEach(function(r) {
        count++;
        if (lastScore === null || r.total !== lastScore) { lastRank = count; lastScore = r.total; }
        posMap[r.studentId] = lastRank;
      });
      subjectPositions[subId] = posMap;
    });

    // overall class position (by exam total across all subjects)
    var totalsArr = Object.keys(studentExamTotals)
      .filter(function(k) { return !studentExamTotals[k].absent; })
      .map(function(k) { return { studentId: parseInt(k, 10), total: studentExamTotals[k].total }; });
    totalsArr.sort(function(a, b) { return b.total - a.total; });
    var overallPosMap = {}, lastT = null, lastR = 0, cnt = 0;
    totalsArr.forEach(function(r) {
      cnt++;
      if (lastT === null || r.total !== lastT) { lastR = cnt; lastT = r.total; }
      overallPosMap[r.studentId] = lastR;
    });

    // this student's subject rows
    var mySubjects = marksByStudentSubject[sid] || {};
    var subjectRows = [], grandSba = 0, grandExam = 0, grandTotal = 0, subjectsWithMarks = 0;
    var beceInput = [];
    subjects.forEach(function(sub) {
      var m = mySubjects[sub.ID];
      var row = {
        SubjectID: sub.ID, SubjectName: sub.SubjectName, SubjectCode: sub.SubjectCode,
        SBA: 0, Exam: 0, Total: null, MaxMarks: sub.MaxMarks, Grade: '', Remarks: '', Position: '', IsAbsent: false
      };
      if (m) {
        row.IsAbsent = m.IsAbsent;
        row.SBA = m.Internal || 0;
        row.Exam = m.External || 0;
        row.Total = m.IsAbsent ? null : m.MarksObtained;
        row.MaxMarks = m.MaxMarks || sub.MaxMarks;
        var grade = m.IsAbsent ? 'AB' : computeGrade(m.MarksObtained, row.MaxMarks, false, gradeBand);
        row.Grade = grade;
        row.Remarks = sbaGradeDescriptor(grade, gradeBand);
        row.Position = (!m.IsAbsent && subjectPositions[sub.ID] && subjectPositions[sub.ID][sid]) ? subjectPositions[sub.ID][sid] : '';
        if (!m.IsAbsent) {
          grandSba += row.SBA; grandExam += row.Exam; grandTotal += (row.Total || 0);
          subjectsWithMarks++;
          var pct = row.MaxMarks > 0 ? (row.Total / row.MaxMarks) * 100 : 0;
          beceInput.push({ subjectName: sub.SubjectName, isOptional: sub.IsOptional, pct: pct });
        }
      }
      subjectRows.push(row);
    });
    var average = subjectsWithMarks > 0 ? Math.round(grandTotal / subjectsWithMarks) : 0;

    // attendance — present/total school days for the class from the academic-year start through the exam's end date
    var settingsRes = getSchoolSettings();
    var ayStart = (settingsRes.data && settingsRes.data.AcademicYearStartDate) ? settingsRes.data.AcademicYearStartDate.split('T')[0] : (String(examRow[4] || '').split('-')[0] + '-09-01');
    var examEnd = toIso(examRow[6]).split('T')[0];
    var attendance = { present: 0, total: 0 };
    var ash = getSheet(ATTENDANCE_SHEET);
    if (ash) {
      var adata = ash.getDataRange().getValues();
      for (var a = 1; a < adata.length; a++) {
        if (parseInt(adata[a][1], 10) !== classId) continue;
        var dOnly = toIso(adata[a][2]).split('T')[0];
        if (!dOnly || dOnly < ayStart || dOnly > examEnd) continue;
        if (String(adata[a][3] || '').toLowerCase() !== 'daily') continue; // report card uses whole-day attendance only
        var jsonObj = parseAttendanceJson(adata[a][6]);
        var entry = jsonObj[sid] || jsonObj[String(sid)];
        if (!entry) continue;
        attendance.total++;
        var st = String(entry.status || '').toLowerCase();
        if (st === 'present' || st === 'late') attendance.present++;
      }
    }

    // JHS3 BECE aggregate (best 6: 4 core + best 2 electives) — only meaningful once the class has enough graded subjects
    var beceAggregate = isJhs ? computeBeceAggregate(beceInput) : null;

    // free-text conduct/remarks for this student+exam
    var remarks = { InterestTalent: '', Conduct: '', AttitudeToWork: '', ClassTeacherRemark: '', HeadmasterRemark: '', PromotionStatus: '' };
    var rrsh = getSheet(REPORT_REMARKS_SHEET);
    if (rrsh) {
      var rrdata = rrsh.getDataRange().getValues();
      for (var r2 = 1; r2 < rrdata.length; r2++) {
        if (parseInt(rrdata[r2][1], 10) === sid && parseInt(rrdata[r2][2], 10) === eid) {
          remarks = {
            InterestTalent: rrdata[r2][3] || '', Conduct: rrdata[r2][4] || '', AttitudeToWork: rrdata[r2][5] || '',
            ClassTeacherRemark: rrdata[r2][6] || '', HeadmasterRemark: rrdata[r2][7] || '', PromotionStatus: rrdata[r2][8] || ''
          };
          break;
        }
      }
    }

    return {
      success: true,
      data: {
        student: {
          ID: sid,
          AdmissionNumber: studentRow[1],
          FullName: [studentRow[2], studentRow[3], studentRow[4]].filter(function(x) { return x; }).join(' '),
          Gender: studentRow[5],
          RollNumber: studentRow[26]
        },
        class: { ID: classId, Label: classLabel, Size: classSize, CurriculumStage: curriculumStage, IsJhs: isJhs, GradeBand: gradeBand },
        exam: {
          ID: eid, Name: examRow[1], Type: examType, Term: examRow[14] || '', AcademicYear: examRow[4],
          StartDate: toIso(examRow[5]).split('T')[0], EndDate: examEnd,
          IsPublished: isPublished, VacationDate: examRow[27] ? toIso(examRow[27]) : '', ReopeningDate: examRow[28] ? toIso(examRow[28]) : '',
          IsSplitScore: isSplitScore, SbaMaxMarks: sbaMax, ExamMaxMarks: examMax
        },
        subjects: subjectRows,
        grandTotal: { SBA: grandSba, Exam: grandExam, Total: grandTotal },
        average: average,
        subjectsCount: subjects.length,
        attendance: attendance,
        overallClassPosition: overallPosMap[sid] || '',
        beceAggregate: beceAggregate,
        remarks: remarks
      }
    };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// admin/teacher bulk preview & print — one report card per active student in the exam's class.
// Reuses getStudentReportCard() per student so RBAC/scope stays identical to the single-student view.
function getClassReportCards(classId, examId, currentUser, currentRole) {
  try {
    if (!canReadMarks(currentRole)) return { success: false, message: 'Forbidden — no access' };
    var cid = parseInt(classId, 10), eid = parseInt(examId, 10);
    if (isNaN(cid) || isNaN(eid)) return { success: false, message: 'Invalid class or exam id' };

    var ssh = getSheet(STUDENTS_SHEET);
    if (!ssh) return { success: false, message: 'Students sheet not found' };
    var sdata = ssh.getDataRange().getValues();
    var studentIds = [];
    for (var i = 1; i < sdata.length; i++) {
      if (String(sdata[i][36]) === '1') continue; // deleted
      if (parseInt(sdata[i][25], 10) === cid) studentIds.push(parseInt(sdata[i][0], 10));
    }
    if (!studentIds.length) return { success: false, message: 'No students found in this class' };

    var cards = [], errors = [];
    studentIds.forEach(function (sid) {
      var r = getStudentReportCard(sid, eid, currentUser, currentRole);
      if (r.success) cards.push(r.data);
      else errors.push({ studentId: sid, message: r.message });
    });

    return {
      success: true,
      data: cards,
      errors: errors,
      message: cards.length + ' report card(s) loaded' + (errors.length ? ', ' + errors.length + ' skipped' : '')
    };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// admin/teacher — upsert the free-text remarks block for one student's termly report card
function upsertReportRemarks(d, currentUser, currentRole) {
  try {
    var role = String(currentRole || '').toLowerCase();
    if (role !== 'admin' && role !== 'teacher') return { success: false, message: 'Forbidden — admin or teacher only' };
    var sid = parseInt(d.StudentID, 10), eid = parseInt(d.ExamID, 10);
    if (isNaN(sid) || isNaN(eid)) return { success: false, message: 'Invalid StudentID/ExamID' };

    var sh = getSheet(REPORT_REMARKS_SHEET);
    if (!sh) return { success: false, message: 'Report_Remarks sheet not found. Run setup() first.' };
    var data = sh.getDataRange().getValues();
    var foundRow = -1;
    for (var i = 1; i < data.length; i++) {
      if (parseInt(data[i][1], 10) === sid && parseInt(data[i][2], 10) === eid) { foundRow = i + 1; break; }
    }

    var promoEnum = ['', 'promoted', 'not_promoted', 'on_trial'];
    var promo = String(d.PromotionStatus || '').toLowerCase();
    if (promoEnum.indexOf(promo) === -1) return { success: false, message: 'Invalid PromotionStatus' };

    var vals = [
      String(d.InterestTalent || '').trim().slice(0, 300),
      String(d.Conduct || '').trim().slice(0, 300),
      String(d.AttitudeToWork || '').trim().slice(0, 300),
      String(d.ClassTeacherRemark || '').trim().slice(0, 500),
      String(d.HeadmasterRemark || '').trim().slice(0, 500),
      promo
    ];
    var ts = nowIso();

    if (foundRow === -1) {
      var id = nextClassId(sh); // generic max-id-plus-one helper, works on any sheet with numeric ID in col 1
      sh.appendRow([id, sid, eid].concat(vals, [ts, ts]));
    } else {
      sh.getRange(foundRow, 4, 1, 6).setValues([vals]);
      sh.getRange(foundRow, 11).setValue(ts);
    }

    addLog(currentUser, 'Report Remarks Saved', 'Student #' + sid + ' / exam #' + eid);
    return { success: true, message: 'Remarks saved' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// per-parent fee summary across ALL linked children (admin/clerk only)
function getParentFeesSummary(parentId, currentUser, currentRole) {
  try {
    var role = String(currentRole || '').toLowerCase();
    if (role !== 'admin' && role !== 'clerk') return { success: false, message: 'Forbidden — admin/clerk only' };

    var pid = parseInt(parentId, 10);
    if (isNaN(pid)) return { success: false, message: 'Invalid parent id' };

    // resolve parent header
    var parsh = getSheet(PARENTS_SHEET);
    if (!parsh) return { success: false, message: 'Parents sheet not found' };
    var pdata = parsh.getDataRange().getValues();
    var parent = null;
    for (var i = 1; i < pdata.length; i++) {
      if (parseInt(pdata[i][0], 10) !== pid) continue;
      if (String(pdata[i][10]) === '1') break; // soft-deleted
      parent = {
        ID: pid,
        FullName: pdata[i][1] || '',
        Email: pdata[i][2] || '',
        Mobile: pdata[i][3] || '',
        Relation: String(pdata[i][5] || '').toLowerCase(),
        WhatsAppNumber: pdata[i][17] || '',
        PhotoURL: pdata[i][26] || ''
      };
      break;
    }
    if (!parent) return { success: false, message: 'Parent not found or deleted' };

    // gather linked child IDs + primary flag
    var psh = getSheet(PARENT_STUDENTS_SHEET);
    var childIds = [], primaryMap = {};
    if (psh) {
      var lsdata = psh.getDataRange().getValues();
      for (var j = 1; j < lsdata.length; j++) {
        if (parseInt(lsdata[j][1], 10) !== pid) continue;
        var sid = parseInt(lsdata[j][2], 10);
        childIds.push(sid);
        primaryMap[sid] = String(lsdata[j][3]) === '1' || lsdata[j][3] === 1 || lsdata[j][3] === true;
      }
    }

    if (childIds.length === 0) {
      return { success: true, data: {
        parent: parent, children: [], payments: [],
        totals: { paid: 0, due: 0, lateFee: 0, discount: 0, paymentCount: 0 }
      }};
    }

    var students = getStudentsLite();
    var fmap = getFeeStructuresLite();
    var umap = getUsersMap();

    // seed per-child buckets
    var byChild = {};
    childIds.forEach(function(sid) {
      var s = students[sid];
      if (!s) return; // child deleted/missing — skip
      byChild[sid] = {
        StudentID: sid,
        FullName: s.fullName,
        AdmissionNumber: s.admNo,
        ClassLabel: s.classLabel,
        Status: s.status,
        IsPrimaryContact: !!primaryMap[sid],
        Paid: 0, Due: 0, LateFee: 0, Discount: 0, PaymentCount: 0,
        LastPaymentDate: ''
      };
    });

    // walk payments
    var allPayments = [];
    var totalPaid = 0, totalDue = 0, totalLate = 0, totalDiscount = 0;
    var fpsh = getSheet(FEE_PAYMENTS_SHEET);
    if (fpsh) {
      var fpdata = fpsh.getDataRange().getValues();
      for (var k = 1; k < fpdata.length; k++) {
        if (String(fpdata[k][15]) === '1') continue; // soft-deleted
        var psid = parseInt(fpdata[k][1], 10);
        if (!byChild[psid]) continue;
        var p = rowToPayment(fpdata[k], students, fmap, umap);
        allPayments.push(p);
        var c = byChild[psid];
        c.Paid += p.AmountPaid;
        c.Due += p.AmountDue;
        c.LateFee += p.LateFee;
        c.Discount += p.Discount;
        c.PaymentCount++;
        if (!c.LastPaymentDate || (p.PaymentDate && String(p.PaymentDate) > String(c.LastPaymentDate))) {
          c.LastPaymentDate = p.PaymentDate;
        }
        totalPaid += p.AmountPaid;
        totalDue += p.AmountDue;
        totalLate += p.LateFee;
        totalDiscount += p.Discount;
      }
    }
    allPayments.sort(function(a, b) { return String(b.PaymentDate).localeCompare(String(a.PaymentDate)); });

    // children list — primary first, then by name
    var children = Object.keys(byChild).map(function(k) { return byChild[k]; });
    children.sort(function(a, b) {
      if (a.IsPrimaryContact !== b.IsPrimaryContact) return a.IsPrimaryContact ? -1 : 1;
      return String(a.FullName || '').localeCompare(String(b.FullName || ''));
    });

    return {
      success: true,
      data: {
        parent: parent,
        children: children,
        payments: allPayments,
        totals: { paid: totalPaid, due: totalDue, lateFee: totalLate, discount: totalDiscount, paymentCount: allPayments.length }
      }
    };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// parents linked to a student (reverse of getParentStudentLinks)
function getStudentParents(studentId, currentUser, currentRole) {
  try {
    if (!canReadParentStudents(currentRole)) return { success: false, message: 'Forbidden — no access' };
    var sid = parseInt(studentId, 10);
    if (isNaN(sid)) return { success: false, message: 'Invalid student id' };
    var _scope = getViewerScope(currentUser, currentRole);
    if (!_scope.all && _scope.studentIds.indexOf(sid) === -1) return { success: false, message: 'Forbidden — own records only' };

    var psh = getSheet(PARENT_STUDENTS_SHEET);
    if (!psh) return { success: false, message: 'Parent_Students sheet not found' };

    var parsh = getSheet(PARENTS_SHEET);
    var pmap = {};
    if (parsh) {
      var pdata = parsh.getDataRange().getValues();
      for (var k = 1; k < pdata.length; k++) {
        if (String(pdata[k][10]) === '1') continue; // skip soft-deleted parents
        pmap[pdata[k][0]] = pdata[k];
      }
    }

    var data = psh.getDataRange().getValues(), out = [];
    for (var i = 1; i < data.length; i++) {
      if (parseInt(data[i][2], 10) !== sid) continue;
      var pid = parseInt(data[i][1], 10);
      var prow = pmap[pid];
      if (!prow) continue; // parent deleted/missing — hide link

      out.push({
        ID: data[i][0],
        ParentID: pid,
        StudentID: sid,
        IsPrimaryContact: String(data[i][3]) === '1' || data[i][3] === 1 || data[i][3] === true,
        CreatedAt: toIso(data[i][4]),
        // joined parent info
        FullName: prow[1] || '',
        Email: prow[2] || '',
        Mobile: prow[3] || '',
        Relation: String(prow[5] || '').toLowerCase(),
        Occupation: prow[6] || '',
        Address: prow[7] || '',
        Status: String(prow[9] || '').toLowerCase(),
        WhatsAppNumber: prow[17] || '',
        PhotoURL: prow[26] || ''
      });
    }
    // primary first, then by relation
    out.sort(function(a, b) {
      if (a.IsPrimaryContact !== b.IsPrimaryContact) return a.IsPrimaryContact ? -1 : 1;
      return String(a.Relation || '').localeCompare(String(b.Relation || ''));
    });
    return { success: true, data: out };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// ============== Monthly Fee Dues (auto-generated from admission month) ==============

var _MONTH_LABELS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function _ensureFeeDuesSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(FEE_DUES_SHEET);
  if (!sh) {
    sh = ss.insertSheet(FEE_DUES_SHEET);
    sh.appendRow(FEE_DUE_HEADERS);
    sh.getRange(1, 1, 1, FEE_DUE_HEADERS.length).setBackground('#001f3f').setFontColor('white').setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

// Generate monthly due slots for one student from admission month → current month.
// Idempotent — skips months that already have a due row for that fee structure.
function generateStudentDues(studentId, currentUser) {
  try {
    var sid = parseInt(studentId, 10);
    if (isNaN(sid)) return { success: false, message: 'Invalid student id' };
    var ssh = getSheet(STUDENTS_SHEET);
    if (!ssh) return { success: false, message: 'Students sheet not found' };
    var sdata = ssh.getDataRange().getValues();
    var student = null;
    for (var i = 1; i < sdata.length; i++) {
      if (parseInt(sdata[i][0], 10) === sid && String(sdata[i][36]) !== '1') { student = sdata[i]; break; }
    }
    if (!student) return { success: false, message: 'Student not found or deleted' };

    var classId = parseInt(student[25], 10);
    var admDate = student[24] ? new Date(student[24]) : null;
    if (!admDate || isNaN(admDate.getTime())) return { success: false, message: 'Student has no valid admission date' };

    var fsh = getSheet(FEE_STRUCTURE_SHEET);
    if (!fsh) return { success: false, message: 'Fee_Structure sheet not found' };
    var fsdata = fsh.getDataRange().getValues();
    var monthlyFees = [];
    for (var f = 1; f < fsdata.length; f++) {
      if (String(fsdata[f][9]) === '1') continue;
      if (parseInt(fsdata[f][1], 10) !== classId) continue;
      if (String(fsdata[f][8]) !== '1' && fsdata[f][8] !== 1 && fsdata[f][8] !== true) continue;
      if (String(fsdata[f][4] || '').toLowerCase() !== 'monthly') continue;
      monthlyFees.push({ id: fsdata[f][0], amount: parseFloat(fsdata[f][3]) || 0 });
    }
    if (monthlyFees.length === 0) return { success: true, generated: 0, message: 'No monthly fees configured for this class' };

    var dsh = _ensureFeeDuesSheet();
    var ddata = dsh.getDataRange().getValues();
    var existing = {};
    for (var d = 1; d < ddata.length; d++) {
      if (parseInt(ddata[d][1], 10) === sid) existing[ddata[d][2] + '|' + ddata[d][3]] = true;
    }

    var today = new Date();
    var year = admDate.getFullYear(), month = admDate.getMonth() + 1;
    var endY = today.getFullYear(), endM = today.getMonth() + 1;
    var ts = nowIso();
    var nextId = nextRowId(dsh);
    var newRows = [];

    while (year < endY || (year === endY && month <= endM)) {
      var ym = year + '-' + (month < 10 ? '0' : '') + month;
      var label = _MONTH_LABELS[month - 1] + ' ' + year;
      monthlyFees.forEach(function(fee) {
        if (existing[fee.id + '|' + ym]) return;
        newRows.push([nextId++, sid, fee.id, ym, label, fee.amount, 'pending', '', 0, '', ts, ts]);
      });
      month++;
      if (month > 12) { month = 1; year++; }
    }

    if (newRows.length > 0) {
      var startRow = dsh.getLastRow() + 1;
      dsh.getRange(startRow, 1, newRows.length, FEE_DUE_HEADERS.length).setValues(newRows);
      if (currentUser) addLog(currentUser, 'Dues Generated', newRows.length + ' due slot(s) for student #' + sid);
    }
    return { success: true, generated: newRows.length };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

// Admin-runnable backfill — covers all active students. Run once after creating Fee_Structure.
function backfillAllDues() {
  var ssh = getSheet(STUDENTS_SHEET);
  if (!ssh) throw new Error('Students sheet not found');
  var sd = ssh.getDataRange().getValues();
  var totalGenerated = 0, students = 0, skipped = 0;
  for (var i = 1; i < sd.length; i++) {
    if (String(sd[i][36]) === '1') continue;
    var st = String(sd[i][35] || '').toLowerCase();
    if (st !== 'active') { skipped++; continue; }
    var res = generateStudentDues(sd[i][0], 'System');
    if (res && res.success) { totalGenerated += (res.generated || 0); students++; }
  }
  var msg = 'Backfill done — ' + totalGenerated + ' dues generated for ' + students + ' student(s) (' + skipped + ' inactive skipped)';
  Logger.log(msg);
  return msg;
}

// Time-trigger entry point — generates dues for the current month for all active students
function generateDuesForCurrentMonth() { return backfillAllDues(); }

function _resolveSelfStudentId(currentUser) {
  var key = String(currentUser || '').trim().toLowerCase();
  var ssh = getSheet(STUDENTS_SHEET);
  if (!ssh) return null;
  var data = ssh.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][36]) === '1') continue;
    var admNo = String(data[i][1] || '').toLowerCase();
    var email = String(data[i][10] || '').toLowerCase();
    if (admNo === key || email === key) return data[i][0];
  }
  return null;
}

function _resolveParentChildrenIds(currentUser) {
  var key = String(currentUser || '').trim().toLowerCase();
  var psh = getSheet(PARENTS_SHEET);
  if (!psh) return [];
  var pdata = psh.getDataRange().getValues();
  var pid = null;
  for (var i = 1; i < pdata.length; i++) {
    if (String(pdata[i][10]) === '1') continue;
    var mob = String(pdata[i][3] || '').toLowerCase();
    var email = String(pdata[i][2] || '').toLowerCase();
    if (mob === key || email === key) { pid = pdata[i][0]; break; }
  }
  if (!pid) return [];
  var lsh = getSheet(PARENT_STUDENTS_SHEET);
  if (!lsh) return [];
  var ld = lsh.getDataRange().getValues();
  var ids = [];
  for (var j = 1; j < ld.length; j++) {
    if (parseInt(ld[j][1], 10) === pid) ids.push(parseInt(ld[j][2], 10));
  }
  return ids;
}

// One-stop visibility scope for the logged-in user.
//  - student → their own studentId + their own classId
//  - parent  → their linked children's ids + the distinct classes those children are in
//  - everyone else (admin/clerk/teacher/supervisor) → { all: true }
// Read endpoints use this to keep students/parents inside their own class/own records.
function getViewerScope(currentUser, currentRole) {
  var role = String(currentRole || '').toLowerCase();
  if (role !== 'student' && role !== 'parent') return { role: role, all: true, classIds: [], studentIds: [] };

  var studentIds = [];
  if (role === 'student') {
    var sid = _resolveSelfStudentId(currentUser);
    if (sid) studentIds.push(parseInt(sid, 10));
  } else {
    studentIds = _resolveParentChildrenIds(currentUser).map(function(x){ return parseInt(x, 10); });
  }

  var classIds = [];
  var ssh = getSheet(STUDENTS_SHEET);
  if (ssh && studentIds.length) {
    var data = ssh.getDataRange().getValues(), seen = {};
    for (var i = 1; i < data.length; i++) {
      if (studentIds.indexOf(parseInt(data[i][0], 10)) === -1) continue;
      var c = parseInt(data[i][25], 10);
      if (c && !seen[c]) { seen[c] = true; classIds.push(c); }
    }
  }
  return { role: role, all: false, classIds: classIds, studentIds: studentIds };
}

// Read monthly dues for a student — role-scoped (student=self, parent=linked-only, admin/clerk=any)
function getStudentMonthlyDues(studentId, currentUser, currentRole) {
  try {
    var role = String(currentRole || '').toLowerCase();
    var sid = parseInt(studentId, 10);
    if (isNaN(sid)) return { success: false, message: 'Invalid student id' };

    if (role === 'student') {
      var selfSid = _resolveSelfStudentId(currentUser);
      if (!selfSid || parseInt(selfSid, 10) !== sid) return { success: false, message: 'Forbidden — own data only' };
    } else if (role === 'parent') {
      var kids = _resolveParentChildrenIds(currentUser);
      if (kids.indexOf(sid) === -1) return { success: false, message: 'Forbidden — not your child' };
    } else if (role !== 'admin' && role !== 'clerk') {
      return { success: false, message: 'Forbidden — admin/clerk/student/parent only' };
    }

    // ensure latest month is generated before reading (admin/clerk only — others see what exists)
    if (role === 'admin' || role === 'clerk') generateStudentDues(sid, null);

    var dsh = _ensureFeeDuesSheet();
    var data = dsh.getDataRange().getValues();
    var fmap = getFeeStructuresLite();
    var out = [];
    var summary = { total:0, pending:0, paid:0, totalAmt:0, pendingAmt:0, paidAmt:0 };

    for (var i = 1; i < data.length; i++) {
      if (parseInt(data[i][1], 10) !== sid) continue;
      var amt = parseFloat(data[i][5]) || 0;
      var status = String(data[i][6] || 'pending').toLowerCase();
      var paidAmt = parseFloat(data[i][8]) || 0;
      var fsid = data[i][2];
      var fs = fmap[fsid];
      out.push({
        ID: data[i][0], StudentID: data[i][1], FeeStructureID: fsid,
        FeeCategory: fs ? fs.category : '— deleted fee —',
        BillingMonth: data[i][3], BillingMonthLabel: data[i][4],
        Amount: amt, Status: status,
        PaymentID: data[i][7] || '', PaidAmount: paidAmt,
        PaidDate: toIso(data[i][9]), CreatedAt: toIso(data[i][10])
      });
      summary.total++; summary.totalAmt += amt;
      if (status === 'paid') { summary.paid++; summary.paidAmt += paidAmt; }
      else { summary.pending++; summary.pendingAmt += (amt - paidAmt); }
    }
    out.sort(function(a, b) { return String(b.BillingMonth).localeCompare(String(a.BillingMonth)); });
    return { success: true, data: out, summary: summary };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}

// Pay multiple month dues at once — creates Fee_Payments row(s), marks dues paid, returns receipts.
// Groups by FeeStructureID — one Fee_Payments row per fee structure since amount maps to it.
function payMonthlyDues(payload, currentUser, currentRole) {
  try {
    var role = String(currentRole || '').toLowerCase();
    if (role !== 'admin' && role !== 'clerk') return { success: false, message: 'Forbidden — admin/clerk only' };

    var sid = parseInt(payload.StudentID, 10);
    if (isNaN(sid)) return { success: false, message: 'Invalid student id' };
    var dueIds = payload.DueIDs || [];
    if (!Array.isArray(dueIds) || dueIds.length === 0) return { success: false, message: 'Select at least one month to pay' };

    var paymentMode = String(payload.PaymentMode || '').toLowerCase();
    var allowedModes = ['cash','cheque','online','mobile_money','card','bank_transfer'];
    if (allowedModes.indexOf(paymentMode) === -1) return { success: false, message: 'Invalid payment mode' };

    var paymentDate = toIso(payload.PaymentDate || todayStr());
    var transactionRef = payload.TransactionReference || '';
    var remarks = payload.Remarks || '';
    var momoProvider3 = paymentMode === 'mobile_money' ? String(payload.MobileMoneyProvider || '').toLowerCase() : '';

    var students = getStudentsLite();
    var s = students[sid];
    if (!s) return { success: false, message: 'Student not found or deleted' };

    var dsh = _ensureFeeDuesSheet();
    var ddata = dsh.getDataRange().getValues();
    var dueIdSet = {};
    dueIds.forEach(function(d) { dueIdSet[String(d)] = true; });

    var groups = {};
    for (var i = 1; i < ddata.length; i++) {
      if (parseInt(ddata[i][1], 10) !== sid) continue;
      var dueId = ddata[i][0];
      if (!dueIdSet[String(dueId)]) continue;
      var status = String(ddata[i][6] || '').toLowerCase();
      if (status === 'paid') continue;
      var fsid = parseInt(ddata[i][2], 10);
      var amt = parseFloat(ddata[i][5]) || 0;
      if (!groups[fsid]) groups[fsid] = { totalAmount: 0, monthLabels: [], rows: [] };
      groups[fsid].totalAmount += amt;
      groups[fsid].monthLabels.push(ddata[i][4]);
      groups[fsid].rows.push({ rowIdx: i + 1, dueId: dueId, amount: amt });
    }
    var keys = Object.keys(groups);
    if (keys.length === 0) return { success: false, message: 'No pending dues found in selection' };

    var fpsh = getSheet(FEE_PAYMENTS_SHEET);
    if (!fpsh) return { success: false, message: 'Fee_Payments sheet not found' };
    var collectedById = getCurrentUserId(currentUser) || '';
    var ts = nowIso();
    var receipts = [], grandTotal = 0, allMonths = [];

    keys.forEach(function(fsid) {
      var g = groups[fsid];
      var newPaymentId = nextPaymentId(fpsh);
      var receiptNo = generateReceiptNumber(fpsh);
      fpsh.appendRow([
        newPaymentId, sid, parseInt(fsid, 10),
        g.totalAmount, 0, 0, 0,
        paymentDate, g.monthLabels.join(', '), paymentMode,
        transactionRef, receiptNo, 'paid', collectedById,
        remarks || ('Bulk payment for ' + g.monthLabels.length + ' month(s)'),
        '0', ts, ts, '', 0, '', '', momoProvider3
      ]);
      g.rows.forEach(function(r) {
        dsh.getRange(r.rowIdx, 7).setValue('paid');
        dsh.getRange(r.rowIdx, 8).setValue(newPaymentId);
        dsh.getRange(r.rowIdx, 9).setValue(r.amount);
        dsh.getRange(r.rowIdx, 10).setValue(ts);
        dsh.getRange(r.rowIdx, 12).setValue(ts);
      });
      receipts.push({ paymentId: newPaymentId, receiptNo: receiptNo, amount: g.totalAmount, months: g.monthLabels.slice() });
      grandTotal += g.totalAmount;
      allMonths = allMonths.concat(g.monthLabels);
    });

    addLog(currentUser, 'Multi-Month Payment', 'Student #' + sid + ' paid ' + grandTotal + ' for ' + allMonths.join(', '));
    return {
      success: true,
      message: allMonths.length + ' month(s) paid · receipt(s) generated',
      receipts: receipts,
      grandTotal: grandTotal,
      monthsPaid: allMonths
    };
  } catch (err) { return { success: false, message: 'Error: ' + err.toString() }; }
}
