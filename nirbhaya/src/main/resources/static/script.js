// =========================================================================
// 1. GLOBAL CORE CONFIGURATION & MEMORY SYSTEM
// =========================================================================
let registeredUsername = localStorage.getItem("registeredUser") || "Officer Guest";
const DEPLOYED_POLICE_PIN = "9110"; 

// Nearest Police Station Reference Coordinate Pins (For Math Calculators)
const POLICE_TARGET_LAT = 10.7908;
const POLICE_TARGET_LNG = 78.7047;

// Internal Simulation Database
let incidentDatabase = JSON.parse(localStorage.getItem("incidentDatabase")) || [];

let verificationQueue = [];
let locationHistoryLog = [];
let internalCounter = 0;
let sosActiveState = false;
let cameraStream = null;
let globalGPSWatchId = null;
let activeIncidentContextId = null;

async function loadIncidents() {

    try {

        const response = await fetch("http://localhost:8081/api/incidents");

        if (!response.ok) {
            throw new Error("Unable to load incidents");
        }

        incidentDatabase = await response.json();

        renderAllDataTables();

    } catch (error) {

        console.error("Error loading incidents:", error);

    }

}
window.addEventListener("load", () => {

    loadIncidents();

});

// =========================================================================
// 2. LIFECYCLE INITIALIZER HANDLERS
// =========================================================================
document.addEventListener("DOMContentLoaded", () => {
    applyDynamicRegisteredIdentity();
    initializeNavigationEngine();
    renderAllDataTables();
    setupContactCardNoticeLabels();
    
    // Switch view default initialization safely
    switchView("dashboard-view");
    
    // START SINGLE GEOLOCATION SYSTEM MONITOR
    initiateUnifiedGPSTracking();
});

function applyDynamicRegisteredIdentity() {
    const displayName = document.getElementById("user-display-name");
    const displayMeta = document.getElementById("user-display-meta");
    const initialIcon = document.getElementById("profile-initial");

    if (displayName) displayName.innerText = registeredUsername;
    if (displayMeta) displayMeta.innerText = registeredUsername;
    if (initialIcon) initialIcon.innerText = registeredUsername.charAt(0).toUpperCase();
}

function initializeNavigationEngine() {
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach(item => {
        item.addEventListener("click", () => {
            const targetView = item.getAttribute("data-target");
            if (targetView) {
                navItems.forEach(i => i.classList.remove("active"));
                item.classList.add("active");
                switchView(targetView);
            }
        });
    });
}

function switchView(viewId) {
    console.log("Opening:", viewId);

    document.querySelectorAll(".view-section").forEach(section => {
        section.style.display = "none";
    });

    const active = document.getElementById(viewId);

    if (!active) {
        console.error("Section not found:", viewId);
        return;
    }

    active.style.display = "block";
}

