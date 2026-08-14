// =========================================
// CONFIGURADOR DE POSICIONES
// =========================================

const configureSignaturesButton =
    document.getElementById(
        "configureSignaturesButton"
    );

const signatureConfigurator =
    document.getElementById(
        "signatureConfigurator"
    );

const pdfConfigScroll =
    document.getElementById(
        "pdfConfigScroll"
    );

const selectBeforeSignature =
    document.getElementById(
        "selectBeforeSignature"
    );

const selectAfterSignature =
    document.getElementById(
        "selectAfterSignature"
    );

const saveSignaturePositions =
    document.getElementById(
        "saveSignaturePositions"
    );

const closeSignatureConfigurator =
    document.getElementById(
        "closeSignatureConfigurator"
    );

const configMessage =
    document.getElementById(
        "configMessage"
    );


let pdfDocument = null;

let signatureMarkers = {};

let selectedSignatureSlot =
    "BEFORE_RECESS";


// =========================================
// CONFIGURAR PDF.JS
// =========================================

if (
    typeof pdfjsLib !==
    "undefined"
) {

    pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

}


// =========================================
// ABRIR CONFIGURADOR
// =========================================

configureSignaturesButton.addEventListener(
    "click",
    openSignatureConfigurator
);


async function openSignatureConfigurator() {

    signatureConfigurator.classList.remove(
        "hidden"
    );


    configMessage.textContent =
        "Cargando documento...";


    try {

        const { data, error } =
            await supabaseClient
                .from("documents")
                .select(
                    "original_file_path"
                )
                .eq("id", documentId)
                .single();


        if (error) {

            throw error;

        }


        const {
            data: signedData,
            error: signedError
        } =
            await supabaseClient
                .storage
                .from("documents")
                .createSignedUrl(
                    data.original_file_path,
                    3600
                );


        if (signedError) {

            throw signedError;

        }


        await renderConfigurationPDF(
            signedData.signedUrl
        );


        await loadExistingSignaturePositions();


        configMessage.textContent =
            "Selecciona una firma y arrástrala al lugar deseado.";

    }

    catch (error) {

        console.error(
            "Error abriendo configurador:",
            error
        );


        configMessage.textContent =
            "No se pudo cargar el PDF.";

    }

}


// =========================================
// RENDERIZAR PDF
// =========================================

async function renderConfigurationPDF(
    pdfUrl
) {

    pdfConfigScroll.innerHTML =
        "";


    pdfDocument =
        await pdfjsLib.getDocument(
            pdfUrl
        ).promise;


    for (
        let pageNumber = 1;
        pageNumber <= pdfDocument.numPages;
        pageNumber++
    ) {

        const page =
            await pdfDocument.getPage(
                pageNumber
            );


        const scale = 1.2;


        const viewport =
            page.getViewport({
                scale
            });


        const pageContainer =
            document.createElement(
                "div"
            );


        pageContainer.className =
            "pdf-config-page";


        pageContainer.dataset.page =
            pageNumber;


        const canvas =
            document.createElement(
                "canvas"
            );


        canvas.width =
            viewport.width;

        canvas.height =
            viewport.height;


        canvas.dataset.pageWidth =
            viewport.width;

        canvas.dataset.pageHeight =
            viewport.height;


        pageContainer.appendChild(
            canvas
        );


        pdfConfigScroll.appendChild(
            pageContainer
        );


        const context =
            canvas.getContext(
                "2d"
            );


        await page.render({
            canvasContext:
                context,

            viewport:
                viewport
        }).promise;

    }

}


// =========================================
// CARGAR POSICIONES EXISTENTES
// =========================================

async function loadExistingSignaturePositions() {

    const { data, error } =
        await supabaseClient
            .from("document_signatures")
            .select(`
                id,
                signature_slot,
                signature_page,
                signature_x,
                signature_y,
                signature_width,
                signature_height
            `)
            .eq(
                "document_id",
                documentId
            );


    if (error) {

        console.error(
            error
        );

        return;

    }


    data.forEach(
        signature => {

            if (
                signature.signature_page
            ) {

                createSignatureMarker(
                    signature
                );

            }

        }
    );

}


