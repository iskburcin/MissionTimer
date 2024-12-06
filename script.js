// Constants
const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
let activeDate = new Date();
let sessionTypesByDate = loadSessionData() || {}; // Load from local storage or initialize empty object

/** Helper Functions */
function $(id) {
    return document.getElementById(id);
}

function saveSessionData() {
    localStorage.setItem("sessionTypesByDate", JSON.stringify(sessionTypesByDate));
}

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

/**
 * Render Calendar
*/
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
    loadSessions();
    renderSessions();
}

/**
 * Render Sessions
*/
function loadSessions() {
    const dropdown = $("session-dropdown");
    const sessionDateKey = getDateKey(activeDate);
    dropdown.innerHTML = '<option value="" disabled selected hidden>Select a session</option>';

    // Correctly check for existence AND for a valid object with sessionTypes property
    if (sessionTypesByDate &&
        sessionTypesByDate[sessionDateKey] &&
        sessionTypesByDate[sessionDateKey].sessionTypes &&
        typeof sessionTypesByDate[sessionDateKey].sessionTypes === 'object') {

        Object.keys(sessionTypesByDate[sessionDateKey].sessionTypes).forEach(sessionType => {
            const option = document.createElement("option");
            option.value = sessionType;
            option.textContent = sessionType;
            dropdown.appendChild(option);
        });
    } else {
        // Handle the case where no sessions are available for the selected date
        //  e.g., add a message to the dropdown, or disable it
        console.warn(`No sessions found for date: ${sessionDateKey}`);
        // Example: Add a "No sessions" option
        const noSessionsOption = document.createElement("option");
        noSessionsOption.value = "";
        noSessionsOption.textContent = "No sessions available";
        noSessionsOption.disabled = true; // Optional: disable selection
        dropdown.appendChild(noSessionsOption);
    }
}
function renderSessions() {
    const selectedSessionType = $('session-title');
    const sessionTable = $("session-log-table");
    const sessionBody = $("session-log-body");
    const dropdown = $("session-dropdown");
    const txtCntnt = $("text");
    const sessionDateKey = getDateKey(activeDate);
    if (!sessionTypesByDate[sessionDateKey]) {
        dropdown.classList.add("hidden");
        txtCntnt.classList.remove("hidden");
        txtCntnt.textContent = "Create a session type for today:";
        sessionTable.classList.add('hidden');
        return;
    }
    const selectedSession = dropdown.value;
    if (!selectedSession) return;
    const sessionData = sessionTypesByDate[sessionDateKey].sessionTypes[selectedSession];
    if (!sessionData) return;

    console.log("sessionData:", sessionData); // <-- Add this line
    console.log("sessionData.sessions:", sessionData.sessions); // <-- And this one
    console.log("typeof sessionData.sessions:", typeof sessionData.sessions); //Check the type


    selectedSessionType.textContent = selectedSession;
    sessionBody.innerHTML = sessionData.sessions
        .map((session, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${session.start}</td>
                <td>${session.end || '-'}</td>
                <td>${session.duration || '-'}</td>
            </tr>
        `).join('');
    sessionBody.innerHTML += `
        <tr id="last-row">
            <td></td>
            <td id="start-session">Start</td>
            <td id="end-session" class="hidden">End</td>
            <td>Total Time</td>
        </tr>`;
    sessionTable.classList.remove("hidden");
}
/** SESSION BUTTON SIDE */
$("start-session").addEventListener("click", addNewSession);
$("end-session").addEventListener("click", endSession);
function endSession() {
    const sessionDate = activeDate.toDateString();
    const selectedSession = $("session-dropdown").value;
    const sessionData = sessionTypesByDate[sessionDate].sessionTypes[selectedSession];
    const sessions = sessionData.sessions;
    const lastSession = sessions[sessions.length - 1];
    const now = new Date().toLocaleTimeString('en-US');
    lastSession.end = now;
    const start = new Date(`01/01/2007 ${lastSession.start}`);
    const end = new Date(`01/01/2007 ${lastSession.end}`);
    const duration = (end - start) / 1000 / 60;
    lastSession.duration = duration.toFixed(2);
    $("start-session").classList.remove('hidden');
    $("end-session").textContent = now;
    $("dur-session").textContent = lastSession.duration;
    $("end-session").removeEventListener("click", endSession);
    renderSessions();
}


function addNewSession() {
    const sessionDate = activeDate.toDateString();
    const selectedSession = $("session-dropdown").value;
    if (!selectedSession) return;
    const sessionData = sessionTypesByDate[sessionDate].sessionTypes[selectedSession];
    let sessions = sessionData.sessions;
    const indx = sessions.length + 1;
    const now = new Date().toLocaleTimeString('en-US');
    sessions[indx] = {
        start: now,
        end: '',
        duration: ''
    };
    $("indx").textContent = indx;
    $("start-session").textContent = now;
    $("start-session").removeEventListener("click", addNewSession);
    $("end-session").classList.remove('hidden');
}
/** MODAL ADDING SİDE */

const modal = $("session-model");

function addSessionType() {
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
    saveSessionData();
    loadSessions();
    modal.classList.add("hidden");
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