# Bowling Rules

## Goals

The bowling calculator must be fast enough to use during a game and transparent enough that friends can trust the result.

## Modes

### Unlimited

One representative payer pays the total unlimited bowling fee.

The app calculates stack unit price after all games:

```text
stack unit price = total cost / total stacks
```

Example:

```text
6 members
total cost = 120,000 KRW
7 games
normal stacks = 6 per game
total stacks = 42
stack unit price = 120,000 / 42
```

### Per Game

The stack unit price is known upfront, usually equal to the per-person game fee.

Internally this still uses stacks:

```text
amount = stack count * stack unit price
```

## Team Score

When teams have different sizes, compare normalized team scores:

```text
team score = team average score * largest team size in the game
```

Do not round normalized scores for ranking. Display may round for readability.

## Normal Stack Allocation

For a normal team game, total generated stacks usually equal participating member count.

### Three Teams

- First place: pays 0 stacks.
- Second place: each member pays 1 stack.
- Last place: each member pays 1 stack plus the first-place team's stack count split evenly among last-place members.

Example: teams are 3 / 3 / 2.

```text
first place: 3 members -> 0 total stacks
second place: 3 members -> 3 total stacks
last place: 2 members -> own 2 stacks + first-place 3 stacks = 5 total stacks
last-place member stack = 2.5
total = 8 stacks
```

### Two Teams

The losing team bears all stacks.

```text
losing member stack = participating member count / losing team member count
```

## Ties

The app detects ties but does not apply automatic tie rules in the MVP. Users manually confirm ranking.

## Custom Stack Game

Some games, especially final individual games, use custom stack allocation.

Example:

```text
7th place: 4 stacks
6th place: 3 stacks
5th place: 1 stack
others: 0 stacks
game total = 8 stacks
```

The custom input replaces the normal participant-count stack rule.

## Local Rule Presets

MVP supports limited preset types:

- Under-score solo burden: e.g. under 100 points pays all stacks for that burden team.
- Team-internal last-place solo burden: used after a local trigger such as three consecutive gutters.
- Manual solo burden: manually choose one member to bear a team's stacks.

Local rule application must store:

- selected preset
- target member
- affected team
- before allocations
- after allocations
- rationale text

## Rounding

Use high precision internally. Display and payment requests default to 10 KRW rounding.

After rounding, automatically adjust differences so the representative payer recovers exactly the real paid amount minus their own burden.

