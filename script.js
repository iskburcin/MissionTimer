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

        if (day === new Date().getDate() && date.getMonth() === new Date().getMonth() && date.getFullYear() === new Date().getFullYear()) {
            dayDiv.classList.add("current-day");
        }

        // Seçili günü vurgula
        if (day === date.getDate()) {
            dayDiv.classList.add("selected-day");
        }

        dayDiv.addEventListener("click", () => selectDate(day));
        daysContainer.appendChild(dayDiv);
    }
}

/** SESSION SİDE */

function selectDate(day) {
    activeDate.setDate(day);
    renderCalendar(activeDate);
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
    }
    sessionTable.classList.add('hidden');
}
$("session-dropdown").addEventListener("change", renderSessions);

function renderSessions() {
    const sessionBody = $("session-log-body");
    const sessionDateKey = getDateKey(activeDate);
    const dateData = loadSessionData()[sessionDateKey];
    sessionBody.innerHTML = ''; // Clear previous sessions

    if (!loadSessionData() || !dateData || !dateData.sessionTypes) return;
    const selectedSession = $("session-dropdown").value;

    if (selectedSession) {
        if (dateData.sessionTypes[selectedSession]) {
            const sessionData = dateData.sessionTypes[selectedSession];

            // Check for sessions property before accessing it
            if (sessionData.sessions && Object.keys(sessionData.sessions).length > 0) {
                console.log("sessionData:", sessionData);
                Object.keys(sessionData.sessions).forEach((key, index) => {
                    const session = sessionData.sessions[key];
                    const sec = parseFloat(session.duration) || 0;
                    sessionBody.innerHTML += `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${new Date(session.start).toLocaleTimeString('en-US')}</td>
                            <td>${session.end ? new Date(session.end).toLocaleTimeString('en-US') : ''}</td>
                            <td>${Math.floor(sec / 60 / 60)}h ${Math.floor(sec / 60 % 60)}m ${Math.floor(sec % 60)}s</td>
                        </tr>`;
                });
            }
            const total = sessionData.totalTime || 0;
            sessionBody.innerHTML += `
                <tr id="last-row">
                    <td id="indx"></td>
                    <td id="start-time"><button id="start-session">Start</button></td>
                    <td id="end-time"><button id="end-session" class="hidden">End</button></td>
                    <td id="dur-session">${Math.floor(total / 60 / 60)}h ${Math.floor(total / 60 % 60)}m ${Math.floor(total % 60)}s</td>
                </tr>`;
            $("session-log-table").classList.remove("hidden");
        } else {
            console.error("Error: Invalid session type or missing session data.");
        }
    } else {
        console.log("Waiting for user to select a session type.");
    }

    // Add event listeners for start and end buttons
    $("start-session").addEventListener("click", function addNewSession() {
        const sessionDate = getDateKey(activeDate);
        const selectedSession = $("session-dropdown").value;
        const sessionData = sessionTypesByDate[sessionDate].sessionTypes[selectedSession];
        if (!selectedSession || !sessionData) return;
        let sessions = sessionData.sessions;
        const indx = Object.keys(sessions).length + 1;
        const now = new Date();
        sessions[indx] = {
            start: now,
            end: '',
            duration: ''
        };
        $("indx").textContent = indx;
        $("start-session").classList.add('hidden');
        $("start-time").appendChild(document.createTextNode(now.toLocaleTimeString('en-US')));
        $("end-session").classList.remove('hidden');
        saveSessionData();
    });

    $("end-session").addEventListener("click", function endSession() {
        const sessionDate = getDateKey(activeDate);
        const selectedSession = $("session-dropdown").value;
        const sessionData = sessionTypesByDate[sessionDate].sessionTypes[selectedSession];
        if (!selectedSession || !sessionData) return;
        const lastSession = sessionData.sessions[Object.keys(sessionData.sessions).length];
        lastSession.end = new Date().toISOString();
        const startTime = new Date(lastSession.start);
        const endTime = new Date(lastSession.end);
        const seconds = (endTime - startTime) / 1000;
        const minutes = seconds / 60;
        const hours = Math.floor(minutes / 60);
        lastSession.duration = seconds.toFixed(2);

        $("start-session").classList.remove('hidden');
        $("end-session").textContent = new Date(lastSession.end).toLocaleTimeString('en-US');
        $("dur-session").textContent = `${hours}h ${Math.floor(minutes % 60)}m ${Math.floor(seconds % 60)}s`;
        $("end-session").classList.add('hidden');
        let total = 0;
        Object.keys(sessionData.sessions).forEach((key) => {
            total += parseFloat(sessionData.sessions[key].duration) || 0;
        });
        $("dur-session").textContent = `${Math.floor(total / 60 / 60)}h ${Math.floor(total / 60 % 60)}m ${Math.floor(total % 60)}s`;
        sessionData.totalTime = total;
        saveSessionData();
        renderSessions();
    });
}

function deleteSession(sessionIndex) {
    const sessionDateKey = getDateKey(activeDate);
    const selectedSession = $("session-dropdown").value;
    const sessionData = sessionTypesByDate[sessionDateKey].sessionTypes[selectedSession];
    if (!selectedSession || !sessionData) return;

    sessionIndex = parseInt(sessionIndex, 10); // Convert sessionIndex to integer
    delete sessionData.sessions[sessionIndex];

    // Re-sort sessions
    const sortedSessions = {};
    Object.keys(sessionData.sessions).sort((a, b) => a - b).forEach((key, index) => {
        sortedSessions[index + 1] = sessionData.sessions[key];
    });
    sessionData.sessions = sortedSessions;

    saveSessionData();
    renderSessions();
}

document.addEventListener("DOMContentLoaded", function () {
    // Add event listener for right-click to show delete option
    $("session-log-body").addEventListener("contextmenu", function (event) {
        event.preventDefault();
        const targetRow = event.target.closest("tr");
        if (!targetRow || targetRow.id === "last-row") return;

        // Remove any existing context menus
        document.querySelectorAll(".context-menu").forEach(menu => menu.remove());

        // Create context menu
        const contextMenu = document.createElement("div");
        contextMenu.id = "right-click-menu";
        contextMenu.style.display = "block";
        contextMenu.style.top = `${event.pageY}px`;
        contextMenu.style.left = `${event.pageX}px`;
        contextMenu.innerHTML = `
            <ul>
                <li id="edit-session">Edit</li>
                <li id="delete-session">Delete</li>
            </ul>
        `;

        // Add event listener for delete option
        contextMenu.querySelector("#delete-session").addEventListener("click", function () {
            const sessionIndex = targetRow.querySelector("td").textContent;
            deleteSession(sessionIndex);
            targetRow.remove();
            contextMenu.remove();
        });

        document.body.appendChild(contextMenu);

        // Remove context menu on click outside
        document.addEventListener("click", function removeContextMenu() {
            contextMenu.remove();
            document.removeEventListener("click", removeContextMenu);
        });
    });
});

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

$("new-session-form").addEventListener("submit", function (e) {
    e.preventDefault();
});

/** Initial Rendering */
renderWeekdays();
renderCalendar(activeDate);
selectDate(activeDate.getDate());