function doGet(e) {
  // Jika ada parameter action = getMessages, kita kembalikan JSON
  if (e && e.parameter && e.parameter.action === 'getMessages') {
    return ContentService.createTextOutput(JSON.stringify(getMessages()))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  // Jika tidak ada parameter, render halaman Admin Panel
  return HtmlService.createHtmlOutputFromFile('index_appscript')
    .setTitle('Admin Panel - Wali Kelas')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Menerima request POST dari PWA maupun dari halaman Admin (via AJAX)
function doPost(e) {
  // Setup CORS Headers via JSONP workaround is not needed if we use text output, 
  // but to allow cross-origin POST from PWA, AppScript automatically handles it if returning TextOutput
  var action = e.parameter.action;
  var data = e.parameter.data ? JSON.parse(e.parameter.data) : {};
  var result = { status: 'error', message: 'Action not found' };

  try {
    switch (action) {
      case 'register':
        result = registerTeacher(data);
        break;
      case 'login':
        result = loginTeacher(data);
        break;
      case 'adminLogin':
        result = loginAdmin(data);
        break;
      case 'getUsers':
        result = getUsers();
        break;
      case 'approveUser':
        result = approveUser(data.email);
        break;
      case 'revokeUser':
        result = revokeUser(data.email);
        break;
      case 'rejectUser':
        result = rejectUser(data.email);
        break;
      case 'sendMessage':
        result = saveMessage(data);
        break;
      case 'uploadAvatar':
        result = uploadAvatar(data);
        break;
      case 'forgotPassword':
        result = forgotPassword(data.email);
        break;
      case 'changePassword':
        result = changePassword(data);
        break;
      case 'backupToDrive':
        result = backupToDrive(data);
        break;
      case 'listBackups':
        result = listBackups(data.email);
        break;
      case 'restoreFromDrive':
        result = restoreFromDrive(data.fileId, data.email);
        break;
      case 'deleteBackup':
        result = deleteBackupFromDrive(data.fileId, data.email);
        break;
      case 'kirimPesanGuru':
        result = kirimPesanGuru(data);
        break;
      case 'getPesanGuru':
        result = getPesanGuru();
        break;
      case 'tandaiPesanGuruDibaca':
        result = tandaiPesanGuruDibaca(data.email);
        break;
    }
  } catch (error) {
    result = { status: 'error', message: error.message };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ================= DATABASE HELPERS =================
// Sheet Users: Email, Password, NamaLengkap, Sekolah, NPSN, NoWA, Status
// Sheet Messages: Tanggal, Pengirim, Judul, Isi

function getSheet(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (sheetName === 'Users') {
      sheet.appendRow(['Email', 'Password', 'NamaLengkap', 'Sekolah', 'NPSN', 'NoWA', 'Status']);
    } else if (sheetName === 'Messages') {
      sheet.appendRow(['Tanggal', 'Pengirim', 'Judul', 'Isi', 'Gambar URL', 'Link URL']);
    } else if (sheetName === 'PesanGuru') {
      sheet.appendRow(['ID', 'Email_Guru', 'Nama_Guru', 'Pesan', 'Status_Dibaca']);
    }
  }
  return sheet;
}

function registerTeacher(data) {
  var sheet = getSheet('Users');
  var dataRange = sheet.getDataRange().getValues();
  
  // Cek jika email sudah terdaftar
  for (var i = 1; i < dataRange.length; i++) {
    if (String(dataRange[i][0]).toLowerCase() === String(data.email).toLowerCase()) {
      return { status: 'error', message: 'Email sudah terdaftar!' };
    }
  }
  
  sheet.appendRow([
    data.email, 
    data.password, 
    data.nama, 
    data.sekolah, 
    data.npsn, 
    "'" + data.wa, 
    'pending' // default status
  ]);
  
  return { status: 'success', message: 'Registrasi berhasil. Menunggu persetujuan Admin.' };
}

function loginTeacher(data) {
  var sheet = getSheet('Users');
  var dataRange = sheet.getDataRange().getValues();
  
  for (var i = 1; i < dataRange.length; i++) {
    if (String(dataRange[i][0]).toLowerCase() === String(data.email).toLowerCase() && String(dataRange[i][1]) === String(data.password)) {
      if (dataRange[i][6] === 'pending') {
        return { status: 'error', message: 'Akun Anda belum disetujui oleh Admin.' };
      }
      
      saveLog(data.email, 'Login berhasil');
      
      return { 
        status: 'success', 
        user: {
          email: dataRange[i][0],
          nama: dataRange[i][2],
          sekolah: dataRange[i][3],
          npsn: dataRange[i][4],
          wa: dataRange[i][5]
        }
      };
    }
  }
  
  return { status: 'error', message: 'Email atau password salah.' };
}

function loginAdmin(data) {
  // Hardcoded Admin Password for simplicity
  var ADMIN_PASSWORD = 'adminwalikelas'; 
  
  if (data.password === ADMIN_PASSWORD) {
    return { status: 'success' };
  }
  return { status: 'error', message: 'Password Admin Salah!' };
}

function getUsers() {
  var sheet = getSheet('Users');
  var dataRange = sheet.getDataRange().getValues();
  
  var pesanSheet = getSheet('PesanGuru');
  var pesanRange = pesanSheet.getDataRange().getValues();
  var unreadMap = {};
  for (var j = 1; j < pesanRange.length; j++) {
    var e = String(pesanRange[j][1]).toLowerCase();
    var s = String(pesanRange[j][4]);
    if (s === '0') {
      unreadMap[e] = (unreadMap[e] || 0) + 1;
    }
  }

  var users = [];
  for (var i = 1; i < dataRange.length; i++) {
    var email = String(dataRange[i][0]).toLowerCase();
    users.push({
      email: dataRange[i][0],
      nama: dataRange[i][2],
      sekolah: dataRange[i][3],
      npsn: dataRange[i][4],
      wa: dataRange[i][5],
      status: dataRange[i][6],
      unreadCount: unreadMap[email] || 0
    });
  }
  
  return { status: 'success', data: users };
}

function approveUser(email) {
  var sheet = getSheet('Users');
  var dataRange = sheet.getDataRange().getValues();
  
  for (var i = 1; i < dataRange.length; i++) {
    if (String(dataRange[i][0]).toLowerCase() === String(email).toLowerCase()) {
      sheet.getRange(i + 1, 7).setValue('approved');
      saveLog(email, 'Akun disetujui oleh Admin');
      return { status: 'success', message: 'Akun disetujui' };
    }
  }
  return { status: 'error', message: 'User tidak ditemukan' };
}

function revokeUser(email) {
  var sheet = getSheet('Users');
  var dataRange = sheet.getDataRange().getValues();
  
  for (var i = 1; i < dataRange.length; i++) {
    if (String(dataRange[i][0]).toLowerCase() === String(email).toLowerCase()) {
      sheet.getRange(i + 1, 7).setValue('pending');
      saveLog(email, 'Persetujuan akun dibatalkan oleh Admin');
      return { status: 'success', message: 'Persetujuan dibatalkan' };
    }
  }
  return { status: 'error', message: 'User tidak ditemukan' };
}

function rejectUser(email) {
  var sheet = getSheet('Users');
  var dataRange = sheet.getDataRange().getValues();
  
  for (var i = 1; i < dataRange.length; i++) {
    if (String(dataRange[i][0]).toLowerCase() === String(email).toLowerCase()) {
      sheet.deleteRow(i + 1);
      saveLog(email, 'Akun ditolak/dihapus oleh Admin');
      return { status: 'success', message: 'Akun ditolak & dihapus' };
    }
  }
  return { status: 'error', message: 'User tidak ditemukan' };
}

function saveMessage(data) {
  var sheet = getSheet('Messages');
  
  var gambarUrl = '';
  if (data.gambarBase64) {
    gambarUrl = uploadToDrive(data.gambarBase64, 'Pengumuman_' + new Date().getTime() + '.png') || '';
  } else if (data.gambarUrl) {
    gambarUrl = data.gambarUrl;
  }
  
  if (data.id) { // Edit/Update
    var dataRange = sheet.getDataRange().getValues();
    for (var i = 1; i < dataRange.length; i++) {
      if (dataRange[i][0] === data.id) {
        sheet.getRange(i + 1, 3).setValue(data.judul);
        sheet.getRange(i + 1, 4).setValue(data.isi);
        if (gambarUrl) sheet.getRange(i + 1, 5).setValue(gambarUrl);
        sheet.getRange(i + 1, 6).setValue(data.linkUrl || '');
        return { status: 'success', message: 'Pesan diperbarui' };
      }
    }
    return { status: 'error', message: 'Pesan tidak ditemukan' };
  } else {
    var id = new Date().toISOString();
    sheet.appendRow([id, data.pengirim, data.judul, data.isi, gambarUrl, data.linkUrl || '']);
    return { status: 'success', message: 'Pesan terkirim' };
  }
}

function deleteMessage(id) {
  var sheet = getSheet('Messages');
  var dataRange = sheet.getDataRange().getValues();
  for (var i = 1; i < dataRange.length; i++) {
    if (dataRange[i][0] === id) {
      sheet.deleteRow(i + 1);
      return { status: 'success', message: 'Pesan dihapus' };
    }
  }
  return { status: 'error', message: 'Pesan tidak ditemukan' };
}

function getMessages() {
  var sheet = getSheet('Messages');
  var dataRange = sheet.getDataRange().getValues();
  var messages = [];
  
  for (var i = 1; i < dataRange.length; i++) {
    var rawGambar = dataRange[i][4] || '';
    var processedGambar = rawGambar;
    if (rawGambar && (rawGambar.indexOf('drive.google.com') !== -1 || rawGambar.indexOf('drive.usercontent.google.com') !== -1)) {
      var b64 = getDriveImageBase64(rawGambar);
      if (b64) processedGambar = b64;
    }
    
    messages.push({
      id: dataRange[i][0], // Tanggal is the ID
      tanggal: dataRange[i][0],
      pengirim: dataRange[i][1],
      judul: dataRange[i][2],
      isi: dataRange[i][3],
      gambar_url: processedGambar,
      link_url: dataRange[i][5] || ''
    });
  }
  
  messages.reverse(); // Terbaru di atas
  return { status: 'success', data: messages };
}

// ================= PESAN GURU KE ADMIN =================
function kirimPesanGuru(data) {
  var sheet = getSheet('PesanGuru');
  var dataRange = sheet.getDataRange().getValues();
  
  // Cek jumlah pesan yang dikirim oleh guru ini
  var count = 0;
  for (var i = 1; i < dataRange.length; i++) {
    if (String(dataRange[i][1]).toLowerCase() === String(data.email).toLowerCase()) {
      count++;
    }
  }
  
  if (count >= 5) {
    return { status: 'error', message: 'Batas maksimal 5 pesan tercapai. Harap tunggu admin membaca/menghapus pesan Anda.' };
  }
  
  var id = new Date().toISOString();
  sheet.appendRow([id, data.email, data.nama, data.pesan, '0']); // 0 = belum dibaca, 1 = dibaca
  return { status: 'success', message: 'Pesan berhasil dikirim ke Admin' };
}

function getPesanGuru() {
  var sheet = getSheet('PesanGuru');
  var dataRange = sheet.getDataRange().getValues();
  var pesanGroups = {};
  
  for (var i = 1; i < dataRange.length; i++) {
    var email = String(dataRange[i][1]).toLowerCase();
    var statusDibaca = String(dataRange[i][4]); // '0' atau '1'
    
    if (!pesanGroups[email]) {
      pesanGroups[email] = {
        email: email,
        nama: dataRange[i][2],
        unreadCount: 0,
        messages: []
      };
    }
    
    if (statusDibaca === '0') {
      pesanGroups[email].unreadCount++;
    }
    
    pesanGroups[email].messages.push({
      id: dataRange[i][0],
      pesan: dataRange[i][3],
      status_dibaca: statusDibaca
    });
  }
  
  return { status: 'success', data: pesanGroups };
}

function tandaiPesanGuruDibaca(email) {
  var sheet = getSheet('PesanGuru');
  var dataRange = sheet.getDataRange().getValues();
  var updated = false;
  
  for (var i = 1; i < dataRange.length; i++) {
    if (String(dataRange[i][1]).toLowerCase() === String(email).toLowerCase()) {
      if (String(dataRange[i][4]) === '0') {
        sheet.getRange(i + 1, 5).setValue('1');
        updated = true;
      }
    }
  }
  
  return { status: 'success', message: 'Pesan ditandai dibaca' };
}

// ================= GOOGLE DRIVE HELPERS =================
function getUserFolder(rootFolder, folderName) {
  var folders = rootFolder.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  } else {
    return rootFolder.createFolder(folderName);
  }
}

function uploadToDrive(base64Data, filename, subFolderName) {
  try {
    var rootFolderId = '1qFsTePd7RLwE6U7o8SX9rFPlnz6TsKxH';
    var rootFolder = DriveApp.getFolderById(rootFolderId);
    
    var targetFolder = rootFolder;
    if (subFolderName) {
      targetFolder = getUserFolder(rootFolder, subFolderName);
    }
    
    var splitBase = base64Data.split(',');
    var type = splitBase[0].split(';')[0].replace('data:', '');
    var base64String = splitBase[1];
    var blob = Utilities.newBlob(Utilities.base64Decode(base64String), type, filename);
    var file = targetFolder.createFile(blob);
    
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (sharingError) {
      // Ignore sharing error if restricted by organization
    }
    
    return 'https://drive.google.com/uc?export=view&id=' + file.getId(); 
  } catch (e) {
    throw new Error("Gagal upload ke Drive: " + e.message);
  }
}

function getDriveImageBase64(url) {
  try {
    var matchId = url.match(/id=([a-zA-Z0-9_-]+)/) || url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (!matchId) return null;
    var fileId = matchId[1];
    var file = DriveApp.getFileById(fileId);
    var blob = file.getBlob();
    return 'data:' + blob.getContentType() + ';base64,' + Utilities.base64Encode(blob.getBytes());
  } catch (e) {
    return null;
  }
}

function uploadAvatar(data) {
  var folderName = data.nama ? (data.nama + '_' + data.email) : null;
  var url = uploadToDrive(data.base64Data, data.email + '_media_' + new Date().getTime() + '.png', folderName);
  if (url) {
    return { status: 'success', url: url };
  }
  return { status: 'error', message: 'Gagal mengunggah file' };
}

function authorizeSetup() {
  // Fungsi ini HANYA digunakan sekali untuk memancing pop-up izinkan Google Drive & Gmail
  // JANGAN gunakan try-catch di sini agar sistem Google mendeteksi kebutuhan izin Penuh
  var folderId = '1qFsTePd7RLwE6U7o8SX9rFPlnz6TsKxH';
  var folder = DriveApp.getFolderById(folderId);
  var file = folder.createFile("test_auth.txt", "Ini hanya file tes dari sistem untuk memancing akses tulis.");
  file.setTrashed(true); // Langsung hapus file tes ini
  
  // Pancing izin Gmail
  var quota = MailApp.getRemainingDailyQuota();
  
  Logger.log("Akses Tulis Google Drive berhasil divalidasi ke folder: " + folder.getName());
  Logger.log("Sisa kuota email harian: " + quota);
}

// ================= LOG & SYNC FUNCTIONS =================
function saveLog(email, action) {
  var sheet = getSheet('Logs');
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Tanggal', 'Email', 'Aktivitas']);
  }
  sheet.appendRow([new Date().toISOString(), email, action]);
}

function getLogs() {
  var sheet = getSheet('Logs');
  var dataRange = sheet.getDataRange().getValues();
  var logs = [];
  for (var i = Math.max(1, dataRange.length - 100); i < dataRange.length; i++) { // get last 100
    logs.push({
      tanggal: dataRange[i][0],
      email: dataRange[i][1],
      aksi: dataRange[i][2]
    });
  }
  logs.reverse();
  return { status: 'success', data: logs };
}

function clearAllLogs() {
  var sheet = getSheet('Logs');
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    // Delete from row 2 up to the last row, keeping the header on row 1
    sheet.deleteRows(2, lastRow - 1);
  }
  saveLog('Admin', 'Semua riwayat aktivitas sistem telah dihapus');
  return { status: 'success', message: 'Log berhasil dihapus' };
}