// =========================================
// SELECCIONAR FIRMA
// =========================================

selectBeforeSignature.addEventListener(
    "click",
    () => {

        selectedSignatureSlot =
            "BEFORE_RECESS";


        selectBeforeSignature.classList.add(
            "active"
        );


        selectAfterSignature.classList.remove(
            "active"
        );


        configMessage.textContent =
            "FIRMA 1 seleccionada. Haz clic en una página para colocarla.";

    }
);


selectAfterSignature.addEventListener(
    "click",
    () => {

        selectedSignatureSlot =
            "AFTER_RECESS";


        selectAfterSignature.classList.add(
            "active"
        );


        selectBeforeSignature.classList.remove(
            "active"
        );


        configMessage.textContent =
            "FIRMA 2 seleccionada. Haz clic en una página para colocarla.";

    }
);


// =========================================
// CREAR FIRMA AL HACER CLIC
// =========================================

pdfConfigScroll.addEventListener(
    "click",
    event => {

        const page =
            event.target.closest(
                ".pdf-config-page"
            );


        if (!page) {

            return;

        }


        if (
            event.target.closest(
                ".signature-marker"
            )
        ) {

            return;

        }


        const existing =
            signatureMarkers[
                selectedSignatureSlot
            ];


        if (existing) {

            configMessage.textContent =
                "Esta firma ya está colocada. Arrástrala para moverla.";

            return;

        }


        const rect =
            page.getBoundingClientRect();


        const x =
            event.clientX -
            rect.left -
            90;


        const y =
            event.clientY -
            rect.top -
            35;


        const signature = {

            id:
                null,

            signature_slot:
                selectedSignatureSlot,

            signature_page:
                Number(
                    page.dataset.page
                ),

            signature_x:
                x,

            signature_y:
                y,

            signature_width:
                180,

            signature_height:
                70

        };


        createSignatureMarker(
            signature
        );

    }
);


// =========================================
// CREAR MARCADOR
// =========================================

function createSignatureMarker(
    signature
) {

    const oldMarker =
        signatureMarkers[
            signature.signature_slot
        ];


    if (oldMarker) {

        oldMarker.remove();

    }


    const page =
        document.querySelector(
            `.pdf-config-page[data-page="${signature.signature_page}"]`
        );


    if (!page) {

        return;

    }


    const marker =
        document.createElement(
            "div"
        );


    marker.className =
        "signature-marker";


    marker.classList.add(
        signature.signature_slot ===
        "BEFORE_RECESS"
            ? "before"
            : "after"
    );


    marker.innerHTML = `

        <div>

            <strong>
                ${
                    signature.signature_slot ===
                    "BEFORE_RECESS"
                        ? "FIRMA 1"
                        : "FIRMA 2"
                }
            </strong>

            <small>
                Arrastra aquí
            </small>

        </div>

    `;


    const width =
        Number(
            signature.signature_width
        ) || 180;


    const height =
        Number(
            signature.signature_height
        ) || 70;


    marker.style.width =
        `${width}px`;


    marker.style.height =
        `${height}px`;


    marker.style.left =
        `${Number(signature.signature_x) || 20}px`;


    marker.style.top =
        `${Number(signature.signature_y) || 20}px`;


    page.appendChild(
        marker
    );


    signatureMarkers[
        signature.signature_slot
    ] = marker;


    makeMarkerDraggable(
        marker,
        signature.signature_slot
    );

}


// =========================================
// ARRASTRAR MARCADOR
// =========================================