// =========================================================================
// 3. UNIFIED GEOLOCATION ENGINE
// =========================================================================
function initiateUnifiedGPSTracking() {
    if (!navigator.geolocation) {
        showToast("Geolocation engine unmapped on this browser.", true);
        updateDOMText("gpsStatus", "Unsupported");
        return;
    }

    updateDOMText("gpsStatus", "Acquiring...");

    globalGPSWatchId = navigator.geolocation.watchPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const accuracy = position.coords.accuracy;
            const locationString = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
            const timestampNow = new Date().toLocaleTimeString();

            // 1. Update Core Panel Metrics safely
            updateDOMText("latitude", lat.toFixed(6) + "°");
            updateDOMText("longitude", lng.toFixed(6) + "°");
            updateDOMText("latitudeText", "Latitude: " + lat.toFixed(6));
            updateDOMText("longitudeText", "Longitude: " + lng.toFixed(6));
            updateDOMText("accuracy", accuracy.toFixed(1) + " m");
            updateDOMText("gpsStatus", "Active");
            updateDOMText("updated", timestampNow);
            updateDOMText("currentAddressText", "GPS Live Lock Secured");

            // 2. Map Update (Targets explicit unique IDs instead of generic iframe queries)
            const liveMapIframe = document.getElementById("liveMap");
            if (liveMapIframe) {
                liveMapIframe.src = `https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`;
            }
            
            const locationMapIframe = document.getElementById("locationMap");
            if (locationMapIframe) {
                locationMapIframe.src = `https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`;
            }

            // 3. Mathematical Safety Range Metrics Tracking Calculations
            const distanceKM = calculateHaversineDistance(lat, lng, POLICE_TARGET_LAT, POLICE_TARGET_LNG);
            updateDOMText("routeDestination", "Nearest Police Station");
            updateDOMText("routeKm", distanceKM.toFixed(2) + " km");
            updateDOMText("routeTime", Math.ceil(distanceKM * 4) + " mins");

            const viewRouteBtn = document.getElementById("viewRoute");
            if (viewRouteBtn) {
                viewRouteBtn.onclick = () => {
                    window.open(`https://www.google.com/maps/dir/${lat},${lng}/${POLICE_TARGET_LAT},${POLICE_TARGET_LNG}`, "_blank");
                };
            }

            // 4. Reverse Geocoding with error encapsulation block arrays
            fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`)
                .then(res => res.json())
                .then(data => {
                    const cleanAddress = data.display_name || "Coordinates Area Verified";
                    updateDOMText("address", cleanAddress);

                    // Prevent array explosions by throttling tracking history log records
                    if (locationHistoryLog.length === 0 || locationHistoryLog[0].location !== cleanAddress) {
                        locationHistoryLog.unshift({ time: timestampNow, location: cleanAddress });
                        if (locationHistoryLog.length > 10) locationHistoryLog.pop();
                        renderLocationHistoryTable();
                    }
                })
                .catch(err => {
                    console.error("Nominatim Reverse Lookup Throttled:", err);
                });

            // 5. Reactive Automated Incident Pipeline Processing
            if (sosActiveState && !activeIncidentContextId) {
                internalCounter++;
                activeIncidentContextId = `INC${String(internalCounter).padStart(3, "0")}`;
                const dateObj = new Date();
                
                const alertPayload = {
                    id: activeIncidentContextId,
                    name: registeredUsername,
                    location: locationString,
                    date: dateObj.toLocaleDateString("en-GB"),
                    time: dateObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
                    status: "Pending Investigation"
                };

                verificationQueue.unshift(alertPayload);
                appendAlertToQueue(alertPayload.id, alertPayload.name, alertPayload.location, alertPayload.time);
                openPoliceVerificationWidget(alertPayload);
                renderAllDataTables();
            }
        },
        (err) => {
            console.warn("GPS Tracking Node Interrupt Exception:", err.message);
            updateDOMText("gpsStatus", "Unavailable");
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
}

// =========================================================================
// 4. ACTIVE EMERGENCY BEACON SIGNALING SYSTEMS
// =========================================================================
async function triggerSOS() {

    sosActiveState = !sosActiveState;

    const sosBtn = document.getElementById("sosMainBtn");
    const banner = document.getElementById("videoBanner");

    if (sosActiveState) {

        // Button animation
        if (sosBtn) sosBtn.classList.add("recording-active");

        // Show video section
        if (banner) banner.style.display = "flex";

        // Notification
        addNotification("🚨 SOS Alert Activated");

        // Play siren if enabled
        const loudSiren = document.getElementById("loudSiren");
        if (loudSiren && loudSiren.checked) {
            playSiren();
        }

        // Start camera
        try {
            await startVideoRecording();
        } catch (e) {
            console.error("Camera Error:", e);
        }

        // Create Incident
        internalCounter++;

        const now = new Date();

        const incident = {


            id: "INC" + String(internalCounter).padStart(3, "0"),
            name: (profile && (profile.fullName || profile.name)) || "Unknown User",
            age: (profile && profile.age) || "-",
            location: (profile && profile.location) || "Current GPS Location",
            date: now.toLocaleDateString("en-GB"),
            time: now.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
            }),
            status: "Pending Verification"
        };
        

        console.log("INCIDENT =", incident);

        // Add ONLY to Verification Queue
        verificationQueue.unshift(incident);
        console.log("Added to verificationQueue:", verificationQueue);

        // Add sample data only once

    localStorage.setItem(
        "verificationQueue",
        JSON.stringify(verificationQueue)
    );

        // Save


        // Open Police Verification
        activeIncidentContextId = incident.id;

        openPoliceVerificationWidget({
            id: incident.id,
            name: incident.name,
            time: incident.time
        });

        // Refresh Tables
        renderAllDataTables();

        showToast("🚨 SOS Alert Sent Successfully", true);

    } else {

        if (sosBtn) sosBtn.classList.remove("recording-active");

        if (banner) banner.style.display = "none";

        stopVideoRecording();

        stopSiren();

        activeIncidentContextId = null;

        addNotification("✅ SOS Alert Stopped");

        showToast("SOS Standby Mode Restored");

    }
}


async function startVideoRecording() {

    const video = document.getElementById("videoPreview");

    if (!video) {
        console.log("videoPreview not found");
        return;
    }

    cameraStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
    });

    video.srcObject = cameraStream;
    await video.play();
}

function stopVideoRecording() {
    const video = document.getElementById("videoPreview");
    if (video && video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop()); 
        video.srcObject = null;
    }
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
}

function getLiveLocation() {
    triggerSOS();
}

// =========================================================================
// 5. SECURITY DISPATCH INTEGRITY CHANNELS
// =========================================================================
function openPoliceVerificationWidget(alertObj) {
    const widget = document.getElementById("policeVerificationWidget");
    if (!widget) return;

    const idField = document.getElementById("activeSosId");
    const nameField = document.getElementById("activeSosName");
    const timeField = document.getElementById("activeSosTime");

    if (idField) idField.innerText = alertObj.id;
    if (nameField) nameField.innerText = alertObj.name;
    if (timeField) timeField.innerText = alertObj.time;
    
    widget.style.display = "block";
}

function processPoliceDecision(isGenuine) {

    const inputCredentials = prompt(
        "SECURITY GATEWAY: Enter Authority Police Personnel PIN to validate operations:"
    );

    if (inputCredentials === null) return;

    if (inputCredentials !== DEPLOYED_POLICE_PIN) {
        showToast("ACCESS DENIED: Invalid Credentials.", true);
        return;
    }

    const widget = document.getElementById("policeVerificationWidget");
    if (widget) widget.style.display = "none";

    if (!activeIncidentContextId) return;

    const targetIndex = verificationQueue.findIndex(
        item => item.id === activeIncidentContextId
    );

    if (targetIndex === -1) return;

    const targetItem = verificationQueue.splice(targetIndex, 1)[0];

    if (isGenuine) {

        addNotification(
            "🚓 Your SOS alert has been verified. Police assistance is on the way. Stay calm—we are here to help you."
        );

        targetItem.status = "Under Investigation";

        incidentDatabase.unshift({
            id: targetItem.id,
            name: targetItem.name,
            age: targetItem.age,
            location: targetItem.location,
            date: targetItem.date,
            time: targetItem.time,
            status: targetItem.status
        });

        localStorage.setItem(
            "incidentDatabase",
            JSON.stringify(incidentDatabase)
        );

        showToast("POLICE VERIFIED: Incident added to Incident Database.");

    } else {

        addNotification(
            "⚠️ Warning: Your SOS was marked as a false alarm. Please do not misuse the emergency system, as false alerts waste valuable police resources."
        );

        showToast("False Alarm Removed.", true);

    }

    localStorage.setItem(
        "verificationQueue",
        JSON.stringify(verificationQueue)
    );

    activeIncidentContextId = null;

    renderAllDataTables();
}
// =========================================================================
// 6. ADMINISTRATIVE FORM DATABASE INTERACTION HOOKS
// =========================================================================
function handleFormSubmit(event) {
    event.preventDefault();
    const editId = document.getElementById("editIncidentId").value;
    const name = document.getElementById("victimName").value;
    const age = parseInt(document.getElementById("victimAge").value) || "—";
    const location = document.getElementById("incidentLocation").value;
    const status = document.getElementById("caseStatus").value;

    const rightNow = new Date();
    const currentDateStr = `${String(rightNow.getDate()).padStart(2, '0')}-${String(rightNow.getMonth() + 1).padStart(2, '0')}-${rightNow.getFullYear()}`;
    
    let hours = rightNow.getHours();
    const minutes = String(rightNow.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const currentTimeStr = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;

    if (editId) {
        const recordIdx = incidentDatabase.findIndex(r => r.id === editId);
        if (recordIdx > -1) {
            incidentDatabase[recordIdx].name = name;
            incidentDatabase[recordIdx].age = age;
            incidentDatabase[recordIdx].location = location;
            incidentDatabase[recordIdx].status = status;
            showToast(`Record ${editId} updated safely.`);
        }
    } else {
        internalCounter++;
        const newId = `INC${String(internalCounter).padStart(3, '0')}`;
        incidentDatabase.unshift({ id: newId, name, age, location, date: currentDateStr, time: currentTimeStr, status });
        showToast(`Incident logged: ${newId}`);
        appendAlertToQueue(newId, name, location, currentTimeStr);
    }
    resetFormState();
    renderAllDataTables();
}

function resetFormState() {
    const form = document.getElementById("incidentForm");
    const editIdHolder = document.getElementById("editIncidentId");
    const submitBtn = document.getElementById("formSubmitBtn");

    if (form) form.reset();
    if (editIdHolder) editIdHolder.value = "";
    if (submitBtn) submitBtn.innerHTML = `<i class="fa-solid fa-server"></i> Commit Record to System Database`;
}

function editRecord(id) {
    const record = incidentDatabase.find(r => r.id === id);
    if (!record) return;

    const editIdHolder = document.getElementById("editIncidentId");
    const vName = document.getElementById("victimName");
    const vAge = document.getElementById("victimAge");
    const iLoc = document.getElementById("incidentLocation");
    const cStat = document.getElementById("caseStatus");
    const submitBtn = document.getElementById("formSubmitBtn");
    const formElement = document.getElementById("incidentForm");

    if (editIdHolder) editIdHolder.value = record.id;
    if (vName) vName.value = record.name;
    if (vAge) vAge.value = record.age === "—" ? "" : record.age;
    if (iLoc) iLoc.value = record.location;
    if (cStat) cStat.value = record.status;

    if (submitBtn) submitBtn.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Apply Updates to Record ${id}`;
    if (formElement) formElement.scrollIntoView({ behavior: 'smooth' });
}

