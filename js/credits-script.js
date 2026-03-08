const teamMembers = [
	{ name: "Edwin Angelo Catequista", role: "Lead Developer" },
	{ name: "Jay Ryan Lim", role: "Co-Developer" },
	{ name: "Jevince Jaye Jubay", role: "HRMD Manager" },
	{ name: "Charmie M. Simpal", role: "Assistant General Manager" },
	{ name: "Morsid M. Simpal", role: "General Manager" },
	{ name: "Rick Jayson Monsones", role: "Dubidubi dapdap" }
];

const cards = document.querySelectorAll(".card");
const dots = document.querySelectorAll(".dot");
const memberName = document.querySelector(".member-name");
const memberRole = document.querySelector(".member-role");
const upArrows = document.querySelectorAll(".nav-arrow.up");
const downArrows = document.querySelectorAll(".nav-arrow.down");
let currentIndex = 0;
let isAnimating = false;

function updateCarousel(newIndex) {
	if (isAnimating) return;
	isAnimating = true;

	currentIndex = (newIndex + cards.length) % cards.length;

	cards.forEach((card, i) => {
		const offset = (i - currentIndex + cards.length) % cards.length;

		card.classList.remove(
			"center",
			"up-1",
			"up-2",
			"down-1",
			"down-2",
			"hidden"
		);

		if (offset === 0) {
			card.classList.add("center");
		} else if (offset === 1) {
			card.classList.add("down-1");
		} else if (offset === 2) {
			card.classList.add("down-2");
		} else if (offset === cards.length - 1) {
			card.classList.add("up-1");
		} else if (offset === cards.length - 2) {
			card.classList.add("up-2");
		} else {
			card.classList.add("hidden");
		}
	});

	dots.forEach((dot, i) => {
		dot.classList.toggle("active", i === currentIndex);
	});

	memberName.style.opacity = "0";
	memberRole.style.opacity = "0";

	setTimeout(() => {
		memberName.textContent = teamMembers[currentIndex].name;
		memberRole.textContent = teamMembers[currentIndex].role;
		memberName.style.opacity = "1";
		memberRole.style.opacity = "1";
	}, 300);

	setTimeout(() => {
		isAnimating = false;
	}, 800);
}

upArrows.forEach(arrow => {
	arrow.addEventListener("click", () => {
		updateCarousel(currentIndex - 1);
	});
});

downArrows.forEach(arrow => {
	arrow.addEventListener("click", () => {
		updateCarousel(currentIndex + 1);
	});
});

dots.forEach((dot, i) => {
	dot.addEventListener("click", () => {
		updateCarousel(i);
	});
});

cards.forEach((card, i) => {
	card.addEventListener("click", () => {
		updateCarousel(i);
	});
});

document.addEventListener("keydown", (e) => {
	if (e.key === "ArrowUp") {
		updateCarousel(currentIndex - 1);
	} else if (e.key === "ArrowDown") {
		updateCarousel(currentIndex + 1);
	}
});

let touchStartX = 0;
let touchEndX = 0;
let scrollTimeout;
let isScrolling = false;


	
	


function createScrollIndicator() {
	const indicator = document.createElement('div');
	indicator.className = 'scroll-indicator';
	indicator.innerHTML = 'scroll';
	document.body.appendChild(indicator);
}

createScrollIndicator();

document.addEventListener("touchstart", (e) => {
	touchStartX = e.changedTouches[0].screenY;
});

document.addEventListener("touchend", (e) => {
	touchEndX = e.changedTouches[0].screenY;
	handleSwipe();
});

function handleSwipe() {
	const swipeThreshold = 50;
	const diff = touchStartX - touchEndX;

	if (Math.abs(diff) > swipeThreshold) {
		if (diff > 0) {
			updateCarousel(currentIndex + 1);
		} else {
			updateCarousel(currentIndex - 1);
		}
	}
}

updateCarousel(0);
