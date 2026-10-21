local Config <const> = require "config.config"

Framework = {
    Name = nil,
    Server = {},
    Client = {},
}

local resources <const> = {
    qbx = "qbx_core",
    qb = "qb-core",
    esx = "es_extended",
}

local candidates <const> = { "qbx_core", "qb-core", "es_extended" }

--- Returns the framework resource to bridge, honouring Config.Framework.
---@return string? The framework resource name, or nil when none is running.
local function detect()
    if Config.Framework and Config.Framework ~= "auto" then return resources[Config.Framework] end

    for _, resource in ipairs(candidates) do
        local state = GetResourceState(resource)
        if state == "started" or state == "starting" then return resource end
    end
end

Framework.Name = detect()

-- The app still works without a framework, only the live balance refresh is lost.
if Framework.Name then
    Debug("info", "Framework detected: %s", Framework.Name)
else
    Debug("warning", "No supported framework found (qbx_core, qb-core, es_extended), balance changes will only refresh when the app is opened")
end

--- Returns the framework bridge for the current side.
--- Exported as `GetFrameworkObject` for use by other resources.
---@return table The Framework.Server table on the server, Framework.Client on the client.
exports("GetFrameworkObject", function()
    return IsDuplicityVersion() and Framework.Server or Framework.Client
end)
