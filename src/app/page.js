"use client";

import { useState, useEffect } from "react";

const SHEET_BASE_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSzEfRIpZfnE0BYuTwAVW7LPwe8FGGRcYEA_llPTGg88e5khpIxQPr-7XnTv2Ljh08DurBFxkvTcvR1/pub?output=csv";

// Configure your sheets here - add the correct gid for each sheet
// To find the gid: open the sheet in browser, the URL will show gid=XXXXXXX for each tab
const SHEETS = [
  { name: "Interdisipliner", gid: "535888329" }, // replace with actual gid
  { name: "Kluster Medika", gid: "1573829224" }, // replace with actual gid
  { name: "Kluster Soshum", gid: "840753553" }, // replace with actual gid
  { name: "Kluster Saintek", gid: "436810120" }, // replace with actual gid
  { name: "Kluster Agro", gid: "1168701172" }, // replace with actual gid
];

// Minimal CSV parser that supports quoted fields and escaped quotes
function parseCSV(text) {
  const rows = [];
  let i = 0;
  const len = text.length;

  while (i < len) {
    const row = [];
    let field = "";
    let inQuotes = false;

    while (i < len) {
      const ch = text[i];

      if (inQuotes) {
        if (ch === '"') {
          if (i + 1 < len && text[i + 1] === '"') {
            field += '"';
            i += 2;
            continue;
          }
          inQuotes = false;
          i++;
          continue;
        }
        field += ch;
        i++;
        continue;
      }

      if (ch === '"') {
        inQuotes = true;
        i++;
        continue;
      }

      if (ch === ",") {
        row.push(field);
        field = "";
        i++;
        continue;
      }

      if (ch === "\r") {
        i++;
        continue;
      }

      if (ch === "\n") {
        row.push(field);
        field = "";
        i++;
        break;
      }

      field += ch;
      i++;
    }

    if (i >= len) {
      if (field !== "" || row.length > 0) row.push(field);
    }

    if (row.length > 0) rows.push(row);
  }

  return rows;
}

