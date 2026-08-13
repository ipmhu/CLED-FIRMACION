// courses.js


const coursesContainer =
    document.getElementById("coursesContainer");

const newCourseButton =
    document.getElementById("newCourseButton");

const courseModal =
    document.getElementById("courseModal");

const closeModal =
    document.getElementById("closeModal");

const courseForm =
    document.getElementById("courseForm");

const courseMessage =
    document.getElementById("courseMessage");


// =========================================
// CARGAR CURSOS
// =========================================

async function loadCourses() {

    coursesContainer.innerHTML =
        '<div class="loading">Cargando cursos...</div>';


    const { data, error } =
        await supabaseClient
            .from("courses")
            .select("*")
            .eq("active", true)
            .order("name");


    if (error) {

        console.error(error);

        coursesContainer.innerHTML =
            `<p class="error-message">
                No se pudieron cargar los cursos.
            </p>`;

        return;
    }


    if (!data.length) {

        coursesContainer.innerHTML =
            `<div class="empty-state">
                <strong>No hay cursos registrados.</strong>
                <p>Agrega el primer curso para comenzar.</p>
            </div>`;

        return;
    }


    coursesContainer.innerHTML = "";


    data.forEach(course => {

        const card =
            document.createElement("article");

        card.className = "course-card";


        card.innerHTML = `

            <div>

                <span class="course-label">
                    CURSO
                </span>

                <h3>
                    ${course.name}
                    ${course.section
                        ? ` ${course.section}`
                        : ""}
                </h3>

            </div>

            <button
                class="secondary-button"
                onclick="selectCourse(${course.id})"
            >
                Gestionar
            </button>

        `;


        coursesContainer.appendChild(card);

    });

}


// =========================================
// SELECCIONAR CURSO
// =========================================

function selectCourse(courseId) {

    window.location.href =
        `course.html?id=${courseId}`;

}


// =========================================
// ABRIR MODAL
// =========================================

newCourseButton.addEventListener(
    "click",
    () => {

        courseModal.classList.remove("hidden");

        document
            .getElementById("courseName")
            .focus();

    }
);


// =========================================
// CERRAR MODAL
// =========================================

closeModal.addEventListener(
    "click",
    () => {

        courseModal.classList.add("hidden");

        courseForm.reset();

        courseMessage.textContent = "";

    }
);


// =========================================
// CREAR CURSO
// =========================================

courseForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const name =
            document
                .getElementById("courseName")
                .value
                .trim();


        const section =
            document
                .getElementById("courseSection")
                .value
                .trim();


        if (!name) return;


        courseMessage.textContent =
            "Guardando...";


        const { error } =
            await supabaseClient
                .from("courses")
                .insert({

                    name,
                    section

                });


        if (error) {

            console.error(error);

            courseMessage.textContent =
                "No se pudo crear el curso.";

            return;
        }


        courseModal.classList.add("hidden");

        courseForm.reset();

        courseMessage.textContent = "";


        loadCourses();

    }
);


// =========================================
// INICIAR
// =========================================

loadCourses();