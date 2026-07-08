/* =====================================================================
   CHAINBONE — a rogue-like domino deck-builder
   Vanilla JS, no dependencies. All state lives in S.
   ===================================================================== */
'use strict';

/* ---------------- utilities ---------------- */
const $ = (id) => document.getElementById(id);
let _uid = 1;
const uid = () => _uid++;
const rand = (n) => Math.floor(Math.random() * n);
const pick = (arr) => arr[rand(arr.length)];
const shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
function fmt(n) {
  if (!isFinite(n)) return '∞';
  if (Math.abs(n) >= 1e12) return n.toExponential(2);
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (Math.abs(n) >= 10000) return Math.round(n).toLocaleString('en-US');
  return String(Math.round(n * 100) / 100);
}
function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  $('toasts').appendChild(el);
  setTimeout(() => el.remove(), 2800);
}

/* ---------------- dominoes ---------------- */
// A domino has two ends: a (left as printed) and b. Each end has a pip value
// (0-9) and an operator used at a joint: 'mul' (default) or 'pow' (rare).
function makeDomino(a, b, opts = {}) {
  return {
    id: uid(),
    a, b,
    aOp: opts.aOp || 'mul',
    bOp: opts.bOp || 'mul',
    material: opts.material || 'plain', // plain | gold | crystal
    seal: opts.seal || null, // null | 'ruby' | 'gold' | 'azure' | 'amber'
    aWild: !!opts.aWild, // wild ends copy the pip value they touch
    bWild: !!opts.bWild,
  };
}
// Power and wild ends are LEGENDARY and exclusive: such a domino cannot be
// duplicated, the legendary end's pips are locked, it cannot hold a seal,
// and a domino carries at most ONE legendary end.
const isPowered = (d) => d.aOp === 'pow' || d.bOp === 'pow';
const isWild = (d) => d.aWild || d.bWild;
const isLegendaryMod = (d) => isPowered(d) || isWild(d);
// an end can gain pips only if it is neither powered nor wild
const canPipEnd = (d, end) => d[end] < 9 && d[end + 'Op'] !== 'pow' && !d[end + 'Wild'];

/* ---------------- seals ---------------- */
const SEALS = {
  ruby: { icon: '🔴', name: 'Ruby Seal', price: 6,
    desc: 'Every joint it touches retriggers — the joint\'s base value scores again.' },
  gold: { icon: '🟡', name: 'Gold Seal', price: 5,
    desc: 'Pays $2 every time it is played in a chain.' },
  azure: { icon: '🔵', name: 'Azure Seal', price: 7,
    desc: 'Returns to your hand after the chain scores instead of being consumed.' },
  amber: { icon: '🟠', name: 'Amber Seal', price: 4,
    desc: 'Guaranteed to be in your opening hand every round.' },
};
function startingPouch() {
  const pouch = [];
  for (let a = 0; a <= 6; a++)
    for (let b = a; b <= 6; b++) pouch.push(makeDomino(a, b)); // 28: full double-six set
  // two bonus bones to reach 30
  pouch.push(makeDomino(1 + rand(6), 1 + rand(6)));
  pouch.push(makeDomino(1 + rand(6), 1 + rand(6)));
  return pouch;
}
// effective end values/ops of a chain entry, respecting its flip
function ends(entry) {
  const d = entry.d;
  return entry.flipped
    ? { l: d.b, r: d.a, lOp: d.bOp, rOp: d.aOp, lWild: d.bWild, rWild: d.aWild }
    : { l: d.a, r: d.b, lOp: d.aOp, rOp: d.bOp, lWild: d.aWild, rWild: d.bWild };
}

/* ---------------- charms (the "Jokers") ---------------- */
const CHARMS = [
  { id: 'twin', icon: '🔥', name: 'Twin Flame', rarity: 'common', price: 5,
    desc: 'Joints where both touching ends show the same pips score double.' },
  { id: 'bookends', icon: '📚', name: 'Bookends', rarity: 'common', price: 4,
    desc: 'The two exposed outer ends score ×4.' },
  { id: 'blank', icon: '⬜', name: 'Blank Slate', rarity: 'uncommon', price: 5,
    desc: 'Ends with 0 pips count as 7.' },
  { id: 'even', icon: '⚖️', name: 'Even Steven', rarity: 'common', price: 4,
    desc: '+8 for every joint with an even result.' },
  { id: 'odd', icon: '🎭', name: 'Odd Rod', rarity: 'common', price: 4,
    desc: '+8 for every joint with an odd result.' },
  { id: 'high', icon: '🎯', name: 'High Roller', rarity: 'uncommon', price: 6,
    desc: 'Your highest-scoring joint is counted twice.' },
  { id: 'mini', icon: '🪶', name: 'Minimalist', rarity: 'uncommon', price: 5,
    desc: 'Chains of exactly 3 dominoes score +40.' },
  { id: 'snake', icon: '🐍', name: 'Snake Charmer', rarity: 'rare', price: 7,
    desc: 'If pip values never decrease left→right, the chain scores ×1.5.' },
  { id: 'digger', icon: '⛏️', name: 'Gold Digger', rarity: 'common', price: 5,
    desc: 'Earn $1 for each double (matching-ended) domino you play.' },
  { id: 'momentum', icon: '🎢', name: 'Momentum', rarity: 'uncommon', price: 6,
    desc: 'Each joint gains +4 for every joint to its left.' },
  { id: 'sixth', icon: '🕕', name: 'Sixth Sense', rarity: 'common', price: 5,
    desc: '+10 for every joint that touches a 6.' },
  { id: 'ball', icon: '🔮', name: 'Crystal Ball', rarity: 'rare', price: 7,
    desc: 'Crystal dominoes never shatter.' },
  { id: 'piggy', icon: '🐷', name: 'Piggy Bank', rarity: 'common', price: 4,
    desc: 'Earn $1 at round end for every unused discard.' },
  { id: 'survey', icon: '📏', name: 'Surveyor', rarity: 'common', price: 4,
    desc: '+5 for every domino in the played chain.' },
  { id: 'dice', icon: '🎲', name: 'Loaded Dice', rarity: 'uncommon', price: 6,
    desc: '1-in-3 chance each played chain scores ×2 (rolled when you play).' },
  { id: 'center', icon: '🎪', name: 'Centerpiece', rarity: 'rare', price: 7,
    desc: 'The second joint of every chain scores ×2.' },
  { id: 'ouro', icon: '♾️', name: 'Ouroboros', rarity: 'legendary', price: 12,
    desc: 'The chain bites its tail: the two exposed ends are also multiplied together and added as a phantom joint.' },
  { id: 'abs', icon: '🧿', name: 'Absolute', rarity: 'rare', price: 7,
    desc: 'Every end and joint scores its absolute value — cursed bones turn holy.' },
  { id: 'keystone', icon: '🗿', name: 'Keystone', rarity: 'legendary', price: 14,
    desc: '+1 chain slot while this sits on your shelf.' },
];
const MAX_CHARMS = 5;
const has = (id) => S.charms.some((c) => c.id === id);
// chain length: base (4, voucher-raised to 6) +1 while Keystone is shelved
const effChainSize = () => Math.min(7, S.chainSize + (has('keystone') ? 1 : 0));

