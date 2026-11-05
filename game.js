(() => {
  const DRAFT_SECONDS = 20;
  const MAX_LIVES = 3;
  const COURT_W = 800;
  const COURT_H = 480;
  const HIGH_SCORE_KEY = "pixelHoopsHighScore";

  const FIRST_NAMES = [
    "JAMAL", "TYRONE", "DIEGO", "MARCUS", "KEVIN", "LAMAR", "CHRIS", "ANDRE",
    "DEVON", "ISAIAH", "TREVOR", "OMARI", "NATE", "JORDAN", "CARLOS", "MILES",
    "QUINCY", "DANTE", "RAYLAN", "COLE", "BRYCE", "ELIJAH", "NOAH", "LEVI",
    "JACE", "KAI", "ROMAN", "AXEL", "ZION", "MALIK", "TARI", "ORION",
    "FELIX", "GAVIN", "HARPER", "IVAN", "JULES", "KYLE", "LEON", "MASON",
    "NOLAN", "OSCAR", "PARKER", "QUINN", "REED", "SILAS", "TOBIAS", "URIEL",
    "VICTOR", "WES", "XAVIER", "YURI", "ZANE", "BLAKE", "CASEY", "DREW",
    "ELLIS", "FINN", "GRAY", "HUGH", "ION", "JED", "KIRK", "LANCE"
  ];

  const LAST_NAMES = [
    "STONE", "FLASH", "RIVERA", "BROOKS", "HAYES", "COLEMAN", "WARD", "PRICE",
    "KNIGHT", "BANKS", "FOSTER", "REED", "SHAW", "PORTER", "HUNT", "CROSS",
    "BLAZE", "STEEL", "VANCE", "DRAKE", "FOX", "WILDER", "SLATE", "MOON",
    "PARK", "GOMEZ", "NGUYEN", "PATEL", "ROSSI", "BERG", "KLEIN", "ORTEGA",
    "DUNN", "PAGE", "WEST", "NORTH", "SOUTH", "LANE", "HILL", "VALE",
    "STORM", "BLADE", "ARROW", "SPARK", "CROWN", "PIXEL", "HOOPER", "SWISH",
    "NETTER", "COURT", "RIM", "BOARD", "ALLEY", "DUNKER", "JUMPER", "CLUTCH"
  ];

  const JERSEY_COLORS = [
    "#e63946", "#1d3557", "#457b9d", "#2a9d8f", "#e9c46a",
    "#f4a261", "#9b2226", "#005f73", "#ee9b00", "#6a4c93",
    "#3a86ff", "#8338ec", "#fb5607", "#ff006e", "#00b4d8",
    "#80b918", "#bc4749", "#386641", "#5c4d7a", "#d62828"
  ];

  // Sweet zones reduced 30% across the board
  const STAR_ACCURACY = {
    1: { sweetWidth: 0.042, forgiveness: 0.04, label: "BRICK MACHINE" },
    2: { sweetWidth: 0.063, forgiveness: 0.07, label: "STREAKY" },
    3: { sweetWidth: 0.084, forgiveness: 0.10, label: "SOLID" },
    4: { sweetWidth: 0.112, forgiveness: 0.14, label: "SHARP" },
    5: { sweetWidth: 0.154, forgiveness: 0.18, label: "MONEY" }
  };

  const FIVE_STAR_NAMES = [
    "Lucien Daniel",
    "Baby Flora",
    "Kassidy Khloe",
    "Violet Kiera",
    "Michael Jordan"
  ];

  const FOUR_STAR_NAMES = [
    "Lebron James",
    "Shawn Kemp",
    "Anthony Edwards",
    "Vince Carter",
    "Kobe Bryant",
    "Steph Curry",
    "SGA",
    "Kevin Durant",
    "Scottie Barnes",
    "Kawhi Leonard"
  ];

  const canvas = document.getElementById("court");
  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("score");
  const highScoreEl = document.getElementById("high-score");
  const titleHighScoreEl = document.getElementById("title-high-score");
  const overHighScoreEl = document.getElementById("over-high-score");
  const draftTimerEl = document.getElementById("draft-timer");
  const livesEl = document.getElementById("lives");
  const playerNameEl = document.getElementById("player-name");
  const playerStarsEl = document.getElementById("player-stars");
  const playerJerseyEl = document.getElementById("player-jersey");
  const meterNeedle = document.getElementById("meter-needle");
  const meterSweet = document.getElementById("meter-sweet");
  const meterBar = document.getElementById("meter-bar");
  const overlay = document.getElementById("overlay");
  const titleScreen = document.getElementById("title-screen");
  const draftScreen = document.getElementById("draft-screen");
  const gameOverScreen = document.getElementById("game-over-screen");
  const draftPicksEl = document.getElementById("draft-picks");
  const finalScoreEl = document.getElementById("final-score");
  const newRecordEl = document.getElementById("new-record");
  const starterInfoEl = document.getElementById("starter-info");
  const venueNameEl = document.getElementById("venue-name");

  const VENUES = [
    { minScore: 0, id: "gym", name: "GYM COURT" },
    { minScore: 10, id: "outside", name: "OUTSIDE COURT" },
    { minScore: 20, id: "expensive", name: "EXPENSIVE COURT" },
    { minScore: 30, id: "island", name: "ISLAND COURT" },
    { minScore: 40, id: "sky", name: "SKY COURT" },
    { minScore: 50, id: "skyscraper", name: "SKYSCRAPER" }
  ];

  const hoop = { x: 400, y: 92, r: 28 };
  const keys = new Set();

  let roster = [];
  let currentPlayer = null;
  let score = 0;
  let highScore = Number(localStorage.getItem(HIGH_SCORE_KEY) || 0);
  let lives = MAX_LIVES;
  let draftCountdown = DRAFT_SECONDS;
  let playing = false;
  let drafting = false;
  let charging = false;
  let meter = 0;
  let meterDir = 1;
  let ball = null;
  let feedback = "";
  let feedbackTimer = 0;
  let lastTs = 0;
  let draftEndsAt = 0;
  let animId = 0;
  let lifeLostPending = false;
  let currentVenueId = "gym";

  const player = {
    x: 400,
    y: 390,
    speed: 220,
    facing: 1
  };

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function pick(arr) {
    return arr[randInt(0, arr.length - 1)];
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = randInt(0, i);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function uniqueName(used) {
    for (let i = 0; i < 200; i++) {
      const name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
      if (!used.has(name)) {
        used.add(name);
        return name;
      }
    }
    const fallback = `PLAYER ${used.size + 1}`;
    used.add(fallback);
    return fallback;
  }

  function contrastText(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum > 0.55 ? "#111111" : "#ffffff";
  }

  function makePlayer(stars, usedNames, fixedName) {
    const cfg = STAR_ACCURACY[stars];
    const sweetCenter = 0.62 + (Math.random() * 0.08 - 0.04);
    const jerseyColor = pick(JERSEY_COLORS);
    const name = fixedName || uniqueName(usedNames);
    if (fixedName) usedNames.add(fixedName.toUpperCase());
    return {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      name,
      stars,
      number: randInt(0, 99),
      jerseyColor,
      numberColor: contrastText(jerseyColor),
      sweetWidth: cfg.sweetWidth,
      forgiveness: cfg.forgiveness,
      sweetCenter: Math.min(0.78, Math.max(0.55, sweetCenter)),
      label: cfg.label
    };
  }

  function buildRoster() {
    const used = new Set();
    // 1–3 common filler · exactly 10 named 4★ · exactly 5 named 5★
    const roster = [
      ...FIVE_STAR_NAMES.map((name) => makePlayer(5, used, name)),
      ...FOUR_STAR_NAMES.map((name) => makePlayer(4, used, name)),
      ...Array(28).fill(1).map(() => makePlayer(1, used)),
      ...Array(37).fill(2).map(() => makePlayer(2, used)),
      ...Array(20).fill(3).map(() => makePlayer(3, used))
    ];
    return shuffle(roster);
  }

  function starString(n) {
    return "★".repeat(n) + "☆".repeat(5 - n);
  }

  function livesString(n) {
    return "♥".repeat(Math.max(0, n)) + "♡".repeat(Math.max(0, MAX_LIVES - n));
  }

  function jerseyNumber(n) {
    return String(n).padStart(2, "0");
  }

  function accuracyPercent(p) {
    return Math.round((p.sweetWidth + p.forgiveness) * 100);
  }

  function syncHighScoreDisplays() {
    highScoreEl.textContent = String(highScore);
    titleHighScoreEl.textContent = String(highScore);
    overHighScoreEl.textContent = String(highScore);
  }

  function maybeUpdateHighScore() {
    if (score > highScore) {
      highScore = score;
      localStorage.setItem(HIGH_SCORE_KEY, String(highScore));
      syncHighScoreDisplays();
      return true;
    }
    return false;
  }

  function getVenue() {
    let venue = VENUES[0];
    for (const v of VENUES) {
      if (score >= v.minScore) venue = v;
    }
    return venue;
  }

  function checkVenueUnlock() {
    const venue = getVenue();
    if (venue.id !== currentVenueId) {
      currentVenueId = venue.id;
      venueNameEl.textContent = venue.name;
      feedback = venue.name + "!";
      feedbackTimer = 1.2;
    }
  }

  function updateHud() {
    playerNameEl.textContent = currentPlayer.name;
    playerStarsEl.textContent = starString(currentPlayer.stars);
    playerJerseyEl.textContent = `#${jerseyNumber(currentPlayer.number)}`;
    playerJerseyEl.style.background = currentPlayer.jerseyColor;
    playerJerseyEl.style.color = currentPlayer.numberColor;
    playerJerseyEl.style.borderColor = currentPlayer.numberColor;
    scoreEl.textContent = String(score);
    livesEl.textContent = livesString(lives);
    draftTimerEl.textContent = String(Math.max(0, Math.ceil(draftCountdown)));
    venueNameEl.textContent = getVenue().name;
    syncHighScoreDisplays();
    applyMeterVisuals();
  }

  function applyMeterVisuals() {
    const left = (currentPlayer.sweetCenter - currentPlayer.sweetWidth / 2) * 100;
    meterSweet.style.left = `${left}%`;
    meterSweet.style.width = `${currentPlayer.sweetWidth * 100}%`;
    meterNeedle.style.left = `${meter * 100}%`;
    meterBar.style.width = `${meter * 100}%`;
  }

  function showScreen(screen) {
    overlay.classList.remove("hidden");
    titleScreen.classList.add("hidden");
    draftScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");
    screen.classList.remove("hidden");
  }

  function hideOverlay() {
    overlay.classList.add("hidden");
  }

  function resetCourt() {
    player.x = 400;
    player.y = 390;
    ball = null;
    charging = false;
    meter = 0;
    meterDir = 1;
    feedback = "";
    feedbackTimer = 0;
    lifeLostPending = false;
  }

  function startGame() {
    roster = buildRoster();
    currentPlayer = makePlayer(3, new Set(roster.map((p) => p.name)));
    score = 0;
    lives = MAX_LIVES;
    draftCountdown = DRAFT_SECONDS;
    drafting = false;
    playing = true;
    currentVenueId = "gym";
    draftEndsAt = performance.now() + DRAFT_SECONDS * 1000;
    resetCourt();
    updateHud();
    hideOverlay();
    lastTs = performance.now();
    cancelAnimationFrame(animId);
    animId = requestAnimationFrame(loop);
  }

  function openDraft() {
    playing = false;
    drafting = true;
    charging = false;
    ball = null;
    meter = 0;
    applyMeterVisuals();
    renderDraftPicks();
    showScreen(draftScreen);
  }

  function continueAfterDraft() {
    drafting = false;
    playing = true;
    charging = false;
    meter = 0;
    draftCountdown = DRAFT_SECONDS;
    draftEndsAt = performance.now() + DRAFT_SECONDS * 1000;
    resetCourt();
    updateHud();
    hideOverlay();
    lastTs = performance.now();
    // Draft open path exits the loop early — kick it back on so shooting works again
    cancelAnimationFrame(animId);
    animId = requestAnimationFrame(loop);
  }

  function endGame() {
    playing = false;
    drafting = false;
    charging = false;
    ball = null;
    const isRecord = maybeUpdateHighScore();
    finalScoreEl.textContent = String(score);
    newRecordEl.classList.toggle("hidden", !isRecord);
    syncHighScoreDisplays();
    showScreen(gameOverScreen);
  }

  function loseLife() {
    if (lifeLostPending) return;
    lifeLostPending = true;
    lives = Math.max(0, lives - 1);
    livesEl.textContent = livesString(lives);
    feedback = "MISS -1 LIFE";
    feedbackTimer = 0.9;
    if (lives <= 0) {
      setTimeout(() => {
        if (lives <= 0) endGame();
      }, 450);
    }
  }

  function renderDraftPicks() {
    const picks = shuffle(roster.filter((p) => p.id !== currentPlayer.id)).slice(0, 3);
    draftPicksEl.innerHTML = "";
    picks.forEach((p) => {
      draftPicksEl.appendChild(playerCard(p));
    });
  }

  function playerCard(p) {
    const btn = document.createElement("button");
    btn.className = "player-card";
    btn.type = "button";
    btn.innerHTML = `
      <div class="jersey-swatch" style="background:${p.jerseyColor};color:${p.numberColor};border-color:${p.numberColor}">
        ${jerseyNumber(p.number)}
      </div>
      <div class="card-body">
        <div class="name">${p.name}</div>
        <div class="stars">${starString(p.stars)}</div>
        <div class="acc">SHOT ACC ${accuracyPercent(p)} · ${p.label}</div>
        <div class="meta">SWEET ${(p.sweetWidth * 100).toFixed(0)}% · FORGIVE ${(p.forgiveness * 100).toFixed(0)}%</div>
      </div>
    `;
    btn.addEventListener("click", () => selectPlayer(p));
    return btn;
  }

  function selectPlayer(p) {
    currentPlayer = p;
    updateHud();
    continueAfterDraft();
  }

  function beginCharge() {
    if (!playing || drafting || ball || lives <= 0) return;
    charging = true;
    meter = 0;
    meterDir = 1;
  }

  function releaseShot() {
    if (!playing || drafting || !charging || ball) return;
    charging = false;
    shoot(meter);
    meter = 0;
    applyMeterVisuals();
  }

  function shoot(power) {
    const p = currentPlayer;
    const delta = Math.abs(power - p.sweetCenter);
    const perfect = delta <= p.sweetWidth / 2;
    const makeChance = perfect
      ? 0.92 + p.stars * 0.015
      : Math.max(0.05, 0.75 - (delta - p.sweetWidth / 2) / Math.max(0.01, p.forgiveness) * 0.7);

    const willScore = Math.random() < makeChance;
    const angle = Math.atan2(hoop.y - (player.y - 20), hoop.x - player.x);
    const speed = 420 + power * 80;

    lifeLostPending = false;
    ball = {
      x: player.x,
      y: player.y - 28,
      vx: Math.cos(angle) * speed * (0.85 + power * 0.2),
      vy: Math.sin(angle) * speed - 220 - power * 120,
      r: 10,
      t: 0,
      scored: false,
      decided: false,
      willScore,
      spin: 0
    };

    if (perfect) {
      feedback = "PERFECT!";
    } else if (willScore) {
      feedback = "GOOD!";
    } else {
      feedback = delta < p.sweetWidth ? "SHORT!" : "BRICK!";
    }
    feedbackTimer = 0.7;
  }

  function updateBall(dt) {
    if (!ball) return;
    ball.t += dt;
    ball.vy += 900 * dt;
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    ball.spin += dt * 10;

    const dist = Math.hypot(ball.x - hoop.x, ball.y - hoop.y);
    if (!ball.decided && dist < hoop.r + 4 && ball.vy > 0 && ball.y > hoop.y - 10) {
      ball.decided = true;
      if (ball.willScore) {
        ball.scored = true;
        score += 2;
        scoreEl.textContent = String(score);
        if (score > highScore) {
          highScore = score;
          localStorage.setItem(HIGH_SCORE_KEY, String(highScore));
          syncHighScoreDisplays();
        }
        feedback = "SWISH!";
        feedbackTimer = 0.8;
        ball.vx *= 0.15;
        ball.vy = Math.abs(ball.vy) * 0.25;
        checkVenueUnlock();
      } else {
        ball.vx = (ball.x < hoop.x ? -1 : 1) * (120 + Math.random() * 80);
        ball.vy = -180 - Math.random() * 80;
        feedback = "NO GOOD!";
        feedbackTimer = 0.7;
        loseLife();
      }
    }

    if (ball.y > COURT_H + 40 || ball.x < -60 || ball.x > COURT_W + 60 || ball.t > 2.4) {
      if (!ball.decided && !ball.willScore) {
        loseLife();
      } else if (!ball.decided && ball.willScore) {
        // airball that was supposed to go in still counts as miss if it never hits
        loseLife();
        feedback = "AIRBALL!";
        feedbackTimer = 0.8;
      } else if (ball.decided && !ball.scored && !lifeLostPending) {
        loseLife();
      }
      ball = null;
    }
  }

  function updatePlayer(dt) {
    let dx = 0;
    if (keys.has("ArrowLeft") || keys.has("a") || keys.has("A")) dx -= 1;
    if (keys.has("ArrowRight") || keys.has("d") || keys.has("D")) dx += 1;
    player.x += dx * player.speed * dt;
    player.x = Math.max(40, Math.min(COURT_W - 40, player.x));
    if (dx !== 0) player.facing = dx > 0 ? 1 : -1;
  }

  function updateMeter(dt) {
    if (!charging) return;
    const speed = 1.35 + (5 - currentPlayer.stars) * 0.18;
    meter += meterDir * speed * dt;
    if (meter >= 1) {
      meter = 1;
      meterDir = -1;
    } else if (meter <= 0) {
      meter = 0;
      meterDir = 1;
    }
    applyMeterVisuals();
  }

  function drawBackdrop(venueId) {
    if (venueId === "outside") {
      const sky = ctx.createLinearGradient(0, 0, 0, COURT_H);
      sky.addColorStop(0, "#6ec6ff");
      sky.addColorStop(0.55, "#b8e0ff");
      sky.addColorStop(1, "#7ec850");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, COURT_W, COURT_H);
      ctx.fillStyle = "#ffffff";
      [[80, 50, 50], [220, 70, 40], [520, 40, 55], [700, 65, 35]].forEach(([x, y, r]) => {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.arc(x + r * 0.7, y + 8, r * 0.75, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.fillStyle = "#5aa832";
      ctx.fillRect(0, 400, COURT_W, 80);
      for (let i = 0; i < 12; i++) {
        ctx.fillStyle = "#3d7a20";
        ctx.fillRect(30 + i * 70, 360, 18, 50);
        ctx.fillStyle = "#2f6b18";
        ctx.beginPath();
        ctx.moveTo(20 + i * 70, 365);
        ctx.lineTo(39 + i * 70, 320);
        ctx.lineTo(58 + i * 70, 365);
        ctx.fill();
      }
      return;
    }

    if (venueId === "expensive") {
      const sky = ctx.createLinearGradient(0, 0, 0, COURT_H);
      sky.addColorStop(0, "#1a1030");
      sky.addColorStop(0.5, "#3b2060");
      sky.addColorStop(1, "#120c22");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, COURT_W, COURT_H);
      for (let i = 0; i < 40; i++) {
        ctx.fillStyle = i % 3 === 0 ? "#ffe566" : "#fff";
        ctx.fillRect((i * 97) % COURT_W, (i * 53) % 180, 2, 2);
      }
      ctx.fillStyle = "#2a1a4a";
      ctx.fillRect(0, 390, COURT_W, 90);
      // luxury stands
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = i % 2 === 0 ? "#d4af37" : "#8b6914";
        ctx.fillRect(20 + i * 98, 300, 90, 90);
        ctx.fillStyle = "#1a1030";
        for (let w = 0; w < 3; w++) {
          for (let h = 0; h < 3; h++) {
            ctx.fillRect(32 + i * 98 + w * 24, 312 + h * 24, 14, 14);
          }
        }
      }
      ctx.fillStyle = "#d4af37";
      ctx.font = "10px 'Press Start 2P', monospace";
      ctx.textAlign = "center";
      ctx.fillText("VIP ARENA", COURT_W / 2, 36);
      return;
    }

    if (venueId === "island") {
      const sky = ctx.createLinearGradient(0, 0, 0, COURT_H);
      sky.addColorStop(0, "#4fc3f7");
      sky.addColorStop(0.45, "#81d4fa");
      sky.addColorStop(0.7, "#26c6da");
      sky.addColorStop(1, "#00838f");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, COURT_W, COURT_H);
      // sun
      ctx.fillStyle = "#ffe566";
      ctx.beginPath();
      ctx.arc(680, 70, 36, 0, Math.PI * 2);
      ctx.fill();
      // ocean waves
      ctx.fillStyle = "#00acc1";
      for (let y = 360; y < COURT_H; y += 16) {
        ctx.beginPath();
        for (let x = 0; x <= COURT_W; x += 20) {
          const wave = Math.sin((x + y) * 0.05) * 4;
          if (x === 0) ctx.moveTo(x, y + wave);
          else ctx.lineTo(x, y + wave);
        }
        ctx.lineTo(COURT_W, COURT_H);
        ctx.lineTo(0, COURT_H);
        ctx.fill();
      }
      // sand
      ctx.fillStyle = "#f0d48a";
      ctx.fillRect(0, 410, COURT_W, 70);
      ctx.fillStyle = "#e0c070";
      for (let i = 0; i < COURT_W; i += 28) {
        ctx.fillRect(i, 410, 14, 70);
      }
      // palms
      [[60, 380], [740, 385]].forEach(([px, py]) => {
        ctx.fillStyle = "#6d4c2b";
        ctx.fillRect(px, py - 70, 10, 80);
        ctx.fillStyle = "#2e7d32";
        for (let a = -1; a <= 1; a++) {
          ctx.beginPath();
          ctx.moveTo(px + 5, py - 70);
          ctx.quadraticCurveTo(px + a * 50, py - 90, px + a * 55, py - 50);
          ctx.quadraticCurveTo(px + a * 20, py - 75, px + 5, py - 70);
          ctx.fill();
        }
      });
      return;
    }

    if (venueId === "sky") {
      const sky = ctx.createLinearGradient(0, 0, 0, COURT_H);
      sky.addColorStop(0, "#87ceeb");
      sky.addColorStop(0.4, "#cceeff");
      sky.addColorStop(1, "#ffffff");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, COURT_W, COURT_H);
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      [[100, 80, 60], [300, 120, 80], [550, 70, 70], [720, 140, 50]].forEach(([x, y, w]) => {
        ctx.beginPath();
        ctx.ellipse(x, y, w, w * 0.35, 0, 0, Math.PI * 2);
        ctx.ellipse(x - w * 0.4, y + 8, w * 0.55, w * 0.28, 0, 0, Math.PI * 2);
        ctx.ellipse(x + w * 0.45, y + 6, w * 0.5, w * 0.26, 0, 0, Math.PI * 2);
        ctx.fill();
      });
      // floating platform shadow/cloud under court
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.beginPath();
      ctx.ellipse(400, 455, 280, 28, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#dfeaf5";
      ctx.fillRect(120, 420, 560, 40);
      ctx.strokeStyle = "#9bb4c8";
      ctx.lineWidth = 2;
      ctx.strokeRect(120, 420, 560, 40);
      return;
    }

    if (venueId === "skyscraper") {
      const sky = ctx.createLinearGradient(0, 0, 0, COURT_H);
      sky.addColorStop(0, "#0b1026");
      sky.addColorStop(0.5, "#1a2450");
      sky.addColorStop(1, "#2a1840");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, COURT_W, COURT_H);
      // distant city
      const buildings = [
        [0, 180, 70], [70, 140, 55], [125, 200, 80], [205, 120, 60],
        [265, 170, 50], [520, 150, 65], [585, 110, 70], [655, 190, 55],
        [710, 130, 90]
      ];
      buildings.forEach(([x, top, w], idx) => {
        ctx.fillStyle = idx % 2 === 0 ? "#1c2338" : "#141a2c";
        ctx.fillRect(x, top, w, COURT_H - top);
        ctx.fillStyle = "#ffe566";
        for (let wy = top + 10; wy < COURT_H - 20; wy += 18) {
          for (let wx = x + 8; wx < x + w - 8; wx += 14) {
            if ((wx + wy) % 28 !== 0) ctx.fillRect(wx, wy, 6, 8);
          }
        }
      });
      // rooftop ledge
      ctx.fillStyle = "#4a5568";
      ctx.fillRect(0, 415, COURT_W, 65);
      ctx.fillStyle = "#718096";
      ctx.fillRect(0, 415, COURT_W, 12);
      ctx.fillStyle = "#2d3748";
      for (let i = 40; i < COURT_W; i += 80) {
        ctx.fillRect(i, 400, 8, 20);
      }
      // moon
      ctx.fillStyle = "#f5f5dc";
      ctx.beginPath();
      ctx.arc(700, 60, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#0b1026";
      ctx.beginPath();
      ctx.arc(712, 52, 22, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    // default gym
    const g = ctx.createLinearGradient(0, 0, 0, COURT_H);
    g.addColorStop(0, "#245c34");
    g.addColorStop(1, "#163f24");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, COURT_W, COURT_H);
    ctx.fillStyle = "#6e4320";
    ctx.fillRect(0, 430, COURT_W, 50);
    ctx.fillStyle = "#8a572c";
    for (let i = 0; i < COURT_W; i += 40) {
      ctx.fillRect(i, 430, 20, 50);
    }
    ctx.fillStyle = "#0a1a10";
    for (let i = 0; i < 24; i++) {
      const x = 20 + i * 32;
      ctx.fillRect(x, 8, 18, 22);
      ctx.fillRect(x + 4, 0, 10, 10);
    }
  }

  function drawCourtSurface(venueId) {
    const floors = {
      gym: { fill: "#1f6b38", line: "#f4e9c8", key: "#1a5c2e" },
      outside: { fill: "#c4a574", line: "#fff8e7", key: "#b8956a" },
      expensive: { fill: "#1a1a2e", line: "#d4af37", key: "#12121f" },
      island: { fill: "#e8c56a", line: "#ffffff", key: "#d4b45a" },
      sky: { fill: "#9ec9e8", line: "#ffffff", key: "#7eb0d4" },
      skyscraper: { fill: "#2d3748", line: "#63b3ed", key: "#1a202c" }
    };
    const floor = floors[venueId] || floors.gym;

    ctx.fillStyle = floor.fill;
    ctx.globalAlpha = venueId === "gym" ? 0 : 0.92;
    if (venueId !== "gym") {
      ctx.fillRect(80, 140, 640, 300);
    }
    ctx.globalAlpha = 1;

    ctx.strokeStyle = floor.line;
    ctx.lineWidth = 3;
    ctx.strokeRect(300, 140, 200, 290);
    ctx.beginPath();
    ctx.arc(400, 430, 120, Math.PI, 0);
    ctx.stroke();

    // center hash
    ctx.beginPath();
    ctx.moveTo(290, 285);
    ctx.lineTo(510, 285);
    ctx.stroke();
  }

  function drawHoop() {
    ctx.fillStyle = "#dfe8ef";
    ctx.fillRect(360, 48, 80, 10);
    ctx.strokeStyle = "#e63946";
    ctx.lineWidth = 3;
    ctx.strokeRect(375, 55, 50, 28);

    ctx.strokeStyle = "#ff7a18";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(hoop.x, hoop.y, hoop.r, 0.15, Math.PI - 0.15);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255,255,255,0.75)";
    ctx.lineWidth = 1.5;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(hoop.x + i * 7, hoop.y + 2);
      ctx.lineTo(hoop.x + i * 4, hoop.y + 34);
      ctx.stroke();
    }
  }

  function drawCourt() {
    const venue = getVenue();
    drawBackdrop(venue.id);
    drawCourtSurface(venue.id);
    drawHoop();
  }

  function drawPlayer() {
    const x = player.x;
    const y = player.y;
    const f = player.facing;
    const jersey = currentPlayer.jerseyColor;
    const numColor = currentPlayer.numberColor;

    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(x, y + 8, 22, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // shorts (darker jersey)
    ctx.fillStyle = "#111";
    ctx.fillRect(x - 12, y - 18, 10, 24);
    ctx.fillRect(x + 2, y - 18, 10, 24);
    ctx.fillStyle = jersey;
    ctx.fillRect(x - 13, y - 22, 26, 8);

    // torso / jersey
    ctx.fillStyle = jersey;
    ctx.fillRect(x - 14, y - 48, 28, 32);
    ctx.fillStyle = numColor;
    ctx.font = "bold 11px monospace";
    ctx.textAlign = "center";
    ctx.fillText(jerseyNumber(currentPlayer.number), x, y - 26);

    // head
    ctx.fillStyle = "#f1c27d";
    ctx.fillRect(x - 10, y - 68, 20, 20);

    // arm
    ctx.fillStyle = "#f1c27d";
    ctx.fillRect(x + f * 14 - 4, y - 46, 8, charging ? 10 : 22);

    if (charging && !ball) {
      drawBallSprite(x + f * 18, y - 52, 0);
    }
  }

  function drawBallSprite(x, y, spin) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(spin);
    ctx.fillStyle = "#ff7a18";
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#5a2300";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.moveTo(-10, 0);
    ctx.lineTo(10, 0);
    ctx.moveTo(0, -10);
    ctx.lineTo(0, 10);
    ctx.stroke();
    ctx.restore();
  }

  function drawFeedback() {
    if (feedbackTimer <= 0 || !feedback) return;
    ctx.fillStyle = feedback.includes("SWISH") || feedback.includes("PERFECT")
      ? "#39ff14"
      : feedback.includes("MISS") || feedback.includes("BRICK") || feedback.includes("NO") || feedback.includes("AIR")
        ? "#e63946"
        : "#ffe566";
    ctx.font = "16px 'Press Start 2P', monospace";
    ctx.textAlign = "center";
    ctx.fillText(feedback, COURT_W / 2, 200);
  }

  function draw() {
    drawCourt();
    drawPlayer();
    if (ball) drawBallSprite(ball.x, ball.y, ball.spin);
    drawFeedback();

    ctx.fillStyle = "rgba(255,255,255,0.04)";
    for (let y = 0; y < COURT_H; y += 4) {
      ctx.fillRect(0, y, COURT_W, 1);
    }
  }

  function loop(ts) {
    const dt = Math.min(0.033, (ts - lastTs) / 1000 || 0);
    lastTs = ts;

    if (playing && !drafting) {
      draftCountdown = Math.max(0, (draftEndsAt - ts) / 1000);
      draftTimerEl.textContent = String(Math.max(0, Math.ceil(draftCountdown)));
      updatePlayer(dt);
      updateMeter(dt);
      updateBall(dt);
      if (feedbackTimer > 0) feedbackTimer -= dt;

      if (lives > 0 && draftCountdown <= 0 && !ball) {
        openDraft();
      }
    }

    draw();
    if (playing || drafting) {
      animId = requestAnimationFrame(loop);
    }
  }

  function onKeyDown(e) {
    keys.add(e.key);
    if (e.code === "Space") {
      e.preventDefault();
      if (!playing && !drafting && !overlay.classList.contains("hidden") && !titleScreen.classList.contains("hidden")) {
        startGame();
        return;
      }
      if (!playing && !drafting && !gameOverScreen.classList.contains("hidden")) {
        startGame();
        return;
      }
      if (!charging) beginCharge();
    }
  }

  function onKeyUp(e) {
    keys.delete(e.key);
    if (e.code === "Space") {
      e.preventDefault();
      releaseShot();
    }
  }

  function init() {
    roster = buildRoster();
    currentPlayer = makePlayer(3, new Set(roster.map((p) => p.name)));
    starterInfoEl.textContent = `STARTING AS ${currentPlayer.name} #${jerseyNumber(currentPlayer.number)} ${starString(3)}`;
    syncHighScoreDisplays();
    updateHud();
    draw();

    document.getElementById("btn-start").addEventListener("click", startGame);
    document.getElementById("btn-restart").addEventListener("click", startGame);

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    canvas.addEventListener("mousedown", (e) => {
      e.preventDefault();
      beginCharge();
    });
    window.addEventListener("mouseup", () => releaseShot());
    canvas.addEventListener("touchstart", (e) => {
      e.preventDefault();
      beginCharge();
    }, { passive: false });
    window.addEventListener("touchend", () => releaseShot());
  }

  init();
})();
