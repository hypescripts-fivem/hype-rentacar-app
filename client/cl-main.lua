local Config <const> = require "config.config"

local App <const> = Config.App
local Phone <const> = Modules.Client.Phone
local resource <const> = cache.resource

---@param action string
---@param data any
---@return nil
local function sendAppMessage(action, data)
    Phone.SendAppMessage(App.identifier, { action = action, data = data })
end

---@return nil
local function addApp()
    local added, errorMessage = Phone.AddApp({
        identifier = App.identifier,
        name = App.name,
        description = App.description,
        developer = App.developer,
        defaultApp = App.defaultApp,
        size = App.size,
        price = App.price,
        -- The phone keeps the app page alive in the background, so balance and rentals are refreshed on every open
        onOpen = function()
            Debug("info", "App opened, refreshing")
            sendAppMessage("refresh")
        end,
    })

    if not added then
        print(("^1[%s] Failed to add the phone app (%s): %s^0"):format(resource, tostring(Phone.Name()), tostring(errorMessage)))
    else
        Debug("success", "Phone app added to %s (%s)", Phone.Name(), App.identifier)
    end
end

---@param coords { x: number, y: number }?
---@return nil
local function setWaypoint(coords)
    if not Config.SetWaypoint or not coords then return end
    SetNewWaypoint(coords.x + 0.0, coords.y + 0.0)
    Debug("info", "Waypoint set to %.1f, %.1f", coords.x, coords.y)
end

---@param cb fun(response: { success: boolean, data: any, error: any })
---@param success boolean
---@param result any
---@return nil
local function respond(cb, success, result)
    cb({ success = success, data = success and result or nil, error = not success and result or nil })
end

---@param _ any
---@param cb fun(response: table)
Phone.RegisterCallback("getData", function(_, cb)
    local result = lib.callback.await("hype-rentacar-app:server:getData", false)
    if not result then
        Debug("warning", "getData failed: hype-rentacar is unavailable")
        return respond(cb, false, "unavailable")
    end

    result.locales = lib.getLocales()
    Debug("info", "getData loaded (%d active rentals)", type(result.data?.rentals) == "table" and #result.data.rentals or 0)
    respond(cb, true, result)
end)

--- Finds a free road node next to the player for a respawned vehicle (the server validates the distance again).
---@return vector4?
local function findSpawnNearPlayer()
    local ped = cache.ped
    local coords = GetEntityCoords(ped)

    for i = 1, 10 do
        local found, position, heading = GetNthClosestVehicleNodeWithHeading(coords.x, coords.y, coords.z, i, 1, 3.0, 2.5)
        if found and #(position - coords) <= Config.SpawnRadius and not IsAnyVehicleNearPoint(position.x, position.y, position.z, 3.0) then
            Debug("info", "Spawn point found on road node %d", i)
            return vec4(position.x, position.y, position.z, heading)
        end
    end

    -- No free road nearby, fall back to the spot in front of the player
    local front = GetOffsetFromEntityInWorldCoords(ped, 0.0, 4.0, 0.0)
    if IsAnyVehicleNearPoint(front.x, front.y, front.z, 3.0) then
        Debug("warning", "No free spawn point near the player")
        return
    end

    local found, groundZ = GetGroundZFor_3dCoord(front.x, front.y, front.z + 2.0, false)
    Debug("info", "Spawn point placed in front of the player")
    return vec4(front.x, front.y, found and groundZ or front.z, GetEntityHeading(ped))
end

---@param data { model: string, hours: number, payment: string }
---@param cb fun(response: table)
Phone.RegisterCallback("rent", function(data, cb)
    Debug("info", "Rent requested: %s for %s hour(s), paid by %s", tostring(data?.model), tostring(data?.hours), tostring(data?.payment))

    local success, result = lib.callback.await("hype-rentacar-app:server:rent", false, data)
    if success then
        Debug("success", "Rent succeeded: %s", tostring(type(result) == "table" and (result.label or result.plate) or result))
    else
        Debug("warning", "Rent failed: %s", tostring(result))
    end
    respond(cb, success, result)
end)

-- Only for picked up rentals whose vehicle is gone: spawns it next to the player
---@param data { id: integer }
---@param cb fun(response: table)
Phone.RegisterCallback("respawn", function(data, cb)
    if cache.vehicle then
        Debug("warning", "Respawn rejected: player is in a vehicle")
        return respond(cb, false, "in_vehicle")
    end

    local spawn = findSpawnNearPlayer()
    if not spawn then return respond(cb, false, "spawn_blocked") end

    local success, result = lib.callback.await("hype-rentacar-app:server:respawn", false, data?.id, {
        x = spawn.x, y = spawn.y, z = spawn.z, w = spawn.w,
    })
    if success then
        Debug("success", "Respawn succeeded for rental %s", tostring(data?.id))
    else
        Debug("warning", "Respawn failed for rental %s: %s", tostring(data?.id), tostring(result))
    end
    respond(cb, success, result)
end)

-- GPS to the nearest office for a rental that has not been picked up yet
---@param data { locations: { label: string, coords: { x: number, y: number } }[] }
---@param cb fun(response: table)
Phone.RegisterCallback("nearestOffice", function(data, cb)
    local coords = GetEntityCoords(cache.ped)
    local nearest, best

    for _, location in ipairs(type(data?.locations) == "table" and data.locations or {}) do
        local x, y = tonumber(location?.coords?.x), tonumber(location?.coords?.y)
        if x and y then
            local distance = #(coords.xy - vec2(x, y))
            if not best or distance < best then nearest, best = location, distance end
        end
    end

    if not nearest then
        Debug("warning", "nearestOffice failed: no valid office coordinates")
        return respond(cb, false, "invalid")
    end

    Debug("info", "Nearest office: %s (%dm)", tostring(nearest.label), math.floor(best))
    setWaypoint(nearest.coords)
    respond(cb, true, { label = nearest.label, distance = math.floor(best) })
end)

---@param data { x: number, y: number }
---@param cb fun(response: table)
Phone.RegisterCallback("waypoint", function(data, cb)
    cb({ success = true })
    if data?.x and data?.y then
        SetNewWaypoint(data.x + 0.0, data.y + 0.0)
        Debug("info", "Waypoint set to %.1f, %.1f", data.x + 0.0, data.y + 0.0)
    end
end)

-- Fired by hype-rentacar whenever the player's rentals change (rent, return, expiry)
RegisterNetEvent("hype-rentacar:client:updated", function()
    Debug("info", "Rentals updated by hype-rentacar, refreshing")
    sendAppMessage("refresh")
end)

-- Cash/bank changes refresh the balance in the app; bursts of changes are merged into one refresh
local moneyRefreshQueued = false

if Framework.Client.OnMoneyChange then
    Framework.Client.OnMoneyChange(function()
        if moneyRefreshQueued then return end
        moneyRefreshQueued = true

        SetTimeout(500, function()
            moneyRefreshQueued = false
            Debug("info", "Balance changed, refreshing")
            sendAppMessage("refresh")
        end)
    end)
end

Phone.OnReady(addApp)
