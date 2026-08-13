// documents.js


const documentsContainer =
    document.getElementById("documentsContainer");

const newDocumentButton =
    document.getElementById("newDocumentButton");

const documentModal =
    document.getElementById("documentModal");

const closeModal =
    document.getElementById("closeModal");

const documentForm =
    document.getElementById("documentForm");

const documentMessage =
    document.getElementById("documentMessage");

const documentCourse =
    document.getElementById("documentCourse");


// =========================================
// CARGAR CURSOS
// =========================================

async function loadCourses() {

    const { data, error } =
        await supabaseClient
            .from("courses")
            .select("*")
            .eq("active", true)
            .order("name");


    if (error) {

        console.error(error);

        return;
    }


    documentCourse.innerHTML =
        `<option value="">
            Seleccionar curso
        </option>`;


    data.forEach(course => {

        const option =
            document.createElement("option");

        option.value =
            course.id;

        option.textContent =
            `${course.name} ${course.section || ""}`;


        documentCourse.appendChild(option);

    });

}


// =========================================
// CARGAR DOCUMENTOS
// =========================================

async function loadDocuments() {

    documentsContainer.innerHTML =
        '<div class="loading">Cargando documentos...</div>';


    const { data, error } =
        await supabaseClient
            .from("documents")
            .select(`
                *,
                courses (
                    name,
                    section
                )
            `)
            .order("created_at", {
                ascending: false
            });


    if (error) {

        console.error(error);

        documentsContainer.innerHTML =
            `<p class="error-message">
                No se pudieron cargar los documentos.
            </p>`;

        return;
    }


    if (!data.length) {

        documentsContainer.innerHTML =
            `<div class="empty-state">

                <strong>
                    No hay documentos registrados.
                </strong>

                <p>
                    Agrega el primer documento.
                </p>

            </div>`;

        return;
    }


    documentsContainer.innerHTML = "";


    data.forEach(documentItem => {

        const course =
            documentItem.courses;


        const courseName =
            course
                ? `${course.name} ${course.section || ""}`
                : "Sin curso";


        const statusText = {

            PENDING: "Pendiente",

            PARTIALLY_SIGNED:
                "Firmado parcialmente",

            COMPLETED:
                "Completado"

        };


        const statusClass = {

            PENDING: "pending",

            PARTIALLY_SIGNED:
                "partial",

            COMPLETED:
                "completed"

        };


        const card =
            document.createElement("article");


        card.className =
            "document-card";


        card.innerHTML = `

            <div class="document-info">

                <span class="course-label">
                    ${courseName}
                </span>

                <h3>
                    ${documentItem.name}
                </h3>

                <span class="
                    status-badge
                    ${statusClass[documentItem.status]}
                ">
                    ${statusText[documentItem.status]}
                </span>

            </div>


            <button
                class="secondary-button"
                onclick="openDocument(${documentItem.id})"
            >
                Gestionar
            </button>

        `;


        documentsContainer.appendChild(card);

    });

}


// =========================================
// ABRIR DOCUMENTO
// =========================================

function openDocument(documentId) {

    window.location.href =
        `document.html?id=${documentId}`;

}


// =========================================
// ABRIR MODAL
// =========================================

newDocumentButton.addEventListener(
    "click",
    () => {

        documentModal.classList.remove("hidden");

        documentCourse.focus();

    }
);


// =========================================
// CERRAR MODAL
// =========================================

closeModal.addEventListener(
    "click",
    () => {

        documentModal.classList.add("hidden");

        documentForm.reset();

        documentMessage.textContent = "";

    }
);


// =========================================
// CREAR DOCUMENTO
// =========================================

documentForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const courseId =
            documentCourse.value;


        const documentName =
            document
                .getElementById("documentName")
                .value
                .trim();


        const file =
            document
                .getElementById("documentFile")
                .files[0];


        const beforeSignature =
            document
                .getElementById("beforeSignature")
                .checked;


        const afterSignature =
            document
                .getElementById("afterSignature")
                .checked;


        if (
            !courseId ||
            !documentName ||
            !file
        ) {

            documentMessage.textContent =
                "Completa todos los campos.";

            return;
        }


        if (
            !beforeSignature &&
            !afterSignature
        ) {

            documentMessage.textContent =
                "Selecciona al menos una firma.";

            return;
        }


        if (
            file.type !==
            "application/pdf"
        ) {

            documentMessage.textContent =
                "El archivo debe ser un PDF.";

            return;
        }


        if (
            file.size >
            10 * 1024 * 1024
        ) {

            documentMessage.textContent =
                "El PDF no puede superar 10 MB.";

            return;
        }


        documentMessage.textContent =
            "Subiendo documento...";


        // =================================
        // NOMBRE DEL ARCHIVO
        // =================================

        const safeName =
            documentName
                .toLowerCase()
                .replace(
                    /[^a-z0-9áéíóúñ]+/gi,
                    "_"
                )
                .replace(
                    /^_+|_+$/g,
                    ""
                );


        const fileName =
            `${Date.now()}_${safeName}.pdf`;


        const filePath =
            `originales/${fileName}`;


        // =================================
        // SUBIR PDF
        // =================================

        const { error: uploadError } =
            await supabaseClient
                .storage
                .from("documents")
                .upload(
                    filePath,
                    file,
                    {
                        contentType:
                            "application/pdf",

                        upsert: false
                    }
                );


        if (uploadError) {

            console.error(uploadError);

            documentMessage.textContent =
                "No se pudo subir el PDF.";

            return;
        }


        // =================================
        // CREAR DOCUMENTO
        // =================================

        const { data: documentData, error } =
            await supabaseClient
                .from("documents")
                .insert({

                    course_id:
                        courseId,

                    name:
                        documentName,

                    original_file_path:
                        filePath

                })
                .select()
                .single();


        if (error) {

            console.error(error);

            documentMessage.textContent =
                "No se pudo crear el documento.";

            return;
        }


        // =================================
        // CREAR FIRMAS
        // =================================

        const signatures = [];


        if (beforeSignature) {

            signatures.push({

                document_id:
                    documentData.id,

                signature_slot:
                    "BEFORE_RECESS"

            });

        }


        if (afterSignature) {

            signatures.push({

                document_id:
                    documentData.id,

                signature_slot:
                    "AFTER_RECESS"

            });

        }


        const { error: signatureError } =
            await supabaseClient
                .from("document_signatures")
                .insert(signatures);


        if (signatureError) {

            console.error(signatureError);

            documentMessage.textContent =
                "Documento creado, pero hubo un error con las firmas.";

            return;
        }


        // =================================
        // FINALIZAR
        // =================================

        documentMessage.textContent =
            "Documento creado correctamente.";


        documentForm.reset();


        setTimeout(() => {

            documentModal.classList.add("hidden");

            documentMessage.textContent = "";

            loadDocuments();

        }, 800);

    }
);


// =========================================
// INICIAR
// =========================================

async function init() {

    await loadCourses();

    await loadDocuments();

}


init();