function backupToDrive(data) {
  try {
    var rootFolderId = '1qFsTePd7RLwE6U7o8SX9rFPlnz6TsKxH';
    var rootFolder = DriveApp.getFolderById(rootFolderId);
    
    var folderName = data.nama + '_' + data.email;
    var targetFolder = getUserFolder(rootFolder, folderName);
    
    // File name format: Nama guru_tanggal upload.json
    var dateStr = new Date().toISOString().slice(0, 10);
    var filename = data.nama + '_' + dateStr + '.json';
    
    var blob = Utilities.newBlob(data.jsonData, "application/json", filename);
    var file = targetFolder.createFile(blob);
    
    // Save to Backups sheet
    var sheet = getSheet('Backups');
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Tanggal', 'Email', 'Nama', 'Filename', 'File ID']);
    }
    sheet.appendRow([new Date().toISOString(), data.email, data.nama, filename, file.getId()]);
    
    saveLog(data.email, 'Backup data ke Drive: ' + filename);
    return { status: 'success', message: 'Backup berhasil', fileId: file.getId() };
  } catch (e) {
    return { status: 'error', message: 'Gagal backup: ' + e.message };
  }
}

function listBackups(email) {
  var sheet = getSheet('Backups');
  var dataRange = sheet.getDataRange().getValues();
  var backups = [];
  for (var i = 1; i < dataRange.length; i++) {
    if (String(dataRange[i][1]).toLowerCase() === String(email).toLowerCase()) {
      backups.push({
        tanggal: dataRange[i][0],
        nama: dataRange[i][2],
        filename: dataRange[i][3],
        fileId: dataRange[i][4]
      });
    }
  }
  backups.reverse();
  return { status: 'success', data: backups };
}