/* ---------------- vouchers (the "Vouchers") ---------------- */
const VOUCHERS = [
  { id: 'table', icon: '🛋️', name: 'Long Table', price: 12,
    desc: '+1 chain slot (up to 6).',
    can: () => S.chainSize < 6, buy: () => { S.chainSize++; } },
  { id: 'pockets', icon: '👖', name: 'Deep Pockets', price: 8,
    desc: '+1 hand size (up to 10).',
    can: () => S.handSize < 10, buy: () => { S.handSize++; } },
  { id: 'play', icon: '🃏', name: 'Encore', price: 10,
    desc: '+1 play every round.',
    can: () => S.playsMax < 6, buy: () => { S.playsMax++; } },
  { id: 'wind', icon: '💨', name: 'Second Wind', price: 6,
    desc: '+1 discard every round.',
    can: () => S.discardsMax < 6, buy: () => { S.discardsMax++; } },
  { id: 'thumb', icon: '🌱', name: 'Green Thumb', price: 7,
    desc: 'Interest cap raised by $3.',
    can: () => S.interestCap < 14, buy: () => { S.interestCap += 3; } },
];

/* ---------------- bosses ---------------- */
const BOSSES = [
  { id: 'hinge', name: '🔒 Rusted Hinge', desc: 'Placed dominoes cannot be flipped this round.' },
  { id: 'censor', name: '🤐 The Censor', desc: 'The first joint of every chain scores 0.' },
  { id: 'heavy', name: '🏋️ Heavy Hand', desc: 'Only 2 plays this round.' },
  { id: 'tithe', name: '💸 The Tithe', desc: 'The goal is 25% higher.' },
];

/* ---------------- game state ---------------- */
let S = null;

function newRun() {
  S = {
    round: 0,
    money: 4,
    pouch: startingPouch(),
    charms: [],
    chainSize: 4,
    handSize: 7,
    playsMax: 3,
    discardsMax: 3,
    interestCap: 5,
    bestChain: 0,
    // per-round
    drawPile: [], hand: [], chain: [],
    playsLeft: 0, discardsLeft: 0, score: 0, goal: 0, boss: null,
    discardMode: false, discardSel: new Set(),
    shop: null, rerollCost: 2,
  };
  startRound(1);
  showScreen('game');
}

function goalFor(round, boss) {
  let g = 60 * Math.pow(1.35, round - 1);
  if (boss && boss.id === 'tithe') g *= 1.25;
  return Math.round(g / 5) * 5;
}

function startRound(round) {
  S.round = round;
  S.boss = round % 3 === 0 ? pick(BOSSES) : null;
  S.goal = goalFor(round, S.boss);
  S.playsLeft = S.boss && S.boss.id === 'heavy' ? 2 : S.playsMax;
  S.discardsLeft = S.discardsMax;
  S.score = 0;
  S.chain = Array(effChainSize()).fill(null);
  S.drawPile = shuffle(S.pouch);
  // amber-sealed dominoes are guaranteed in the opening hand
  const ambers = S.drawPile.filter((d) => d.seal === 'amber').slice(0, S.handSize);
  S.drawPile = S.drawPile.filter((d) => !ambers.includes(d));
  S.hand = ambers.concat(S.drawPile.splice(0, S.handSize - ambers.length));
  S.discardMode = false;
  S.discardSel.clear();
  render();
}

function refillHand() {
  while (S.hand.length < S.handSize && S.drawPile.length > 0) {
    S.hand.push(S.drawPile.shift());
  }
}

/* =====================================================================
   SCORING
   Chain (d1)(d2)...(dn) scores, per BIDMAS:
     leftEnd(d1) + joint(d1,d2) + ... + joint(dn-1,dn) + rightEnd(dn)
   where joint(x,y) = a×b normally, or a^b if either touching end is a
   power end (indices bind before multiplication — hence "rare").
   ===================================================================== */
