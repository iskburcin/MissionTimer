// Constants
const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
let activeDate = new Date();

/** Helper Functions */
function $(id) {
    return document.getElementById(id);
}

function saveSessionData() {
    localStorage.setItem("sessionTypesByDate", JSON.stringify(sessionTypesByDate));
}

let sessionTypesByDate = loadSessionData() || {}; // Load from local storage or initialize empty object
function loadSessionData() {
    return JSON.parse(localStorage.getItem("sessionTypesByDate"));
}

function formatDate(date) {
    return date.toLocaleString('default', { month: 'short', year: 'numeric' });
}

function getDateKey(date) {
    return date.toDateString();
}

/** Render Calendar */
function renderWeekdays() {
    const container = $("calendar-weekdays");
    container.innerHTML = weekdays
        .map(day => `<div class='weekday' style='width: calc(100% / 7); display: grid; place-items: center;'>${day}</div>`)
        .join('');
}

function renderCalendar(date) {
    const daysContainer = $("calendar-days");
    const monthYearLabel = $("month-year");

    daysContainer.innerHTML = "";
    monthYearLabel.textContent = formatDate(date);

    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDayIndex = (new Date(date.getFullYear(), date.getMonth(), 1).getDay() + 6) % 7;

    for (let i = 0; i < firstDayIndex; i++) {
        daysContainer.appendChild(document.createElement("div"));
    }
    /** Add actual days */
    for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = document.createElement("div");
        dayDiv.textContent = day;
        dayDiv.className = "day";

        if (day === new Date().getDate() && date.getMonth() === new Date().getMonth()) {
            dayDiv.classList.add("current-day");
        }

        dayDiv.addEventListener("click", () => selectDate(day));
        daysContainer.appendChild(dayDiv);
    }
}

/** SESSION SİDE */

function selectDate(day) {
    activeDate.setDate(day);
    $("selected-date").textContent = getDateKey(activeDate);
    loadSessionsTypes();
}

function addSessionType() {
    const modal = $("session-model");
    const dropdown = $("session-dropdown");
    const sessionDateKey = getDateKey(activeDate);
    const sessionName = $("session-name").value;
    const checkDuration = $("check-duration").value;
    const minDuration = $("min-duration").value;
    const maxDuration = $("max-duration").value;
    debugger;
    console.log(sessionName, checkDuration, minDuration, maxDuration);
    if (!sessionName || !checkDuration || !minDuration || !maxDuration) {
        alert("Please fill all fields");
        return;
    }

    if (!sessionTypesByDate[sessionDateKey]) {
        sessionTypesByDate[sessionDateKey] = { sessionTypes: {} };
        sessionTypesByDate[sessionDateKey].sessionDateKey = sessionDateKey;
    }
    sessionTypesByDate[sessionDateKey].sessionTypes[sessionName] = {
        checkDuration,
        minDuration,
        maxDuration,
        sessions: {}
    };
    dropdown.appendChild(new Option(sessionName, sessionName));
    console.log(sessionTypesByDate[sessionDateKey]);
    sessionName.value = '';
    checkDuration.value = '';
    minDuration.value = '';
    maxDuration.value = '';
    console.log("Session added");
    $("text").classList.add('hidden');
    dropdown.classList.remove("hidden");
    modal.classList.add("hidden");
    saveSessionData();
    loadSessionsTypes();
}

