
function getFrameFolder() {
  const folderName = 'CanvasFramesPhotos';
  const folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  } else {
    return DriveApp.createFolder(folderName);
  }
}
function uploadImageToDrive(base64Image, fileName) {
  try {
    const frameFolder = getFrameFolder();
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
    const blob = Utilities.newBlob(Utilities.base64Decode(base64Data));
    blob.setName(fileName || 'frame_photo_' + new Date().getTime() + '.jpg');
    const file = frameFolder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // Get file ID
    const fileId = file.getId();
    
    // Return formatted URL
    return 'https://lh3.google.com/u/0/d/' + fileId;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Failed to upload image: ' + error.toString());
  }
}

function doGet(e) {
  try {
    checkAndMigrateSheets();
  } catch (err) {
    console.error('Error running checkAndMigrateSheets:', err);
  }
  const page = e.parameter.page || 'index';
  let template;
  let title;
  
  switch(page) {
    case 'dashboard':
      template = HtmlService.createTemplateFromFile('dashboard');
      title = 'Admin Dashboard - Frame Shop Management';
      break;
    case 'workshop':
      template = HtmlService.createTemplateFromFile('workshop');
      title = 'Workshop Dashboard - Frame Production';
      break;
    case 'delivery':
      template = HtmlService.createTemplateFromFile('delivery');
      title = 'Delivery Portal - Order Dispatch';
      break;
    default:
      template = HtmlService.createTemplateFromFile('index');
      title = 'HD Laminated Canvas Frames - Order Online';
  }
  
  return template
    .evaluate()
    .setTitle(title)
    .setSandboxMode(HtmlService.SandboxMode.NATIVE)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getMenuItems() {
  try {
    // Get the Frames sheet specifically
    let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Frames');
    
    // If Frames sheet doesn't exist, try the first sheet
    if (!sheet) {
      sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    }
    
    // Get all data from the sheet (assuming headers in row 1)
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    // Skip header row and process data
    const menuItems = [];
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      
      // Skip empty rows
      if (!row[0]) continue;
      
      menuItems.push({
        id: i + 1, // Actual row number in sheet (i+1 because i starts at 1 after skipping header)
        rowIndex: i + 1, // Store actual sheet row number for editing/deleting
        name: row[0] || '',
        price: row[1] || 0,
        originalPrice: row[2] || null,
        image: row[3] || 'https://via.placeholder.com/400',
        badge: row[4] || '',
        badgeType: row[5] || '',
        size: row[6] || '',      // Rename Servings to Size in object
        servings: row[6] || '',  // Keep for backwards compatibility
        discount: row[7] || null,
        category: row[8] || 'Popular!',
        stock: row[9] === undefined || row[9] === '' ? 50 : Number(row[9])
      });
    }
    
    return menuItems;
  } catch (error) {
    console.error('Error fetching menu items:', error);
    return [];
  }
}

function getMenuItemsByCategory() {
  try {
    const menuItems = getMenuItems();
    const categories = getCategories();
    
    // Group items by category
    const itemsByCategory = {};
    categories.forEach(category => {
      itemsByCategory[category] = menuItems.filter(item => item.category === category);
    });
    
    return itemsByCategory;
  } catch (error) {
    console.error('Error fetching items by category:', error);
    return {};
  }
}

function getCategories() {
  try {
    // Get the Frames sheet specifically
    let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Frames');
    
    // If Frames sheet doesn't exist, try the first sheet
    if (!sheet) {
      sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    }
    
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    // Get unique categories from column I (index 8), skip header
    const categories = new Set();
    for (let i = 1; i < values.length; i++) {
      if (values[i][8]) { // Category column
        categories.add(values[i][8]);
      }
    }
    
    // Return unique categories as array
    return Array.from(categories).sort();
  } catch (error) {
    console.error('Error fetching categories:', error);
    // Return default categories as fallback
    return ['Popular!'];
  }
}

function setupDemoData() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
    // Setup Frames sheet (originally MenuItems)
    let menuSheet = spreadsheet.getSheetByName('Frames');
    if (!menuSheet) {
      const oldSheet = spreadsheet.getSheetByName('MenuItems');
      if (oldSheet) {
        menuSheet = oldSheet;
        menuSheet.setName('Frames');
      } else {
        menuSheet = spreadsheet.insertSheet('Frames');
      }
    }
    
    // Clear and setup Frames sheet
    menuSheet.clear();
    
    // Set headers
    const headers = [
      'Name', 
      'Price', 
      'Original Price', 
      'Image URL', 
      'Badge', 
      'Badge Type', 
      'Size', 
      'Discount %', 
      'Category'
    ];
    menuSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Frame shop demo data
    const demoData = [
      // Single Canvas Frames
      [
        'A4 Laminated Canvas Frame',
        1200,
        1500,
        'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&h=400&fit=crop',
        'Popular',
        'yellow',
        '8.3" x 11.7"',
        20,
        'Single Canvas Frames'
      ],
      [
        'A3 Premium Laminated Frame',
        2200,
        null,
        'https://images.unsplash.com/photo-1580136579312-94651dfd596d?w=400&h=400&fit=crop',
        'New',
        'green',
        '11.7" x 16.5"',
        null,
        'Single Canvas Frames'
      ],
      [
        '12x18 HD Canvas Frame',
        2800,
        3500,
        'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400&h=400&fit=crop',
        'Best Seller',
        'red',
        '12" x 18"',
        20,
        'Single Canvas Frames'
      ],
      [
        '16x24 Statement Canvas Frame',
        4500,
        null,
        'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=400&h=400&fit=crop',
        null,
        null,
        '16" x 24"',
        null,
        'Single Canvas Frames'
      ],
      
      // Collage Frames
      [
        '3-in-1 Storyboard Frame',
        3500,
        4200,
        'https://images.unsplash.com/photo-1544273677-c433136021d4?w=400&h=400&fit=crop',
        'Best Value',
        'green',
        '12" x 24"',
        16,
        'Collage Frames'
      ],
      [
        '4-Piece Grid Gallery Set',
        5500,
        null,
        'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400&h=400&fit=crop',
        'New',
        'green',
        '10" x 10" each',
        null,
        'Collage Frames'
      ],
      [
        'Family Memories 9-Photo Frame',
        7500,
        9000,
        'https://images.unsplash.com/photo-1578301978018-3005759f48f7?w=400&h=400&fit=crop',
        'Premium Choice',
        'purple',
        '20" x 20"',
        16,
        'Collage Frames'
      ],
      
      // Hexagon Panels
      [
        'Hexagon Panel - Set of 3',
        3800,
        4500,
        'https://images.unsplash.com/photo-1501472312651-726afd116ff1?w=400&h=400&fit=crop',
        null,
        null,
        '10" x 10" each',
        15,
        'Hexagon Canvas Panels'
      ],
      [
        'Hexagon Panel - Set of 6',
        7000,
        null,
        'https://images.unsplash.com/photo-1554188248-14164d396120?w=400&h=400&fit=crop',
        'Wall Filler',
        'blue',
        '10" x 10" each',
        null,
        'Hexagon Canvas Panels'
      ],
      
      // Panoramic Frames
      [
        'Panoramic Landscape Canvas Frame',
        4800,
        5500,
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=400&fit=crop',
        'Landscape',
        'blue',
        '12" x 36"',
        12,
        'Panoramic Frames'
      ],
      
      // Accessories
      [
        'Premium Wooden Table Easel',
        800,
        null,
        'https://images.unsplash.com/photo-1579783928621-7a13d66a62d1?w=400&h=400&fit=crop',
        null,
        null,
        'Standard Size',
        null,
        'Accessories & Stands'
      ],
      [
        'Heavy-Duty Wall Hanging Kit',
        250,
        300,
        'https://images.unsplash.com/photo-1582201942988-13e60e4556ee?w=400&h=400&fit=crop',
        'Essential',
        'red',
        'Fits All Sizes',
        16,
        'Accessories & Stands'
      ]
    ];
    
    // Add demo data to sheet
    if (demoData.length > 0) {
      menuSheet.getRange(2, 1, demoData.length, headers.length).setValues(demoData);
    }
    
    // Format header row
    const headerRange = menuSheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#f3f4f6');
    
    // Auto-resize columns
    for (let i = 1; i <= headers.length; i++) {
      menuSheet.autoResizeColumn(i);
    }
    
    // Setup Banners sheet
    setupBannersSheet();
    
    // Setup Branches sheet
    setupBranchesSheet();
    
    // Setup Users sheet - verify default logins are present
    let usersSheet = spreadsheet.getSheetByName('Users');
    if (!usersSheet) {
      createUsersSheet();
    } else {
      const data = usersSheet.getDataRange().getValues();
      let hasAdmin = false;
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === 'admin') {
          hasAdmin = true;
          break;
        }
      }
      if (!hasAdmin) {
        // Append default admin user at least
        usersSheet.appendRow(['admin', 'admin123', 'admin', 'Admin User', '+92 300 1234567']);
      }
    }
    
    // Setup Orders sheet if not exists
    const ordersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Orders');
    if (!ordersSheet) {
      createOrdersSheet();
    }
    
    // Setup DeliveryApps sheet if not exists
    setupDeliveryAppsSheet();
    
    // Setup Settings sheet if not exists
    const settingsSheet = spreadsheet.getSheetByName('Settings');
    if (!settingsSheet) {
      setupSettingsSheet();
    }
    
    return 'Demo data setup complete! ' + demoData.length + ' canvas frames added, plus banners, branches, delivery apps, and settings.';
    
  } catch (error) {
    console.error('Error setting up demo data:', error);
    return 'Error: ' + error.toString();
  }
}

function setupBannersSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName('Banners');
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet('Banners');
  } else {
    sheet.clear();
  }
  
  const headers = ['Title', 'Subtitle', 'Image URL', 'Link', 'Active'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  const bannerData = [
    [
      'Grand Opening Offer',
      'Get 20% off on all premium laminated canvas frames',
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=1200&h=400&fit=crop',
      '#',
      true
    ],
    [
      'Custom Collage Panels',
      'Showcase your favorite memories in dynamic layouts',
      'https://images.unsplash.com/photo-1544273677-c433136021d4?w=1200&h=400&fit=crop',
      '#',
      true
    ],
    [
      'HD Laminated Prints',
      'Ultra-crisp gloss and matte laminations for lifelong durability',
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=1200&h=400&fit=crop',
      '#',
      true
    ],
    [
      'Free Delivery Available',
      'On orders above Rs 3000',
      'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=1200&h=400&fit=crop',
      '#',
      true
    ]
  ];
  
  if (bannerData.length > 0) {
    sheet.getRange(2, 1, bannerData.length, headers.length).setValues(bannerData);
  }
  
  // Format headers
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#f3f4f6');
  
  // Auto-resize columns
  for (let i = 1; i <= headers.length; i++) {
    sheet.autoResizeColumn(i);
  }
}

function setupBranchesSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName('Branches');
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet('Branches');
  } else {
    sheet.clear();
  }
  
  const headers = ['Branch Name', 'City', 'Area', 'Address', 'Phone', 'Timing', 'Active'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  const branchData = [
    [
      'Main Showroom',
      'Karachi',
      'Gulshan-e-Iqbal',
      'Shop 2, University Road Frame Center',
      '+92 321 1234567',
      '10:00 AM - 09:00 PM',
      true
    ],
    [
      'Clifton Gallery',
      'Karachi',
      'Clifton',
      'Showroom 4, Sea Breeze Plaza, Clifton',
      '+92 321 3456789',
      '11:00 AM - 10:00 PM',
      true
    ],
    [
      'Lahore Main Store',
      'Lahore',
      'Gulberg',
      'MM Alam Road Frame Center, Gulberg III',
      '+92 321 5678901',
      '11:00 AM - 09:00 PM',
      true
    ],
    [
      'Islamabad Outlet',
      'Islamabad',
      'F-7',
      'F-7 Markaz Plaza, Jinnah Super',
      '+92 321 6789012',
      '11:00 AM - 09:00 PM',
      true
    ]
  ];
  
  if (branchData.length > 0) {
    sheet.getRange(2, 1, branchData.length, headers.length).setValues(branchData);
  }
  
  // Format headers
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#f3f4f6');
  
  // Auto-resize columns
  for (let i = 1; i <= headers.length; i++) {
    sheet.autoResizeColumn(i);
  }
}

// Menu function to add setup option in Google Sheets
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Frame Catalog Setup')
    .addItem('Setup All Demo Data', 'setupDemoData')
    .addItem('Setup Frames Sheet Only', 'setupFramesSheet')
    .addItem('Setup Banners Only', 'setupBannersSheet')
    .addItem('Setup Branches Only', 'setupBranchesSheet')
    .addItem('Setup Users Only', 'createUsersSheet')
    .addItem('Setup Delivery Apps Sheet Only', 'setupDeliveryAppsSheet')
    .addItem('Clear Current Sheet', 'clearCurrentSheet')
    .addToUi();
}

function clearCurrentSheet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  sheet.clear();
  SpreadsheetApp.getUi().alert('Current sheet cleared!');
  return 'Current sheet cleared!';
}

function setupFramesSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName('Frames');
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet('Frames');
  } else {
    sheet.clear();
  }
  
  const headers = [
    'Name', 'Price', 'Original Price', 'Image URL', 
    'Badge', 'Badge Type', 'Size', 'Discount %', 'Category'
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  SpreadsheetApp.getUi().alert('Frames sheet setup complete!');
}

// Banner/Slider functions
function getBanners() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Banners');
    if (!sheet) return [];
    
    const data = sheet.getDataRange().getValues();
    const banners = [];
    
    for (let i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      
      banners.push({
        id: i + 1, // Actual row number in sheet
        rowIndex: i + 1, // Store actual sheet row number for editing/deleting
        title: data[i][0] || '',
        subtitle: data[i][1] || '',
        image: data[i][2] || '',
        link: data[i][3] || '',
        active: data[i][4] !== false
      });
    }
    
    return banners.filter(b => b.active);
  } catch (error) {
    console.error('Error fetching banners:', error);
    return [];
  }
}

// Branch functions
function getBranches() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Branches');
    if (!sheet) return [];
    
    const data = sheet.getDataRange().getValues();
    const branches = [];
    
    for (let i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      
      branches.push({
        id: i + 1, // Actual row number in sheet
        rowIndex: i + 1, // Store actual sheet row number for editing/deleting
        name: data[i][0] || '',
        city: data[i][1] || '',
        area: data[i][2] || '',
        address: data[i][3] || '',
        phone: data[i][4] || '',
        timing: data[i][5] || '',
        active: data[i][6] !== false
      });
    }
    
    return branches.filter(b => b.active);
  } catch (error) {
    console.error('Error fetching branches:', error);
    return [];
  }
}

// Order functions
function submitOrder(orderData) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Orders');
    if (!sheet) {
      createOrdersSheet();
    }
    
    // Process items: upload any base64 images to Drive and get URLs
    const processedItems = orderData.items.map(item => {
      if (item.photoOption === 'system' && item.photoBase64) {
        try {
          const fileName = 'FRAME_ORDER_' + Date.now() + '_' + (item.photoName || 'photo.jpg');
          const fileUrl = uploadImageToDrive(item.photoBase64, fileName);
          // Return item without base64 to avoid bloating sheet cell limit
          return {
            id: item.id,
            menuItemId: item.menuItemId,
            name: item.name,
            price: item.price,
            image: item.image,
            size: item.size,
            photoOption: item.photoOption,
            photoUrl: fileUrl,
            photoName: item.photoName,
            quantity: item.quantity
          };
        } catch (uploadError) {
          console.error('Error uploading item photo:', uploadError);
          return {
            id: item.id,
            menuItemId: item.menuItemId,
            name: item.name,
            price: item.price,
            image: item.image,
            size: item.size,
            photoOption: item.photoOption,
            photoUrl: 'failed_to_upload',
            photoName: item.photoName,
            quantity: item.quantity
          };
        }
      }
      return {
        id: item.id,
        menuItemId: item.menuItemId,
        name: item.name,
        price: item.price,
        image: item.image,
        size: item.size,
        photoOption: item.photoOption,
        photoUrl: null,
        quantity: item.quantity
      };
    });
    
    const orderId = 'ORD' + Date.now();
    const timestamp = new Date().toISOString();
    
    const newRow = [
      orderId,
      timestamp,
      orderData.type, // delivery or pickup
      orderData.customerName,
      orderData.phone,
      orderData.email,
      orderData.address || '',
      orderData.city || '',
      orderData.area || '',
      orderData.branch || '',
      JSON.stringify(processedItems),
      orderData.subtotal,
      orderData.deliveryCharge || 0,
      orderData.total,
      'Pending',
      orderData.notes || '',
      '', // Workshop Staff (index 16 / col 17)
      '', // Workshop Time (index 17 / col 18)
      '', // Assigned Rider (index 18 / col 19)
      '', // Delivery Time (index 19 / col 20)
      '', // Completed Time (index 20 / col 21)
      orderData.deliveryOption || '', // Delivery Option (index 21 / col 22)
      orderData.transactionId || '', // Transaction ID (index 22 / col 23)
      'Unconfirmed', // Payment Status (index 23 / col 24)
      orderData.paymentMethod || '', // Payment Method name/details snapshot (index 24 / col 25)
      orderData.deliveryBookingMode || '', // 'shop' | 'admin' | 'self' (index 25 / col 26)
      '', // Delivery Fee - filled by admin later (index 26 / col 27)
      '', // Rider Bike Number - filled by admin later (index 27 / col 28)
      ''  // Rider Tracking URL - filled by admin later (index 28 / col 29)
    ];
    
    const ordersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Orders');
    ordersSheet.appendRow(newRow);
    
    // Decrement catalog stock levels
    decrementItemStock(orderData.items);
    
    // Send email confirmation
    sendOrderConfirmation(orderData, orderId);
    
    return { success: true, orderId: orderId, message: 'Order placed successfully!' };
  } catch (error) {
    console.error('Error submitting order:', error);
    return { success: false, message: 'Failed to place order' };
  }
}

function createOrdersSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.insertSheet('Orders');

  const headers = [
    'Order ID', 'Timestamp', 'Type', 'Customer Name', 'Phone', 'Email',
    'Address', 'City', 'Area', 'Branch', 'Items', 'Subtotal',
    'Delivery Charge', 'Total', 'Status', 'Notes', 'Workshop Staff',
    'Workshop Time', 'Assigned Rider', 'Delivery Time', 'Completed Time', 'Delivery Option',
    'Transaction ID', 'Payment Status', 'Payment Method', 'Delivery Booking Mode',
    'Delivery Fee', 'Rider Bike Number', 'Rider Tracking URL'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#f3f4f6');

  return sheet;
}

function sendOrderConfirmation(orderData, orderId) {
  try {
    // This is a placeholder - in production, you'd use MailApp.sendEmail
    console.log('Order confirmation email would be sent to:', orderData.email);
    console.log('Order ID:', orderId);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

function getOrders() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Orders');
    if (!sheet) return [];
    
    const data = sheet.getDataRange().getValues();
    const orders = [];
    
    for (let i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      
      orders.push({
        id: data[i][0],
        timestamp: data[i][1],
        type: data[i][2],
        customerName: data[i][3],
        phone: data[i][4],
        email: data[i][5],
        address: data[i][6],
        city: data[i][7],
        area: data[i][8],
        branch: data[i][9],
        items: JSON.parse(data[i][10] || '[]'),
        subtotal: data[i][11],
        deliveryCharge: data[i][12],
        total: data[i][13],
        status: data[i][14],
        notes: data[i][15],
        workshopStaff: data[i][16] || '',
        workshopTime: data[i][17] || '',
        rider: data[i][18] || '',
        deliveryTime: data[i][19] || '',
        completedTime: data[i][20] || '',
        deliveryOption: data[i][21] || '',
        transactionId: data[i][22] || '',
        paymentStatus: data[i][23] || 'Unconfirmed',
        paymentMethod: data[i][24] || '',
        deliveryBookingMode: data[i][25] || '',
        deliveryFee: data[i][26] || '',
        riderBikeNumber: data[i][27] || '',
        riderTrackingUrl: data[i][28] || ''
      });
    }

    return orders.reverse(); // Show newest first
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
}

function updateOrderStatus(orderId, newStatus) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Orders');
    if (!sheet) return { success: false, message: 'Orders sheet not found' };
    
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === orderId) {
        sheet.getRange(i + 1, 15).setValue(newStatus); // Status column
        
        if (newStatus === 'Delivered') {
          logOrderIncome(orderId, data[i][13]); // data[i][13] is total amount
        }
        
        // Trigger automatic SMS if configured
        triggerStatusChangeSMS(orderId, newStatus);
        
        return { success: true, message: 'Status updated successfully' };
      }
    }
    
    return { success: false, message: 'Order not found' };
  } catch (error) {
    console.error('Error updating order status:', error);
    return { success: false, message: 'Failed to update status' };
  }
}

// Authentication functions
function authenticateUser(username, password) {
  try {
    // Master fallback credentials for initial login / demo resiliency
    if (username === 'admin' && password === 'admin123') {
      return {
        success: true,
        user: { username: 'admin', role: 'admin', name: 'Master Admin', contact: '+92 300 1234567' }
      };
    } else if (username === 'workshop1' && password === 'workshop123') {
      return {
        success: true,
        user: { username: 'workshop1', role: 'kitchen', name: 'Workshop Staff 1', contact: '+92 301 2345678' }
      };
    } else if (username === 'delivery1' && password === 'delivery123') {
      return {
        success: true,
        user: { username: 'delivery1', role: 'rider', name: 'Shop Rider 1', contact: '+92 302 3456789' }
      };
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
    if (!sheet) {
      // Create Users sheet if it doesn't exist
      createUsersSheet();
      return { success: false, message: 'No users found. Please set up users first.' };
    }
    
    const data = sheet.getDataRange().getValues();
    
    // Check credentials (skip header row)
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === username && data[i][1] === password) {
        return { 
          success: true, 
          user: {
            username: data[i][0],
            role: data[i][2] || 'admin',
            name: data[i][3] || username,
            contact: data[i][4] || ''
          }
        };
      }
    }
    
    return { success: false, message: 'Invalid username or password' };
  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, message: 'Authentication failed' };
  }
}

function createUsersSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.insertSheet('Users');
  
  // Set headers - Added Name and Contact
  const headers = ['Username', 'Password', 'Role', 'Name', 'Contact'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Add default users for all roles
  const defaultUsers = [
    ['admin', 'admin123', 'admin', 'Admin User', '+92 300 1234567'],
    ['workshop1', 'workshop123', 'kitchen', 'Workshop Staff 1', '+92 301 2345678'],
    ['delivery1', 'delivery123', 'rider', 'Shop Rider 1', '+92 302 3456789']
  ];
  sheet.getRange(2, 1, defaultUsers.length, headers.length).setValues(defaultUsers);
  
  // Format headers
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#f3f4f6');
  
  return sheet;
}

// Dashboard functions
function getDashboardStats() {
  try {
    let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Frames');
    if (!sheet) {
      sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    }
    
    const data = sheet.getDataRange().getValues();
    
    // Skip header row
    const items = data.slice(1).filter(row => row[0]); // Filter out empty rows
    
    // Calculate statistics
    const totalItems = items.length;
    const categories = new Set(items.map(row => row[8])).size; // Unique categories
    const totalValue = items.reduce((sum, row) => sum + (row[1] || 0), 0);
    const discountedItems = items.filter(row => row[7]).length; // Items with discount
    
    // Get orders count
    const ordersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Orders');
    let totalOrders = 0;
    if (ordersSheet) {
      const ordersData = ordersSheet.getDataRange().getValues();
      totalOrders = ordersData.length - 1; // Minus header
    }
    
    return {
      totalItems,
      categories,
      totalValue,
      discountedItems,
      totalOrders,
      averagePrice: totalItems > 0 ? Math.round(totalValue / totalItems) : 0
    };
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    return {
      totalItems: 0,
      categories: 0,
      totalValue: 0,
      discountedItems: 0,
      totalOrders: 0,
      averagePrice: 0
    };
  }
}

// CRUD Operations for Menu Items
function addMenuItem(item) {
  try {
    let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Frames');
    if (!sheet) {
      // Create Frames sheet if it doesn't exist
      sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('Frames');
      // Add headers
      const headers = ['Name', 'Price', 'Original Price', 'Image URL', 'Badge', 'Badge Type', 'Size', 'Discount %', 'Category', 'Stock'];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#f3f4f6');
    }
    
    // Check if headers exist, if not add them
    const firstRow = sheet.getRange(1, 1, 1, 10).getValues()[0];
    if (!firstRow[0] || firstRow[0] === '') {
      const headers = ['Name', 'Price', 'Original Price', 'Image URL', 'Badge', 'Badge Type', 'Size', 'Discount %', 'Category', 'Stock'];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#f3f4f6');
    }
    
    // Handle image upload if base64 image is provided
    let imageUrl = item.image || 'https://via.placeholder.com/400';
    if (item.imageBase64) {
      try {
        imageUrl = uploadImageToDrive(item.imageBase64, item.imageName || item.name + '_image.jpg');
      } catch (error) {
        console.error('Error uploading image:', error);
        // Keep the default or existing image URL if upload fails
      }
    } else if (item.image && !item.image.startsWith('https://lh3.google.com/u/0/d/')) {
      // If an image URL is provided but not in the correct format, keep it as is
      imageUrl = item.image;
    }
    
    const newRow = [
      item.name,
      item.price,
      item.originalPrice || null,
      imageUrl,
      item.badge || '',
      item.badgeType || '',
      item.size || item.servings || '',
      item.discount || null,
      item.category || 'Popular!',
      item.stock === undefined || item.stock === '' ? 50 : Number(item.stock)
    ];
    
    sheet.appendRow(newRow);
    return { success: true, message: 'Item added successfully', imageUrl: imageUrl };
  } catch (error) {
    console.error('Error adding item:', error);
    return { success: false, message: 'Failed to add item' };
  }
}

