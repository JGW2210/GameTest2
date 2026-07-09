# Chainbone 🁫

A rogue-like domino deck-builder for the web, in the spirit of **Balatro** — but the deck
is a pouch of dominoes and the "hands" are left-to-right chains.

**No build step, no dependencies.** Open `index.html` in any browser, or serve the repo
with GitHub Pages / `python3 -m http.server`.

## Core loop

1. You start with a pouch of **30 dominoes** (a full double-six set plus two bonus bones).
2. Each round has a **score goal**. You draw a hand of 7 and place up to **4 dominoes**
   in a chain, left to right. **Tap a placed domino to flip it.**
3. **Scoring follows BIDMAS**: the two exposed outer ends are *added*, and every pair of
   touching ends is *multiplied*:

   ```
   (1|2)(3|4)(5|6)(6|1)  →  1 + 2×3 + 4×5 + 6×6 + 1  =  64
   ```

4. You get **3 plays** and **3 discards** per round. Breach the goal before your plays
   run out or the run ends.
5. Clearing a round pays out money (base + unused-play bonus + interest), spent in the
   **Bone Bazaar** between rounds. Goals scale ~1.35× per round; every 3rd round is a
   **boss** with a rule twist.

## The upgrade system (Balatro as the blueprint)

Balatro's genius is that every upgrade type touches a *different axis* of the score
formula and the deck. Chainbone maps each of those axes onto dominoes:

| Balatro concept | Chainbone equivalent | Axis it touches |
|---|---|---|
| Jokers | **Charms** (max 5 on the shelf, sellable for half; shop offers are steeply rarity-weighted) | Passive scoring rules |
| Planet cards | **Pip Up** on the workbench (+1/+1, legendary ends locked) | Raw numbers |
| Destroying cards | **Cull** on the workbench (thin the pouch, min 8) | Draw consistency |
| Buying cards | **Fresh Bones** — 2 dominoes per shop, sometimes gold/crystal/cursed | Deck composition |
| Everything else | **The Wheels of Fortune** — pay to spin, the wheel picks the prize (see below) | Consolidated RNG economy |
| Vouchers | **Vouchers**: Long Table (+1 chain slot), Deep Pockets (+1 hand size), Encore (+1 play), Second Wind (+1 discard), Green Thumb (interest cap), Pack Mule (permanent third pack slot) | The run's fundamental constraints |
| Skip tags | **Skip the Bazaar** — forgo the shop for a rolled tag: +$10, a free charm, or free pip upgrades | Tempo vs. greed |
| Interest & economy | $1 per $5 held (capped), reroll costs that escalate | Money as a strategy |
| Boss Blinds | **Bosses** every 3rd round (no flipping / first joint silenced / fewer plays / higher goal), each paying a $4 bounty | Forced adaptation |

### Packs (choice) and the Royal Wheel (gamble)

The wheels proved fun but choiceless, so everything except the Royal Wheel became
**Balatro-style packs**: pay to open, see the contents, keep exactly one. Each shop
stocks **two pack slots** drawn from three kinds — repeats possible — and each slot
rolls **small (3 options)** or **big (5 options, ~35% of slots, pricier)**:

| Pack | Small / Big | Contents |
|---|---|---|
| 🔨 **Tinker Pack** | $4 / $6 | Workbench coupons: Pip Up, Precision Pip, Cull, Duplicate-of-10, Gild, Crystallize |
| 🏮 **Seal Pack** | $5 / $8 | A choice of seals, then you pick the domino to carry it. **Obsidian only appears in big packs** |
| 🎴 **Arcana Pack** | $6 / $10 | Rarity-weighted charms |

A **third pack slot** appears in ~25% of shops and leans toward big packs; the 🧺
**Pack Mule voucher** ($10) makes it permanent.

The 👑 **Royal Wheel** ($15, ~25% of shops) survives as the game's one true gamble:
Power Brush 30% / Chameleon Brush 30% / legendary charm 15% / bust-with-$5 25%. The
🎰 House Edge legendary now gives packs +1 option and rigs the Royal Wheel's jackpot.

### Seals (reworked)

One per domino, never on legendary dominoes, won from Seal Packs so they're a reliable
draft resource rather than a lucky spin:

| Seal | Rarity | Effect |
|---|---|---|
| 🟡 Gold | common | Pays $2 every time it's played |
| 🟠 Amber | common | Guaranteed in the opening hand, +8 when played |
| 🔴 Ruby | uncommon | Joints it touches retrigger their base value |
| 🔵 Azure | uncommon | Returns to hand after the chain scores |
| 🖤 **Obsidian** | rare | **BIDMAS breaker**: the + inside its domino becomes ×, multiplying its two neighbouring terms together — `(1\|2)(3🖤4)(5\|6)` reads `1 + 2×3 × 4×5 + 6 = 127` |

