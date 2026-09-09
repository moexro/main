/* ---------- Tab switching ---------- */
const tabs = document.querySelectorAll(".tab");
const panels = document.querySelectorAll(".tab-panel");
let triggerWeatherInit = null; // wird von der Wetter-IIFE weiter unten gesetzt

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const target = tab.dataset.target;

    tabs.forEach((t) => {
      t.classList.toggle("active", t === tab);
      t.setAttribute("aria-selected", t === tab ? "true" : "false");
    });

    panels.forEach((p) => {
      p.hidden = p.id !== `panel-${target}`;
    });

    if (target === "wetter" && triggerWeatherInit) triggerWeatherInit();
  });
});

/* ---------- Tab-Buttons auf gleiche Breite bringen ---------- */
function equalizeTabWidths() {
  tabs.forEach((t) => {
    t.style.width = "auto";
  });
  let max = 0;
  tabs.forEach((t) => {
    max = Math.max(max, t.offsetWidth);
  });
  tabs.forEach((t) => {
    t.style.width = max + "px";
  });
}
equalizeTabWidths();
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(equalizeTabWidths); // nach Font-Ladung erneut messen, für exakte Breite
}

/* ---------- Checklisten-Speicher (gemeinsam genutzt) ----------
         Ein flaches Objekt {id: true/false} im localStorage. Fällt still
         auf ein In-Memory-Objekt zurück, falls localStorage nicht
         verfügbar ist (z. B. privater Modus). */
const CHECKLIST_STORAGE_KEY = "kwe-checklists-v1";
let checklistMemoryFallback = {};

function loadChecklistState() {
  try {
    const raw = localStorage.getItem(CHECKLIST_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    return checklistMemoryFallback;
  }
}

function saveChecklistState(state) {
  try {
    localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    checklistMemoryFallback = state;
  }
}

function setChecklistItem(id, value) {
  const state = loadChecklistState();
  state[id] = value;
  saveChecklistState(state);
}

function applyCheckItemVisual(el, on) {
  el.classList.toggle("on", on);
  el.classList.toggle("off", !on);
  const icon = el.querySelector(".icon");
  if (icon) icon.textContent = on ? "✓" : "–";
}

/* ---------- Aufmachen / Zumachen: anklickbare Check-Items ---------- */
(function () {
  const state = loadChecklistState();

  document.querySelectorAll(".check-item.toggleable[data-id]").forEach((el) => {
    const id = el.dataset.id;
    applyCheckItemVisual(el, !!state[id]);

    el.addEventListener("click", () => {
      const nowOn = !el.classList.contains("on");
      applyCheckItemVisual(el, nowOn);
      setChecklistItem(id, nowOn);
    });
  });

  document.querySelectorAll("[data-reset-checklist]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!confirm("Diese Checkliste wirklich zurücksetzen?")) return;
      const panel = document.getElementById(btn.dataset.resetChecklist);
      const state = loadChecklistState();
      panel
        .querySelectorAll(".check-item.toggleable[data-id]")
        .forEach((el) => {
          applyCheckItemVisual(el, false);
          state[el.dataset.id] = false;
        });
      saveChecklistState(state);
    });
  });
})();

/* ---------- KiGeb Paket 3 (Wipfelstürmer): Ablauf-Checkliste im Overlay ----------
         Eigener, kleiner Baustein – wird über den Button aufgerufen, den
         render() weiter unten nur für dieses eine Paket einblendet. */