function updateMenuItem(itemId, item) {
  try {
    let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Frames');
    if (!sheet) {
      return { success: false, message: 'Frames sheet not found' };
    }
    
    // itemId is the actual row number in the sheet (including header)
    // So we use itemId directly without adding 1
    const actualRow = itemId
    
    // Handle image upload if base64 image is provided
    let imageUrl = item.image || 'https://via.placeholder.com/400';
    if (item.imageBase64) {
      try {
        imageUrl = uploadImageToDrive(item.imageBase64, item.imageName || item.name + '_image.jpg');
      } catch (error) {
        console.error('Error uploading image:', error);
        // Keep the existing image URL if upload fails
        imageUrl = item.image || 'https://via.placeholder.com/400';
      }
    } else if (item.image && !item.image.startsWith('https://lh3.google.com/u/0/d/')) {
      // If an image URL is provided but not in the correct format, keep it as is
      imageUrl = item.image;
    }
    
    const range = sheet.getRange(actualRow, 1, 1, 10); // actualRow already includes header offset
    
    const updatedRow = [
      item.name,
      item.price,
      item.originalPrice || null,
      imageUrl,
      item.badge || '',
      item.badgeType || '',
      item.size || item.servings || '',
      item.discount || null,
      item.category || 'Popular!',
      item.stock === undefined || item.stock === '' ? 50 : Number(item.stock)
    ];
    
    range.setValues([updatedRow]);
    return { success: true, message: 'Item updated successfully', rowUpdated: actualRow };
  } catch (error) {
    console.error('Error updating item:', error);
    return { success: false, message: 'Failed to update item' };
  }
}

function deleteMenuItem(itemId) {
  try {
    let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Frames');
    if (!sheet) {
      return { success: false, message: 'Frames sheet not found' };
    }
    
    // itemId is the actual row number in the sheet (including header)
    // So we use itemId directly
    sheet.deleteRow(itemId); // itemId already includes header offset
    return { success: true, message: 'Item deleted successfully' };
  } catch (error) {
    console.error('Error deleting item:', error);
    return { success: false, message: 'Failed to delete item' };
  }
}

// CRUD Operations for Branches
function addBranch(branch) {
  try {
    let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Branches');
    if (!sheet) {
      // Create Branches sheet if it doesn't exist
      sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('Branches');
      const headers = ['Name', 'City', 'Area', 'Address', 'Phone', 'Timing', 'Active'];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#f3f4f6');
    }
    
    // Check if headers exist, if not add them
    const firstRow = sheet.getRange(1, 1, 1, 7).getValues()[0];
    if (!firstRow[0] || firstRow[0] === '') {
      const headers = ['Name', 'City', 'Area', 'Address', 'Phone', 'Timing', 'Active'];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#f3f4f6');
    }
    
    const newRow = [
      branch.name,
      branch.city,
      branch.area,
      branch.address,
      branch.phone,
      branch.timing,
      branch.active !== false
    ];
    
    sheet.appendRow(newRow);
    return { success: true, message: 'Branch added successfully' };
  } catch (error) {
    console.error('Error adding branch:', error);
    return { success: false, message: 'Failed to add branch' };
  }
}

function updateBranch(branchId, branch) {
  try {
    let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Branches');
    if (!sheet) {
      return { success: false, message: 'Branches sheet not found' };
    }
    
    // branchId is the actual row number in the sheet (including header)
    const actualRow = branchId;
    const range = sheet.getRange(actualRow, 1, 1, 7); // actualRow already includes header offset
    
    const updatedRow = [
      branch.name,
      branch.city,
      branch.area,
      branch.address,
      branch.phone,
      branch.timing,
      branch.active !== false
    ];
    
    range.setValues([updatedRow]);
    return { success: true, message: 'Branch updated successfully', rowUpdated: actualRow };
  } catch (error) {
    console.error('Error updating branch:', error);
    return { success: false, message: 'Failed to update branch' };
  }
}

function deleteBranch(branchId) {
  try {
    let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Branches');
    if (!sheet) {
      return { success: false, message: 'Branches sheet not found' };
    }
    
    // branchId is the actual row number in the sheet (including header)
    sheet.deleteRow(branchId); // branchId already includes header offset
    return { success: true, message: 'Branch deleted successfully' };
  } catch (error) {
    console.error('Error deleting branch:', error);
    return { success: false, message: 'Failed to delete branch' };
  }
}

// CRUD Operations for Banners
function addBanner(banner) {
  try {
    let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Banners');
    if (!sheet) {
      // Create Banners sheet if it doesn't exist
      sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('Banners');
      const headers = ['Title', 'Subtitle', 'Image', 'Link', 'Active'];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#f3f4f6');
    }
    
    // Check if headers exist, if not add them
    const firstRow = sheet.getRange(1, 1, 1, 5).getValues()[0];
    if (!firstRow[0] || firstRow[0] === '') {
      const headers = ['Title', 'Subtitle', 'Image', 'Link', 'Active'];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#f3f4f6');
    }
    
    // Handle image upload if base64 image is provided
    let imageUrl = banner.image || '';
    if (banner.imageBase64) {
      try {
        imageUrl = uploadImageToDrive(banner.imageBase64, banner.imageName || 'banner_' + new Date().getTime() + '.jpg');
      } catch (error) {
        console.error('Error uploading banner image:', error);
      }
    }
    
    const newRow = [
      banner.title,
      banner.subtitle,
      imageUrl,
      banner.link,
      banner.active !== false
    ];
    
    sheet.appendRow(newRow);
    return { success: true, message: 'Banner added successfully' };
  } catch (error) {
    console.error('Error adding banner:', error);
    return { success: false, message: 'Failed to add banner' };
  }
}

function updateBanner(bannerId, banner) {
  try {
    let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Banners');
    if (!sheet) {
      return { success: false, message: 'Banners sheet not found' };
    }
    
    // Handle image upload if base64 image is provided
    let imageUrl = banner.image || '';
    if (banner.imageBase64) {
      try {
        imageUrl = uploadImageToDrive(banner.imageBase64, banner.imageName || 'banner_' + new Date().getTime() + '.jpg');
      } catch (error) {
        console.error('Error uploading banner image:', error);
        imageUrl = banner.image || '';
      }
    }
    
    // bannerId is the actual row number in the sheet (including header)
    const actualRow = bannerId;
    const range = sheet.getRange(actualRow, 1, 1, 5); // actualRow already includes header offset
    
    const updatedRow = [
      banner.title,
      banner.subtitle,
      imageUrl,
      banner.link,
      banner.active !== false
    ];
    
    range.setValues([updatedRow]);
    return { success: true, message: 'Banner updated successfully', rowUpdated: actualRow };
  } catch (error) {
    console.error('Error updating banner:', error);
    return { success: false, message: 'Failed to update banner' };
  }
}

function deleteBanner(bannerId) {
  try {
    let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Banners');
    if (!sheet) {
      return { success: false, message: 'Banners sheet not found' };
    }
    
    // bannerId is the actual row number in the sheet (including header)
    sheet.deleteRow(bannerId); // bannerId already includes header offset
    return { success: true, message: 'Banner deleted successfully' };
  } catch (error) {
    console.error('Error deleting banner:', error);
    return { success: false, message: 'Failed to delete banner' };
  }
}

// Workshop Functions
function getKitchenOrders() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Orders');
    if (!sheet) return [];
    
    const data = sheet.getDataRange().getValues();
    const orders = [];
    
    for (let i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      
      // Only show Confirmed and Preparing orders to workshop
      if (data[i][14] === 'Confirmed' || data[i][14] === 'Preparing') {
        orders.push({
          id: data[i][0],
          timestamp: data[i][1],
          type: data[i][2],
          customerName: data[i][3],
          phone: data[i][4],
          email: data[i][5],
          address: data[i][6],
          city: data[i][7],
          area: data[i][8],
          branch: data[i][9],
          items: JSON.parse(data[i][10] || '[]'),
          subtotal: data[i][11],
          deliveryCharge: data[i][12],
          total: data[i][13],
          status: data[i][14],
          notes: data[i][15],
          workshopStaff: data[i][16] || '',
          workshopTime: data[i][17] || '',
          deliveryOption: data[i][21] || '',
          rowIndex: i + 1 // Store row index for updates
        });
      }
    }
    
    return orders.reverse(); // Show newest first
  } catch (error) {
    console.error('Error fetching workshop orders:', error);
    return [];
  }
}

