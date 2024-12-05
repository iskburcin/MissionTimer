
/** CALENDAR SİDE */
renderWeekdays();
function renderWeekdays() {
    const weekdaysContainer = document.getElementById("calendar-weekdays");
    const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    weekdays.forEach((day) => {
        const weekdayDiv = document.createElement("div");
        weekdayDiv.textContent = day;
        weekdayDiv.className = "weekday";
        weekdayDiv.style.width = `float: left; width: calc(100% / 7); display: grid; place-items: center;`;
        weekdaysContainer.appendChild(weekdayDiv);
    })
}

/**
 * Render Calendar
*/
const calendarDayss = document.getElementById("calendar-days");
const calendarMonthAndYear = document.getElementById("month-year");
const nextButton = document.getElementById("next-month");
const prevButton = document.getElementById("prev-month");
const currentDate = new Date();
let activeDate = currentDate;

function renderCalendar(date) {
    calendarMonthAndYear.textContent = formatDate(date);
    calendarDayss.innerHTML = "";
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

    /** Get the first day of the month */
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    const arrangedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    for (let i = 0; i < arrangedFirstDay; i++) {
        const emptyDiv = document.createElement("div");
        calendarDayss.appendChild(emptyDiv);
    }
    /** Add actual days */
    for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = document.createElement("div");
        dayDiv.textContent = day;
        dayDiv.classList.add("day");
        if (day === new Date().getDate() && date.getMonth() === new Date().getMonth()) {
            dayDiv.classList.add("current-day");
        }
        dayDiv.addEventListener("click", () => selectDate(day));
        calendarDayss.appendChild(dayDiv);
    }
}

function formatDate(date) {
    return date.toLocaleString('default', { month: 'short', year: 'numeric' });
}

renderCalendar(activeDate);
nextButton.addEventListener("click", () => {
    activeDate.setMonth(activeDate.getMonth() + 1);
    renderCalendar(activeDate);
}
);
prevButton.addEventListener("click", () => {
    activeDate.setMonth(activeDate.getMonth() - 1);
    renderCalendar(activeDate);
});

/** SESSION SİDE */
const dropdown = document.getElementById("session-dropdown");
const selectedDate = document.getElementById('selected-date');
const selectedSessionType = document.getElementById('session-title');

const sessionDetailsTable = document.getElementById("session-log-table");
const sessionDetailsBody = document.getElementById("session-log-body");
let sessionTypesByDate = {};

selectedDate.textContent = new Date().toDateString();
function selectDate(date) {
    activeDate.setDate(date);
    selectedDate.textContent = activeDate.toDateString();
    loadSessions();
}

/**
 * Render Sessions
*/
function loadSessions() {
    selectedSessionType.textContent = 'No session selected';
    const sessionDate = activeDate.toDateString();
    dropdown.innerHTML = '<option value="" disabled selected>Select a session</option>'; // Clear existing options

    if (sessionTypesByDate[sessionDate]) {
        const sessionTypes = sessionTypesByDate[sessionDate].sessionsTypes;
        for (const sessName in sessionTypes) {
            const option = document.createElement('option');
            option.value = sessName;
            option.textContent = sessName;
            dropdown.appendChild(option);
        }
    }
}
loadSessions();
dropdown.addEventListener("change", () => {
    const selectedSession = dropdown.value;
    const sessionDate = activeDate.toDateString();
    const thisDay = sessionTypesByDate[sessionDate];
    const sessionData = thisDay.sessionsTypes[selectedSession];

    if (thisDay && sessionData) {
        const sessions = sessionData.sessions;
        console.log("Sessions for selected type:", sessions);
        selectedSessionType.textContent = selectedSession;

        // Clear previous table rows
        sessionDetailsBody.innerHTML = '';
        // Populate table rows
        for (const sesNo in sessions) {
            const row = document.createElement('tr');
            row.innerHTML = `
            <td>${sesNo + 1}</td>
            <td>${sessions[sesNo].start}</td>
            <td>${sessions[sesNo].end}</td>
            <td>${sessions[sesNo].duration}</td>
            `;
            sessionDetailsBody.appendChild(row);
        } // Show the table
        sessionDetailsTable.classList.remove('hidden');
    } else {
        console.log("No sessions found for selected type");
    }
});

