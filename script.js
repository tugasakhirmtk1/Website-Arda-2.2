// ======== FUNGSI PENYEDERHANAAN SOP MINIMAL ========
function simplifyToSOP(vars, table) {
    const minterms = [];
    const dontCares = [];

    // Ambil minterm dan don't care
    for (let i = 0; i < table.length; i++) {
        let bits = "";
        for (let j = 0; j < vars.length; j++) {
            bits += table[i][vars[j]] ? "1" : "0";
        }
        if (table[i].Y === 1) minterms.push(parseInt(bits, 2));
        else if (table[i].Y === "d") dontCares.push(parseInt(bits, 2));
    }

    if (minterms.length === 0) return "0";
    if (minterms.length === (1 << vars.length)) return "1";

    const allTerms = [...minterms, ...dontCares];

    // ======= Fungsi bantu =======
    const countOnes = n => n.toString(2).replace(/0/g, "").length;
    const canCombine = (a, b) => {
        const diff = a
            .toString(2)
            .padStart(vars.length, "0")
            .split("")
            .map((bit, i) => bit !== b.toString(2).padStart(vars.length, "0")[i])
            .filter(Boolean).length;
        return diff === 1;
    };
    const combineBits = (a, b) => {
        const binA = a.toString(2).padStart(vars.length, "0");
        const binB = b.toString(2).padStart(vars.length, "0");
        return binA
            .split("")
            .map((bit, i) => (bit === binB[i] ? bit : "-"))
            .join("");
    };
    const coversMinterms = (pattern, minterms) => {
        const res = [];
        for (const m of minterms) {
            const bits = m.toString(2).padStart(vars.length, "0");
            let match = true;
            for (let i = 0; i < bits.length; i++) {
                if (pattern[i] !== "-" && pattern[i] !== bits[i]) {
                    match = false;
                    break;
                }
            }
            if (match) res.push(m);
        }
        return res;
    };

    // ======= Iterasi Quine–McCluskey =======
    let groups = {};
    for (const t of allTerms) {
        const ones = countOnes(t);
        if (!groups[ones]) groups[ones] = [];
        groups[ones].push(t);
    }

    let primeImplicants = [];
    let combinedAnything;

    do {
        const newGroups = {};
        const used = new Set();
        combinedAnything = false;
        const keys = Object.keys(groups).map(Number).sort((a,b)=>a-b);

        for (let i = 0; i < keys.length -1; i++) {
            const groupA = groups[keys[i]] || [];
            const groupB = groups[keys[i+1]] || [];
            for (const a of groupA) {
                for (const b of groupB) {
                    if (canCombine(a,b)) {
                        combinedAnything = true;
                        const comb = combineBits(a,b);
                        if (!newGroups[keys[i]]) newGroups[keys[i]] = [];
                        if (!newGroups[keys[i]].includes(comb)) newGroups[keys[i]].push(comb);
                        used.add(a);
                        used.add(b);
                    }
                }
            }
        }

        // Tambahkan yang tidak bisa digabung ke PI
        Object.values(groups).flat().forEach(x=>{
            if (!used.has(x)) primeImplicants.push(
                typeof x === "string" ? x : x.toString(2).padStart(vars.length,"0")
            );
        });

        // Update groups
        groups = {};
        Object.values(newGroups).flat().forEach(c=>{
            const ones = c.replace(/-/g,"").replace(/0/g,"").length;
            if (!groups[ones]) groups[ones]=[];
            if (!groups[ones].includes(c)) groups[ones].push(c);
        });

    } while(combinedAnything);

    // Tambahkan remaining group patterns
    Object.values(groups).flat().forEach(x=>{
        primeImplicants.push(x);
    });

    // ======= Cari Essential PI =======
    const piTable = {};
    for (const pi of primeImplicants) {
        piTable[pi] = coversMinterms(pi,minterms);
    }

    const covered = new Set();
    const essentialPIs = [];

    while(covered.size < minterms.length) {
        let bestPI = null;
        let bestCover = [];
        for (const [pi, mts] of Object.entries(piTable)) {
            const uncovered = mts.filter(m => !covered.has(m));
            if (uncovered.length > bestCover.length) {
                bestCover = uncovered;
                bestPI = pi;
            }
        }
        if (!bestPI) break;
        essentialPIs.push(bestPI);
        bestCover.forEach(m=>covered.add(m));
    }

    // ======= Konversi ke ekspresi =======
    const toExpr = pattern=>{
        let term = "";
        for(let i=0;i<pattern.length;i++){
            if(pattern[i]==="1") term += vars[i];
            else if(pattern[i]==="0") term += vars[i]+"'";
        }
        return term;
    };

    return essentialPIs.map(toExpr).join(" + ") || "0";
}



    // ===== FUNGSI PENYEDERHANAAN POS =====
    function simplifyToPOS(vars, table) {
        const terms = [];
        for (let i = 0; i < table.length; i++) {
            if (table[i].Y === 0) { // gunakan baris Y=0
                const termParts = [];
                for (let j = 0; j < vars.length; j++) {
                    termParts.push(table[i][vars[j]] ? vars[j] + "'" : vars[j]); // negasi lawan SOP
                }
                terms.push("(" + termParts.join(" + ") + ")");
            }
        }
        return terms.length ? terms.join(" * ") : "1";
    }

    const btnSOP = document.getElementById("btn-sop");
    const btnPOS = document.getElementById("btn-pos");

    btnSOP.addEventListener("click", () => {
    // aktifkan tombol SOP
    btnSOP.classList.add("active");
    btnPOS.classList.remove("active");

    // logika SOP kamu bisa tetap di sini
    console.log("Mode: SOP aktif");
    });

    btnPOS.addEventListener("click", () => {
    // aktifkan tombol POS
    btnPOS.classList.add("active");
    btnSOP.classList.remove("active");

    // logika POS kamu bisa tetap di sini
    console.log("Mode: POS aktif");
    });