function updateKitchenStatus(orderId, newStatus, workshopStaff) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Orders');
    if (!sheet) return { success: false, message: 'Orders sheet not found' };
    
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === orderId) {
        sheet.getRange(i + 1, 15).setValue(newStatus); // Status column (15)
        sheet.getRange(i + 1, 17).setValue(workshopStaff); // Workshop Staff column (17)
        
        if (newStatus === 'Preparing') {
          sheet.getRange(i + 1, 18).setValue(new Date().toISOString()); // Workshop Time column (18)
        } else if (newStatus === 'Ready') {
          sheet.getRange(i + 1, 19).setValue(new Date().toISOString()); // Ready Time column (19)
        }
        
        // Trigger automatic SMS if configured
        triggerStatusChangeSMS(orderId, newStatus);
        
        return { success: true, message: 'Status updated successfully' };
      }
    }
    
    return { success: false, message: 'Order not found' };
  } catch (error) {
    console.error('Error updating workshop status:', error);
    return { success: false, message: 'Failed to update status' };
  }
}

function getKitchenHistory(username) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Orders');
    if (!sheet) return [];
    
    const data = sheet.getDataRange().getValues();
    const orders = [];
    
    for (let i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      
      // Show orders handled by this workshop staff
      if (data[i][16] === username && ['Ready', 'Out for Delivery', 'Delivered'].includes(data[i][14])) {
        orders.push({
          id: data[i][0],
          timestamp: data[i][1],
          orderType: data[i][2],
          type: data[i][2], // Keep for backward compatibility
          customerName: data[i][3],
          customerPhone: data[i][4],
          email: data[i][5],
          address: data[i][6],
          area: data[i][7],
          landmark: data[i][8],
          instructions: data[i][9],
          items: JSON.parse(data[i][10] || '[]'),
          subtotal: data[i][11],
          deliveryCharge: data[i][12],
          total: data[i][13],
          status: data[i][14],
          paymentMethod: data[i][15],
          workshopStaff: data[i][16],
          workshopTime: data[i][17],
          readyTime: data[i][18] || data[i][19],
          rider: data[i][19],
          deliveryTime: data[i][20],
          completedTime: data[i][21],
          deliveryOption: data[i][21] || ''
        });
      }
    }
    
    return orders.reverse();
  } catch (error) {
    console.error('Error fetching workshop history:', error);
    return [];
  }
}

// Delivery Portal (Rider) Functions
function getRiderOrders() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Orders');
    if (!sheet) return [];
    
    const data = sheet.getDataRange().getValues();
    const orders = [];
    
    for (let i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      
      // Show Ready and Out for Delivery orders
      if ((data[i][14] === 'Ready' || data[i][14] === 'Out for Delivery')) {
        const orderType = data[i][2] ? String(data[i][2]).trim().toLowerCase() : '';
        const delOption = data[i][21] ? String(data[i][21]).trim().toLowerCase() : '';
        
        // Filter: only show if Pickup, OR if Delivery and preferred delivery option is "Shop Rider"
        if (orderType === 'pickup' || delOption === 'shop rider' || delOption === '' || delOption === 'my rider') {
          orders.push({
            id: data[i][0],
            timestamp: data[i][1],
            type: data[i][2],
            customerName: data[i][3],
            phone: data[i][4],
            email: data[i][5],
            address: data[i][6],
            city: data[i][7],
            area: data[i][8],
            items: JSON.parse(data[i][10] || '[]'),
            total: data[i][13],
            status: data[i][14],
            notes: data[i][15],
            rowIndex: i + 1
          });
        }
      }
    }
    
    return orders.reverse();
  } catch (error) {
    console.error('Error fetching delivery orders:', error);
    return [];
  }
}

function updateRiderStatus(orderId, newStatus, riderName) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Orders');
    if (!sheet) return { success: false, message: 'Orders sheet not found' };
    
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === orderId) {
        sheet.getRange(i + 1, 15).setValue(newStatus); // Status column
        sheet.getRange(i + 1, 19).setValue(riderName); // Rider column
        
        if (newStatus === 'Out for Delivery') {
          sheet.getRange(i + 1, 20).setValue(new Date().toISOString()); // Delivery Time
        } else if (newStatus === 'Delivered') {
          sheet.getRange(i + 1, 21).setValue(new Date().toISOString()); // Completed Time
          logOrderIncome(orderId, data[i][13]); // data[i][13] is total amount
        }
        
        // Trigger automatic SMS if configured
        triggerStatusChangeSMS(orderId, newStatus);
        
        return { success: true, message: 'Status updated successfully' };
      }
    }
    
    return { success: false, message: 'Order not found' };
  } catch (error) {
    console.error('Error updating delivery status:', error);
    return { success: false, message: 'Failed to update status' };
  }
}

function getRiderHistory(username) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Orders');
    if (!sheet) return [];
    
    const data = sheet.getDataRange().getValues();
    const orders = [];
    
    for (let i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      
      // Show orders delivered by this rider (column 19 is Rider)
      if (data[i][18] === username) {
        orders.push({
          id: data[i][0],
          timestamp: data[i][1],
          customerName: data[i][3],
          phone: data[i][4],
          address: data[i][6],
          area: data[i][8],
          city: data[i][7],
          total: data[i][13],
          status: data[i][14],
          deliveryTime: data[i][19],
          completedTime: data[i][20]
        });
      }
    }
    
    return orders.reverse();
  } catch (error) {
    console.error('Error fetching delivery history:', error);
    return [];
  }
}

// Order Tracking Function
function getOrderStatus(orderId) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Orders');
    if (!sheet) return { success: false, message: 'Orders sheet not found' };
    
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === orderId) {
        const order = {
          id: data[i][0],
          timestamp: data[i][1],
          type: data[i][2],
          customerName: data[i][3],
          phone: data[i][4],
          email: data[i][5],
          address: data[i][6],
          city: data[i][7],
          area: data[i][8],
          branch: data[i][9],
          items: JSON.parse(data[i][10] || '[]'),
          subtotal: data[i][11],
          deliveryCharge: data[i][12],
          total: data[i][13],
          status: data[i][14],
          notes: data[i][15],
          workshopStaff: data[i][16] || '',
          workshopTime: data[i][17] || '',
          rider: data[i][18] || '',
          deliveryTime: data[i][19] || '',
          completedTime: data[i][20] || '',
          deliveryOption: data[i][21] || '',
          transactionId: data[i][22] || '',
          paymentStatus: data[i][23] || 'Unconfirmed',
          paymentMethod: data[i][24] || '',
          deliveryBookingMode: data[i][25] || '',
          deliveryFee: data[i][26] || '',
          riderBikeNumber: data[i][27] || '',
          riderTrackingUrl: data[i][28] || ''
        };

        // Get rider details if assigned
        if (order.rider) {
          const usersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
          if (usersSheet) {
            const usersData = usersSheet.getDataRange().getValues();
            for (let j = 1; j < usersData.length; j++) {
              if (usersData[j][0] === order.rider) {
                order.riderName = usersData[j][3] || order.rider;
                order.riderContact = usersData[j][4] || '';
                break;
              }
            }
          }
        }
        
        return { success: true, order: order };
      }
    }
    
    return { success: false, message: 'Order not found' };
  } catch (error) {
    console.error('Error fetching order status:', error);
    return { success: false, message: 'Failed to fetch order status' };
  }
}

// Delivery Apps CRUD Functions (NEW)
function getDeliveryApps() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DeliveryApps');
    if (!sheet) {
      setupDeliveryAppsSheet();
      return getDeliveryApps();
    }
    const data = sheet.getDataRange().getValues();
    const apps = [];
    for (let i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      apps.push({
        id: i + 1,
        rowIndex: i + 1,
        name: data[i][0],
        active: data[i][1] !== false,
        url: data[i][2] || ''
      });
    }
    return apps;
  } catch (error) {
    console.error('Error fetching delivery apps:', error);
    return [];
  }
}

function setupDeliveryAppsSheet() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = spreadsheet.getSheetByName('DeliveryApps');
    if (!sheet) {
      sheet = spreadsheet.insertSheet('DeliveryApps');
    } else {
      sheet.clear();
    }
    const headers = ['App Name', 'Active', 'URL'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#f3f4f6');
    
    const defaultApps = [
      ['Shop Rider', true, ''],
      ['Yango', true, 'https://yango.com'],
      ['Bolt', true, 'https://bolt.eu'],
      ['Uber', true, 'https://uber.com']
    ];
    sheet.getRange(2, 1, defaultApps.length, headers.length).setValues(defaultApps);
    
    for (let i = 1; i <= headers.length; i++) {
      sheet.autoResizeColumn(i);
    }
    return sheet;
  } catch (error) {
    console.error('Error setting up delivery apps sheet:', error);
  }
}

