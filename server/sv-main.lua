local scriptName <const> = "hype-rentacar-app"
local MAIN_RESOURCE <const> = "hype-rentacar"

if GetCurrentResourceName() ~= scriptName then
    print(("^1[%s] The resource was renamed, please rename it back to %s.^0"):format(GetCurrentResourceName(), scriptName))
    StopResource(GetCurrentResourceName())
end

-- All rental logic lives in hype-rentacar, the app only forwards phone requests to its exports
local RentACar <const> = exports[MAIN_RESOURCE]

--- Returns whether hype-rentacar is running and its exports can be used.
---@return boolean
local function isReady()
    local ready = GetResourceState(MAIN_RESOURCE) == "started"
    if not ready then Debug("error", "%s is not started, phone request rejected", MAIN_RESOURCE) end
    return ready
end

---@param source integer
---@return { catalog: table, data: table? }?
lib.callback.register("hype-rentacar-app:server:getData", function(source)
    if not isReady() then return end

    local data = RentACar:GetPlayerData(source)
    if not data then Debug("warning", "No player data for %d (player not loaded?)", source) end
    Debug("info", "getData for %d", source)

    return {
        catalog = RentACar:GetCatalog(),
        data = data,
    }
end)

---@param source integer
---@param data { model: string, hours: number, payment: string }
---@return boolean success
---@return any result Rental info on success, error code on failure.
lib.callback.register("hype-rentacar-app:server:rent", function(source, data)
    if not isReady() then return false, "invalid" end

    local success, result = RentACar:Rent(source, data)
    if success then
        Debug("success", "%d rented %s from the phone", source, tostring(type(data) == "table" and data.model))
    else
        Debug("warning", "Rent by %d failed: %s", source, tostring(result))
    end
    return success, result
end)

-- spawnPoint is found next to the player on the client; hype-rentacar validates it against the real position
---@param source integer
---@param rentalId integer
---@param spawnPoint { x: number, y: number, z: number, w: number }
---@return boolean success
---@return any result Vehicle info on success, error code on failure.
lib.callback.register("hype-rentacar-app:server:respawn", function(source, rentalId, spawnPoint)
    if not isReady() then return false, "invalid" end

    local success, result = RentACar:Respawn(source, rentalId, spawnPoint)
    if success then
        Debug("success", "%d respawned rental %s", source, tostring(rentalId))
    else
        Debug("warning", "Respawn of rental %s by %d failed: %s", tostring(rentalId), source, tostring(result))
    end
    return success, result
end)

---@param name string
AddEventHandler("onResourceStart", function(name)
    if name == MAIN_RESOURCE then Debug("info", "%s started, phone requests are available", MAIN_RESOURCE) end
end)

---@param name string
AddEventHandler("onResourceStop", function(name)
    if name == MAIN_RESOURCE then Debug("warning", "%s stopped, phone requests will be rejected", MAIN_RESOURCE) end
end)