btnSOP.addEventListener("click", () => {
    const expr = document.querySelector("#expr").value.trim();
    if (!expr) return;
    try {
        const tokens = tokenize(expr);
        const vars = getVars(tokens);
        const rpn = toRPN(tokens);
        const table = makeTable(vars, rpn);
        const sop = simplifyToSOP(vars, table);
        document.getElementById("out-simplified").textContent = sop;
    } catch (e) {
        console.error(e);
    }
});

    btnPOS.addEventListener("click", () => {
        const expr = document.querySelector("#expr").value.trim();
        if (!expr) return;
        try {
            const tokens = tokenize(expr);
            const vars = getVars(tokens);
            const rpn = toRPN(tokens);
            const table = makeTable(vars, rpn);
            const pos = simplifyToPOS(vars, table);
            document.getElementById("out-simplified").textContent = pos;
        } catch (e) {
            console.error(e);
        }
    });

        // === TOGGLE THEME (DARK / LIGHT) ===
    const toggle = document.getElementById("themeToggle");
    if (toggle) {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") document.documentElement.classList.add("light");


  // Update teks tombol sesuai tema awal
  toggle.textContent = document.documentElement.classList.contains("light")
    ? "🌙 Mode Gelap"
    : "☀️ Mode Terang";

  // Saat diklik, ubah tema
  toggle.addEventListener("click", () => {
    document.documentElement.classList.toggle("light");
    const newTheme = document.documentElement.classList.contains("light") ? "light" : "dark";
    localStorage.setItem("theme", newTheme);

    // Simpan preferensi
    localStorage.setItem("theme", isLight ? "light" : "dark");

    // Ubah label tombol
    toggle.textContent = isLight ? "🌙 Mode Gelap" : "☀️ Mode Terang";
  });
}

        // === BENCHMARK QUINE-MCCLUSKEY (versi nyata, 2–4 variabel) ===
        document.getElementById("btn-benchmark")?.addEventListener("click", () => {
        const resultDiv = document.getElementById("bench-result");
        resultDiv.textContent = "⏳ Menjalankan benchmark...";

        // Fungsi pembuat minterm acak
        function randomMinterms(nVars, count) {
            const max = 2 ** nVars;
            const set = new Set();
            while (set.size < count) {
            set.add(Math.floor(Math.random() * max));
            }
            return Array.from(set);
        }

        // Fungsi pembuat tabel kebenaran dari minterm
        function makeTableFromMinterms(vars, minterms) {
            const table = [];
            for (let i = 0; i < (1 << vars.length); i++) {
            const row = {};
            for (let j = 0; j < vars.length; j++) {
                row[vars[j]] = (i >> ((vars.length - 1) - j)) & 1;
            }
            row.Y = minterms.includes(i) ? 1 : 0;
            table.push(row);
            }
            return table;
        }

        const data = [];

        // Jalankan benchmark untuk 2–4 variabel
        for (let varsCount = 2; varsCount <= 4; varsCount++) {
            const vars = ["A", "B", "C", "D"].slice(0, varsCount);
            const minterms = randomMinterms(varsCount, Math.min(2 ** varsCount / 2, 10));
            const table = makeTableFromMinterms(vars, minterms);

        // Hitung waktu eksekusi algoritma Quine–McCluskey sebenarnya
        const ITER = 1000; // ulangi 1000x agar waktu terukur
        const start = performance.now();
        for (let i = 0; i < ITER; i++) simplifyToSOP(vars, table);
        const end = performance.now();

        const avg = (end - start) / ITER;
        data.push({
        vars: varsCount,
        time: avg.toFixed(3),
        count: minterms.length,
        });

        }

        // Tampilkan hasil
        let output = "📊 Hasil Benchmark (Algoritma Quine–McCluskey)\n\n";
        for (const row of data) {
            const bar = "▇".repeat(Math.max(1, Math.round(row.time / 2)));
            const label = `${row.vars} variabel`.padEnd(12, " ");
            const time = `${row.time} ms`.padStart(8, " ");
            output += `${label}: ${bar} ${time} (minterm: ${row.count})\n`;
        }

        resultDiv.textContent = output;
        });

        // ===== JS BARU UNTUK RESET HASIL BENCHMARK =====
        document.getElementById("btn-benchmark-reset")?.addEventListener("click", () => {
        const resultDiv = document.getElementById("bench-result");
        resultDiv.textContent = ""; // bersihkan hasil benchmark
        });

        // ===== UPDATE K-MAP OTOMATIS DARI EKSPRESI =====
        function updateKmapFromExpr(expr) {
        if (!expr) return;

        try {
            // Tokenize dan ambil variabel
            const tokens = tokenize(expr);
            const varsUsed = getVars(tokens).slice(0, 4); // maksimal 4 variabel
            const rpn = toRPN(tokens);
            const table = makeTable(varsUsed, rpn);

            // Ambil minterm dari tabel kebenaran
            minterms = [];
            dontCares = [];
            for (let i = 0; i < table.length; i++) {
                if (table[i].Y === 1) minterms.push(i);
            }

            // Update variabel K-Map sesuai yang digunakan
            variables = ["A", "B", "C", "D"].slice(0, varsUsed.length);

            // Render K-Map dan highlight sel
            renderKmap();
            highlightKmapCells();

        } catch (e) {
            console.error("Kesalahan saat update K-Map:", e.message);
        }
    }


        // ===== HUBUNGKAN DENGAN DROPDOWN CONTOH =====
        const scenarioSelect = document.querySelector("#scenario-select");
        if (scenarioSelect) {
            scenarioSelect.addEventListener("change", (e) => {
                const expr = e.target.value;
                if (expr) {
                    document.querySelector("#expr").value = expr;
                    document.querySelector("#validation").textContent = `💡 Contoh dimuat: ${expr}`;
                    updateKmapFromExpr(expr);
                }
            });
    }

        // === TOKENIZER (versi final — mendukung A'B', (A+B')C, dll) ===
        function tokenize(expr) {
        expr = expr.replace(/\s+/g, "");
        if (!expr.length) throw new Error("Ekspresi kosong!");

        const tokens = [];
        const validVars = /[A-Z]/i;
        let lastType = null;

        for (let i = 0; i < expr.length; i++) {
            const c = expr[i];

            // Variabel
            if (validVars.test(c)) {
            if (lastType === "VAR" || lastType === "PAR_CLOSE" || lastType === "NOT") {
                // Tambahkan AND implisit
                tokens.push({ t: "OP", v: "AND" });
            }
            tokens.push({ t: "VAR", v: c });
            lastType = "VAR";
            continue;
            }

            // NOT
            if (c === "'" || c === "~") {
            if (lastType === "OP" && tokens[tokens.length - 1].v !== "NOT" && tokens[tokens.length - 1].v !== "(")
                throw new Error(`Operator berurutan tanpa operand di posisi ${i}: '${c}'`);
            tokens.push({ t: "OP", v: "NOT" });
            lastType = "NOT"; // biar bisa tangkap pola A'B
            continue;
            }

            // AND
            if (c === "*" || c === "&") {
            if (lastType !== "VAR" && lastType !== "PAR_CLOSE")
                throw new Error(`Operator AND tanpa operand sebelum/ sesudah di posisi ${i}.`);
            tokens.push({ t: "OP", v: "AND" });
            lastType = "OP";
            continue;
            }

            // OR
            if (c === "+" || c === "|") {
            if (lastType !== "VAR" && lastType !== "PAR_CLOSE" && lastType !== "NOT")
                throw new Error(`Operator OR tanpa operand sebelum/ sesudah di posisi ${i}.`);
            tokens.push({ t: "OP", v: "OR" });
            lastType = "OP";
            continue;
            }


            // XOR
            if (c === "^") {
            if (lastType !== "VAR" && lastType !== "PAR_CLOSE")
                throw new Error(`Operator XOR tanpa operand sebelum/ sesudah di posisi ${i}.`);
            tokens.push({ t: "OP", v: "XOR" });
            lastType = "OP";
            continue;
            }

            // Kurung buka
            if (c === "(") {
            if (lastType === "VAR" || lastType === "PAR_CLOSE" || lastType === "NOT") {
                // AND implisit sebelum kurung
                tokens.push({ t: "OP", v: "AND" });
            }
            tokens.push({ t: "PAR", v: "(" });
            lastType = "PAR_OPEN";
            continue;
            }

            // Kurung tutup
            if (c === ")") {
            if (lastType === "OP" || lastType === "PAR_OPEN")
                throw new Error(`Ekspresi kosong atau operator di dalam kurung di posisi ${i}.`);
            tokens.push({ t: "PAR", v: ")" });
            lastType = "PAR_CLOSE";
            continue;
            }

            throw new Error(`Karakter tidak dikenal: '${c}' di posisi ${i}.`);
        }

        // Tidak boleh diakhiri dengan operator
        if (lastType === "OP" || lastType === "PAR_OPEN")
            throw new Error("Ekspresi diakhiri dengan operator atau kurung buka tanpa penutup.");

        return tokens;
        }

        // === KONVERSI KE RPN (dengan deteksi kurung tidak seimbang) ===
        function toRPN(tokens) {
        const prec = { NOT: 3, AND: 2, OR: 1, XOR: 1 };
        const out = [], stack = [];
        let balance = 0;

        for (let i = 0; i < tokens.length; i++) {
            const t = tokens[i];

            if (t.t === "VAR") {
            out.push(t);
            }

            else if (t.t === "OP") {
            if (t.v === "NOT") {
                stack.push(t);
            } else {
                while (stack.length && stack[stack.length - 1].t === "OP" &&
                prec[stack[stack.length - 1].v] >= prec[t.v]) {
                out.push(stack.pop());
                }
                stack.push(t);
            }
            }

            else if (t.t === "PAR") {
            if (t.v === "(") {
                stack.push(t);
                balance++;
            } else {
                balance--;
                if (balance < 0) throw new Error("Kurung tutup berlebih atau tidak seimbang.");
                while (stack.length && stack[stack.length - 1].v !== "(") {
                out.push(stack.pop());
                }
                if (!stack.length) throw new Error("Kurung buka tidak ditemukan.");
                stack.pop();
            }
            }
        }

        if (balance !== 0) throw new Error("Kurung buka dan tutup tidak seimbang.");
        while (stack.length) out.push(stack.pop());
        return out;
        }

        // === EVALUASI RPN ===
        function evalRPN(rpn, vars) {
        const st = [];
        for (const t of rpn) {
            if (t.t === "VAR") st.push(vars[t.v] || 0);
            else if (t.t === "OP") {
            if (t.v === 'NOT') {
                const a = st.pop();
                st.push(!a);
            } else {
                const b = st.pop(), a = st.pop();
                if (t.v === 'AND') st.push(a && b);
                else if (t.v === 'OR') st.push(a || b);
                else if (t.v === 'XOR') st.push(Boolean(a) !== Boolean(b));
            }
            }
        }
        return st.pop() ? 1 : 0;
        }

        // === MENDAPATKAN VARIABEL ===
        function getVars(tokens) {
        return [...new Set(tokens.filter(t => t.t === "VAR").map(t => t.v))];
        }

        function makeTable(vars, rpn) {
        const n = vars.length, rows = [];
        for (let i = 0; i < (1 << n); i++) {         // 🔹 Loop semua kombinasi 0/1
            const combo = {};
            for (let j = 0; j < n; j++) {
            combo[vars[j]] = (i >> ((n - 1) - j)) & 1; // 🔹 Tentukan nilai A,B,C,...
            }
            const Y = evalRPN(rpn, combo);             // 🔹 Hitung hasil ekspresi Boolean
            rows.push({ ...combo, Y });                // 🔹 Simpan ke tabel
        }
        return rows;                                 // 🔹 Kembalikan hasil tabel
    }


    document.querySelector("#btn-eval").onclick = () => {
    const expr = document.querySelector("#expr").value.trim();
    if (!expr) return;

    try {
        const tokens = tokenize(expr);
        const vars = getVars(tokens);
        const rpn = toRPN(tokens);
        const table = makeTable(vars, rpn);

        // Tampilkan tabel kebenaran
        let html = `<table><tr>${vars.map(v => `<th>${v}</th>`).join("")}<th>Y</th></tr>`;
        for (const row of table) {
        html += `<tr>${vars.map(v => `<td>${row[v]}</td>`).join("")}<td>${row.Y}</td></tr>`;
        }
        html += `</table>`;
        document.querySelector("#ttarea").innerHTML = html;

        // Update info hasil
        document.querySelector("#validation").innerHTML = "✅ Evaluasi berhasil tanpa error.";
        document.querySelector("#vars-pill").textContent = "Variabel: " + (vars.length ? vars.join(", ") : "—");

        const minterms = [];
        for (let i = 0; i < table.length; i++) if (table[i].Y === 1) minterms.push(i);
        document.querySelector("#minterms-pill").textContent = "Minterm: " + (minterms.length ? minterms.join(",") : "—");

        const simplified = simplifyToSOP(vars, table);
        document.querySelector("#simp-pill").innerHTML = "Sederhana: " + simplified;

        // 🔹 Tambahkan ini supaya K-Map update sesuai ekspresi
        updateKmapFromExpr(expr);

    } catch (e) {
        document.querySelector("#validation").innerHTML = `<span style="color:#f87171;font-weight:600;">❌ Kesalahan:</span> ${e.message}`;
        document.querySelector("#ttarea").innerHTML = "<div class='muted caption'>Siap — masukkan ekspresi dan klik Evaluasi.</div>";
        document.querySelector("#vars-pill").textContent = "Variabel: —";
        document.querySelector("#minterms-pill").textContent = "Minterm: —";
        document.querySelector("#simp-pill").textContent = "Sederhana: —";
    }
    };

    // ======== EKSPOR SIAP CETAK (HANYA K-MAP) ========