Obsidian is the deliberate broken-build enabler: pair it with Ruby retriggers, Crystal
×2s or Echo Chamber and products explode — but it needs a big Seal Pack roll ($8,
~1-in-5 shops), the right chain shape, and it dies to The Censor zeroing a factor.
**Broken should be possible, not cheap.**

### Ouroboros (reworked)

The tail-bite is now a **true joint**: the exposed ends multiply — or **exponentiate if
either exposed end carries a power brush** — and Crystal, Twin Flame, Deuce/Seven/Sixth
and Echo Chamber all fire on it. Brushing an exposed end used to be dead value;
Ouroboros turns it into the chain's biggest term (and Cloud Nine's 99s feed it a
99×99 = 9,801 loop).

### Pouches & Stakes (the "Decks" and "Stakes")

Progress persists in localStorage. Pouches unlock off your best round cleared anywhere;
each stake unlocks by clearing round 10 on the previous stake — the climb stays steep.

| Pouch | Unlock | Twist |
|---|---|---|
| 👝 Standard | — | Double-six set + 2 bonus bones |
| 🪙 Gilded | round 4 | 2 gold starters, +$4 — goals +10% |
| 🦴 Cracked | round 6 | 24 bones (consistent draws) — one fewer discard |
| 💀 Cursed | round 8 | 4 cursed bones inside, +$8 — Absolute/Grave Robber bait |
| 💎 Crystal | round 10 | 3 crystal starters — 50% shatter chance |

| Stake | Twist |
|---|---|
| ⚪ White Bone | Standard |
| 🟤 Bronze | Goals +20% |
| 🥈 Silver | Goals +40%, payout $3 |
| 🥇 Gold | Goals +60%, payout $3, interest cap −$2 |

### Winning & Endless

Clearing **round 12** completes the run — a 🏆 marks each conquered stake on the menu.
At that point you choose: **retire victorious**, or **continue endlessly**, where goals
grow an extra ×1.5 per round (≈×2 compounded) until the pouch finally breaks. Endless
is where broken builds go to find out exactly how broken they are.

### Charms currently in the pool (47)

Charms are the backbone of the rogue-like element — the pool is deliberately wide so
runs draft differently every time. Five broad families:

**Scoring rules** (the originals):

| Charm | Rarity | Effect |
|---|---|---|
| 🔥 Twin Flame | common | Matching joints (a=a) score ×2 |
| 📚 Bookends | common | Exposed outer ends score ×4 |
| ⬜ Blank Slate | uncommon | 0-pip ends count as 7 |
| ⚖️ Even Steven | common | +8 per even joint |
| 🎭 Odd Rod | common | +8 per odd joint |
| 🎯 High Roller | uncommon | Best joint counted twice |
| 🪶 Minimalist | uncommon | 3-domino chains +40 |
| 🐍 Snake Charmer | rare | Non-decreasing chains score ×1.5 |
| 🎢 Momentum | uncommon | Each joint +4 per joint to its left |
| 📏 Surveyor | common | +5 per domino in the played chain |
| 🎲 Loaded Dice | uncommon | 1-in-3 chance a played chain scores ×2 |
| 🎪 Centerpiece | rare | The second joint scores ×2 |
| 🧿 Absolute | rare | Every end and joint scores its absolute value |
| 🥊 Left Hook | common | The first joint +15 |
| ⚓ Anchor | common | The last joint +15 |
| ⏬ Countdown | rare | Non-increasing chains score ×1.5 |

**The pip family** — one charm per number, rarer at the top (7-9 only exist through
upgrades, blank-slate 7s and wild resonance, so their charms pay accordingly):

| Charm | Rarity | Effect |
|---|---|---|
| 🅰️ Ace High | uncommon | Scored 1s count as 10s |
| ✌️ Deuce Deuce | uncommon | Joints touching a 2 score ×2 |
| 3️⃣ Third Degree | common | +15 per 3 scored |
| 4️⃣ Foursquare | uncommon | Scored 4s count as 8s (combos with Crazy Eights!) |
| 🖐️ High Five | uncommon | +25 per joint whose result is a multiple of 5 |
| 🕕 Sixth Sense | common | +10 per joint touching a 6 |
| 7️⃣ Lucky Seven | rare | Joints touching a 7 score ×2 (combos with Blank Slate) |
| 🎱 Crazy Eights | rare | +28 per 8 scored |
| ☁️ Cloud Nine | rare | Exposed ends showing 9 count as 99 |

**Post-scoring conditionals** — trigger after the chain lands, if a condition is met:

