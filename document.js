// =========================================
// ID DEL DOCUMENTO
// =========================================

const params =
    new URLSearchParams(
        window.location.search
    );

const documentId =
    params.get("id");


if (!documentId) {

    window.location.href =
        "documents.html";

    throw new Error(
        "No se recibió documentId"
    );

}


// =========================================
// ELEMENTOS PRINCIPALES
// =========================================

const documentTitle =
    document.getElementById(
        "documentTitle"
    );

const courseName =
    document.getElementById(
        "courseName"
    );

const documentStatus =
    document.getElementById(
        "documentStatus"
    );

const pdfViewer =
    document.getElementById(
        "pdfViewer"
    );

const signatureContainer =
    document.getElementById(
        "signatureContainer"
    );

const documentMessage =
    document.getElementById(
        "documentMessage"
    );


// =========================================
// ELEMENTOS DEL CONFIGURADOR
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


// =========================================
// VARIABLES
// =========================================

let pdfDocument = null;

let signatureMarkers = {};

let selectedSignatureSlot =
    "BEFORE_RECESS";


// =========================================
// PDF.JS
// =========================================

if (
    typeof pdfjsLib !==
    "undefined"
) {

    pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

}


// =========================================
// CARGAR DOCUMENTO
// =========================================

async function loadDocument() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("documents")
            .select(`
                *,
                courses (
                    name,
                    section
                )
            `)
            .eq(
                "id",
                documentId
            )
            .single();


    if (error) {

        console.error(
            "Error cargando documento:",
            error
        );

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


    updateDocumentStatus(
        data.status
    );


    // =====================================
    // PDF
    // =====================================

    if (
        !data.original_file_path
    ) {

        documentMessage.textContent =
            "El documento no tiene un archivo PDF asociado.";

        return;

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

        console.error(
            "Error creando URL:",
            signedError
        );

        documentMessage.textContent =
            "No se pudo abrir el PDF.";

        return;

    }


    pdfViewer.src =
        signedData.signedUrl;

}


// =========================================
// CARGAR FIRMAS
// =========================================

async function loadSignatures() {

    signatureContainer.innerHTML =
        `<div class="loading">
            Cargando firmas...
        </div>`;


    const {
        data,
        error
    } =
        await supabaseClient
            .from("document_signatures")
            .select(`
                *,
                teachers (
                    full_name
                )
            `)
            .eq(
                "document_id",
                documentId
            )
            .order("id");


    if (error) {

        console.error(
            "Error cargando firmas:",
            error
        );

        signatureContainer.innerHTML =
            `<p class="error-message">
                No se pudieron cargar las firmas.
            </p>`;

        return;

    }


    signatureContainer.innerHTML =
        "";


    data.forEach(
        signature => {

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
                document.createElement(
                    "article"
                );


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


            signatureContainer.appendChild(
                card
            );

        }
    );

}


// =========================================
// INICIAR FIRMA
// =========================================

function startSignature(
    signatureId
) {

    window.location.href =
        `signature.html?id=${signatureId}`;

}


// =========================================
// ESTADO DOCUMENTO
// =========================================

function updateDocumentStatus(
    status
) {

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
        statusNames[status] ||
        status;


    documentStatus.className =
        `status-badge ${
            statusClasses[status] ||
            "pending"
        }`;

}


// =========================================
// ABRIR CONFIGURADOR
// =========================================

configureSignaturesButton.addEventListener(
    "click",
    openSignatureConfigurator
);


async function openSignatureConfigurator() {

    try {

        signatureConfigurator.classList.remove(
            "hidden"
        );


        configMessage.textContent =
            "Cargando documento...";


        const {
            data,
            error
        } =
            await supabaseClient
                .from("documents")
                .select("*")
                .eq(
                    "id",
                    documentId
                )
                .single();


        if (error) {

            throw error;

        }


        if (
            !data.original_file_path
        ) {

            throw new Error(
                "El documento no tiene un PDF asociado."
            );

        }


        // =====================================
        // URL FIRMADA
        // =====================================

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


        console.log(
            "URL configurador:",
            signedData.signedUrl
        );


        await renderConfigurationPDF(
            signedData.signedUrl
        );


        await loadExistingSignaturePositions();


        configMessage.textContent =
            "Selecciona FIRMA 1 o FIRMA 2 y haz clic donde quieras colocarla.";

    }

    catch (error) {

        console.error(
            "Error abriendo configurador:",
            error
        );

        configMessage.textContent =
            `Error: ${error.message}`;

    }

}


// =========================================
// RENDERIZAR PDF
// =========================================

