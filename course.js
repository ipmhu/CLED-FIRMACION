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
// CARGAR CURSO
// =========================================

async function loadCourse() {

    const { data, error } =
        await supabaseClient
            .from("courses")
            .select("*")
            .eq("id", courseId)
            .single();


    if (error) {

        console.error(error);

        courseTitle.textContent =
            "Curso no encontrado";

        return;
    }


    courseTitle.textContent =
        `${data.name} ${data.section || ""}`;


    courseDescription.textContent =
        "Gestiona los profesores responsables de las firmas.";

}


// =========================================
// CARGAR PROFESORES
// =========================================

async function loadTeachers() {

    const { data, error } =
        await supabaseClient
            .from("teachers")
            .select("*")
            .eq("active", true)
            .order("full_name");


    if (error) {

        console.error(error);

        courseMessage.textContent =
            "No se pudieron cargar los profesores.";

        return;
    }


    beforeTeacher.innerHTML =
        '<option value="">Seleccionar profesor</option>';

    afterTeacher.innerHTML =
        '<option value="">Seleccionar profesor</option>';


    data.forEach(teacher => {

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


        beforeTeacher.appendChild(optionBefore);

        afterTeacher.appendChild(optionAfter);

    });

}


// =========================================
// CARGAR ASIGNACIONES EXISTENTES
// =========================================

async function loadAssignments() {

    const { data, error } =
        await supabaseClient
            .from("course_teachers")
            .select("*")
            .eq("course_id", courseId);


    if (error) {

        console.error(error);

        return;
    }


    data.forEach(assignment => {

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

    });

}


// =========================================
// ESTADO
// =========================================

function setStatus(element, assigned) {

    if (assigned) {

        element.textContent =
            "Asignado";

        element.className =
            "status-badge assigned";

    } else {

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

    const teacherId =
        teacherSelect.value;


    if (!teacherId) {

        courseMessage.textContent =
            "Selecciona un profesor.";

        return;
    }


    // Determinar la firma correspondiente
    const signatureSlot =
        slot === "BEFORE_RECESS"
            ? "BEFORE_RECESS"
            : "AFTER_RECESS";


    const { error } =
        await supabaseClient
            .from("document_signatures")
            .update({
                teacher_id: Number(teacherId)
            })
            .eq("document_id", documentId)
            .eq("signature_slot", signatureSlot);


    if (error) {

        console.error(
            "Error guardando asignación:",
            error
        );

        courseMessage.textContent =
            `No se pudo guardar la asignación: ${error.message}`;

        return;
    }


    setStatus(
        statusElement,
        true
    );


    courseMessage.textContent =
        "Asignación guardada correctamente.";

}


// =========================================
// BOTONES
// =========================================

document
    .getElementById("saveBefore")
    .addEventListener(
        "click",
        () => {

            saveAssignment(
                beforeTeacher,
                "BEFORE_RECESS",
                beforeStatus
            );

        }
    );


document
    .getElementById("saveAfter")
    .addEventListener(
        "click",
        () => {

            saveAssignment(
                afterTeacher,
                "AFTER_RECESS",
                afterStatus
            );

        }
    );


// =========================================
// INICIAR
// =========================================

async function init() {

    await loadCourse();

    await loadTeachers();

    await loadAssignments();

}


init();
