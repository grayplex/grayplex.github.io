// Countdown Logic
let endDate;
if (!localStorage.getItem('firstVisit')) {
    endDate = new Date("December 1, 2023 00:00:00 GMT");
    localStorage.setItem('firstVisit', 'true');
} else {
    endDate = new Date("December 1, 2023 00:00:00 GMT");
}

function updateCountdown() {
    const now = new Date().getTime();
    const distance = endDate - now;
    
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    const milliseconds = distance % 1000;
    
    document.getElementById("days").textContent = String(days).padStart(2, '0');
    document.getElementById("hours").textContent = String(hours).padStart(2, '0');
    document.getElementById("minutes").textContent = String(minutes).padStart(2, '0');
    document.getElementById("seconds").textContent = String(seconds).padStart(2, '0');
    document.getElementById("milliseconds").textContent = String(milliseconds).padStart(3, '0');
}

setInterval(updateCountdown, 1);

// Binary Flying Effect
setInterval(function() {
    const binary = (Math.random() < 0.5) ? '0' : '1';
    const span = document.createElement("span");
    span.textContent = binary;
    span.className = "binary-digit";
    span.style.position = "fixed";
    span.style.left = `${Math.random() * 100}vw`;
    span.style.top = `${Math.random() * 100}vh`;
    span.style.fontSize = `${Math.random() * 30}px`;
    document.body.appendChild(span);
    
    setTimeout(() => span.remove(), 3000);
}, 50);