async function renderConfigurationPDF(
    pdfUrl
) {

    pdfConfigScroll.innerHTML =
        `<div class="loading">
            Cargando PDF...
        </div>`;


    const response =
        await fetch(pdfUrl);


    if (!response.ok) {

        throw new Error(
            `No se pudo descargar el PDF. HTTP ${response.status}`
        );

    }


    const pdfData =
        await response.arrayBuffer();


    pdfDocument =
        await pdfjsLib
            .getDocument({
                data: pdfData
            })
            .promise;


    pdfConfigScroll.innerHTML =
        "";


    for (
        let pageNumber = 1;
        pageNumber <=
        pdfDocument.numPages;
        pageNumber++
    ) {

        const page =
            await pdfDocument.getPage(
                pageNumber
            );


        const scale =
            1.2;


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


        pageContainer.style.width =
            `${viewport.width}px`;


        pageContainer.style.height =
            `${viewport.height}px`;


        const canvas =
            document.createElement(
                "canvas"
            );


        canvas.width =
            viewport.width;


        canvas.height =
            viewport.height;


        canvas.style.width =
            `${viewport.width}px`;


        canvas.style.height =
            `${viewport.height}px`;


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
// CARGAR POSICIONES
// =========================================

async function loadExistingSignaturePositions() {

    const {
        data,
        error
    } =
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
            "Error cargando posiciones:",
            error
        );

        return;

    }


    signatureMarkers =
        {};


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
// SELECCIONAR FIRMA 1
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
            "FIRMA 1 seleccionada. Haz clic en el documento.";

    }
);


// =========================================
// SELECCIONAR FIRMA 2
// =========================================

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
            "FIRMA 2 seleccionada. Haz clic en el documento.";

    }
);


// =========================================
// COLOCAR FIRMA
// =========================================

pdfConfigScroll.addEventListener(
    "click",
    event => {

        const page =
            event.target.closest(
                ".pdf-config-page"
            );


        if (!page) return;


        if (
            event.target.closest(
                ".signature-marker"
            )
        ) return;


        const existing =
            signatureMarkers[
                selectedSignatureSlot
            ];


        if (existing) {

            configMessage.textContent =
                "Esta firma ya está colocada. Puedes arrastrarla.";

            return;

        }


        const rect =
            page.getBoundingClientRect();


        const x =
            Math.max(
                0,
                event.clientX -
                rect.left -
                90
            );


        const y =
            Math.max(
                0,
                event.clientY -
                rect.top -
                35
            );


        createSignatureMarker({

            id: null,

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

        });


        configMessage.textContent =
            "Firma colocada. Puedes arrastrarla.";

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


    if (!page) return;


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

    `;


    marker.style.width =
        `${Number(signature.signature_width) || 180}px`;


    marker.style.height =
        `${Number(signature.signature_height) || 70}px`;


    marker.style.left =
        `${Number(signature.signature_x) || 20}px`;


    marker.style.top =
        `${Number(signature.signature_y) || 20}px`;


    page.appendChild(
        marker
    );


    signatureMarkers[
        signature.signature_slot
    ] =
        marker;


    makeMarkerDraggable(
        marker
    );

}


// =========================================
// ARRASTRAR
// =========================================

function makeMarkerDraggable(
    marker
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

            if (!dragging) return;


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


            if (
                marker.hasPointerCapture(
                    event.pointerId
                )
            ) {

                marker.releasePointerCapture(
                    event.pointerId
                );

            }

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

        for (
            const slot of [
                "BEFORE_RECESS",
                "AFTER_RECESS"
            ]
        ) {

            const marker =
                signatureMarkers[slot];


            if (!marker) continue;


            const page =
                marker.parentElement;


            const {
                error
            } =
                await supabaseClient
                    .from(
                        "document_signatures"
                    )
                    .update({

                        signature_page:
                            Number(
                                page.dataset.page
                            ),

                        signature_x:
                            parseFloat(
                                marker.style.left
                            ),

                        signature_y:
                            parseFloat(
                                marker.style.top
                            ),

                        signature_width:
                            marker.offsetWidth,

                        signature_height:
                            marker.offsetHeight

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
            error
        );

        configMessage.textContent =
            `No se pudieron guardar las posiciones: ${error.message}`;

    }

}


// =========================================
// CERRAR CONFIGURADOR
// =========================================

closeSignatureConfigurator.addEventListener(
    "click",
    () => {

        signatureConfigurator.classList.add(
            "hidden"
        );

    }
);


// =========================================
// TIEMPO REAL
// =========================================

function listenForSignatureChanges() {

    supabaseClient
        .channel(
            `document-signatures-${documentId}`
        )
        .on(
            "postgres_changes",
            {
                event:
                    "UPDATE",

                schema:
                    "public",

                table:
                    "document_signatures",

                filter:
                    `document_id=eq.${documentId}`

            },
            payload => {

                console.log(
                    "Firma actualizada:",
                    payload.new
                );


                loadSignatures();

                loadDocument();

            }
        )
        .subscribe();

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
