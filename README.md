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
| Jokers | **Charms** (max 5 on the shelf, sellable for half; shop offers are rarity-weighted) | Passive scoring rules |
| Planet cards | **Pip Up / Precision Pip** (+1 to end values, up to 9; power ends are locked) | Raw numbers |
| Legendary Jokers | **Power Brush** (LEGENDARY) — converts an end's operator from × to ^ (appears in ~15% of shops) | The *operators* themselves |
| Card editions (foil/holo/gold) | **Materials**: Gold (pays $1 when played), Crystal (doubles its joints but may shatter) | Risk/economy per card |
| Seals | **Ruby Seal** — a sealed domino's joints retrigger (base value scores again) | Per-card retriggers |
| Buying/destroying cards | **Fresh Bones** (buy dominoes) and **Cull** (thin the pouch) | Deck composition & draw consistency |
| Duplicating cards | **Duplicate** — the pouch offers **10 random dominoes**, pick one to copy (power dominoes never appear) | Deck consistency, RNG-gated |
| Booster packs | **Bone Pack** — crack 3 random dominoes, keep one | Deck growth with choice |
| Vouchers | **Vouchers**: Long Table (+1 chain slot), Deep Pockets (+1 hand size), Encore (+1 play), Second Wind (+1 discard), Green Thumb (interest cap) | The run's fundamental constraints |
| Interest & economy | $1 per $5 held (capped), reroll costs that escalate | Money as a strategy |
| Boss Blinds | **Bosses** every 3rd round: no flipping, first joint silenced, fewer plays, higher goal | Forced adaptation |

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
| ♾️ Ouroboros | **legendary** | The exposed ends are also multiplied together and added as a phantom joint |

Shop charm offers are **rarity-weighted** (common 6 : uncommon 3 : rare 1.5 : legendary 0.5),
so legendaries are a genuine event, not a shelf staple.

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

### Ideas for future upgrade axes

- **More seals**: a seal that returns the domino to hand after play; one that draws it
  first every round; a gold seal paying $2.
- **Wildcard ends**: an end that copies the pip value it touches (legendary, same
  exclusivity rules as power ends).
- **Negative pips**: risky dominoes that subtract but combo with an "absolute value" charm.
- **Chain shapes**: vouchers unlocking branching (T-shaped) chains with two exposed ends.
- **Charm packs**: pick 1 of 3 random charms, cheaper than buying direct.
- **Skip rewards**: skip a shop for a guaranteed rare, mirroring Balatro's skip tags.
- **Boss-specific rewards**: beating a boss round grants a choice of one free service.

## Files

- `index.html` — screens and overlays
- `style.css` — felt-table theme, CSS-pip domino rendering
- `game.js` — all game logic (state, scoring, shop, bosses, rendering)