function deleteRecord(id) {
    if (confirm(`Confirm erasure sequence for record: ${id}?`)) {
        incidentDatabase = incidentDatabase.filter(r => r.id !== id);
        showToast(`Record ${id} dropped successfully.`, true);
        renderAllDataTables();
    }
}

// =========================================================================
// 7. RENDER TABLES AND DATA SHEETS LAYOUT SYSTEM
// =========================================================================
function renderAllDataTables() {

    // ================= Incident Database =================

    const primaryBody = document.getElementById("databaseTableBody");

    if (primaryBody) {

        primaryBody.innerHTML = "";

        incidentDatabase.forEach(record => {

            let badgeClass = "pending";

            if (record.status === "Under Investigation")
                badgeClass = "under-investigation";

            if (record.status === "Resolved")
                badgeClass = "resolved";

            if (record.status === "Closed")
                badgeClass = "closed";

            const tr = document.createElement("tr");
            tr.innerHTML = `
    <td>${record.id}</td>
    <td>${record.name}</td>
    <td>${record.age}</td>
    <td>${record.location}</td>
    <td>${record.date}</td>
    <td>${record.time}</td>

    <td>
        <span class="status-badge ${badgeClass}">
            ${record.status}
        </span>
    </td>

    <td>
        <button onclick="editRecord('${record.id}')">
            Edit
        </button>

        <button onclick="deleteRecord('${record.id}')">
            Delete
        </button>
    </td>
`;

            primaryBody.appendChild(tr);

        });

    }

    // ================= Verification Queue =================

    const verificationBody = document.getElementById("verificationTableBody");

    if (verificationBody) {

        verificationBody.innerHTML = "";

        if (verificationQueue.length === 0) {

            verificationBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center;">
                    No Pending SOS Alerts
                </td>
            </tr>`;

        } else {
            console.log("Verification Queue:", verificationQueue);

            verificationQueue.forEach(record => {
                console.log("Record:", record);

                const tr = document.createElement("tr");

                tr.innerHTML = `
                    <td>${record.id}</td>
                    <td>${record.name}</td>
                    <td>${record.location}</td>
                    <td>${record.time}</td>
                    <td>
                        <span class="status-badge pending">
                            ${record.status}
                        </span>
                    </td>
                `;

                verificationBody.appendChild(tr);

            });

        }

    }

    // ================= Authenticated Emergency Records =================

    const confirmedBody = document.getElementById("confirmedTableBody");

    if (confirmedBody) {

        confirmedBody.innerHTML = "";

        const verifiedRecords = incidentDatabase.filter(record =>
            record.status === "Under Investigation" ||
            record.status === "Resolved" ||
            record.status === "Closed"
        );

        if (verifiedRecords.length === 0) {

            confirmedBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;">
                    No Verified Records
                </td>
            </tr>`;

        } else {

            verifiedRecords.forEach(record => {

                const tr = document.createElement("tr");

                tr.innerHTML = `
                    <td>${record.id}</td>
                    <td>${record.name}</td>
                    <td>${record.location}</td>
                    <td>${record.date}</td>
                    <td>${record.time}</td>
                    <td>
                        <span class="status-badge resolved">
                            Verified
                        </span>
                    </td>
                `;

                confirmedBody.appendChild(tr);

            });

        }

    }

    updateMetricCounters();

}

