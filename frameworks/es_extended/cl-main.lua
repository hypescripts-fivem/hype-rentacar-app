---@diagnostic disable: duplicate-set-field
if Framework.Name ~= "es_extended" then return end

-- ESX account names that count as the app's "cash" and "bank" balances.
local accounts <const> = { money = true, bank = true }

--- Returns the name of the active framework.
---@return string Always returns "es_extended".
function Framework.Client.GetFrameworkName()
    return "es_extended"
end

--- Calls the handler whenever the local player's cash or bank balance changes.
---@param handler fun() Called on every balance change.
---@return nil
function Framework.Client.OnMoneyChange(handler)
    RegisterNetEvent("esx:setAccountMoney", function(account)
        if account and account.name and not accounts[account.name] then return end
        handler()
    end)
end
