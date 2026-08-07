
function doGet() {
  // Use a template (not a plain HTML file) so the admin's saved color theme
  // can be baked into the very first paint. Without this, the page always
  // renders the default green for a moment before the async getThemeConfig()
  // call resolves client-side and repaints it - a visible flash on load.
  const template = HtmlService.createTemplateFromFile('index');
  template.serverThemeColors = getThemeConfig().colors;
  return template.evaluate()
    .setTitle('Job Application Form')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function submitJobApplication(formData, fileName, fileData, coverLetterFileName, coverLetterFileData, passportPhotoFileName, passportPhotoFileData, certificateData) {
  try {
    const spreadsheetId = getSpreadsheetId();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Applications') || ss.insertSheet('Applications');
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const emailColumn = 5;
      const existingEmails = sheet.getRange(2, emailColumn, lastRow - 1, 1).getValues();
      const emailExists = existingEmails.some(row => row[0] === formData.email);

      if (emailExists) {
        return {
          status: 'error',
          message: 'You have already submitted an application with this email address. Only one application per email is allowed.'
        };
      }
    }
    let cvUrl = '';
    if (fileData && fileName) {
      try {
        cvUrl = uploadCVToDrive(fileData, fileName, formData.email);
        Logger.log(`CV uploaded successfully: ${cvUrl}`);
      } catch (uploadError) {
        Logger.log(`Error uploading CV: ${uploadError.toString()}`);
        cvUrl = 'Upload Failed: ' + uploadError.message;
      }
    }

    let coverLetterUrl = '';
    if (coverLetterFileData && coverLetterFileName) {
      try {
        coverLetterUrl = uploadCVToDrive(coverLetterFileData, coverLetterFileName, formData.email + '_coverletter');
        Logger.log(`Cover letter uploaded successfully: ${coverLetterUrl}`);
      } catch (uploadError) {
        Logger.log(`Error uploading cover letter: ${uploadError.toString()}`);
        coverLetterUrl = 'Upload Failed: ' + uploadError.message;
      }
    }

    let passportPhotoUrl = '';
    if (passportPhotoFileData && passportPhotoFileName) {
      try {
        passportPhotoUrl = uploadPassportPhoto(passportPhotoFileData, passportPhotoFileName, formData.email);
        Logger.log(`Passport photo uploaded successfully: ${passportPhotoUrl}`);
      } catch (uploadError) {
        Logger.log(`Error uploading passport photo: ${uploadError.toString()}`);
        passportPhotoUrl = 'Upload Failed: ' + uploadError.message;
      }
    }

    // Education certificate uploads - one optional file per education level
    // (SSC/HSC/Bachelor/HND/Postgraduate). Admin controls, per level, whether
    // the certificate upload shows on the form at all; when shown, the
    // client marks it required, so this is a best-effort upload keyed by
    // whatever levels the client actually sent data for.
    const certificateUrls = { ssc: '', hsc: '', bachelor: '', hnd: '', postgraduate: '' };
    if (certificateData) {
      ['ssc', 'hsc', 'bachelor', 'hnd', 'postgraduate'].forEach((level) => {
        const cert = certificateData[level];
        if (cert && cert.data && cert.fileName) {
          try {
            certificateUrls[level] = uploadCVToDrive(cert.data, cert.fileName, formData.email + '_' + level + '_certificate');
            Logger.log(`${level} certificate uploaded successfully: ${certificateUrls[level]}`);
          } catch (uploadError) {
            Logger.log(`Error uploading ${level} certificate: ${uploadError.toString()}`);
            certificateUrls[level] = 'Upload Failed: ' + uploadError.message;
          }
        }
      });
    }

    const timestamp = new Date().toISOString();
    const row = [
      timestamp,
      formData.applyingFor,
      formData.firstName,
      formData.lastName,
      formData.email,
      formData.mobile,
      formData.dob,
      formData.religion,
      formData.maritalStatus,
      formData.gender,
      formData.nationality,
      formData.currentAddress,
      formData.permanentAddress,
      // SSC
      formData.sscInstitute,
      formData.sscBoard,
      formData.sscMajor,
      formData.sscYear,
      formData.sscGrade,
      formData.hscInstitute,
      formData.hscBoard,
      formData.hscMajor,
      formData.hscYear,
      formData.hscGrade,
      formData.bachelorDegree,
      formData.bachelorInstitute,
      formData.bachelorMajor,
      formData.bachelorGrade,
      formData.postgraduateDegree,
      formData.postgraduateInstitute,
      formData.postgraduateMajor,
      formData.postgraduateGrade,
      // Experience
      formData.yearsOfExperience,
      formData.lastOrganisation,
      formData.lastDesignation,
      formData.joiningDate,
      formData.endDate,
      formData.currentlyWorking ? 'Yes' : 'No',
      // CV URL
      cvUrl,
      // HND (Higher National Diploma) - appended at the end to keep existing
      // column offsets (used elsewhere for Mobile/Experience/etc.) unchanged
      formData.hndProgramme || '',
      formData.hndInstitute || '',
      formData.hndMajor || '',
      formData.hndGrade || '',
      // Cover Letter URL
      coverLetterUrl,
      // Custom field values (admin-defined fields), stored as a JSON blob
      // keyed by field id since the set of fields is admin-configurable
      formData.customFieldValues ? JSON.stringify(formData.customFieldValues) : '',
      // Passport Photo URL
      passportPhotoUrl,
      // Education certificate URLs - appended at the end to keep existing
      // column offsets unchanged, same convention as HND/Cover Letter above
      certificateUrls.ssc,
      certificateUrls.hsc,
      certificateUrls.bachelor,
      certificateUrls.hnd,
      certificateUrls.postgraduate
    ];

    // Append to sheet
    sheet.appendRow(row);

    // Send confirmation email (optional)
    sendConfirmationEmail(formData.email, formData.firstName, formData);

    // Send confirmation SMS if SMS is enabled in Admin > Settings
    maybeSendAutoSms('confirmation', formData.mobile, {
      '[Candidate Name]': formData.firstName,
      '[Position]': formData.applyingFor || 'the position'
    });

    // Send confirmation WhatsApp message (branded PDF) if WhatsApp is enabled
    maybeSendAutoWhatsapp('confirmation', formData.mobile, formData.firstName, {
      '[Candidate Name]': formData.firstName,
      '[Position]': formData.applyingFor || 'the position'
    });

    return {
      status: 'success',
      message: 'Application submitted successfully!'
    };

  } catch (error) {
    console.error('Error submitting application:', error);
    return {
      status: 'error',
      message: 'Failed to submit application: ' + error.message
    };
  }
}

/**
 * Gets or initializes the active spreadsheet for storing applications
 * Uses the currently active spreadsheet instead of creating new ones
 * @returns {string} Spreadsheet ID
 */
function getSpreadsheetId() {
  try {
    // Use the active spreadsheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (!ss) {
      throw new Error('No active spreadsheet found. Please open a Google Sheet and run this script.');
    }

    const spreadsheetId = ss.getId();

    // Check if Applications sheet exists, if not create it
    let appSheet = ss.getSheetByName('Applications');

    if (!appSheet) {
      // Create Applications sheet in current spreadsheet
      appSheet = ss.insertSheet('Applications');

      // Set up headers
      const headers = [
        'Timestamp', 'Applying For',
        'First Name', 'Last Name', 'Email', 'Mobile', 'DOB', 'Religion',
        'Marital Status', 'Gender', 'Nationality', 'Current Address', 'Permanent Address',
        'SSC Institute', 'SSC Board', 'SSC Major', 'SSC Year', 'SSC Grade',
        'HSC Institute', 'HSC Board', 'HSC Major', 'HSC Year', 'HSC Grade',
        'Bachelor Degree', 'Bachelor Institute', 'Bachelor Major', 'Bachelor Grade',
        'Postgraduate Degree', 'Postgraduate Institute', 'Postgraduate Major', 'Postgraduate Grade',
        'Years of Experience', 'Last Organisation', 'Last Designation',
        'Joining Date', 'End Date', 'Currently Working', 'CV URL',
        'HND Programme', 'HND Institute', 'HND Major', 'HND Grade',
        'Cover Letter URL', 'Custom Field Values', 'Passport Photo URL',
        'SSC Certificate URL', 'HSC Certificate URL', 'Bachelor Certificate URL',
        'HND Certificate URL', 'Postgraduate Certificate URL'
      ];
      appSheet.appendRow(headers);

      // Format header row
      appSheet.getRange(1, 1, 1, headers.length)
        .setBackground('#2e7d32')
        .setFontColor('#ffffff')
        .setFontWeight('bold');

      appSheet.setFrozenRows(1);
      Logger.log('Applications sheet created in active spreadsheet');
    }

    return spreadsheetId;
  } catch (error) {
    Logger.log('Error in getSpreadsheetId: ' + error.toString());
    throw error;
  }
}

/**
 * Fetches all job applications from the spreadsheet
 * @returns {Array} Array of application objects
 */
function getAllApplications() {
  try {
    // Use active spreadsheet and Applications sheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Applications');

    if (!sheet) {
      Logger.log('Applications sheet not found');
      return [];
    }

    // Get all data (skip header row)
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      Logger.log('No applications found');
      return [];
    }

    const data = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();

    // Map data to objects
    const applications = data.map(row => ({
      timestamp: row[0],
      applyingFor: row[1],
      firstName: row[2],
      lastName: row[3],
      email: row[4],
      mobile: row[5],
      dob: row[6],
      religion: row[7],
      maritalStatus: row[8],
      gender: row[9],
      nationality: row[10],
      currentAddress: row[11],
      permanentAddress: row[12],
      // SSC Details
      sscInstitute: row[13],
      sscBoard: row[14],
      sscMajor: row[15],
      sscYear: row[16],
      sscGrade: row[17],
      // HSC Details
      hscInstitute: row[18],
      hscBoard: row[19],
      hscMajor: row[20],
      hscYear: row[21],
      hscGrade: row[22],
      // Bachelor Details
      bachelorDegree: row[23],
      bachelorInstitute: row[24],
      bachelorMajor: row[25],
      bachelorGrade: row[26],
      // Postgraduate Details
      postgraduateDegree: row[27],
      postgraduateInstitute: row[28],
      postgraduateMajor: row[29],
      postgraduateGrade: row[30],
      // Experience
      yearsOfExperience: row[31],
      lastOrganisation: row[32],
      lastDesignation: row[33],
      joiningDate: row[34],
      endDate: row[35],
      currentlyWorking: row[36],
      cvUrl: row[37],
      // HND (Higher National Diploma)
      hndProgramme: row[38],
      hndInstitute: row[39],
      hndMajor: row[40],
      hndGrade: row[41],
      coverLetterUrl: row[42],
      customFieldValues: (() => {
        try {
          return row[43] ? JSON.parse(row[43]) : {};
        } catch (e) {
          return {};
        }
      })(),
      passportPhotoUrl: row[44],
      // Education certificate URLs
      sscCertificateUrl: row[45],
      hscCertificateUrl: row[46],
      bachelorCertificateUrl: row[47],
      hndCertificateUrl: row[48],
      postgraduateCertificateUrl: row[49]
    }));

    // Sort by timestamp (newest first)
    applications.sort((a, b) => {
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return dateB - dateA;
    });

    Logger.log(`Retrieved ${applications.length} applications`);
    return applications;

  } catch (error) {
    Logger.log('Error fetching applications: ' + error.toString());
    throw error;
  }
}

/**
 * Fetches all applications with their status from CandidateStatus sheet
 * @returns {Array} Array of application objects with status
 */
function getAllApplicationsWithStatus() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Get all applications
    const applications = getAllApplications();

    // Get or create CandidateStatus sheet
    let statusSheet = ss.getSheetByName('CandidateStatus');
    if (!statusSheet) {
      statusSheet = ss.insertSheet('CandidateStatus');
      statusSheet.getRange(1, 1, 1, 4).setValues([['Email', 'Status', 'Updated At', 'Updated By']]);
      statusSheet.getRange(1, 1, 1, 4)
        .setBackground('#2e7d32')
        .setFontColor('#ffffff')
        .setFontWeight('bold');
      statusSheet.setFrozenRows(1);
    }

    // Get all status data
    const lastRow = statusSheet.getLastRow();
    const statusMap = new Map();

    if (lastRow > 1) {
      const statusData = statusSheet.getRange(2, 1, lastRow - 1, 2).getValues();
      statusData.forEach(row => {
        if (row[0]) statusMap.set(row[0], row[1]);
      });
    }

    // Add status to each application
    const appsWithStatus = applications.map(app => ({
      ...app,
      status: statusMap.get(app.email) || 'pending'
    }));

    return appsWithStatus;

  } catch (error) {
    Logger.log('Error fetching applications with status: ' + error.toString());
    throw error;
  }
}

/**
 * Sends confirmation email to the applicant
 * @param {string} email - Applicant's email address
 * @param {string} firstName - Applicant's first name
 */
function sendConfirmationEmail(email, firstName, formData) {
  try {
    const submissionTimeISO = new Date().toISOString();
    const submissionTimeReadable = formatISODate(submissionTimeISO);
    const subject = 'Job Application Received - Confirmation';
    const body = `
Dear ${firstName},

Thank you for submitting your job application. We have successfully received your application and our HR team will review it shortly.

Application Details:
- Submitted on: ${submissionTimeReadable}
- Reference: ${submissionTimeISO}

A copy of your submitted application is attached to this email for your records.

We will contact you if your profile matches our requirements. Please keep this email for your records.

Best regards,
HR Team
    `;

    let attachments = [];
    if (formData) {
      try {
        attachments = [buildApplicationPdf(formData)];
      } catch (pdfError) {
        // Never let a PDF-generation hiccup block the confirmation email itself
        Logger.log('Failed to generate application PDF: ' + pdfError.toString());
      }
    }

    sendBrandedEmail(email, subject, body, attachments);
  } catch (error) {
    console.error('Error sending confirmation email:', error);
  }
}

/**
 * Uploads CV file to Google Drive ASSETS folder
 * @param {Object} fileData - The file data in base64 format
 * @param {string} fileName - The name of the file
 * @param {string} applicantEmail - Email of the applicant
 * @returns {string} File URL
 */
function uploadCVToDrive(fileData, fileName, applicantEmail) {
  try {
    // Get or create ASSETS folder
    const folder = getCVFolder();

    // Decode base64 and create file
    const blob = Utilities.newBlob(
      Utilities.base64Decode(fileData.split(',')[1]),
      fileData.split(';')[0].split(':')[1],
      fileName
    );

    // Create file with ISO timestamp and applicant email in name
    const sanitizedEmail = applicantEmail.replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const newFileName = `${timestamp}_${sanitizedEmail}_${fileName}`;
    const file = folder.createFile(blob.setName(newFileName));

    // Set file description
    file.setDescription(`CV uploaded by ${applicantEmail} on ${new Date().toISOString()}`);

    Logger.log(`CV uploaded to ASSETS folder: ${newFileName}`);

    return file.getUrl();

  } catch (error) {
    Logger.log('Error uploading CV: ' + error.toString());
    throw error;
  }
}

/**
 * Uploads a passport-size photo to Drive. Unlike CVs/cover letters
 * (viewed one-off in a modal), photos need to render inline as
 * thumbnails wherever an applicant's info shows - so this explicitly
 * makes the file link-viewable and returns a direct thumbnail URL
 * (usable straight as an <img src>) instead of Drive's generic file
 * view page.
 * @param {string} fileData - base64 data URL
 * @param {string} fileName
 * @param {string} applicantEmail
 * @returns {string} Thumbnail URL
 */
function uploadPassportPhoto(fileData, fileName, applicantEmail) {
  try {
    const folder = getCVFolder();

    const blob = Utilities.newBlob(
      Utilities.base64Decode(fileData.split(',')[1]),
      fileData.split(';')[0].split(':')[1],
      fileName
    );

    const sanitizedEmail = applicantEmail.replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const newFileName = `${timestamp}_${sanitizedEmail}_${fileName}`;
    const file = folder.createFile(blob.setName(newFileName));

    file.setDescription(`Passport photo uploaded by ${applicantEmail} on ${new Date().toISOString()}`);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    Logger.log(`Passport photo uploaded to ASSETS folder: ${newFileName}`);

    return `https://drive.google.com/thumbnail?id=${file.getId()}&sz=w800`;

  } catch (error) {
    Logger.log('Error uploading passport photo: ' + error.toString());
    throw error;
  }
}

