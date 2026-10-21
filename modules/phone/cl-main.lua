-- lb-phone bridge: every lb-phone export used by the app goes through here.
local PHONE <const> = "lb-phone"

--- Returns whether lb-phone is running.
---@return boolean
function Modules.Client.Phone.IsReady()
    return GetResourceState(PHONE) == "started"
end

--- Registers a custom app on the phone.
---@param app table The lb-phone AddCustomApp payload (identifier, name, ui, icon, onOpen, ...).
---@return boolean added True when lb-phone accepted the app.
---@return string? errorMessage The lb-phone error when the app was not added.
function Modules.Client.Phone.AddApp(app)
    if not Modules.Client.Phone.IsReady() then return false, "lb-phone is not started" end
    return exports[PHONE]:AddCustomApp(app)
end

--- Removes a custom app from the phone.
---@param identifier string The app identifier used when it was added.
---@return nil
function Modules.Client.Phone.RemoveApp(identifier)
    if not Modules.Client.Phone.IsReady() then return end
    exports[PHONE]:RemoveCustomApp(identifier)
end

--- Sends a message to the app's UI, received in the web app as a window message.
---@param identifier string The app identifier.
---@param data table The message payload ({ action = string, data = any }).
---@return nil
function Modules.Client.Phone.SendAppMessage(identifier, data)
    if not Modules.Client.Phone.IsReady() then return end
    exports[PHONE]:SendCustomAppMessage(identifier, data)
end