function effVal(v) {
  return v === 0 && has('blank') ? 7 : v;
}
function scoreChain(entries, opts = {}) {
  const n = entries.length;
  const exprParts = [];
  const lines = []; // {label, amt} bonus rows for the breakdown
  const jointVals = [];
  let total = 0;
  let money = 0;

  const E = entries.map(ends);

  // resolve values: blank-slate 0→7, then wild ends copy the pip they touch.
  // At a joint a wild copies the opposing end; two facing wilds resonate as
  // 7s; an exposed wild copies its own domino's other end.
  const res = E.map((e) => ({ l: effVal(e.l), r: effVal(e.r) }));
  for (let i = 0; i < n - 1; i++) {
    const aW = E[i].rWild, bW = E[i + 1].lWild;
    if (aW && bW) { res[i].r = 7; res[i + 1].l = 7; }
    else if (aW) res[i].r = res[i + 1].l;
    else if (bW) res[i + 1].l = res[i].r;
  }
  if (E[0].lWild) res[0].l = E[0].rWild ? 7 : res[0].r;
  if (E[n - 1].rWild) res[n - 1].r = E[n - 1].lWild ? 7 : res[n - 1].l;

  const exprNum = (v) => (v < 0 ? `(${v})` : String(v));
  const absify = (v, what) => {
    if (has('abs') && v < 0) { lines.push({ label: `🧿 Absolute: ${what}`, amt: -2 * v }); return -v; }
    return v;
  };

  const rawFirst = res[0].l;
  const rawLast = res[n - 1].r;
  const firstVal = absify(rawFirst, 'left end');
  const lastVal = absify(rawLast, 'right end');

  // --- exposed left end ---
  let endL = firstVal;
  exprParts.push(exprNum(rawFirst));
  if (has('bookends')) { lines.push({ label: '📚 Bookends: left end ×4', amt: endL * 3 }); endL *= 4; }
  total += endL;

  // --- joints ---
  for (let i = 0; i < n - 1; i++) {
    const a = res[i].r;
    const b = res[i + 1].l;
    const isPow = E[i].rOp === 'pow' || E[i + 1].lOp === 'pow';
    let v = isPow ? Math.pow(a, b) : a * b;
    exprParts.push(`${exprNum(a)}${isPow ? '^' : '×'}${exprNum(b)}`);

    if (S.boss && S.boss.id === 'censor' && i === 0) {
      lines.push({ label: '🤐 The Censor silences the first joint', amt: -v });
      jointVals.push(0);
      continue; // censored: no bonuses either
    }
    v = absify(v, `joint ${i + 1}`);
    const base = v;
    // crystal material: each crystal participant doubles the joint
    let crystals = 0;
    if (entries[i].d.material === 'crystal') crystals++;
    if (entries[i + 1].d.material === 'crystal') crystals++;
    if (crystals) { const m = Math.pow(2, crystals); lines.push({ label: `💎 Crystal joint ×${m}`, amt: v * (m - 1) }); v *= m; }
    if (has('twin') && a === b) { lines.push({ label: '🔥 Twin Flame: matching joint ×2', amt: v }); v *= 2; }
    if (has('center') && i === 1) { lines.push({ label: '🎪 Centerpiece: 2nd joint ×2', amt: v }); v *= 2; }
    if (has('even') && base % 2 === 0) { lines.push({ label: '⚖️ Even Steven', amt: 8 }); v += 8; }
    if (has('odd') && base % 2 === 1) { lines.push({ label: '🎭 Odd Rod', amt: 8 }); v += 8; }
    if (has('sixth') && (a === 6 || b === 6)) { lines.push({ label: '🕕 Sixth Sense', amt: 10 }); v += 10; }
    if (has('momentum') && i > 0) { lines.push({ label: `🎢 Momentum (joint ${i + 1})`, amt: 4 * i }); v += 4 * i; }
    // ruby seals retrigger the joint's base value once per sealed participant
    [entries[i], entries[i + 1]].forEach((e) => {
      if (e.d.seal === 'ruby') { lines.push({ label: '🔴 Ruby Seal: joint retriggered', amt: base }); v += base; }
    });
    jointVals.push(v);
    total += v;
  }

  // --- exposed right end ---
  let endR = lastVal;
  exprParts.push(exprNum(rawLast));
  if (has('bookends')) { lines.push({ label: '📚 Bookends: right end ×4', amt: endR * 3 }); endR *= 4; }
  total += endR;

  // --- chain-level effects ---
  if (has('ouro')) {
    const phantom = firstVal * lastVal;
    lines.push({ label: '♾️ Ouroboros: phantom joint (ends multiplied)', amt: phantom });
    total += phantom;
  }
  if (has('survey')) { lines.push({ label: '📏 Surveyor', amt: 5 * n }); total += 5 * n; }
  if (has('high') && jointVals.length) {
    const best = Math.max(...jointVals);
    lines.push({ label: '🎯 High Roller: best joint again', amt: best });
    total += best;
  }
  if (has('mini') && n === 3) { lines.push({ label: '🪶 Minimalist', amt: 40 }); total += 40; }
  if (has('snake')) {
    const seq = [];
    res.forEach((e) => { seq.push(e.l, e.r); });
    if (seq.every((v, i) => i === 0 || seq[i - 1] <= v)) {
      const bonus = total * 0.5;
      lines.push({ label: '🐍 Snake Charmer: chain ×1.5', amt: bonus });
      total += bonus;
    }
  }
  // rolled only when a chain is actually played, never in the preview
  if (has('dice') && opts.roll && Math.random() < 1 / 3) {
    lines.push({ label: '🎲 Loaded Dice: chain ×2!', amt: total });
    total *= 2;
  }
  total = Math.round(total);

  // --- money & materials ---
  const shattered = [];
  entries.forEach((e) => {
    if (e.d.material === 'gold') money++;
    if (e.d.seal === 'gold') money += 2;
    if (has('digger') && e.d.a === e.d.b) money++;
    if (e.d.material === 'crystal' && !has('ball') && Math.random() < 0.25) shattered.push(e.d);
  });

  return { total, expr: exprParts.join(' + '), lines, money, shattered };
}

/* =====================================================================
   RENDERING
   ===================================================================== */
const PIP_CELLS = { 0: [], 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };

function halfEl(val, op, side, wild) {
  const half = document.createElement('div');
  half.className = `half ${side}`;
  if (wild) {
    const num = document.createElement('div');
    num.className = 'numval wild';
    num.textContent = '★';
    num.title = 'Wild end: copies the pip value it touches';
    half.appendChild(num);
  } else if (val >= 0 && val <= 6) {
    for (let cell = 0; cell < 9; cell++) {
      const spot = document.createElement('div');
      if (PIP_CELLS[val].includes(cell)) spot.className = 'pip';
      spot.style.gridArea = `${Math.floor(cell / 3) + 1} / ${(cell % 3) + 1}`;
      half.appendChild(spot);
    }
  } else {
    const num = document.createElement('div');
    num.className = 'numval' + (val < 0 ? ' neg' : '');
    num.textContent = val;
    half.appendChild(num);
  }
  if (op === 'pow') {
    const badge = document.createElement('span');
    badge.className = 'op-badge';
    badge.textContent = '^';
    badge.title = 'Power end: joints touching this end score a^b';
    half.appendChild(badge);
  }
  return half;
}