/**
 * Gets or creates the ASSETS NAME folder in Google Drive
 * @returns {GoogleAppsScript.Drive.Folder} ASSETS NAME folder
 */
function getCVFolder() {
  const folderName = 'ASSETS NAME';
  const folders = DriveApp.getFoldersByName(folderName);

  if (folders.hasNext()) {
    Logger.log('ASSETS NAME folder found');
    return folders.next();
  } else {
    Logger.log('Creating ASSETS NAME folder in Google Drive');
    const folder = DriveApp.createFolder(folderName);

    // Set folder description
    folder.setDescription('Job Application Assets - CVs and Documents uploaded by applicants');

    return folder;
  }
}

/**
 * Updates the job description in Settings sheet
 * @param {string} newDescription - The new job description
 * @returns {Object} Response object
 */
function updateJobDescription(newDescription) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Get or create Settings sheet
    let settingsSheet = ss.getSheetByName('Settings');
    if (!settingsSheet) {
      settingsSheet = ss.insertSheet('Settings');
      settingsSheet.getRange(1, 1, 1, 2).setValues([['Setting Name', 'Value']]);
      settingsSheet.getRange(1, 1, 1, 2)
        .setBackground('#2e7d32')
        .setFontColor('#ffffff')
        .setFontWeight('bold');
      settingsSheet.setFrozenRows(1);
      settingsSheet.setColumnWidth(1, 200);
      settingsSheet.setColumnWidth(2, 800);
    }

    // Check if job description row exists
    const lastRow = settingsSheet.getLastRow();
    let jobDescRow = -1;

    if (lastRow > 1) {
      const settingNames = settingsSheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (let i = 0; i < settingNames.length; i++) {
        if (settingNames[i][0] === 'JOB_DESCRIPTION') {
          jobDescRow = i + 2; // Add 2 because of header row and 0-based index
          break;
        }
      }
    }

    if (jobDescRow > 0) {
      // Update existing row
      settingsSheet.getRange(jobDescRow, 2).setValue(newDescription);
    } else {
      // Add new row
      settingsSheet.appendRow(['JOB_DESCRIPTION', newDescription]);
    }

    Logger.log('Job description updated in Settings sheet');
    return {
      status: 'success',
      message: 'Job description updated successfully'
    };
  } catch (error) {
    Logger.log('Error updating job description: ' + error.toString());
    return {
      status: 'error',
      message: 'Failed to update job description: ' + error.message
    };
  }
}

/**
 * Gets the current job description from Settings sheet
 * @returns {string} Current job description
 */
function getJobDescription() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const settingsSheet = ss.getSheetByName('Settings');

    if (!settingsSheet) {
      // Return default if Settings sheet doesn't exist
      return 'We are looking for a talented professional to join our team. The ideal candidate should have excellent skills and a passion for excellence.';
    }

    const lastRow = settingsSheet.getLastRow();
    if (lastRow <= 1) {
      return 'We are looking for a talented professional to join our team. The ideal candidate should have excellent skills and a passion for excellence.';
    }

    // Find job description row
    const data = settingsSheet.getRange(2, 1, lastRow - 1, 2).getValues();
    for (let i = 0; i < data.length; i++) {
      if (data[i][0] === 'JOB_DESCRIPTION') {
        return data[i][1] || 'We are looking for a talented professional to join our team. The ideal candidate should have excellent skills and a passion for excellence.';
      }
    }

    // Return default if not found
    return 'We are looking for a talented professional to join our team. The ideal candidate should have excellent skills and a passion for excellence.';
  } catch (error) {
    Logger.log('Error getting job description: ' + error.toString());
    return 'We are looking for a talented professional to join our team. The ideal candidate should have excellent skills and a passion for excellence.';
  }
}

/**
 * Formats ISO date string to human-readable format in Bangladesh Time (BST)
 * @param {string} isoString - ISO 8601 date string
 * @returns {string} Formatted date string
 */
function formatISODate(isoString) {
  try {
    const date = new Date(isoString);
    // Use Bangladesh Time (BST) - Asia/Dhaka timezone (UTC+6)
    return Utilities.formatDate(date, 'Asia/Dhaka', 'MMMM dd, yyyy HH:mm:ss z');
  } catch (error) {
    return isoString;
  }
}

/**
 * Authenticates admin user against Users sheet
 * @param {string} username - Admin username
 * @param {string} password - Admin password
 * @returns {Object} Authentication result
 */
function authenticateAdmin(username, password) {
  try {
    // Use active spreadsheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (!ss) {
      return {
        success: false,
        message: 'No active spreadsheet found'
      };
    }

    // Ensure Users sheet exists (creates with demo data if needed)
    getUsersSheetId();
    const sheet = ss.getSheetByName('Users');

    if (!sheet) {
      return {
        success: false,
        message: 'Users sheet not found'
      };
    }

    // Get all users data (skip header row)
    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues();

    // Find matching user
    for (let i = 0; i < data.length; i++) {
      const [storedUsername, storedPassword] = data[i];

      if (storedUsername === username && storedPassword === password) {
        // Log successful login with ISO timestamp
        const loginTime = new Date().toISOString();
        Logger.log(`Admin login successful - User: ${username}, Time: ${loginTime}`);

        return {
          success: true,
          user: {
            username: username,
            loginTime: loginTime
          }
        };
      }
    }

    // No match found
    Logger.log(`Failed login attempt for username: ${username}`);
    return {
      success: false,
      message: 'Invalid username or password'
    };

  } catch (error) {
    Logger.log('Authentication error: ' + error.toString());
    return {
      success: false,
      message: 'Authentication error: ' + error.message
    };
  }
}

/**
 * Gets or creates the Users sheet in the active spreadsheet
 * @returns {string} Spreadsheet ID
 */
function getUsersSheetId() {
  try {
    // Use the active spreadsheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (!ss) {
      throw new Error('No active spreadsheet found');
    }

    // Check if Users sheet exists
    let usersSheet = ss.getSheetByName('Users');

    if (!usersSheet) {
      // Create Users sheet in active spreadsheet
      usersSheet = ss.insertSheet('Users');

      // Set up headers
      usersSheet.getRange(1, 1, 1, 2).setValues([['Username', 'Password']]);

      // Add demo admin users
      const demoUsers = [
        ['admin', 'admin123'],
        ['hr_manager', 'hr2024'],
        ['recruiter', 'recruit@2024'],
        ['owner', 'owner@secure']
      ];
      usersSheet.getRange(2, 1, demoUsers.length, 2).setValues(demoUsers);

      // Format header row
      usersSheet.getRange(1, 1, 1, 2)
        .setBackground('#2e7d32')
        .setFontColor('#ffffff')
        .setFontWeight('bold');

      // Auto-resize columns
      usersSheet.autoResizeColumns(1, 2);
      usersSheet.setFrozenRows(1);

      Logger.log('Users sheet created with demo data in active spreadsheet');
    }

    return ss.getId();
  } catch (error) {
    Logger.log('Error in getUsersSheetId: ' + error.toString());
    throw error;
  }
}

/**
 * Updates candidate status in the CandidateStatus sheet
 * @param {string} email - Candidate's email
 * @param {string} newStatus - New status (pending/shortlisted/rejected)
 * @returns {Object} Response object
 */
function updateCandidateStatus(email, newStatus) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Get or create CandidateStatus sheet
    let statusSheet = ss.getSheetByName('CandidateStatus');
    if (!statusSheet) {
      statusSheet = ss.insertSheet('CandidateStatus');
      statusSheet.getRange(1, 1, 1, 4).setValues([['Email', 'Status', 'Updated At', 'Updated By']]);
      statusSheet.getRange(1, 1, 1, 4)
        .setBackground('#2e7d32')
        .setFontColor('#ffffff')
        .setFontWeight('bold');
      statusSheet.setFrozenRows(1);
    }

    // Find if email already exists
    const lastRow = statusSheet.getLastRow();
    let rowToUpdate = -1;

    if (lastRow > 1) {
      const emails = statusSheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (let i = 0; i < emails.length; i++) {
        if (emails[i][0] === email) {
          rowToUpdate = i + 2; // Add 2 because of header row and 0-based index
          break;
        }
      }
    }

    const timestamp = new Date().toISOString();
    const updatedBy = 'Admin'; // Could be enhanced to track actual admin user

    if (rowToUpdate > 0) {
      // Update existing record
      statusSheet.getRange(rowToUpdate, 2, 1, 3).setValues([[newStatus, timestamp, updatedBy]]);
    } else {
      // Add new record
      statusSheet.appendRow([email, newStatus, timestamp, updatedBy]);
    }

    Logger.log(`Status updated for ${email} to ${newStatus}`);
    return {
      success: true,
      message: 'Status updated successfully'
    };

  } catch (error) {
    Logger.log('Error updating candidate status: ' + error.toString());
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Sends email to a candidate
 * @param {string} candidateEmail - Recipient email
 * @param {string} subject - Email subject
 * @param {string} body - Email body
 * @returns {Object} Response object
 */
function sendEmailToCandidate(candidateEmail, subject, body) {
  try {
    sendBrandedEmail(candidateEmail, subject, body);

    // Log email in EmailLog sheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let logSheet = ss.getSheetByName('EmailLog');

    if (!logSheet) {
      logSheet = ss.insertSheet('EmailLog');
      logSheet.getRange(1, 1, 1, 5).setValues([['Timestamp', 'Recipient', 'Subject', 'Body', 'Sent By']]);
      logSheet.getRange(1, 1, 1, 5)
        .setBackground('#2e7d32')
        .setFontColor('#ffffff')
        .setFontWeight('bold');
      logSheet.setFrozenRows(1);
    }

    const timestamp = new Date().toISOString();
    logSheet.appendRow([timestamp, candidateEmail, subject, body, 'Admin']);

    Logger.log(`Email sent to ${candidateEmail}`);
    return {
      success: true,
      message: 'Email sent successfully'
    };

  } catch (error) {
    Logger.log('Error sending email: ' + error.toString());
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Schedules an interview and sends invite email
 * @param {Object} interviewData - Interview details
 * @returns {Object} Response object
 */
function scheduleInterview(interviewData) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Get or create Interviews sheet
    let interviewSheet = ss.getSheetByName('Interviews');
    if (!interviewSheet) {
      interviewSheet = ss.insertSheet('Interviews');
      interviewSheet.getRange(1, 1, 1, 7).setValues([['Scheduled At', 'Candidate Email', 'Interview Date (ISO)', 'Location', 'Interviewer', 'Notes', 'Status']]);
      interviewSheet.getRange(1, 1, 1, 7)
        .setBackground('#2e7d32')
        .setFontColor('#ffffff')
        .setFontWeight('bold');
      interviewSheet.setFrozenRows(1);
    }

    const timestamp = new Date().toISOString();

    // Extract time in 12-hour format from ISO date
    const interviewTime = formatTimeFromISO(interviewData.dateTime);

    // Format the interview date for display
    const interviewDateDisplay = interviewData.dateTime ?
      formatISODate(interviewData.dateTime) : '';

    interviewSheet.appendRow([
      timestamp,
      interviewData.candidateEmail,
      interviewData.dateTime, // ISO format: 2025-10-09T06:02:00.000Z
      interviewData.location,
      interviewData.interviewer,
      interviewData.notes,
      'Scheduled'
    ]);

    // Send interview invitation email
    const subject = 'Interview Invitation';
    const body = `Dear Candidate,

We are pleased to invite you for an interview.

Interview Details:
Date & Time: ${interviewDateDisplay} at ${interviewTime}
Location: ${interviewData.location}
Interviewer: ${interviewData.interviewer}

${interviewData.notes ? 'Additional Notes:\n' + interviewData.notes : ''}

Please confirm your availability for the scheduled time.

Best regards,
HR Team`;

    sendBrandedEmail(interviewData.candidateEmail, subject, body);

    // Send interview invitation SMS if SMS is enabled in Admin > Settings
    maybeSendAutoSms('interview', interviewData.candidatePhone, {
      '[Candidate Name]': interviewData.candidateName || '',
      '[Position]': interviewData.position || '',
      '[Date]': interviewDateDisplay,
      '[Time]': interviewTime,
      '[Location]': interviewData.location,
      '[Location/Meeting Link]': interviewData.location,
      '[Interviewer Name]': interviewData.interviewer
    });

    // Send interview invitation WhatsApp message (branded PDF) if enabled
    maybeSendAutoWhatsapp('interview', interviewData.candidatePhone, interviewData.candidateName, {
      '[Candidate Name]': interviewData.candidateName || '',
      '[Position]': interviewData.position || '',
      '[Date]': interviewDateDisplay,
      '[Time]': interviewTime,
      '[Location]': interviewData.location,
      '[Location/Meeting Link]': interviewData.location,
      '[Interviewer Name]': interviewData.interviewer
    });

    Logger.log(`Interview scheduled for ${interviewData.candidateEmail} on ${interviewData.dateTime}`);
    return {
      success: true,
      message: 'Interview scheduled and invitation sent'
    };

  } catch (error) {
    Logger.log('Error scheduling interview: ' + error.toString());
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Reschedules an existing interview and sends update notification email
 * @param {Object} interviewData - Interview details including original scheduled time
 * @returns {Object} Response object
 */
function rescheduleInterview(interviewData) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const interviewSheet = ss.getSheetByName('Interviews');

    if (!interviewSheet) {
      return {
        success: false,
        message: 'Interviews sheet not found'
      };
    }

    // Find the existing interview record
    const lastRow = interviewSheet.getLastRow();
    if (lastRow <= 1) {
      return {
        success: false,
        message: 'No interviews found to reschedule'
      };
    }

    const data = interviewSheet.getRange(2, 1, lastRow - 1, 7).getValues();
    let rowIndex = -1;

    // Find the interview by candidateEmail and originalScheduledAt
    for (let i = 0; i < data.length; i++) {
      if (data[i][1] === interviewData.candidateEmail &&
          data[i][0] === interviewData.originalScheduledAt) {
        rowIndex = i + 2; // Add 2 because of header row and 0-based index
        break;
      }
    }

    if (rowIndex === -1) {
      return {
        success: false,
        message: 'Interview not found'
      };
    }

    const timestamp = new Date().toISOString();

    // Extract time in 12-hour format from ISO date
    const interviewTime = formatTimeFromISO(interviewData.dateTime);

    // Format the interview date for display
    const interviewDateDisplay = interviewData.dateTime ?
      formatISODate(interviewData.dateTime) : '';

    // Update the existing interview record
    interviewSheet.getRange(rowIndex, 1, 1, 7).setValues([[
      timestamp, // Updated scheduled at timestamp
      interviewData.candidateEmail,
      interviewData.dateTime, // ISO format: 2025-10-09T06:02:00.000Z
      interviewData.location,
      interviewData.interviewer,
      interviewData.notes,
      'Rescheduled'
    ]]);

    // Send rescheduled interview notification email
    const subject = 'Interview Rescheduled - Updated Details';
    const body = `Dear Candidate,

Your interview has been rescheduled. Please find the updated details below:

Updated Interview Details:
Date & Time: ${interviewDateDisplay} at ${interviewTime}
Location: ${interviewData.location}
Interviewer: ${interviewData.interviewer}

${interviewData.notes ? 'Additional Notes:\n' + interviewData.notes : ''}

We apologize for any inconvenience. Please confirm your availability for the rescheduled time.

Best regards,
HR Team`;

    sendBrandedEmail(interviewData.candidateEmail, subject, body);

    // Send rescheduled interview SMS if SMS is enabled in Admin > Settings
    maybeSendAutoSms('interview', interviewData.candidatePhone, {
      '[Candidate Name]': interviewData.candidateName || '',
      '[Position]': interviewData.position || '',
      '[Date]': interviewDateDisplay,
      '[Time]': interviewTime,
      '[Location]': interviewData.location,
      '[Location/Meeting Link]': interviewData.location,
      '[Interviewer Name]': interviewData.interviewer
    });

    // Send interview invitation WhatsApp message (branded PDF) if enabled
    maybeSendAutoWhatsapp('interview', interviewData.candidatePhone, interviewData.candidateName, {
      '[Candidate Name]': interviewData.candidateName || '',
      '[Position]': interviewData.position || '',
      '[Date]': interviewDateDisplay,
      '[Time]': interviewTime,
      '[Location]': interviewData.location,
      '[Location/Meeting Link]': interviewData.location,
      '[Interviewer Name]': interviewData.interviewer
    });

    Logger.log(`Interview rescheduled for ${interviewData.candidateEmail} to ${interviewData.dateTime}`);
    return {
      success: true,
      message: 'Interview rescheduled and notification sent'
    };

  } catch (error) {
    Logger.log('Error rescheduling interview: ' + error.toString());
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Formats time from ISO date string to 12-hour AM/PM format
 * @param {string} isoString - ISO 8601 date string
 * @returns {string} Formatted time string (e.g., "10:30:00 AM")
 */
function formatTimeFromISO(isoString) {
  try {
    const date = new Date(isoString);
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;

    return `${displayHour}:${minutes}:${seconds} ${ampm}`;
  } catch (error) {
    return '';
  }
}

/**
 * Gets the URL of a CV file from Google Drive
 * @param {string} fileName - Name of the CV file
 * @returns {string} File URL or empty string if not found
 */
function getCVUrl(fileName) {
  try {
    if (!fileName) return '';

    const folder = getCVFolder();
    const files = folder.getFilesByName(fileName);

    if (files.hasNext()) {
      const file = files.next();
      // Return the shareable link
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      return file.getUrl();
    }

    // If exact name not found, try searching for files containing the email
    const searchQuery = fileName.split('_')[1] || fileName; // Try to extract email part
    const searchFiles = folder.searchFiles(`title contains '${searchQuery}'`);

    if (searchFiles.hasNext()) {
      const file = searchFiles.next();
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      return file.getUrl();
    }

    return '';

  } catch (error) {
    Logger.log('Error getting CV URL: ' + error.toString());
    return '';
  }
}

/**
 * Sends bulk emails to multiple candidates
 * @param {Array} emails - Array of email addresses
 * @param {string} subject - Email subject
 * @param {string} bodyTemplate - Email body template
 * @returns {Object} Response object
 */
function sendBulkEmails(emails, subject, bodyTemplate) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let logSheet = ss.getSheetByName('EmailLog');

    if (!logSheet) {
      logSheet = ss.insertSheet('EmailLog');
      logSheet.getRange(1, 1, 1, 5).setValues([['Timestamp', 'Recipient', 'Subject', 'Body', 'Sent By']]);
      logSheet.getRange(1, 1, 1, 5)
        .setBackground('#2e7d32')
        .setFontColor('#ffffff')
        .setFontWeight('bold');
      logSheet.setFrozenRows(1);
    }

    const timestamp = new Date().toISOString();
    let successCount = 0;
    let failedEmails = [];

    emails.forEach(email => {
      try {
        sendBrandedEmail(email, subject, bodyTemplate);
        logSheet.appendRow([timestamp, email, subject, bodyTemplate, 'Admin - Bulk']);
        successCount++;
      } catch (err) {
        failedEmails.push(email);
        Logger.log(`Failed to send email to ${email}: ${err.toString()}`);
      }
    });

    return {
      success: true,
      message: `Emails sent: ${successCount}/${emails.length}`,
      failedEmails: failedEmails
    };

  } catch (error) {
    Logger.log('Error sending bulk emails: ' + error.toString());
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Gets interview schedule for a candidate
 * @param {string} candidateEmail - Candidate's email
 * @returns {Object} Interview details or null
 */
function getInterviewDetails(candidateEmail) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const interviewSheet = ss.getSheetByName('Interviews');

    if (!interviewSheet) {
      return null;
    }

    const lastRow = interviewSheet.getLastRow();
    if (lastRow <= 1) return null;

    const data = interviewSheet.getRange(2, 1, lastRow - 1, 7).getValues();

    // Find the latest interview for this candidate
    for (let i = data.length - 1; i >= 0; i--) {
      if (data[i][1] === candidateEmail) {
        return {
          scheduledAt: data[i][0], // ISO timestamp when scheduled
          interviewDateTime: data[i][2], // ISO format: 2025-10-09T06:02:00.000Z
          interviewTime: formatTimeFromISO(data[i][2]), // Extract time from ISO: 10:30:00 AM
          location: data[i][3],
          interviewer: data[i][4],
          notes: data[i][5],
          status: data[i][6]
        };
      }
    }

    return null;

  } catch (error) {
    Logger.log('Error getting interview details: ' + error.toString());
    return null;
  }
}

/**
 * Gets all scheduled interviews
 * @returns {Array} Array of all interview objects
 */
function getAllInterviews() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const interviewSheet = ss.getSheetByName('Interviews');

    if (!interviewSheet) {
      Logger.log('Interviews sheet not found');
      return [];
    }

    const lastRow = interviewSheet.getLastRow();
    if (lastRow <= 1) {
      Logger.log('No interviews found');
      return [];
    }

    const data = interviewSheet.getRange(2, 1, lastRow - 1, 7).getValues();

    // Get all applications to match candidate names
    const applications = getAllApplications();
    const candidateMap = new Map();
    applications.forEach(app => {
      candidateMap.set(app.email, `${app.firstName} ${app.lastName}`);
    });

    // Map data to interview objects
    const interviews = data.map(row => ({
      scheduledAt: row[0], // ISO timestamp when scheduled
      candidateEmail: row[1],
      candidateName: candidateMap.get(row[1]) || 'Unknown',
      interviewDateTime: row[2], // ISO format: 2025-10-09T06:02:00.000Z
      interviewTime: formatTimeFromISO(row[2]), // Extract time from ISO: 10:30:00 AM
      location: row[3],
      interviewer: row[4],
      notes: row[5],
      status: row[6]
    }));

    // Sort by interview date (newest first)
    interviews.sort((a, b) => {
      const dateA = new Date(a.interviewDateTime);
      const dateB = new Date(b.interviewDateTime);
      return dateB - dateA;
    });

    Logger.log(`Retrieved ${interviews.length} interviews`);
    return interviews;

  } catch (error) {
    Logger.log('Error fetching interviews: ' + error.toString());
    return [];
  }
}

