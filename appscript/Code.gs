/**
 * ============================================================================
 * KOD GOOGLE APPS SCRIPT: REKOD HAFAZAN SPPIM 2027
 * ============================================================================
 * 
 * CARA MENGHUBUNGKAN DENGAN GOOGLE SHEET ANDA:
 * 1. Buka fail Google Sheet "REKOD HAFAZAN TAHUN 6 2027".
 * 2. Pada menu atas, klik Extensions (Sambungan) > Apps Script.
 * 3. Padamkan semua kod sedia ada dalam editor Apps Script.
 * 4. Salin dan tampal keseluruhan kod di bawah ini ke dalam editor tersebut.
 * 5. Klik ikon Simpan (Save) atau tekan Ctrl+S.
 * 6. Klik butang biru "Deploy" (Gunakan) di penjuru atas kanan > "New deployment" (Gunaan baharu).
 * 7. Pada ikon gear (Select type), pilih "Web app".
 * 8. Konfigurasi tetapan berikut:
 *    - Description: Hafazan Tracker SPPIM API
 *    - Execute as: Me (E-mel Google anda)
 *    - Who has access: Anyone (Sesiapa sahaja - Penting agar apps boleh semak markah)
 * 9. Klik "Deploy", benarkan akses (Authorize access) akaun Google anda.
 * 10. Salin "Web app URL" (bermula https://script.google.com/macros/s/.../exec).
 * 11. Buka aplikasi Hafazan Tracker SPPIM, klik butang "Sambung Google Sheet (Apps Script)",
 *     tampal URL tersebut dan klik "Simpan & Uji Sambungan".
 */

// Senarai 41 Surah mengikut turutan lajur E (lajur ke-5) sehingga lajur AS (lajur ke-45)
var SENARAI_SURAH = [
  // Tahun 1 (17 surah)
  { n: 'FATIHAH', y: 1, max: 1 },
  { n: 'AN-NAS', y: 1, max: 1 },
  { n: 'AL-FALAQ', y: 1, max: 1 },
  { n: 'AL-IKHLAS', y: 1, max: 1 },
  { n: 'AL-MASAD', y: 1, max: 1 },
  { n: 'AN-NASR', y: 1, max: 1 },
  { n: 'AL-KAFIRUN', y: 1, max: 1 },
  { n: 'AL-KAUTHAR', y: 1, max: 1 },
  { n: 'AL-MAUN', y: 1, max: 1 },
  { n: 'QURAISY', y: 1, max: 1 },
  { n: 'AL-FIL', y: 1, max: 1 },
  { n: 'AL-HUMAZAH', y: 1, max: 1 },
  { n: 'AL-ASR', y: 1, max: 1 },
  { n: 'AT-TAKASUR', y: 1, max: 1 },
  { n: 'AL-QARIAH', y: 1, max: 2 },
  { n: 'AL-ADIYAT', y: 1, max: 2 },
  { n: 'AL-ZALZALAH', y: 1, max: 1 },

  // Tahun 2 (7 surah)
  { n: 'AL-BAYYINAH', y: 2, max: 1 },
  { n: 'AL-QADR', y: 2, max: 1 },
  { n: 'AL-ALAQ', y: 2, max: 3 },
  { n: 'AT-TIN', y: 2, max: 1 },
  { n: 'ASY-SYARAH', y: 2, max: 1 },
  { n: 'ADH-DHUHA', y: 2, max: 2 },
  { n: 'AL-LAIL', y: 2, max: 3 },

  // Tahun 3 (7 surah)
  { n: 'ASY-SYAMS', y: 3, max: 2 },
  { n: 'AL-BALAD', y: 3, max: 3 },
  { n: 'AL-FAJR', y: 3, max: 4 },
  { n: 'AL-GHASYIAH', y: 3, max: 3 },
  { n: "AL-A'LAA", y: 3, max: 3 },
  { n: 'AT-TORIQ', y: 3, max: 3 },
  { n: 'AL-BURUJ', y: 3, max: 3 },

  // Tahun 4 (4 surah)
  { n: 'AL-INSYIQAQ', y: 4, max: 3 },
  { n: 'AL-MUTOFFIFIN', y: 4, max: 4 },
  { n: 'AL-INFITOR', y: 4, max: 3 },
  { n: 'AT-TAKWIR', y: 4, max: 3 },

  // Tahun 5 (3 surah)
  { n: 'ABASA', y: 5, max: 4 },
  { n: "AN-NAZI'AT", y: 5, max: 4 },
  { n: "AN-NABA'", y: 5, max: 4 },

  // Tahun 6 (3 surah)
  { n: 'AS-SAJADAH', y: 6, max: 6 },
  { n: 'AL-INSAN', y: 6, max: 6 },
  { n: 'YAASIN', y: 6, max: 11 }
];

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'semakKemajuan';
  var ic = (e && e.parameter && e.parameter.ic) ? e.parameter.ic : '';
  
  if (action === 'segerakSemua' || action === 'senaraiSemuaData' || action === 'segerak') {
    return outputJson(dapatkanSemuaDataMurid());
  }

  if (action === 'senaraiMurid') {
    return outputJson(dapatkanSemuaDataMurid());
  }
  
  if (action === 'semakKemajuan' || !action) {
    if (!ic) {
      return outputJson(dapatkanSemuaDataMurid());
    }
    var hasil = semakKemajuan(ic);
    return outputJson(hasil);
  }
  
  return outputJson(dapatkanSemuaDataMurid());
}

