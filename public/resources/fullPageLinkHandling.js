var fullPage = 'standalone' in navigator && navigator.standalone === true
function handleFullPageLinks() {
    if (!fullPage) return
    console.log('resetting links', $('a'))
    $('a').click(event => {
        var newLocation = $(event.target).attr('href')
        console.log('link clicked', event, newLocation)
        if (
            newLocation !== undefined && 
            newLocation.substr(0, 1) !== '#' && 
            (
                newLocation.substr(0, 1) === '/' ||
                newLocation.contains(location.hostname)
            )
        ) {
            event.preventDefault()
            location.href = newLocation
        }
    })
}