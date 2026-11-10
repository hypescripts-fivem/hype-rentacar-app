local Config <const> = require "config.config"

local Phone = Modules.Client.Phone
local resource <const> = GetCurrentResourceName()

local LB <const> = "lb-phone"
local CYLEX <const> = "cylex_phone"
local CODEM <const> = "codem-phone"
local PHONES <const> = { LB, CYLEX, CODEM }

local Cylex <const> = Config.Cylex or {}
local Codem <const> = Config.Codem or {}

local apps = {}
local callbacks = {}
local codemBound = {}
local currentPhone
local addApps

---@return "lb-phone"|"cylex_phone"|"codem-phone"|nil
function Phone.Name()
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

---@return boolean
function Phone.IsOpen()
    local name = Phone.Name()
    if name == CODEM then return exports[CODEM]:IsPhoneOpen() == true end
    return name ~= nil and exports[name]:IsOpen() == true
end

local function bindCodemCallback(identifier, name, handler)
    local key = identifier .. ":" .. name
    if codemBound[key] then return end
    codemBound[key] = true

    AddEventHandler(("codem-phone:customApp:%s:%s"):format(identifier, name), function(payload, cb)
        handler(type(payload) == "table" and payload or {}, cb)
    end)
end

---@param name string
---@param handler fun(data: any, cb: fun(response: any))
function Phone.RegisterCallback(name, handler)
    callbacks[name] = handler
    RegisterNUICallback(name, handler)

    for identifier in pairs(apps) do bindCodemCallback(identifier, name, handler) end
end

---@param app { identifier: string, name: string, description?: string, developer?: string, defaultApp?: boolean, size?: number, price?: number, fixBlur?: boolean, onOpen?: fun(), onClose?: fun() }
---@return boolean added
---@return string? errorMessage
function Phone.AddApp(app)
    local name = Phone.Name()
    if not name then return false, "no supported phone (lb-phone / cylex_phone / codem-phone) is started" end

    local base = ("https://cfx-nui-%s/web/build/"):format(resource)
    local icon = base .. "icon.svg"
    apps[app.identifier] = app

    for callbackName, handler in pairs(callbacks) do bindCodemCallback(app.identifier, callbackName, handler) end

    if name == LB then
        return exports[LB]:AddCustomApp({
            identifier = app.identifier,
            name = app.name,
            description = app.description,
            developer = app.developer,
            defaultApp = app.defaultApp,
            size = app.size,
            price = (app.price or 0) > 0 and app.price or nil,
            ui = resource .. "/web/build/index.html",
            icon = icon,
            fixBlur = app.fixBlur,
            onOpen = app.onOpen,
            onClose = app.onClose,
        })
    end

    if name == CODEM then
        return exports[CODEM]:AddCustomApp({
            identifier = app.identifier,
            name = app.name,
            description = app.description,
            developer = app.developer,
            defaultApp = app.defaultApp,
            fixBlur = app.fixBlur,
            addAppStore = Codem.AddAppStore == true,
            ui = ("%sindex.html?phone=codem&resource=%s"):format(base, resource),
            icon = icon,
            onOpen = app.onOpen,
            onClose = app.onClose,
        })
    end

    local added, errorMessage = exports[CYLEX]:AddCustomApp({
        appId = app.identifier,
        label = app.name,
        icon = icon,
        ui = ("%sindex.html?phone=cylex&resource=%s&theme=%s"):format(base, resource, Cylex.Theme == "light" and "light" or "dark"),
    })
    return added ~= false, errorMessage
end

---@param identifier string
function Phone.RemoveApp(identifier)
    apps[identifier] = nil

    local name = Phone.Name()
    if name then exports[name]:RemoveCustomApp(identifier) end
end

---@param identifier string
---@param data { action: string, data: any }
function Phone.SendAppMessage(identifier, data)
    local name = Phone.Name()
    if name == CYLEX then
        exports[CYLEX]:SendCustomNUIMessage(identifier, data)
    elseif name then
        exports[name]:SendCustomAppMessage(identifier, data)
    end
end

---@param identifier string
---@param title string
---@param content string
function Phone.Notify(identifier, title, content)
    local name = Phone.Name()
    if name == LB then
        exports[LB]:SendNotification({ app = identifier, title = title, content = content })
    elseif name == CYLEX then
        exports[CYLEX]:PhoneNotification({
            title = title,
            text = content,
            icon = { name = Cylex.NotificationIcon or "app-icon/settings.png" },
            timeout = Cylex.NotificationTimeout or 5,
            _data = { app = identifier, notification_sound = true },
        })
    elseif name == CODEM then
        TriggerServerEvent(("%s:phone:notify"):format(resource), title, content)
    end
end

---@param cb fun()
function Phone.OnReady(cb)
    addApps = cb
    if Phone.Name() then SetTimeout(1000, cb) end
end

AddEventHandler("onResourceStart", function(name)
    if name ~= LB and name ~= CYLEX and name ~= CODEM then return end

    Wait(1000)
    currentPhone = nil
    if name ~= Phone.Name() or not addApps then return end

    Debug("info", "%s started, adding the app", name)
    addApps()
end)

AddEventHandler("onResourceStop", function(name)
    if name == resource then
        for identifier in pairs(apps) do Phone.RemoveApp(identifier) end
    elseif name == currentPhone then
        currentPhone = nil
    end
end)

AddEventHandler("cylex_phone:client:phoneLoaded", function()
    if Phone.Name() == CYLEX and addApps then addApps() end
end)

RegisterNetEvent("codem-phone:phoneLoaded", function()
    if Phone.Name() ~= CODEM or not addApps then return end
    Wait(2000)
    addApps()
end)

AddEventHandler("cylex_phone:customApp:opened", function(appId)
    local app = Phone.Name() == CYLEX and apps[appId]
    if app and app.onOpen then app.onOpen() end
end)

AddEventHandler("cylex_phone:customApp:closed", function(appId)
    local app = Phone.Name() == CYLEX and apps[appId]
    if app and app.onClose then app.onClose() end
end)

Phone.RegisterCallback("phone:typing", function(data, cb)
    cb({ success = true })

    local typing = data.typing == true
    local name = Phone.Name()
    if name == CYLEX then
        exports[CYLEX]:ToggleFocusKeepInput(not typing)
    elseif name == CODEM then
        exports[CODEM]:SetInputFocus(typing)
    end
end)