/**
 * Deletes an application from the Applications sheet
 * @param {string} candidateEmail - Email of the candidate to delete
 * @returns {Object} Response object
 */
function deleteApplication(candidateEmail) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const appSheet = ss.getSheetByName('Applications');

    if (!appSheet) {
      return {
        success: false,
        message: 'Applications sheet not found'
      };
    }

    // Find the row with this email
    const lastRow = appSheet.getLastRow();
    if (lastRow <= 1) {
      return {
        success: false,
        message: 'No applications found'
      };
    }

    const emailColumn = 5; // Email is in column E (5th column)
    const emails = appSheet.getRange(2, emailColumn, lastRow - 1, 1).getValues();

    let rowToDelete = -1;
    for (let i = 0; i < emails.length; i++) {
      if (emails[i][0] === candidateEmail) {
        rowToDelete = i + 2; // Add 2 because of header row and 0-based index
        break;
      }
    }

    if (rowToDelete === -1) {
      return {
        success: false,
        message: 'Application not found'
      };
    }

    // Delete the row
    appSheet.deleteRow(rowToDelete);

    // Also delete from CandidateStatus sheet if exists
    const statusSheet = ss.getSheetByName('CandidateStatus');
    if (statusSheet) {
      const statusLastRow = statusSheet.getLastRow();
      if (statusLastRow > 1) {
        const statusEmails = statusSheet.getRange(2, 1, statusLastRow - 1, 1).getValues();
        for (let i = 0; i < statusEmails.length; i++) {
          if (statusEmails[i][0] === candidateEmail) {
            statusSheet.deleteRow(i + 2);
            break;
          }
        }
      }
    }

    Logger.log(`Application deleted for ${candidateEmail}`);
    return {
      success: true,
      message: 'Application deleted successfully'
    };

  } catch (error) {
    Logger.log('Error deleting application: ' + error.toString());
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Updates an application in the Applications sheet
 * @param {Object} updateData - Object containing email and fields to update
 * @returns {Object} Response object
 */
function updateApplication(updateData) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const appSheet = ss.getSheetByName('Applications');

    if (!appSheet) {
      return {
        success: false,
        message: 'Applications sheet not found'
      };
    }

    // Find the row with this email
    const lastRow = appSheet.getLastRow();
    if (lastRow <= 1) {
      return {
        success: false,
        message: 'No applications found'
      };
    }

    const emailColumn = 5; // Email is in column E (5th column)
    const emails = appSheet.getRange(2, emailColumn, lastRow - 1, 1).getValues();

    let rowToUpdate = -1;
    for (let i = 0; i < emails.length; i++) {
      if (emails[i][0] === updateData.email) {
        rowToUpdate = i + 2; // Add 2 because of header row and 0-based index
        break;
      }
    }

    if (rowToUpdate === -1) {
      return {
        success: false,
        message: 'Application not found'
      };
    }

    // Update the fields
    // Column indices: Mobile=6, YearsOfExperience=32, LastOrganisation=33, LastDesignation=34
    if (updateData.mobile !== undefined) {
      appSheet.getRange(rowToUpdate, 6).setValue(updateData.mobile);
    }
    if (updateData.yearsOfExperience !== undefined) {
      appSheet.getRange(rowToUpdate, 32).setValue(updateData.yearsOfExperience);
    }
    if (updateData.lastOrganisation !== undefined) {
      appSheet.getRange(rowToUpdate, 33).setValue(updateData.lastOrganisation);
    }
    if (updateData.lastDesignation !== undefined) {
      appSheet.getRange(rowToUpdate, 34).setValue(updateData.lastDesignation);
    }

    // Update status in CandidateStatus sheet if status is provided
    if (updateData.status !== undefined) {
      const result = updateCandidateStatus(updateData.email, updateData.status);
      if (!result.success) {
        Logger.log('Warning: Failed to update candidate status: ' + result.message);
      }
    }

    Logger.log(`Application updated for ${updateData.email}`);
    return {
      success: true,
      message: 'Application updated successfully'
    };

  } catch (error) {
    Logger.log('Error updating application: ' + error.toString());
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Sets up demo data with 20 generic test applicants
 * Run this function manually to populate the system with test data
 * All data is fictional and for testing purposes only
 */
function setupDemoData() {
  Logger.log('=== Setting up Demo Data ===');

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Applications');

    if (!sheet) {
      throw new Error('Applications sheet not found. Please run setupSystem() first.');
    }

    // Check if headers exist, if not add them
    const lastRow = sheet.getLastRow();
    if (lastRow === 0) {
      const headers = [
        'Timestamp', 'Applying For',
        'First Name', 'Last Name', 'Email', 'Mobile', 'DOB', 'Religion',
        'Marital Status', 'Gender', 'Nationality', 'Current Address', 'Permanent Address',
        'SSC Institute', 'SSC Board', 'SSC Major', 'SSC Year', 'SSC Grade',
        'HSC Institute', 'HSC Board', 'HSC Major', 'HSC Year', 'HSC Grade',
        'Bachelor Degree', 'Bachelor Institute', 'Bachelor Major', 'Bachelor Grade',
        'Postgraduate Degree', 'Postgraduate Institute', 'Postgraduate Major', 'Postgraduate Grade',
        'Years of Experience', 'Last Organisation', 'Last Designation',
        'Joining Date', 'End Date', 'Currently Working', 'CV URL',
        'HND Programme', 'HND Institute', 'HND Major', 'HND Grade',
        'Cover Letter URL', 'Custom Field Values', 'Passport Photo URL',
        'SSC Certificate URL', 'HSC Certificate URL', 'Bachelor Certificate URL',
        'HND Certificate URL', 'Postgraduate Certificate URL'
      ];
      sheet.appendRow(headers);

      // Format header row
      sheet.getRange(1, 1, 1, headers.length)
        .setBackground('#2e7d32')
        .setFontColor('#ffffff')
        .setFontWeight('bold');

      sheet.setFrozenRows(1);
      Logger.log('Headers added to Applications sheet');
    }

    // Generic demo data for testing
    const demoApplicants = [
      {
        applyingFor: 'Software Engineer',
        firstName: 'Demo', lastName: 'Employee1',
        email: 'demo.employee1@example.com', mobile: '+1-000-111-0001',
        dob: '1998-03-15T00:00:00.000Z', religion: 'Not Specified', maritalStatus: 'Single',
        gender: 'Male', nationality: 'Country1',
        currentAddress: 'Address Line 1, Street 1, City 1, State 1',
        permanentAddress: 'Address Line 1, Street 1, City 1, State 1',
        sscInstitute: 'High School 1', sscBoard: 'Board 1', sscMajor: 'Science', sscYear: '2014', sscGrade: 'A',
        hscInstitute: 'College 1', hscBoard: 'Board 1', hscMajor: 'Computer Science', hscYear: '2016', hscGrade: 'A',
        bachelorDegree: 'B.Sc. Computer Science', bachelorInstitute: 'University 1', bachelorMajor: 'Computer Science', bachelorGrade: '3.8/4.0',
        postgraduateDegree: 'M.Sc. Software Engineering', postgraduateInstitute: 'University 2', postgraduateMajor: 'Software Engineering', postgraduateGrade: '3.9/4.0',
        yearsOfExperience: '5', lastOrganisation: 'Company 1', lastDesignation: 'Software Engineer',
        joiningDate: '2019-01-15T00:00:00.000Z', endDate: '2024-08-30T00:00:00.000Z', currentlyWorking: 'No'
      },
      {
        applyingFor: 'HR Manager',
        firstName: 'Demo', lastName: 'Employee2',
        email: 'demo.employee2@example.com', mobile: '+1-000-111-0002',
        dob: '1995-07-22T00:00:00.000Z', religion: 'Not Specified', maritalStatus: 'Married',
        gender: 'Female', nationality: 'Country1',
        currentAddress: 'Address Line 2, Street 2, City 1, State 1',
        permanentAddress: 'Address Line 2, Street 2, City 1, State 1',
        sscInstitute: 'High School 2', sscBoard: 'Board', sscMajor: 'Science', sscYear: '2011', sscGrade: 'A',
        hscInstitute: 'High School 2', hscBoard: 'Board', hscMajor: 'Pre-Medical', hscYear: '2013', hscGrade: 'A',
        bachelorDegree: 'BBA', bachelorInstitute: 'University 2', bachelorMajor: 'Human Resource Management', bachelorGrade: '3.7/4.0',
        postgraduateDegree: 'MBA', postgraduateInstitute: 'University 2', postgraduateMajor: 'HR Management', postgraduateGrade: '3.8/4.0',
        yearsOfExperience: '7', lastOrganisation: 'Company Country1', lastDesignation: 'HR Manager',
        joiningDate: '2017-03-01T00:00:00.000Z', endDate: '', currentlyWorking: 'Yes'
      },
      {
        applyingFor: 'Graphic Designer',
        firstName: 'Demo', lastName: 'Employee3',
        email: 'demo.employee3@example.com', mobile: '+1-000-111-0003',
        dob: '1997-11-10T00:00:00.000Z', religion: 'Not Specified', maritalStatus: 'Single',
        gender: 'Male', nationality: 'Country1',
        currentAddress: 'Address Line 3, Street 3, City 3, State 3',
        permanentAddress: 'Address Line 3B, Street 3B, City 6, State 6',
        sscInstitute: 'High School', sscBoard: 'Board', sscMajor: 'Arts', sscYear: '2013', sscGrade: 'A',
        hscInstitute: 'College 3', hscBoard: 'Board', hscMajor: 'Fine Arts', hscYear: '2015', hscGrade: 'A',
        bachelorDegree: 'B.Design', bachelorInstitute: 'University 3', bachelorMajor: 'Graphic Design', bachelorGrade: '3.6/4.0',
        postgraduateDegree: '', postgraduateInstitute: '', postgraduateMajor: '', postgraduateGrade: '',
        yearsOfExperience: '4', lastOrganisation: 'Company', lastDesignation: 'Senior Graphic Designer',
        joiningDate: '2020-06-01T00:00:00.000Z', endDate: '2024-09-15T00:00:00.000Z', currentlyWorking: 'No'
      },
      {
        applyingFor: 'Marketing Manager',
        firstName: 'Demo', lastName: 'Employee4',
        email: 'demo.employee4@example.com', mobile: '+1-000-111-0004',
        dob: '1994-05-18T00:00:00.000Z', religion: 'Not Specified', maritalStatus: 'Married',
        gender: 'Female', nationality: 'Country1',
        currentAddress: 'Address Line 4, Street 4, City 2, State 2',
        permanentAddress: 'Address Line 4, Street 4, City 2, State 2',
        sscInstitute: 'High School 4', sscBoard: 'Board', sscMajor: 'Science', sscYear: '2010', sscGrade: 'A+',
        hscInstitute: 'High School 4', hscBoard: 'Board', hscMajor: 'Pre-Engineering', hscYear: '2012', hscGrade: 'A',
        bachelorDegree: 'BBA', bachelorInstitute: 'University', bachelorMajor: 'Marketing', bachelorGrade: '3.9/4.0',
        postgraduateDegree: 'MBA', postgraduateInstitute: 'University', postgraduateMajor: 'Marketing', postgraduateGrade: '3.9/4.0',
        yearsOfExperience: '8', lastOrganisation: 'Company Country1', lastDesignation: 'Marketing Manager',
        joiningDate: '2016-01-10T00:00:00.000Z', endDate: '', currentlyWorking: 'Yes'
      },
      {
        applyingFor: 'Data Analyst',
        firstName: 'Demo', lastName: 'Employee5',
        email: 'demo.employee5@example.com', mobile: '+1-000-111-0005',
        dob: '1999-02-28T00:00:00.000Z', religion: 'Not Specified', maritalStatus: 'Single',
        gender: 'Male', nationality: 'Country1',
        currentAddress: 'Address Line 5, Street 5, City 4, State 4',
        permanentAddress: 'Address Line 5B, Street 5B, City 4, State 4',
        sscInstitute: 'High School 5', sscBoard: 'Board', sscMajor: 'Science', sscYear: '2015', sscGrade: 'A',
        hscInstitute: 'High School 5', hscBoard: 'Board', hscMajor: 'Pre-Engineering', hscYear: '2017', hscGrade: 'A+',
        bachelorDegree: 'B.Sc. Data Science', bachelorInstitute: 'University 5', bachelorMajor: 'Data Science', bachelorGrade: '3.7/4.0',
        postgraduateDegree: '', postgraduateInstitute: '', postgraduateMajor: '', postgraduateGrade: '',
        yearsOfExperience: '3', lastOrganisation: 'Company', lastDesignation: 'Data Analyst',
        joiningDate: '2021-07-01T00:00:00.000Z', endDate: '', currentlyWorking: 'Yes'
      },
      {
        applyingFor: 'Sales Executive',
        firstName: 'Demo', lastName: 'Employee6',
        email: 'demo.employee6@example.com', mobile: '+1-000-111-0006',
        dob: '1996-09-12T00:00:00.000Z', religion: 'Not Specified', maritalStatus: 'Single',
        gender: 'Female', nationality: 'Country1',
        currentAddress: 'Address Line 6, Street 6, City 2, State 2',
        permanentAddress: 'Address Line 6, Street 6, City 2, State 2',
        sscInstitute: 'High School 6', sscBoard: 'Board', sscMajor: 'Science', sscYear: '2012', sscGrade: 'A',
        hscInstitute: 'College 6', hscBoard: 'Board', hscMajor: 'Commerce', hscYear: '2014', hscGrade: 'A',
        bachelorDegree: 'BBA', bachelorInstitute: 'University', bachelorMajor: 'Marketing', bachelorGrade: '3.5/4.0',
        postgraduateDegree: '', postgraduateInstitute: '', postgraduateMajor: '', postgraduateGrade: '',
        yearsOfExperience: '6', lastOrganisation: 'Company', lastDesignation: 'Senior Sales Executive',
        joiningDate: '2018-04-15T00:00:00.000Z', endDate: '2024-07-20T00:00:00.000Z', currentlyWorking: 'No'
      },
      {
        applyingFor: 'Network Engineer',
        firstName: 'Demo', lastName: 'Employee7',
        email: 'demo.employee7@example.com', mobile: '+1-000-111-0007',
        dob: '1997-12-05T00:00:00.000Z', religion: 'Not Specified', maritalStatus: 'Single',
        gender: 'Male', nationality: 'Country1',
        currentAddress: 'Address Line 7, Street 7, City 1, State 1',
        permanentAddress: 'Address Line 7, Street 7, City 1, State 1',
        sscInstitute: 'High School 7', sscBoard: 'Board', sscMajor: 'Science', sscYear: '2013', sscGrade: 'A+',
        hscInstitute: 'College 7', hscBoard: 'Board', hscMajor: 'Pre-Engineering', hscYear: '2015', sscGrade: 'A+',
        bachelorDegree: 'B.E. Telecommunications', bachelorInstitute: 'University 7', bachelorMajor: 'Telecommunications', bachelorGrade: '3.6/4.0',
        postgraduateDegree: '', postgraduateInstitute: '', postgraduateMajor: '', postgraduateGrade: '',
        yearsOfExperience: '4', lastOrganisation: 'Company', lastDesignation: 'Network Engineer',
        joiningDate: '2020-02-01T00:00:00.000Z', endDate: '', currentlyWorking: 'Yes'
      },
      {
        applyingFor: 'Finance Manager',
        firstName: 'Demo', lastName: 'Employee8',
        email: 'demo.employee8@example.com', mobile: '+1-000-111-0008',
        dob: '1993-04-08T00:00:00.000Z', religion: 'Not Specified', maritalStatus: 'Married',
        gender: 'Female', nationality: 'Country1',
        currentAddress: 'Address Line 8, Street 8, City 2, State 2',
        permanentAddress: 'Address Line 8, Street 8, City 2, State 2',
        sscInstitute: 'High School 8', sscBoard: 'Board', sscMajor: 'Science', sscYear: '2009', sscGrade: 'A+',
        hscInstitute: 'High School 8', hscBoard: 'Board', hscMajor: 'Commerce', hscYear: '2011', sscGrade: 'A+',
        bachelorDegree: 'B.Com', bachelorInstitute: 'University 8', bachelorMajor: 'Accounting & Finance', bachelorGrade: '3.8/4.0',
        postgraduateDegree: 'MBA', postgraduateInstitute: 'University', postgraduateMajor: 'Finance', postgraduateGrade: '3.9/4.0',
        yearsOfExperience: '9', lastOrganisation: 'Company', lastDesignation: 'Finance Manager',
        joiningDate: '2015-03-01T00:00:00.000Z', endDate: '', currentlyWorking: 'Yes'
      },
      {
        applyingFor: 'Content Writer',
        firstName: 'Demo', lastName: 'Employee9',
        email: 'demo.employee9@example.com', mobile: '+1-000-111-0009',
        dob: '1998-08-20T00:00:00.000Z', religion: 'Not Specified', maritalStatus: 'Single',
        gender: 'Male', nationality: 'Country1',
        currentAddress: 'Address Line 9, Street 9, City 3, State 3',
        permanentAddress: 'Address Line 9, Street 9, City 3, State 3',
        sscInstitute: 'High School 9', sscBoard: 'Board', sscMajor: 'Arts', sscYear: '2014', sscGrade: 'A',
        hscInstitute: 'High School 9', hscBoard: 'Board', hscMajor: 'Humanities', hscYear: '2016', hscGrade: 'A',
        bachelorDegree: 'BA Mass Communication', bachelorInstitute: 'University', bachelorMajor: 'Journalism', bachelorGrade: '3.7/4.0',
        postgraduateDegree: '', postgraduateInstitute: '', postgraduateMajor: '', postgraduateGrade: '',
        yearsOfExperience: '4', lastOrganisation: 'Company', lastDesignation: 'Senior Content Writer',
        joiningDate: '2020-09-01T00:00:00.000Z', endDate: '2024-08-31T00:00:00.000Z', currentlyWorking: 'No'
      },
      {
        applyingFor: 'UI/UX Designer',
        firstName: 'Demo', lastName: 'Employee10',
        email: 'demo.employee10@example.com', mobile: '+1-000-111-0010',
        dob: '1996-01-14T00:00:00.000Z', religion: 'Not Specified', maritalStatus: 'Single',
        gender: 'Female', nationality: 'Country1',
        currentAddress: 'Address Line 10, Street 10, City 1, State 1',
        permanentAddress: 'Address Line 10, Street 10, City 1, State 1',
        sscInstitute: 'High School 10', sscBoard: 'Board', sscMajor: 'Arts', sscYear: '2012', sscGrade: 'A*',
        hscInstitute: 'High School 10', hscBoard: 'Board', hscMajor: 'Arts & Design', hscYear: '2014', hscGrade: 'A*',
        bachelorDegree: 'B.Design', bachelorInstitute: 'University 10', bachelorMajor: 'Communication Design', bachelorGrade: '3.8/4.0',
        postgraduateDegree: '', postgraduateInstitute: '', postgraduateMajor: '', postgraduateGrade: '',
        yearsOfExperience: '5', lastOrganisation: 'Company', lastDesignation: 'UI/UX Designer',
        joiningDate: '2019-05-01T00:00:00.000Z', endDate: '', currentlyWorking: 'Yes'
      },
      {
        applyingFor: 'Project Manager',
        firstName: 'Demo', lastName: 'Employee11',
        email: 'demo.employee11@example.com', mobile: '+1-000-111-0011',
        dob: '1992-06-25T00:00:00.000Z', religion: 'Not Specified', maritalStatus: 'Married',
        gender: 'Male', nationality: 'Country1',
        currentAddress: 'Address Line 11, Street 11, City 2, State 2',
        permanentAddress: 'Address Line 11, Street 11, City 2, State 2',
        sscInstitute: 'High School 11', sscBoard: 'Board', sscMajor: 'Science', sscYear: '2008', sscGrade: 'A*',
        hscInstitute: 'High School 11', hscBoard: 'Board', hscMajor: 'Mathematics', hscYear: '2010', hscGrade: 'A*',
        bachelorDegree: 'B.Sc. Civil Engineering', bachelorInstitute: 'University', bachelorMajor: 'Civil Engineering', bachelorGrade: '3.7/4.0',
        postgraduateDegree: 'MBA', postgraduateInstitute: 'University', postgraduateMajor: 'Project Management', postgraduateGrade: '3.8/4.0',
        yearsOfExperience: '10', lastOrganisation: 'Company', lastDesignation: 'Project Manager',
        joiningDate: '2014-01-15T00:00:00.000Z', endDate: '', currentlyWorking: 'Yes'
      },
      {
        applyingFor: 'Business Analyst',
        firstName: 'Demo', lastName: 'Employee12',
        email: 'demo.employee12@example.com', mobile: '+1-000-111-0012',
        dob: '1995-10-03T00:00:00.000Z', religion: 'Not Specified', maritalStatus: 'Single',
        gender: 'Female', nationality: 'Country1',
        currentAddress: 'Address Line 12, Street 12, City 4, State 4',
        permanentAddress: 'Address Line 12B, Street 12B, City 4, State 4',
        sscInstitute: 'High School 12', sscBoard: 'Board', sscMajor: 'Science', sscYear: '2011', sscGrade: 'A+',
        hscInstitute: 'High School 12', hscBoard: 'Board', hscMajor: 'Pre-Engineering', hscYear: '2013', hscGrade: 'A',
        bachelorDegree: 'B.Sc. Business Administration', bachelorInstitute: 'University 12', bachelorMajor: 'Business Administration', bachelorGrade: '3.6/4.0',
        postgraduateDegree: 'MS Business Analytics', postgraduateInstitute: 'University', postgraduateMajor: 'Business Analytics', postgraduateGrade: '3.8/4.0',
        yearsOfExperience: '6', lastOrganisation: 'Company', lastDesignation: 'Business Analyst',
        joiningDate: '2018-07-01T00:00:00.000Z', endDate: '', currentlyWorking: 'Yes'
      },
      {
        applyingFor: 'DevOps Engineer',
        firstName: 'Demo', lastName: 'Employee13',
        email: 'demo.employee13@example.com', mobile: '+1-000-111-0013',
        dob: '1997-03-17T00:00:00.000Z', religion: 'Not Specified', maritalStatus: 'Single',
        gender: 'Male', nationality: 'Country1',
        currentAddress: 'Address Line 13, Street 13, City 1, State 1',
        permanentAddress: 'Address Line 13, Street 13, City 1, State 1',
        sscInstitute: 'High School 2', sscBoard: 'Board', sscMajor: 'Science', sscYear: '2013', sscGrade: 'A*',
        hscInstitute: 'High School 2', hscBoard: 'Board', hscMajor: 'Computer Science', hscYear: '2015', hscGrade: 'A*',
        bachelorDegree: 'B.Sc. Computer Science', bachelorInstitute: 'University 5', bachelorMajor: 'Computer Science', bachelorGrade: '3.9/4.0',
        postgraduateDegree: '', postgraduateInstitute: '', postgraduateMajor: '', postgraduateGrade: '',
        yearsOfExperience: '5', lastOrganisation: 'Company', lastDesignation: 'DevOps Engineer',
        joiningDate: '2019-08-01T00:00:00.000Z', endDate: '2024-09-30T00:00:00.000Z', currentlyWorking: 'No'
      },
      {
        applyingFor: 'Accountant',
        firstName: 'Demo', lastName: 'Employee14',
        email: 'demo.employee14@example.com', mobile: '+1-000-111-0014',
        dob: '1994-11-29T00:00:00.000Z', religion: 'Not Specified', maritalStatus: 'Married',
        gender: 'Female', nationality: 'Country1',
        currentAddress: 'Address Line 14, Street 14, City 1, State 1',
        permanentAddress: 'Address Line 14, Street 14, City 1, State 1',
        sscInstitute: 'High School 14', sscBoard: 'Board', sscMajor: 'Science', sscYear: '2010', sscGrade: 'A',
        hscInstitute: 'High School 14', hscBoard: 'Board', hscMajor: 'Commerce', hscYear: '2012', hscGrade: 'A+',
        bachelorDegree: 'B.Com', bachelorInstitute: 'University', bachelorMajor: 'Accounting', bachelorGrade: '3.5/4.0',
        postgraduateDegree: 'University 14', postgraduateInstitute: 'University 14', postgraduateMajor: 'Accounting & Finance', postgraduateGrade: 'Pass',
        yearsOfExperience: '8', lastOrganisation: 'Company', lastDesignation: 'Senior Accountant',
        joiningDate: '2016-05-01T00:00:00.000Z', endDate: '', currentlyWorking: 'Yes'
      },
      {
        applyingFor: 'Quality Assurance Engineer',
        firstName: 'Demo', lastName: 'Employee15',
        email: 'demo.employee15@example.com', mobile: '+1-000-111-0015',
        dob: '1998-07-11T00:00:00.000Z', religion: 'Not Specified', maritalStatus: 'Single',
        gender: 'Male', nationality: 'Country1',
        currentAddress: 'Address Line 15, Street 15, City 2, State 2',
        permanentAddress: 'Address Line 15B, Street 15B, City 8, State 8',
        sscInstitute: 'High School', sscBoard: 'Board', sscMajor: 'Science', sscYear: '2014', sscGrade: 'A',
        hscInstitute: 'College 15', hscBoard: 'Board', hscMajor: 'ICS', hscYear: '2016', hscGrade: 'A',
        bachelorDegree: 'B.Sc. Software Engineering', bachelorInstitute: 'University', bachelorMajor: 'Software Engineering', bachelorGrade: '3.4/4.0',
        postgraduateDegree: '', postgraduateInstitute: '', postgraduateMajor: '', postgraduateGrade: '',
        yearsOfExperience: '4', lastOrganisation: 'Company', lastDesignation: 'QA Engineer',
        joiningDate: '2020-10-01T00:00:00.000Z', endDate: '', currentlyWorking: 'Yes'
      },
      {
        applyingFor: 'Digital Marketing Specialist',
        firstName: 'Demo', lastName: 'Employee16',
        email: 'demo.employee16@example.com', mobile: '+1-000-111-0016',
        dob: '1996-02-18T00:00:00.000Z', religion: 'Not Specified', maritalStatus: 'Single',
        gender: 'Female', nationality: 'Country1',
        currentAddress: 'Address Line 16, Street 16, City 3, State 3',
        permanentAddress: 'Address Line 16, Street 16, City 3, State 3',
        sscInstitute: 'High School 4', sscBoard: 'Board', sscMajor: 'Arts', sscYear: '2012', sscGrade: 'A',
        hscInstitute: 'High School 4', hscBoard: 'Board', hscMajor: 'Humanities', hscYear: '2014', hscGrade: 'A',
        bachelorDegree: 'BBA', bachelorInstitute: 'University 16', bachelorMajor: 'Marketing', bachelorGrade: '3.6/4.0',
        postgraduateDegree: '', postgraduateInstitute: '', postgraduateMajor: '', postgraduateGrade: '',
        yearsOfExperience: '5', lastOrganisation: 'Company', lastDesignation: 'Digital Marketing Specialist',
        joiningDate: '2019-11-01T00:00:00.000Z', endDate: '', currentlyWorking: 'Yes'
      },
      {
        applyingFor: 'Mechanical Engineer',
        firstName: 'Demo', lastName: 'Employee17',
        email: 'demo.employee17@example.com', mobile: '+1-000-111-0017',
        dob: '1995-09-08T00:00:00.000Z', religion: 'Not Specified', maritalStatus: 'Married',
        gender: 'Male', nationality: 'Country1',
        currentAddress: 'Address Line 17, Street 17, City 2, State 2',
        permanentAddress: 'Address Line 17B, Street 17B, City 7, State 7',
        sscInstitute: 'High School', sscBoard: 'Board', sscMajor: 'Science', sscYear: '2011', sscGrade: 'A',
        hscInstitute: 'College', hscBoard: 'Board', hscMajor: 'Pre-Engineering', hscYear: '2013', hscGrade: 'A+',
        bachelorDegree: 'B.E. Mechanical Engineering', bachelorInstitute: 'University', bachelorMajor: 'Mechanical Engineering', bachelorGrade: '3.5/4.0',
        postgraduateDegree: 'MS Engineering Management', postgraduateInstitute: 'University', postgraduateMajor: 'Engineering Management', postgraduateGrade: '3.7/4.0',
        yearsOfExperience: '7', lastOrganisation: 'Company', lastDesignation: 'Senior Mechanical Engineer',
        joiningDate: '2017-02-01T00:00:00.000Z', endDate: '', currentlyWorking: 'Yes'
      },
      {
        applyingFor: 'Customer Support Representative',
        firstName: 'Demo', lastName: 'Employee18',
        email: 'demo.employee18@example.com', mobile: '+1-000-111-0018',
        dob: '1999-04-22T00:00:00.000Z', religion: 'Not Specified', maritalStatus: 'Single',
        gender: 'Female', nationality: 'Country1',
        currentAddress: 'Address Line 18, Street 18, City 1, State 1',
        permanentAddress: 'Address Line 18, Street 18, City 1, State 1',
        sscInstitute: 'High School 18', sscBoard: 'Board', sscMajor: 'Science', sscYear: '2015', sscGrade: 'A',
        hscInstitute: 'College 18', hscBoard: 'Board', hscMajor: 'Pre-Medical', hscYear: '2017', hscGrade: 'A',
        bachelorDegree: 'BA English', bachelorInstitute: 'University', bachelorMajor: 'English Literature', bachelorGrade: '3.3/4.0',
        postgraduateDegree: '', postgraduateInstitute: '', postgraduateMajor: '', postgraduateGrade: '',
        yearsOfExperience: '3', lastOrganisation: 'Company', lastDesignation: 'Customer Support Representative',
        joiningDate: '2021-03-15T00:00:00.000Z', endDate: '', currentlyWorking: 'Yes'
      },
      {
        applyingFor: 'Civil Engineer',
        firstName: 'Demo', lastName: 'Employee19',
        email: 'demo.employee19@example.com', mobile: '+1-000-111-0019',
        dob: '1994-12-30T00:00:00.000Z', religion: 'Not Specified', maritalStatus: 'Married',
        gender: 'Male', nationality: 'Country1',
        currentAddress: 'Address Line 19, Street 19, City 5, State 5',
        permanentAddress: 'Address Line 19, Street 19, City 5, State 5',
        sscInstitute: 'High School 19', sscBoard: 'Board', sscMajor: 'Science', sscYear: '2010', sscGrade: 'A',
        hscInstitute: 'High School 19', hscBoard: 'Board', hscMajor: 'Pre-Engineering', hscYear: '2012', hscGrade: 'A+',
        bachelorDegree: 'B.E. Civil Engineering', bachelorInstitute: 'University 19', bachelorMajor: 'Civil Engineering', bachelorGrade: '3.6/4.0',
        postgraduateDegree: '', postgraduateInstitute: '', postgraduateMajor: '', postgraduateGrade: '',
        yearsOfExperience: '8', lastOrganisation: 'Company', lastDesignation: 'Civil Engineer',
        joiningDate: '2016-06-01T00:00:00.000Z', endDate: '', currentlyWorking: 'Yes'
      },
      {
        applyingFor: 'Operations Manager',
        firstName: 'Demo', lastName: 'Employee20',
        email: 'demo.employee20@example.com', mobile: '+1-000-111-0020',
        dob: '1993-05-27T00:00:00.000Z', religion: 'Not Specified', maritalStatus: 'Married',
        gender: 'Female', nationality: 'Country1',
        currentAddress: 'Address Line 20, Street 20, City 1, State 1',
        permanentAddress: 'Address Line 20, Street 20, City 1, State 1',
        sscInstitute: 'High School 20', sscBoard: 'Board', sscMajor: 'Science', sscYear: '2009', sscGrade: 'A+',
        hscInstitute: 'College 20', hscBoard: 'Board', hscMajor: 'Commerce', hscYear: '2011', hscGrade: 'A+',
        bachelorDegree: 'BBA', bachelorInstitute: 'University 2', bachelorMajor: 'Supply Chain Management', bachelorGrade: '3.8/4.0',
        postgraduateDegree: 'MBA', postgraduateInstitute: 'University 2', postgraduateMajor: 'Operations Management', postgraduateGrade: '3.9/4.0',
        yearsOfExperience: '9', lastOrganisation: 'Company Country1', lastDesignation: 'Operations Manager',
        joiningDate: '2015-04-01T00:00:00.000Z', endDate: '', currentlyWorking: 'Yes'
      }
    ];
    
    let added = 0;
    demoApplicants.forEach((applicant, index) => {
      const timestamp = new Date(Date.now() - (20 - index) * 24 * 60 * 60 * 1000).toISOString(); // Stagger by days
      const row = [
        timestamp,
        applicant.applyingFor,
        applicant.firstName,
        applicant.lastName,
        applicant.email,
        applicant.mobile,
        applicant.dob,
        applicant.religion,
        applicant.maritalStatus,
        applicant.gender,
        applicant.nationality,
        applicant.currentAddress,
        applicant.permanentAddress,
        applicant.sscInstitute,
        applicant.sscBoard,
        applicant.sscMajor,
        applicant.sscYear,
        applicant.sscGrade,
        applicant.hscInstitute,
        applicant.hscBoard,
        applicant.hscMajor,
        applicant.hscYear,
        applicant.hscGrade,
        applicant.bachelorDegree,
        applicant.bachelorInstitute,
        applicant.bachelorMajor,
        applicant.bachelorGrade,
        applicant.postgraduateDegree,
        applicant.postgraduateInstitute,
        applicant.postgraduateMajor,
        applicant.postgraduateGrade,
        applicant.yearsOfExperience,
        applicant.lastOrganisation,
        applicant.lastDesignation,
        applicant.joiningDate,
        applicant.endDate,
        applicant.currentlyWorking,
        `${applicant.firstName}_${applicant.lastName}_CV.pdf`,
        // HND (Higher National Diploma) - not used by demo data
        '', '', '', '',
        // Cover Letter URL - not used by demo data
        '',
        // Custom Field Values - not used by demo data
        '',
        // Passport Photo URL - not used by demo data
        ''
      ];
      sheet.appendRow(row);
      added++;
    });
    
    Logger.log(`=== Demo Data Setup Complete ===`);
    Logger.log(`Added ${added} generic demo applicants to the system`);
    
    return {
      success: true,
      message: `Successfully added ${added} demo applicants`,
      count: added
    };
    
  } catch (error) {
    Logger.log('Demo data setup error: ' + error.toString());
    return {
      success: false,
      message: 'Demo data setup failed: ' + error.message
    };
  }
}
/**
 * Saves email templates to EmailTemplates sheet
 * @param {Object} templates - Email templates object
 * @returns {Object} Response object
 */