function doPost(e) {
  try {
    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);
    
    if (data.action === 'simpanMarkahMurid') {
      var res = simpanMarkahMurid(data.ic, data.marks);
      return outputJson(res);
    }

    if (data.action === 'simpanMarkah') {
      var res = simpanMarkah(data.ic, data.surahIndex, data.markah);
      return outputJson(res);
    }
    
    return outputJson({ ok: false, error: 'Tindakan tidak disokong.' });
  } catch (err) {
    return outputJson({ ok: false, error: err.toString() });
  }
}

function outputJson(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function bersihkanIC(ic) {
  if (!ic) return '';
  return String(ic).replace(/[^0-9A-Za-z]/g, '').trim().toUpperCase();
}

/**
 * Semak kemajuan murid berdasarkan No. IC
 */
function semakKemajuan(inputIc) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("REKOD HAFAZAN TAHUN 6 2027") || ss.getActiveSheet();
    var allData = sheet.getDataRange().getValues();
    
    var targetIc = bersihkanIC(inputIc);
    if (!targetIc) {
      return { ok: false, error: 'Nombor IC tidak sah.' };
    }

    // Baris data bermula pada baris ke-5 (indeks 4)
    // Lajur A: BIL (indeks 0)
    // Lajur B: NAMA MURID (indeks 1)
    // Lajur C: KELAS (indeks 2)
    // Lajur D: NO IC (indeks 3)
    // Lajur E - AS: Markah Surah (indeks 4 hingga 44)
    for (var r = 4; r < allData.length; r++) {
      var row = allData[r];
      var namaMurid = row[1];
      var kelas = row[2];
      var noIc = bersihkanIC(row[3]);

      if (noIc && noIc === targetIc) {
        var surahs = [];
        var startSurahCol = 4; // Lajur E

        for (var s = 0; s < SENARAI_SURAH.length; s++) {
          var val = row[startSurahCol + s];
          var got = null;
          
          if (val !== "" && val !== null && val !== undefined) {
            var num = Number(val);
            if (!isNaN(num) && num > 0) {
              got = num;
            } else if (String(val).trim() !== "" && String(val).trim() !== "0") {
              got = SENARAI_SURAH[s].max;
            }
          }
          
          surahs.push({
            n: SENARAI_SURAH[s].n,
            y: SENARAI_SURAH[s].y,
            max: SENARAI_SURAH[s].max,
            got: got
          });
        }

        return {
          ok: true,
          name: namaMurid,
          klass: kelas,
          ic: noIc,
          surahs: surahs
        };
      }
    }

    return {
      ok: false,
      error: 'Nombor IC ' + inputIc + ' tidak dijumpai dalam Google Sheet.'
    };
  } catch (err) {
    return {
      ok: false,
      error: 'Ralat membaca Google Sheet: ' + err.toString()
    };
  }
}

/**
 * Dapatkan senarai semua murid untuk rujukan pantas
 */
