
function setCookie(name, value='', exdays=365) {
    const d = new Date()
    d.setTime(d.getTime() + (exdays*24*60*60*1000))
    document.cookie = `${name}=${value}; expires=${d.toUTCString()}; path=/`
}

{
    // Important key
    const id = 'G-HCGGJHJ3DR'

    // Read the tracking configuration cookies
    let hideBanner = (document.cookie.indexOf('hide-banner') >= 0) || localStorage.getItem('hideBanner')
    let disabled = (document.cookie.indexOf('ga-disable=1') >= 0)

    // Set up GTagOptIn to allow us to opt in or opt out later
    GTagOptIn.register(id)

    // If the user has already hidden the banner AND enabled tracking, then go!
    if( hideBanner ) {
        if( disabled ) GTagOptIn.optOut()
        else GTagOptIn.optIn()
    }
    
    document.addEventListener('DOMContentLoaded', function() {

        // Set up the 'Enable Google Analytics' checkboxes
        document.querySelectorAll('input[target=enable-ga]').forEach(e => {
            e.checked = hideBanner && !disabled
            e.onclick = function() {
                // Opt in or out depending
                if( this.checked ) GTagOptIn.optOut()
                else GTagOptIn.optIn()
                // Set the cookie
                setCookie('ga-disable', this.checked? '0': '1')
            }
        })    

        // Set up the cookies checkboxes
        if( hideBanner ) removeCookieBanner()
        else showCookieBanner()

    })
}

function showCookieBanner() {
    Array.from(byClass('cookie-banner')).forEach(e => e.classList.remove('hidden'))
}
function removeCookieBanner() {
    Array.from(byClass('cookie-banner')).forEach(e => e.remove())
}

function consentToTracking() {
    setCookie('hide-banner')
    setCookie('ga-disable', 0)
    GTagOptIn.optIn()
    removeCookieBanner()
    document.querySelectorAll('input[target=enable-ga]').forEach(e => e.checked = true)
}

function denyTracking() {
    setCookie('hide-banner')
    setCookie('ga-disable', 1)
    GTagOptIn.optOut()
    removeCookieBanner()
    document.querySelectorAll('input[target=enable-ga]').forEach(e => e.checked = false)
}