function saveEmailTemplates(templates) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Get or create EmailTemplates sheet
    let templatesSheet = ss.getSheetByName('EmailTemplates');
    if (!templatesSheet) {
      templatesSheet = ss.insertSheet('EmailTemplates');
      templatesSheet.getRange(1, 1, 1, 2).setValues([['Template Name', 'Template Content']]);
      templatesSheet.getRange(1, 1, 1, 2)
        .setBackground('#2e7d32')
        .setFontColor('#ffffff')
        .setFontWeight('bold');
      templatesSheet.setFrozenRows(1);
    }

    // Clear existing data (keep header)
    const lastRow = templatesSheet.getLastRow();
    if (lastRow > 1) {
      templatesSheet.getRange(2, 1, lastRow - 1, 2).clear();
    }

    // Save templates
    const templateData = [
      ['confirmation', templates.confirmation],
      ['shortlist', templates.shortlist],
      ['interview', templates.interview],
      ['rejection', templates.rejection]
    ];

    templatesSheet.getRange(2, 1, templateData.length, 2).setValues(templateData);

    Logger.log('Email templates saved successfully');
    return {
      success: true,
      message: 'Email templates saved successfully'
    };

  } catch (error) {
    Logger.log('Error saving email templates: ' + error.toString());
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Gets email templates from EmailTemplates sheet
 * @returns {Object} Templates object or default templates
 */
function getEmailTemplates() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const templatesSheet = ss.getSheetByName('EmailTemplates');

    // Return defaults if sheet doesn't exist
    if (!templatesSheet) {
      return getDefaultEmailTemplates();
    }

    const lastRow = templatesSheet.getLastRow();
    if (lastRow <= 1) {
      return getDefaultEmailTemplates();
    }

    // Read templates from sheet
    const data = templatesSheet.getRange(2, 1, lastRow - 1, 2).getValues();
    const templates = {};

    data.forEach(row => {
      if (row[0]) {
        templates[row[0]] = row[1];
      }
    });

    // Return saved templates or defaults
    return {
      confirmation: templates.confirmation || getDefaultEmailTemplates().confirmation,
      shortlist: templates.shortlist || getDefaultEmailTemplates().shortlist,
      interview: templates.interview || getDefaultEmailTemplates().interview,
      rejection: templates.rejection || getDefaultEmailTemplates().rejection
    };

  } catch (error) {
    Logger.log('Error getting email templates: ' + error.toString());
    return getDefaultEmailTemplates();
  }
}