/**
 * Render Sessions
*/
function loadSessionsTypes() {
    const selectedSessionType = $('session-title');
    const sessionTable = $("session-log-table");
    const dropdown = $("session-dropdown");
    const txtCntnt = $("text");
    const sessionDateKey = getDateKey(activeDate);
    dropdown.innerHTML = '<option value="" disabled selected hidden>Select a session</option>';
    const sessionData = loadSessionData()[sessionDateKey]?.sessionTypes || {};

    // Correctly check for existence AND for a valid object with sessionTypes property
    if (loadSessionData() && loadSessionData()[sessionDateKey] && sessionData && typeof sessionData === 'object') {

        // Populate dropdown
        Object.keys(sessionData).forEach(sessionType => {
            const option = document.createElement("option");
            option.value = sessionType;
            option.textContent = sessionType;
            dropdown.appendChild(option);
        });
        dropdown.classList.remove("hidden");
        txtCntnt.classList.add("hidden");
        // renderSessions();
    } else {
        console.warn(`No sessions found for date: ${sessionDateKey}`);
        dropdown.classList.add("hidden");
        txtCntnt.classList.remove("hidden");
        txtCntnt.textContent = "Create a session type for today:";
    }
    sessionTable.classList.add('hidden');
    selectedSessionType.textContent = '';
}
$("session-dropdown").addEventListener("change", renderSessions);
function renderSessions() {
    const selectedSessionType = $('session-title');
    const sessionTable = $("session-log-table");
    const sessionBody = $("session-log-body");
    const dropdown = $("session-dropdown");
    const txtCntnt = $("text");
    const sessionDateKey = getDateKey(activeDate);
    const dateData = loadSessionData()[sessionDateKey];
    if (!loadSessionData() || !dateData || !dateData.sessionTypes) return;
    const selectedSession = dropdown.value;
    if (!selectedSession) return;
    dropdown.classList.remove("hidden");
    txtCntnt.classList.add("hidden");

    if (selectedSession) {
        if (dateData && dateData.sessionTypes && dateData.sessionTypes[selectedSession]) {
            const sessionData = dateData.sessionTypes[selectedSession];

            // Check for sessions property before accessing it
            if (sessionData.sessions && Object.keys(sessionData.sessions).length > 0) {
                console.log("sessionData:", sessionData);
                for (let i = 0; i < sessionData.sessions.length; i++) {
                    const session = sessionData.sessions[i];
                    sessionBody.innerHTML += `
                        <tr>
                            <td>${i + 1}</td>
                            <td>${session.start}</td>
                            <td>${session.end}</td>
                            <td>${session.duration}</td>
                        </tr>`;
                }
                sessionBody.innerHTML += `
                    <tr id="last-row">
                        <td></td>
                        <td id="start-session">Start</td>
                        <td id="end-session" class="hidden">End</td>
                        <td>Total Time</td>
                    </tr>`;
                sessionTable.classList.remove("hidden");
            } else {
                sessionTable.classList.remove('hidden');
                selectedSessionType.textContent = selectedSession;
                sessionBody.innerHTML = `
                    <tr id="last-row">
                        <td></td>
                        <td id="start-session">Start</td>
                        <td id="end-session" class="hidden">End</td>
                        <td>Total Time</td>
                    </tr>`;
            }
        } else {
            console.error("Error: Invalid session type or missing session data.");
            // Handle the error gracefully, e.g., display an error message to the user.
            // Example:
            // alert("Invalid session type selected. Please choose a valid option.");
            // or
            // const errorElement = document.getElementById("error-message");
            // if (errorElement) {
            //     errorElement.textContent = "Invalid session type selected.";
            // }
        }
    } else {
        console.log("Waiting for user to select a session type.");
    }
    // if (!sessionData.sessions || Object.keys(sessionData.sessions).length === 0) {
    //     sessionTable.classList.remove('hidden');
    //     selectedSessionType.textContent = selectedSession;
    //     sessionBody.innerHTML = `
    //         <tr id="last-row">
    //             <td></td>
    //             <td id="start-session">Start</td>
    //             <td id="end-session" class="hidden">End</td>
    //             <td>Total Time</td>
    //         </tr>`;
    //     return;
    // } else {
    //     console.log("sessionData:", sessionData);
    // }
    // selectedSessionType.textContent = selectedSession;

}
/** SESSION BUTTON SIDE */
$("start-session").addEventListener("click", addNewSession);
$("end-session").addEventListener("click", endSession);
function addNewSession() {
    const sessionDate = getDateKey(activeDate);
    const selectedSession = $("session-dropdown").value;
    const sessionData = sessionTypesByDate[sessionDate].sessionTypes[selectedSession];
    if (!selectedSession || !sessionData) return;
    let sessions = sessionData.sessions;
    const indx = sessions.length + 1;
    const now = new Date().toLocaleTimeString('en-US');
    sessions[indx].push({
        start: now,
        end: '',
        duration: ''
    });
    $("indx").textContent = indx;
    $("start-session").textContent = now;
    $("start-session").removeEventListener("click", addNewSession);
    $("end-session").classList.remove('hidden');
    $("end-session").addEventListener("click", endSession);
    saveSessionData();
    renderSessions();
}
function endSession() {
    const sessionDate = getDateKey(activeDate);
    const selectedSession = $("session-dropdown").value;
    const sessionData = sessionTypesByDate[sessionDate].sessionTypes[selectedSession];
    if (!selectedSession || !sessionData) return;
    const lastSession = sessionData.sessions[sessions.length - 1];
    const now = new Date().toLocaleTimeString('en-US');
    lastSession.end = now;
    const start = new Date(lastSession.start);
    const end = new Date(lastSession.end);
    lastSession.duration = Math.floor((endTime - startTime) / 1000 / 60); // Duration in minutes
    $("start-session").classList.remove('hidden');
    $("end-session").textContent = now;
    $("dur-session").textContent = lastSession.duration;
    $("end-session").removeEventListener("click", endSession);
    saveSessionData();
    renderSessions();
}





/** EVENT LISTENERS */
$("add-session-type-btn").addEventListener("click", () => $("session-model").classList.remove("hidden"));
$("close-model").addEventListener("click", () => $("session-model").classList.add("hidden"));
$("submit-session").addEventListener("click", addSessionType);

$("next-month").addEventListener("click", () => {
    activeDate.setMonth(activeDate.getMonth() + 1);
    renderCalendar(activeDate);
});

$("prev-month").addEventListener("click", () => {
    activeDate.setMonth(activeDate.getMonth() - 1);
    renderCalendar(activeDate);
});

/** Initial Rendering */
renderWeekdays();
renderCalendar(activeDate);
selectDate(activeDate.getDate());