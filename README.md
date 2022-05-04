# tea/www

Deploys to [tea.xyz](https://tea.xyz).

# Conditions of Use

This repo is open source, but you may not publish this website in an attempt
to masquerade as tea.inc. Trademark law has our back here.

# Getting Started

```sh
sh <(curl tea.xyz) https://github.com/teaxyz/www
```

Alternatively:

```
npx watch-http-server . -p8000 -o -a localhost
open localhost:8000
```

# Dependencies

| Project    | Version |
|------------|---------|
| nodejs.org |   ^18   |
