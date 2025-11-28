"use client";

import { useEffect, useState } from "react";

const SHEET_BASE_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vT4PI3gOy7YrVetI4fSvAW6yWmEDB9vwHDkY1oC_-oTXlspYFJVWG62n3FyAtRtMX5W_wWDWhD5Yr6c/pub?output=csv";

const SHEETS = [
  { name: "Kampangar", gid: "0" },
  { name: "Kuntang", gid: "1348203775" },
  { name: "Pulo Dua", gid: "363769630" },
];

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

    if (i >= len && (field !== "" || row.length > 0)) {
      row.push(field);
    }

    if (row.length > 0) {
      rows.push(row);
    }
  }

  return rows;
}

export default function DaerahPage() {
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
            rows,
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

  const currentSheet = sheetsData[activeTab];

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto" />
          <p className="text-lg font-medium">Memuat data...</p>
        </div>
      </main>
    );
  }
  if (error) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="max-w-lg rounded-2xl bg-gray-900 border border-gray-700 p-6 text-left">
          <h1 className="text-2xl font-semibold mb-2">Gagal memuat data</h1>
          <p className="text-sm text-gray-300">{error}</p>
        </div>
      </main>
    );
  }

  // Render card-based layout untuk profil desa
  const renderProfilCards = () => {
    if (!currentSheet || currentSheet.rows.length === 0) {
      return (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800 mb-4">
            <svg
              className="w-8 h-8 text-gray-600"
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
          <p className="text-gray-400 text-lg">Belum ada data untuk desa ini</p>
        </div>
      );
    }

    const rows = currentSheet.rows;

    // Deskripsi Singkat Desa (A1 + A2 merged)
    const deskripsiDesa = rows[1]?.[0] || "";

    // Profil Desa (D2-D9 judul, E2-E9 isi)
    const profilDesa = [];
    for (let i = 1; i <= 8; i++) {
      const judul = rows[i]?.[3]; // Kolom D (index 3)
      const isi = rows[i]?.[4]; // Kolom E (index 4)
      if (judul && judul.trim()) {
        profilDesa.push({ judul, isi: isi || "" });
      }
    }

    // List Sekolah (G2 judul, H2 alamat)
    const sekolah = {
      nama: rows[1]?.[6] || "", // G2
      alamat: rows[1]?.[7] || "", // H2
    };

    // SAINTEK (A13-C13 header merge, A14-A20+ isi)
    const saintekData = {
      permasalahan: [],
      potensi: [],
      proyekPotensial: [],
    };

    // Row 13 adalah header (index 12)
    // Row 14+ adalah isi (index 13+)
    for (let i = 13; i < rows.length; i++) {
      const permasalahan = rows[i]?.[0]; // Kolom A
      const potensi = rows[i]?.[1]; // Kolom B
      const proyekPotensial = rows[i]?.[2]; // Kolom C

      if (permasalahan && permasalahan.trim()) {
        saintekData.permasalahan.push(permasalahan);
      }
      if (potensi && potensi.trim()) {
        saintekData.potensi.push(potensi);
      }
      if (proyekPotensial && proyekPotensial.trim()) {
        saintekData.proyekPotensial.push(proyekPotensial);
      }
    }

    // AGRO (D13-F13 header, D14+ isi)
    const agroData = {
      permasalahan: [],
      potensi: [],
      proyekPotensial: [],
    };

    for (let i = 13; i < rows.length; i++) {
      const permasalahan = rows[i]?.[3]; // Kolom D
      const potensi = rows[i]?.[4]; // Kolom E
      const proyekPotensial = rows[i]?.[5]; // Kolom F

      if (permasalahan && permasalahan.trim()) {
        agroData.permasalahan.push(permasalahan);
      }
      if (potensi && potensi.trim()) {
        agroData.potensi.push(potensi);
      }
      if (proyekPotensial && proyekPotensial.trim()) {
        agroData.proyekPotensial.push(proyekPotensial);
      }
    }

    // KESRA (G13-I13 header, G14+ isi)
    const kesraData = {
      permasalahan: [],
      potensi: [],
      proyekPotensial: [],
    };

    for (let i = 13; i < rows.length; i++) {
      const permasalahan = rows[i]?.[6]; // Kolom G
      const potensi = rows[i]?.[7]; // Kolom H
      const proyekPotensial = rows[i]?.[8]; // Kolom I

      if (permasalahan && permasalahan.trim()) {
        kesraData.permasalahan.push(permasalahan);
      }
      if (potensi && potensi.trim()) {
        kesraData.potensi.push(potensi);
      }
      if (proyekPotensial && proyekPotensial.trim()) {
        kesraData.proyekPotensial.push(proyekPotensial);
      }
    }

    // SOSHUM (J13-L13 header, J14+ isi)
    const soshumData = {
      permasalahan: [],
      potensi: [],
      proyekPotensial: [],
    };

    for (let i = 13; i < rows.length; i++) {
      const permasalahan = rows[i]?.[9]; // Kolom J
      const potensi = rows[i]?.[10]; // Kolom K
      const proyekPotensial = rows[i]?.[11]; // Kolom L

      if (permasalahan && permasalahan.trim()) {
        soshumData.permasalahan.push(permasalahan);
      }
      if (potensi && potensi.trim()) {
        soshumData.potensi.push(potensi);
      }
      if (proyekPotensial && proyekPotensial.trim()) {
        soshumData.proyekPotensial.push(proyekPotensial);
      }
    }

    return (
      <div className="space-y-8">
        {/* Deskripsi Singkat Desa */}
        {deskripsiDesa && (
          <div className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 rounded-3xl p-8 border border-blue-500/30 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-3">
                  Deskripsi Singkat Desa
                </h2>
                <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                  {deskripsiDesa}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Profil Desa */}
        {profilDesa.length > 0 && (
          <div>
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
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
              </span>
              Profil Desa
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profilDesa.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700 hover:border-blue-500/50 transition-all">
                  <h3 className="text-lg font-bold text-blue-400 mb-2">
                    {item.judul}
                  </h3>
                  <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {item.isi}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* List Sekolah */}
        {sekolah.nama !== null && (
          <div className="bg-gradient-to-br from-green-900/50 to-teal-900/50 rounded-2xl p-6 border border-green-500/30">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">
                  List Sekolah
                </h3>
                <p className="text-green-100 font-semibold mb-1">
                  {sekolah.nama}
                </p>
                {sekolah.alamat && (
                  <p className="text-gray-300 text-sm">{sekolah.alamat}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SAINTEK Section */}
        {(saintekData.permasalahan.length > 0 ||
          saintekData.potensi.length > 0 ||
          saintekData.proyekPotensial.length > 0) && (
          <div className="bg-gray-800/30 rounded-3xl p-6 border border-gray-700">
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-6">
              SAINTEK
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Permasalahan */}
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-red-400 flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  Permasalahan
                </h3>
                <ul className="space-y-2">
                  {saintekData.permasalahan.map((item, idx) => (
                    <li
                      key={idx}
                      className="text-gray-300 text-sm bg-gray-900/50 p-3 rounded-lg border-l-4 border-red-500">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Potensi */}
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-green-400 flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  Potensi
                </h3>
                <ul className="space-y-2">
                  {saintekData.potensi.map((item, idx) => (
                    <li
                      key={idx}
                      className="text-gray-300 text-sm bg-gray-900/50 p-3 rounded-lg border-l-4 border-green-500">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Proyek Potensial */}
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                    />
                  </svg>
                  Proyek Potensial
                </h3>
                <ul className="space-y-2">
                  {saintekData.proyekPotensial.map((item, idx) => (
                    <li
                      key={idx}
                      className="text-gray-300 text-sm bg-gray-900/50 p-3 rounded-lg border-l-4 border-blue-500">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* AGRO Section */}
        {(agroData.permasalahan.length > 0 ||
          agroData.potensi.length > 0 ||
          agroData.proyekPotensial.length > 0) && (
          <div className="bg-gray-800/30 rounded-3xl p-6 border border-gray-700">
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 mb-6">
              AGRO
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Permasalahan */}
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-red-400 flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  Permasalahan
                </h3>
                <ul className="space-y-2">
                  {agroData.permasalahan.map((item, idx) => (
                    <li
                      key={idx}
                      className="text-gray-300 text-sm bg-gray-900/50 p-3 rounded-lg border-l-4 border-red-500">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Potensi */}
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-green-400 flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  Potensi
                </h3>
                <ul className="space-y-2">
                  {agroData.potensi.map((item, idx) => (
                    <li
                      key={idx}
                      className="text-gray-300 text-sm bg-gray-900/50 p-3 rounded-lg border-l-4 border-green-500">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Proyek Potensial */}
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                    />
                  </svg>
                  Proyek Potensial
                </h3>
                <ul className="space-y-2">
                  {agroData.proyekPotensial.map((item, idx) => (
                    <li
                      key={idx}
                      className="text-gray-300 text-sm bg-gray-900/50 p-3 rounded-lg border-l-4 border-blue-500">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* KESRA Section */}
        {(kesraData.permasalahan.length > 0 ||
          kesraData.potensi.length > 0 ||
          kesraData.proyekPotensial.length > 0) && (
          <div className="bg-gray-800/30 rounded-3xl p-6 border border-gray-700">
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400 mb-6">
              KESRA
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Permasalahan */}
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-red-400 flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  Permasalahan
                </h3>
                <ul className="space-y-2">
                  {kesraData.permasalahan.map((item, idx) => (
                    <li
                      key={idx}
                      className="text-gray-300 text-sm bg-gray-900/50 p-3 rounded-lg border-l-4 border-red-500">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Potensi */}
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-green-400 flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  Potensi
                </h3>
                <ul className="space-y-2">
                  {kesraData.potensi.map((item, idx) => (
                    <li
                      key={idx}
                      className="text-gray-300 text-sm bg-gray-900/50 p-3 rounded-lg border-l-4 border-green-500">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Proyek Potensial */}
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                    />
                  </svg>
                  Proyek Potensial
                </h3>
                <ul className="space-y-2">
                  {kesraData.proyekPotensial.map((item, idx) => (
                    <li
                      key={idx}
                      className="text-gray-300 text-sm bg-gray-900/50 p-3 rounded-lg border-l-4 border-blue-500">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* SOSHUM Section */}
        {(soshumData.permasalahan.length > 0 ||
          soshumData.potensi.length > 0 ||
          soshumData.proyekPotensial.length > 0) && (
          <div className="bg-gray-800/30 rounded-3xl p-6 border border-gray-700">
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400 mb-6">
              SOSHUM
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Permasalahan */}
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-red-400 flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  Permasalahan
                </h3>
                <ul className="space-y-2">
                  {soshumData.permasalahan.map((item, idx) => (
                    <li
                      key={idx}
                      className="text-gray-300 text-sm bg-gray-900/50 p-3 rounded-lg border-l-4 border-red-500">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Potensi */}
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-green-400 flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  Potensi
                </h3>
                <ul className="space-y-2">
                  {soshumData.potensi.map((item, idx) => (
                    <li
                      key={idx}
                      className="text-gray-300 text-sm bg-gray-900/50 p-3 rounded-lg border-l-4 border-green-500">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Proyek Potensial */}
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                    />
                  </svg>
                  Proyek Potensial
                </h3>
                <ul className="space-y-2">
                  {soshumData.proyekPotensial.map((item, idx) => (
                    <li
                      key={idx}
                      className="text-gray-300 text-sm bg-gray-900/50 p-3 rounded-lg border-l-4 border-blue-500">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header dengan gradient */}
        <header className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-8 md:p-12 shadow-2xl">
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white">
                Profil Desa KKN
              </h1>
            </div>
            <p className="text-blue-100 text-lg md:text-xl font-medium max-w-2xl">
              Analisis Masalah dan Potensi Desa - KKN UGM Banggai Bertutur
            </p>
          </div>

          {/* Decorative elements */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl" />
        </header>

        {/* Tab navigation dengan style modern */}
        <nav className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          {SHEETS.map((sheet, idx) => {
            const isActive = idx === activeTab;
            return (
              <button
                key={sheet.name}
                type="button"
                onClick={() => setActiveTab(idx)}
                className={`group relative px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 whitespace-nowrap ${
                  isActive
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/50 scale-105"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white hover:shadow-md"
                }`}>
                <span className="relative z-10 flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                  {sheet.name}
                </span>
                {isActive && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400 to-purple-500 blur-xl opacity-50" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Content area */}
        <section className="min-h-[400px]">{renderProfilCards()}</section>

        {/* Footer info */}
        <footer className="text-center pt-8 pb-4 border-t border-gray-800">
          <p className="text-gray-500 text-sm">
            Data dari Google Sheets • {currentSheet?.name || "Memuat..."}
          </p>
        </footer>
      </div>
    </main>
  );
}