function dominoEl(d, { flipped = false, small = false } = {}) {
  const el = document.createElement('div');
  el.className = 'domino' + (small ? ' small' : '') + (d.material !== 'plain' ? ` mat-${d.material}` : '');
  const l = flipped ? d.b : d.a, r = flipped ? d.a : d.b;
  const lOp = flipped ? d.bOp : d.aOp, rOp = flipped ? d.aOp : d.bOp;
  const lW = flipped ? d.bWild : d.aWild, rW = flipped ? d.aWild : d.bWild;
  el.appendChild(halfEl(l, lOp, 'left', lW));
  el.appendChild(halfEl(r, rOp, 'right', rW));
  if (d.seal) {
    const dot = document.createElement('span');
    dot.className = `seal-dot seal-${d.seal}`;
    dot.title = `${SEALS[d.seal].name}: ${SEALS[d.seal].desc}`;
    el.appendChild(dot);
  }
  return el;
}

function showScreen(name) {
  $('screen-menu').classList.toggle('hidden', name !== 'menu');
  $('screen-game').classList.toggle('hidden', name !== 'game');
}

function render() {
  // topbar
  $('hud-round').textContent = S.round;
  $('hud-score').textContent = fmt(S.score);
  $('hud-goal').textContent = fmt(S.goal);
  $('hud-money').textContent = '$' + S.money;
  $('hud-plays').textContent = S.playsLeft;
  $('hud-discards').textContent = S.discardsLeft;
  $('hud-pouch').textContent = S.pouch.length;
  $('goalbar-fill').style.width = Math.min(100, (S.score / S.goal) * 100) + '%';

  const bb = $('boss-banner');
  if (S.boss) {
    bb.textContent = `BOSS — ${S.boss.name}: ${S.boss.desc}`;
    bb.classList.remove('hidden');
  } else bb.classList.add('hidden');

  renderCharms();
  renderChain();
  renderHand();
  renderPreview();
}

function renderCharms() {
  const shelf = $('charm-shelf');
  shelf.innerHTML = '';
  S.charms.forEach((c) => {
    const el = document.createElement('div');
    el.className = 'charm';
    el.tabIndex = 0;
    el.innerHTML = `<span class="charm-icon">${c.icon}</span><span>${c.name}</span><span class="tip">${c.desc}</span>`;
    shelf.appendChild(el);
  });
  if (S.charms.length === 0) {
    const el = document.createElement('div');
    el.style.cssText = 'color:var(--muted);font-size:0.8rem;align-self:center;';
    el.textContent = `Charm shelf empty (0/${MAX_CHARMS}) — visit the shop!`;
    shelf.appendChild(el);
  }
}

function renderChain() {
  const area = $('chain-area');
  area.innerHTML = '';
  S.chain.forEach((entry, i) => {
    const slot = document.createElement('div');
    slot.className = 'chain-slot' + (entry ? ' filled' : '');
    if (entry) {
      const del = document.createElement('button');
      del.className = 'slot-remove';
      del.textContent = '×';
      del.title = 'Return to hand';
      del.onclick = (ev) => { ev.stopPropagation(); returnToHand(i); };
      slot.appendChild(del);
      const dEl = dominoEl(entry.d, { flipped: entry.flipped });
      dEl.style.cursor = 'pointer';
      dEl.title = 'Tap to flip';
      dEl.onclick = () => flipSlot(i);
      slot.appendChild(dEl);
    } else {
      slot.textContent = i === 0 ? 'start' : '· · ·';
    }
    area.appendChild(slot);
  });

  const placed = S.chain.filter(Boolean).length;
  $('btn-play').disabled = placed < 2 || S.playsLeft <= 0;
  $('btn-clear').disabled = placed === 0;
}

function renderHand() {
  const handEl = $('hand');
  handEl.innerHTML = '';
  S.hand.forEach((d) => {
    const el = dominoEl(d);
    if (S.discardMode) {
      if (S.discardSel.has(d.id)) el.classList.add('sel-discard');
      el.onclick = () => toggleDiscardSel(d.id);
    } else {
      el.onclick = () => placeFromHand(d.id);
    }
    handEl.appendChild(el);
  });

  $('btn-discard').classList.toggle('hidden', S.discardMode);
  $('btn-discard').disabled = S.discardsLeft <= 0 || S.hand.length === 0;
  $('btn-discard-confirm').classList.toggle('hidden', !S.discardMode);
  $('btn-discard-confirm').textContent = `Confirm (${S.discardSel.size})`;
  $('btn-discard-confirm').disabled = S.discardSel.size === 0;
  $('btn-discard-cancel').classList.toggle('hidden', !S.discardMode);
  $('hand-hint').textContent = S.discardMode
    ? `Select up to 5 dominoes to discard (${S.discardsLeft} discards left)`
    : 'Tap a domino to add it to the chain · tap a placed domino to flip it';
}

function renderPreview() {
  const el = $('expr-preview');
  const entries = S.chain.filter(Boolean);
  if (entries.length < 2) {
    el.innerHTML = '<span style="color:var(--muted)">Place at least 2 dominoes to form a chain</span>';
    return;
  }
  const r = scoreChain(entries);
  const bonus = r.lines.length ? `<span class="expr-bonus">${r.lines.length} bonus effect${r.lines.length > 1 ? 's' : ''} apply</span>` : '';
  el.innerHTML = `${r.expr} = <span class="expr-total">${fmt(r.total)}</span>${bonus}`;
}

/* =====================================================================
   PLAY ACTIONS
   ===================================================================== */
function placeFromHand(id) {
  const slotIdx = S.chain.indexOf(null);
  if (slotIdx === -1) { toast('Chain is full'); return; }
  const hi = S.hand.findIndex((d) => d.id === id);
  if (hi === -1) return;
  const [d] = S.hand.splice(hi, 1);
  S.chain[slotIdx] = { d, flipped: false };
  render();
}

function returnToHand(slotIdx) {
  const entry = S.chain[slotIdx];
  if (!entry) return;
  S.hand.push(entry.d);
  // close the gap so the chain stays contiguous left-to-right
  S.chain.splice(slotIdx, 1);
  S.chain.push(null);
  render();
}

function flipSlot(slotIdx) {
  if (S.boss && S.boss.id === 'hinge') { toast('🔒 Rusted Hinge: flipping is disabled this round'); return; }
  const entry = S.chain[slotIdx];
  if (!entry) return;
  entry.flipped = !entry.flipped;
  render();
}