export default function Page() {
  const [activeTab, setActiveTab] = useState(0);
  const [sheetsData, setSheetsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchAllSheets() {
      try {
        setLoading(true);
        const promises = SHEETS.map(async (sheet) => {
          const url = sheet.gid
            ? `${SHEET_BASE_URL}&gid=${sheet.gid}`
            : SHEET_BASE_URL;

          const res = await fetch(url);
          if (!res.ok) {
            throw new Error(
              `Failed to fetch ${sheet.name}: ${res.status} ${res.statusText}`
            );
          }

          const csvText = await res.text();
          const rows = parseCSV(csvText);

          return {
            name: sheet.name,
            rows: rows,
            headers: rows.length > 0 ? rows[0] : [],
            dataRows: rows.length > 1 ? rows.slice(1) : [],
          };
        });

        const results = await Promise.all(promises);
        setSheetsData(results);
        setError(null);
      } catch (err) {
        setError(err?.message ?? String(err));
      } finally {
        setLoading(false);
      }
    }

    fetchAllSheets();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">
              Data Program Kerja
            </h1>
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-gray-600 dark:text-gray-300 text-lg">
                  Memuat data...
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">
              Data Program Kerja
            </h1>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <svg
                  className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <div>
                  <h3 className="font-semibold text-red-800 dark:text-red-300 mb-1">
                    Error memuat data
                  </h3>
                  <p className="text-red-700 dark:text-red-400">{error}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const currentSheet = sheetsData[activeTab];

  // Helper function to get column index by header name (case-insensitive, flexible matching)
  const getColumnIndex = (headers, ...possibleNames) => {
    const normalizedHeaders = headers.map((h) => h.toLowerCase().trim());
    for (const name of possibleNames) {
      const normalized = name.toLowerCase().trim();
      const index = normalizedHeaders.findIndex(
        (h) => h.includes(normalized) || normalized.includes(h)
      );
      if (index !== -1) return index;
    }
    return -1;
  };

  // Helper function to get cell value safely
  const getCellValue = (row, index) => {
    if (index === -1) return "-";
    return row[index]?.trim() || "-";
  };

  // Helper function to format text with proper line breaks and lists
  const formatText = (text) => {
    if (!text || text === "-") return text;

    // First pass: normalize spaces and prepare text
    let formatted = text
      .trim()
      // Normalize multiple spaces to single space
      .replace(/\s+/g, " ");

    // Second pass: Add line breaks for numbered items FIRST (before converting dashes)
    // Only match small numbers (1-50) that are clearly list items
    formatted = formatted
      // Match "1. Text" or "1.Text" at start or after space
      .replace(/(?:^|\s)([1-9]|[1-4][0-9])\.\s*(?=[A-Z])/g, "\n$1. ")
      // Match " 1 Text" (space + single/double digit + space + capital)
      .replace(/\s+([1-9]|[1-4][0-9])\s+(?=[A-Z][a-z])/g, "\n$1. ");

    // Third pass: Handle letter items (a. b. c. d. etc)
    formatted = formatted.replace(/\s+([a-d])\.\s*(?=[A-Z])/g, "\n$1. ");

    // Fourth pass: Convert ALL remaining dashes to bullets
    // This runs after numbering so numbered items won't be affected
    formatted = formatted
      // Match dash at start of text
      .replace(/^-\s+/g, "• ")
      // Match dash after newline
      .replace(/\n-\s+/g, "\n• ")
      // Match dash after any whitespace followed by capital letter
      .replace(/\s+-\s+/g, "\n• ")
      // Normalize other bullet types
      .replace(/\s*[◦▪▫]\s*/g, "\n• ");

    // Final cleanup
    formatted = formatted
      // Remove spaces at start/end of lines
      .replace(/\n\s+/g, "\n")
      .replace(/\s+\n/g, "\n")
      // Remove multiple consecutive newlines
      .replace(/\n{3,}/g, "\n\n")
      // Trim final result
      .trim();

    return formatted;
  };

  // Parse data into structured format
  const parseProkerData = () => {
    if (!currentSheet || currentSheet.dataRows.length === 0) return [];

    const headers = currentSheet.headers;
    const judulIdx = getColumnIndex(
      headers,
      "judul proker",
      "judul",
      "nama proker",
      "program"
    );
    const pemasalahanIdx = getColumnIndex(
      headers,
      "permasalahan/potensi",
      "permasalahan",
      "pemasalahan",
      "potensi",
      "pemasalahan / potensi",
      "permasalahan / potensi"
    );
    const tujuanIdx = getColumnIndex(headers, "tujuan");
    const hasilIdx = getColumnIndex(headers, "hasil");
    const outputIdx = getColumnIndex(headers, "output");
    const urgensiIdx = getColumnIndex(headers, "urgensi");
    const detailIdx = getColumnIndex(
      headers,
      "detail kegiatan",
      "detail",
      "kegiatan"
    );
    const sasaranIdx = getColumnIndex(headers, "sasaran");
    const alatIdx = getColumnIndex(headers, "alat dan bahan", "alat", "bahan");
    const sdgsIdx = getColumnIndex(headers, "sdgs");
    const klusterIdx = getColumnIndex(
      headers,
      "kluster lain yang terlibat",
      "kluster terlibat",
      "kluster"
    );
    const interdisiplinerIdx = getColumnIndex(headers, "interdisipliner");
    const desaIdx = getColumnIndex(headers, "desa");

    return currentSheet.dataRows.map((row, idx) => ({
      id: idx,
      judulProker: getCellValue(row, judulIdx),
      pemasalahan: formatText(getCellValue(row, pemasalahanIdx)),
      tujuan: formatText(getCellValue(row, tujuanIdx)),
      hasil: formatText(getCellValue(row, hasilIdx)),
      output: formatText(getCellValue(row, outputIdx)),
      urgensi: getCellValue(row, urgensiIdx),
      detailKegiatan: formatText(getCellValue(row, detailIdx)),
      sasaran: formatText(getCellValue(row, sasaranIdx)),
      alatBahan: formatText(getCellValue(row, alatIdx)),
      sdgs: getCellValue(row, sdgsIdx),
      kluster: getCellValue(row, klusterIdx),
      interdisipliner: getCellValue(row, interdisiplinerIdx),
      desa: getCellValue(row, desaIdx),
    }));
  };

  const prokerData = parseProkerData();

  // Component to render SDG badges with images
  const SDGBadges = ({ sdgText }) => {
    if (!sdgText || sdgText === "-")
      return <span className="text-gray-500">-</span>;

    // Extract numbers from text (supports formats: "3,4,11" or "SDG 3, 4, 11" or "3.4.11" etc)
    const numbers = sdgText.match(/\d+/g);

    if (!numbers || numbers.length === 0) {
      return (
        <span className="text-gray-600 dark:text-gray-400">{sdgText}</span>
      );
    }

    const uniqueNumbers = [...new Set(numbers.map((n) => parseInt(n)))]
      .filter((n) => n >= 1 && n <= 17)
      .sort((a, b) => a - b);

    return (
      <div className="flex flex-wrap gap-2">
        {uniqueNumbers.map((num) => {
          return (
            <div
              key={num}
              className="relative group cursor-help"
              title={`SDG ${num}`}>
              <img
                src={`/sdgs/sdg-${num}.png`}
                alt={`SDG ${num}`}
                className="w-16 h-16 object-contain hover:scale-110 transition-transform duration-200 rounded-lg shadow-md hover:shadow-lg"
                onError={(e) => {
                  // Fallback if image not found
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
              {/* Fallback text if image not found */}
              <div className="w-16 h-16 rounded-lg flex items-center justify-center font-bold text-white shadow-md bg-gradient-to-br from-blue-500 to-indigo-600 hidden">
                {num}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Helper function to highlight keywords in text
  const highlightKeywords = (text) => {
    if (!text) return text;

    // Split text by the keywords while preserving them
    const regex = /(permasalahan|potensi)/gi;
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (/^(permasalahan|potensi)$/i.test(part)) {
        return (
          <strong key={index} className="font-bold">
            {part}
          </strong>
        );
      }
      return part;
    });
  };

  // Component to render formatted text with proper list styling
  const FormattedText = ({ text, className = "" }) => {
    if (!text || text === "-") return <span className={className}>{text}</span>;

    const lines = text.split("\n").filter((line) => line.trim());

    return (
      <div className={className}>
        {lines.map((line, idx) => {
          const trimmedLine = line.trim();

          // Check if it's a numbered item
          if (/^\d+\./.test(trimmedLine)) {
            const number = trimmedLine.match(/^\d+\./)[0];
            const content = trimmedLine.replace(/^\d+\.\s*/, "");
            return (
              <div key={idx} className="flex gap-3 mb-3 items-start">
                <span className="font-bold text-blue-600 dark:text-blue-400 min-w-6 flex-shrink-0 text-base">
                  {number}
                </span>
                <span className="flex-1 text-gray-700 dark:text-gray-300 leading-relaxed">
                  {highlightKeywords(content)}
                </span>
              </div>
            );
          }

          // Check if it's a lettered item
          if (/^[a-z]\./.test(trimmedLine)) {
            const letter = trimmedLine.match(/^[a-z]\./)[0];
            const content = trimmedLine.replace(/^[a-z]\.\s*/, "");
            return (
              <div key={idx} className="flex gap-3 mb-2 items-start pl-6">
                <span className="font-bold text-indigo-600 dark:text-indigo-400 min-w-6 flex-shrink-0 text-sm">
                  {letter}
                </span>
                <span className="flex-1 text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
                  {highlightKeywords(content)}
                </span>
              </div>
            );
          }

          // Check if it's a bullet point
          if (trimmedLine.startsWith("•")) {
            const content = trimmedLine.replace(/^•\s*/, "");
            return (
              <div key={idx} className="flex gap-3 mb-2 items-start">
                <span className="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">
                  •
                </span>
                <span className="flex-1 text-gray-700 dark:text-gray-300 leading-relaxed">
                  {highlightKeywords(content)}
                </span>
              </div>
            );
          }

          // Regular text
          return (
            <p
              key={idx}
              className="mb-2 text-gray-700 dark:text-gray-300 leading-relaxed">
              {highlightKeywords(trimmedLine)}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 md:p-10">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                    Program Kerja KKN
                  </h1>
                  <p className="text-blue-100 text-lg">
                    Banggai Bertutur - KKN Universitas Gadjah Mada
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-white/90 text-sm">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Total Program: {prokerData.length}</span>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600 px-4">
              <div className="flex overflow-x-auto gap-2 py-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                {SHEETS.map((sheet, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveTab(idx)}
                    className={`
                      px-6 py-3 rounded-xl font-semibold transition-all duration-300 whitespace-nowrap flex items-center gap-2
                      ${
                        activeTab === idx
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-105 transform"
                          : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-md hover:scale-102"
                      }
                    `}>
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20">
                      <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z" />
                      <path d="M3 8a2 2 0 012-2v10h8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                    </svg>
                    {sheet.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        {currentSheet && currentSheet.rows.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-12 h-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Tidak Ada Data
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Sheet ini masih kosong. Silakan tambahkan data terlebih dahulu.
              </p>
            </div>
          </div>
        ) : prokerData.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {prokerData.map((proker) => (
              <div
                key={proker.id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group">
                {/* Card Header */}
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-6">
                  <h2 className="text-2xl font-bold text-white mb-2 flex items-start gap-3">
                    <span className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 text-lg">
                      #{proker.id + 1}
                    </span>
                    <span className="flex-1">{proker.judulProker}</span>
                  </h2>
                  <div className="flex flex-wrap items-center gap-4 text-white/90 text-sm">
                    {proker.desa !== "-" && (
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="font-medium">Desa: {proker.desa}</span>
                      </div>
                    )}
                    {proker.kluster !== "-" && (
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20">
                          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                        </svg>
                        <span className="font-medium">
                          Kluster: {proker.kluster}
                        </span>
                      </div>
                    )}
                    {proker.interdisipliner !== "-" && (
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20">
                          <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                        </svg>
                        <span className="font-medium">
                          Interdisipliner: {proker.interdisipliner}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6 space-y-6">
                  {/* Pemasalahan / Potensi */}
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-5 border border-orange-200 dark:border-orange-800">
                    <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300 font-semibold mb-3">
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Permasalahan / Potensi</span>
                    </div>
                    <FormattedText text={proker.pemasalahan} className="" />
                  </div>

                  {/* Tujuan */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold">
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Tujuan</span>
                    </div>
                    <FormattedText text={proker.tujuan} className="pl-7" />
                  </div>

                  {/* Results Section - Hasil, Output, Urgensi */}
                  <div className="grid md:grid-cols-3 gap-4">
                    {/* Hasil */}
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-semibold mb-2">
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>Hasil</span>
                      </div>
                      <FormattedText text={proker.hasil} className="" />
                    </div>

                    {/* Output */}
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold mb-2">
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20">
                          <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
                          <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
                          <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
                        </svg>
                        <span>Output</span>
                      </div>
                      <FormattedText text={proker.output} className="" />
                    </div>

                    {/* Urgensi */}
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
                      <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-semibold mb-2">
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>Urgensi</span>
                      </div>
                      <FormattedText
                        text={proker.urgensi}
                        className="font-medium"
                      />
                    </div>
                  </div>

                  {/* Detail Kegiatan */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 rounded-xl p-5">
                    <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-semibold mb-3">
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Detail Kegiatan</span>
                    </div>
                    <FormattedText text={proker.detailKegiatan} className="" />
                  </div>

                  {/* Sasaran */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-semibold">
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                      <span>Sasaran</span>
                    </div>
                    <FormattedText text={proker.sasaran} className="pl-7" />
                  </div>

                  {/* Additional Info - Alat Bahan & SDGs */}
                  <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    {/* Alat dan Bahan */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-semibold text-sm">
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M7 2a1 1 0 00-.707 1.707L7 4.414v3.758a1 1 0 01-.293.707l-4 4C.817 14.769 2.156 18 4.828 18h10.343c2.673 0 4.012-3.231 2.122-5.121l-4-4A1 1 0 0113 8.172V4.414l.707-.707A1 1 0 0013 2H7zm2 6.172V4h2v4.172a3 3 0 00.879 2.12l1.027 1.028a4 4 0 00-2.171.102l-.47.156a4 4 0 01-2.53 0l-.563-.187a1.993 1.993 0 00-.114-.035l1.063-1.063A3 3 0 009 8.172z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>Alat & Bahan</span>
                      </div>
                      <FormattedText text={proker.alatBahan} className="pl-6" />
                    </div>

                    {/* SDGs */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-semibold text-sm">
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20">
                          <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                        </svg>
                        <span>SDGs</span>
                      </div>
                      <div className="pl-6">
                        <SDGBadges sdgText={proker.sdgs} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-12 h-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Tidak Ada Data Program Kerja
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Pastikan kolom header di sheet sesuai dengan format yang
                diharapkan.
              </p>
            </div>
          </div>
        )}

        {/* Footer Stats */}
        {prokerData.length > 0 && (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-3">
                  <svg
                    className="w-6 h-6 text-blue-600 dark:text-blue-400"
                    fill="currentColor"
                    viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path
                      fillRule="evenodd"
                      d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Total Program Kerja
                  </p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    {prokerData.length}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20">
                  <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z" />
                  <path d="M3 8a2 2 0 012-2v10h8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                </svg>
                <span className="font-medium">{SHEETS[activeTab].name}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
