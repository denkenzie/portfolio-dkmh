    const KEYS = { warga: 'data-warga', surat: 'data-surat', keuangan: 'data-keuangan', pengumuman: 'data-pengumuman', tamu: 'data-tamu' };
    let DB = { warga: [], surat: [], keuangan: [], pengumuman: [], tamu: [] };

    async function loadAll() {
      for (const [k, storageKey] of Object.entries(KEYS)) {
        try {
          const res = await window.storage.get(storageKey, true);
          DB[k] = res && res.value ? JSON.parse(res.value) : [];
        } catch (e) { DB[k] = []; }
      }
    }

    async function save(k) {
      try {
        await window.storage.set(KEYS[k], JSON.stringify(DB[k]), true);
      } catch (e) { showToast('Gagal menyimpan data. Coba lagi.');
        console.error(e); }
    }

    function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

    function showToast(msg) {
      const t = document.getElementById('toast');
      t.textContent = msg;
      t.classList.add('show');
      setTimeout(() => t.classList.remove('show'), 2200);
    }

    function fmtDate(iso) {
      if (!iso) return '—';
      const d = new Date(iso);
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    function fmtRupiah(n) {
      n = Number(n) || 0;
      return 'Rp' + n.toLocaleString('id-ID');
    }

    function esc(s) {
      return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } [c]));
    }

    function openModal(html) {
      document.getElementById('modalBox').innerHTML = html;
      document.getElementById('modalOverlay').classList.add('open');
    }

    function closeModal() { document.getElementById('modalOverlay').classList.remove('open'); }
    document.getElementById('modalOverlay').addEventListener('click', e => {
      if (e.target.id === 'modalOverlay') closeModal();
    });

    let currentTab = 'dashboard';
    document.getElementById('tabNav').addEventListener('click', e => {
      const btn = e.target.closest('button[data-tab]');
      if (!btn) return;
      currentTab = btn.dataset.tab;
      document.querySelectorAll('nav.tabs button').forEach(b => b.classList.toggle('active', b === btn));
      render();
    });

    function downloadCsv(filename, rows, headers) {
      if (!rows || !rows.length) {
        showToast('Belum ada data untuk diunduh.');
        return;
      }

      const csvRows = [headers, ...rows.map(row => headers.map(h => {
        const value = row[h] ?? '';
        const escaped = String(value).replace(/"/g, '""');
        return /[",\n]/.test(String(value)) ? `"${escaped}"` : escaped;
      }))];

      const csv = csvRows.map(r => r.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast('File CSV berhasil diunduh.');
    }

    function exportCanvasImage(filename, format, element) {
      if (!window.html2canvas) {
        showToast('Fitur gambar sedang dimuat. Coba sebentar lagi.');
        return;
      }

      const target = element || document.getElementById('sheetContent');
      if (!target) return;

      window.html2canvas(target, {
        backgroundColor: '#F6F1E4',
        scale: 2,
        useCORS: true,
      }).then(canvas => {
        const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';
        const dataUrl = canvas.toDataURL(mime, 0.95);
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        link.remove();
        showToast(`File ${format.toUpperCase()} berhasil diunduh.`);
      }).catch(() => {
        showToast('Gagal membuat file gambar. Coba lagi.');
      });
    }

    function exportCurrentData(format = 'csv') {
      const target = document.getElementById('sheetContent');
      if (!target) return;

      if (format === 'pdf') {
        window.print();
        return;
      }

      if (format === 'png' || format === 'jpg') {
        const ext = format === 'jpg' ? 'jpg' : 'png';
        const fileName = (currentTab || 'data') + '.' + ext;
        exportCanvasImage(fileName, ext, target);
        return;
      }

      if (currentTab === 'warga') {
        const headers = ['nama', 'nik', 'status', 'jk', 'rumah', 'hp'];
        const rows = DB.warga.map(w => ({
          nama: w.nama || '',
          nik: w.nik || '',
          status: w.status || '',
          jk: w.jk || '',
          rumah: w.rumah || '',
          hp: w.hp || ''
        }));
        downloadCsv('data-warga.csv', rows, headers);
        return;
      }

      if (currentTab === 'surat') {
        const headers = ['nama', 'tanggal', 'jenis', 'keperluan', 'status'];
        const rows = DB.surat.map(s => ({
          nama: s.nama || '',
          tanggal: s.tanggal || '',
          jenis: s.jenis || '',
          keperluan: s.keperluan || '',
          status: s.status || ''
        }));
        downloadCsv('data-surat.csv', rows, headers);
        return;
      }

      if (currentTab === 'keuangan') {
        const headers = ['tanggal', 'jenis', 'kategori', 'keterangan', 'jumlah', 'statusBayar', 'nama'];
        const rows = DB.keuangan.map(t => ({
          tanggal: t.tanggal || '',
          jenis: t.jenis || '',
          kategori: t.kategori || '',
          keterangan: t.keterangan || '',
          jumlah: t.jumlah || 0,
          statusBayar: t.statusBayar || 'Lunas',
          nama: t.nama || ''
        }));
        downloadCsv('data-keuangan.csv', rows, headers);
        return;
      }

      if (currentTab === 'pengumuman') {
        const headers = ['judul', 'kategori', 'tanggal', 'isi'];
        const rows = DB.pengumuman.map(p => ({
          judul: p.judul || '',
          kategori: p.kategori || '',
          tanggal: p.tanggal || '',
          isi: p.isi || ''
        }));
        downloadCsv('data-pengumuman.csv', rows, headers);
        return;
      }

      if (currentTab === 'tamu') {
        const headers = ['nama', 'tanggal', 'asal', 'keperluan'];
        const rows = DB.tamu.map(t => ({
          nama: t.nama || '',
          tanggal: t.tanggal || '',
          asal: t.asal || '',
          keperluan: t.keperluan || ''
        }));
        downloadCsv('data-tamu.csv', rows, headers);
        return;
      }

      showToast('Silakan buka modul yang ingin diunduh.');
    }

    function triggerExport(button) {
      const select = button.closest('.export-tools')?.querySelector('.export-select');
      const format = select ? select.value : 'csv';
      exportCurrentData(format);
    }

    function render() {
      const el = document.getElementById('sheetContent');
      if (!el) return;

      if (currentTab === 'dashboard') el.innerHTML = renderDashboard();
      else if (currentTab === 'warga') el.innerHTML = renderWarga();
      else if (currentTab === 'surat') el.innerHTML = renderSurat();
      else if (currentTab === 'keuangan') el.innerHTML = renderKeuangan();
      else if (currentTab === 'pengumuman') el.innerHTML = renderPengumuman();
      else if (currentTab === 'tamu') el.innerHTML = renderTamu();

      updateBadge();
    }

    function updateBadge() {
      const pending = DB.surat.filter(s => s.status !== 'selesai').length;
      const b = document.getElementById('badgeSurat');
      if (pending > 0) { b.style.display = 'inline-flex';
        b.textContent = pending; } else b.style.display = 'none';
    }

    function renderDashboard() {
      const totalWarga = DB.warga.length;
      const totalKK = DB.warga.filter(w => w.status === 'Kepala Keluarga').length;
      const suratPending = DB.surat.filter(s => s.status !== 'selesai').length;
      const saldo = DB.keuangan.reduce((sum, t) => sum + (t.jenis === 'Masuk' ? Number(t.jumlah) : -Number(t.jumlah)), 0);
      const pengumumanTerbaru = [...DB.pengumuman].sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal)).slice(0, 4);
      const suratTerbaru = [...DB.surat].sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal)).slice(0, 5);

      return `
        <div class="hero hero-split">
          <div class="hero-text">
            <div class="hero-badges">
              <span>🏛️ Sistem Digital</span>
              <span>📍 RT/RW Terintegrasi</span>
            </div>
            <span class="eyebrow">🏛️ Sistem Administrasi Digital</span>
            <h2 class="hero-title">Satu tempat untuk semua <em>berkas</em> RT/RW.</h2>
            <p class="hero-lead">
              Selama ini urusan warga sering tersebar: catatan iuran di buku kas, pengajuan surat lewat WhatsApp,
              data penduduk di kertas yang gampang hilang atau basah. <strong>Arsip Warga</strong> menyatukan semuanya
              dalam satu sistem yang bisa diakses kapan pun oleh pengurus, tanpa perlu bongkar-bongkar map fisik lagi.
            </p>
            <div class="hero-points">
              <div class="hero-point">
                <span class="hp-num">01</span>
                <div><strong>Data tersimpan rapi</strong><span>Semua data warga, surat, dan kas ada di satu tempat — bukan tersebar di banyak buku dan grup chat.</span></div>
              </div>
              <div class="hero-point">
                <span class="hp-num">02</span>
                <div><strong>Bisa dipakai bersama</strong><span>Ketua RT, sekretaris, dan bendahara bisa buka sistem yang sama dan lihat data terkini secara langsung.</span></div>
              </div>
              <div class="hero-point">
                <span class="hp-num">03</span>
                <div><strong>Transparan ke warga</strong><span>Status pengajuan surat dan laporan kas jadi lebih jelas dan mudah dipertanggungjawabkan.</span></div>
              </div>
            </div>
          </div>
          <div class="hero-art">
            <svg viewBox="0 0 420 340" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Ilustrasi lingkungan RT/RW">
              <ellipse cx="210" cy="300" rx="190" ry="18" fill="#EDE5D0"/>
              <line x1="20" y1="270" x2="400" y2="270" stroke="#CBB98F" stroke-width="2" stroke-dasharray="6 7"/>
              <circle cx="60" cy="248" r="16" fill="#3E6B52"/>
              <rect x="56" y="258" width="8" height="16" fill="#7E2C20"/>
              <circle cx="368" cy="240" r="20" fill="#3E6B52"/>
              <rect x="363" y="255" width="10" height="20" fill="#7E2C20"/>
              <g>
                <rect x="70" y="180" width="90" height="90" fill="#E4D6AE" stroke="#20293A" stroke-width="2.5"/>
                <polygon points="60,180 115,138 170,180" fill="#3E6B52" stroke="#20293A" stroke-width="2.5"/>
                <rect x="100" y="220" width="30" height="50" fill="#A13A2B" stroke="#20293A" stroke-width="2"/>
                <circle cx="123" cy="245" r="2.2" fill="#F6F1E4"/>
                <rect x="78" y="195" width="18" height="18" fill="#F6F1E4" stroke="#20293A" stroke-width="2"/>
                <rect x="136" y="195" width="18" height="18" fill="#F6F1E4" stroke="#20293A" stroke-width="2"/>
              </g>
              <g>
                <rect x="175" y="150" width="110" height="120" fill="#F6F1E4" stroke="#20293A" stroke-width="2.5"/>
                <polygon points="163,150 230,95 297,150" fill="#A13A2B" stroke="#20293A" stroke-width="2.5"/>
                <rect x="212" y="205" width="36" height="65" fill="#20293A" stroke="#20293A" stroke-width="2"/>
                <rect x="188" y="168" width="22" height="22" fill="#E4D6AE" stroke="#20293A" stroke-width="2"/>
                <rect x="250" y="168" width="22" height="22" fill="#E4D6AE" stroke="#20293A" stroke-width="2"/>
              </g>
              <g>
                <rect x="295" y="190" width="80" height="80" fill="#E4D6AE" stroke="#20293A" stroke-width="2.5"/>
                <polygon points="287,190 335,155 383,190" fill="#3E6B52" stroke="#20293A" stroke-width="2.5"/>
                <rect x="318" y="225" width="26" height="45" fill="#7E2C20" stroke="#20293A" stroke-width="2"/>
                <rect x="300" y="205" width="16" height="16" fill="#F6F1E4" stroke="#20293A" stroke-width="2"/>
              </g>
              <g transform="translate(232,40) rotate(-9)">
                <rect x="0" y="0" width="86" height="60" rx="3" fill="#FFFDF8" stroke="#20293A" stroke-width="2.5"/>
                <line x1="12" y1="16" x2="60" y2="16" stroke="#CBB98F" stroke-width="3"/>
                <line x1="12" y1="27" x2="70" y2="27" stroke="#CBB98F" stroke-width="3"/>
                <line x1="12" y1="38" x2="50" y2="38" stroke="#CBB98F" stroke-width="3"/>
                <circle cx="66" cy="46" r="15" fill="none" stroke="#A13A2B" stroke-width="2.5"/>
                <text x="66" y="49" font-family="IBM Plex Mono, monospace" font-size="7" fill="#A13A2B" text-anchor="middle" font-weight="700">SAH</text>
              </g>
              <circle cx="345" cy="55" r="4" fill="#B8862E"/>
              <circle cx="30" cy="110" r="3" fill="#B8862E"/>
              <circle cx="200" cy="30" r="3" fill="#3E6B52"/>
            </svg>
          </div>
        </div>

        <hr class="perforation">

        <h2 class="section-title">📊 Ringkasan Terkini</h2>
        <p class="section-desc">Gambaran umum kondisi warga, berkas, dan kas saat ini — angka-angka ini otomatis update setiap kali ada data baru di modul terkait.</p>
        <div class="stat-grid">
          <div class="stat-card"><div class="label">Total Warga</div><div class="value">${totalWarga}</div></div>
          <div class="stat-card"><div class="label">Kepala Keluarga</div><div class="value">${totalKK}</div></div>
          <div class="stat-card"><div class="label">Surat Menunggu</div><div class="value stamp-red">${suratPending}</div></div>
          <div class="stat-card"><div class="label">Saldo Kas</div><div class="value moss">${fmtRupiah(saldo)}</div></div>
        </div>

        <hr class="perforation">

        <div class="dash-two-col">
          <div>
            <h2 class="section-title" style="font-size:16px">✉️ Pengajuan Surat Terbaru</h2>
            <p class="section-desc" style="margin-bottom:12px">5 pengajuan surat paling baru masuk. Buka tab <strong>Surat-Menyurat</strong> untuk memproses atau mengubah statusnya.</p>
            ${suratTerbaru.length? `<ul class="mini-list">${suratTerbaru.map(s=>`
              <li><span>${esc(s.nama)} — ${esc(s.jenis)}</span><span class="tag ${s.status}">${s.status}</span></li>
            `).join('')}</ul>` : `<p class="section-desc">Belum ada pengajuan surat. Tab Surat-Menyurat akan menampilkan daftar begitu ada warga yang mengajukan.</p>`}
          </div>
          <div>
            <h2 class="section-title" style="font-size:16px">📣 Pengumuman Terbaru</h2>
            <p class="section-desc" style="margin-bottom:12px">4 pengumuman atau kegiatan paling baru diterbitkan lewat tab Pengumuman &amp; Kegiatan.</p>
            ${pengumumanTerbaru.length? `<ul class="mini-list">${pengumumanTerbaru.map(p=>`
              <li><span>${esc(p.judul)}</span><span style="color:var(--ink-soft);font-size:12px">${fmtDate(p.tanggal)}</span></li>
            `).join('')}</ul>` : `<p class="section-desc">Belum ada pengumuman. Papan info ini akan terisi begitu pengurus menerbitkan pengumuman pertama.</p>`}
          </div>
        </div>

        <hr class="perforation">

        <div style="margin-bottom: 28px;">
          <h2 class="section-title" style="font-size: 18px; margin-bottom: 8px;">📖 Panduan Singkat Tiap Modul</h2>
          <p class="section-desc" style="font-size: 13.5px; margin: 0;">Belum familiar dengan sistemnya? Berikut penjelasan lengkap fungsi tiap tab dan cara kerjanya.</p>
        </div>
        <div class="guide-grid">
          <div class="guide-card">
            <div class="guide-icon">👥</div>
            <strong>Data Warga</strong>
            <span>Simpan data kependudukan tiap warga: nama, NIK, status dalam keluarga, alamat rumah, dan nomor kontak. Jadi rujukan utama untuk modul lain.</span>
          </div>
          <div class="guide-card">
            <div class="guide-icon">✉️</div>
            <strong>Surat-Menyurat</strong>
            <span>Catat pengajuan surat warga — domisili, SKTM, pengantar nikah, dll — dan pantau statusnya dari diajukan sampai selesai dicetak.</span>
          </div>
          <div class="guide-card">
            <div class="guide-icon">💰</div>
            <strong>Keuangan</strong>
            <span>Bukukan setiap iuran warga yang masuk dan pengeluaran kas RT/RW, lengkap dengan saldo yang terhitung otomatis.</span>
          </div>
          <div class="guide-card">
            <div class="guide-icon">📣</div>
            <strong>Pengumuman &amp; Kegiatan</strong>
            <span>Terbitkan info jadwal ronda, kerja bakti, rapat warga, atau pengumuman penting lainnya — jadi papan info digital lingkungan.</span>
          </div>
          <div class="guide-card">
            <div class="guide-icon">🪪</div>
            <strong>Buku Tamu</strong>
            <span>Catat siapa saja yang berkunjung ke lingkungan, dari mana asalnya, dan untuk keperluan apa — pengganti buku tamu kertas di pos ronda.</span>
          </div>
        </div>
      `;
    }

    function wargaTableMarkup(searchTerm = '') {
      const q = (searchTerm || '').toLowerCase();
      const rows = DB.warga.filter(w => !q || w.nama.toLowerCase().includes(q) || (w.nik || '').includes(q));
      return rows.length ? `
        <table class="ledger">
          <thead><tr><th>Nama</th><th>NIK</th><th>Status</th><th>No. Rumah</th><th>No. HP</th><th></th></tr></thead>
          <tbody>
            ${rows.map(w=>`
              <tr>
                <td><strong>${esc(w.nama)}</strong></td>
                <td>${esc(w.nik||'—')}</td>
                <td>${esc(w.status)}</td>
                <td>${esc(w.rumah||'—')}</td>
                <td>${esc(w.hp||'—')}</td>
                <td class="row-actions">
                  <button class="btn secondary small" onclick="openWargaForm('${w.id}')">Ubah</button>
                  <button class="btn danger small" onclick="deleteWarga('${w.id}')">Hapus</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : `<div class="empty-state"><strong>Belum ada data warga</strong>Tambahkan warga pertama lewat tombol di atas.</div>`;
    }

    function renderWarga() {
      const q = window._wargaSearch || '';
      return `
        <h2 class="section-title">👥 Data Warga</h2>
        <p class="section-desc">
          Modul ini adalah "buku induk" kependudukan lingkungan — tempat menyimpan seluruh data warga yang tinggal di wilayah RT/RW, mulai dari nama lengkap, NIK, jenis kelamin, status dalam keluarga, nomor rumah, hingga kontak yang bisa dihubungi. Fungsi utamanya adalah menjaga arsip penduduk tetap rapi, akurat, dan mudah diakses saat dibutuhkan untuk kebutuhan administrasi, pengajuan bantuan, kegiatan lingkungan, maupun kebutuhan internal pengurus. Ketika ada warga baru, perubahan status keluarga, rumah pindah, atau nomor kontak yang berubah, data ini harus segera diperbarui agar informasi yang dipakai oleh aparat RT/RW tetap konsisten dan tidak bertabrakan dengan data lama.
          <br><br>
          Dari sisi operasional, data warga menjadi sumber referensi utama untuk modul lain seperti surat menyurat, keuangan, dan pengumuman. Misalnya saat warga mengajukan surat pengantar, pengurus bisa langsung mengecek profil keluarga dan rumahnya tanpa harus mencari-cari catatan manual di kertas. Dengan data yang terstruktur seperti ini, pengelolaan lingkungan menjadi lebih profesional, lebih cepat, dan lebih mudah dipertanggungjawabkan saat rapat atau monitoring kondisi sosial masyarakat.
        </p>
        <div class="toolbar">
          <input type="text" id="searchWarga" placeholder="🔍 Cari nama atau NIK…" value="${esc(q)}">
          <div class="export-tools">
            <select class="export-select" aria-label="Pilih format unduh">
              <option value="csv">CSV</option>
              <option value="pdf">PDF</option>
              <option value="png">PNG</option>
              <option value="jpg">JPG</option>
            </select>
            <button class="btn secondary" type="button" onclick="triggerExport(this)">↓ Unduh</button>
            <button class="btn" type="button" onclick="openWargaForm()">+ Tambah Warga</button>
          </div>
        </div>
        <div id="wargaTableWrap">${wargaTableMarkup(q)}</div>
      `;
    }

    window.addEventListener('input', e => {
      if (e.target.id === 'searchWarga') {
        window._wargaSearch = e.target.value;
        const wrap = document.getElementById('wargaTableWrap');
        if (wrap) {
          wrap.innerHTML = wargaTableMarkup(window._wargaSearch);
        }
      }
    });

    function openWargaForm(id) {
      const w = id ? DB.warga.find(x => x.id === id) : null;
      openModal(`
        <h3>${w? 'Ubah Data Warga':'Tambah Warga'}</h3>
        <form id="wargaForm">
          <div class="form-grid">
            <div class="field"><label>Nama Lengkap</label><input required name="nama" value="${esc(w?.nama||'')}"></div>
            <div class="field"><label>NIK</label><input name="nik" value="${esc(w?.nik||'')}" maxlength="16"></div>
            <div class="field"><label>Status</label>
              <select name="status">
                <option ${w?.status==='Kepala Keluarga'?'selected':''}>Kepala Keluarga</option>
                <option ${w?.status==='Anggota Keluarga'?'selected':''}>Anggota Keluarga</option>
              </select>
            </div>
            <div class="field"><label>Jenis Kelamin</label>
              <select name="jk">
                <option ${w?.jk==='Laki-laki'?'selected':''}>Laki-laki</option>
                <option ${w?.jk==='Perempuan'?'selected':''}>Perempuan</option>
              </select>
            </div>
            <div class="field"><label>No. Rumah / RT-RW</label><input name="rumah" value="${esc(w?.rumah||'')}"></div>
            <div class="field"><label>No. HP</label><input name="hp" value="${esc(w?.hp||'')}"></div>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn">Simpan</button>
            <button type="button" class="btn secondary" onclick="closeModal()">Batal</button>
          </div>
        </form>
      `);
      document.getElementById('wargaForm').onsubmit = async e => {
        e.preventDefault();
        const f = new FormData(e.target);
        const data = { nama: f.get('nama').trim(), nik: f.get('nik').trim(), status: f.get('status'), jk: f.get('jk'), rumah: f.get('rumah').trim(), hp: f.get('hp').trim() };
        if (!data.nama) return;
        if (w) { Object.assign(w, data); } else { DB.warga.push({ id: uid(), ...data }); }
        await save('warga');
        closeModal();
        render();
        showToast('Data warga tersimpan.');
      };
    }

    async function deleteWarga(id) {
      if (!confirm('Hapus data warga ini?')) return;
      DB.warga = DB.warga.filter(w => w.id !== id);
      await save('warga');
      render();
      showToast('Data warga dihapus.');
    }

    const SURAT_JENIS = ['Surat Pengantar KTP', 'Surat Domisili', 'Surat Tidak Mampu (SKTM)', 'Surat Pengantar Nikah', 'Surat Kelahiran', 'Surat Kematian', 'Surat Usaha', 'Lainnya'];

    function renderSurat() {
      const rows = [...DB.surat].sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
      return `
        <h2 class="section-title">✉️ Surat-Menyurat</h2>
        <p class="section-desc">
          Warga sering membutuhkan surat pengantar untuk berbagai kebutuhan administrasi, mulai dari urusan kependudukan, kebutuhan bantuan sosial, pengajuan perizinan, hingga keperluan keluarga seperti pernikahan, kelahiran, atau pindah domisili. Modul ini membantu pengurus RT/RW mencatat seluruh pengajuan secara tertib dan jelas, mulai dari tanggal masuk, jenis surat yang diminta, keperluan yang diajukan, hingga siapa pemohon yang mengurusnya. Dengan pencatatan yang terstruktur, pengurus tidak perlu mengandalkan pesan chat yang mudah tercecer atau catatan manual yang rawan terlupa.
          <br><br>
          Setiap pengajuan memiliki status yang bisa dipantau dari awal sampai akhir proses: <strong>Diajukan</strong> saat permohonan masuk, <strong>Diproses</strong> saat tim RT/RW sedang menyiapkan berkas atau menunggu persetujuan, dan <strong>Selesai</strong> ketika surat sudah dicetak dan dapat diserahkan kepada pemohon. Sistem seperti ini membuat layanan terhadap warga lebih cepat, lebih transparan, dan lebih profesional, sekaligus mengurangi tumpang tindih komunikasi antara pengurus dan pemohon.
        </p>
        <div class="toolbar">
          <div></div>
          <div class="export-tools">
            <select class="export-select" aria-label="Pilih format unduh">
              <option value="csv">CSV</option>
              <option value="pdf">PDF</option>
              <option value="png">PNG</option>
              <option value="jpg">JPG</option>
            </select>
            <button class="btn secondary" type="button" onclick="triggerExport(this)">↓ Unduh</button>
            <button class="btn" type="button" onclick="openSuratForm()">+ Ajukan Surat</button>
          </div>
        </div>
        ${rows.length? `
        <table class="ledger">
          <thead><tr><th>Tanggal</th><th>Nama Pemohon</th><th>Jenis Surat</th><th>Keperluan</th><th>Status</th><th></th></tr></thead>
          <tbody>
            ${rows.map(s=>`
              <tr>
                <td>${fmtDate(s.tanggal)}</td>
                <td><strong>${esc(s.nama)}</strong></td>
                <td>${esc(s.jenis)}</td>
                <td>${esc(s.keperluan||'—')}</td>
                <td>
                  <select onchange="updateSuratStatus('${s.id}', this.value)" style="font-size:11.5px;padding:4px 6px;border-radius:20px;border:1px solid var(--line);">
                    <option ${s.status==='diajukan'?'selected':''} value="diajukan">Diajukan</option>
                    <option ${s.status==='diproses'?'selected':''} value="diproses">Diproses</option>
                    <option ${s.status==='selesai'?'selected':''} value="selesai">Selesai</option>
                  </select>
                </td>
                <td class="row-actions">
                  <button class="btn danger small" onclick="deleteSurat('${s.id}')">Hapus</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ` : `<div class="empty-state"><strong>Belum ada pengajuan surat</strong>Ajukan surat pertama lewat tombol di atas.</div>`}
      `;
    }

    function openSuratForm() {
      openModal(`
        <h3>Ajukan Surat</h3>
        <form id="suratForm">
          <div class="form-grid">
            <div class="field"><label>Nama Pemohon</label><input required name="nama"></div>
            <div class="field"><label>Tanggal</label><input type="date" name="tanggal" value="${new Date().toISOString().slice(0,10)}"></div>
          </div>
          <div class="field" style="margin-bottom:12px"><label>Jenis Surat</label>
            <select name="jenis">${SURAT_JENIS.map(j=>`<option>${j}</option>`).join('')}</select>
          </div>
          <div class="field" style="margin-bottom:16px"><label>Keperluan</label><textarea name="keperluan" placeholder="Contoh: untuk pengajuan KIS"></textarea></div>
          <div class="form-actions">
            <button type="submit" class="btn">Simpan Pengajuan</button>
            <button type="button" class="btn secondary" onclick="closeModal()">Batal</button>
          </div>
        </form>
      `);
      document.getElementById('suratForm').onsubmit = async e => {
        e.preventDefault();
        const f = new FormData(e.target);
        const nama = f.get('nama').trim();
        if (!nama) return;
        DB.surat.push({ id: uid(), nama, tanggal: f.get('tanggal'), jenis: f.get('jenis'), keperluan: f.get('keperluan').trim(), status: 'diajukan' });
        await save('surat');
        closeModal();
        render();
        showToast('Pengajuan surat tersimpan.');
      };
    }

    async function updateSuratStatus(id, status) {
      const s = DB.surat.find(x => x.id === id);
      if (!s) return;
      s.status = status;
      await save('surat');
      render();
      showToast('Status surat diperbarui.');
    }

    async function deleteSurat(id) {
      if (!confirm('Hapus pengajuan surat ini?')) return;
      DB.surat = DB.surat.filter(s => s.id !== id);
      await save('surat');
      render();
      showToast('Pengajuan surat dihapus.');
    }

    function renderKeuangan() {
      const rows = [...DB.keuangan].sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
      const masuk = DB.keuangan.filter(t => t.jenis === 'Masuk').reduce((s, t) => s + Number(t.jumlah), 0);
      const keluar = DB.keuangan.filter(t => t.jenis === 'Keluar').reduce((s, t) => s + Number(t.jumlah), 0);
      const belumBayar = DB.keuangan.filter(t => (t.statusBayar || 'Lunas') === 'Belum Bayar');
      return `
        <h2 class="section-title">💰 Keuangan Kas</h2>
        <p class="section-desc">
          Keuangan RT/RW adalah salah satu bagian paling penting dalam pengelolaan lingkungan karena menyangkut transparansi dan kepercayaan warga terhadap pengurus. Modul ini mencatat seluruh transaksi kas secara rapi, mulai dari pemasukan seperti iuran bulanan, sumbangan kegiatan, hingga pendapatan tambahan lainnya, sampai pengeluaran seperti biaya kerja bakti, pembelian alat kebersihan, konsumsi rapat, atau kebutuhan operasional lingkungan. Semua transaksi dicatat dengan kategori, tanggal, keterangan, serta nominal yang jelas agar data tidak mudah hilang atau salah pencatatan.
          <br><br>
          Keunggulan utama dari sistem ini adalah saldo otomatis yang dihitung setiap saat berdasarkan jumlah pemasukan dan pengeluaran. Dengan begitu, bendahara maupun pengurus lain dapat mengecek kondisi keuangan secara real-time tanpa harus menghitung manual dari buku kas. Informasi ini sangat bermanfaat saat menjelang rapat warga, evaluasi anggaran, atau saat ingin memberikan laporan yang lebih profesional dan mudah dipahami oleh masyarakat.
        </p>
        <div class="balance-strip">
          <div><div class="l">Pemasukan</div><div class="v" style="color:var(--moss)">${fmtRupiah(masuk)}</div></div>
          <div><div class="l">Pengeluaran</div><div class="v" style="color:var(--stamp)">${fmtRupiah(keluar)}</div></div>
          <div><div class="l">Saldo</div><div class="v">${fmtRupiah(masuk-keluar)}</div></div>
        </div>
        <div class="toolbar">
          <div></div>
          <div class="export-tools">
            <select class="export-select" aria-label="Pilih format unduh">
              <option value="csv">CSV</option>
              <option value="pdf">PDF</option>
              <option value="png">PNG</option>
              <option value="jpg">JPG</option>
            </select>
            <button class="btn secondary" type="button" onclick="triggerExport(this)">↓ Unduh</button>
            <button class="btn" type="button" onclick="openKeuanganForm()">+ Catat Transaksi</button>
          </div>
        </div>

        <div style="margin:18px 0 20px;border:1px solid var(--line);border-radius:12px;padding:14px 16px;background:rgba(161,58,43,0.04);">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px;">
            <h3 style="margin:0;font-size:16px;">📌 Daftar Belum Bayar</h3>
            <span class="tag keluar">${belumBayar.length} orang</span>
          </div>
          ${belumBayar.length ? `
            <div style="display:grid;gap:8px;">
              ${belumBayar.map(t => `
                <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;border:1px solid rgba(161,58,43,0.14);border-radius:8px;padding:10px 12px;background:white;">
                  <div>
                    <div style="font-weight:700;font-size:13px;">${esc(t.nama || 'Belum ada nama')}</div>
                    <div style="font-size:11.5px;color:var(--ink-soft)">${esc(t.kategori)} • ${fmtDate(t.tanggal)}</div>
                  </div>
                  <span class="tag keluar">Belum Bayar</span>
                </div>
              `).join('')}
            </div>
          ` : `<div class="empty-state" style="margin:0;border:none;background:transparent;padding:0;"><strong>Semua sudah lunas</strong>Tidak ada data tagihan yang tertunggak.</div>`}
        </div>

        ${rows.length? `
        <table class="ledger">
          <thead><tr><th>Tanggal</th><th>Nama</th><th>Kategori</th><th>Keterangan</th><th>Jenis</th><th>Status</th><th>Jumlah</th><th></th></tr></thead>
          <tbody>
            ${rows.map(t=>`
              <tr>
                <td>${fmtDate(t.tanggal)}</td>
                <td>${esc(t.nama || '—')}</td>
                <td>${esc(t.kategori)}</td>
                <td>${esc(t.keterangan||'—')}</td>
                <td><span class="tag ${t.jenis==='Masuk'?'masuk':'keluar'}">${t.jenis}</span></td>
                <td><span class="tag ${((t.statusBayar || 'Lunas') === 'Belum Bayar') ? 'keluar' : 'masuk'}">${esc(t.statusBayar || 'Lunas')}</span></td>
                <td>${fmtRupiah(t.jumlah)}</td>
                <td class="row-actions"><button class="btn danger small" onclick="deleteKeuangan('${t.id}')">Hapus</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ` : `<div class="empty-state"><strong>Belum ada transaksi</strong>Catat pemasukan atau pengeluaran pertama.</div>`}
      `;
    }

    function openKeuanganForm() {
      openModal(`
        <h3>Catat Transaksi</h3>
        <form id="keuForm">
          <div class="form-grid">
            <div class="field"><label>Tanggal</label><input type="date" name="tanggal" value="${new Date().toISOString().slice(0,10)}"></div>
            <div class="field"><label>Jenis</label>
              <select name="jenis"><option value="Masuk">Pemasukan</option><option value="Keluar">Pengeluaran</option></select>
            </div>
            <div class="field"><label>Nama Warga</label><input name="nama" placeholder="Nama warga / pemegang kas"></div>
            <div class="field"><label>Status Bayar</label>
              <select name="statusBayar">
                <option value="Lunas">Lunas</option>
                <option value="Belum Bayar">Belum Bayar</option>
              </select>
            </div>
            <div class="field"><label>Kategori</label><input name="kategori" placeholder="Iuran warga, kas RT, dll" required></div>
            <div class="field"><label>Jumlah (Rp)</label><input type="number" name="jumlah" min="0" required></div>
          </div>
          <div class="field" style="margin-bottom:16px"><label>Keterangan</label><input name="keterangan" placeholder="Opsional"></div>
          <div class="form-actions">
            <button type="submit" class="btn">Simpan</button>
            <button type="button" class="btn secondary" onclick="closeModal()">Batal</button>
          </div>
        </form>
      `);
      document.getElementById('keuForm').onsubmit = async e => {
        e.preventDefault();
        const f = new FormData(e.target);
        const jumlah = Number(f.get('jumlah'));
        const nama = f.get('nama').trim();
        const statusBayar = f.get('statusBayar') || 'Lunas';
        if (!f.get('kategori').trim() || !jumlah) return;
        DB.keuangan.push({ id: uid(), tanggal: f.get('tanggal'), jenis: f.get('jenis'), kategori: f.get('kategori').trim(), jumlah, keterangan: f.get('keterangan').trim(), statusBayar, nama });
        await save('keuangan');
        closeModal();
        render();
        showToast('Transaksi tersimpan.');
      };
    }

    async function deleteKeuangan(id) {
      if (!confirm('Hapus transaksi ini?')) return;
      DB.keuangan = DB.keuangan.filter(t => t.id !== id);
      await save('keuangan');
      render();
      showToast('Transaksi dihapus.');
    }

    function renderPengumuman() {
      const rows = [...DB.pengumuman].sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
      return `
        <h2 class="section-title">📣 Pengumuman &amp; Kegiatan</h2>
        <p class="section-desc">
          Pengumuman dan kegiatan lingkungan sering menjadi area yang paling sering terlewat jika hanya disampaikan melalui grup chat atau penyampaian lisan. Modul ini berfungsi sebagai papan informasi resmi RT/RW yang dapat digunakan untuk menginformasikan agenda penting, perubahan jadwal, kebutuhan gotong royong, peraturan baru, hingga informasi kegiatan sosial yang diselenggarakan oleh lingkungan. Dengan sistem ini, semua informasi tercatat dan dapat diakses kembali kapan pun tanpa tergantung pada siapa yang melihat chat terakhir.
          <br><br>
          Fungsinya juga tidak terbatas pada pengumuman saja, tetapi juga dapat dipakai untuk mengemas program kegiatan seperti kerja bakti, rapat bulanan, pelatihan keamanan lingkungan, atau jadwal ronda. Karena semua informasi ditampilkan dengan judul, kategori, tanggal, dan isi yang jelas, warga dapat dengan mudah memahami maksud dan pentingnya suatu kegiatan. Ini membuat komunikasi lingkungan menjadi lebih formal, rapi, dan lebih mudah diikuti oleh seluruh masyarakat.
        </p>
        <div class="toolbar">
          <div></div>
          <div class="export-tools">
            <select class="export-select" aria-label="Pilih format unduh">
              <option value="csv">CSV</option>
              <option value="pdf">PDF</option>
              <option value="png">PNG</option>
              <option value="jpg">JPG</option>
            </select>
            <button class="btn secondary" type="button" onclick="triggerExport(this)">↓ Unduh</button>
            <button class="btn" type="button" onclick="openPengumumanForm()">+ Buat Pengumuman</button>
          </div>
        </div>
        ${rows.length? rows.map(p=>`
          <div style="border:1px solid var(--line);border-radius:8px;padding:14px 16px;margin-bottom:12px;">
            <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;">
              <div>
                <span class="tag ${p.kategori==='Kegiatan'?'diproses':'diajukan'}">${esc(p.kategori)}</span>
                <h3 style="font-family:'Source Serif 4',serif;margin:8px 0 4px;font-size:16px;">${esc(p.judul)}</h3>
                <div style="font-size:11.5px;color:var(--ink-soft)">${fmtDate(p.tanggal)}</div>
              </div>
              <div style="display:flex;gap:8px;">
                ${p.noWa ? `<a href="${generateWhatsAppLink(p.noWa, p.judul)}" target="_blank" rel="noopener noreferrer" class="btn secondary small" style="text-decoration:none;display:inline-flex;align-items:center;gap:6px;">💬 WA</a>` : ''}
                <button class="btn danger small" onclick="deletePengumuman('${p.id}')">Hapus</button>
              </div>
            </div>
            <p style="font-size:13.5px;margin:10px 0 0;color:var(--ink)">${esc(p.isi)}</p>
          </div>
        `).join('') : `<div class="empty-state"><strong>Belum ada pengumuman</strong>Buat pengumuman pertama lewat tombol di atas.</div>`}
      `;
    }

    function openPengumumanForm() {
      openModal(`
        <h3>Buat Pengumuman</h3>
        <form id="pengForm">
          <div class="form-grid">
            <div class="field"><label>Judul</label><input required name="judul"></div>
            <div class="field"><label>Kategori</label>
              <select name="kategori"><option>Pengumuman</option><option>Kegiatan</option></select>
            </div>
          </div>
          <div class="field" style="margin:12px 0"><label>Tanggal</label><input type="date" name="tanggal" value="${new Date().toISOString().slice(0,10)}"></div>
          <div class="field" style="margin:12px 0"><label>Nomor WhatsApp (opsional)</label><input type="tel" name="noWa" placeholder="62812345678 atau 62-812-345-678"></div>
          <div class="field" style="margin-bottom:16px"><label>Isi</label><textarea required name="isi" placeholder="Detail pengumuman atau kegiatan"></textarea></div>
          <div class="form-actions">
            <button type="submit" class="btn">Terbitkan</button>
            <button type="button" class="btn secondary" onclick="closeModal()">Batal</button>
          </div>
        </form>
      `);
      document.getElementById('pengForm').onsubmit = async e => {
        e.preventDefault();
        const f = new FormData(e.target);
        if (!f.get('judul').trim() || !f.get('isi').trim()) return;
        DB.pengumuman.push({ id: uid(), judul: f.get('judul').trim(), kategori: f.get('kategori'), tanggal: f.get('tanggal'), isi: f.get('isi').trim(), noWa: f.get('noWa').trim() || '' });
        await save('pengumuman');
        closeModal();
        render();
        showToast('Pengumuman diterbitkan.');
      };
    }

    async function deletePengumuman(id) {
      if (!confirm('Hapus pengumuman ini?')) return;
      DB.pengumuman = DB.pengumuman.filter(p => p.id !== id);
      await save('pengumuman');
      render();
      showToast('Pengumuman dihapus.');
    }

    function generateWhatsAppLink(noWa, judulPengumuman) {
      // Bersihkan nomor (hapus spasi, dash, tanda kurung)
      const cleaned = noWa.replace(/[\s\-()]/g, '');
      // Jika dimulai dengan 0, ganti dengan 62
      const formatted = cleaned.startsWith('0') ? '62' + cleaned.substring(1) : cleaned;
      // Buat pesan dengan judul pengumuman
      const message = `Hai, ada pengumuman terbaru: "${judulPengumuman}"`;
      const encoded = encodeURIComponent(message);
      return `https://wa.me/${formatted}?text=${encoded}`;
    }

    function renderTamu() {
      const rows = [...DB.tamu].sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
      return `
        <h2 class="section-title">🪪 Buku Tamu</h2>
        <p class="section-desc">
          Buku tamu digital adalah catatan resmi mengenai siapa saja yang datang berkunjung ke lingkungan RT/RW, baik untuk tugas tertentu, keperluan administrasi, maupun urusan sosial lainnya. Dalam banyak lingkungan, pencatatan tamu sering dilakukan secara manual dan mudah tidak terdokumentasi dengan baik. Dengan sistem digital, setiap kunjungan dapat dicatat lengkap dengan nama tamu, asal, tanggal kedatangan, dan keperluan atau tujuan kunjungan. Catatan ini sangat penting untuk menjaga keamanan lingkungan dan memudahkan pengurus saat membutuhkan bukti historis terkait kunjungan tertentu.
          <br><br>
          Keunggulan utama dari buku tamu ini adalah kemudahan dalam mencari data berdasarkan tanggal, nama, atau kebutuhan kunjungan. Jika terjadi kejadian tertentu, pengurus bisa memeriksa rekam jejak tamu dalam waktu singkat tanpa harus membuka buku besar atau kertas yang mudah rusak. Dengan pendekatan yang lebih terstruktur, buku tamu menjadi alat pengamanan dan dokumentasi yang lebih profesional bagi lingkungan sekitar.
        </p>
        <div class="toolbar">
          <div></div>
          <div class="export-tools">
            <select class="export-select" aria-label="Pilih format unduh">
              <option value="csv">CSV</option>
              <option value="pdf">PDF</option>
              <option value="png">PNG</option>
              <option value="jpg">JPG</option>
            </select>
            <button class="btn secondary" type="button" onclick="triggerExport(this)">↓ Unduh</button>
            <button class="btn" type="button" onclick="openTamuForm()">+ Catat Tamu</button>
          </div>
        </div>
        ${rows.length? `
        <table class="ledger">
          <thead><tr><th>Tanggal</th><th>Nama Tamu</th><th>Asal</th><th>Tujuan / Keperluan</th><th></th></tr></thead>
          <tbody>
            ${rows.map(t=>`
              <tr>
                <td>${fmtDate(t.tanggal)}</td>
                <td><strong>${esc(t.nama)}</strong></td>
                <td>${esc(t.asal||'—')}</td>
                <td>${esc(t.keperluan||'—')}</td>
                <td class="row-actions"><button class="btn danger small" onclick="deleteTamu('${t.id}')">Hapus</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ` : `<div class="empty-state"><strong>Belum ada catatan tamu</strong>Catat kunjungan tamu pertama.</div>`}
      `;
    }

    function openTamuForm() {
      openModal(`
        <h3>Catat Tamu</h3>
        <form id="tamuForm">
          <div class="form-grid">
            <div class="field"><label>Nama Tamu</label><input required name="nama"></div>
            <div class="field"><label>Tanggal</label><input type="date" name="tanggal" value="${new Date().toISOString().slice(0,10)}"></div>
          </div>
          <div class="field" style="margin:12px 0"><label>Asal</label><input name="asal" placeholder="Alamat / kota asal"></div>
          <div class="field" style="margin-bottom:16px"><label>Tujuan / Keperluan</label><input name="keperluan"></div>
          <div class="form-actions">
            <button type="submit" class="btn">Simpan</button>
            <button type="button" class="btn secondary" onclick="closeModal()">Batal</button>
          </div>
        </form>
      `);
      document.getElementById('tamuForm').onsubmit = async e => {
        e.preventDefault();
        const f = new FormData(e.target);
        if (!f.get('nama').trim()) return;
        DB.tamu.push({ id: uid(), nama: f.get('nama').trim(), tanggal: f.get('tanggal'), asal: f.get('asal').trim(), keperluan: f.get('keperluan').trim() });
        await save('tamu');
        closeModal();
        render();
        showToast('Data tamu tersimpan.');
      };
    }

    async function deleteTamu(id) {
      if (!confirm('Hapus catatan tamu ini?')) return;
      DB.tamu = DB.tamu.filter(t => t.id !== id);
      await save('tamu');
      render();
      showToast('Catatan tamu dihapus.');
    }

    (async function init() {
      document.getElementById('todayDate').textContent = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      await loadAll();
      render();
    })();