function clearChain() {
  S.chain.forEach((entry) => { if (entry) S.hand.push(entry.d); });
  S.chain = Array(S.chain.length).fill(null);
  render();
}

function toggleDiscardMode(on) {
  S.discardMode = on;
  S.discardSel.clear();
  render();
}
function toggleDiscardSel(id) {
  if (S.discardSel.has(id)) S.discardSel.delete(id);
  else if (S.discardSel.size < 5) S.discardSel.add(id);
  else toast('Max 5 per discard');
  render();
}
function confirmDiscard() {
  if (S.discardSel.size === 0) return;
  S.hand = S.hand.filter((d) => !S.discardSel.has(d.id));
  S.discardsLeft--;
  S.discardMode = false;
  S.discardSel.clear();
  refillHand();
  render();
}

function playChain() {
  const entries = S.chain.filter(Boolean);
  if (entries.length < 2 || S.playsLeft <= 0) return;

  const r = scoreChain(entries, { roll: true });
  S.playsLeft--;
  S.score += r.total;
  S.bestChain = Math.max(S.bestChain, r.total);
  if (r.money > 0) { S.money += r.money; }
  r.shattered.forEach((d) => {
    S.pouch = S.pouch.filter((p) => p.id !== d.id);
  });

  // consume played dominoes for the round — but azure-sealed ones come home
  entries.forEach((e) => {
    if (e.d.seal === 'azure' && !r.shattered.includes(e.d)) S.hand.push(e.d);
  });
  S.chain = Array(S.chain.length).fill(null);
  refillHand();

  showBreakdown(r);
}

function showBreakdown(r) {
  $('bd-expr').textContent = r.expr;
  const linesEl = $('bd-lines');
  linesEl.innerHTML = '';
  r.lines.forEach((ln) => {
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = `<span>${ln.label}</span><span>${ln.amt >= 0 ? '+' : ''}${fmt(ln.amt)}</span>`;
    linesEl.appendChild(row);
  });
  if (r.money > 0) {
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = `<span>💰 Earnings</span><span>+$${r.money}</span>`;
    linesEl.appendChild(row);
  }
  r.shattered.forEach((d) => {
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = `<span>💥 Crystal (${d.a}|${d.b}) shattered!</span><span></span>`;
    linesEl.appendChild(row);
  });
  $('bd-total').textContent = fmt(r.total);
  $('modal-breakdown').classList.remove('hidden');
}

function afterBreakdown() {
  $('modal-breakdown').classList.add('hidden');
  render();
  const scoreEl = $('hud-score');
  scoreEl.classList.remove('scorepop');
  void scoreEl.offsetWidth;
  scoreEl.classList.add('scorepop');

  if (S.score >= S.goal) { winRound(); return; }
  if (S.playsLeft <= 0) { gameOver('Out of plays — the goal stood unbroken.'); return; }
  if (S.hand.length < 2) { gameOver('The pouch ran dry — no chain can be formed.'); return; }
}

/* =====================================================================
   ROUND END / ECONOMY
   ===================================================================== */
// Skip-the-shop tags, Balatro skip-blind style: forgo the Bazaar for a prize
function rollSkipOffer() {
  const opts = [
    { id: 'cash', label: '💰 Windfall Tag: +$10' },
    { id: 'charm', label: '🎗️ Charm Tag: a free random charm' },
    { id: 'smith', label: '🔨 Smith Tag: two random dominoes get +1/+1' },
  ];
  let o = pick(opts);
  if (o.id === 'charm' && S.charms.length >= MAX_CHARMS) o = opts[0];
  return o;
}

function applySkipOffer() {
  const o = S.skipOffer;
  if (o.id === 'cash') { S.money += 10; toast('💰 +$10'); }
  else if (o.id === 'charm') {
    const pool = CHARMS.filter((c) => !S.charms.some((x) => x.id === c.id));
    const c = weightedCharms(pool, 1)[0];
    if (c) { S.charms.push(c); toast(`${c.icon} ${c.name} joins your shelf!`); }
    else { S.money += 10; toast('💰 +$10 (no charms left)'); }
  } else if (o.id === 'smith') {
    for (let k = 0; k < 2; k++) {
      const eligible = S.pouch.filter((d) => canPipEnd(d, 'a') || canPipEnd(d, 'b'));
      if (!eligible.length) break;
      const d = pick(eligible);
      if (canPipEnd(d, 'a')) d.a += 1;
      if (canPipEnd(d, 'b')) d.b += 1;
      toast(`🔨 (${d.a}|${d.b}) upgraded`);
    }
  }
  $('overlay-roundend').classList.add('hidden');
  startRound(S.round + 1);
}

function winRound() {
  const base = 4;
  const playBonus = S.playsLeft;
  const interest = Math.min(S.interestCap, Math.floor(S.money / 5));
  const piggy = has('piggy') ? S.discardsLeft : 0;
  const bounty = S.boss ? 4 : 0;
  const rows = [
    ['Round cleared', `$${base}`],
    [`Unused plays ×${playBonus}`, `$${playBonus}`],
    [`Interest ($1 per $5, cap $${S.interestCap})`, `$${interest}`],
  ];
  if (piggy) rows.push([`🐷 Piggy Bank: unused discards ×${S.discardsLeft}`, `$${piggy}`]);
  if (bounty) rows.push(['👑 Boss bounty', `$${bounty}`]);
  S.money += base + playBonus + interest + piggy + bounty;
  S.skipOffer = rollSkipOffer();
  $('btn-skip-shop').textContent = `Skip the Bazaar — ${S.skipOffer.label}`;
  $('re-round').textContent = S.round;
  const bd = $('re-breakdown');
  bd.innerHTML = '';
  rows.forEach(([label, amt]) => {
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = `<span>${label}</span><span class="money">${amt}</span>`;
    bd.appendChild(row);
  });
  const totalRow = document.createElement('div');
  totalRow.className = 'row total';
  totalRow.innerHTML = `<span>Wallet</span><span class="money">$${S.money}</span>`;
  bd.appendChild(totalRow);
  $('overlay-roundend').classList.remove('hidden');
}

