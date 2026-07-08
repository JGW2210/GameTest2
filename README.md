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
| Vouchers | **Vouchers**: Long Table (+1 chain slot), Deep Pockets (+1 hand size), Encore (+1 play), Second Wind (+1 discard), Green Thumb (interest cap) | The run's fundamental constraints |
| Skip tags | **Skip the Bazaar** — forgo the shop for a rolled tag: +$10, a free charm, or free pip upgrades | Tempo vs. greed |
| Interest & economy | $1 per $5 held (capped), reroll costs that escalate | Money as a strategy |
| Boss Blinds | **Bosses** every 3rd round (no flipping / first joint silenced / fewer plays / higher goal), each paying a $4 bounty | Forced adaptation |

### The Wheels of Fortune

The old à-la-carte services (precision pips, duplicates, seals, brushes, packs) cluttered
the shop and made rare effects purchasable on demand. They're now **repackaged into
pay-to-spin wheels** — you buy the spin, the wheel decides the prize, one spin per wheel
per shop (rerolls restock them):

| Wheel | Price | Outcomes (odds) |
|---|---|---|
| 🔨 **Tinker Wheel** | $3 | Pip Up 35% · Precision Pip 25% · Cull 15% · Duplicate-of-10 15% · **gild jackpot 10%** |
| 🔮 **Mystic Wheel** | $6 | random seal 45% · crystallize 20% · Bone Pack 20% · cursed bone +$3 pity 10% · **legendary brush jackpot 5%** |
| 🎴 **Arcana Wheel** | $8 | common charm 55% · uncommon 30% · rare 12% · **LEGENDARY charm 3%** |
| 👑 **Royal Wheel** | $15, in ~25% of shops | Power Brush 30% · Chameleon Brush 30% · legendary charm 15% · **bust ($5 back) 25%** |

If a prize has no valid target (e.g. Cull with a minimum pouch), the house pays out cash
instead. Materials (Gold pays $1 when played, Crystal doubles joints but may shatter),
seals (Ruby retrigger / Gold $2 / Azure returns to hand / Amber opening hand), wild ★
ends and cursed bones all still exist — they're just won, not bought.

### Charms currently in the pool

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
| ⛏️ Gold Digger | common | $1 per double played |
| 🎢 Momentum | uncommon | Each joint +4 per joint to its left |
| 🕕 Sixth Sense | common | +10 per joint touching a 6 |
| 🔮 Crystal Ball | rare | Crystal dominoes never shatter |
| 🐷 Piggy Bank | common | $1 at round end per unused discard |
| 📏 Surveyor | common | +5 per domino in the played chain |
| 🎲 Loaded Dice | uncommon | 1-in-3 chance a played chain scores ×2 |
| 🎪 Centerpiece | rare | The second joint scores ×2 |
| 🧿 Absolute | rare | Every end and joint scores its absolute value |
| ♾️ Ouroboros | **legendary** | The exposed ends are also multiplied together and added as a phantom joint |
| 🗿 Keystone | **legendary** | +1 chain slot while it sits on your shelf — sell it and the table shrinks back |

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