function renderLocationHistoryTable() {
    const historyTable = document.getElementById("historyTable");
    if (!historyTable) return;

    let html = "";
    locationHistoryLog.forEach(item => {
        html += `
        <tr class="border-b">
            <td class="py-2 text-xs font-semibold text-slate-500">${item.time}</td>
            <td class="py-2 text-xs text-slate-700">${item.location}</td>
        </tr>
        `;
    });
    historyTable.innerHTML = html || `<tr><td colspan="2" class="text-center py-4 text-xs text-slate-400">No telemetry log trails computed yet.</td></tr>`;
}

function appendAlertToQueue(id, name, location, time) {
    const queue = document.getElementById("recentAlertsQueue");
    if (!queue) return;
    
    const alertItem = document.createElement("div");
    alertItem.className = "alert-item";
    alertItem.innerHTML = `
        <div class="alert-icon-wrapper alert-red"><i class="fa-solid fa-triangle-exclamation"></i></div>
        <div class="alert-content">
            <div class="alert-row-top">
                <h5>${id}: ${name}</h5>
                <span class="alert-time">${time}</span>
            </div>
            <p>Location: ${location}</p>
        </div>
    `;
    queue.insertBefore(alertItem, queue.firstChild);
}

function updateMetricCounters() {
    const cTotal = document.getElementById("count-total");
    const cPending = document.getElementById("count-pending");
    const cInvest = document.getElementById("count-investigating");
    const cResolve = document.getElementById("count-resolved");

    if (cTotal) cTotal.innerText = incidentDatabase.length;
    if (cPending) cPending.innerText = verificationQueue.length;
    if (cInvest) cInvest.innerText = incidentDatabase.filter(r => r.status === "Under Investigation").length;
    if (cResolve) cResolve.innerText = incidentDatabase.filter(r => r.status === "Resolved").length;
}

// =========================================================================
// 8. DEFENSIVE HARDWARE HELPERS & UTILITIES
// =========================================================================
function updateDOMText(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.innerHTML = value;
    }
}

function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's Radius
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

    function setupContactCardNoticeLabels() {

    const contacts = JSON.parse(localStorage.getItem("emergencyContacts")) || [];

    const cName1 = document.getElementById("contactName1");
    const cPhone1 = document.getElementById("contactPhone1");
    const cName2 = document.getElementById("contactName2");
    const cPhone2 = document.getElementById("contactPhone2");

    const call1 = document.getElementById("call1");
    const call2 = document.getElementById("call2");

    if (contacts.length > 0) {
        cName1.innerText = contacts[0].name;
        cPhone1.innerText = contacts[0].phone;
        call1.href = "tel:" + contacts[0].phone;
    }

    if (contacts.length > 1) {
        cName2.innerText = contacts[1].name;
        cPhone2.innerText = contacts[1].phone;
        call2.href = "tel:" + contacts[1].phone;
    }
}
async function getCurrentLocation() {

    if (!navigator.geolocation) {
        alert("Geolocation is not supported.");
        return;
    }

    navigator.geolocation.getCurrentPosition(

        async (position) => {

            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            console.log("Latitude:", lat);
            console.log("Longitude:", lon);
            console.log("Accuracy:", position.coords.accuracy + " meters");

            // Update Map
            const map = document.getElementById("locationMap");

            if (map) {
                map.src = `https://www.openstreetmap.org/export/embed.html?bbox=${lon-0.02},${lat-0.02},${lon+0.02},${lat+0.02}&layer=mapnik&marker=${lat},${lon}`;
            }

            // Call your existing nearby places code here
            // (Keep all the code you already have below this line)

        },

        (error) => {

            console.error(error);

            switch (error.code) {
                case error.PERMISSION_DENIED:
                    alert("Location permission denied.");
                    break;
                case error.POSITION_UNAVAILABLE:
                    alert("Location unavailable.");
                    break;
                case error.TIMEOUT:
                    alert("Location request timed out.");
                    break;
                default:
                    alert("Unable to access your location.");
            }

        },

        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        }

    );
}
function updateNearbyPlaces(lat, lng) {

    // Police Station
    const policeDistance = calculateHaversineDistance(
        lat, lng,
        10.7908, 78.7047
    );

    document.getElementById("policeDistance").innerHTML =
        `🚔 Police Station - ${policeDistance.toFixed(2)} km`;

    // Hospital
    const hospitalDistance = calculateHaversineDistance(
        lat, lng,
        10.7925, 78.6989
    );

    document.getElementById("hospitalDistance").innerHTML =
        `🏥 Hospital - ${hospitalDistance.toFixed(2)} km`;

    // Help Center
    const helpDistance = calculateHaversineDistance(
        lat, lng,
        10.7884, 78.7012
    );

    document.getElementById("helpDistance").innerHTML =
        `🆘 Help Center - ${helpDistance.toFixed(2)} km`;

    // Shelter
    const shelterDistance = calculateHaversineDistance(
        lat, lng,
        10.7940, 78.7065
    );

    document.getElementById("shelterDistance").innerHTML =
        `🏠 Shelter - ${shelterDistance.toFixed(2)} km`;

    // Safe Route
    document.getElementById("routeDistance").innerHTML =
        `🛣 Safe Route - ${policeDistance.toFixed(2)} km`;
}

function startTracking() {
    initiateUnifiedGPSTracking();
}