const PAKET3_CHECKLIST = [
  { group: "Vorbereitung", items: ["Tisch reservieren"] },
  {
    group: "Ankunft & Begrüßung",
    items: [
      'Begrüßung durch betreuenden Trainer & Vorstellung ("Ich begleite euch heute")',
      "Gruppe zum Tisch bringen",
      "Ablauf des Geburtstags erklären",
    ],
  },
  {
    group: "Organisatorisches klären",
    items: [
      "Wer klettert? (Teilnehmer checken)",
      "Einverständniserklärungen einsammeln",
      "Gruppenliste ausfüllen, falls nicht alle Einverständniserklärungen vorliegen",
      "Bezahlung: Eine Person geht mit zur Kasse",
      "Währenddessen: Kinder zum WC schicken",
      "Gemeinsame Pause geplant? (Falls ja, wann?)",
    ],
  },
  {
    group: "Vorbereitung",
    items: [
      "Namensschilder schreiben (Trainer schreibt, Kinder kleben selbst)",
      "Handschuhe verteilen (separate Kiste)",
      "Gurte anziehen",
    ],
  },
  {
    group: "Einweisung & Start",
    items: [
      "Exklusive Einweisung für die Geburtstagsgruppe",
      "Übungsparcours mit exklusiver Betreuung",
      "Freies Klettern starten",
    ],
  },
  {
    group: "Während des Kletterns",
    items: ["Gemeinsame Pause / Freigetränke ausgeben (Auswahl anhand Liste)"],
  },
  {
    group: "Abschluss",
    items: [
      "Gurte abgeben",
      "Urkunden verteilen",
      "Geburtstagskind erhält einen Gutschein",
      "Hinweis Rezension",
    ],
  },
];

const paket3ModalOverlay = document.getElementById("paket3ModalOverlay");
const paket3ModalBody = document.getElementById("paket3ModalBody");

function renderPaket3Modal() {
  const state = loadChecklistState();
  let i = 0;
  paket3ModalBody.innerHTML = PAKET3_CHECKLIST.map((section) => {
    const rows = section.items
      .map((label) => {
        const id = `paket3-${i++}`;
        const on = !!state[id];
        return `
          <div class="check-item toggleable ${on ? "on" : "off"} self-check" data-id="${id}">
            <span class="icon">${on ? "✓" : "–"}</span>
            <span>${label}</span>
          </div>
        `;
      })
      .join("");
    return `<div class="group-label">${section.group}</div><div class="checklist">${rows}</div>`;
  }).join("");

  paket3ModalBody
    .querySelectorAll(".check-item.toggleable[data-id]")
    .forEach((el) => {
      el.addEventListener("click", () => {
        const nowOn = !el.classList.contains("on");
        applyCheckItemVisual(el, nowOn);
        setChecklistItem(el.dataset.id, nowOn);
      });
    });
}

function openPaket3Modal() {
  renderPaket3Modal();
  paket3ModalOverlay.classList.add("open");
}

function closePaket3Modal() {
  paket3ModalOverlay.classList.remove("open");
}

document
  .getElementById("paket3ModalClose")
  .addEventListener("click", closePaket3Modal);
paket3ModalOverlay.addEventListener("click", (e) => {
  if (e.target === paket3ModalOverlay) closePaket3Modal(); // Klick auf Backdrop
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && paket3ModalOverlay.classList.contains("open")) {
    closePaket3Modal();
  }
});
document.getElementById("paket3ModalReset").addEventListener("click", () => {
  if (!confirm("Diese Checkliste wirklich zurücksetzen?")) return;
  const state = loadChecklistState();
  for (let i = 0; i < 21; i++) state[`paket3-${i}`] = false;
  saveChecklistState(state);
  renderPaket3Modal();
});

