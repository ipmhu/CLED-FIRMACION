// document.js


// =========================================
// ID DEL DOCUMENTO
// =========================================

const params =
    new URLSearchParams(window.location.search);

const documentId =
    params.get("id");


if (!documentId) {

    window.location.href =
        "documents.html";

}


// =========================================
// ELEMENTOS
// =========================================

const documentTitle =
    document.getElementById("documentTitle");

const courseName =
    document.getElementById("courseName");

const documentStatus =
    document.getElementById("documentStatus");

const pdfViewer =
    document.getElementById("pdfViewer");

const signatureContainer =
    document.getElementById("signatureContainer");

const documentMessage =
    document.getElementById("documentMessage");


// =========================================
// CARGAR DOCUMENTO
// =========================================

async function loadDocument() {

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
            .eq("id", documentId)
            .single();


    if (error) {

        console.error(error);

        documentTitle.textContent =
            "Documento no encontrado";

        return;
    }


    documentTitle.textContent =
        data.name;


    const course =
        data.courses;


    courseName.textContent =
        course
            ? `${course.name} ${course.section || ""}`
            : "Sin curso";


    updateDocumentStatus(data.status);


    // =====================================
    // URL TEMPORAL DEL PDF
    // =====================================

    const { data: signedUrl, error: urlError } =
        await supabaseClient
            .storage
            .from("documents")
            .createSignedUrl(
                data.original_file_path,
                3600
            );


    if (urlError) {

        console.error(urlError);

        documentMessage.textContent =
            "No se pudo abrir el PDF.";

        return;
    }


    pdfViewer.src =
        signedUrl.signedUrl;

}


// =========================================
// CARGAR FIRMAS
// =========================================

async function loadSignatures() {

    const { data, error } =
        await supabaseClient
            .from("document_signatures")
            .select(`
                *,
                teachers (
                    full_name
                )
            `)
            .eq("document_id", documentId)
            .order("id");


    if (error) {

        console.error(error);

        signatureContainer.innerHTML =
            `<p class="error-message">
                No se pudieron cargar las firmas.
            </p>`;

        return;
    }


    if (!data.length) {

        signatureContainer.innerHTML =
            `<div class="empty-state">
                Este documento no tiene firmas configuradas.
            </div>`;

        return;
    }


    signatureContainer.innerHTML =
        "";


    data.forEach(signature => {

        const isBefore =
            signature.signature_slot ===
            "BEFORE_RECESS";


        const title =
            isBefore
                ? "Antes del primer receso"
                : "Después del primer receso";


        const number =
            isBefore
                ? "FIRMA 1"
                : "FIRMA 2";


        const teacher =
            signature.teachers;


        const teacherName =
            teacher
                ? teacher.full_name
                : "Profesor no asignado";


        const isSigned =
            signature.status ===
            "COMPLETED";


        const card =
            document.createElement("article");


        card.className =
            "document-signature-card";


        card.innerHTML = `

            <div class="signature-card-info">

                <span class="slot-number">
                    ${number}
                </span>

                <h3>
                    ${title}
                </h3>

                <p>
                    ${teacherName}
                </p>

            </div>


            <div class="signature-card-action">

                <span class="
                    status-badge
                    ${isSigned
                        ? "assigned"
                        : "pending"}
                ">

                    ${isSigned
                        ? "Firmado"
                        : "Pendiente"}

                </span>


                ${
                    isSigned

                    ? ""

                    : `

                    <button
                        onclick="startSignature(${signature.id})"
                    >
                        Iniciar firma
                    </button>

                    `
                }

            </div>

        `;


        signatureContainer.appendChild(card);

    });

}


// =========================================
// INICIAR FIRMA
// =========================================

function startSignature(signatureId) {

    window.location.href =
        `signature.html?id=${signatureId}`;

}


// =========================================
// ESTADO DEL DOCUMENTO
// =========================================

function updateDocumentStatus(status) {

    const statusNames = {

        PENDING:
            "Pendiente",

        PARTIALLY_SIGNED:
            "Firmado parcialmente",

        COMPLETED:
            "Completado"

    };


    const statusClasses = {

        PENDING:
            "pending",

        PARTIALLY_SIGNED:
            "partial",

        COMPLETED:
            "completed"

    };


    documentStatus.textContent =
        statusNames[status] || status;


    documentStatus.className =
        `status-badge ${
            statusClasses[status] || "pending"
        }`;

}


// =========================================
// INICIAR
// =========================================

async function init() {

    await loadDocument();

    await loadSignatures();

    listenForSignatureChanges();

}


init();

// =========================================
// ACTUALIZAR FIRMAS EN TIEMPO REAL
// =========================================

function listenForSignatureChanges() {

    supabaseClient
        .channel(
            `document-signatures-${documentId}`
        )
        .on(
            "postgres_changes",
            {
                event: "UPDATE",

                schema: "public",

                table: "document_signatures",

                filter:
                    `document_id=eq.${documentId}`
            },

            payload => {

                console.log(
                    "Firma actualizada:",
                    payload.new
                );


                // Recargar las firmas
                loadSignatures();


                // Recargar el documento
                loadDocument();

            }
        )
        .subscribe();

}