function gameOver(reason) {
  const best = Number(localStorage.getItem('chainbone-best') || 0);
  if (S.round > best) localStorage.setItem('chainbone-best', String(S.round));
  $('go-stats').innerHTML = `
    <div>${reason}</div>
    <div>Reached round <strong>${S.round}</strong></div>
    <div>Best single chain: <strong>${fmt(S.bestChain)}</strong></div>
    <div>Pouch size: <strong>${S.pouch.length}</strong> · Charms: <strong>${S.charms.length}</strong></div>`;
  $('overlay-gameover').classList.remove('hidden');
}

/* =====================================================================
   SHOP
   ===================================================================== */
function randomShopDomino() {
  const roll = Math.random();
  if (roll < 0.12) {
    // cursed bone: big pips, but at least one end is negative
    const a = -(1 + rand(9));
    const b = rand(2) ? 1 + rand(9) : -(1 + rand(9));
    return { d: makeDomino(a, b), price: 1 };
  }
  const material = roll < 0.26 ? 'gold' : roll < 0.4 ? 'crystal' : 'plain';
  const d = makeDomino(rand(7), rand(7), { material });
  const price = 3 + (material === 'plain' ? 0 : 3) + (d.a + d.b >= 9 ? 1 : 0);
  return { d, price };
}

// rarity-weighted sampling without replacement: legendaries are genuinely rare
const RARITY_WEIGHT = { common: 6, uncommon: 3, rare: 1.5, legendary: 0.5 };
function weightedCharms(pool, n) {
  const p = pool.slice();
  const out = [];
  while (out.length < n && p.length) {
    const totalW = p.reduce((s, c) => s + RARITY_WEIGHT[c.rarity], 0);
    let r = Math.random() * totalW;
    let idx = 0;
    for (; idx < p.length - 1; idx++) {
      r -= RARITY_WEIGHT[p[idx].rarity];
      if (r <= 0) break;
    }
    out.push(p.splice(idx, 1)[0]);
  }
  return out;
}

function generateShop() {
  const owned = new Set(S.charms.map((c) => c.id));
  const charmPool = CHARMS.filter((c) => !owned.has(c.id));
  const voucherPool = shuffle(VOUCHERS.filter((v) => v.can()));
  S.shop = {
    charms: weightedCharms(charmPool, 2).map((c) => ({ c, sold: false })),
    dominoes: [randomShopDomino(), randomShopDomino()].map((o) => ({ ...o, sold: false })),
    voucher: voucherPool.length ? { v: voucherPool[0], sold: false } : null,
    powerBrush: Math.random() < 0.15,  // LEGENDARY service: rarely in stock
    chameleon: Math.random() < 0.12,   // LEGENDARY service: rarely in stock
    sealColor: pick(Object.keys(SEALS)), // one seal colour per shop
    services: { pip: false, pip1: false, dup: false, cull: false, brush: false, chamel: false, seal: false, pack: false, cpack: false }, // sold flags
  };
}

function openShop() {
  $('overlay-roundend').classList.add('hidden');
  S.rerollCost = 2;
  generateShop();
  renderShop();
  $('overlay-shop').classList.remove('hidden');
}

function spend(cost) {
  if (S.money < cost) { toast('Not enough money'); return false; }
  S.money -= cost;
  return true;
}