function dapatkanSenaraiMurid() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    var allData = sheet.getDataRange().getValues();
    var muridList = [];

    for (var r = 4; r < allData.length; r++) {
      var row = allData[r];
      var bil = row[0];
      var namaMurid = row[1];
      var kelas = row[2];
      var noIc = bersihkanIC(row[3]);

      if (namaMurid && noIc) {
        muridList.push({
          bil: bil,
          name: namaMurid,
          klass: kelas,
          ic: noIc
        });
      }
    }

    return { ok: true, count: muridList.length, students: muridList };
  } catch (err) {
    return { ok: false, error: err.toString() };
  }
}

/**
 * Simpan markah murid ke dalam Google Sheet (pilihan untuk kemas kini guru)
 */
function simpanMarkah(inputIc, surahIndex, markah) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    var allData = sheet.getDataRange().getValues();
    var targetIc = bersihkanIC(inputIc);

    for (var r = 4; r < allData.length; r++) {
      var noIc = bersihkanIC(allData[r][3]);
      if (noIc && noIc === targetIc) {
        // Baris dalam Spreadsheet ialah r + 1 (1-indexed)
        // Lajur surah pertama ialah E (lajur 5) + surahIndex
        var targetRow = r + 1;
        var targetCol = 5 + Number(surahIndex);
        sheet.getRange(targetRow, targetCol).setValue(markah);
        return { ok: true, message: 'Markah berjaya disimpan di Google Sheet.' };
      }
    }

    return { ok: false, error: 'Murid dengan IC tersebut tidak dijumpai.' };
  } catch (err) {
    return { ok: false, error: err.toString() };
  }
}

/**
 * Dapatkan semua rekod 68 murid beserta markah lengkap 41 surah secara pukal
 */
function dapatkanSemuaDataMurid() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("REKOD HAFAZAN TAHUN 6 2027") || ss.getActiveSheet();
    var allData = sheet.getDataRange().getValues();
    var muridList = [];

    // Baris data bermula pada baris ke-5 (indeks 4)
    for (var r = 4; r < allData.length; r++) {
      var row = allData[r];
      var bil = row[0];
      var namaMurid = row[1];
      var kelas = row[2];
      var noIc = bersihkanIC(row[3]);

      if (namaMurid && noIc) {
        var startSurahCol = 4; // Lajur E (indeks 4)
        var marks = {};
        for (var s = 0; s < SENARAI_SURAH.length; s++) {
          var val = row[startSurahCol + s];
          if (val !== "" && val !== null && val !== undefined) {
            var num = Number(val);
            if (!isNaN(num) && num > 0) {
              marks[s] = num;
            } else if (String(val).trim() !== "" && String(val).trim() !== "0") {
              // Jika ditanda dengan simbol semakan
              marks[s] = SENARAI_SURAH[s].max;
            }
          }
        }

        muridList.push({
          bil: bil,
          name: String(namaMurid).trim(),
          klass: String(kelas).trim(),
          ic: noIc,
          marks: marks
        });
      }
    }

    return {
      ok: true,
      timestamp: new Date().toISOString(),
      count: muridList.length,
      students: muridList
    };
  } catch (err) {
    return { ok: false, error: 'Ralat membaca Google Sheet: ' + err.toString() };
  }
}

/**
 * Simpan markah penuh murid (objek { [surahIndex]: markah }) ke dalam baris Google Sheet
 */
function simpanMarkahMurid(inputIc, marks) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    var allData = sheet.getDataRange().getValues();
    var targetIc = bersihkanIC(inputIc);

    for (var r = 4; r < allData.length; r++) {
      var noIc = bersihkanIC(allData[r][3]);
      if (noIc && noIc === targetIc) {
        var targetRow = r + 1; // 1-indexed
        var startSurahCol = 5; // Lajur E (1-indexed ialah 5)

        for (var s = 0; s < SENARAI_SURAH.length; s++) {
          var val = (marks && marks[s] !== undefined && marks[s] > 0) ? marks[s] : "";
          sheet.getRange(targetRow, startSurahCol + s).setValue(val);
        }

        return { ok: true, message: 'Semua markah berjaya disimpan ke Google Sheet.' };
      }
    }

    return { ok: false, error: 'Murid dengan IC ' + inputIc + ' tidak dijumpai.' };
  } catch (err) {
    return { ok: false, error: err.toString() };
  }
}