/**
 * Returns default email templates
 * @returns {Object} Default templates
 */
function getDefaultEmailTemplates() {
  return {
    confirmation: `Dear [Candidate Name],

Thank you for your interest in our position. We have received your application and our team is currently reviewing it.

We will contact you within the next few days regarding the next steps in the selection process.

Best regards,
HR Team`,

    shortlist: `Dear [Candidate Name],

Congratulations! We are pleased to inform you that you have been shortlisted for the [Position] role.

We would like to invite you for an interview. Our HR team will contact you shortly to schedule a convenient time.

Best regards,
HR Team`,

    interview: `Dear [Candidate Name],

We are pleased to invite you for an interview for the [Position] role.

Interview Details:
Date: [Date]
Time: [Time]
Location: [Location/Meeting Link]
Interviewer: [Interviewer Name]

Please confirm your availability for the scheduled time.

Best regards,
HR Team`,

    rejection: `Dear [Candidate Name],

Thank you for your interest in the [Position] role and for taking the time to apply.

After careful consideration, we have decided to move forward with other candidates whose qualifications more closely match our current requirements.

We will keep your resume on file for future opportunities that match your profile.

Best regards,
HR Team`
  };
}

/* ============================================================
 * Generic Settings helpers (Settings sheet key/value store)
 * Reused by Appearance, Banner, Social Links and SMS settings
 * so everything lives alongside JOB_DESCRIPTION in one place.
 * ============================================================ */

/**
 * Gets a raw setting value by key from the Settings sheet
 * @param {string} key
 * @param {string} [defaultValue]
 * @returns {string}
 */
function getSetting(key, defaultValue) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const settingsSheet = ss.getSheetByName('Settings');
    if (!settingsSheet) return defaultValue !== undefined ? defaultValue : '';

    const lastRow = settingsSheet.getLastRow();
    if (lastRow <= 1) return defaultValue !== undefined ? defaultValue : '';

    const data = settingsSheet.getRange(2, 1, lastRow - 1, 2).getValues();
    for (let i = 0; i < data.length; i++) {
      if (data[i][0] === key) {
        return data[i][1] || (defaultValue !== undefined ? defaultValue : '');
      }
    }
    return defaultValue !== undefined ? defaultValue : '';
  } catch (error) {
    Logger.log('Error getting setting ' + key + ': ' + error.toString());
    return defaultValue !== undefined ? defaultValue : '';
  }
}

/**
 * Sets a raw setting value by key in the Settings sheet (creating it if needed)
 * @param {string} key
 * @param {string} value
 * @returns {Object} Response object
 */
function setSetting(key, value) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let settingsSheet = ss.getSheetByName('Settings');
    if (!settingsSheet) {
      settingsSheet = ss.insertSheet('Settings');
      settingsSheet.getRange(1, 1, 1, 2).setValues([['Setting Name', 'Value']]);
      settingsSheet.getRange(1, 1, 1, 2)
        .setBackground('#2e7d32')
        .setFontColor('#ffffff')
        .setFontWeight('bold');
      settingsSheet.setFrozenRows(1);
      settingsSheet.setColumnWidth(1, 200);
      settingsSheet.setColumnWidth(2, 800);
    }

    const lastRow = settingsSheet.getLastRow();
    let rowToUpdate = -1;

    if (lastRow > 1) {
      const settingNames = settingsSheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (let i = 0; i < settingNames.length; i++) {
        if (settingNames[i][0] === key) {
          rowToUpdate = i + 2;
          break;
        }
      }
    }

    if (rowToUpdate > 0) {
      settingsSheet.getRange(rowToUpdate, 2).setValue(value);
    } else {
      settingsSheet.appendRow([key, value]);
    }

    return { status: 'success', message: 'Setting saved successfully' };
  } catch (error) {
    Logger.log('Error setting ' + key + ': ' + error.toString());
    return { status: 'error', message: 'Failed to save setting: ' + error.message };
  }
}

/* ============================================================
 * Appearance / Theme settings
 * ============================================================ */

/**
 * Default (Classic Green) theme configuration
 * @returns {Object}
 */
function getDefaultThemeConfig() {
  return {
    preset: 'classicGreen',
    doodle: 'dots',
    colors: {
      darkest: '#1b5e20',
      dark: '#2e7d32',
      mid: '#43a047',
      light: '#66bb6a',
      pale: '#c8e6c9',
      faint: '#e8f5e9',
      tint: '#f1f8f4'
    }
  };
}

/**
 * Gets the saved appearance/theme configuration
 * @returns {Object} Theme config
 */