/** SESSION BUTTON SIDE */
const startSessBtn = document.getElementById("start-session");
const endSessBtn = document.getElementById("end-session");

function addNewSession() {
    renderSessions();
    const sessionDate = activeDate.toDateString();
    const selectedSession = dropdown.value;
    const sessionData = sessionTypesByDate[sessionDate].sessionsTypes[selectedSession];
    const sessions = sessionData.sessions;
    const now = new Date().toLocaleTimeString('en-US');
    const session = {
        start: now,
        end: '',
        duration: ''
    };
    startSessBtn.classList.add('hidden');
    endSessBtn.classList.remove('hidden');
    sessions.push(session);


}

function renderSessions() {
    const sessionDate = activeDate.toDateString();
    const selectedSession = dropdown.value;
    const sessionData = sessionTypesByDate[sessionDate].sessionsTypes[selectedSession];

    if (sessionData) {
        const sessions = sessionData.sessions;
        console.log("Sessions for selected type:", sessions);
        selectedSessionType.textContent = selectedSession;

        // Clear previous table rows
        sessionDetailsBody.innerHTML = '';
        // Populate table rows
        for (const sesNo in sessions) {
            const row = document.createElement('tr');
            row.innerHTML = `
            <td>${sesNo + 1}</td>
            <td>${sessions[sesNo].start}</td>
            <td>${sessions[sesNo].end}</td>
            <td>${sessions[sesNo].duration}</td>
            `;
            sessionDetailsBody.appendChild(row);
        } // Show the table
        sessionDetailsTable.classList.remove('hidden');
    } else {
        console.log("No sessions found for selected type");
    }
}
renderSessions();
/** MODAL ADDING SİDE */

const modelAddButton = document.getElementById("add-session-type-btn");
const modal = document.getElementById("session-model");

modelAddButton.addEventListener("click", () => {
    modal.classList.remove("hidden");
    // modal.style.display = "";
});

const closeButton = document.getElementById("close-model");
closeButton.addEventListener("click", () => {
    modal.classList.add("hidden");
});

const submitButton = document.getElementById("submit-session");
const sessionName = document.getElementById("session-name");
const checkDuration = document.getElementById("check-duration");
const minSessionTime = document.getElementById("min-duration");
const maxSessionTime = document.getElementById("max-duration");

submitButton.addEventListener("click", () => {
    const sessionDate = activeDate.toDateString();
    const sessName = sessionName.value
    const checkDur = parseInt(checkDuration.value);
    const minSessTime = parseInt(minSessionTime.value);
    const maxSessTime = parseInt(maxSessionTime.value);
    console.log(sessName, checkDur, minSessTime, maxSessTime);

    if (sessName && checkDur && minSessTime && maxSessTime) {
        if (!sessionTypesByDate[sessionDate]) {
            sessionTypesByDate[sessionDate] = { sessionsTypes: {} };
        }
        if (!sessionTypesByDate[sessionDate].sessionsTypes[sessName]) {
            sessionTypesByDate[sessionDate].sessionDate = sessionDate;
            sessionTypesByDate[sessionDate].sessionsTypes[sessName] = {
                checkDur,
                minSessTime,
                maxSessTime,
                sessions: {}
            };
        }
        const option = document.createElement('option');
        option.value = sessName;
        option.textContent = sessName;
        dropdown.appendChild(option);
        console.log(sessionTypesByDate[sessionDate]);
        sessionName.value = '';
        checkDuration.value = '';
        minSessionTime.value = '';
        maxSessionTime.value = '';
        console.log("Session added");
    }
    else {
        alert("Please fill all fields");
    }
    modal.classList.add("hidden");
});