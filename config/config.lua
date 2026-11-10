-- Units: distances are in meters. Rental rules (vehicles, prices, durations, offices) are configured in hype-rentacar.
return {
    Debug = false,                         -- Print debug messages to the server/client console

    Framework = "auto",                    -- "auto" | "qbx" | "qb" | "esx" (auto detects qbx_core > qb-core > es_extended), used to refresh the balance

    Phone = "auto",                        -- "auto" | "lb-phone" | "cylex_phone" | "codem-phone" (auto uses the started one in this order)

    Cylex = {                              -- Only used with cylex_phone
        Theme = "dark",                    -- "light" | "dark", cylex_phone does not share its theme with custom apps
        NotificationIcon = "app-icon/settings.png", -- Notification icon, path inside cylex_phone's html/img folder
        NotificationTimeout = 5,           -- Notification duration (seconds)
    },

    Codem = {                              -- Only used with codem-phone (the theme comes from the phone)
        AddAppStore = false,               -- true = listed in the App Store, false = installed on the home screen
    },

    App = {                                -- Phone app listing (cylex_phone uses only identifier and name, price and size are lb-phone only)
        identifier = "hype-rentacar",      -- Unique app id inside the phone
        name = "Rent a Car",               -- App name shown on the phone
        description = "Rent a vehicle from your phone and keep track of your rentals.", -- App Store description
        developer = "Los Santos Rent a Car", -- Developer name shown in the App Store
        defaultApp = false,                -- true = preinstalled on every phone and cannot be removed
        price = 0,                         -- App Store download price (0 = free)
        size = 42500,                      -- App size shown in the App Store (kB)
    },

    SetWaypoint = true,                    -- Set GPS to the nearest office ("Go to nearest office" and after renting)

    SpawnRadius = 30.0,                    -- Road node search radius around the player when respawning a lost vehicle,
                                           -- keep it below hype-rentacar's Config.Respawn.maxDistance
}
