// course.js


// =========================================
// OBTENER ID DEL CURSO
// =========================================

const params =
    new URLSearchParams(window.location.search);

const courseId =
    params.get("id");


if (!courseId) {

    window.location.href = "courses.html";

}


// =========================================
// ELEMENTOS
// =========================================

const courseTitle =
    document.getElementById("courseTitle");

const courseDescription =
    document.getElementById("courseDescription");

const beforeTeacher =
    document.getElementById("beforeTeacher");

const afterTeacher =
    document.getElementById("afterTeacher");

const beforeStatus =
    document.getElementById("beforeStatus");

const afterStatus =
    document.getElementById("afterStatus");

const courseMessage =
    document.getElementById("courseMessage");


// =========================================
// MENSAJE
// =========================================

function showMessage(message) {

    if (courseMessage) {

        courseMessage.textContent =
            message;

    }

}


// =========================================
// CARGAR CURSO
// =========================================

async function loadCourse() {

    try {

        const { data, error } =
            await supabaseClient
                .from("courses")
                .select("*")
                .eq("id", courseId)
                .single();


        if (error) {

            console.error(
                "Error cargando curso:",
                error
            );

            courseTitle.textContent =
                "Curso no encontrado";

            return;

        }


        courseTitle.textContent =
            `${data.name} ${data.section || ""}`;


        courseDescription.textContent =
            "Gestiona los profesores responsables de las firmas.";

    }

    catch (error) {

        console.error(
            "Error inesperado:",
            error
        );

        showMessage(
            "Ocurrió un error al cargar el curso."
        );

    }

}


// =========================================
// CARGAR PROFESORES
// =========================================

async function loadTeachers() {

    try {

        const { data, error } =
            await supabaseClient
                .from("teachers")
                .select("*")
                .eq("active", true)
                .order("full_name");


        if (error) {

            console.error(
                "Error cargando profesores:",
                error
            );

            showMessage(
                "No se pudieron cargar los profesores."
            );

            return;

        }


        beforeTeacher.innerHTML =
            '<option value="">Seleccionar profesor</option>';

        afterTeacher.innerHTML =
            '<option value="">Seleccionar profesor</option>';


        data.forEach(
            teacher => {

                const optionBefore =
                    document.createElement("option");


                optionBefore.value =
                    teacher.id;


                optionBefore.textContent =
                    teacher.full_name;


                const optionAfter =
                    document.createElement("option");


                optionAfter.value =
                    teacher.id;


                optionAfter.textContent =
                    teacher.full_name;


                beforeTeacher.appendChild(
                    optionBefore
                );


                afterTeacher.appendChild(
                    optionAfter
                );

            }
        );

    }

    catch (error) {

        console.error(
            "Error inesperado:",
            error
        );

        showMessage(
            "Error cargando profesores."
        );

    }

}


// =========================================
// CARGAR ASIGNACIONES
// =========================================

async function loadAssignments() {

    try {

        const { data, error } =
            await supabaseClient
                .from("course_teachers")
                .select("*")
                .eq("course_id", courseId);


        if (error) {

            console.error(
                "Error cargando asignaciones:",
                error
            );

            return;

        }


        data.forEach(
            assignment => {

                if (
                    assignment.signature_slot ===
                    "BEFORE_RECESS"
                ) {

                    beforeTeacher.value =
                        assignment.teacher_id;


                    setStatus(
                        beforeStatus,
                        true
                    );

                }


                if (
                    assignment.signature_slot ===
                    "AFTER_RECESS"
                ) {

                    afterTeacher.value =
                        assignment.teacher_id;


                    setStatus(
                        afterStatus,
                        true
                    );

                }

            }
        );

    }

    catch (error) {

        console.error(
            "Error inesperado:",
            error
        );

    }

}


// =========================================
// ESTADO
// =========================================

function setStatus(
    element,
    assigned
) {

    if (!element) {
        return;
    }


    if (assigned) {

        element.textContent =
            "Asignado";

        element.className =
            "status-badge assigned";

    }

    else {

        element.textContent =
            "Pendiente";

        element.className =
            "status-badge pending";

    }

}


// =========================================
// GUARDAR ASIGNACIÓN
// =========================================

async function saveAssignment(
    teacherSelect,
    slot,
    statusElement
) {

    try {

        console.log(
            "Guardando asignación..."
        );


        console.log(
            "Curso:",
            courseId
        );


        console.log(
            "Profesor:",
            teacherSelect.value
        );


        console.log(
            "Horario:",
            slot
        );


        const teacherId =
            teacherSelect.value;


        if (!teacherId) {

            showMessage(
                "Selecciona un profesor."
            );

            return;

        }


        const { data, error } =
            await supabaseClient
                .from("course_teachers")
                .upsert(
                    {
                        course_id:
                            Number(courseId),

                        teacher_id:
                            Number(teacherId),

                        signature_slot:
                            slot
                    },
                    {
                        onConflict:
                            "course_id,signature_slot"
                    }
                )
                .select();


        if (error) {

            console.error(
                "ERROR SUPABASE:",
                error
            );


            showMessage(
                `No se pudo guardar la asignación: ${error.message}`
            );


            return;

        }


        console.log(
            "Asignación guardada:",
            data
        );


        setStatus(
            statusElement,
            true
        );


        showMessage(
            "Asignación guardada correctamente."
        );

    }

    catch (error) {

        console.error(
            "ERROR JAVASCRIPT:",
            error
        );


        showMessage(
            `Error: ${error.message}`
        );

    }

}


// =========================================
// BOTONES
// =========================================

const saveBefore =
    document.getElementById("saveBefore");


const saveAfter =
    document.getElementById("saveAfter");


if (saveBefore) {

    saveBefore.addEventListener(
        "click",
        function () {

            saveAssignment(
                beforeTeacher,
                "BEFORE_RECESS",
                beforeStatus
            );

        }
    );

}


if (saveAfter) {

    saveAfter.addEventListener(
        "click",
        function () {

            saveAssignment(
                afterTeacher,
                "AFTER_RECESS",
                afterStatus
            );

        }
    );

}


// =========================================
// INICIAR
// =========================================

async function init() {

    await loadCourse();

    await loadTeachers();

    await loadAssignments();

}


init();
