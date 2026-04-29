// Obtener parámetro de la URL
const params = new URLSearchParams(window.location.search);
const familyParam = params.get("familia");

const familyNameEl = document.getElementById("family-name");

// Mostrar mensaje personalizado
if (familyParam) {
  // Formatear texto
  const formattedName = familyParam
    .replace(/-/g, " ")
    .replace(/\b\w/g, char => char.toUpperCase());

  familyNameEl.textContent = `La familia ${formattedName} está cordialmente invitada`;
} else {
  familyNameEl.textContent = "Estás cordialmente invitado a celebrar con nosotros";
}

// Cargar datos de la familia desde el backend
async function loadFamilyData(familyId) {
    try {
      const res = await fetch(`http://localhost:3000/api/invitations/${familyId}`);
      if (!res.ok) throw new Error();
  
      const data = await res.json();
      document.getElementById("family-name").textContent =
        `${data.nombre} está cordialmente invitada`;
    } catch {
      document.getElementById("family-name").textContent =
        "Estás cordialmente invitado a celebrar con nosotros";
    }
  }
  
  if (familyParam) {
    loadFamilyData(familyParam);
  }

  // Manejar respuestas RSVP
  const buttons = document.querySelectorAll(".rsvp button");

  buttons.forEach(btn => {
    btn.addEventListener("click", async () => {
      const response = btn.classList.contains("primary")
        ? "confirmado"
        : "no_asistira";
  
      await fetch(
        `http://localhost:3000/api/invitations/${familyParam}/rsvp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ response })
        }
      );
  
      alert("¡Gracias por tu respuesta!");
    });
  });


  // Animaciones al hacer scroll
  const animatedElements = document.querySelectorAll(".animate");

    const observer = new IntersectionObserver(
    entries => {
        entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add("show");
        }
        });
    },
    { threshold: 0.15 }
    );

    animatedElements.forEach(el => observer.observe(el));