function stopTracking() {
    if (globalGPSWatchId !== null) {
        navigator.geolocation.clearWatch(globalGPSWatchId);
        globalGPSWatchId = null;
    }
}
async function loadNearbyPlaces(lat, lng) {
    const container = document.getElementById("nearbyPlaces");

    container.innerHTML = "<span>Loading...</span>";

    try {
        const radius = 3000; // 3 km

        const query = `
        [out:json];
        (
          node["amenity"="police"](around:${radius},${lat},${lng});
          node["amenity"="hospital"](around:${radius},${lat},${lng});
          node["amenity"="shelter"](around:${radius},${lat},${lng});
        );
        out;
        `;

        const response = await fetch(
            "https://overpass-api.de/api/interpreter",
            {
                method: "POST",
                body: query
            }
        );

        const data = await response.json();

        if (!data.elements.length) {
            container.innerHTML = "<p>No nearby places found.</p>";
            return;
        }

        container.innerHTML = "";

        data.elements.forEach(place => {

            let type = "Safe Place";

            if (place.tags.amenity === "hospital")
                type = "Hospital";

            if (place.tags.amenity === "police")
                type = "Police Station";

            if (place.tags.amenity === "shelter")
                type = "Shelter";

            const badge = document.createElement("div");
            badge.className = "safe-place-chip";

            badge.innerHTML = `
                <strong>${place.tags.name || type}</strong><br>
                <small>${type}</small>
            `;

            container.appendChild(badge);
        });

    } catch (err) {
        console.error(err);
        container.innerHTML = "<p>Unable to load nearby places.</p>";
    }
}
// Get contacts from localStorage
let contacts = JSON.parse(localStorage.getItem("emergencyContacts")) || [];

const table = document.getElementById("contactTable");

