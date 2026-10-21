Modules = {
    Server = {},
    Client = {
        Phone = {},
    }
}

--- Returns the Modules table or a specific side's module group.
--- Exported as `GetModules` for use by other resources.
---@param targetModule string|nil Module name (e.g. "Phone") to get only that module of the current side. Pass nil to get all modules of the current side.
---@return table The requested module group or the current side's modules.
exports("GetModules", function(targetModule)
    local isServer = IsDuplicityVersion() and "Server" or "Client"
    if targetModule and Modules[isServer][targetModule] then
        return Modules[isServer][targetModule]
    end

    return Modules[isServer]
end)