function restoreFromDrive(fileId, email) {
  try {
    var file = DriveApp.getFileById(fileId);
    var jsonData = file.getBlob().getDataAsString();
    saveLog(email, 'Restore data dari Drive: ' + file.getName());
    return { status: 'success', data: jsonData };
  } catch(e) {
    return { status: 'error', message: 'Gagal merestore file: ' + e.message };
  }
}

function deleteBackupFromDrive(fileId, email) {
  try {
    var file = DriveApp.getFileById(fileId);
    file.setTrashed(true);
    
    // Hapus juga record dari sheet Backups
    var sheet = getSheet('Backups');
    var dataRange = sheet.getDataRange().getValues();
    for (var i = dataRange.length - 1; i >= 1; i--) {
      if (String(dataRange[i][4]) === String(fileId)) {
        sheet.deleteRow(i + 1);
        break;
      }
    }
    
    saveLog(email, 'Hapus backup dari Drive: ' + file.getName());
    return { status: 'success', message: 'Backup berhasil dihapus' };
  } catch(e) {
    return { status: 'error', message: 'Gagal menghapus file: ' + e.message };
  }
}

function changePassword(data) {
  var sheet = getSheet('Users');
  var dataRange = sheet.getDataRange().getValues();
  
  for (var i = 1; i < dataRange.length; i++) {
    if (String(dataRange[i][0]).toLowerCase() === String(data.email).toLowerCase()) {
      if (String(dataRange[i][1]) === String(data.oldPassword)) {
        sheet.getRange(i + 1, 2).setValue(data.newPassword);
        saveLog(data.email, 'Ubah password');
        return { status: 'success', message: 'Password berhasil diubah' };
      } else {
        return { status: 'error', message: 'Password lama salah' };
      }
    }
  }
}

function forgotPassword(email) {
  var sheet = getSheet('Users');
  var dataRange = sheet.getDataRange().getValues();
  
  for (var i = 1; i < dataRange.length; i++) {
    if (String(dataRange[i][0]).toLowerCase() === String(email).toLowerCase()) {
      var password = dataRange[i][1];
      var nama = dataRange[i][2];
      try {
        MailApp.sendEmail({
          to: email,
          subject: "Pemulihan Password - Manajemen Wali Kelas",
          body: "Halo " + nama + ",\n\nBerikut adalah password Anda untuk masuk ke aplikasi Manajemen Wali Kelas:\n\nPassword: " + password + "\n\nHarap jaga kerahasiaan password Anda dan segera hapus email ini setelah dibaca.\n\nSalam,\nAdmin Aplikasi"
        });
        saveLog(email, 'Lupa password dikirim ke email');
        return { status: 'success', message: 'Password berhasil dikirim ke ' + email };
      } catch (e) {
        return { status: 'error', message: 'Gagal mengirim email: ' + e.message };
      }
    }
  }
  return { status: 'error', message: 'Email tidak terdaftar di sistem' };
}