function makeMarkerDraggable(
    marker,
    slot
) {

    let dragging =
        false;

    let offsetX =
        0;

    let offsetY =
        0;


    marker.addEventListener(
        "pointerdown",
        event => {

            event.preventDefault();

            dragging =
                true;


            const rect =
                marker.getBoundingClientRect();


            offsetX =
                event.clientX -
                rect.left;


            offsetY =
                event.clientY -
                rect.top;


            marker.setPointerCapture(
                event.pointerId
            );

        }
    );


    marker.addEventListener(
        "pointermove",
        event => {

            if (!dragging) {

                return;

            }


            const page =
                marker.parentElement;


            const pageRect =
                page.getBoundingClientRect();


            let x =
                event.clientX -
                pageRect.left -
                offsetX;


            let y =
                event.clientY -
                pageRect.top -
                offsetY;


            x =
                Math.max(
                    0,
                    Math.min(
                        x,
                        pageRect.width -
                        marker.offsetWidth
                    )
                );


            y =
                Math.max(
                    0,
                    Math.min(
                        y,
                        pageRect.height -
                        marker.offsetHeight
                    )
                );


            marker.style.left =
                `${x}px`;


            marker.style.top =
                `${y}px`;

        }
    );


    marker.addEventListener(
        "pointerup",
        event => {

            dragging =
                false;

            marker.releasePointerCapture(
                event.pointerId
            );

        }
    );

}


// =========================================
// GUARDAR POSICIONES
// =========================================

saveSignaturePositions.addEventListener(
    "click",
    saveAllSignaturePositions
);


async function saveAllSignaturePositions() {

    configMessage.textContent =
        "Guardando posiciones...";


    try {

        const slots = [
            "BEFORE_RECESS",
            "AFTER_RECESS"
        ];


        for (
            const slot of slots
        ) {

            const marker =
                signatureMarkers[
                    slot
                ];


            if (!marker) {

                continue;

            }


            const page =
                marker.parentElement;


            const pageNumber =
                Number(
                    page.dataset.page
                );


            const x =
                parseFloat(
                    marker.style.left
                );


            const y =
                parseFloat(
                    marker.style.top
                );


            const width =
                marker.offsetWidth;


            const height =
                marker.offsetHeight;


            const {
                error
            } =
                await supabaseClient
                    .from(
                        "document_signatures"
                    )
                    .update({

                        signature_page:
                            pageNumber,

                        signature_x:
                            x,

                        signature_y:
                            y,

                        signature_width:
                            width,

                        signature_height:
                            height

                    })
                    .eq(
                        "document_id",
                        documentId
                    )
                    .eq(
                        "signature_slot",
                        slot
                    );


            if (error) {

                throw error;

            }

        }


        configMessage.textContent =
            "✓ Posiciones guardadas correctamente.";

    }

    catch (error) {

        console.error(
            "Error guardando posiciones:",
            error
        );


        configMessage.textContent =
            `No se pudieron guardar las posiciones: ${error.message}`;

    }

}


// =========================================
// CERRAR
// =========================================

closeSignatureConfigurator.addEventListener(
    "click",
    () => {

        signatureConfigurator.classList.add(
            "hidden"
        );

    }
);    document.getElementById("pdfViewer");

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

    signatureContainer.innerHTML =
        `<div class="loading">
            Cargando firmas...
        </div>`;


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


    console.log(
        "FIRMAS RECIBIDAS:",
        data
    );


    if (error) {

        console.error(
            "ERROR CARGANDO FIRMAS:",
            error
        );

        signatureContainer.innerHTML =
            `<p class="error-message">
                No se pudieron cargar las firmas.
            </p>`;

        return;
    }


    if (!data || !data.length) {

        signatureContainer.innerHTML =
            `<div class="empty-state">
                Este documento no tiene firmas configuradas.
            </div>`;

        return;
    }


    signatureContainer.innerHTML = "";


    data.forEach(signature => {

        console.log(
            "Firma:",
            signature.id,
            "Estado:",
            signature.status
        );


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


        // IMPORTANTE:
        // Tu base de datos utiliza COMPLETED

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
