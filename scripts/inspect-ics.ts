// Script to fetch and inspect the ICS feed structure
const ICS_URL = "https://klimatkalendern.nu/feed/instance/ics"

async function inspectICS() {
  console.log("[DEBUG] Fetching ICS feed from:", ICS_URL)

  try {
    const response = await fetch(ICS_URL)
    const text = await response.text()

    console.log("[DEBUG] Total length:", text.length, "characters")
    console.log("[DEBUG] First 2000 characters:\n")
    console.log(text.substring(0, 2000))

    // Find and show a few complete events
    const events = text.split("BEGIN:VEVENT")
    console.log("\n[DEBUG] Total events found:", events.length - 1)

    if (events.length > 1) {
      console.log("\n[DEBUG] === FIRST EVENT ===")
      const firstEvent = "BEGIN:VEVENT" + events[1].split("END:VEVENT")[0] + "END:VEVENT"
      console.log(firstEvent)

      if (events.length > 2) {
        console.log("\n[DEBUG] === SECOND EVENT ===")
        const secondEvent = "BEGIN:VEVENT" + events[2].split("END:VEVENT")[0] + "END:VEVENT"
        console.log(secondEvent)
      }

      if (events.length > 3) {
        console.log("\n[DEBUG] === THIRD EVENT ===")
        const thirdEvent = "BEGIN:VEVENT" + events[3].split("END:VEVENT")[0] + "END:VEVENT"
        console.log(thirdEvent)
      }
    }

    // Look for LOCATION fields
    const locationMatches = text.match(/LOCATION:[^\n]*/g)
    if (locationMatches) {
      console.log("\n[DEBUG] === SAMPLE LOCATIONS ===")
      locationMatches.slice(0, 10).forEach((loc) => console.log(loc))
    }

    // Look for DESCRIPTION fields
    const descMatches = text.match(/DESCRIPTION:[^\n]*/g)
    if (descMatches) {
      console.log("\n[DEBUG] === SAMPLE DESCRIPTIONS (first 5) ===")
      descMatches.slice(0, 5).forEach((desc) => {
        console.log(desc.substring(0, 200) + "...")
      })
    }
  } catch (error) {
    console.error("[DEBUG] Error fetching ICS:", error)
  }
}

inspectICS()