function getSystemSettings() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Settings');
    if (!sheet) {
      setupSettingsSheet();
      return getSystemSettings();
    }
    const data = sheet.getDataRange().getValues();
    const settings = {};
    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) {
        settings[data[i][0]] = data[i][1];
      }
    }
    return settings;
  } catch (error) {
    console.error('Error fetching settings:', error);
    return {
      businessName: 'HD Laminated Canvas Frames',
      businessInfo: 'Premium HD Laminated Canvas Frames delivered straight to your door.',
      businessLogo: '',
      whatsappContact: '+233244123456',
      momoInfo: 'MTN Mobile Money: 0244123456 (Manuel Frames)',
      currency: 'GH₵',
      themeColor: '#EAB308',
      smsApiKey: '',
      smsSenderId: 'CanvasShop',
      autoSms: 'false'
    };
  }
}

function saveSystemSettings(settingsObject) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Settings') || setupSettingsSheet();
    sheet.clear();
    
    const headers = ['Key', 'Value'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#f3f4f6');
    
    const rows = [];
    for (const key in settingsObject) {
      let val = settingsObject[key];
      if (val === undefined || val === null) {
        val = '';
      }
      rows.push([key, val]);
    }
    
    if (rows.length > 0) {
      sheet.getRange(2, 1, rows.length, 2).setValues(rows);
    }
    
    return { success: true, message: 'Settings saved successfully' };
  } catch (error) {
    console.error('Error saving settings:', error);
    return { success: false, message: 'Failed to save settings: ' + error.toString() };
  }
}

function setupSettingsSheet() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = spreadsheet.getSheetByName('Settings');
    if (!sheet) {
      sheet = spreadsheet.insertSheet('Settings');
    } else {
      sheet.clear();
    }
    
    const headers = ['Key', 'Value'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#f3f4f6');
    
    const defaultSettings = [
      ['businessName', 'HD Laminated Canvas Frames'],
      ['businessInfo', 'Premium HD Laminated Canvas Frames delivered straight to your door.'],
      ['businessLogo', ''],
      ['whatsappContact', '+233244123456'],
      ['momoInfo', 'MTN Mobile Money: 0244123456 (Manuel Frames)'],
      ['currency', 'GH₵'],
      ['themeColor', '#EAB308'],
      ['smsApiKey', ''],
      ['smsSenderId', 'CanvasShop'],
      ['autoSms', 'false']
    ];
    
    sheet.getRange(2, 1, defaultSettings.length, 2).setValues(defaultSettings);
    sheet.autoResizeColumn(1);
    sheet.autoResizeColumn(2);
    return sheet;
  } catch (error) {
    console.error('Error setting up settings sheet:', error);
  }
}

function sendArkeselSMS(recipient, message) {
  try {
    const settings = getSystemSettings();
    const apiKey = settings.smsApiKey;
    const senderId = settings.smsSenderId;
    
    if (!apiKey || !senderId) {
      console.warn('Arkesel SMS API Key or Sender ID is not configured in settings.');
      return { success: false, message: 'SMS configuration is missing.' };
    }
    
    // Format recipient to international format
    let formattedRecipient = String(recipient).trim().replace(/[^0-9+]/g, '');
    if (formattedRecipient.startsWith('0')) {
      formattedRecipient = '233' + formattedRecipient.substring(1);
    } else if (formattedRecipient.startsWith('+')) {
      formattedRecipient = formattedRecipient.substring(1);
    }
    
    const url = 'https://sms.arkesel.com/api/v2/sms/send';
    const payload = {
      sender: senderId,
      message: message,
      recipients: [formattedRecipient]
    };
    
    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'api-key': apiKey
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const code = response.getResponseCode();
    const text = response.getContentText();
    console.log('Arkesel response code:', code, 'body:', text);
    
    if (code >= 200 && code < 300) {
      return { success: true, message: 'SMS sent successfully', response: text };
    } else {
      return { success: false, message: 'Failed to send SMS (Status: ' + code + '): ' + text };
    }
  } catch (error) {
    console.error('Error in sendArkeselSMS:', error);
    return { success: false, message: error.toString() };
  }
}

function sendManualSMS(phone, message) {
  return sendArkeselSMS(phone, message);
}

function triggerStatusChangeSMS(orderId, newStatus) {
  try {
    const settings = getSystemSettings();
    if (settings.autoSms !== 'true' && settings.autoSms !== true) {
      return;
    }
    
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Orders');
    if (!sheet) return;
    
    const data = sheet.getDataRange().getValues();
    let orderRow = null;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === orderId) {
        orderRow = data[i];
        break;
      }
    }
    
    if (!orderRow) return;
    
    const customerName = orderRow[3];
    const phone = orderRow[4];
    const shopName = settings.businessName || 'HD Canvas Frames';
    
    let message = '';
    if (newStatus === 'Confirmed') {
      message = 'Hi ' + customerName + ', your order ' + orderId + ' has been confirmed by ' + shopName + '! We are starting work on your frames.';
    } else if (newStatus === 'Preparing') {
      message = 'Hi ' + customerName + ', your order ' + orderId + ' is now being framed in our workshop. We will notify you when it is ready!';
    } else if (newStatus === 'Ready') {
      message = 'Hi ' + customerName + ', your order ' + orderId + ' is ready! It has been packaged and is prepared for delivery/pickup.';
    } else if (newStatus === 'Out for Delivery') {
      message = 'Hi ' + customerName + ', your order ' + orderId + ' is out for delivery! Our delivery agent is on their way.';
    } else if (newStatus === 'Delivered') {
      message = 'Hi ' + customerName + ', your order ' + orderId + ' has been successfully delivered. Thank you for framing with ' + shopName + '!';
    } else {
      return;
    }
    
    sendArkeselSMS(phone, message);
  } catch (error) {
    console.error('Error triggering status change SMS:', error);
  }
}

function addDeliveryApp(app) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DeliveryApps') || setupDeliveryAppsSheet();
    sheet.appendRow([app.name, app.active !== false, app.url || '']);
    return { success: true, message: 'Delivery app added successfully' };
  } catch (error) {
    console.error('Error adding delivery app:', error);
    return { success: false, message: 'Failed to add delivery app' };
  }
}

function updateDeliveryApp(rowIndex, app) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DeliveryApps');
    if (!sheet) return { success: false, message: 'DeliveryApps sheet not found' };
    sheet.getRange(rowIndex, 1, 1, 3).setValues([[app.name, app.active !== false, app.url || '']]);
    return { success: true, message: 'Delivery app updated successfully' };
  } catch (error) {
    console.error('Error updating delivery app:', error);
    return { success: false, message: 'Failed to update delivery app' };
  }
}

function deleteDeliveryApp(rowIndex) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DeliveryApps');
    if (!sheet) return { success: false, message: 'DeliveryApps sheet not found' };
    sheet.deleteRow(rowIndex);
    return { success: true, message: 'Delivery app deleted successfully' };
  } catch (error) {
    console.error('Error deleting delivery app:', error);
    return { success: false, message: 'Failed to delete delivery app' };
  }
}

// User Management Functions
function getUsers() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
    if (!sheet) return [];
    
    const data = sheet.getDataRange().getValues();
    const users = [];
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) {
        users.push({
          username: data[i][0],
          password: data[i][1],
          role: data[i][2],
          name: data[i][3],
          contact: data[i][4],
          rowIndex: i + 1
        });
      }
    }
    
    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

function addUser(userData) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
    if (!sheet) {
      return { success: false, message: 'Users sheet not found' };
    }
    
    // Check if username already exists
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === userData.username) {
        return { success: false, message: 'Username already exists' };
      }
    }
    
    // Add new user
    sheet.appendRow([
      userData.username,
      userData.password,
      userData.role,
      userData.name,
      userData.contact
    ]);
    
    return { success: true, message: 'User added successfully' };
  } catch (error) {
    console.error('Error adding user:', error);
    return { success: false, message: 'Failed to add user' };
  }
}

function updateUser(rowIndex, userData) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
    if (!sheet) {
      return { success: false, message: 'Users sheet not found' };
    }
    
    // Update user data
    const range = sheet.getRange(rowIndex, 1, 1, 5);
    range.setValues([[
      userData.username,
      userData.password,
      userData.role,
      userData.name,
      userData.contact
    ]]);
    
    return { success: true, message: 'User updated successfully' };
  } catch (error) {
    console.error('Error updating user:', error);
    return { success: false, message: 'Failed to update user' };
  }
}