| Charm | Rarity | Effect |
|---|---|---|
| 🔔 Encore Bell | uncommon | Chains scoring 100+ pay $2 |
| 🪽 Phoenix Feather | rare | Once per round, a chain under 20 refunds its play |
| 💠 Perfectionist | rare | All joints (2+) equal → chain ×2 |
| ⚗️ Alchemist | rare | 1-in-5 chance a played plain domino turns gold |
| 🧲 Collector | common | Chains containing a double +20 |
| 🪞 Mirror Mask | rare | Palindromic chains score ×2 |
| 🐦 Early Bird | uncommon | First chain each round ×1.5 |
| 🏁 The Closer | uncommon | Chains on your last play ×1.5 |

**Economy & synergy:**

| Charm | Rarity | Effect |
|---|---|---|
| ⛏️ Gold Digger | common | $1 per double played |
| 🔮 Crystal Ball | rare | Crystal dominoes never shatter |
| 🐷 Piggy Bank | common | $1 at round end per unused discard |
| 🤝 Haggler | uncommon | First purchase each shop $2 cheaper |
| 🏦 Trust Fund | rare | Interest pays $1 per $4 instead of $5 |
| ♻️ Scrapper | common | Shattered crystals pay $5 |
| 💍 Jeweler | uncommon | +15 chain score per gold domino played |
| 🦭 Sealkeeper | uncommon | +12 chain score per sealed domino played |
| 🪦 Grave Robber | uncommon | $1 per negative pip scored |
| 🧤 Dumpster Diver | uncommon | +10 chain score per discard used this round |

**Legendaries:**

| Charm | Effect |
|---|---|
| ♾️ Ouroboros | Exposed ends multiplied together as a phantom joint |
| 🗿 Keystone | +1 chain slot while shelved |
| 📢 Echo Chamber | Every joint retriggers its base value |
| 🎰 House Edge | The Wheels of Fortune always land on their jackpot |

Shop charm offers are **steeply rarity-weighted** (common 10 : uncommon 4 : rare 1 :
legendary 0.15) — per shop slot a rare is roughly 1-in-15 and a legendary roughly
1-in-100. The intended route to the top tiers is gambling on the Arcana (3% jackpot)
and Royal wheels, or the rare direct offer at a premium price (legendaries now $15-16).

### Design notes: why powers are LEGENDARY

A single `^` end changes a joint from `a×b` (max 36 base) to `a^b`. Left unchecked, the
degenerate line was: brush a (9|9), then Duplicate it every shop — each copy another
9⁹ ≈ 387M joint. Exponents are the late-game scaling answer to exponentially growing
goals (like Balatro's ×Mult legendaries), so they stay in the game but behind a
**legendary exclusivity rule**:

- Power Brush is **legendary**: ~15% shop appearance (was 35%), $12 (was $8).
- A powered domino **cannot be duplicated** — it never appears in the Duplicate offer.
- The powered end's pips are **locked forever** (no Pip Up / Precision Pip), capping a
  brushed 6 at `9^6`; you must choose between growing an end and empowering it.
- A domino holds **at most one power end**, and **cannot carry a seal** — no
  retrigger-the-exponent stacking.

Balance tweaks applied in the same spirit elsewhere:

- **Duplicate is RNG-gated**: instead of browsing the whole pouch, you're offered
  **10 random dominoes** and pick one — copying your best gold/crystal piece is now a
  lucky find, not a guarantee (mirrors Balatro's pack RNG).
- **Charm shop offers are rarity-weighted** so rare/legendary charms can't be fished
  cheaply with rerolls.
- **Loaded Dice rolls only when a chain is played**, never in the preview, so it can't
  be scummed by rearranging.
- **Ruby Seal retriggers base joint value** (not the post-multiplier value), so it adds
  rather than compounds with Crystal/Twin Flame.

### Wild ends & the legendary exclusivity rule

Wild ★ ends (Chameleon Brush) follow the same exclusivity contract as power ends —
together they form the **legendary modification** class: a domino carries at most one
legendary end, can't be duplicated, can't hold a seal, and the legendary end's pips are
locked. At a joint a wild copies the opposing pip (auto-triggering Twin Flame, which is
the intended synergy); two facing wilds resonate as 7s; an exposed wild mirrors its own
domino's other end.

### Ideas for future upgrade axes

- **Chain shapes**: vouchers unlocking branching (T-shaped) chains with two exposed
  ends. Deferred — this reworks the board layout, the scorer's joint-walk, and slot
  UI, so it deserves a dedicated pass: the sketch is a T-junction slot under slot 2
  whose branch multiplies into both neighbours and exposes a third added end.
- **Seal fusion**: combine two sealed dominoes into one dual-seal domino (legendary).
- **Boss relics**: beating a boss grants a choice of one free workbench service.
- **Endless mode**: after round 12, goals go super-exponential for leaderboard chasing.

## Files

- `index.html` — screens and overlays
- `style.css` — felt-table theme, CSS-pip domino rendering
- `game.js` — all game logic (state, scoring, shop, bosses, rendering)
