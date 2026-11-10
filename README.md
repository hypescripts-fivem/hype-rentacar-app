<div align="center">

<img src="https://raw.githubusercontent.com/hypescripts-fivem/hype-rentacar/main/tebex/thumbnail-1920x1080.png" alt="hype-rentacar-app" width="100%">

# hype-rentacar-app

**Rent a Car phone app for lb-phone, cylex_phone and codem-phone**

The companion app for [`hype-rentacar`](https://github.com/hypescripts-fivem/hype-rentacar). Players rent a vehicle from their phone,
track their active rentals with a live countdown and bring back a lost rental vehicle while the rental time is still running.

![FiveM](https://img.shields.io/badge/FiveM-cerulean-f40552?style=flat-square)
![Lua](https://img.shields.io/badge/Lua-5.4-2c2d72?style=flat-square&logo=lua)
![lb-phone](https://img.shields.io/badge/lb--phone-custom%20app-8b5cf6?style=flat-square)
![Frameworks](https://img.shields.io/badge/ESX%20·%20QB%20·%20QBX-auto%20detected-3b82f6?style=flat-square)
![Version](https://img.shields.io/badge/version-1.0.0-22c55e?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-eab308?style=flat-square)

[Features](#features) · [Screenshots](#screenshots) · [Installation](#installation) · [Configuration](#configuration) · [Developers](#developers)

</div>

---

## Features

| | |
| --- | --- |
| **Rent from anywhere** | Browse the rental catalog, pick a duration and pay with cash or bank. The vehicle is not spawned on the spot: it is picked up later at any Rent a Car office. |
| **Search, filter & sort** | Category tabs built from the catalog, search by name or model, and sorting by recommended, price or name. |
| **Clear pricing** | Base price, duration discount, phone service fee, refundable deposit and total are shown before renting, with a confirmation popup. |
| **Checks up front** | The rent button is blocked with a hint when renting from the phone is disabled, the driver license is missing, the rental limit is reached or the balance is too low. |
| **My Rentals** | Every active rental with its plate, a live countdown, a progress bar and its status: *Awaiting pickup*, *Vehicle out* or *Vehicle missing*. |
| **Go to nearest office** | Marks the closest office on the GPS for a rental that has not been picked up yet, and right after renting. |
| **Show location** | Marks the rented vehicle on the GPS while it is out in the world. |
| **Bring to me** | A picked up rental whose vehicle was removed is spawned on a free road next to the player, for a fee. The spawn point is validated again on the server. |
| **Always up to date** | Balance and rentals refresh when the app is opened, when cash or bank changes, when hype-rentacar updates a rental, and every 15 seconds on the rentals tab. |
| **Native look** | Follows the lb-phone light / dark theme, uses lb-phone popups and takes its currency and number format from hype-rentacar. |
| **Server authoritative** | The app holds no rental state. Every request goes through the hype-rentacar exports, which handle prices, payments, cooldowns and validation. |
| **Restart safe** | The app is added again when lb-phone restarts and removed from the phone when the resource stops. |

## Screenshots

<table>
  <tr>
    <td width="33%"><img src="https://raw.githubusercontent.com/hypescripts-fivem/hype-rentacar/main/tebex/screenshots/07-app-vehicles.png" alt="Vehicles"></td>
    <td width="33%"><img src="https://raw.githubusercontent.com/hypescripts-fivem/hype-rentacar/main/tebex/screenshots/08-app-detail.png" alt="Vehicle details"></td>
    <td width="33%"><img src="https://raw.githubusercontent.com/hypescripts-fivem/hype-rentacar/main/tebex/screenshots/09-app-rentals.png" alt="My Rentals"></td>
  </tr>
  <tr>
    <td align="center"><sub>Vehicle catalog</sub></td>
    <td align="center"><sub>Duration, payment and summary</sub></td>
    <td align="center"><sub>Active rentals</sub></td>
  </tr>
</table>

<details>
<summary><b>More screenshots</b></summary>
<br>

<table>
  <tr>
    <td width="33%"><img src="https://raw.githubusercontent.com/hypescripts-fivem/hype-rentacar/main/tebex/screenshots/10-app-respawn.png" alt="Bring to me"></td>
    <td width="33%"><img src="https://raw.githubusercontent.com/hypescripts-fivem/hype-rentacar/main/tebex/screenshots/11-app-light.png" alt="Light theme"></td>
    <td width="33%"></td>
  </tr>
  <tr>
    <td align="center"><sub>Bringing back a lost vehicle</sub></td>
    <td align="center"><sub>Light theme</sub></td>
    <td></td>
  </tr>
</table>

</details>

## Requirements

| Type | Supported | Notes |
| --- | --- | --- |
| Required | [`ox_lib`](https://github.com/overextended/ox_lib/releases/latest) | Callbacks and locales |
| Phone | [`lb-phone`](https://lbscripts.com/package/phone), [`cylex_phone`](https://cylexdev.gitbook.io/docs/scripts/cylex-phone) or [`codem-phone`](https://codem.gitbook.io/codem-documentation/m-series/essentials/mphone-2.5) | One of them is required. `Phone = "auto"` picks the started one (in this order) |
| Required | [`hype-rentacar`](https://github.com/hypescripts-fivem/hype-rentacar) | All rental logic, prices, offices and the database live here |
| Framework | `qbx_core`, `qb-core`, `es_extended` | Detected in this order. Only used to refresh the balance live; without one the balance refreshes when the app is opened |

> [!NOTE]
> Vehicles, prices, durations, offices, the driver license check, the phone service fee and the respawn fee are all configured in
> **hype-rentacar**, not in this app. See [Rental rules](#rental-rules).

### Phone support

The app works on **lb-phone**, **cylex_phone** and **codem-phone**; every phone call goes through `modules/phone` (`cl-main.lua` / `sv-main.lua`).

| | lb-phone | cylex_phone | codem-phone |
| --- | --- | --- | --- |
| App listing | App Store: name, developer, description, price, size, preinstalled | Home screen: name and icon | Home screen or App Store (`Codem.AddAppStore`): name, developer, description, preinstalled |
| UI callbacks | NUI callbacks | NUI callbacks | `codem-phone:customApp:<identifier>:<action>` client events (`Phone.RegisterCallback` registers both) |
| Theme | Follows the phone | `Cylex.Theme` in the config | Follows the phone (`mphone:init`) |
| Pop-ups / menus | lb-phone components | Drawn inside the app | Phone pop-up (up to 2 buttons), menus drawn inside the app |
| Notifications | `SendNotification` | `PhoneNotification`, icon from `Cylex.NotificationIcon` | Server `SendNotify` |

On cylex_phone and codem-phone the game keys are turned off while a text field of the app is focused (`ToggleFocusKeepInput` / `SetInputFocus`).

## Installation

> [!IMPORTANT]
> The resource folder **must** be named `hype-rentacar-app`. Under any other name the script stops itself and prints a warning.

**1. Download** or clone this repository and place it in your `resources` folder, next to `hype-rentacar`.

**2. Start it** in `server.cfg`, after lb-phone and hype-rentacar:

```cfg
ensure ox_lib
ensure oxmysql
ensure qbx_core          # or qb-core / es_extended
ensure lb-phone # or cylex_phone / codem-phone
ensure hype-rentacar
ensure hype-rentacar-app
```

**3. Configure** the app listing in `config/config.lua` (name, App Store details, preinstalled or not) and the phone rules in hype-rentacar's
`Remote` and `Respawn` options (see below).

**4. Set the language** (`en` and `tr` included, add more in `locales/`):

```cfg
setr ox:locale "en"
```

The app appears in the lb-phone App Store. Set `App.defaultApp = true` to preinstall it on every phone.

## Configuration

Everything lives in [`config/config.lua`](config/config.lua). The options:

| Option | Description |
| --- | --- |
| `Debug` | Print debug messages to the server / client console |
| `Framework` | `"auto"`, `"qbx"`, `"qb"` or `"esx"`; only used for the live balance refresh |
| `App.identifier` | Unique app id inside the phone |
| `App.name` / `App.description` / `App.developer` | Name on the phone and App Store details |
| `App.defaultApp` | `true` = preinstalled on every phone and cannot be removed |
| `App.price` | App Store download price (`0` = free) |
| `App.size` | App size shown in the App Store (kB) |
| `SetWaypoint` | Set the GPS to the nearest office from *Go to Nearest Office* and after renting |
| `SpawnRadius` | Road node search radius around the player when a lost vehicle is brought back; keep it below hype-rentacar's `Respawn.maxDistance` |

<details>
<summary><b>Example: app listing</b></summary>

```lua
App = {
    identifier = "hype-rentacar",
    name = "Rent a Car",
    description = "Rent a vehicle from your phone and keep track of your rentals.",
    developer = "Los Santos Rent a Car",
    defaultApp = false,   -- true = preinstalled and cannot be removed
    price = 0,            -- 0 = free
    size = 42500,         -- kB
},

SetWaypoint = true,
SpawnRadius = 30.0,       -- below hype-rentacar's Respawn.maxDistance
```

The app icon is `web/build/icon.svg` (source: `web/public/icon.svg`).

</details>

### Rental rules

The phone specific rules are part of hype-rentacar's `config/config.lua`:

| Option | Description |
| --- | --- |
| `Remote.enabled` | Allow renting from the phone |
| `Remote.fee` | Service fee added to phone rentals |
| `Remote.pickupRadius` | Max distance to the office when collecting a phone rental |
| `Respawn.enabled` / `Respawn.remote` | Allow respawning lost rentals at all / from the phone |
| `Respawn.fee` | Fee per respawn |
| `Respawn.maxDistance` | Max distance between the player and a phone respawn point (server check) |

<details>
<summary><b>Example: hype-rentacar phone settings</b></summary>

```lua
Respawn = {
    enabled = true,       -- respawning at the office
    remote = true,        -- respawning from the phone app (next to the player)
    fee = 250,
    maxDistance = 40.0,
},

Remote = {
    enabled = true,       -- renting from the phone
    fee = 100,            -- phone service fee
    pickupRadius = 15.0,
},
```

</details>

## Developers

The app does not keep any rental logic of its own. Its server forwards the phone requests to these hype-rentacar server exports:

| hype-rentacar export | Used for |
| --- | --- |
| `GetCatalog()` | Vehicles, durations, offices, payment accounts and the phone / respawn rules |
| `GetPlayerData(source)` | Balance, license state and active rentals of the player |
| `Rent(source, { model, hours, payment })` | Phone rental, picked up later at an office |
| `Respawn(source, rentalId, spawnPoint)` | Brings a lost rental next to the player |

The app is registered with lb-phone's `AddCustomApp`, refreshed with `SendCustomAppMessage` and removed with `RemoveCustomApp`.
It refreshes whenever hype-rentacar fires the client event below, so other resources can trigger a refresh the same way:

```lua
-- Server: refresh a player's Rent a Car app
TriggerClientEvent("hype-rentacar:client:updated", source)
```

All exports of the app itself are called through `exports["hype-rentacar-app"]`.

| Export | Side | Description |
| --- | --- | --- |
| `GetFrameworkObject()` | client | The framework bridge (`GetFrameworkName`, `OnMoneyChange`) |
| `GetModules(name?)` | client | The module bridges, or one of them (`Phone`) |

<details>
<summary><b>Building the UI</b></summary>

The interface ships prebuilt in `web/build`. To modify it, edit the Vue source in `web/` and rebuild:

```bash
cd web
pnpm install
pnpm build
```

`pnpm dev` opens a browser preview with mock data.

</details>

## License

Released under the [MIT License](LICENSE).

<div align="center">
<sub>Made by <b>HypeScripts</b></sub>
</div>
