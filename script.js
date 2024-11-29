const debug = false;
const checkTime = true;

const supabaseUrl = 'https://ezpiuxchtmvimyjbnfaw.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6cGl1eGNodG12aW15amJuZmF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE2NzIzMjksImV4cCI6MjA0NzI0ODMyOX0.hNjLP4ZlwgDr1abPPsrSkQ5EqMWyy6wpx7rydZlGj-0'
const timeAPI= "https://timeapi.io/api/Time/current/zone?timeZone=Europe/Budapest"
let data = []

async function getData() {
    const response = await fetch(`${supabaseUrl}/rest/v1/data`, {
        method: 'GET',
        headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
        }
    });

    data = await response.json();

    // Ellenőrizzük, hogy az adatok helyesen kerülnek-e betöltésre
    if (debug) console.log("Fetched data:", data);

    // Sort the data by nap (assuming nap is in a format that can be parsed by Date)
    data.sort((a, b) => {
        const aDate = new Date(a.nap);
        const bDate = new Date(b.nap);
        return aDate - bDate;
    });

    if (debug) console.log("Sorted data:", data);
}

getData();


async function fetchCurrentDate() {
    try {
        const response = await fetch(
            timeAPI
        );
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        const dateTimeString = data.dateTime;
        const parsedDate = new Date(dateTimeString);

        if (debug) console.log("Current date fetched from API:", dateTimeString);

        if (isNaN(parsedDate)) throw new Error("Invalid date received from API");

        if (debug) console.log("Parsed date fetched from API:", parsedDate);
        return { day: parsedDate.getDate(), month: parsedDate.getMonth() + 1 };
    } catch (error) {
        console.error("Error fetching current date:", error);
        const fallbackDate = new Date();
        if (debug) console.log("Current date fetched from local:", fallbackDate);
        return { day: fallbackDate.getDate(), month: fallbackDate.getMonth() + 1 };
    }
}

function setupCalendarGrid(todaysDate, currentMonth) {
    const calendarGrid = document.querySelector(".calendar-grid");

    for (let day = 1; day <= 24; day++) {
        const dayDiv = createDayDiv(day);
        calendarGrid.appendChild(dayDiv);
    }

    const doorFronts = document.querySelectorAll(".front");
    const doorBacks = document.querySelectorAll(".back");

    doorFronts.forEach((doorFront) => {
        const calendarNumber = parseInt(doorFront.innerHTML, 10);
        doorFront.addEventListener(
            "mouseover",
            noHover.bind(null, todaysDate, currentMonth)
        );
        doorFront.addEventListener(
            "click",
            clickFront.bind(null, todaysDate, currentMonth)
        );

        if (checkTime && (calendarNumber > todaysDate || currentMonth !== 12)) {
            addClass(doorFront.parentNode, "no-hover");
            removeClass(doorFront.parentNode, "open");
            localStorage.removeItem(`door-${calendarNumber}`);
        } else if (calendarNumber < todaysDate && currentMonth === 12) {
            addClass(doorFront.parentNode, "open");
        }

        if (localStorage.getItem(`door-${calendarNumber}`) === "opened") {
            addClass(doorFront.parentNode, "open");
        }
    });

    doorBacks.forEach((doorBack) =>
        doorBack.addEventListener("click", clickBack)
    );
}

function setupModal() {
    const modal = document.getElementById("modalPopup");
    const spanClose = document.querySelector(".close");

    spanClose.onclick = () => {
        closeModal(modal);
    };

    window.onclick = (event) => {
        if (event.target === modal) {
            closeModal(modal);
        }
    };
}

function closeModal(modal) {
    modal.style.display = "none";
    document.body.classList.remove("modal-open");
    if (debug) console.log("Modal closed.");
}

// Creating snowflakes
function setupSnowflakes() {
    const snowflakesContainer = document.getElementById("snowflakes");
    const numberOfSnowflakes = 50;
    const snowflakesFragment = document.createDocumentFragment();
    for (let i = 0; i < numberOfSnowflakes; i++) {
        const snowflake = document.createElement("div");
        snowflake.className = "snowflake";
        const size = Math.floor(Math.random() * 6) + 5;
        const left = Math.floor(Math.random() * 91) + 5;
        const duration = Math.floor(Math.random() * 12) + 9;
        snowflake.style.cssText = `width: ${size}px; height: ${size}px; left: ${left}%; animation-duration: ${duration}s;`;
        snowflakesFragment.appendChild(snowflake);
    }
    snowflakesContainer.appendChild(snowflakesFragment);
    if (debug) console.log("Snowflakes effect initialized.");
}
setupSnowflakes();

