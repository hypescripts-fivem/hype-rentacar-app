---@diagnostic disable: duplicate-set-field
if Framework.Name ~= "qb-core" then return end

--- Returns the name of the active framework.
---@return string Always returns "qb-core".
function Framework.Client.GetFrameworkName()
    return "qb-core"
end

--- Calls the handler whenever the local player's cash or bank balance changes.
---@param handler fun() Called on every balance change.
---@return nil
function Framework.Client.OnMoneyChange(handler)
    RegisterNetEvent("QBCore:Client:OnMoneyChange", function()
        handler()
    end)
end
