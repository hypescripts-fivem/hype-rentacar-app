fx_version 'cerulean'
game {'gta5'}

author 'vezironi'
description 'Hype Rent a Car App is an lb-phone app for hype-rentacar. Players can rent vehicles from their phone, track their active rentals and respawn rented vehicles that were removed while the rental time is still running.'

scriptname 'hype-rentacar-app'
version '1.0.0'

dependencies {
    'ox_lib',
    'lb-phone',
    'hype-rentacar',
}

shared_scripts {
    '@ox_lib/init.lua',
    'shared/*.lua',
    'frameworks/main.lua',
    'modules/main.lua',
}

client_scripts {
    'frameworks/**/cl-main.lua',
    'modules/phone/cl-main.lua',
    'client/*.lua',
}

server_scripts {
    'server/*.lua',
}

escrow_ignore {
    'config/*.lua',
    'shared/*.lua',
    'frameworks/main.lua',
    'frameworks/**/*.lua',
    'modules/main.lua',
    'modules/**/*.lua',
}

files {
    'config/config.lua',
    'web/build/*.*',
    'web/build/**/*.*',
    'locales/*.json',
}

ui_page 'web/build/index.html'

lua54 'yes'
use_experimental_fxv2_oal 'yes'
