
// Important keys
const id = 'G-HCGGJHJ3DR'
const disableKey = 'ga-disable-' + id

// Collect our tracking configuration cookies
let hideBanner = (document.cookie.indexOf('hide-banner') >= 0)
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
            document.cookie = 'ga-disable='+ +!this.checked
        }
    })    

    // Set up the cookies checkboxes
    if( hideBanner ) hideCookieBanner()

})

function hideCookieBanner() {
    Array.from(document.getElementsByClassName('cookie-banner')).forEach(e => e.remove())
}

function consentToTracking() {
    document.cookie = 'hide-banner'
    document.cookie = 'ga-disable=0'
    GTagOptIn.optIn()
    hideCookieBanner()
    document.querySelectorAll('input[target=enable-ga]').forEach(e => e.checked = true)
}

function denyTracking() {
    document.cookie = 'hide-banner'
    document.cookie = 'ga-disable=1'
    GTagOptIn.optOut()
    hideCookieBanner()
    document.querySelectorAll('input[target=enable-ga]').forEach(e => e.checked = false)
}