function getThemeConfig() {
  try {
    const raw = getSetting('THEME_CONFIG', '');
    const defaults = getDefaultThemeConfig();
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    return {
      preset: parsed.preset || defaults.preset,
      doodle: parsed.doodle || defaults.doodle,
      colors: Object.assign({}, defaults.colors, parsed.colors)
    };
  } catch (error) {
    Logger.log('Error getting theme config: ' + error.toString());
    return getDefaultThemeConfig();
  }
}

/**
 * Saves the appearance/theme configuration
 * @param {Object} themeConfig
 * @returns {Object} Response object
 */
function saveThemeConfig(themeConfig) {
  try {
    setSetting('THEME_CONFIG', JSON.stringify(themeConfig));
    return { status: 'success', message: 'Theme saved successfully' };
  } catch (error) {
    Logger.log('Error saving theme config: ' + error.toString());
    return { status: 'error', message: 'Failed to save theme: ' + error.message };
  }
}

/* ============================================================
 * Header banner (photo or GIF)
 * ============================================================ */

/**
 * Uploads a header banner image/GIF to Drive and stores its URL as a setting
 * @param {string} fileData - base64 data URL (e.g. "data:image/png;base64,...")
 * @param {string} fileName
 * @returns {Object} Response object with the resulting url
 */
function uploadBanner(fileData, fileName) {
  try {
    const folder = getCVFolder(); // reuse the same ASSETS NAME folder used for CVs

    const blob = Utilities.newBlob(
      Utilities.base64Decode(fileData.split(',')[1]),
      fileData.split(';')[0].split(':')[1],
      fileName
    );

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const newFileName = `banner_${timestamp}_${fileName}`;
    const file = folder.createFile(blob.setName(newFileName));
    file.setDescription('Application form header banner');
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // Direct-render URL so it can be used straight in an <img>/CSS background.
    // Drive's uc?export=view endpoint has become unreliable for hotlinked
    // images (it can return a confirmation/warning page instead of the raw
    // bytes); the thumbnail endpoint is the one Google actually intends for
    // inline embedding and works consistently.
    const directUrl = `https://drive.google.com/thumbnail?id=${file.getId()}&sz=w1600`;
    setSetting('BANNER_URL', directUrl);

    Logger.log('Banner uploaded: ' + newFileName);
    return { status: 'success', message: 'Banner uploaded successfully', url: directUrl };
  } catch (error) {
    Logger.log('Error uploading banner: ' + error.toString());
    return { status: 'error', message: 'Failed to upload banner: ' + error.message };
  }
}

/**
 * Gets the current header banner URL
 * @returns {string} Banner URL, or empty string if none set
 */
function getBannerUrl() {
  return getSetting('BANNER_URL', '');
}

/**
 * Removes the current header banner
 * @returns {Object} Response object
 */
function removeBanner() {
  try {
    setSetting('BANNER_URL', '');
    return { status: 'success', message: 'Banner removed successfully' };
  } catch (error) {
    Logger.log('Error removing banner: ' + error.toString());
    return { status: 'error', message: 'Failed to remove banner: ' + error.message };
  }
}

/* ============================================================
 * Social media / LinkedIn links
 * ============================================================ */

function getDefaultSocialLinks() {
  return { facebook: '', twitter: '', instagram: '', linkedin: '' };
}

/**
 * Gets social media / LinkedIn links shown on the application form header
 * @returns {Object} Social links
 */
function getSocialLinks() {
  try {
    const raw = getSetting('SOCIAL_LINKS', '');
    if (!raw) return getDefaultSocialLinks();
    return Object.assign(getDefaultSocialLinks(), JSON.parse(raw));
  } catch (error) {
    Logger.log('Error getting social links: ' + error.toString());
    return getDefaultSocialLinks();
  }
}

/**
 * Saves social media / LinkedIn links
 * @param {Object} links
 * @returns {Object} Response object
 */
function saveSocialLinks(links) {
  try {
    setSetting('SOCIAL_LINKS', JSON.stringify(links));
    return { status: 'success', message: 'Social links saved successfully' };
  } catch (error) {
    Logger.log('Error saving social links: ' + error.toString());
    return { status: 'error', message: 'Failed to save social links: ' + error.message };
  }
}

/* ============================================================
 * SMS: provider configuration (Arkesel / Hubtel / Custom)
 * ============================================================ */

function getDefaultSmsConfig() {
  return {
    enabled: false,
    provider: 'arkesel', // 'arkesel' | 'hubtel' | 'custom'
    senderId: '',
    arkesel: { apiKey: '' },
    hubtel: { clientId: '', clientSecret: '' },
    custom: {
      url: '',
      method: 'POST',
      headers: '{}',
      // Placeholders available: {{phone}} {{message}} {{senderId}} {{encodedMessage}} {{encodedPhone}}
      bodyTemplate: ''
    }
  };
}

/**
 * Gets the saved SMS provider configuration
 * @returns {Object} SMS config
 */
function getSmsConfig() {
  try {
    const raw = getSetting('SMS_CONFIG', '');
    const defaults = getDefaultSmsConfig();
    if (!raw) return defaults;

    const parsed = JSON.parse(raw);
    return {
      enabled: !!parsed.enabled,
      provider: parsed.provider || defaults.provider,
      senderId: parsed.senderId || '',
      arkesel: Object.assign({}, defaults.arkesel, parsed.arkesel),
      hubtel: Object.assign({}, defaults.hubtel, parsed.hubtel),
      custom: Object.assign({}, defaults.custom, parsed.custom)
    };
  } catch (error) {
    Logger.log('Error getting SMS config: ' + error.toString());
    return getDefaultSmsConfig();
  }
}

/**
 * Saves the SMS provider configuration
 * @param {Object} config
 * @returns {Object} Response object
 */
function saveSmsConfig(config) {
  try {
    setSetting('SMS_CONFIG', JSON.stringify(config));
    return { status: 'success', message: 'SMS settings saved successfully' };
  } catch (error) {
    Logger.log('Error saving SMS config: ' + error.toString());
    return { status: 'error', message: 'Failed to save SMS settings: ' + error.message };
  }
}

/* ============================================================
 * SMS: templates (Confirmation / Shortlist / Interview / Rejection)
 * Mirrors the EmailTemplates sheet pattern above.
 * ============================================================ */

/**
 * Returns default SMS templates
 * @returns {Object} Default SMS templates
 */
function getDefaultSmsTemplates() {
  return {
    confirmation: `Hi [Candidate Name], thank you for applying for [Position]. We've received your application and will be in touch soon. - HR Team`,
    shortlist: `Hi [Candidate Name], great news! You've been shortlisted for [Position]. Our HR team will contact you shortly to schedule an interview. - HR Team`,
    interview: `Hi [Candidate Name], your interview for [Position] is on [Date] at [Time], [Location]. Interviewer: [Interviewer Name]. - HR Team`,
    rejection: `Hi [Candidate Name], thank you for applying for [Position]. After careful review we've decided to move forward with other candidates. We'll keep your profile on file. - HR Team`
  };
}

/**
 * Saves SMS templates to the SmsTemplates sheet
 * @param {Object} templates
 * @returns {Object} Response object
 */
function saveSmsTemplates(templates) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let templatesSheet = ss.getSheetByName('SmsTemplates');
    if (!templatesSheet) {
      templatesSheet = ss.insertSheet('SmsTemplates');
      templatesSheet.getRange(1, 1, 1, 2).setValues([['Template Name', 'Template Content']]);
      templatesSheet.getRange(1, 1, 1, 2)
        .setBackground('#2e7d32')
        .setFontColor('#ffffff')
        .setFontWeight('bold');
      templatesSheet.setFrozenRows(1);
    }

    const lastRow = templatesSheet.getLastRow();
    if (lastRow > 1) {
      templatesSheet.getRange(2, 1, lastRow - 1, 2).clear();
    }

    const templateData = [
      ['confirmation', templates.confirmation],
      ['shortlist', templates.shortlist],
      ['interview', templates.interview],
      ['rejection', templates.rejection]
    ];

    templatesSheet.getRange(2, 1, templateData.length, 2).setValues(templateData);

    Logger.log('SMS templates saved successfully');
    return { status: 'success', message: 'SMS templates saved successfully' };
  } catch (error) {
    Logger.log('Error saving SMS templates: ' + error.toString());
    return { status: 'error', message: error.message };
  }
}

/**
 * Gets SMS templates from the SmsTemplates sheet
 * @returns {Object} Templates object or defaults
 */
function getSmsTemplates() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const templatesSheet = ss.getSheetByName('SmsTemplates');
    if (!templatesSheet) return getDefaultSmsTemplates();

    const lastRow = templatesSheet.getLastRow();
    if (lastRow <= 1) return getDefaultSmsTemplates();

    const data = templatesSheet.getRange(2, 1, lastRow - 1, 2).getValues();
    const templates = {};
    data.forEach(row => {
      if (row[0]) templates[row[0]] = row[1];
    });

    const defaults = getDefaultSmsTemplates();
    return {
      confirmation: templates.confirmation || defaults.confirmation,
      shortlist: templates.shortlist || defaults.shortlist,
      interview: templates.interview || defaults.interview,
      rejection: templates.rejection || defaults.rejection
    };
  } catch (error) {
    Logger.log('Error getting SMS templates: ' + error.toString());
    return getDefaultSmsTemplates();
  }
}

/* ============================================================
 * SMS: sending
 * ============================================================ */

/**
 * Dispatches a single SMS through the configured provider
 * @param {string} phone - Recipient phone number, with country code
 * @param {string} message - Message body
 * @param {Object} config - SMS config (from getSmsConfig)
 * @returns {Object} { success, response }
 */
function dispatchSms(phone, message, config) {
  const provider = config.provider;

  if (provider === 'arkesel') {
    const url = 'https://sms.arkesel.com/api/v2/sms/send';
    const payload = {
      sender: config.senderId || 'HR',
      message: message,
      recipients: [phone]
    };
    const response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      headers: { 'api-key': config.arkesel.apiKey },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    return { success: response.getResponseCode() < 300, response: response.getContentText() };
  }

  if (provider === 'hubtel') {
    // Hubtel Quick SMS API - credentials and recipient travel as query params
    const url = 'https://sms.hubtel.com/v1/messages/send'
      + '?clientid=' + encodeURIComponent(config.hubtel.clientId)
      + '&clientsecret=' + encodeURIComponent(config.hubtel.clientSecret)
      + '&from=' + encodeURIComponent(config.senderId || 'HR')
      + '&to=' + encodeURIComponent(phone)
      + '&content=' + encodeURIComponent(message);
    const response = UrlFetchApp.fetch(url, {
      method: 'get',
      muteHttpExceptions: true
    });
    return { success: response.getResponseCode() < 300, response: response.getContentText() };
  }

  if (provider === 'custom') {
    const c = config.custom;
    let headers = {};
    try {
      headers = c.headers ? JSON.parse(c.headers) : {};
    } catch (e) {
      Logger.log('Invalid custom SMS headers JSON: ' + e.toString());
    }

    const fill = (str) => (str || '')
      .replace(/{{\s*phone\s*}}/g, phone)
      .replace(/{{\s*message\s*}}/g, message)
      .replace(/{{\s*senderId\s*}}/g, config.senderId || '')
      .replace(/{{\s*encodedMessage\s*}}/g, encodeURIComponent(message))
      .replace(/{{\s*encodedPhone\s*}}/g, encodeURIComponent(phone));

    const url = fill(c.url);
    const method = (c.method || 'POST').toLowerCase();
    const options = { method: method, headers: headers, muteHttpExceptions: true };

    if (method === 'post' && c.bodyTemplate) {
      options.contentType = headers['Content-Type'] || 'application/json';
      options.payload = fill(c.bodyTemplate);
    }

    const response = UrlFetchApp.fetch(url, options);
    return { success: response.getResponseCode() < 300, response: response.getContentText() };
  }

  return { success: false, response: 'Unknown SMS provider: ' + provider };
}

/**
 * Logs an SMS attempt to the SmsLog sheet
 * @param {string} phone
 * @param {string} message
 * @param {Object} result - { success, response }
 * @param {string} sentBy
 */
function logSms(phone, message, result, sentBy) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let logSheet = ss.getSheetByName('SmsLog');
    if (!logSheet) {
      logSheet = ss.insertSheet('SmsLog');
      logSheet.getRange(1, 1, 1, 6).setValues([['Timestamp', 'Recipient', 'Message', 'Success', 'Response', 'Sent By']]);
      logSheet.getRange(1, 1, 1, 6)
        .setBackground('#2e7d32')
        .setFontColor('#ffffff')
        .setFontWeight('bold');
      logSheet.setFrozenRows(1);
    }
    logSheet.appendRow([
      new Date().toISOString(),
      phone,
      message,
      result.success ? 'Yes' : 'No',
      (result.response || '').toString().substring(0, 500),
      sentBy || 'System'
    ]);
  } catch (error) {
    Logger.log('Error logging SMS: ' + error.toString());
  }
}

/**
 * Sends an SMS to a single candidate using the configured provider.
 * Fails gracefully (success:false with a clear message) if SMS is disabled/unconfigured.
 * @param {string} phone
 * @param {string} message
 * @returns {Object} Response object
 */
function sendSmsToCandidate(phone, message) {
  try {
    if (!phone) {
      return { success: false, message: 'No phone number provided' };
    }

    const config = getSmsConfig();
    if (!config.enabled) {
      return { success: false, message: 'SMS is disabled. Enable it in Admin > Settings > SMS.' };
    }

    const result = dispatchSms(phone, message, config);
    logSms(phone, message, result, 'Admin');

    if (!result.success) {
      Logger.log('SMS send failed for ' + phone + ': ' + result.response);
      return { success: false, message: 'SMS provider error: ' + result.response };
    }

    return { success: true, message: 'SMS sent successfully' };
  } catch (error) {
    Logger.log('Error sending SMS: ' + error.toString());
    return { success: false, message: error.message };
  }
}

/**
 * Sends a test SMS to verify the current provider configuration
 * @param {string} phone
 * @returns {Object} Response object
 */
function sendTestSms(phone) {
  return sendSmsToCandidate(phone, 'This is a test message from your Job Application System. SMS is configured correctly!');
}

/**
 * Sends bulk SMS (identical message) to multiple candidates
 * @param {Array} phones - Array of phone numbers
 * @param {string} message - Message body
 * @returns {Object} Response object
 */
function sendBulkSms(phones, message) {
  try {
    const config = getSmsConfig();
    if (!config.enabled) {
      return { success: false, message: 'SMS is disabled. Enable it in Admin > Settings > SMS.' };
    }

    let successCount = 0;
    const failedNumbers = [];

    phones.forEach(phone => {
      const result = dispatchSms(phone, message, config);
      logSms(phone, message, result, 'Admin - Bulk');
      if (result.success) {
        successCount++;
      } else {
        failedNumbers.push(phone);
      }
    });

    return {
      success: true,
      message: `SMS sent: ${successCount}/${phones.length}`,
      failedNumbers: failedNumbers
    };
  } catch (error) {
    Logger.log('Error sending bulk SMS: ' + error.toString());
    return { success: false, message: error.message };
  }
}

/**
 * Sends an automatic SMS for a given template type if SMS is enabled in settings.
 * Never throws - failures are logged only, so they never block email/sheet writes.
 * @param {string} templateType - 'confirmation' | 'interview'
 * @param {string} phone
 * @param {Object} replacements - map of placeholder -> value, e.g. {'[Candidate Name]': 'Jane'}
 */
function maybeSendAutoSms(templateType, phone, replacements) {
  try {
    const config = getSmsConfig();
    if (!config.enabled || !phone) return;

    const templates = getSmsTemplates();
    let message = templates[templateType] || '';
    Object.keys(replacements || {}).forEach(placeholder => {
      message = message.split(placeholder).join(replacements[placeholder] || '');
    });

    const result = dispatchSms(phone, message, config);
    logSms(phone, message, result, 'System - Auto');
  } catch (error) {
    Logger.log('Auto SMS (' + templateType + ') failed: ' + error.toString());
  }
}

/* ============================================================
 * SMS: balance check
 * ============================================================ */

/**
 * Fetches the current SMS credit balance from the configured provider,
 * for display on the admin dashboard. Not every provider exposes a
 * standard balance API, so this fails gracefully when it can't.
 * @returns {Object} { success, balance, currency, message }
 */
