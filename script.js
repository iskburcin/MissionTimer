
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


/** SESSION SİDE */
const selectedDate = document.getElementById('selected-date');
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

}

nextButton.addEventListener("click", () => {
    activeDate.setMonth(activeDate.getMonth() + 1);
    renderCalendar(activeDate);
}
);
prevButton.addEventListener("click", () => {
    activeDate.setMonth(activeDate.getMonth() - 1);
    renderCalendar(activeDate);
});