function renderShop() {
  $('shop-money').textContent = '$' + S.money;
  $('btn-reroll').textContent = `Reroll $${S.rerollCost}`;
  const body = $('shop-body');
  body.innerHTML = '';

  const section = (title) => {
    const sec = document.createElement('div');
    sec.className = 'shop-section';
    sec.innerHTML = `<h3>${title}</h3>`;
    const row = document.createElement('div');
    row.className = 'shop-row';
    sec.appendChild(row);
    body.appendChild(sec);
    return row;
  };
  const item = (row, { name, desc, price, rarity, sold, disabled, onBuy, dominoNode }) => {
    const el = document.createElement('div');
    el.className = 'shop-item' + (sold ? ' sold' : '');
    if (rarity) {
      const r = document.createElement('span');
      r.className = `si-rarity ${rarity}`;
      r.textContent = rarity;
      el.appendChild(r);
    }
    const nm = document.createElement('span');
    nm.className = 'si-name';
    nm.textContent = name;
    el.appendChild(nm);
    if (dominoNode) el.appendChild(dominoNode);
    const ds = document.createElement('span');
    ds.className = 'si-desc';
    ds.textContent = desc;
    el.appendChild(ds);
    const btn = document.createElement('button');
    btn.className = 'btn btn-small btn-gold';
    btn.textContent = sold ? 'Sold' : `Buy $${price}`;
    btn.disabled = sold || disabled || S.money < price;
    btn.onclick = onBuy;
    el.appendChild(btn);
    row.appendChild(el);
    return el;
  };

  // --- charms ---
  const charmRow = section(`Charms (${S.charms.length}/${MAX_CHARMS} shelf)`);
  S.shop.charms.forEach((offer, i) => {
    item(charmRow, {
      name: `${offer.c.icon} ${offer.c.name}`, desc: offer.c.desc, price: offer.c.price,
      rarity: offer.c.rarity, sold: offer.sold,
      disabled: S.charms.length >= MAX_CHARMS,
      onBuy: () => {
        if (S.charms.length >= MAX_CHARMS) { toast('Charm shelf is full — sell one first'); return; }
        if (!spend(offer.c.price)) return;
        S.charms.push(offer.c);
        offer.sold = true;
        renderShop();
      },
    });
  });
  if (S.shop.charms.length === 0) charmRow.innerHTML = '<span style="color:var(--muted);font-size:0.85rem;">You own every charm!</span>';

  // --- owned charms (sellable) ---
  if (S.charms.length) {
    const ownRow = section('Your charms — sell for half');
    S.charms.forEach((c, i) => {
      const wrap = document.createElement('div');
      wrap.className = 'owned-charm-row';
      const sellPrice = Math.floor(c.price / 2);
      wrap.innerHTML = `<span>${c.icon} ${c.name}</span>`;
      const btn = document.createElement('button');
      btn.className = 'btn btn-small';
      btn.textContent = `Sell $${sellPrice}`;
      btn.onclick = () => { S.money += sellPrice; S.charms.splice(i, 1); renderShop(); };
      wrap.appendChild(btn);
      ownRow.appendChild(wrap);
    });
  }

  // --- dominoes ---
  const domRow = section('Fresh Bones');
  S.shop.dominoes.forEach((offer) => {
    let matName = offer.d.material === 'plain' ? '' : offer.d.material === 'gold' ? 'Gold — pays $1 when played. ' : 'Crystal — doubles its joints, may shatter. ';
    if (offer.d.a < 0 || offer.d.b < 0) matName = 'CURSED — negative pips subtract… unless you go Absolute. ';
    item(domRow, {
      name: `Domino (${offer.d.a}|${offer.d.b})`,
      desc: matName + 'Added to your pouch.',
      price: offer.price, sold: offer.sold,
      dominoNode: dominoEl(offer.d, { small: true }),
      onBuy: () => {
        if (!spend(offer.price)) return;
        S.pouch.push(offer.d);
        offer.sold = true;
        renderShop();
      },
    });
  });

  // --- services ---
  const svcRow = section('Workbench');
  item(svcRow, {
    name: '🔨 Pip Up', desc: '+1 pip to BOTH ends of a chosen domino (max 9). Power ends are locked.', price: 3,
    sold: S.shop.services.pip,
    onBuy: () => pickDomino('Pip Up: choose a domino', 'Non-legendary ends gain +1 pip',
      (d) => canPipEnd(d, 'a') || canPipEnd(d, 'b'), (d) => {
      if (!spend(3)) return;
      if (canPipEnd(d, 'a')) d.a += 1;
      if (canPipEnd(d, 'b')) d.b += 1;
      S.shop.services.pip = true;
      toast(`Upgraded to (${d.a}|${d.b})`);
      renderShop();
    }),
  });
  item(svcRow, {
    name: '🔧 Precision Pip', desc: '+1 pip to ONE chosen end (max 9). Power ends are locked.', price: 2,
    sold: S.shop.services.pip1,
    onBuy: () => pickEnd('Precision Pip: tap the end to upgrade', canPipEnd, (d, end) => {
      if (!spend(2)) return;
      d[end] += 1;
      S.shop.services.pip1 = true;
      toast(`Upgraded to (${d.a}|${d.b})`);
      renderShop();
    }),
  });
  if (S.shop.powerBrush) {
    item(svcRow, {
      name: '⚡ Power Brush',
      desc: 'LEGENDARY: convert one end from × to ^. A powered domino cannot be duplicated, pip-upgraded on that end, or sealed — and can hold only one power end.',
      price: 12, rarity: 'legendary', sold: S.shop.services.brush,
      onBuy: () => pickEnd('Power Brush: tap the end to empower', (d) => !isPowered(d), (d, end) => {
        if (!spend(12)) return;
        d[end + 'Op'] = 'pow';
        S.shop.services.brush = true;
        toast(`(${d.a}|${d.b}) now carries a power end!`);
        renderShop();
      }),
    });
  }
  if (S.shop.chameleon) {
    item(svcRow, {
      name: '🦎 Chameleon Brush',
      desc: 'LEGENDARY: turn one end WILD — it copies the pip value it touches (facing wilds resonate as 7s; exposed wilds mirror their own domino). Same exclusivity rules as power ends.',
      price: 12, rarity: 'legendary', sold: S.shop.services.chamel,
      onBuy: () => pickEnd('Chameleon Brush: tap the end to make wild', (d) => !isLegendaryMod(d), (d, end) => {
        if (!spend(12)) return;
        d[end + 'Wild'] = true;
        S.shop.services.chamel = true;
        toast('A wild end joins your pouch!');
        renderShop();
      }),
    });
  }
  {
    const sc = S.shop.sealColor;
    const sd = SEALS[sc];
    item(svcRow, {
      name: `${sd.icon} ${sd.name}`, desc: sd.desc + ' One seal per domino; legendary dominoes cannot be sealed.',
      price: sd.price, rarity: 'uncommon', sold: S.shop.services.seal,
      onBuy: () => pickDomino(`${sd.name}: choose a domino`, sd.desc,
        (d) => !d.seal && !isLegendaryMod(d), (d) => {
        if (!spend(sd.price)) return;
        d.seal = sc;
        S.shop.services.seal = true;
        toast(`(${d.a}|${d.b}) sealed!`);
        renderShop();
      }),
    });
  }
  item(svcRow, {
    name: '🪞 Duplicate', desc: 'Copy one domino — the pouch offers 10 at random. Power dominoes never appear.', price: 5,
    sold: S.shop.services.dup,
    onBuy: () => {
      const offer = shuffle(S.pouch.filter((d) => !isLegendaryMod(d))).slice(0, 10);
      pickDomino('Duplicate: the pouch offers these 10', 'A copy of your pick joins the pouch', () => true, (d) => {
        if (!spend(5)) return;
        S.pouch.push(makeDomino(d.a, d.b, { material: d.material, seal: d.seal }));
        S.shop.services.dup = true;
        toast(`Duplicated (${d.a}|${d.b})`);
        renderShop();
      }, offer);
    },
  });
  item(svcRow, {
    name: '🎁 Bone Pack', desc: 'Crack a pack of 3 random dominoes and keep ONE.', price: 4,
    sold: S.shop.services.pack,
    onBuy: () => {
      const packContents = [randomShopDomino().d, randomShopDomino().d, randomShopDomino().d];
      pickDomino('Bone Pack: keep one', 'The other two are lost', () => true, (d) => {
        if (!spend(4)) return;
        S.pouch.push(d);
        S.shop.services.pack = true;
        toast(`(${d.a}|${d.b}) joins your pouch`);
        renderShop();
      }, packContents);
    },
  });
  const cpackPool = CHARMS.filter((c) => !S.charms.some((x) => x.id === c.id));
  item(svcRow, {
    name: '🎴 Charm Pack', desc: 'Crack a pack of 3 random charms and keep ONE.', price: 6,
    sold: S.shop.services.cpack,
    disabled: S.charms.length >= MAX_CHARMS || cpackPool.length === 0,
    onBuy: () => {
      const packCharms = weightedCharms(cpackPool, 3);
      pickCharm('Charm Pack: keep one', 'The others return to the ether', packCharms, (c) => {
        if (!spend(6)) return;
        S.charms.push(c);
        S.shop.services.cpack = true;
        toast(`${c.icon} ${c.name} joins your shelf!`);
        renderShop();
      });
    },
  });
  item(svcRow, {
    name: '🗑️ Cull', desc: 'Remove a domino from your pouch for good (min pouch 8).', price: 3,
    sold: S.shop.services.cull, disabled: S.pouch.length <= 8,
    onBuy: () => pickDomino('Cull: choose a domino to remove', 'Gone forever — a thinner pouch draws better', () => true, (d) => {
      if (!spend(3)) return;
      S.pouch = S.pouch.filter((p) => p.id !== d.id);
      S.shop.services.cull = true;
      toast(`Removed (${d.a}|${d.b})`);
      renderShop();
    }),
  });

  // --- voucher ---
  if (S.shop.voucher) {
    const vRow = section('Voucher');
    const { v } = S.shop.voucher;
    item(vRow, {
      name: `${v.icon} ${v.name}`, desc: v.desc + ' Permanent for this run.', price: v.price,
      sold: S.shop.voucher.sold, disabled: !v.can(),
      onBuy: () => {
        if (!spend(v.price)) return;
        v.buy();
        S.shop.voucher.sold = true;
        toast(`${v.name} acquired!`);
        renderShop();
      },
    });
  }
}