function getSmsBalance() {
  try {
    const config = getSmsConfig();
    if (!config.enabled) {
      return { success: false, message: 'SMS is disabled' };
    }

    if (config.provider === 'arkesel') {
      if (!config.arkesel.apiKey) {
        return { success: false, message: 'Arkesel API key not set' };
      }
      const response = UrlFetchApp.fetch('https://sms.arkesel.com/api/v2/clients/balance-details', {
        method: 'get',
        headers: { 'api-key': config.arkesel.apiKey },
        muteHttpExceptions: true
      });
      if (response.getResponseCode() >= 300) {
        return { success: false, message: 'Arkesel balance request failed (' + response.getResponseCode() + ')' };
      }
      const data = JSON.parse(response.getContentText());
      const info = data.data || data;
      const balance = info.sms_balance !== undefined ? info.sms_balance
        : (info.balance !== undefined ? info.balance : info.main_balance);
      if (balance === undefined) {
        return { success: false, message: 'Unexpected Arkesel balance response format' };
      }
      return { success: true, balance: Number(balance), currency: info.currency || '' };
    }

    if (config.provider === 'hubtel') {
      if (!config.hubtel.clientId || !config.hubtel.clientSecret) {
        return { success: false, message: 'Hubtel credentials not set' };
      }
      // Hubtel's balance endpoint/response can vary by account type; this is
      // best-effort and fails gracefully (hides the badge) if the shape
      // doesn't match. Verify against your Hubtel dashboard if this is off.
      const url = 'https://smsc.hubtel.com/v1/messages/balance'
        + '?clientid=' + encodeURIComponent(config.hubtel.clientId)
        + '&clientsecret=' + encodeURIComponent(config.hubtel.clientSecret);
      const response = UrlFetchApp.fetch(url, { method: 'get', muteHttpExceptions: true });
      if (response.getResponseCode() >= 300) {
        return { success: false, message: 'Hubtel balance request failed (' + response.getResponseCode() + ')' };
      }
      const data = JSON.parse(response.getContentText());
      const balance = data.balance !== undefined ? data.balance : (data.Balance !== undefined ? data.Balance : undefined);
      if (balance === undefined) {
        return { success: false, message: 'Unexpected Hubtel balance response format' };
      }
      return { success: true, balance: Number(balance), currency: data.currency || data.Currency || '' };
    }

    return { success: false, message: 'Balance check not available for custom providers' };
  } catch (error) {
    Logger.log('Error getting SMS balance: ' + error.toString());
    return { success: false, message: error.message };
  }
}

/* ============================================================
 * WhatsApp (Meta WhatsApp Cloud API): config, templates, branded PDF,
 * sending, logging. Serves as a fallback channel to SMS - messages are
 * delivered as a professionally branded PDF document (company letterhead,
 * contact info, social links) rather than plain text, mirroring the
 * confirmation-email PDF attachment.
 * ============================================================ */

function getDefaultWhatsappConfig() {
  return {
    enabled: false,
    phoneNumberId: '',
    accessToken: '',
    apiVersion: 'v21.0',
    // Digits-only country code (no +) used to normalize local numbers that
    // start with a trunk "0" (e.g. "0244123456" + "233" -> "233244123456").
    defaultCountryCode: ''
  };
}

/**
 * Gets the saved WhatsApp provider configuration
 * @returns {Object} WhatsApp config
 */
function getWhatsappConfig() {
  try {
    const raw = getSetting('WHATSAPP_CONFIG', '');
    const defaults = getDefaultWhatsappConfig();
    if (!raw) return defaults;

    const parsed = JSON.parse(raw);
    return {
      enabled: !!parsed.enabled,
      phoneNumberId: parsed.phoneNumberId || '',
      accessToken: parsed.accessToken || '',
      apiVersion: parsed.apiVersion || defaults.apiVersion,
      defaultCountryCode: parsed.defaultCountryCode || ''
    };
  } catch (error) {
    Logger.log('Error getting WhatsApp config: ' + error.toString());
    return getDefaultWhatsappConfig();
  }
}

/**
 * Saves the WhatsApp provider configuration
 * @param {Object} config
 * @returns {Object} Response object
 */
function saveWhatsappConfig(config) {
  try {
    setSetting('WHATSAPP_CONFIG', JSON.stringify(config));
    return { status: 'success', message: 'WhatsApp settings saved successfully' };
  } catch (error) {
    Logger.log('Error saving WhatsApp config: ' + error.toString());
    return { status: 'error', message: 'Failed to save WhatsApp settings: ' + error.message };
  }
}

/* ============================================================
 * WhatsApp: templates (Confirmation / Shortlist / Interview / Rejection)
 * Mirrors the SmsTemplates sheet pattern above - same placeholders.
 * ============================================================ */

function getDefaultWhatsappTemplates() {
  return {
    confirmation: `Hi [Candidate Name], thank you for applying for [Position]. We've received your application and will be in touch soon. Your full application summary is attached as a PDF. - HR Team`,
    shortlist: `Hi [Candidate Name], great news! You've been shortlisted for [Position]. Our HR team will contact you shortly to schedule an interview. - HR Team`,
    interview: `Hi [Candidate Name], your interview for [Position] is on [Date] at [Time], [Location]. Interviewer: [Interviewer Name]. - HR Team`,
    rejection: `Hi [Candidate Name], thank you for applying for [Position]. After careful review we've decided to move forward with other candidates. We'll keep your profile on file. - HR Team`
  };
}

function saveWhatsappTemplates(templates) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let templatesSheet = ss.getSheetByName('WhatsappTemplates');
    if (!templatesSheet) {
      templatesSheet = ss.insertSheet('WhatsappTemplates');
      templatesSheet.getRange(1, 1, 1, 2).setValues([['Template Name', 'Template Content']]);
      templatesSheet.getRange(1, 1, 1, 2)
        .setBackground('#2e7d32')
        .setFontColor('#ffffff')
        .setFontWeight('bold');
      templatesSheet.setFrozenRows(1);
    }

    const lastRow = templatesSheet.getLastRow();
    if (lastRow > 1) {
      templatesSheet.getRange(2, 1, lastRow - 1, 2).clear();
    }

    const templateData = [
      ['confirmation', templates.confirmation],
      ['shortlist', templates.shortlist],
      ['interview', templates.interview],
      ['rejection', templates.rejection]
    ];

    templatesSheet.getRange(2, 1, templateData.length, 2).setValues(templateData);

    Logger.log('WhatsApp templates saved successfully');
    return { status: 'success', message: 'WhatsApp templates saved successfully' };
  } catch (error) {
    Logger.log('Error saving WhatsApp templates: ' + error.toString());
    return { status: 'error', message: error.message };
  }
}

function getWhatsappTemplates() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const templatesSheet = ss.getSheetByName('WhatsappTemplates');
    if (!templatesSheet) return getDefaultWhatsappTemplates();

    const lastRow = templatesSheet.getLastRow();
    if (lastRow <= 1) return getDefaultWhatsappTemplates();

    const data = templatesSheet.getRange(2, 1, lastRow - 1, 2).getValues();
    const templates = {};
    data.forEach(row => {
      if (row[0]) templates[row[0]] = row[1];
    });

    const defaults = getDefaultWhatsappTemplates();
    return {
      confirmation: templates.confirmation || defaults.confirmation,
      shortlist: templates.shortlist || defaults.shortlist,
      interview: templates.interview || defaults.interview,
      rejection: templates.rejection || defaults.rejection
    };
  } catch (error) {
    Logger.log('Error getting WhatsApp templates: ' + error.toString());
    return getDefaultWhatsappTemplates();
  }
}

/* ============================================================
 * WhatsApp: branded PDF notice
 * ============================================================ */

/**
 * Builds a short, professionally branded one-page PDF carrying a message
 * to an applicant (confirmation/shortlist/interview/rejection/ad-hoc),
 * used as the WhatsApp document attachment. Reuses the same company
 * branding (name, colors, address, contact, social links) as the email
 * footer so the look is consistent across channels.
 * @param {string} candidateName
 * @param {string} messageText - plain text; blank lines become paragraph breaks
 * @returns {Blob}
 */
function buildWhatsappNoticePdf(candidateName, messageText) {
  const company = getCompanyInfo();
  const theme = getThemeConfig().colors;

  const paragraphs = (messageText || '')
    .split(/\n+/)
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => `<p style="margin:0 0 12px 0; font-size:14px; line-height:1.6; color:#333;">${escapeHtmlForEmail(p)}</p>`)
    .join('');

  const addressLine = company.address ? escapeHtmlForEmail(company.address) : '';
  const contactBits = [];
  if (company.phone) contactBits.push(escapeHtmlForEmail(company.phone));
  if (company.email) contactBits.push(escapeHtmlForEmail(company.email));
  if (company.website) contactBits.push(escapeHtmlForEmail(company.website));

  let social = {};
  try {
    social = getSocialLinks();
  } catch (e) {
    social = {};
  }
  const socialLine = ['facebook', 'twitter', 'instagram', 'linkedin']
    .filter(key => social[key])
    .map(key => escapeHtmlForEmail(social[key]))
    .join('  |  ');

  const html = `<html><head><meta charset="utf-8"></head><body style="font-family:Arial, Helvetica, sans-serif; color:#222; padding:0; margin:0;">
    <div style="max-width:600px; margin:0 auto; padding:24px;">
      <div style="border-bottom:4px solid ${theme.dark}; padding-bottom:16px; margin-bottom:24px;">
        <div style="font-size:22px; font-weight:bold; color:${theme.dark};">${escapeHtmlForEmail(company.name || 'HR Team')}</div>
        ${company.description ? `<div style="font-size:12px; color:#888; margin-top:4px;">${escapeHtmlForEmail(company.description)}</div>` : ''}
      </div>
      <p style="font-size:14px; color:#333; margin:0 0 14px 0;">Dear ${escapeHtmlForEmail(candidateName || 'Applicant')},</p>
      ${paragraphs}
      <div style="margin-top:28px; padding-top:16px; border-top:1px solid #eee; font-size:11px; color:#999;">
        ${addressLine ? `<div style="margin-bottom:4px;">${addressLine}</div>` : ''}
        ${contactBits.length ? `<div style="margin-bottom:4px;">${contactBits.join('  |  ')}</div>` : ''}
        ${socialLine ? `<div>${socialLine}</div>` : ''}
        <div style="margin-top:10px;">Sent via WhatsApp on ${escapeHtmlForEmail(new Date().toLocaleString())}</div>
      </div>
    </div>
  </body></html>`;

  const blob = HtmlService.createHtmlOutput(html).getAs('application/pdf');
  const safeName = (candidateName || 'Applicant').replace(/[^a-zA-Z0-9_]/g, '_');
  blob.setName(`Message_${safeName}.pdf`);
  return blob;
}

/* ============================================================
 * WhatsApp: sending (Meta WhatsApp Cloud API)
 * ============================================================ */

/**
 * Normalizes a phone number for the WhatsApp Cloud API, which expects
 * digits only (no "+", spaces, or dashes) with the country code included.
 * @param {string} phone
 * @param {string} defaultCountryCode - digits only, e.g. "233"
 * @returns {string}
 */
function normalizeWhatsappNumber(phone, defaultCountryCode) {
  let digits = (phone || '').replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) {
    digits = digits.substring(1);
  } else if (digits.startsWith('00')) {
    digits = digits.substring(2);
  } else if (digits.startsWith('0') && defaultCountryCode) {
    digits = defaultCountryCode.replace(/\D/g, '') + digits.substring(1);
  }
  return digits;
}

/**
 * Uploads a PDF blob to WhatsApp as media, returning its media id.
 * @param {Blob} pdfBlob
 * @param {Object} config - WhatsApp config (from getWhatsappConfig)
 * @returns {string} media id
 */
function uploadWhatsappMedia(pdfBlob, config) {
  const url = `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/media`;
  const response = UrlFetchApp.fetch(url, {
    method: 'post',
    headers: { Authorization: 'Bearer ' + config.accessToken },
    payload: {
      messaging_product: 'whatsapp',
      file: pdfBlob,
      type: 'application/pdf'
    },
    muteHttpExceptions: true
  });

  if (response.getResponseCode() >= 300) {
    throw new Error('Media upload failed: ' + response.getContentText());
  }
  const data = JSON.parse(response.getContentText());
  if (!data.id) {
    throw new Error('Media upload did not return an id: ' + response.getContentText());
  }
  return data.id;
}

/**
 * Sends a branded PDF document to a candidate's WhatsApp number.
 * @param {string} phone
 * @param {Blob} pdfBlob
 * @param {string} caption
 * @param {Object} config
 * @returns {Object} { success, response }
 */
function sendWhatsappDocument(phone, pdfBlob, caption, config) {
  try {
    const toNumber = normalizeWhatsappNumber(phone, config.defaultCountryCode);
    if (!toNumber) {
      return { success: false, response: 'Invalid phone number' };
    }

    const mediaId = uploadWhatsappMedia(pdfBlob, config);

    const url = `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`;
    const payload = {
      messaging_product: 'whatsapp',
      to: toNumber,
      type: 'document',
      document: {
        id: mediaId,
        filename: pdfBlob.getName(),
        caption: caption || ''
      }
    };
    const response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + config.accessToken },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    return { success: response.getResponseCode() < 300, response: response.getContentText() };
  } catch (error) {
    return { success: false, response: error.message };
  }
}

/**
 * Logs a WhatsApp send attempt to the WhatsappLog sheet
 */
function logWhatsapp(phone, message, result, sentBy) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let logSheet = ss.getSheetByName('WhatsappLog');
    if (!logSheet) {
      logSheet = ss.insertSheet('WhatsappLog');
      logSheet.getRange(1, 1, 1, 6).setValues([['Timestamp', 'Recipient', 'Message', 'Success', 'Response', 'Sent By']]);
      logSheet.getRange(1, 1, 1, 6)
        .setBackground('#2e7d32')
        .setFontColor('#ffffff')
        .setFontWeight('bold');
      logSheet.setFrozenRows(1);
    }
    logSheet.appendRow([
      new Date().toISOString(),
      phone,
      message,
      result.success ? 'Yes' : 'No',
      (result.response || '').toString().substring(0, 500),
      sentBy || 'System'
    ]);
  } catch (error) {
    Logger.log('Error logging WhatsApp message: ' + error.toString());
  }
}

/**
 * Sends a branded PDF WhatsApp message to a single candidate. Fails
 * gracefully (success:false with a clear message) if WhatsApp is
 * disabled/unconfigured.
 * @param {string} phone
 * @param {string} candidateName
 * @param {string} messageText - becomes both the PDF body and the document caption
 * @returns {Object} Response object
 */
function sendWhatsappToCandidate(phone, candidateName, messageText) {
  try {
    if (!phone) {
      return { success: false, message: 'No phone number provided' };
    }

    const config = getWhatsappConfig();
    if (!config.enabled) {
      return { success: false, message: 'WhatsApp is disabled. Enable it in Admin > Settings > WhatsApp.' };
    }
    if (!config.phoneNumberId || !config.accessToken) {
      return { success: false, message: 'WhatsApp Phone Number ID / Access Token not set.' };
    }

    const company = getCompanyInfo();
    const pdfBlob = buildWhatsappNoticePdf(candidateName, messageText);
    const caption = `${company.name || 'HR Team'} - Message for ${candidateName || 'you'}`;
    const result = sendWhatsappDocument(phone, pdfBlob, caption, config);
    logWhatsapp(phone, messageText, result, 'Admin');

    if (!result.success) {
      Logger.log('WhatsApp send failed for ' + phone + ': ' + result.response);
      return { success: false, message: 'WhatsApp provider error: ' + result.response };
    }

    return { success: true, message: 'WhatsApp message sent successfully' };
  } catch (error) {
    Logger.log('Error sending WhatsApp message: ' + error.toString());
    return { success: false, message: error.message };
  }
}

/**
 * Sends a test WhatsApp message to verify the current configuration
 * @param {string} phone
 * @returns {Object} Response object
 */