document.getElementById("exportPrintBtn")?.addEventListener("click", async () => {
  const kmapArea = document.getElementById("kmapWrap");
  if (!kmapArea) {
    alert("K-Map belum tersedia untuk diekspor.");
    return;
  }

  try {
    const canvas = await html2canvas(kmapArea, {
      backgroundColor: "#ffffff",
      scale: 2,
    });
    const imageData = canvas.toDataURL("image/png");

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>K-Map Siap Cetak</title>
          <style>
            body {
              background: #fff;
              text-align: center;
              margin: 0;
              padding: 20px;
            }
            img {
              max-width: 95%;
              border: 1px solid #ccc;
              border-radius: 8px;
            }
            @media print {
              img {
                border: none;
                box-shadow: none;
              }
              body {
                margin: 0;
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <img src="${imageData}" alt="K-Map Screenshot" />
          <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  } catch (err) {
    console.error("Gagal mengekspor:", err);
    alert("Terjadi kesalahan saat membuat tampilan siap cetak.");
  }
});

// ======== EKSPOR GAMBAR TANPA html2canvas ========
// Fungsi untuk mengekspor elemen K-Map ke gambar PNG menggunakan Canvas API
document.getElementById("exportImgBtn").addEventListener("click", () => {
  const kmapEl = document.getElementById("kmapWrap");
  const svgData = new XMLSerializer().serializeToString(kmapEl);

  // Cek apakah K-Map berbentuk SVG (ideal)
  if (kmapEl.querySelector("svg")) {
    const svg = kmapEl.querySelector("svg");
    const svgString = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const img = new Image();
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      // Buat link download
      const a = document.createElement("a");
      a.download = "kmap.png";
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = url;
  } else {
    // Jika bukan SVG (misal: tabel biasa)
    const rect = kmapEl.getBoundingClientRect();
    const canvas = document.createElement("canvas");
    canvas.width = rect.width;
    canvas.height = rect.height;
    const ctx = canvas.getContext("2d");

    // Gaya dasar
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue("--bg") || "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#333";
    ctx.font = "14px Inter, sans-serif";
    ctx.textBaseline = "top";
    ctx.fillText("Tampilan K-Map (snapshot teks)", 10, 10);

    const a = document.createElement("a");
    a.download = "kmap.png";
    a.href = canvas.toDataURL("image/png");
    a.click();
  }

  document.getElementById("validation").textContent =
    "📸 Gambar K-Map berhasil diekspor (tanpa html2canvas).";
});


    // === Highlight otomatis pada K-Map ===
    function highlightKmapCells() {
    const kmapWrap = document.querySelector("#kmapWrap");
    if (!kmapWrap) return;
    const cells = kmapWrap.querySelectorAll("div, span, .cell");

    if (!cells.length) return;

    cells.forEach((cell) => {
        const val = cell.textContent.trim();
        if (val === "1") {
        cell.style.background = "linear-gradient(135deg, #00b4d8, #48cae4)";
        cell.style.color = "#fff";
        cell.style.fontWeight = "bold";
        cell.style.boxShadow = "0 0 10px rgba(72, 202, 228, 0.6)";
        cell.style.borderRadius = "8px";
        cell.style.transition = "all 0.3s ease";
        } else if (val.toLowerCase() === "d") {
        cell.style.background = "linear-gradient(135deg, #ffd166, #f6bd60)";
        cell.style.color = "#000";
        cell.style.fontWeight = "bold";
        cell.style.borderRadius = "8px";
        } else {
        cell.style.background = "#111";
        cell.style.color = "#ccc";
        cell.style.fontWeight = "normal";
        cell.style.boxShadow = "none";
        }
    });
    }

        // Fungsi untuk menunggu K-Map siap baru di-highlight
        function delayedHighlight() {
        setTimeout(() => {
            highlightKmapCells();
        }, 400); // beri jeda sedikit supaya K-Map sudah dirender
        }

        // Jalankan setelah tombol "Evaluasi", "Impor", atau "Sederhanakan" ditekan
        ["#btn-eval", "#btn-import", "#btn-simplify"].forEach((selector) => {
        const btn = document.querySelector(selector);
        if (btn) {
            btn.addEventListener("click", delayedHighlight);
        }
        });

        // Opsional: highlight real-time saat mengetik ekspresi
        const exprInput = document.querySelector("#expr");
        const evalBtn = document.querySelector("#btn-eval");
        if (exprInput && evalBtn) {
        // Listener yang sudah ada untuk evaluasi tabel kebenaran
        exprInput.addEventListener("input", () => {
        const expr = exprInput.value.trim();
        if (expr) updateKmapFromExpr(expr);
    });

        // Tambahkan ini agar K-Map juga update otomatis
        exprInput.addEventListener("input", (e) => {
            const expr = e.target.value.trim();
            if (expr) updateKmapFromExpr(expr);
        });
    }

    // === TOMBOL BERSIHKAN ===
    document.querySelector("#btn-clear").onclick = () => {
    document.querySelector("#expr").value = "";
    document.querySelector("#ttarea").innerHTML = "<div class='muted caption'>Siap — masukkan ekspresi dan klik Evaluasi.</div>";
    document.querySelector("#validation").textContent = "Siap — masukkan ekspresi dan klik Evaluasi.";
    document.querySelector("#vars-pill").textContent = "Variabel: —";
    document.querySelector("#minterms-pill").textContent = "Minterm: —";
    document.querySelector("#simp-pill").textContent = "Sederhana: —";
        };

    document.getElementById("exportImgBtn").addEventListener("click", () => {
    const target = document.getElementById("kmapWrap");
    html2canvas(target, {
        backgroundColor: "#0b1220",
        scale: 2
    }).then(canvas => {
        const a = document.createElement("a");
        a.href = canvas.toDataURL("image/png");
        a.download = "kmap_export.png";
        a.click();
    });
    });

        // === BAGIAN K-MAP ===
        const inputMinterm = document.getElementById("minterm-io");
        const btnImport = document.getElementById("btn-import");
        const btnExport = document.getElementById("btn-export");
        const btnSimplify = document.getElementById("btn-simplify");
        const btnReset = document.getElementById("btn-reset");
        const outSimplified = document.getElementById("out-simplified");
        const kvars = document.getElementById("kvars");
        const kmapWrap = document.getElementById("kmapWrap");

        let minterms = [];
        let dontCares = [];
        let variables = ["A", "B", "C", "D"];

        function renderKmap() {
    const varCount = variables.length;
    kvars.textContent = variables.join(", ");

    let rows = 2, cols = 2;
    if (varCount === 2) { rows = 2; cols = 2; }
    else if (varCount === 3) { rows = 2; cols = 4; }
    else if (varCount === 4) { rows = 4; cols = 4; }

    const gray = (n) => {
        if (n === 2) return [0, 1];
        if (n === 4) return [0, 1, 3, 2];
        if (n === 8) return [0, 1, 3, 2, 4, 5, 7, 6];
        return [];
    };
    const rowGray = gray(rows);
    const colGray = gray(cols);

    let html = `<table class="kmap-horizontal"><tbody>`;
    for (let r = 0; r < rows; r++) {
        html += "<tr>";
        for (let c = 0; c < cols; c++) {
            const idx = (rowGray[r] << Math.log2(cols)) | colGray[c]; // gunakan Gray code
            let cls = "kmap-cell";
            let val = "0";
            if (minterms.includes(idx)) { cls += " on"; val = "1"; }
            else if (dontCares.includes(idx)) { cls += " dc"; val = "d"; }
            html += `<td class="${cls}" data-idx="${idx}">${val}</td>`;
        }
        html += "</tr>";
    }
    html += "</tbody></table>";
    kmapWrap.innerHTML = html;

    // Pasang listener klik
    document.querySelectorAll(".kmap-cell").forEach(cell => {
        cell.addEventListener("click", () => {
            const idx = parseInt(cell.dataset.idx);
            if (minterms.includes(idx)) {
                minterms = minterms.filter(x => x !== idx);
                dontCares.push(idx);
            } else if (dontCares.includes(idx)) {
                dontCares = dontCares.filter(x => x !== idx);
            } else {
                minterms.push(idx);
            }
            renderKmap();
            simplifyKmap();
            highlightKmapCells();
        });
    });
}

        function simplifyKmap() {
        const varCount = variables.length; // otomatis sesuai variabel ekspresi
        const varsUsed = variables.slice(0, varCount);
        const table = [];
        for (let i = 0; i < (1 << varCount); i++) {
            const combo = {};
            for (let j = 0; j < varCount; j++) {
                combo[varsUsed[j]] = (i >> ((varCount - 1) - j)) & 1;
            }
            combo.Y = minterms.includes(i) ? 1 : 0;
            table.push(combo);
        }
        const simplified = simplifyToSOP(varsUsed, table);
        outSimplified.textContent = simplified;
    }

    function resetKmap() {
    console.log("🔄 Reset K-Map dijalankan");
    minterms = [];
    dontCares = [];
    inputMinterm.value = "";
    outSimplified.textContent = "—";
    kmapWrap.innerHTML = "K-Map akan muncul di sini.";
    }

        btnImport.addEventListener("click", () => {
        const val = inputMinterm.value.trim();
        if (!val) return;

        const tokens = val.split(",").map(v => v.trim());

        // Pisahkan minterms dan don't care
        minterms = tokens.filter(v => !v.startsWith("d")).map(v => parseInt(v));
        dontCares = tokens.filter(v => v.startsWith("d")).map(v => parseInt(v.substring(1)));

        // Tentukan variabel minimal agar semua minterm/dc muat
        const maxIndex = Math.max(...minterms.concat(dontCares));
        let neededVars = 1;
        while ((1 << neededVars) <= maxIndex) neededVars++;
        variables = ["A", "B", "C", "D", "E", "F"].slice(0, neededVars); // tambahan variabel jika perlu

        renderKmap();
    });

    document.addEventListener("DOMContentLoaded", () => {
    const btnReset = document.getElementById("btn-reset");
    if (btnReset) {
        btnReset.addEventListener("click", () => {
        console.log("🔄 Reset K-Map dijalankan");
        minterms = [];
        dontCares = [];
        inputMinterm.value = "";
        outSimplified.textContent = "—";
        kmapWrap.innerHTML = "K-Map akan muncul di sini.";
        });
    } else {
        console.error("❌ Tombol reset tidak ditemukan di DOM!");
    }
    });

        btnExport.addEventListener("click", () => {
        const dPart = dontCares.length ? ",d" + dontCares.join(",d") : "";
        inputMinterm.value = minterms.join(",") + dPart;
        });

        btnSimplify.addEventListener("click", simplifyKmap);
        btnReset.addEventListener("click", resetKmap);

        // Render awal
        renderKmap();   