function createDayDiv(i) {
    const dayDiv = document.createElement("div");
    dayDiv.className = `day${i}`;
    dayDiv.innerHTML = `
          <div class="door">
              <div class="front">${i}</div>
              <div class="back"></div>
          </div>
      `;
    return dayDiv;
}

function noHover(todaysDate, currentMonth, event) {
    const calendarNumber = parseInt(event.target.innerHTML, 10);
    if (checkTime && (calendarNumber > todaysDate || currentMonth !== 12)) {
        addClass(event.target.parentNode, "no-hover");
        if (debug) console.log(`Door ${calendarNumber} is not available yet.`);
    } else {
        removeClass(event.target.parentNode, "no-hover");
    }
}

function clickFront(todaysDate, currentMonth, event) {
    const calendarNum = parseInt(event.target.innerHTML, 10);
    if (!checkTime || (calendarNum <= todaysDate && currentMonth === 12)) {
        toggleClass(event.target.parentNode, "open");
        if (debug) console.log(`Door ${calendarNum} toggled open/close.`);
        localStorage.setItem(
            `door-${calendarNum}`,
            event.target.parentNode.classList.contains("open") ? "opened" : ""
        );
    } else {
        if (debug) console.log(`Door ${calendarNum} cannot be opened yet.`);
    }
}

async function clickBack() {
    const calendarNum = parseInt(this.previousElementSibling.innerHTML, 10) - 1;
    const info = data[calendarNum];

    if (!info) {
        console.error(`No data found for calendar number ${calendarNum + 1}`);
        return;
    }

    const modal = document.getElementById("modalPopup");
    const modalDailyDate = document.querySelector(".dailyDate");
    const modalDailyTitle = document.querySelector(".dailyTitle");
    const modalDailyContent = document.querySelector(".dailyContent");
    const modalDailyImage = document.querySelector(".dailyImage");
    const modalDailyVideo = document.querySelector(".dailyVideo");

    modal.style.display = "block";
    document.body.classList.add("modal-open");
    modalDailyDate.innerHTML = info.nap;
    modalDailyTitle.innerHTML = info.cím || '';
    modalDailyContent.innerHTML = info.tartalom || '';

    modalDailyImage.style.display = info.kep_Url ? "block" : "none";
    if (info.kep_Url) modalDailyImage.src = info.kep_Url;

    if (info.video_Url) {
        if (info.video_Url.endsWith(".mp4") || info.video_Url.includes("supabase.co/storage/v1/object/sign")) {
            modalDailyVideo.innerHTML = `<video controls><source src="${info.video_Url}" type="video/mp4"></video>`;
        } else if (info.video_Url.includes("facebook.com")) {
            modalDailyVideo.innerHTML = `<iframe src="https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(info.video_Url)}&show_text=0&width=560" width="560" height="315" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowTransparency="true" allow="encrypted-media" allowFullScreen="true"></iframe>`;
        } else {
            modalDailyVideo.innerHTML = `<iframe src="${getVideoEmbed(info.video_Url)}" frameborder="0" allowfullscreen></iframe>`;
        }
        modalDailyVideo.style.display = "block";
    } else {
        modalDailyVideo.style.display = "none";
    }

    if (debug) console.log(`Modal opened for door ${calendarNum + 1}.`);
}



function getVideoEmbed(videoUrl) {
    if (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")) {
      return videoUrl
        .replace("watch?v=", "embed/")
        .replace("youtu.be/", "youtube.com/embed/");
    }
    if (debug) console.log(`Invalid YouTube URL: ${videoUrl}`);
    return "";
  }

function addClass(element, className) {
    element.classList.add(className);
}

function removeClass(element, className) {
    element.classList.remove(className);
}

function toggleClass(element, className) {
    element.classList.toggle(className);
}

document.addEventListener("DOMContentLoaded", async () => {
    const { day: todaysDate, month: currentMonth } = await fetchCurrentDate();
    setupModal();
    setupCalendarGrid(todaysDate, currentMonth);
});

document.getElementById('sob').addEventListener('click', function () {
    window.open('http://sobszeged.hu/', '_blank');
});