function sendTestWhatsapp(phone) {
  return sendWhatsappToCandidate(phone, 'Test', 'This is a test message from your Job Application System. WhatsApp is configured correctly!');
}

/**
 * Sends the same message (as individually branded PDFs) to multiple candidates
 * @param {Array} recipients - [{ phone, name }]
 * @param {string} message
 * @returns {Object} Response object
 */
function sendBulkWhatsapp(recipients, message) {
  try {
    const config = getWhatsappConfig();
    if (!config.enabled) {
      return { success: false, message: 'WhatsApp is disabled. Enable it in Admin > Settings > WhatsApp.' };
    }

    let successCount = 0;
    const failedNumbers = [];

    recipients.forEach(recipient => {
      const result = sendWhatsappToCandidate(recipient.phone, recipient.name, message);
      if (result.success) {
        successCount++;
      } else {
        failedNumbers.push(recipient.phone);
      }
    });

    return {
      success: true,
      message: `WhatsApp sent: ${successCount}/${recipients.length}`,
      failedNumbers: failedNumbers
    };
  } catch (error) {
    Logger.log('Error sending bulk WhatsApp: ' + error.toString());
    return { success: false, message: error.message };
  }
}

/**
 * Sends an automatic WhatsApp message for a given template type if
 * WhatsApp is enabled in settings. Never throws - failures are logged
 * only, so they never block email/SMS/sheet writes.
 * @param {string} templateType - 'confirmation' | 'interview'
 * @param {string} phone
 * @param {string} candidateName
 * @param {Object} replacements - map of placeholder -> value
 */
function maybeSendAutoWhatsapp(templateType, phone, candidateName, replacements) {
  try {
    const config = getWhatsappConfig();
    if (!config.enabled || !phone) return;

    const templates = getWhatsappTemplates();
    let message = templates[templateType] || '';
    Object.keys(replacements || {}).forEach(placeholder => {
      message = message.split(placeholder).join(replacements[placeholder] || '');
    });

    sendWhatsappToCandidate(phone, candidateName, message);
  } catch (error) {
    Logger.log('Auto WhatsApp (' + templateType + ') failed: ' + error.toString());
  }
}

/* ============================================================
 * Admin-controlled form fields (show/hide built-in field groups,
 * define custom fields)
 * ============================================================ */

function getDefaultFormFieldsConfig() {
  return {
    hiddenFields: [],
    customFields: []
  };
}

/**
 * Gets the saved form fields configuration
 * @returns {Object} { hiddenFields: string[], customFields: Object[] }
 */
function getFormFieldsConfig() {
  try {
    const raw = getSetting('FORM_FIELDS_CONFIG', '');
    const defaults = getDefaultFormFieldsConfig();
    if (!raw) return defaults;

    const parsed = JSON.parse(raw);
    return {
      hiddenFields: Array.isArray(parsed.hiddenFields) ? parsed.hiddenFields : defaults.hiddenFields,
      customFields: Array.isArray(parsed.customFields) ? parsed.customFields : defaults.customFields
    };
  } catch (error) {
    Logger.log('Error getting form fields config: ' + error.toString());
    return getDefaultFormFieldsConfig();
  }
}

/**
 * Saves the form fields configuration
 * @param {Object} config - { hiddenFields: string[], customFields: Object[] }
 * @returns {Object} Response object
 */
function saveFormFieldsConfig(config) {
  try {
    setSetting('FORM_FIELDS_CONFIG', JSON.stringify(config));
    return { status: 'success', message: 'Form fields saved successfully' };
  } catch (error) {
    Logger.log('Error saving form fields config: ' + error.toString());
    return { status: 'error', message: 'Failed to save form fields: ' + error.message };
  }
}

/* ============================================================
 * Company info (used to brand outgoing emails)
 * ============================================================ */

function getDefaultCompanyInfo() {
  return {
    name: '',
    description: '',
    website: '',
    address: '',
    phone: '',
    email: '',
    // Heading shown at the top of the admin dashboard (defaults to the
    // original "Candidate Management System" if never customized)
    dashboardTitle: ''
  };
}

/**
 * Gets the saved company info
 * @returns {Object} { name, description, website, address }
 */
function getCompanyInfo() {
  try {
    const raw = getSetting('COMPANY_INFO', '');
    const defaults = getDefaultCompanyInfo();
    if (!raw) return defaults;
    return Object.assign({}, defaults, JSON.parse(raw));
  } catch (error) {
    Logger.log('Error getting company info: ' + error.toString());
    return getDefaultCompanyInfo();
  }
}

/**
 * Saves company info
 * @param {Object} info - { name, description, website, address }
 * @returns {Object} Response object
 */
function saveCompanyInfo(info) {
  try {
    setSetting('COMPANY_INFO', JSON.stringify(info));
    return { status: 'success', message: 'Company info saved successfully' };
  } catch (error) {
    Logger.log('Error saving company info: ' + error.toString());
    return { status: 'error', message: 'Failed to save company info: ' + error.message };
  }
}

/* ============================================================
 * Branded HTML emails
 * Wraps a plain-text email body in a styled HTML shell using the
 * saved company info and the current appearance theme's colors, so
 * outgoing mail looks like it came from a real company rather than a
 * bare-text script.
 * ============================================================ */

function escapeHtmlForEmail(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Builds a branded HTML version of a plain-text email body
 * @param {string} plainBody - The plain-text email body
 * @returns {string} HTML email body
 */
function buildEmailHtml(plainBody) {
  const company = getCompanyInfo();
  let theme;
  try {
    theme = getThemeConfig().colors;
  } catch (e) {
    theme = getDefaultThemeConfig().colors;
  }

  const companyName = company.name || 'HR Team';
  const bodyHtml = escapeHtmlForEmail(plainBody).replace(/\n/g, '<br>');

  const descriptionRow = company.description
    ? `<div style="color:rgba(255,255,255,0.9);font-size:13px;margin-top:6px;">${escapeHtmlForEmail(company.description)}</div>`
    : '';

  const addressRow = company.address
    ? `${escapeHtmlForEmail(company.address)}<br>`
    : '';

  const websiteRow = company.website
    ? `<a href="${escapeHtmlForEmail(company.website)}" style="color:${theme.dark};text-decoration:none;">${escapeHtmlForEmail(company.website)}</a><br>`
    : '';

  const contactBits = [];
  if (company.phone) contactBits.push(escapeHtmlForEmail(company.phone));
  if (company.email) {
    contactBits.push(`<a href="mailto:${escapeHtmlForEmail(company.email)}" style="color:${theme.dark};text-decoration:none;">${escapeHtmlForEmail(company.email)}</a>`);
  }
  const contactRow = contactBits.length
    ? `<div style="margin-top:6px;">${contactBits.join(' &nbsp;|&nbsp; ')}</div>`
    : '';

  let social = {};
  try {
    social = getSocialLinks();
  } catch (e) {
    social = {};
  }
  const socialEntries = [
    social.facebook ? { label: 'Facebook', url: social.facebook } : null,
    social.twitter ? { label: 'Twitter / X', url: social.twitter } : null,
    social.instagram ? { label: 'Instagram', url: social.instagram } : null,
    social.linkedin ? { label: 'LinkedIn', url: social.linkedin } : null
  ].filter(Boolean);
  const socialRow = socialEntries.length
    ? `<div style="margin-top:12px;">${socialEntries.map(s =>
        `<a href="${escapeHtmlForEmail(s.url)}" style="display:inline-block;margin:0 8px;color:${theme.dark};text-decoration:none;font-weight:600;">${escapeHtmlForEmail(s.label)}</a>`
      ).join('')}</div>`
    : '';

  return `
<div style="font-family: 'Segoe UI', Arial, sans-serif; background:#f4f6f5; padding:30px 16px;">
  <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 16px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg, ${theme.dark} 0%, ${theme.mid} 100%); padding:28px 30px; text-align:center;">
      <div style="color:#ffffff; font-size:22px; font-weight:700; letter-spacing:0.3px;">${escapeHtmlForEmail(companyName)}</div>
      ${descriptionRow}
    </div>
    <div style="padding:32px 30px; color:#2b2b2b; font-size:15px; line-height:1.7;">
      ${bodyHtml}
    </div>
    <div style="padding:18px 30px; background:#fafafa; border-top:1px solid #eee; font-size:12px; color:#888; text-align:center;">
      ${addressRow}${websiteRow}${contactRow}${socialRow}
    </div>
  </div>
</div>`;
}

/**
 * Sends a branded email (plain-text body + matching HTML version).
 * Centralizes the MailApp call so every outgoing email looks consistent.
 * @param {string} to
 * @param {string} subject
 * @param {string} plainBody
 */
function sendBrandedEmail(to, subject, plainBody, attachments) {
  const company = getCompanyInfo();
  const options = {
    to: to,
    subject: subject,
    body: plainBody,
    htmlBody: buildEmailHtml(plainBody),
    name: company.name || 'HR Team'
  };
  if (attachments && attachments.length) {
    options.attachments = attachments;
  }
  MailApp.sendEmail(options);
}

/* ============================================================
 * Application summary PDF (attached to the confirmation email)
 * ============================================================ */

function summaryRow(label, value) {
  const display = (value === undefined || value === null || value === '') ? 'Not provided' : String(value);
  return `<tr>
    <td style="padding:6px 12px;color:#666;font-size:11px;width:170px;vertical-align:top;border-bottom:1px solid #f0f0f0;">${escapeHtmlForEmail(label)}</td>
    <td style="padding:6px 12px;font-size:13px;color:#222;vertical-align:top;border-bottom:1px solid #f0f0f0;">${escapeHtmlForEmail(display)}</td>
  </tr>`;
}

function summarySectionTitle(title) {
  return `<h3 style="margin:22px 0 8px 0;color:#2e7d32;font-size:14px;border-bottom:2px solid #e8f5e9;padding-bottom:6px;">${escapeHtmlForEmail(title)}</h3>`;
}

function summaryTable(rows) {
  return `<table style="width:100%;border-collapse:collapse;">${rows.join('')}</table>`;
}

/**
 * Builds a printable HTML summary of everything the applicant submitted,
 * used to generate the PDF attached to their confirmation email. Sections
 * with no data at all (e.g. an education group the applicant skipped) are
 * left out rather than showing a wall of "Not provided".
 * @param {Object} formData
 * @returns {string} HTML
 */
function buildApplicationSummaryHtml(formData) {
  const company = getCompanyInfo();
  const hasAny = (fields) => fields.some(f => formData[f]);

  let html = `<html><head><meta charset="utf-8"></head><body style="font-family:Arial, Helvetica, sans-serif; color:#222; padding:10px 6px;">`;

  html += `<div style="border-bottom:3px solid #2e7d32; padding-bottom:12px; margin-bottom:8px;">
    <div style="font-size:19px; font-weight:bold; color:#2e7d32;">${escapeHtmlForEmail(company.name || 'Job Application')}</div>
    <div style="font-size:12px; color:#888; margin-top:2px;">Application Summary - ${escapeHtmlForEmail(new Date().toLocaleString())}</div>
  </div>`;

  html += summarySectionTitle('Position');
  html += summaryTable([summaryRow('Applying For', formData.applyingFor)]);

  html += summarySectionTitle('Personal Information');
  html += summaryTable([
    summaryRow('First Name', formData.firstName),
    summaryRow('Last Name', formData.lastName),
    summaryRow('Email', formData.email),
    summaryRow('Mobile', formData.mobile),
    summaryRow('Date of Birth', formData.dob ? formatISODate(formData.dob) : ''),
    summaryRow('Religion', formData.religion),
    summaryRow('Marital Status', formData.maritalStatus),
    summaryRow('Gender', formData.gender),
    summaryRow('Nationality', formData.nationality),
    summaryRow('Current Address', formData.currentAddress),
    summaryRow('Permanent Address', formData.permanentAddress)
  ]);

  if (hasAny(['sscInstitute', 'sscMajor', 'sscYear', 'sscGrade'])) {
    html += summarySectionTitle('SSC (Secondary School Certificate)');
    html += summaryTable([
      summaryRow('Institute', formData.sscInstitute),
      summaryRow('Major Subject', formData.sscMajor),
      summaryRow('Passing Year', formData.sscYear),
      summaryRow('GPA/Grade', formData.sscGrade)
    ]);
  }

  if (hasAny(['hscInstitute', 'hscMajor', 'hscYear', 'hscGrade'])) {
    html += summarySectionTitle('HSC (Higher Secondary Certificate)');
    html += summaryTable([
      summaryRow('Institute', formData.hscInstitute),
      summaryRow('Major Subject', formData.hscMajor),
      summaryRow('Passing Year', formData.hscYear),
      summaryRow('GPA/Grade', formData.hscGrade)
    ]);
  }

  if (hasAny(['bachelorDegree', 'bachelorInstitute', 'bachelorMajor', 'bachelorGrade'])) {
    html += summarySectionTitle('Bachelor/Undergraduate');
    html += summaryTable([
      summaryRow('Degree Name', formData.bachelorDegree),
      summaryRow('Institute', formData.bachelorInstitute),
      summaryRow('Major Subject', formData.bachelorMajor),
      summaryRow('CGPA/Grade', formData.bachelorGrade)
    ]);
  }

  if (hasAny(['hndProgramme', 'hndInstitute', 'hndMajor', 'hndGrade'])) {
    html += summarySectionTitle('HND (Higher National Diploma)');
    html += summaryTable([
      summaryRow('Programme Name', formData.hndProgramme),
      summaryRow('Institute', formData.hndInstitute),
      summaryRow('Major Subject', formData.hndMajor),
      summaryRow('CGPA/Grade', formData.hndGrade)
    ]);
  }

  if (hasAny(['postgraduateDegree', 'postgraduateInstitute', 'postgraduateMajor', 'postgraduateGrade'])) {
    html += summarySectionTitle('Postgraduate');
    html += summaryTable([
      summaryRow('Degree Name', formData.postgraduateDegree),
      summaryRow('Institute', formData.postgraduateInstitute),
      summaryRow('Major Subject', formData.postgraduateMajor),
      summaryRow('CGPA/Grade', formData.postgraduateGrade)
    ]);
  }

  if (hasAny(['yearsOfExperience', 'lastOrganisation', 'lastDesignation'])) {
    html += summarySectionTitle('Experience');
    html += summaryTable([
      summaryRow('Years of Experience', formData.yearsOfExperience),
      summaryRow('Last Organisation', formData.lastOrganisation),
      summaryRow('Last Designation', formData.lastDesignation),
      summaryRow('Joining Date', formData.joiningDate ? formatISODate(formData.joiningDate) : ''),
      summaryRow('Currently Working', formData.currentlyWorking ? 'Yes' : 'No'),
      summaryRow('End Date', (!formData.currentlyWorking && formData.endDate) ? formatISODate(formData.endDate) : '')
    ]);
  }

  if (formData.customFieldValues && Object.keys(formData.customFieldValues).length > 0) {
    try {
      const fieldsConfig = getFormFieldsConfig();
      const rows = fieldsConfig.customFields
        .filter(f => formData.customFieldValues[f.id])
        .map(f => summaryRow(f.label, formData.customFieldValues[f.id]));
      if (rows.length > 0) {
        html += summarySectionTitle('Additional Information');
        html += summaryTable(rows);
      }
    } catch (e) {
      Logger.log('Could not render custom fields in PDF: ' + e.toString());
    }
  }

  html += `<div style="margin-top:24px; padding-top:10px; border-top:1px solid #eee; font-size:10px; color:#999; text-align:center;">
    Generated automatically upon submission${company.website ? ' - ' + escapeHtmlForEmail(company.website) : ''}
  </div>`;

  html += `</body></html>`;
  return html;
}

/**
 * Converts the application summary to a PDF blob for emailing.
 * @param {Object} formData
 * @returns {Blob}
 */
function buildApplicationPdf(formData) {
  const html = buildApplicationSummaryHtml(formData);
  const blob = HtmlService.createHtmlOutput(html).getAs('application/pdf');
  const safeName = `${formData.firstName || 'Applicant'}_${formData.lastName || ''}`.replace(/[^a-zA-Z0-9_]/g, '_');
  blob.setName(`Application_${safeName}.pdf`);
  return blob;
}
