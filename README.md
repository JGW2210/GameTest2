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
| Jokers | **Charms** (max 5 on the shelf, sellable for half) | Passive scoring rules |
| Planet cards | **Pip Up / Precision Pip** (+1 to end values, up to 9) | Raw numbers |
| Spectral/rare edits | **Power Brush** — converts an end's operator from × to ^ (appears in ~1/3 of shops) | The *operators* themselves |
| Card editions (foil/holo/gold) | **Materials**: Gold (pays $1 when played), Crystal (doubles its joints but may shatter) | Risk/economy per card |
| Buying/destroying cards | **Fresh Bones** (buy dominoes) and **Cull** (thin the pouch) | Deck composition & draw consistency |
| Duplicating cards | **Duplicate** a domino | Deck consistency |
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

### Design notes: why powers are rare

A single `^` end changes a joint from `a×b` (max 36 base) to `a^b` (up to 9⁹ with pip
upgrades). Like Balatro's ×Mult Jokers, exponents are the late-game scaling answer to
exponentially growing goals — so they're priced high, gated behind shop luck, and BIDMAS
makes them read naturally: *indices before multiplication*.

### Ideas for future upgrade axes

- **Sealed dominoes** (Balatro's seals): a seal that retriggers a domino's joints, one
  that returns it to hand after play, one that draws it first every round.
- **Wildcard ends**: an end that copies the pip value it touches.
- **Negative pips**: risky dominoes that subtract but combo with an "absolute value" charm.
- **Chain shapes**: vouchers unlocking branching (T-shaped) chains with two exposed ends.
- **Consumable packs** (Booster analogs): pick-1-of-3 domino packs, charm packs.
- **Skip rewards**: skip a shop for a guaranteed rare, mirroring Balatro's skip tags.

## Files

- `index.html` — screens and overlays
- `style.css` — felt-table theme, CSS-pip domino rendering
- `game.js` — all game logic (state, scoring, shop, bosses, rendering)
