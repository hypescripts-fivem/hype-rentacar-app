---@diagnostic disable: duplicate-set-field
if Framework.Name ~= "qbx_core" then return end

--- Returns the name of the active framework.
---@return string Always returns "qbx_core".
function Framework.Client.GetFrameworkName()
    return "qbx_core"
end

--- Calls the handler whenever the local player's cash or bank balance changes.
--- qbx_core keeps firing the QBCore money event for compatibility.
---@param handler fun() Called on every balance change.
---@return nil
function Framework.Client.OnMoneyChange(handler)
    RegisterNetEvent("QBCore:Client:OnMoneyChange", function()
        handler()
    end)
end