function loadContacts() {

    table.innerHTML = "";

    if (contacts.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-6 text-slate-500">
                    No contacts available.
                </td>
            </tr>`;
        updateStats();
        return;
    }

    contacts.forEach((contact, index) => {

        const firstLetter = contact.name.charAt(0).toUpperCase();

        table.innerHTML += `
        <tr class="border-b hover:bg-slate-50 cursor-pointer"
            onclick="showContact(${index})">

            <td class="p-3">
                <div class="flex items-center gap-3">

                    <div class="w-10 h-10 rounded-full bg-pink-500
                        text-white flex items-center justify-center font-bold">

                        ${firstLetter}

                    </div>

                    <div>

                        <p class="font-semibold">${contact.name}</p>

                    </div>

                </div>
            </td>

            <td class="p-3">${contact.relationship}</td>

            <td class="p-3">${contact.phone}</td>

            <td class="p-3 text-center">

                <button class="text-pink-600"
                    onclick="event.stopPropagation();callContact('${contact.phone}')">

                    📞

                </button>

            </td>

        </tr>
        `;
    });

    updateStats();
}

function showContact(index){

    const c = contacts[index];

    document.getElementById("avatar").innerHTML =
        c.name.charAt(0).toUpperCase();

    document.getElementById("detailName").innerHTML =
        c.name;

    document.getElementById("detailRelationship").innerHTML =
        c.relationship;

    document.getElementById("detailPhone").innerHTML =
        c.phone;

    document.getElementById("detailPriority").innerHTML =
        c.priority || "High";

    document.getElementById("detailAddress").innerHTML =
        c.address || "-";

    document.getElementById("detailNotes").innerHTML =
        c.notes || "-";

}

function updateStats(){

    document.getElementById("totalContacts").innerHTML =
        contacts.length;

    document.getElementById("emergencyContacts").innerHTML =
        contacts.length;

    document.getElementById("oneTapContacts").innerHTML =
        contacts.length;

    let family = contacts.filter(c =>
        c.relationship === "Mother" ||
        c.relationship === "Father" ||
        c.relationship === "Brother" ||
        c.relationship === "Sister" ||
        c.relationship === "Guardian" ||
        c.relationship === "Spouse"
    );

    document.getElementById("familyContacts").innerHTML =
        family.length;

}

function callContact(phone){

    window.location.href = "tel:" + phone;

}

// Search
document.getElementById("searchContact").addEventListener("keyup",function(){

    let value = this.value.toLowerCase();

    let rows = table.querySelectorAll("tr");

    rows.forEach(row=>{

        row.style.display =
        row.innerText.toLowerCase().includes(value)
        ? ""
        : "none";

    });

});

loadContacts();
//report page
// Sample Mock Database for initialization
// Sample Mock Database for initialization
const initialReportsData = [
    {
        id: 1,
        type: "Suspicious Activity",
        date: "2026-06-28",
        time: "21:15",
        location: "T Nagar Bus Terminus, Chennai"
    },
    {
        id: 2,
        type: "Stalking / Harassment",
        date: "2026-06-25",
        time: "18:40",
        location: "OMR Food Street"
    }
];

document.addEventListener("DOMContentLoaded", () => {
    const reportForm = document.getElementById("nsrIncidentForm");
    const logFeedContainer = document.getElementById("nsrLogList");
    const dragDropZone = document.getElementById("nsrDropZone");
    const internalFileInput = document.getElementById("nsrFileInput");
    const uploadPreviewBox = document.getElementById("nsrFilePreviewList");

    let liveReportsList = [...initialReportsData];

    // --- RENDER DYNAMIC LOG SYSTEM ---
    function renderReportsList() {
        logFeedContainer.innerHTML = "";
        
        if (liveReportsList.length === 0) {
            logFeedContainer.innerHTML = `<p style="font-size: 13px; color: #94a3b8; text-align: center; padding: 20px;">No logs recorded yet.</p>`;
            return;
        }

        liveReportsList.forEach(report => {
            const itemElement = document.createElement("div");
            itemElement.className = "nsr-feed-item";
            itemElement.innerHTML = `
                <div class="nsr-feed-meta-row">
                    <span class="nsr-feed-type">${sanitizeInput(report.type)}</span>
                    <span class="nsr-feed-timestamp">${report.date} | ${report.time}</span>
                </div>
                <div class="nsr-feed-loc-text">
                    <i class="fa-solid fa-location-dot" style="font-size: 11px; margin-right: 4px;"></i>${sanitizeInput(report.location)}
                </div>
            `;
            logFeedContainer.appendChild(itemElement);
        });
    }

    // --- SUBMISSION LOGIC ---
    reportForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const createdReport = {
            id: Date.now(),
            type: document.getElementById("nsrIncidentType").value,
            date: document.getElementById("nsrIncidentDate").value,
            time: document.getElementById("nsrIncidentTime").value,
            location: document.getElementById("nsrIncidentLocation").value,
        };

        liveReportsList.unshift(createdReport);
        renderReportsList();

        reportForm.reset();
        uploadPreviewBox.innerHTML = "";
        alert("🔒 Report logged securely. Local instance storage refreshed.");
    });

    // --- UPLOAD COMPONENT ENGINE ---
    dragDropZone.addEventListener("click", () => internalFileInput.click());

    internalFileInput.addEventListener("change", (event) => {
        processUploadedFiles(event.target.files);
    });

    dragDropZone.addEventListener("dragover", (event) => {
        event.preventDefault();
        dragDropZone.style.backgroundColor = "#ffe4e6";
    });

    dragDropZone.addEventListener("dragleave", () => {
        dragDropZone.style.backgroundColor = "#fafafa";
    });

    dragDropZone.addEventListener("drop", (event) => {
        event.preventDefault();
        dragDropZone.style.backgroundColor = "#fafafa";
        processUploadedFiles(event.dataTransfer.files);
    });

    function processUploadedFiles(filesList) {
        uploadPreviewBox.innerHTML = "";
        Array.from(filesList).forEach(fileItem => {
            const chipNode = document.createElement("div");
            chipNode.className = "nsr-file-chip";
            chipNode.innerHTML = `<i class="fa-solid fa-paperclip"></i> ${sanitizeInput(fileItem.name)} (${(fileItem.size/1024).toFixed(1)} KB)`;
            uploadPreviewBox.appendChild(chipNode);
        });
    }

    // Protection helper
    function sanitizeInput(rawString) {
        return rawString.replace(/[&<>'"]/g, 
            matchedTag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[matchedTag] || matchedTag)
        );
    }

    // Initialization trigger
    renderReportsList();
});
//end of report

function showToast(msg, isError = false) {
    const toast = document.getElementById("toastNotification"); 
    const text = document.getElementById("toastMessage");
    if (!toast || !text) return;
    
    toast.className = "toast-notification" + (isError ? " toast-error" : "");
    text.innerText = msg;
    toast.classList.add("show");
    
    setTimeout(() => {
        toast.classList.remove("show");
    }, 4000);
}
// ===============================
// SETTINGS PAGE - PART 1
// ===============================

document.addEventListener("DOMContentLoaded", () => {

    // Initialize Lucide Icons
    if (typeof lucide !== "undefined") {
        lucide.createIcons();
    }

    // -------------------------
    // Default Settings
    // -------------------------

    const defaultSettings = {

        videoRecording: true,
        liveLocation: true,
        emergencyContacts: true,
        loudSiren: false,

        sosAlerts: true,
        systemUpdates: true,
        promotions: false,

        dataSharing: true,

        profileVisibility: "Only Me",
        locationVisibility: "Only During SOS",

        language: "English",

        theme: "Light Mode"

    };

    // -------------------------
    // Load Settings
    // -------------------------

    let settings = JSON.parse(localStorage.getItem("nirbhayaSettings"));

    if (!settings) {

        settings = defaultSettings;

        localStorage.setItem(
            "nirbhayaSettings",
            JSON.stringify(settings)
        );

    }

    // -------------------------
    // Save Settings
    // -------------------------

    function saveSettings() {

        localStorage.setItem(
            "nirbhayaSettings",
            JSON.stringify(settings)
        );

        showToast("Settings Saved Successfully");

    }

    // -------------------------
    // Toast Notification
    // -------------------------

    function showToast(message) {

        const toast = document.createElement("div");

        toast.innerText = message;

        toast.style.position = "fixed";
        toast.style.bottom = "25px";
        toast.style.right = "25px";
        toast.style.background = "#E91E63";
        toast.style.color = "#fff";
        toast.style.padding = "14px 22px";
        toast.style.borderRadius = "10px";
        toast.style.fontWeight = "600";
        toast.style.boxShadow = "0 8px 20px rgba(0,0,0,.25)";
        toast.style.zIndex = "99999";
        toast.style.opacity = "0";
        toast.style.transition = ".3s";

        document.body.appendChild(toast);

        setTimeout(() => {

            toast.style.opacity = "1";

        }, 100);

        setTimeout(() => {

            toast.style.opacity = "0";

            setTimeout(() => {

                toast.remove();

            }, 300);

        }, 1800);

    }

    // -------------------------
    // Toggle Handler
    // -------------------------

    function bindToggle(id) {

        const element = document.getElementById(id);

        if (!element) return;

        element.checked = settings[id];

        element.addEventListener("change", () => {

            settings[id] = element.checked;

            saveSettings();

        });

    }

    bindToggle("videoRecording");
    bindToggle("liveLocation");
    bindToggle("emergencyContacts");
    bindToggle("loudSiren");
    bindToggle("sosAlerts");
    bindToggle("systemUpdates");
    bindToggle("promotions");
    bindToggle("dataSharing");

    // -------------------------
    // Profile Visibility
    // -------------------------

    const profileVisibility =
        document.getElementById("profileVisibility");

    if (profileVisibility) {

        profileVisibility.value =
            settings.profileVisibility;

        profileVisibility.addEventListener("change", () => {

            settings.profileVisibility =
                profileVisibility.value;

            saveSettings();

        });

    }

    // -------------------------
    // Location Visibility
    // -------------------------

    const locationVisibility =
        document.getElementById("locationVisibility");

    if (locationVisibility) {

        locationVisibility.value =
            settings.locationVisibility;

        locationVisibility.addEventListener("change", () => {

            settings.locationVisibility =
                locationVisibility.value;

            saveSettings();

        });

    }

    // -------------------------
    // Language
    // -------------------------

    const language =
        document.getElementById("languageSelect");

    if (language) {

        language.value =
            settings.language;

        language.addEventListener("change", () => {

            settings.language =
                language.value;

            saveSettings();

        });

    }

    // -------------------------
    // Theme
    // -------------------------

    const theme =
        document.getElementById("themeSelect");

    if (theme) {

        theme.value =
            settings.theme;

        applyTheme(settings.theme);

        theme.addEventListener("change", () => {

            settings.theme =
                theme.value;

            applyTheme(theme.value);

            saveSettings();

        });

    }

    // -------------------------
    // Theme Function
    // -------------------------

    function applyTheme(mode) {

        if (mode === "Dark Mode") {

            document.body.style.background = "#111827";
            document.body.style.color = "#ffffff";

        } else {

            document.body.style.background = "";
            document.body.style.color = "";

        }

    }

});
// ===========================================
// SETTINGS PAGE - PART 2
// ===========================================

// ---------- Load Profile ----------

let profile = JSON.parse(localStorage.getItem("nirbhayaProfile"));
console.log("PROFILE =", profile);

if (!profile) {

    profile = {
        name: document.getElementById("userName").textContent,
        email: document.getElementById("userEmail").textContent,
        phone: document.getElementById("userPhone").textContent,
        password: "************"
    };

    localStorage.setItem(
        "nirbhayaProfile",
        JSON.stringify(profile)
    );

}

// ---------- Display Saved Data ----------

document.getElementById("userName").textContent = profile.name;

document.getElementById("userEmail").textContent = profile.email;

document.getElementById("userPhone").textContent = profile.phone;

document.getElementById("userPassword").textContent =
"************";


// ---------- Save Function ----------

function saveProfile(){

    localStorage.setItem(
        "nirbhayaProfile",
        JSON.stringify(profile)
    );

}


// ---------- Edit Name ----------

const editName =
document.getElementById("userName").parentElement.parentElement;

editName.addEventListener("click",()=>{

    const value = prompt(
        "Enter Full Name",
        profile.name
    );

    if(value && value.trim()!=""){

        profile.name=value;

        document.getElementById("userName").textContent=value;

        saveProfile();

        showToast("Name Updated");

    }

});


// ---------- Edit Email ----------

const editEmail =
document.getElementById("userEmail").parentElement.parentElement;

editEmail.addEventListener("click",()=>{

    const value=prompt(
        "Enter Email Address",
        profile.email
    );

    if(value && value.trim()!=""){

        profile.email=value;

        document.getElementById("userEmail").textContent=value;

        saveProfile();

        showToast("Email Updated");

    }

});


// ---------- Edit Phone ----------

const editPhone =
document.getElementById("userPhone").parentElement.parentElement;

editPhone.addEventListener("click",()=>{

    const value=prompt(
        "Enter Phone Number",
        profile.phone
    );

    if(value && value.trim()!=""){

        profile.phone=value;

        document.getElementById("userPhone").textContent=value;

        saveProfile();

        showToast("Phone Number Updated");

    }

});


// ---------- Change Password ----------

const changePasswordBtn =
document.getElementById("changePasswordBtn");

changePasswordBtn.addEventListener("click",()=>{

    const pass1 = prompt(
        "Enter New Password"
    );

    if(!pass1) return;

    const pass2 = prompt(
        "Confirm Password"
    );

    if(pass1!==pass2){

        alert("Passwords do not match.");

        return;

    }

    profile.password=pass1;

    saveProfile();

    showToast("Password Changed Successfully");

});
// ===========================================
// SETTINGS PAGE - PART 3
// Danger Zone & Reset Functions
// ===========================================

// ---------- Clear All Data ----------

const clearDataBtn = document.getElementById("clearDataBtn");

if (clearDataBtn) {

    clearDataBtn.addEventListener("click", () => {

        const confirmClear = confirm(
            "Are you sure?\n\nThis will clear all saved settings and profile data."
        );

        if (!confirmClear) return;

        localStorage.removeItem("nirbhayaSettings");
        localStorage.removeItem("nirbhayaProfile");

        alert("All saved data has been cleared.\n\nReloading page...");

        location.reload();

    });

}

// ---------- Deactivate Account ----------

const deactivateBtn = document.getElementById("deactivateBtn");

if (deactivateBtn) {

    deactivateBtn.addEventListener("click", () => {

        const confirmDeactivate = confirm(
            "Deactivate your account?\n\nYou can activate it again later."
        );

        if (!confirmDeactivate) return;

        deactivateBtn.disabled = true;

        deactivateBtn.innerHTML = "Account Deactivated";

        deactivateBtn.classList.remove("bg-red-600");
        deactivateBtn.classList.add("bg-gray-500");

        localStorage.setItem("accountStatus", "deactivated");

        showToast("Account Deactivated");

    });

}

// ---------- Restore Deactivated State ----------

if (localStorage.getItem("accountStatus") === "deactivated") {

    if (deactivateBtn) {

        deactivateBtn.disabled = true;

        deactivateBtn.innerHTML = "Account Deactivated";

        deactivateBtn.classList.remove("bg-red-600");

        deactivateBtn.classList.add("bg-gray-500");

    }

}

// ---------- Reset Theme ----------

function resetTheme() {

    document.body.style.background = "";

    document.body.style.color = "";

}

// ---------- Reset Everything ----------

function resetAllSettings() {

    localStorage.removeItem("nirbhayaSettings");

    localStorage.removeItem("nirbhayaProfile");

    localStorage.removeItem("accountStatus");

    resetTheme();

    location.reload();

}

console.log("Settings Page Part 3 Loaded Successfully");
// ===========================================
// SETTINGS PAGE - PART 4
// Validation + Professional Features
// ===========================================

// ---------- Email Validation ----------

function isValidEmail(email) {

    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return pattern.test(email);

}

// ---------- Phone Validation ----------

function isValidPhone(phone) {

    const pattern = /^[0-9+\-\s]{10,15}$/;

    return pattern.test(phone);

}

// ---------- Password Validation ----------

function isStrongPassword(password) {

    if (password.length < 8) return false;

    let hasUpper = /[A-Z]/.test(password);
    let hasLower = /[a-z]/.test(password);
    let hasNumber = /[0-9]/.test(password);

    return hasUpper && hasLower && hasNumber;

}

// ---------- Save Animation ----------

function pulseButton(button) {

    button.style.transform = "scale(0.95)";

    setTimeout(() => {

        button.style.transform = "scale(1)";

    }, 150);

}

// ---------- Button Hover Animation ----------

document.querySelectorAll("button").forEach(button => {

    button.style.transition = ".3s";

    button.addEventListener("mouseenter", () => {

        button.style.transform = "translateY(-2px)";

    });

    button.addEventListener("mouseleave", () => {

        button.style.transform = "translateY(0px)";

    });

});

// ---------- Select Animation ----------

document.querySelectorAll("select").forEach(select => {

    select.addEventListener("change", () => {

        select.style.borderColor = "#E91E63";

        setTimeout(() => {

            select.style.borderColor = "";

        }, 700);

    });

});

// ---------- Toggle Animation ----------

document.querySelectorAll("input[type='checkbox']").forEach(toggle => {

    toggle.addEventListener("change", () => {

        showToast("Updated Successfully");

    });

});

// ---------- Keyboard Shortcut ----------
// Ctrl + S saves settings

document.addEventListener("keydown", function(e){

    if(e.ctrlKey && e.key==="s"){

        e.preventDefault();

        localStorage.setItem(
            "nirbhayaSettings",
            JSON.stringify(settings)
        );

        localStorage.setItem(
            "nirbhayaProfile",
            JSON.stringify(profile)
        );

        showToast("All Settings Saved");

    }

});

// ---------- Last Updated ----------

const now = new Date();

localStorage.setItem(
    "lastUpdated",
    now.toLocaleString()
);

// ---------- Welcome Back ----------

window.addEventListener("load",()=>{

    const last = localStorage.getItem("lastUpdated");

    if(last){

        console.log("Last Updated :",last);

    }

});

// ---------- Prevent Empty Name ----------

if(document.getElementById("userName")){

    document.getElementById("userName").addEventListener("click",()=>{

        if(profile.name.trim()==""){

            profile.name="User";

            saveProfile();

        }

    });

}

console.log("Settings Page Fully Loaded Successfully");
const siren = document.getElementById("sirenAudio");

function playSiren() {
    siren.currentTime = 0;
    siren.play();
}

function stopSiren() {
    siren.pause();
    siren.currentTime = 0;
}
//header dropdown//
function setupDropdown(btnId, panelId){

    const btn=document.getElementById(btnId);
    const panel=document.getElementById(panelId);

    btn.addEventListener("click",function(e){

        e.stopPropagation();

        document.querySelectorAll(".dropdown-panel").forEach(p=>{
            if(p!==panel) p.classList.remove("show");
        });

        panel.classList.toggle("show");
    });
}

setupDropdown("notificationBtn","notificationPanel");
setupDropdown("messageBtn","messagePanel");
setupDropdown("profileBtn","profilePanel");

document.addEventListener("click",function(){
    document.querySelectorAll(".dropdown-panel").forEach(panel=>{
        panel.classList.remove("show");
    });
});
//logout//
function logout(){

    if(confirm("Do you want to logout?")){

        localStorage.removeItem("currentUser");

        window.location.href="login.html";
    }

}
//add notication//
function addNotification(title) {
    let notifications = JSON.parse(localStorage.getItem("notifications")) || [];

    notifications.unshift({
        text: title,
        time: new Date().toLocaleString()
    });

    localStorage.setItem("notifications", JSON.stringify(notifications));
    loadNotifications();
}
function loadNotifications() {
    let notifications = JSON.parse(localStorage.getItem("notifications")) || [];

    const list = document.getElementById("notificationList");
    const badge = document.getElementById("notificationCount");

    badge.textContent = notifications.length;

    if (notifications.length === 0) {
        list.innerHTML = "<p class='empty-text'>No notifications</p>";
        return;
    }

    list.innerHTML = "";

    notifications.forEach(item => {
        list.innerHTML += `
            <div class="notification-item">
                <div class="notification-title">${item.text}</div>
                <div class="notification-time">${item.time}</div>
            </div>
        `;
    });
}
window.addEventListener("load", function () {
    loadNotifications();
});
window.onload = function () {

    loadIncidents();

};
document.addEventListener("DOMContentLoaded", () => {
    // Scoped event selector using the strict unique ID setup
    const safetyPortalAlertButton = document.querySelector("#nb-standalone-page-root #nbActionAlertSystemBtn");

    if (safetyPortalAlertButton) {
        safetyPortalAlertButton.addEventListener("click", () => {
            alert("Connection successful. Thank you for visiting the Nirbhaya Safety Hub!");
        });
    }

    // Optional graceful animation entrance for card structures
    const scrollRevealCards = document.querySelectorAll("#nb-standalone-page-root .nb-feature-card");
    
    const cardEntranceObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if(entry.isIntersecting) {
                entry.target.style.opacity = "1";
                entry.target.style.transform = "translateY(0)";
            }
        });
    }, { threshold: 0.05 });

    scrollRevealCards.forEach(card => {
        card.style.opacity = "0";
        card.style.transform = "translateY(15px)";
        card.style.transition = "opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)";
        cardEntranceObserver.observe(card);
    });
});