/* ---------- PayPal-Gebührenrechner ---------- */
(function () {
  const FEE = { percent: 2.49, fixed: 0.35 };

  const amountEl = document.getElementById("amount");
  const form = document.getElementById("calcForm");

  const statGross = document.getElementById("statGross");
  const statFee = document.getElementById("statFee");
  const statNet = document.getElementById("statNet");
  const statFormula = document.getElementById("statFormula");

  function eur(n) {
    return (
      n.toLocaleString("de-DE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) + " €"
    );
  }
  function pct(n) {
    return (
      n.toLocaleString("de-DE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) + " %"
    );
  }

  function calculate() {
    const net = Math.max(0, parseFloat(amountEl.value) || 0);
    const gross = (net + FEE.fixed) / (1 - FEE.percent / 100);
    const fee = gross - net;

    statGross.textContent = eur(gross);
    statFee.textContent = "− " + eur(fee);
    statNet.textContent = eur(net);
    statFormula.textContent = `${pct(FEE.percent)} von ${eur(gross)} + ${eur(FEE.fixed)} = ${eur(fee)} Gebühr`;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    calculate();
  });
  amountEl.addEventListener("input", calculate);

  calculate();
})();

/* ---------- Kindergeburtstag – Kassen-Übersicht ---------- */
(function () {
  const packages = {
    "mini-entdecker": {
      name: "Entdecker",
      tag: "Miniparcours",
      price: "90 €",
      sub: "bis 6 Minis · + 14 € je weiterem Kind",
      items: [
        ["Gutschein für das Geburtstagskind", true],
        ["Urkunden", true],
        ["15 % Rabatt Biergarten am Waldhaus", true],
        ["Bio-Kaltgetränk pro Kind", false],
        ["Reservierter Tisch", false],
        ["Handschuhe", false],
        ["Exklusive Trainer/in-Betreuung", false],
      ],
    },
    "mini-abenteurer": {
      name: "Abenteurer",
      tag: "Miniparcours",
      price: "115 €",
      sub: "bis 6 Minis · + 17 € je weiterem Kind",
      items: [
        ["Gutschein für das Geburtstagskind", true],
        ["Urkunden", true],
        ["15 % Rabatt Biergarten am Waldhaus", true],
        ["Bio-Kaltgetränk pro Kind", true],
        ["Reservierter Tisch", true],
        ["Handschuhe", false],
        ["Exklusive Trainer/in-Betreuung", false],
      ],
    },
    "hoehe-entdecker": {
      name: "Entdecker",
      tag: "Höhenparcours",
      price: "125 €",
      sub: "bis 6 Kinder · + 20 € je weiterem Kind",
      items: [
        ["Gutschein für das Geburtstagskind", true],
        ["Urkunden", true],
        ["15 % Rabatt Biergarten am Waldhaus", true],
        ["Bio-Kaltgetränk pro Kind", false],
        ["Reservierter Tisch", false],
        ["Handschuhe", false],
        ["Exklusive Trainer/in-Betreuung", false],
      ],
    },
    "hoehe-abenteurer": {
      name: "Abenteurer",
      tag: "Höhenparcours",
      price: "140 €",
      sub: "bis 6 Kinder · + 23 € je weiterem Kind",
      items: [
        ["Gutschein für das Geburtstagskind", true],
        ["Urkunden", true],
        ["15 % Rabatt Biergarten am Waldhaus", true],
        ["Bio-Kaltgetränk pro Kind", true],
        ["Reservierter Tisch", true],
        ["Handschuhe", false],
        ["Exklusive Trainer/in-Betreuung", false],
      ],
    },
    "hoehe-wipfelstuermer": {
      name: "Wipfelstürmer",
      tag: "Höhenparcours",
      price: "250 €",
      sub: "bis 6 Kinder · + 25 € je weiterem Kind",
      items: [
        ["Gutschein für das Geburtstagskind", true],
        ["Urkunden", true],
        ["15 % Rabatt Biergarten am Waldhaus", true],
        ["Bio-Kaltgetränk pro Kind", true],
        ["Reservierter Tisch", true],
        ["Handschuhe", true],
        ["Exklusive Trainer/in-Betreuung (bis 6 Kinder)", true],
      ],
    },
  };

  const panel = document.getElementById("panel-kigeb");
  const rows = panel.querySelectorAll(".pkg-row");
  const kgTicketType = document.getElementById("kgTicketType");
  const kgPrice = document.getElementById("kgPrice");
  const kgSub = document.getElementById("kgSub");
  const kgChecklist = document.getElementById("kgChecklist");

  function render(pkgId) {
    const p = packages[pkgId];
    kgTicketType.textContent = p.tag;
    kgPrice.textContent = p.price;
    kgSub.textContent = p.sub;
    kgChecklist.innerHTML = p.items
      .map(
        ([label, on]) => `
        <div class="check-item ${on ? "on" : "off"}">
          <span class="icon">${on ? "✓" : "–"}</span>
          <span>${label}</span>
        </div>
      `,
      )
      .join("");
  }

  rows.forEach((row) => {
    row.addEventListener("click", () => {
      rows.forEach((r) => r.classList.remove("active"));
      row.classList.add("active");
      render(row.dataset.pkg);
    });
    if (row.dataset.pkg === "hoehe-wipfelstuermer") {
      row.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        row.click();
      });
    }
  });

  panel.querySelector(".trainer-check").addEventListener("click", openPaket3Modal);

  rows[0].classList.add("active");
  render(rows[0].dataset.pkg);
})();