function rerollShop() {
  if (!spend(S.rerollCost)) return;
  S.rerollCost += 1;
  generateShop();
  renderShop();
}

/* ---------------- pickers ---------------- */
let pickerCb = null;
function openPicker(title, sub) {
  $('picker-title').textContent = title;
  $('picker-sub').textContent = sub || '';
  $('picker-grid').innerHTML = '';
  $('modal-picker').classList.remove('hidden');
}
function closePicker() {
  $('modal-picker').classList.add('hidden');
  pickerCb = null;
}
function pickDomino(title, sub, eligible, cb, list) {
  openPicker(title, sub);
  const grid = $('picker-grid');
  (list || S.pouch).forEach((d) => {
    const el = dominoEl(d, { small: true });
    if (eligible(d)) {
      el.onclick = () => { closePicker(); cb(d); };
    } else {
      el.classList.add('dimmed');
    }
    grid.appendChild(el);
  });
}
function pickCharm(title, sub, charms, cb) {
  openPicker(title, sub);
  const grid = $('picker-grid');
  charms.forEach((c) => {
    const el = document.createElement('div');
    el.className = 'charm-card';
    el.innerHTML = `<span class="si-rarity ${c.rarity}">${c.rarity}</span><span class="cc-name">${c.icon} ${c.name}</span><span class="cc-desc">${c.desc}</span>`;
    el.onclick = () => { closePicker(); cb(c); };
    grid.appendChild(el);
  });
}

function pickEnd(title, eligible, cb) {
  openPicker(title, 'Tap the specific half of a domino');
  const grid = $('picker-grid');
  S.pouch.forEach((d) => {
    const el = dominoEl(d, { small: true });
    const halves = el.querySelectorAll('.half');
    [['a', halves[0]], ['b', halves[1]]].forEach(([end, halfNode]) => {
      if (eligible(d, end)) {
        halfNode.classList.add('pickable');
        halfNode.onclick = () => { closePicker(); cb(d, end); };
      }
    });
    grid.appendChild(el);
  });
}

/* ---------------- pouch viewer ---------------- */
function openPouch() {
  const inHand = new Set(S.hand.map((d) => d.id));
  const inChain = new Set(S.chain.filter(Boolean).map((e) => e.d.id));
  const inDraw = new Set(S.drawPile.map((d) => d.id));
  $('pouch-sub').textContent = `${S.pouch.length} dominoes · ${S.drawPile.length} still in the draw pile (dimmed = drawn or spent this round)`;
  const grid = $('pouch-grid');
  grid.innerHTML = '';
  S.pouch
    .slice()
    .sort((x, y) => (y.a + y.b) - (x.a + x.b))
    .forEach((d) => {
      const el = dominoEl(d, { small: true });
      if (!inDraw.has(d.id) && !inHand.has(d.id) && !inChain.has(d.id)) el.classList.add('dimmed');
      grid.appendChild(el);
    });
  $('modal-pouch').classList.remove('hidden');
}

/* =====================================================================
   WIRING
   ===================================================================== */
function bind() {
  $('btn-new-run').onclick = newRun;
  $('btn-restart').onclick = () => { $('overlay-gameover').classList.add('hidden'); newRun(); };
  $('btn-to-menu').onclick = () => { $('overlay-gameover').classList.add('hidden'); showMenu(); };

  $('btn-play').onclick = playChain;
  $('btn-clear').onclick = clearChain;
  $('btn-bd-ok').onclick = afterBreakdown;

  $('btn-discard').onclick = () => toggleDiscardMode(true);
  $('btn-discard-cancel').onclick = () => toggleDiscardMode(false);
  $('btn-discard-confirm').onclick = confirmDiscard;

  $('btn-to-shop').onclick = openShop;
  $('btn-skip-shop').onclick = applySkipOffer;
  $('btn-reroll').onclick = rerollShop;
  $('btn-next-round').onclick = () => {
    $('overlay-shop').classList.add('hidden');
    startRound(S.round + 1);
  };

  $('btn-pouch').onclick = openPouch;
  $('btn-pouch-close').onclick = () => $('modal-pouch').classList.add('hidden');
  $('btn-picker-cancel').onclick = closePicker;

  $('btn-help').onclick = () => $('modal-help').classList.remove('hidden');
  $('btn-menu-help').onclick = () => $('modal-help').classList.remove('hidden');
  $('btn-help-close').onclick = () => $('modal-help').classList.add('hidden');
}

function showMenu() {
  const best = Number(localStorage.getItem('chainbone-best') || 0);
  $('best-round').textContent = best > 0 ? `Best run: round ${best}` : '';
  showScreen('menu');
}

bind();
showMenu();

// debug/testing hook (harmless in production)
window.__CB = { getState: () => S, scoreChain, makeDomino, startRound, render };
