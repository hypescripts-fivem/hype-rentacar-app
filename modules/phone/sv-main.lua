local Config <const> = require "config.config"

local Phone = Modules.Server.Phone

local LB <const> = "lb-phone"
local CYLEX <const> = "cylex_phone"
local CODEM <const> = "codem-phone"
local PHONES <const> = { LB, CYLEX, CODEM }
local MAX_TEXT <const> = 250

local currentPhone

local function phoneName()
    if currentPhone then return currentPhone end

    if Config.Phone and Config.Phone ~= "auto" then
        if GetResourceState(Config.Phone) == "started" then currentPhone = Config.Phone end
        return currentPhone
    end

    for _, name in ipairs(PHONES) do
        if GetResourceState(name) == "started" then
            currentPhone = name
            return name
        end
    end
end

local function codemNotify(src, title, content)
    exports[CODEM]:SendNotify(src, { app = Config.App.identifier, title = title, message = content })
end

---@param src integer
---@return string?
function Phone.Number(src)
    local name = phoneName()
    local number

    if name == LB then
        number = exports[LB]:GetEquippedPhoneNumber(src)
    elseif name == CODEM then
        number = exports[CODEM]:GetPhoneNumberBySource(src)
    elseif name == CYLEX then
        local userData = exports[CYLEX]:getUserDataBySource(src)
        number = userData and userData.phoneNumber
    end

    return number and tostring(number) or nil
end

---@param phoneNumber string
---@param title string
---@param content string
---@return boolean sent
function Phone.NotifyNumber(phoneNumber, title, content)
    local name = phoneName()

    if name == LB then
        exports[LB]:SendNotification(phoneNumber, { app = Config.App.identifier, title = title, content = content })
        return true
    end

    if name == CODEM then
        local src = exports[CODEM]:GetSourceFromNumber(phoneNumber)
        if src then
            codemNotify(src, title, content)
            return true
        end
    end

    return false
end

RegisterNetEvent(("%s:phone:notify"):format(GetCurrentResourceName()), function(title, content)
    if phoneName() ~= CODEM or type(title) ~= "string" or type(content) ~= "string" then return end
    codemNotify(source, title:sub(1, MAX_TEXT), content:sub(1, MAX_TEXT))
end)

AddEventHandler("onResourceStart", function(name)
    if name == LB or name == CYLEX or name == CODEM then currentPhone = nil end
end)

AddEventHandler("onResourceStop", function(name)
    if name == currentPhone then currentPhone = nil end
end)