function deleteUser(rowIndex) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
    if (!sheet) {
      return { success: false, message: 'Users sheet not found' };
    }
    
    sheet.deleteRow(rowIndex);
    return { success: true, message: 'User deleted successfully' };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, message: 'Failed to delete user' };
  }
}

function getScriptUrl() {
  try {
    return ScriptApp.getService().getUrl();
  } catch (e) {
    console.error('Error getting script URL:', e);
    return '';
  }
}

// Enhancement functions for Ghana regions/cities, transaction IDs, dynamic delivery charges, and cash flow
function checkAndMigrateSheets() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Orders migration
  let ordersSheet = spreadsheet.getSheetByName('Orders');
  if (ordersSheet) {
    let lastCol = ordersSheet.getLastColumn();
    if (lastCol > 0) {
      let headers = ordersSheet.getRange(1, 1, 1, lastCol).getValues()[0];
      if (headers.indexOf('Transaction ID') === -1) {
        ordersSheet.getRange(1, headers.length + 1).setValue('Transaction ID').setFontWeight('bold').setBackground('#f3f4f6');
        ordersSheet.getRange(1, headers.length + 2).setValue('Payment Status').setFontWeight('bold').setBackground('#f3f4f6');
      }
      // Re-read headers in case columns were just added above
      lastCol = ordersSheet.getLastColumn();
      headers = ordersSheet.getRange(1, 1, 1, lastCol).getValues()[0];
      const extraCols = ['Payment Method', 'Delivery Booking Mode', 'Delivery Fee', 'Rider Bike Number', 'Rider Tracking URL'];
      extraCols.forEach(colName => {
        const currentLastCol = ordersSheet.getLastColumn();
        const currentHeaders = ordersSheet.getRange(1, 1, 1, currentLastCol).getValues()[0];
        if (currentHeaders.indexOf(colName) === -1) {
          ordersSheet.getRange(1, currentLastCol + 1).setValue(colName).setFontWeight('bold').setBackground('#f3f4f6');
        }
      });
    }
  } else {
    createOrdersSheet();
  }
  
  // 2. Frames migration
  let framesSheet = spreadsheet.getSheetByName('Frames');
  if (framesSheet) {
    const lastCol = framesSheet.getLastColumn();
    if (lastCol > 0) {
      const headers = framesSheet.getRange(1, 1, 1, lastCol).getValues()[0];
      if (headers.indexOf('Stock') === -1) {
        framesSheet.getRange(1, headers.length + 1).setValue('Stock').setFontWeight('bold').setBackground('#f3f4f6');
        const lastRow = framesSheet.getLastRow();
        if (lastRow > 1) {
          const stockRange = framesSheet.getRange(2, headers.length + 1, lastRow - 1, 1);
          const defaultStocks = [];
          for (let i = 2; i <= lastRow; i++) {
            defaultStocks.push([50]);
          }
          stockRange.setValues(defaultStocks);
        }
      }
    }
  }
  
  // 3. Settings sheet migration for new keys
  let settingsSheet = spreadsheet.getSheetByName('Settings');
  if (settingsSheet) {
    const settings = getSystemSettings();
    let updated = false;
    if (settings.paymentMethodName === undefined) {
      settings.paymentMethodName = 'MTN Mobile Money';
      updated = true;
    }
    if (settings.paymentDetails === undefined) {
      settings.paymentDetails = 'MTN Mobile Money: 0244123456 (Manuel Frames)';
      updated = true;
    }
    if (settings.paymentMethodLogo === undefined) {
      settings.paymentMethodLogo = '';
      updated = true;
    }
    if (updated) {
      saveSystemSettings(settings);
    }
  } else {
    setupSettingsSheet();
  }
  
  // 4. Delivery charges sheet setup
  setupDeliveryChargesSheet();

  // 5. CashFlow sheet setup
  setupCashFlowSheet();

  // 6. Payment Methods sheet setup (migrates legacy single payment method from Settings)
  setupPaymentMethodsSheet();

  // 7. Area-specific (Shop Rider) delivery charges sheet setup
  setupAreaDeliveryChargesSheet();
}

function setupDeliveryChargesSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName('DeliveryCharges');
  if (!sheet) {
    sheet = spreadsheet.insertSheet('DeliveryCharges');
  }
  
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    sheet.clear();
    const headers = ['Location', 'Charge'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#f3f4f6');
    
    const defaults = [
      ['Accra', 30],
      ['Kumasi', 50],
      ['Tamale', 80],
      ['Takoradi', 60],
      ['Cape Coast', 60],
      ['Koforidua', 50],
      ['Sunyani', 60],
      ['Ho', 60],
      ['Bolgatanga', 90],
      ['Wa', 90],
      ['Techiman', 60],
      ['Nalerigu', 90],
      ['Damongo', 80],
      ['Dambai', 70],
      ['Sefwi Wiawso', 70],
      ['Goaso', 60],
      ['Tema', 40],
      ['Obuasi', 60]
    ];
    sheet.getRange(2, 1, defaults.length, 2).setValues(defaults);
    sheet.autoResizeColumn(1);
    sheet.autoResizeColumn(2);
  }
  return sheet;
}

function setupCashFlowSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName('CashFlow');
  if (!sheet) {
    sheet = spreadsheet.insertSheet('CashFlow');
    const headers = ['ID', 'Date', 'Type', 'Category', 'Amount', 'Description'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#f3f4f6');
  }
  return sheet;
}

function getDeliveryCharges() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DeliveryCharges') || setupDeliveryChargesSheet();
    const data = sheet.getDataRange().getValues();
    const list = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] !== undefined && data[i][0] !== '') {
        list.push({
          location: data[i][0],
          charge: Number(data[i][1] || 0),
          rowIndex: i + 1
        });
      }
    }
    return list;
  } catch (error) {
    console.error('Error in getDeliveryCharges:', error);
    return [];
  }
}

function addDeliveryCharge(chargeData) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DeliveryCharges') || setupDeliveryChargesSheet();
    sheet.appendRow([chargeData.location, Number(chargeData.charge || 0)]);
    return { success: true, message: 'Delivery location charge added successfully' };
  } catch (error) {
    console.error('Error in addDeliveryCharge:', error);
    return { success: false, message: error.toString() };
  }
}

function updateDeliveryCharge(rowIndex, chargeData) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DeliveryCharges');
    if (!sheet) return { success: false, message: 'DeliveryCharges sheet not found' };
    sheet.getRange(rowIndex, 1, 1, 2).setValues([[chargeData.location, Number(chargeData.charge || 0)]]);
    return { success: true, message: 'Delivery location charge updated successfully' };
  } catch (error) {
    console.error('Error in updateDeliveryCharge:', error);
    return { success: false, message: error.toString() };
  }
}

function deleteDeliveryCharge(rowIndex) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DeliveryCharges');
    if (!sheet) return { success: false, message: 'DeliveryCharges sheet not found' };
    sheet.deleteRow(rowIndex);
    return { success: true, message: 'Delivery location charge deleted successfully' };
  } catch (error) {
    console.error('Error in deleteDeliveryCharge:', error);
    return { success: false, message: error.toString() };
  }
}

function getCashFlowTransactions() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('CashFlow') || setupCashFlowSheet();
    const data = sheet.getDataRange().getValues();
    const list = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] !== undefined && data[i][0] !== '') {
        list.push({
          id: data[i][0],
          date: data[i][1] instanceof Date ? data[i][1].toISOString().split('T')[0] : data[i][1],
          type: data[i][2],
          category: data[i][3],
          amount: Number(data[i][4] || 0),
          description: data[i][5] || '',
          rowIndex: i + 1
        });
      }
    }
    return list;
  } catch (error) {
    console.error('Error in getCashFlowTransactions:', error);
    return [];
  }
}

function addCashFlowTransaction(tx) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('CashFlow') || setupCashFlowSheet();
    const txId = 'TX' + Date.now();
    const date = tx.date || new Date().toISOString().split('T')[0];
    sheet.appendRow([
      txId,
      date,
      tx.type,
      tx.category,
      Number(tx.amount || 0),
      tx.description || ''
    ]);
    return { success: true, message: 'Transaction logged successfully' };
  } catch (error) {
    console.error('Error in addCashFlowTransaction:', error);
    return { success: false, message: error.toString() };
  }
}