/* ---------- NiceToKnow – Waldhaus Öffnungszeiten ---------- */
(function () {
  const openingHours = [
    ["Montag", "11:30–20:00"],
    ["Dienstag", "Geschlossen"],
    ["Mittwoch", "Geschlossen"],
    ["Donnerstag", "11:30–20:00"],
    ["Freitag", "11:30–20:00"],
    ["Samstag", "11:30–20:00"],
    ["Sonntag", "11:30–20:00"],
  ];

  const panel = document.getElementById("panel-nicetoknow");
  const row = panel.querySelector(".pkg-row");
  const ticket = document.getElementById("niceTicket");
  const checklist = document.getElementById("niceChecklist");

  function selectRow() {
    row.classList.add("active");
    ticket.hidden = false;
    checklist.innerHTML = openingHours
      .map(
        ([day, hours]) => `
        <div class="check-item ${hours === "Geschlossen" ? "off" : "on"}">
          <span class="icon">${hours === "Geschlossen" ? "–" : "✓"}</span>
          <span>${day}: ${hours}</span>
        </div>
      `,
      )
      .join("");
  }

  row.addEventListener("click", selectRow);
  selectRow();
})();

/* ---------- Wetter-Overlay (lädt erst, wenn der Tab zum ersten Mal geöffnet wird) ---------- */
(function () {
  /* ÖFFNUNGSZEITEN — feste Regeln aus der aktuellen Saisontabelle
           (kletterwaldeinsiedel.de/besuch, Stand Saison 2026).
           WICHTIG: jede Saison von Hand aktualisieren. */

  const SEASON_2026 = { start: "2026-03-28", end: "2026-11-08" };

  const FERIEN_2026 = [
    { start: "2026-03-30", end: "2026-04-10" }, // Osterferien
    { start: "2026-05-26", end: "2026-06-05" }, // Pfingstferien
    { start: "2026-08-03", end: "2026-09-14" }, // Sommerferien
    { start: "2026-11-02", end: "2026-11-06" }, // Herbstferien
  ];

  const FEIERTAGE_2026 = [
    "2026-04-03",
    "2026-04-06",
    "2026-05-01",
    "2026-05-14",
    "2026-05-25",
    "2026-06-04",
    "2026-08-15",
    "2026-10-03",
    "2026-11-01",
  ];

  const BRUECKENTAGE_2026 = ["2026-05-15"]; // bei Bedarf ergänzen

  const ZEITUMSTELLUNG_2026 = "2026-10-25";

  function isoDate(d) {
    return (
      d.getFullYear() +
      "-" +
      String(d.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(d.getDate()).padStart(2, "0")
    );
  }
  function inRange(ds, range) {
    return ds >= range.start && ds <= range.end;
  }
  function isFerien(ds) {
    return FERIEN_2026.some((r) => inRange(ds, r));
  }
  function isFeiertagOrBruecke(ds) {
    return FEIERTAGE_2026.includes(ds) || BRUECKENTAGE_2026.includes(ds);
  }

  function subMinutes(hhmm, minutes) {
    const [h, m] = hhmm.split(":").map(Number);
    const total = h * 60 + m - minutes;
    const hh = Math.floor((((total % 1440) + 1440) % 1440) / 60);
    const mm = ((total % 60) + 60) % 60;
    return String(hh).padStart(2, "0") + ":" + String(mm).padStart(2, "0");
  }

  function computeHours(date) {
    const ds = isoDate(date);
    if (ds < SEASON_2026.start || ds > SEASON_2026.end)
      return { open: false, reason: "Saisonpause" };
    const month = date.getMonth() + 1;
    const day = date.getDay();
    const weekend = day === 0 || day === 6;
    const friday = day === 5;
    const ferien = isFerien(ds);
    const feiertag = isFeiertagOrBruecke(ds);

    if (month === 3 || month === 4) {
      if (ferien || feiertag || weekend)
        return { open: true, from: "11:00", to: "19:00" };
      return { open: false, reason: "Regulärer Wochentag" };
    }
    if (month >= 5 && month <= 9) {
      if (ferien || feiertag || weekend)
        return { open: true, from: "10:00", to: "19:00" };
      if (friday) return { open: true, from: "14:00", to: "19:00" };
      return { open: false, reason: "Regulärer Wochentag" };
    }
    if (ferien) return { open: true, from: "11:00", to: "17:00" };
    if (feiertag || weekend) {
      const to = ds >= ZEITUMSTELLUNG_2026 ? "17:00" : "18:00";
      return { open: true, from: "11:00", to };
    }
    return { open: false, reason: "Regulärer Wochentag" };
  }

  function renderHours(date) {
    const dateFmt = date.toLocaleDateString("de-DE", {
      weekday: "long",
      day: "2-digit",
      month: "long",
    });
    document.getElementById("todayDate").textContent = dateFmt;

    const result = computeHours(date);
    const valueEl = document.getElementById("hoursValue");
    const subEl = document.getElementById("hoursSub");

    if (result.open) {
      valueEl.classList.remove("closed");
      valueEl.textContent = `${result.from} – ${result.to} Uhr`;
      const kassenschluss = subMinutes(result.to, 120);
      const letzterAufstieg = subMinutes(result.to, 30);
      subEl.innerHTML = `Kassenschluss: ${kassenschluss} Uhr · Letzter Aufstieg: ${letzterAufstieg} Uhr`;
    } else {
      valueEl.classList.add("closed");
      valueEl.textContent = "Geschlossen";
      subEl.textContent = result.reason;
    }
    return result;
  }

  /* TAG-NAVIGATION */
  const TODAY = new Date();
  TODAY.setHours(0, 0, 0, 0);
  let dayOffset = 0;
  const MIN_OFFSET = -14,
    MAX_OFFSET = 14;

  function getSelectedDate() {
    const d = new Date(TODAY);
    d.setDate(TODAY.getDate() + dayOffset);
    return d;
  }

  /* WETTER — Open-Meteo (schlüssellos, CORS-fähig, DWD-Basis).
           Wetter Online bietet keine öffentliche fetch()-fähige Schnittstelle. */
  const LAT = 49.9005,
    LON = 9.9575; // Kletterwald Einsiedel, Gramschatzer Wald

  function rainColor(pct) {
    if (pct >= 80) return "var(--terracotta-dark)";
    if (pct >= 50) return "var(--orange)";
    if (pct >= 20) return "var(--olive)";
    return "var(--cream)";
  }

  function renderLegend(isPast) {
    const legend = document.getElementById("rainLegend");
    if (isPast) {
      legend.innerHTML = `
              <span><i style="background:var(--cream)"></i>&lt;1mm</span>
              <span><i style="background:var(--olive)"></i>1–2,5mm</span>
              <span><i style="background:var(--orange)"></i>2,5–4mm</span>
              <span><i style="background:var(--terracotta-dark)"></i>&gt;4mm</span>`;
    } else {
      legend.innerHTML = `
              <span><i style="background:var(--cream)"></i>0–19%</span>
              <span><i style="background:var(--olive)"></i>20–49%</span>
              <span><i style="background:var(--orange)"></i>50–79%</span>
              <span><i style="background:var(--terracotta-dark)"></i>80–100%</span>`;
    }
  }

  async function loadWeather(selectedDate, openHours) {
    const rainChart = document.getElementById("rainChart");
    const tempMin = document.getElementById("tempMin");
    const tempMax = document.getElementById("tempMax");
    const updatedEl = document.getElementById("rainUpdated");
    const rainHeading = document.getElementById("rainHeading");
    const tempHeading = document.getElementById("tempHeading");

    rainChart.innerHTML =
      '<p style="font-size:0.8rem;color:var(--terracotta-dark);">Lade Wetterdaten…</p>';

    const diffDays = Math.round((selectedDate - TODAY) / 86400000);
    const isPast = diffDays < 0;
    const past_days = isPast ? Math.min(92, -diffDays) : 0;
    const forecast_days = isPast ? 1 : Math.min(16, diffDays + 1);

    tempHeading.textContent =
      "Temperatur" +
      (diffDays === 0 ? " heute" : isPast ? " (gemessen)" : " (Vorhersage)");
    rainHeading.textContent =
      "Regenverlauf" +
      (diffDays === 0 ? " heute" : isPast ? " (gemessen)" : " (Vorhersage)");
    renderLegend(isPast);

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&daily=temperature_2m_max,temperature_2m_min&hourly=precipitation_probability,precipitation,temperature_2m&timezone=Europe%2FBerlin&past_days=${past_days}&forecast_days=${forecast_days}`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Netzwerkfehler");
      const data = await res.json();

      const ds = isoDate(selectedDate);
      const dayIdx = data.daily.time.indexOf(ds);
      const hourStartIdx = data.hourly.time.findIndex((t) => t.startsWith(ds));

      if (dayIdx === -1 || hourStartIdx === -1)
        throw new Error("Datum außerhalb des verfügbaren Bereichs");

      const startHour = 10,
        endHour = 19;
      let openFrom = -1,
        openTo = -1;
      if (openHours.open) {
        openFrom = parseInt(openHours.from.slice(0, 2), 10);
        openTo = parseInt(openHours.to.slice(0, 2), 10);
      }

      if (openHours.open) {
        const openTemps = [];
        for (let h = openFrom; h <= openTo; h++) {
          const t = data.hourly.temperature_2m[hourStartIdx + h];
          if (t !== undefined && t !== null) openTemps.push(t);
        }
        tempMax.textContent = Math.round(Math.max(...openTemps)) + "°C";
        tempMin.textContent = Math.round(Math.min(...openTemps)) + "°C";
      } else {
        tempMax.textContent =
          Math.round(data.daily.temperature_2m_max[dayIdx]) + "°";
        tempMin.textContent =
          Math.round(data.daily.temperature_2m_min[dayIdx]) + "°";
        tempHeading.textContent += " · ganzer Tag, geschlossen";
      }

      rainChart.innerHTML = "";
      for (let h = startHour; h <= endHour; h++) {
        const idx = hourStartIdx + h;
        let pct, label;
        if (isPast) {
          const mm = data.hourly.precipitation[idx] ?? 0;
          pct = Math.min(100, Math.round((mm / 5) * 100));
          label = mm.toFixed(1) + "mm";
        } else {
          pct = data.hourly.precipitation_probability[idx] ?? 0;
          label = pct + "%";
        }

        const col = document.createElement("div");
        col.className = "rain-col";
        if (openHours.open && h >= openFrom && h < openTo)
          col.classList.add("open-hour");

        col.innerHTML = `
                <div class="rain-track">
                  <div class="rain-fill" style="height:${Math.max(pct, 3)}%;background:${rainColor(pct)}"></div>
                </div>
                <div class="rain-pct">${label}</div>
                <div class="rain-hour">${String(h).padStart(2, "0")}</div>
              `;
        rainChart.appendChild(col);
      }

      const now = new Date();
      updatedEl.textContent =
        "Stand: " +
        now.toLocaleTimeString("de-DE", {
          hour: "2-digit",
          minute: "2-digit",
        }) +
        " Uhr";
    } catch (err) {
      rainChart.innerHTML =
        '<p style="font-size:0.8rem;color:var(--terracotta-dark);">Wetterdaten für diesen Tag nicht verfügbar.</p>';
      updatedEl.textContent = "Fehler beim Laden";
    }
  }

  function init() {
    const selectedDate = getSelectedDate();
    const openHours = renderHours(selectedDate);
    loadWeather(selectedDate, openHours);
  }

  document.getElementById("refreshBtn").addEventListener("click", init);
  document.getElementById("prevDay").addEventListener("click", () => {
    dayOffset = Math.max(MIN_OFFSET, dayOffset - 1);
    init();
  });
  document.getElementById("nextDay").addEventListener("click", () => {
    dayOffset = Math.min(MAX_OFFSET, dayOffset + 1);
    init();
  });

  /* Lazy-Start: läuft erst los, wenn der Wetter-Tab zum ersten Mal
           geöffnet wird, statt schon beim Laden der Seite unnötig eine
           Wetter-API abzufragen, falls der Tab nie besucht wird. */
  let weatherStarted = false;
  function startWeatherTab() {
    if (weatherStarted) return;
    weatherStarted = true;
    init();
  }
  triggerWeatherInit = startWeatherTab;
})();
