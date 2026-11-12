import React, { useState } from 'react';
import { X, Check, Copy, Link2, ExternalLink, HelpCircle, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { getSavedAppsScriptUrl, saveAppsScriptUrl, testAppsScriptConnection } from '../services/appsScriptService';

interface AppsScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUrlUpdated: (url: string) => void;
}

export const AppsScriptModal: React.FC<AppsScriptModalProps> = ({
  isOpen,
  onClose,
  onUrlUpdated,
}) => {
  const [urlInput, setUrlInput] = useState(getSavedAppsScriptUrl());
  const [copied, setCopied] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    saveAppsScriptUrl(urlInput);
    onUrlUpdated(urlInput);
  };

  const handleTest = async () => {
    if (!urlInput.trim()) {
      setTestResult({ success: false, message: 'Sila masukkan URL Web App Google Apps Script dahulu.' });
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    handleSave();
    const result = await testAppsScriptConnection(urlInput);
    setIsTesting(false);
    setTestResult(result);
  };

  const copyScriptCode = () => {
    const code = `/**
 * REKOD HAFAZAN SPPIM 2027 - GOOGLE APPS SCRIPT
 */
var SENARAI_SURAH = [
  { n: 'FATIHAH', y: 1, max: 1 }, { n: 'AN-NAS', y: 1, max: 1 }, { n: 'AL-FALAQ', y: 1, max: 1 },
  { n: 'AL-IKHLAS', y: 1, max: 1 }, { n: 'AL-MASAD', y: 1, max: 1 }, { n: 'AN-NASR', y: 1, max: 1 },
  { n: 'AL-KAFIRUN', y: 1, max: 1 }, { n: 'AL-KAUTHAR', y: 1, max: 1 }, { n: 'AL-MAUN', y: 1, max: 1 },
  { n: 'QURAISY', y: 1, max: 1 }, { n: 'AL-FIL', y: 1, max: 1 }, { n: 'AL-HUMAZAH', y: 1, max: 1 },
  { n: 'AL-ASR', y: 1, max: 1 }, { n: 'AT-TAKASUR', y: 1, max: 1 }, { n: 'AL-QARIAH', y: 1, max: 2 },
  { n: 'AL-ADIYAT', y: 1, max: 2 }, { n: 'AL-ZALZALAH', y: 1, max: 1 },
  { n: 'AL-BAYYINAH', y: 2, max: 1 }, { n: 'AL-QADR', y: 2, max: 1 }, { n: 'AL-ALAQ', y: 2, max: 3 },
  { n: 'AT-TIN', y: 2, max: 1 }, { n: 'ASY-SYARAH', y: 2, max: 1 }, { n: 'ADH-DHUHA', y: 2, max: 2 },
  { n: 'AL-LAIL', y: 2, max: 3 },
  { n: 'ASY-SYAMS', y: 3, max: 2 }, { n: 'AL-BALAD', y: 3, max: 3 }, { n: 'AL-FAJR', y: 3, max: 4 },
  { n: 'AL-GHASYIAH', y: 3, max: 3 }, { n: "AL-A'LAA", y: 3, max: 3 }, { n: 'AT-TORIQ', y: 3, max: 3 },
  { n: 'AL-BURUJ', y: 3, max: 3 },
  { n: 'AL-INSYIQAQ', y: 4, max: 3 }, { n: 'AL-MUTOFFIFIN', y: 4, max: 4 }, { n: 'AL-INFITOR', y: 4, max: 3 },
  { n: 'AT-TAKWIR', y: 4, max: 3 },
  { n: 'ABASA', y: 5, max: 4 }, { n: "AN-NAZI'AT", y: 5, max: 4 }, { n: "AN-NABA'", y: 5, max: 4 },
  { n: 'AS-SAJADAH', y: 6, max: 6 }, { n: 'AL-INSAN', y: 6, max: 6 }, { n: 'YAASIN', y: 6, max: 11 }
];

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'semakKemajuan';
  var ic = (e && e.parameter && e.parameter.ic) ? e.parameter.ic : '';
  
  if (action === 'segerakSemua' || action === 'senaraiSemuaData' || action === 'segerak') {
    return outputJson(dapatkanSemuaDataMurid());
  }
  if (action === 'senaraiMurid') {
    return outputJson(dapatkanSenaraiMurid());
  }
  if (action === 'semakKemajuan' || !action) {
    if (!ic) {
      return outputJson(dapatkanSemuaDataMurid());
    }
    return outputJson(semakKemajuan(ic));
  }
  return outputJson(dapatkanSemuaDataMurid());
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    if (data.action === 'simpanMarkahMurid') {
      return outputJson(simpanMarkahMurid(data.ic, data.marks));
    }
    return outputJson({ ok: true, message: 'Data diterima.' });
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

function semakKemajuan(inputIc) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("REKOD HAFAZAN TAHUN 6 2027") || ss.getActiveSheet();
  var allData = sheet.getDataRange().getValues();
  var targetIc = bersihkanIC(inputIc);

  for (var r = 4; r < allData.length; r++) {
    var row = allData[r];
    var namaMurid = row[1];
    var kelas = row[2];
    var noIc = bersihkanIC(row[3]);

    if (noIc && noIc === targetIc) {
      var surahs = [];
      for (var s = 0; s < SENARAI_SURAH.length; s++) {
        var val = row[4 + s];
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
      return { ok: true, name: namaMurid, klass: kelas, ic: noIc, surahs: surahs };
    }
  }
  return { ok: false, error: 'Nombor IC ' + inputIc + ' tidak dijumpai dalam Google Sheet.' };
}

function dapatkanSemuaDataMurid() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("REKOD HAFAZAN TAHUN 6 2027") || ss.getActiveSheet();
    var allData = sheet.getDataRange().getValues();
    var muridList = [];

    for (var r = 4; r < allData.length; r++) {
      var row = allData[r];
      var bil = row[0];
      var namaMurid = row[1];
      var kelas = row[2];
      var noIc = bersihkanIC(row[3]);

      if (namaMurid && noIc) {
        var marks = {};
        for (var s = 0; s < SENARAI_SURAH.length; s++) {
          var val = row[4 + s];
          if (val !== "" && val !== null && val !== undefined) {
            var num = Number(val);
            if (!isNaN(num) && num > 0) {
              marks[s] = num;
            } else if (String(val).trim() !== "" && String(val).trim() !== "0") {
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

    return { ok: true, timestamp: new Date().toISOString(), count: muridList.length, students: muridList };
  } catch (err) {
    return { ok: false, error: err.toString() };
  }
}

function dapatkanSenaraiMurid() {
  return dapatkanSemuaDataMurid();
}`;

    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--panel)] border-2 border-[var(--line)] rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--line)] bg-[var(--panel-2)]/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--gold)]/20 text-[var(--gold)] flex items-center justify-center">
              <Link2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-lg text-[var(--ink)]">
                Sambungan Google Apps Script & Google Sheet
              </h3>
              <p className="text-xs text-[var(--muted)]">
                Hubungkan borang semakan IC terus ke fail Google Sheet anda
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--line)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-sm">
          {/* Step-by-step tutorial */}
          <div className="space-y-3">
            <h4 className="font-display text-base text-[var(--gold)] flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4" />
              <span>Langkah-Langkah Pemasangan (Hanya Perlu Buat Sekali)</span>
            </h4>

            <ol className="space-y-2.5 text-xs text-[var(--muted)] list-decimal pl-4">
              <li>
                Buka fail Google Sheet <b className="text-[var(--ink)]">REKOD HAFAZAN TAHUN 6 2027</b> anda.
              </li>
              <li>
                Pada menu atas Google Sheet, klik <b className="text-[var(--ink)]">Extensions (Sambungan) &gt; Apps Script</b>.
              </li>
              <li>
                Padamkan semua kod lalai dalam fail <b className="text-[var(--ink)]">Code.gs</b>, kemudian salin dan tampal kod Apps Script di bawah:
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={copyScriptCode}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--gold)] text-[#241800] font-bold hover:bg-[#ffc65c] transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Berjaya Disalin!' : 'Salin Kod Apps Script (Code.gs)'}</span>
                  </button>
                </div>
              </li>
              <li>
                Klik butang biru <b className="text-[var(--ink)]">Deploy (Gunakan) &gt; New deployment (Gunaan baharu)</b>.
              </li>
              <li>
                Pilih jenis <b className="text-[var(--ink)]">Web app</b>:
                <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[var(--ink)]">
                  <li>Execute as: <span className="text-[var(--gold)] font-bold">Me (e-mel anda)</span></li>
                  <li>Who has access: <span className="text-[var(--gold)] font-bold">Anyone (Sesiapa sahaja)</span></li>
                </ul>
              </li>
              <li>
                Klik <b className="text-[var(--ink)]">Deploy</b>, luluskan kebenaran Google, dan salin <b className="text-[var(--ink)]">Web app URL</b>.
              </li>
              <li>
                Tampal URL tersebut dalam kotak input di bawah dan klik <b className="text-[var(--ink)]">Simpan & Uji</b>!
              </li>
            </ol>
          </div>

          {/* Web App URL Input */}
          <div className="bg-[var(--night)] p-4 rounded-2xl border border-[var(--line)] space-y-3">
            <label htmlFor="appScriptInput" className="block text-xs font-bold text-[var(--ink)]">
              URL Web App Google Apps Script
            </label>
            <input
              id="appScriptInput"
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
              className="w-full bg-[var(--panel)] border border-[var(--line)] focus:border-[var(--gold)] rounded-xl px-4 py-2.5 text-xs font-mono text-[var(--ink)] placeholder:text-slate-600 focus:outline-none"
            />

            {/* Test result status */}
            {testResult && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-start gap-2 ${
                  testResult.success
                    ? 'bg-[var(--mint)]/15 border border-[var(--mint)] text-[var(--mint)]'
                    : 'bg-[var(--rose)]/15 border border-[var(--rose)] text-[var(--rose)]'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleTest}
                disabled={isTesting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--gold)] hover:bg-[#ffc65c] text-[#241800] text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                {isTesting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menguji Sambungan...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Simpan & Uji Sambungan</span>
                  </>
                )}
              </button>

              {urlInput && (
                <button
                  type="button"
                  onClick={() => {
                    setUrlInput('');
                    saveAppsScriptUrl('');
                    onUrlUpdated('');
                    setTestResult(null);
                  }}
                  className="px-3 py-2 rounded-xl border border-[var(--line)] text-xs text-[var(--rose)] hover:bg-[var(--rose)]/10 transition-colors cursor-pointer"
                >
                  Padam URL
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--line)] bg-[var(--panel-2)]/40 flex items-center justify-between">
          <span className="text-xs text-[var(--muted)]">
            Aplikasi tetap boleh digunakan dengan 68 murid sedia ada tanpa Apps Script.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[var(--line)] hover:bg-[var(--panel-2)] text-xs font-bold text-[var(--ink)] transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