function deleteCashFlowTransaction(rowIndex) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('CashFlow');
    if (!sheet) return { success: false, message: 'CashFlow sheet not found' };
    sheet.deleteRow(rowIndex);
    return { success: true, message: 'Transaction deleted successfully' };
  } catch (error) {
    console.error('Error in deleteCashFlowTransaction:', error);
    return { success: false, message: error.toString() };
  }
}

function confirmOrderPayment(orderId) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Orders');
    if (!sheet) return { success: false, message: 'Orders sheet not found' };
    
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === orderId) {
        sheet.getRange(i + 1, 24).setValue('Confirmed');
        return { success: true, message: 'Payment confirmed successfully!' };
      }
    }
    return { success: false, message: 'Order not found' };
  } catch (error) {
    console.error('Error in confirmOrderPayment:', error);
    return { success: false, message: error.toString() };
  }
}

function logOrderIncome(orderId, totalAmount) {
  try {
    const cashFlowSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('CashFlow') || setupCashFlowSheet();
    const data = cashFlowSheet.getDataRange().getValues();
    const targetCat = 'Sales (' + orderId + ')';
    for (let i = 1; i < data.length; i++) {
      if (data[i][3] === targetCat) {
        return;
      }
    }
    const txId = 'TX_ORDER_' + Date.now();
    const date = new Date().toISOString().split('T')[0];
    cashFlowSheet.appendRow([
      txId,
      date,
      'Income',
      targetCat,
      Number(totalAmount || 0),
      'Canvas order sales revenue.'
    ]);
  } catch (e) {
    console.error('Error logging order cashflow income:', e);
  }
}

function decrementItemStock(items) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Frames');
    if (!sheet) return;
    
    const data = sheet.getDataRange().getValues();
    for (let j = 0; j < items.length; j++) {
      const orderItem = items[j];
      const itemName = orderItem.name;
      const quantity = Number(orderItem.quantity || 1);
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === itemName) {
          const currentStock = Number(data[i][9] || 0);
          const newStock = Math.max(0, currentStock - quantity);
          sheet.getRange(i + 1, 10).setValue(newStock);
          break;
        }
      }
    }
  } catch (error) {
    console.error('Error decrementing item stock:', error);
  }
}

// =====================================================================
// Payment Methods (admin-managed, multiple, active/inactive)
// =====================================================================
function setupPaymentMethodsSheet() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = spreadsheet.getSheetByName('PaymentMethods');
    const isNew = !sheet;
    if (!sheet) {
      sheet = spreadsheet.insertSheet('PaymentMethods');
      const headers = ['Name', 'Details', 'Logo', 'Active'];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#f3f4f6');
    }

    // Migrate the legacy single payment method (stored in Settings) into the first row,
    // so shops upgrading from the old single-payment-method setup keep working.
    if (isNew || sheet.getLastRow() <= 1) {
      const settings = getSystemSettings();
      const legacyName = settings.paymentMethodName || 'MTN Mobile Money';
      const legacyDetails = settings.paymentDetails || settings.momoInfo || '';
      const legacyLogo = settings.paymentMethodLogo || '';
      sheet.getRange(2, 1, 1, 4).setValues([[legacyName, legacyDetails, legacyLogo, true]]);
    }

    return sheet;
  } catch (error) {
    console.error('Error setting up payment methods sheet:', error);
  }
}

function getPaymentMethods() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('PaymentMethods') || setupPaymentMethodsSheet();
    const data = sheet.getDataRange().getValues();
    const methods = [];
    for (let i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      methods.push({
        id: i + 1,
        rowIndex: i + 1,
        name: data[i][0] || '',
        details: data[i][1] || '',
        logo: data[i][2] || '',
        active: data[i][3] !== false
      });
    }
    return methods;
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return [];
  }
}

function addPaymentMethod(pm) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('PaymentMethods') || setupPaymentMethodsSheet();
    sheet.appendRow([pm.name, pm.details || '', pm.logo || '', pm.active !== false]);
    return { success: true, message: 'Payment method added successfully' };
  } catch (error) {
    console.error('Error adding payment method:', error);
    return { success: false, message: 'Failed to add payment method' };
  }
}

function updatePaymentMethod(rowIndex, pm) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('PaymentMethods');
    if (!sheet) return { success: false, message: 'PaymentMethods sheet not found' };
    sheet.getRange(rowIndex, 1, 1, 4).setValues([[pm.name, pm.details || '', pm.logo || '', pm.active !== false]]);
    return { success: true, message: 'Payment method updated successfully' };
  } catch (error) {
    console.error('Error updating payment method:', error);
    return { success: false, message: 'Failed to update payment method' };
  }
}

function deletePaymentMethod(rowIndex) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('PaymentMethods');
    if (!sheet) return { success: false, message: 'PaymentMethods sheet not found' };
    sheet.deleteRow(rowIndex);
    return { success: true, message: 'Payment method deleted successfully' };
  } catch (error) {
    console.error('Error deleting payment method:', error);
    return { success: false, message: 'Failed to delete payment method' };
  }
}

// =====================================================================
// Area-Specific Delivery Charges (for the shop's own "Shop Rider")
// Lets the admin set a different delivery price per area within a city
// e.g. Accra - Dansoman vs Accra - East Legon vs Accra - Pokuase
// =====================================================================
function setupAreaDeliveryChargesSheet() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = spreadsheet.getSheetByName('AreaDeliveryCharges');
    if (!sheet) {
      sheet = spreadsheet.insertSheet('AreaDeliveryCharges');
      const headers = ['City', 'Area', 'Charge'];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#f3f4f6');
    }
    return sheet;
  } catch (error) {
    console.error('Error setting up area delivery charges sheet:', error);
  }
}

function getAreaDeliveryCharges() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('AreaDeliveryCharges') || setupAreaDeliveryChargesSheet();
    const data = sheet.getDataRange().getValues();
    const list = [];
    for (let i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      list.push({
        id: i + 1,
        rowIndex: i + 1,
        city: data[i][0] || '',
        area: data[i][1] || '',
        charge: Number(data[i][2] || 0)
      });
    }
    return list;
  } catch (error) {
    console.error('Error fetching area delivery charges:', error);
    return [];
  }
}

function addAreaDeliveryCharge(chargeData) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('AreaDeliveryCharges') || setupAreaDeliveryChargesSheet();
    sheet.appendRow([chargeData.city, chargeData.area, Number(chargeData.charge || 0)]);
    return { success: true, message: 'Area delivery charge added successfully' };
  } catch (error) {
    console.error('Error adding area delivery charge:', error);
    return { success: false, message: error.toString() };
  }
}

function updateAreaDeliveryCharge(rowIndex, chargeData) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('AreaDeliveryCharges');
    if (!sheet) return { success: false, message: 'AreaDeliveryCharges sheet not found' };
    sheet.getRange(rowIndex, 1, 1, 3).setValues([[chargeData.city, chargeData.area, Number(chargeData.charge || 0)]]);
    return { success: true, message: 'Area delivery charge updated successfully' };
  } catch (error) {
    console.error('Error updating area delivery charge:', error);
    return { success: false, message: error.toString() };
  }
}

function deleteAreaDeliveryCharge(rowIndex) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('AreaDeliveryCharges');
    if (!sheet) return { success: false, message: 'AreaDeliveryCharges sheet not found' };
    sheet.deleteRow(rowIndex);
    return { success: true, message: 'Area delivery charge deleted successfully' };
  } catch (error) {
    console.error('Error deleting area delivery charge:', error);
    return { success: false, message: error.toString() };
  }
}

// =====================================================================
// Third-Party Delivery (Yango/Bolt/Uber/etc.) booked by the admin on
// behalf of the customer: admin records what the ride cost, the rider's
// motorbike number, and a tracking link, then (optionally) notifies the
// customer via SMS.
// =====================================================================
function updateThirdPartyDeliveryInfo(orderId, info) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Orders');
    if (!sheet) return { success: false, message: 'Orders sheet not found' };

    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === orderId) {
        sheet.getRange(i + 1, 27).setValue(Number(info.fee || 0));           // Delivery Fee
        sheet.getRange(i + 1, 28).setValue(info.bikeNumber || '');          // Rider Bike Number
        sheet.getRange(i + 1, 29).setValue(info.trackingUrl || '');         // Rider Tracking URL

        if (info.markOutForDelivery) {
          sheet.getRange(i + 1, 15).setValue('Out for Delivery');
          triggerStatusChangeSMS(orderId, 'Out for Delivery');
        }

        return { success: true, message: 'Third-party delivery info saved successfully' };
      }
    }

    return { success: false, message: 'Order not found' };
  } catch (error) {
    console.error('Error updating third-party delivery info:', error);
    return { success: false, message: 'Failed to update delivery info' };
  }
}